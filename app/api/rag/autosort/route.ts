import { NextRequest, NextResponse } from 'next/server';
import { autoSortDocument } from '@/lib/rag/ragPipeline';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, apiKey } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document content is required to auto-sort' },
        { status: 400 }
      );
    }

    const result = await autoSortDocument(content.trim(), apiKey);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[/api/rag/autosort] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Auto-sort analysis error' },
      { status: 500 }
    );
  }
}
