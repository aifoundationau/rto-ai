import React from 'react';
import {
  Bot,
  BookOpen,
  GraduationCap,
  FileText,
  Calendar,
  Shield,
  Settings,
  Sparkles
} from 'lucide-react';

export type NavTab = 'chat' | 'courses' | 'units' | 'application' | 'events' | 'admin';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
  onOpenClassroomLogin?: () => void;
  applicationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenClassroomLogin,
}) => {
  const navItems = [
    { id: 'courses' as NavTab, label: 'Degree Programs', icon: GraduationCap },
    { id: 'units' as NavTab, label: 'Unit Syllabuses', icon: BookOpen },
    { id: 'application' as NavTab, label: 'Application Form', icon: FileText },
    { id: 'events' as NavTab, label: 'Events & Calendar', icon: Calendar },
    { id: 'chat' as NavTab, label: 'AI Assistant', icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('chat')}
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
          {/* Google Classroom Logon Icon & Button for Teachers & Students */}
          <button
            onClick={onOpenClassroomLogin}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
            title="Log in to Google Classroom as Teacher or Student"
          >
            <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold text-[10px] shadow-2xs">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="hidden sm:inline">Classroom</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200/60"
            title="Settings & Admin Portal"
          >
            <Settings className="w-4 h-4" />
          </button>
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
