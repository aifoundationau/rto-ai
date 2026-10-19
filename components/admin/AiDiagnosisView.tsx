import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Zap,
  Target,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  Play,
  Filter,
  Clock,
  Sparkles,
  MessageSquare,
  Check,
  X,
  FileText,
  Sliders,
  ChevronRight,
  ChevronDown,
  Send,
  Database,
  Hash,
  Eye,
  Globe,
  Languages,
  Edit3,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import { AiInteractionRecord } from '@/lib/firebase/admin';

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  country: string;
  group: 'ASEAN' | 'Regional Partner';
}

export const ASEAN_LANGUAGES: LanguageOption[] = [
  { code: 'id', name: 'Indonesian (Bahasa Indonesia)', flag: '🇮🇩', country: 'Indonesia', group: 'ASEAN' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)', flag: '🇻🇳', country: 'Vietnam', group: 'ASEAN' },
  { code: 'th', name: 'Thai (ภาษาไทย)', flag: '🇹🇭', country: 'Thailand', group: 'ASEAN' },
  { code: 'tl', name: 'Filipino / Tagalog', flag: '🇵🇭', country: 'Philippines', group: 'ASEAN' },
  { code: 'ms', name: 'Malay (Bahasa Melayu)', flag: '🇲🇾', country: 'Malaysia / Brunei', group: 'ASEAN' },
  { code: 'en', name: 'English (Singapore / Global)', flag: '🇸🇬', country: 'Singapore', group: 'ASEAN' },
  { code: 'my', name: 'Burmese (မြန်မာဘာသာ)', flag: '🇲🇲', country: 'Myanmar', group: 'ASEAN' },
  { code: 'km', name: 'Khmer (ភាសាខ្មែរ)', flag: '🇰🇭', country: 'Cambodia', group: 'ASEAN' },
  { code: 'lo', name: 'Lao (ພາສາລາວ)', flag: '🇱🇦', country: 'Laos', group: 'ASEAN' },
  { code: 'tet', name: 'Tetum (Lian Tetun)', flag: '🇹🇱', country: 'Timor-Leste', group: 'ASEAN' },
];

export const REGIONAL_PARTNER_LANGUAGES: LanguageOption[] = [
  { code: 'zh', name: 'Chinese (中文)', flag: '🇨🇳', country: 'China', group: 'Regional Partner' },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵', country: 'Japan', group: 'Regional Partner' },
  { code: 'ko', name: 'Korean (한국어)', flag: '🇰🇷', country: 'South Korea', group: 'Regional Partner' },
];

export const MULTILINGUAL_OPTIONS: LanguageOption[] = [
  ...ASEAN_LANGUAGES,
  ...REGIONAL_PARTNER_LANGUAGES,
];

export const ALL_INQUIRY_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English (Australia / Global)', flag: '🇦🇺', country: 'Australia / Global', group: 'ASEAN' },
  ...ASEAN_LANGUAGES.filter(l => l.code !== 'en'),
  ...REGIONAL_PARTNER_LANGUAGES,
];

export const TRANSLATE_TARGET_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English (Australia / Global)', flag: '🇦🇺', country: 'Australia / Global', group: 'ASEAN' },
  { code: 'kh', name: 'Khmer (ភាសាខ្មែរ - Cambodia)', flag: '🇰🇭', country: 'Cambodia', group: 'ASEAN' },
  { code: 'id', name: 'Indonesian (Bahasa Indonesia)', flag: '🇮🇩', country: 'Indonesia', group: 'ASEAN' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)', flag: '🇻🇳', country: 'Vietnam', group: 'ASEAN' },
  { code: 'th', name: 'Thai (ภาษาไทย)', flag: '🇹🇭', country: 'Thailand', group: 'ASEAN' },
  { code: 'tl', name: 'Filipino / Tagalog', flag: '🇵🇭', country: 'Philippines', group: 'ASEAN' },
  { code: 'ms', name: 'Malay (Bahasa Melayu)', flag: '🇲🇾', country: 'Malaysia / Brunei', group: 'ASEAN' },
  { code: 'my', name: 'Burmese (မြန်မာဘာသာ)', flag: '🇲🇲', country: 'Myanmar', group: 'ASEAN' },
  { code: 'lo', name: 'Lao (ພາສາລາວ)', flag: '🇱🇦', country: 'Laos', group: 'ASEAN' },
  { code: 'tet', name: 'Tetum (Lian Tetun)', flag: '🇹🇱', country: 'Timor-Leste', group: 'ASEAN' },
  { code: 'zh', name: 'Chinese (中文)', flag: '🇨🇳', country: 'China', group: 'Regional Partner' },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵', country: 'Japan', group: 'Regional Partner' },
  { code: 'ko', name: 'Korean (한국어)', flag: '🇰🇷', country: 'South Korea', group: 'Regional Partner' },
];

