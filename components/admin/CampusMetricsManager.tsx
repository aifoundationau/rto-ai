import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  GraduationCap,
  Save,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Briefcase
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/firebase/client';

export interface CampusMetrics {
  totalStudents: string;
  placementRate: string;
  facultyStaff: string;
  studentsSubtitle?: string;
  placementSubtitle?: string;
  facultySubtitle?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_METRICS: CampusMetrics = {
  totalStudents: '5,000+',
  placementRate: '96%',
  facultyStaff: '350+',
  studentsSubtitle: 'Active learners across all faculties',
  placementSubtitle: 'Graduate employment within 90 days',
  facultySubtitle: 'Academic educators & operational staff',
};

export const CampusMetricsManager: React.FC = () => {
  const [metrics, setMetrics] = useState<CampusMetrics>(DEFAULT_METRICS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/campus-metrics');
      const data = await res.json();
      if (data && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.warn('[CampusMetricsManager] Failed to load metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: null, message: '' });

    try {
      const res = await authenticatedFetch('/api/campus-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: 'Front page headline metrics updated and published successfully!'
        });
        if (data.metrics) setMetrics(data.metrics);
      } else {
        throw new Error(data.error || 'Failed to save campus metrics');
      }
    } catch (err: any) {
      console.error('[CampusMetricsManager] Save error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update campus metrics'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setMetrics(DEFAULT_METRICS);
  };

  const formatStudents = (val?: string) => {
    const raw = (val || '5,000+').trim();
    return raw.toLowerCase().includes('student') ? raw : `${raw} Students`;
  };
  const formatPlacement = (val?: string) => {
    const raw = (val || '96%').trim();
    return raw.toLowerCase().includes('placement') ? raw : `${raw} Placement`;
  };
  const formatFaculty = (val?: string) => {
    const raw = (val || '350+').trim();
    return raw.toLowerCase().includes('faculty') || raw.toLowerCase().includes('staff')
      ? raw
      : `${raw} Faculty & Staff`;
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl shadow-xl border border-indigo-500/20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold tracking-wider uppercase border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>RBAC Protected: Administration & Superadmin Access Only</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Front Page Campus Metrics Manager
            </h2>
            <p className="text-slate-300 max-w-2xl text-xs sm:text-sm leading-relaxed">
              Adjust the headline statistics displayed on the website front page hero banner (Total Students, Employment Placement Percentage, and Total Faculty & Admin Staff).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={fetchMetrics}
              disabled={isLoading}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-700 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Publishing...' : 'Save & Publish Live'}</span>
            </button>
          </div>
        </div>

        {feedback.type && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/20 border border-rose-500/30 text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* 2. Side-by-Side: Form Adjustment & Live Front Page Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Adjustment Controls */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Headline Metrics Controls</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates made here publish directly to the live front-page hero banner.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Box 1: Total Students */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">1</div>
                  <span>Total Students Stat Box</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                  {['5,000+', '7,500+', '10,000+', '15,000+'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMetrics((prev) => ({ ...prev, totalStudents: val }))}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 text-[10px] font-bold cursor-pointer transition"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Student Count / Headline Value
                  </label>
                  <input
                    type="text"
                    value={metrics.totalStudents}
                    onChange={(e) => setMetrics({ ...metrics, totalStudents: e.target.value })}
                    placeholder="e.g. 5,000+"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Subtitle Text
                  </label>
                  <input
                    type="text"
                    value={metrics.studentsSubtitle || ''}
                    onChange={(e) => setMetrics({ ...metrics, studentsSubtitle: e.target.value })}
                    placeholder="Active learners across all faculties"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Box 2: Graduate Placement Rate */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">2</div>
                  <span>Graduate Placement Rate Stat Box</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                  {['94%', '96%', '98%', '99%'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMetrics((prev) => ({ ...prev, placementRate: val }))}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-emerald-50 border border-slate-200 text-emerald-700 text-[10px] font-bold cursor-pointer transition"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Employment / Placement Percentage
                  </label>
                  <input
                    type="text"
                    value={metrics.placementRate}
                    onChange={(e) => setMetrics({ ...metrics, placementRate: e.target.value })}
                    placeholder="e.g. 96%"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Subtitle Text
                  </label>
                  <input
                    type="text"
                    value={metrics.placementSubtitle || ''}
                    onChange={(e) => setMetrics({ ...metrics, placementSubtitle: e.target.value })}
                    placeholder="Graduate employment within 90 days"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Box 3: Total Faculty and Admin Staff */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">3</div>
                  <span>Total Faculty & Admin Staff Stat Box</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                  {['250+', '350+', '500+', '750+'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMetrics((prev) => ({ ...prev, facultyStaff: val }))}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-amber-50 border border-slate-200 text-amber-800 text-[10px] font-bold cursor-pointer transition"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Total Faculty & Staff Number
                  </label>
                  <input
                    type="text"
                    value={metrics.facultyStaff}
                    onChange={(e) => setMetrics({ ...metrics, facultyStaff: e.target.value })}
                    placeholder="e.g. 350+"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Subtitle Text
                  </label>
                  <input
                    type="text"
                    value={metrics.facultySubtitle || ''}
                    onChange={(e) => setMetrics({ ...metrics, facultySubtitle: e.target.value })}
                    placeholder="Academic educators & operational staff"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-700 text-slate-950 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Publishing...' : 'Save & Publish Live'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Front Page Hero Simulation */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Live Front Page Preview</span>
            </span>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Real-time update
            </span>
          </div>

          {/* Hero Simulation Box */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-800 p-6 sm:p-7 text-white space-y-6">
            <div className="space-y-2 border-b border-white/10 pb-4">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">
                Front Page Hero Floating Cards
              </span>
              <h4 className="text-base font-extrabold text-white">
                How visitors see your campus stats:
              </h4>
            </div>

            {/* The 3 Live Floating Boxes */}
            <div className="space-y-3.5">
              {/* Box 1: Total Students */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-white shadow-xl space-y-1 transform hover:scale-102 transition duration-200">
                <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-lg">
                  <Users className="w-5 h-5 shrink-0 text-indigo-400" />
                  <span>{formatStudents(metrics.totalStudents)}</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {metrics.studentsSubtitle || 'Active learners across all faculties'}
                </p>
              </div>

              {/* Box 2: Placement */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-white shadow-xl space-y-1 transform hover:scale-102 transition duration-200">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-lg">
                  <TrendingUp className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>{formatPlacement(metrics.placementRate)}</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {metrics.placementSubtitle || 'Graduate employment within 90 days'}
                </p>
              </div>

              {/* Box 3: Total Faculty and Admin Staff */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-white shadow-xl space-y-1 transform hover:scale-102 transition duration-200">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold text-lg">
                  <GraduationCap className="w-5 h-5 shrink-0 text-amber-400" />
                  <span>{formatFaculty(metrics.facultyStaff)}</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {metrics.facultySubtitle || 'Academic educators & operational staff'}
                </p>
              </div>
            </div>

            {/* Micro summary */}
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Syncing with Cloud Firestore & Site Settings</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
