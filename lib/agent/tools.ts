import { FAQS_DATA, FAQItem } from '@/data/faqs';
import { COURSES_DATA, CourseProgram } from '@/data/courses';
import { UNITS_DATA, UnitDetail } from '@/data/units';
import { EVENTS_DATA, ProspectiveEvent } from '@/data/events';
import { StudentApplication } from '@/data/applications';
import { createGoogleCalendarUrl, createIcsContent } from '@/lib/calendar/googleCalendar';
import { getDynamicCourses, getDynamicUnits, getDynamicFaqs } from '@/data/dynamicStore';
import { queryMultilingualRag } from '@/lib/rag/ragPipeline';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required?: string[];
  };
}

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'query_multilingual_rag',
    description: 'Perform semantic vector search across accredited institutional documents, course architectures, ASQA/TEQSA compliance policies, and multilingual knowledge bases using Google 768-dimensional embeddings and Firestore Vector Search. Supports all languages (English, Japanese, Chinese, Vietnamese, Thai, etc.).',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The semantic search query in any language' },
        categoryFilter: { type: 'string', description: 'Optional category filter: Vocational Compliance, Degree Programs, Course Architecture, General' }
      },
      required: ['query']
    }
  },
  {
    name: 'search_faq',
    description: 'Search the university FAQ database for questions on admissions, tuition fees, scholarships, international student visas, accommodation, campus life, credit transfers, and study loads.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query or student question keywords (e.g. "scholarships", "visa work hours", "application deadlines", "all")' },
        category: { type: 'string', description: 'Optional category filter: Admissions, Fees & Scholarships, Courses & Study, International, Campus Life, Applications' }
      }
    }
  },
  {
    name: 'list_courses',
    description: 'List all available degree programs or filter by degree level (Undergraduate / Postgraduate), Faculty, or search keyword.',
    parameters: {
      type: 'object',
      properties: {
        degreeLevel: { type: 'string', description: 'Undergraduate or Postgraduate', enum: ['Undergraduate', 'Postgraduate'] },
        faculty: { type: 'string', description: 'Optional faculty name' },
        query: { type: 'string', description: 'Optional search keyword (e.g. "artificial intelligence", "data", "cyber", "business")' }
      }
    }
  },
  {
    name: 'get_website_knowledge',
    description: 'Retrieve official university facts: campus locations (Sydney, Melbourne, Online), accreditation (ACS, AACSB, EQUIS, TEQSA AQF), rankings, and recent campus research news.',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Specific topic: "campuses", "accreditations", "rankings", "news", or "all"' }
      }
    }
  },
  {
    name: 'get_course_details',
    description: 'Get in-depth course information including overview, entry requirements (ATAR/GPA), fees, career outcomes, majors, and required unit codes.',
    parameters: {
      type: 'object',
      properties: {
        courseIdOrCode: { type: 'string', description: 'Course ID (e.g. "b-cs", "m-ai", "b-ba", "m-cyber") or search title' }
      },
      required: ['courseIdOrCode']
    }
  },
  {
    name: 'get_unit_syllabus',
    description: 'Get full syllabus details for an individual unit/subject, including unit code, credit points, prerequisites, weekly lecture topics, assessment breakdown, and coordinator details.',
    parameters: {
      type: 'object',
      properties: {
        unitCode: { type: 'string', description: 'Unit code (e.g. COMP1001, COMP2004, DATA3001, CYBR2002, AI5001, BUSS2010)' }
      },
      required: ['unitCode']
    }
  },
  {
    name: 'list_admissions_events',
    description: 'Browse upcoming prospective student events, Open Days, webinars, workshops, and 1-on-1 advisor consultation slots.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional filter: Open Day, Campus Tour, Advising Session, Webinar, Workshop' }
      }
    }
  },
  {
    name: 'book_event_or_consultation',
    description: 'Register a prospective student for an event or 1-on-1 advisor slot, and generate Google Calendar links and .ics invitation.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The ID of the event to book (e.g. event-open-day-2026, event-advising-consultation, event-ai-taster-workshop)' },
        studentName: { type: 'string', description: 'Student\'s full name' },
        studentEmail: { type: 'string', description: 'Student\'s email address' },
        slotId: { type: 'string', description: 'Specific consultation slot ID if booking a 1-on-1 advising session (e.g. slot-1, slot-2, slot-3)' },
        notes: { type: 'string', description: 'Special questions or study interests for the advisor' }
      },
      required: ['eventId', 'studentName', 'studentEmail']
    }
  },
  {
    name: 'update_application_draft',
    description: 'Update the student application form fields in real-time as the student provides information during the conversation.',
    parameters: {
      type: 'object',
      properties: {
        fullName: { type: 'string', description: 'Student\'s full legal name' },
        email: { type: 'string', description: 'Student\'s email' },
        phone: { type: 'string', description: 'Contact phone number' },
        citizenship: { type: 'string', description: 'Domestic or International' },
        countryOfResidence: { type: 'string', description: 'Country of residence' },
        highestEducation: { type: 'string', description: 'High School, Bachelor Degree, Master Degree, Diploma' },
        institutionName: { type: 'string', description: 'Previous school or university name' },
        atarOrGpa: { type: 'string', description: 'ATAR, GPA, or average percentage' },
        courseId: { type: 'string', description: 'Chosen course ID (e.g. b-cs, m-ai, b-ba, m-cyber)' },
        intakeSemester: { type: 'string', description: 'February (Semester 1) or July (Semester 2)' },
        studyMode: { type: 'string', description: 'Full-time or Part-time' },
        statementOfPurpose: { type: 'string', description: 'Statement of purpose text or goals summary' },
        scholarshipInterest: { type: 'boolean', description: 'Whether student wants to be considered for scholarships' }
      }
    }
  },
  {
    name: 'get_application_status',
    description: 'Review current progress of the student application draft, list missing fields, and estimate eligibility.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'submit_student_application',
    description: 'Finalize and formally submit the student application once all required details are populated.',
    parameters: {
      type: 'object',
      properties: {
        declarationConfirmed: { type: 'boolean', description: 'Confirmation that student agreed to information accuracy declaration' }
      },
      required: ['declarationConfirmed']
    }
  }
];

