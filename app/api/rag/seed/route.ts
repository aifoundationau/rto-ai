import { NextRequest, NextResponse } from 'next/server';
import { seedMultilingualKnowledgeBase } from '@/lib/rag/ragPipeline';
import { getVectorStoreStats } from '@/lib/rag/vectorStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getVectorStoreStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let apiKey: string | undefined;
    try {
      const body = await req.json();
      apiKey = body.apiKey;
    } catch {
      // Body is optional
    }

    const seedResult = await seedMultilingualKnowledgeBase(apiKey);
    const stats = await getVectorStoreStats();

    return NextResponse.json({
      success: true,
      data: seedResult,
      stats,
    });
  } catch (error: any) {
    console.error('[/api/rag/seed] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error seeding knowledge base' },
      { status: 500 }
    );
  }
}
