export interface CalendarEventPayload {
  title: string;
  description: string;
  location: string;
  startTime: string; // ISO 8601 string, e.g. 2026-09-12T09:30:00+10:00
  endTime: string;   // ISO 8601 string, e.g. 2026-09-12T16:00:00+10:00
  attendeeEmail?: string;
  organizerEmail?: string;
  meetingLink?: string;
}

/**
 * Formats a Date object or ISO string into Google Calendar URL format: YYYYMMDDTHHmmSSZ
 */
export function formatGoogleCalendarDate(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return d.toISOString().replace(/-|:|\.\d{3}/g, '');
}

/**
 * Builds a direct 1-click Google Calendar web creation URL
 */
export function createGoogleCalendarUrl(event: CalendarEventPayload): string {
  const startFormatted = formatGoogleCalendarDate(event.startTime);
  const endFormatted = formatGoogleCalendarDate(event.endTime);

  let details = event.description;
  if (event.meetingLink) {
    details += `\n\nGoogle Meet / Virtual Link: ${event.meetingLink}`;
  }
  if (event.attendeeEmail) {
    details += `\nAttendee: ${event.attendeeEmail}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startFormatted}/${endFormatted}`,
    details: details,
    location: event.location,
  });

  if (event.attendeeEmail) {
    params.append('add', event.attendeeEmail);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an RFC 5545 standard .ics file string
 */
export function createIcsContent(event: CalendarEventPayload): string {
  const start = formatGoogleCalendarDate(event.startTime);
  const end = formatGoogleCalendarDate(event.endTime);
  const now = formatGoogleCalendarDate(new Date());
  const uid = `edupulse-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@university.edu.au`;

  let description = event.description.replace(/\n/g, '\\n');
  if (event.meetingLink) {
    description += `\\n\\nMeeting Link: ${event.meetingLink}`;
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduPulse AI//Admissions Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${event.location}`,
    `STATUS:CONFIRMED`,
    event.organizerEmail ? `ORGANIZER;CN=University Admissions:MAILTO:${event.organizerEmail}` : 'ORGANIZER;CN=University Admissions:MAILTO:admissions@university.edu.au',
    event.attendeeEmail ? `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${event.attendeeEmail}:MAILTO:${event.attendeeEmail}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}
