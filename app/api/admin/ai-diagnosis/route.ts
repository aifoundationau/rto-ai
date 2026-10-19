import { NextRequest, NextResponse } from 'next/server';
import { getAiInteractions, updateAiInteractionReview, isFirebaseConfigured } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag') || 'ALL';
    const confidence = searchParams.get('confidence') || 'ALL';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '60', 10);

    const result = await getAiInteractions({
      tag,
      confidence,
      search,
      limit,
    });

    return NextResponse.json({
      success: true,
      metrics: result.metrics,
      interactions: result.interactions,
      source: isFirebaseConfigured ? 'firestore' : 'runtime_memory',
    });
  } catch (error: any) {
    console.error('Error in /api/admin/ai-diagnosis GET:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch AI diagnosis data',
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, verifiedAccuracy, notes, reviewerEmail, updatedAnswer, ragIngested, ragDocId, correctedLanguage } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: id',
      }, { status: 400 });
    }

    const result = await updateAiInteractionReview(id, {
      verifiedAccuracy: typeof verifiedAccuracy === 'number' ? verifiedAccuracy : undefined,
      notes,
      reviewerEmail,
      updatedAnswer,
      ragIngested,
      ragDocId,
      correctedLanguage,
    });

    return NextResponse.json({
      id,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/ai-diagnosis PATCH:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update AI interaction review',
    }, { status: 500 });
  }
}
