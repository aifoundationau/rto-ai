import { GoogleGenAI } from '@google/genai';
import { getAllNetworkCourses, saveCourse } from './lmsClient.js';

// Environment variable helper supporting both Vite (import.meta.env) and Next.js / Node (process.env)
const getEnv = (key, fallback = '') => {
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
      return import.meta.env[key];
    }
  } catch (e) {}
  return fallback;
};

const getAiClient = () => {
  const key = getEnv('VITE_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY') || '';
  return new GoogleGenAI({ apiKey: key });
};
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Helper to build an index of existing courses for AI context.
 */
export async function buildCoursesKnowledgeContext() {
  const courses = await getAllNetworkCourses();
  return courses.map(c => ({
    id: c.id,
    title: c.title,
    category: c.category,
    level: c.level,
    description: c.shortDescription || c.fullDescription,
    modules: (c.modules || []).map(m => ({
      title: m.title,
      lessons: (m.lessons || []).map(l => (typeof l === 'string' ? l : l.title))
    }))
  }));
}

/**
 * 1. AI Recommendation Engine: Match user intake queries to existing courses.
 */
export async function recommendCourses(userGoalsOrQuery) {
  const courseCatalog = await buildCoursesKnowledgeContext();

  const prompt = `
You are an expert academic advisor and course recommendation engine.
Here is the catalog of available courses across our LMS network:
${JSON.stringify(courseCatalog, null, 2)}

User request or profile:
"${userGoalsOrQuery}"

Recommend the top 3 best matching courses. For each, return:
- courseId
- title
- reason: 1-2 sentences why it fits their goals
- recommendedModules: specific module titles they should focus on

Output strict JSON:
[
  { "courseId": "...", "title": "...", "reason": "...", "recommendedModules": [...] }
]
`;

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  return JSON.parse(response.text);
}

/**
 * 2. AI Course Builder: Synthesize a new course using existing database content.
 */
export async function generateCourseWithExistingContent({ topic, targetAudience, durationWeeks = 8, autoSave = false }) {
  const existingCatalog = await buildCoursesKnowledgeContext();

  const prompt = `
You are a master curriculum designer. You have access to our network's existing course modules and topics:
${JSON.stringify(existingCatalog, null, 2)}

Task: Design a comprehensive new course on the topic: "${topic}".
Target Audience: "${targetAudience}".
Target Duration: ${durationWeeks} weeks.

Guidelines:
1. Wherever applicable, adapt or borrow best practices, concepts, or lesson formats from the existing catalog.
2. Provide a cohesive, production-grade syllabus with modules, lessons, and assessment items.

Output strict JSON matching this schema:
{
  "title": "Course Title",
  "category": "Technology | Business | Creative | Healthcare | etc.",
  "level": "Beginner | Intermediate | Advanced",
  "duration": "${durationWeeks} Weeks",
  "shortDescription": "2-3 sentence overview",
  "fullDescription": "Full detailed course syllabus description",
  "learningOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3", "Outcome 4"],
  "modules": [
    {
      "id": "mod-1",
      "title": "Module Title",
      "duration": "Week 1-2",
      "description": "Module summary",
      "lessons": [
        {
          "id": "les-1",
          "title": "Lesson Title",
          "content": "Detailed overview of the lesson topics and exercises",
          "type": "video"
        }
      ]
    }
  ],
  "assessments": [
    {
      "id": "ass-1",
      "title": "Practical Assessment 1",
      "type": "project",
      "weightPercentage": 50,
      "criteria": ["Rubric point 1", "Rubric point 2"]
    }
  ]
}
`;

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  const generatedCourse = JSON.parse(response.text);

  if (autoSave) {
    await saveCourse({ ...generatedCourse, visibility: 'site' });
  }

  return generatedCourse;
}
