'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Flame,
  CloudRain,
  X,
  ShieldAlert,
  Clock,
  ExternalLink,
  CheckCircle2,
  Bell
} from 'lucide-react';

export interface SevereEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  severity?: 'critical' | 'severe' | 'warning';
  updatedAt?: string;
}

export const SevereEmergencyModal: React.FC<SevereEmergencyModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  severity = 'severe',
  updatedAt,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard escape handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !message) return null;

  const severityColor =
    severity === 'critical'
      ? {
          bg: 'bg-red-600',
          border: 'border-red-500',
          badge: 'bg-red-500/20 text-red-300 border-red-500/40',
          ring: 'ring-red-500/30',
          banner: 'bg-gradient-to-r from-red-650 via-red-600 to-rose-700',
        }
      : severity === 'warning'
      ? {
          bg: 'bg-amber-600',
          border: 'border-amber-500',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          ring: 'ring-amber-500/30',
          banner: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700',
        }
      : {
          bg: 'bg-rose-600',
          border: 'border-rose-500',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          ring: 'ring-rose-500/30',
          banner: 'bg-gradient-to-r from-rose-650 via-rose-600 to-red-700',
        };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Severe Emergency Update"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-xl bg-slate-900 border-2 ${severityColor.border} rounded-3xl shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200 ring-4 ${severityColor.ring}`}
      >
        {/* Top Emergency Siren Banner */}
        <div className={`${severityColor.banner} px-5 py-3.5 flex items-center justify-between text-white shadow-md`}>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-white animate-ping shrink-0" />
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm tracking-wider uppercase">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200" />
              <span>Severe Emergency Broadcast</span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-black/30 border border-white/20">
            {severity.toUpperCase()} ALERT
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Headline Title */}
          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug flex items-start gap-2.5">
              <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <span>{title || 'Severe Environmental & Weather Emergency Notice'}</span>
            </h3>
            {updatedAt && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-8">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Issued / Updated: {new Date(updatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Message Content Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              <span>Official Campus Advisory & Instructions:</span>
            </div>
            <p className="text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-wrap font-medium">
              {message}
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Follow State Emergency Services (SES) & Local Alerts</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Acknowledge This Advisory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
