import { NextRequest, NextResponse } from 'next/server';
import { saveTokenTransaction, db } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, performedBy, targetAllocation, tokensAmount, audEquivalent, reason, metadata } = body;

    if (!action || !performedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await saveTokenTransaction({
      action,
      performedBy,
      targetAllocation: targetAllocation || 'N/A',
      tokensAmount: Number(tokensAmount) || 0,
      audEquivalent: Number(audEquivalent) || 0,
      reason: reason || '',
      metadata: metadata || {},
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error('Error in /api/tokens POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection('token_transactions')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const transactions: any[] = [];
    snapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    console.warn('Firestore token transactions read fallback:', error);
    return NextResponse.json({ success: false, transactions: [] });
  }
}
