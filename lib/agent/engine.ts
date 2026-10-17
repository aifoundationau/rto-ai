import { AGENT_TOOLS, executeAgentTool, executeAgentToolAsync, ToolExecutionResult, activeEventsState } from './tools';
import { StudentApplication, INITIAL_APPLICATION_STATE } from '@/data/applications';
import { COURSES_DATA, CourseProgram } from '@/data/courses';
import { UNITS_DATA, UnitDetail } from '@/data/units';
import { EVENTS_DATA, ProspectiveEvent } from '@/data/events';
import { FAQS_DATA, FAQItem } from '@/data/faqs';
import { getDynamicCourses, getDynamicUnits, getDynamicFaqs } from '@/data/dynamicStore';
import { queryMultilingualRag } from '@/lib/rag/ragPipeline';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolsExecuted?: {
    toolName: string;
    args: any;
    output: any;
  }[];
  uiWidgets?: {
    type: 'course' | 'unit' | 'event_booking' | 'application_update' | 'faq_list' | 'event_list';
    data: any;
  }[];
}

export interface AgentProcessResult {
  message: string;
  toolsExecuted: {
    toolName: string;
    args: any;
    output: any;
  }[];
  uiWidgets: {
    type: 'course' | 'unit' | 'event_booking' | 'application_update' | 'faq_list' | 'event_list';
    data: any;
  }[];
  updatedApplication?: StudentApplication;
}

/**
 * Intelligent Semantic Agent Engine:
 * Understands multi-turn conversational intents, performs tool calls, updates application drafts,
 * and formats answers with interactive widgets and Google Calendar events.
 */
