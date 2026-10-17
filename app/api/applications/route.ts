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
    },
    identityVerificationAudit: {
      documentCategory: 'identity',
      documentType: 'Australian Passport (Series R)',
      issuingEntity: 'Australian Passport Office (DFAT)',
      country: 'Australia',
      briefDescription: 'Australian Passport (Series R) for Emma Watson, issued by DFAT, valid through 2034 with verified biometric MRZ and holographic kangaroo seal.',
      identifiedName: 'Emma Watson',
      nameMatchesApplicant: true,
      authenticityStatus: 'Legitimate',
      authenticityScore: 98,
      legitimacyNotes: 'Inspected Australian biometric passport data page. Microprinting, holographic kangaroo seal, laser perforation, and ICAO 9303 machine-readable zone (MRZ) checksums confirmed legitimate. Name matches application record.',
      verifiedAt: '2026-08-27T14:23:15Z'
    },
    academicVerificationAudit: {
      documentCategory: 'academic',
      documentType: 'Higher School Certificate (HSC) & Record of Achievement',
      issuingEntity: 'NSW Education Standards Authority (NESA)',
      country: 'Australia',
      briefDescription: 'NSW Higher School Certificate (HSC) for Emma Watson, issued by NESA. Confirms ATAR 94.20 ranking with official state crest and watermark.',
      identifiedName: 'Emma Watson',
      nameMatchesApplicant: true,
      authenticityStatus: 'Legitimate',
      authenticityScore: 96,
      legitimacyNotes: 'Inspected official NESA certificate. Watermarked crest, official security seal, course mark tables, and ATAR 94.20 ranking layout confirmed authentic.',
      verifiedAt: '2026-08-27T14:24:40Z'
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
      englishProficiencyTest: 'IELTS 8.0',
      additionalQualifications: [
        {
          id: 'qual-sample-1',
          qualificationLevel: 'Diploma / TAFE',
          institutionName: 'State Board of Technical Education',
          graduationYear: '2021',
          majorOrFieldOfStudy: 'Computer Science & Software Engineering',
          atarOrGpa: '91.5% Distinction',
          country: 'India'
        },
        {
          id: 'qual-sample-2',
          qualificationLevel: 'High School / Year 12',
          institutionName: 'National Public Higher Secondary School',
          graduationYear: '2019',
          majorOrFieldOfStudy: 'Science & Mathematics',
          atarOrGpa: '95.2%',
          country: 'India'
        }
      ]
    },
    workHistory: [
      {
        id: 'work-sample-1',
        jobTitle: 'Junior AI Engineer',
        companyName: 'Cognitive Data Labs',
        workLocation: 'Bangalore, India',
        employmentType: 'Full-time',
        startDate: 'Jan 2024',
        endDate: 'Present',
        isCurrentRole: true,
        responsibilities: 'Developed data pipelines and fine-tuned open-source LLMs for real-time customer intent classification.',
        supervisorName: 'Dr. Priya Sharma (Engineering Lead)',
        supervisorPhone: '+91 98123 45678',
        supervisorEmail: 'priya.sharma@cognitivedata.io',
        isEntrepreneurialOrSelfEmployed: false
      },
      {
        id: 'work-sample-2',
        jobTitle: 'Founder & Lead Developer',
        companyName: 'IndicLingo AI (Startup Venture)',
        workLocation: 'Bangalore, India / Remote',
        employmentType: 'Self-Employed / Founder',
        startDate: 'Jun 2022',
        endDate: 'Dec 2023',
        isCurrentRole: false,
        responsibilities: 'Founded open-source multilingual translation tool for regional Indian dialects. Bootstrapped product and scaled to 15,000 monthly active users.',
        supervisorName: '',
        supervisorPhone: '',
        supervisorEmail: '',
        isEntrepreneurialOrSelfEmployed: true,
        entrepreneurialDetails: 'Built, pitched, and scaled a vernacular AI assistant; gained grant funding from local tech incubator and managed 3 freelance contributors.'
      }
    ],
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
    },
    identityVerificationAudit: {
      documentCategory: 'identity',
      documentType: 'Republic of India Passport (Series P)',
      issuingEntity: 'Regional Passport Office, Bangalore (MEA)',
      country: 'India',
      briefDescription: 'Republic of India Passport for Rajesh Kumar, issued by Ministry of External Affairs at Bangalore. Machine-readable zone and photo alignment confirmed legitimate.',
      identifiedName: 'Rajesh Kumar',
      nameMatchesApplicant: true,
      authenticityStatus: 'Legitimate',
      authenticityScore: 97,
      legitimacyNotes: 'Inspected Indian passport biographical data page. Ashoka Lion security crest, ghost portrait, and ICAO Doc 9303 Type 3 MRZ checksum calculations verified authentic.',
      verifiedAt: '2026-08-28T09:18:20Z'
    },
    academicVerificationAudit: {
      id: 'acad_audit_seed_1',
      filename: 'rajesh_kumar_btech_testamur.pdf',
      documentCategory: 'academic',
      documentType: 'Bachelor of Technology (BTech) Degree Testamur',
      issuingEntity: 'Indian Institute of Information Technology',
      country: 'India',
      briefDescription: 'Official Degree Testamur for Rajesh Kumar conferring B.Tech in Computer Science with 8.4/10.0 CGPA, verified with Senate gold foil seal and Registrar signature.',
      identifiedName: 'Rajesh Kumar',
      nameMatchesApplicant: true,
      authenticityStatus: 'Legitimate',
      authenticityScore: 95,
      legitimacyNotes: 'Inspected BTech degree certificate. University Senate conferral text, institutional seal, and degree verification serial number confirmed authentic.',
      verifiedAt: '2026-08-28T09:22:05Z'
    },
    academicVerificationAudits: [
      {
        id: 'acad_audit_seed_1',
        filename: 'rajesh_kumar_btech_testamur.pdf',
        documentCategory: 'academic',
        documentType: 'Bachelor of Technology (BTech) Degree Testamur',
        issuingEntity: 'Indian Institute of Information Technology',
        country: 'India',
        briefDescription: 'Official Degree Testamur for Rajesh Kumar conferring B.Tech in Computer Science with 8.4/10.0 CGPA, verified with Senate gold foil seal and Registrar signature.',
        identifiedName: 'Rajesh Kumar',
        nameMatchesApplicant: true,
        authenticityStatus: 'Legitimate',
        authenticityScore: 95,
        legitimacyNotes: 'Inspected BTech degree certificate. University Senate conferral text, institutional seal, and degree verification serial number confirmed authentic.',
        verifiedAt: '2026-08-28T09:22:05Z'
      },
      {
        id: 'acad_audit_seed_2',
        filename: 'rajesh_kumar_official_transcripts.pdf',
        documentCategory: 'academic',
        documentType: 'Official Academic Transcript of Results (Consolidated 8-Semesters)',
        issuingEntity: 'Indian Institute of Information Technology Examination Branch',
        country: 'India',
        briefDescription: 'Consolidated 8-semester university transcript for Rajesh Kumar, recording 164 total credit points, 8.4 CGPA, registrar signature stamp, and anti-alteration security microprinting.',
        identifiedName: 'Rajesh Kumar',
        nameMatchesApplicant: true,
        authenticityStatus: 'Legitimate',
        authenticityScore: 96,
        legitimacyNotes: 'Forensic inspection of semester course-by-course marks sheet. Grading legend (A+ through F) matches institute handbook; security guilloche borders verified intact.',
        verifiedAt: '2026-08-28T09:23:45Z'
      }
    ]
  }
];

