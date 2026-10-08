import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  X,
  LogOut,
  User,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Key,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface ClassroomUser {
  name: string;
  email: string;
  role: 'TEACHER' | 'STUDENT' | 'SUPERADMIN' | 'ADMIN';
  avatarUrl: string;
  googleWorkspaceId: string;
  scopesGranted: string[];
}

interface GoogleClassroomLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: ClassroomUser) => void;
  currentUser?: ClassroomUser | null;
  onLogout?: () => void;
}

export const GoogleClassroomLoginModal: React.FC<GoogleClassroomLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  onLogout
}) => {
  const [selectedRole, setSelectedRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [customEmail, setCustomEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<ClassroomUser | null>(currentUser || null);

  useEffect(() => {
    setActiveSession(currentUser || null);
  }, [currentUser]);

  if (!isOpen) return null;

  const performLogin = async (role: 'TEACHER' | 'STUDENT') => {
    setIsLoading(true);
    try {
      const { auth } = await import('@/lib/firebase/client');
      const { signInWithPopup, GoogleAuthProvider, signOut: firebaseSignOut } = await import('firebase/auth');

      const provider = new GoogleAuthProvider();

      const teacherScopes = [
        'https://www.googleapis.com/auth/classroom.courses',
        'https://www.googleapis.com/auth/classroom.rosters',
        'https://www.googleapis.com/auth/classroom.coursework.students',
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];

      const studentScopes = [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.me'
      ];

      const scopes = role === 'TEACHER' ? teacherScopes : studentScopes;
      scopes.forEach(scope => provider.addScope(scope));

      const result = await signInWithPopup(auth, provider);

      // Get the OAuth access token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken && typeof window !== 'undefined') {
        sessionStorage.setItem('google_oauth_access_token', accessToken);
        console.log('[Auth] Google OAuth Token saved for Classroom & Gmail');
      }

      const user: ClassroomUser = {
        name: result.user.displayName || 'Unknown User',
        email: result.user.email || '',
        role: role,
        avatarUrl: result.user.photoURL || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
        googleWorkspaceId: result.user.uid,
        scopesGranted: scopes,
      };

      setActiveSession(user);
      onLoginSuccess(user);

      // Record to Firebase Telemetry and sync user profile
      try {
        const { trackClientEvent } = await import('@/lib/firebase/telemetry');
        trackClientEvent({
          category: 'AUTH',
          action: `GOOGLE_CLASSROOM_${role}_LOGIN`,
          userId: user.googleWorkspaceId,
          userEmail: user.email,
          userRole: role,
          metadata: {
            displayName: user.name,
            provider: 'google.com',
            scopesGranted: user.scopesGranted,
          },
        });
      } catch (e) {
        // non-blocking
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      alert(`Login failed: ${error.message || 'Unknown error'}. Please check the console for more details.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherLogin = () => performLogin('TEACHER');
  const handleStudentLogin = () => performLogin('STUDENT');

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('google_oauth_access_token');
      }
      const email = activeSession?.email;
      const { auth } = await import('@/lib/firebase/client');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);

      const { trackClientEvent } = await import('@/lib/firebase/telemetry');
      trackClientEvent({
        category: 'AUTH',
        action: 'GOOGLE_CLASSROOM_SIGNOUT',
        userEmail: email,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setActiveSession(null);
    if (onLogout) onLogout();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-200">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            <span>Google Classroom Sign In</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Log in with your Google Workspace university account to sync courses, assignments, and rosters.
          </p>
        </div>

        {/* If Active Session Exists */}
        {activeSession ? (
          <div className="p-5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <img
                src={activeSession.avatarUrl}
                alt={activeSession.name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/30"
              />
              <div className="overflow-hidden">
                <div className="font-bold text-slate-900 text-sm truncate">{activeSession.name}</div>
                <div className="text-slate-500 truncate font-mono text-[11px]">{activeSession.email}</div>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider">
                  {activeSession.role} ACCOUNT
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 text-[11px] space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Google Workspace ID:</span>
                <span className="font-mono font-bold text-slate-800">{activeSession.googleWorkspaceId}</span>
              </div>
              <div className="flex justify-between">
                <span>OAuth 2.0 Scopes:</span>
                <span className="font-bold text-emerald-700">{activeSession.scopesGranted.length} Granted</span>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <button
                onClick={handleSignOut}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
              <a
                href="https://classroom.google.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Continue to Classroom
              </a>
            </div>
          </div>
        ) : (
          /* Login Mode Selector */
          <div className="space-y-4">
            {/* Role Toggle Pills */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedRole('TEACHER')}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${selectedRole === 'TEACHER'
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Teacher / Faculty</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('STUDENT')}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${selectedRole === 'STUDENT'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>Student</span>
              </button>
            </div>

            {/* Optional Custom Email Input */}
            <div className="space-y-1 text-xs">
              <label className="block text-slate-700 font-bold">Google Workspace Email (Optional):</label>
              <input
                type="email"
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                placeholder={
                  selectedRole === 'TEACHER'
                    ? 'teacher.name@edupulse.edu'
                    : 'student.name@student.edu'
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Google Classroom OAuth Authentication Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={selectedRole === 'TEACHER' ? handleTeacherLogin : handleStudentLogin}
              className={`w-full py-3 px-4 font-bold text-xs rounded-2xl text-white shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer ${selectedRole === 'TEACHER'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                }`}
            >
              {/* Google Colored Icon */}
              <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
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

              <span>
                {isLoading
                  ? 'Authenticating with Google OAuth...'
                  : `Sign In as ${selectedRole === 'TEACHER' ? 'Teacher' : 'Student'} with Google`}
              </span>
            </button>

            {/* OAuth Scope Disclosures */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block">Requested OAuth 2.0 Scopes:</span>
              {selectedRole === 'TEACHER' ? (
                <ul className="list-disc pl-4 text-[10px] space-y-0.5 text-slate-600 font-mono">
                  <li>https://www.googleapis.com/auth/classroom.courses</li>
                  <li>https://www.googleapis.com/auth/classroom.rosters</li>
                  <li>https://www.googleapis.com/auth/classroom.coursework.students</li>
                </ul>
              ) : (
                <ul className="list-disc pl-4 text-[10px] space-y-0.5 text-slate-600 font-mono">
                  <li>https://www.googleapis.com/auth/classroom.courses.readonly</li>
                  <li>https://www.googleapis.com/auth/classroom.rosters.readonly</li>
                  <li>https://www.googleapis.com/auth/classroom.coursework.me</li>
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
