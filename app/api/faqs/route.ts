import { NextRequest, NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase/admin';
import { FAQS_DATA, FAQItem } from '@/data/faqs';
import { getDynamicFaqs, setDynamicFaqs, addDynamicFaq, removeDynamicFaq } from '@/data/dynamicStore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/faqs
 * Retrieves all University Knowledge Base and FAQ items.
 * Merges static initial questions with dynamic custom staff-added FAQs from Firestore.
 */
export async function GET() {
  try {
    const customFaqs: FAQItem[] = [];

    if (isFirebaseConfigured) {
      try {
        const snapshot = await db.collection('faqs').get();
      if (!snapshot.empty) {
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          if (data && data.question && data.answer) {
            customFaqs.push({
              id: doc.id,
              question: data.question,
              answer: data.answer,
              category: data.category || 'Admissions',
              keywords: Array.isArray(data.keywords) ? data.keywords : [],
              language: data.language || 'English',
              authorEmail: data.authorEmail || 'staff@edupulse.edu.au',
              createdAt: data.createdAt || new Date().toISOString(),
              isCustom: true
            });
          }
        });
      }
    } catch (dbErr) {
      console.warn('[FAQ API] Firestore query failed, falling back to dynamicStore memory:', dbErr);
    }
  }

    // Merge static baseline FAQS_DATA (10 default) with custom FAQs, ensuring no ID collisions
    const customMap = new Map<string, FAQItem>();
    for (const cf of customFaqs) {
      customMap.set(cf.id, cf);
    }

    // Also include any custom items that were temporarily stored in dynamicStore
    for (const df of getDynamicFaqs()) {
      if (df.isCustom && !customMap.has(df.id)) {
        customMap.set(df.id, df);
      }
    }

    const mergedFaqs: FAQItem[] = [
      ...Array.from(customMap.values()).sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }),
      ...FAQS_DATA.filter(f => !customMap.has(f.id))
    ];

    // Synchronize global in-memory store so AI assistant tools immediately see all FAQs
    setDynamicFaqs(mergedFaqs);

    return NextResponse.json({
      success: true,
      faqs: mergedFaqs,
      count: mergedFaqs.length,
      customCount: customMap.size,
      staticCount: FAQS_DATA.length
    });
  } catch (err: any) {
    console.error('Error fetching FAQs:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch FAQs' }, { status: 500 });
  }
}

