import { NextRequest, NextResponse } from 'next/server';
import { assignUniversityRole } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, role, dept, fullName, email } = body;

    if (!uid || !role) {
      return NextResponse.json(
        { error: 'Missing required parameters "uid" or "role".' },
        { status: 400 }
      );
    }

    const result = await assignUniversityRole({
      uid,
      role,
      dept,
      fullName,
      email,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in /api/assign-role:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to assign role' },
      { status: 500 }
    );
  }
}
