/**
 * Server-Side Authentication & RBAC Verification Middleware
 * 
 * Cryptographically verifies Firebase ID Tokens on all incoming API requests.
 * Eliminates spoofing: ensures routes NEVER trust unverified client-supplied UIDs or emails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase/admin';
import { isProjectOwnerEmail, normalizeRole, SystemRole } from '@/lib/auth/roles';

export interface VerifiedCaller {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  role: SystemRole;
  isSuperAdmin: boolean;
  tenantTag: string;
  decodedToken: any;
}

/**
 * Extracts and cryptographically verifies the Firebase ID token from the request.
 * Checks "Authorization: Bearer <token>" and session cookies.
 */
export async function verifyBearerToken(req: NextRequest): Promise<any | null> {
  if (!isFirebaseConfigured) {
    return null;
  }

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    // Optional fallback: check cookie
    const cookieToken = req.cookies.get('firebase_id_token')?.value || req.cookies.get('__session')?.value;
    if (cookieToken) {
      token = cookieToken.trim();
    }
  }

  if (!token) {
    return null;
  }

  try {
    const decodedToken = await auth.verifyIdToken(token, true);
    return decodedToken;
  } catch (err: any) {
    console.warn('[serverAuth] Token verification failed:', err.message);
    return null;
  }
}

/**
 * Resolves the authenticated caller's identity and canonical Firestore RBAC role.
 * 
 * Security Guarantee:
 * - Identity (uid, email) is strictly derived from Google's cryptographic signature.
 * - Role is derived from verified Project Owner status or Firestore record.
 */
export async function getVerifiedCaller(req: NextRequest): Promise<VerifiedCaller | null> {
  const decoded = await verifyBearerToken(req);
  if (!decoded || !decoded.uid) {
    return null;
  }

  const uid = decoded.uid;
  const email = (decoded.email || '').toLowerCase().trim();
  const emailVerified = Boolean(decoded.email_verified);
  const displayName = decoded.name || '';
  const photoURL = decoded.picture || '';

  // 1. Check if email is an authorized Project Owner in Firebase Settings
  const isOwner = isProjectOwnerEmail(email) && (emailVerified || process.env.NODE_ENV === 'development');

  if (isOwner) {
    return {
      uid,
      email,
      emailVerified,
      displayName,
      photoURL,
      role: 'superadmin',
      isSuperAdmin: true,
      tenantTag: 'rto-ai',
      decodedToken: decoded,
    };
  }

  // 2. Fetch canonical role from Firestore database
  let role: SystemRole = 'supporter';
  let isSuper = false;

  if (isFirebaseConfigured) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const data = userDoc.data() || {};
        const storedRole = normalizeRole(data.role || data.status);
        if (storedRole === 'superadmin' || data.isSuperAdmin === true) {
          // Double check owner or existing superadmin flag
          role = 'superadmin';
          isSuper = true;
        } else {
          role = storedRole;
        }
      } else {
        // New user -> Strictly default to supporter
        role = 'supporter';
      }
    } catch (dbErr) {
      console.warn(`[getVerifiedCaller] Firestore lookup failed for uid ${uid}:`, dbErr);
      // If token has custom claim
      if (decoded.role) {
        role = normalizeRole(decoded.role);
        isSuper = role === 'superadmin' || decoded.isSuperAdmin === true;
      }
    }
  } else if (decoded.role) {
    role = normalizeRole(decoded.role);
    isSuper = role === 'superadmin' || decoded.isSuperAdmin === true;
  }

  return {
    uid,
    email,
    emailVerified,
    displayName,
    photoURL,
    role,
    isSuperAdmin: isSuper,
    tenantTag: 'rto-ai',
    decodedToken: decoded,
  };
}

/**
 * Requires a cryptographically verified Superadmin caller.
 * Returns 401 if unauthenticated, 403 if not Superadmin.
 */
export async function requireSuperAdminCaller(
  req: NextRequest
): Promise<{ caller: VerifiedCaller } | { errorResponse: NextResponse }> {
  const caller = await getVerifiedCaller(req);

  if (!caller) {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Unauthorized: Valid Firebase ID token is required in the Authorization header.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    };
  }

  if (!caller.isSuperAdmin && caller.role !== 'superadmin') {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Forbidden: Superadmin authorization is required to perform this action.',
          code: 'FORBIDDEN',
          currentRole: caller.role,
        },
        { status: 403 }
      )
    };
  }

  return { caller };
}

/**
 * Requires any cryptographically verified authenticated caller.
 */
export async function requireAuthenticatedCaller(
  req: NextRequest
): Promise<{ caller: VerifiedCaller } | { errorResponse: NextResponse }> {
  const caller = await getVerifiedCaller(req);

  if (!caller) {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Unauthorized: Valid Firebase ID token is required in the Authorization header.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    };
  }

  return { caller };
}

/**
 * Requires either an Administration or Superadmin verified caller.
 */
export async function requireAdministrationOrSuperAdminCaller(
  req: NextRequest
): Promise<{ caller: VerifiedCaller } | { errorResponse: NextResponse }> {
  const caller = await getVerifiedCaller(req);

  if (!caller) {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Unauthorized: Valid Firebase ID token is required in the Authorization header.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    };
  }

  const isSuper = caller.isSuperAdmin || caller.role === 'superadmin';
  const isAdmin = caller.role === 'administration';

  if (!isSuper && !isAdmin) {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Forbidden: Administration or Superadmin authorization is required to perform this action.',
          code: 'FORBIDDEN',
          currentRole: caller.role,
        },
        { status: 403 }
      )
    };
  }

  return { caller };
}

