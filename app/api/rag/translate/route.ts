import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/lib/rag/ragPipeline';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, targetLanguage, apiKey } = body;

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'Text and targetLanguage are required' },
        { status: 400 }
      );
    }

    const translatedText = await translateText(text, targetLanguage, apiKey);

    return NextResponse.json({
      success: true,
      translatedText,
      targetLanguage,
    });
  } catch (error: any) {
    console.error('[/api/rag/translate] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Translation error' },
      { status: 500 }
    );
  }
}
