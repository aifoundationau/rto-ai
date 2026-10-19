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
  Image as ImageIcon,
  Coins,
  Activity,
  MessageSquare,
  GraduationCap,
  TrendingUp,
  BarChart3,
  LogOut,
  User,
  Mail
} from 'lucide-react';

import { ImageManager } from './ImageManager';
import { AdminEventsManager } from './AdminEventsManager';
import { GoogleClassroomManager } from './GoogleClassroomManager';
import { TokenManager } from './TokenManager';
import { FirebaseTelemetryView } from './FirebaseTelemetryView';
import { StaffMessagingView } from './StaffMessagingView';
import { AdminCalendarManager } from './AdminCalendarManager';
import { CourseBuilderView } from './CourseBuilderView';
import { RolePermissionsManager } from './RolePermissionsManager';
import { KnowledgeFaqManager } from './KnowledgeFaqManager';
import { ApplicationDetailModal } from './ApplicationDetailModal';
import { MultilingualRagManager } from './MultilingualRagManager';
import { BlogInsightsManager } from './BlogInsightsManager';
import { CampusMetricsManager } from './CampusMetricsManager';
import { SYSTEM_ROLES, ROLE_DEFINITIONS, normalizeRole, getRoleMeta, isSuperAdmin, isProjectOwnerEmail } from '@/lib/auth/roles';
import { authenticatedFetch } from '@/lib/firebase/client';
import { ClassroomUser } from '@/components/auth/GoogleClassroomLoginModal';

