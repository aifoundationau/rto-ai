import { NextRequest, NextResponse } from 'next/server';
import { improveDocumentLanguage } from '@/lib/rag/ragPipeline';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, language, apiKey } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document content is required to improve language' },
        { status: 400 }
      );
    }

    const result = await improveDocumentLanguage(
      title || 'Untitled Academic Document',
      content.trim(),
      language || 'en',
      apiKey
    );

    return NextResponse.json({
      success: true,
      improvedTitle: result.improvedTitle,
      improvedContent: result.improvedContent,
      summary: result.summary,
    });
  } catch (error: any) {
    console.error('[/api/rag/improve] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Language improvement error' },
      { status: 500 }
    );
  }
}
