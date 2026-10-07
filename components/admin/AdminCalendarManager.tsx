import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

export const AdminCalendarManager: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [calendarUser, setCalendarUser] = useState<any>(null);

  // Automatically detect if the user is already logged in globally
  useEffect(() => {
    let unsubscribe = () => {};
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase/client');
        unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            setCalendarUser({
              name: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
            });
          } else {
            setCalendarUser(null);
          }
        });
      } catch (e) {
        console.error(e);
      }
    };
    checkAuth();
    return () => unsubscribe();
  }, []);

  const handleConnectCalendar = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      const { auth } = await import('@/lib/firebase/client');
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');

      const provider = new GoogleAuthProvider();
      // Request Google Calendar scopes
      provider.addScope('https://www.googleapis.com/auth/calendar');
      provider.addScope('https://www.googleapis.com/auth/calendar.events');

      const result = await signInWithPopup(auth, provider);
      // onAuthStateChanged will automatically pick up the user, so we don't strictly need to set it here, but we can.
    } catch (err: any) {
      console.error("Calendar connection failed:", err);
      setError(err.message || 'Failed to connect to Google Calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { auth } = await import('@/lib/firebase/client');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch (e) {}
    setCalendarUser(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <Calendar className="w-5 h-5" />
          </span>
          <h3 className="font-bold text-slate-900 text-lg">Google Calendar Integration</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Connect your Google Workspace account to sync events, schedule campus tours, and manage staff availability.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!calendarUser ? (
        <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border border-slate-200 border-dashed space-y-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <div className="text-center">
            <h4 className="font-bold text-slate-800 text-sm">Connect Google Calendar</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You must enable the Google Calendar API in Google Cloud and add it to your OAuth scopes before connecting.
            </p>
          </div>
          <button
            onClick={handleConnectCalendar}
            disabled={isConnecting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : 'Sign in with Google'}
          </button>
        </div>
      ) : (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={calendarUser.photoURL} alt={calendarUser.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/30" />
              <div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  {calendarUser.name}
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-slate-500 font-mono text-[11px]">{calendarUser.email}</div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Disconnect
            </button>
          </div>
          <div className="pt-4 border-t border-emerald-200/60 flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <Calendar className="w-4 h-4" />
            <span>Google Calendar API connected successfully. Your schedule is now synced with the admin portal!</span>
          </div>

          {/* Embedded Google Calendar */}
          <div className="mt-6 rounded-2xl overflow-hidden border border-emerald-200 bg-white shadow-sm h-[500px]">
            <iframe 
              src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarUser.email)}&ctz=UTC&showTitle=0&showPrint=0&showTabs=1&showCalendars=1`}
              style={{ border: 0 }} 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no"
              title="Google Calendar"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};
