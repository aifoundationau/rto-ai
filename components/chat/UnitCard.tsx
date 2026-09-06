import React, { useState } from 'react';
import { UnitDetail } from '@/data/units';
import { BookOpen, User, CheckCircle2, ChevronDown, ChevronUp, Layers, Calendar, Award } from 'lucide-react';

interface UnitCardProps {
  unit: UnitDetail;
}

export const UnitCard: React.FC<UnitCardProps> = ({ unit }) => {
  const [showSchedule, setShowSchedule] = useState(false);

  return (
    <div className="my-3 bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-5 text-white">
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-mono font-bold tracking-wide">
            {unit.code} • {unit.creditPoints} CP
          </span>
          <span className="text-xs text-blue-200 bg-white/10 px-2 py-0.5 rounded-md">
            {unit.level} • {unit.deliveryMode}
          </span>
        </div>
        <h3 className="text-xl font-bold mt-2 text-white">{unit.title}</h3>
        <p className="text-xs text-blue-200 mt-1">{unit.faculty}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Unit Coordinator & Offerings */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <div>
              <span className="font-semibold text-slate-800">{unit.coordinator.name}</span>
              <span className="text-slate-400 ml-1.5">({unit.coordinator.email})</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Offered in: <strong>{unit.semestersOffered.join(', ')}</strong></span>
          </div>
        </div>

        {/* Overview */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Unit Description</h4>
          <p className="text-sm text-slate-600 leading-relaxed">{unit.overview}</p>
        </div>

        {/* Prerequisites */}
        <div className="p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs">
          <span className="font-bold text-amber-900">Prerequisites & Assumed Knowledge: </span>
          <span className="text-amber-800">{unit.prerequisites.join(', ')}</span>
        </div>

        {/* Learning Outcomes */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Key Learning Outcomes
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {unit.learningOutcomes.map((lo, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{lo}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Assessments */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            Assessment Breakdown
          </h4>
          <div className="space-y-2">
            {unit.assessments.map((a, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">{a.name} <span className="text-slate-400 font-normal">({a.type})</span></span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{a.weight}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${a.weight}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{a.description}</span>
                  <span className="italic shrink-0 ml-2">Due: {a.dueWeek}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle 12-week schedule */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showSchedule ? 'Hide 12-Week Lecture Syllabus' : 'View Full 12-Week Lecture Syllabus'}</span>
            {showSchedule ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showSchedule && (
            <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
              {unit.topics.map((t) => (
                <div key={t.week} className="p-2.5 bg-blue-50/40 rounded-lg border border-blue-100 text-xs">
                  <div className="font-semibold text-blue-950">
                    Week {t.week}: {t.title}
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    {t.summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
