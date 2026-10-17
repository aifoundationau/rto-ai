import { NextRequest, NextResponse } from 'next/server';
import { processAgentConversation } from '@/lib/agent/engine';
import { saveChatInteraction } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow maximum serverless execution duration on Vercel

export async function POST(req: NextRequest) {
  let messages: any[] = [];
  let currentApplication: any = undefined;
  try {
    const body = await req.json();
    messages = body.messages;
    currentApplication = body.currentApplication;
    const apiKey = body.apiKey;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    const keyToUse = apiKey || process.env.GEMINI_API_KEY;

    const result = await processAgentConversation(messages, currentApplication, keyToUse);

    // Save chat interaction to Firestore asynchronously (safe non-blocking)
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
    try {
      // Fall back to intelligent local semantic engine if an unexpected exception occurs
      if (Array.isArray(messages) && messages.length > 0) {
        const fallbackResult = await processAgentConversation(messages, currentApplication, undefined);
        return NextResponse.json(fallbackResult);
      }
    } catch (fallbackErr) {
      console.warn('Fallback local engine also threw:', fallbackErr);
    }

    return NextResponse.json({
      message: 'Hello! I am having temporary difficulty connecting to the external AI provider, but our complete degree catalog, syllabus database, and admissions schedules are available. Please ask about any degree program (e.g. *Bachelor of Computer Science*), unit syllabus (e.g. *COMP1001*), or upcoming Open Days!',
      toolsExecuted: [],
      uiWidgets: []
    });
  }
}
