'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  Hash,
  Search,
  AlertCircle,
  CheckCheck,
  Paperclip,
  Smile,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Phone,
  Video,
  Pin,
  Bell,
  Trash2
} from 'lucide-react';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  dept: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface StaffMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  channelId?: string;
  recipientId?: string;
  content: string;
  timestamp: string;
  priority: 'normal' | 'urgent' | 'important';
  linkedStudentId?: string;
}

export interface StaffChannel {
  id: string;
  name: string;
  description: string;
  unreadCount: number;
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Dr. Sarah Lin',
    role: 'Admissions Lead & Associate Dean',
    dept: 'Engineering & CS',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    status: 'online'
  },
  {
    id: 'staff-2',
    name: 'David Miller',
    role: 'Senior Admissions Registrar',
    dept: 'Central Admissions',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    status: 'online'
  },
  {
    id: 'staff-3',
    name: 'James Wilson',
    role: 'International Student Advisor',
    dept: 'Global Engagement',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    status: 'away'
  },
  {
    id: 'staff-4',
    name: 'Elena Rostova',
    role: 'Scholarships Coordinator',
    dept: 'Student Services',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
    status: 'busy'
  }
];

const INITIAL_CHANNELS: StaffChannel[] = [
  { id: 'ch-general', name: 'admissions-general', description: 'General enquiries, team updates, and semester intake notices', unreadCount: 0 },
  { id: 'ch-urgent', name: 'urgent-student-cases', description: 'Immediate ATAR reviews, credit transfers, and waiver approvals', unreadCount: 2 },
  { id: 'ch-visa', name: 'international-visa', description: 'CoE issuing, visa compliance, and English proficiency evaluations', unreadCount: 0 },
  { id: 'ch-scholarships', name: 'scholarship-awards', description: 'Vice-Chancellor grants and Early Entry STEM leadership allocations', unreadCount: 0 }
];

const DEFAULT_MESSAGES: StaffMessage[] = [
  {
    id: 'msg-1',
    senderId: 'staff-1',
    senderName: 'Dr. Sarah Lin',
    senderRole: 'Admissions Lead',
    channelId: 'ch-general',
    content: 'Good morning admissions team! Semester 1 intake for CS100 and AI700 has reached 88% capacity. Please prioritize reviewing remaining pending domestic applications today.',
    timestamp: '08:45 AM',
    priority: 'normal'
  },
  {
    id: 'msg-2',
    senderId: 'staff-2',
    senderName: 'David Miller',
    senderRole: 'Senior Admissions Registrar',
    channelId: 'ch-urgent',
    content: 'Applicant #EP-2026-8819 has an ATAR of 81.9 (cutoff 82.5) with top ranking in Extension 2 Mathematics. Requesting Dean approval for 1.0 adjustment bonus.',
    timestamp: '09:12 AM',
    priority: 'urgent',
    linkedStudentId: 'EP-2026-8819'
  },
  {
    id: 'msg-3',
    senderId: 'staff-1',
    senderName: 'Dr. Sarah Lin',
    senderRole: 'Admissions Lead',
    channelId: 'ch-urgent',
    content: 'Approved for early offer with the mathematics bonus factor. Go ahead and issue the conditional letter of offer.',
    timestamp: '09:15 AM',
    priority: 'important',
    linkedStudentId: 'EP-2026-8819'
  },
  {
    id: 'msg-4',
    senderId: 'staff-3',
    senderName: 'James Wilson',
    senderRole: 'International Advisor',
    channelId: 'ch-visa',
    content: 'All international applicants requiring student visa CoEs for February intake have had their financial capability checks verified in Google Sheets.',
    timestamp: '10:05 AM',
    priority: 'normal'
  }
];

