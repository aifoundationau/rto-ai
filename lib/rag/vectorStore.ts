/**
 * Cloud Firestore Native Vector Store for Multilingual RAG
 * Stores 768-dimensional embeddings using FieldValue.vector(...)
 * Queries via collection.findNearest(...) with resilient in-memory cosine fallback
 */

import { db, FieldValue } from '@/lib/firebase/admin';
import { MultilingualChunk, RagSearchResult } from './types';
import { cosineSimilarity } from './embeddings';

export const KNOWLEDGE_COLLECTION = 'knowledge_embeddings';

/**
 * Stores a list of chunks with their 768-dimensional vector embeddings into Cloud Firestore.
 */
export async function storeChunks(chunks: MultilingualChunk[]): Promise<{
  insertedCount: number;
  errors: string[];
}> {
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
  } = {}
): Promise<RagSearchResult[]> {
  const topK = options.topK || 5;
  const minScore = options.minScore || 0.25;
  const tenantTag = options.tenantTag || 'rto-ai';
  const collectionRef = db.collection(KNOWLEDGE_COLLECTION);

  // 1. Try Native Firestore Vector Search (findNearest)
  try {
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
              languageName: data.languageName || 'English',
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
              languageName: data.languageName || 'English',
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

    return scoredDocs.sort((a, b) => b.score - a.score).slice(0, topK);
  } catch (fallbackErr: any) {
    console.error(`[searchNearestVectors] In-memory ranking error:`, fallbackErr);
    return [];
  }
}

/**
 * Deletes all chunks associated with a document ID.
 */
export async function deleteDocumentChunks(docId: string): Promise<number> {
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
      totalChunks: 0,
      distinctLanguages: [],
      distinctCategories: [],
    };
  }
}
