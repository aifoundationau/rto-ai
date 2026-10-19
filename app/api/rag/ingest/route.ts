import { NextRequest, NextResponse } from 'next/server';
import { ingestDocument } from '@/lib/rag/ragPipeline';
import { getIngestedDocuments } from '@/lib/rag/vectorStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const documents = await getIngestedDocuments();
    return NextResponse.json({
      success: true,
      documents,
      total: documents.length,
    });
  } catch (error: any) {
    console.error('[/api/rag/ingest GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve ingested documents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, content, language, category, source, keywords, tenantTag, apiKey } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document content is required' },
        { status: 400 }
      );
    }

    const result = await ingestDocument(
      {
        id,
        title: title || '',
        content: content.trim(),
        language,
        category,
        source,
        keywords,
        tenantTag,
      },
      apiKey
    );


    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    console.error('[/api/rag/ingest] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal RAG ingestion error' },
      { status: 500 }
    );
  }
}
