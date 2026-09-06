import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/agent/engine';
import { StudentApplication } from '@/data/applications';
import { CourseProgram } from '@/data/courses';
import { UnitDetail } from '@/data/units';
import { CourseCard } from './CourseCard';
import { UnitCard } from './UnitCard';
import { EventBookingCard } from './EventBookingCard';
import { ApplicationUpdateCard } from './ApplicationUpdateCard';
import { FaqListCard } from './FaqListCard';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Layers,
  Calendar,
  FileText,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Code
} from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  currentApplication: StudentApplication;
  onOpenApplicationPortal: () => void;
  onSelectCourse: (course: CourseProgram) => void;
  onSelectUnit: (unitCode: string) => void;
  onResetChat: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  currentApplication,
  onOpenApplicationPortal,
  onSelectCourse,
  onSelectUnit,
  onResetChat
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Mic start error:', err);
      }
    }
  };

  const handleSpeakText = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanText = text.replace(/[*#_`[\]]/g, '').replace(/\(.*?\)/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    await onSendMessage(text);
  };

  // Preset quick prompt pills
  const promptSuggestions = [
    { label: '🎓 Bachelor of Computer Science', prompt: 'Tell me about Bachelor of Computer Science, entry requirements, and majors.' },
    { label: '📘 COMP1001 Unit Syllabus', prompt: 'Show me the unit description, prerequisites, and assessment breakdown for COMP1001.' },
    { label: '📅 Book Open Day (Google Calendar)', prompt: 'Register me for the University Open Day 2026 and generate my Google Calendar invite.' },
    { label: '📝 Start My Application', prompt: 'I want to apply for Master of Artificial Intelligence. My name is Alex Taylor, email alex@example.com, GPA 3.8.' },
    { label: '💰 Scholarships & Deadlines', prompt: 'What scholarships are available and what are the application deadlines for Semester 1?' },
    { label: '🌐 International Visa & Work Rights', prompt: 'Can international students work while studying and what English tests are accepted?' }
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-950/40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base tracking-tight text-white">EduPulse AI Student Agent</h2>
              <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full text-[10px] font-semibold border border-indigo-400/20">
                Agentic Online
              </span>
            </div>
            <p className="text-xs text-slate-400">Admissions • Courses • Unit Syllabuses • Application • Google Calendar</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetChat}
            title="Clear & Restart Conversation"
            className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl mx-auto ${
                isAssistant ? 'items-start' : 'items-start flex-row-reverse'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isAssistant
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {isAssistant ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Content Container */}
              <div className={`flex-1 max-w-2xl ${isAssistant ? 'text-left' : 'text-right'}`}>
                {/* Tools Executed Badges */}
                {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5 justify-start">
                    {msg.toolsExecuted.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-[11px] font-mono font-medium shadow-xs"
                      >
                        <Code className="w-3 h-3 text-indigo-500" />
                        <span>tool: {t.toolName}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative p-4 sm:p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isAssistant
                      ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm'
                      : 'bg-indigo-600 text-white rounded-tr-sm text-left ml-auto'
                  }`}
                >
                  <div className="whitespace-pre-wrap prose prose-sm max-w-none text-inherit">
                    {msg.content.replace(/[*#_`\[\]]/g, '')}
                  </div>

                  {/* Message Footer: Timestamp & Audio TTS button */}
                  {isAssistant && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px]">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        onClick={() => handleSpeakText(msg.id, msg.content)}
                        className="hover:text-indigo-600 p-1 rounded-md transition-colors flex items-center gap-1"
                        title="Read out loud"
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-rose-500 font-medium">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Rich UI Widgets Rendered directly under message */}
                {msg.uiWidgets && msg.uiWidgets.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {msg.uiWidgets.map((widget, widx) => {
                      if (widget.type === 'course') {
                        return (
                          <CourseCard
                            key={widx}
                            course={widget.data}
                            onExploreUnits={onSelectUnit}
                            onApplyForCourse={onSelectCourse}
                          />
                        );
                      }
                      if (widget.type === 'unit') {
                        return <UnitCard key={widx} unit={widget.data} />;
                      }
                      if (widget.type === 'event_booking') {
                        return <EventBookingCard key={widx} booking={widget.data} />;
                      }
                      if (widget.type === 'application_update') {
                        return (
                          <ApplicationUpdateCard
                            key={widx}
                            application={widget.data}
                            onOpenPortal={onOpenApplicationPortal}
                          />
                        );
                      }
                      if (widget.type === 'faq_list') {
                        return (
                          <FaqListCard
                            key={widx}
                            faqs={widget.data}
                            onSelectFaq={(q) => onSendMessage(q)}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-4xl mx-auto items-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl rounded-tl-sm text-sm text-slate-500 shadow-sm flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-medium text-slate-600">EduPulse Agent is reasoning & querying university services...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/60 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 max-w-4xl mx-auto min-w-max">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Try Asking:
          </span>
          {promptSuggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(item.prompt)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-full text-xs font-medium transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto flex items-center gap-2">
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-3 rounded-2xl border transition-all ${
              isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
            }`}
            title={isListening ? 'Stop listening' : 'Speak your question'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? 'Listening to your voice...' : 'Ask about degrees, COMP1001 syllabus, apply for admission, or book events...'}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
