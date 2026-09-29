import * as functions from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

export interface AssignRoleRequest {
  uid: string;
  role: 'STUDENT' | 'SUPERADMIN' | 'REGISTRAR' | 'ACADEMIC_STAFF' | string;
  dept?: string;
  fullName?: string;
  email?: string;
}

/**
 * Generates an atomic, sequential Student Number (STU-YYYY-XXXXX)
 * using a Firestore transaction on /counters/student_id_counter.
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
 * Cloud Function to assign a university role and manage Student ID/Number generation.
 * Can be triggered as an HTTP Callable Cloud Function or invoked directly server-side.
 */
export const assignUniversityRole = functions.https.onCall(async (data: AssignRoleRequest, context: any) => {
  if (!context.auth && process.env.NODE_ENV !== 'test') {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { uid, role, dept = 'Computer Science & Engineering', fullName, email } = data;

  if (!uid || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The parameters "uid" and "role" are required.'
    );
  }

  try {
    let existingClaims: Record<string, any> = {};
    let userEmail = email || '';
    let displayName = fullName || '';

    try {
      const userRecord = await auth.getUser(uid);
      existingClaims = userRecord.customClaims || {};
      if (!userEmail) userEmail = userRecord.email || '';
      if (!displayName) displayName = userRecord.displayName || '';
    } catch {
      // ignore
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

    // If assigned role is STUDENT and no studentNumber exists, generate one atomically
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

    // 1. Set Custom Claims in Firebase Auth
    try {
      await auth.setCustomUserClaims(uid, newClaims);
    } catch {
      // ignore
    }

    // 2. Prepare Firestore user document data
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

    console.log(`Successfully assigned role ${role} to user ${uid}. Student Number: ${studentNumber || 'N/A'}`);

    return {
      success: true,
      uid,
      role,
      dept,
      studentNumber: studentNumber || null,
      customClaims: newClaims,
    };
  } catch (error: any) {
    console.error(`Error in assignUniversityRole for UID ${uid}:`, error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to assign role');
  }
});
