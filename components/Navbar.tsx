import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  Bot,
  BookOpen,
  GraduationCap,
  FileText,
  Calendar,
  Sparkles,
  LogOut,
  ChevronDown,
  ShieldCheck,
  User
} from 'lucide-react';
import { isProjectOwnerEmail } from '@/lib/auth/roles';

export type NavTab = 'home' | 'courses' | 'units' | 'application' | 'events' | 'chat' | 'admin' | 'signin';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
  currentUser?: any;
  onGoogleSignIn?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  currentUser,
  onGoogleSignIn,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'courses' as NavTab, label: 'Degree Programs', icon: GraduationCap },
    { id: 'units' as NavTab, label: 'Unit Syllabuses', icon: BookOpen },
    { id: 'application' as NavTab, label: 'Application Form', icon: FileText },
    { id: 'events' as NavTab, label: 'Events & Calendar', icon: Calendar },
    { id: 'chat' as NavTab, label: 'AI Assistant', icon: Bot },
  ];

  const isSuperAdminUser =
    currentUser?.isSuperAdmin === true ||
    (currentUser?.role || '').toLowerCase() === 'superadmin' ||
    isProjectOwnerEmail(currentUser?.email);

  const canAccessAdmin =
    isSuperAdminUser ||
    (currentUser?.role || '').toLowerCase() === 'administration';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-primary-600 to-purple-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="notranslate" translate="no">
            <div className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>EduPulse</span>
              <span className="text-indigo-600">AI</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              University Admissions & Student Agent
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${isActive
                  ? 'bg-white text-indigo-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer border ${activeTab === 'admin'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200/80'
                  }`}
                title="Account menu & log out"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-white/50"
                />
                <span className="hidden sm:inline text-[11px] truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider ${isSuperAdminUser
                      ? 'bg-purple-600 text-white'
                      : (currentUser.role || '').toLowerCase() === 'chancellor'
                        ? 'bg-amber-600 text-white'
                        : (currentUser.role || '').toLowerCase() === 'president'
                          ? 'bg-sky-600 text-white'
                          : (currentUser.role || '').toLowerCase() === 'ceo'
                            ? 'bg-blue-700 text-white'
                            : (currentUser.role || '').toLowerCase() === 'coo'
                              ? 'bg-indigo-600 text-white'
                              : (currentUser.role || '').toLowerCase() === 'cfo'
                                ? 'bg-emerald-700 text-white'
                                : (currentUser.role || '').toLowerCase() === 'accounting'
                                  ? 'bg-teal-600 text-white'
                                  : (currentUser.role || '').toLowerCase() === 'administration'
                                    ? 'bg-slate-700 text-white'
                                    : (currentUser.role || '').toLowerCase() === 'teacher'
                                      ? 'bg-orange-600 text-white'
                                      : (currentUser.role || '').toLowerCase() === 'student'
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-emerald-600 text-white'
                    }`}
                >
                  {isSuperAdminUser
                    ? 'Superadmin'
                    : (currentUser.role || 'Supporter')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Account Dropdown Menu with Log Out */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <img
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {currentUser.email}
                      </div>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono uppercase">
                          {isSuperAdminUser ? 'superadmin' : (currentUser.role || 'supporter')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5 text-xs">
                    {canAccessAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onSelectTab('admin');
                        }}
                        className={`w-full px-3 py-2.5 rounded-xl text-left font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${activeTab === 'admin'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-purple-700 hover:bg-purple-50'
                          }`}
                      >
                        <ShieldCheck className={`w-4 h-4 ${activeTab === 'admin' ? 'text-white' : 'text-purple-600'}`} />
                        <span>Admin & Operations Panel</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSelectTab('signin');
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${activeTab === 'signin'
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>Account & Profile</span>
                    </button>
                  </div>

                  <div className="p-1.5 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left font-bold text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn ? onGoogleSignIn : () => onSelectTab('signin')}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-indigo-400 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer group"
              title="Register or Log On with Google"
            >
              <svg className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Register / Log On</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Scrollable Bar */}
      <div className="lg:hidden px-4 py-2 border-t border-slate-100 overflow-x-auto bg-slate-50">
        <div className="flex items-center gap-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${isActive
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
