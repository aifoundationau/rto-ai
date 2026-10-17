import React, { useState, useEffect } from 'react';
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
  Send,
  Lock,
  Plus,
  Trash2,
  Briefcase,
  Building,
  MapPin,
  Phone,
  Mail,
  Rocket,
  Upload,
  FileCheck,
  Loader2,
  Check
} from 'lucide-react';
import { WorkHistoryItem, DocumentAuthenticityAudit } from '@/data/applications';
import confetti from 'canvas-confetti';

interface ApplicationPortalViewProps {
  application: StudentApplication;
  onUpdateApplication: (app: StudentApplication) => void;
  onBackToChat: () => void;
  currentUser?: any;
  onGoogleSignIn?: () => void;
}

export const ApplicationPortalView: React.FC<ApplicationPortalViewProps> = ({
  application,
  onUpdateApplication,
  onBackToChat,
  currentUser,
  onGoogleSignIn
}) => {
  const isRegistered = !!currentUser;
  const [activeStep, setActiveStep] = useState(isRegistered ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(application.status === 'Submitted');
  const [submitError, setSubmitError] = useState('');
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);
  const [isVerifyingAcademic, setIsVerifyingAcademic] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Fields marked * in the form must be filled before submission
  const missingRequiredFields = [
    !application.personalDetails.fullName.trim() && 'Full Legal Name',
    !application.personalDetails.email.trim() && 'Email Address',
    !application.personalDetails.phone.trim() && 'Contact Phone',
    !application.personalDetails.citizenship && 'Citizenship Status',
    !application.academicDetails.highestEducation && 'Highest Qualification',
    !application.coursePreferences.firstChoiceCourseName && 'First Choice Degree',
    !application.coursePreferences.intakeSemester && 'Intake Semester',
    !application.coursePreferences.studyMode && 'Study Mode'
  ].filter(Boolean) as string[];

  const handleUploadDocument = async (category: 'identity' | 'academic', file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (e.g. JPG, PNG, WebP).');
      return;
    }

    if (category === 'identity') setIsVerifyingIdentity(true);
    else setIsVerifyingAcademic(true);
    setVerificationError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        try {
          const res = await fetch('/api/applications/verify-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentCategory: category,
              imageBase64: base64,
              mimeType: file.type,
              applicantName: application.personalDetails.fullName,
              fileName: file.name
            })
          });

          if (!res.ok) {
            throw new Error(`Verification service error (${res.status})`);
          }

          const data = await res.json();
          if (data.success && data.audit) {
            if (category === 'academic') {
              const currentAudits = (application.academicVerificationAudits && application.academicVerificationAudits.length > 0)
                ? application.academicVerificationAudits
                : (application.academicVerificationAudit ? [application.academicVerificationAudit] : []);
              const newAudit: DocumentAuthenticityAudit = {
                ...data.audit,
                id: data.audit.id || `acad_audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                filename: file.name
              };
              const nextAudits = [...currentAudits, newAudit];
              const updated: StudentApplication = {
                ...application,
                academicVerificationAudit: nextAudits[0],
                academicVerificationAudits: nextAudits,
                updatedAt: new Date().toISOString()
              };
              onUpdateApplication(updated);
            } else {
              const updated: StudentApplication = {
                ...application,
                identityVerificationAudit: {
                  ...data.audit,
                  id: data.audit.id || `id_audit_${Date.now()}`,
                  filename: file.name
                },
                updatedAt: new Date().toISOString()
              };
              onUpdateApplication(updated);
            }
          }
        } catch (err: any) {
          console.error('Document verification error:', err);
          setVerificationError(`Failed to verify document: ${err.message || 'Error occurred'}`);
        } finally {
          if (category === 'identity') setIsVerifyingIdentity(false);
          else setIsVerifyingAcademic(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('File read error:', err);
      if (category === 'identity') setIsVerifyingIdentity(false);
      else setIsVerifyingAcademic(false);
    }
  };

  const handleRemoveAcademicDocument = (auditId?: string) => {
    const currentAudits = (application.academicVerificationAudits && application.academicVerificationAudits.length > 0)
      ? application.academicVerificationAudits
      : (application.academicVerificationAudit ? [application.academicVerificationAudit] : []);
    const remaining = auditId
      ? currentAudits.filter((a, idx) => (a.id ? a.id !== auditId : String(idx) !== auditId))
      : [];
    const updated: StudentApplication = {
      ...application,
      academicVerificationAudit: remaining.length > 0 ? remaining[0] : undefined,
      academicVerificationAudits: remaining,
      updatedAt: new Date().toISOString()
    };
    onUpdateApplication(updated);
  };

  const handleRemoveVerification = (category: 'identity' | 'academic') => {
    if (category === 'academic') {
      const updated: StudentApplication = {
        ...application,
        academicVerificationAudit: undefined,
        academicVerificationAudits: [],
        updatedAt: new Date().toISOString()
      };
      onUpdateApplication(updated);
    } else {
      const updated: StudentApplication = {
        ...application,
        identityVerificationAudit: undefined,
        updatedAt: new Date().toISOString()
      };
      onUpdateApplication(updated);
    }
  };

  // If user registers or logs in while on Step 1, auto-advance to Personal Details (Step 2)
  useEffect(() => {
    if (isRegistered && activeStep === 1) {
      setActiveStep(2);
    }
  }, [isRegistered]);

  // Pre-populate email and name from Google account if missing
  useEffect(() => {
    if (currentUser?.email && !application.personalDetails.email) {
      onUpdateApplication({
        ...application,
        personalDetails: {
          ...application.personalDetails,
          fullName: application.personalDetails.fullName || currentUser.name || '',
          email: currentUser.email
        }
      });
    }
  }, [currentUser]);

  const steps = [
    { num: 1, title: isRegistered ? 'Registered (Supporter)' : 'Google Register / Log On', icon: null },
    { num: 2, title: 'Personal Details', icon: User },
    { num: 3, title: 'Academic History', icon: GraduationCap },
    { num: 4, title: 'Work History', icon: Briefcase },
    { num: 5, title: 'Degree Preference', icon: BookOpen },
    { num: 6, title: 'Statement & Docs', icon: FileText },
    { num: 7, title: 'Review & Submit', icon: ShieldCheck }
  ];

  const handleFieldChange = (section: keyof StudentApplication, field: string, value: any) => {
    if (!isRegistered) return;
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

  const handleAddAcademicHistory = () => {
    if (!isRegistered) return;
    const currentList = application.academicDetails.additionalQualifications || [];
    const newQual = {
      id: `qual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      qualificationLevel: 'Bachelor Degree',
      institutionName: '',
      graduationYear: '',
      majorOrFieldOfStudy: '',
      atarOrGpa: '',
      country: ''
    };
    const updated: StudentApplication = {
      ...application,
      academicDetails: {
        ...application.academicDetails,
        additionalQualifications: [...currentList, newQual]
      },
      updatedAt: new Date().toISOString()
    };
    onUpdateApplication(updated);
  };

  const handleRemoveAcademicHistory = (qualId: string) => {
    if (!isRegistered) return;
    const currentList = application.academicDetails.additionalQualifications || [];
    const updated: StudentApplication = {
      ...application,
      academicDetails: {
        ...application.academicDetails,
        additionalQualifications: currentList.filter(q => q.id !== qualId)
      },
      updatedAt: new Date().toISOString()
    };
    onUpdateApplication(updated);
  };

  const handleUpdateAcademicHistory = (qualId: string, field: string, value: string) => {
    if (!isRegistered) return;
    const currentList = application.academicDetails.additionalQualifications || [];
    const updated: StudentApplication = {
      ...application,
      academicDetails: {
        ...application.academicDetails,
        additionalQualifications: currentList.map(q => q.id === qualId ? { ...q, [field]: value } : q)
      },
      updatedAt: new Date().toISOString()
    };
    onUpdateApplication(updated);
  };

  const handleAddWorkHistory = () => {
    if (!isRegistered) return;
    const baseList = (application.workHistory && application.workHistory.length > 0)
      ? application.workHistory
      : [{
          id: `work_${Date.now()}_primary`,
          jobTitle: '',
          companyName: '',
          workLocation: '',
          employmentType: 'Full-time',
          startDate: '',
          endDate: '',
          isCurrentRole: false,
          responsibilities: '',
          supervisorName: '',
          supervisorPhone: '',
          supervisorEmail: '',
          isEntrepreneurialOrSelfEmployed: false,
          entrepreneurialDetails: ''
        }];
    const newWork: WorkHistoryItem = {
      id: `work_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      jobTitle: '',
      companyName: '',
      workLocation: '',
      employmentType: 'Full-time',
      startDate: '',
      endDate: '',
      isCurrentRole: false,
      responsibilities: '',
      supervisorName: '',
      supervisorPhone: '',
      supervisorEmail: '',
      isEntrepreneurialOrSelfEmployed: false,
      entrepreneurialDetails: ''
    };
    const updated: StudentApplication = {
      ...application,
      workHistory: [...baseList, newWork],
      updatedAt: new Date().toISOString()
    };
    onUpdateApplication(updated);
  };

  const handleRemoveWorkHistory = (workId: string) => {
    if (!isRegistered) return;
    const currentList = application.workHistory || [];
    if (currentList.length <= 1) {
      const resetList: WorkHistoryItem[] = [{
        id: `work_${Date.now()}`,
        jobTitle: '',
        companyName: '',
        workLocation: '',
        employmentType: 'Full-time',
        startDate: '',
        endDate: '',
        isCurrentRole: false,
        responsibilities: '',
        supervisorName: '',
        supervisorPhone: '',
        supervisorEmail: '',
        isEntrepreneurialOrSelfEmployed: false,
        entrepreneurialDetails: ''
      }];
      const updated: StudentApplication = {
        ...application,
        workHistory: resetList,
        updatedAt: new Date().toISOString()
      };
      onUpdateApplication(updated);
      return;
    }
    const updated: StudentApplication = {
      ...application,
      workHistory: currentList.filter(w => w.id !== workId),
      updatedAt: new Date().toISOString()
    };
    onUpdateApplication(updated);
  };

  const handleClearWorkHistory = (workId: string) => {
    if (!isRegistered) return;
    const baseList = (application.workHistory && application.workHistory.length > 0)
      ? application.workHistory
      : [{
          id: workId,
          jobTitle: '',
          companyName: '',
          workLocation: '',
          employmentType: 'Full-time',
          startDate: '',
          endDate: '',
          isCurrentRole: false,
          responsibilities: '',
          supervisorName: '',
          supervisorPhone: '',
          supervisorEmail: '',
          isEntrepreneurialOrSelfEmployed: false,
          entrepreneurialDetails: ''
        }];
    const updated: StudentApplication = {
      ...application,
      workHistory: baseList.map(w => w.id === workId ? {
        id: w.id,
        jobTitle: '',
        companyName: '',
        workLocation: '',
        employmentType: 'Full-time',
        startDate: '',
        endDate: '',
        isCurrentRole: false,
        responsibilities: '',
        supervisorName: '',
        supervisorPhone: '',
        supervisorEmail: '',
        isEntrepreneurialOrSelfEmployed: false,
        entrepreneurialDetails: ''
      } : w),
      updatedAt: new Date().toISOString()
    };
    onUpdateApplication(updated);
  };

  const handleUpdateWorkHistory = (workId: string, field: string, value: any) => {
    if (!isRegistered) return;
    const baseList = (application.workHistory && application.workHistory.length > 0)
      ? application.workHistory
      : [{
          id: workId,
          jobTitle: '',
          companyName: '',
          workLocation: '',
          employmentType: 'Full-time',
          startDate: '',
          endDate: '',
          isCurrentRole: false,
          responsibilities: '',
          supervisorName: '',
          supervisorPhone: '',
          supervisorEmail: '',
          isEntrepreneurialOrSelfEmployed: false,
          entrepreneurialDetails: ''
        }];
    const updated: StudentApplication = {
      ...application,
      workHistory: baseList.map(w => w.id === workId ? { ...w, [field]: value } : w),
      updatedAt: new Date().toISOString()
    };
    onUpdateApplication(updated);
  };

  const handleCourseSelect = (courseId: string) => {
    if (!isRegistered) return;
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
    if (missingRequiredFields.length > 0) {
      setSubmitError(`Please complete: ${missingRequiredFields.join(', ')}.`);
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
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

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application: updated })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with ${res.status}`);
      }

      onUpdateApplication(updated);
      setSubmitSuccess(true);
      setActiveStep(7);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.error('Failed to submit application:', err);
      setSubmitError(`Submission failed: ${err?.message || 'network error'}. Your draft is saved — please try again.`);
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

  const selectedCourse =
    COURSES_DATA.find(
      (c) =>
        c.id === application.coursePreferences.firstChoiceCourseId ||
        c.code === application.coursePreferences.firstChoiceCourseId ||
        c.title === application.coursePreferences.firstChoiceCourseName
    ) || COURSES_DATA[0];

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-semibold font-mono tracking-wide">
              {selectedCourse.code}
            </span>
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-semibold text-slate-200">
              {selectedCourse.durationYears} Years • {selectedCourse.degreeLevel}
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
            {selectedCourse.title}
          </h1>

          <p className="text-xs sm:text-sm text-indigo-200/90 mt-1.5 flex flex-wrap items-center gap-2">
            <span>{selectedCourse.faculty}</span>
            <span className="text-slate-500">•</span>
            <span>App ID: <span className="font-mono font-bold text-white">{application.id}</span></span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onBackToChat}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-white/10 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AI Chat</span>
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.num;
            const isCompleted = s.num === 1 ? isRegistered : (activeStep > s.num || submitSuccess);

            return (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-950 font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    : 'text-slate-400 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : s.num === 1 ? (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs truncate font-medium">{s.title}</div>
                  </div>
                </div>
                {!isRegistered && s.num > 1 && (
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Form Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        {/* Step 1: Google Register / Log On */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Step 1: Google Register / Log On
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register or log on with Google before starting your application. All it does is take down your email address and assign your role as supporter.
              </p>
            </div>

            {isRegistered ? (
              <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Successfully Authenticated with Google!
                    </h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Account email: <strong className="text-emerald-900">{currentUser?.email || application.personalDetails.email}</strong> • Registered role: <span className="inline-block px-2 py-0.5 bg-emerald-200/90 text-emerald-950 rounded font-mono font-bold text-[11px] uppercase">{currentUser?.role || 'supporter'}</span>.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Proceed to Step 2: Personal Information</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-100 rounded-3xl space-y-5 text-center sm:text-left">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    Mandatory Step 1 Registration
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    Register with Google First
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    You must complete Step 1 with Google before entering information into the application form. We verify if your email was registered before to load your role (or assign you as a <strong className="text-slate-800">supporter</strong>). Steps 2–6 remain in view-only mode until registered.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-indigo-500 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Register / Log On with Google (Role: Supporter)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-3 text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Preview Form (View-Only Mode)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Personal Details */}
        {activeStep === 2 && (
          <div className="space-y-6">
            {!isRegistered && (
              <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-950">View-Only Mode: Step 2: Personal Details</div>
                    <div className="text-[11px] text-amber-800">
                      You must complete Step 1: Google Register / Log On before entering personal information.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoogleSignIn || (() => setActiveStep(1))}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Register with Google to Edit</span>
                </button>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Step 2: Personal & Contact Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Please provide your legal personal details as they appear on your passport or ID.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  disabled={!isRegistered}
                  value={application.personalDetails.fullName}
                  onChange={(e) => handleFieldChange('personalDetails', 'fullName', e.target.value)}
                  placeholder="e.g. Alex Taylor"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  disabled={!isRegistered}
                  value={application.personalDetails.email}
                  onChange={(e) => handleFieldChange('personalDetails', 'email', e.target.value)}
                  placeholder="e.g. alex.taylor@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  disabled={!isRegistered}
                  value={application.personalDetails.phone}
                  onChange={(e) => handleFieldChange('personalDetails', 'phone', e.target.value)}
                  placeholder="e.g. +61 412 345 678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  disabled={!isRegistered}
                  value={application.personalDetails.dateOfBirth}
                  onChange={(e) => handleFieldChange('personalDetails', 'dateOfBirth', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Citizenship Status *</label>
                <select
                  disabled={!isRegistered}
                  value={application.personalDetails.citizenship}
                  onChange={(e) => handleFieldChange('personalDetails', 'citizenship', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                  disabled={!isRegistered}
                  value={application.personalDetails.countryOfResidence}
                  onChange={(e) => handleFieldChange('personalDetails', 'countryOfResidence', e.target.value)}
                  placeholder="e.g. Australia, Singapore, India, USA"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  disabled={!isRegistered}
                  value={application.personalDetails.address}
                  onChange={(e) => handleFieldChange('personalDetails', 'address', e.target.value)}
                  placeholder="Street Address, Suburb/City, State, Postcode"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Optional Proof of Identity Document Upload & AI Authenticity Verification */}
            <div className="pt-5 border-t border-slate-200/90 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Proof of Identity Verification</span>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    You can upload an image of your passport or driver license. Our AI will inspect the security patterns and record authenticity details for admissions.
                  </p>
                </div>
                <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-xl font-medium flex items-center gap-1.5 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Privacy-First: Zero Copies Stored</span>
                </div>
              </div>

              {/* Upload Dropzone or Verified Card */}
              {application.identityVerificationAudit ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-emerald-950 text-xs">
                          {application.identityVerificationAudit.documentType} Verified
                        </div>
                        <div className="text-[11px] text-emerald-800 font-medium">
                          Issuing Entity: {application.identityVerificationAudit.issuingEntity} ({application.identityVerificationAudit.country})
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                        Authenticity: {application.identityVerificationAudit.authenticityStatus} ({application.identityVerificationAudit.authenticityScore}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVerification('identity')}
                        disabled={!isRegistered}
                        className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove verification"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed">
                    <span className="font-bold text-emerald-950 block mb-0.5">AI Authenticity Assessment:</span>
                    {application.identityVerificationAudit.legitimacyNotes}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/80 border border-dashed border-slate-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      {isVerifyingIdentity ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        {isVerifyingIdentity ? 'AI is inspecting document security features & authenticity...' : 'Upload Passport or Driver License Image (Optional)'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Supports PNG, JPG, or WebP. The file is analyzed in transient memory and NEVER stored on our database.
                      </div>
                    </div>
                  </div>

                  <label className={`px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 shrink-0 ${!isRegistered || isVerifyingIdentity ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-300'}`}>
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isVerifyingIdentity ? 'Inspecting...' : 'Choose ID Image'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={!isRegistered || isVerifyingIdentity}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadDocument('identity', file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Academic History */}
        {activeStep === 3 && (
          <div className="space-y-6">
            {!isRegistered && (
              <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-950">View-Only Mode: Step 3: Academic History</div>
                    <div className="text-[11px] text-amber-800">
                      You must complete Step 1: Google Register / Log On before entering academic qualifications.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoogleSignIn || (() => setActiveStep(1))}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Register with Google to Edit</span>
                </button>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Step 3: Academic Qualifications & Transcripts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter details regarding your most recent high school or tertiary education.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Highest Qualification *</label>
                <select
                  disabled={!isRegistered}
                  value={application.academicDetails.highestEducation}
                  onChange={(e) => handleFieldChange('academicDetails', 'highestEducation', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                  disabled={!isRegistered}
                  value={application.academicDetails.institutionName}
                  onChange={(e) => handleFieldChange('academicDetails', 'institutionName', e.target.value)}
                  placeholder="e.g. Sydney Grammar School / University of Sydney"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
                <input
                  type="text"
                  disabled={!isRegistered}
                  value={application.academicDetails.graduationYear}
                  onChange={(e) => handleFieldChange('academicDetails', 'graduationYear', e.target.value)}
                  placeholder="e.g. 2025"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ATAR / GPA / Average Score</label>
                <input
                  type="text"
                  disabled={!isRegistered}
                  value={application.academicDetails.atarOrGpa}
                  onChange={(e) => handleFieldChange('academicDetails', 'atarOrGpa', e.target.value)}
                  placeholder="e.g. ATAR 88.50 or GPA 3.8/4.0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">English Proficiency Test (If Applicable)</label>
                <input
                  type="text"
                  disabled={!isRegistered}
                  value={application.academicDetails.englishProficiencyTest || ''}
                  onChange={(e) => handleFieldChange('academicDetails', 'englishProficiencyTest', e.target.value)}
                  placeholder="e.g. IELTS 7.5 Overall / Native English Speaker"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Additional Academic Qualifications (+ Academic History) */}
            <div className="pt-5 border-t border-slate-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Additional Academic History</span>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    If you have multiple educational qualifications (e.g. prior degrees, diplomas, high school), click <strong>+ Academic History</strong> to record each.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddAcademicHistory}
                  disabled={!isRegistered}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xs hover:shadow-xs"
                >
                  <Plus className="w-4 h-4 text-indigo-600 group-hover:rotate-90 transition-transform duration-200" />
                  <span>+ Academic History</span>
                </button>
              </div>

              {/* Render List of Additional Qualifications */}
              {application.academicDetails.additionalQualifications && application.academicDetails.additionalQualifications.length > 0 ? (
                <div className="space-y-3.5">
                  {application.academicDetails.additionalQualifications.map((qual, index) => (
                    <div
                      key={qual.id}
                      className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3.5 relative group animate-in fade-in slide-in-from-top-1"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                            {index + 2}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            Additional Qualification #{index + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAcademicHistory(qual.id)}
                          disabled={!isRegistered}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer text-xs flex items-center gap-1"
                          title="Remove this qualification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold hidden sm:inline">Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Qualification Level *</label>
                          <select
                            disabled={!isRegistered}
                            value={qual.qualificationLevel}
                            onChange={(e) => handleUpdateAcademicHistory(qual.id, 'qualificationLevel', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                          >
                            <option value="Bachelor Degree">Bachelor Degree</option>
                            <option value="Master Degree">Master Degree</option>
                            <option value="Graduate Certificate / Diploma">Graduate Certificate / Diploma</option>
                            <option value="Doctorate / PhD">Doctorate / PhD</option>
                            <option value="Diploma / TAFE">Diploma / TAFE Vocational</option>
                            <option value="High School / Year 12">High School / Year 12 / IB</option>
                            <option value="Professional Certificate">Professional Certificate / Other</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Institution / School / University *</label>
                          <input
                            type="text"
                            disabled={!isRegistered}
                            value={qual.institutionName}
                            onChange={(e) => handleUpdateAcademicHistory(qual.id, 'institutionName', e.target.value)}
                            placeholder="e.g. University of Melbourne / RMIT / High School"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Major / Field of Study</label>
                          <input
                            type="text"
                            disabled={!isRegistered}
                            value={qual.majorOrFieldOfStudy || ''}
                            onChange={(e) => handleUpdateAcademicHistory(qual.id, 'majorOrFieldOfStudy', e.target.value)}
                            placeholder="e.g. Information Technology / Business"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Graduation Year</label>
                          <input
                            type="text"
                            disabled={!isRegistered}
                            value={qual.graduationYear}
                            onChange={(e) => handleUpdateAcademicHistory(qual.id, 'graduationYear', e.target.value)}
                            placeholder="e.g. 2023"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Score / GPA / Honours</label>
                          <input
                            type="text"
                            disabled={!isRegistered}
                            value={qual.atarOrGpa || ''}
                            onChange={(e) => handleUpdateAcademicHistory(qual.id, 'atarOrGpa', e.target.value)}
                            placeholder="e.g. GPA 3.8 / WAM 85 / Distinction"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  <span>Have more than one qualification? Click </span>
                  <button
                    type="button"
                    onClick={handleAddAcademicHistory}
                    disabled={!isRegistered}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer disabled:opacity-50"
                  >
                    + Academic History
                  </button>
                  <span> to add another diploma, degree, or certificate.</span>
                </div>
              )}
            </div>

            {/* Optional Qualification Document / Transcript Upload & AI Authenticity Verification (Multiple Documents Supported, each in a new box) */}
            <div className="pt-5 border-t border-slate-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Academic Qualification & Transcript Verification</span>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload images of your degree certificates, testamurs, diplomas, or academic transcripts. You can upload multiple documents — each document is analyzed and recorded in its own verified box.
                  </p>
                </div>
                <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-xl font-medium flex items-center gap-1.5 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Privacy-First: Zero Copies Stored</span>
                </div>
              </div>

              {/* Render verified document boxes & persistent upload dropzone */}
              {(() => {
                const academicAudits = (application.academicVerificationAudits && application.academicVerificationAudits.length > 0)
                  ? application.academicVerificationAudits
                  : (application.academicVerificationAudit ? [application.academicVerificationAudit] : []);

                return (
                  <div className="space-y-3.5">
                    {academicAudits.map((audit, idx) => (
                      <div
                        key={audit.id || `audit_${idx}`}
                        className="p-4 bg-emerald-50/70 border-2 border-emerald-200/90 rounded-2xl space-y-3 animate-in fade-in shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                                <span>{audit.documentType}</span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                  Verified Box #{idx + 1}
                                </span>
                              </div>
                              <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                                Awarding Body: {audit.issuingEntity} ({audit.country})
                                {audit.filename && (
                                  <span className="text-emerald-600/80 ml-1.5 font-normal">
                                    • {audit.filename}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                              Authenticity: {audit.authenticityStatus} ({audit.authenticityScore}%)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAcademicDocument(audit.id)}
                              disabled={!isRegistered}
                              className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Remove this document box"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>

                        {/* Highlighted Brief Description for Admissions & Student */}
                        <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-950 space-y-0.5">
                          <span className="font-extrabold text-[10px] text-emerald-800 uppercase tracking-wider block">
                            Document Brief Description:
                          </span>
                          <p className="italic text-emerald-900 leading-relaxed font-medium">
                            &quot;{audit.briefDescription}&quot;
                          </p>
                        </div>

                        {/* AI Authenticity Forensic Notes */}
                        <div className="p-2.5 bg-emerald-100/40 rounded-xl border border-emerald-200/60 text-[11px] text-emerald-900 leading-relaxed">
                          <span className="font-bold text-emerald-950 block mb-0.5">AI Authenticity Assessment:</span>
                          {audit.legitimacyNotes}
                        </div>
                      </div>
                    ))}

                    {/* Upload Box for Adding New / Additional Documents */}
                    <div className="p-4 bg-slate-50/90 border-2 border-dashed border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition-all hover:bg-indigo-50/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          {isVerifyingAcademic ? (
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                          ) : (
                            <Upload className="w-5 h-5 text-indigo-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">
                            {isVerifyingAcademic
                              ? 'AI is reviewing qualification certificate & institutional seals in volatile memory...'
                              : academicAudits.length > 0
                              ? 'Upload Another Qualification Document or Transcript'
                              : 'Upload Degree Certificate, Diploma, or Transcript Image (Optional)'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Supports PNG, JPG, or WebP. Each document will be analyzed by AI and rendered in its own dedicated verification box above. Zero images are stored in our database.
                          </div>
                        </div>
                      </div>

                      <label className={`px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 shrink-0 ${!isRegistered || isVerifyingAcademic ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-300'}`}>
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isVerifyingAcademic ? 'Inspecting Document...' : academicAudits.length > 0 ? 'Upload Next Document' : 'Choose Qualification Image'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={!isRegistered || isVerifyingAcademic}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadDocument('academic', file);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Step 4: Work History (Optional) */}
        {activeStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            {!isRegistered && (
              <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-950">View-Only Mode: Step 4: Work History</div>
                    <div className="text-[11px] text-amber-800">
                      You must complete Step 1: Google Register / Log On before recording work experience.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoogleSignIn || (() => setActiveStep(1))}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Register with Google to Edit</span>
                </button>
              </div>
            )}

            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  <span>Step 4: Employment & Work History</span>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    Optional
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Share details of your current or previous employment, internships, contract roles, self-employment, or entrepreneurial endeavours.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddWorkHistory}
                disabled={!isRegistered}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-xs hover:shadow-purple-500/20"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                <span>+ Work History</span>
              </button>
            </div>

            {/* Helpful Entrepreneurial Prompt Callout */}
            <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100/90 text-xs text-purple-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-purple-900">
                <Rocket className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Self-Employment & Entrepreneurial Endeavours Welcome</span>
              </div>
              <p className="text-purple-800/90 leading-relaxed text-[11px]">
                Applicants with entrepreneurial experience are strongly encouraged to mention any startups, family businesses, consulting practices, freelance clients, or side projects you have founded or managed. You can specify these in the roles below.
              </p>
            </div>

            {/* Work History Cards List (First work history always displayed, unlimited additional) */}
            {(() => {
              const workList = (application.workHistory && application.workHistory.length > 0)
                ? application.workHistory
                : [{
                    id: 'work_1',
                    jobTitle: '',
                    companyName: '',
                    workLocation: '',
                    employmentType: 'Full-time' as const,
                    startDate: '',
                    endDate: '',
                    isCurrentRole: false,
                    responsibilities: '',
                    supervisorName: '',
                    supervisorPhone: '',
                    supervisorEmail: '',
                    isEntrepreneurialOrSelfEmployed: false,
                    entrepreneurialDetails: ''
                  }];

              return (
                <div className="space-y-5">
                  {workList.map((work, index) => {
                    const isFirst = index === 0;
                    return (
                      <div
                        key={work.id}
                        className={`p-5 rounded-2xl space-y-4 relative group animate-in fade-in slide-in-from-top-1 transition-all ${
                          isFirst
                            ? 'bg-white border-2 border-purple-200/90 shadow-xs'
                            : 'bg-slate-50/70 border border-slate-200/90'
                        }`}
                      >
                        {/* Header Row */}
                        <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <div>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {isFirst
                                  ? (work.jobTitle ? `Primary Role: ${work.jobTitle}` : 'Primary Work Experience (First Role)')
                                  : (work.jobTitle ? `Additional Role #${index + 1}: ${work.jobTitle}` : `Work Experience #${index + 1}`)}
                              </span>
                              {work.companyName && (
                                <span className="text-purple-700 text-xs ml-1.5 font-semibold">
                                  at {work.companyName}
                                </span>
                              )}
                              {isFirst && !work.jobTitle && (
                                <span className="text-[11px] text-slate-400 block font-normal">
                                  Enter your main or most recent employment, contract, or venture (optional)
                                </span>
                              )}
                            </div>
                          </div>

                          {workList.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveWorkHistory(work.id)}
                              disabled={!isRegistered}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer text-xs flex items-center gap-1"
                              title="Remove this work history entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-semibold hidden sm:inline">Remove</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleClearWorkHistory(work.id)}
                              disabled={!isRegistered || (!work.jobTitle && !work.companyName && !work.responsibilities)}
                              className="text-slate-400 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Clear all fields in this role"
                            >
                              <span className="text-[11px] font-semibold">Clear Fields</span>
                            </button>
                          )}
                        </div>

                        {/* Basic Role Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Job Title / Role</label>
                            <input
                              type="text"
                              disabled={!isRegistered}
                              value={work.jobTitle}
                              onChange={(e) => handleUpdateWorkHistory(work.id, 'jobTitle', e.target.value)}
                              placeholder="e.g. Software Engineer / Co-Founder"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Company / Organization</label>
                            <input
                              type="text"
                              disabled={!isRegistered}
                              value={work.companyName}
                              onChange={(e) => handleUpdateWorkHistory(work.id, 'companyName', e.target.value)}
                              placeholder="e.g. Atlassian / Freelance / Self-Employed"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>Work Location (City, Country, Remote)</span>
                            </label>
                            <input
                              type="text"
                              disabled={!isRegistered}
                              value={work.workLocation || ''}
                              onChange={(e) => handleUpdateWorkHistory(work.id, 'workLocation', e.target.value)}
                              placeholder="e.g. Sydney, Australia / Remote"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Employment Type</label>
                            <select
                              disabled={!isRegistered}
                              value={work.employmentType || 'Full-time'}
                              onChange={(e) => handleUpdateWorkHistory(work.id, 'employmentType', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <option value="Full-time">Full-time</option>
                              <option value="Part-time">Part-time</option>
                              <option value="Casual / Contract">Casual / Contract</option>
                              <option value="Self-Employed / Founder">Self-Employed / Founder</option>
                              <option value="Internship / Work Placement">Internship / Work Placement</option>
                              <option value="Freelance / Consultant">Freelance / Consultant</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Start Date / Year</label>
                            <input
                              type="text"
                              disabled={!isRegistered}
                              value={work.startDate || ''}
                              onChange={(e) => handleUpdateWorkHistory(work.id, 'startDate', e.target.value)}
                              placeholder="e.g. Mar 2022 / 2022"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-semibold text-slate-700">End Date / Year</label>
                              <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  disabled={!isRegistered}
                                  checked={!!work.isCurrentRole}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    handleUpdateWorkHistory(work.id, 'isCurrentRole', checked);
                                    if (checked) {
                                      handleUpdateWorkHistory(work.id, 'endDate', 'Present');
                                    }
                                  }}
                                  className="rounded text-purple-600 w-3 h-3"
                                />
                                <span>Current Role</span>
                              </label>
                            </div>
                            <input
                              type="text"
                              disabled={!isRegistered || !!work.isCurrentRole}
                              value={work.isCurrentRole ? 'Present' : (work.endDate || '')}
                              onChange={(e) => handleUpdateWorkHistory(work.id, 'endDate', e.target.value)}
                              placeholder="e.g. Dec 2024 / Present"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        {/* Key Responsibilities */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Key Responsibilities & Achievements (Optional)
                          </label>
                          <textarea
                            rows={2}
                            disabled={!isRegistered}
                            value={work.responsibilities || ''}
                            onChange={(e) => handleUpdateWorkHistory(work.id, 'responsibilities', e.target.value)}
                            placeholder="Briefly describe your main responsibilities, technologies used, leadership roles, or key achievements..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                          />
                        </div>

                        {/* Optional Supervisor / Verification Reference */}
                        <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-purple-600" />
                              <span>Supervisor & Verification Reference (Optional)</span>
                            </span>
                            <span className="text-[10px] text-slate-400">All optional</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Supervisor Name</label>
                              <input
                                type="text"
                                disabled={!isRegistered}
                                value={work.supervisorName || ''}
                                onChange={(e) => handleUpdateWorkHistory(work.id, 'supervisorName', e.target.value)}
                                placeholder="e.g. Jane Smith (Manager)"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 disabled:opacity-60"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                <span>Supervisor Phone</span>
                              </label>
                              <input
                                type="text"
                                disabled={!isRegistered}
                                value={work.supervisorPhone || ''}
                                onChange={(e) => handleUpdateWorkHistory(work.id, 'supervisorPhone', e.target.value)}
                                placeholder="e.g. +61 412 345 678"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 disabled:opacity-60"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5 text-slate-400" />
                                <span>Supervisor Email</span>
                              </label>
                              <input
                                type="email"
                                disabled={!isRegistered}
                                value={work.supervisorEmail || ''}
                                onChange={(e) => handleUpdateWorkHistory(work.id, 'supervisorEmail', e.target.value)}
                                placeholder="e.g. supervisor@company.com"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 disabled:opacity-60"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Self-Employment / Entrepreneurial Endeavours Callout */}
                        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={!isRegistered}
                              checked={!!work.isEntrepreneurialOrSelfEmployed}
                              onChange={(e) => handleUpdateWorkHistory(work.id, 'isEntrepreneurialOrSelfEmployed', e.target.checked)}
                              className="rounded text-purple-600 w-3.5 h-3.5 disabled:cursor-not-allowed"
                            />
                            <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                              <Rocket className="w-3 h-3 text-purple-600" />
                              <span>This is an entrepreneurial endeavour or self-employment initiative</span>
                            </span>
                          </label>

                          {work.isEntrepreneurialOrSelfEmployed && (
                            <div className="pt-1">
                              <label className="block text-[10px] font-semibold text-purple-900 mb-1">
                                Endeavour Highlights (venture mission, products/services, clients, scale):
                              </label>
                              <textarea
                                rows={2}
                                disabled={!isRegistered}
                                value={work.entrepreneurialDetails || ''}
                                onChange={(e) => handleUpdateWorkHistory(work.id, 'entrepreneurialDetails', e.target.value)}
                                placeholder="Describe your venture, business model, problem solved, team members, or key milestones achieved..."
                                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                              />
                            </div>
                          )}
                        </div>

                        {/* Purple "+ Work History" button at the bottom of the first work history */}
                        {isFirst && (
                          <div className="pt-3 border-t border-purple-100/90 mt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-purple-50/80 p-4 rounded-xl border border-purple-200/90">
                              <div className="space-y-0.5">
                                <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                                  <Briefcase className="w-3.5 h-3.5 text-purple-700" />
                                  <span>Have additional work experience or prior roles?</span>
                                </div>
                                <p className="text-[11px] text-purple-800">
                                  Click the purple <strong>+ Work History</strong> button to add as many positions or entrepreneurial endeavours as you want.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={handleAddWorkHistory}
                                disabled={!isRegistered}
                                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-purple-500/25 shrink-0 group"
                              >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                                <span>+ Work History</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Additional footer "+ Work History" button when multiple items exist */}
                  {workList.length > 1 && (
                    <div className="p-4 bg-purple-50/50 rounded-2xl border border-dashed border-purple-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div>
                        <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5 justify-center sm:justify-start">
                          <Briefcase className="w-3.5 h-3.5 text-purple-700" />
                          <span>Add another work history</span>
                        </div>
                        <div className="text-[11px] text-purple-800">
                          You can add as many work histories as you want. All positions will be documented in your student dossier.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddWorkHistory}
                        disabled={!isRegistered}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm hover:shadow-purple-500/25 shrink-0 group"
                      >
                        <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
                        <span>+ Work History</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Step 5: Degree Preference */}
        {activeStep === 5 && (
          <div className="space-y-6">
            {!isRegistered && (
              <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-950">View-Only Mode: Step 5: Degree Preferences</div>
                    <div className="text-[11px] text-amber-800">
                      You must complete Step 1: Google Register / Log On before selecting degree programs and majors.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoogleSignIn || (() => setActiveStep(1))}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Register with Google to Edit</span>
                </button>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Step 5: Degree & Major Preferences
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
                        className={`p-4 rounded-2xl border transition-all ${
                          !isRegistered
                            ? 'cursor-not-allowed opacity-80 bg-slate-50 border-slate-200'
                            : 'cursor-pointer'
                        } ${
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
                    disabled={!isRegistered}
                    value={application.coursePreferences.majorOrSpecialization || ''}
                    onChange={(e) => handleFieldChange('coursePreferences', 'majorOrSpecialization', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                    disabled={!isRegistered}
                    value={application.coursePreferences.intakeSemester}
                    onChange={(e) => handleFieldChange('coursePreferences', 'intakeSemester', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">-- Select Intake --</option>
                    <option value="February (Semester 1)">February (Semester 1)</option>
                    <option value="July (Semester 2)">July (Semester 2)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Study Mode *</label>
                  <select
                    disabled={!isRegistered}
                    value={application.coursePreferences.studyMode}
                    onChange={(e) => handleFieldChange('coursePreferences', 'studyMode', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                    disabled={!isRegistered}
                    value={application.coursePreferences.commencingYear}
                    onChange={(e) => handleFieldChange('coursePreferences', 'commencingYear', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Statement of Purpose & Supporting Details */}
        {activeStep === 6 && (
          <div className="space-y-6">
            {!isRegistered && (
              <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-950">View-Only Mode: Step 6: Statement & Docs</div>
                    <div className="text-[11px] text-amber-800">
                      You must complete Step 1: Google Register / Log On before writing statements or declaring documents.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoogleSignIn || (() => setActiveStep(1))}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Register with Google to Edit</span>
                </button>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Step 6: Statement of Purpose & Scholarships
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Share your motivation and scholarship interests.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statement of Purpose / Personal Statement (approx. 200-500 words)
              </label>
              <textarea
                rows={5}
                disabled={!isRegistered}
                value={application.statementsAndDocuments.statementOfPurpose}
                onChange={(e) => handleFieldChange('statementsAndDocuments', 'statementOfPurpose', e.target.value)}
                placeholder="Explain why you wish to study this program, your academic and career goals, and how you will contribute to the university community..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <div className="text-[11px] text-slate-400 text-right mt-1">
                {application.statementsAndDocuments.statementOfPurpose.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-3">
              <label className={`flex items-center gap-3 ${!isRegistered ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  disabled={!isRegistered}
                  checked={application.statementsAndDocuments.scholarshipInterest}
                  onChange={(e) => handleFieldChange('statementsAndDocuments', 'scholarshipInterest', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 disabled:cursor-not-allowed"
                />
                <span className="text-xs font-semibold text-indigo-950">
                  I wish to be automatically assessed for university scholarships (e.g. Vice-Chancellor’s Excellence, STEM Grants)
                </span>
              </label>

              {application.statementsAndDocuments.scholarshipInterest && (
                <input
                  type="text"
                  disabled={!isRegistered}
                  value={application.statementsAndDocuments.scholarshipName || ''}
                  onChange={(e) => handleFieldChange('statementsAndDocuments', 'scholarshipName', e.target.value)}
                  placeholder="Preferred scholarship name (optional)"
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              )}
            </div>

            {/* Document Checkboxes */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Supporting Document Declarations</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <label className={`flex items-center gap-2.5 ${!isRegistered ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    disabled={!isRegistered}
                    checked={application.statementsAndDocuments.hasProvidedTranscripts}
                    onChange={(e) => handleFieldChange('statementsAndDocuments', 'hasProvidedTranscripts', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded disabled:cursor-not-allowed"
                  />
                  <span className="text-slate-700">I have certified official academic transcripts ready for verification</span>
                </label>
                <label className={`flex items-center gap-2.5 ${!isRegistered ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    disabled={!isRegistered}
                    checked={application.statementsAndDocuments.hasProvidedPassportId}
                    onChange={(e) => handleFieldChange('statementsAndDocuments', 'hasProvidedPassportId', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded disabled:cursor-not-allowed"
                  />
                  <span className="text-slate-700">I have government-issued passport or photo identification</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Review & Submit */}
        {activeStep === 7 && (
          <div className="space-y-6">
            {!isRegistered && (
              <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-950">Registration Required for Submission</div>
                    <div className="text-[11px] text-amber-800">
                      You are in view-only preview. Please complete Step 1: Google Register / Log On before submitting your official application.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoogleSignIn || (() => setActiveStep(1))}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Register with Google to Submit</span>
                </button>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Step 7: Review & Final Submission
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
                    {application.academicDetails.additionalQualifications && application.academicDetails.additionalQualifications.length > 0 && (
                      <span className="text-xs font-semibold text-indigo-600 ml-1">
                        (+{application.academicDetails.additionalQualifications.length} more)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Work History:</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {(() => {
                      const declaredRoles = (application.workHistory || []).filter(
                        (w) => (w.jobTitle && w.jobTitle.trim()) || (w.companyName && w.companyName.trim())
                      );
                      return declaredRoles.length > 0 ? (
                        <span className="text-purple-700">
                          {declaredRoles.length} role{declaredRoles.length > 1 ? 's' : ''} declared
                          {declaredRoles.some((w) => w.isEntrepreneurialOrSelfEmployed) ? ' (incl. Entrepreneurial)' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-normal">None declared (Optional)</span>
                      );
                    })()}
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
                <div>
                  <span className="text-slate-400 font-medium">ID Document Audit:</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {application.identityVerificationAudit ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{application.identityVerificationAudit.documentType} ({application.identityVerificationAudit.authenticityStatus})</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-normal">Not uploaded (Optional)</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Qualification Audits:</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {(() => {
                      const audits = (application.academicVerificationAudits && application.academicVerificationAudits.length > 0)
                        ? application.academicVerificationAudits
                        : (application.academicVerificationAudit ? [application.academicVerificationAudit] : []);
                      return audits.length > 0 ? (
                        <div className="space-y-1">
                          {audits.map((a, i) => (
                            <span key={a.id || i} className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{a.documentType} ({a.authenticityStatus})</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 font-normal">Not uploaded (Optional)</span>
                      );
                    })()}
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
              <label className={`flex items-start gap-3 p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl ${!isRegistered ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  disabled={!isRegistered}
                  checked={application.statementsAndDocuments.declarationAgreed}
                  onChange={(e) => handleFieldChange('statementsAndDocuments', 'declarationAgreed', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded mt-0.5 disabled:cursor-not-allowed"
                />
                <span className="text-xs text-indigo-950 leading-relaxed">
                  I declare that all information and transcripts provided in this application are true and complete. I authorize the University Admissions Board to verify my academic credentials.
                </span>
              </label>
            )}

            {!submitSuccess && missingRequiredFields.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Required before submitting:</strong> {missingRequiredFields.join(', ')}
                </span>
              </div>
            )}

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 mb-3">
                {submitError}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleDownloadSummary}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Application (JSON)</span>
              </button>

              {!submitSuccess && (
                !isRegistered ? (
                  <button
                    type="button"
                    onClick={onGoogleSignIn || (() => setActiveStep(1))}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Register with Google (Step 1) to Submit</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitApplication}
                    disabled={!application.statementsAndDocuments.declarationAgreed || missingRequiredFields.length > 0 || isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting Application...' : 'Submit Official Application'}</span>
                  </button>
                )
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

          {activeStep < 7 && (
            <button
              onClick={() => setActiveStep((prev) => Math.min(7, prev + 1))}
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