interface AdminDashboardViewProps {
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
  onLogout?: () => void;
  currentUser?: ClassroomUser | null;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  apiKey = '',
  onSaveApiKey,
  onLogout,
  currentUser
}) => {
  // Defense-in-depth: Ensure unauthorized accounts cannot view Admin panel
  const isSuper = currentUser
    ? isSuperAdmin(currentUser.role, currentUser.isSuperAdmin, currentUser.email)
    : true; // fallback if rendered without prop

  const roleNormalized = (currentUser?.role || '').toLowerCase();
  const isAdministration = roleNormalized === 'administration';
  const hasAccess = isSuper || isAdministration;

  const [activeTab, setActiveTab] = useState<'account_profile' | 'campus_metrics' | 'course_builder' | 'role_permissions' | 'rag_pipeline' | 'blog_insights' | 'api_key' | 'telemetry' | 'staff_messaging' | 'applications' | 'sheets_sync' | 'events' | 'knowledge' | 'embed_code' | 'user_management' | 'images' | 'classroom' | 'tokens' | 'calendar'>(
    'account_profile'
  );

  const [isSyncingRole, setIsSyncingRole] = useState(false);
  const [roleSyncFeedback, setRoleSyncFeedback] = useState<string>('');

  const handleRefreshRole = async () => {
    if (!currentUser) return;
    setIsSyncingRole(true);
    setRoleSyncFeedback('');
    try {
      const isOwner = isProjectOwnerEmail(currentUser.email);
      const query = currentUser.email 
        ? `email=${encodeURIComponent(currentUser.email)}`
        : (currentUser.googleWorkspaceId ? `uid=${encodeURIComponent(currentUser.googleWorkspaceId)}` : '');
      const res = await fetch(`/api/users?${query}`);
      const data = await res.json();
      if (res.ok && data.user) {
        const role = isOwner ? 'superadmin' : (data.user.role || 'supporter');
        const isSuperRole = isOwner || data.user.isSuperAdmin === true || role.toLowerCase() === 'superadmin';
        const updated = {
          ...currentUser,
          role,
          isSuperAdmin: isSuperRole,
        };
        try {
          localStorage.setItem('edupulse_user', JSON.stringify(updated));
          localStorage.setItem('edupulse_is_admin', isSuperRole ? 'true' : 'false');
        } catch (e) {}
        setRoleSyncFeedback(`Live role verified from database: ${role.toUpperCase()}`);
      } else {
        setRoleSyncFeedback('Could not fetch user record from database');
      }
    } catch (err: any) {
      setRoleSyncFeedback(err.message || 'Failed to sync role');
    } finally {
      setIsSyncingRole(false);
    }
  };

  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<StudentApplication | null>(null);
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');
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
  const [faqsCount, setFaqsCount] = useState<number>(FAQS_DATA.length);

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

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = appStatusFilter === 'ALL' || app.status.toLowerCase() === appStatusFilter.toLowerCase();
    const term = appSearchTerm.toLowerCase().trim();
    if (!term) return matchesStatus;

    const matchesSearch =
      app.id.toLowerCase().includes(term) ||
      (app.personalDetails?.fullName && app.personalDetails.fullName.toLowerCase().includes(term)) ||
      (app.personalDetails?.email && app.personalDetails.email.toLowerCase().includes(term)) ||
      (app.coursePreferences?.firstChoiceCourseName && app.coursePreferences.firstChoiceCourseName.toLowerCase().includes(term)) ||
      (app.studentNumber && app.studentNumber.toLowerCase().includes(term));

    return matchesStatus && matchesSearch;
  });

  const fetchUsers = async () => {
    try {
      const res = await authenticatedFetch('/api/users');
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
      const res = await authenticatedFetch('/api/assign-role', {
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
    const matchesRole = roleFilter === 'ALL' || (u.role && u.role.toLowerCase() === roleFilter.toLowerCase());
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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4">
        {/* Top Single Line Badges */}
        <div className="flex flex-row flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="whitespace-nowrap px-3 py-1 bg-amber-500/30 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-amber-400/20 shrink-0">
            Superadmin Control Center
          </span>
          <span className="whitespace-nowrap px-3 py-1 bg-indigo-500/30 text-indigo-300 rounded-full text-xs font-semibold shrink-0">
            Executive Level Access
          </span>
          <span className="whitespace-nowrap px-3 py-1 bg-emerald-500/30 text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Google Authenticated
          </span>
        </div>

        {/* Title and Controls Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Admin & Operations Panel</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Executive control over LMS Course Builder, admissions telemetry, 24/7 Google Sheets synchronization, and student identifiers.
            </p>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer shrink-0 border border-rose-500/60 hover:shadow-rose-900/40"
              title="Log Out of your account"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span>Log Out</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('account_profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'account_profile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-indigo-300" />
            <span>Account & Profile</span>
            <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full">Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('campus_metrics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'campus_metrics' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
            <span>Front Page Metrics</span>
            <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-extrabold rounded-full">Live Hero</span>
          </button>
          <button
            onClick={() => setActiveTab('course_builder')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'course_builder' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-300" />
            <span>Course Builder</span>
            <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full">LMS</span>
          </button>
          <button
            onClick={() => setActiveTab('role_permissions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'role_permissions' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            <span>Role Permissions</span>
            <span className="px-1.5 py-0.2 bg-purple-500 text-white text-[9px] font-extrabold rounded-full">RBAC</span>
          </button>
          <button
            onClick={() => setActiveTab('rag_pipeline')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rag_pipeline' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-300" />
            <span>Multilingual RAG</span>
            <span className="px-1.5 py-0.2 bg-indigo-500 text-white text-[9px] font-extrabold rounded-full">Vector 768d</span>
          </button>
          <button
            onClick={() => setActiveTab('blog_insights')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'blog_insights' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            <span>Blog & Insights Spot</span>
            <span className="px-1.5 py-0.2 bg-pink-500 text-white text-[9px] font-extrabold rounded-full">New</span>
          </button>
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
            <span>AI Telemetry & Diagnosis</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-500/40 text-purple-200 text-[9px] font-mono font-bold">
              #ai
            </span>
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
            Knowledge & FAQs ({faqsCount})
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

      {/* Tab: Account & Profile */}
      {activeTab === 'account_profile' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-2xl shadow-md">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                  Account & Profile
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Your university profile, credentials, system permissions, and session management
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Log Out of Account</span>
              </button>
            )}
          </div>

          {/* User Identity Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative">
                  <img
                    src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'}
                    alt={currentUser?.name || 'User Profile'}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" title="Active Session" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 text-lg truncate">
                    {currentUser?.name || 'Verified User'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono truncate">
                    {currentUser?.email || 'No email attached'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 justify-center sm:justify-start">
                    <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg tracking-wider bg-indigo-600 text-white shadow-xs">
                      {isSuper ? 'Superadmin' : (currentUser?.role || 'Supporter')}
                    </span>
                    {currentUser?.isSuperAdmin && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-purple-100 text-purple-700 border border-purple-200">
                        Owner Level
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/60 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Google Workspace ID</span>
                  <span className="font-mono font-bold text-slate-700 truncate max-w-[140px]">
                    {currentUser?.googleWorkspaceId || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Auth Method</span>
                  <span className="font-semibold text-slate-800">Google OAuth 2.0</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Session Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Authenticated
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRefreshRole}
                  disabled={isSyncingRole}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSyncingRole ? 'animate-spin' : ''}`} />
                  <span>{isSyncingRole ? 'Verifying with Database...' : 'Sync Live Role & Claims'}</span>
                </button>
                {roleSyncFeedback && (
                  <p className="mt-2 text-[11px] font-semibold text-emerald-700 text-center bg-emerald-50 py-1 px-2 rounded-lg border border-emerald-200">
                    {roleSyncFeedback}
                  </p>
                )}
              </div>
            </div>

            {/* Permissions & Capabilities */}
            <div className="lg:col-span-2 space-y-5">
              <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Active Permissions & Role Capabilities</span>
                </div>
                <p className="text-xs text-slate-600">
                  Your current account authorization grant provides access to the following institutional features:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">AI Student Assistant</div>
                      <div className="text-[11px] text-slate-500">Unrestricted Q&A, syllabus lookup, course guidance</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Degree & Syllabus Catalog</div>
                      <div className="text-[11px] text-slate-500">Full access to view TEQSA & AQF accredited curricula</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Student Admissions Portal</div>
                      <div className="text-[11px] text-slate-500">Submit and track online degree applications</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start gap-2.5">
                    {hasAccess ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {hasAccess ? 'Course Builder & LMS Control' : 'LMS Authoring (Restricted)'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {hasAccess ? 'Create, modify and publish units & programs' : 'Requires Administration or Superadmin role'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start gap-2.5">
                    {hasAccess ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {hasAccess ? 'ID & User Directory Management' : 'User Management (Restricted)'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {hasAccess ? 'Assign student numbers and manage staff roles' : 'Protected student and staff directory'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start gap-2.5">
                    {isSuper ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {isSuper ? 'Executive Superadmin Operations' : 'Superadmin Tools (Restricted)'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isSuper ? 'Full telemetry, role permissions, API key management' : 'Reserved for institutional owners'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Termination Card */}
              <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Session Termination & Sign Out</span>
                  </div>
                  <p className="text-[11px] text-rose-800/80 mt-0.5">
                    Sign out securely from the Admin & Operations Panel. This revokes session storage and locks administrative tools.
                  </p>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Log Out Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Front Page Campus Metrics Manager */}
      {activeTab === 'campus_metrics' && (
        <CampusMetricsManager />
      )}

      {/* Tab: Course Builder (LMS & Website) */}
      {activeTab === 'course_builder' && (
        <CourseBuilderView apiKey={apiKeys.gemini} />
      )}

      {/* Tab: Role Permissions Manager */}
      {activeTab === 'role_permissions' && (
        <RolePermissionsManager />
      )}

      {/* Tab: Multilingual Vector RAG */}
      {activeTab === 'rag_pipeline' && (
        <MultilingualRagManager
          apiKey={apiKeys.gemini}
          currentUser={currentUser}
          isSuperAdmin={isSuper}
        />
      )}


      {/* Tab: Blog & Insights Spot Panel */}
      {activeTab === 'blog_insights' && (
        <BlogInsightsManager />
      )}

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

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('role_permissions')}
                className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Configure Role Permissions</span>
              </button>
              <button
                onClick={() => setShowRoleModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assign Role & Issue Student ID</span>
              </button>
            </div>
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

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
              {['ALL', ...SYSTEM_ROLES].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap capitalize ${
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
                        {(() => {
                          const meta = getRoleMeta(u.role);
                          return (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                            >
                              {meta.label}
                            </span>
                          );
                        })()}
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
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Submitted Student Applications</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {applications.length} Dossiers
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect complete student applications, verify credentials, and issue admissions decisions in a responsive view.
              </p>
            </div>
            <button
              onClick={fetchApplications}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Table</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <button
              type="button"
              onClick={() => setAppStatusFilter('ALL')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                appStatusFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <div className="text-[11px] opacity-75 font-semibold">All Applications</div>
              <div className="text-lg font-extrabold mt-0.5">{applications.length}</div>
            </button>

            <button
              type="button"
              onClick={() => setAppStatusFilter('Submitted')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                appStatusFilter.toLowerCase() === 'submitted'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50/50 text-emerald-900 border-emerald-100 hover:bg-emerald-100/50'
              }`}
            >
              <div className="text-[11px] opacity-75 font-semibold">Submitted</div>
              <div className="text-lg font-extrabold mt-0.5">
                {applications.filter(a => a.status === 'Submitted').length}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAppStatusFilter('Under Review')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                appStatusFilter.toLowerCase() === 'under review'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-blue-50/50 text-blue-900 border-blue-100 hover:bg-blue-100/50'
              }`}
            >
              <div className="text-[11px] opacity-75 font-semibold">Under Review</div>
              <div className="text-lg font-extrabold mt-0.5">
                {applications.filter(a => a.status === 'Under Review').length}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAppStatusFilter('Accepted')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                appStatusFilter.toLowerCase() === 'accepted'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-purple-50/50 text-purple-900 border-purple-100 hover:bg-purple-100/50'
              }`}
            >
              <div className="text-[11px] opacity-75 font-semibold">Accepted</div>
              <div className="text-lg font-extrabold mt-0.5">
                {applications.filter(a => a.status === 'Accepted').length}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAppStatusFilter('Requires Additional Documents')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                appStatusFilter.toLowerCase() === 'requires additional documents'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50/50 text-amber-900 border-amber-100 hover:bg-amber-100/50'
              }`}
            >
              <div className="text-[11px] opacity-75 font-semibold">Needs Docs</div>
              <div className="text-lg font-extrabold mt-0.5">
                {applications.filter(a => a.status === 'Requires Additional Documents').length}
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={appSearchTerm}
              onChange={(e) => setAppSearchTerm(e.target.value)}
              placeholder="Search by applicant name, email, application ID, or target degree..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {appSearchTerm && (
              <button
                type="button"
                onClick={() => setAppSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dual-View: Desktop Table & Mobile Cards */}
          {filteredApplications.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700 text-xs">No applications match your search or filter</div>
              <button
                type="button"
                onClick={() => { setAppSearchTerm(''); setAppStatusFilter('ALL'); }}
                className="px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 hover:text-indigo-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop / Tablet Table View */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Application ID</th>
                      <th className="py-3.5 px-4">Applicant Profile</th>
                      <th className="py-3.5 px-4">Target Program</th>
                      <th className="py-3.5 px-4">AI Verified Documents & Description</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredApplications.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {app.id}
                          </div>
                          {app.studentNumber && (
                            <div className="text-[10px] font-mono text-slate-400">
                              {app.studentNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{app.personalDetails.fullName || 'Unnamed Draft'}</div>
                          <div className="text-[11px] text-slate-400">{app.personalDetails.email}</div>
                          {app.personalDetails.phone && (
                            <div className="text-[10px] text-slate-400">{app.personalDetails.phone}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {app.coursePreferences.firstChoiceCourseName || 'Not Selected'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {app.coursePreferences.intakeSemester} • {app.coursePreferences.studyMode || 'Full-time'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-[280px]">
                          {(() => {
                            const acadAudits = (app.academicVerificationAudits && app.academicVerificationAudits.length > 0)
                              ? app.academicVerificationAudits
                              : (app.academicVerificationAudit ? [app.academicVerificationAudit] : []);
                            const hasDocs = app.identityVerificationAudit || acadAudits.length > 0;

                            if (!hasDocs) {
                              return (
                                <div className="text-slate-400 text-[11px] italic">
                                  <div>{app.academicDetails.highestEducation || 'Self-declared background'}</div>
                                  <div className="text-[10px] text-slate-400">No verification documents uploaded</div>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-1.5 text-[11px]">
                                {app.identityVerificationAudit && (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[10px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      <span>ID: {app.identityVerificationAudit.documentType}</span>
                                      <span className="text-emerald-700 font-mono text-[9px] bg-emerald-50 px-1 rounded">
                                        {app.identityVerificationAudit.authenticityStatus}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 line-clamp-1 italic" title={app.identityVerificationAudit.briefDescription}>
                                      &quot;{app.identityVerificationAudit.briefDescription}&quot;
                                    </p>
                                  </div>
                                )}
                                {acadAudits.map((a, i) => (
                                  <div key={a.id || i} className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[10px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                      <span>{acadAudits.length > 1 ? `Acad #${i + 1}: ` : 'Acad: '}{a.documentType}</span>
                                      <span className="text-indigo-700 font-mono text-[9px] bg-indigo-50 px-1 rounded">
                                        {a.authenticityStatus}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 line-clamp-1 italic" title={a.briefDescription}>
                                      &quot;{a.briefDescription}&quot;
                                    </p>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            app.status === 'Submitted'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : app.status === 'Under Review'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : app.status === 'Accepted'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : app.status === 'Requires Additional Documents'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApp(app);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs border border-indigo-200/60 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (md:hidden) */}
              <div className="md:hidden space-y-3">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="p-4 bg-slate-50/70 hover:bg-indigo-50/30 rounded-2xl border border-slate-200/80 space-y-3 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {app.id}
                        </span>
                        {app.studentNumber && (
                          <span className="text-[10px] font-mono text-slate-500">
                            {app.studentNumber}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        app.status === 'Submitted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : app.status === 'Under Review'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : app.status === 'Accepted'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {app.personalDetails.fullName || 'Unnamed Applicant'}
                      </h4>
                      <div className="text-[11px] text-slate-500">
                        {app.personalDetails.email} {app.personalDetails.phone ? `• ${app.personalDetails.phone}` : ''}
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs space-y-1">
                      <div className="font-bold text-indigo-950">
                        {app.coursePreferences.firstChoiceCourseName || 'Not Selected'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>{app.coursePreferences.intakeSemester}</span>
                        <span>{app.academicDetails.highestEducation} {app.academicDetails.atarOrGpa ? `(${app.academicDetails.atarOrGpa})` : ''}</span>
                      </div>
                    </div>

                    {/* Document Brief Descriptions */}
                    {(() => {
                      const acadAudits = (app.academicVerificationAudits && app.academicVerificationAudits.length > 0)
                        ? app.academicVerificationAudits
                        : (app.academicVerificationAudit ? [app.academicVerificationAudit] : []);
                      const hasDocs = app.identityVerificationAudit || acadAudits.length > 0;

                      if (!hasDocs) return null;

                      return (
                        <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 text-[11px] space-y-1.5">
                          <div className="font-extrabold text-indigo-950 text-[10px] uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>AI Verified Documents Overview</span>
                          </div>
                          {app.identityVerificationAudit && (
                            <div className="text-slate-700">
                              <span className="font-bold text-slate-900">ID: </span>
                              <span className="text-indigo-950">{app.identityVerificationAudit.briefDescription}</span>
                            </div>
                          )}
                          {acadAudits.map((a, i) => (
                            <div key={a.id || i} className="text-slate-700">
                              <span className="font-bold text-slate-900">
                                {acadAudits.length > 1 ? `Academic #${i + 1}: ` : 'Academic: '}
                              </span>
                              <span className="text-indigo-950">{a.briefDescription}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApp(app);
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Complete Application</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Events & Calendar Management */}
      {activeTab === 'events' && (
        <AdminEventsManager userPermissions={['super_admin', 'manage_events']} />
      )}

      {/* Tab 3: Knowledge Base & Multilingual FAQs */}
      {activeTab === 'knowledge' && (
        <KnowledgeFaqManager onFaqCountChange={(count) => setFaqsCount(count)} />
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

      {/* Complete Responsive Student Application Inspection Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdateStatus={handleUpdateAppStatus}
        />
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
                  value={roleForm.role.toLowerCase()}
                  onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                >
                  {SYSTEM_ROLES.map((r) => {
                    const meta = ROLE_DEFINITIONS[r];
                    return (
                      <option key={r} value={r}>
                        {meta.label} ({meta.category}) — {meta.description}
                      </option>
                    );
                  })}
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
