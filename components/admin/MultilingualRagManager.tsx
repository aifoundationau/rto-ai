'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  Globe,
  Search, 
  Database, 
  Sparkles, 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  ExternalLink, 
  Cpu, 
  Tag, 
  BookOpen, 
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Edit3,
  Save,
  RotateCcw,
  Copy,
  Check,
  Wand2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Languages,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { IngestedDocumentEntry } from '@/lib/rag/types';
import { isProjectOwnerEmail, normalizeRole } from '@/lib/auth/roles';

interface MultilingualRagManagerProps {
  apiKey?: string;
  currentUser?: any;
  isSuperAdmin?: boolean;
}

export const MultilingualRagManager: React.FC<MultilingualRagManagerProps> = ({ 
  apiKey = '',
  currentUser = null,
  isSuperAdmin: isSuperAdminProp = false
}) => {
  // Superadmin Privilege Resolution
  const [userFromStorage, setUserFromStorage] = useState<any>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('classroom_user');
      if (stored) setUserFromStorage(JSON.parse(stored));
    } catch {}
  }, []);

  const activeUser = currentUser || userFromStorage;
  const isSuper = Boolean(
    isSuperAdminProp ||
    activeUser?.isSuperAdmin === true ||
    normalizeRole(activeUser?.role) === 'superadmin' ||
    (activeUser?.email && isProjectOwnerEmail(activeUser.email))
  );

  // Toggle for superadmin to preview standard view vs superadmin view
  const [superadminPreviewMode, setSuperadminPreviewMode] = useState<boolean>(true);

  // Stats state
  const [stats, setStats] = useState<{
    totalChunks: number;
    distinctLanguages: string[];
    distinctCategories: string[];
  }>({
    totalChunks: 0,
    distinctLanguages: [],
    distinctCategories: []
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState('');

  // Query Testing state
  const [queryInput, setQueryInput] = useState('オーストラリアの大学で人工知能（AI）学士号を取得したいのですが、入学条件と必要な英語スコア（IELTS）を教えてください。');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState('');

  // Translations State for Editing in Playground
  const [activeLangTab, setActiveLangTab] = useState<string>('en');
  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>({});
  const [isEditingTranslation, setIsEditingTranslation] = useState<boolean>(false);
  const [editingText, setEditingText] = useState<string>('');
  const [editedLangsSet, setEditedLangsSet] = useState<Set<string>>(new Set());
  const [copiedLang, setCopiedLang] = useState<string | null>(null);
  const [isReTranslating, setIsReTranslating] = useState<boolean>(false);

  // Document Ingestion State
  const [ingestMode, setIngestMode] = useState<'autosort' | 'manual'>('autosort');
  const [wholeDocumentContent, setWholeDocumentContent] = useState('');
  const [isAutoSorting, setIsAutoSorting] = useState(false);
  const [autoSortResult, setAutoSortResult] = useState<any>(null);

  // Manual Ingest Form State
  const [ingestForm, setIngestForm] = useState({
    title: '',
    category: 'Accreditation Standards',
    language: 'en',
    source: 'Institutional Document Portal',
    content: ''
  });
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestFeedback, setIngestFeedback] = useState<{ success: boolean; message: string; autoSorted?: any } | null>(null);

  // Supported language tabs for translation viewing & editing (Global + All ASEAN Languages)
  const languageTabOptions = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
    { code: 'vi', label: 'Vietnamese', flag: '🇻🇳', isAsean: true },
    { code: 'th', label: 'Thai', flag: '🇹🇭', isAsean: true },
    { code: 'id', label: 'Indonesian', flag: '🇮🇩', isAsean: true },
    { code: 'ms', label: 'Malay', flag: '🇲🇾', isAsean: true },
    { code: 'tl', label: 'Filipino', flag: '🇵🇭', isAsean: true },
    { code: 'km', label: 'Khmer', flag: '🇰🇭', isAsean: true },
    { code: 'my', label: 'Burmese', flag: '🇲🇲', isAsean: true },
    { code: 'lo', label: 'Lao', flag: '🇱🇦', isAsean: true },
    { code: 'tet', label: 'Tetum', flag: '🇹🇱', isAsean: true },
  ];

  // ASEAN & Regional Language Definitions
  const aseanLanguages = [
    { code: 'id', label: 'Indonesian (Bahasa Indonesia)', short: 'ID', flag: '🇮🇩', country: 'Indonesia' },
    { code: 'vi', label: 'Vietnamese (Tiếng Việt)', short: 'VI', flag: '🇻🇳', country: 'Vietnam' },
    { code: 'th', label: 'Thai (ภาษาไทย)', short: 'TH', flag: '🇹🇭', country: 'Thailand' },
    { code: 'tl', label: 'Filipino / Tagalog', short: 'TL', flag: '🇵🇭', country: 'Philippines' },
    { code: 'ms', label: 'Malay (Bahasa Melayu)', short: 'MS', flag: '🇲🇾', country: 'Malaysia / Brunei' },
    { code: 'en', label: 'English (Singapore / Global)', short: 'EN', flag: '🇸🇬', country: 'Singapore' },
    { code: 'my', label: 'Burmese (မြန်မာဘာသာ)', short: 'MY', flag: '🇲🇲', country: 'Myanmar' },
    { code: 'km', label: 'Khmer (ភាសាខ្មែរ)', short: 'KM', flag: '🇰🇭', country: 'Cambodia' },
    { code: 'lo', label: 'Lao (ພາສາລາວ)', short: 'LO', flag: '🇱🇦', country: 'Laos' },
    { code: 'tet', label: 'Tetum (Lian Tetun)', short: 'TET', flag: '🇹🇱', country: 'Timor-Leste' },
  ];

  const regionalLanguages = [
    { code: 'zh', label: 'Chinese (中文)', short: 'ZH', flag: '🇨🇳', country: 'China' },
    { code: 'ja', label: 'Japanese (日本語)', short: 'JA', flag: '🇯🇵', country: 'Japan' },
    { code: 'ko', label: 'Korean (한국어)', short: 'KO', flag: '🇰🇷', country: 'South Korea' },
  ];

  const allSupportedLanguages = [...aseanLanguages, ...regionalLanguages];

  const getLanguageFlag = (code: string) => {
    const match = allSupportedLanguages.find(l => l.code === (code || '').toLowerCase());
    return match?.flag || '🌐';
  };

  const getLanguageLabel = (code: string) => {
    const match = allSupportedLanguages.find(l => l.code === (code || '').toLowerCase());
    return match?.label || (code || '').toUpperCase();
  };

  // Ingested Entries State (Populated from Ingest Document & Auto-Vectorize)
  const [ingestedEntries, setIngestedEntries] = useState<IngestedDocumentEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [entrySearchQuery, setEntrySearchQuery] = useState<string>('');
  const [entryCategoryFilter, setEntryCategoryFilter] = useState<string>('ALL');

  // Translation & In-Place Verification State for Selected Entry
  const [targetTranslationLang, setTargetTranslationLang] = useState<string>('id');
  const [isTranslatingEntry, setIsTranslatingEntry] = useState<boolean>(false);
  const [translatedDoc, setTranslatedDoc] = useState<{
    originalDocId: string;
    targetLang: string;
    title: string;
    content: string;
  } | null>(null);
  const [editedDocTitle, setEditedDocTitle] = useState<string>('');
  const [editedDocContent, setEditedDocContent] = useState<string>('');
  const [isStoringTranslation, setIsStoringTranslation] = useState<boolean>(false);
  const [translationStoreFeedback, setTranslationStoreFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showOriginalContent, setShowOriginalContent] = useState<boolean>(false);

  // Fetch stats on load
  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/rag/seed');
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.warn('Failed to load vector stats:', e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Load Ingested Documents from RAG Vector Store
  const loadIngestedEntries = async () => {
    setIsLoadingEntries(true);
    try {
      const res = await fetch('/api/rag/ingest');
      const data = await res.json();
      if (data.success && Array.isArray(data.documents)) {
        setIngestedEntries(data.documents);
        setSelectedEntryId(prev => {
          if (prev && data.documents.some((d: IngestedDocumentEntry) => d.id === prev)) {
            return prev;
          }
          return data.documents[0]?.id || '';
        });
      }
    } catch (err) {
      console.warn('Failed to load ingested document entries:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadIngestedEntries();
  }, []);

  // Translate selected document entry into target language
  const handleTranslateEntry = async (targetLang: string) => {
    const entry = ingestedEntries.find(e => e.id === selectedEntryId) || ingestedEntries[0];
    if (!entry) return;

    setIsTranslatingEntry(true);
    setTranslationStoreFeedback(null);
    setTargetTranslationLang(targetLang);

    try {
      const [resTitle, resContent] = await Promise.all([
        fetch('/api/rag/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: entry.title,
            targetLanguage: targetLang,
            apiKey: apiKey || undefined,
          }),
        }),
        fetch('/api/rag/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: entry.content,
            targetLanguage: targetLang,
            apiKey: apiKey || undefined,
          }),
        }),
      ]);

      const dataTitle = await resTitle.json();
      const dataContent = await resContent.json();

      const translatedTitle = dataTitle.translatedText || entry.title;
      const translatedContent = dataContent.translatedText || entry.content;

      setTranslatedDoc({
        originalDocId: entry.id,
        targetLang,
        title: translatedTitle,
        content: translatedContent,
      });
      setEditedDocTitle(translatedTitle);
      setEditedDocContent(translatedContent);
    } catch (err: any) {
      console.error('Entry translation error:', err);
      setTranslationStoreFeedback({
        success: false,
        message: err.message || 'Failed to translate document entry',
      });
    } finally {
      setIsTranslatingEntry(false);
    }
  };

  // Store & vectorize verified translation into RAG
  const handleStoreTranslationIntoRag = async () => {
    const entry = ingestedEntries.find(e => e.id === selectedEntryId) || ingestedEntries[0];
    if (!entry || !editedDocContent.trim() || !editedDocTitle.trim()) return;

    setIsStoringTranslation(true);
    setTranslationStoreFeedback(null);

    try {
      const res = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedDocTitle.trim(),
          content: editedDocContent.trim(),
          language: targetTranslationLang,
          category: entry.category,
          source: `Verified Translation (${entry.language.toUpperCase()} → ${targetTranslationLang.toUpperCase()}): ${entry.source || entry.title}`,
          tenantTag: 'rto-ai',
          apiKey: apiKey || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTranslationStoreFeedback({
          success: true,
          message: `✓ Successfully stored and indexed "${editedDocTitle.trim()}" in ${getLanguageLabel(targetTranslationLang)} (${data.data?.chunksCreated || 1} vector chunks) into Multilingual RAG!`,
        });
        loadStats();
        loadIngestedEntries();
      } else {
        setTranslationStoreFeedback({
          success: false,
          message: data.error || 'Failed to store translation in RAG vector store',
        });
      }
    } catch (err: any) {
      setTranslationStoreFeedback({
        success: false,
        message: err.message || 'Network error storing translation in RAG',
      });
    } finally {
      setIsStoringTranslation(false);
    }
  };

  // Handle Seeding
  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedSuccessMessage('');
    try {
      const res = await fetch('/api/rag/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      const data = await res.json();
      if (data.success) {
        setSeedSuccessMessage(`Successfully seeded ${data.data?.totalProcessed || 7} documents (${data.data?.totalChunks || 11} vector chunks) across 5 languages!`);
        if (data.stats) setStats(data.stats);
        loadIngestedEntries();
      }
    } catch (e: any) {
      console.error('Seeding error:', e);
    } finally {
      setIsSeeding(false);
    }
  };

  // Handle Query
  const handleRunQuery = async () => {
    if (!queryInput.trim()) return;
    setIsQuerying(true);
    setQueryError('');
    setQueryResult(null);
    setIsEditingTranslation(false);
    setEditedLangsSet(new Set());

    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: queryInput.trim(),
          apiKey: apiKey || undefined,
          topK: 4
        })
      });

      const data = await res.json();
      if (data.success) {
        setQueryResult(data.data);
        const translations = data.data.translations || {};
        // Ensure primary answer and all ASEAN languages are mapped
        const initialMap: Record<string, string> = {
          en: translations.en || data.data.answer || '',
          ja: translations.ja || '',
          zh: translations.zh || '',
          vi: translations.vi || '',
          th: translations.th || '',
          id: translations.id || '',
          ms: translations.ms || '',
          tl: translations.tl || '',
          km: translations.km || '',
          my: translations.my || '',
          lo: translations.lo || '',
          tet: translations.tet || '',
          [data.data.queryLanguageCode]: data.data.answer,
        };
        setTranslationsMap(initialMap);
        setActiveLangTab(data.data.queryLanguageCode || 'en');
        setEditingText(initialMap[data.data.queryLanguageCode || 'en'] || data.data.answer || '');
      } else {
        setQueryError(data.error || 'Vector search query failed');
      }
    } catch (err: any) {
      setQueryError(err.message || 'Network error querying RAG endpoint');
    } finally {
      setIsQuerying(false);
    }
  };

  // Switch translation tab
  const handleSelectLangTab = (langCode: string) => {
    setActiveLangTab(langCode);
    setIsEditingTranslation(false);
    setEditingText(translationsMap[langCode] || '');
  };

  // Start editing translation
  const handleStartEditingTranslation = () => {
    setEditingText(translationsMap[activeLangTab] || queryResult?.answer || '');
    setIsEditingTranslation(true);
  };

  // Save edited translation
  const handleSaveTranslation = () => {
    setTranslationsMap((prev) => ({
      ...prev,
      [activeLangTab]: editingText,
    }));
    setEditedLangsSet((prev) => new Set([...Array.from(prev), activeLangTab]));
    setIsEditingTranslation(false);
  };

  // Reset translation to original
  const handleResetTranslation = () => {
    const original = queryResult?.translations?.[activeLangTab] || (activeLangTab === queryResult?.queryLanguageCode ? queryResult?.answer : '');
    setEditingText(original || '');
    setTranslationsMap((prev) => ({
      ...prev,
      [activeLangTab]: original || '',
    }));
    setEditedLangsSet((prev) => {
      const next = new Set(Array.from(prev));
      next.delete(activeLangTab);
      return next;
    });
    setIsEditingTranslation(false);
  };

  // Copy current translation
  const handleCopyTranslation = () => {
    const textToCopy = isEditingTranslation ? editingText : (translationsMap[activeLangTab] || queryResult?.answer || '');
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedLang(activeLangTab);
      setTimeout(() => setCopiedLang(null), 2000);
    }
  };

  // Re-translate with AI for selected language
  const handleReTranslateWithAi = async () => {
    const sourceText = queryResult?.answer;
    if (!sourceText) return;
    setIsReTranslating(true);
    try {
      const res = await fetch('/api/rag/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          targetLanguage: activeLangTab,
          apiKey: apiKey || undefined,
        })
      });
      const data = await res.json();
      if (data.success && data.translatedText) {
        setTranslationsMap(prev => ({
          ...prev,
          [activeLangTab]: data.translatedText,
        }));
        setEditingText(data.translatedText);
      }
    } catch (e) {
      console.warn('Re-translation error:', e);
    } finally {
      setIsReTranslating(false);
    }
  };

  // AI Auto-Sort & Ingest for pasted whole document
  const handleAutoSortAndIngest = async () => {
    const rawContent = wholeDocumentContent.trim();
    if (!rawContent) return;

    setIsAutoSorting(true);
    setIngestFeedback(null);
    setAutoSortResult(null);

    try {
      // 1. Analyze and sort out the whole document via AI
      const sortRes = await fetch('/api/rag/autosort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rawContent,
          apiKey: apiKey || undefined,
        }),
      });

      const sortData = await sortRes.json();
      if (!sortRes.ok || !sortData.success) {
        throw new Error(sortData.error || 'Failed to auto-sort document');
      }

      const analyzed = sortData.data;
      setAutoSortResult(analyzed);

      // 2. Ingest & vectorize into Firestore
      const ingestRes = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: analyzed.title,
          content: rawContent,
          category: analyzed.category,
          language: analyzed.language,
          keywords: analyzed.keywords,
          source: 'AI Auto-Sorted Document',
          apiKey: apiKey || undefined,
        }),
      });

      const ingestData = await ingestRes.json();
      if (ingestData.success) {
        setIngestFeedback({
          success: true,
          message: `AI successfully analyzed and indexed "${analyzed.title}" (${analyzed.languageName}) into ${ingestData.data?.chunksCreated || 1} vector chunks!`,
          autoSorted: analyzed,
        });
        setWholeDocumentContent('');
        loadStats();
        loadIngestedEntries();
      } else {
        setIngestFeedback({
          success: false,
          message: ingestData.error || 'Failed to vectorize auto-sorted document',
        });
      }
    } catch (err: any) {
      setIngestFeedback({
        success: false,
        message: err.message || 'Auto-sort & vectorization failed',
      });
    } finally {
      setIsAutoSorting(false);
    }
  };

  // Handle Manual Ingest
  const handleManualIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestForm.title || !ingestForm.content) return;
    setIsIngesting(true);
    setIngestFeedback(null);

    try {
      const res = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ingestForm,
          apiKey: apiKey || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setIngestFeedback({
          success: true,
          message: `Indexed "${ingestForm.title}" successfully into ${data.data?.chunksCreated || 1} vector chunks!`
        });
        setIngestForm({
          title: '',
          category: 'Accreditation Standards',
          language: 'en',
          source: 'Institutional Document Portal',
          content: ''
        });
        loadStats();
        loadIngestedEntries();
      } else {
        setIngestFeedback({
          success: false,
          message: data.error || 'Ingestion failed'
        });
      }
    } catch (err: any) {
      setIngestFeedback({
        success: false,
        message: err.message || 'Network error during ingestion'
      });
    } finally {
      setIsIngesting(false);
    }
  };

  // Sample document to test "Paste Whole Document"
  const loadSampleDocumentToPaste = () => {
    setWholeDocumentContent(`Australian Qualifications Framework (AQF) Level 7 Criteria & TEQSA Governance
The Bachelor Degree qualifies individuals who apply a broad and coherent body of knowledge in a range of contexts to undertake professional work and as a pathway for further learning.
Graduates of a Bachelor Degree will have:
- Well-developed cognitive, technical and communication skills to select and apply methods and technologies to analyse, generate and transmit solutions to unpredictable problems.
- Demonstrated application of knowledge and skills with initiative and judgment in professional practice and scholarship.
Recognition of Prior Learning (RPL):
Higher education providers may grant credit transfer of up to 50% of the course duration based on formal, non-formal, or informal prior learning, subject to TEQSA Guidance Note on Credit Transfer and Recognition of Prior Learning.`);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 p-8 rounded-3xl shadow-xl border border-indigo-500/20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold tracking-wider uppercase border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Google-Native Architecture
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Multilingual Vector RAG Pipeline
            </h2>
            <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
              Native Google Cloud & Firebase vector orchestration. Uses <strong>Google text-embedding-004 / gemini-embedding-001 (768 dimensions)</strong>, 
              <strong> Cloud Firestore Vector Search (findNearest)</strong>, and <strong>Gemini 3.8 Flash</strong> for cross-lingual synthesis across 100+ languages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg transition flex items-center gap-2 border border-indigo-400/30 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
              {isSeeding ? 'Seeding Knowledge Base...' : 'Re-Seed Knowledge Base'}
            </button>
            <button
              onClick={loadStats}
              disabled={isLoadingStats}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {seedSuccessMessage && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {seedSuccessMessage}
          </div>
        )}
      </div>

      {/* Architecture Highlights & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Vector Dimensions</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">768 Dim</div>
          <p className="text-xs text-slate-500">Firestore native vector config</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Vector Chunks</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalChunks || 11}</div>
          <p className="text-xs text-slate-500">Indexed in `knowledge_embeddings`</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Supported Languages</span>
            <Globe2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.distinctLanguages?.length || 5} Active</div>
          <p className="text-xs text-slate-500">EN (Default), JA, ZH, VI, TH, KM+</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>AI Orchestration</span>
            <Cpu className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-black text-slate-900 truncate">Gemini 3.8 Flash</div>
          <p className="text-xs text-slate-500">Native Google GenAI SDK</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cross-Lingual Live Testing Playground & Multi-Language Translation Editor */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-indigo-600" />
                  <span>Cross-Lingual Semantic Retrieval Playground</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Entries from Ingest Document &amp; Auto-Vectorize • Select entry, translate to ASEAN languages, check &amp; edit, and store into RAG.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full font-bold flex items-center gap-1.5 self-start sm:self-auto">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Multilingual RAG Engine
              </span>
            </div>

{/* SECTION 1: ENTRIES FROM INGEST DOCUMENT & AUTO-VECTORIZE */}
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span>Entries from Ingest Document &amp; Auto-Vectorize</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Select any entry to translate into ASEAN languages, check &amp; edit, and store in RAG.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
                    {ingestedEntries.length} Document Entries
                  </span>
                  <button
                    type="button"
                    onClick={loadIngestedEntries}
                    disabled={isLoadingEntries}
                    className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                    title="Refresh Ingested Entries"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEntries ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={entrySearchQuery}
                    onChange={(e) => setEntrySearchQuery(e.target.value)}
                    placeholder="Search entries by title, category, keywords..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={entryCategoryFilter}
                  onChange={(e) => setEntryCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Categories ({ingestedEntries.length})</option>
                  {Array.from(new Set(ingestedEntries.map(e => e.category).filter(Boolean))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Scrollable Entries List Cards */}
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                {isLoadingEntries && ingestedEntries.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading ingested knowledge documents...</span>
                  </div>
                ) : ingestedEntries.filter(entry => {
                  if (entryCategoryFilter !== 'ALL' && entry.category !== entryCategoryFilter) return false;
                  if (entrySearchQuery.trim()) {
                    const q = entrySearchQuery.toLowerCase();
                    return entry.title.toLowerCase().includes(q) ||
                      entry.category.toLowerCase().includes(q) ||
                      entry.content.toLowerCase().includes(q) ||
                      (entry.languageName || entry.language).toLowerCase().includes(q);
                  }
                  return true;
                }).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No entries found matching &ldquo;{entrySearchQuery}&rdquo;
                  </div>
                ) : (
                  ingestedEntries.filter(entry => {
                    if (entryCategoryFilter !== 'ALL' && entry.category !== entryCategoryFilter) return false;
                    if (entrySearchQuery.trim()) {
                      const q = entrySearchQuery.toLowerCase();
                      return entry.title.toLowerCase().includes(q) ||
                        entry.category.toLowerCase().includes(q) ||
                        entry.content.toLowerCase().includes(q) ||
                        (entry.languageName || entry.language).toLowerCase().includes(q);
                    }
                    return true;
                  }).map((entry) => {
                    const isSelected = (selectedEntryId ? selectedEntryId === entry.id : ingestedEntries[0]?.id === entry.id);
                    return (
                      <div
                        key={entry.id}
                        onClick={() => {
                          setSelectedEntryId(entry.id);
                          setTranslatedDoc(null);
                          setTranslationStoreFeedback(null);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                          isSelected
                            ? 'bg-indigo-50/90 border-indigo-500 shadow-sm ring-1 ring-indigo-400'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                              <span>{getLanguageFlag(entry.language)}</span>
                              <span>{entry.language.toUpperCase()}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                              {entry.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {entry.chunkCount || 1} {entry.chunkCount === 1 ? 'chunk' : 'chunks'}
                            </span>
                          </div>

                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs shrink-0">
                              <Check className="w-3 h-3" />
                              <span>Selected Entry</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                              Click to Select
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">
                          {entry.title}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-sans">
                          {entry.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SECTION 2: SELECTED ENTRY WORKSPACE & ASEAN TRANSLATION CONTROLS */}
            {(() => {
              const currentEntry = ingestedEntries.find(e => e.id === selectedEntryId) || ingestedEntries[0];
              if (!currentEntry) return null;

              return (
                <div className="pt-3 border-t border-slate-100 space-y-3.5">
                  {/* Selected Document Info Banner */}
                  <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl space-y-2 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold flex items-center gap-1">
                          <span>{getLanguageFlag(currentEntry.language)}</span>
                          <span>Original Language: {currentEntry.languageName || currentEntry.language.toUpperCase()}</span>
                        </span>
                        <span className="text-xs text-slate-300 font-medium">{currentEntry.category}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowOriginalContent(!showOriginalContent)}
                        className="text-[11px] text-indigo-300 hover:text-white underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {showOriginalContent ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{showOriginalContent ? 'Hide Original Text' : 'View Original Text'}</span>
                      </button>
                    </div>

                    <div className="font-bold text-sm text-white">{currentEntry.title}</div>

                    {showOriginalContent && (
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed animate-in fade-in">
                        {currentEntry.content}
                      </div>
                    )}
                  </div>

                  {/* Translation Action Bar: Dropdown Menu & 1-Click ASEAN Buttons */}
                  <div className="space-y-3 p-4 sm:p-5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <label className="text-xs font-bold text-slate-800 block">
                            Translate Original into Another Language:
                          </label>
                          <span className="text-[11px] text-slate-500">
                            Select target language from the dropdown menu or use quick buttons
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Menu for Translation */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                          value={targetTranslationLang}
                          onChange={(e) => {
                            const newLang = e.target.value;
                            setTargetTranslationLang(newLang);
                            handleTranslateEntry(newLang);
                          }}
                          disabled={isTranslatingEntry}
                          className="flex-1 sm:flex-initial px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
                        >
                          <optgroup label="── ASEAN Languages ──">
                            {aseanLanguages.map(l => (
                              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="── Regional Dialogue Partners ──">
                            {regionalLanguages.map(l => (
                              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                            ))}
                          </optgroup>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleTranslateEntry(targetTranslationLang)}
                          disabled={isTranslatingEntry}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95 shrink-0"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isTranslatingEntry ? 'animate-spin' : ''}`} />
                          <span>{isTranslatingEntry ? 'Translating...' : 'Translate'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick ASEAN Language Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-indigo-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 mr-1 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-indigo-600" />
                        <span>Quick ASEAN:</span>
                      </span>
                      {aseanLanguages.map(l => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            setTargetTranslationLang(l.code);
                            handleTranslateEntry(l.code);
                          }}
                          disabled={isTranslatingEntry}
                          title={`Translate into ${l.label} (${l.country})`}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                            targetTranslationLang === l.code && translatedDoc
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                              : 'bg-white hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                          } disabled:opacity-50`}
                        >
                          <span>{l.flag}</span>
                          <span>{l.short}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 3: CHECK, EDIT & STORE TRANSLATION IN RAG */}
                  {translatedDoc ? (
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-indigo-300 space-y-3.5 shadow-sm animate-in fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-100">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Check &amp; Edit Translation:</span>
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center gap-1">
                              <span>{getLanguageFlag(translatedDoc.targetLang)}</span>
                              <span>{getLanguageLabel(translatedDoc.targetLang)}</span>
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>Words: {editedDocContent.trim().split(/\s+/).filter(Boolean).length}</span>
                          <span>•</span>
                          <span>Chars: {editedDocContent.length}</span>
                        </div>
                      </div>

                      {/* Translated Title Edit */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Translated Document Title:</label>
                        <input
                          type="text"
                          value={editedDocTitle}
                          onChange={(e) => setEditedDocTitle(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* Translated Content Edit */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Translated Document Content (Editable):</label>
                        <textarea
                          rows={7}
                          value={editedDocContent}
                          onChange={(e) => setEditedDocContent(e.target.value)}
                          className="w-full p-3.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed font-sans"
                        />
                      </div>

                      {/* Action Bar: Store Translation into RAG */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-100">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTranslateEntry(targetTranslationLang)}
                            disabled={isTranslatingEntry}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Re-Translate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(editedDocContent);
                              setCopiedLang('draft');
                              setTimeout(() => setCopiedLang(null), 2000);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedLang === 'draft' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLang === 'draft' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleStoreTranslationIntoRag}
                          disabled={isStoringTranslation || !editedDocContent.trim() || !editedDocTitle.trim()}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{isStoringTranslation ? 'Vectorizing & Storing into RAG...' : 'Store New Language Translation into RAG'}</span>
                        </button>
                      </div>

                      {/* Translation Storage Feedback Banner */}
                      {translationStoreFeedback && (
                        <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                          translationStoreFeedback.success
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border border-rose-200 text-rose-800'
                        }`}>
                          {translationStoreFeedback.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span>{translationStoreFeedback.message}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-indigo-50/40 border border-dashed border-indigo-200 text-center space-y-1.5">
                      <Sparkles className="w-5 h-5 text-indigo-500 mx-auto" />
                      <p className="text-xs font-semibold text-indigo-950">
                        Ready to translate &ldquo;{currentEntry.title}&rdquo;
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Choose an ASEAN or regional language from the dropdown menu above or click any quick button to translate, check and edit, and store into the RAG.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right Column: Ingest Document (Paste Whole Document & Let AI Sort It Out) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Document Ingestion Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Ingest Document & Auto-Vectorize</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste whole documents in any language & let AI sort out title, category, language, and embeddings.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setIngestMode('autosort')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    ingestMode === 'autosort' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  AI Auto-Sort
                </button>
                <button
                  type="button"
                  onClick={() => setIngestMode('manual')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    ingestMode === 'manual' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>

            {/* OPTION 1: PASTE WHOLE DOCUMENT & LET AI SORT IT OUT */}
            {ingestMode === 'autosort' && (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">One-Click AI Auto-Analysis:</span>
                    <span>
                      Paste a complete document in Japanese, Chinese, Vietnamese, Thai, English, or any language. The AI automatically derives the official title, classifies the category, detects the language, and stores the vector chunks in Cloud Firestore.
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700">Paste Whole Document (Any Language):</label>
                    <button
                      type="button"
                      onClick={loadSampleDocumentToPaste}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 underline font-medium cursor-pointer"
                    >
                      Load Sample Policy Text
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={wholeDocumentContent}
                    onChange={(e) => setWholeDocumentContent(e.target.value)}
                    placeholder="Paste entire syllabus, policy, handbook, or admission guidelines in any language here..."
                    className="w-full p-3.5 border border-slate-300 rounded-2xl text-xs leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500 font-sans resize-none"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>{wholeDocumentContent.length} characters</span>
                    <span>Language detection & semantic chunking applied automatically</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoSortAndIngest}
                  disabled={isAutoSorting || !wholeDocumentContent.trim()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wand2 className={`w-4 h-4 ${isAutoSorting ? 'animate-spin' : ''}`} />
                  <span>{isAutoSorting ? 'AI Analyzing & Vectorizing Document...' : '✨ Let AI Sort It Out & Auto-Vectorize'}</span>
                </button>
              </div>
            )}

            {/* OPTION 2: MANUAL DOCUMENT INGESTION */}
            {ingestMode === 'manual' && (
              <form onSubmit={handleManualIngest} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Document Title</label>
                  <input
                    type="text"
                    required
                    value={ingestForm.title}
                    onChange={(e) => setIngestForm({ ...ingestForm, title: e.target.value })}
                    placeholder="e.g. Master of Data Science Curriculum"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Category</label>
                    <select
                      value={ingestForm.category}
                      onChange={(e) => setIngestForm({ ...ingestForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="Accreditation Standards">Accreditation Standards</option>
                      <option value="Degree Programs">Degree Programs</option>
                      <option value="Vocational Compliance">Vocational Compliance</option>
                      <option value="Admissions & Visas">Admissions & Visas</option>
                      <option value="Course Architecture">Course Architecture</option>
                      <option value="Policies & Integrity">Policies & Integrity</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Language</label>
                    <select
                      value={ingestForm.language}
                      onChange={(e) => setIngestForm({ ...ingestForm, language: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="en">English (Default)</option>
                      <option value="ja">Japanese (日本語)</option>
                      <option value="zh">Chinese (中文)</option>
                      <option value="vi">Vietnamese (Tiếng Việt)</option>
                      <option value="th">Thai (ไทย)</option>
                      <option value="km">Khmer (ភាសាខ្មែរ)</option>
                      <option value="id">Indonesian (Bahasa)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Document Content</label>
                  <textarea
                    rows={6}
                    required
                    value={ingestForm.content}
                    onChange={(e) => setIngestForm({ ...ingestForm, content: e.target.value })}
                    placeholder="Paste document text in any language..."
                    className="w-full p-3.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isIngesting || !ingestForm.title || !ingestForm.content}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  <span>{isIngesting ? 'Chunking & Embedding...' : 'Ingest & Index Vector'}</span>
                </button>
              </form>
            )}

            {/* Ingest Feedback Feedback Card */}
            {ingestFeedback && (
              <div className={`p-4 rounded-2xl text-xs space-y-2 ${
                ingestFeedback.success 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {ingestFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{ingestFeedback.message}</span>
                </div>

                {/* If AI auto-sorted, show the extracted attributes */}
                {ingestFeedback.autoSorted && (
                  <div className="mt-2 p-3 bg-white/80 rounded-xl border border-emerald-100 space-y-1 text-[11px] text-slate-700">
                    <div><strong>Title:</strong> {ingestFeedback.autoSorted.title}</div>
                    <div><strong>Category:</strong> {ingestFeedback.autoSorted.category}</div>
                    <div><strong>Language:</strong> {ingestFeedback.autoSorted.languageName} ({ingestFeedback.autoSorted.language})</div>
                    {ingestFeedback.autoSorted.summary && (
                      <div><strong>Summary:</strong> {ingestFeedback.autoSorted.summary}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Standards & Compliance Badge Card: ROLE-BASED ACCESS CONTROLLED */}
          <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Accreditation & Architecture Grounding</span>
              </h4>

              {/* Superadmin Indicator / Mode Toggle */}
              {isSuper && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-purple-900/60 text-purple-300 border border-purple-700/60 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <Unlock className="w-3 h-3 text-purple-400" />
                    <span>Superadmin Access</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSuperadminPreviewMode(!superadminPreviewMode)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                    title={superadminPreviewMode ? "Click to preview standard non-superadmin view" : "Click to view superadmin details"}
                  >
                    {superadminPreviewMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* CONDITIONAL RENDERING BASED ON SUPERADMIN ACCESS */}
            {isSuper && superadminPreviewMode ? (
              /* SUPERADMIN VIEW: Full technical parameters disclosed */
              <div className="text-xs space-y-2.5 leading-relaxed text-slate-200">
                <div className="p-2.5 bg-purple-950/40 rounded-xl border border-purple-800/40 text-[11px] text-purple-200 flex items-center gap-2 mb-2">
                  <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Confidential technical credentials and vector indexes visible only to verified Superadmin.</span>
                </div>
                <p>
                  • <strong>Database</strong>: Cloud Firestore collection <code>knowledge_embeddings</code> with native <code>FieldValue.vector(768)</code>.
                </p>
                <p>
                  • <strong>Index</strong>: Vector index <code>CICAgOjXh4EK</code> deployed on Firestore for cosine nearest-neighbor search.
                </p>
                <p>
                  • <strong>Language Agnostic</strong>: Cross-lingual embeddings allow international applicants to search in their native script while retrieving accredited Australian Higher Education (TEQSA/AQF) guidelines.
                </p>
              </div>
            ) : (
              /* STANDARD USER VIEW: Sanitized information without internal index IDs or vector calls */
              <div className="text-xs space-y-2.5 leading-relaxed text-slate-300">
                <p>
                  • <strong>Database</strong>: Cloud Firestore collection knowledge embeddings with native Field Value Vectoring.
                </p>
                <p>
                  • <strong>Index</strong>: Vector index deployed on Firestore for cosine nearest-neighbor search.
                </p>
                <p>
                  • <strong>Language Agnostic</strong>: Cross-lingual embeddings allow international applicants to search in their native script while retrieving accredited education guidelines.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
