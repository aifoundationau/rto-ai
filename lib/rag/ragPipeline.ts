/**
 * Multilingual RAG Orchestration Pipeline
 * Powered by Google Gemini (gemini-3.8-flash & gemini-embedding-001) + Cloud Firestore Vector Search
 * Cross-lingual: Queries in Japanese, Chinese, Vietnamese, Thai, etc. retrieve documents in English or other languages
 * Response language matches the user's query language (default is always English).
 */

import { GoogleGenAI } from '@google/genai';
import { detectLanguage, chunkDocument, extractKeywords } from './chunker';
import { getEmbedding, getBatchEmbeddings, GENERATION_MODEL } from './embeddings';
import { storeChunks, searchNearestVectors, getVectorStoreStats } from './vectorStore';
import { IngestDocumentInput, IngestResult, RagQueryOptions, RagQueryResponse, SupportedLanguageCode, AutoSortResult } from './types';


/**
 * Ingests a single document into the multilingual vector index.
 */
export async function ingestDocument(
  input: IngestDocumentInput,
  customApiKey?: string
): Promise<IngestResult> {
  const docId = input.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const content = input.content;

  if (!content || content.trim().length === 0) {
    return {
      docId,
      title: input.title || 'Empty Document',
      language: 'en',
      category: input.category || 'General',
      chunksCreated: 0,
      success: false,
      message: 'Document content cannot be empty',
    };
  }

  // If title is missing or requested to auto-sort, let AI sort it out
  let title = input.title?.trim();
  let category = input.category;
  let language = input.language;

  if (!title || title.toLowerCase() === 'auto' || title.toLowerCase() === 'auto-detect') {
    const autoSorted = await autoSortDocument(content, customApiKey);
    title = autoSorted.title;
    if (!category || category === 'General') category = autoSorted.category;
    if (!language || language === 'auto') language = autoSorted.language;
  }

  // 1. Language-Aware Chunking
  const chunks = chunkDocument(docId, title, content, {
    language,
    category,
    source: input.source,
    tenantTag: input.tenantTag || 'rto-ai',
  });


  if (chunks.length === 0) {
    return {
      docId,
      title,
      language: 'en',
      category: input.category || 'General',
      chunksCreated: 0,
      success: false,
      message: 'No chunks could be extracted from content',
    };
  }

  // 2. Generate Google Multilingual Embeddings (768-dim)
  const texts = chunks.map(c => `Title: ${c.title}\nCategory: ${c.category}\nContent: ${c.text}`);
  const embeddingResults = await getBatchEmbeddings(texts, customApiKey);

  for (let i = 0; i < chunks.length; i++) {
    chunks[i].embedding = embeddingResults[i].vector;
  }

  // 3. Store in Cloud Firestore Vector Collection
  const { insertedCount, errors } = await storeChunks(chunks);

  const detected = detectLanguage(content);

  return {
    docId,
    title,
    language: detected.code,
    category: input.category || 'General',
    chunksCreated: insertedCount,
    success: insertedCount > 0,
    message: errors.length > 0 
      ? `Inserted ${insertedCount} chunks with warnings: ${errors.join('; ')}`
      : `Successfully indexed ${insertedCount} multilingual chunks.`,
  };
}

/**
 * Executes a Cross-Lingual RAG Query.
 * Automatically aligns query language with retrieved multi-language context.
 */
