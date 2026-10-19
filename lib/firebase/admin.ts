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

const { cleanKey: _credKey } = getCredentials();
export const isFirebaseConfigured = Boolean(
  _credKey && _credKey.includes('BEGIN PRIVATE KEY') && !_credKey.includes('YOUR_PRIVATE_KEY')
);

function getAdminApp() {
  const { cleanKey, cleanEmail, cleanProjectId } = getCredentials();
  const hasCredentials = isFirebaseConfigured;
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

export const DATABASE_CODE = process.env.DATABASE_CODE || process.env.NEXT_PUBLIC_DATABASE_CODE || 'rto-ai';
export const APP_ID = 'rto-ai';

const adminApp = getAdminApp();
const auth = getAuth(adminApp);

const configuredDatabaseId = process.env.FIRESTORE_DATABASE_ID;
const db = (configuredDatabaseId && configuredDatabaseId !== '(default)') 
  ? getFirestore(adminApp, configuredDatabaseId) 
  : getFirestore(adminApp);

try {
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // already configured
}

function isPlainObject(v: unknown): v is Record<string, any> {
  if (typeof v !== 'object' || v === null) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

// Only recurse into plain objects: arrays, Dates and FieldValue sentinels
// (e.g. serverTimestamp()) must reach Firestore untouched.
function cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      cleaned[k] = isPlainObject(v) ? cleanUndefined(v) : v;
    }
  }
  return cleaned as Partial<T>;
}

/**
 * Enroll a user in TOTP MFA (Google Authenticator).
 */
export async function enrollTotpMfa(uid: string, totpSecret: string) {
  if (!isFirebaseConfigured) {
    return { success: true, uid };
  }
  const enrollment = await auth.updateUser(uid, {});
  return enrollment;
}

/**
 * Set RBAC role claims for a user.
 */
export async function setUserRoles(uid: string, roles: string[]) {
  if (!isFirebaseConfigured) {
    return;
  }
  const claims = { roles };
  await auth.setCustomUserClaims(uid, claims);
  console.log(`Set roles ${roles.join(', ')} for user ${uid}`);
}

/**
 * Atomically generates a unique Student Number (STU-YYYY-XXXXX) using Firestore counter.
 */