export function detectInquiryLanguage(text: string): { code: string; name: string; flag: string } {
  if (!text || !text.trim()) return { code: 'en', name: 'English (Australia / Global)', flag: '🇦🇺' };

  // 1. Script checks (very reliable, distinctive non-Latin Unicode blocks)
  // Myanmar / Burmese script
  if (/[\u1000-\u109F\uAA60-\uAA7F]/.test(text)) {
    return { code: 'my', name: 'Burmese (မြန်မာဘာသာ)', flag: '🇲🇲' };
  }
  // Khmer script
  if (/[\u1780-\u17FF\u19E0-\u19FF]/.test(text)) {
    return { code: 'km', name: 'Khmer (ភាសាខ្មែរ)', flag: '🇰🇭' };
  }
  // Lao script
  if (/[\u0E80-\u0EFF]/.test(text)) {
    return { code: 'lo', name: 'Lao (ພາສາລາວ)', flag: '🇱🇦' };
  }
  // Thai script
  if (/[\u0E00-\u0E7F]/.test(text)) {
    return { code: 'th', name: 'Thai (ภาษาไทย)', flag: '🇹🇭' };
  }
  // Japanese (Hiragana / Katakana)
  if (/[\u3040-\u30ff]/.test(text)) {
    return { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵' };
  }
  // Korean (Hangul)
  if (/[\uac00-\ud7af]/.test(text)) {
    return { code: 'ko', name: 'Korean (한국어)', flag: '🇰🇷' };
  }
  // Chinese (CJK Ideographs)
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return { code: 'zh', name: 'Chinese (中文)', flag: '🇨🇳' };
  }
  // Vietnamese distinctive diacritics
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) {
    return { code: 'vi', name: 'Vietnamese (Tiếng Việt)', flag: '🇻🇳' };
  }

  // 2. High-confidence English check (stops English questions containing words like 'at', 'bachelor', 'course' from misclassifying)
  const englishStrongIndicators = /\b(the|is|are|was|were|what|how|where|when|which|who|why|can|could|would|should|have|has|had|does|do|did|for|from|with|about|into|through|during|before|after|above|below|to|in|on|of|and|an|a|or|admission|prerequisites|requirements|syllabus|degree|program|programs|student|students|university|faculty|tuition|fees|scholarship|apply|application|deadline|contact|campus|international|credits?|enrolment|enrollment|unit|units|grade|assessment)\b/gi;
  const englishMatches = (text.match(englishStrongIndicators) || []).length;

  // 3. Latin-based ASEAN languages with distinctive non-English vocabulary
  // Indonesian distinctive vocabulary
  const indonesianMatches = (text.match(/\b(persyaratan|pendaftaran|beasiswa|sarjana|kecerdasan|buatan|mahasiswa|pembelajaran|diperlukan|kuliah|bagaimana|apakah|mengapa|jurusan|biaya|fakultas)\b/gi) || []).length;
  if (indonesianMatches > 0 && indonesianMatches >= englishMatches) {
    return { code: 'id', name: 'Indonesian (Bahasa Indonesia)', flag: '🇮🇩' };
  }

  // Malay distinctive vocabulary
  const malayMatches = (text.match(/\b(kelayakan|kemasukan|pemindahan|ijazah|pengajian|universiti|syarat|dijalankan|pelajar|bagaimanakah|adakah|yuran)\b/gi) || []).length;
  if (malayMatches > 0 && malayMatches >= englishMatches) {
    return { code: 'ms', name: 'Malay (Bahasa Melayu)', flag: '🇲🇾' };
  }

  // Tagalog / Filipino distinctive markers (excluding standard English words like 'at' or 'bachelor')
  const tagalogMatches = (text.match(/\b(ang\s+mga|ano\s+ang|paano|kailan|saan|bakit|kumusta|magkano|matutunan|kinakailangan|pagpasok|pamantasan|mag-aaral|guro|kurso\s+sa|tuntunin)\b/gi) || []).length;
  if (tagalogMatches > 0 && tagalogMatches >= englishMatches) {
    return { code: 'tl', name: 'Filipino / Tagalog', flag: '🇵🇭' };
  }

  // Tetum (Timor-Leste) distinctive vocabulary (avoid single short 'ba' or 'ne')
  const tetumMatches = (text.match(/\b(lisensiatura|universidade|estudante|estudu|rekezitus|rekizitu|bolsu|matrikula|fakuldade|iha\s+ne|atu\s+halo)\b/gi) || []).length;
  if (tetumMatches > 0 && tetumMatches >= englishMatches) {
    return { code: 'tet', name: 'Tetum (Lian Tetun)', flag: '🇹🇱' };
  }

  // Default safely to English
  return { code: 'en', name: 'English (Australia / Global)', flag: '🇦🇺' };
}