export async function queryMultilingualRag(
  query: string,
  options: RagQueryOptions = {}
): Promise<RagQueryResponse> {
  const startTime = Date.now();
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  const topK = options.topK || 4;
  const minScore = options.minScore || 0.2;

  // 1. Detect Query Language (Default is ALWAYS English)
  const detected = detectLanguage(query);
  const queryLangCode = (options.targetLanguage as SupportedLanguageCode) || detected.code;
  const queryLangName = detected.name;

  // 2. Generate Google Multilingual Embedding for the Query (768 dimensions)
  const queryEmbedding = await getEmbedding(query, apiKey);

  // 3. Vector Search across Cloud Firestore
  const retrievedResults = await searchNearestVectors(queryEmbedding.vector, {
    topK,
    minScore,
    category: options.categoryFilter,
    tenantTag: 'rto-ai',
  });

  // Prepare source citations
  const sources = retrievedResults.map(r => ({
    title: r.chunk.title,
    category: r.chunk.category,
    source: r.chunk.source,
    language: r.chunk.languageName,
    excerpt: r.chunk.text.length > 250 ? r.chunk.text.substring(0, 247) + '...' : r.chunk.text,
    relevanceScore: Math.round(r.score * 100) / 100,
  }));

  // Build context payload for Google Gemini
  const contextText = retrievedResults.map((r, idx) => `
[SOURCE ${idx + 1}]: "${r.chunk.title}" (${r.chunk.category} | Original Language: ${r.chunk.languageName})
${r.chunk.text}
`).join('\n---\n');

  // 4. Synthesize Answer using Google Gemini (gemini-3.8-flash)
  let answer = '';
  let confidence = 0.85;
  let translations: Record<string, string> = {
    [queryLangCode]: '',
    en: '',
    ja: '',
    zh: '',
    vi: '',
    th: '',
    id: '',
  };

  if (apiKey && apiKey.length > 10) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `You are EduPulse AI, an authoritative, multilingual Higher Education and Vocational Training (RTO) intelligence assistant.
You specialize in TEQSA, ASQA, CRICOS accreditation, curricula, university degrees, and student admissions.

CRITICAL INSTRUCTIONS:
1. Cross-Lingual Synthesis: You have retrieved reference documents that may be written in English or other languages. Understand the context regardless of the language it was written in.
2. Primary Output Language: The user's query is in "${queryLangName}" (${queryLangCode}). Synthesize a full, authoritative answer in ${queryLangName}.
3. Multi-Language Translations: In addition to the primary answer, provide complete, fluent translations in:
   - "en": English
   - "ja": Japanese
   - "zh": Simplified Chinese
   - "vi": Vietnamese
   - "th": Thai
   - "id": Indonesian
4. Grounding: Answer strictly using facts and guidelines from the provided Sources. If the information is not fully covered, state clearly what is verified and advise contacting the admissions/compliance office.
5. Format: Return STRICT JSON matching this schema:
{
  "answer": "Full comprehensive markdown answer in ${queryLangName}",
  "translations": {
    "en": "Full English translation markdown",
    "ja": "Full Japanese translation markdown",
    "zh": "Full Simplified Chinese translation markdown",
    "vi": "Full Vietnamese translation markdown",
    "th": "Full Thai translation markdown",
    "id": "Full Indonesian translation markdown"
  }
}`;

      const userPrompt = `Retrieved Knowledge Context:
${contextText || 'No specific document chunks retrieved. Provide general accredited higher-ed guidance.'}

User Question: "${query}"

Generate the comprehensive answer in ${queryLangName} and all translations:`;

      const response = await ai.models.generateContent({
        model: GENERATION_MODEL,
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      });

      if (response.text) {
        try {
          const parsed = JSON.parse(response.text.trim());
          if (parsed.answer) {
            answer = parsed.answer;
          }
          if (parsed.translations && typeof parsed.translations === 'object') {
            translations = {
              ...translations,
              ...parsed.translations,
              [queryLangCode]: answer || parsed.translations[queryLangCode] || '',
            };
          }
        } catch {
          answer = response.text;
          translations[queryLangCode] = answer;
        }
      } else {
        answer = 'Unable to generate synthesis.';
      }

      confidence = retrievedResults.length > 0 ? Math.min(0.98, retrievedResults[0].score + 0.15) : 0.6;
    } catch (genErr: any) {
      console.warn(`[queryMultilingualRag] Gemini generation error (${genErr.message}). Using fallback synthesis.`);
      answer = buildFallbackAnswer(query, queryLangCode, sources);
      translations[queryLangCode] = answer;
      translations.en = buildFallbackAnswer(query, 'en', sources);
    }
  } else {
    answer = buildFallbackAnswer(query, queryLangCode, sources);
    translations[queryLangCode] = answer;
    translations.en = buildFallbackAnswer(query, 'en', sources);
  }

  // Ensure primary translation slot is never empty
  if (!translations[queryLangCode]) {
    translations[queryLangCode] = answer;
  }
  if (!translations.en && queryLangCode !== 'en') {
    translations.en = answer;
  }

  const executionTimeMs = Date.now() - startTime;

  return {
    query,
    queryLanguage: queryLangName,
    queryLanguageCode: queryLangCode,
    answer,
    translations,
    sources,
    totalRetrieved: retrievedResults.length,
    confidence,
    executionTimeMs,
  };
}