export async function processAgentConversation(
  messages: ChatMessage[],
  currentApplication: StudentApplication,
  apiKey?: string
): Promise<AgentProcessResult> {
  const lastUserMsg = messages[messages.length - 1];
  const userText = lastUserMsg ? lastUserMsg.content : '';
  const lower = userText.toLowerCase();

  const toolsExecuted: { toolName: string; args: any; output: any }[] = [];
  const uiWidgets: { type: any; data: any }[] = [];
  let updatedApp: StudentApplication = {
    ...INITIAL_APPLICATION_STATE,
    ...(currentApplication || {}),
    personalDetails: {
      ...INITIAL_APPLICATION_STATE.personalDetails,
      ...(currentApplication?.personalDetails || {})
    },
    academicDetails: {
      ...INITIAL_APPLICATION_STATE.academicDetails,
      ...(currentApplication?.academicDetails || {})
    },
    coursePreferences: {
      ...INITIAL_APPLICATION_STATE.coursePreferences,
      ...(currentApplication?.coursePreferences || {})
    },
    statementsAndDocuments: {
      ...INITIAL_APPLICATION_STATE.statementsAndDocuments,
      ...(currentApplication?.statementsAndDocuments || {})
    }
  };

  // 1. Try Gemini API if API key is provided
  if (apiKey && apiKey.trim().length > 10) {
    try {
      // Pass the normalised draft so tools never receive a missing/partial application
      const geminiResult = await callGeminiWithTools(messages, updatedApp, apiKey.trim());
      if (geminiResult) {
        return geminiResult;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local semantic engine:', err);
    }
  }

  // 2. Intelligent Local Rule & Semantic Engine

  // A. Check for Unit Syllabus Inquiries (e.g. COMP1001, COMP2004, DATA3001, CYBR2002, AI5001, BUSS2010, "unit description", "syllabus")
  const allUnits = getDynamicUnits();
  // Unit-code-like tokens (e.g. COMP1001, AI5001), ignoring email addresses such as alex2024@...
  const unitCodeTokens = (userText.replace(/[\w.-]+@[\w.-]+\.\w+/g, ' ').toUpperCase().match(/\b[A-Z]{2,4}\d{4}\b/g) || []);
  const unitMatch = allUnits.find(u =>
    lower.includes(u.code.toLowerCase()) ||
    lower.includes(u.title.toLowerCase()) ||
    // Prefix fallback ("comp syllabus") only when no explicit code was given, so an
    // unknown code such as DATA2001 is not silently answered with DATA3001
    (unitCodeTokens.length === 0 && lower.includes('syllabus') && lower.includes(u.code.toLowerCase().slice(0, 4)))
  );

  const isAskingUnit = unitMatch || lower.includes('unit description') || lower.includes('syllabus') || lower.includes('assessment') || lower.includes('prerequisite');

  if (!unitMatch && unitCodeTokens.length > 0 && /\b(unit|units|syllabus|subject|assessment|prerequisites?)\b/.test(lower)) {
    return {
      message: `I couldn't find **${unitCodeTokens[0]}** in the AI assistant's unit syllabus database.\n\n` +
        `Units I can describe in detail: ${allUnits.map(u => `**${u.code}**`).join(', ')}.\n\n` +
        `You can also browse the **Unit Syllabuses** tab for the full published list.`,
      toolsExecuted,
      uiWidgets,
      updatedApplication: updatedApp
    };
  }

  if (unitMatch) {
    const { result } = executeAgentTool('get_unit_syllabus', { unitCode: unitMatch.code }, updatedApp);
    toolsExecuted.push({ toolName: 'get_unit_syllabus', args: { unitCode: unitMatch.code }, output: result.output });
    if (result.uiWidget) uiWidgets.push(result.uiWidget);

    const assessmentsSummary = unitMatch.assessments.map(a => `• **${a.name}** (${a.weight}%): ${a.description} (*${a.dueWeek}*)`).join('\n');
    const responseText = `### 📘 Unit Syllabus: ${unitMatch.code} - ${unitMatch.title}\n\n` +
      `**Faculty**: ${unitMatch.faculty}\n` +
      `**Level & Credits**: ${unitMatch.level} | ${unitMatch.creditPoints} Credit Points\n` +
      `**Delivery & Semesters**: ${unitMatch.deliveryMode} | Offered in ${unitMatch.semestersOffered.join(', ')}\n` +
      `**Unit Coordinator**: ${unitMatch.coordinator.name} (${unitMatch.coordinator.email})\n\n` +
      `#### 🎯 Overview & Learning Goals\n${unitMatch.overview}\n\n` +
      `#### 📋 Prerequisites\n${unitMatch.prerequisites.join(', ')}\n\n` +
      `#### 📊 Assessment Structure\n${assessmentsSummary}\n\n` +
      `*You can view the full 12-week lecture breakdown and recommended textbooks in the unit card below.*`;

    return {
      message: responseText,
      toolsExecuted,
      uiWidgets,
      updatedApplication: updatedApp
    };
  }

  // B. Check for Course & Degree Inquiries
  const allCourses = getDynamicCourses();
  const courseMatch = allCourses.find(c =>
    lower.includes(c.id.toLowerCase()) ||
    lower.includes(c.code.toLowerCase()) ||
    lower.includes(c.title.toLowerCase()) ||
    (lower.includes('computer science') && c.id === 'b-cs') ||
    ((lower.includes('artificial intelligence') || lower.includes('machine learning')) && c.id === 'm-ai') ||
    ((lower.includes('business') || lower.includes('data analytics')) && c.id === 'b-ba') ||
    ((lower.includes('cybersecurity') || lower.includes('threat intelligence') || lower.includes('cyber')) && c.id === 'm-cyber')
  );

  const isAskingCourseList =
    lower.includes('what course') ||
    lower.includes('list course') ||
    lower.includes('all courses') ||
    lower.includes('show courses') ||
    lower.includes('available courses') ||
    lower.includes('degrees') ||
    lower.includes('what degrees') ||
    lower.includes('programs offered') ||
    lower.includes('undergraduate') ||
    lower.includes('postgraduate') ||
    lower === 'courses' ||
    lower.startsWith('courses');

  const isApplicationIntent =
    lower.includes('apply') ||
    lower.includes('application') ||
    lower.includes('fill form') ||
    lower.includes('start application') ||
    lower.includes('my name is') ||
    lower.includes('my email') ||
    lower.includes('my gpa') ||
    lower.includes('my atar') ||
    lower.includes('submit application') ||
    (lower.includes('name:') && lower.includes('email:'));

  const isAskingEventBooking =
    lower.includes('register') ||
    lower.includes('book') ||
    lower.includes('rsvp') ||
    lower.includes('schedule') ||
    lower.includes('calendar') ||
    lower.includes('open day') ||
    lower.includes('campus tour') ||
    lower.includes('webinar') ||
    lower.includes('consultation') ||
    lower.includes('advising');

  if (courseMatch && !isAskingCourseList && !isApplicationIntent && !isAskingEventBooking) {
    const { result } = executeAgentTool('get_course_details', { courseIdOrCode: courseMatch.id }, updatedApp);
    toolsExecuted.push({ toolName: 'get_course_details', args: { courseIdOrCode: courseMatch.id }, output: result.output });
    if (result.uiWidget) uiWidgets.push(result.uiWidget);

    const majorsList = courseMatch.majors.map(m => `• **${m.name}**: ${m.description}`).join('\n');
    const careersList = courseMatch.careerOutcomes.map(c => `• ${c}`).join('\n');

    const responseText = `### 🎓 Program Overview: ${courseMatch.title} (${courseMatch.code})\n\n` +
      `${courseMatch.overview}\n\n` +
      `#### 📌 Key Facts\n` +
      `- **Degree Level**: ${courseMatch.degreeLevel} (${courseMatch.durationYears} Years Full-time)\n` +
      `- **Entry Requirements**: ${courseMatch.atarRequirement ? `Minimum ATAR: ${courseMatch.atarRequirement}` : `Minimum GPA: ${courseMatch.gpaRequirement}/7.0`}\n` +
      `- **Annual Tuition**: Domestic: \$${courseMatch.annualTuitionDomestic.toLocaleString()} AUD | International: \$${courseMatch.annualTuitionInternational.toLocaleString()} AUD\n` +
      `- **Intakes**: ${courseMatch.intakes.join(', ')}\n` +
      `- **Campuses**: ${courseMatch.campus.join(', ')}\n\n` +
      `#### 🚀 Majors & Specializations\n${majorsList}\n\n` +
      `#### 💼 Career Outcomes\n${careersList}\n\n` +
      `Would you like to explore unit syllabuses for this degree (e.g. **${courseMatch.coreUnits.slice(0, 3).join(', ')}**), register for an Open Day, or start your student application?`;

    return {
      message: responseText,
      toolsExecuted,
      uiWidgets,
      updatedApplication: updatedApp
    };
  }

  if (isAskingCourseList) {
    const degreeLevel = lower.includes('postgrad') ? 'Postgraduate' : lower.includes('undergrad') ? 'Undergraduate' : undefined;
    const { result } = executeAgentTool('list_courses', { degreeLevel }, updatedApp);
    toolsExecuted.push({ toolName: 'list_courses', args: { degreeLevel }, output: result.output });
    if (result.uiWidget) uiWidgets.push(result.uiWidget);

    let msg = `### 🎓 Degree Programs Offered at EduPulse\n\n`;
    for (const c of allCourses) {
      if (degreeLevel && c.degreeLevel !== degreeLevel) continue;
      msg += `#### 🏛️ **${c.title}** (\`${c.code}\`)\n` +
        `- **Level & Duration**: ${c.degreeLevel} (${c.durationYears} Years Full-time)\n` +
        `- **Annual Tuition**: Domestic: \$${c.annualTuitionDomestic.toLocaleString()} AUD | International: \$${c.annualTuitionInternational.toLocaleString()} AUD\n` +
        `- **Entry Requirements**: ${c.atarRequirement ? `Minimum ATAR: ${c.atarRequirement}` : `Minimum GPA: ${c.gpaRequirement}/7.0`}\n` +
        `- **Faculty**: ${c.faculty}\n` +
        `- **Key Majors**: ${c.majors.map(m => m.name).join(', ')}\n\n`;
    }
    msg += `Ask me about any specific course to view majors, fees, entry requirements, or syllabus unit breakdowns!`;

    return {
      message: msg,
      toolsExecuted,
      uiWidgets,
      updatedApplication: updatedApp
    };
  }

  // C. Event Registration & Google Calendar Actions
  if (isAskingEventBooking) {
    // Check if user is asking to book with specific details or just browsing events
    const hasBookingIntent = lower.includes('register me') || lower.includes('book me') || lower.includes('i want to book') || lower.includes('i want to register') || lower.includes('reserve a slot');

    if (hasBookingIntent) {
      // Find event: an exact title match wins (the Events page sends the full title),
      // otherwise fall back to keywords. Uses the live state so booked slots are respected.
      const findEvent = (id: string) => activeEventsState.find(e => e.id === id);
      const titleMatch = activeEventsState.find(e => lower.includes(e.title.toLowerCase()));
      let targetEvent = titleMatch || activeEventsState[0]; // default Open Day
      if (!titleMatch) {
        if (lower.includes('advis') || lower.includes('consult') || lower.includes('1-on-1') || lower.includes('slot')) {
          targetEvent = findEvent('event-advising-consultation') || targetEvent;
        } else if (/\bai\b/.test(lower) || lower.includes('workshop') || lower.includes('masterclass')) {
          targetEvent = findEvent('event-ai-taster-workshop') || targetEvent;
        } else if (lower.includes('intl') || lower.includes('international') || lower.includes('webinar') || lower.includes('visa')) {
          targetEvent = findEvent('event-intl-webinar') || targetEvent;
        } else if (lower.includes('tour')) {
          targetEvent = findEvent('event-campus-tour-sep') || targetEvent;
        }
      }

      // Extract email or name if provided, or use application state
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
      const emailMatch = userText.match(emailRegex);
      const studentEmail = emailMatch ? emailMatch[0] : (updatedApp?.personalDetails.email || 'prospective.student@example.com');

      let studentName = updatedApp?.personalDetails.fullName || 'Prospective Student';
      // Case-sensitive on the name itself so "I am interested in..." is not read as a name
      const nameMatch = userText.match(/(?:[Mm]y name is|[Nn]ame is|[Nn]ame:|I am|I'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (nameMatch) {
        studentName = nameMatch[1].replace(/[,.;:]+$/, '').trim();
      }

      // Check slot
      let slotId: string | undefined = undefined;
      if (targetEvent.availableSlots && targetEvent.availableSlots.length > 0) {
        const slotMatch = targetEvent.availableSlots.find(s => !s.isBooked);
        if (!slotMatch) {
          return {
            message: `😔 All consultation slots for **${targetEvent.title}** are fully booked. Please check the **Events & Calendar** tab for other sessions.`,
            toolsExecuted,
            uiWidgets,
            updatedApplication: updatedApp
          };
        }
        slotId = slotMatch.slotId;
      }

      const { result } = executeAgentTool('book_event_or_consultation', {
        eventId: targetEvent.id,
        studentName,
        studentEmail,
        slotId,
        notes: 'Registered via EduPulse AI Assistant'
      }, updatedApp);

      toolsExecuted.push({ toolName: 'book_event_or_consultation', args: { eventId: targetEvent.id, studentName, studentEmail, slotId }, output: result.output });
      if (result.uiWidget) uiWidgets.push(result.uiWidget);

      const responseText = `🎉 **You're registered for ${targetEvent.title}!**\n\n` +
        `📅 **Date & Time**: ${new Date(result.output.startTime).toLocaleString('en-AU', { dateStyle: 'full', timeStyle: 'short' })}\n` +
        `📍 **Location**: ${targetEvent.location}\n` +
        `👤 **Attendee**: ${studentName} (${studentEmail})\n\n` +
        `I've generated your **Google Calendar Invite** below. You can click **"Add to Google Calendar"** for 1-click sync or download the **.ics calendar file** directly.`;

      return {
        message: responseText,
        toolsExecuted,
        uiWidgets,
        updatedApplication: updatedApp
      };
    } else {
      // List events
      const { result } = executeAgentTool('list_admissions_events', {}, updatedApp);
      toolsExecuted.push({ toolName: 'list_admissions_events', args: {}, output: result.output });
      if (result.uiWidget) uiWidgets.push(result.uiWidget);

      let msg = `### 📅 Upcoming Prospective Student Events & Consultations\n\nHere are our upcoming admissions sessions:\n\n`;
      for (const ev of activeEventsState) {
        const dateStr = new Date(ev.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
        msg += `• **${ev.title}** (${ev.category})\n  *Date*: ${dateStr} | *Location*: ${ev.location}\n`;
      }
      msg += `\nWould you like me to register you for any of these and generate your Google Calendar invite? Simply reply with the event name and your email!`;

      return {
        message: msg,
        toolsExecuted,
        uiWidgets,
        updatedApplication: updatedApp
      };
    }
  }

  // D. Conversational Student Application Form Filling
  const updates: Record<string, any> = {};

  // Case-sensitive on the name itself so "I am interested in..." is not read as a name
  const appNameMatch = userText.match(/(?:[Mm]y name is|[Nn]ame is|[Nn]ame:|I am|I'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
  if (appNameMatch) {
    updates.fullName = appNameMatch[1].replace(/[,.;:]+$/, '').trim();
  }

  const appEmailMatch = userText.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (appEmailMatch) updates.email = appEmailMatch[0].replace(/[,.;:]+$/, '').trim();

  const phoneMatch = userText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) updates.phone = phoneMatch[0];

  const gpaMatch = userText.match(/(?:gpa|atar|score|wam|grade)(?:\s+is|\s*:|\s+of)?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (gpaMatch) updates.atarOrGpa = gpaMatch[1];

  const looksLikeQuestion = /\?\s*$/.test(userText.trim()) || /^(how|what|when|where|which|who|why|can|could|do|does|is|are|will|should)\b/i.test(userText.trim());
  const hasPersonalData = Boolean(updates.fullName || updates.email || updates.phone || updates.atarOrGpa);
  const isFaqQuestion = isApplicationIntent && looksLikeQuestion && !hasPersonalData &&
    Boolean(executeAgentTool('search_faq', { query: userText }, updatedApp).result.output.matched);

  if (isApplicationIntent && !isFaqQuestion) {
    if ((lower.includes('submit') || lower.includes('finalize') || lower.includes('send application')) && !/^how\b/i.test(userText.trim())) {
      // Do not submit an incomplete application
      const { result: statusResult } = executeAgentTool('get_application_status', {}, updatedApp);
      const missing: string[] = statusResult.output.missingFields || [];
      if (missing.length > 0) {
        toolsExecuted.push({ toolName: 'get_application_status', args: {}, output: statusResult.output });
        if (statusResult.uiWidget) uiWidgets.push(statusResult.uiWidget);
        return {
          message: `⚠️ **Your application isn't ready to submit yet.**\n\nPlease provide: **${missing.join(', ')}**.\n\n` +
            `You can tell me these details here, or complete them in the **Live Application Form** tab.`,
          toolsExecuted,
          uiWidgets,
          updatedApplication: updatedApp
        };
      }

      const { result, updatedApplication: finalApp } = executeAgentTool('submit_student_application', { declarationConfirmed: true }, updatedApp);
      toolsExecuted.push({ toolName: 'submit_student_application', args: { declarationConfirmed: true }, output: result.output });
      if (result.uiWidget) uiWidgets.push(result.uiWidget);
      if (finalApp) updatedApp = finalApp;

      const responseText = `🎊 **Congratulations! Your Student Application has been submitted!**\n\n` +
        `**Application Reference ID**: \`${updatedApp.id}\`\n` +
        `**Applicant Name**: ${updatedApp.personalDetails.fullName || 'Applicant'}\n` +
        `**Chosen Degree**: ${updatedApp.coursePreferences.firstChoiceCourseName || 'Bachelor of Computer Science'}\n` +
        `**Intake**: ${updatedApp.coursePreferences.intakeSemester || 'February (Semester 1)'} ${updatedApp.coursePreferences.commencingYear}\n` +
        `**Status**: \`Submitted - Under Review by Admissions Board\`\n\n` +
        `Our admissions team will review your qualifications and contact you within 3-5 business days. You can also download your official Application Summary from the portal.`;

      return {
        message: responseText,
        toolsExecuted,
        uiWidgets,
        updatedApplication: updatedApp
      };
    }

    if (lower.includes('domestic') || lower.includes('australian citizen') || lower.includes('permanent resident')) {
      updates.citizenship = 'Domestic';
    } else if (lower.includes('international') || lower.includes('overseas')) {
      updates.citizenship = 'International';
    }

    // The degree being applied for ("apply for Master of AI") is not the applicant's own qualification
    const ownEducationText = lower.replace(/\b(apply(ing)?|enrol(l)?(ing)?|study(ing)?|interested in)\b[^.!?]*?\b(bachelor|master)('?s)?\b/g, ' ');
    if (lower.includes('high school') || lower.includes('year 12') || lower.includes('atar')) {
      updates.highestEducation = 'High School';
    } else if (/\bbachelor/.test(ownEducationText) || ownEducationText.includes('undergrad degree')) {
      updates.highestEducation = 'Bachelor Degree';
    } else if (/\bmaster('?s)?\b/.test(ownEducationText)) {
      updates.highestEducation = 'Master Degree';
    }

    if (lower.includes('computer science') || lower.includes('b-cs') || lower.includes('cs100')) {
      updates.courseId = 'b-cs';
    } else if (lower.includes('artificial intelligence') || lower.includes('m-ai') || lower.includes('ai700') || lower.includes('machine learning')) {
      updates.courseId = 'm-ai';
    } else if (lower.includes('business') || lower.includes('data analytics') || lower.includes('b-ba')) {
      updates.courseId = 'b-ba';
    } else if (lower.includes('cybersecurity') || lower.includes('m-cyber') || lower.includes('cy900')) {
      updates.courseId = 'm-cyber';
    }

    if (lower.includes('february') || lower.includes('sem 1') || lower.includes('semester 1')) updates.intakeSemester = 'February (Semester 1)';
    else if (lower.includes('july') || lower.includes('sem 2') || lower.includes('semester 2')) updates.intakeSemester = 'July (Semester 2)';

    if (lower.includes('full-time') || lower.includes('full time')) updates.studyMode = 'Full-time';
    else if (lower.includes('part-time') || lower.includes('part time')) updates.studyMode = 'Part-time';

    if (lower.includes('scholarship')) updates.scholarshipInterest = true;

    const { result, updatedApplication: newApp } = executeAgentTool('update_application_draft', updates, updatedApp);
    toolsExecuted.push({ toolName: 'update_application_draft', args: updates, output: result.output });
    if (result.uiWidget) uiWidgets.push(result.uiWidget);
    if (newApp) updatedApp = newApp;

    let responseMsg = `📝 **Application Draft Updated (Progress: ${result.output.progressPercent}%)**\n\n` +
      `Here is what I've captured so far for your application:\n` +
      `- **Name**: ${updatedApp.personalDetails.fullName || '*Not provided yet*'}\n` +
      `- **Email**: ${updatedApp.personalDetails.email || '*Not provided yet*'}\n` +
      `- **Citizenship**: ${updatedApp.personalDetails.citizenship || '*Not provided yet*'}\n` +
      `- **Academic Background**: ${updatedApp.academicDetails.highestEducation || '*Not provided yet*'} ${updatedApp.academicDetails.atarOrGpa ? `(Score: ${updatedApp.academicDetails.atarOrGpa})` : ''}\n` +
      `- **Target Program**: ${updatedApp.coursePreferences.firstChoiceCourseName || '*Not chosen yet*'}\n\n`;

    if (result.output.missingFields && result.output.missingFields.length > 0) {
      responseMsg += `To complete your application, please provide: **${result.output.missingFields.join(', ')}**.\n\n` +
        `You can also open the **Live Application Form** tab anytime to edit fields directly or submit!`;
    } else {
      responseMsg += `✅ All primary fields look complete! Would you like me to **submit your application** now, or would you like to review your statement of purpose first?`;
    }

    return {
      message: responseMsg,
      toolsExecuted,
      uiWidgets,
      updatedApplication: updatedApp
    };
  }

  // E. Campus, Accreditation & University Knowledge Search
  const isAskingWebsiteKnowledge =
    lower.includes('campus') ||
    lower.includes('campuses') ||
    lower.includes('sydney') ||
    lower.includes('melbourne') ||
    lower.includes('accreditation') ||
    lower.includes('acs') ||
    lower.includes('teqsa') ||
    lower.includes('aacsb') ||
    lower.includes('ranking') ||
    lower.includes('employability') ||
    lower.includes('research group') ||
    lower.includes('compute hub');

  if (isAskingWebsiteKnowledge) {
    const { result } = executeAgentTool('get_website_knowledge', {}, updatedApp);
    toolsExecuted.push({ toolName: 'get_website_knowledge', args: {}, output: result.output });

    const k = result.output;
    const campusesText = k.campuses.map((c: any) => `• **${c.name}** (${c.location}): ${c.features}`).join('\n');
    const accreditationsText = k.accreditations.map((a: string) => `• ${a}`).join('\n');

    const msg = `### 🏛️ About ${k.institutionName}\n\n` +
      `EduPulse is an Australian higher education and technology institute leading innovation in Artificial Intelligence, Computer Science, and Data Analytics.\n\n` +
      `#### 📍 Campuses & Learning Precincts\n${campusesText}\n\n` +
      `#### 🛡️ Accreditations & Quality Standards\n${accreditationsText}\n\n` +
      `#### 🏆 Employability & Recognition\n` +
      `- **${k.employabilityRanking}**\n` +
      `- **Admissions Intakes**: ${k.admissionsIntakes.join(' and ')}\n` +
      `- **Early Entry Schemes**: ${k.earlyEntry}\n\n` +
      `Would you like to explore our **degree programs**, check **scholarship options**, or **book an Open Day tour**?`;

    return {
      message: msg,
      toolsExecuted,
      uiWidgets,
      updatedApplication: updatedApp
    };
  }

  // F. Comprehensive University FAQ Knowledge Base Search
  const isBroadFaqQuery =
    lower.includes('faq') ||
    lower.includes('faqs') ||
    lower.includes('frequently asked') ||
    lower.includes('questions') ||
    lower.includes('help topics') ||
    lower.includes('knowledge base');

  const allFaqs = getDynamicFaqs();

  if (isBroadFaqQuery) {
    const { result: faqResult } = executeAgentTool('search_faq', { query: 'all' }, updatedApp);
    toolsExecuted.push({ toolName: 'search_faq', args: { query: 'all' }, output: faqResult.output });
    if (faqResult.uiWidget) uiWidgets.push(faqResult.uiWidget);

    let msg = `### ❓ University Knowledge Base & Frequently Asked Questions\n\n` +
      `Here is a summary of the most common admissions, tuition, visa, and study questions at EduPulse:\n\n`;

    const categories = ['Admissions', 'Fees & Scholarships', 'International', 'Campus Life', 'Applications', 'Courses & Study'];
    for (const cat of categories) {
      const catFaqs = allFaqs.filter(f => f.category === cat);
      if (catFaqs.length > 0) {
        msg += `#### 📁 **${cat}**\n`;
        for (const f of catFaqs) {
          msg += `• **${f.question}**\n  ${f.answer}\n\n`;
        }
      }
    }
    msg += `*You can expand and explore all questions in the interactive FAQ card below, or ask me any question directly!*`;

    return {
      message: msg,
      toolsExecuted,
      uiWidgets,
      updatedApplication: updatedApp
    };
  }

  // Specific FAQ search query
  const { result: faqResult } = executeAgentTool('search_faq', { query: userText }, updatedApp);
  const matchedFaqs = faqResult.output.faqs;

  if (matchedFaqs && matchedFaqs.length > 0) {
    toolsExecuted.push({ toolName: 'search_faq', args: { query: userText }, output: faqResult.output });
    if (faqResult.uiWidget) uiWidgets.push(faqResult.uiWidget);
    const topFaq = matchedFaqs[0];
    let msg = `### 💡 ${topFaq.question}\n\n${topFaq.answer}\n\n`;

    if (matchedFaqs.length > 1) {
      msg += `#### 🔍 Related FAQs:\n`;
      for (const f of matchedFaqs.slice(1, 4)) {
        msg += `• **${f.question}**\n  ${f.answer}\n\n`;
      }
    }

    msg += `How else can I help you today? You can ask about **degree courses**, **unit descriptions (COMP1001, COMP2004, AI5001)**, **registering for an Open Day / Google Calendar consultation**, or **starting your application**!`;

    return {
      message: msg,
      toolsExecuted,
      uiWidgets,
      updatedApplication: updatedApp
    };
  }

  // G. Multilingual Vector RAG Search & Knowledge Retrieval
  // Handles queries in any language (Japanese, Chinese, Vietnamese, Thai, English, etc.)
  if (userText && userText.trim().length > 3 && !['hi', 'hello', 'hey', 'start', 'help', 'menu'].includes(lower.trim())) {
    try {
      const ragRes = await queryMultilingualRag(userText, { apiKey });
      if (ragRes && (ragRes.totalRetrieved > 0 || (ragRes.answer && ragRes.answer.length > 20))) {
        return {
          message: ragRes.answer,
          toolsExecuted: [
            ...toolsExecuted,
            {
              toolName: 'query_multilingual_rag',
              args: { query: userText, detectedLanguage: ragRes.queryLanguage },
              output: {
                confidence: ragRes.confidence,
                sources: ragRes.sources,
                totalRetrieved: ragRes.totalRetrieved
              }
            }
          ],
          uiWidgets,
          updatedApplication: updatedApp
        };
      }
    } catch (ragErr) {
      console.warn('[processAgentConversation] RAG fallback query failed:', ragErr);
    }
  }

  // Default fallback welcome / guidance
  return {
    message: `Hello! I am your **EduPulse AI Student Assistant**. I can help you with:\n\n` +
      `1. 📚 **Course Descriptions & Degree Finder** (e.g. *Bachelor of Computer Science, Master of AI, Business Analytics*)\n` +
      `2. 🔬 **Individual Unit Descriptions & Syllabuses** (e.g. *COMP1001, COMP2004, DATA3001, CYBR2002, AI5001*)\n` +
      `3. 📝 **Interactive Student Application Form** (Guided step-by-step application assistant)\n` +
      `4. 📅 **Prospective Student Event Registration & Google Calendar** (Open Days, 1-on-1 advisor sessions with 1-click Google Calendar sync)\n` +
      `5. ❓ **Admissions FAQs** (Scholarships, tuition fees, visa work rights, accommodation, entry requirements)\n\n` +
      `What would you like to explore first?`,
    toolsExecuted,
    uiWidgets,
    updatedApplication: updatedApp
  };
}

/**
 * Synthesizes a grounded markdown response when tools are executed
 */
function synthesizeToolResponse(toolName: string, output: any): string {
  switch (toolName) {
    case 'search_faq': {
      const faqs = output.faqs || [];
      if (faqs.length === 0) return 'I could not find a matching FAQ. Please ask another question or browse our categories.';
      const top = faqs[0];
      let res = `### 💡 ${top.question}\n\n${top.answer}\n\n`;
      if (faqs.length > 1) {
        res += `#### 🔍 Related FAQs:\n`;
        for (const f of faqs.slice(1, 3)) {
          res += `• **${f.question}**\n  ${f.answer}\n\n`;
        }
      }
      return res;
    }
    case 'list_courses': {
      const courses = output.courses || [];
      let res = `### 🎓 University Degree Programs\n\n`;
      for (const c of courses) {
        res += `#### 🏛️ **${c.title}** (\`${c.code}\`)\n` +
               `- **Level**: ${c.degreeLevel} (${c.duration})\n` +
               `- **Tuition**: Domestic: ${c.domesticFee} | International: ${c.intlFee}\n` +
               `- **Entry**: ATAR: ${c.atar} | GPA: ${c.gpa}\n` +
               `- **Faculty**: ${c.faculty}\n\n`;
      }
      return res;
    }
    case 'get_course_details': {
      const c = output;
      return `### 🎓 ${c.title} (${c.code})\n\n${c.overview}\n\n` +
             `- **Degree Level**: ${c.degreeLevel} (${c.durationYears} Years)\n` +
             `- **Entry Cutoffs**: ${c.atarRequirement ? `ATAR ${c.atarRequirement}` : `GPA ${c.gpaRequirement}/7.0`}\n` +
             `- **Tuition**: Dom: \$${c.annualTuitionDomestic?.toLocaleString()}/yr | Intl: \$${c.annualTuitionInternational?.toLocaleString()}/yr\n` +
             `- **Core Units**: ${c.coreUnits?.join(', ')}\n` +
             `- **Majors**: ${c.majors?.map((m: any) => m.name).join(', ')}`;
    }
    case 'get_unit_syllabus': {
      const u = output;
      return `### 📘 ${u.code}: ${u.title}\n\n${u.overview}\n\n` +
             `- **Level & Credits**: ${u.level} | ${u.creditPoints} CP\n` +
             `- **Coordinator**: ${u.coordinator?.name} (${u.coordinator?.email})\n` +
             `- **Prerequisites**: ${u.prerequisites?.join(', ') || 'None'}\n` +
             `- **Assessments**: ${u.assessments?.map((a: any) => `${a.name} (${a.weight}%)`).join(', ')}`;
    }
    case 'get_website_knowledge': {
      const k = output;
      return `### 🏛️ About ${k.institutionName}\n\n` +
             `**Accreditation**: ${k.accreditations?.join('; ')}\n\n` +
             `**Rankings**: ${k.employabilityRanking}\n\n` +
             `**Campuses**: ${k.campuses?.map((c: any) => `${c.name} (${c.location})`).join(', ')}`;
    }
    case 'query_multilingual_rag': {
      if (output.answer) return output.answer;
      if (output.sources && output.sources.length > 0) {
        let msg = `### 📚 Retrieved Educational & Compliance Resources\n\n`;
        for (const s of output.sources) {
          msg += `#### 📄 **${s.title}** (${s.category} | ${s.language})\n${s.excerpt}\n\n`;
        }
        return msg;
      }
      return 'No specific document chunks were retrieved for this inquiry.';
    }
    default:
      return 'I have retrieved the requested information from the university systems.';
  }
}

/**
 * Direct Gemini API caller with function calling support and grounded multi-turn synthesis
 */
async function callGeminiWithTools(
  messages: ChatMessage[],
  currentApplication: StudentApplication,
  apiKey: string
): Promise<AgentProcessResult | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

  const rawContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  // Gemini API requires the first turn to have role 'user'
  const firstUserIdx = rawContents.findIndex(c => c.role === 'user');
  if (firstUserIdx === -1) return null;
  const geminiContents = rawContents.slice(firstUserIdx);

  const systemInstruction = {
    parts: [{
      text: `You are EduPulse AI, an intelligent, empathetic, and highly capable university admissions, course, and RTO compliance assistant.
Your job is to answer prospective and current student inquiries accurately:
- Use 'query_multilingual_rag' to retrieve authoritative institutional documents, TEQSA/ASQA/CRICOS standards, course architectures, and knowledge in any language (Japanese, Chinese, Vietnamese, Thai, English, etc.).
- Provide rich details on courses (degrees) and individual unit syllabuses (prerequisites, assessment breakdowns, weekly topics).
- Help students fill in their application forms progressively.
- Register prospective students for upcoming admissions events and 1-on-1 consultations with Google Calendar invites.
- Answer university FAQs regarding scholarships, tuition, visas, accommodation, deadlines, and campus life.
Always be polite, structured, and use markdown formatting. Match the user's inquiry language naturally.`
    }]
  };

  const body = {
    contents: geminiContents,
    systemInstruction,
    tools: [
      {
        functionDeclarations: AGENT_TOOLS.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }))
      }
    ]
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(9000)
    });
  } catch (fetchErr) {
    console.warn('Gemini API request timed out or network error:', fetchErr);
    return null;
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.warn('Gemini API returned error status:', res.status, errorText);
    return null;
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate) return null;

  const contentParts = candidate.content?.parts || [];
  const toolsExecuted: { toolName: string; args: any; output: any }[] = [];
  const uiWidgets: { type: any; data: any }[] = [];
  let updatedApp = currentApplication ? JSON.parse(JSON.stringify(currentApplication)) : undefined;
  let textResponse = '';

  const functionCalls: any[] = [];
  for (const part of contentParts) {
    if (part.text) {
      textResponse += part.text;
    }
    if (part.functionCall) {
      functionCalls.push(part.functionCall);
    }
  }

  if (functionCalls.length > 0) {
    const functionResponseParts = [];

    for (const fc of functionCalls) {
      const { name, args } = fc;
      try {
        const { result, updatedApplication: newApp } = await executeAgentToolAsync(name, args || {}, updatedApp, apiKey);
        toolsExecuted.push({ toolName: name, args: args || {}, output: result.output });
        if (result.uiWidget) uiWidgets.push(result.uiWidget);
        if (newApp) updatedApp = newApp;

        functionResponseParts.push({
          functionResponse: {
            name,
            response: {
              output: result.output
            }
          }
        });
      } catch (toolErr) {
        console.warn(`Tool execution error for ${name}:`, toolErr);
        functionResponseParts.push({
          functionResponse: {
            name,
            response: {
              output: { error: 'Tool completed with warnings.' }
            }
          }
        });
      }
    }

    // Try follow-up call to Gemini to synthesize grounded prose
    try {
      const secondTurnContents = [
        ...geminiContents,
        candidate.content,
        {
          role: 'user',
          parts: functionResponseParts
        }
      ];

      const secondRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: secondTurnContents,
          systemInstruction,
          tools: body.tools
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (secondRes.ok) {
        const secondData = await secondRes.json();
        const secondCandidate = secondData.candidates?.[0];
        const secondText = secondCandidate?.content?.parts?.map((p: any) => p.text || '').join('') || '';
        if (secondText.trim()) {
          textResponse = secondText;
        }
      }
    } catch (secondErr) {
      console.warn('Second turn Gemini call skipped or timed out:', secondErr);
    }

    // If second call didn't yield text, synthesize from tool execution
    if (!textResponse && toolsExecuted.length > 0) {
      textResponse = synthesizeToolResponse(toolsExecuted[0].toolName, toolsExecuted[0].output);
    }
  }

  return {
    message: textResponse || 'How can I assist you with EduPulse courses and admissions today?',
    toolsExecuted,
    uiWidgets,
    updatedApplication: updatedApp
  };
}
