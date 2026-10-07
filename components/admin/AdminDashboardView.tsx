import React, { useState, useEffect } from 'react';
import { StudentApplication } from '@/data/applications';
import { COURSES_DATA } from '@/data/courses';
import { UNITS_DATA } from '@/data/units';
import { EVENTS_DATA } from '@/data/events';
import { FAQS_DATA } from '@/data/faqs';
import {
  ShieldAlert,
  Users,
  FileText,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  Check,
  X,
  Sparkles,
  HelpCircle,
  Sheet,
  RefreshCw,
  Download,
  ExternalLink,
  AlertCircle,
  Code,
  Copy,
  Globe,
  ShieldCheck,
  UserPlus,
  Lock,
  Key,
  LogOut,
  Image as ImageIcon,
  Coins,
  Activity,
  MessageSquare
} from 'lucide-react';

import { ImageManager } from './ImageManager';
import { AdminEventsManager } from './AdminEventsManager';
import { GoogleClassroomManager } from './GoogleClassroomManager';
import { TokenManager } from './TokenManager';
import { FirebaseTelemetryView } from './FirebaseTelemetryView';
import { StaffMessagingView } from './StaffMessagingView';
import { AdminCalendarManager } from './AdminCalendarManager';

interface AdminDashboardViewProps {
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
  onLogout?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  apiKey = '',
  onSaveApiKey,
  onLogout
}) => {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<StudentApplication | null>(null);
  const [activeTab, setActiveTab] = useState<'api_key' | 'telemetry' | 'staff_messaging' | 'applications' | 'sheets_sync' | 'events' | 'knowledge' | 'embed_code' | 'user_management' | 'images' | 'classroom' | 'tokens' | 'calendar'>('telemetry');
  const [apiKeys, setApiKeys] = useState({
    gemini: apiKey || '',
    firebase: '',
    classroom: '',
    pexels: ''
  });

  useEffect(() => {
    try {
      const storedFirebaseKey = localStorage.getItem('firebase_api_key');
      const storedClassroomKey = localStorage.getItem('classroom_api_key');
      const storedPexelsKey = localStorage.getItem('pexels_api_key');
      setApiKeys(prev => ({
        ...prev,
        ...(storedFirebaseKey ? { firebase: storedFirebaseKey } : {}),
        ...(storedClassroomKey ? { classroom: storedClassroomKey } : {}),
        ...(storedPexelsKey ? { pexels: storedPexelsKey } : {})
      }));
    } catch (e) {}
  }, []);
  const [keySavedMessage, setKeySavedMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // User & Student Number Management State
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [assignRoleSuccess, setAssignRoleSuccess] = useState('');
  const [assignRoleError, setAssignRoleError] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({
    uid: '',
    fullName: '',
    email: '',
    role: 'STUDENT',
    dept: 'School of Computer Science & Engineering',
  });

  // Google Sheets Sync State
  const [sheetInput, setSheetInput] = useState('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [syncStatus, setSyncStatus] = useState<any>({
    lastSyncedAt: null,
    coursesCount: COURSES_DATA.length,
    unitsCount: UNITS_DATA.length,
    faqsCount: FAQS_DATA.length,
    source: 'default_database',
    status: 'idle'
  });

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (data.applications) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/sheets/sync');
      const data = await res.json();
      if (data) {
        setSyncStatus(data);
        if (data.sheetId) setSheetInput(data.sheetId);
      }
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchUsers();
    fetchSyncStatus();
  }, []);

  const handleManualSync = async () => {
    if (!sheetInput.trim()) return;
    setIsSyncing(true);
    setSyncFeedback({ type: null, message: '' });

    try {
      const res = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetIdOrUrl: sheetInput.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSyncFeedback({ type: 'success', message: data.message });
        setSyncStatus(data.syncStatus);
      } else {
        setSyncFeedback({ type: 'error', message: data.message || data.error || 'Failed to sync with Google Sheet.' });
      }
    } catch (err: any) {
      setSyncFeedback({ type: 'error', message: err.message || 'Network error during Google Sheets sync.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadTemplate = (type: 'courses' | 'units' | 'faqs') => {
    window.open(`/api/sheets/sync?template=${type}`, '_blank');
  };

  const handleCopyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleUpdateAppStatus = async (appId: string, newStatus: StudentApplication['status']) => {
    const updatedApps = applications.map((app) => {
      if (app.id === appId) {
        const updated = { ...app, status: newStatus, updatedAt: new Date().toISOString() };
        fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application: updated })
        });
        return updated;
      }
      return app;
    });

    setApplications(updatedApps);
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, status: newStatus });
    }
  };

  const handleAssignRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssigningRole(true);
    setAssignRoleSuccess('');
    setAssignRoleError('');

    try {
      const targetUid = roleForm.uid.trim() || `user_${Date.now()}`;
      const res = await fetch('/api/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: targetUid,
          role: roleForm.role,
          dept: roleForm.dept,
          fullName: roleForm.fullName,
          email: roleForm.email,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAssignRoleSuccess(
          `Successfully assigned role ${data.role}! ${
            data.studentNumber ? `Generated Student Number: ${data.studentNumber}` : ''
          }`
        );
        setShowRoleModal(false);
        fetchUsers();
      } else {
        setAssignRoleError(data.error || 'Failed to assign role');
      }
    } catch (err: any) {
      setAssignRoleError(err.message || 'Error executing role assignment');
    } finally {
      setIsAssigningRole(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const term = userSearchTerm.toLowerCase().trim();
    if (!term) return matchesRole;

    const matchesSearch =
      (u.studentNumber && u.studentNumber.toLowerCase().includes(term)) ||
      (u.displayName && u.displayName.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.dept && u.dept.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term));

    return matchesRole && matchesSearch;
  });

  const totalRegisteredAttendees = EVENTS_DATA.reduce((acc, e) => acc + e.registeredCount, 0);

  const embedSnippets = [
    {
      title: 'Option 1: Full-Page Iframe Embed',
      desc: 'Embed the complete AI Agent, Degree Catalog, and Application Portal inside any page.',
      code: '<' + 'iframe src="https://your-domain.com/embed" width="100%" height="700px" style="border:none; border-radius:16px;" allow="microphone"><' + '/iframe>'
    },
    {
      title: 'Option 2: Floating Chat Bubble & Drawer',
      desc: 'Add a 1-click floating chat bubble to the bottom-right corner of your university website.',
      code: '<' + 'div id="edupulse-bubble" style="position: fixed; bottom: 24px; right: 24px; z-index: 99999;"><' + 'iframe id="edupulse-frame" src="https://your-domain.com/embed" style="width: 400px; height: 580px; border: none;"><' + '/iframe><' + '/div>'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-amber-500/30 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-amber-400/20">
              Staff Portal
            </span>
            <span className="px-3 py-1 bg-indigo-500/30 text-indigo-300 rounded-full text-xs font-semibold">
              Live Admissions Admin
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Admissions & Agent Management Dashboard
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Manage student numbers, 24/7 Google Sheets synchronization, applications, and custom role claims.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('api_key')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'api_key' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API</span>
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'telemetry' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-300" />
            <span>Firebase Telemetry</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>
          <button
            onClick={() => setActiveTab('staff_messaging')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'staff_messaging' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-300" />
            <span>Staff Messages</span>
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-extrabold rounded-full">2</span>
          </button>
          <button
            onClick={() => setActiveTab('user_management')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'user_management' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student & Staff IDs ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'applications' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('sheets_sync')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'sheets_sync' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sheet className="w-3.5 h-3.5" />
            <span>Google Sheets (24/7)</span>
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'images' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Images Folders</span>
          </button>
          <button
            onClick={() => setActiveTab('classroom')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'classroom' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Google Classroom</span>
          </button>
          <button
            onClick={() => setActiveTab('embed_code')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'embed_code' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Embed on Website</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'events' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Events & RSVPs
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'knowledge' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Knowledge & FAQs ({FAQS_DATA.length})
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'tokens' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Tokens / Emergency Fund</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Google Calendar</span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/20 transition-all flex items-center gap-1.5 ml-auto"
              title="Log out from Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <FileText className="w-4 h-4 text-indigo-600" />
            Total Applications
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{applications.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Auto-synced from AI Bot</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Sheet className="w-4 h-4 text-emerald-600" />
            Live Courses & Units
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{syncStatus.coursesCount} / {syncStatus.unitsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {syncStatus.source === 'google_sheets_live' ? 'Synced with Google Sheets' : 'Verified Seed Catalog'}
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Calendar className="w-4 h-4 text-purple-600" />
            Event Attendees
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{totalRegisteredAttendees}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across admissions sessions</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Globe className="w-4 h-4 text-blue-500" />
            Live Deployment
          </div>
          <div className="text-sm font-bold text-slate-800 mt-2 capitalize flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Next.js Production Ready
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Vercel / Netlify / Embed
          </div>
        </div>
      </div>

      {/* Tab: API Configuration */}
      {activeTab === 'api_key' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                  API Configuration
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Manage API keys for external services
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {keySavedMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{keySavedMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Gemini API */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-slate-800">
                      Google Gemini API
                    </label>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      apiKeys.gemini ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {apiKeys.gemini ? 'Custom Key' : 'SuperAdmin Default'}
                    </span>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={apiKeys.gemini}
                      onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                      placeholder="AIzaSy... (Leave blank to use Default)"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Used for AI assistant operations. If left empty, requests are routed using the SuperAdmin API Key.
                  </p>
                </div>
              </div>

              {/* Google Classroom API */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-slate-800">
                      Google Classroom API
                    </label>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      apiKeys.classroom ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {apiKeys.classroom ? 'Configured' : 'Not Configured'}
                    </span>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={apiKeys.classroom}
                      onChange={(e) => setApiKeys({...apiKeys, classroom: e.target.value})}
                      placeholder="Enter Google Classroom API Key"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Used for integrating with Google Classroom courses and assignments.
                  </p>
                </div>
              </div>

              {/* Firebase API */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-slate-800">
                      Firebase API
                    </label>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      apiKeys.firebase ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {apiKeys.firebase ? 'Configured' : 'Using .env Default'}
                    </span>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={apiKeys.firebase}
                      onChange={(e) => setApiKeys({...apiKeys, firebase: e.target.value})}
                      placeholder="AIzaSy... (Firebase Web API Key)"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Used for Firebase Auth, Firestore, and Storage. Falls back to .env if empty.
                  </p>
                </div>
              </div>

              {/* Pexels API */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-slate-800">
                      Pexels API
                    </label>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      apiKeys.pexels ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {apiKeys.pexels ? 'Configured' : 'Not Configured'}
                    </span>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={apiKeys.pexels}
                      onChange={(e) => setApiKeys({...apiKeys, pexels: e.target.value})}
                      placeholder="Enter Pexels API Key"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Used for stock photos via api.pexels.com/v1/. Required for image search features.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onSaveApiKey) onSaveApiKey(apiKeys.gemini.trim());
                  try { 
                    localStorage.setItem('edupulse_api_key', apiKeys.gemini.trim()); 
                    localStorage.setItem('firebase_api_key', apiKeys.firebase.trim());
                    localStorage.setItem('classroom_api_key', apiKeys.classroom.trim());
                    localStorage.setItem('pexels_api_key', apiKeys.pexels.trim());
                  } catch {}
                  setKeySavedMessage('All API Keys saved successfully!');
                  setTimeout(() => setKeySavedMessage(''), 2500);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save All API Keys</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Universal Firebase Telemetry */}
      {activeTab === 'telemetry' && <FirebaseTelemetryView />}

      {/* Tab: User & Student ID Management */}
      {activeTab === 'user_management' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-lg">University User & Student ID Management</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Superadmin, Registrar, and Academic Staff user management table. Displays immutable server-generated Student Numbers (<code className="font-mono text-indigo-600 bg-indigo-50 px-1 rounded">STU-YYYY-XXXXX</code>) and Firebase Auth Custom Claims.
              </p>
            </div>

            <button
              onClick={() => setShowRoleModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign Role & Issue Student ID</span>
            </button>
          </div>

          {/* Search & Filter Control Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search Student Number (STU-2026-XXXXX), Name, Email..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['ALL', 'STUDENT', 'ACADEMIC_STAFF', 'REGISTRAR', 'SUPERADMIN'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    roleFilter === role
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Alert / Feedback message */}
          {assignRoleSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{assignRoleSuccess}</span>
            </div>
          )}
          {assignRoleError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{assignRoleError}</span>
            </div>
          )}

          {/* User Management Table */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Student Number</th>
                  <th className="p-3.5">User Name & Email</th>
                  <th className="p-3.5">Role (Auth Claim)</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Year / Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No matching user or student records found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                    <tr key={u.uid || u.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        {u.studentNumber ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-950 font-mono font-bold rounded-lg text-xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{u.studentNumber}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">N/A (Staff)</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{u.displayName || u.fullName || 'User Record'}</div>
                        <div className="text-slate-500 text-[11px]">{u.email}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            u.role === 'STUDENT'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : u.role === 'SUPERADMIN'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'REGISTRAR'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {u.role || 'STUDENT'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-[200px] truncate">
                        {u.dept || 'Computer Science & Engineering'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{u.enrollmentYear || 2026}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Active Profile</div>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setRoleForm({
                              uid: u.uid || u.id || '',
                              fullName: u.displayName || u.fullName || '',
                              email: u.email || '',
                              role: u.role || 'STUDENT',
                              dept: u.dept || 'School of Computer Science & Engineering',
                            });
                            setShowRoleModal(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-semibold transition-colors text-[11px]"
                        >
                          Reassign Role
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Embed on Website Code Generator */}
      {activeTab === 'embed_code' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                <Code className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-slate-900 text-lg">Embed EduPulse AI in Your University Website</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Copy and paste these snippets to add the interactive AI Student Assistant to any existing website (WordPress, Webflow, Squarespace, React, or custom HTML).
            </p>
          </div>

          <div className="space-y-6">
            {embedSnippets.map((snip, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{snip.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{snip.desc}</p>
                  </div>
                  <button
                    onClick={() => handleCopyCode(snip.code, idx)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {snip.code}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Google Sheets 24/7 Sync Management */}
      {activeTab === 'sheets_sync' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Sheet className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-lg">Google Sheets 24/7 Live Course & Unit Editor</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Allow university faculty and academic coordinators to edit course descriptions, entry requirements, unit syllabuses, prerequisites, and lecture schedules in Google Sheets 24/7. The AI Agent and course finder will instantly read updates!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                syncStatus.source === 'google_sheets_live'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${syncStatus.source === 'google_sheets_live' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {syncStatus.source === 'google_sheets_live' ? 'Google Sheets Connected' : 'Default In-Memory Store'}
              </span>
            </div>
          </div>

          {/* Sync Input Form */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Google Sheet ID or Full Published Spreadsheet URL:
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                onClick={handleManualSync}
                disabled={isSyncing || !sheetInput.trim()}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now (24/7)'}</span>
              </button>
            </div>

            {syncFeedback.message && (
              <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2 ${
                syncFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {syncFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>{syncFeedback.message}</div>
              </div>
            )}
          </div>

          {/* Download Templates Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Download Starter Google Sheet CSV Templates:
            </h4>
            <p className="text-xs text-slate-500">
              Download these pre-formatted CSV files with sample university courses, unit syllabuses, and FAQs. Open them in Google Sheets to start editing immediately:
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={() => handleDownloadTemplate('courses')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Download Courses Template (.csv)</span>
              </button>
              <button
                onClick={() => handleDownloadTemplate('units')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Unit Syllabuses Template (.csv)</span>
              </button>
              <button
                onClick={() => handleDownloadTemplate('faqs')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download FAQs Template (.csv)</span>
              </button>
            </div>
          </div>

          {/* 3-Step Setup Instructions for Staff */}
          <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100/80 space-y-3 text-xs">
            <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              How Staff Can Edit Data 24/7 in Google Sheets:
            </h4>
            <ol className="space-y-2 text-indigo-900 list-decimal list-inside leading-relaxed">
              <li>
                <strong>Create / Open Google Sheet</strong>: Create a Google Sheet in your university Google Drive with 3 tabs named <code className="bg-white px-1.5 py-0.5 rounded text-indigo-700 font-mono font-semibold">Courses</code>, <code className="bg-white px-1.5 py-0.5 rounded text-indigo-700 font-mono font-semibold">Units</code>, and <code className="bg-white px-1.5 py-0.5 rounded text-indigo-700 font-mono font-semibold">FAQs</code> (or import our starter templates above).
              </li>
              <li>
                <strong>Share Sheet with Link</strong>: In Google Sheets, click <em>Share &rarr; General access &rarr; Anyone with the link can view</em>.
              </li>
              <li>
                <strong>Sync with EduPulse AI</strong>: Paste the Google Sheet URL above and click <strong>"Sync Now"</strong>. Academic coordinators can edit details anytime, and students will immediately see the changes!
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab 1: Applications Management */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
            <h3 className="font-bold text-slate-800 text-sm">Submitted Student Applications</h3>
            <button
              onClick={fetchApplications}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Refresh Table
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Application ID</th>
                  <th className="py-3.5 px-4">Applicant Name</th>
                  <th className="py-3.5 px-4">Applied Course</th>
                  <th className="py-3.5 px-4">Qualifications</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{app.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{app.personalDetails.fullName || 'Unnamed Draft'}</div>
                      <div className="text-[11px] text-slate-400">{app.personalDetails.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{app.coursePreferences.firstChoiceCourseName || 'Not Selected'}</div>
                      <div className="text-[11px] text-slate-400">{app.coursePreferences.intakeSemester}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{app.academicDetails.highestEducation || '—'}</div>
                      <div className="text-[11px] text-slate-400 font-semibold">
                        {app.academicDetails.atarOrGpa ? `Score: ${app.academicDetails.atarOrGpa}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        app.status === 'Submitted'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.status === 'Under Review'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : app.status === 'Accepted'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Events & Calendar Management */}
      {activeTab === 'events' && (
        <AdminEventsManager userPermissions={['super_admin', 'manage_events']} />
      )}

      {/* Tab 3: Knowledge Base & FAQs */}
      {activeTab === 'knowledge' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">University Knowledge Base & FAQ Items</h3>
          <div className="space-y-3">
            {FAQS_DATA.map((faq) => (
              <div key={faq.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-[10px] border border-indigo-100">
                    {faq.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{faq.question}</h4>
                </div>
                <p className="text-slate-600 leading-relaxed pl-2 border-l-2 border-indigo-200">{faq.answer}</p>
                <div className="text-[10px] text-slate-400">
                  Keywords: {faq.keywords.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Images Folders */}
      {activeTab === 'images' && (
        <ImageManager />
      )}

      {/* Tab 5: Google Classroom API Management */}
      {activeTab === 'classroom' && (
        <GoogleClassroomManager userPermissions={['super_admin', 'manage_google_classroom']} />
      )}

      {/* Tab: Token Management */}
      {activeTab === 'tokens' && (
        <TokenManager />
      )}

      {/* Tab: Staff Messages & Intercom */}
      {activeTab === 'staff_messaging' && (
        <StaffMessagingView />
      )}

      {/* Inspect Application Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Application File Inspection
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedApp.personalDetails.fullName} ({selectedApp.id})
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Application Data Grid */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400">Applicant Email:</span>
                  <div className="font-semibold text-slate-800">{selectedApp.personalDetails.email || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <div className="font-semibold text-slate-800">{selectedApp.personalDetails.phone || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Citizenship:</span>
                  <div className="font-semibold text-slate-800">{selectedApp.personalDetails.citizenship || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Country of Residence:</span>
                  <div className="font-semibold text-slate-800">{selectedApp.personalDetails.countryOfResidence || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400">Target Degree:</span>
                  <div className="font-bold text-indigo-700 text-sm">
                    {selectedApp.coursePreferences.firstChoiceCourseName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Intake & Commencing Year:</span>
                  <div className="font-semibold text-slate-800">
                    {selectedApp.coursePreferences.intakeSemester} {selectedApp.coursePreferences.commencingYear}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Academic Background:</span>
                  <div className="font-semibold text-slate-800">
                    {selectedApp.academicDetails.highestEducation} (Score: {selectedApp.academicDetails.atarOrGpa || 'N/A'})
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">English Proficiency:</span>
                  <div className="font-semibold text-slate-800">
                    {selectedApp.academicDetails.englishProficiencyTest || 'Native / Verified'}
                  </div>
                </div>
              </div>

              {selectedApp.statementsAndDocuments.statementOfPurpose && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Statement of Purpose:</span>
                  <p className="mt-1 text-slate-700 italic leading-relaxed">
                    &quot;{selectedApp.statementsAndDocuments.statementOfPurpose}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Status Change Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Update Decision:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateAppStatus(selectedApp.id, 'Accepted')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Issue Letter of Offer (Accept)</span>
                </button>
                <button
                  onClick={() => handleUpdateAppStatus(selectedApp.id, 'Requires Additional Documents')}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Request Additional Docs
                </button>
                <button
                  onClick={() => handleUpdateAppStatus(selectedApp.id, 'Under Review')}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Set Under Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Assign Role & Issue Student ID Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Auth Custom Claims & Student ID Generator
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Assign University Role
                </h3>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignRoleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target User UID *</label>
                <input
                  type="text"
                  required
                  value={roleForm.uid}
                  onChange={(e) => setRoleForm({ ...roleForm, uid: e.target.value })}
                  placeholder="e.g. L5euSJAfNKdDOX6mT0qmrCGjUA53 or stu_new_01"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={roleForm.fullName}
                  onChange={(e) => setRoleForm({ ...roleForm, fullName: e.target.value })}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={roleForm.email}
                  onChange={(e) => setRoleForm({ ...roleForm, email: e.target.value })}
                  placeholder="e.g. alex.rivera@student.edupulse.edu.au"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">University Role *</label>
                <select
                  value={roleForm.role}
                  onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                >
                  <option value="STUDENT">STUDENT (Auto-generates STU-2026-XXXXX)</option>
                  <option value="ACADEMIC_STAFF">ACADEMIC_STAFF</option>
                  <option value="REGISTRAR">REGISTRAR</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
                {roleForm.role === 'STUDENT' && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Assigning STUDENT role will atomically assign a unique STU-YYYY-XXXXX Student Number.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department / Faculty</label>
                <input
                  type="text"
                  value={roleForm.dept}
                  onChange={(e) => setRoleForm({ ...roleForm, dept: e.target.value })}
                  placeholder="e.g. School of Computer Science & Engineering"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigningRole}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {isAssigningRole ? 'Assigning...' : 'Assign Role & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Tab: Google Calendar */}
      {activeTab === 'calendar' && <AdminCalendarManager />}
    </div>
  );
};
