import React, { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  ShieldCheck,
  RefreshCw,
  Send,
  CheckCircle2,
  Users,
  MessageSquare,
  FileText,
  Coins,
  Calendar,
  Layers,
  Clock,
  ArrowUpRight,
  Filter
} from 'lucide-react';

interface TelemetryLog {
  id: string;
  category: 'AUTH' | 'APPLICATION' | 'CHAT' | 'TOKEN' | 'CALENDAR' | 'NAVIGATION' | 'ADMIN';
  action: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export const FirebaseTelemetryView: React.FC = () => {
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isSendingPing, setIsSendingPing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setMetrics(data.metrics || null);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleSendPing = async () => {
    setIsSendingPing(true);
    try {
      const res = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'ADMIN',
          action: 'DIAGNOSTIC_PING_SENT',
          userEmail: 'admin@ai-foundation.org',
          userRole: 'SUPERADMIN',
          metadata: {
            origin: 'FirebaseTelemetryView',
            status: 'HEALTHY',
            clientTime: new Date().toISOString(),
          },
        }),
      });
      if (res.ok) {
        await fetchTelemetry();
      }
    } catch (err) {
      console.error('Diagnostic ping failed:', err);
    } finally {
      setIsSendingPing(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterCategory === 'ALL') return true;
    return log.category === filterCategory;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'AUTH':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'APPLICATION':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CHAT':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'TOKEN':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'CALENDAR':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'NAVIGATION':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Firebase Firestore Active Collection Engine
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-400" />
              Universal Data Telemetry & Activity Stream
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Real-time audit log streaming all interactions, chat advisor prompts, course selections, application submissions, and TokenPulse transactions directly into Firestore.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSendPing}
              disabled={isSendingPing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingPing ? 'Pinging...' : 'Send Live Test Ping'}</span>
            </button>

            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Credentials metadata bar */}
        <div className="mt-5 pt-4 border-t border-indigo-900/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-slate-500 font-medium">Project ID:</span>
            <span className="font-mono text-indigo-300 font-semibold">ai-foundation-firebase</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-slate-500 font-medium">Service Account:</span>
            <span className="font-mono text-indigo-300 truncate" title="firebase-adminsdk-fbsvc@ai-foundation-firebase.iam.gserviceaccount.com">
              firebase-adminsdk-fbsvc@...
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 sm:justify-end">
            <span className="text-slate-500 font-medium">Last Synced:</span>
            <span className="font-mono text-emerald-400">{lastUpdated || 'Initialising...'}</span>
          </div>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Total Events</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {metrics?.totalEvents || logs.length}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
            <CheckCircle2 className="w-3 h-3" /> Live Firestore Sync
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Applications</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {metrics?.categories?.APPLICATION || logs.filter(l => l.category === 'APPLICATION').length}
          </p>
          <span className="text-[10px] text-slate-500">Drafts & Submissions</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>AI Chat Turns</span>
            <MessageSquare className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {metrics?.categories?.CHAT || logs.filter(l => l.category === 'CHAT').length}
          </p>
          <span className="text-[10px] text-slate-500">Advisor Inquiries</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Tokens / Grants</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {metrics?.categories?.TOKEN || logs.filter(l => l.category === 'TOKEN').length}
          </p>
          <span className="text-[10px] text-slate-500">Lot Purchases & P2P</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Auth / Logins</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {metrics?.categories?.AUTH || logs.filter(l => l.category === 'AUTH').length}
          </p>
          <span className="text-[10px] text-slate-500">Classroom & Admin</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Calendar / Views</span>
            <Calendar className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {(metrics?.categories?.CALENDAR || 0) + (metrics?.categories?.NAVIGATION || 0) || logs.filter(l => l.category === 'CALENDAR' || l.category === 'NAVIGATION').length}
          </p>
          <span className="text-[10px] text-slate-500">RSVPs & Nav Views</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['ALL', 'APPLICATION', 'CHAT', 'TOKEN', 'AUTH', 'CALENDAR', 'NAVIGATION', 'ADMIN'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredLogs.length}</span> recorded events
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Live Event Stream (Firestore `activity_logs`)
          </h3>
          <span className="text-xs text-slate-400">
            Auto-refreshing every 10s
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Layers className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
            <p className="text-sm font-semibold">No telemetry records match this category.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Interact with the application, chat with the AI Advisor, or click "Send Live Test Ping" to log actions.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User / Email</th>
                  <th className="py-3 px-4">Metadata Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log, idx) => {
                  const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A';

                  return (
                    <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getCategoryBadge(log.category)}`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap font-mono text-[11px]">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {log.userEmail ? (
                          <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {log.userEmail}
                          </span>
                        ) : log.userId ? (
                          <span className="font-mono text-slate-500 text-[11px]">{log.userId}</span>
                        ) : (
                          <span className="text-slate-400 italic">Guest Session</span>
                        )}
                        {log.userRole && (
                          <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] bg-slate-200 text-slate-700 font-bold">
                            {log.userRole}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <pre className="font-mono text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 overflow-x-auto max-h-20">
                            {JSON.stringify(log.metadata, null, 1)}
                          </pre>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
