'use client';

import React, { useState } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatMessage } from '@/lib/agent/engine';
import { INITIAL_APPLICATION_STATE, StudentApplication } from '@/data/applications';
import { CourseProgram } from '@/data/courses';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome-embed',
  role: 'assistant',
  content: `👋 Hello! I am the **EduPulse AI Student Assistant**.\n\nI can help you with:\n• ❓ **University FAQs** (Scholarships, tuition fees, visas, deadlines)\n• 📚 **Degree Programs & Courses** (ATAR/GPA requirements, majors)\n• 🔬 **Individual Unit Syllabuses** (e.g. *COMP1001, COMP2004, DATA3001, AI5001*)\n• 📝 **Starting your student application form**\n• 📅 **Admissions Events & 1-Click Google Calendar RSVPs**\n\nHow can I help you today?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

export default function EmbedPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [application, setApplication] = useState<StudentApplication>(INITIAL_APPLICATION_STATE);
  const [apiKey, setApiKey] = useState<string>('');

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentApplication: application,
          apiKey: apiKey || undefined
        })
      });

      if (!res.ok) throw new Error('Chat API returned error');

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolsExecuted: data.toolsExecuted,
        uiWidgets: data.uiWidgets
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.updatedApplication) {
        setApplication(data.updatedApplication);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I encountered an issue processing your request. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col p-2 sm:p-4">
      <div className="flex-1 max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="font-bold text-sm">EduPulse AI Student Assistant</span>
          </div>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-indigo-200">24/7 Live</span>
        </div>

        <div className="flex-1 p-2 sm:p-3 overflow-hidden flex flex-col">
          <ChatInterface
            messages={messages}
            currentApplication={application}
            onSendMessage={handleSendMessage}
            onOpenApplicationTab={() => {}}
            onExploreUnit={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
