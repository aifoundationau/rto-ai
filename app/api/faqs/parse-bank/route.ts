import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface ParsedFaqItem {
  question: string;
  answer: string;
  keywords: string;
  category: string;
  language: string;
}

/**
 * Intelligent fallback parser for raw Q&A text dumps.
 * Handles English, East Asian (Chinese, Japanese, Korean), and ASEAN languages
 * (Khmer, Thai, Vietnamese, Indonesian, Malay, Tagalog, Burmese, Lao).
 */
function heuristicParseBank(rawText: string, language: string, defaultCategory: string): ParsedFaqItem[] {
  const items: ParsedFaqItem[] = [];
  const text = rawText.trim();
  if (!text) return items;

  // Regex patterns for Question and Answer labels across multilingual conventions
  const qPrefixRegex = /(?:^|\n+)(?:(?:Q\s*[:\.\-]|Q\d+\s*[:\.\-]|Question\s*\d*\s*[:\.\-]|問\s*[:\.\-]|質問\s*[:\.\-]|问题\s*[:\.\-]|질문\s*[:\.\-]|Hỏi\s*[:\.\-]|Câu\s*hỏi\s*\d*\s*[:\.\-]|คำถาม\s*[:\.\-]|សំណួរ\s*[:\.\-]|Pertanyaan\s*[:\.\-]|Soalan\s*[:\.\-]|Tanong\s*[:\.\-])\s*|(?:(?:\d+[\.\)]\s*)(?=[^\n]+\?|[^\n]+？)))/i;
  const aPrefixRegex = /(?:^|\n+)(?:A\s*[:\.\-]|A\d+\s*[:\.\-]|Answer\s*\d*\s*[:\.\-]|答\s*[:\.\-]|回答\s*[:\.\-]|答案\s*[:\.\-]|답변\s*[:\.\-]|Đáp\s*[:\.\-]|Trả\s*lời\s*[:\.\-]|คำตอบ\s*[:\.\-]|ចម្លើយ\s*[:\.\-]|Jawaban\s*[:\.\-]|Jawapan\s*[:\.\-]|Sagot\s*[:\.\-])\s*/i;

  // Attempt line-by-line / block-by-block scanning
  const lines = text.split('\n');
  let currentQ: string | null = null;
  let currentA: string[] = [];

  const commitCurrent = () => {
    if (currentQ && currentA.length > 0) {
      const qClean = currentQ.trim();
      const aClean = currentA.join('\n').trim();
      if (qClean && aClean) {
        items.push({
          question: qClean,
          answer: aClean,
          keywords: generateKeywords(qClean, aClean),
          category: detectCategory(qClean + ' ' + aClean, defaultCategory),
          language
        });
      }
    }
    currentQ = null;
    currentA = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentA.length > 0) {
        currentA.push('');
      }
      continue;
    }

    // Check if line is a Question
    const qMatch = line.match(/^(?:Q\d*|Question\s*\d*|問\d*|質問\d*|问题\d*|질문\d*|Hỏi\d*|Câu\s*hỏi\s*\d*|คำถาม\s*\d*|សំណួរ\s*\d*|Pertanyaan\s*\d*|Soalan\s*\d*|Tanong\s*\d*)\s*[:：\.\-]\s*(.*)$/i)
      || line.match(/^(\d+[\.\)]\s*.+[\?？]\s*)$/);

    if (qMatch) {
      commitCurrent();
      currentQ = (qMatch[1] || qMatch[0]).replace(/^\d+[\.\)]\s*/, '').trim();
      continue;
    }

    // Check if line is an Answer
    const aMatch = line.match(/^(?:A\d*|Answer\s*\d*|答\d*|回答\d*|答案\d*|답변\d*|Đáp\d*|Trả\s*lời\s*\d*|คำตอบ\s*\d*|ចម្លើយ\s*\d*|Jawaban\s*\d*|Jawapan\s*\d*|Sagot\s*\d*)\s*[:：\.\-]\s*(.*)$/i);
    if (aMatch && currentQ) {
      currentA.push(aMatch[1].trim());
      continue;
    }

    // If we have a Question and haven't explicitly hit an Answer marker, check if this line is part of Q or A
    if (currentQ) {
      currentA.push(line);
    } else if (line.endsWith('?') || line.endsWith('？')) {
      commitCurrent();
      currentQ = line;
    }
  }

  commitCurrent();

  // If structured scanning didn't catch pairs, try splitting on double newlines
  if (items.length === 0) {
    const blocks = text.split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);
    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b];
      const blockLines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (blockLines.length >= 2) {
        const firstLine = blockLines[0].replace(/^(?:Q\d*[:\.\-]|Question\d*[:\.\-]|\d+[\.\)])\s*/i, '');
        const rest = blockLines.slice(1).join('\n').replace(/^(?:A\d*[:\.\-]|Answer\d*[:\.\-])\s*/i, '');
        items.push({
          question: firstLine,
          answer: rest,
          keywords: generateKeywords(firstLine, rest),
          category: detectCategory(firstLine + ' ' + rest, defaultCategory),
          language
        });
      }
    }
  }

  return items;
}

