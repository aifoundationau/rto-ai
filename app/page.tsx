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
import { Footer } from '@/components/Footer';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { ChatMessage } from '@/lib/agent/engine';
import { StudentApplication, INITIAL_APPLICATION_STATE } from '@/data/applications';
import { CourseProgram, COURSES_DATA } from '@/data/courses';
import { trackClientEvent, trackPageView } from '@/lib/firebase/telemetry';
import { isProjectOwnerEmail } from '@/lib/auth/roles';

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
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isClassroomLoginOpen, setIsClassroomLoginOpen] = useState(false);
  const [classroomUser, setClassroomUser] = useState<ClassroomUser | null>(null);

  const isSuperAdminUser = Boolean(
    classroomUser && (
      isProjectOwnerEmail(classroomUser.email) ||
      (classroomUser.role || '').toLowerCase() === 'superadmin'
    )
  );

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
        const isOwner = isProjectOwnerEmail(parsed.email);
        const initialRole = isOwner ? 'superadmin' : (parsed.role || 'supporter');
        const isSuper = isOwner || initialRole.toLowerCase() === 'superadmin';
        const correctedUser = {
          ...parsed,
          role: initialRole,
          isSuperAdmin: isSuper,
        };
        setClassroomUser(correctedUser);
        setIsAdminLoggedIn(isSuper);

        // Immediate background refresh against Firestore to ensure any role change in Firebase reflects live
        const queryParam = parsed.email 
          ? `email=${encodeURIComponent(parsed.email)}`
          : (parsed.googleWorkspaceId ? `uid=${encodeURIComponent(parsed.googleWorkspaceId)}` : '');
        if (queryParam) {
          fetch(`/api/users?${queryParam}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.user) {
                const liveRole = isOwner ? 'superadmin' : (data.user.role || 'supporter');
                const liveSuper = isOwner || liveRole.toLowerCase() === 'superadmin';
                const refreshedUser = {
                  ...parsed,
                  role: liveRole,
                  isSuperAdmin: liveSuper,
                };
                setClassroomUser(refreshedUser);
                setIsAdminLoggedIn(liveSuper);
                try {
                  localStorage.setItem('edupulse_user', JSON.stringify(refreshedUser));
                  localStorage.setItem('edupulse_is_admin', liveSuper ? 'true' : 'false');
                } catch (e) {}
              }
            })
            .catch(() => {});
        }
      } else {
        setIsAdminLoggedIn(false);
      }
    } catch {
      // ignore
    }

    // Auto-sync with Firebase Auth state
    let isMounted = true;
    let unsubscribeAuth: (() => void) | null = null;
    import('@/lib/firebase/client').then(({ auth }) => {
      if (!isMounted || !auth || !auth.name) return;
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        if (!isMounted) return;
        unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
          if (!isMounted) return;
          const userExplicitlyLoggedOut = !localStorage.getItem('edupulse_user') && localStorage.getItem('edupulse_is_admin') !== 'true';
          if (userExplicitlyLoggedOut) {
            return;
          }
          if (firebaseUser) {
            // Fetch/sync user record from database with cryptographically verified ID token
            firebaseUser.getIdToken().then((idToken) => {
              fetch('/api/users', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                }),
              })
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                  if (!isMounted) return;
                  const dbUser = data?.user;
                const isOwner = isProjectOwnerEmail(firebaseUser.email);
                const role = isOwner ? 'superadmin' : (dbUser?.role || 'supporter');
                const isSuper = isOwner || role.toLowerCase() === 'superadmin';
                const syncUser: ClassroomUser = {
                  name: firebaseUser.displayName || dbUser?.name || 'User',
                  email: firebaseUser.email || dbUser?.email || '',
                  role: role,
                  isSuperAdmin: isSuper,
                  avatarUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
                  googleWorkspaceId: firebaseUser.uid,
                  scopesGranted: [
                    'userinfo.email',
                    'userinfo.profile',
                    'classroom.courses',
                    'classroom.rosters',
                    'calendar.events',
                    'spreadsheets.readonly',
                  ],
                };
                setClassroomUser(syncUser);
                setIsAdminLoggedIn(isSuper);
                try {
                  localStorage.setItem('edupulse_user', JSON.stringify(syncUser));
                  localStorage.setItem('edupulse_is_admin', isSuper ? 'true' : 'false');
                } catch (e) {}
              })
              .catch(() => {});
            }).catch(() => {});
          }
        });
      });
    });

    return () => {
      isMounted = false;
      if (unsubscribeAuth) {
        try {
          unsubscribeAuth();
        } catch (_) {}
      }
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
    if (isSuperAdminUser) {
      setActiveTab('admin');
    } else if (classroomUser) {
      setActiveTab('signin');
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

      // Sync user profile with Firestore database (/api/users)
      let finalRole = 'supporter';
      let isSuper = false;
      try {
        const idToken = await result.user.getIdToken();
        const syncRes = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          }),
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.user) {
            const isOwner = isProjectOwnerEmail(result.user.email);
            finalRole = isOwner ? 'superadmin' : (syncData.user.role || 'supporter');
            isSuper = isOwner || finalRole.toLowerCase() === 'superadmin';
          }
        }
      } catch (syncErr) {
        console.warn('[Auth] Could not sync user profile with /api/users:', syncErr);
      }

      const authenticatedUser: ClassroomUser = {
        name: result.user.displayName || 'User',
        email: result.user.email || '',
        role: finalRole,
        isSuperAdmin: isSuper,
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

      setClassroomUser(authenticatedUser);
      setIsAdminLoggedIn(isSuper);
      try {
        localStorage.setItem('edupulse_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('edupulse_is_admin', isSuper ? 'true' : 'false');
      } catch (e) {}

      trackClientEvent({
        category: 'AUTH',
        action: isSuper ? 'GOOGLE_SSO_SUPERADMIN_SUCCESS' : 'GOOGLE_SSO_SUPPORTER_SUCCESS',
        userId: authenticatedUser.googleWorkspaceId,
        userEmail: authenticatedUser.email,
        userRole: finalRole,
      });

      // Pre-fill application personal details with Google user info
      setApplication((prev) => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          fullName: prev.personalDetails.fullName || authenticatedUser.name || '',
          email: authenticatedUser.email || prev.personalDetails.email,
        },
      }));

      if (isSuper) {
        setActiveTab('admin');
      } else if (activeTab === 'application') {
        // Keep the user on the application form!
      } else {
        setActiveTab('chat');
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setActiveTab('signin');
    }
  };

  const handleLogoutAdmin = () => {
    // 1. Instantly update UI state
    setClassroomUser(null);
    setIsAdminLoggedIn(false);

    // 2. Clear credentials from localStorage and sessionStorage
    try {
      localStorage.removeItem('edupulse_user');
      localStorage.removeItem('edupulse_is_admin');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('google_oauth_access_token');
        sessionStorage.clear();
      }
    } catch {
      // ignore
    }

    // 3. Immediately route to home view
    setActiveTab('home');

    // 4. Safely and asynchronously sign out Firebase auth in the background
    (async () => {
      try {
        const { auth } = await import('@/lib/firebase/client');
        const { signOut } = await import('firebase/auth');
        if (auth && typeof auth === 'object' && auth.name) {
          await Promise.race([
            signOut(auth),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 2500))
          ]);
        }
      } catch (e) {
        console.warn('Sign out warning:', e);
      }

      trackClientEvent({
        category: 'AUTH',
        action: 'ADMIN_SESSION_LOGOUT',
        userRole: 'SUPERADMIN',
      });
    })();
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
        let errMessage = '';
        try {
          const errData = await res.json();
          errMessage = errData.message || errData.error || '';
        } catch (_) {}
        throw new Error(errMessage || `Server responded with status ${res.status}`);
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

        // An application submitted through the chat must also reach the admissions
        // database (the portal's Submit button already does this)
        if (data.updatedApplication.status === 'Submitted' && application.status !== 'Submitted') {
          fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ application: data.updatedApplication })
          }).catch((err) => console.warn('Failed to save chat-submitted application:', err));
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const isTimeout = error?.message?.includes('504') || error?.message?.includes('timed out');
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: isTimeout
          ? '⚠️ Connection timed out while contacting the AI model. If you deployed to Vercel, ensure **GEMINI_API_KEY** is configured under **Project Settings → Environment Variables**, or click the **Set Gemini Key** button in the chat header.'
          : '⚠️ I encountered an error connecting to the university server. Please check your network, configure your Gemini API Key in the chat header, or ask about our degree courses (e.g. *Bachelor of Computer Science*), unit syllabuses (e.g. *COMP1001*), or upcoming Open Days!',
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
        onLogout={handleLogoutAdmin}
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
              if (isSuperAdminUser) {
                setActiveTab('admin');
              } else if (classroomUser) {
                setActiveTab('courses');
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
              onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
              hasApiKey={Boolean(apiKey && apiKey.length > 10)}
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
            currentUser={classroomUser}
            onGoogleSignIn={handleGoogleSignInDirect}
          />
        )}

        {activeTab === 'events' && (
          <EventsCalendarView
            application={application}
            onAskAgentToBook={handleAskAgentToBook}
          />
        )}

        {activeTab === 'admin' && (
          isSuperAdminUser ? (
            <AdminDashboardView
              apiKey={apiKey}
              onSaveApiKey={handleSaveApiKey}
              onLogout={handleLogoutAdmin}
              currentUser={classroomUser}
            />
          ) : (
            <SignInView
              currentUser={classroomUser}
              onLoginSuccess={(user) => {
                const isSuper = isProjectOwnerEmail(user.email) || user.isSuperAdmin === true || user.role?.toLowerCase() === 'superadmin';
                const authed = {
                  ...user,
                  role: isSuper ? 'superadmin' : (user.role || 'supporter'),
                  isSuperAdmin: isSuper,
                };
                setClassroomUser(authed);
                setIsAdminLoggedIn(isSuper);
                try {
                  localStorage.setItem('edupulse_user', JSON.stringify(authed));
                  localStorage.setItem('edupulse_is_admin', isSuper ? 'true' : 'false');
                } catch (e) {}
                if (isSuper) {
                  setActiveTab('admin');
                } else {
                  setActiveTab('chat');
                }
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
              const isSuper = user.isSuperAdmin === true || user.role?.toLowerCase() === 'superadmin';
              setIsAdminLoggedIn(isSuper);
              try {
                localStorage.setItem('edupulse_user', JSON.stringify(user));
                localStorage.setItem('edupulse_is_admin', isSuper ? 'true' : 'false');
              } catch (e) {}
              if (isSuper) {
                setActiveTab('admin');
              } else {
                setActiveTab('chat');
              }
            }}
            onLogout={handleLogoutAdmin}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* Bottom Footer with Geolocation, Suburb, Live Date, Weather, and Browser Environment */}
      <Footer />

      {/* Google Classroom Login Modal */}
      <GoogleClassroomLoginModal
        isOpen={isClassroomLoginOpen}
        onClose={() => setIsClassroomLoginOpen(false)}
        currentUser={classroomUser}
        onLoginSuccess={(user) => {
          const isSuper = isProjectOwnerEmail(user.email) || user.isSuperAdmin === true || user.role?.toLowerCase() === 'superadmin';
          const authed = {
            ...user,
            role: isSuper ? 'superadmin' : (user.role || 'supporter'),
            isSuperAdmin: isSuper,
          };
          setClassroomUser(authed);
          setIsAdminLoggedIn(isSuper);
          try {
            localStorage.setItem('edupulse_user', JSON.stringify(authed));
            localStorage.setItem('edupulse_is_admin', isSuper ? 'true' : 'false');
          } catch (e) {}
          setIsClassroomLoginOpen(false);
          if (isSuper) {
            setActiveTab('admin');
          } else {
            setActiveTab('chat');
          }
        }}
        onLogout={handleLogoutAdmin}
      />

      {/* Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={(key) => {
          setApiKey(key);
          try {
            localStorage.setItem('edupulse_api_key', key);
          } catch (e) {}
        }}
      />
    </div>
  );
}
