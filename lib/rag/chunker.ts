/**
 * Language-Aware Document Chunker & Metadata Extractor
 * Supports Latin, CJK (Chinese, Japanese, Korean), and ASEAN scripts (Thai, Khmer, Vietnamese, etc.)
 * Default language: English ('en')
 */

import { MultilingualChunk, SupportedLanguageCode } from './types';

export interface LanguageDetectionResult {
  code: SupportedLanguageCode;
  name: string;
  confidence: number;
}

/**
 * Detect language from text using script analysis and character distribution.
 * Default is ALWAYS English ('en') unless other script patterns predominate.
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return { code: 'en', name: 'English', confidence: 1.0 };
  }

  const clean = text.trim();
  const totalChars = clean.length;

  // Script count regex
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/g; // Hiragana & Katakana
  const chineseRegex = /[\u4E00-\u9FFF]/g; // CJK Unified Ideographs
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF]/g; // Hangul
  const thaiRegex = /[\u0E00-\u0E7F]/g; // Thai
  const khmerRegex = /[\u1780-\u17FF\u19E0-\u19FF]/g; // Khmer
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi;

  const jpMatches = clean.match(japaneseRegex)?.length || 0;
  const zhMatches = clean.match(chineseRegex)?.length || 0;
  const koMatches = clean.match(koreanRegex)?.length || 0;
  const thMatches = clean.match(thaiRegex)?.length || 0;
  const kmMatches = clean.match(khmerRegex)?.length || 0;
  const viMatches = clean.match(vietnameseRegex)?.length || 0;

  // Japanese check: contains Hiragana or Katakana
  if (jpMatches >= 2 || (jpMatches > 0 && jpMatches / totalChars > 0.03)) {
    return { code: 'ja', name: 'Japanese (日本語)', confidence: 0.95 };
  }

  // Korean check: contains Hangul
  if (koMatches >= 2 || koMatches / totalChars > 0.05) {
    return { code: 'ko', name: 'Korean (한국어)', confidence: 0.95 };
  }

  // Khmer check
  if (kmMatches >= 2 || kmMatches / totalChars > 0.05) {
    return { code: 'km', name: 'Khmer (ភាសាខ្មែរ)', confidence: 0.95 };
  }

  // Thai check
  if (thMatches >= 3 || thMatches / totalChars > 0.05) {
    return { code: 'th', name: 'Thai (ไทย)', confidence: 0.95 };
  }

  // Chinese check (has CJK ideographs without kana)
  if (zhMatches >= 3 && zhMatches / totalChars > 0.1) {
    return { code: 'zh', name: 'Chinese (中文)', confidence: 0.92 };
  }

  // Vietnamese check (distinct diacritics)
  if (viMatches >= 3 && viMatches / totalChars > 0.03) {
    return { code: 'vi', name: 'Vietnamese (Tiếng Việt)', confidence: 0.9 };
  }

  // Indonesian / Malay keyword check
  const idMsKeywords = /\b(dan|yang|untuk|dengan|adalah|ini|itu|di|pada|ke|dari|kursus|ijazah|universitas|pembelajaran)\b/gi;
  const idMatches = clean.match(idMsKeywords)?.length || 0;
  if (idMatches >= 4) {
    return { code: 'id', name: 'Indonesian (Bahasa Indonesia)', confidence: 0.85 };
  }

  // Tagalog keyword check
  const tlKeywords = /\b(ang|ng|mga|sa|ay|na|para|at|kung|ito|sila|bachelor|kurso)\b/gi;
  const tlMatches = clean.match(tlKeywords)?.length || 0;
  if (tlMatches >= 4) {
    return { code: 'tl', name: 'Tagalog (Filipino)', confidence: 0.85 };
  }

  // Default is always English
  return { code: 'en', name: 'English', confidence: 0.99 };
}

/**
 * Extracts salient keywords for filtering and fast indexing.
 */