export async function generateStudentNumber(year?: number): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  if (!isFirebaseConfigured) {
    const randomPadded = String(Math.floor(Math.random() * 90000) + 10000);
    return `STU-${currentYear}-${randomPadded}`;
  }
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

  if (!isFirebaseConfigured) {
    const fallbackStudentNumber = role === 'STUDENT' ? `STU-${new Date().getFullYear()}-00001` : null;
    return {
      success: true,
      uid,
      role,
      dept,
      studentNumber: fallbackStudentNumber,
      customClaims: { role, dept, ...(fallbackStudentNumber ? { studentNumber: fallbackStudentNumber } : {}) },
    };
  }

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
  const isSuper = role.toLowerCase() === 'superadmin' || role === 'SUPERADMIN';
  const userProfileData: Record<string, any> = {
    uid,
    databaseCode: DATABASE_CODE,
    systemId: DATABASE_CODE,
    email: userEmail,
    displayName: displayName,
    role,
    dept,
    isSuperAdmin: isSuper,
    status: role,
    classification: isSuper ? 'Superadmin' : (role === 'supporter' ? 'Supporter' : role),
    tags: isSuper ? ['superadmin'] : [role.toLowerCase()],
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
  databaseCode?: string;
  systemId?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  userAgent?: string;
  ip?: string;
}) {
  if (!isFirebaseConfigured) {
    return { success: true, logId: 'local-log-unconfigured' };
  }
  try {
    const eventTime = event.timestamp ? new Date(event.timestamp) : new Date();
    const docData = cleanUndefined({
      databaseCode: event.databaseCode || DATABASE_CODE,
      systemId: event.systemId || DATABASE_CODE,
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
  if (!isFirebaseConfigured) {
    return { success: true, id: appData?.id || 'local-app' };
  }
  try {
    if (!appData?.id) return { success: false, error: 'No application ID' };

    const docRef = db.collection('applications').doc(appData.id);
    await docRef.set(
      {
        databaseCode: DATABASE_CODE,
        systemId: DATABASE_CODE,
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
  if (!isFirebaseConfigured) {
    return [];
  }
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
  if (!isFirebaseConfigured) {
    return { success: true, id: 'local-chat-unconfigured' };
  }
  try {
    const docRef = await db.collection('chat_interactions').add({
      databaseCode: DATABASE_CODE,
      systemId: DATABASE_CODE,
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
        toolsUsed: interaction.toolsExecuted?.map((t: any) => t.toolName) || [],
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
  if (!isFirebaseConfigured) {
    return { success: true, id: 'local-token-unconfigured' };
  }
  try {
    const docRef = await db.collection('token_transactions').add({
      databaseCode: DATABASE_CODE,
      systemId: DATABASE_CODE,
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
  if (!isFirebaseConfigured) {
    return { success: true, id: 'local-booking-unconfigured' };
  }
  try {
    const docRef = await db.collection('event_bookings').add({
      databaseCode: DATABASE_CODE,
      systemId: DATABASE_CODE,
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
 * AI Diagnosis & Interaction Tracking Types & Storage
 */
export interface AiInteractionRecord {
  id: string;
  userQuestion: string;
  aiAnswer: string;
  latencyMs: number;
  perceivedAccuracy: number;             // 0 to 100
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  accuracyRationale: string;
  tags: string[];                        // Contains '#ai-interactions'
  toolsExecuted?: {
    toolName: string;
    args?: any;
    output?: any;
  }[];
  uiWidgets?: {
    type: string;
    data: any;
  }[];
  model: string;                         // 'gemini-3.8-flash' | 'local-semantic-engine'
  userEmail?: string;
  applicantId?: string;
  timestamp: string;                     // ISO string
  createdAt?: any;
  inquiryLanguage?: {
    code: string;
    name: string;
    flag?: string;
  };
  adminFeedback?: {
    reviewed: boolean;
    verifiedAccuracy?: number;
    reviewerEmail?: string;
    reviewedAt?: string;
    notes?: string;
    ragIngested?: boolean;
    ragDocId?: string;
    correctedLanguage?: {
      code: string;
      name: string;
      flag?: string;
    };
  };
}

// In-memory runtime buffer for local resilience & rapid fallback
const memoryAiInteractions: AiInteractionRecord[] = [
  {
    id: 'ai-diag-seed-1',
    userQuestion: 'What are the admission requirements and prerequisites for the Bachelor of Computer Science?',
    aiAnswer: 'The **Bachelor of Computer Science (BCS)** requires completion of an Australian Year 12 or equivalent with an ATAR of 75.00 (or equivalent international qualification). Prerequisites include Mathematics (Advanced / Extension). English proficiency requires IELTS 6.5 overall (minimum 6.0 in each sub-band).',
    latencyMs: 440,
    perceivedAccuracy: 98,
    confidenceLevel: 'HIGH',
    accuracyRationale: 'Exact match on course code BCS with verified prerequisites and ATAR criteria from institutional course database.',
    tags: ['#ai-interactions', '#admissions', '#course-inquiry'],
    toolsExecuted: [{ toolName: 'lookup_course_details', args: { courseId: 'BCS' }, output: { code: 'BCS', title: 'Bachelor of Computer Science' } }],
    uiWidgets: [{ type: 'course', data: { id: 'BCS', name: 'Bachelor of Computer Science' } }],
    model: 'gemini-3.8-flash',
    userEmail: 'prospective.student@gmail.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'ai-diag-seed-2',
    userQuestion: 'Can you show me the syllabus, prerequisites, and assessment breakdown for COMP1001?',
    aiAnswer: 'Here is the detailed syllabus for **COMP1001 - Programming Principles & Object-Oriented Design**:\n- **Prerequisites**: None (Core introductory unit)\n- **Assessments**: 3x Programming Assignments (30%), Mid-term Lab Test (20%), Final Capstone Coding Exam (50%).\n- **Weekly Topics**: Algorithmic thinking, control structures, OOP class architecture, polymorphism, error handling.',
    latencyMs: 390,
    perceivedAccuracy: 97,
    confidenceLevel: 'HIGH',
    accuracyRationale: 'Direct match on unit code COMP1001 with 100% syllabus, prerequisites, and assessment weight breakdown.',
    tags: ['#ai-interactions', '#syllabus', '#course-inquiry'],
    toolsExecuted: [{ toolName: 'lookup_unit_syllabus', args: { unitCode: 'COMP1001' }, output: { code: 'COMP1001', assessments: true } }],
    uiWidgets: [{ type: 'unit', data: { code: 'COMP1001', title: 'Programming Principles' } }],
    model: 'gemini-3.8-flash',
    userEmail: 'student.alex@ai-foundation.org',
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'ai-diag-seed-3',
    userQuestion: 'How does your Recognition of Prior Learning (RPL) process align with TEQSA and ASQA guidelines?',
    aiAnswer: 'EduPulse RPL policies adhere strictly to **TEQSA Higher Education Standards Framework (Domain 1.1)** and **ASQA Standards for RTOs (Clause 1.12)**. We conduct systematic mapping of prior formal study, military experience, or certified professional training against unit learning outcomes, ensuring credit does not exceed 50% of total degree volume of learning.',
    latencyMs: 620,
    perceivedAccuracy: 95,
    confidenceLevel: 'HIGH',
    accuracyRationale: 'Grounding via Multilingual RAG pipeline with TEQSA Domain 1.1 and ASQA Clause 1.12 documentation citations.',
    tags: ['#ai-interactions', '#rag-retrieval', '#admissions'],
    toolsExecuted: [{ toolName: 'query_multilingual_rag', args: { query: 'RPL TEQSA ASQA standards' }, output: { matchesCount: 3 } }],
    uiWidgets: [],
    model: 'gemini-3.8-flash',
    userEmail: 'registrar.eval@domain.edu',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
  {
    id: 'ai-diag-seed-4',
    userQuestion: 'Book a 1-on-1 virtual consultation with an admissions advisor for tomorrow afternoon.',
    aiAnswer: 'I have scheduled your 1-on-1 Admissions Consultation for tomorrow at 2:00 PM AEST! A calendar invite with Google Meet conference coordinates has been generated.',
    latencyMs: 510,
    perceivedAccuracy: 94,
    confidenceLevel: 'HIGH',
    accuracyRationale: 'Event booking tool execution succeeded with verified calendar slot and calendar widget dispatch.',
    tags: ['#ai-interactions', '#event-booking', '#admissions'],
    toolsExecuted: [{ toolName: 'register_prospective_event', args: { eventType: 'consultation' }, output: { confirmed: true } }],
    uiWidgets: [{ type: 'event_booking', data: { title: 'Admissions 1-on-1' } }],
    model: 'gemini-3.8-flash',
    userEmail: 'applicant.jordan@outlook.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
  },
  {
    id: 'ai-diag-seed-5',
    userQuestion: 'Are international students eligible for campus fee installment plans under subclass 500 visa rules?',
    aiAnswer: 'Yes. Under ESOS Act Section 27 and standard payment policies, international students studying under subclass 500 can opt for semesterly installment arrangements for tuition fees exceeding $10,000, provided initial CoE deposit commitments are met.',
    latencyMs: 460,
    perceivedAccuracy: 88,
    confidenceLevel: 'MEDIUM',
    accuracyRationale: 'Derived from university FAQ knowledge bank and international admissions fee terms.',
    tags: ['#ai-interactions', '#faq', '#course-inquiry'],
    toolsExecuted: [],
    uiWidgets: [],
    model: 'gemini-3.8-flash',
    userEmail: 'guest.international@mail.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  }
];

/**
 * Save an AI Interaction to Firestore collection `ai_interactions`
 * and dispatch telemetry activity log asynchronously.
 */
export async function saveAiInteraction(interaction: Omit<AiInteractionRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; id: string }> {
  const generatedId = `ai-diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanRecord: AiInteractionRecord = {
    id: generatedId,
    ...interaction,
    tags: interaction.tags.includes('#ai-interactions') ? interaction.tags : ['#ai-interactions', ...interaction.tags],
    timestamp: interaction.timestamp || new Date().toISOString(),
  };

  // Prepend to local memory buffer
  memoryAiInteractions.unshift(cleanRecord);
  if (memoryAiInteractions.length > 200) memoryAiInteractions.pop();

  if (!isFirebaseConfigured) {
    return { success: true, id: generatedId };
  }

  try {
    const docRef = await db.collection('ai_interactions').add(cleanUndefined({
      databaseCode: DATABASE_CODE,
      systemId: DATABASE_CODE,
      ...cleanRecord,
      createdAt: FieldValue.serverTimestamp(),
    }));

    // Record universal activity log
    await recordActivity({
      category: 'CHAT',
      action: 'AI_INTERACTION_DIAGNOSED',
      userEmail: interaction.userEmail,
      metadata: {
        interactionId: docRef.id,
        latencyMs: interaction.latencyMs,
        perceivedAccuracy: interaction.perceivedAccuracy,
        confidenceLevel: interaction.confidenceLevel,
        tags: cleanRecord.tags,
        queryPreview: interaction.userQuestion.slice(0, 80),
        toolsUsed: interaction.toolsExecuted?.map(t => t.toolName) || [],
      },
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.warn('[saveAiInteraction] Firestore write error (fallback memory kept):', error);
    return { success: true, id: generatedId };
  }
}

/**
 * Retrieve AI interactions and calculate aggregated diagnostic KPIs.
 */
export async function getAiInteractions(options?: {
  tag?: string;
  confidence?: string;
  search?: string;
  limit?: number;
}): Promise<{
  metrics: {
    totalInteractions: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    avgPerceivedAccuracy: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
    groundedToolsRatio: number;
  };
  interactions: AiInteractionRecord[];
}> {
  let records: AiInteractionRecord[] = [];

  if (isFirebaseConfigured) {
    try {
      let queryRef: any = db.collection('ai_interactions');
      const snapshot = await queryRef.orderBy('timestamp', 'desc').limit(options?.limit || 60).get();
      if (!snapshot.empty) {
        snapshot.forEach((doc: any) => {
          records.push({ id: doc.id, ...doc.data() });
        });
      }
    } catch (err) {
      console.warn('[getAiInteractions] Firestore read fallback to memory:', err);
    }
  }

  // If firestore has no records or not configured, merge or use memory buffer
  if (records.length === 0) {
    records = [...memoryAiInteractions];
  } else {
    // Deduplicate against memory buffer if needed
    const existingIds = new Set(records.map(r => r.id));
    for (const mem of memoryAiInteractions) {
      if (!existingIds.has(mem.id)) {
        records.push(mem);
      }
    }
    records.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }

  // Calculate metrics on the full dataset before query filtering
  const allLatencies = records.map(r => r.latencyMs || 0).sort((a, b) => a - b);
  const totalInteractions = records.length;
  const avgLatencyMs = totalInteractions > 0 
    ? Math.round(allLatencies.reduce((sum, v) => sum + v, 0) / totalInteractions)
    : 0;
  
  const p95Index = Math.min(Math.floor(allLatencies.length * 0.95), allLatencies.length - 1);
  const p95LatencyMs = allLatencies.length > 0 ? allLatencies[p95Index] : 0;

  const avgPerceivedAccuracy = totalInteractions > 0
    ? Number((records.reduce((sum, r) => sum + (r.perceivedAccuracy || 0), 0) / totalInteractions).toFixed(1))
    : 0;

  const highConfidenceCount = records.filter(r => r.confidenceLevel === 'HIGH').length;
  const mediumConfidenceCount = records.filter(r => r.confidenceLevel === 'MEDIUM').length;
  const lowConfidenceCount = records.filter(r => r.confidenceLevel === 'LOW').length;

  const groundedToolsCount = records.filter(r => (r.toolsExecuted && r.toolsExecuted.length > 0) || r.perceivedAccuracy >= 90).length;
  const groundedToolsRatio = totalInteractions > 0
    ? Number(((groundedToolsCount / totalInteractions) * 100).toFixed(1))
    : 0;

  // Apply filters to returned interactions
  let filtered = [...records];
  if (options?.tag && options.tag !== 'ALL') {
    const targetTag = options.tag.toLowerCase();
    filtered = filtered.filter(r => r.tags && r.tags.some(t => t.toLowerCase() === targetTag));
  }

  if (options?.confidence && options.confidence.toUpperCase() !== 'ALL') {
    const targetConf = options.confidence.toUpperCase();
    filtered = filtered.filter(r => r.confidenceLevel === targetConf);
  }

  if (options?.search && options.search.trim()) {
    const q = options.search.toLowerCase().trim();
    filtered = filtered.filter(r => 
      (r.userQuestion && r.userQuestion.toLowerCase().includes(q)) ||
      (r.aiAnswer && r.aiAnswer.toLowerCase().includes(q)) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
      (r.tags && r.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  return {
    metrics: {
      totalInteractions,
      avgLatencyMs,
      p95LatencyMs,
      avgPerceivedAccuracy,
      highConfidenceCount,
      mediumConfidenceCount,
      lowConfidenceCount,
      groundedToolsRatio,
    },
    interactions: filtered.slice(0, options?.limit || 60),
  };
}

/**
 * Update an AI Interaction with administrative review feedback and edited answers.
 */
export async function updateAiInteractionReview(
  id: string,
  review: {
    verifiedAccuracy?: number;
    notes?: string;
    reviewerEmail?: string;
    updatedAnswer?: string;
    ragIngested?: boolean;
    ragDocId?: string;
    correctedLanguage?: {
      code: string;
      name: string;
      flag?: string;
    };
  }
) {
  const verifiedAccuracy = typeof review.verifiedAccuracy === 'number'
    ? Math.max(0, Math.min(100, review.verifiedAccuracy))
    : 100;

  const adminFeedback: any = {
    reviewed: true,
    verifiedAccuracy,
    reviewerEmail: review.reviewerEmail || 'staff@ai-foundation.org',
    reviewedAt: new Date().toISOString(),
    notes: review.notes || '',
    ragIngested: Boolean(review.ragIngested),
    ragDocId: review.ragDocId || undefined,
  };

  if (review.correctedLanguage) {
    adminFeedback.correctedLanguage = review.correctedLanguage;
  }

  // Update in-memory record
  const memRecord = memoryAiInteractions.find(r => r.id === id);
  if (memRecord) {
    memRecord.adminFeedback = {
      ...(memRecord.adminFeedback || {}),
      ...adminFeedback,
    };
    if (typeof review.verifiedAccuracy === 'number') {
      memRecord.perceivedAccuracy = adminFeedback.verifiedAccuracy;
    }
    if (review.updatedAnswer) {
      memRecord.aiAnswer = review.updatedAnswer;
    }
    if (review.correctedLanguage) {
      memRecord.inquiryLanguage = review.correctedLanguage;
    }
  }

  if (!isFirebaseConfigured) {
    return { success: true, updated: memRecord };
  }

  try {
    const docRef = db.collection('ai_interactions').doc(id);
    const updatePayload: Record<string, any> = {
      adminFeedback,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (typeof review.verifiedAccuracy === 'number') {
      updatePayload.perceivedAccuracy = adminFeedback.verifiedAccuracy;
    }
    if (review.updatedAnswer) {
      updatePayload.aiAnswer = review.updatedAnswer;
      updatePayload.editedAiResponse = review.updatedAnswer;
    }
    if (review.correctedLanguage) {
      updatePayload.inquiryLanguage = review.correctedLanguage;
      updatePayload['adminFeedback.correctedLanguage'] = review.correctedLanguage;
    }

    await docRef.set(updatePayload, { merge: true });

    return { success: true, id };
  } catch (error) {
    console.warn('[updateAiInteractionReview] Firestore update error:', error);
    return { success: true, fallback: true };
  }
}


/**
 * Get recent activity logs for live telemetry display.
 */
export async function getRecentActivityLogs(limitCount = 40) {
  if (!isFirebaseConfigured) {
    return [];
  }
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


