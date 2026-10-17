import { NextRequest, NextResponse } from 'next/server';
import { db, auth, isFirebaseConfigured } from '@/lib/firebase/admin';
import { SAMPLE_STUDENTS, SAMPLE_STAFF, SAMPLE_SUPPORTERS } from '@/scripts/seed-database';
import {
  DEFAULT_REGISTRATION_ROLE,
  SYSTEM_ROLES,
  normalizeRole,
  isSuperAdmin,
  isProjectOwnerEmail,
  isValidRole,
  type SystemRole
} from '@/lib/auth/roles';
import {
  verifyBearerToken,
  getVerifiedCaller,
  requireSuperAdminCaller
} from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users
 * - Querying specific user by ?uid=... or ?email=... returns that user profile.
 * - Listing all users requires verified Superadmin authentication to protect PII.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    const emailParam = searchParams.get('email');

    // 1. Querying a single user by UID
    if (uid) {
      try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          const data = doc.data() || {};
          const isOwner = isProjectOwnerEmail(data.email);
          const role = isOwner ? 'superadmin' : normalizeRole(data.role);
          const isSuper = isOwner || role === 'superadmin' || data.isSuperAdmin === true;
          return NextResponse.json({
            user: {
              id: doc.id,
              ...data,
              role,
              isSuperAdmin: isSuper
            }
          });
        }
      } catch (dbErr) {
        console.warn(`Firestore fetch for user ${uid} failed:`, dbErr);
      }
      return NextResponse.json({ user: null, message: 'User not found' }, { status: 404 });
    }

    // 2. Querying a single user by Email
    if (emailParam) {
      try {
        const cleanEmail = emailParam.toLowerCase().trim();
        const emailQuery = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();
        if (!emailQuery.empty) {
          const doc = emailQuery.docs[0];
          const data = doc.data() || {};
          const isOwner = isProjectOwnerEmail(data.email);
          const role = isOwner ? 'superadmin' : normalizeRole(data.role);
          const isSuper = isOwner || role === 'superadmin' || data.isSuperAdmin === true;
          return NextResponse.json({
            user: {
              id: doc.id,
              ...data,
              role,
              isSuperAdmin: isSuper
            }
          });
        }
      } catch (dbErr) {
        console.warn(`Firestore fetch for user email ${emailParam} failed:`, dbErr);
      }
      return NextResponse.json({ user: null, message: 'User not found' }, { status: 404 });
    }

    // 3. Listing ALL users -> Requires Superadmin authentication or falls back to demo/sample directory
    const authCheck = await requireSuperAdminCaller(req);
    const isAuthorized = !('errorResponse' in authCheck);

    let usersList: any[] = [];

    if (isAuthorized && isFirebaseConfigured) {
      try {
        const snapshot = await db.collection('users').get();
        if (!snapshot.empty) {
          snapshot.forEach((doc: any) => {
            const data = doc.data() || {};
            const role = normalizeRole(data.role);
            usersList.push({
              id: doc.id,
              ...data,
              role,
              isSuperAdmin: isSuperAdmin(role, data.isSuperAdmin, data.email)
            });
          });
        }
      } catch (dbErr) {
        console.warn('Firestore fetch failed, using fallback:', dbErr);
      }
    }

    // Fallback to sample data with supporters if Firestore is empty or uninitialized
    if (usersList.length === 0) {
      usersList = [...SAMPLE_STUDENTS, ...SAMPLE_STAFF, ...SAMPLE_SUPPORTERS].map(u => {
        const role = normalizeRole(u.role);
        return {
          ...u,
          role,
          isSuperAdmin: isSuperAdmin(role, (u as any).isSuperAdmin, u.email)
        };
      });
    }

    return NextResponse.json({ users: usersList, availableRoles: SYSTEM_ROLES });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Cryptographically verified user profile synchronization:
 * - Requires Authorization: Bearer <idToken> from Firebase Auth.
 * - Discards client-supplied UIDs/emails and uses ONLY the verified token payload.
 * - New users strictly receive role = 'supporter' (unless verified email is on project owners list).
 * - Existing users have their persisted Firestore role loaded and preserved.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Cryptographically verify caller's Firebase ID token
    const verifiedToken = await verifyBearerToken(req);

    if (!verifiedToken || !verifiedToken.uid) {
      return NextResponse.json(
        {
          error: 'Unauthorized: A cryptographically verified Firebase ID token is required in the Authorization header to sync user profile.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    // SECURE: Use cryptographically verified identity directly from Google
    const uid = verifiedToken.uid;
    const email = (verifiedToken.email || '').toLowerCase().trim();
    const displayName = verifiedToken.name || '';
    const photoURL = verifiedToken.picture || '';

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    let existingData: Record<string, any> | null = null;
    let wasPreviouslyRegistered = false;

    if (userDoc.exists) {
      existingData = userDoc.data() || {};
      wasPreviouslyRegistered = true;
    }

    if (wasPreviouslyRegistered && existingData) {
      // User has been registered before -> preserve their strictly assigned Firestore database role
      const isOwner = isProjectOwnerEmail(email);
      const previousRole = normalizeRole(existingData.role || existingData.status);
      const isSuper = isOwner || previousRole === 'superadmin' || existingData.isSuperAdmin === true;
      const updatedRole = isSuper ? 'superadmin' : previousRole;

      const updatedFields: Record<string, any> = {
        lastLoginAt: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        login_count: (existingData.login_count || existingData.loginCount || 0) + 1,
        tenantTag: 'rto-ai',
        databaseCode: 'rto-ai',
        role: updatedRole,
        status: updatedRole,
        isSuperAdmin: isSuper,
        classification: updatedRole.charAt(0).toUpperCase() + updatedRole.slice(1)
      };

      if (email) updatedFields.email = email;
      if (displayName) updatedFields.displayName = displayName;
      if (photoURL) updatedFields.photoURL = photoURL;

      await userRef.set({
        ...existingData,
        ...updatedFields,
        id: uid,
        uid,
      }, { merge: true });

      // Synchronize Firebase Auth Custom Claims
      try {
        await auth.setCustomUserClaims(uid, {
          role: updatedRole,
          isSuperAdmin: isSuper,
          roles: [updatedRole],
          dept: updatedFields.dept || existingData.dept || (isSuper ? 'Executive Directorate & Superadmin Control' : 'General'),
        });
      } catch (claimErr) {
        // non-blocking
      }

      const finalUser = {
        id: uid,
        uid,
        ...existingData,
        ...updatedFields,
      };

      return NextResponse.json({
        user: finalUser,
        isNewUser: false,
        wasPreviouslyRegistered: true,
        previousRole
      });
    }

    // First-time registration -> If the email is explicitly a verified project owner / superadmin email (like support@aifoundation.net.au), grant superadmin. Everyone else strictly receives role = supporter only!
    const isOwner = isProjectOwnerEmail(email);
    const assignedRole: SystemRole = isOwner ? 'superadmin' : DEFAULT_REGISTRATION_ROLE; // 'supporter'
    const isSuper = isOwner;

    const newUserData = {
      id: uid,
      uid,
      email: email || '',
      displayName: displayName || (isOwner ? 'Executive Superadmin' : 'Supporter User'),
      name: displayName || (isOwner ? 'Executive Superadmin' : 'Supporter User'),
      photoURL: photoURL || '',
      role: assignedRole,
      status: assignedRole,
      classification: assignedRole.charAt(0).toUpperCase() + assignedRole.slice(1),
      isSuperAdmin: isSuper,
      tags: isSuper ? ['superadmin', 'owner', 'rto-ai'] : ['supporter', 'rto-ai'],
      tag: 'rto-ai',
      tenantTag: 'rto-ai',
      tenantId: 'rto-ai',
      databaseCode: 'rto-ai',
      source: 'rto-ai',
      businessId: 'aifoundation',
      businessName: 'AI Foundation',
      authProvider: 'google',
      createdAt: new Date().toISOString(),
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      login_count: 1,
    };

    await userRef.set(newUserData);

    // Synchronize Firebase Auth Custom Claims
    try {
      await auth.setCustomUserClaims(uid, {
        role: assignedRole,
        isSuperAdmin: isSuper,
        roles: [assignedRole],
        dept: isSuper ? 'Executive Directorate & Superadmin Control' : 'General',
      });
    } catch (claimErr) {
      // non-blocking
    }

    return NextResponse.json({
      user: newUserData,
      isNewUser: true,
      wasPreviouslyRegistered: false,
      previousRole: null
    });
  } catch (err: any) {
    console.error('Error in POST /api/users:', err);
    return NextResponse.json({ error: err.message || 'Failed to sync user profile' }, { status: 500 });
  }
}

/**
 * PATCH /api/users
 * Superadmin endpoint to update user roles across the strict 11 system roles.
 * Strictly requires cryptographically verified Superadmin caller.
 */
export async function PATCH(req: NextRequest) {
  try {
    // 1. Enforce Superadmin Authentication
    const authCheck = await requireSuperAdminCaller(req);
    if ('errorResponse' in authCheck) {
      return authCheck.errorResponse;
    }

    const body = await req.json();
    const { uid, role } = body;

    if (!uid || !role) {
      return NextResponse.json({ error: 'Missing required parameters "uid" or "role".' }, { status: 400 });
    }

    if (!isValidRole(role)) {
      return NextResponse.json({
        error: `Invalid role "${role}". Allowed roles: ${SYSTEM_ROLES.join(', ')}`,
        allowedRoles: SYSTEM_ROLES
      }, { status: 400 });
    }

    const normalizedNewRole = normalizeRole(role);
    const isSuper = normalizedNewRole === 'superadmin';

    const userRef = db.collection('users').doc(uid);
    const updatePayload: Record<string, any> = {
      role: normalizedNewRole,
      isSuperAdmin: isSuper,
      classification: normalizedNewRole.charAt(0).toUpperCase() + normalizedNewRole.slice(1),
      updatedAt: new Date().toISOString()
    };

    await userRef.set(updatePayload, { merge: true });
    const updatedDoc = await userRef.get();

    // Synchronize Firebase Auth Custom Claims
    try {
      await auth.setCustomUserClaims(uid, {
        role: normalizedNewRole,
        isSuperAdmin: isSuper,
        roles: [normalizedNewRole],
      });
    } catch (claimErr) {
      // non-blocking
    }

    return NextResponse.json({
      success: true,
      user: {
        id: uid,
        ...updatedDoc.data()
      }
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/users:', err);
    return NextResponse.json({ error: err.message || 'Failed to update user role' }, { status: 500 });
  }
}
