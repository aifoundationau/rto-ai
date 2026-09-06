export interface StudentApplication {
  id: string; // e.g. 'APP-2026-88192'
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Accepted' | 'Requires Additional Documents';
  createdAt: string;
  updatedAt: string;
  
  // Step 1: Personal & Contact Details
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
    highestEducation: 'High School / Year 12' | 'Bachelor Degree' | 'Master Degree' | 'Diploma / TAFE' | '';
    institutionName: string;
    graduationYear: string;
    atarOrGpa: string;
    englishProficiencyTest?: string; // e.g. 'IELTS 7.5' or 'Native Speaker'
  };

  // Step 3: Course & Study Preferences
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
}

export const INITIAL_APPLICATION_STATE: StudentApplication = {
  id: 'APP-' + Math.floor(100000 + Math.random() * 900000),
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
    englishProficiencyTest: ''
  },
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
  }
};
