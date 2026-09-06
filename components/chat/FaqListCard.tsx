import React, { useState } from 'react';
import { FAQItem } from '@/data/faqs';
import { HelpCircle, ChevronDown, ChevronUp, Tag } from 'lucide-react';

interface FaqListCardProps {
  faqs: FAQItem[];
  onSelectFaq?: (question: string) => void;
}

export const FaqListCard: React.FC<FaqListCardProps> = ({ faqs, onSelectFaq }) => {
  const [expandedId, setExpandedId] = useState<string | null>(faqs[0]?.id || null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="my-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-indigo-600" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          University Knowledge Base & FAQs
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {faqs.map((faq) => {
          const isExpanded = expandedId === faq.id;
          return (
            <div key={faq.id} className="p-3 transition-colors hover:bg-slate-50/50">
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
                <div className="mt-2 text-xs text-slate-600 pl-2 border-l-2 border-indigo-200 leading-relaxed">
                  <p>{faq.answer}</p>

                  {onSelectFaq && (
                    <button
                      onClick={() => onSelectFaq(faq.question)}
                      className="mt-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Ask more about this &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
