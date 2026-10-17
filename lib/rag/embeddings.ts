/**
 * Google-native Multilingual Embedding & AI Orchestration Service
 * Uses Google gemini-embedding-001 / gemini-embedding-2 (768 dimensions via Matryoshka outputDimensionality)
 * and Google gemini-3.8-flash via official @google/genai SDK.
 * Supports cross-lingual semantic matching across 100+ languages (EN, JA, ZH, KO, VI, TH, KM, ID, MS, TL).
 */

import { GoogleGenAI } from '@google/genai';

export const PRIMARY_EMBEDDING_MODEL = 'gemini-embedding-001';
export const SECONDARY_EMBEDDING_MODEL = 'gemini-embedding-2';
export const GENERATION_MODEL = 'gemini-3.8-flash';
export const EMBEDDING_DIMENSION = 768;

/**
 * Calculates cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalizes a vector to unit length (L2 norm).
 */
export function normalizeVector(vector: number[]): number[] {
  let norm = 0;
  for (let i = 0; i < vector.length; i++) {
    norm += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(norm);
  if (magnitude === 0) return vector;
  return vector.map(v => v / magnitude);
}

/**
 * Fallback deterministic multilingual semantic vector generator (768 dimensions).
 * Uses character & byte n-gram feature hashing with unicode script projection.
 * Ensures the system never crashes if external network/quota limits are reached.
 */
export function generateDeterministicEmbedding(text: string, dimension: number = EMBEDDING_DIMENSION): number[] {
  const vec = new Array(dimension).fill(0);
  const normalized = text.toLowerCase().normalize('NFKC');

  // Multi-scale n-grams (1, 2, 3, 4) for cross-lingual script sensitivity
  for (let n = 1; n <= 4; n++) {
    for (let i = 0; i <= normalized.length - n; i++) {
      const gram = normalized.substring(i, i + n);
      let hash = 2166136261;
      for (let j = 0; j < gram.length; j++) {
        hash ^= gram.charCodeAt(j);
        hash = Math.imul(hash, 16777619);
      }
      const index = Math.abs(hash) % dimension;
      const sign = (hash & 1) === 0 ? 1 : -1;
      vec[index] += sign * (1 / Math.sqrt(n));
    }
  }

  // Cross-lingual semantic priors for higher education and vocational domains
  const semanticConcepts: Record<string, number> = {
    course: 11, degree: 23, rto: 37, certificate: 49, diploma: 61,
    student: 73, tuition: 89, admission: 101, enrollment: 113, teqsa: 127,
    asqa: 139, unit: 151, curriculum: 163, audit: 179, faculty: 191,
    assessment: 211, qualification: 223, competency: 239, recognition: 251,
    // Japanese
    コース: 11, 学位: 23, 証明書: 49, 学生: 73, 学費: 89, 入学: 101, 単位: 151,
    // Chinese
    课程: 11, 证书: 49, 学费: 89, 录取: 101, 学分: 151,
    // Vietnamese
    khóa: 11, bằng: 23, chứng: 49, sinh: 73, học: 89, tuyển: 101, tín: 151,
    // Thai
    หลักสูตร: 11, ปริญญา: 23, ประกาศนียบัตร: 49, นักเรียน: 73, ค่าเล่าเรียน: 89, หน่วยกิต: 151,
    // Khmer
    វគ្គសិក្សា: 11, សញ្ញាបត្រ: 23, និស្សិត: 73, ការចុះឈ្មោះ: 113
  };

  for (const [term, idx] of Object.entries(semanticConcepts)) {
    if (normalized.includes(term.toLowerCase())) {
      vec[idx % dimension] += 3.0;
      vec[(idx * 7) % dimension] += 2.0;
    }
  }

  return normalizeVector(vec);
}

/**
 * Generates a multilingual embedding using Google's native Gemini embedding models.
 * Requests exact 768 dimensions matching our deployed Firestore vector index.
 */
export async function getEmbedding(text: string, customApiKey?: string): Promise<{
  vector: number[];
  model: string;
  isFallback: boolean;
}> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.length > 10) {
    // Try primary: gemini-embedding-001 (with outputDimensionality: 768)
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.embedContent({
        model: PRIMARY_EMBEDDING_MODEL,
        contents: text,
        config: { outputDimensionality: EMBEDDING_DIMENSION }
      });

      const values = response.embeddings?.[0]?.values || (response as any).embedding?.values;
      if (values && values.length === EMBEDDING_DIMENSION) {
        return {
          vector: normalizeVector(values),
          model: PRIMARY_EMBEDDING_MODEL,
          isFallback: false,
        };
      }
    } catch (primaryErr: any) {
      // Try secondary: gemini-embedding-2
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.embedContent({
          model: SECONDARY_EMBEDDING_MODEL,
          contents: text,
          config: { outputDimensionality: EMBEDDING_DIMENSION }
        });

        const values = response.embeddings?.[0]?.values || (response as any).embedding?.values;
        if (values && values.length === EMBEDDING_DIMENSION) {
          return {
            vector: normalizeVector(values),
            model: SECONDARY_EMBEDDING_MODEL,
            isFallback: false,
          };
        }
      } catch (secErr: any) {
        console.warn(`[getEmbedding] Google Gemini embedding APIs unavailable (${primaryErr?.message || secErr?.message}). Using resilient vector fallback.`);
      }
    }
  }

  // Graceful fallback to deterministic 768-dim normalized embedding
  return {
    vector: generateDeterministicEmbedding(text, EMBEDDING_DIMENSION),
    model: 'google-multilingual-deterministic-768',
    isFallback: true,
  };
}

/**
 * Batch generate embeddings with concurrency control.
 */
export async function getBatchEmbeddings(
  texts: string[],
  customApiKey?: string
): Promise<{ vector: number[]; model: string; isFallback: boolean }[]> {
  const results: { vector: number[]; model: string; isFallback: boolean }[] = [];
  const batchSize = 5;

  for (let i = 0; i < texts.length; i += batchSize) {
    const chunk = texts.slice(i, i + batchSize);
    const chunkPromises = chunk.map(text => getEmbedding(text, customApiKey));
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  return results;
}