/**
 * Automatically sorts out a whole pasted document in any language:
 * Extracts Title, Category, Language, Executive Summary, and Keywords.
 */
export async function autoSortDocument(
  content: string,
  customApiKey?: string
): Promise<AutoSortResult> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  const detected = detectLanguage(content);

  if (apiKey && apiKey.length > 10) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert AI Academic Registrar and Admissions Governance specialist for Australian Higher Education & Vocational Training.
Analyze the following document which was pasted in full by an administrator. It may be in any language (English, Japanese, Chinese, Vietnamese, Thai, Indonesian, Spanish, French, etc.):

DOCUMENT CONTENT:
"""
${content.slice(0, 8000)}
"""

YOUR TASK:
1. Determine an official, accredited Document Title. If the document is non-English, provide the title in its native script plus an English title if helpful.
2. Select the single best matching Category from these EXACT options:
   - "Accreditation Standards"
   - "Degree Programs"
   - "Vocational Compliance"
   - "Admissions & Visas"
   - "Course Architecture"
   - "Policies & Integrity"
3. Identify the primary language code (e.g. "en", "ja", "zh", "vi", "th", "id", "km", "ko", "other") and full language name.
4. Provide a clear, executive 2-3 sentence summary of the document's core content and regulatory/curriculum scope.
5. Provide 6-10 salient keywords/tags.

Return ONLY valid JSON matching this schema:
{
  "title": "Document Title",
  "category": "Category from list",
  "language": "two-letter code",
  "languageName": "Full Language Name",
  "summary": "2-3 sentence executive summary",
  "keywords": ["tag1", "tag2", "tag3"]
}`;

      const res = await ai.models.generateContent({
        model: GENERATION_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      });

      if (res.text) {
        const parsed = JSON.parse(res.text.trim());
        return {
          title: parsed.title || 'Untitled Academic Document',
          category: parsed.category || 'Accreditation Standards',
          language: (parsed.language || detected.code) as SupportedLanguageCode,
          languageName: parsed.languageName || detected.name,
          summary: parsed.summary || content.slice(0, 200) + '...',
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : extractKeywords(content),
        };
      }
    } catch (e: any) {
      console.warn('[autoSortDocument] Gemini auto-sort error, using heuristic fallback:', e);
    }
  }

  // Heuristic fallback if Gemini is offline
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  let title = lines[0] || 'Ingested Academic Policy Document';
  if (title.length > 90) title = title.slice(0, 87) + '...';

  // Keyword-based category classification
  const lower = content.toLowerCase();
  let category = 'Accreditation Standards';
  if (lower.includes('bachelor') || lower.includes('master') || lower.includes('curriculum') || lower.includes('syllabus')) {
    category = 'Degree Programs';
  } else if (lower.includes('rto') || lower.includes('asqa') || lower.includes('vocational') || lower.includes('vet')) {
    category = 'Vocational Compliance';
  } else if (lower.includes('ielts') || lower.includes('toefl') || lower.includes('admission') || lower.includes('visa') || lower.includes('entry requirements')) {
    category = 'Admissions & Visas';
  } else if (lower.includes('course architecture') || lower.includes('credit point') || lower.includes('prerequisite')) {
    category = 'Course Architecture';
  } else if (lower.includes('integrity') || lower.includes('plagiarism') || lower.includes('misconduct') || lower.includes('policy')) {
    category = 'Policies & Integrity';
  }

  return {
    title,
    category,
    language: detected.code,
    languageName: detected.name,
    summary: content.slice(0, 250).replace(/\s+/g, ' ') + '...',
    keywords: extractKeywords(content),
  };
}

/**
 * Translates arbitrary text into a target language using Gemini.
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  customApiKey?: string
): Promise<string> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) return text;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an expert academic and educational translator.
Translate the following academic / accreditation text into ${targetLanguage}.
Keep higher education and vocational acronyms intact (TEQSA, AQF, ASQA, RPL, CRICOS, IELTS, GPA).
Format the response using clean Markdown.

Text to translate:
"""
${text}
"""

Translated text:`;

    const res = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.2 }
    });

    return res.text || text;
  } catch (err: any) {
    console.warn('[translateText] Gemini error:', err);
    return text;
  }
}


