'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
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
  Languages
} from 'lucide-react';
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

  // Supported language tabs for translation viewing & editing
  const languageTabOptions = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
    { code: 'vi', label: 'Vietnamese', flag: '🇻🇳' },
    { code: 'th', label: 'Thai', flag: '🇹🇭' },
    { code: 'id', label: 'Indonesian', flag: '🇮🇩' },
  ];

  // Quick test query samples
  const sampleQueries = [
    {
      label: '🇯🇵 Japanese (AI Admission)',
      text: 'オーストラリアの大学で人工知能（AI）学士号を取得したいのですが、入学条件と必要な英語スコア（IELTS）を教えてください。'
    },
    {
      label: '🇨🇳 Chinese (AQF & RPL)',
      text: '澳大利亚学历资格框架AQF对学士学位的要求是什么？先前学习认定RPL可以减免多少学分？'
    },
    {
      label: '🇻🇳 Vietnamese (AI Pathways)',
      text: 'Điều kiện tuyển sinh và yêu cầu tiếng Anh cho chương trình Cử nhân Trí tuệ Nhân tạo tại Úc là gì?'
    },
    {
      label: '🇹🇭 Thai (Admissions & Visa)',
      text: 'เกณฑ์การรับเข้าศึกษาต่อระดับปริญญาตรีด้าน AI ในออสเตรเลียและคะแนน IELTS ขั้นต่ำคือเท่าใด?'
    },
    {
      label: '🇬🇧 English (TEQSA Standards)',
      text: 'What are the TEQSA threshold standards regarding teaching faculty qualifications and academic governance?'
    }
  ];

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

  useEffect(() => {
    loadStats();
  }, []);

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
        // Ensure primary answer is mapped
        const initialMap: Record<string, string> = {
          en: translations.en || data.data.answer || '',
          ja: translations.ja || '',
          zh: translations.zh || '',
          vi: translations.vi || '',
          th: translations.th || '',
          id: translations.id || '',
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-600" />
                  Cross-Lingual Semantic Retrieval Playground
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Query in any script & retrieve cross-lingual translations with real-time editorial control.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
                Live Query Tester
              </span>
            </div>

            {/* Quick Sample Queries */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                1-Click Multilingual Test Prompts:
              </label>
              <div className="flex flex-wrap gap-2">
                {sampleQueries.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQueryInput(sample.text)}
                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl border border-slate-200 transition font-medium text-left cursor-pointer"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                User Query (in any language):
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Ask a question in Japanese, Chinese, Vietnamese, Thai, English, etc..."
                  className="w-full p-3.5 pr-28 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none resize-none"
                />
                <button
                  type="button"
                  onClick={handleRunQuery}
                  disabled={isQuerying || !queryInput.trim()}
                  className="absolute bottom-3 right-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isQuerying ? 'Searching...' : 'Run Query'}
                </button>
              </div>
            </div>

            {queryError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{queryError}</span>
              </div>
            )}

            {/* Query Results Display & Multi-Language Translation Editor */}
            {queryResult && (
              <div className="space-y-5 pt-4 border-t border-slate-100 animate-fadeIn">
                {/* Meta stats bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-indigo-900">
                      Query Language: <strong className="text-indigo-600">{queryResult.queryLanguage}</strong> ({queryResult.queryLanguageCode})
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600">
                      Execution Time: <strong>{queryResult.executionTimeMs} ms</strong>
                    </span>
                  </div>
                  <div className="font-semibold text-emerald-700">
                    Confidence: {Math.round(queryResult.confidence * 100)}%
                  </div>
                </div>

                {/* MULTI-LANGUAGE TRANSLATIONS PANEL WITH EDITING */}
                <div className="space-y-3 bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Languages className="w-4 h-4 text-indigo-600" />
                      <span>Multiple Language Translations (Editable)</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Select language tab & click &ldquo;Edit Translation&rdquo; to customize text
                    </span>
                  </div>

                  {/* Language Selection Tabs */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                    {languageTabOptions.map((opt) => {
                      const isActive = activeLangTab === opt.code;
                      const hasTranslation = Boolean(translationsMap[opt.code]);
                      const isEdited = editedLangsSet.has(opt.code);

                      return (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => handleSelectLangTab(opt.code)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{opt.flag}</span>
                          <span>{opt.label}</span>
                          {isEdited && (
                            <span className="w-2 h-2 rounded-full bg-amber-400" title="Custom Edited by Admin" />
                          )}
                          {!hasTranslation && !isActive && (
                            <span className="text-[10px] text-slate-400 font-normal">(AI)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Translation Content & In-Place Editor */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">
                          {languageTabOptions.find(o => o.code === activeLangTab)?.label || activeLangTab.toUpperCase()} View:
                        </span>
                        {editedLangsSet.has(activeLangTab) ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold border border-amber-200">
                            Admin Verified Edit
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-bold border border-indigo-200">
                            AI Synthesis
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isEditingTranslation ? (
                          <>
                            <button
                              type="button"
                              onClick={handleStartEditingTranslation}
                              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Translation</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCopyTranslation}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-sm"
                              title="Copy to clipboard"
                            >
                              {copiedLang === activeLangTab ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedLang === activeLangTab ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleReTranslateWithAi}
                              disabled={isReTranslating}
                              className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-sm"
                              title="Re-translate with AI"
                            >
                              <Wand2 className={`w-3.5 h-3.5 ${isReTranslating ? 'animate-spin' : ''}`} />
                              <span>{isReTranslating ? 'Translating...' : 'AI Re-Translate'}</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={handleSaveTranslation}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Translation</span>
                            </button>
                            {editedLangsSet.has(activeLangTab) && (
                              <button
                                type="button"
                                onClick={handleResetTranslation}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset Original</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsEditingTranslation(false)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Content Box (View or Edit) */}
                    {isEditingTranslation ? (
                      <div className="space-y-2">
                        <textarea
                          rows={8}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          placeholder="Edit the translation text here..."
                          className="w-full p-4 bg-white border-2 border-indigo-400 rounded-xl text-sm leading-relaxed text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-sans shadow-inner"
                        />
                        <div className="flex justify-between items-center text-[11px] text-slate-400">
                          <span>Characters: {editingText.length} • Words: {editingText.trim().split(/\s+/).filter(Boolean).length}</span>
                          <span className="text-indigo-600 font-medium">Live editorial draft in progress</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-800 whitespace-pre-line max-h-96 overflow-y-auto shadow-inner">
                        {translationsMap[activeLangTab] || queryResult.answer || 'Translation loading...'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sources Retrieved */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Retrieved Cross-Lingual Context Sources ({queryResult.sources?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {queryResult.sources?.map((s: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">
                            {idx + 1}. {s.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-medium text-[10px]">
                              {s.language}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium text-[10px]">
                              Score: {s.relevanceScore}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600 line-clamp-2 italic">
                          &ldquo;{s.excerpt}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
