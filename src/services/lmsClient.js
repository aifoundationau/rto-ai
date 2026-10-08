import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';

// Environment variable helper supporting both Vite (import.meta.env) and Next.js / Node (process.env)
const getEnv = (key, fallback = '') => {
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
      return import.meta.env[key];
    }
  } catch (e) {}
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || getEnv('NEXT_PUBLIC_FIREBASE_API_KEY') || 'AIzaSyC4T6H4jwgI7GKtJ4ys8qZLcykq_27kUBc',
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || getEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') || 'pro-lms-c44d1.firebaseapp.com',
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID') || 'pro-lms-c44d1',
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') || 'pro-lms-c44d1.firebasestorage.app',
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || getEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') || '254944616894',
  appId: getEnv('VITE_FIREBASE_APP_ID') || getEnv('NEXT_PUBLIC_FIREBASE_APP_ID') || '1:254944616894:web:72e56e4c93212c8e47d9ef'
};

// Support multiple Firebase apps safely if project already initialized another Firebase app
const existingApp = getApps().find(a => a.name === 'pro-lms' || a.options.projectId === firebaseConfig.projectId);
const app = existingApp || (getApps().length === 0 ? initializeApp(firebaseConfig) : initializeApp(firebaseConfig, 'pro-lms'));

export const db = getFirestore(app);
export const CURRENT_SITE_ID = getEnv('VITE_LMS_SITE_ID') || getEnv('NEXT_PUBLIC_LMS_SITE_ID') || 'lms';

// ==========================================
// 1. COURSES (lms_courses)
// ==========================================

/**
 * Fetch courses available to this site:
 * Returns both global courses AND courses specific to this siteId.
 */
export async function getCourses({ includeArchived = false } = {}) {
  const col = collection(db, 'lms_courses');
  const snap = await getDocs(col);
  const list = [];
  
  snap.forEach(d => {
    const data = d.data();
    if (!includeArchived && data.archived) return;
    
    // Multi-tenant check: include if matches siteId OR is global
    if (data.siteId === CURRENT_SITE_ID || data.visibility === 'global') {
      list.push({ id: d.id, ...data });
    }
  });
  
  return list;
}

/**
 * Fetch ALL global courses in the network for AI index/cross-reference.
 */
export async function getAllNetworkCourses() {
  const col = collection(db, 'lms_courses');
  const snap = await getDocs(col);
  const list = [];
  
  snap.forEach(d => {
    const data = d.data();
    if (!data.archived) {
      list.push({ id: d.id, ...data });
    }
  });
  
  return list;
}

/**
 * Fetch a single course by its document ID.
 */
export async function getCourseById(courseId) {
  if (!courseId) return null;
  const ref = doc(db, 'lms_courses', courseId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Save or publish a course into the LMS database.
 */
export async function saveCourse(courseData) {
  const id = courseData.id || `CRS-${Date.now()}`;
  const ref = doc(db, 'lms_courses', id);
  const payload = {
    ...courseData,
    id,
    siteId: courseData.siteId || CURRENT_SITE_ID,
    visibility: courseData.visibility || 'site',
    updatedAt: Date.now(),
    createdAt: courseData.createdAt || Date.now()
  };
  await setDoc(ref, payload, { merge: true });
  return payload;
}

// ==========================================
// 2. STUDENTS (lms_students)
// ==========================================

/**
 * Fetch students for the current site or global network.
 * Note: Sensitive subcollections (lms_students/{studentId}/private/sensitive) are kept locked.
 */
export async function getStudents({ siteId = CURRENT_SITE_ID } = {}) {
  const col = collection(db, 'lms_students');
  const snap = await getDocs(col);
  const list = [];

  snap.forEach(d => {
    const data = d.data();
    if (!siteId || data.siteId === siteId || data.siteId === 'lms') {
      list.push({ id: d.id, ...data });
    }
  });

  return list;
}

/**
 * Fetch a student by ID.
 */
export async function getStudentById(studentId) {
  if (!studentId) return null;
  const ref = doc(db, 'lms_students', studentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Save or update a student record.
 */
export async function saveStudent(studentData) {
  const id = studentData.id || `STU-${Date.now()}`;
  const ref = doc(db, 'lms_students', id);
  const payload = {
    ...studentData,
    id,
    siteId: studentData.siteId || CURRENT_SITE_ID,
    updatedAt: Date.now(),
    createdAt: studentData.createdAt || Date.now()
  };
  await setDoc(ref, payload, { merge: true });
  return payload;
}

// ==========================================
// 3. LEADS (lms_leads)
// ==========================================

/**
 * Fetch leads for the current site or network.
 */
export async function getLeads({ siteId = CURRENT_SITE_ID } = {}) {
  const col = collection(db, 'lms_leads');
  const snap = await getDocs(col);
  const list = [];

  snap.forEach(d => {
    const data = d.data();
    if (!siteId || data.siteId === siteId || data.siteId === 'lms') {
      list.push({ id: d.id, ...data });
    }
  });

  return list;
}

/**
 * Save or record an incoming lead/inquiry.
 */
export async function saveLead(leadData) {
  const id = leadData.id || `LEAD-${Date.now()}`;
  const ref = doc(db, 'lms_leads', id);
  const payload = {
    ...leadData,
    id,
    siteId: leadData.siteId || CURRENT_SITE_ID,
    createdAt: leadData.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  await setDoc(ref, payload, { merge: true });
  return payload;
}