function detectCategory(text: string, defaultCat: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('scholarship') || lower.includes('fee') || lower.includes('tuition') || lower.includes('hecs') || lower.includes('csp') || lower.includes('cost') || lower.includes('grant') || lower.includes('học bổng') || lower.includes('học phí') || lower.includes('奖学金') || lower.includes('学费') || lower.includes('장학금') || lower.includes('등록금')) {
    return 'Fees & Scholarships';
  }
  if (lower.includes('visa') || lower.includes('passport') || lower.includes('overseas') || lower.includes('international') || lower.includes('ielts') || lower.includes('toefl') || lower.includes('pte') || lower.includes('ecoe') || lower.includes('du học') || lower.includes('留学生') || lower.includes('유학생')) {
    return 'International';
  }
  if (lower.includes('course') || lower.includes('curriculum') || lower.includes('degree') || lower.includes('credit') || lower.includes('master') || lower.includes('bachelor') || lower.includes('semester') || lower.includes('ngành học') || lower.includes('课程') || lower.includes('학위')) {
    return 'Courses & Study';
  }
  if (lower.includes('work') || lower.includes('hours') || lower.includes('subclass 500') || lower.includes('employment') || lower.includes('job') || lower.includes('việc làm') || lower.includes('工作')) {
    return 'Student Visa & Work Rights';
  }
  if (lower.includes('campus') || lower.includes('accommodation') || lower.includes('dorm') || lower.includes('library') || lower.includes('living') || lower.includes('ký túc xá') || lower.includes('宿舍') || lower.includes('기숙사')) {
    return 'Campus Life';
  }
  if (lower.includes('tutor') || lower.includes('academic support') || lower.includes('counseling') || lower.includes('hỗ trợ') || lower.includes('辅导')) {
    return 'Academic Support';
  }
  return defaultCat || 'Admissions';
}

function generateKeywords(q: string, a: string): string {
  const fullText = (q + ' ' + a).toLowerCase();
  const stopwords = new Set([
    'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 'the', 'and', 'for', 'are', 'is', 'in', 'to', 'of', 'a', 'an', 'can', 'with', 'on', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'should', 'have', 'has', 'had', 'does', 'did', 'will', 'would', 'could', 'about'
  ]);

  const words = fullText
    .split(/[\s,.;:!?¿¡\(\)\[\]{}'"“”]+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !stopwords.has(w));

  const unique = Array.from(new Set(words));
  return unique.slice(0, 6).join(', ');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawBank, language = 'English (en)', category = 'Admissions' } = body;

    if (!rawBank || typeof rawBank !== 'string' || !rawBank.trim()) {
      return NextResponse.json({ error: 'Please provide raw text containing questions and answers.' }, { status: 400 });
    }

    const trimmedBank = rawBank.trim();
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // 1. Try Gemini AI Structured Parsing if key is available
    if (apiKey) {
      try {
        const systemInstruction = `You are an expert higher education knowledge manager and admissions officer.
Your task is to take a raw text bank of completed questions and answers (which may be in English, Japanese, Korean, Chinese, Khmer, Thai, Vietnamese, Indonesian, Malay, Tagalog, Burmese, Lao, etc.) and accurately sort and structure every distinct Q&A item into clean, well-organized fields.

CRITICAL REQUIREMENTS:
1. Retain the target language: "${language}" for each question and answer (do not translate unless the raw text was mixed; preserve the authentic language of the user).
2. For each Q&A pair, extract:
   - "question": Clean, complete question string in the designated language.
   - "answer": Comprehensive, accurate answer string in the designated language.
   - "keywords": Comma-separated search keywords and tags (e.g. "admissions, ielts, deadline, visa requirements").
   - "category": Choose the best matching category from: ["Admissions", "Fees & Scholarships", "Courses & Study", "International", "Campus Life", "Applications", "Student Visa & Work Rights", "Academic Support"]. Default to "${category}" if unclear.
   - "language": "${language}"

Return ONLY a valid JSON array of objects with the structure:
[
  {
    "question": "...",
    "answer": "...",
    "keywords": "...",
    "category": "...",
    "language": "..."
  }
]`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Here is the raw bank of completed questions and answers to sort:\n\n${trimmedBank.slice(0, 15000)}`
                    }
                  ]
                }
              ],
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = JSON.parse(candidateText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const formatted: ParsedFaqItem[] = parsed.map(item => ({
                question: String(item.question || '').trim(),
                answer: String(item.answer || '').trim(),
                keywords: Array.isArray(item.keywords)
                  ? item.keywords.join(', ')
                  : String(item.keywords || '').trim(),
                category: String(item.category || category).trim(),
                language: String(item.language || language).trim()
              })).filter(i => i.question && i.answer);

              if (formatted.length > 0) {
                return NextResponse.json({
                  success: true,
                  source: 'gemini-ai',
                  count: formatted.length,
                  items: formatted
                });
              }
            }
          }
        } else {
          const errText = await response.text();
          console.warn('[parse-bank] Gemini API returned error:', response.status, errText);
        }
      } catch (geminiErr) {
        console.warn('[parse-bank] Gemini call failed, falling back to heuristic:', geminiErr);
      }
    }

    // 2. Intelligent Heuristic Multilingual Parser Fallback
    const heuristicItems = heuristicParseBank(trimmedBank, language, category);

    if (heuristicItems.length === 0) {
      // If even heuristic couldn't find structured pairs, treat the whole prompt as a single Q&A candidate
      const lines = trimmedBank.split('\n').filter(Boolean);
      const singleQ = lines[0] || 'Frequently Asked Question';
      const singleA = lines.slice(1).join('\n') || trimmedBank;
      heuristicItems.push({
        question: singleQ,
        answer: singleA,
        keywords: generateKeywords(singleQ, singleA),
        category,
        language
      });
    }

    return NextResponse.json({
      success: true,
      source: 'heuristic-parser',
      count: heuristicItems.length,
      items: heuristicItems
    });
  } catch (err: any) {
    console.error('Error in /api/faqs/parse-bank:', err);
    return NextResponse.json({ error: err.message || 'Failed to parse FAQ bank' }, { status: 500 });
  }
}
