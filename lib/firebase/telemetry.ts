/**
 * Firebase Telemetry & Event Collection Engine
 * Records all activities, user interactions, chat queries, application events,
 * and token transactions across the platform into Firestore.
 */

export interface ActivityEvent {
  id?: string;
  category: 'AUTH' | 'APPLICATION' | 'CHAT' | 'TOKEN' | 'CALENDAR' | 'NAVIGATION' | 'ADMIN';
  action: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Client-side helper to record telemetry events to Firebase
 */
export async function trackClientEvent(event: Omit<ActivityEvent, 'timestamp'>): Promise<void> {
  try {
    const payload: ActivityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    // Send to server endpoint which uses the Admin SDK to guarantee atomic Firestore writes
    if (typeof window !== 'undefined') {
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true, // Ensures event sends even on page navigation
      }).catch(err => {
        console.warn('[Telemetry] Non-blocking tracking failure:', err);
      });
    }
  } catch (err) {
    console.warn('[Telemetry] Error preparing event:', err);
  }
}

/**
 * Client-side helper to record page or view navigation
 */
export function trackPageView(tab: string, metadata?: Record<string, any>) {
  trackClientEvent({
    category: 'NAVIGATION',
    action: `VIEW_TAB_${tab.toUpperCase()}`,
    metadata: { tab, ...metadata },
  });
}

/**
 * Client-side helper to record token transactions
 */
export function trackTokenAction(action: string, details: Record<string, any>, userEmail?: string) {
  trackClientEvent({
    category: 'TOKEN',
    action,
    userEmail,
    metadata: details,
  });
}

/**
 * Client-side helper to record calendar events
 */
export function trackCalendarAction(action: string, eventDetails: Record<string, any>, attendeeEmail?: string) {
  trackClientEvent({
    category: 'CALENDAR',
    action,
    userEmail: attendeeEmail,
    metadata: eventDetails,
  });
}
