import { NextRequest, NextResponse } from 'next/server';
import { activeEventsState } from '@/lib/agent/tools';
import { createGoogleCalendarUrl, createIcsContent } from '@/lib/calendar/googleCalendar';
import { saveEventBooking } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  let events = activeEventsState;
  if (category) {
    events = events.filter(e => e.category.toLowerCase() === category.toLowerCase());
  }

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, studentName, studentEmail, slotId, notes } = body;

    const event = activeEventsState.find(e => e.id === eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let startTime = event.startDate;
    let endTime = event.endDate;
    let slotDescription = '';

    if (slotId && event.availableSlots) {
      const slot = event.availableSlots.find(s => s.slotId === slotId);
      if (slot) {
        slot.isBooked = true;
        startTime = slot.startTime;
        endTime = slot.endTime;
        slotDescription = `Advisor: ${slot.advisorName}`;
      }
    }

    event.registeredCount += 1;

    const payload = {
      title: `${event.title} - ${studentName}`,
      description: `${event.description}\n\n${slotDescription}\nNotes: ${notes || 'Registered through EduPulse Admissions Portal'}`,
      location: event.location,
      startTime,
      endTime,
      attendeeEmail: studentEmail,
      meetingLink: event.meetingLink
    };

    const googleCalendarUrl = createGoogleCalendarUrl(payload);
    const icsContent = createIcsContent(payload);
    const bookingId = `BK-${Date.now().toString().slice(-6)}`;

    // Persist event booking to Firestore
    saveEventBooking({
      bookingId,
      eventId,
      title: event.title,
      studentName,
      studentEmail,
      startTime,
      endTime,
      location: event.location,
      notes,
    }).catch(err => console.warn('[Events] Non-blocking Firestore save warning:', err));

    return NextResponse.json({
      success: true,
      bookingId,
      event,
      studentName,
      studentEmail,
      startTime,
      endTime,
      googleCalendarUrl,
      icsContent
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