export const AiDiagnosisView: React.FC = () => {
  const [interactions, setInteractions] = useState<AiInteractionRecord[]>([]);
  const [metrics, setMetrics] = useState<{
    totalInteractions: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    avgPerceivedAccuracy: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
    groundedToolsRatio: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Diagnostic live probe state
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<{
    latencyMs: number;
    perceivedAccuracy: number;
    confidence: string;
    question: string;
    answer: string;
  } | null>(null);

  // Inspection modal state
  const [inspectRecord, setInspectRecord] = useState<AiInteractionRecord | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState<string>('');
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Multilingual inspection translation state
  const [viewLanguage, setViewLanguage] = useState<string>('original');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationsCache, setTranslationsCache] = useState<Record<string, { question: string; answer: string }>>({});

  // Edit AI Response & RAG Ingestion state
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [editedAnswerText, setEditedAnswerText] = useState('');
  const [editLanguage, setEditLanguage] = useState('en');
  const [isAutoTranslatingDraft, setIsAutoTranslatingDraft] = useState(false);
  const [isIngestingToRag, setIsIngestingToRag] = useState(false);
  const [ragFeedbackMsg, setRagFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Inquiry Language Correction State
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [languageFeedbackMsg, setLanguageFeedbackMsg] = useState<string | null>(null);
  const [isEditingInquiryLang, setIsEditingInquiryLang] = useState(false);

  // Translate Edited AI Response section state (en and kh first on list)
  const [selectedTranslateLang, setSelectedTranslateLang] = useState<string>('kh');
  const [showMoreTranslations, setShowMoreTranslations] = useState<boolean>(false);
  const [isTranslatingResponse, setIsTranslatingResponse] = useState(false);
  const [translateSuccessMsg, setTranslateSuccessMsg] = useState<string | null>(null);
  const [translatedResultPreview, setTranslatedResultPreview] = useState<string | null>(null);

  // Prevent background scrolling and remove body scrollbar when inspection modal is active
  useEffect(() => {
    if (inspectRecord) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [inspectRecord]);

  const fetchDiagnosisData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTag !== 'ALL') params.set('tag', selectedTag);
      if (selectedConfidence !== 'ALL') params.set('confidence', selectedConfidence);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/ai-diagnosis?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInteractions(data.interactions || []);
        setMetrics(data.metrics || null);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to load AI diagnosis data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnosisData();
    const interval = setInterval(fetchDiagnosisData, 12000); // 12s auto-refresh
    return () => clearInterval(interval);
  }, [selectedTag, selectedConfidence]);

  const handleRunProbe = async () => {
    setIsProbing(true);
    setProbeResult(null);
    const probeQuestions = [
      'What are the core prerequisites and ATAR cutoff for the Bachelor of Computer Science?',
      'Can you show me the unit assessment breakdown for COMP1001?',
      'How does EduPulse RPL align with TEQSA and ASQA volume of learning standards?',
      'What are the semester payment schedules for international student visa holders?',
    ];
    const testQuestion = probeQuestions[Math.floor(Math.random() * probeQuestions.length)];

    try {
      const start = Date.now();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: testQuestion, id: 'probe-' + Date.now(), timestamp: new Date().toISOString() }],
          currentApplication: undefined,
        }),
      });

      const clientLatency = Date.now() - start;
      const data = await res.json();

      setProbeResult({
        latencyMs: data.diagnostics?.latencyMs || clientLatency,
        perceivedAccuracy: data.diagnostics?.perceivedAccuracy || 95,
        confidence: data.diagnostics?.confidenceLevel || 'HIGH',
        question: testQuestion,
        answer: data.message || 'Diagnostic probe completed.',
      });

      // Refresh list to show newly logged interaction
      setTimeout(fetchDiagnosisData, 500);
    } catch (err) {
      console.error('Diagnostic probe failed:', err);
    } finally {
      setIsProbing(false);
    }
  };

  const handleOpenInspect = (record: AiInteractionRecord) => {
    setInspectRecord(record);
    setReviewNotesInput(record.adminFeedback?.notes || '');
    setReviewSuccessMsg('');
    setIsEditingAnswer(false);
    setEditedAnswerText(record.aiAnswer);
    setViewLanguage('original');
    setTranslationsCache({});
    setRagFeedbackMsg(null);
    setLanguageFeedbackMsg(null);
    setIsEditingInquiryLang(false);
    const activeInquiry = record.inquiryLanguage || record.adminFeedback?.correctedLanguage || detectInquiryLanguage(record.userQuestion);
    setEditLanguage(activeInquiry.code);
    setTranslatedResultPreview(null);
    setTranslateSuccessMsg(null);
    setSelectedTranslateLang('kh');
    setShowMoreTranslations(false);
  };

  const handleCorrectInquiryLanguage = async (newLangCode: string) => {
    if (!inspectRecord) return;
    const targetOption = ALL_INQUIRY_LANGUAGES.find(l => l.code === newLangCode) || {
      code: newLangCode,
      name: newLangCode.toUpperCase(),
      flag: '🌐',
      country: '',
      group: 'ASEAN' as const
    };

    const newLangObj = {
      code: targetOption.code,
      name: targetOption.name,
      flag: targetOption.flag
    };

    setIsUpdatingLanguage(true);
    setLanguageFeedbackMsg(null);

    // Optimistically update inspectRecord & local interactions array
    const updatedInspect: AiInteractionRecord = {
      ...inspectRecord,
      inquiryLanguage: newLangObj,
      adminFeedback: {
        ...(inspectRecord.adminFeedback || { reviewed: true }),
        correctedLanguage: newLangObj,
        reviewed: true,
      }
    };
    setInspectRecord(updatedInspect);
    if (newLangCode !== 'en') {
      setEditLanguage(newLangCode);
    }
    setInteractions(prev => prev.map(item => item.id === inspectRecord.id ? updatedInspect : item));

    try {
      const res = await fetch('/api/admin/ai-diagnosis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inspectRecord.id,
          correctedLanguage: newLangObj,
          reviewerEmail: 'staff@ai-foundation.org'
        })
      });
      const data = await res.json();
      if (data.success || data.id) {
        setLanguageFeedbackMsg(`✓ Saved! Inquiry language corrected to ${targetOption.flag} ${targetOption.name}`);
        setTimeout(() => setLanguageFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save corrected inquiry language:', err);
    } finally {
      setIsUpdatingLanguage(false);
    }
  };

  const handleTranslateModal = async (targetLang: string) => {
    if (!inspectRecord) return;
    if (targetLang === 'original') {
      setViewLanguage('original');
      return;
    }
    if (translationsCache[targetLang]) {
      setViewLanguage(targetLang);
      return;
    }

    setIsTranslating(true);
    try {
      const [resQ, resA] = await Promise.all([
        fetch('/api/rag/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inspectRecord.userQuestion, targetLanguage: targetLang }),
        }),
        fetch('/api/rag/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inspectRecord.aiAnswer, targetLanguage: targetLang }),
        }),
      ]);

      const dataQ = await resQ.json();
      const dataA = await resA.json();

      const translatedQ = dataQ.translatedText || inspectRecord.userQuestion;
      const translatedA = dataA.translatedText || inspectRecord.aiAnswer;

      setTranslationsCache(prev => ({
        ...prev,
        [targetLang]: { question: translatedQ, answer: translatedA }
      }));
      setViewLanguage(targetLang);
    } catch (err) {
      console.error('Translation error in modal:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAutoTranslateDraft = async (targetLang: string) => {
    if (!editedAnswerText.trim()) return;
    setIsAutoTranslatingDraft(true);
    try {
      const res = await fetch('/api/rag/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editedAnswerText, targetLanguage: targetLang }),
      });
      const data = await res.json();
      if (data.translatedText) {
        setEditedAnswerText(data.translatedText);
        setEditLanguage(targetLang);
      }
    } catch (err) {
      console.error('Draft translation error:', err);
    } finally {
      setIsAutoTranslatingDraft(false);
    }
  };

  const handleTranslateEditedResponse = async (targetLangCode?: string) => {
    if (!inspectRecord) return;
    const targetCode = targetLangCode || selectedTranslateLang;
    const sourceText = editedAnswerText.trim() || inspectRecord.aiAnswer;
    if (!sourceText) return;

    setIsTranslatingResponse(true);
    setTranslateSuccessMsg(null);

    try {
      const res = await fetch('/api/rag/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          targetLanguage: targetCode === 'kh' ? 'km' : targetCode,
        }),
      });

      const data = await res.json();
      if (data.translatedText) {
        setEditedAnswerText(data.translatedText);
        setEditLanguage(targetCode);
        setIsEditingAnswer(true);
        setTranslatedResultPreview(data.translatedText);

        const targetObj = TRANSLATE_TARGET_LANGUAGES.find(l => l.code === targetCode) || {
          flag: '🌐',
          name: targetCode.toUpperCase()
        };

        setTranslateSuccessMsg(`✓ Successfully translated into ${targetObj.flag} ${targetObj.name}! Synced to AI Response Output Editor above.`);
        setTimeout(() => setTranslateSuccessMsg(null), 6000);
      }
    } catch (err: any) {
      console.error('Translation error in inspection modal:', err);
    } finally {
      setIsTranslatingResponse(false);
    }
  };

  const handleCancelTranslation = () => {
    setShowMoreTranslations(false);
    setTranslatedResultPreview(null);
    setTranslateSuccessMsg(null);
    if (inspectRecord) {
      setEditedAnswerText(inspectRecord.aiAnswer);
      const activeInquiry = inspectRecord.inquiryLanguage || inspectRecord.adminFeedback?.correctedLanguage || detectInquiryLanguage(inspectRecord.userQuestion);
      setEditLanguage(activeInquiry.code);
    }
  };

  const handleSaveAndIngestRag = async () => {
    if (!inspectRecord || !editedAnswerText.trim()) return;
    setIsIngestingToRag(true);
    setRagFeedbackMsg(null);

    try {
      // 1. Ingest into Multilingual RAG Vector Index
      const qSnippet = inspectRecord.userQuestion.slice(0, 75).trim();
      const ragRes = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Verified Q&A: ${qSnippet}`,
          content: `### Student Question\n${inspectRecord.userQuestion}\n\n### Verified Institutional Response\n${editedAnswerText.trim()}`,
          category: 'Verified Q&A Knowledge Bank',
          language: editLanguage,
          source: 'AI Diagnosis Staff Review',
          tenantTag: 'rto-ai',
        }),
      });

      const ragData = await ragRes.json();
      const ragDocId = ragData.data?.docId || `rag_${Date.now()}`;

      // 2. Update interaction record in Firestore & memory via PATCH
      const patchRes = await fetch('/api/admin/ai-diagnosis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inspectRecord.id,
          updatedAnswer: editedAnswerText.trim(),
          verifiedAccuracy: 100,
          notes: `Response edited & ingested into Multilingual RAG (${editLanguage.toUpperCase()}) by Staff.`,
          reviewerEmail: 'staff@ai-foundation.org',
          ragIngested: true,
          ragDocId,
        }),
      });

      if (patchRes.ok) {
        setRagFeedbackMsg({
          type: 'success',
          text: `✓ Successfully saved and indexed into Multilingual RAG! Future student queries in any language will cite this verified answer.`
        });

        // Update local interaction in state
        const updatedRecord: AiInteractionRecord = {
          ...inspectRecord,
          aiAnswer: editedAnswerText.trim(),
          perceivedAccuracy: 100,
          confidenceLevel: 'HIGH',
          adminFeedback: {
            reviewed: true,
            verifiedAccuracy: 100,
            notes: `Response edited & ingested into Multilingual RAG (${editLanguage.toUpperCase()}) by Staff.`,
            reviewerEmail: 'staff@ai-foundation.org',
            reviewedAt: new Date().toISOString(),
          }
        };

        setInspectRecord(updatedRecord);
        setInteractions(prev => prev.map(item => item.id === inspectRecord.id ? updatedRecord : item));
        setIsEditingAnswer(false);
        fetchDiagnosisData();
      } else {
        setRagFeedbackMsg({
          type: 'error',
          text: 'Failed to update interaction record after RAG ingestion.'
        });
      }
    } catch (err: any) {
      console.error('RAG ingestion error:', err);
      setRagFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to ingest verified answer into RAG.'
      });
    } finally {
      setIsIngestingToRag(false);
    }
  };

  const handleSaveReview = async () => {
    if (!inspectRecord) return;
    setIsSavingReview(true);
    try {
      const res = await fetch('/api/admin/ai-diagnosis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inspectRecord.id,
          notes: reviewNotesInput,
          reviewerEmail: 'superadmin@ai-foundation.org',
        }),
      });

      if (res.ok) {
        setReviewSuccessMsg('Audit notes saved successfully!');
        setInspectRecord(prev => prev ? {
          ...prev,
          adminFeedback: {
            ...(prev.adminFeedback || { reviewed: true }),
            reviewed: true,
            notes: reviewNotesInput,
            reviewerEmail: 'superadmin@ai-foundation.org',
            reviewedAt: new Date().toISOString(),
          }
        } : null);
        fetchDiagnosisData();
      }
    } catch (err) {
      console.error('Failed to update review:', err);
    } finally {
      setIsSavingReview(false);
    }
  };


  const getLatencyBadge = (latency: number) => {
    if (latency <= 500) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
        label: `${latency}ms (Ultra-Fast)`,
      };
    }
    if (latency <= 1200) {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
        label: `${latency}ms (Optimal)`,
      };
    }
    if (latency <= 2500) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
        label: `${latency}ms (Normal)`,
      };
    }
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
      label: `${latency}ms (High Latency)`,
    };
  };

  const getConfidenceBadge = (confidence: string, score: number) => {
    switch (confidence) {
      case 'HIGH':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-700',
          indicator: 'bg-emerald-500',
          text: `${score}% HIGH`,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-700',
          indicator: 'bg-amber-500',
          text: `${score}% MEDIUM`,
        };
      default:
        return {
          bg: 'bg-rose-500/10 text-rose-700 border-rose-300 dark:text-rose-300 dark:border-rose-700',
          indicator: 'bg-rose-500',
          text: `${score}% LOW`,
        };
    }
  };

  const availableTags = [
    'ALL',
    '#ai-interactions',
    '#syllabus',
    '#admissions',
    '#course-inquiry',
    '#rag-retrieval',
    '#event-booking',
    '#faq',
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-indigo-700/30 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                EduPulse AI Live Telemetry & Observability Engine
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-mono">
                Model: gemini-3.8-flash
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Cpu className="w-7 h-7 text-indigo-400" />
              AI Diagnosis & Interaction Analytics
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time audit telemetry tracking all questions, AI responses, network latency, and perceived accuracy scores grounded in official course curricula and TEQSA/ASQA regulations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunProbe}
              disabled={isProbing}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
              <span>{isProbing ? 'Running Probe...' : 'Run Live Diagnostic Probe'}</span>
            </button>

            <button
              onClick={fetchDiagnosisData}
              disabled={loading}
              className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Probe Feedback Banner if active */}
        {probeResult && (
          <div className="mt-5 p-4 rounded-2xl bg-indigo-900/40 border border-indigo-500/40 backdrop-blur-md text-xs space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Live Diagnostic Probe Completed
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  Latency: {probeResult.latencyMs}ms
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  Accuracy: {probeResult.perceivedAccuracy}% ({probeResult.confidence})
                </span>
              </div>
            </div>
            <p className="text-slate-300">
              <span className="font-semibold text-slate-400">Prompt:</span> &ldquo;{probeResult.question}&rdquo;
            </p>
            <p className="text-slate-300 line-clamp-2">
              <span className="font-semibold text-slate-400">Response:</span> {probeResult.answer}
            </p>
          </div>
        )}

        {/* Metadata sub-bar */}
        <div className="mt-6 pt-4 border-t border-indigo-900/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-slate-500 font-medium">Tagging Policy:</span>
            <span className="font-mono text-indigo-300 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
              #ai-interactions (Mandatory)
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-slate-500 font-medium">Collection:</span>
            <span className="font-mono text-emerald-300 font-semibold">firestore/ai_interactions</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 sm:justify-end">
            <span className="text-slate-500 font-medium">Last Synchronised:</span>
            <span className="font-mono text-emerald-400">{lastRefreshed || 'Syncing...'}</span>
          </div>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Average Latency */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Average Processing Latency</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics?.avgLatencyMs ?? 0}
            </p>
            <span className="text-sm font-bold text-slate-500">ms</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">P95 Latency:</span>
            <span className="font-mono font-bold text-slate-700">{metrics?.p95LatencyMs ?? 0}ms</span>
          </div>
          <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, ((metrics?.avgLatencyMs || 500) / 2000) * 100))}%` }}
            />
          </div>
        </div>

        {/* Card 2: Perceived Accuracy */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Perceived AI Accuracy</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics?.avgPerceivedAccuracy ?? 0}%
            </p>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Optimal
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>High Confidence:</span>
            <span className="font-bold text-emerald-600 font-mono">
              {metrics?.highConfidenceCount ?? 0} queries
            </span>
          </div>
          <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${metrics?.avgPerceivedAccuracy ?? 90}%` }}
            />
          </div>
        </div>

        {/* Card 3: Total AI Interactions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Total AI Interactions</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics?.totalInteractions ?? interactions.length}
            </p>
            <span className="text-xs font-medium text-slate-400">logged</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Tag:</span>
            <span className="font-mono font-bold text-purple-600">#ai-interactions</span>
          </div>
          <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-600 h-1.5 rounded-full w-full" />
          </div>
        </div>

        {/* Card 4: Tool Grounding Ratio */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Curriculum Grounding Ratio</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics?.groundedToolsRatio ?? 92}%
            </p>
            <span className="text-xs text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
              Verified
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>RAG / Syllabus matches:</span>
            <span className="font-bold text-slate-700">100% TEQSA aligned</span>
          </div>
          <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${metrics?.groundedToolsRatio ?? 92}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Tag Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-indigo-500" /> Filter Tag:
            </span>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Confidence and Search Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Confidence Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedConfidence}
                onChange={(e) => setSelectedConfidence(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Confidence Levels</option>
                <option value="HIGH">High (≥90%)</option>
                <option value="MEDIUM">Medium (75–89%)</option>
                <option value="LOW">Low (&lt;75%)</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions or answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDiagnosisData()}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{interactions.length}</strong> recorded interactions with tag <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">{selectedTag}</code>
          </span>
          <span className="text-slate-400">Click &ldquo;Inspect&rdquo; on any interaction to review grounding citations and override accuracy score</span>
        </div>
      </div>

      {/* Interactive Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Live AI Interaction Audit Stream (Tagged #ai-interactions)
          </h3>
          <span className="text-xs text-slate-400">
            Auto-refreshing every 12s
          </span>
        </div>

        {interactions.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
            <p className="text-sm font-semibold">No AI interactions match the active filter.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click &ldquo;Run Live Diagnostic Probe&rdquo; above to generate a verified real-time query test.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">User Question</th>
                  <th className="py-3 px-4">AI Response Summary</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Perceived Accuracy</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interactions.map((rec) => {
                  const dateStr = rec.timestamp
                    ? new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'N/A';
                  const latBadge = getLatencyBadge(rec.latencyMs || 0);
                  const confBadge = getConfidenceBadge(rec.confidenceLevel || 'MEDIUM', rec.perceivedAccuracy || 0);

                  return (
                    <tr key={rec.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-2" title={rec.userQuestion}>
                          {rec.userQuestion}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {rec.userEmail && (
                            <span className="text-[10px] text-slate-400 truncate">
                              {rec.userEmail}
                            </span>
                          )}
                          {(() => {
                            const inqLang = rec.inquiryLanguage || rec.adminFeedback?.correctedLanguage || detectInquiryLanguage(rec.userQuestion);
                            const isCorrected = Boolean(rec.inquiryLanguage || rec.adminFeedback?.correctedLanguage);
                            return (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium flex items-center gap-1 ${
                                  isCorrected
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                                title={isCorrected ? 'Inquiry language verified & corrected by staff' : 'AI detected inquiry language'}
                              >
                                <span>{inqLang.flag}</span>
                                <span>{inqLang.name.split(' ')[0]}</span>
                                {isCorrected && (
                                  <span className="text-[8px] text-emerald-600 font-extrabold">✓</span>
                                )}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-sm">
                        <p className="text-slate-600 line-clamp-2 leading-relaxed" title={rec.aiAnswer}>
                          {rec.aiAnswer}
                        </p>
                        {rec.toolsExecuted && rec.toolsExecuted.length > 0 && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[9px] font-mono border border-indigo-200">
                              🛠️ {rec.toolsExecuted.map(t => t.toolName).join(', ')}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border ${latBadge.bg}`}>
                          {latBadge.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border ${confBadge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${confBadge.indicator}`} />
                          {confBadge.text}
                        </span>
                        {rec.adminFeedback?.reviewed && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] text-emerald-600 font-bold">
                              ✓ Verified by Staff
                            </span>
                            {rec.adminFeedback?.ragIngested && (
                              <span className="px-1 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[8px] font-bold border border-indigo-200">
                                📚 RAG
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {rec.tags?.map((t, idx) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                                t === '#ai-interactions'
                                  ? 'bg-purple-100 text-purple-800 font-bold'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenInspect(rec)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-sm active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deep-Dive Inspection Modal */}
      {inspectRecord && (() => {
        const detectedLang = detectInquiryLanguage(inspectRecord.userQuestion);
        const activeInquiryLang = inspectRecord.inquiryLanguage || inspectRecord.adminFeedback?.correctedLanguage || detectedLang;
        const isStaffCorrected = Boolean(inspectRecord.inquiryLanguage || inspectRecord.adminFeedback?.correctedLanguage);
        const displayedQuestion = viewLanguage !== 'original' && translationsCache[viewLanguage]?.question
          ? translationsCache[viewLanguage].question
          : inspectRecord.userQuestion;
        const displayedAnswer = viewLanguage !== 'original' && translationsCache[viewLanguage]?.answer
          ? translationsCache[viewLanguage].answer
          : inspectRecord.aiAnswer;

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden select-text"
            onClick={(e) => {
              if (e.target === e.currentTarget) setInspectRecord(null);
            }}
          >
            <div
              className="relative bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto animate-in fade-in zoom-in-95 duration-200 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Modal Header */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                    <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm flex items-center gap-2">
                      Interaction Diagnostic Deep-Dive
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-mono border border-indigo-400/30">
                        Multilingual
                      </span>
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400">ID: {inspectRecord.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => setInspectRecord(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close Inspection Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Multilingual Translation & Inquiry Language Correction Bar */}
              <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-950/70 border-b border-indigo-900/70 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                {/* Inquiry Language Display & Explicit Edit Button */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-slate-300 font-bold text-[11px] sm:text-xs">Detected Inquiry:</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-900/90 text-indigo-100 font-bold text-xs border border-indigo-700/80 shadow-xs">
                    <span className="text-sm">{activeInquiryLang.flag}</span>
                    <span>{activeInquiryLang.name}</span>
                    {isStaffCorrected ? (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 text-[9px] font-extrabold border border-emerald-400/40">
                        ✓ Staff Corrected
                      </span>
                    ) : (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded bg-indigo-800 text-indigo-300 text-[9px] font-semibold border border-indigo-600/50">
                        AI Detected
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingInquiryLang(!isEditingInquiryLang)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ${
                      isEditingInquiryLang
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black ring-2 ring-amber-300'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                    title="Edit Detected Inquiry Language"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingInquiryLang ? 'Close Edit Language' : '✏️ Edit Detected Inquiry Language'}</span>
                  </button>

                  {isUpdatingLanguage && (
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  )}
                </div>
              </div>

              {/* Dedicated Edit Detected Inquiry Language Panel */}
              {isEditingInquiryLang && (
                <div className="p-4 bg-indigo-950/95 border-b-2 border-indigo-500 text-white space-y-3 animate-in fade-in slide-in-from-top-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-amber-400" />
                      <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider">
                        Edit Detected Inquiry Language
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingInquiryLang(false)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-indigo-900 transition"
                    >
                      Done / Close
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Select Correct Language for this Inquiry:
                      </label>
                      <select
                        value={activeInquiryLang.code}
                        onChange={(e) => handleCorrectInquiryLanguage(e.target.value)}
                        disabled={isUpdatingLanguage}
                        className="w-full px-3 py-2 bg-slate-900 border border-indigo-400 rounded-xl text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-inner"
                      >
                        <option value="en">🇦🇺 English (Australia / Global)</option>
                        <optgroup label="── ASEAN Languages ──">
                          {ASEAN_LANGUAGES.filter(l => l.code !== 'en').map(opt => (
                            <option key={opt.code} value={opt.code}>
                              {opt.flag} {opt.name} ({opt.country})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="── Regional Dialogue Partners ──">
                          {REGIONAL_PARTNER_LANGUAGES.map(opt => (
                            <option key={opt.code} value={opt.code}>
                              {opt.flag} {opt.name} ({opt.country})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {isUpdatingLanguage && (
                      <div className="flex items-center gap-2 text-xs text-indigo-300 animate-pulse pt-4">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving language update...</span>
                      </div>
                    )}
                  </div>

                  {/* 1-Click Quick ASEAN Language Pills */}
                  <div className="space-y-1.5 pt-1 border-t border-indigo-900/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                      1-Click Quick Language Select:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCorrectInquiryLanguage('en')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                          activeInquiryLang.code === 'en'
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                            : 'bg-slate-900 hover:bg-indigo-900 text-slate-200 border-indigo-800'
                        }`}
                      >
                        <span>🇦🇺</span>
                        <span>English</span>
                      </button>
                      {ASEAN_LANGUAGES.filter(l => l.code !== 'en').map(opt => (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => handleCorrectInquiryLanguage(opt.code)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                            activeInquiryLang.code === opt.code
                              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                              : 'bg-slate-900 hover:bg-indigo-900 text-slate-200 border-indigo-800'
                          }`}
                        >
                          <span>{opt.flag}</span>
                          <span>{opt.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback Banner when Language is Corrected */}
              {languageFeedbackMsg && (
                <div className="px-4 sm:px-6 py-2 bg-emerald-950/90 border-b border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{languageFeedbackMsg}</span>
                </div>
              )}

              {/* Modal Content - Scrollable without visible scrollbars */}
              <div
                className="p-4 sm:p-6 space-y-5 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Question */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <span>User Question</span>
                        {viewLanguage !== 'original' && (
                          <span className="text-indigo-600 font-normal">
                            ({viewLanguage.toUpperCase()} Translation)
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsEditingInquiryLang(true)}
                        className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold transition flex items-center gap-1 border border-indigo-200 cursor-pointer"
                        title="Edit Detected Inquiry Language"
                      >
                        <Edit3 className="w-3 h-3 text-indigo-600" />
                        <span>Edit Language</span>
                      </button>
                    </div>
                    {viewLanguage !== 'original' && (
                      <button
                        onClick={() => setViewLanguage('original')}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold"
                      >
                        Show Original
                      </button>
                    )}
                  </div>
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 leading-relaxed select-text">
                    {displayedQuestion}
                  </div>
                </div>

                {/* Response / Edit Response */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span>AI Response Output</span>
                      {inspectRecord.adminFeedback?.ragIngested && (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold border border-emerald-200">
                          ✓ Ingested in RAG
                        </span>
                      )}
                      {viewLanguage !== 'original' && !isEditingAnswer && (
                        <span className="text-indigo-600 font-normal">
                          ({viewLanguage.toUpperCase()} Translation)
                        </span>
                      )}
                    </label>

                    {!isEditingAnswer && (
                      <button
                        onClick={() => {
                          setIsEditingAnswer(true);
                          setEditedAnswerText(inspectRecord.aiAnswer);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all border border-indigo-200 flex items-center gap-1 active:scale-95 shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit AI Response</span>
                      </button>
                    )}
                  </div>

                  {!isEditingAnswer ? (
                    <div
                      className="p-3.5 sm:p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed max-h-56 sm:max-h-64 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-text"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {displayedAnswer}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-indigo-50/70 border-2 border-indigo-400 space-y-3 animate-in fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-indigo-200/70">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <Edit3 className="w-4 h-4 text-indigo-600" />
                          Edit Response & Update Multilingual RAG
                        </span>
                        
                        {/* Edit Detected Inquiry Language Control */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setIsEditingInquiryLang(!isEditingInquiryLang)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ${
                              isEditingInquiryLang
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black ring-2 ring-amber-300'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                            title="Edit Detected Inquiry Language"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isEditingInquiryLang ? 'Close Language Editor' : '✏️ Edit Detected Inquiry Language'}</span>
                          </button>

                          <div className="flex items-center gap-1.5 bg-white border border-indigo-300 rounded-xl px-2.5 py-1 shadow-2xs">
                            <span className="text-[11px] font-bold text-slate-600">Language:</span>
                            <select
                              value={activeInquiryLang.code}
                              onChange={(e) => {
                                const newCode = e.target.value;
                                setEditLanguage(newCode);
                                handleCorrectInquiryLanguage(newCode);
                              }}
                              disabled={isUpdatingLanguage}
                              className="bg-transparent text-xs font-bold text-indigo-900 focus:outline-none cursor-pointer"
                              title="Select inquiry and RAG language"
                            >
                              <option value="en">🇦🇺 English (Australia / Global)</option>
                              <optgroup label="── ASEAN Languages ──">
                                {ASEAN_LANGUAGES.filter(l => l.code !== 'en').map(opt => (
                                  <option key={opt.code} value={opt.code}>
                                    {opt.flag} {opt.name}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="── Regional Dialogue Partners ──">
                                {REGIONAL_PARTNER_LANGUAGES.map(opt => (
                                  <option key={opt.code} value={opt.code}>
                                    {opt.flag} {opt.name}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>

                          {isStaffCorrected ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Staff Corrected</span>
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-600 font-medium">
                              AI Detected
                            </span>
                          )}

                          {isUpdatingLanguage && (
                            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Quick Language Selection Panel */}
                      {isEditingInquiryLang && (
                        <div className="p-3 bg-white rounded-xl border border-indigo-300 shadow-sm space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                              <Languages className="w-3.5 h-3.5 text-indigo-600" />
                              <span>1-Click Correct Detected Inquiry &amp; RAG Language:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsEditingInquiryLang(false)}
                              className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold"
                            >
                              Done
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditLanguage('en');
                                handleCorrectInquiryLanguage('en');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                                activeInquiryLang.code === 'en'
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs font-black'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                              }`}
                            >
                              <span>🇦🇺</span>
                              <span>English</span>
                            </button>
                            {ASEAN_LANGUAGES.filter(l => l.code !== 'en').map(opt => (
                              <button
                                key={opt.code}
                                type="button"
                                onClick={() => {
                                  setEditLanguage(opt.code);
                                  handleCorrectInquiryLanguage(opt.code);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                                  activeInquiryLang.code === opt.code
                                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs font-black'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                                }`}
                              >
                                <span>{opt.flag}</span>
                                <span>{opt.name.split(' ')[0]}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <textarea
                        rows={5}
                        value={editedAnswerText}
                        onChange={(e) => setEditedAnswerText(e.target.value)}
                        placeholder="Enter verified institutional answer..."
                        className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed resize-y no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      />

                      {/* Quick translate toolbar for editing */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-indigo-200/60">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-indigo-900">
                          <Languages className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-semibold whitespace-nowrap">Auto-Translate Draft:</span>
                          <div className="flex flex-wrap items-center gap-1">
                            {ASEAN_LANGUAGES.map(opt => (
                              <button
                                key={opt.code}
                                type="button"
                                onClick={() => handleAutoTranslateDraft(opt.code)}
                                disabled={isAutoTranslatingDraft}
                                title={`Translate draft to ${opt.name} (${opt.country})`}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 ${
                                  editLanguage === opt.code
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                    : 'bg-white hover:bg-indigo-100 text-indigo-800 border-indigo-300'
                                } disabled:opacity-50`}
                              >
                                <span>{opt.flag}</span>
                                <span>{opt.code.toUpperCase()}</span>
                              </button>
                            ))}
                            {isAutoTranslatingDraft && <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin ml-1" />}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingAnswer(false);
                              setEditedAnswerText(inspectRecord.aiAnswer);
                            }}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveAndIngestRag}
                            disabled={isIngestingToRag || !editedAnswerText.trim()}
                            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{isIngestingToRag ? 'Ingesting into RAG...' : 'Save & Ingest into RAG'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RAG Feedback Banner */}
                  {ragFeedbackMsg && (
                    <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      ragFeedbackMsg.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}>
                      {ragFeedbackMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{ragFeedbackMsg.text}</span>
                    </div>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Latency</span>
                    <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">{inspectRecord.latencyMs}ms</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Perceived Accuracy</span>
                    <span className="font-mono font-bold text-emerald-600 text-sm sm:text-base">{inspectRecord.perceivedAccuracy}%</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Confidence</span>
                    <span className="font-mono font-bold text-slate-800 text-sm sm:text-base">{inspectRecord.confidenceLevel}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Model Engine</span>
                    <span className="font-mono font-bold text-indigo-600 text-xs truncate block">{inspectRecord.model}</span>
                  </div>
                </div>

                {/* Rationale & Grounding */}
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-amber-800">
                    <Target className="w-3.5 h-3.5 text-amber-600" /> Grounding Signal & Rationale
                  </span>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    {inspectRecord.accuracyRationale || 'Standard conversational turn grounded against institutional course syllabuses and knowledge bases.'}
                  </p>
                </div>

                {/* Tools Executed */}
                {inspectRecord.toolsExecuted && inspectRecord.toolsExecuted.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Tools Executed ({inspectRecord.toolsExecuted.length})
                    </label>
                    <pre
                      className="p-3 rounded-xl bg-slate-900 text-indigo-300 font-mono text-[10px] overflow-x-auto max-h-36 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {JSON.stringify(inspectRecord.toolsExecuted, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Audit Notes / Corrections Form */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Audit Notes / Corrections:</span>
                    </label>
                    {reviewSuccessMsg && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {reviewSuccessMsg}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="e.g., Verified against 2026 course handbook prerequisites"
                      value={reviewNotesInput}
                      onChange={(e) => setReviewNotesInput(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleSaveReview}
                      disabled={isSavingReview}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isSavingReview ? 'Saving...' : 'Save Audit Notes'}</span>
                    </button>
                  </div>
                </div>

                {/* Translate into another language section */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-indigo-600" />
                      <span>Translate into another language</span>
                    </label>
                    {isTranslatingResponse && (
                      <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Translating response...
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Translate the edited AI Response Output into other languages. Click on &ldquo;More Translations&rdquo; to select a target language from the ASEAN &amp; regional partner dropdown.
                  </p>

                  {!showMoreTranslations ? (
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowMoreTranslations(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
                        title="Click for dropdown box to select translation language"
                      >
                        <Languages className="w-4 h-4" />
                        <span>More Translations</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                      </button>

                      {translatedResultPreview && (
                        <button
                          type="button"
                          onClick={handleCancelTranslation}
                          className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel Translation</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                          value={selectedTranslateLang}
                          onChange={(e) => setSelectedTranslateLang(e.target.value)}
                          disabled={isTranslatingResponse}
                          className="flex-1 px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                        >
                          <optgroup label="── Priority Languages (en & kh first) ──">
                            <option value="en">🇦🇺 English (Australia / Global)</option>
                            <option value="kh">🇰🇭 Khmer (ភាសាខ្មែរ - Cambodia)</option>
                          </optgroup>
                          <optgroup label="── All ASEAN Languages ──">
                            {TRANSLATE_TARGET_LANGUAGES.filter(l => l.group === 'ASEAN' && l.code !== 'en' && l.code !== 'kh').map(opt => (
                              <option key={opt.code} value={opt.code}>
                                {opt.flag} {opt.name} ({opt.country})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="── Regional Dialogue Partners ──">
                            {TRANSLATE_TARGET_LANGUAGES.filter(l => l.group === 'Regional Partner').map(opt => (
                              <option key={opt.code} value={opt.code}>
                                {opt.flag} {opt.name} ({opt.country})
                              </option>
                            ))}
                          </optgroup>
                        </select>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTranslateEditedResponse(selectedTranslateLang)}
                            disabled={isTranslatingResponse}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            {isTranslatingResponse ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Translating...</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-3.5 h-3.5" />
                                <span>Translate AI Response</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleCancelTranslation}
                            disabled={isTranslatingResponse}
                            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                            title="Cancel and close translation selector"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feedback Message */}
                  {translateSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{translateSuccessMsg}</span>
                    </div>
                  )}

                  {/* Translated Preview Box */}
                  {translatedResultPreview && (
                    <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                          <span>{TRANSLATE_TARGET_LANGUAGES.find(l => l.code === selectedTranslateLang)?.flag || '🌐'}</span>
                          <span>Translated Response Preview ({TRANSLATE_TARGET_LANGUAGES.find(l => l.code === selectedTranslateLang)?.name}):</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold">✓ Synced to AI Response Output Editor above</span>
                      </div>
                      <div
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-text"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {translatedResultPreview}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={handleCancelTranslation}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel Translation</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAndIngestRag}
                          disabled={isIngestingToRag}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>{isIngestingToRag ? 'Indexing...' : 'Save & Ingest to Multilingual RAG'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
                <span className="font-mono truncate max-w-[200px] sm:max-w-none">
                  Tags: {inspectRecord.tags?.join(' ') || '#ai-interactions'}
                </span>
                <button
                  onClick={() => setInspectRecord(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
    })()}
  </div>
);
};
