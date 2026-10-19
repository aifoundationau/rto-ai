'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Globe,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  BookOpen,
  MessageSquare,
  Tag,
  Clock,
  User,
  Copy,
  Check,
  ChevronDown,
  Layers,
  Wand2,
  FileText,
  ListOrdered,
  ArrowRight
} from 'lucide-react';
import { FAQItem, FAQS_DATA } from '@/data/faqs';

interface KnowledgeFaqManagerProps {
  onFaqCountChange?: (count: number) => void;
  currentUserEmail?: string;
}

const PRESET_LANGUAGES = [
  { code: 'en', label: 'EN English / Global', flag: '🌐' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'km', label: 'ភាសាខ្មែរ (Khmer)', flag: '🇰🇭' },
  { code: 'th', label: 'ภาษาไทย (Thai)', flag: '🇹🇭' },
  { code: 'vi', label: 'Tiếng Việt (Vietnamese)', flag: '🇻🇳' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', label: 'Bahasa Melayu (Malay)', flag: '🇲🇾' },
  { code: 'fil', label: 'Filipino / Tagalog', flag: '🇵🇭' },
  { code: 'my', label: 'မြန်မာဘာသာ (Burmese)', flag: '🇲🇲' },
  { code: 'lo', label: 'ພາສາລາວ (Lao)', flag: '🇱🇦' },
  { code: 'other-asean', label: 'Other ASEAN Language', flag: '🌏' }
];

const PRESET_CATEGORIES = [
  'Admissions',
  'Fees & Scholarships',
  'Courses & Study',
  'International',
  'Campus Life',
  'Applications',
  'Student Visa & Work Rights',
  'Academic Support'
];

export const KnowledgeFaqManager: React.FC<KnowledgeFaqManagerProps> = ({
  onFaqCountChange,
  currentUserEmail = 'staff@edupulse.edu.au'
}) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([...FAQS_DATA]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State for Add FAQ
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Admissions',
    customCategory: '',
    language: 'English (en)',
    customLanguage: '',
    keywordsInput: '',
    authorEmail: currentUserEmail
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Mode: 'ai-bank' | 'manual'
  const [modalMode, setModalMode] = useState<'ai-bank' | 'manual'>('ai-bank');

  // AI Bank Ingestion State
  const [rawBankText, setRawBankText] = useState<string>('');
  const [bankLanguage, setBankLanguage] = useState<string>('English (en)');
  const [bankCustomLanguage, setBankCustomLanguage] = useState<string>('');
  const [bankCategory, setBankCategory] = useState<string>('Admissions');
  const [isParsingBank, setIsParsingBank] = useState<boolean>(false);
  const [parsedBankItems, setParsedBankItems] = useState<Array<{
    question: string;
    answer: string;
    keywords: string;
    category: string;
    language: string;
  }>>([]);
  const [isSavingBulk, setIsSavingBulk] = useState<boolean>(false);

  // Sample Banks for quick testing across languages
  const SAMPLE_BANKS: Record<string, { label: string; text: string; language: string; category: string }> = {
    english: {
      label: 'English Q&A Bank (3 Items)',
      language: 'English (en)',
      category: 'Admissions',
      text: `Q1: What are the minimum ATAR entry scores for the Bachelor of Artificial Intelligence?
A1: The minimum guaranteed ATAR for domestic entry is 85.00, or equivalent international high school credential with Mathematics prerequisites.

Q2: Can I get credit for prior learning (RPL) from my previous university diploma or TAFE studies?
A2: Yes, students with accredited diplomas or completed university units can apply for Advanced Standing (Recognition of Prior Learning) to reduce degree duration by up to 1.5 years.

Q3: What health insurance is required for international students in Australia?
A3: All international students on student visa Subclass 500 must maintain valid Overseas Student Health Cover (OSHC) for the entire duration of their visa.`
    },
    chinese: {
      label: '中文 Q&A Bank (2 Items)',
      language: '中文 (Chinese)',
      category: 'Fees & Scholarships',
      text: `问题1: 国际留学生如何申请副校长卓越奖学金？
答案1: 在提交本科或硕士入学申请时，招生系统将自动对所有学术成绩优异的国际学生进行资格评估，最高可减免25%至50%的学费。

问题2: 持有澳大利亚500学生签证每两周可以工作多少小时？
答案2: 500学生签证持有者在学期期间每两周最多允许合法工作48小时，在大学官方假期期间可全职不限时工作。`
    },
    vietnamese: {
      label: 'Tiếng Việt Bank (2 Items)',
      language: 'Tiếng Việt (Vietnamese)',
      category: 'International',
      text: `Câu hỏi 1: Sinh viên quốc tế có được phép đi làm thêm trong khi học không?
Trả lời 1: Có, sinh viên có thị thực Subclass 500 được phép làm việc tối đa 48 giờ mỗi hai tuần trong kỳ học và không giới hạn giờ trong các kỳ nghỉ chính thức.

Câu hỏi 2: Yêu cầu điểm thi tiếng Anh tối thiểu cho bậc Thạc sĩ là bao nhiêu?
Trả lời 2: Điểm IELTS Academic yêu cầu là tối thiểu 6.5 không có kỹ năng nào dưới 6.0, hoặc các chứng chỉ tương đương như PTE Academic tối thiểu 58 điểm.`
    },
    japanese: {
      label: '日本語 Bank (2 Items)',
      language: '日本語 (Japanese)',
      category: 'Admissions',
      text: `質問1: 出願に必要な英語能力スコアはどれくらいですか？
回答1: 学部課程ではIELTS Academic 6.5（各バンド6.0以上）、またはPTE Academic 58点以上が公式基準となります。

質問2: オーストラリアの留学生健康保険（OSHC）の加入は必須ですか？
回答2: はい、学生ビザ（Subclass 500）の保持者はビザ期間全体をカバーするOSHCへの加入が法的に義務付けられています。`
    }
  };

  // Fetch FAQs from API
  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/faqs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.faqs)) {
          setFaqs(data.faqs);
          if (onFaqCountChange) {
            onFaqCountChange(data.faqs.length);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load FAQs from /api/faqs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  // Update parent counter when faqs state changes
  useEffect(() => {
    if (onFaqCountChange) {
      onFaqCountChange(faqs.length);
    }
  }, [faqs.length, onFaqCountChange]);

  // Handle Create FAQ
  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter both the question and answer.' });
      return;
    }

    const resolvedCategory = formData.category === '__custom__' && formData.customCategory.trim()
      ? formData.customCategory.trim()
      : formData.category;

    const resolvedLanguage =
      (formData.language === 'Other ASEAN Language' || formData.language === 'Other Language') && formData.customLanguage.trim()
        ? formData.customLanguage.trim()
        : formData.language;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          category: resolvedCategory,
          language: resolvedLanguage,
          keywords: formData.keywordsInput,
          authorEmail: formData.authorEmail || currentUserEmail
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save FAQ');
      }

      setStatusMessage({ type: 'success', text: 'New Multilingual Q&A saved and active in AI Assistant!' });
      
      // Reset form
      setFormData({
        question: '',
        answer: '',
        category: 'Admissions',
        customCategory: '',
        language: 'English (en)',
        customLanguage: '',
        keywordsInput: '',
        authorEmail: currentUserEmail
      });

      // Refresh list
      await fetchFaqs();

      setTimeout(() => {
        setShowAddModal(false);
        setStatusMessage(null);
      }, 1200);
    } catch (err: any) {
      console.error('Error creating FAQ:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Error saving FAQ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Parsing the Raw Bank with AI
  const handleParseBank = async () => {
    if (!rawBankText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please paste raw questions and answers into the text box.' });
      return;
    }
    setIsParsingBank(true);
    setStatusMessage(null);
    try {
      const resolvedLang =
        (bankLanguage === 'Other ASEAN Language' || bankLanguage === 'Other Language') && bankCustomLanguage.trim()
          ? bankCustomLanguage.trim()
          : bankLanguage;

      const res = await fetch('/api/faqs/parse-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          rawBank: rawBankText,
          language: resolvedLang,
          category: bankCategory
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to parse Q&A bank');
      }

      if (Array.isArray(data.items) && data.items.length > 0) {
        setParsedBankItems(data.items);
        setStatusMessage({
          type: 'success',
          text: `✨ AI successfully sorted ${data.items.length} Questions & Answers! You can review or edit each item below before saving.`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Could not extract Questions and Answers. Please check your text format.'
        });
      }
    } catch (err: any) {
      console.error('Error parsing FAQ bank:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Error parsing Q&A bank' });
    } finally {
      setIsParsingBank(false);
    }
  };

  // Handle Bulk Saving All Parsed FAQs
  const handleSaveBulkFaqs = async () => {
    if (parsedBankItems.length === 0) return;
    setIsSavingBulk(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          faqs: parsedBankItems.map(item => ({
            question: item.question.trim(),
            answer: item.answer.trim(),
            keywords: item.keywords,
            category: item.category,
            language: item.language,
            authorEmail: currentUserEmail
          })),
          authorEmail: currentUserEmail
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save FAQs');
      }

      setStatusMessage({
        type: 'success',
        text: `🎉 Successfully saved ${data.count || parsedBankItems.length} Q&As to University Knowledge Base!`
      });
      setParsedBankItems([]);
      setRawBankText('');
      await fetchFaqs();
      setTimeout(() => {
        setShowAddModal(false);
        setStatusMessage(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error saving bulk FAQs:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Error saving FAQs' });
    } finally {
      setIsSavingBulk(false);
    }
  };

  const handleUpdateParsedItem = (
    index: number,
    field: 'question' | 'answer' | 'keywords' | 'category',
    value: string
  ) => {
    setParsedBankItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveParsedItem = (index: number) => {
    setParsedBankItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleTransferToManual = (item: (typeof parsedBankItems)[0]) => {
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category,
      customCategory: '',
      language: item.language,
      customLanguage: '',
      keywordsInput: item.keywords,
      authorEmail: currentUserEmail
    });
    setModalMode('manual');
  };

  // Handle Delete FAQ
  const handleDeleteFaq = async (id: string) => {
    try {
      const res = await fetch(`/api/faqs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || 'Failed to delete FAQ item.');
        return;
      }
      setFaqs(prev => prev.filter(f => f.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Error deleting FAQ:', err);
      alert('Error deleting FAQ item.');
    }
  };

  // Copy helper
  const handleCopyFaq = (faq: FAQItem) => {
    const text = `Q: ${faq.question}\n\nA: ${faq.answer}`;
    navigator.clipboard.writeText(text);
    setCopiedId(faq.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Extracted unique categories and languages
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach(f => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [faqs]);

  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach(f => {
      const l = f.language;
      if (l) {
        set.add(l === 'English' ? 'English (en)' : l);
      } else {
        set.add('English (en)');
      }
    });
    return Array.from(set);
  }, [faqs]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      // Category filter
      if (selectedCategory !== 'all' && faq.category !== selectedCategory) {
        return false;
      }

      // Language filter
      const rawLang = faq.language || 'English (en)';
      const faqLang = rawLang === 'English' ? 'English (en)' : rawLang;
      if (selectedLanguage !== 'all') {
        const isSelectedEnglish = selectedLanguage.toLowerCase().includes('english');
        const isFaqEnglish = faqLang.toLowerCase().includes('english');
        if (!isSelectedEnglish || !isFaqEnglish) {
          if (faqLang.toLowerCase() !== selectedLanguage.toLowerCase()) {
            return false;
          }
        }
      }

      // Search query (case-insensitive across question, answer, category, keywords, language)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ = faq.question.toLowerCase().includes(q);
        const matchesA = faq.answer.toLowerCase().includes(q);
        const matchesC = faq.category.toLowerCase().includes(q);
        const matchesL = faqLang.toLowerCase().includes(q);
        const matchesK = faq.keywords && faq.keywords.some(k => k.toLowerCase().includes(q));
        if (!matchesQ && !matchesA && !matchesC && !matchesL && !matchesK) {
          return false;
        }
      }

      return true;
    });
  }, [faqs, selectedCategory, selectedLanguage, searchQuery]);

  const customFaqsCount = useMemo(() => faqs.filter(f => f.isCustom).length, [faqs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Control Deck */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-600" />
                Multilingual AI Knowledge Base
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Live Sync with AI Assistant
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Knowledge Base & FAQs</span>
              <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {faqs.length} Total
              </span>
            </h2>
            <p className="text-xs text-slate-500 max-w-3xl">
              Staff can post and maintain questions in <strong>English (en), Japanese, Korean, Chinese, Khmer, Thai, Vietnamese, and ASEAN languages</strong>. Use the AI Auto-Sorter to paste large banks of Q&As and instantly organize them into questions, answers, and search tags.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchFaqs}
              disabled={isLoading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Refresh Knowledge Base from Firestore"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAddModal(true);
                setStatusMessage(null);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer group hover:shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>Add Question & Answer</span>
              <span className="px-1.5 py-0.2 bg-indigo-500 text-[10px] rounded text-indigo-100">Any Language</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-slate-400 font-medium">Total Questions</div>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">{faqs.length}</div>
          </div>
          <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <div className="text-indigo-600 font-medium">Staff Custom Q&As</div>
            <div className="text-lg font-extrabold text-indigo-900 mt-0.5">{customFaqsCount}</div>
          </div>
          <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
            <div className="text-purple-600 font-medium">Languages Active</div>
            <div className="text-lg font-extrabold text-purple-900 mt-0.5">{availableLanguages.length}</div>
          </div>
          <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
            <div className="text-emerald-600 font-medium">Categories</div>
            <div className="text-lg font-extrabold text-emerald-900 mt-0.5">{availableCategories.length}</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across questions, answers, keywords in any language..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Categories ({faqs.length})</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat} ({faqs.filter(f => f.category === cat).length})
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Languages</option>
              {availableLanguages.map(lang => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* FAQs Cards List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">No Knowledge or FAQ items match your filter</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms, changing the language filter, or click &ldquo;Add Question & Answer&rdquo; to create a new one.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedLanguage('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isCustom = Boolean(faq.isCustom);
            const rawLang = faq.language || 'English (en)';
            const langLabel = rawLang === 'English' ? 'English (en)' : rawLang;

            return (
              <div
                key={faq.id}
                className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all space-y-3 group"
              >
                {/* Header row: category badge, language badge, custom tag, actions */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-[11px] border border-indigo-100">
                      {faq.category}
                    </span>

                    <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-lg font-bold text-[11px] border border-purple-100 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-purple-500" />
                      <span>{langLabel}</span>
                    </span>

                    {isCustom ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-[10px] border border-emerald-100 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Staff Custom
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg font-bold text-[10px]">
                        Core System FAQ
                      </span>
                    )}

                    {faq.createdAt && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(faq.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopyFaq(faq)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Copy Q&A text"
                    >
                      {copiedId === faq.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isCustom && (
                      deleteConfirmId === faq.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                          <span className="text-[10px] font-bold text-rose-700 px-1">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold hover:bg-slate-300 cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(faq.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete staff-added question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Question */}
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                  {faq.question}
                </h3>

                {/* Answer */}
                <div className="text-xs text-slate-700 leading-relaxed pl-3 border-l-2 border-indigo-300 bg-slate-50/60 p-3 rounded-r-xl whitespace-pre-line">
                  {faq.answer}
                </div>

                {/* Footer: Keywords and Author */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                  {faq.keywords && faq.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {faq.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {faq.authorEmail && (
                    <div className="text-[10px] text-slate-400 ml-auto flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Added by {faq.authorEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Q&A Modal (Supports Any Language) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                  <Globe className="w-3 h-3 text-indigo-600" />
                  Multilingual Knowledge Authoring
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  <span>Add University FAQ & Knowledge Item</span>
                </h3>
                <p className="text-xs text-slate-500">
                  English (en), Japanese, Korean, Chinese, Khmer, Thai, Vietnamese, and ASEAN languages.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setModalMode('ai-bank')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  modalMode === 'ai-bank'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Bank Ingestion & Auto-Sorter</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-extrabold border border-indigo-100">
                  Bulk
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalMode('manual')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  modalMode === 'manual'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Single Manual Entry</span>
              </button>
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* TAB 1: AI Bank Ingestion & Auto-Sorter */}
            {modalMode === 'ai-bank' && (
              <div className="space-y-4 text-xs">
                {/* Guidance Banner */}
                <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-pink-50/40 rounded-2xl border border-indigo-100/80 flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>AI Q&A Bank Ingestion Box</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                        Auto-Sorting
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Post a large bank of completed questions and answers. The AI will sort them into <strong>Question (in your chosen language)</strong>, <strong>Answer (in your chosen language)</strong>, and <strong>Search Keywords & Tags</strong>.
                    </p>
                  </div>
                </div>

                {/* Language Selector for the Bank */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Language for Q&A Bank *</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Chosen language is preserved by AI</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESET_LANGUAGES.map(lang => (
                      <button
                        type="button"
                        key={lang.code}
                        onClick={() => setBankLanguage(lang.label)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          bankLanguage === lang.label
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>

                  {(bankLanguage === 'Other ASEAN Language' || bankLanguage === 'Other Language') && (
                    <input
                      type="text"
                      value={bankCustomLanguage}
                      onChange={(e) => setBankCustomLanguage(e.target.value)}
                      placeholder="Specify ASEAN language or regional dialect (e.g. Javanese, Sundanese, Cebuano, Tetum, Shan, Ilocano, etc.)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 mt-1"
                      required
                    />
                  )}
                </div>

                {/* Default Category Selector */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Default Category *
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_CATEGORIES.map(cat => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setBankCategory(cat)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer border ${
                          bankCategory === cat
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Large Text Bank Input Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Post Large Bank of Questions and Answers *</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Quick Samples:</span>
                      {Object.entries(SAMPLE_BANKS).map(([k, sample]) => (
                        <button
                          type="button"
                          key={k}
                          onClick={() => {
                            setRawBankText(sample.text);
                            setBankLanguage(sample.language);
                            setBankCategory(sample.category);
                          }}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          {sample.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={7}
                    value={rawBankText}
                    onChange={(e) => setRawBankText(e.target.value)}
                    placeholder={`Paste your completed Q&A bank here in your chosen language...\n\nExample:\nQ1: How do international students apply for an offer letter?\nA1: Applications must be submitted through the international portal with certified transcripts and proof of English proficiency.\n\nQ2: What is the fee deposit required to obtain an eCoE?\nA2: A minimum deposit of $5,000 AUD or first semester tuition is required before the electronic Confirmation of Enrolment (eCoE) is issued.`}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono leading-relaxed"
                  />
                </div>

                {/* Sort Action Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    {rawBankText.trim() ? `${rawBankText.trim().split('\n').filter(Boolean).length} lines ready for AI sorting` : 'Paste text above to sort'}
                  </span>
                  <button
                    type="button"
                    onClick={handleParseBank}
                    disabled={isParsingBank || !rawBankText.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
                  >
                    {isParsingBank ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Sorting into Questions, Answers & Keywords...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>✨ Sort & Structure with AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Parsed Results Section */}
                {parsedBankItems.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-emerald-900 text-xs">
                            {parsedBankItems.length} Q&As Sorted into Structured Fields
                          </h4>
                          <p className="text-[11px] text-emerald-700">
                            Each item is sorted into Question, Answer, and Search Keywords & Tags. Edit any field before saving.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setParsedBankItems([])}
                        className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-semibold cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>

                    {/* List of Sorted Cards */}
                    <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                      {parsedBankItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5 hover:border-indigo-200 transition-colors"
                        >
                          {/* Header of Item Card */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md font-extrabold text-[10px]">
                                Item #{idx + 1}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" />
                                {item.language}
                              </span>
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateParsedItem(idx, 'category', e.target.value)}
                                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-700"
                              >
                                {PRESET_CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleTransferToManual(item)}
                                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded hover:bg-indigo-50 cursor-pointer"
                                title="Edit in single manual form"
                              >
                                Edit in Single Form
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveParsedItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Question Field */}
                          <div>
                            <label className="block font-bold text-slate-800 text-[11px] mb-1">
                              Question (in your chosen language) *
                            </label>
                            <textarea
                              rows={2}
                              value={item.question}
                              onChange={(e) => handleUpdateParsedItem(idx, 'question', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Answer Field */}
                          <div>
                            <label className="block font-bold text-slate-800 text-[11px] mb-1">
                              Answer (in your chosen language) *
                            </label>
                            <textarea
                              rows={3}
                              value={item.answer}
                              onChange={(e) => handleUpdateParsedItem(idx, 'answer', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Search Keywords & Tags */}
                          <div>
                            <label className="block font-bold text-slate-800 text-[11px] mb-1">
                              Search Keywords & Tags (comma-separated, optional)
                            </label>
                            <input
                              type="text"
                              value={item.keywords}
                              onChange={(e) => handleUpdateParsedItem(idx, 'keywords', e.target.value)}
                              className="w-full px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bulk Save Actions */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {parsedBankItems.length} items will be published and immediately queryable by the AI
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddModal(false)}
                          disabled={isSavingBulk}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveBulkFaqs}
                          disabled={isSavingBulk || parsedBankItems.length === 0}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
                        >
                          {isSavingBulk ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving {parsedBankItems.length} FAQs...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>🚀 Save All {parsedBankItems.length} FAQs to University Knowledge Base</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Single Manual Entry */}
            {modalMode === 'manual' && (
              <form onSubmit={handleCreateFaq} className="space-y-4 text-xs">
                {/* Language Selector */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Language / 语言 / 日本語 / 한국어 / ភាសាខ្មែរ / ภาษาไทย / Tiếng Việt / Bahasa *</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">English, East Asian & ASEAN Languages</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESET_LANGUAGES.map(lang => (
                      <button
                        type="button"
                        key={lang.code}
                        onClick={() => setFormData({ ...formData, language: lang.label })}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          formData.language === lang.label
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>

                  {(formData.language === 'Other ASEAN Language' || formData.language === 'Other Language') && (
                    <input
                      type="text"
                      value={formData.customLanguage}
                      onChange={(e) => setFormData({ ...formData, customLanguage: e.target.value })}
                      placeholder="Specify ASEAN language or regional dialect (e.g. Javanese, Sundanese, Cebuano, Tetum, Shan, Ilocano, etc.)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 mt-1"
                      required
                    />
                  )}
                </div>

                {/* Category Selector */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_CATEGORIES.map(cat => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-center transition-colors cursor-pointer border ${
                          formData.category === cat
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, category: '__custom__' })}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-center transition-colors cursor-pointer border ${
                        formData.category === '__custom__'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      + Custom Category
                    </button>
                  </div>

                  {formData.category === '__custom__' && (
                    <input
                      type="text"
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      placeholder="Enter custom category name..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 mt-2"
                      required
                    />
                  )}
                </div>

                {/* Question Field */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Question (in your chosen language) *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="e.g. 国际学生可以在澳大利亚打工多少小时？ / How do I apply for a scholarship?"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium leading-relaxed"
                    required
                  />
                </div>

                {/* Answer Field */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Answer (in your chosen language) *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Provide the complete, official answer. You may use bullet points and helpful details..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-normal leading-relaxed"
                    required
                  />
                </div>

                {/* Keywords / Search Tags */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Search Keywords & Tags (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    value={formData.keywordsInput}
                    onChange={(e) => setFormData({ ...formData, keywordsInput: e.target.value })}
                    placeholder="e.g. 打工, 工作签证, visa, working hours, hecs, tuition"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    If left blank, keywords will be automatically generated from your question.
                  </p>
                </div>

                {/* Live Preview Card */}
                {formData.question.trim() && (
                  <div className="p-3.5 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Live Preview for AI Assistant</span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs">
                      {formData.question}
                    </div>
                    {formData.answer.trim() && (
                      <div className="text-[11px] text-slate-600 line-clamp-2 italic">
                        {formData.answer}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Publish to AI</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
