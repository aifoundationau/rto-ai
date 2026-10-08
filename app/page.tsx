'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from '@/components/Navbar';
import { HomeView } from '@/components/home/HomeView';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { CourseCatalogView } from '@/components/catalog/CourseCatalogView';
import { UnitCatalogView } from '@/components/catalog/UnitCatalogView';
import { ApplicationPortalView } from '@/components/application/ApplicationPortalView';
import { EventsCalendarView } from '@/components/events/EventsCalendarView';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';
import { GoogleClassroomLoginModal, ClassroomUser } from '@/components/auth/GoogleClassroomLoginModal';
import { SignInView } from '@/components/auth/SignInView';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { ChatMessage } from '@/lib/agent/engine';
import { StudentApplication, INITIAL_APPLICATION_STATE } from '@/data/applications';
import { CourseProgram, COURSES_DATA } from '@/data/courses';
import { Sparkles, Calendar, BookOpen, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

import { trackClientEvent, trackPageView } from '@/lib/firebase/telemetry';

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
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [application, setApplication] = useState<StudentApplication>(INITIAL_APPLICATION_STATE);
  const [apiKey, setApiKey] = useState<string>('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isClassroomLoginOpen, setIsClassroomLoginOpen] = useState(false);
  const [classroomUser, setClassroomUser] = useState<ClassroomUser | null>(null);

  // Track page navigation changes to Firebase
  useEffect(() => {
    trackPageView(activeTab, {
      hasClassroomUser: !!classroomUser,
      isAdmin: isAdminLoggedIn,
    });
  }, [activeTab, classroomUser, isAdminLoggedIn]);

  // Load saved application, API key, and restore Google Superadmin user from localStorage & Firebase
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('edupulse_api_key');
      if (savedKey) setApiKey(savedKey);

      const savedApp = localStorage.getItem('edupulse_active_application');
      if (savedApp) setApplication(JSON.parse(savedApp));

      const savedUser = localStorage.getItem('edupulse_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setClassroomUser(parsed);
        setIsAdminLoggedIn(true);
      } else {
        const adminState = localStorage.getItem('edupulse_is_admin');
        if (adminState === 'true') setIsAdminLoggedIn(true);
      }
    } catch {
      // ignore
    }

    // Auto-sync with Firebase Auth state
    let isMounted = true;
    import('@/lib/firebase/client').then(({ auth }) => {
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        onAuthStateChanged(auth, (firebaseUser) => {
          if (!isMounted) return;
          if (firebaseUser) {
            const superadminUser: ClassroomUser = {
              name: firebaseUser.displayName || 'Admin User',
              email: firebaseUser.email || '',
              role: 'SUPERADMIN',
              avatarUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
              googleWorkspaceId: firebaseUser.uid,
              scopesGranted: [
                'userinfo.email',
                'userinfo.profile',
                'classroom.courses',
                'classroom.rosters',
                'calendar.events',
                'spreadsheets.readonly'
              ]
            };
            setClassroomUser(superadminUser);
            setIsAdminLoggedIn(true);
            try {
              localStorage.setItem('edupulse_user', JSON.stringify(superadminUser));
              localStorage.setItem('edupulse_is_admin', 'true');
            } catch (e) {}
          }
        });
      }).catch(() => {});
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    try {
      localStorage.setItem('edupulse_api_key', key);
    } catch {
      // ignore
    }
  };

  const handleOpenSettings = () => {
    if (classroomUser || isAdminLoggedIn) {
      setActiveTab('admin');
    } else {
      handleGoogleSignInDirect();
    }
  };

  const handleGoogleSignInDirect = async () => {
    try {
      const { auth } = await import('@/lib/firebase/client');
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');

      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('https://www.googleapis.com/auth/classroom.courses');
      provider.addScope('https://www.googleapis.com/auth/classroom.rosters');
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken && typeof window !== 'undefined') {
        sessionStorage.setItem('google_oauth_access_token', accessToken);
      }

      const superadminUser: ClassroomUser = {
        name: result.user.displayName || 'Admin User',
        email: result.user.email || '',
        role: 'SUPERADMIN',
        avatarUrl: result.user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        googleWorkspaceId: result.user.uid,
        scopesGranted: [
          'userinfo.email',
          'userinfo.profile',
          'classroom.courses',
          'classroom.rosters',
          'calendar.events',
          'spreadsheets.readonly'
        ]
      };

      setClassroomUser(superadminUser);
      setIsAdminLoggedIn(true);
      try {
        localStorage.setItem('edupulse_user', JSON.stringify(superadminUser));
        localStorage.setItem('edupulse_is_admin', 'true');
      } catch (e) {}

      trackClientEvent({
        category: 'AUTH',
        action: 'GOOGLE_SSO_SUPERADMIN_SUCCESS',
        userId: superadminUser.googleWorkspaceId,
        userEmail: superadminUser.email,
        userRole: 'SUPERADMIN',
      });

      // Go straight to superadmin panel
      setActiveTab('admin');
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setActiveTab('signin');
    }
  };

  const handleLogoutAdmin = async () => {
    try {
      const { auth } = await import('@/lib/firebase/client');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setClassroomUser(null);
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('edupulse_user');
      localStorage.removeItem('edupulse_is_admin');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('google_oauth_access_token');
      }
    } catch {
      // ignore
    }
    trackClientEvent({
      category: 'AUTH',
      action: 'ADMIN_SESSION_LOGOUT',
      userRole: 'SUPERADMIN',
    });
    setActiveTab('home');
  };

  const handleUpdateApplication = (updated: StudentApplication) => {
    setApplication(updated);
    try {
      localStorage.setItem('edupulse_active_application', JSON.stringify(updated));
    } catch {
      // ignore
    }
    // Record application progress to Firestore
    trackClientEvent({
      category: 'APPLICATION',
      action: 'APPLICATION_DRAFT_MODIFIED',
      userId: updated.id,
      userEmail: updated.personalDetails?.email,
      metadata: {
        id: updated.id,
        status: updated.status,
        courseName: updated.coursePreferences?.firstChoiceCourseName,
      }
    });
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
    trackClientEvent({
      category: 'NAVIGATION',
      action: 'COURSE_INQUIRY_INITIATED',
      metadata: { courseCode: course.code, courseTitle: course.title },
    });
    setActiveTab('chat');
    handleSendMessage(`Tell me all about ${course.title} (${course.code}), including admission requirements, tuition, and majors.`);
  };

  const handleApplyForCourse = (course: CourseProgram) => {
    trackClientEvent({
      category: 'APPLICATION',
      action: 'COURSE_APPLY_CLICKED',
      metadata: { courseCode: course.code, courseTitle: course.title },
    });
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
    trackClientEvent({
      category: 'NAVIGATION',
      action: 'UNIT_SYLLABUS_INSPECTED',
      metadata: { unitCode },
    });
    setActiveTab('chat');
    handleSendMessage(`Show me the unit syllabus, coordinator, prerequisites, and assessment breakdown for ${unitCode}.`);
  };

  const handleAskAgentToBook = (eventTitle: string) => {
    trackClientEvent({
      category: 'CALENDAR',
      action: 'BOOKING_INTENT_FROM_VIEW',
      metadata: { eventTitle },
    });
    setActiveTab('chat');
    handleSendMessage(`I would like to register for "${eventTitle}". Please book me in and generate my Google Calendar invite.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Banner Notice */}
      <div className="bg-[#0f172a] text-slate-200 text-xs py-2 px-4 text-center border-b border-slate-800/80 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-slate-200">2026 Admissions Open:</span>
        <span className="text-slate-300">Semester 1 Intake Applications & Open Day Registrations are now active.</span>
        <button
          onClick={() => setActiveTab('events')}
          className="ml-2 text-indigo-400 hover:text-white font-bold underline transition-colors"
        >
          View Events & Calendar &rarr;
        </button>
      </div>

      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={handleOpenSettings}
        currentUser={classroomUser}
        onGoogleSignIn={handleGoogleSignInDirect}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'home' && (
          <HomeView
            onNavigateTab={setActiveTab}
            onAskAgent={(query) => {
              setActiveTab('chat');
              handleSendMessage(query);
            }}
            onApplyForCourse={handleApplyForCourse}
            onExploreUnit={handleSelectUnitForChat}
            onOpenClassroom={() => {
              if (classroomUser || isAdminLoggedIn) {
                setActiveTab('admin');
              } else {
                handleGoogleSignInDirect();
              }
            }}
          />
        )}

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

        {activeTab === 'admin' && (
          (classroomUser || isAdminLoggedIn) ? (
            <AdminDashboardView
              apiKey={apiKey}
              onSaveApiKey={handleSaveApiKey}
              onLogout={handleLogoutAdmin}
            />
          ) : (
            <SignInView
              currentUser={classroomUser}
              onLoginSuccess={(user) => {
                setClassroomUser(user);
                setIsAdminLoggedIn(true);
                try {
                  localStorage.setItem('edupulse_user', JSON.stringify(user));
                  localStorage.setItem('edupulse_is_admin', 'true');
                } catch (e) {}
                setActiveTab('admin');
              }}
              onLogout={handleLogoutAdmin}
              onNavigateTab={setActiveTab}
            />
          )
        )}

        {activeTab === 'signin' && (
          <SignInView
            currentUser={classroomUser}
            onLoginSuccess={(user) => {
              setClassroomUser(user);
              setIsAdminLoggedIn(true);
              try {
                localStorage.setItem('edupulse_user', JSON.stringify(user));
                localStorage.setItem('edupulse_is_admin', 'true');
              } catch (e) {}
              // Go straight to superadmin panel
              setActiveTab('admin');
            }}
            onLogout={handleLogoutAdmin}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* Google Classroom Login Modal */}
      <GoogleClassroomLoginModal
        isOpen={isClassroomLoginOpen}
        onClose={() => setIsClassroomLoginOpen(false)}
        currentUser={classroomUser}
        onLoginSuccess={(user) => {
          setClassroomUser(user);
          setIsAdminLoggedIn(true);
          try {
            localStorage.setItem('edupulse_user', JSON.stringify(user));
            localStorage.setItem('edupulse_is_admin', 'true');
          } catch (e) {}
          setIsClassroomLoginOpen(false);
          setActiveTab('admin');
        }}
        onLogout={handleLogoutAdmin}
      />
    </div>
  );
}
