/**
 * EduPulse AI / RTO-AI Multilingual Vector RAG Type Definitions
 */

export type SupportedLanguageCode = 
  | 'en'  // English (Default)
  | 'ja'  // Japanese
  | 'zh'  // Chinese
  | 'ko'  // Korean
  | 'vi'  // Vietnamese
  | 'th'  // Thai
  | 'km'  // Khmer
  | 'id'  // Indonesian
  | 'ms'  // Malay
  | 'tl'  // Tagalog
  | 'my'  // Burmese
  | 'other';

export interface MultilingualChunk {
  id: string;
  docId: string;
  chunkIndex: number;
  totalChunks: number;
  text: string;
  language: SupportedLanguageCode;
  languageName: string;
  category: string;
  title: string;
  source: string;
  keywords: string[];
  tenantTag: string;
  createdAt: string;
  embedding?: number[];
}

export interface IngestDocumentInput {
  id?: string;
  title: string;
  content: string;
  language?: string;
  category?: string;
  source?: string;
  keywords?: string[] | string;
  tenantTag?: string;
  metadata?: Record<string, any>;
}

export interface IngestResult {
  docId: string;
  title: string;
  language: string;
  category: string;
  chunksCreated: number;
  success: boolean;
  message: string;
}

export interface RagSearchResult {
  chunk: MultilingualChunk;
  score: number;
  distance: number;
}

export interface RagQueryOptions {
  topK?: number;
  minScore?: number;
  categoryFilter?: string;
  targetLanguage?: string;
  apiKey?: string;
}

export interface AutoSortResult {
  title: string;
  category: string;
  language: SupportedLanguageCode;
  languageName: string;
  summary: string;
  keywords: string[];
  source?: string;
}

export interface RagQueryResponse {
  query: string;
  queryLanguage: string;
  queryLanguageCode: SupportedLanguageCode;
  answer: string;
  translations?: Record<string, string>;
  sources: {
    title: string;
    category: string;
    source: string;
    language: string;
    excerpt: string;
    relevanceScore: number;
  }[];
  totalRetrieved: number;
  confidence: number;
  executionTimeMs: number;
}

