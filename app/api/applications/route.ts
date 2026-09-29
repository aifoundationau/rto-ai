import { NextRequest, NextResponse } from 'next/server';
import { StudentApplication, INITIAL_APPLICATION_STATE } from '@/data/applications';

// In-memory persistent list of submitted and draft applications
const applicationsDatabase: StudentApplication[] = [
  {
    id: 'APP-2026-90412',
    status: 'Submitted',
    createdAt: '2026-08-27T14:22:00Z',
    updatedAt: '2026-08-27T14:30:00Z',
    personalDetails: {
      fullName: 'Emma Watson',
      email: 'emma.w@example.com',
      phone: '+61 412 345 678',
      dateOfBirth: '2005-04-18',
      citizenship: 'Domestic (Australian/NZ Citizen/PR)',
      countryOfResidence: 'Australia',
      address: '42 George Street, Sydney NSW 2000'
    },
    academicDetails: {
      highestEducation: 'High School / Year 12',
      institutionName: 'Sydney Secondary College',
      graduationYear: '2025',
      atarOrGpa: '94.20',
      englishProficiencyTest: 'Native Speaker'
    },
    coursePreferences: {
      firstChoiceCourseId: 'b-cs',
      firstChoiceCourseName: 'Bachelor of Computer Science',
      majorOrSpecialization: 'Artificial Intelligence & Machine Learning',
      intakeSemester: 'February (Semester 1)',
      studyMode: 'Full-time',
      commencingYear: '2026'
    },
    statementsAndDocuments: {
      statementOfPurpose: 'Passionate about artificial intelligence and building robust autonomous systems to solve healthcare challenges.',
      scholarshipInterest: true,
      scholarshipName: 'Women in STEM Scholarship',
      hasProvidedTranscripts: true,
      hasProvidedPassportId: true,
      declarationAgreed: true
    }
  },
  {
    id: 'APP-2026-77341',
    status: 'Under Review',
    createdAt: '2026-08-28T09:15:00Z',
    updatedAt: '2026-08-28T09:40:00Z',
    personalDetails: {
      fullName: 'Rajesh Kumar',
      email: 'rajesh.k@example.com',
      phone: '+91 98765 43210',
      dateOfBirth: '2001-11-03',
      citizenship: 'International',
      countryOfResidence: 'India',
      address: '15 MG Road, Bangalore'
    },
    academicDetails: {
      highestEducation: 'Bachelor Degree',
      institutionName: 'Indian Institute of Information Technology',
      graduationYear: '2024',
      atarOrGpa: '8.4 / 10.0 CGPA',
      englishProficiencyTest: 'IELTS 8.0'
    },
    coursePreferences: {
      firstChoiceCourseId: 'm-ai',
      firstChoiceCourseName: 'Master of Artificial Intelligence & Machine Learning',
      majorOrSpecialization: 'Frontier LLMs & Generative Systems',
      intakeSemester: 'February (Semester 1)',
      studyMode: 'Full-time',
      commencingYear: '2026'
    },
    statementsAndDocuments: {
      statementOfPurpose: 'Aiming to advance research in large language model fine-tuning and multimodality.',
      scholarshipInterest: true,
      scholarshipName: 'International Student Future Leader Grant',
      hasProvidedTranscripts: true,
      hasProvidedPassportId: true,
      declarationAgreed: true
    }
  }
];

export async function GET() {
  return NextResponse.json({ applications: applicationsDatabase });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const app: StudentApplication = body.application;

    if (!app || !app.id) {
      return NextResponse.json({ error: 'Invalid application object' }, { status: 400 });
    }

    const existingIndex = applicationsDatabase.findIndex(a => a.id === app.id);
    if (existingIndex >= 0) {
      applicationsDatabase[existingIndex] = app;
    } else {
      applicationsDatabase.unshift(app);
    }

    return NextResponse.json({ success: true, application: app, total: applicationsDatabase.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