export function extractKeywords(text: string, count = 8): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s\u00C0-\u024F\u1E00-\u1EFF\u3040-\u30FF\u4E00-\u9FFF\u0E00-\u0E7F\u1780-\u17FF]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  const stopWords = new Set([
    'about', 'above', 'after', 'again', 'against', 'all', 'and', 'any', 'are', 'because',
    'been', 'before', 'being', 'below', 'between', 'both', 'but', 'can', 'cannot', 'could',
    'did', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
    'has', 'have', 'having', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
    'into', 'more', 'most', 'must', 'myself', 'nor', 'not', 'off', 'once', 'only', 'other',
    'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'should', 'so', 'some', 'such',
    'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
    'they', 'this', 'those', 'through', 'too', 'under', 'until', 'very', 'was', 'were', 'what',
    'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you'
  ]);

  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!stopWords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([w]) => w);
}

/**
 * Splits text into language-aware sentence blocks.
 */
function splitSentences(text: string, lang: SupportedLanguageCode): string[] {
  if (lang === 'zh' || lang === 'ja') {
    // Split on Asian punctuation: 。！？\n\n
    return text
      .split(/([。！？\n\n]+)/)
      .reduce<string[]>((acc, cur, idx, arr) => {
        if (idx % 2 === 0 && cur) {
          const punct = arr[idx + 1] || '';
          acc.push((cur + punct).trim());
        }
        return acc;
      }, [])
      .filter(s => s.length > 0);
  }

  if (lang === 'km') {
    // Khmer punctuation: ។ ៕
    return text
      .split(/([។៕\n\n]+)/)
      .reduce<string[]>((acc, cur, idx, arr) => {
        if (idx % 2 === 0 && cur) {
          const punct = arr[idx + 1] || '';
          acc.push((cur + punct).trim());
        }
        return acc;
      }, [])
      .filter(s => s.length > 0);
  }

  // Latin / Western sentence splitting (. ! ? \n\n)
  return text
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Chunks a document with language-aware boundary sizing and overlap.
 * - CJK scripts use character-density targets (~350 chars per chunk, ~60 char overlap)
 * - Latin / Western scripts use word-density targets (~120-180 words, ~30 words overlap)
 */
export function chunkDocument(
  docId: string,
  title: string,
  content: string,
  options: {
    language?: string;
    category?: string;
    source?: string;
    tenantTag?: string;
    maxChunkSize?: number;
    chunkOverlap?: number;
  } = {}
): MultilingualChunk[] {
  const detected = detectLanguage(content);
  const langCode: SupportedLanguageCode = (options.language as SupportedLanguageCode) || detected.code;
  const langName = detected.name;
  const category = options.category || 'General Academic';
  const source = options.source || 'Institutional Knowledge Base';
  const tenantTag = options.tenantTag || 'rto-ai';
  const createdAt = new Date().toISOString();

  const isCJK = langCode === 'zh' || langCode === 'ja' || langCode === 'ko';
  const targetChunkSize = options.maxChunkSize || (isCJK ? 380 : 650);
  const targetOverlap = options.chunkOverlap || (isCJK ? 60 : 100);

  const sentences = splitSentences(content, langCode);
  const textChunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (!currentChunk) {
      currentChunk = sentence;
      continue;
    }

    if (currentChunk.length + sentence.length + 1 <= targetChunkSize) {
      currentChunk += (isCJK ? '' : ' ') + sentence;
    } else {
      textChunks.push(currentChunk.trim());
      // Create overlap from end of current chunk
      const overlapStart = Math.max(0, currentChunk.length - targetOverlap);
      const overlapText = currentChunk.substring(overlapStart).trim();
      currentChunk = overlapText + (isCJK ? '' : ' ') + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    textChunks.push(currentChunk.trim());
  }

  // If text has no sentence markers, split by char slice
  if (textChunks.length === 0 && content.trim().length > 0) {
    for (let i = 0; i < content.length; i += targetChunkSize - targetOverlap) {
      textChunks.push(content.substring(i, i + targetChunkSize).trim());
    }
  }

  const totalChunks = textChunks.length;
  const keywords = extractKeywords(content);

  return textChunks.map((chunkText, idx) => ({
    id: `${docId}_chunk_${idx}`,
    docId,
    chunkIndex: idx,
    totalChunks,
    text: chunkText,
    language: langCode,
    languageName: langName,
    category,
    title,
    source,
    keywords,
    tenantTag,
    createdAt,
  }));
}
