/**
 * Cloud Firestore Native Vector Store for Multilingual RAG
 * Stores 768-dimensional embeddings using FieldValue.vector(...)
 * Queries via collection.findNearest(...) with resilient in-memory cosine fallback
 */

import { db, FieldValue, isFirebaseConfigured } from '@/lib/firebase/admin';
import { MultilingualChunk, RagSearchResult, IngestedDocumentEntry } from './types';
import { cosineSimilarity, generateDeterministicEmbedding } from './embeddings';
import { SEED_KNOWLEDGE_DOCUMENTS } from './seedData';

export const KNOWLEDGE_COLLECTION = 'knowledge_embeddings';

// Resilient in-memory runtime cache of stored chunks
export const RUNTIME_STORED_CHUNKS: MultilingualChunk[] = [];

/**
 * In-memory fallback: scores seed documents with deterministic embeddings
 */
function searchSeedDocuments(
  queryVector: number[],
  options: { topK?: number; minScore?: number; category?: string; rawQuery?: string } = {}
): RagSearchResult[] {
  const topK = options.topK || 5;
  const minScore = options.minScore || 0.15;
  const scored: RagSearchResult[] = [];

  // Use rawQuery deterministic embedding if available to match the seed doc space
  const effectiveQueryVector = options.rawQuery
    ? generateDeterministicEmbedding(options.rawQuery)
    : queryVector;

  for (const doc of SEED_KNOWLEDGE_DOCUMENTS) {
    if (options.category && doc.category !== options.category) continue;
    const docVector = generateDeterministicEmbedding(doc.content);
    let score = cosineSimilarity(effectiveQueryVector, docVector);

    // Boost score if rawQuery keywords or titles match
    if (options.rawQuery) {
      const qLower = options.rawQuery.toLowerCase();
      const titleLower = doc.title.toLowerCase();
      const kwMatch = Array.isArray(doc.keywords)
        ? doc.keywords.some((k: string) => qLower.includes(k.toLowerCase()))
        : (typeof doc.keywords === 'string' ? qLower.includes((doc.keywords as string).toLowerCase()) : false);
      const titleMatch = titleLower.split(' ').some((w: string) => w.length > 3 && qLower.includes(w));
      if (kwMatch || titleMatch) {
        score = Math.max(score, 0.60) + 0.20;
      }
    }

    if (score >= minScore) {
      scored.push({
        chunk: {
          id: doc.id || 'seed-doc',
          docId: doc.id || 'seed-doc',
          chunkIndex: 0,
          totalChunks: 1,
          text: doc.content,
          language: (doc.language || 'en') as any,
          languageName: doc.language === 'ja' ? 'Japanese' : doc.language === 'zh' ? 'Chinese' : doc.language === 'vi' ? 'Vietnamese' : doc.language === 'th' ? 'Thai' : 'EN English / Global',
          category: doc.category || 'General',
          title: doc.title,
          source: doc.source || 'Institutional Archive',
          keywords: Array.isArray(doc.keywords) ? doc.keywords : [],
          tenantTag: 'rto-ai',
          createdAt: new Date().toISOString(),
        },
        score: Math.min(0.99, score),
        distance: Math.max(0.01, 1 - score),
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Stores a list of chunks with their 768-dimensional vector embeddings into Cloud Firestore.
 */
export async function storeChunks(chunks: MultilingualChunk[]): Promise<{
  insertedCount: number;
  errors: string[];
}> {
  // Always record into runtime memory cache for instant playground access
  for (const chunk of chunks) {
    RUNTIME_STORED_CHUNKS.push(chunk);
  }

  if (!isFirebaseConfigured) {
    return { insertedCount: chunks.length, errors: [] };
  }
  const collectionRef = db.collection(KNOWLEDGE_COLLECTION);
  const errors: string[] = [];
  let insertedCount = 0;

  // Batch writes in groups of 200 (Firestore limit is 500 per batch)
  const batchSize = 200;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const chunkGroup = chunks.slice(i, i + batchSize);
    const batch = db.batch();

    for (const chunk of chunkGroup) {
      if (!chunk.embedding || chunk.embedding.length === 0) {
        errors.push(`Chunk ${chunk.id} skipped: missing embedding vector`);
        continue;
      }

      const docRef = collectionRef.doc(chunk.id);
      const dataToSave: Record<string, any> = {
        id: chunk.id,
        docId: chunk.docId,
        chunkIndex: chunk.chunkIndex,
        totalChunks: chunk.totalChunks,
        text: chunk.text,
        language: chunk.language,
        languageName: chunk.languageName,
        category: chunk.category,
        title: chunk.title,
        source: chunk.source,
        keywords: chunk.keywords,
        tenantTag: chunk.tenantTag || 'rto-ai',
        createdAt: chunk.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Native Firestore Vector representation
        embedding: FieldValue.vector(chunk.embedding),
        // Raw array backup for resilient in-memory fallback
        vectorRaw: chunk.embedding,
      };

      batch.set(docRef, dataToSave, { merge: true });
      insertedCount++;
    }

    try {
      await batch.commit();
    } catch (batchErr: any) {
      errors.push(`Batch write failed: ${batchErr.message}`);
    }
  }

  return { insertedCount, errors };
}

/**
 * Searches for nearest vector documents in Cloud Firestore.
 * Strictly attempts native collection.findNearest() first, and seamlessly
 * falls back to in-memory cosine search if index is currently building.
 */
export async function searchNearestVectors(
  queryVector: number[],
  options: {
    topK?: number;
    minScore?: number;
    category?: string;
    tenantTag?: string;
    rawQuery?: string;
  } = {}
): Promise<RagSearchResult[]> {
  const topK = options.topK || 5;
  const minScore = options.minScore || 0.25;
  const tenantTag = options.tenantTag || 'rto-ai';
  if (isFirebaseConfigured) {
    // 1. Try Native Firestore Vector Search (findNearest)
    try {
      const collectionRef = db.collection(KNOWLEDGE_COLLECTION);
      const vectorQuery = (collectionRef as any).findNearest('embedding', queryVector, {
        limit: topK * 2,
        distanceMeasure: 'COSINE',
        distanceResultField: 'vectorDistance',
      });

      const snapshot = await vectorQuery.get();
      if (!snapshot.empty) {
        const results: RagSearchResult[] = [];

        for (const doc of snapshot.docs) {
          const data = doc.data();
          if (data.tenantTag && data.tenantTag !== tenantTag) continue;
          if (options.category && data.category !== options.category) continue;

          let distance = 0.5;
          let score = 0.5;
          if (typeof doc.get('vectorDistance') === 'number') {
            distance = doc.get('vectorDistance');
            score = Math.max(0, Math.min(1, 1 - distance));
          } else if (data.vectorRaw && data.vectorRaw.length === queryVector.length) {
            score = cosineSimilarity(queryVector, data.vectorRaw);
            distance = Math.max(0, 1 - score);
          }

          if (score >= minScore) {
            results.push({
              chunk: {
                id: data.id || doc.id,
                docId: data.docId || '',
                chunkIndex: data.chunkIndex || 0,
                totalChunks: data.totalChunks || 1,
                text: data.text || '',
                language: data.language || 'en',
                languageName: data.languageName || 'EN English / Global',
                category: data.category || 'General',
                title: data.title || '',
                source: data.source || '',
                keywords: data.keywords || [],
                tenantTag: data.tenantTag || 'rto-ai',
                createdAt: data.createdAt || '',
              },
              score,
              distance,
            });
          }
        }

        if (results.length > 0) {
          return results.sort((a, b) => b.score - a.score).slice(0, topK);
        }
      }
    } catch (err: any) {
      console.warn(`[searchNearestVectors] Native findNearest fallback (${err.message}). Using in-memory cosine ranking.`);
    }

    // 2. Resilient In-Memory Vector Scoring Fallback
    try {
      const collectionRef = db.collection(KNOWLEDGE_COLLECTION);
      let query = collectionRef.where('tenantTag', '==', tenantTag).limit(100);
      if (options.category) {
        query = query.where('category', '==', options.category);
      }

      const snapshot = await query.get();
      const scoredDocs: RagSearchResult[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const rawVector: number[] = data.vectorRaw || (data.embedding?.toArray ? data.embedding.toArray() : null);

        if (rawVector && rawVector.length === queryVector.length) {
          const score = cosineSimilarity(queryVector, rawVector);
          if (score >= minScore) {
            scoredDocs.push({
              chunk: {
                id: data.id || doc.id,
                docId: data.docId || '',
                chunkIndex: data.chunkIndex || 0,
                totalChunks: data.totalChunks || 1,
                text: data.text || '',
                language: data.language || 'en',
                languageName: data.languageName || 'EN English / Global',
                category: data.category || 'General',
                title: data.title || '',
                source: data.source || '',
                keywords: data.keywords || [],
                tenantTag: data.tenantTag || 'rto-ai',
                createdAt: data.createdAt || '',
              },
              score,
              distance: 1 - score,
            });
          }
        }
      }

      if (scoredDocs.length > 0) {
        return scoredDocs.sort((a, b) => b.score - a.score).slice(0, topK);
      }
    } catch (fallbackErr: any) {
      console.error(`[searchNearestVectors] In-memory ranking error:`, fallbackErr);
    }
  }

  // 3. Ultra-resilient in-memory fallback using embedded seed documents
  // Ensures instantaneous, accurate multilingual search with zero GCP/Firestore setup
  return searchSeedDocuments(queryVector, options);
}

/**
 * Deletes all chunks associated with a document ID.
 */
export async function deleteDocumentChunks(docId: string): Promise<number> {
  // Clear from runtime in-memory cache
  for (let i = RUNTIME_STORED_CHUNKS.length - 1; i >= 0; i--) {
    if (RUNTIME_STORED_CHUNKS[i].docId === docId || RUNTIME_STORED_CHUNKS[i].id === docId) {
      RUNTIME_STORED_CHUNKS.splice(i, 1);
    }
  }

  if (!isFirebaseConfigured) return 0;
  const collectionRef = db.collection(KNOWLEDGE_COLLECTION);
  const snapshot = await collectionRef.where('docId', '==', docId).get();
  
  if (snapshot.empty) return 0;

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  return snapshot.size;
}

/**
 * Retrieves statistics for the vector database.
 */
export async function getVectorStoreStats(): Promise<{
  totalChunks: number;
  distinctLanguages: string[];
  distinctCategories: string[];
}> {
  if (!isFirebaseConfigured) {
    return {
      totalChunks: SEED_KNOWLEDGE_DOCUMENTS.length,
      distinctLanguages: ['en', 'ja', 'zh', 'vi', 'th'],
      distinctCategories: ['Accreditation Standards', 'Degree Programs', 'Vocational Compliance', 'Admissions & Visas', 'Course Architecture'],
    };
  }
  try {
    const snapshot = await db.collection(KNOWLEDGE_COLLECTION).limit(300).get();
    const languages = new Set<string>();
    const categories = new Set<string>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.language) languages.add(data.language);
      if (data.category) categories.add(data.category);
    });

    return {
      totalChunks: snapshot.size,
      distinctLanguages: Array.from(languages),
      distinctCategories: Array.from(categories),
    };
  } catch (e) {
    return {
      totalChunks: SEED_KNOWLEDGE_DOCUMENTS.length,
      distinctLanguages: ['en', 'ja', 'zh', 'vi', 'th'],
      distinctCategories: ['Accreditation Standards', 'Degree Programs', 'Vocational Compliance', 'Admissions & Visas', 'Course Architecture'],
    };
  }
}

/**
 * Maps language code to human-readable language name.
 */
function getLanguageDisplayName(code: string): string {
  const map: Record<string, string> = {
    en: 'EN English / Global',
    id: 'Indonesian (Bahasa Indonesia)',
    vi: 'Vietnamese (Tiếng Việt)',
    th: 'Thai (ภาษาไทย)',
    tl: 'Filipino / Tagalog',
    ms: 'Malay (Bahasa Melayu)',
    my: 'Burmese (မြန်မာဘာသာ)',
    km: 'Khmer (ភាសាខ្មែរ)',
    lo: 'Lao (ພາສາລາວ)',
    tet: 'Tetum (Lian Tetun)',
    zh: 'Chinese (中文)',
    ja: 'Japanese (日本語)',
    ko: 'Korean (한국어)',
  };
  return map[code.toLowerCase()] || code.toUpperCase();
}

/**
 * Retrieves all ingested documents from Firestore and seed sources,
 * grouped by document ID with reconstructed text content.
 */
export async function getIngestedDocuments(): Promise<IngestedDocumentEntry[]> {
  const docMap = new Map<string, IngestedDocumentEntry>();

  // 1. Seed documents as base foundation
  for (const seed of SEED_KNOWLEDGE_DOCUMENTS) {
    const id = seed.id || 'seed_doc';
    docMap.set(id, {
      id,
      title: seed.title,
      category: seed.category || 'General',
      language: seed.language || 'en',
      languageName: getLanguageDisplayName(seed.language || 'en'),
      source: seed.source || 'Institutional Archive',
      content: seed.content,
      chunkCount: 1,
      createdAt: new Date().toISOString(),
      keywords: Array.isArray(seed.keywords) ? seed.keywords : [],
    });
  }

  // 2. Chunks from Cloud Firestore
  if (isFirebaseConfigured) {
    try {
      const snapshot = await db.collection(KNOWLEDGE_COLLECTION).limit(500).get();
      const chunksByDoc = new Map<string, any[]>();

      snapshot.docs.forEach(docSnap => {
        const d = docSnap.data();
        const docId = d.docId || d.id;
        if (!chunksByDoc.has(docId)) {
          chunksByDoc.set(docId, []);
        }
        chunksByDoc.get(docId)!.push(d);
      });

      chunksByDoc.forEach((chunks, docId) => {
        chunks.sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0));
        const first = chunks[0];
        const reconstructedContent = chunks.map(c => c.text).filter(Boolean).join('\n\n');

        docMap.set(docId, {
          id: docId,
          title: first.title || 'Untitled Document',
          category: first.category || 'General',
          language: first.language || 'en',
          languageName: first.languageName || getLanguageDisplayName(first.language || 'en'),
          source: first.source || 'Institutional Document Portal',
          content: reconstructedContent || first.text || '',
          chunkCount: chunks.length,
          createdAt: first.createdAt || new Date().toISOString(),
          keywords: Array.isArray(first.keywords) ? first.keywords : [],
        });
      });
    } catch (err) {
      console.warn('[getIngestedDocuments] Firestore query error:', err);
    }
  }

  // 3. Runtime stored chunks (in-memory)
  const runtimeByDoc = new Map<string, MultilingualChunk[]>();
  for (const chunk of RUNTIME_STORED_CHUNKS) {
    if (!runtimeByDoc.has(chunk.docId)) {
      runtimeByDoc.set(chunk.docId, []);
    }
    runtimeByDoc.get(chunk.docId)!.push(chunk);
  }

  runtimeByDoc.forEach((chunks, docId) => {
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    const first = chunks[0];
    const reconstructedContent = chunks.map(c => c.text).filter(Boolean).join('\n\n');

    docMap.set(docId, {
      id: docId,
      title: first.title || 'Untitled Document',
      category: first.category || 'General',
      language: first.language || 'en',
      languageName: first.languageName || getLanguageDisplayName(first.language || 'en'),
      source: first.source || 'Institutional Document Portal',
      content: reconstructedContent || first.text || '',
      chunkCount: chunks.length,
      createdAt: first.createdAt || new Date().toISOString(),
      keywords: first.keywords || [],
    });
  });

  return Array.from(docMap.values());
}
