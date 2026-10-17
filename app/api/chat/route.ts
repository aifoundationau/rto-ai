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
        return NextResponse.json(fallbackResult, { status: 200 });
      }
    } catch (fallbackErr) {
      console.warn('Fallback local engine also threw:', fallbackErr);
    }

    // Graceful degradation: never crash the chat UI under Absolute Reliability Directive
    return NextResponse.json({
      message: 'Hello! I am your **EduPulse AI Student Assistant**. I am currently operating in resilient offline mode while server services synchronize. You can ask about **Degree Programs**, check **Unit Syllabuses (e.g. COMP1001)**, or start your **Application Form** using the tabs above.',
      toolsExecuted: [],
      uiWidgets: []
    }, { status: 200 });
  }
}
