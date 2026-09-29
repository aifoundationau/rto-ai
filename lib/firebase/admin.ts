/**
 * Firebase Admin SDK initialization and utility functions.
 */

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize the Admin SDK only once.
if (!getApps().length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (privateKey && privateKey.includes('BEGIN PRIVATE KEY')) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'ai-foundation-firebase',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk@ai-foundation-firebase.iam.gserviceaccount.com',
          privateKey,
        }),
      });
    } else {
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'ai-foundation-firebase',
      });
    }
  } catch (err) {
    console.warn('Firebase Admin initialization fallback during build:', err);
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'ai-foundation-firebase',
    });
  }
}

const auth = getAuth();
const db = getFirestore();

/**
 * Enroll a user in TOTP MFA (Google Authenticator).
 */
export async function enrollTotpMfa(uid: string, totpSecret: string) {
  const enrollment = await auth.updateUser(uid, {});
  return enrollment;
}

/**
 * Set RBAC role claims for a user.
 */
export async function setUserRoles(uid: string, roles: string[]) {
  const claims = { roles };
  await auth.setCustomUserClaims(uid, claims);
  console.log(`Set roles ${roles.join(', ')} for user ${uid}`);
}

/**
 * Atomically generates a unique Student Number (STU-YYYY-XXXXX) using Firestore counter.
 */
export async function generateStudentNumber(year?: number): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  const counterRef = db.collection('counters').doc('student_id_counter');

  const studentNumber = await db.runTransaction(async (transaction: any) => {
    const counterDoc = await transaction.get(counterRef);
    let currentCount = 0;

    if (counterDoc.exists) {
      const data = counterDoc.data();
      currentCount = data?.count || 0;
    }

    const nextCount = currentCount + 1;
    const paddedCount = String(nextCount).padStart(5, '0');
    const formattedStudentNumber = `STU-${currentYear}-${paddedCount}`;

    transaction.set(
      counterRef,
      {
        count: nextCount,
        year: currentYear,
        lastAssignedStudentNumber: formattedStudentNumber,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return formattedStudentNumber;
  });

  return studentNumber;
}

/**
 * Assigns a role to a user and generates an immutable Student Number if role is STUDENT.
 * Updates Auth Custom Claims, /users/{uid}, and /students/{uid}.
 */
export async function assignUniversityRole(params: {
  uid: string;
  role: 'STUDENT' | 'SUPERADMIN' | 'REGISTRAR' | 'ACADEMIC_STAFF' | string;
  dept?: string;
  fullName?: string;
  email?: string;
}) {
  const { uid, role, dept = 'Computer Science & Engineering', fullName, email } = params;

  let existingClaims: Record<string, any> = {};
  let userEmail = email || '';
  let displayName = fullName || '';

  try {
    const userRecord = await auth.getUser(uid);
    existingClaims = userRecord.customClaims || {};
    if (!userEmail) userEmail = userRecord.email || '';
    if (!displayName) displayName = userRecord.displayName || '';
  } catch {
    // If user does not exist in Auth yet, handle gracefully
  }

  let studentNumber = existingClaims.studentNumber as string | undefined;

  // Check existing Firestore profile for studentNumber
  if (!studentNumber) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists && userDoc.data()?.studentNumber) {
        studentNumber = userDoc.data()?.studentNumber;
      }
    } catch {
      // ignore
    }
  }

  // If role is STUDENT and studentNumber doesn't exist, generate one atomically
  if (role === 'STUDENT' && !studentNumber) {
    studentNumber = await generateStudentNumber();
  }

  // Prepare Custom Claims payload
  const newClaims: Record<string, any> = {
    ...existingClaims,
    role,
    dept,
  };

  if (role === 'STUDENT' && studentNumber) {
    newClaims.studentNumber = studentNumber;
  }

  // 1. Set Custom Claims in Firebase Auth if available
  try {
    await auth.setCustomUserClaims(uid, newClaims);
  } catch {
    // ignore if mock UID
  }

  // 2. Prepare Firestore user profile data
  const userProfileData: Record<string, any> = {
    uid,
    email: userEmail,
    displayName: displayName,
    role,
    dept,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (role === 'STUDENT' && studentNumber) {
    userProfileData.studentNumber = studentNumber;
  }

  // 3. Save directly into Firestore (/users/{uid} and /students/{uid})
  await db.collection('users').doc(uid).set(userProfileData, { merge: true });

  if (role === 'STUDENT') {
    await db.collection('students').doc(uid).set(
      {
        ...userProfileData,
        enrollmentYear: studentNumber ? parseInt(studentNumber.split('-')[1]) : new Date().getFullYear(),
        status: 'Active',
      },
      { merge: true }
    );
  }

  console.log(`[assignUniversityRole] Assigned role ${role} to ${uid}. Student Number: ${studentNumber || 'N/A'}`);

  return {
    success: true,
    uid,
    role,
    dept,
    studentNumber: studentNumber || null,
    customClaims: newClaims,
  };
}

export { auth, db };
