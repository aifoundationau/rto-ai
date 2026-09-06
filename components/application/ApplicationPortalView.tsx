import React, { useState } from 'react';
import { StudentApplication } from '@/data/applications';
import { COURSES_DATA } from '@/data/courses';
import {
  FileText,
  User,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ApplicationPortalViewProps {
  application: StudentApplication;
  onUpdateApplication: (app: StudentApplication) => void;
  onBackToChat: () => void;
}

export const ApplicationPortalView: React.FC<ApplicationPortalViewProps> = ({
  application,
  onUpdateApplication,
  onBackToChat
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(application.status === 'Submitted');

  const steps = [
    { num: 1, title: 'Personal Details', icon: User },
    { num: 2, title: 'Academic History', icon: GraduationCap },
    { num: 3, title: 'Degree Preference', icon: BookOpen },
    { num: 4, title: 'Statement & Docs', icon: FileText },
    { num: 5, title: 'Review & Submit', icon: ShieldCheck }
  ];

  const handleFieldChange = (section: keyof StudentApplication, field: string, value: any) => {
    const updated = {
      ...application,
      [section]: {
        ...(application[section] as any),
        [field]: value
      },
      updatedAt: new Date().toISOString()
    };
    onUpdateApplication(updated);
  };

  const handleCourseSelect = (courseId: string) => {
    const found = COURSES_DATA.find((c) => c.id === courseId);
    if (!found) return;

    const updated = {
      ...application,
      coursePreferences: {
        ...application.coursePreferences,
        firstChoiceCourseId: found.id,
        firstChoiceCourseName: found.title,
        majorOrSpecialization: found.majors[0]?.name || ''
      },
      updatedAt: new Date().toISOString()
    };
    onUpdateApplication(updated);
  };

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    try {
      const updated: StudentApplication = {
        ...application,
        status: 'Submitted',
        statementsAndDocuments: {
          ...application.statementsAndDocuments,
          declarationAgreed: true
        },
        updatedAt: new Date().toISOString()
      };

      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application: updated })
      });

      onUpdateApplication(updated);
      setSubmitSuccess(true);
      setActiveStep(5);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Failed to submit application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadSummary = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(application, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Application_${application.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const selectedCourse = COURSES_DATA.find((c) => c.id === application.coursePreferences.firstChoiceCourseId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-primary-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
              Admissions Portal
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              application.status === 'Submitted'
                ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
            }`}>
              Status: {application.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Student Application Form
          </h1>
          <p className="text-sm text-indigo-200 mt-1">
            Application ID: <span className="font-mono font-bold text-white">{application.id}</span> • Auto-synced with EduPulse AI
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AI Chat</span>
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.num;
            const isCompleted = activeStep > s.num || submitSuccess;

            return (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`p-3 rounded-xl text-left transition-all flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-950 font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <div className="min-w-0">
                  <div className="text-xs truncate">{s.title}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Form Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        {/* Step 1: Personal Details */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Step 1: Personal & Contact Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Please provide your legal personal details as they appear on your passport or ID.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={application.personalDetails.fullName}
                  onChange={(e) => handleFieldChange('personalDetails', 'fullName', e.target.value)}
                  placeholder="e.g. Alex Taylor"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={application.personalDetails.email}
                  onChange={(e) => handleFieldChange('personalDetails', 'email', e.target.value)}
                  placeholder="e.g. alex.taylor@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  value={application.personalDetails.phone}
                  onChange={(e) => handleFieldChange('personalDetails', 'phone', e.target.value)}
                  placeholder="e.g. +61 412 345 678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={application.personalDetails.dateOfBirth}
                  onChange={(e) => handleFieldChange('personalDetails', 'dateOfBirth', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Citizenship Status *</label>
                <select
                  value={application.personalDetails.citizenship}
                  onChange={(e) => handleFieldChange('personalDetails', 'citizenship', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                >
                  <option value="">-- Select Citizenship --</option>
                  <option value="Domestic (Australian/NZ Citizen/PR)">Domestic (Australian/NZ Citizen/PR)</option>
                  <option value="International">International Student</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country of Residence</label>
                <input
                  type="text"
                  value={application.personalDetails.countryOfResidence}
                  onChange={(e) => handleFieldChange('personalDetails', 'countryOfResidence', e.target.value)}
                  placeholder="e.g. Australia, Singapore, India, USA"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={application.personalDetails.address}
                  onChange={(e) => handleFieldChange('personalDetails', 'address', e.target.value)}
                  placeholder="Street Address, Suburb/City, State, Postcode"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Academic History */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Step 2: Academic Qualifications & Transcripts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter details regarding your most recent high school or tertiary education.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Highest Qualification *</label>
                <select
                  value={application.academicDetails.highestEducation}
                  onChange={(e) => handleFieldChange('academicDetails', 'highestEducation', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                >
                  <option value="">-- Select Highest Education --</option>
                  <option value="High School / Year 12">High School / Year 12 / IB</option>
                  <option value="Bachelor Degree">Bachelor Degree</option>
                  <option value="Master Degree">Master Degree</option>
                  <option value="Diploma / TAFE">Diploma / TAFE Vocational</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  value={application.academicDetails.institutionName}
                  onChange={(e) => handleFieldChange('academicDetails', 'institutionName', e.target.value)}
                  placeholder="e.g. Sydney Grammar School / University of Sydney"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
                <input
                  type="text"
                  value={application.academicDetails.graduationYear}
                  onChange={(e) => handleFieldChange('academicDetails', 'graduationYear', e.target.value)}
                  placeholder="e.g. 2025"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ATAR / GPA / Average Score</label>
                <input
                  type="text"
                  value={application.academicDetails.atarOrGpa}
                  onChange={(e) => handleFieldChange('academicDetails', 'atarOrGpa', e.target.value)}
                  placeholder="e.g. ATAR 88.50 or GPA 3.8/4.0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">English Proficiency Test (If Applicable)</label>
                <input
                  type="text"
                  value={application.academicDetails.englishProficiencyTest || ''}
                  onChange={(e) => handleFieldChange('academicDetails', 'englishProficiencyTest', e.target.value)}
                  placeholder="e.g. IELTS 7.5 Overall / Native English Speaker"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Degree Preference */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Step 3: Degree & Major Preferences
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Select the university degree you wish to apply for.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Choice Degree *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COURSES_DATA.map((c) => {
                    const isSelected = application.coursePreferences.firstChoiceCourseId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleCourseSelect(c.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-white rounded border border-slate-200 text-indigo-700">
                            {c.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">{c.degreeLevel}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mt-2">{c.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.overview}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedCourse && selectedCourse.majors.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization / Major</label>
                  <select
                    value={application.coursePreferences.majorOrSpecialization || ''}
                    onChange={(e) => handleFieldChange('coursePreferences', 'majorOrSpecialization', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                  >
                    {selectedCourse.majors.map((m, idx) => (
                      <option key={idx} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Intake Semester *</label>
                  <select
                    value={application.coursePreferences.intakeSemester}
                    onChange={(e) => handleFieldChange('coursePreferences', 'intakeSemester', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                  >
                    <option value="">-- Select Intake --</option>
                    <option value="February (Semester 1)">February (Semester 1)</option>
                    <option value="July (Semester 2)">July (Semester 2)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Study Mode *</label>
                  <select
                    value={application.coursePreferences.studyMode}
                    onChange={(e) => handleFieldChange('coursePreferences', 'studyMode', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                  >
                    <option value="">-- Select Mode --</option>
                    <option value="Full-time">Full-time (On-Campus)</option>
                    <option value="Part-time">Part-time (On-Campus)</option>
                    <option value="Online">Online / Distance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Commencing Year</label>
                  <input
                    type="text"
                    value={application.coursePreferences.commencingYear}
                    onChange={(e) => handleFieldChange('coursePreferences', 'commencingYear', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Statement of Purpose & Supporting Details */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Step 4: Statement of Purpose & Scholarships
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Share your motivation and scholarship interests.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statement of Purpose / Personal Statement (approx. 200-500 words)
              </label>
              <textarea
                rows={5}
                value={application.statementsAndDocuments.statementOfPurpose}
                onChange={(e) => handleFieldChange('statementsAndDocuments', 'statementOfPurpose', e.target.value)}
                placeholder="Explain why you wish to study this program, your academic and career goals, and how you will contribute to the university community..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
              />
              <div className="text-[11px] text-slate-400 text-right mt-1">
                {application.statementsAndDocuments.statementOfPurpose.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={application.statementsAndDocuments.scholarshipInterest}
                  onChange={(e) => handleFieldChange('statementsAndDocuments', 'scholarshipInterest', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-indigo-950">
                  I wish to be automatically assessed for university scholarships (e.g. Vice-Chancellor’s Excellence, STEM Grants)
                </span>
              </label>

              {application.statementsAndDocuments.scholarshipInterest && (
                <input
                  type="text"
                  value={application.statementsAndDocuments.scholarshipName || ''}
                  onChange={(e) => handleFieldChange('statementsAndDocuments', 'scholarshipName', e.target.value)}
                  placeholder="Preferred scholarship name (optional)"
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-800"
                />
              )}
            </div>

            {/* Document Checkboxes */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Supporting Document Declarations</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={application.statementsAndDocuments.hasProvidedTranscripts}
                    onChange={(e) => handleFieldChange('statementsAndDocuments', 'hasProvidedTranscripts', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-slate-700">I have certified official academic transcripts ready for verification</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={application.statementsAndDocuments.hasProvidedPassportId}
                    onChange={(e) => handleFieldChange('statementsAndDocuments', 'hasProvidedPassportId', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-slate-700">I have government-issued passport or photo identification</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Step 5: Review & Final Submission
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Please review your application summary before final submission.</p>
            </div>

            {submitSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-sm">Application Successfully Submitted!</div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    Your application reference is <strong>{application.id}</strong>. Our admissions board has received your file.
                  </div>
                </div>
              </div>
            )}

            {/* Summary Review Card */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-medium">Applicant Name:</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{application.personalDetails.fullName || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Email:</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{application.personalDetails.email || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Citizenship:</span>
                  <div className="font-bold text-slate-800 mt-0.5">{application.personalDetails.citizenship || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Academic Level:</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {application.academicDetails.highestEducation || '—'} {application.academicDetails.atarOrGpa ? `(${application.academicDetails.atarOrGpa})` : ''}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Applied Course:</span>
                  <div className="font-bold text-indigo-700 text-sm mt-0.5">
                    {application.coursePreferences.firstChoiceCourseName || '—'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Intake & Mode:</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {application.coursePreferences.intakeSemester || '—'} • {application.coursePreferences.studyMode || '—'}
                  </div>
                </div>
              </div>

              {application.statementsAndDocuments.statementOfPurpose && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-slate-400 font-medium">Statement of Purpose:</span>
                  <p className="mt-1 text-slate-700 italic bg-white p-3 rounded-xl border border-slate-200 line-clamp-4">
                    &quot;{application.statementsAndDocuments.statementOfPurpose}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Declaration Checkbox */}
            {!submitSuccess && (
              <label className="flex items-start gap-3 p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={application.statementsAndDocuments.declarationAgreed}
                  onChange={(e) => handleFieldChange('statementsAndDocuments', 'declarationAgreed', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                />
                <span className="text-xs text-indigo-950 leading-relaxed">
                  I declare that all information and transcripts provided in this application are true and complete. I authorize the University Admissions Board to verify my academic credentials.
                </span>
              </label>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleDownloadSummary}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Application (JSON)</span>
              </button>

              {!submitSuccess && (
                <button
                  onClick={handleSubmitApplication}
                  disabled={!application.statementsAndDocuments.declarationAgreed || isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting Application...' : 'Submit Official Application'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step Navigation Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>

          {activeStep < 5 && (
            <button
              onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
