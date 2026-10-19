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
  ChevronUp,
  Plus,
  Trash2
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

  // Supported language tabs for translation viewing & editing (EN English / Global is always default and top of all lists)
  const languageTabOptions = [
    { code: 'en', label: 'EN English / Global', flag: '🌐' },
    { code: 'kh', label: 'Khmer', flag: '🇰🇭', isAsean: true },
    { code: 'id', label: 'Indonesian', flag: '🇮🇩', isAsean: true },
    { code: 'vi', label: 'Vietnamese', flag: '🇻🇳', isAsean: true },
    { code: 'th', label: 'Thai', flag: '🇹🇭', isAsean: true },
    { code: 'tl', label: 'Filipino', flag: '🇵🇭', isAsean: true },
    { code: 'ms', label: 'Malay', flag: '🇲🇾', isAsean: true },
    { code: 'my', label: 'Burmese', flag: '🇲🇲', isAsean: true },
    { code: 'lo', label: 'Lao', flag: '🇱🇦', isAsean: true },
    { code: 'tet', label: 'Tetum', flag: '🇹🇱', isAsean: true },
    { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
    { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  ];

  // ASEAN & Regional Language Definitions (EN English / Global is always default and top of all lists)
  const aseanLanguages = [
    { code: 'en', label: 'EN English / Global', short: 'EN', flag: '🌐', country: 'Global' },
    { code: 'kh', label: 'Khmer (ភាសាខ្មែរ - Cambodia)', short: 'KH', flag: '🇰🇭', country: 'Cambodia' },
    { code: 'id', label: 'Indonesian (Bahasa Indonesia)', short: 'ID', flag: '🇮🇩', country: 'Indonesia' },
    { code: 'vi', label: 'Vietnamese (Tiếng Việt)', short: 'VI', flag: '🇻🇳', country: 'Vietnam' },
    { code: 'th', label: 'Thai (ภาษาไทย)', short: 'TH', flag: '🇹🇭', country: 'Thailand' },
    { code: 'tl', label: 'Filipino / Tagalog (Wikang Filipino)', short: 'TL', flag: '🇵🇭', country: 'Philippines' },
    { code: 'ms', label: 'Malay (Bahasa Melayu)', short: 'MS', flag: '🇲🇾', country: 'Malaysia / Brunei' },
    { code: 'my', label: 'Burmese (မြန်မာဘာသာ)', short: 'MY', flag: '🇲🇲', country: 'Myanmar' },
    { code: 'lo', label: 'Lao (ພາສາລາວ)', short: 'LO', flag: '🇱🇦', country: 'Laos' },
    { code: 'tet', label: 'Tetum (Lian Tetun)', short: 'TET', flag: '🇹🇱', country: 'Timor-Leste' },
  ];

  const regionalLanguages = [
    { code: 'zh', label: 'Chinese (中文)', short: 'ZH', flag: '🇨🇳', country: 'China' },
    { code: 'ja', label: 'Japanese (日本語)', short: 'JA', flag: '🇯🇵', country: 'Japan' },
    { code: 'ko', label: 'Korean (한국어)', short: 'KO', flag: '🇰🇷', country: 'South Korea' },
  ];

  const allSupportedLanguages = [
    ...aseanLanguages,
    { code: 'km', label: 'Khmer (ភាសាខ្មែរ - Cambodia)', short: 'KM', flag: '🇰🇭', country: 'Cambodia' },
    ...regionalLanguages,
  ];

  const getLanguageFlag = (code: string) => {
    const c = (code || '').toLowerCase();
    if (c === 'en') return '🌐';
    if (c === 'km' || c === 'kh') return '🇰🇭';
    const match = allSupportedLanguages.find(l => l.code === c);
    return match?.flag || '🌐';
  };

  const getLanguageLabel = (code: string) => {
    const c = (code || '').toLowerCase();
    if (c === 'en') return 'EN English / Global';
    if (c === 'km' || c === 'kh') return 'Khmer (Cambodia)';
    const match = allSupportedLanguages.find(l => l.code === c);
    return match?.label || (code || '').toUpperCase();
  };

  // Ingested Entries State (Populated from Ingest Document & Auto-Vectorize)
  const [ingestedEntries, setIngestedEntries] = useState<IngestedDocumentEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [entrySearchQuery, setEntrySearchQuery] = useState<string>('');
  const [entryCategoryFilter, setEntryCategoryFilter] = useState<string>('ALL');

  // Original Document Language Edit & Improvement Box State
  const [originalDocTitle, setOriginalDocTitle] = useState<string>('');
  const [originalDocContent, setOriginalDocContent] = useState<string>('');
  const [originalDocLanguage, setOriginalDocLanguage] = useState<string>('en');
  const [originalDocCategory, setOriginalDocCategory] = useState<string>('Accreditation Standards');
  const [isImprovingLanguage, setIsImprovingLanguage] = useState<boolean>(false);
  const [improveLanguageFeedback, setImproveLanguageFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSavingOriginalDoc, setIsSavingOriginalDoc] = useState<boolean>(false);
  const [saveOriginalDocFeedback, setSaveOriginalDocFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Dynamic Multiple Translation Slots State
  interface TranslationSlot {
    id: string;
    targetLang: string;
    title: string;
    content: string;
    isTranslating: boolean;
    isStored: boolean;
    storeFeedback?: { success: boolean; message: string } | null;
  }

  const createDefaultSlot = (lang = 'en'): TranslationSlot => ({
    id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    targetLang: lang,
    title: '',
    content: '',
    isTranslating: false,
    isStored: false,
    storeFeedback: null,
  });

  const [translationSlots, setTranslationSlots] = useState<TranslationSlot[]>([]);
  const [selectedTargetLangForAdd, setSelectedTargetLangForAdd] = useState<string>('kh');
  const [isSavingAllSlots, setIsSavingAllSlots] = useState<boolean>(false);
  const [saveAllSlotsFeedback, setSaveAllSlotsFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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

  // Synchronize original doc edit fields when selected entry or list updates
  useEffect(() => {
    const current = ingestedEntries.find(e => e.id === selectedEntryId) || ingestedEntries[0];
    if (current) {
      setOriginalDocTitle(current.title || '');
      setOriginalDocContent(current.content || '');
      setOriginalDocLanguage(current.language || 'en');
      setOriginalDocCategory(current.category || 'Accreditation Standards');
      setSaveOriginalDocFeedback(null);
      setImproveLanguageFeedback(null);
      setSaveAllSlotsFeedback(null);
      setTranslationSlots([]);
      setSelectedTargetLangForAdd((current.language || 'en').toLowerCase() === 'en' ? 'kh' : 'en');
    }
  }, [selectedEntryId, ingestedEntries]);

  // Handler: Improve Language using AI Polish
  const handleImproveLanguage = async () => {
    if (!originalDocContent.trim()) return;
    setIsImprovingLanguage(true);
    setImproveLanguageFeedback(null);

    try {
      const res = await fetch('/api/rag/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: originalDocTitle.trim(),
          content: originalDocContent.trim(),
          language: originalDocLanguage,
          apiKey: apiKey || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.improvedTitle) setOriginalDocTitle(data.improvedTitle);
        if (data.improvedContent) setOriginalDocContent(data.improvedContent);
        setImproveLanguageFeedback({
          success: true,
          message: data.summary || '✓ Document language successfully refined, polished, and improved!',
        });
      } else {
        setImproveLanguageFeedback({
          success: false,
          message: data.error || 'Failed to improve document language',
        });
      }
    } catch (err: any) {
      setImproveLanguageFeedback({
        success: false,
        message: err.message || 'Error communicating with language improvement AI',
      });
    } finally {
      setIsImprovingLanguage(false);
    }
  };

  // Handler: Save changes to original document into RAG
  const handleSaveOriginalDoc = async () => {
    const current = ingestedEntries.find(e => e.id === selectedEntryId) || ingestedEntries[0];
    if (!current || !originalDocContent.trim() || !originalDocTitle.trim()) return;

    setIsSavingOriginalDoc(true);
    setSaveOriginalDocFeedback(null);

    try {
      const res = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: current.id,
          title: originalDocTitle.trim(),
          content: originalDocContent.trim(),
          language: originalDocLanguage,
          category: originalDocCategory,
          source: current.source || 'Admin Document Portal',
          tenantTag: 'rto-ai',
          apiKey: apiKey || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveOriginalDocFeedback({
          success: true,
          message: `✓ Saved & re-indexed "${originalDocTitle.trim()}" in RAG (${data.data?.chunksCreated || 1} chunks)!`,
        });
        loadStats();
        loadIngestedEntries();
      } else {
        setSaveOriginalDocFeedback({
          success: false,
          message: data.error || 'Failed to save document updates to RAG',
        });
      }
    } catch (err: any) {
      setSaveOriginalDocFeedback({
        success: false,
        message: err.message || 'Network error saving document to RAG',
      });
    } finally {
      setIsSavingOriginalDoc(false);
    }
  };

  // Handler: Revert original doc fields to loaded values
  const handleRevertOriginalDoc = () => {
    const current = ingestedEntries.find(e => e.id === selectedEntryId) || ingestedEntries[0];
    if (current) {
      setOriginalDocTitle(current.title || '');
      setOriginalDocContent(current.content || '');
      setOriginalDocLanguage(current.language || 'en');
      setOriginalDocCategory(current.category || 'Accreditation Standards');
      setSaveOriginalDocFeedback(null);
      setImproveLanguageFeedback(null);
    }
  };

  // Handler: Add a new dynamic translation dropdown slot
  const handleAddTranslationSlot = (preferredLang?: string, autoTranslate = true) => {
    const usedLangs = new Set(translationSlots.map(s => s.targetLang.toLowerCase()));
    let nextLang = preferredLang;
    if (!nextLang) {
      const defaultFirst = originalDocLanguage.toLowerCase() === 'en' ? 'kh' : 'en';
      if (!usedLangs.has(defaultFirst)) {
        nextLang = defaultFirst;
      } else {
        const candidate = aseanLanguages.find(l => !usedLangs.has(l.code.toLowerCase()));
        nextLang = candidate?.code || 'en';
      }
    }

    const currentEntry = ingestedEntries.find(e => e.id === selectedEntryId) || ingestedEntries[0];
    const currentTitle = (originalDocTitle || currentEntry?.title || '').trim();
    const currentContent = (originalDocContent || currentEntry?.content || '').trim();

    // Check if slot with this language already exists
    const existing = translationSlots.find(s => s.targetLang.toLowerCase() === nextLang?.toLowerCase());
    if (existing) {
      if (autoTranslate) {
        handleTranslateSlot(existing.id, nextLang);
      }
      return;
    }

    const newSlotId = `slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSlot: TranslationSlot = {
      id: newSlotId,
      targetLang: nextLang,
      title: '',
      content: '',
      isTranslating: autoTranslate && currentContent.length > 0,
      isStored: false,
      storeFeedback: null,
    };
    setTranslationSlots(prev => [...prev, newSlot]);

    if (autoTranslate) {
      handleTranslateSlot(newSlotId, nextLang);
    }

    // Automatically suggest next unused ASEAN or regional partner language for the next dropdown
    const usedAfter = new Set([...translationSlots.map(s => s.targetLang.toLowerCase()), nextLang.toLowerCase()]);
    const nextCandidate = aseanLanguages.find(l => !usedAfter.has(l.code.toLowerCase())) ||
      regionalLanguages.find(l => !usedAfter.has(l.code.toLowerCase()));
    if (nextCandidate) {
      setSelectedTargetLangForAdd(nextCandidate.code);
    }
  };

  // Handler: Remove a translation dropdown slot (allows removing down to 0)
  const handleRemoveTranslationSlot = (slotId: string) => {
    setTranslationSlots(prev => prev.filter(s => s.id !== slotId));
  };

  // Handler: Translate specific slot using original title & content from the top box
  const handleTranslateSlot = async (slotId: string, customTargetLang?: string) => {
    let langToUse = customTargetLang;
    if (!langToUse) {
      const slot = translationSlots.find(s => s.id === slotId);
      langToUse = slot?.targetLang;
    }
    if (!langToUse) return;

    // Read top box text from "Selected Document: Edit & Improve Language"
    const currentEntry = ingestedEntries.find(e => e.id === selectedEntryId) || ingestedEntries[0];
    const currentTitle = (originalDocTitle || currentEntry?.title || '').trim();
    const currentContent = (originalDocContent || currentEntry?.content || '').trim();

    if (!currentContent) {
      setTranslationSlots(prev => prev.map(s => s.id === slotId ? {
        ...s,
        isTranslating: false,
        storeFeedback: {
          success: false,
          message: 'Document content in the top box is empty. Please enter or select content to translate.',
        },
      } : s));
      return;
    }

    setTranslationSlots(prev => prev.map(s => s.id === slotId ? {
      ...s,
      targetLang: langToUse!,
      isTranslating: true,
      storeFeedback: null,
    } : s));

    try {
      const translateTitlePromise = currentTitle
        ? fetch('/api/rag/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: currentTitle,
              targetLanguage: langToUse,
              apiKey: apiKey || undefined,
            }),
          }).then(async res => {
            const data = await res.json();
            return data.success && data.translatedText ? data.translatedText : currentTitle;
          }).catch(() => currentTitle)
        : Promise.resolve('');

      const translateContentPromise = fetch('/api/rag/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentContent,
          targetLanguage: langToUse,
          apiKey: apiKey || undefined,
        }),
      }).then(async res => {
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to translate document content');
        }
        return data.translatedText || currentContent;
      });

      const [translatedTitle, translatedContent] = await Promise.all([
        translateTitlePromise,
        translateContentPromise,
      ]);

      setTranslationSlots(prev => prev.map(s => s.id === slotId ? {
        ...s,
        targetLang: langToUse!,
        title: translatedTitle,
        content: translatedContent,
        isTranslating: false,
        isStored: false,
        storeFeedback: {
          success: true,
          message: `✓ Successfully translated into ${getLanguageLabel(langToUse!)}`,
        },
      } : s));
    } catch (err: any) {
      console.error('Translation slot error:', err);
      setTranslationSlots(prev => prev.map(s => s.id === slotId ? {
        ...s,
        isTranslating: false,
        storeFeedback: {
          success: false,
          message: err.message || 'Translation request failed',
        },
      } : s));
    }
  };

  // Slot editing handlers
  const handleUpdateSlotTitle = (slotId: string, newTitle: string) => {
    setTranslationSlots(prev => prev.map(s => s.id === slotId ? { ...s, title: newTitle, isStored: false } : s));
  };

  const handleUpdateSlotContent = (slotId: string, newContent: string) => {
    setTranslationSlots(prev => prev.map(s => s.id === slotId ? { ...s, content: newContent, isStored: false } : s));
  };

  const handleUpdateSlotLang = (slotId: string, newLang: string) => {
    setTranslationSlots(prev => prev.map(s => s.id === slotId ? { ...s, targetLang: newLang, isStored: false } : s));
  };

  // Handler: Store single slot into RAG
  const handleStoreSingleSlot = async (slotId: string) => {
    const current = ingestedEntries.find(e => e.id === selectedEntryId) || ingestedEntries[0];
    const slot = translationSlots.find(s => s.id === slotId);
    if (!current || !slot || !slot.content.trim() || !slot.title.trim()) return;

    setTranslationSlots(prev => prev.map(s => s.id === slotId ? { ...s, isTranslating: true } : s));

    try {
      const res = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: slot.title.trim(),
          content: slot.content.trim(),
          language: slot.targetLang,
          category: originalDocCategory || current.category,
          source: `Verified Translation (${originalDocLanguage.toUpperCase()} → ${slot.targetLang.toUpperCase()}): ${originalDocTitle || current.title}`,
          tenantTag: 'rto-ai',
          apiKey: apiKey || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTranslationSlots(prev => prev.map(s => s.id === slotId ? {
          ...s,
          isTranslating: false,
          isStored: true,
          storeFeedback: {
            success: true,
            message: `✓ Saved & indexed in RAG (${getLanguageLabel(slot.targetLang)}) with ${data.data?.chunksCreated || 1} chunks!`,
          },
        } : s));
        loadStats();
        loadIngestedEntries();
      } else {
        setTranslationSlots(prev => prev.map(s => s.id === slotId ? {
          ...s,
          isTranslating: false,
          storeFeedback: {
            success: false,
            message: data.error || 'Failed to save translation to RAG',
          },
        } : s));
      }
    } catch (err: any) {
      setTranslationSlots(prev => prev.map(s => s.id === slotId ? {
        ...s,
        isTranslating: false,
        storeFeedback: {
          success: false,
          message: err.message || 'Network error saving translation',
        },
      } : s));
    }
  };

  // Handler: Save everything to RAG
  const handleSaveAllTranslations = async () => {
    const current = ingestedEntries.find(e => e.id === selectedEntryId) || ingestedEntries[0];
    if (!current) return;

    const slotsToSave = translationSlots.filter(s => s.content.trim().length > 0 && s.title.trim().length > 0);
    if (slotsToSave.length === 0) {
      setSaveAllSlotsFeedback({
        success: false,
        message: 'No translated content found to save. Please translate or enter content for at least one translation dropdown first.',
      });
      return;
    }

    setIsSavingAllSlots(true);
    setSaveAllSlotsFeedback(null);

    let successCount = 0;
    let totalChunks = 0;
    const errors: string[] = [];

    for (const slot of slotsToSave) {
      try {
        const res = await fetch('/api/rag/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: slot.title.trim(),
            content: slot.content.trim(),
            language: slot.targetLang,
            category: originalDocCategory || current.category,
            source: `Verified Translation (${originalDocLanguage.toUpperCase()} → ${slot.targetLang.toUpperCase()}): ${originalDocTitle || current.title}`,
            tenantTag: 'rto-ai',
            apiKey: apiKey || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
          totalChunks += data.data?.chunksCreated || 1;
          setTranslationSlots(prev => prev.map(s => s.id === slot.id ? {
            ...s,
            isStored: true,
            storeFeedback: {
              success: true,
              message: `✓ Saved to RAG (${data.data?.chunksCreated || 1} chunks)`,
            },
          } : s));
        } else {
          errors.push(`${getLanguageLabel(slot.targetLang)}: ${data.error || 'Failed'}`);
        }
      } catch (err: any) {
        errors.push(`${getLanguageLabel(slot.targetLang)}: ${err.message}`);
      }
    }

    setIsSavingAllSlots(false);

    if (successCount > 0) {
      setSaveAllSlotsFeedback({
        success: true,
        message: `✓ Successfully saved and indexed all ${successCount} translation(s) (${totalChunks} vector chunks) into the Multilingual RAG!`,
      });
      loadStats();
      loadIngestedEntries();
    } else {
      setSaveAllSlotsFeedback({
        success: false,
        message: `Failed to save translations: ${errors.join(', ')}`,
      });
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
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                    <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="whitespace-nowrap">Entries from Ingest Document &amp; Auto-Vectorize</span>
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

            {/* SECTION 2: EDIT ORIGINAL DOCUMENT & IMPROVE LANGUAGE + TRANSLATE INTO ASEAN LANGUAGES */}
            {(() => {
              const currentEntry = ingestedEntries.find(e => e.id === selectedEntryId) || ingestedEntries[0];
              if (!currentEntry) return null;

              return (
                <div className="pt-3 border-t border-slate-100 space-y-6">
                  {/* 2A: DOCUMENT LANGUAGE EDIT & IMPROVEMENT BOX */}
                  <div className="bg-slate-50/80 border-2 border-indigo-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    {/* Box Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-indigo-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                          <Edit3 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Selected Document: Edit &amp; Improve Language</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Edit original title and text, improve language with AI, and save updates into RAG.
                          </p>
                        </div>
                      </div>

                      {/* Original Document Language Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-600">Language:</span>
                        <select
                          value={originalDocLanguage}
                          onChange={(e) => setOriginalDocLanguage(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                        >
                          <optgroup label="── ASEAN Languages (EN English / Global first) ──">
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
                      </div>
                    </div>

                    {/* Editable Title */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Document Title (Editable):</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {currentEntry.id}</span>
                      </label>
                      <input
                        type="text"
                        value={originalDocTitle}
                        onChange={(e) => setOriginalDocTitle(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                        placeholder="Document title..."
                      />
                    </div>

                    {/* Editable Content */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Document Content (Editable &amp; Improvable):</span>
                        <div className="text-[11px] text-slate-400 font-normal">
                          <span>{originalDocContent.trim().split(/\s+/).filter(Boolean).length} words</span>
                          <span className="mx-1.5">•</span>
                          <span>{originalDocContent.length} chars</span>
                        </div>
                      </div>
                      <textarea
                        rows={6}
                        value={originalDocContent}
                        onChange={(e) => setOriginalDocContent(e.target.value)}
                        className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed font-sans shadow-2xs"
                        placeholder="Document content..."
                      />
                    </div>

                    {/* Language Improvement & Save Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-indigo-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleImproveLanguage}
                          disabled={isImprovingLanguage || !originalDocContent.trim()}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Refine grammar, clarity, and professional academic polish using AI"
                        >
                          <Sparkles className={`w-3.5 h-3.5 text-indigo-600 ${isImprovingLanguage ? 'animate-spin' : ''}`} />
                          <span>{isImprovingLanguage ? 'Improving Language with AI...' : 'Improve Language'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRevertOriginalDoc}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Reset fields to original loaded values"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Revert</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveOriginalDoc}
                        disabled={isSavingOriginalDoc || !originalDocContent.trim() || !originalDocTitle.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                      >
                        <Save className={`w-3.5 h-3.5 ${isSavingOriginalDoc ? 'animate-spin' : ''}`} />
                        <span>{isSavingOriginalDoc ? 'Saving to RAG...' : 'Save'}</span>
                      </button>
                    </div>

                    {/* Feedback Banners for Original Doc */}
                    {improveLanguageFeedback && (
                      <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        improveLanguageFeedback.success
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                      }`}>
                        {improveLanguageFeedback.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{improveLanguageFeedback.message}</span>
                      </div>
                    )}

                    {saveOriginalDocFeedback && (
                      <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        saveOriginalDocFeedback.success
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                      }`}>
                        {saveOriginalDocFeedback.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{saveOriginalDocFeedback.message}</span>
                      </div>
                    )}
                  </div>

                  {/* 2B: TRANSLATE ORIGINAL INTO ANOTHER LANGUAGE (OPTIONAL DYNAMIC DROPDOWNS) */}
                  <div className="space-y-4 p-4 sm:p-5 bg-indigo-50/70 border-2 border-indigo-200/80 rounded-2xl">
                    {/* SECTION HEADER & SUMMARY */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-200/60">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                          <Languages className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 block">
                            Translate Original into Another Language
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Select a target language from the dropdown below to translate the original document, edit translations, and save to RAG.
                          </span>
                        </div>
                      </div>

                      {translationSlots.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-indigo-800 bg-white border border-indigo-200 px-2.5 py-1 rounded-full shadow-2xs">
                            {translationSlots.length} {translationSlots.length === 1 ? 'Language Dropdown Open' : 'Language Dropdowns Open'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ─── WHEN 0 TRANSLATIONS OPEN: INITIAL TRANSLATE ORIGINAL INTO ANOTHER LANGUAGE ─── */}
                    {translationSlots.length === 0 ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-indigo-200 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                          <label className="text-xs font-bold text-slate-900 flex items-center gap-2 shrink-0">
                            <div className="p-1 rounded-md bg-indigo-100 text-indigo-700">
                              <Languages className="w-3.5 h-3.5" />
                            </div>
                            <span>Translate Original into Another Language:</span>
                          </label>

                          {/* Dedicated Language Dropdown Menu & Translate Button */}
                          <div className="flex items-center gap-2 flex-1 max-w-xl">
                            <select
                              value={selectedTargetLangForAdd}
                              onChange={(e) => setSelectedTargetLangForAdd(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border-2 border-indigo-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer transition-colors"
                            >
                              <optgroup label="── ASEAN Languages (EN English / Global first) ──">
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
                              onClick={() => handleAddTranslationSlot(selectedTargetLangForAdd, true)}
                              disabled={!originalDocContent.trim()}
                              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 shrink-0"
                              title="Translate original document into this language"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>Translate</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ─── WHEN TRANSLATION BOXES ARE OPEN ─── */
                      <div className="space-y-4 pt-1">
                        {translationSlots.map((slot) => {
                          const hasContent = slot.content.trim().length > 0;
                          return (
                            <div
                              key={slot.id}
                              className="p-4 sm:p-5 rounded-xl bg-white border-2 border-indigo-200 shadow-sm space-y-3.5 transition-all"
                            >
                              {/* Slot Top Bar: Language Badge + Status + Close/Remove */}
                              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                                    <span>{getLanguageFlag(slot.targetLang)}</span>
                                    <span>{getLanguageLabel(slot.targetLang)}</span>
                                  </span>
                                  {slot.isTranslating && (
                                    <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 animate-pulse">
                                      <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                                      <span>Translating with AI...</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {slot.isStored && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      <span>Saved in RAG</span>
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTranslationSlot(slot.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Close / remove this translation box"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Slot Content: Editable Title & Text */}
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                    <span>Translated Title ({getLanguageLabel(slot.targetLang)}):</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Editable</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={slot.title}
                                    onChange={(e) => handleUpdateSlotTitle(slot.id, e.target.value)}
                                    placeholder={`Enter or click 'Translate' for translated title in ${getLanguageLabel(slot.targetLang)}...`}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                    <span>Translated Content ({getLanguageLabel(slot.targetLang)} - Editable):</span>
                                    <div className="text-[10px] text-slate-400 font-normal">
                                      <span>{slot.content.trim().split(/\s+/).filter(Boolean).length} words</span>
                                      <span className="mx-1">•</span>
                                      <span>{slot.content.length} chars</span>
                                    </div>
                                  </div>
                                  <textarea
                                    rows={4}
                                    value={slot.content}
                                    onChange={(e) => handleUpdateSlotContent(slot.id, e.target.value)}
                                    placeholder={`Click 'Translate' above to automatically translate original document into ${getLanguageLabel(slot.targetLang)}, or type translated text directly here...`}
                                    className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed font-sans"
                                  />
                                </div>

                                {/* Slot Actions: Copy & Individual Save */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(slot.content);
                                      setCopiedLang(slot.id);
                                      setTimeout(() => setCopiedLang(null), 2000);
                                    }}
                                    disabled={!slot.content.trim()}
                                    className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedLang === slot.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedLang === slot.id ? 'Copied' : 'Copy'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleStoreSingleSlot(slot.id)}
                                    disabled={slot.isTranslating || !slot.content.trim() || !slot.title.trim()}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <Save className="w-3 h-3" />
                                    <span>Save This Translation to RAG</span>
                                  </button>
                                </div>

                                {slot.storeFeedback && (
                                  <div className={`p-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
                                    slot.storeFeedback.success
                                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                                  }`}>
                                    {slot.storeFeedback.success ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    )}
                                    <span>{slot.storeFeedback.message}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* ─── BELOW TRANSLATE ORIGINAL INTO ANOTHER LANGUAGE BOX: + BUTTON FOR TRANSLATE ORIGINAL INTO ANOTHER LANGUAGE ─── */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-400 shadow-2xs transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                            <label className="text-xs font-bold text-slate-900 flex items-center gap-2 shrink-0">
                              <div className="p-1 rounded-md bg-indigo-100 text-indigo-700">
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              </div>
                              <span>Translate Original into Another Language:</span>
                            </label>

                            {/* Dropdown to choose another language & + Button for Translate Original into Another Language */}
                            <div className="flex items-center gap-2 flex-1 max-w-xl">
                              <select
                                value={selectedTargetLangForAdd}
                                onChange={(e) => setSelectedTargetLangForAdd(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border-2 border-indigo-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer transition-colors"
                              >
                                <optgroup label="── ASEAN Languages (EN English / Global first) ──">
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
                                onClick={() => handleAddTranslationSlot(selectedTargetLangForAdd, true)}
                                disabled={!originalDocContent.trim()}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 shrink-0"
                                title="Translate original text into this chosen language"
                              >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>Translate</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ─── GLOBAL SAVE EVERYTHING TO RAG (WHEN SLOTS EXIST) ─── */}
                    {translationSlots.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-indigo-200/80">
                        <span className="text-xs text-slate-600 font-medium">
                          Total translations configured: <strong className="text-indigo-900 font-bold">{translationSlots.length}</strong>
                        </span>

                        <button
                          type="button"
                          onClick={handleSaveAllTranslations}
                          disabled={isSavingAllSlots || translationSlots.every(s => !s.content.trim())}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
                        >
                          <BookOpen className={`w-4 h-4 ${isSavingAllSlots ? 'animate-spin' : ''}`} />
                          <span>{isSavingAllSlots ? 'Vectorizing & Saving Everything...' : 'Save Everything to RAG'}</span>
                        </button>
                      </div>
                    )}

                    {/* Global Save All Feedback Banner */}
                    {saveAllSlotsFeedback && (
                      <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        saveAllSlotsFeedback.success
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                      }`}>
                        {saveAllSlotsFeedback.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{saveAllSlotsFeedback.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right Column: Ingest Document (Paste Whole Document & Let AI Sort It Out) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Document Ingestion Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base xl:text-lg font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                  <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="whitespace-nowrap">Ingest Document &amp; Auto-Vectorize</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste whole documents in any language &amp; let AI sort out title, category, language, and embeddings.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0 self-start xl:self-auto">
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <optgroup label="── ASEAN Languages (EN English / Global first) ──">
                        {aseanLanguages.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.flag} {l.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="── Regional Dialogue Partners ──">
                        {regionalLanguages.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.flag} {l.label}
                          </option>
                        ))}
                      </optgroup>
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
