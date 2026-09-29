import { NextRequest, NextResponse } from 'next/server';
import { recordActivity, getRecentActivityLogs, db } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, action, userId, userEmail, userRole, metadata, timestamp } = body;

    if (!category || !action) {
      return NextResponse.json({ error: 'Missing required event fields: category, action' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const result = await recordActivity({
      category,
      action,
      userId,
      userEmail,
      userRole,
      metadata: metadata || {},
      timestamp: timestamp || new Date().toISOString(),
      userAgent,
      ip,
    });

    return NextResponse.json({
      success: result.success,
      logId: result.logId,
      error: result.error ? String(result.error) : undefined
    }, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    console.error('Error in /api/telemetry POST:', error);
    return NextResponse.json({ error: error.message || 'Telemetry write failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const logs = await getRecentActivityLogs(60);

    // Also fetch aggregated platform metrics
    let metrics = null;
    try {
      const metricsDoc = await db.collection('metrics').doc('platform_stats').get();
      if (metricsDoc.exists) {
        metrics = metricsDoc.data();
      }
    } catch (e) {
      // non-fatal
    }

    return NextResponse.json({
      success: true,
      logs,
      metrics,
    });
  } catch (error: any) {
    console.error('Error in /api/telemetry GET:', error);
    return NextResponse.json({ error: error.message || 'Telemetry fetch failed' }, { status: 500 });
  }
}
