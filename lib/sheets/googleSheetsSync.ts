import { CourseProgram } from '@/data/courses';
import { UnitDetail, AssessmentItem } from '@/data/units';
import { FAQItem } from '@/data/faqs';
import {
  setDynamicCourses,
  setDynamicUnits,
  setDynamicFaqs,
  setGoogleSheetsSyncStatus,
  getGoogleSheetsSyncStatus,
  GoogleSheetsSyncStatus
} from '@/data/dynamicStore';

/**
 * Extracts the raw Google Sheet ID from any standard Google Sheets URL or raw ID string.
 */
export function extractGoogleSheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If it doesn't contain the URL structure, assume it is the raw ID
  return trimmed.split('/')[0].split('?')[0];
}

/**
 * Robust RFC 4180 compliant CSV Parser that handles commas inside quotes and multiline rows.
 */
export function parseCsv(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\r') {
        // ignore carriage return
      } else if (char === '\n') {
        row.push(currentVal.trim());
        if (row.some((cell) => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal.length > 0 || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Parses raw CSV rows into CourseProgram objects.
 */
export function parseCoursesFromCsv(csvText: string): CourseProgram[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const courses: CourseProgram[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const getVal = (colName: string) => {
      const idx = headers.findIndex((h) => h.includes(colName.toLowerCase()));
      return idx >= 0 && idx < row.length ? row[idx] : '';
    };

    const id = getVal('id') || `course-${i}`;
    const code = getVal('code') || `C${100 + i}`;
    const title = getVal('title');
    if (!title) continue; // skip empty rows

    const degreeLevel = (getVal('degreelevel') || getVal('level') || 'Undergraduate').includes('Post')
      ? 'Postgraduate'
      : 'Undergraduate';

    const faculty = getVal('faculty') || 'Faculty of Higher Education';
    const durationYears = parseFloat(getVal('duration')) || 3;

    const studyModesRaw = getVal('studymode') || 'Full-time, On-campus';
    const studyModes = studyModesRaw.split(/[,;|]/).map((s) => s.trim() as any).filter(Boolean);

    const campusRaw = getVal('campus') || 'Main Campus (Sydney)';
    const campus = campusRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);

    const intakesRaw = getVal('intake') || 'February (Semester 1), July (Semester 2)';
    const intakes = intakesRaw.split(/[,;|]/).map((s) => s.trim() as any).filter(Boolean);

    const atar = parseFloat(getVal('atar')) || undefined;
    const gpa = parseFloat(getVal('gpa')) || undefined;
    const annualTuitionDomestic = parseInt(getVal('domesticfee') || getVal('tuitiondomestic')) || 9500;
    const annualTuitionInternational = parseInt(getVal('intlfee') || getVal('tuitionintl') || getVal('internationalfee')) || 42000;
    const overview = getVal('overview') || `${title} degree program at the university.`;

    const highlightsRaw = getVal('highlight') || '';
    const highlights = highlightsRaw.split(/[;|]/).map((h) => h.trim()).filter(Boolean);

    const careerRaw = getVal('career') || '';
    const careerOutcomes = careerRaw.split(/[;|]/).map((c) => c.trim()).filter(Boolean);

    const coreUnitsRaw = getVal('coreunit') || '';
    const coreUnits = coreUnitsRaw.split(/[,;|]/).map((u) => u.trim().toUpperCase()).filter(Boolean);

    const electiveUnitsRaw = getVal('elective') || '';
    const electiveUnits = electiveUnitsRaw.split(/[,;|]/).map((u) => u.trim().toUpperCase()).filter(Boolean);

    // Majors parsing: e.g. "AI: Focus on ML | Cyber: Focus on security"
    const majorsRaw = getVal('major') || '';
    const majors: { name: string; description: string; coreUnits: string[] }[] = [];
    if (majorsRaw) {
      const majorItems = majorsRaw.split('|');
      for (const item of majorItems) {
        const parts = item.split(':');
        const mName = parts[0]?.trim();
        const mDesc = parts[1]?.trim() || `Specialization in ${mName}`;
        if (mName) {
          majors.push({ name: mName, description: mDesc, coreUnits: coreUnits.slice(0, 3) });
        }
      }
    }

    courses.push({
      id,
      code,
      title,
      degreeLevel,
      faculty,
      durationYears,
      studyModes: studyModes.length ? studyModes : ['Full-time', 'On-campus'],
      campus: campus.length ? campus : ['Main Campus'],
      intakes: intakes.length ? intakes : ['February (Semester 1)'],
      atarRequirement: atar,
      gpaRequirement: gpa,
      annualTuitionDomestic,
      annualTuitionInternational,
      overview,
      highlights: highlights.length ? highlights : ['Industry-accredited curriculum', 'Leading faculty mentors'],
      careerOutcomes: careerOutcomes.length ? careerOutcomes : ['Industry Specialist', 'Graduate Researcher'],
      majors: majors.length ? majors : [{ name: 'General Specialization', description: `Standard study plan for ${title}`, coreUnits }],
      coreUnits: coreUnits.length ? coreUnits : ['COMP1001', 'COMP2004'],
      electiveUnits
    });
  }

  return courses;
}

/**
 * Parses raw CSV rows into UnitDetail objects.
 */
export function parseUnitsFromCsv(csvText: string): UnitDetail[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const units: UnitDetail[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const getVal = (colName: string) => {
      const idx = headers.findIndex((h) => h.includes(colName.toLowerCase()));
      return idx >= 0 && idx < row.length ? row[idx] : '';
    };

    const code = getVal('code')?.toUpperCase().trim();
    const title = getVal('title');
    if (!code || !title) continue;

    const faculty = getVal('faculty') || 'Faculty of Science & Engineering';
    const level = (getVal('level') || 'Undergraduate').includes('Post') ? 'Postgraduate' : 'Undergraduate';
    const creditPoints = parseInt(getVal('credit')) || 6;

    const semestersRaw = getVal('semester') || 'Semester 1, Semester 2';
    const semestersOffered = semestersRaw.split(/[,;|]/).map((s) => s.trim() as any).filter(Boolean);

    const deliveryMode = (getVal('delivery') || 'Blended') as any;

    const coordinator = {
      name: getVal('coordinatorname') || getVal('coordinator') || 'Faculty Coordinator',
      email: getVal('coordinatoremail') || 'coordinator@university.edu.au',
      office: getVal('coordinatoroffice') || 'Academic Office'
    };

    const overview = getVal('overview') || `Syllabus and learning outcomes for ${code} ${title}.`;

    const outcomesRaw = getVal('learningoutcome') || getVal('outcome') || '';
    const learningOutcomes = outcomesRaw.split(/[;|]/).map((o) => o.trim()).filter(Boolean);

    const prereqRaw = getVal('prereq') || 'None';
    const prerequisites = prereqRaw.split(/[;|]/).map((p) => p.trim()).filter(Boolean);

    // Topics parsing: e.g. "W1: Intro & Syntax: Basics | W2: OOP: Classes"
    const topicsRaw = getVal('topic') || getVal('weekly') || '';
    const topics: { week: number; title: string; summary: string }[] = [];
    if (topicsRaw) {
      const topicParts = topicsRaw.split('|');
      topicParts.forEach((part, idx) => {
        const segs = part.split(':');
        const tTitle = segs[0]?.trim() || `Week ${idx + 1} Lecture`;
        const tSum = segs[1]?.trim() || 'Core theoretical and practical session';
        topics.push({ week: idx + 1, title: tTitle, summary: tSum });
      });
    }

    // Assessments parsing: e.g. "Lab Drills (15%, Lab, W2-11) | Major Project (35%, Project, W10) | Final Exam (50%, Final Exam, Exam Period)"
    const assessmentsRaw = getVal('assessment') || '';
    const assessments: AssessmentItem[] = [];
    if (assessmentsRaw) {
      const aParts = assessmentsRaw.split('|');
      for (const part of aParts) {
        const match = part.match(/(.*?)\s*\((\d+)%?(?:,\s*([^,)]+))?(?:,\s*([^)]+))?\)/);
        if (match) {
          const aName = match[1].trim();
          const weight = parseInt(match[2]) || 20;
          const aType = (match[3]?.trim() as any) || 'Assignment';
          const due = match[4]?.trim() || 'Mid-Semester';
          assessments.push({
            name: aName,
            weight,
            type: aType,
            description: `${aName} assessment task for ${code}`,
            dueWeek: due
          });
        }
      }
    }

    const resourcesRaw = getVal('resource') || getVal('textbook') || '';
    const prescribedResources = resourcesRaw.split(/[;|]/).map((r) => r.trim()).filter(Boolean);

    units.push({
      code,
      title,
      faculty,
      level,
      creditPoints,
      semestersOffered: semestersOffered.length ? semestersOffered : ['Semester 1'],
      deliveryMode,
      coordinator,
      overview,
      learningOutcomes: learningOutcomes.length ? learningOutcomes : ['Demonstrate practical mastery of subject matter', 'Solve complex computational problems'],
      prerequisites: prerequisites.length ? prerequisites : ['None'],
      topics: topics.length ? topics : [
        { week: 1, title: 'Introduction & Foundations', summary: 'Orientation, foundational theory, and setup.' },
        { week: 2, title: 'Core Principles & Methods', summary: 'Deep dive into methodological applications.' }
      ],
      assessments: assessments.length ? assessments : [
        { name: 'Practical Assignments & Quizzes', weight: 40, type: 'Assignment', description: 'Weekly lab deliverables', dueWeek: 'Weeks 3-10' },
        { name: 'Final Comprehensive Assessment', weight: 60, type: 'Final Exam', description: 'Final examination paper', dueWeek: 'Exam Period' }
      ],
      prescribedResources: prescribedResources.length ? prescribedResources : ['University Online Study Portal & Lecture Notes']
    });
  }

  return units;
}

