export interface AdditionalQualification {
  id: string;
  qualificationLevel: string;
  institutionName: string;
  graduationYear: string;
  majorOrFieldOfStudy?: string;
  atarOrGpa?: string;
  country?: string;
}

export interface WorkHistoryItem {
  id: string;
  jobTitle: string;
  companyName: string;
  workLocation?: string; // e.g. 'Sydney, Australia', 'San Francisco, USA', 'Remote'
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Self-Employed / Founder' | 'Internship' | string;
  startDate?: string;
  endDate?: string;
  isCurrentRole?: boolean;
  responsibilities?: string;
  supervisorName?: string;
  supervisorPhone?: string;
  supervisorEmail?: string;
  isEntrepreneurialOrSelfEmployed?: boolean;
  entrepreneurialDetails?: string;
}

export interface StudentApplication {
  id: string; // e.g. 'APP-2026-88192'
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Accepted' | 'Requires Additional Documents';
  createdAt: string;
  updatedAt: string;

  // Step 1: Personal & Contact Details
  studentNumber?: string; // e.g. 'STU-2026-00001'
  department?: string; // e.g. 'School of Computer Science & Engineering'
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    citizenship: 'Domestic (Australian/NZ Citizen/PR)' | 'International' | '';
    countryOfResidence: string;
    address: string;
  };

  // Step 2: Academic Background
  academicDetails: {
    highestEducation: 'High School / Year 12' | 'Bachelor Degree' | 'Master Degree' | 'Diploma / TAFE' | string;
    institutionName: string;
    graduationYear: string;
    atarOrGpa: string;
    englishProficiencyTest?: string; // e.g. 'IELTS 7.5' or 'Native Speaker'
    additionalQualifications?: AdditionalQualification[];
  };

  // Step 4: Work History (Optional)
  workHistory?: WorkHistoryItem[];

  // Step 5: Course & Study Preferences
  coursePreferences: {
    firstChoiceCourseId: string;
    firstChoiceCourseName: string;
    majorOrSpecialization?: string;
    intakeSemester: 'February (Semester 1)' | 'July (Semester 2)' | '';
    studyMode: 'Full-time' | 'Part-time' | 'On-campus' | 'Online' | '';
    commencingYear: string;
  };

  // Step 4: Supporting Statements & Declarations
  statementsAndDocuments: {
    statementOfPurpose: string;
    scholarshipInterest: boolean;
    scholarshipName?: string;
    hasProvidedTranscripts: boolean;
    hasProvidedPassportId: boolean;
    declarationAgreed: boolean;
  };

  // Agent notes or feedback
  agentAssessment?: {
    eligibilityScore: number; // 0 - 100
    recommendations: string[];
    missingFields: string[];
  };

  // AI Document Authenticity Verification (Images NOT stored in database - transient in-memory analysis only)
  identityVerificationAudit?: DocumentAuthenticityAudit;
  academicVerificationAudit?: DocumentAuthenticityAudit;
  academicVerificationAudits?: DocumentAuthenticityAudit[];
}

export interface DocumentAuthenticityAudit {
  id?: string;
  documentCategory: 'identity' | 'academic';
  documentType: string; // e.g. 'Passport', 'Driver Licence', 'Bachelor Degree Certificate', 'Academic Transcript'
  issuingEntity: string; // e.g. 'Australian Passport Office (DFAT)', 'University of Sydney', 'Department of Transport'
  country: string; // e.g. 'Australia'
  briefDescription: string; // Concise 1-2 sentence summary description for Admin & Operations Panel
  identifiedName?: string;
  nameMatchesApplicant?: boolean;
  authenticityStatus: 'Legitimate' | 'Requires Additional Review' | 'Suspect / Irregular';
  authenticityScore: number; // e.g. 96
  legitimacyNotes: string; // Forensic analysis of security seals, crests, fonts, and authenticity
  verifiedAt: string;
  filename?: string;
}

export const INITIAL_APPLICATION_STATE: StudentApplication = {
  id: 'APP-' + Math.floor(100000 + Math.random() * 900000),
  studentNumber: 'STU-2026-00001',
  department: 'School of Computer Science & Engineering',
  status: 'Draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  personalDetails: {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    citizenship: '',
    countryOfResidence: '',
    address: ''
  },
  academicDetails: {
    highestEducation: '',
    institutionName: '',
    graduationYear: '',
    atarOrGpa: '',
    englishProficiencyTest: '',
    additionalQualifications: []
  },
  workHistory: [
    {
      id: 'work_1',
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
    }
  ],
  coursePreferences: {
    firstChoiceCourseId: '',
    firstChoiceCourseName: '',
    majorOrSpecialization: '',
    intakeSemester: '',
    studyMode: '',
    commencingYear: '2026'
  },
  statementsAndDocuments: {
    statementOfPurpose: '',
    scholarshipInterest: false,
    scholarshipName: '',
    hasProvidedTranscripts: false,
    hasProvidedPassportId: false,
    declarationAgreed: false
  },
  academicVerificationAudits: []
};
