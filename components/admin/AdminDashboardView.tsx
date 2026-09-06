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
  Globe
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<StudentApplication | null>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'sheets_sync' | 'events' | 'knowledge' | 'embed_code'>('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  const totalRegisteredAttendees = EVENTS_DATA.reduce((acc, e) => acc + e.registeredCount, 0);

  const embedSnippets = [
    {
      title: 'Option 1: Full-Page Iframe Embed',
      desc: 'Embed the complete AI Agent, Degree Catalog, and Application Portal inside any page.',
      code: `<iframe \n  src="https://your-domain.com/embed" \n  width="100%" \n  height="700px" \n  style="border: none; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);"\n  allow="microphone"\n></iframe>`
    },
    {
      title: 'Option 2: Floating Chat Bubble & Drawer',
      desc: 'Add a 1-click floating chat bubble to the bottom-right corner of your university website.',
      code: `<!-- Add to your website footer before </body> -->\n<div id="edupulse-bubble" style="position: fixed; bottom: 24px; right: 24px; z-index: 99999;">\n  <button onclick="document.getElementById('edupulse-frame').style.display = document.getElementById('edupulse-frame').style.display === 'none' ? 'block' : 'none'" style="background: #4f46e5; color: white; border: none; border-radius: 50px; padding: 14px 22px; font-weight: bold; cursor: pointer; box-shadow: 0 8px 20px rgba(79,70,229,0.4); display: flex; items-center; gap: 8px; font-family: sans-serif;">\n    💬 Ask Admissions AI\n  </button>\n  <iframe id="edupulse-frame" src="https://your-domain.com/embed" style="display: none; position: fixed; bottom: 85px; right: 24px; width: 400px; height: 580px; border: none; border-radius: 20px; box-shadow: 0 12px 35px rgba(0,0,0,0.2); z-index: 99999;" allow="microphone"></iframe>\n</div>`
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
            Manage 24/7 Google Sheets synchronization, review applications, and embed the bot on your website.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl">
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

      {/* Tab 2: Events Management */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Admissions Event Capacities & Schedules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EVENTS_DATA.map((ev) => (
              <div key={ev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-sm">{ev.title}</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-[10px]">
                    {ev.category}
                  </span>
                </div>
                <div className="text-slate-500">{ev.location}</div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-600">
                  <span>Registered: <strong>{ev.registeredCount}</strong> / {ev.capacity}</span>
                  <span className="text-emerald-700 font-bold">
                    {Math.round((ev.registeredCount / ev.capacity) * 100)}% Full
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
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
    </div>
  );
};
