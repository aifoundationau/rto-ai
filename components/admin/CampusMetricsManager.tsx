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
  Briefcase,
  AlertTriangle,
  Flame,
  CloudRain,
  CloudLightning,
  ShieldAlert,
  Radio,
  Trash2,
  BellRing,
  Clock,
  Wind
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/firebase/client';

export interface CampusMetrics {
  heroBadgeText?: string;
  totalStudents: string;
  placementRate: string;
  facultyStaff: string;
  studentsSubtitle?: string;
  placementSubtitle?: string;
  facultySubtitle?: string;
  // Severe Emergency Update (Weather / Environmental Hazard)
  emergencyAlert?: string;
  emergencyTitle?: string;
  emergencyActive?: boolean;
  emergencySeverity?: 'critical' | 'severe' | 'warning';
  emergencyUpdatedAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_METRICS: CampusMetrics = {
  heroBadgeText: 'Your Future is Now • Powered by Gemini',
  totalStudents: '5,000+',
  placementRate: '96%',
  facultyStaff: '350+',
  studentsSubtitle: 'Active learners across all faculties',
  placementSubtitle: 'Graduate employment within 90 days',
  facultySubtitle: 'Academic educators & operational staff',
  emergencyAlert: '',
  emergencyTitle: '',
  emergencyActive: false,
  emergencySeverity: 'severe',
  emergencyUpdatedAt: '',
};

export const CampusMetricsManager: React.FC = () => {
  const [metrics, setMetrics] = useState<CampusMetrics>(DEFAULT_METRICS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEmergencyConfirmed, setIsEmergencyConfirmed] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  const EMERGENCY_PRESETS = [
    {
      label: 'Severe Storm & Flooding',
      icon: CloudLightning,
      severity: 'severe' as const,
      title: 'Severe Weather Warning: Gale Winds & Flash Flooding',
      text: 'Bureau of Meteorology (BOM) has issued an urgent Severe Weather Warning for damaging winds and flash flooding across campus precincts. All physical on-campus classes are transitioning to online delivery immediately. Essential staff only. Stay indoors and avoid travelling.',
    },
    {
      label: 'Bushfire Smoke & Air Hazard',
      icon: Flame,
      severity: 'warning' as const,
      title: 'Air Quality & Environmental Smoke Advisory',
      text: 'Severe bushfire smoke has triggered a hazardous air quality alert across metropolitan campuses. Outdoor facilities, sports ovals, and open-air concourses are closed today. Filtered air conditioning study zones remain open in the Central Library.',
    },
    {
      label: 'Cyclone & High Gale Watch',
      icon: Wind,
      severity: 'critical' as const,
      title: 'Tropical Cyclone Warning: Campus Facility Closure',
      text: 'Category 2/3 tropical cyclone conditions forecasted within 6 hours. Complete campus closure is in effect. All exams and lectures are postponed. Immediate shelter protocols activated.',
    },
    {
      label: 'Regional Power Grid Outage',
      icon: AlertTriangle,
      severity: 'severe' as const,
      title: 'Power Substation Interruption: Precincts A & B',
      text: 'Unplanned high-voltage substation outage has suspended power to Academic Precincts A and B. IT emergency generators are online. Affected buildings are closed for safety until technicians complete restoration.',
    },
  ];

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/campus-metrics');
      const data = await res.json();
      if (data && data.metrics) {
        setMetrics(data.metrics);
        if (data.metrics.emergencyActive) {
          setIsEmergencyConfirmed(true);
        }
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
      const hasEmergencyText = Boolean(metrics.emergencyAlert && metrics.emergencyAlert.trim().length > 0);
      const isEmergencyActive = Boolean(hasEmergencyText && isEmergencyConfirmed);

      const payload: CampusMetrics = {
        ...metrics,
        emergencyActive: isEmergencyActive,
      };

      const res = await authenticatedFetch('/api/campus-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: isEmergencyActive
            ? 'Front page metrics and Severe Emergency Broadcast saved & published live!'
            : 'Front page headline metrics and hero badge updated successfully!'
        });
        if (data.metrics) {
          setMetrics(data.metrics);
          if (data.metrics.emergencyActive) {
            setIsEmergencyConfirmed(true);
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem('edupulse_metrics_cache', JSON.stringify(data.metrics));
            window.dispatchEvent(new Event('edupulse_metrics_updated'));
          }
        }
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

  const handleClearEmergency = async () => {
    if (!confirm('Are you sure you want to deactivate and clear the Severe Emergency Broadcast? This will immediately remove the popup from the front page.')) {
      return;
    }

    setIsSaving(true);
    setFeedback({ type: null, message: '' });

    try {
      const payload: CampusMetrics = {
        ...metrics,
        emergencyAlert: '',
        emergencyTitle: '',
        emergencyActive: false,
        emergencyUpdatedAt: '',
      };

      const res = await authenticatedFetch('/api/campus-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMetrics(data.metrics || payload);
        setIsEmergencyConfirmed(false);
        setFeedback({
          type: 'success',
          message: 'Severe emergency broadcast cleared & deactivated. Front page popup is now disabled.'
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('edupulse_metrics_cache', JSON.stringify(data.metrics || payload));
          window.dispatchEvent(new Event('edupulse_metrics_updated'));
        }
      } else {
        throw new Error(data.error || 'Failed to clear emergency broadcast');
      }
    } catch (err: any) {
      console.error('[CampusMetricsManager] Clear emergency error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to clear emergency broadcast'
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
            {/* Box 0: Hero Badge Headline Tagline */}
            <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-2xl border border-indigo-200/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Front Page Hero Badge Writing</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-semibold">Presets:</span>
                  {[
                    'Your Future is Now • Powered by Gemini',
                    '2026 Admissions Open • Powered by Gemini',
                    'AI-Guided Degrees • Powered by Gemini'
                  ].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMetrics((prev) => ({ ...prev, heroBadgeText: val }))}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold cursor-pointer transition truncate max-w-[200px]"
                      title={val}
                    >
                      {val.split('•')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Badge Tagline Writing (Live on Website Hero)
                </label>
                <input
                  type="text"
                  value={metrics.heroBadgeText || ''}
                  onChange={(e) => setMetrics({ ...metrics, heroBadgeText: e.target.value })}
                  placeholder="Your Future is Now • Powered by Gemini"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Controls the glowing notice pill displayed at the top of the homepage hero banner.
                </p>
              </div>
            </div>

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

            {/* Live Front Page Hero Badge Pill */}
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-indigo-500/20 space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Live Front Page Hero Notice Pill:
              </span>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-600/40 border border-indigo-400/40 text-indigo-200 text-xs font-bold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{metrics.heroBadgeText || 'Your Future is Now • Powered by Gemini'}</span>
              </div>
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

      {/* 3. SEVERE EMERGENCY UPDATE & PUBLIC BROADCAST SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-rose-950/80 to-slate-900 rounded-3xl border-2 border-rose-500/40 p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-500/20 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-rose-500/20 border border-rose-500/40 text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Critical Campus Dispatch</span>
              </span>
              {metrics.emergencyActive && metrics.emergencyAlert ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-red-600 text-white animate-pulse shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>Broadcast Active on Front Page</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-slate-800 text-slate-400 border border-slate-700">
                  <span>Default Blank • Inactive</span>
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
              <span>Severe Emergency Update (Weather & Environmental Hazards)</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              This field is <strong className="text-white">default blank</strong>. If an emergency advisory is entered, verified with the safety confirmation checkbox, and saved, an urgent broadcast popup will immediately appear across the public front page for all prospective students, faculty, and visitors.
            </p>
          </div>

          {metrics.emergencyActive && metrics.emergencyAlert && (
            <button
              type="button"
              onClick={handleClearEmergency}
              disabled={isSaving}
              className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer self-start md:self-center shrink-0"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear & Deactivate Emergency</span>
            </button>
          )}
        </div>

        {/* 1-Click Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span>1-Click Incident Quick Presets (Weather & Environmental Events):</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {EMERGENCY_PRESETS.map((preset) => {
              const IconComp = preset.icon;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setMetrics((prev) => ({
                      ...prev,
                      emergencyTitle: preset.title,
                      emergencySeverity: preset.severity,
                      emergencyAlert: preset.text,
                    }));
                  }}
                  className="p-3 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-rose-400/60 rounded-xl text-left transition flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 group-hover:bg-rose-500/30 border border-rose-500/30 flex items-center justify-center shrink-0">
                    <IconComp className="w-4 h-4 text-rose-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 group-hover:text-rose-200 truncate">
                      {preset.label}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {preset.severity} severity
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Emergency Edit Form Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            {/* Severity Level & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Alert Severity Level
                </label>
                <select
                  value={metrics.emergencySeverity || 'severe'}
                  onChange={(e) =>
                    setMetrics({
                      ...metrics,
                      emergencySeverity: e.target.value as 'critical' | 'severe' | 'warning',
                    })
                  }
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="warning">⚠️ Warning (Amber Advisory)</option>
                  <option value="severe">🚨 Severe (High Hazard)</option>
                  <option value="critical">🔴 Critical (Immediate Lockdown/Evacuation)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Advisory Headline Title
                </label>
                <input
                  type="text"
                  value={metrics.emergencyTitle || ''}
                  onChange={(e) => setMetrics({ ...metrics, emergencyTitle: e.target.value })}
                  placeholder="e.g. Severe Storm & Flash Flooding Warning"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Advisory Message Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">
                  Emergency Broadcast Message & Action Plan (Default Blank)
                </label>
                <span className="text-[11px] text-slate-400">
                  {metrics.emergencyAlert?.length || 0} characters
                </span>
              </div>
              <textarea
                rows={4}
                value={metrics.emergencyAlert || ''}
                onChange={(e) => setMetrics({ ...metrics, emergencyAlert: e.target.value })}
                placeholder="Leave blank during normal operations. When severe weather or environmental emergencies occur, describe the situation, campus building closures, online class transitions, and safety directives here..."
                className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed font-sans"
              />
            </div>

            {/* Safety Confirmation Checkbox */}
            <div
              onClick={() => setIsEmergencyConfirmed(!isEmergencyConfirmed)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                isEmergencyConfirmed
                  ? 'bg-rose-500/20 border-rose-400 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                id="emergency-confirm-checkbox"
                checked={isEmergencyConfirmed}
                onChange={(e) => setIsEmergencyConfirmed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-slate-600 shrink-0 cursor-pointer"
              />
              <div className="text-xs space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className={`w-4 h-4 ${isEmergencyConfirmed ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span>I confirm and verify this Severe Emergency Update for public broadcast.</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Checking this box confirms that when you click Save, an emergency popup will trigger on the front page for every visitor. Leaving unchecked keeps the broadcast inactive.
                </p>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleClearEmergency}
                disabled={isSaving || (!metrics.emergencyAlert && !metrics.emergencyTitle)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset to Default Blank</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`px-6 py-2.5 text-xs font-extrabold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer ${
                  metrics.emergencyAlert && isEmergencyConfirmed
                    ? 'bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-400 animate-pulse'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSaving
                    ? 'Broadcasting...'
                    : metrics.emergencyAlert && isEmergencyConfirmed
                    ? 'Broadcast Emergency Live to Front Page'
                    : 'Save & Publish Live'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Preview Column: Front-Page Popup Preview */}
          <div className="lg:col-span-4 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-rose-400" />
                <span>Live Popup Modal Preview</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                metrics.emergencyAlert && isEmergencyConfirmed
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {metrics.emergencyAlert && isEmergencyConfirmed ? 'Will Display' : 'Hidden (Blank)'}
              </span>
            </div>

            {metrics.emergencyAlert ? (
              <div className="bg-slate-900 border-2 border-rose-500/60 rounded-2xl p-3.5 space-y-2.5 shadow-xl text-left">
                <div className="flex items-center justify-between bg-rose-600/30 px-2.5 py-1 rounded-lg text-rose-200 text-[10px] font-bold uppercase tracking-wider border border-rose-500/30">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-300" />
                    <span>Emergency Advisory</span>
                  </span>
                  <span>{(metrics.emergencySeverity || 'severe').toUpperCase()}</span>
                </div>
                <h4 className="text-xs font-black text-white leading-tight">
                  {metrics.emergencyTitle || 'Severe Emergency Notice'}
                </h4>
                <p className="text-[11px] text-slate-200 line-clamp-4 leading-relaxed font-normal">
                  {metrics.emergencyAlert}
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Front Page Popup Simulation</span>
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px]">
                    I Acknowledge
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs space-y-1.5">
                <ShieldCheck className="w-8 h-8 text-emerald-500/40" />
                <span className="font-bold text-slate-400">Default Blank (Normal Operations)</span>
                <p className="text-[11px] text-slate-500">
                  No popup active on the front page. Enter text above, confirm, and save to trigger.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