/**
 * Parses raw CSV rows into FAQItem objects.
 */
export function parseFaqsFromCsv(csvText: string): FAQItem[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const faqs: FAQItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const getVal = (colName: string) => {
      const idx = headers.findIndex((h) => h.includes(colName.toLowerCase()));
      return idx >= 0 && idx < row.length ? row[idx] : '';
    };

    const question = getVal('question');
    const answer = getVal('answer');
    if (!question || !answer) continue;

    const id = getVal('id') || `faq-sheet-${i}`;
    const category = (getVal('category') || 'Admissions') as any;
    const keywordsRaw = getVal('keyword') || '';
    const keywords = keywordsRaw.split(/[,;|]/).map((k) => k.trim()).filter(Boolean);

    faqs.push({
      id,
      category,
      question,
      answer,
      keywords: keywords.length ? keywords : [category.toLowerCase(), 'university', 'admissions']
    });
  }

  return faqs;
}

/**
 * Fetches and synchronizes live data from a Google Sheet with 24/7 reliability.
 */
export async function syncFromGoogleSheet(sheetIdOrUrl: string): Promise<{
  success: boolean;
  coursesCount: number;
  unitsCount: number;
  faqsCount: number;
  message: string;
}> {
  const sheetId = extractGoogleSheetId(sheetIdOrUrl);
  if (!sheetId || sheetId.length < 5) {
    return {
      success: false,
      coursesCount: 0,
      unitsCount: 0,
      faqsCount: 0,
      message: 'Invalid Google Sheet ID or URL provided.'
    };
  }

  setGoogleSheetsSyncStatus({
    sheetId,
    status: 'syncing'
  });

  try {
    // 1. Fetch Courses Tab CSV
    const coursesUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Courses`;
    const unitsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Units`;
    const faqsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=FAQs`;

    const [coursesRes, unitsRes, faqsRes] = await Promise.allSettled([
      fetch(coursesUrl, { cache: 'no-store' }),
      fetch(unitsUrl, { cache: 'no-store' }),
      fetch(faqsUrl, { cache: 'no-store' })
    ]);

    let loadedCoursesCount = 0;
    let loadedUnitsCount = 0;
    let loadedFaqsCount = 0;

    // Parse Courses
    if (coursesRes.status === 'fulfilled' && coursesRes.value.ok) {
      const csvText = await coursesRes.value.text();
      const parsedCourses = parseCoursesFromCsv(csvText);
      if (parsedCourses.length > 0) {
        setDynamicCourses(parsedCourses);
        loadedCoursesCount = parsedCourses.length;
      }
    }

    // Parse Units
    if (unitsRes.status === 'fulfilled' && unitsRes.value.ok) {
      const csvText = await unitsRes.value.text();
      const parsedUnits = parseUnitsFromCsv(csvText);
      if (parsedUnits.length > 0) {
        setDynamicUnits(parsedUnits);
        loadedUnitsCount = parsedUnits.length;
      }
    }

    // Parse FAQs
    if (faqsRes.status === 'fulfilled' && faqsRes.value.ok) {
      const csvText = await faqsRes.value.text();
      const parsedFaqs = parseFaqsFromCsv(csvText);
      if (parsedFaqs.length > 0) {
        setDynamicFaqs(parsedFaqs);
        loadedFaqsCount = parsedFaqs.length;
      }
    }

    const nowIso = new Date().toISOString();
    setGoogleSheetsSyncStatus({
      sheetId,
      lastSyncedAt: nowIso,
      status: 'success',
      source: 'google_sheets_live',
      coursesCount: loadedCoursesCount,
      unitsCount: loadedUnitsCount,
      faqsCount: loadedFaqsCount
    });

    return {
      success: true,
      coursesCount: loadedCoursesCount,
      unitsCount: loadedUnitsCount,
      faqsCount: loadedFaqsCount,
      message: `Successfully synchronized ${loadedCoursesCount} courses, ${loadedUnitsCount} unit syllabuses, and ${loadedFaqsCount} FAQs from Google Sheets!`
    };
  } catch (error: any) {
    console.error('Error syncing from Google Sheets:', error);
    setGoogleSheetsSyncStatus({
      status: 'error',
      errorMessage: error.message || 'Network error fetching Google Sheets CSV'
    });

    return {
      success: false,
      coursesCount: 0,
      unitsCount: 0,
      faqsCount: 0,
      message: `Failed to sync: ${error.message}. Ensure your Google Sheet is shared as "Anyone with the link can view".`
    };
  }
}

/**
 * Generates sample CSV template string for staff to copy into Google Sheets.
 */
export function generateStarterCsv(type: 'courses' | 'units' | 'faqs'): string {
  if (type === 'courses') {
    return [
      'id,code,title,degreeLevel,faculty,durationYears,studyModes,campus,intakes,atarRequirement,gpaRequirement,annualTuitionDomestic,annualTuitionInternational,overview,highlights,careerOutcomes,majors,coreUnits,electiveUnits',
      'b-cs,CS100,Bachelor of Computer Science,Undergraduate,Faculty of Engineering & Computer Science,3,"Full-time, Part-time, On-campus","Main Campus (Sydney), Melbourne","February (Semester 1), July (Semester 2)",82.5,,9850,44500,"The Bachelor of Computer Science is an industry-accredited degree in algorithms and software engineering.","Accredited by ACS; Industry capstone; Paid IBL placement","Software Engineer; AI Developer; DevOps Engineer","Artificial Intelligence: Focus on ML and neural networks | Cybersecurity: Focus on network security","COMP1001, COMP2004, CYBR2002, DATA3001","AI5001, BUSS2010"',
      'm-ai,AI700,Master of Artificial Intelligence & Machine Learning,Postgraduate,Faculty of Engineering & Computer Science,2,"Full-time, Part-time, On-campus, Online","Main Campus (Sydney), Online","February (Semester 1), July (Semester 2)",,5.0,11200,48900,"Designed for STEM graduates seeking mastery over generative AI and foundation models.","Taught by leading AI researchers; Supervised Master thesis","Lead AI Scientist; ML Engineer; Generative AI Architect","Frontier LLMs: Scaling and RAG | Robotics: Edge AI and perception","AI5001, DATA3001, COMP2004","CYBR2002, BUSS2010"',
      'b-ba,BA200,Bachelor of Business & Data Analytics,Undergraduate,Business School,3,"Full-time, Part-time, On-campus","Main Campus, City Executive Center","February (Semester 1), July (Semester 2)",78.0,,8900,39500,"Combines commercial acumen and financial analytics for data-driven strategic decisions.","AACSB accredited; Live Fortune 500 consulting projects","Business Analyst; Strategy Consultant; Financial Analyst","Strategic Analytics: Decision science | FinTech: Quantitative trading","BUSS2010, COMP1001","DATA3001, CYBR2002"'
    ].join('\n');
  }

  if (type === 'units') {
    return [
      'code,title,faculty,level,creditPoints,semestersOffered,deliveryMode,coordinatorName,coordinatorEmail,coordinatorOffice,overview,learningOutcomes,prerequisites,topics,assessments,prescribedResources',
      'COMP1001,Introduction to Programming & Algorithms,Faculty of Engineering & Computer Science,Undergraduate,6,"Semester 1, Semester 2",Blended,Dr. Sarah Lin,s.lin@university.edu.au,Engineering Building E4,"Introduces procedural and OOP programming, data structures, and debugging using Python and C++.","Design algorithms; Apply OOP; Analyze Big-O complexity; Write clean modular code",None,"W1: Variables & Control Flow | W2: Functions & Scoping | W3: Linear Data Structures | W4: OOP Classes | W5: Inheritance | W6: Sorting Algorithms | W7: File IO | W8: Trees & Graphs | W9: Unit Testing | W10: Memory Management | W11: Software Engineering | W12: Capstone","Weekly Lab Exercises (15%, Lab Practical, Weeks 2-11) | Midterm Quiz (15%, Quiz, Week 6) | Major Project (30%, Project, Week 10) | Final Exam (40%, Final Exam, Exam Period)","Starting Out with Python (5th Edition) - Tony Gaddis"',
      'DATA3001,Applied Machine Learning & Predictive Analytics,Faculty of Science & Data Systems,Undergraduate,6,Semester 1,Blended,Dr. Elena Rostova,e.rostova@university.edu.au,Data Science Hub Level 2,"Supervised and unsupervised learning, deep neural networks, feature engineering, and MLOps deployment.","Formulate ML pipelines; Train PyTorch models; Evaluate bias/variance; Deploy inference microservices",COMP2004,"W1: EDA & Preprocessing | W2: Regression & Regularization | W3: Classification & SVM | W4: Random Forests & XGBoost | W5: Clustering | W6: Deep Learning & PyTorch | W7: CNNs & Vision | W8: Transformers & LLMs | W9: Model Interpretability | W10: MLOps & MLflow | W11: Container APIs | W12: Kaggle Showcase","Tabular Modeling (20%, Assignment, Week 5) | Deep Learning Kaggle (35%, Project, Week 10) | MLOps Lab (15%, Lab Practical, Week 11) | Final Exam (30%, Final Exam, Exam Period)","Pattern Recognition and Machine Learning - Christopher Bishop"',
      'AI5001,Foundations of Generative AI & Large Language Models,Faculty of Engineering & Computer Science,Postgraduate,6,"Semester 1, Semester 2",Blended,Prof. Nathan Reed,n.reed@university.edu.au,Center for AI Research,"Frontier unit covering transformer architecture, PEFT (LoRA/QLoRA), RAG systems, and AI agent orchestration.","Master Transformer attention; Implement LoRA fine-tuning; Architect agentic RAG workflows; Red-team models",DATA3001,"W1: Transformer Architecture | W2: Tokenization & Scaling | W3: KV-Cache & Quantization | W4: RAG & Vector DBs | W5: LoRA & Fine-Tuning | W6: RLHF & DPO Alignment | W7: Autonomous Agents | W8: Multimodal Vision | W9: Evaluation Benchmarks | W10: Safety & Jailbreaks | W11: Production Streaming | W12: Capstone Demo","Modular RAG Engine (25%, Project, Week 5) | LoRA Fine-Tuning (25%, Assignment, Week 8) | Autonomous Agent Capstone (40%, Project, Week 11) | Paper Critique (10%, Presentation, Week 12)","Speech and Language Processing - Jurafsky and Martin"'
    ].join('\n');
  }

  return [
    'id,category,question,answer,keywords',
    'faq-1,Admissions,What are the general admission requirements for undergraduate degrees?,"Undergraduate admission generally requires successful completion of high school (Year 12, IB, or A-Levels) meeting the minimum ATAR or score for your chosen degree.","admission, requirements, atar, undergraduate, high school, prerequisites"',
    'faq-2,Fees & Scholarships,What scholarships are available for new students?,"We offer merit and equity scholarships including the Vice-Chancellor\'s Excellence Award ($10,000/yr), Women in STEM Scholarship ($7,500/yr), and International Student Future Leader Grant (25% reduction).","scholarships, funding, grants, women in stem, financial aid"',
    'faq-3,International,Can international students work while studying on a student visa?,"Yes! Australian student visa holders (Subclass 500) can work up to 48 hours per fortnight during teaching semesters and unlimited hours during scheduled breaks.","visa, work rights, subclass 500, working hours, international student"'
  ].join('\n');
}