// In-memory runtime state for applications and events registrations
export const activeEventsState: ProspectiveEvent[] = JSON.parse(JSON.stringify(EVENTS_DATA));

export interface ToolExecutionResult {
  toolName: string;
  output: any;
  uiWidget?: {
    type: 'course' | 'unit' | 'event_booking' | 'application_update' | 'faq_list' | 'event_list';
    data: any;
  };
}

export function executeAgentTool(
  toolName: string,
  args: Record<string, any>,
  currentApplication: StudentApplication
): { result: ToolExecutionResult; updatedApplication?: StudentApplication } {
  switch (toolName) {
    case 'search_faq': {
      const q = (args.query || '').toLowerCase().trim();
      const cat = (args.category || '').toLowerCase().trim();
      const allFaqs = getDynamicFaqs();

      const isBroadSearch =
        !q ||
        q === 'all' ||
        q === 'faq' ||
        q === 'faqs' ||
        q === 'help' ||
        q.includes('what faq') ||
        q.includes('what are the faq') ||
        q.includes('show faq') ||
        q.includes('list faq') ||
        q.includes('frequently asked');

      let results: FAQItem[] = [];

      if (isBroadSearch) {
        results = cat
          ? allFaqs.filter(f => f.category.toLowerCase().includes(cat))
          : allFaqs;
      } else {
        const stopWords = ['what', 'how', 'when', 'where', 'the', 'and', 'for', 'are', 'can', 'you', 'about', 'tell', 'i', 'a', 'an', 'is', 'on', 'in', 'at', 'to', 'do'];
        const tokens = q.split(/\s+/).filter((t: string) => t.length > 2 && !stopWords.includes(t));

        const scoredFaqs = allFaqs
          .filter(faq => !cat || faq.category.toLowerCase().includes(cat))
          .map(faq => {
            let score = 0;
            const qLower = faq.question.toLowerCase();
            const aLower = faq.answer.toLowerCase();
            const cLower = faq.category.toLowerCase();

            // Direct full phrase match (both directions)
            if (qLower.includes(q) || (q.length > 2 && q.includes(qLower))) score += 60;
            if (aLower.includes(q)) score += 30;
            if (cLower.includes(q)) score += 20;

            // Multilingual / language match
            if (faq.language && qLower.includes(faq.language.toLowerCase())) score += 15;

            // Keyword match
            for (const kw of faq.keywords) {
              const kwl = kw.toLowerCase();
              if (q.includes(kwl)) score += 35;
              if (kwl.includes(q)) score += 25;
            }

            // Token match
            for (const t of tokens) {
              if (qLower.includes(t)) score += 15;
              if (aLower.includes(t)) score += 5;
              if (faq.keywords.some((k: string) => k.toLowerCase().includes(t))) score += 20;
            }

            return { faq, score };
          })
          .filter(item => item.score >= 40)
          .sort((a, b) => b.score - a.score);

        results = scoredFaqs.length > 0 ? scoredFaqs.map(s => s.faq) : [];
      }

      return {
        result: {
          toolName,
          output: {
            query: args.query || 'all',
            matched: results.length > 0,
            category: args.category || 'all',
            count: results.length,
            faqs: results
          },
          uiWidget: {
            type: 'faq_list',
            data: results
          }
        }
      };
    }

    case 'list_courses': {
      let courses = getDynamicCourses();
      const q = (args.query || '').toLowerCase().trim();
      if (args.degreeLevel) {
        courses = courses.filter(c => c.degreeLevel.toLowerCase() === args.degreeLevel.toLowerCase());
      }
      if (args.faculty) {
        courses = courses.filter(c => c.faculty.toLowerCase().includes(args.faculty.toLowerCase()));
      }
      if (q) {
        courses = courses.filter(c =>
          c.title.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.overview.toLowerCase().includes(q) ||
          c.majors.some(m => m.name.toLowerCase().includes(q))
        );
      }
      return {
        result: {
          toolName,
          output: {
            count: courses.length,
            courses: courses.map(c => ({
              id: c.id,
              code: c.code,
              title: c.title,
              degreeLevel: c.degreeLevel,
              faculty: c.faculty,
              duration: `${c.durationYears} years`,
              domesticFee: `$${c.annualTuitionDomestic.toLocaleString()}/yr`,
              intlFee: `$${c.annualTuitionInternational.toLocaleString()}/yr`,
              atar: c.atarRequirement || 'N/A',
              gpa: c.gpaRequirement ? `${c.gpaRequirement}/7.0` : 'N/A',
              campuses: c.campus.join(', '),
              intakes: c.intakes.join(', '),
              majors: c.majors.map(m => m.name).join(', ')
            }))
          },
          uiWidget: courses.length > 0 ? {
            type: 'course',
            data: courses[0]
          } : undefined
        }
      };
    }

    case 'get_course_details': {
      const term = (args.courseIdOrCode || '').toLowerCase().trim();
      const allCourses = getDynamicCourses();
      const course = allCourses.find(c =>
        c.id.toLowerCase() === term ||
        c.code.toLowerCase() === term ||
        c.title.toLowerCase().includes(term) ||
        (term.includes('computer science') && c.id === 'b-cs') ||
        ((term.includes('ai') || term.includes('artificial')) && c.id === 'm-ai') ||
        ((term.includes('business') || term.includes('analytics')) && c.id === 'b-ba') ||
        ((term.includes('cyber') || term.includes('security')) && c.id === 'm-cyber')
      ) || allCourses[0];

      return {
        result: {
          toolName,
          output: course,
          uiWidget: {
            type: 'course',
            data: course
          }
        }
      };
    }

    case 'get_website_knowledge': {
      const knowledge = {
        institutionName: 'EduPulse Institute of Technology & AI',
        campuses: [
          { name: 'Main Campus (Sydney)', location: 'Sydney, NSW, Australia', features: 'War Room Cyber Range, High-Performance GPU Hub, Student Village' },
          { name: 'Innovation Precinct (Melbourne)', location: 'Melbourne, VIC, Australia', features: 'Robotics labs, AI Incubator, Quantum computing simulators' },
          { name: 'City Executive Center', location: 'Sydney CBD', features: 'Bloomberg Financial Trading Lab, Executive Classrooms' },
          { name: 'Online Global Campus', location: 'Cloud / Remote', features: 'Interactive virtual classes, 24/7 AI tutoring agents' }
        ],
        accreditations: [
          'TEQSA Registered Australian Higher Education Provider (AQF Levels 5-10)',
          'Australian Computer Society (ACS) - Professional Level Accreditation',
          'AACSB & EQUIS International Business School Accreditation'
        ],
        employabilityRanking: 'Top 3 Australian University for Graduate Employability (96% placed within 3 months)',
        admissionsIntakes: ['February (Semester 1)', 'July (Semester 2)'],
        earlyEntry: '2026 Early Offer Schemes open with conditional offers based on Year 11/12 predicted grades',
        scholarships: [
          'Vice-Chancellor\'s Academic Excellence Award (up to $10,000/year)',
          'Women in STEM Scholarship ($7,500/year)',
          'International Student Future Leader Grant (25% tuition fee reduction)'
        ],
        studentVisas: 'Subclass 500 visa holders can work up to 48 hours per fortnight during study semesters and unlimited during breaks'
      };

      return {
        result: {
          toolName,
          output: knowledge
        }
      };
    }

    case 'get_unit_syllabus': {
      const code = (args.unitCode || '').toUpperCase().trim();
      const allUnits = getDynamicUnits();
      const unit = allUnits.find(u => u.code.toUpperCase() === code || u.title.toLowerCase().includes(code.toLowerCase()))
        || allUnits[0];

      return {
        result: {
          toolName,
          output: unit,
          uiWidget: {
            type: 'unit',
            data: unit
          }
        }
      };
    }

    case 'list_admissions_events': {
      let events = activeEventsState;
      if (args.category) {
        events = events.filter(e => e.category.toLowerCase() === args.category.toLowerCase());
      }
      return {
        result: {
          toolName,
          output: { count: events.length, events },
          uiWidget: {
            type: 'event_list',
            data: events
          }
        }
      };
    }

    case 'book_event_or_consultation': {
      const eventId = args.eventId;
      const targetEvent = activeEventsState.find(e => e.id === eventId) || activeEventsState[0];

      let startTime = targetEvent.startDate;
      let endTime = targetEvent.endDate;
      let slotDescription = '';

      if (args.slotId && targetEvent.availableSlots) {
        const slot = targetEvent.availableSlots.find(s => s.slotId === args.slotId);
        if (slot && slot.isBooked) {
          return {
            result: {
              toolName,
              output: { status: 'Unavailable', error: `Slot ${slot.slotId} is already booked. Choose another slot.` }
            }
          };
        }
        if (slot) {
          slot.isBooked = true;
          startTime = slot.startTime;
          endTime = slot.endTime;
          slotDescription = `Advisor: ${slot.advisorName}`;
        }
      }

      targetEvent.registeredCount += 1;

      const eventPayload = {
        title: `${targetEvent.title} - ${args.studentName}`,
        description: `${targetEvent.description}\n\n${slotDescription}\nNotes: ${args.notes || 'No special notes'}`,
        location: targetEvent.location,
        startTime: startTime,
        endTime: endTime,
        attendeeEmail: args.studentEmail,
        meetingLink: targetEvent.meetingLink
      };

      const googleCalUrl = createGoogleCalendarUrl(eventPayload);
      const icsContent = createIcsContent(eventPayload);

      const bookingConfirmation = {
        bookingId: `BK-${Date.now().toString().slice(-6)}`,
        event: targetEvent,
        studentName: args.studentName,
        studentEmail: args.studentEmail,
        startTime,
        endTime,
        googleCalUrl,
        icsContent,
        notes: args.notes || ''
      };

      return {
        result: {
          toolName,
          output: {
            status: 'Confirmed',
            bookingId: bookingConfirmation.bookingId,
            eventTitle: targetEvent.title,
            startTime,
            endTime,
            location: targetEvent.location,
            googleCalendarUrl: googleCalUrl
          },
          uiWidget: {
            type: 'event_booking',
            data: bookingConfirmation
          }
        }
      };
    }

    case 'update_application_draft': {
      const updated: StudentApplication = JSON.parse(JSON.stringify(currentApplication));
      updated.updatedAt = new Date().toISOString();

      if (args.fullName) updated.personalDetails.fullName = args.fullName;
      if (args.email) updated.personalDetails.email = args.email;
      if (args.phone) updated.personalDetails.phone = args.phone;
      if (args.citizenship) {
        updated.personalDetails.citizenship = args.citizenship.toLowerCase().includes('dom')
          ? 'Domestic (Australian/NZ Citizen/PR)'
          : 'International';
      }
      if (args.countryOfResidence) updated.personalDetails.countryOfResidence = args.countryOfResidence;

      if (args.highestEducation) {
        if (args.highestEducation.toLowerCase().includes('high') || args.highestEducation.includes('12')) {
          updated.academicDetails.highestEducation = 'High School / Year 12';
        } else if (args.highestEducation.toLowerCase().includes('bach')) {
          updated.academicDetails.highestEducation = 'Bachelor Degree';
        } else if (args.highestEducation.toLowerCase().includes('mast')) {
          updated.academicDetails.highestEducation = 'Master Degree';
        } else {
          updated.academicDetails.highestEducation = 'Diploma / TAFE';
        }
      }
      if (args.institutionName) updated.academicDetails.institutionName = args.institutionName;
      if (args.atarOrGpa) updated.academicDetails.atarOrGpa = args.atarOrGpa;

      if (args.courseId) {
        const allCourses = getDynamicCourses();
        const foundCourse = allCourses.find(c => c.id.toLowerCase() === args.courseId.toLowerCase() || c.title.toLowerCase().includes(args.courseId.toLowerCase()));
        if (foundCourse) {
          updated.coursePreferences.firstChoiceCourseId = foundCourse.id;
          updated.coursePreferences.firstChoiceCourseName = foundCourse.title;
        }
      }
      if (args.intakeSemester) {
        updated.coursePreferences.intakeSemester = args.intakeSemester.includes('Feb') || args.intakeSemester.includes('1')
          ? 'February (Semester 1)'
          : 'July (Semester 2)';
      }
      if (args.studyMode) {
        updated.coursePreferences.studyMode = args.studyMode.toLowerCase().includes('full') ? 'Full-time' : 'Part-time';
      }
      if (args.statementOfPurpose) updated.statementsAndDocuments.statementOfPurpose = args.statementOfPurpose;
      if (args.scholarshipInterest !== undefined) updated.statementsAndDocuments.scholarshipInterest = Boolean(args.scholarshipInterest);

      // Compute completeness
      const missingFields: string[] = [];
      if (!updated.personalDetails.fullName) missingFields.push('Full Name');
      if (!updated.personalDetails.email) missingFields.push('Email Address');
      if (!updated.personalDetails.citizenship) missingFields.push('Citizenship Status');
      if (!updated.academicDetails.highestEducation) missingFields.push('Highest Education Level');
      if (!updated.coursePreferences.firstChoiceCourseName) missingFields.push('Course Selection');

      const filledCount = 5 - missingFields.length;
      const progressPercent = Math.round((filledCount / 5) * 100);

      return {
        result: {
          toolName,
          output: {
            applicationId: updated.id,
            status: updated.status,
            progressPercent,
            missingFields,
            updatedFields: args
          },
          uiWidget: {
            type: 'application_update',
            data: updated
          }
        },
        updatedApplication: updated
      };
    }

    case 'get_application_status': {
      const missingFields: string[] = [];
      if (!currentApplication.personalDetails.fullName) missingFields.push('Full Name');
      if (!currentApplication.personalDetails.email) missingFields.push('Email Address');
      if (!currentApplication.personalDetails.citizenship) missingFields.push('Citizenship Status');
      if (!currentApplication.academicDetails.highestEducation) missingFields.push('Highest Education Level');
      if (!currentApplication.coursePreferences.firstChoiceCourseName) missingFields.push('Course Selection');

      const progressPercent = Math.round(((5 - missingFields.length) / 5) * 100);

      return {
        result: {
          toolName,
          output: {
            applicationId: currentApplication.id,
            status: currentApplication.status,
            progressPercent,
            missingFields,
            application: currentApplication
          },
          uiWidget: {
            type: 'application_update',
            data: currentApplication
          }
        }
      };
    }

    case 'submit_student_application': {
      const submitted: StudentApplication = JSON.parse(JSON.stringify(currentApplication));
      submitted.status = 'Submitted';
      submitted.statementsAndDocuments.declarationAgreed = true;
      submitted.updatedAt = new Date().toISOString();

      return {
        result: {
          toolName,
          output: {
            status: 'Submitted',
            applicationId: submitted.id,
            message: `Congratulations! Your student application ${submitted.id} has been formally submitted to the University Admissions Board.`,
            submissionTime: submitted.updatedAt
          },
          uiWidget: {
            type: 'application_update',
            data: submitted
          }
        },
        updatedApplication: submitted
      };
    }

    default:
      return {
        result: {
          toolName,
          output: { error: `Tool ${toolName} not recognized.` }
        }
      };
  }
}

/**
 * Asynchronous tool executor supporting async tools like query_multilingual_rag
 */
export async function executeAgentToolAsync(
  toolName: string,
  args: Record<string, any>,
  currentApplication: StudentApplication,
  apiKey?: string
): Promise<{ result: ToolExecutionResult; updatedApplication?: StudentApplication }> {
  if (toolName === 'query_multilingual_rag') {
    const q = args.query || '';
    const ragRes = await queryMultilingualRag(q, {
      categoryFilter: args.categoryFilter,
      apiKey
    });

    return {
      result: {
        toolName: 'query_multilingual_rag',
        output: {
          query: ragRes.query,
          queryLanguage: ragRes.queryLanguage,
          confidence: ragRes.confidence,
          totalRetrieved: ragRes.totalRetrieved,
          answer: ragRes.answer,
          sources: ragRes.sources
        },
        uiWidget: ragRes.sources && ragRes.sources.length > 0 ? {
          type: 'faq_list',
          data: ragRes.sources.map(s => ({
            id: `rag-${s.title}`,
            question: s.title,
            answer: s.excerpt,
            category: s.category,
            keywords: [s.language]
          }))
        } : undefined
      }
    };
  }

  return executeAgentTool(toolName, args, currentApplication);
}