export const StaffMessagingView: React.FC = () => {
  const [channels] = useState<StaffChannel[]>(INITIAL_CHANNELS);
  const [staffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [activeChannelId, setActiveChannelId] = useState<string>('ch-general');
  const [activeDirectStaffId, setActiveDirectStaffId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<StaffMessage[]>(() => {
    try {
      const saved = localStorage.getItem('edupulse_staff_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_MESSAGES;
  });

  const [inputMessage, setInputMessage] = useState('');
  const [messagePriority, setMessagePriority] = useState<'normal' | 'urgent' | 'important'>('normal');
  const [linkedStudentId, setLinkedStudentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('edupulse_staff_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: StaffMessage = {
      id: `staff-msg-${Date.now()}`,
      senderId: 'staff-current',
      senderName: 'Staff Member (You)',
      senderRole: 'Admissions Officer',
      channelId: activeDirectStaffId ? undefined : activeChannelId,
      recipientId: activeDirectStaffId || undefined,
      content: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: messagePriority,
      linkedStudentId: linkedStudentId.trim() || undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setLinkedStudentId('');
    setMessagePriority('normal');

    // Simulate auto-acknowledgement in DM
    if (activeDirectStaffId) {
      const recipient = staffList.find(s => s.id === activeDirectStaffId);
      setTimeout(() => {
        const autoReply: StaffMessage = {
          id: `staff-msg-reply-${Date.now()}`,
          senderId: recipient?.id || 'staff-2',
          senderName: recipient?.name || 'Staff Member',
          senderRole: recipient?.role || 'Staff',
          recipientId: 'staff-current',
          content: `Thanks for the message! I am currently reviewing your note regarding ${linkedStudentId ? 'student #' + linkedStudentId : 'this enquiry'} and will update the registry shortly.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          priority: 'normal'
        };
        setMessages(prev => [...prev, autoReply]);
      }, 1200);
    }
  };

  // Filter messages based on active channel or active direct message
  const currentConversationMessages = messages.filter(m => {
    if (activeDirectStaffId) {
      return (
        (m.senderId === 'staff-current' && m.recipientId === activeDirectStaffId) ||
        (m.senderId === activeDirectStaffId && (m.recipientId === 'staff-current' || !m.recipientId))
      );
    }
    return m.channelId === activeChannelId;
  }).filter(m => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.content.toLowerCase().includes(term) ||
      m.senderName.toLowerCase().includes(term) ||
      (m.linkedStudentId && m.linkedStudentId.toLowerCase().includes(term))
    );
  });

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const activeStaffMember = staffList.find(s => s.id === activeDirectStaffId);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden flex flex-col md:flex-row h-[720px]">
      
      {/* LEFT SIDEBAR: CHANNELS & DIRECT MESSAGES */}
      <div className="w-full md:w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Staff Intercom</h3>
              <p className="text-[10px] text-slate-400">Admissions Secure Chat</p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="System Connected" />
        </div>

        {/* Channels & Staff List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar text-xs">
          
          {/* Section 1: Team Channels */}
          <div>
            <div className="px-2 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <span>Department Channels</span>
              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px] text-slate-300">{channels.length}</span>
            </div>
            <div className="mt-1.5 space-y-1">
              {channels.map(channel => {
                const isActive = !activeDirectStaffId && activeChannelId === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setActiveDirectStaffId(null);
                      setActiveChannelId(channel.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{channel.name}</span>
                    </div>
                    {channel.unreadCount > 0 && !isActive && (
                      <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                        {channel.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Direct Messages */}
          <div>
            <div className="px-2 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <span>Direct Staff Message</span>
              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px] text-slate-300">{staffList.length}</span>
            </div>
            <div className="mt-1.5 space-y-1">
              {staffList.map(staff => {
                const isActive = activeDirectStaffId === staff.id;
                return (
                  <button
                    key={staff.id}
                    onClick={() => {
                      setActiveDirectStaffId(staff.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={staff.avatar}
                        alt={staff.name}
                        className="w-6 h-6 rounded-full object-cover border border-slate-700"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${
                          staff.status === 'online'
                            ? 'bg-emerald-400'
                            : staff.status === 'busy'
                            ? 'bg-rose-400'
                            : 'bg-amber-400'
                        }`}
                      />
                    </div>
                    <div className="truncate flex-1">
                      <div className="truncate font-semibold text-xs leading-tight">{staff.name}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {staff.role}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Current Staff User Card Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
            AD
          </div>
          <div className="truncate flex-1">
            <div className="text-xs font-bold text-white truncate">Admissions Desk</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active Session
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT CHAT AREA */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        
        {/* Chat Header Bar */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              {activeDirectStaffId ? (
                <UserCheck className="w-5 h-5" />
              ) : (
                <Hash className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                {activeDirectStaffId ? activeStaffMember?.name : `#${activeChannel?.name}`}
                {activeDirectStaffId && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {activeStaffMember?.dept}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {activeDirectStaffId ? activeStaffMember?.role : activeChannel?.description}
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-44 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search chat..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {currentConversationMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No messages in this conversation yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Send a message or urgent update to communicate securely with your team members.
              </p>
            </div>
          ) : (
            currentConversationMessages.map(msg => {
              const isMe = msg.senderId === 'staff-current';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-700">{msg.senderName}</span>
                    <span>•</span>
                    <span>{msg.senderRole}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-sm text-xs sm:text-sm space-y-2 ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {/* Priority & Student Link Pills */}
                    {(msg.priority !== 'normal' || msg.linkedStudentId) && (
                      <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-white/20">
                        {msg.priority === 'urgent' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> URGENT CASE
                          </span>
                        )}
                        {msg.priority === 'important' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold">
                            Review Required
                          </span>
                        )}
                        {msg.linkedStudentId && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              isMe ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            Student #{msg.linkedStudentId}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Composer Footer */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-3">
          
          {/* Quick Options Bar (Priority, Student ID tag) */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Priority:</span>
              <button
                type="button"
                onClick={() => setMessagePriority('normal')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                  messagePriority === 'normal'
                    ? 'bg-slate-200 text-slate-800 font-bold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setMessagePriority('important')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                  messagePriority === 'important'
                    ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Review Required
              </button>
              <button
                type="button"
                onClick={() => setMessagePriority('urgent')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                  messagePriority === 'urgent'
                    ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                🚨 Urgent
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Tag Student ID:</span>
              <input
                type="text"
                value={linkedStudentId}
                onChange={e => setLinkedStudentId(e.target.value)}
                placeholder="e.g. EP-2026-9812"
                className="w-32 px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-slate-50 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Text Area & Submit Button */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder={
                activeDirectStaffId
                  ? `Message ${activeStaffMember?.name}...`
                  : `Broadcast message to #${activeChannel?.name}...`
              }
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl transition shadow-md shadow-indigo-600/30 flex items-center gap-2 shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>

    </div>
  );
};
