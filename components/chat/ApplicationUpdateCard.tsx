import React from 'react';
import { StudentApplication } from '@/data/applications';
import { FileText, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface ApplicationUpdateCardProps {
  application: StudentApplication;
  onOpenPortal?: () => void;
}

export const ApplicationUpdateCard: React.FC<ApplicationUpdateCardProps> = ({
  application,
  onOpenPortal
}) => {
  // Calculate completion
  const fields = [
    Boolean(application.personalDetails.fullName),
    Boolean(application.personalDetails.email),
    Boolean(application.personalDetails.citizenship),
    Boolean(application.academicDetails.highestEducation),
    Boolean(application.coursePreferences.firstChoiceCourseName),
  ];
  const completedCount = fields.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / fields.length) * 100);

  const isSubmitted = application.status === 'Submitted';

  return (
    <div className={`my-3 rounded-2xl border shadow-sm overflow-hidden transition-all ${
      isSubmitted ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white border-indigo-100'
    }`}>
      <div className={`p-4 ${isSubmitted ? 'bg-gradient-to-r from-emerald-800 to-teal-800 text-white' : 'bg-slate-900 text-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-300" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isSubmitted ? 'Application Submitted' : 'Live Application Form Draft'}
            </span>
          </div>
          <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">
            {application.id}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">Form Completion Progress</span>
            <span className="font-bold text-indigo-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Overview fields */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] text-slate-500">Applicant</div>
            <div className="font-semibold text-slate-800 truncate">
              {application.personalDetails.fullName || 'Not provided'}
            </div>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] text-slate-500">Chosen Degree</div>
            <div className="font-semibold text-slate-800 truncate">
              {application.coursePreferences.firstChoiceCourseName || 'Not selected'}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {onOpenPortal && (
          <button
            onClick={onOpenPortal}
            className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
          >
            <span>{isSubmitted ? 'View Full Application Summary' : 'Open & Complete Application Form'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
