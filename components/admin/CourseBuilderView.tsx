'use client';

import React, { useState, useEffect } from 'react';
import {
  TenantConfig,
  ProgramDocument,
  UnitDocument,
  ProgramOutcome,
  UnitOutcome,
  AssessmentItem,
  ModuleItem,
  ContentBlock,
  ComplianceAuditResult,
  AccreditationFramework,
  PresentationItem,
  HandoutItem
} from '@/lib/course-builder/types';
import {
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  FileCheck,
  GitBranch,
  ShieldCheck,
  Clock,
  Award,
  Video,
  FileText,
  Sliders,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Lock,
  ChevronDown,
  Check,
  Presentation,
  Upload,
  Paperclip,
  Folder,
  Link,
  Download,
  HardDrive
} from 'lucide-react';

interface CourseBuilderViewProps {
  apiKey?: string;
}

export const CourseBuilderView: React.FC<CourseBuilderViewProps> = () => {
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [programs, setPrograms] = useState<ProgramDocument[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<ProgramDocument | null>(null);
  const [units, setUnits] = useState<UnitDocument[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnitDocument | null>(null);

  // Sub-tab navigation
  const [activeSubTab, setActiveSubTab] = useState<'programs' | 'curriculum' | 'assessments' | 'matrix' | 'modules'>('programs');

  // Selected handout index per module (for dropdown focus view)
  const [selectedHandoutIndex, setSelectedHandoutIndex] = useState<{ [moduleId: string]: number }>({});

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceAuditResult | null>(null);

  // Load Course Builder data
  const loadData = async (programToSelectId?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/course-builder');
      const data = await res.json();
      if (data.success) {
        setTenantConfig(data.tenantConfig);
        setPrograms(data.programs || []);

        const targetProg = programToSelectId
          ? (data.programs || []).find((p: ProgramDocument) => p.id === programToSelectId)
          : selectedProgram || data.programs?.[0] || null;

        setSelectedProgram(targetProg);

        if (targetProg) {
          const unitsRes = await fetch(`/api/course-builder?programId=${targetProg.id}`);
          const unitsData = await unitsRes.json();
          setUnits(unitsData.units || []);
          setComplianceReport(unitsData.complianceReport);
          if (unitsData.units && unitsData.units.length > 0) {
            setSelectedUnit(prev => unitsData.units.find((u: UnitDocument) => u.id === prev?.id) || unitsData.units[0]);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load course builder data:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load course builder data' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selectedProgram changes, load its units & compliance report
  const handleSelectProgram = async (prog: ProgramDocument) => {
    setSelectedProgram(prog);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/course-builder?programId=${prog.id}`);
      const data = await res.json();
      setUnits(data.units || []);
      setComplianceReport(data.complianceReport);
      setSelectedUnit(data.units?.[0] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Program
  const handleSaveProgram = async (updatedProg: ProgramDocument) => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/course-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_program',
          payload: { program: updatedProg }
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Program "${updatedProg.title}" successfully saved.` });
        await loadData(updatedProg.id);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save program' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Save Unit
  const handleSaveUnit = async (updatedUnit: UnitDocument) => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/course-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_unit',
          payload: { unit: updatedUnit }
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Unit "${updatedUnit.code}" saved. Assessment Weighting: ${data.weightValidation?.totalWeight}%`
        });
        if (selectedProgram) {
          handleSelectProgram(selectedProgram);
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save unit' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize Database
  const handleInitDatabase = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/course-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init_database' })
      });
      const data = await res.json();
      setStatusMessage({ type: 'success', text: data.message || 'Database initialized!' });
      await loadData();
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Create semantic version
  const handleCreateVersion = async () => {
    if (!selectedProgram) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/course-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_version',
          payload: { programId: selectedProgram.id }
        })
      });
      const data = await res.json();
      if (data.success && data.newProgram) {
        setStatusMessage({ type: 'success', text: `Cloned new version: ${data.newProgram.version}` });
        await loadData(data.newProgram.id);
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper labels from tenant terminology
  const labels = tenantConfig?.terminology || {
    program: 'Program',
    unit: 'Unit',
    module: 'Module',
    outcome: 'Learning Outcome',
  };

  // Calculate total assessment weight for selected unit
  const currentTotalWeight = selectedUnit
    ? selectedUnit.assessments.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Framework Configuration */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {tenantConfig?.framework || 'AQF'} Accredited Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-400/20">
                {tenantConfig?.creditSystem.name}: {tenantConfig?.creditSystem.standardAnnualVolume}/yr
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-indigo-400" />
              Global Course & Curriculum Builder
            </h2>
            <p className="text-sm text-indigo-200 mt-1">
              Design multi-tier program outcomes, unit syllabuses, 100% weighted assessments, and compliance matrices for LMS deployment.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleInitDatabase}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition-all shadow-sm"
              title="Re-seed & initialize Course Builder collections in Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              Sync Database
            </button>
            <button
              onClick={() => handleCreateVersion()}
              disabled={!selectedProgram || isSaving}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Clone Version
            </button>
          </div>
        </div>

        {/* Global Terminology Pills */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 text-xs text-indigo-200">
          <span className="font-semibold text-white">Active Terminology:</span>
          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">Tier 1: {labels.program}</span>
          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">Tier 2: {labels.unit}</span>
          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">Tier 3: {labels.module}</span>
          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">Tier 4: {labels.outcome}</span>
        </div>
      </div>

      {/* Notifications / Status Bar */}
      {statusMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm border ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Program Selector Bar */}
      <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
            Select {labels.program}:
          </span>
          {programs.map(prog => (
            <button
              key={prog.id}
              onClick={() => handleSelectProgram(prog)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedProgram?.id === prog.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-[#161b22] text-slate-200 border-[#30363d] hover:bg-[#21262d]'
              }`}
            >
              {prog.code}: {prog.title.slice(0, 32)}...
              <span className="ml-1.5 opacity-80 text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-black/50 text-white">
                {prog.version}
              </span>
            </button>
          ))}
        </div>

        {selectedProgram && (
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2.5 py-1 rounded-full font-semibold border ${
              selectedProgram.status === 'published'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
            }`}>
              {selectedProgram.status.toUpperCase()}
            </span>
            <span className="text-[#e6edf3] font-mono text-[11px]">
              {selectedProgram.totalCredits} Credits
            </span>
          </div>
        )}
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex border-b border-[#30363d] space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('programs')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'programs'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          {labels.program} Specification & Outcomes
        </button>

        <button
          onClick={() => setActiveSubTab('curriculum')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'curriculum'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {labels.unit} Curriculum & Outcomes
        </button>

        <button
          onClick={() => setActiveSubTab('assessments')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'assessments'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Assessment Weighting (100% Engine)
        </button>

        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'matrix'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Compliance Matrix & Orphan Detector
        </button>

        <button
          onClick={() => setActiveSubTab('modules')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'modules'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          {labels.module} Content & LMS Blocks
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PROGRAM SPECIFICATION & PLOs */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'programs' && selectedProgram && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata Editor */}
          <div className="lg:col-span-2 bg-[#121212] border border-[#30363d] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                {labels.program} Metadata & Entry Rules
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={selectedProgram.status}
                  onChange={(e) => setSelectedProgram({ ...selectedProgram, status: e.target.value as any })}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                </select>
                <button
                  onClick={() => handleSaveProgram(selectedProgram)}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">{labels.program} Code</label>
                <input
                  type="text"
                  value={selectedProgram.code}
                  onChange={(e) => setSelectedProgram({ ...selectedProgram, code: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">{labels.program} Title</label>
                <input
                  type="text"
                  value={selectedProgram.title}
                  onChange={(e) => setSelectedProgram({ ...selectedProgram, title: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Framework Level</label>
                <select
                  value={selectedProgram.frameworkLevel}
                  onChange={(e) => setSelectedProgram({ ...selectedProgram, frameworkLevel: Number(e.target.value) })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {tenantConfig?.frameworkLevels.map(fl => (
                    <option key={fl.level} value={fl.level}>{fl.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Total Volume / Credits</label>
                <input
                  type="number"
                  value={selectedProgram.totalCredits}
                  onChange={(e) => setSelectedProgram({ ...selectedProgram, totalCredits: Number(e.target.value) })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Duration (Years)</label>
                <input
                  type="number"
                  value={selectedProgram.durationYears}
                  onChange={(e) => setSelectedProgram({ ...selectedProgram, durationYears: Number(e.target.value) })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Annual Tuition (AUD)</label>
                <input
                  type="number"
                  value={selectedProgram.annualFeeAud || 0}
                  onChange={(e) => setSelectedProgram({ ...selectedProgram, annualFeeAud: Number(e.target.value) })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 text-xs font-medium">Program Overview & Abstract</label>
              <textarea
                rows={3}
                value={selectedProgram.overview}
                onChange={(e) => setSelectedProgram({ ...selectedProgram, overview: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
              />
            </div>
          </div>

          {/* Program Learning Outcomes (PLOs) */}
          <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                Program Outcomes (PLOs)
              </h3>
              <button
                onClick={() => {
                  const newPlo: ProgramOutcome = {
                    id: `plo-${Date.now().toString().slice(-4)}`,
                    code: `PLO-${selectedProgram.outcomes.length + 1}`,
                    title: 'New Program Competency',
                    statement: 'Graduates will demonstrate competence in...',
                    category: 'Knowledge'
                  };
                  setSelectedProgram({
                    ...selectedProgram,
                    outcomes: [...selectedProgram.outcomes, newPlo]
                  });
                }}
                className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg transition-all"
                title="Add Program Outcome"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              High-level graduate attributes that every completed student must achieve to meet accreditation.
            </p>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {selectedProgram.outcomes.map((plo, idx) => (
                <div key={plo.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                      {plo.code}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProgram({
                          ...selectedProgram,
                          outcomes: selectedProgram.outcomes.filter(o => o.id !== plo.id)
                        });
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={plo.title}
                    onChange={(e) => {
                      const updated = [...selectedProgram.outcomes];
                      updated[idx].title = e.target.value;
                      setSelectedProgram({ ...selectedProgram, outcomes: updated });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-medium"
                    placeholder="Competency Title"
                  />

                  <textarea
                    rows={2}
                    value={plo.statement}
                    onChange={(e) => {
                      const updated = [...selectedProgram.outcomes];
                      updated[idx].statement = e.target.value;
                      setSelectedProgram({ ...selectedProgram, outcomes: updated });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 text-[11px]"
                    placeholder="Outcome statement..."
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: CURRICULUM & UNIT OUTCOMES (ULOs) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Unit List */}
          <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                {labels.unit} Enrolment
              </h3>
              <button
                onClick={() => {
                  if (!selectedProgram) return;
                  const newUnit: UnitDocument = {
                    id: `unit-${Date.now().toString().slice(-4)}`,
                    tenantId: selectedProgram.tenantId,
                    programId: selectedProgram.id,
                    code: `NEW${Math.floor(1000 + Math.random() * 9000)}`,
                    title: 'New Subject Syllabus',
                    creditWeight: 6,
                    deliveryMode: 'Hybrid',
                    overview: 'Unit syllabus overview and intended topics.',
                    prerequisites: [],
                    coRequisites: [],
                    outcomes: [
                      {
                        id: `ulo-${Date.now()}-1`,
                        code: 'ULO-1',
                        statement: 'Analyze foundational principles of this subject area.',
                        mappedPloIds: selectedProgram.outcomes[0]?.id ? [selectedProgram.outcomes[0].id] : []
                      }
                    ],
                    assessments: [
                      {
                        id: `asmt-${Date.now()}-1`,
                        title: 'Capstone Assessment',
                        type: 'Summative',
                        weight: 100,
                        mappedUloIds: [`ulo-${Date.now()}-1`]
                      }
                    ],
                    modules: [],
                    status: 'draft',
                    updatedAt: new Date().toISOString()
                  };
                  setUnits([...units, newUnit]);
                  setSelectedUnit(newUnit);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add {labels.unit}
              </button>
            </div>

            <div className="space-y-2">
              {units.map(unit => {
                const totalWeight = unit.assessments.reduce((a, b) => a + (Number(b.weight) || 0), 0);
                const isWeightValid = totalWeight === 100;

                return (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      selectedUnit?.id === unit.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-400">{unit.code}</span>
                        <span className="text-xs font-medium text-slate-200">{unit.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>{unit.creditWeight} Credits</span>
                        <span>•</span>
                        <span>{unit.deliveryMode}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isWeightValid
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {totalWeight}%
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit Editor & Learning Outcomes (ULOs) */}
          {selectedUnit && selectedProgram && (
            <div className="lg:col-span-2 bg-[#121212] border border-[#30363d] rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-indigo-400 font-bold uppercase">{selectedUnit.code}</span>
                  <h3 className="text-lg font-bold text-white">{selectedUnit.title}</h3>
                </div>
                <button
                  onClick={() => handleSaveUnit(selectedUnit)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save {labels.unit}
                </button>
              </div>

              {/* General unit fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{labels.unit} Code</label>
                  <input
                    type="text"
                    value={selectedUnit.code}
                    onChange={(e) => setSelectedUnit({ ...selectedUnit, code: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{labels.unit} Title</label>
                  <input
                    type="text"
                    value={selectedUnit.title}
                    onChange={(e) => setSelectedUnit({ ...selectedUnit, title: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Delivery Mode</label>
                  <select
                    value={selectedUnit.deliveryMode}
                    onChange={(e) => setSelectedUnit({ ...selectedUnit, deliveryMode: e.target.value as any })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Online">Online</option>
                    <option value="On-Campus">On-Campus</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              {/* ULOs & Outcome Junction Mapping */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-indigo-400" />
                    Unit Learning Outcomes (ULOs) & PLO Mapping Junction
                  </h4>
                  <button
                    onClick={() => {
                      const newUlo: UnitOutcome = {
                        id: `ulo-${Date.now().toString().slice(-4)}`,
                        code: `ULO-${selectedUnit.outcomes.length + 1}`,
                        statement: 'Upon completion of this unit, students will be able to...',
                        mappedPloIds: selectedProgram.outcomes[0]?.id ? [selectedProgram.outcomes[0].id] : []
                      };
                      setSelectedUnit({
                        ...selectedUnit,
                        outcomes: [...selectedUnit.outcomes, newUlo]
                      });
                    }}
                    className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add ULO
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedUnit.outcomes.map((ulo, uloIdx) => (
                    <div key={ulo.id} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-400">{ulo.code}</span>
                        <button
                          onClick={() => {
                            setSelectedUnit({
                              ...selectedUnit,
                              outcomes: selectedUnit.outcomes.filter(o => o.id !== ulo.id)
                            });
                          }}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={ulo.statement}
                        onChange={(e) => {
                          const updated = [...selectedUnit.outcomes];
                          updated[uloIdx].statement = e.target.value;
                          setSelectedUnit({ ...selectedUnit, outcomes: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs"
                      />

                      {/* Junction: Map to parent PLOs */}
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                          Mapped Program Outcomes (PLOs):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedProgram.outcomes.map(plo => {
                            const isChecked = ulo.mappedPloIds.includes(plo.id);
                            return (
                              <button
                                key={plo.id}
                                type="button"
                                onClick={() => {
                                  const updatedUlos = [...selectedUnit.outcomes];
                                  if (isChecked) {
                                    updatedUlos[uloIdx].mappedPloIds = updatedUlos[uloIdx].mappedPloIds.filter(id => id !== plo.id);
                                  } else {
                                    updatedUlos[uloIdx].mappedPloIds.push(plo.id);
                                  }
                                  setSelectedUnit({ ...selectedUnit, outcomes: updatedUlos });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
                                  isChecked
                                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                                    : 'bg-slate-800/50 text-slate-400 border-slate-700/60 hover:text-slate-200'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                                  isChecked ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-600'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </span>
                                {plo.code}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: ASSESSMENTS BUILDER (100% WEIGHT ENGINE) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'assessments' && selectedUnit && (
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#21262d] pb-5">
            <div>
              <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">{selectedUnit.code}</span>
              <h3 className="text-lg font-bold text-white mt-0.5">Assessment Structure & Weighting Engine</h3>
              <p className="text-xs text-[#e6edf3] font-normal mt-1 leading-relaxed">
                Accreditation standards mandate that all assessment tasks strictly total 100% per unit before status can be published.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Weighting Gauge */}
              <div className="flex items-center gap-2 bg-[#161b22] px-4 py-2 rounded-xl border border-[#30363d] shadow-sm">
                <span className="text-xs text-slate-300 font-medium">Total Weight:</span>
                <span className={`text-base font-bold font-mono ${
                  currentTotalWeight === 100 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {currentTotalWeight}%
                </span>
                {currentTotalWeight === 100 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
              </div>

              <button
                onClick={() => {
                  const newAsmt: AssessmentItem = {
                    id: `asmt-${Date.now().toString().slice(-4)}`,
                    title: 'New Assessment Task',
                    type: 'Summative',
                    weight: Math.max(0, 100 - currentTotalWeight),
                    dueDateWeek: 10,
                    mappedUloIds: selectedUnit.outcomes[0]?.id ? [selectedUnit.outcomes[0].id] : []
                  };
                  setSelectedUnit({
                    ...selectedUnit,
                    assessments: [...selectedUnit.assessments, newAsmt]
                  });
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Assessment
              </button>

              <button
                onClick={() => handleSaveUnit(selectedUnit)}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Save Assessments
              </button>
            </div>
          </div>

          {/* Assessment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedUnit.assessments.map((asmt, idx) => (
              <div key={asmt.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {asmt.type}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedUnit({
                        ...selectedUnit,
                        assessments: selectedUnit.assessments.filter(a => a.id !== asmt.id)
                      });
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  value={asmt.title}
                  onChange={(e) => {
                    const updated = [...selectedUnit.assessments];
                    updated[idx].title = e.target.value;
                    setSelectedUnit({ ...selectedUnit, assessments: updated });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium"
                  placeholder="Task Name"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Weight (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={asmt.weight}
                      onChange={(e) => {
                        const updated = [...selectedUnit.assessments];
                        updated[idx].weight = Number(e.target.value);
                        setSelectedUnit({ ...selectedUnit, assessments: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Due Week</label>
                    <input
                      type="number"
                      value={asmt.dueDateWeek || 0}
                      onChange={(e) => {
                        const updated = [...selectedUnit.assessments];
                        updated[idx].dueDateWeek = Number(e.target.value);
                        setSelectedUnit({ ...selectedUnit, assessments: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
                    />
                  </div>
                </div>

                {/* ULO mapping checkboxes */}
                <div className="pt-2 border-t border-slate-700/60">
                  <span className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Evaluated ULOs:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUnit.outcomes.map(ulo => {
                      const isMapped = asmt.mappedUloIds.includes(ulo.id);
                      return (
                        <button
                          key={ulo.id}
                          type="button"
                          onClick={() => {
                            const updatedAsmts = [...selectedUnit.assessments];
                            if (isMapped) {
                              updatedAsmts[idx].mappedUloIds = updatedAsmts[idx].mappedUloIds.filter(id => id !== ulo.id);
                            } else {
                              updatedAsmts[idx].mappedUloIds.push(ulo.id);
                            }
                            setSelectedUnit({ ...selectedUnit, assessments: updatedAsmts });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            isMapped
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                              : 'bg-slate-900 text-slate-500 border-slate-700'
                          }`}
                        >
                          {ulo.code}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: COMPLIANCE MATRIX & ORPHAN DETECTOR */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'matrix' && selectedProgram && (
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#21262d] pb-5">
            <div>
              <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">{selectedProgram.code}</span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Accreditation Compliance Matrix & Orphan Detector
              </h3>
              <p className="text-xs text-[#e6edf3] font-normal mt-1 leading-relaxed">
                Automated graph traversal ensuring every Program Learning Outcome (PLO) is developed by unit outcomes and assessed without gaps.
              </p>
            </div>

            {complianceReport && (
              <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold shadow-sm ${
                complianceReport.isCompliant
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
              }`}>
                {complianceReport.isCompliant ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>100% Accreditation Compliant</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>Accreditation Gaps Detected</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Warnings Banner if orphans exist */}
          {complianceReport && complianceReport.warnings.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 space-y-2 shadow-sm">
              <span className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                Orphaned Outcomes & Compliance Issues:
              </span>
              <ul className="text-xs text-rose-200/90 list-disc list-inside space-y-1">
                {complianceReport.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Matrix Grid Table */}
          <div className="overflow-x-auto border border-[#30363d] rounded-xl bg-[#0d1117] shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#161b22] border-b border-[#30363d] text-slate-200">
                  <th className="p-3.5 font-bold uppercase tracking-wider text-[11px]">Unit Code</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-[11px]">Unit Outcome (ULO)</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-[11px]">Mapped PLO(s)</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-[11px]">Assessing Tasks</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {units.map(unit => (
                  unit.outcomes.map(ulo => {
                    const mappedPlos = selectedProgram.outcomes.filter(p => ulo.mappedPloIds.includes(p.id));
                    const evaluatingAsmts = unit.assessments.filter(a => a.mappedUloIds.includes(ulo.id));
                    const isAssessed = evaluatingAsmts.length > 0;
                    const isMapped = mappedPlos.length > 0;

                    return (
                      <tr key={ulo.id} className="border-b border-[#21262d] hover:bg-[#161b22] transition-colors odd:bg-[#0d1117] even:bg-[#12161c]">
                        <td className="p-3.5 font-mono font-bold text-indigo-300 whitespace-nowrap">{unit.code}</td>
                        <td className="p-3.5 max-w-sm">
                          <span className="font-mono font-bold text-white mr-1.5">{ulo.code}:</span>
                          <span className="text-[#e6edf3] leading-relaxed">{ulo.statement}</span>
                        </td>
                        <td className="p-3.5">
                          {isMapped ? (
                            <div className="flex flex-wrap gap-1.5">
                              {mappedPlos.map(plo => (
                                <span
                                  key={plo.id}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#0d1117] text-white border border-indigo-400/70 shadow-xs tracking-wide"
                                  title={plo.title}
                                >
                                  {plo.code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/50">
                              Unmapped PLO
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isAssessed ? (
                            <div className="flex flex-wrap gap-1.5">
                              {evaluatingAsmts.map(asmt => (
                                <span
                                  key={asmt.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#21262d] text-white border border-slate-500/80 shadow-xs"
                                >
                                  <span>{asmt.title}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] font-bold">
                                    {asmt.weight}%
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/50">
                              No Assessment
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {isMapped && isAssessed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span>Covered</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                              <span>Gap</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: MODULES & CONTENT BLOCKS (LMS READY) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'modules' && selectedUnit && (
        <div className="bg-[#121212] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#21262d] pb-5">
            <div>
              <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">{selectedUnit.code}</span>
              <h3 className="text-lg font-bold text-white mt-0.5">Course Modules & Interactive LMS Content</h3>
              <p className="text-xs text-[#e6edf3] font-normal mt-1 leading-relaxed">
                Organize weekly topics, estimated study hours, rich text lecture guides, video lectures, and SCORM/LTI packages.
              </p>
            </div>            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newMod: ModuleItem = {
                    id: `mod-${Date.now().toString().slice(-4)}`,
                    order: selectedUnit.modules.length + 1,
                    title: `Week ${selectedUnit.modules.length + 1}: Topic Title`,
                    studyHours: 8,
                    learningObjectives: ['Define foundational concepts', 'Complete lab assignments'],
                    contentBlocks: [
                      {
                        id: `cb-${Date.now()}-1`,
                        type: 'rich_text',
                        title: 'Weekly Lecture Notes',
                        content: '### Welcome to this week\'s lecture...',
                        durationMinutes: 45
                      }
                    ],
                    presentation: {
                      id: `pres-${Date.now()}`,
                      title: `Week ${selectedUnit.modules.length + 1} Lecture Slides`,
                      url: '',
                      type: 'link',
                      updatedAt: new Date().toISOString()
                    },
                    handouts: [
                      {
                        id: `ho-${Date.now()}-1`,
                        title: 'Weekly Lab Exercises & Reading Guide',
                        type: 'gdrive',
                        driveUrl: '',
                        category: 'worksheet',
                        updatedAt: new Date().toISOString()
                      }
                    ]
                  };
                  setSelectedUnit({
                    ...selectedUnit,
                    modules: [...selectedUnit.modules, newMod]
                  });
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Module / Week
              </button>

              <button
                onClick={() => handleSaveUnit(selectedUnit)}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Save Modules
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {selectedUnit.modules.map((mod, modIdx) => (
              <div key={mod.id} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 sm:p-6 space-y-5 text-xs shadow-md">
                {/* Module Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21262d] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center font-mono text-sm shadow-sm flex-shrink-0">
                      {mod.order}
                    </span>
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => {
                        const updated = [...selectedUnit.modules];
                        updated[modIdx].title = e.target.value;
                        setSelectedUnit({ ...selectedUnit, modules: updated });
                      }}
                      className="bg-[#12161c] border border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-1.5 text-white font-bold text-sm w-full sm:w-96"
                      placeholder="Module Title (e.g. Week 1: Foundations)"
                    />
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5 bg-[#12161c] border border-[#30363d] px-2.5 py-1 rounded-xl text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <input
                        type="number"
                        value={mod.studyHours}
                        onChange={(e) => {
                          const updated = [...selectedUnit.modules];
                          updated[modIdx].studyHours = Number(e.target.value);
                          setSelectedUnit({ ...selectedUnit, modules: updated });
                        }}
                        className="w-12 bg-transparent text-white text-center font-mono font-bold focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400">Hours</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedUnit({
                          ...selectedUnit,
                          modules: selectedUnit.modules.filter(m => m.id !== mod.id)
                        });
                      }}
                      className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 1. LECTURE PRESENTATION LINK & ATTACHMENT */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#21262d] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                        <Presentation className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          Lecture Presentation
                          {mod.presentation?.url && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              Link Active
                            </span>
                          )}
                          {mod.presentation?.attachmentName && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              File Attached
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-[#8b949e]">
                          Add presentation web link (Google Slides, Canva, PPT) and/or attach offline presentation slide deck (.pptx, .pdf).
                        </p>
                      </div>
                    </div>

                    {mod.presentation?.url && (
                      <a
                        href={mod.presentation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-start sm:self-auto px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/40 flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Presentation
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Presentation URL */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <Link className="w-3 h-3 text-indigo-400" />
                        Presentation Web Link (Google Slides, Canva, Web):
                      </label>
                      <input
                        type="text"
                        value={mod.presentation?.url || ''}
                        onChange={(e) => {
                          const updated = [...selectedUnit.modules];
                          updated[modIdx].presentation = {
                            ...updated[modIdx].presentation,
                            url: e.target.value,
                            title: updated[modIdx].presentation?.title || `${mod.title} - Lecture Slides`,
                            type: updated[modIdx].presentation?.attachmentName ? 'attachment' : 'link',
                            updatedAt: new Date().toISOString()
                          };
                          setSelectedUnit({ ...selectedUnit, modules: updated });
                        }}
                        placeholder="https://docs.google.com/presentation/d/... or https://..."
                        className="w-full bg-[#12161c] border border-[#30363d] focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono"
                      />
                    </div>

                    {/* Presentation File Attachment */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Paperclip className="w-3 h-3 text-purple-400" />
                          Presentation File Attachment (.pptx, .pdf, .key):
                        </span>
                        {mod.presentation?.attachmentName && (
                          <span className="text-[10px] text-purple-300 font-mono font-medium">
                            {mod.presentation.attachmentSize || 'Uploaded'}
                          </span>
                        )}
                      </label>

                      {mod.presentation?.attachmentName ? (
                        <div className="flex items-center justify-between bg-[#12161c] border border-purple-500/40 rounded-lg px-3 py-1.5">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Presentation className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-xs text-white font-medium truncate">
                              {mod.presentation.attachmentName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...selectedUnit.modules];
                                if (updated[modIdx].presentation) {
                                  updated[modIdx].presentation = {
                                    ...updated[modIdx].presentation,
                                    attachmentName: undefined,
                                    attachmentSize: undefined,
                                    attachmentData: undefined
                                  };
                                  setSelectedUnit({ ...selectedUnit, modules: updated });
                                }
                              }}
                              className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                              title="Remove Attachment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 bg-[#12161c] hover:bg-[#161b22] border border-dashed border-[#30363d] hover:border-purple-400/60 rounded-lg px-3 py-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                          <Upload className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-medium">Attach Slide Deck (PDF or PPTX)</span>
                          <input
                            type="file"
                            accept=".pdf,.pptx,.ppt,.key"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const updated = [...selectedUnit.modules];
                                const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                                updated[modIdx].presentation = {
                                  ...updated[modIdx].presentation,
                                  attachmentName: file.name,
                                  attachmentSize: sizeStr,
                                  type: 'attachment',
                                  updatedAt: new Date().toISOString()
                                };
                                setSelectedUnit({ ...selectedUnit, modules: updated });
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. HANDOUTS & GOOGLE DRIVE RESOURCES (WITH DROPDOWN) */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#21262d] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          Module Handouts & Google Drive Resources
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {(mod.handouts || []).length} Handouts
                          </span>
                        </h4>
                        <p className="text-[11px] text-[#8b949e]">
                          Attach Google Drive worksheets, shared folders, solution guides, and downloadable reference files.
                        </p>
                      </div>
                    </div>

                    {/* Dropdown Selector for Viewing/Managing More Handouts + Add Actions */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Handout Dropdown Filter / Selector */}
                      {(mod.handouts || []).length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                            Dropdown:
                          </label>
                          <select
                            value={selectedHandoutIndex[mod.id] ?? -1}
                            onChange={(e) => {
                              setSelectedHandoutIndex({
                                ...selectedHandoutIndex,
                                [mod.id]: Number(e.target.value)
                              });
                            }}
                            className="bg-[#161b22] border border-[#30363d] text-white text-xs rounded-lg px-2.5 py-1.5 font-medium focus:border-emerald-500 focus:outline-none"
                          >
                            <option value={-1}>📋 View All ({(mod.handouts || []).length} Handouts)</option>
                            {(mod.handouts || []).map((ho, hIdx) => (
                              <option key={ho.id || hIdx} value={hIdx}>
                                {ho.type === 'gdrive' ? '📄 [Google Drive]' : ho.type === 'attachment' ? '📎 [Attached File]' : '🌐 [Web Link]'}{' '}
                                {ho.title || `Handout ${hIdx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Dropdown for Adding More Handouts */}
                      <div className="relative inline-block">
                        <select
                          onChange={(e) => {
                            const addType = e.target.value as 'gdrive' | 'folder' | 'attachment' | 'url';
                            if (!addType) return;
                            const updated = [...selectedUnit.modules];
                            const currentHandouts = updated[modIdx].handouts || [];
                            const newIndex = currentHandouts.length;
                            
                            let defaultTitle = `Handout ${newIndex + 1}`;
                            let defaultCategory: any = 'worksheet';
                            let initialDriveUrl = '';

                            if (addType === 'gdrive') {
                              defaultTitle = `Google Drive Worksheet #${newIndex + 1}`;
                              defaultCategory = 'worksheet';
                              initialDriveUrl = 'https://drive.google.com/file/d/.../view?usp=sharing';
                            } else if (addType === 'folder') {
                              defaultTitle = `Shared Google Drive Exercises Folder`;
                              defaultCategory = 'lab_manual';
                              initialDriveUrl = 'https://drive.google.com/drive/folders/...';
                            } else if (addType === 'attachment') {
                              defaultTitle = `Lab Manual & Reference Guide`;
                              defaultCategory = 'reference';
                            } else if (addType === 'url') {
                              defaultTitle = `Supplementary Reading`;
                              defaultCategory = 'reading';
                            }

                            const newHandout: HandoutItem = {
                              id: `ho-${Date.now()}-${newIndex}`,
                              title: defaultTitle,
                              type: addType === 'attachment' ? 'attachment' : 'gdrive',
                              driveUrl: initialDriveUrl,
                              category: defaultCategory,
                              updatedAt: new Date().toISOString()
                            };

                            updated[modIdx].handouts = [...currentHandouts, newHandout];
                            setSelectedUnit({ ...selectedUnit, modules: updated });
                            // Select newly created handout in dropdown
                            setSelectedHandoutIndex({ ...selectedHandoutIndex, [mod.id]: newIndex });
                            e.target.value = ''; // Reset dropdown
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg px-3 py-1.5 cursor-pointer border border-emerald-500 shadow-sm focus:outline-none"
                          defaultValue=""
                        >
                          <option value="" disabled>+ Add More Handouts ▾</option>
                          <option value="gdrive">📄 + Google Drive Document Link</option>
                          <option value="folder">📁 + Google Drive Shared Folder</option>
                          <option value="attachment">📎 + Attach Offline File (PDF / DOCX)</option>
                          <option value="url">🌐 + External Resource Link</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Handout List / Selected Handout */}
                  <div className="space-y-3">
                    {(mod.handouts && mod.handouts.length > 0) ? (
                      (selectedHandoutIndex[mod.id] !== undefined && selectedHandoutIndex[mod.id] !== -1
                        ? [mod.handouts[selectedHandoutIndex[mod.id]]].filter(Boolean)
                        : mod.handouts
                      ).map((ho, localIdx) => {
                        // Find actual index in array
                        const actualIdx = mod.handouts!.findIndex(h => h.id === ho.id);
                        const hIdx = actualIdx >= 0 ? actualIdx : localIdx;

                        return (
                          <div
                            key={ho.id || hIdx}
                            className="bg-[#12161c] border border-[#21262d] rounded-xl p-3.5 space-y-3 transition-colors hover:border-[#30363d]"
                          >
                            {/* Handout Header Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#21262d] pb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono text-[10px] flex items-center justify-center border border-emerald-500/30">
                                  {hIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={ho.title}
                                  onChange={(e) => {
                                    const updated = [...selectedUnit.modules];
                                    updated[modIdx].handouts![hIdx].title = e.target.value;
                                    setSelectedUnit({ ...selectedUnit, modules: updated });
                                  }}
                                  className="bg-[#161b22] border border-[#30363d] focus:border-emerald-500 rounded px-2 py-0.5 text-xs text-white font-semibold w-64"
                                  placeholder="Handout Title"
                                />
                                <select
                                  value={ho.category || 'worksheet'}
                                  onChange={(e) => {
                                    const updated = [...selectedUnit.modules];
                                    updated[modIdx].handouts![hIdx].category = e.target.value as any;
                                    setSelectedUnit({ ...selectedUnit, modules: updated });
                                  }}
                                  className="bg-[#161b22] border border-[#30363d] text-slate-300 text-[10px] rounded px-2 py-1 font-medium"
                                >
                                  <option value="worksheet">Worksheet</option>
                                  <option value="reading">Reading</option>
                                  <option value="lab_manual">Lab Manual</option>
                                  <option value="slides_notes">Lecture Notes</option>
                                  <option value="reference">Reference</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-2">
                                {ho.driveUrl && (
                                  <a
                                    href={ho.driveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center gap-1 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Open in Drive
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...selectedUnit.modules];
                                    updated[modIdx].handouts = updated[modIdx].handouts!.filter(h => h.id !== ho.id);
                                    setSelectedUnit({ ...selectedUnit, modules: updated });
                                    if (selectedHandoutIndex[mod.id] === hIdx) {
                                      setSelectedHandoutIndex({ ...selectedHandoutIndex, [mod.id]: -1 });
                                    }
                                  }}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                  title="Delete Handout"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Handout Link & Attachment Dual-Input Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {/* Google Drive Link input */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  Google Drive Link (Doc, Sheet, Folder):
                                </label>
                                <input
                                  type="text"
                                  value={ho.driveUrl || ''}
                                  onChange={(e) => {
                                    const updated = [...selectedUnit.modules];
                                    updated[modIdx].handouts![hIdx].driveUrl = e.target.value;
                                    setSelectedUnit({ ...selectedUnit, modules: updated });
                                  }}
                                  placeholder="https://drive.google.com/..."
                                  className="w-full bg-[#161b22] border border-[#30363d] focus:border-emerald-500 rounded px-2 py-1.5 text-xs text-emerald-200 placeholder-slate-600 font-mono"
                                />
                              </div>

                              {/* Handout Attachment input */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <Paperclip className="w-3 h-3 text-slate-400" />
                                    Offline Handout Attachment:
                                  </span>
                                  {ho.attachmentName && (
                                    <span className="text-[10px] text-emerald-400 font-mono">
                                      {ho.attachmentSize || 'Attached'}
                                    </span>
                                  )}
                                </label>

                                {ho.attachmentName ? (
                                  <div className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                      <span className="text-xs text-slate-200 truncate font-medium">
                                        {ho.attachmentName}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...selectedUnit.modules];
                                        updated[modIdx].handouts![hIdx].attachmentName = undefined;
                                        updated[modIdx].handouts![hIdx].attachmentSize = undefined;
                                        setSelectedUnit({ ...selectedUnit, modules: updated });
                                      }}
                                      className="text-slate-400 hover:text-rose-400 p-0.5 ml-2"
                                      title="Remove Attachment"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex items-center justify-center gap-2 bg-[#161b22] hover:bg-[#1a202c] border border-dashed border-[#30363d] hover:border-emerald-500/50 rounded px-2 py-1.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
                                    <Upload className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[11px] font-medium">Upload File (PDF / DOCX)</span>
                                    <input
                                      type="file"
                                      accept=".pdf,.docx,.doc,.txt,.zip"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const updated = [...selectedUnit.modules];
                                          const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                                          updated[modIdx].handouts![hIdx].attachmentName = file.name;
                                          updated[modIdx].handouts![hIdx].attachmentSize = sizeStr;
                                          updated[modIdx].handouts![hIdx].type = 'attachment';
                                          setSelectedUnit({ ...selectedUnit, modules: updated });
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-[#12161c] border border-dashed border-[#21262d] rounded-xl p-4 text-center text-slate-400 text-xs">
                        <Folder className="w-5 h-5 text-slate-600 mx-auto mb-1.5" />
                        No handouts added yet. Use the <strong className="text-emerald-400">+ Add More Handouts ▾</strong> dropdown above to attach Google Drive files, shared folders, or PDF worksheets.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. CONTENT BLOCKS INSIDE THIS MODULE */}
                <div className="space-y-3 pt-3 border-t border-[#21262d]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Interactive Content Blocks ({mod.contentBlocks.length}):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const updated = [...selectedUnit.modules];
                          updated[modIdx].contentBlocks.push({
                            id: `cb-${Date.now()}`,
                            type: 'rich_text',
                            title: 'New Text Guide',
                            content: 'Lecture notes...',
                            durationMinutes: 30
                          });
                          setSelectedUnit({ ...selectedUnit, modules: updated });
                        }}
                        className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-slate-200 border border-[#30363d] rounded-lg text-[11px] flex items-center gap-1 font-medium transition-colors"
                      >
                        <FileText className="w-3 h-3 text-indigo-400" /> + Rich Text
                      </button>
                      <button
                        onClick={() => {
                          const updated = [...selectedUnit.modules];
                          updated[modIdx].contentBlocks.push({
                            id: `cb-${Date.now()}`,
                            type: 'video',
                            title: 'Video Lecture',
                            content: 'Video description...',
                            mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                            durationMinutes: 45
                          });
                          setSelectedUnit({ ...selectedUnit, modules: updated });
                        }}
                        className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-slate-200 border border-[#30363d] rounded-lg text-[11px] flex items-center gap-1 font-medium transition-colors"
                      >
                        <Video className="w-3 h-3 text-rose-400" /> + Video
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mod.contentBlocks.map((cb, cbIdx) => (
                      <div key={cb.id} className="bg-[#0d1117] border border-[#21262d] rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {cb.type}
                          </span>
                          <button
                            onClick={() => {
                              const updated = [...selectedUnit.modules];
                              updated[modIdx].contentBlocks = updated[modIdx].contentBlocks.filter(c => c.id !== cb.id);
                              setSelectedUnit({ ...selectedUnit, modules: updated });
                            }}
                            className="text-slate-400 hover:text-rose-400 transition-colors p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={cb.title}
                          onChange={(e) => {
                            const updated = [...selectedUnit.modules];
                            updated[modIdx].contentBlocks[cbIdx].title = e.target.value;
                            setSelectedUnit({ ...selectedUnit, modules: updated });
                          }}
                          className="w-full bg-[#12161c] border border-[#30363d] focus:border-indigo-500 rounded-lg px-2.5 py-1 text-white font-medium text-xs"
                          placeholder="Block Title"
                        />

                        {cb.type === 'video' && (
                          <input
                            type="text"
                            value={cb.mediaUrl || ''}
                            onChange={(e) => {
                              const updated = [...selectedUnit.modules];
                              updated[modIdx].contentBlocks[cbIdx].mediaUrl = e.target.value;
                              setSelectedUnit({ ...selectedUnit, modules: updated });
                            }}
                            className="w-full bg-[#12161c] border border-[#30363d] focus:border-indigo-500 rounded-lg px-2.5 py-1 text-indigo-300 font-mono text-[10px]"
                            placeholder="https://..."
                          />
                        )}

                        <textarea
                          rows={2}
                          value={cb.content}
                          onChange={(e) => {
                            const updated = [...selectedUnit.modules];
                            updated[modIdx].contentBlocks[cbIdx].content = e.target.value;
                            setSelectedUnit({ ...selectedUnit, modules: updated });
                          }}
                          className="w-full bg-[#12161c] border border-[#30363d] focus:border-indigo-500 rounded-lg px-2.5 py-1 text-slate-300 text-[11px]"
                          placeholder="Content or description..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