/**
 * Resilient fallback answer synthesizer if external LLM generation is unavailable.
 */
function buildFallbackAnswer(
  query: string,
  lang: SupportedLanguageCode,
  sources: { title: string; excerpt: string; language: string; relevanceScore: number }[]
): string {
  if (sources.length === 0) {
    if (lang === 'ja') return '該当する教育基準またはコース情報が見つかりませんでした。詳細についてはアドミッションオフィスにお問い合わせください。';
    if (lang === 'zh') return '未检索到相关的教育标准或课程详情。请联系认证管理部门或招生办公室获取更多信息。';
    if (lang === 'vi') return 'Không tìm thấy tài liệu phù hợp cho câu hỏi của bạn. Vui lòng liên hệ ban tuyển sinh để biết thêm chi tiết.';
    if (lang === 'th') return 'ไม่พบข้อมูลหลักสูตรหรือเกณฑ์ที่เกี่ยวข้อง โปรดติดต่อฝ่ายรับสมัครเพื่อขอข้อมูลเพิ่มเติม';
    return 'No relevant institutional documents were found for this query. Please consult the admissions or academic registrar office.';
  }

  const top = sources[0];
  if (lang === 'ja') {
    return `### 検索された教育情報 (${top.title})
関連スコア: ${top.relevanceScore}

${top.excerpt}

**引用元**: ${sources.map(s => s.title).join(', ')}`;
  }

  if (lang === 'zh') {
    return `### 检索到的教育规范与课程信息 (${top.title})
相关度评分: ${top.relevanceScore}

${top.excerpt}

**参考资料**: ${sources.map(s => s.title).join(', ')}`;
  }

  return `### Retrieved Academic & Regulatory Context (${top.title})
Relevance Score: ${top.relevanceScore}

${top.excerpt}

**Sources Cited**: ${sources.map(s => `${s.title} (${s.language})`).join('; ')}`;
}

/**
 * Curated initial multilingual knowledge base covering:
 * - TEQSA Higher Education Standards (Australia)
 * - ASQA RTO Standards
 * - Bachelor of Artificial Intelligence curriculum & prerequisites
 * - Multilingual admission guides (English, Japanese, Chinese, Vietnamese, Thai)
 */
