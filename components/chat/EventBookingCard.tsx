import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Video, Download, ExternalLink, CheckCircle2, User, Clock, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EventBookingCardProps {
  booking: {
    bookingId: string;
    event: {
      id: string;
      title: string;
      category: string;
      description: string;
      location: string;
      isVirtual: boolean;
      meetingLink?: string;
      speakerOrHost: string;
    };
    studentName: string;
    studentEmail: string;
    startTime: string;
    endTime: string;
    googleCalUrl: string;
    icsContent: string;
    notes?: string;
  };
}

export const EventBookingCard: React.FC<EventBookingCardProps> = ({ booking }) => {
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.85 }
      });
    } catch {
      // ignore
    }
  }, []);

  const handleDownloadIcs = () => {
    const blob = new Blob([booking.icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${booking.event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyMeet = () => {
    if (booking.event.meetingLink) {
      navigator.clipboard.writeText(booking.event.meetingLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

  return (
    <div className="my-3 bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-emerald-500/30 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
              RSVP & Registration Confirmed
            </span>
          </div>
          <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded text-emerald-100">
            {booking.bookingId}
          </span>
        </div>
        <h3 className="text-lg font-bold mt-2 text-white">{booking.event.title}</h3>
        <p className="text-xs text-emerald-200 mt-0.5">{booking.event.category} • Host: {booking.event.speakerOrHost}</p>
      </div>

      {/* Body Details */}
      <div className="p-4 space-y-3">
        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <div className="font-semibold text-slate-800">{formattedDate}</div>
              <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                {formattedTime}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            {booking.event.isVirtual ? (
              <Video className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 truncate" title={booking.event.location}>
                {booking.event.isVirtual ? 'Virtual Google Meet' : booking.event.location}
              </div>
              <div className="text-slate-500 text-[11px] truncate">
                {booking.event.isVirtual ? 'Link provided below' : 'Campus Check-in'}
              </div>
            </div>
          </div>
        </div>

        {/* Attendee Info */}
        <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-slate-700">
              Registered for: <strong className="text-emerald-950">{booking.studentName}</strong> ({booking.studentEmail})
            </span>
          </div>
        </div>

        {/* Google Meet Link if virtual */}
        {booking.event.meetingLink && (
          <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-blue-900 truncate">
              <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-medium truncate">{booking.event.meetingLink}</span>
            </div>
            <button
              onClick={handleCopyMeet}
              className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold border border-blue-200 flex items-center gap-1 transition-colors shrink-0 ml-2"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {/* Action Buttons: 1-Click Google Calendar & Download .ics */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
          <a
            href={booking.googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[170px] py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Add to Google Calendar</span>
            <ExternalLink className="w-3 h-3 opacity-75" />
          </a>

          <button
            onClick={handleDownloadIcs}
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .ics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
