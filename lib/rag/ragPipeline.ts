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
      const isMultiLangRequested = Boolean(options.allTranslations);

      const systemPrompt = isMultiLangRequested
        ? `You are EduPulse AI, an authoritative, multilingual Higher Education and Vocational Training (RTO) intelligence assistant.
You specialize in TEQSA, ASQA, CRICOS accreditation, curricula, university degrees, and student admissions.

CRITICAL INSTRUCTIONS:
1. Cross-Lingual Synthesis: Understand the retrieved reference documents regardless of their source language.
2. Primary Output Language: Synthesize a full, authoritative answer in "${queryLangName}" (${queryLangCode}).
3. Multi-Language Translations: Provide complete translations in "en", "ja", "zh", "vi", "th", "id".
4. Grounding: Answer strictly using facts and guidelines from the provided Sources.
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
}`
        : `You are EduPulse AI, an authoritative Higher Education and Vocational Training (RTO) intelligence assistant.
You specialize in TEQSA, ASQA, CRICOS accreditation, curricula, university degrees, and student admissions.

CRITICAL INSTRUCTIONS:
1. Grounding: Answer strictly using facts and guidelines from the provided Sources. If the information is not fully covered, advise contacting admissions.
2. Output Language: Synthesize a direct, clear markdown answer in "${queryLangName}" (${queryLangCode}).
3. Format: Return STRICT JSON matching this schema:
{
  "answer": "Full comprehensive markdown answer in ${queryLangName}",
  "englishSummary": "English translation if the question was non-English, or empty string if English"
}`;

      const userPrompt = `Retrieved Knowledge Context:
${contextText || 'No specific document chunks retrieved. Provide general accredited higher-ed guidance.'}

User Question: "${query}"

Generate the answer in ${queryLangName}:`;

      const genPromise = ai.models.generateContent({
        model: GENERATION_MODEL,
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('RAG generation timeout after 6s')), 6000)
      );

      const response = await Promise.race([genPromise, timeoutPromise]);

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
          } else {
            translations[queryLangCode] = answer;
            if (parsed.englishSummary && queryLangCode !== 'en') {
              translations.en = parsed.englishSummary;
            }
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

import { SEED_KNOWLEDGE_DOCUMENTS } from './seedData';
export { SEED_KNOWLEDGE_DOCUMENTS };

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
