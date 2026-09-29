import { AGENT_TOOLS, executeAgentTool, ToolExecutionResult } from './tools';
import { StudentApplication, INITIAL_APPLICATION_STATE } from '@/data/applications';
import { COURSES_DATA, CourseProgram } from '@/data/courses';
import { UNITS_DATA, UnitDetail } from '@/data/units';
import { EVENTS_DATA, ProspectiveEvent } from '@/data/events';
import { FAQS_DATA, FAQItem } from '@/data/faqs';
import { getDynamicCourses, getDynamicUnits, getDynamicFaqs } from '@/data/dynamicStore';

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
      const geminiResult = await callGeminiWithTools(messages, currentApplication, apiKey.trim());
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
  const unitMatch = allUnits.find(u =>
    lower.includes(u.code.toLowerCase()) ||
    lower.includes(u.title.toLowerCase()) ||
    (lower.includes('syllabus') && lower.includes(u.code.toLowerCase().slice(0, 4)))
  );

  const isAskingUnit = unitMatch || lower.includes('unit description') || lower.includes('syllabus') || lower.includes('assessment') || lower.includes('prerequisite');

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
    (lower.includes('artificial intelligence') && c.id === 'm-ai') ||
    (lower.includes('data analytics') && c.id === 'b-ba') ||
    (lower.includes('cybersecurity') && c.id === 'm-cyber')
  );

  const isAskingCourseList = lower.includes('what courses') || lower.includes('list courses') || lower.includes('degrees') || lower.includes('programs offered') || lower.includes('undergraduate programs') || lower.includes('postgraduate programs');
  const isApplicationIntent = lower.includes('apply') || lower.includes('application') || lower.includes('fill form') || lower.includes('start application') || lower.includes('my name is') || lower.includes('my email') || lower.includes('my gpa') || lower.includes('my atar') || lower.includes('submit application') || (lower.includes('name:') && lower.includes('email:'));
  const isAskingEventBooking = lower.includes('register') || lower.includes('book') || lower.includes('rsvp') || lower.includes('schedule') || lower.includes('calendar') || lower.includes('open day') || lower.includes('campus tour') || lower.includes('webinar') || lower.includes('consultation') || lower.includes('advising');

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

    let msg = `Here are the available degree programs at our university:\n\n`;
    for (const c of allCourses) {
      msg += `• **${c.title}** (${c.code}) - *${c.degreeLevel}, ${c.durationYears} yrs* | ${c.faculty}\n`;
    }
    msg += `\nYou can ask me about any specific course to view majors, fees, entry requirements, or syllabus unit breakdowns!`;

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
      // Find event
      let targetEvent = EVENTS_DATA[0]; // default Open Day
      if (lower.includes('advis') || lower.includes('consult') || lower.includes('1-on-1') || lower.includes('slot')) {
        targetEvent = EVENTS_DATA.find(e => e.id === 'event-advising-consultation') || EVENTS_DATA[1];
      } else if (lower.includes('ai') || lower.includes('workshop') || lower.includes('masterclass')) {
        targetEvent = EVENTS_DATA.find(e => e.id === 'event-ai-taster-workshop') || EVENTS_DATA[2];
      } else if (lower.includes('intl') || lower.includes('international') || lower.includes('webinar') || lower.includes('visa')) {
        targetEvent = EVENTS_DATA.find(e => e.id === 'event-intl-webinar') || EVENTS_DATA[3];
      } else if (lower.includes('tour')) {
        targetEvent = EVENTS_DATA.find(e => e.id === 'event-campus-tour-sep') || EVENTS_DATA[4];
      }

      // Extract email or name if provided, or use application state
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
      const emailMatch = userText.match(emailRegex);
      const studentEmail = emailMatch ? emailMatch[0] : (updatedApp?.personalDetails.email || 'prospective.student@example.com');

      let studentName = updatedApp?.personalDetails.fullName || 'Prospective Student';
      const nameMatch = userText.match(/(?:my name is|i am|name:?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
      if (nameMatch) {
        studentName = nameMatch[1].replace(/[,.;:]+$/, '').trim();
      }

      // Check slot
      let slotId: string | undefined = undefined;
      if (targetEvent.availableSlots) {
        const slotMatch = targetEvent.availableSlots.find(s => !s.isBooked);
        if (slotMatch) slotId = slotMatch.slotId;
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
        `📅 **Date & Time**: ${new Date(result.output.startTime).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}\n` +
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
      for (const ev of EVENTS_DATA) {
        const dateStr = new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  if (isApplicationIntent) {
    if (lower.includes('submit') || lower.includes('finalize') || lower.includes('send application')) {
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

    // Extract fields from user message
    const updates: Record<string, any> = {};

    const nameMatch = userText.match(/(?:my name is|i am|name is|name:)\s+([A-Za-z]+(?:\s+[A-Za-z]+)+)/i);
    if (nameMatch) {
      updates.fullName = nameMatch[1].replace(/[,.;:]+$/, '').trim();
    }

    const emailMatch = userText.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) updates.email = emailMatch[0].replace(/[,.;:]+$/, '').trim();

    const phoneMatch = userText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) updates.phone = phoneMatch[0];

    if (lower.includes('domestic') || lower.includes('australian citizen') || lower.includes('permanent resident')) {
      updates.citizenship = 'Domestic';
    } else if (lower.includes('international') || lower.includes('overseas')) {
      updates.citizenship = 'International';
    }

    if (lower.includes('high school') || lower.includes('year 12') || lower.includes('atar')) {
      updates.highestEducation = 'High School';
    } else if (lower.includes('bachelor') || lower.includes('undergrad degree')) {
      updates.highestEducation = 'Bachelor Degree';
    } else if (lower.includes('master')) {
      updates.highestEducation = 'Master Degree';
    }

    const gpaMatch = userText.match(/(?:gpa|atar|score|wam|grade)(?:\s+is|\s*:|\s+of)?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (gpaMatch) updates.atarOrGpa = gpaMatch[1];

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

  // E. FAQ & General Knowledge Base Search
  const { result: faqResult } = executeAgentTool('search_faq', { query: userText }, updatedApp);
  toolsExecuted.push({ toolName: 'search_faq', args: { query: userText }, output: faqResult.output });

  const matchedFaqs = faqResult.output.faqs;
  if (matchedFaqs && matchedFaqs.length > 0) {
    const topFaq = matchedFaqs[0];
    let msg = `### 💡 ${topFaq.question}\n\n${topFaq.answer}\n\n`;

    if (matchedFaqs.length > 1) {
      msg += `#### 🔍 Related FAQs:\n`;
      for (const f of matchedFaqs.slice(1, 3)) {
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
 * Direct Gemini API caller with function calling support
 */
async function callGeminiWithTools(
  messages: ChatMessage[],
  currentApplication: StudentApplication,
  apiKey: string
): Promise<AgentProcessResult | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const systemInstruction = {
    parts: [{
      text: `You are EduPulse AI, an intelligent, empathetic, and highly capable university admissions and student assistant.
Your job is to answer prospective and current student inquiries accurately:
- Provide rich details on courses (degrees) and individual unit syllabuses (prerequisites, assessment breakdowns, weekly topics).
- Help students fill in their application forms progressively.
- Register prospective students for upcoming admissions events and 1-on-1 consultations with Google Calendar invites.
- Answer university FAQs regarding scholarships, tuition, visas, and campus life.
Always be polite, structured, and use markdown formatting.`
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

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Gemini API returned error:', errorText);
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

  for (const part of contentParts) {
    if (part.text) {
      textResponse += part.text;
    }
    if (part.functionCall) {
      const { name, args } = part.functionCall;
      const { result, updatedApplication: newApp } = executeAgentTool(name, args || {}, updatedApp);
      toolsExecuted.push({ toolName: name, args: args || {}, output: result.output });
      if (result.uiWidget) uiWidgets.push(result.uiWidget);
      if (newApp) updatedApp = newApp;
    }
  }

  // If only function call was returned without prose text, provide synthesized summary
  if (!textResponse && toolsExecuted.length > 0) {
    textResponse = `I have executed the requested action for you.`;
  }

  return {
    message: textResponse,
    toolsExecuted,
    uiWidgets,
    updatedApplication: updatedApp
  };
}
