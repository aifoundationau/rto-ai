import React, { useState, useMemo } from 'react';
import { FAQItem } from '@/data/faqs';
import { HelpCircle, ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';

interface FaqListCardProps {
  faqs: FAQItem[];
  onSelectFaq?: (question: string) => void;
}

export const FaqListCard: React.FC<FaqListCardProps> = ({ faqs, onSelectFaq }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(faqs[0]?.id || null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => set.add(f.category));
    return ['All', ...Array.from(set)];
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((f) => {
      const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
      const q = searchFilter.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.keywords.some((k) => k.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [faqs, selectedCategory, searchFilter]);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="my-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            University Knowledge Base & FAQs ({faqs.length})
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-500">
          Showing {filteredFaqs.length} of {faqs.length}
        </span>
      </div>

      {/* Category Pills & Filter Bar */}
      <div className="p-3 bg-white border-b border-slate-100 space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {faqs.length > 3 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter questions or keywords..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
            />
          </div>
        )}
      </div>

      {/* Accordion Questions */}
      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {filteredFaqs.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No FAQs matching "{searchFilter}" in {selectedCategory}.
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div key={faq.id} className="p-3 transition-colors hover:bg-slate-50/60">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                  className="w-full flex items-start justify-between text-left gap-2 text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-medium border border-indigo-100 shrink-0">
                      {faq.category}
                    </span>
                    <span>{faq.question}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 text-xs text-slate-600 pl-2 border-l-2 border-indigo-400 leading-relaxed bg-indigo-50/20 py-1.5 rounded-r-lg">
                    <p className="text-slate-700">{faq.answer}</p>

                    {faq.keywords && faq.keywords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {faq.keywords.slice(0, 4).map((kw, kidx) => (
                          <span
                            key={kidx}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-mono"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {onSelectFaq && (
                      <button
                        onClick={() => onSelectFaq(faq.question)}
                        className="mt-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500 group-hover:rotate-12 transition-transform" />
                        Ask more about this &rarr;
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
