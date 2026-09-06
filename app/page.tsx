'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from '@/components/Navbar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { CourseCatalogView } from '@/components/catalog/CourseCatalogView';
import { UnitCatalogView } from '@/components/catalog/UnitCatalogView';
import { ApplicationPortalView } from '@/components/application/ApplicationPortalView';
import { EventsCalendarView } from '@/components/events/EventsCalendarView';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { ChatMessage } from '@/lib/agent/engine';
import { StudentApplication, INITIAL_APPLICATION_STATE } from '@/data/applications';
import { CourseProgram, COURSES_DATA } from '@/data/courses';
import { Sparkles, Calendar, BookOpen, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  content: `👋 **Welcome to EduPulse AI — Your University Admissions & Student Assistant!**

I am equipped with real-time university databases and multi-tool capabilities to help you navigate your academic journey:

- ❓ **University FAQs**: Inquire about admission criteria, scholarships, tuition fees, visa work rights, and campus life.
- 🎓 **Degree Program Exploration**: Discover undergraduate & postgraduate degrees (e.g. *Bachelor of Computer Science, Master of AI, Business Analytics*).
- 🔬 **Individual Unit Syllabuses**: Inspect unit descriptions, credit points, prerequisites, weekly lecture topics, and assessment structures (e.g. *COMP1001, COMP2004, DATA3001, CYBR2002, AI5001*).
- 📝 **Live Interactive Application Form**: Let me guide you step-by-step to fill in your application, or edit directly in the portal.
- 📅 **Admissions Events & Google Calendar**: RSVP for Open Days, campus tours, and 1-on-1 advisor consultations with instant **1-Click Google Calendar sync** & **.ics invitations**!

How would you like to get started today?`,
  timestamp: new Date().toISOString()
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [application, setApplication] = useState<StudentApplication>(INITIAL_APPLICATION_STATE);
  const [apiKey, setApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load saved application or API key from localStorage if available
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('edupulse_api_key');
      if (savedKey) setApiKey(savedKey);

      const savedApp = localStorage.getItem('edupulse_active_application');
      if (savedApp) setApplication(JSON.parse(savedApp));
    } catch {
      // ignore
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    try {
      localStorage.setItem('edupulse_api_key', key);
    } catch {
      // ignore
    }
  };

  const handleUpdateApplication = (updated: StudentApplication) => {
    setApplication(updated);
    try {
      localStorage.setItem('edupulse_active_application', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

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

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        toolsExecuted: data.toolsExecuted,
        uiWidgets: data.uiWidgets
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.updatedApplication) {
        handleUpdateApplication(data.updatedApplication);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: '⚠️ I encountered an error connecting to the university server. Please try again or rephrase your question.',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
  };

  // Cross-view shortcuts
  const handleSelectCourseForChat = (course: CourseProgram) => {
    setActiveTab('chat');
    handleSendMessage(`Tell me all about ${course.title} (${course.code}), including admission requirements, tuition, and majors.`);
  };

  const handleApplyForCourse = (course: CourseProgram) => {
    const updated = {
      ...application,
      coursePreferences: {
        ...application.coursePreferences,
        firstChoiceCourseId: course.id,
        firstChoiceCourseName: course.title,
        majorOrSpecialization: course.majors[0]?.name || ''
      },
      updatedAt: new Date().toISOString()
    };
    handleUpdateApplication(updated);
    setActiveTab('application');
  };

  const handleSelectUnitForChat = (unitCode: string) => {
    setActiveTab('chat');
    handleSendMessage(`Show me the unit syllabus, coordinator, prerequisites, and assessment breakdown for ${unitCode}.`);
  };

  const handleAskAgentToBook = (eventTitle: string) => {
    setActiveTab('chat');
    handleSendMessage(`I would like to register for "${eventTitle}". Please book me in and generate my Google Calendar invite.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-900 text-white text-xs py-2 px-4 text-center border-b border-indigo-950/50 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-indigo-200">2026 Admissions Open:</span>
        <span className="text-slate-300">Semester 1 Intake Applications & Open Day Registrations are now active.</span>
        <button
          onClick={() => setActiveTab('events')}
          className="ml-2 text-indigo-300 hover:text-white font-bold underline transition-colors"
        >
          View Events & Calendar &rarr;
        </button>
      </div>

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-12rem)] min-h-[600px]">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              currentApplication={application}
              onOpenApplicationPortal={() => setActiveTab('application')}
              onSelectCourse={handleApplyForCourse}
              onSelectUnit={handleSelectUnitForChat}
              onResetChat={handleResetChat}
            />
          </div>
        )}

        {activeTab === 'courses' && (
          <CourseCatalogView
            onSelectCourseForChat={handleSelectCourseForChat}
            onApplyForCourse={handleApplyForCourse}
            onExploreUnit={handleSelectUnitForChat}
          />
        )}

        {activeTab === 'units' && (
          <UnitCatalogView onAskAgentAboutUnit={handleSelectUnitForChat} />
        )}

        {activeTab === 'application' && (
          <ApplicationPortalView
            application={application}
            onUpdateApplication={handleUpdateApplication}
            onBackToChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'events' && (
          <EventsCalendarView
            application={application}
            onAskAgentToBook={handleAskAgentToBook}
          />
        )}

        {activeTab === 'admin' && <AdminDashboardView />}
      </main>

      {/* API Key / Configuration Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
