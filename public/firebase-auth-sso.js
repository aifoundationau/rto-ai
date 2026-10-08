/**
 * Centralized Firebase Auth & Unified Google Ecosystem SSO (Classroom, Gmail, Workspace)
 * Zero-Authentication Hosting Service Client Module (Pure Client-side SDK v11)
 *
 * Target Systems: AI Foundation Australia, It's A Simple Job, Pro LMS, RTO AI
 * Reference: FUTURE_FIREBASE_AUTH_AND_GOOGLE_SSO_PROMPT.txt
 */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

export const firebaseConfig = {
    apiKey: "AIzaSyCPeAOWQj8456TeIWDIPsyxyWT7QLrC8J8",
    authDomain: "ai-foundation-firebase.firebaseapp.com",
    projectId: "ai-foundation-firebase",
    storageBucket: "ai-foundation-firebase.firebasestorage.app",
    messagingSenderId: "614773274800",
    appId: "1:614773274800:web:bcfa9d363de884cf9ea375"
};

export const DATABASE_CODE = 'rto-ai';
export const APP_ID = 'rto-ai';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Provider with Workspace & Classroom Scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');

// Optional: Prompt user to choose their organization account
googleProvider.setCustomParameters({
    prompt: 'select_account',
    hd: 'aifoundation.net.au'
});

/**
 * Perform Google SSO login with Firebase Auth and capture the Google OAuth access token.
 */
export async function loginWithGoogleSSO(customScopes = []) {
    try {
        if (customScopes && customScopes.length > 0) {
            customScopes.forEach(s => googleProvider.addScope(s));
        }

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const googleAccessToken = credential?.accessToken;

        if (googleAccessToken) {
            sessionStorage.setItem('google_oauth_access_token', googleAccessToken);
            console.log('[Auth] Google OAuth Token saved for Classroom & Gmail');
        }

        return { user, googleAccessToken };
    } catch (error) {
        console.error('[Auth Error]:', error);
        throw error;
    }
}

/**
 * Retrieve current cached Google OAuth Access Token
 */
export function getGoogleOAuthAccessToken() {
    return sessionStorage.getItem('google_oauth_access_token');
}

/**
 * Perform clean sign-out and invalidate session
 */
export async function logoutUser() {
    sessionStorage.removeItem('google_oauth_access_token');
    await signOut(auth);
    console.log('[Auth] Signed out and cleared session token.');
}

/**
 * Listen to auth state transitions
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}
