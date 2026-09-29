import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { SAMPLE_STUDENTS, SAMPLE_STAFF } from '@/scripts/seed-database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let usersList: any[] = [];

    try {
      const snapshot = await db.collection('users').get();
      if (!snapshot.empty) {
        snapshot.forEach((doc: any) => {
          usersList.push({ id: doc.id, ...doc.data() });
        });
      }
    } catch (dbErr) {
      console.warn('Firestore fetch failed or not configured, using seed fallback:', dbErr);
    }

    // Fallback to sample data if Firestore is empty or uninitialized
    if (usersList.length === 0) {
      usersList = [...SAMPLE_STUDENTS, ...SAMPLE_STAFF];
    }

    return NextResponse.json({ users: usersList });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
