import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { SAMPLE_STUDENTS, SAMPLE_STAFF } from '@/scripts/seed-database';
import {
  DEFAULT_REGISTRATION_ROLE,
  SYSTEM_ROLES,
  normalizeRole,
  isSuperAdmin,
  isProjectOwnerEmail,
  isValidRole,
  type SystemRole
} from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    // If querying a single user by UID
    if (uid) {
      try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          const data = doc.data() || {};
          const role = normalizeRole(data.role);
          return NextResponse.json({
            user: {
              id: doc.id,
              ...data,
              role,
              isSuperAdmin: isSuperAdmin(role, data.isSuperAdmin)
            }
          });
        }
      } catch (dbErr) {
        console.warn(`Firestore fetch for user ${uid} failed:`, dbErr);
      }
      return NextResponse.json({ user: null, message: 'User not found' }, { status: 404 });
    }

    let usersList: any[] = [];

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
            isSuperAdmin: isSuperAdmin(role, data.isSuperAdmin)
          });
        });
      }
    } catch (dbErr) {
      console.warn('Firestore fetch failed or not configured, using seed fallback:', dbErr);
    }

    // Fallback to sample data if Firestore is empty or uninitialized
    if (usersList.length === 0) {
      usersList = [...SAMPLE_STUDENTS, ...SAMPLE_STAFF].map(u => {
        const role = normalizeRole(u.role);
        return {
          ...u,
          role,
          isSuperAdmin: isSuperAdmin(role, (u as any).isSuperAdmin)
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
 * Registers or synchronizes a user profile upon Google Sign-In:
 * - First-time registrations default strictly to the role of 'supporter'.
 * - Existing users have their persisted Firestore role and permissions loaded.
 * - Multi-tenant tag 'rto-ai' is automatically associated with the record.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, displayName, photoURL } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Missing required parameter "uid".' }, { status: 400 });
    }

    const isOwner = isProjectOwnerEmail(email);
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    let existingData: Record<string, any> | null = null;
    let wasPreviouslyRegistered = false;

    if (userDoc.exists) {
      existingData = userDoc.data() || {};
      wasPreviouslyRegistered = true;
    } else if (email) {
      // 1. Check if email was registered before in the users collection
      try {
        const emailQuery = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!emailQuery.empty) {
          existingData = emailQuery.docs[0].data() || {};
          wasPreviouslyRegistered = true;
        } else {
          const lowerEmailQuery = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
          if (!lowerEmailQuery.empty) {
            existingData = lowerEmailQuery.docs[0].data() || {};
            wasPreviouslyRegistered = true;
          }
        }
      } catch (dbErr) {
        console.warn('Firestore email lookup failed:', dbErr);
      }

      // 2. Fallback check: check if email was in pre-seeded accounts
      if (!existingData) {
        const sampleMatch = [...SAMPLE_STUDENTS, ...SAMPLE_STAFF].find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (sampleMatch) {
          existingData = sampleMatch;
          wasPreviouslyRegistered = true;
        }
      }
    }

    if (wasPreviouslyRegistered && existingData) {
      // User or email has been registered before -> check and preserve their previously registered role
      const previousRole = normalizeRole(existingData.role || existingData.status);
      const updatedRole = isOwner ? 'superadmin' : previousRole;
      const isSuper = isOwner || isSuperAdmin(updatedRole, existingData.isSuperAdmin);

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

    // First-time registration -> Any email listed as owner becomes superadmin, otherwise default role is supporter
    const assignedRole: SystemRole = isOwner ? 'superadmin' : DEFAULT_REGISTRATION_ROLE;
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
 */
export async function PATCH(req: NextRequest) {
  try {
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