/**
 * POST /api/faqs
 * Allows staff to add new questions and answers in ANY language (Unicode / multilingual).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if bulk creation was requested
    if (Array.isArray(body.faqs) && body.faqs.length > 0) {
      const createdFaqs: FAQItem[] = [];
      const authorEmail = body.authorEmail || 'staff@edupulse.edu.au';

      for (const item of body.faqs) {
        if (!item.question || !item.answer) continue;

        const trimmedQuestion = String(item.question).trim();
        const trimmedAnswer = String(item.answer).trim();
        if (!trimmedQuestion || !trimmedAnswer) continue;

        const trimmedCategory = (item.category && String(item.category).trim()) || 'Admissions';
        const trimmedLanguage = (item.language && String(item.language).trim()) || 'English (en)';

        let parsedKeywords: string[] = [];
        if (Array.isArray(item.keywords)) {
          parsedKeywords = item.keywords.map((k: any) => String(k).trim()).filter(Boolean);
        } else if (typeof item.keywords === 'string' && item.keywords.trim()) {
          parsedKeywords = item.keywords.split(/[,;\n]+/).map((k: string) => k.trim()).filter(Boolean);
        }

        if (parsedKeywords.length === 0) {
          const words = trimmedQuestion
            .split(/[\s,.;:!?¿¡\(\)\[\]{}'"“”]+/)
            .map((w: string) => w.trim().toLowerCase())
            .filter((w: string) => w.length > 2);
          parsedKeywords = (Array.from(new Set(words)) as string[]).slice(0, 8);
        }

        const faqId = `faq-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newFaq: FAQItem = {
          id: faqId,
          question: trimmedQuestion,
          answer: trimmedAnswer,
          category: trimmedCategory,
          keywords: parsedKeywords,
          language: trimmedLanguage,
          authorEmail: item.authorEmail || authorEmail,
          createdAt: new Date().toISOString(),
          isCustom: true
        };

        // Save to Firestore
        try {
          await db.collection('faqs').doc(faqId).set({
            ...newFaq,
            tenantTag: 'rto-ai',
            updatedAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('[FAQ API] Firestore save failed for item, persisted in memory:', dbErr);
        }

        // Add to dynamicStore
        addDynamicFaq(newFaq);
        createdFaqs.push(newFaq);
      }

      return NextResponse.json({
        success: true,
        count: createdFaqs.length,
        faqs: createdFaqs,
        message: `Successfully saved ${createdFaqs.length} Q&A items to knowledge base`
      });
    }

    // Single FAQ creation
    const { question, answer, category, language, keywords, authorEmail } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }
    if (!answer || !answer.trim()) {
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();
    const trimmedCategory = (category && category.trim()) || 'Admissions';
    const trimmedLanguage = (language && language.trim()) || 'English (en)';

    // Parse or extract keywords
    let parsedKeywords: string[] = [];
    if (Array.isArray(keywords)) {
      parsedKeywords = keywords.map(k => String(k).trim()).filter(Boolean);
    } else if (typeof keywords === 'string' && keywords.trim()) {
      parsedKeywords = keywords.split(/[,;\n]+/).map(k => k.trim()).filter(Boolean);
    }

    // If keywords are empty, automatically extract meaningful tokens from question
    if (parsedKeywords.length === 0) {
      const words = trimmedQuestion
        .split(/[\s,.;:!?¿¡\(\)\[\]{}'"“”]+/)
        .map((w: string) => w.trim().toLowerCase())
        .filter((w: string) => w.length > 2);
      parsedKeywords = (Array.from(new Set(words)) as string[]).slice(0, 8);
    }

    const faqId = `faq-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newFaq: FAQItem = {
      id: faqId,
      question: trimmedQuestion,
      answer: trimmedAnswer,
      category: trimmedCategory,
      keywords: parsedKeywords,
      language: trimmedLanguage,
      authorEmail: authorEmail || 'staff@edupulse.edu.au',
      createdAt: new Date().toISOString(),
      isCustom: true
    };

    // 1. Save to Firestore
    try {
      await db.collection('faqs').doc(faqId).set({
        ...newFaq,
        tenantTag: 'rto-ai',
        updatedAt: new Date().toISOString()
      });
    } catch (dbErr) {
      console.warn('[FAQ API] Firestore save failed, persisted in memory:', dbErr);
    }

    // 2. Synchronize in-memory dynamic store so the assistant immediately knows the answer
    addDynamicFaq(newFaq);

    return NextResponse.json({
      success: true,
      faq: newFaq,
      message: 'FAQ item successfully added'
    });
  } catch (err: any) {
    console.error('Error creating FAQ item:', err);
    return NextResponse.json({ error: err.message || 'Failed to create FAQ' }, { status: 500 });
  }
}

/**
 * DELETE /api/faqs
 * Allows staff/superadmin to delete a custom FAQ item.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // Ignored
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'FAQ id is required' }, { status: 400 });
    }

    // Prevent deletion of static baseline system FAQs
    if (FAQS_DATA.some(f => f.id === id)) {
      return NextResponse.json({
        error: 'System core FAQs cannot be deleted. You can only delete custom staff-added FAQs.'
      }, { status: 403 });
    }

    // 1. Delete from Firestore
    try {
      await db.collection('faqs').doc(id).delete();
    } catch (dbErr) {
      console.warn('[FAQ API] Firestore delete failed:', dbErr);
    }

    // 2. Remove from dynamic store
    removeDynamicFaq(id);

    return NextResponse.json({
      success: true,
      deletedId: id,
      message: 'FAQ item successfully deleted'
    });
  } catch (err: any) {
    console.error('Error deleting FAQ item:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete FAQ' }, { status: 500 });
  }
}
