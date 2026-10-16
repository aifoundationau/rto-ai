import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { SAMPLE_STUDENTS, SAMPLE_STAFF } from '@/scripts/seed-database';

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
          return NextResponse.json({ user: { id: doc.id, ...doc.data() } });
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
          usersList.push({ id: doc.id, ...doc.data() });
        });
      }
    } catch (dbErr) {
      console.warn('Firestore fetch failed or not configured, using seed fallback:', dbErr);
    }

    // Fallback to sample data if Firestore is empty or uninitialized
    if (usersList.length === 0) {
      usersList = [...SAMPLE_STUDENTS, ...SAMPLE_STAFF];
    }

    return NextResponse.json({ users: usersList });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Registers or synchronizes a user profile upon Google Sign-In:
 * - First-time registrations default to the role of 'supporter'.
 * - Existing users have their persisted Firestore role and permissions loaded.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, displayName, photoURL } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Missing required parameter "uid".' }, { status: 400 });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const existingData = userDoc.data() || {};
      const updatedFields: Record<string, any> = {
        lastLoginAt: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        login_count: (existingData.login_count || existingData.loginCount || 0) + 1,
      };
      if (email && !existingData.email) updatedFields.email = email;
      if (displayName && !existingData.displayName) updatedFields.displayName = displayName;
      if (photoURL && !existingData.photoURL) updatedFields.photoURL = photoURL;

      await userRef.set(updatedFields, { merge: true });

      const finalUser = {
        id: uid,
        uid,
        ...existingData,
        ...updatedFields,
        role: existingData.role || 'supporter',
        isSuperAdmin: existingData.isSuperAdmin === true || (existingData.role || '').toLowerCase() === 'superadmin',
      };

      return NextResponse.json({ user: finalUser, isNewUser: false });
    }

    // First-time registration -> assign default role 'supporter'
    const newUserData = {
      id: uid,
      uid,
      email: email || '',
      displayName: displayName || 'Supporter User',
      name: displayName || 'Supporter User',
      photoURL: photoURL || '',
      role: 'supporter',
      status: 'supporter',
      classification: 'Supporter',
      isSuperAdmin: false,
      tags: ['supporter'],
      tag: 'aifoundation',
      source: 'aifoundation',
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
    return NextResponse.json({ user: newUserData, isNewUser: true });
  } catch (err: any) {
    console.error('Error in POST /api/users:', err);
    return NextResponse.json({ error: err.message || 'Failed to sync user profile' }, { status: 500 });
  }
}
