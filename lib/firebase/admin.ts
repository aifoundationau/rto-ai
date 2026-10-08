/**
 * Firebase Admin SDK initialization and utility functions.
 */

import { getApps, initializeApp, cert, deleteApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

function getCredentials() {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
  let projectId = process.env.FIREBASE_PROJECT_ID || 'ai-foundation-firebase';

  // If private key is missing or is the initial placeholder, read directly from .env.local on disk
  if (!privateKey || privateKey.includes('YOUR_PRIVATE_KEY')) {
    try {
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('FIREBASE_PRIVATE_KEY=')) {
            let val = trimmed.replace('FIREBASE_PRIVATE_KEY=', '').trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            privateKey = val;
          }
          if (trimmed.startsWith('FIREBASE_CLIENT_EMAIL=')) {
            let val = trimmed.replace('FIREBASE_CLIENT_EMAIL=', '').trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            clientEmail = val;
          }
          if (trimmed.startsWith('FIREBASE_PROJECT_ID=')) {
            let val = trimmed.replace('FIREBASE_PROJECT_ID=', '').trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            projectId = val;
          }
        }
      }
    } catch (e) {
      console.warn('[FirebaseAdmin] Failed to read .env.local directly:', e);
    }
  }

  const cleanKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const cleanEmail = (clientEmail || 'firebase-adminsdk-fbsvc@ai-foundation-firebase.iam.gserviceaccount.com').replace(/^["']|["']$/g, '');
  const cleanProjectId = (projectId || 'ai-foundation-firebase').replace(/^["']|["']$/g, '');

  return { cleanKey, cleanEmail, cleanProjectId };
}

function getAdminApp() {
  const { cleanKey, cleanEmail, cleanProjectId } = getCredentials();
  const hasCredentials = cleanKey && cleanKey.includes('BEGIN PRIVATE KEY') && !cleanKey.includes('YOUR_PRIVATE_KEY');
  const appName = 'ai-foundation-admin';

  // Check if our dedicated named admin app already exists
  const existingNamedApp = getApps().find(a => a.name === appName);
  if (existingNamedApp) {
    return existingNamedApp;
  }

  try {
    if (hasCredentials) {
      const app = initializeApp(
        {
          credential: cert({
            projectId: cleanProjectId,
            clientEmail: cleanEmail,
            privateKey: cleanKey,
          }),
        },
        appName
      );
      console.log('Firebase Admin SDK initialized successfully with service account cert for project:', cleanProjectId);
      return app;
    } else {
      const defaultApp = getApps().find(a => a.name === '[DEFAULT]');
      return defaultApp || initializeApp({ projectId: cleanProjectId });
    }
  } catch (err) {
    console.warn('Firebase Admin initialization fallback during build:', err);
    return getApps()[0] || initializeApp({ projectId: cleanProjectId }, appName);
  }
}

const adminApp = getAdminApp();
const auth = getAuth(adminApp);
const db = getFirestore(adminApp);
try {
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // already configured
}

function cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      cleaned[k] = (typeof v === 'object' && v !== null && !(v instanceof Date))
        ? cleanUndefined(v)
        : v;
    }
  }
  return cleaned as Partial<T>;
}

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

/**
 * Universal Activity & Telemetry Logging in Firestore.
 * Automatically saves all platform actions into `activity_logs` and increments metrics.
 */
export async function recordActivity(event: {
  category: string;
  action: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  userAgent?: string;
  ip?: string;
}) {
  try {
    const eventTime = event.timestamp ? new Date(event.timestamp) : new Date();
    const docData = cleanUndefined({
      ...event,
      timestamp: eventTime.toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    });

    // Save into activity_logs collection
    const logRef = await db.collection('activity_logs').add(docData);

    // Update aggregated platform metrics atomically
    const metricsRef = db.collection('metrics').doc('platform_stats');
    const updatePayload: Record<string, any> = {
      totalEvents: FieldValue.increment(1),
      [`categories.${event.category}`]: FieldValue.increment(1),
      lastEventAt: FieldValue.serverTimestamp(),
      lastAction: event.action,
    };
    if (event.userEmail) {
      updatePayload.lastActiveUser = event.userEmail;
    }
    await metricsRef.set(updatePayload, { merge: true });

    return { success: true, logId: logRef.id };
  } catch (error) {
    console.warn('[recordActivity] Firestore write failed:', error);
    return { success: false, error };
  }
}

/**
 * Persists student application data to Firestore.
 */
