'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  BookOpen,
  Sparkles,
  ArrowRight,
  LogOut,
  User,
  GraduationCap,
  Layers,
  Lock,
  Mail,
  AlertCircle
} from 'lucide-react';
import { ClassroomUser } from '@/components/auth/GoogleClassroomLoginModal';
import { trackClientEvent } from '@/lib/firebase/telemetry';

interface SignInViewProps {
  currentUser: ClassroomUser | null;
  onLoginSuccess: (user: ClassroomUser) => void;
  onLogout: () => void;
  onNavigateTab: (tab: any) => void;
}

export const SignInView: React.FC<SignInViewProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
  onNavigateTab
}) => {
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { auth } = await import('@/lib/firebase/client');
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');

      const provider = new GoogleAuthProvider();
      
      // Ecosystem Scopes per FUTURE_FIREBASE_AUTH_AND_GOOGLE_SSO_PROMPT.txt
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
      provider.addScope('https://www.googleapis.com/auth/calendar.events');

      if (selectedRole === 'TEACHER') {
        provider.addScope('https://www.googleapis.com/auth/classroom.courses');
        provider.addScope('https://www.googleapis.com/auth/classroom.rosters');
      }

      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken && typeof window !== 'undefined') {
        sessionStorage.setItem('google_oauth_access_token', accessToken);
        console.log('[Auth] Google OAuth Token saved for Google APIs in sessionStorage');
      }

      const classroomUser: ClassroomUser = {
        name: result.user.displayName || 'Authorized User',
        email: result.user.email || '',
        role: selectedRole,
        avatarUrl: result.user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        googleWorkspaceId: result.user.uid,
        scopesGranted: [
          'userinfo.email',
          'userinfo.profile',
          'classroom.courses.readonly',
          'calendar.events'
        ]
      };

      // Telemetry log
      trackClientEvent({
        category: 'AUTH',
        action: `GOOGLE_SSO_${selectedRole}_SUCCESS`,
        userId: classroomUser.googleWorkspaceId,
        userEmail: classroomUser.email,
        userRole: selectedRole,
        metadata: {
          provider: 'google.com',
          displayName: classroomUser.name
        }
      });

      onLoginSuccess(classroomUser);
    } catch (err: any) {
      console.error('[Google SSO Error]', err);
      setErrorMessage(err.message || 'Google sign in was cancelled or failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('google_oauth_access_token');
      }
      const { auth } = await import('@/lib/firebase/client');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);

      trackClientEvent({
        category: 'AUTH',
        action: 'USER_SIGNOUT',
        userEmail: currentUser?.email
      });
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    onLogout();
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. HERO HEADER */}
      <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
            Centralized Identity & Access
          </span>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-semibold">
            Google Ecosystem SSO
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          {currentUser ? 'Your Unified Student & Staff Account' : 'Sign In to EduPulse AI'}
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          {currentUser
            ? 'Manage your active academic profile, Google Classroom courses, admissions application, and event registrations.'
            : 'Authenticate securely with your Google or University Workspace account for seamless access across courses, calendars, and admissions.'}
        </p>
      </div>

      {/* 2. AUTHENTICATED STATE */}
      {currentUser ? (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-4">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
                  <span className="p-0.5 bg-emerald-100 text-emerald-700 rounded-full" title="Verified Account">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-bold rounded-lg uppercase tracking-wide">
                    {currentUser.role}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Google SSO Connected
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 self-start sm:self-center border border-rose-200/60"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigateTab('application')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Admissions Application</h3>
              <p className="text-xs text-slate-500 mt-1">Review your submitted application form and entry criteria.</p>
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 mt-3">
                Open Portal &rarr;
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('events')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Events & Calendar</h3>
              <p className="text-xs text-slate-500 mt-1">View campus tours, open days, and your Google Calendar RSVPs.</p>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-3">
                View Schedule &rarr;
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('admin')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Staff & Admin Hub</h3>
              <p className="text-xs text-slate-500 mt-1">Access telemetry, Google Sheets sync, and student management.</p>
              <span className="text-xs font-bold text-purple-600 flex items-center gap-1 mt-3">
                Open Dashboard &rarr;
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* 3. SIGN IN FORM */
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm max-w-xl mx-auto space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Unified Google Single Sign-On</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Select your university role and authenticate with your verified Google account.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setSelectedRole('STUDENT')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                selectedRole === 'STUDENT'
                  ? 'bg-white text-indigo-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student / Applicant</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('TEACHER')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                selectedRole === 'TEACHER'
                  ? 'bg-white text-indigo-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Staff / Educator</span>
            </button>
          </div>

          {/* Permissions Unlocked */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2.5 text-xs text-slate-600">
            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
              Included Google Ecosystem Integrations:
            </span>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Google Classroom course &amp; syllabus auto-synchronization</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Google Calendar 1-click Open Day &amp; advising session sync</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Auto-generated permanent student credential ({selectedRole === 'STUDENT' ? 'STU-2026-XXXXX' : 'STAFF-2026-XXXXX'})</span>
            </div>
          </div>

          {/* Official Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 hover:border-slate-300 font-bold rounded-2xl text-sm transition-all shadow-sm flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {/* Google SVG Logo */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
          </button>

          <p className="text-[11px] text-slate-400">
            By signing in, you agree to the university's privacy framework and Google OAuth data handling policies.
          </p>
        </div>
      )}
    </div>
  );
};
