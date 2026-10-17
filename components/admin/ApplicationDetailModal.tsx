'use client';

import React, { useState } from 'react';
import {
  StudentApplication
} from '@/data/applications';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  GraduationCap,
  Award,
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  Briefcase,
  Rocket
} from 'lucide-react';

interface ApplicationDetailModalProps {
  application: StudentApplication;
  onClose: () => void;
  onUpdateStatus: (appId: string, newStatus: StudentApplication['status']) => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
  onUpdateStatus
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const {
    id,
    status,
    studentNumber,
    department,
    createdAt,
    updatedAt,
    personalDetails,
    academicDetails,
    workHistory,
    coursePreferences,
    statementsAndDocuments,
    agentAssessment,
    identityVerificationAudit,
    academicVerificationAudit,
    academicVerificationAudits
  } = application;

  const allAcademicAudits = (academicVerificationAudits && academicVerificationAudits.length > 0)
    ? academicVerificationAudits
    : (academicVerificationAudit ? [academicVerificationAudit] : []);

  const handleCopySummary = () => {
    const text = `
=== EDUPULSE STUDENT APPLICATION DOSSIER ===
Application ID: ${id}
Status: ${status}
Student ID: ${studentNumber || 'Unassigned'}
Faculty/Department: ${department || 'General Admissions'}
Submitted / Updated: ${new Date(updatedAt || createdAt).toLocaleString()}

1. PERSONAL & CONTACT DETAILS
Full Name: ${personalDetails?.fullName || 'N/A'}
Email: ${personalDetails?.email || 'N/A'}
Phone: ${personalDetails?.phone || 'N/A'}
Date of Birth: ${personalDetails?.dateOfBirth || 'N/A'}
Citizenship: ${personalDetails?.citizenship || 'N/A'}
Country of Residence: ${personalDetails?.countryOfResidence || 'N/A'}
Residential Address: ${personalDetails?.address || 'N/A'}

2. ACADEMIC QUALIFICATIONS
Highest Qualification: ${academicDetails?.highestEducation || 'N/A'}
Institution: ${academicDetails?.institutionName || 'N/A'}
Graduation Year: ${academicDetails?.graduationYear || 'N/A'}
ATAR / GPA / Score: ${academicDetails?.atarOrGpa || 'N/A'}
English Proficiency: ${academicDetails?.englishProficiencyTest || 'N/A'}
${academicDetails?.additionalQualifications && academicDetails.additionalQualifications.length > 0 ? `
Additional Qualifications (${academicDetails.additionalQualifications.length}):
${academicDetails.additionalQualifications.map((q, idx) => `  ${idx + 1}. ${q.qualificationLevel} ${q.majorOrFieldOfStudy ? `in ${q.majorOrFieldOfStudy} ` : ''}- ${q.institutionName} (${q.graduationYear || 'N/A'})${q.atarOrGpa ? ` [Score: ${q.atarOrGpa}]` : ''}`).join('\n')}` : ''}

3. WORK HISTORY & ENTREPRENEURIAL ENDEAVOURS
${workHistory && workHistory.length > 0 ? workHistory.map((w, idx) => `  Position ${idx + 1}: ${w.jobTitle || 'Role'} at ${w.companyName || 'Company'}
  Location: ${w.workLocation || 'Unspecified'} | Type: ${w.employmentType || 'Unspecified'}
  Duration: ${w.startDate || '—'} - ${w.isCurrentRole ? 'Present' : (w.endDate || '—')}
  ${w.responsibilities ? `Responsibilities: ${w.responsibilities}` : ''}
  ${w.supervisorName ? `Supervisor: ${w.supervisorName}${w.supervisorPhone ? ` (Phone: ${w.supervisorPhone})` : ''}${w.supervisorEmail ? ` (Email: ${w.supervisorEmail})` : ''}` : ''}
  ${w.isEntrepreneurialOrSelfEmployed ? `Self-Employment/Entrepreneurial: Yes - ${w.entrepreneurialDetails || 'Founder / Self-Employed'}` : ''}`).join('\n\n') : 'No work history provided (Optional).'}

4. COURSE & DEGREE PREFERENCE
Target Degree: ${coursePreferences?.firstChoiceCourseName || 'N/A'} (${coursePreferences?.firstChoiceCourseId || 'N/A'})
Specialization/Major: ${coursePreferences?.majorOrSpecialization || 'Default / Standard Track'}
Intake: ${coursePreferences?.intakeSemester || 'N/A'} ${coursePreferences?.commencingYear || '2026'}
Study Mode: ${coursePreferences?.studyMode || 'Full-time'}

5. STATEMENTS & SUPPORTING DOCUMENTS
Scholarship Interest: ${statementsAndDocuments?.scholarshipInterest ? `Yes (${statementsAndDocuments?.scholarshipName || 'General Assessment'})` : 'No'}
Transcripts Declared: ${statementsAndDocuments?.hasProvidedTranscripts ? 'Yes' : 'Pending'}
Passport/ID Declared: ${statementsAndDocuments?.hasProvidedPassportId ? 'Yes' : 'Pending'}
Declaration Agreed: ${statementsAndDocuments?.declarationAgreed ? 'Certified & Agreed' : 'Pending'}

Statement of Purpose:
"${statementsAndDocuments?.statementOfPurpose || 'No statement submitted.'}"

6. AI DOCUMENT AUTHENTICITY & CREDENTIAL AUDIT
Identity Verification:
${identityVerificationAudit ? `  Document: ${identityVerificationAudit.documentType}
  Brief Description: ${identityVerificationAudit.briefDescription}
  Issuing Body: ${identityVerificationAudit.issuingEntity} (${identityVerificationAudit.country})
  Name on ID: ${identityVerificationAudit.identifiedName || 'N/A'} (Matches: ${identityVerificationAudit.nameMatchesApplicant ? 'Yes' : 'No'})
  Authenticity: ${identityVerificationAudit.authenticityStatus} (${identityVerificationAudit.authenticityScore}%)
  Forensic Review: ${identityVerificationAudit.legitimacyNotes}` : '  No identity document uploaded (Optional).'}

Academic Qualification & Transcript Verification (${allAcademicAudits.length} Document${allAcademicAudits.length > 1 ? 's' : ''}):
${allAcademicAudits.length > 0 ? allAcademicAudits.map((a, idx) => `  [Document #${idx + 1}: ${a.documentType}]
  Brief Description: ${a.briefDescription}
  Awarded by: ${a.issuingEntity} (${a.country})
  Authenticity: ${a.authenticityStatus} (${a.authenticityScore}%)
  Forensic Review: ${a.legitimacyNotes}`).join('\n\n') : '  No qualification images uploaded (Optional).'}
* Privacy Guarantee: Transient In-Memory AI Review Only. Zero image copies stored in database.
===========================================
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(application, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Dossier_${id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: StudentApplication['status']) => {
    setUpdatingStatus(newStatus);
    try {
      await onUpdateStatus(id, newStatus);
    } finally {
      setTimeout(() => setUpdatingStatus(null), 500);
    }
  };

  const wordCount = statementsAndDocuments?.statementOfPurpose
    ? statementsAndDocuments.statementOfPurpose.split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Sticky Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-white sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                {id}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  status === 'Accepted'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : status === 'Submitted'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : status === 'Under Review'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : status === 'Requires Additional Documents'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {status}
              </span>
              {studentNumber && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  ID: {studentNumber}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{personalDetails?.fullName || 'Prospective Applicant'}</span>
            </h2>
            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Submitted: {new Date(createdAt).toLocaleString()}</span>
              <span>•</span>
              <span>Last Modified: {new Date(updatedAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
              title="Copy Formatted Dossier"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
              title="Download Full JSON Dossier"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
              title="Print Dossier"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Personal & Contact Information */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span>1. Personal & Contact Information</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">Step 1 & 2 of Application</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Full Legal Name</span>
                <span className="font-bold text-slate-900 text-sm">{personalDetails?.fullName || '—'}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Email Address</span>
                <a
                  href={`mailto:${personalDetails?.email}`}
                  className="font-bold text-indigo-600 hover:underline flex items-center gap-1 truncate"
                >
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{personalDetails?.email || '—'}</span>
                </a>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Phone Number</span>
                <a
                  href={`tel:${personalDetails?.phone}`}
                  className="font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-1"
                >
                  <Phone className="w-3 h-3 shrink-0 text-slate-400" />
                  <span>{personalDetails?.phone || '—'}</span>
                </a>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Date of Birth</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3 shrink-0 text-slate-400" />
                  <span>{personalDetails?.dateOfBirth || '—'}</span>
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Citizenship Status</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    personalDetails?.citizenship?.includes('Domestic')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}
                >
                  {personalDetails?.citizenship || 'Unspecified'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Country of Residence</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Globe className="w-3 h-3 shrink-0 text-slate-400" />
                  <span>{personalDetails?.countryOfResidence || '—'}</span>
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs sm:col-span-2 md:col-span-3">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Residential Street Address</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{personalDetails?.address || '—'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Qualifications & Scores */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>2. Academic History & Entry Qualifications</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">Step 3 of Application</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Highest Qualification</span>
                <span className="font-extrabold text-indigo-700">{academicDetails?.highestEducation || '—'}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs sm:col-span-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Institution / High School / University</span>
                <span className="font-bold text-slate-800">{academicDetails?.institutionName || '—'}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Graduation Year</span>
                <span className="font-bold text-slate-800">{academicDetails?.graduationYear || '—'}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">ATAR / GPA / Score</span>
                <span className="inline-block px-2.5 py-0.5 rounded-lg font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {academicDetails?.atarOrGpa || 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">English Language Proficiency</span>
                <span className="font-bold text-slate-800">{academicDetails?.englishProficiencyTest || 'Verified / Native Speaker'}</span>
              </div>
            </div>

            {/* Additional Academic Qualifications */}
            {academicDetails?.additionalQualifications && academicDetails.additionalQualifications.length > 0 && (
              <div className="pt-3 border-t border-slate-200/70 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Additional Educational Qualifications ({academicDetails.additionalQualifications.length})</span>
                </span>
                <div className="space-y-2">
                  {academicDetails.additionalQualifications.map((qual, idx) => (
                    <div
                      key={qual.id || idx}
                      className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-extrabold text-indigo-700 text-xs flex items-center gap-1.5">
                          <span>{qual.qualificationLevel}</span>
                          {qual.majorOrFieldOfStudy && (
                            <span className="text-slate-700 font-semibold">• {qual.majorOrFieldOfStudy}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {qual.institutionName || 'Unspecified Institution'} {qual.country ? `(${qual.country})` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-slate-600 shrink-0">
                        {qual.graduationYear && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">Year: {qual.graduationYear}</span>
                        )}
                        {qual.atarOrGpa && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-mono font-bold">
                            Score: {qual.atarOrGpa}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Work History & Entrepreneurial Endeavours */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>3. Work History & Entrepreneurial Endeavours</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">Step 4 of Application</span>
            </div>

            {workHistory && workHistory.length > 0 ? (
              <div className="space-y-3">
                {workHistory.map((work, idx) => (
                  <div
                    key={work.id || idx}
                    className="p-4 bg-white rounded-xl border border-slate-200/70 shadow-2xs space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-100 shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm">{work.jobTitle || 'Role Unspecified'}</span>
                          <span className="text-slate-600 font-semibold text-xs ml-1.5">at {work.companyName || 'Company Unspecified'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {work.employmentType && (
                          <span className="px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {work.employmentType}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {work.startDate || '—'} – {work.isCurrentRole ? 'Present' : (work.endDate || '—')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px]">
                      {work.workLocation && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Location: <strong className="text-slate-900">{work.workLocation}</strong></span>
                        </div>
                      )}
                      {work.supervisorName && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Supervisor: <strong className="text-slate-900">{work.supervisorName}</strong></span>
                        </div>
                      )}
                      {work.supervisorPhone && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a href={`tel:${work.supervisorPhone}`} className="hover:text-indigo-600 underline">
                            {work.supervisorPhone}
                          </a>
                        </div>
                      )}
                      {work.supervisorEmail && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a href={`mailto:${work.supervisorEmail}`} className="hover:text-indigo-600 underline truncate">
                            {work.supervisorEmail}
                          </a>
                        </div>
                      )}
                    </div>

                    {work.responsibilities && (
                      <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 text-[11px] text-slate-700">
                        <span className="font-semibold text-slate-900 block mb-0.5">Key Responsibilities & Achievements:</span>
                        <p className="whitespace-pre-line leading-relaxed">{work.responsibilities}</p>
                      </div>
                    )}

                    {work.isEntrepreneurialOrSelfEmployed && (
                      <div className="p-3 bg-purple-50/70 rounded-lg border border-purple-100 text-[11px] text-purple-950 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-purple-900">
                          <Rocket className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>Entrepreneurial / Self-Employment Endeavour</span>
                        </div>
                        {work.entrepreneurialDetails && (
                          <p className="whitespace-pre-line text-purple-900 leading-relaxed pl-5">
                            {work.entrepreneurialDetails}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No work history or entrepreneurial endeavours declared (Optional).
              </div>
            )}
          </div>

          {/* Section 4: Course & Degree Preferences */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>4. Course & Degree Preferences</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">Step 5 of Application</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 bg-white rounded-xl border border-indigo-100 shadow-2xs sm:col-span-2">
                <span className="text-[11px] font-semibold text-indigo-500 block mb-0.5">First Choice Degree Program</span>
                <div className="font-extrabold text-indigo-950 text-sm">
                  {coursePreferences?.firstChoiceCourseName || 'Not Selected'}
                </div>
                {coursePreferences?.firstChoiceCourseId && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-mono font-bold uppercase">
                    Code: {coursePreferences.firstChoiceCourseId}
                  </span>
                )}
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Specialization / Major</span>
                <span className="font-bold text-slate-800">
                  {coursePreferences?.majorOrSpecialization || 'Standard Core Specialization'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Intake Semester</span>
                <span className="font-bold text-slate-800">
                  {coursePreferences?.intakeSemester || 'February (Semester 1)'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Commencing Year</span>
                <span className="font-bold text-slate-800">
                  {coursePreferences?.commencingYear || '2026'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Study Mode</span>
                <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded font-bold text-[11px]">
                  {coursePreferences?.studyMode || 'Full-time (On-Campus)'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Statement of Purpose & Scholarship Interest */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>5. Statement of Purpose & Scholarships</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">Step 6 of Application</span>
            </div>

            {/* Statement of Purpose */}
            <div className="p-4 bg-white rounded-xl border border-slate-200/70 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-xs">Statement of Purpose</span>
                <span className="text-[10px] text-slate-400 font-mono">{wordCount} words</span>
              </div>
              <p className="text-slate-800 italic leading-relaxed pl-3 border-l-2 border-indigo-400 whitespace-pre-line text-xs sm:text-[13px]">
                {statementsAndDocuments?.statementOfPurpose
                  ? `"${statementsAndDocuments.statementOfPurpose}"`
                  : 'No personal statement provided.'}
              </p>
            </div>

            {/* Scholarships & Declarations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Scholarship Consideration</span>
                {statementsAndDocuments?.scholarshipInterest ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Yes, Assess for Scholarships
                    </span>
                    {statementsAndDocuments.scholarshipName && (
                      <span className="text-xs font-semibold text-indigo-900">
                        ({statementsAndDocuments.scholarshipName})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500 font-semibold">Not requested</span>
                )}
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Document Declarations</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    {statementsAndDocuments?.hasProvidedTranscripts ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span>Certified Academic Transcripts: {statementsAndDocuments?.hasProvidedTranscripts ? 'Ready / Provided' : 'Pending'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    {statementsAndDocuments?.hasProvidedPassportId ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span>Passport / Government Photo ID: {statementsAndDocuments?.hasProvidedPassportId ? 'Ready / Provided' : 'Pending'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    {statementsAndDocuments?.declarationAgreed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span>Student Declaration: {statementsAndDocuments?.declarationAgreed ? 'Certified & Agreed' : 'Pending'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: AI Pre-Screening Assessment */}
          {agentAssessment && (
            <div className="bg-indigo-50/60 rounded-2xl border border-indigo-100 p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>AI Pre-Screening & Telemetry</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white font-mono">
                  Score: {agentAssessment.eligibilityScore}%
                </span>
              </div>
              {agentAssessment.recommendations && agentAssessment.recommendations.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-indigo-800">Recommendations:</span>
                  <ul className="list-disc list-inside text-indigo-900 space-y-0.5 pl-1">
                    {agentAssessment.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Section 6: AI Document Authenticity & Credential Verification Notes */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>6. AI Document Authenticity & Verification Notes</span>
              </h3>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 self-start sm:self-auto">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Zero Copies Stored • Transient AI Review</span>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Proof of Identity Audit Note */}
              <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Proof of Identity Document (Step 2)</span>
                  </div>
                  {identityVerificationAudit ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        identityVerificationAudit.authenticityStatus === 'Legitimate'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {identityVerificationAudit.authenticityStatus} ({identityVerificationAudit.authenticityScore}%)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Not Uploaded</span>
                  )}
                </div>

                {identityVerificationAudit ? (
                  <div className="space-y-2.5 text-[11px]">
                    {/* Brief Description */}
                    <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-100/90 text-indigo-950 space-y-0.5">
                      <span className="font-extrabold text-[10px] text-indigo-700 uppercase tracking-wider block">
                        Document Brief Description:
                      </span>
                      <p className="font-semibold text-xs leading-relaxed text-indigo-900">
                        {identityVerificationAudit.briefDescription}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px]">What document:</span>
                        <strong className="text-slate-900 font-bold">{identityVerificationAudit.documentType}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Where from:</span>
                        <strong className="text-slate-900 font-bold">
                          {identityVerificationAudit.issuingEntity} ({identityVerificationAudit.country})
                        </strong>
                      </div>
                    </div>

                    <div className="text-slate-600">
                      <span className="text-slate-400 block text-[10px]">Name on Document:</span>
                      <span className="font-semibold text-slate-900">{identityVerificationAudit.identifiedName || '—'}</span>
                      {identityVerificationAudit.nameMatchesApplicant && (
                        <span className="ml-1.5 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          ✓ Matches Applicant Name
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed text-[11px]">
                      <span className="font-bold text-slate-900 block mb-0.5">Authenticity Analysis:</span>
                      <p>{identityVerificationAudit.legitimacyNotes}</p>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-0.5">
                      Verified: {new Date(identityVerificationAudit.verifiedAt).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px] py-2">
                    Applicant did not upload an identity document image. Personal details were entered manually in Step 2.
                  </p>
                )}
              </div>

              {/* Academic Qualification & Transcript Audit Notes (Each in its own box) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Academic Qualification & Transcript Verification (Step 3)</span>
                  </div>
                  {allAcademicAudits.length > 0 ? (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      {allAcademicAudits.length} Verified Document{allAcademicAudits.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Not Uploaded</span>
                  )}
                </div>

                {allAcademicAudits.length > 0 ? (
                  allAcademicAudits.map((audit, idx) => (
                    <div
                      key={audit.id || idx}
                      className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-xs text-slate-900">{audit.documentType}</span>
                            {audit.filename && (
                              <span className="text-[10px] text-slate-400 ml-1.5">({audit.filename})</span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            audit.authenticityStatus === 'Legitimate'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {audit.authenticityStatus} ({audit.authenticityScore}%)
                        </span>
                      </div>

                      <div className="space-y-2 text-[11px]">
                        {/* Brief Description */}
                        <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-100/90 text-indigo-950 space-y-0.5">
                          <span className="font-extrabold text-[10px] text-indigo-700 uppercase tracking-wider block">
                            Qualification Brief Description:
                          </span>
                          <p className="font-semibold text-xs leading-relaxed text-indigo-900">
                            {audit.briefDescription}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[10px]">What qualification:</span>
                            <strong className="text-slate-900 font-bold">{audit.documentType}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Where from:</span>
                            <strong className="text-slate-900 font-bold">
                              {audit.issuingEntity} ({audit.country})
                            </strong>
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed text-[11px]">
                          <span className="font-bold text-slate-900 block mb-0.5">Authenticity Analysis:</span>
                          <p>{audit.legitimacyNotes}</p>
                        </div>

                        <div className="text-[10px] text-slate-400 pt-0.5">
                          Verified: {new Date(audit.verifiedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-[11px] py-2 bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                    Applicant did not upload a qualification certificate or transcript image. Academic history was provided manually in Step 3.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Decision & Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 sticky bottom-0 z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>Admissions Board Decision:</span>
            {updatingStatus && (
              <span className="text-indigo-600 font-semibold animate-pulse">
                Updating to {updatingStatus}...
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleStatusChange('Accepted')}
              disabled={status === 'Accepted'}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Issue Offer (Accept)</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('Under Review')}
              disabled={status === 'Under Review'}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Set Under Review</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('Requires Additional Documents')}
              disabled={status === 'Requires Additional Documents'}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Request Additional Docs</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('Draft')}
              disabled={status === 'Draft'}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Revert to Draft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