import { saveApplicationToFirestore, getApplicationsFromFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const firestoreApps = await getApplicationsFromFirestore();
    if (firestoreApps && firestoreApps.length > 0) {
      // Merge or return firestore apps
      const map = new Map<string, StudentApplication>();
      applicationsDatabase.forEach(a => map.set(a.id, a));
      firestoreApps.forEach(a => map.set(a.id, a));
      return NextResponse.json({ applications: Array.from(map.values()) });
    }
  } catch (err) {
    console.warn('[Applications GET] Firestore read fallback:', err);
  }
  return NextResponse.json({ applications: applicationsDatabase });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const app: StudentApplication = body.application;

    if (!app || !app.id) {
      return NextResponse.json({ error: 'Invalid application object' }, { status: 400 });
    }

    // Save to Firestore via Admin SDK
    const firestoreResult = await saveApplicationToFirestore(app);

    // Keep in-memory cache synchronized
    const existingIndex = applicationsDatabase.findIndex(a => a.id === app.id);
    if (existingIndex >= 0) {
      applicationsDatabase[existingIndex] = app;
    } else {
      applicationsDatabase.unshift(app);
    }

    return NextResponse.json({
      success: true,
      application: app,
      firestoreSynced: firestoreResult.success,
      total: applicationsDatabase.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
