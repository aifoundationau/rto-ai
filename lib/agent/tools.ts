import { FAQS_DATA, FAQItem } from '@/data/faqs';
import { COURSES_DATA, CourseProgram } from '@/data/courses';
import { UNITS_DATA, UnitDetail } from '@/data/units';
import { EVENTS_DATA, ProspectiveEvent } from '@/data/events';
import { StudentApplication } from '@/data/applications';
import { createGoogleCalendarUrl, createIcsContent } from '@/lib/calendar/googleCalendar';
import { getDynamicCourses, getDynamicUnits, getDynamicFaqs } from '@/data/dynamicStore';

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
    name: 'search_faq',
    description: 'Search the university FAQ database for questions on admissions, tuition fees, scholarships, international student visas, accommodation, and campus life.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query or student question keywords (e.g. "scholarships", "visa work hours", "application deadlines")' },
        category: { type: 'string', description: 'Optional category filter: Admissions, Fees & Scholarships, Courses & Study, International, Campus Life, Applications' }
      },
      required: ['query']
    }
  },
  {
    name: 'list_courses',
    description: 'List all available degree programs or filter by degree level (Undergraduate / Postgraduate) or Faculty.',
    parameters: {
      type: 'object',
      properties: {
        degreeLevel: { type: 'string', description: 'Undergraduate or Postgraduate', enum: ['Undergraduate', 'Postgraduate'] },
        faculty: { type: 'string', description: 'Optional faculty name' }
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
      const q = (args.query || '').toLowerCase();
      const cat = args.category;
      const allFaqs = getDynamicFaqs();
      const matches = allFaqs.filter(faq => {
        const matchesQuery =
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q) ||
          faq.keywords.some(k => k.toLowerCase().includes(q));
        const matchesCat = !cat || faq.category.toLowerCase() === cat.toLowerCase();
        return matchesQuery && matchesCat;
      });

      const results = matches.length > 0 ? matches : allFaqs.slice(0, 3);
      return {
        result: {
          toolName,
          output: { query: args.query, count: results.length, faqs: results },
          uiWidget: {
            type: 'faq_list',
            data: results
          }
        }
      };
    }

    case 'list_courses': {
      let courses = getDynamicCourses();
      if (args.degreeLevel) {
        courses = courses.filter(c => c.degreeLevel.toLowerCase() === args.degreeLevel.toLowerCase());
      }
      if (args.faculty) {
        courses = courses.filter(c => c.faculty.toLowerCase().includes(args.faculty.toLowerCase()));
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
              duration: `${c.durationYears} years`,
              domesticFee: `$${c.annualTuitionDomestic.toLocaleString()}/yr`,
              intlFee: `$${c.annualTuitionInternational.toLocaleString()}/yr`,
              atar: c.atarRequirement || 'N/A',
              gpa: c.gpaRequirement || 'N/A'
            }))
          }
        }
      };
    }

    case 'get_course_details': {
      const term = (args.courseIdOrCode || '').toLowerCase().trim();
      const allCourses = getDynamicCourses();
      const course = allCourses.find(c =>
        c.id.toLowerCase() === term ||
        c.code.toLowerCase() === term ||
        c.title.toLowerCase().includes(term)
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
