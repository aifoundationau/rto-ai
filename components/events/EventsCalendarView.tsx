import React, { useState } from 'react';
import { ProspectiveEvent, EVENTS_DATA } from '@/data/events';
import { EventBookingCard } from '@/components/chat/EventBookingCard';
import { StudentApplication } from '@/data/applications';
import {
  Calendar,
  MapPin,
  Video,
  Users,
  Clock,
  ExternalLink,
  Download,
  CheckCircle2,
  Filter,
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface EventsCalendarViewProps {
  application: StudentApplication;
  onAskAgentToBook: (eventTitle: string) => void;
}

export const EventsCalendarView: React.FC<EventsCalendarViewProps> = ({
  application,
  onAskAgentToBook
}) => {
  const [events, setEvents] = useState<ProspectiveEvent[]>(EVENTS_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeBooking, setActiveBooking] = useState<any | null>(null);

  // Booking Modal State
  const [selectedEventForModal, setSelectedEventForModal] = useState<ProspectiveEvent | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [studentName, setStudentName] = useState(application.personalDetails.fullName || '');
  const [studentEmail, setStudentEmail] = useState(application.personalDetails.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['All', 'Open Day', 'Advising Session', 'Workshop', 'Webinar', 'Campus Tour'];

  const filteredEvents = events.filter(
    (e) => selectedCategory === 'All' || e.category === selectedCategory
  );

  const handleOpenBookingModal = (event: ProspectiveEvent) => {
    setSelectedEventForModal(event);
    if (event.availableSlots && event.availableSlots.length > 0) {
      const firstAvailable = event.availableSlots.find((s) => !s.isBooked);
      setSelectedSlotId(firstAvailable ? firstAvailable.slotId : '');
    } else {
      setSelectedSlotId('');
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForModal || !studentName.trim() || !studentEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventForModal.id,
          studentName,
          studentEmail,
          slotId: selectedSlotId || undefined,
          notes: 'Booked via Events & Calendar Portal'
        })
      });

      const data = await res.json();
      if (data.success) {
        setActiveBooking(data);
        setSelectedEventForModal(null);
      }
    } catch (err) {
      console.error('Failed to book event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-emerald-500/30 text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-emerald-400/20">
            Admissions Events & Calendar
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Prospective Student Events & Consultations
        </h1>
        <p className="text-sm text-indigo-200 mt-1 max-w-2xl">
          Register for Open Days, campus discovery tours, tech workshops, and 1-on-1 advisor sessions with automatic Google Calendar integration.
        </p>

        {/* Category filter pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Filter className="w-4 h-4 text-indigo-300 self-center shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white/10 text-indigo-200 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Latest Booking Confirmation Card if user just booked */}
      {activeBooking && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Your Recent Event Registration
            </h3>
            <button
              onClick={() => setActiveBooking(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>
          <EventBookingCard booking={activeBooking} />
        </div>
      )}

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map((ev) => {
          const startDate = new Date(ev.startDate);
          const formattedDate = startDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          const percentFull = Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100));

          return (
            <div
              key={ev.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Event Top Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">
                    {ev.category}
                  </span>
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {ev.registeredCount} / {ev.capacity} RSVPs
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{ev.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Host: {ev.speakerOrHost}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>

                {/* Details Bar */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span><strong>{formattedDate}</strong> at {timeStr}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    {ev.isVirtual ? (
                      <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="truncate">{ev.location}</span>
                  </div>
                </div>

                {/* Slots if 1-on-1 */}
                {ev.availableSlots && ev.availableSlots.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Available Consultation Time Slots:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ev.availableSlots.map((slot) => (
                        <div
                          key={slot.slotId}
                          className={`p-2 rounded-lg text-[11px] border ${
                            slot.isBooked
                              ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              : 'bg-emerald-50/70 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <div className="font-semibold">
                            {new Date(slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{slot.advisorName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                <button
                  onClick={() => onAskAgentToBook(ev.title)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Book via AI Agent</span>
                </button>

                <button
                  onClick={() => handleOpenBookingModal(ev)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>RSVP & Google Cal</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* RSVP Modal */}
      {selectedEventForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  RSVP Registration
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedEventForModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEventForModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Alex Taylor"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email for Calendar Invite *</label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="e.g. alex.taylor@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                />
              </div>

              {selectedEventForModal.availableSlots && selectedEventForModal.availableSlots.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Advising Time Slot</label>
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                  >
                    {selectedEventForModal.availableSlots.map((s) => (
                      <option key={s.slotId} value={s.slotId} disabled={s.isBooked}>
                        {new Date(s.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {s.advisorName} {s.isBooked ? '(Booked)' : '(Available)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>You will receive an instant 1-click Google Calendar sync link and .ics invitation!</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEventForModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Registering...' : 'Confirm Registration & Sync'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
