import { NextRequest, NextResponse } from 'next/server';
import { queryMultilingualRag } from '@/lib/rag/ragPipeline';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, topK, minScore, categoryFilter, targetLanguage, apiKey, allTranslations } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const result = await queryMultilingualRag(query.trim(), {
      topK: topK ? Number(topK) : 4,
      minScore: minScore ? Number(minScore) : 0.2,
      categoryFilter,
      targetLanguage,
      apiKey,
      allTranslations: allTranslations !== undefined ? Boolean(allTranslations) : true,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[/api/rag/query] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal RAG query error' },
      { status: 500 }
    );
  }
}
