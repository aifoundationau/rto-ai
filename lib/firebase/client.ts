/**
 * Firebase client SDK initialization and utility functions for authentication.
 * This module sets up the Firebase client SDK for a web (Next.js) app and
 * provides helpers to enable TOTP (Google Authenticator) MFA and to retrieve
 * a custom token with RBAC role claims.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, multiFactor, TotpSecret, TotpMultiFactorGenerator, EmailAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Complete centralized Firebase client configuration for ai-foundation-firebase (Tenant: rto-ai)
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCPeAOWQj8456TeIWDIPsyxyWT7QLrC8J8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ai-foundation-firebase.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ai-foundation-firebase",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ai-foundation-firebase.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "614773274800",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:614773274800:web:bcfa9d363de884cf9ea375",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9V4X460YRL"
};

export const DATABASE_CODE = process.env.NEXT_PUBLIC_DATABASE_CODE || 'rto-ai';
export const APP_ID = 'rto-ai';
export const TENANT_TAG = 'rto-ai';

// Safely obtain or initialize the Firebase App instance
function getOrCreateClientApp(): FirebaseApp {
  const apps = getApps();
  if (apps.length > 0) {
    const existing = apps.find(a => a.name === '[DEFAULT]' || a.options.projectId === firebaseConfig.projectId);
    if (existing) return existing;
    return apps[0];
  }
  return initializeApp(firebaseConfig);
}

const app: FirebaseApp = getOrCreateClientApp();
export const auth: Auth = getAuth(app);

const clientDatabaseId = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID;
export const db: Firestore = (clientDatabaseId && clientDatabaseId !== '(default)')
  ? getFirestore(app, clientDatabaseId)
  : getFirestore(app);

/**
 * Step 1 of TOTP (Google Authenticator) MFA enrollment for the signed‑in user.
 *
 * Generates a TOTP secret for the current multi-factor session. Show the user
 * `secret.secretKey` (or open the otpauth:// `qrCodeUrl`) so they can add it to
 * their authenticator app, then call `finishTotpEnrollment` with the 6‑digit code.
 *
 * Requires TOTP MFA to be enabled for the project (Identity Platform).
 */
export async function enrollCurrentUserInTotp(): Promise<{ secret: TotpSecret; qrCodeUrl: string }> {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in');
  }

  const session = await multiFactor(auth.currentUser).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  const qrCodeUrl = secret.generateQrCodeUrl(auth.currentUser.email || undefined, 'EduPulse AI');
  return { secret, qrCodeUrl };
}

/**
 * Step 2 of TOTP enrollment: verify the code from the authenticator app and
 * activate the factor on the current user.
 */
export async function finishTotpEnrollment(secret: TotpSecret, verificationCode: string) {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in');
  }
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, verificationCode);
  await multiFactor(auth.currentUser).enroll(assertion, 'Google Authenticator');
  await auth.currentUser.getIdToken(true);
}

/**
 * Sign‑in with email and password and request a fresh ID token that includes
 * custom claims (RBAC role claims) set by the admin SDK.
 */
export async function signInAndRefreshToken(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  // Force token refresh to include custom claims.
  const idToken = await userCredential.user.getIdToken(true);
  return idToken;
}

export async function getClientAuthToken(): Promise<string | null> {
  try {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  } catch (e) {
    return null;
  }
}

/**
 * Client-side fetch wrapper that automatically attaches Authorization: Bearer <idToken>
 */
export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = await getClientAuthToken();
  const headers = new Headers(init?.headers || {});
  if (token && !headers.has('Authorization') && !headers.has('authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
  });
}

export { app };
