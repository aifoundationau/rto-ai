import React from 'react';
import {
  Home,
  Bot,
  BookOpen,
  GraduationCap,
  FileText,
  Calendar,
  Shield,
  Settings,
  Sparkles,
  LogIn
} from 'lucide-react';

export type NavTab = 'home' | 'courses' | 'units' | 'application' | 'events' | 'chat' | 'admin' | 'signin';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
  currentUser?: any;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  currentUser,
}) => {
  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'courses' as NavTab, label: 'Degree Programs', icon: GraduationCap },
    { id: 'units' as NavTab, label: 'Unit Syllabuses', icon: BookOpen },
    { id: 'application' as NavTab, label: 'Application Form', icon: FileText },
    { id: 'events' as NavTab, label: 'Events & Calendar', icon: Calendar },
    { id: 'chat' as NavTab, label: 'AI Assistant', icon: Bot },
    ...(!currentUser ? [{ id: 'signin' as NavTab, label: 'Sign In', icon: LogIn }] : []),
  ];

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
          <div>
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
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="Open Settings & Admin Portal"
            >
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-5 h-5 rounded-full object-cover" />
              <span className="hidden sm:inline text-[11px] truncate max-w-[120px]">
                {currentUser.name}
              </span>
            </button>
          ) : (
            <button
              onClick={() => onSelectTab('signin')}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs hover:border-slate-400 cursor-pointer"
              title="Sign in with Google"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign In</span>
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
