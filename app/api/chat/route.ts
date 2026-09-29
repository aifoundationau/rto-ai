import { NextRequest, NextResponse } from 'next/server';
import { processAgentConversation } from '@/lib/agent/engine';
import { saveChatInteraction } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, currentApplication, apiKey } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    const keyToUse = apiKey || process.env.GEMINI_API_KEY;

    const result = await processAgentConversation(messages, currentApplication, keyToUse);

    // Save chat interaction to Firestore asynchronously
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg && result.message) {
      saveChatInteraction({
        userMessage: lastUserMsg.content,
        assistantResponse: result.message,
        toolsExecuted: result.toolsExecuted,
        uiWidgets: result.uiWidgets,
        applicantEmail: currentApplication?.personalDetails?.email,
        currentApplicationId: currentApplication?.id,
      }).catch(err => {
        console.warn('[Chat] Non-blocking Firestore save warning:', err);
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error processing agent conversation' },
      { status: 500 }
    );
  }
}