export const SEED_KNOWLEDGE_DOCUMENTS: IngestDocumentInput[] = [
  {
    id: 'kb_teqsa_framework_en',
    title: 'TEQSA Higher Education Standards Framework (Threshold Standards)',
    category: 'Accreditation Standards',
    language: 'en',
    source: 'Tertiary Education Quality and Standards Agency (TEQSA) Act 2011',
    keywords: ['TEQSA', 'threshold standards', 'higher education', 'accreditation', 'AQF', 'governance'],
    content: `The Higher Education Standards Framework (Threshold Standards) 2021 establishes the statutory standards for Australian higher education providers registered with TEQSA.
Key Domains include:
1. Student Participation and Attainment: Transparent admissions, recognition of prior learning (RPL), learning outcomes mapped to the Australian Qualifications Framework (AQF), and fair grievance handling.
2. Learning Environment: Facilities, student support services, wellbeing, and academic integrity policies preventing contract cheating.
3. Teaching: Appropriately qualified academic faculty (at least one AQF level higher than course taught or equivalent professional standing).
4. Research and Research Training (where applicable).
5. Institutional Quality Assurance: Rigorous moderation of assessment, external benchmarking, and academic governance oversight.
6. Governance and Accountability: Independent governing body ensuring financial sustainability, statutory compliance, and educational integrity.`,
  },
  {
    id: 'kb_bachelor_ai_curriculum_en',
    title: 'Bachelor of Artificial Intelligence Degree Architecture & Curriculum',
    category: 'Degree Programs',
    language: 'en',
    source: 'Faculty of Computing & Information Technology Academic Board',
    keywords: ['Bachelor of AI', 'curriculum', 'machine learning', 'deep learning', 'ethics', 'prerequisites', 'units'],
    content: `The Bachelor of Artificial Intelligence (BAI) is an AQF Level 7 undergraduate qualification comprising 24 units of study (144 credit points over 3 years full-time).
Core Areas:
- Year 1: Foundations of Programming (Python), Discrete Mathematics, Linear Algebra & Calculus, Introduction to AI & Data Ethics.
- Year 2: Data Structures & Algorithms, Machine Learning Architectures, Neural Networks & Deep Learning, Database Management & Cloud Vector Systems.
- Year 3: Natural Language Processing & Large Language Models, Computer Vision, Autonomous Systems, and a two-semester Industry Capstone Project.
Admission Requirements: Completion of Australian Year 12 with ATAR 75.0 or international equivalent (e.g., IB Diploma 26, GCE A-Levels minimum CCB). English proficiency: Academic IELTS 6.5 with no band under 6.0 (or TOEFL iBT 79, PTE Academic 58).`,
  },
  {
    id: 'kb_asqa_rto_standards_en',
    title: 'ASQA Standards for Registered Training Organisations (RTOs)',
    category: 'Vocational Compliance',
    language: 'en',
    source: 'Australian Skills Quality Authority (ASQA)',
    keywords: ['ASQA', 'RTO', 'VET', 'competency-based training', 'validation', 'trainer competencies'],
    content: `Standards for RTOs govern vocational education and training in Australia.
Core requirements:
- Standard 1: Responsive training and assessment services. Training packages must be delivered by credentialed trainers holding Certificate IV in Training and Assessment (TAE40116 or TAE40122).
- Assessment Validation: Assessment judgments must be systematically validated across all competency units on a 5-year rolling cycle.
- Standard 2: Quality assurance of operations through systematic stakeholder feedback and continuous improvement registers.
- Standard 5 & 6: Transparent learner agreements, clear refund policies, and accessible complaints and appeals mechanisms.`,
  },
  {
    id: 'kb_international_admissions_ja',
    title: 'オーストラリア高等教育機関 留学生入学要件および認定制度（日本語案内）',
    category: 'Admissions & Visas',
    language: 'ja',
    source: '国際学生アドミッションセンター (International Admissions Desk)',
    keywords: ['留学生', '入学条件', '英語要件', 'IELTS', 'ビザ', 'TEQSA', '学士号'],
    content: `オーストラリアの大学・高等教育機関（TEQSA認定校）への入学には、学歴要件と英語力証明が必須です。
1. 学歴要件：
   日本の高等学校卒業証明書および成績証明書（評定平均3.5以上推奨）、または大学1年次修了、もしくはファウンデーションコースの修了。
2. 英語力証明（出願前2年以内に受験）：
   - IELTS Academic: 総合スコア6.5以上（各バンド6.0以上）
   - TOEFL iBT: 総合79点以上（ライティング21点以上）
   - PTE Academic: 総合58点以上（各スキル50点以上）
3. ビザ（Subclass 500）および留学生保険（OSHC）：
   CRICOS登録コースへの入学許可書（CoE: Confirmation of Enrolment）の発行を受けた後、オーストラリア内務省（Department of Home Affairs）へ学生ビザを申請します。滞在期間全体をカバーする海外留学生健康保険（OSHC）の加入が義務付けられています。`,
  },
  {
    id: 'kb_curriculum_standards_zh',
    title: '澳大利亚高等教育学位架构与学分转换指南（中文版）',
    category: 'Course Architecture',
    language: 'zh',
    source: '学术委员会学分互认与国际合作处',
    keywords: ['学分转换', 'RPL', '前置学习认定', 'AQF', '学士学位', '人工智能', '中英文对照'],
    content: `澳大利亚学历资格框架（AQF）对高等教育学位制定了严格的层级标准：
- AQF 7级为学士学位（Bachelor Degree），标准学制为3年（144学分），注重专业理论基础与前沿实践。
- AQF 8级为荣誉学士学位（Honours）与研究生文凭（Graduate Diploma）。
- AQF 9级为硕士学位（Master Degree）。
先前学习认定（RPL）与学分减免：
申请者若在受认可的中国高校修读同等计算机、数学或工程类课程，可申请最多8门课程（48学分，相当于1年学制）的学分减免。需提交经公证的中英文成绩单、课程大纲（详细包含授课内容、每周学时和考核方式）供系主任委员会审核。`,
  },
  {
    id: 'kb_vietnamese_ai_pathway_vi',
    title: 'Lộ trình Đào tạo Cử nhân Trí tuệ Nhân tạo và Yêu cầu Nhập học (Tiếng Việt)',
    category: 'Degree Programs',
    language: 'vi',
    source: 'Văn phòng Hợp tác Quốc tế & Tuyển sinh Đông Nam Á',
    keywords: ['Cử nhân AI', 'du học Úc', 'điều kiện nhập học', 'IELTS', 'học phí', 'TEQSA'],
    content: `Chương trình Cử nhân Trí tuệ Nhân tạo (Bachelor of Artificial Intelligence) được thiết kế theo chuẩn chất lượng cao nhất của Cơ quan Quản lý Chất lượng và Tiêu chuẩn Giáo dục Đại học Úc (TEQSA).
Điều kiện đầu vào:
- Học lực: Tốt nghiệp Trung học Phổ thông tại Việt Nam với điểm trung bình năm lớp 12 từ 8.0/10 trở lên, hoặc hoàn thành chương trình Dự bị Đại học (Foundation).
- Yêu cầu tiếng Anh: IELTS Học thuật đạt tối thiểu 6.5 (không kỹ năng nào dưới 6.0), hoặc PTE Academic từ 58 trở lên.
- Miễn giảm tín chỉ (RPL): Sinh viên chuyển tiếp từ các trường đại học tại Việt Nam có thể được xét miễn giảm tối đa 8 môn học cơ sở ngành.`,
  },
  {
    id: 'kb_thai_admissions_th',
    title: 'คู่มือการรับสมัครนักศึกษาต่างชาติและหลักสูตรปัญญาประดิษฐ์ (ภาษาไทย)',
    category: 'Admissions & Visas',
    language: 'th',
    source: 'ฝ่ายรับสมัครนักศึกษานานาชาติ มหาวิทยาลัยเครือข่ายออสเตรเลีย',
    keywords: ['สมัครเรียน', 'ออสเตรเลีย', 'ปริญญาตรี AI', 'เกณฑ์ภาษาอังกฤษ', 'IELTS', 'วีซ่านักเรียน'],
    content: `หลักสูตรวิทยาศาสตรบัณฑิต สาขาปัญญาประดิษฐ์ (Bachelor of Artificial Intelligence) ภายใต้การรับรองมาตรฐานสากล TEQSA ของประเทศออสเตรเลีย
เกณฑ์การรับเข้าศึกษา:
1. สำเร็จการศึกษาระดับมัธยมศึกษาปีที่ 6 (ม.6) ด้วยเกรดเฉลี่ยสะสม (GPA) ไม่ต่ำกว่า 3.00 หรือสำเร็จหลักสูตร Foundation Studies
2. ผลสอบวัดระดับภาษาอังกฤษ (อายุไม่เกิน 2 ปี): IELTS Academic 6.5 (ไม่มีพาร์ทใดต่ำกว่า 6.0) หรือ TOEFL iBT 79 หรือ PTE Academic 58
3. ทุนการศึกษา: มีทุนสนับสนุนความเป็นเลิศทางวิชาการ (Academic Excellence Scholarship) สูงสุด 20-30% ของค่าเล่าเรียนสำหรับผู้มีผลการเรียนดีเยี่ยม`,
  }
];

/**
 * Seeds the multilingual knowledge base with core accreditation and degree data.
 */
export async function seedMultilingualKnowledgeBase(customApiKey?: string): Promise<{
  totalProcessed: number;
  totalChunks: number;
  results: IngestResult[];
}> {
  const results: IngestResult[] = [];
  let totalChunks = 0;

  for (const doc of SEED_KNOWLEDGE_DOCUMENTS) {
    const res = await ingestDocument(doc, customApiKey);
    results.push(res);
    totalChunks += res.chunksCreated;
  }

  return {
    totalProcessed: results.length,
    totalChunks,
    results,
  };
}