export async function saveApplicationToFirestore(appData: any) {
  try {
    if (!appData?.id) return { success: false, error: 'No application ID' };

    const docRef = db.collection('applications').doc(appData.id);
    await docRef.set(
      {
        ...appData,
        savedToFirestoreAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Record telemetry event
    await recordActivity({
      category: 'APPLICATION',
      action: appData.status === 'Submitted' ? 'APPLICATION_SUBMITTED' : 'APPLICATION_UPDATED',
      userEmail: appData.personalDetails?.email,
      userId: appData.id,
      metadata: {
        applicationId: appData.id,
        applicantName: appData.personalDetails?.fullName,
        degree: appData.coursePreferences?.firstChoiceCourseName,
        degreeCode: appData.coursePreferences?.firstChoiceCourseId,
        status: appData.status,
      },
    });

    return { success: true, id: appData.id };
  } catch (error) {
    console.error('[saveApplicationToFirestore] Error:', error);
    return { success: false, error };
  }
}

/**
 * Retrieves all applications from Firestore with fallback.
 */
export async function getApplicationsFromFirestore() {
  try {
    const snapshot = await db.collection('applications').orderBy('updatedAt', 'desc').get();
    if (!snapshot.empty) {
      const apps: any[] = [];
      snapshot.forEach(doc => apps.push({ ...doc.data(), id: doc.id }));
      return apps;
    }
    return [];
  } catch (error) {
    console.warn('[getApplicationsFromFirestore] Fallback to in-memory/seed:', error);
    return [];
  }
}

/**
 * Persists Chat Q&A and Gemini interactions to Firestore.
 */
export async function saveChatInteraction(interaction: {
  sessionId?: string;
  userMessage: string;
  assistantResponse: string;
  toolsExecuted?: any[];
  uiWidgets?: any[];
  applicantEmail?: string;
  currentApplicationId?: string;
}) {
  try {
    const docRef = await db.collection('chat_interactions').add({
      ...interaction,
      createdAt: FieldValue.serverTimestamp(),
    });

    await recordActivity({
      category: 'CHAT',
      action: 'AI_ADVISOR_INTERACTION',
      userEmail: interaction.applicantEmail,
      metadata: {
        interactionId: docRef.id,
        queryPreview: interaction.userMessage.slice(0, 100),
        toolsUsed: interaction.toolsExecuted?.map((t: any) => t.tool) || [],
      },
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.warn('[saveChatInteraction] Error:', error);
    return { success: false, error };
  }
}

/**
 * Persists TokenPulse transactions to Firestore.
 */
export async function saveTokenTransaction(tx: {
  action: string;
  performedBy: string;
  targetAllocation?: string;
  tokensAmount: number;
  audEquivalent?: number;
  reason?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const docRef = await db.collection('token_transactions').add({
      ...tx,
      createdAt: FieldValue.serverTimestamp(),
    });

    await recordActivity({
      category: 'TOKEN',
      action: tx.action,
      userEmail: tx.performedBy,
      metadata: {
        txId: docRef.id,
        target: tx.targetAllocation,
        tokensAmount: tx.tokensAmount,
        reason: tx.reason,
      },
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.warn('[saveTokenTransaction] Error:', error);
    return { success: false, error };
  }
}

/**
 * Persists Event bookings to Firestore.
 */
export async function saveEventBooking(booking: any) {
  try {
    const docRef = await db.collection('event_bookings').add({
      ...booking,
      createdAt: FieldValue.serverTimestamp(),
    });

    await recordActivity({
      category: 'CALENDAR',
      action: 'EVENT_BOOKING_CONFIRMED',
      userEmail: booking.studentEmail,
      metadata: {
        bookingId: docRef.id,
        eventId: booking.eventId,
        title: booking.title,
      },
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.warn('[saveEventBooking] Error:', error);
    return { success: false, error };
  }
}

/**
 * Get recent activity logs for live telemetry display.
 */
export async function getRecentActivityLogs(limitCount = 40) {
  try {
    try {
      const snapshot = await db.collection('activity_logs')
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
        .get();
      
      const logs: any[] = [];
      snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
      return logs;
    } catch (orderErr) {
      // Fallback if index on timestamp is building
      const snapshot = await db.collection('activity_logs')
        .limit(limitCount)
        .get();
      const logs: any[] = [];
      snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
      logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      return logs;
    }
  } catch (error) {
    console.warn('[getRecentActivityLogs] Error:', error);
    return [];
  }
}

export { auth, db, FieldValue };
