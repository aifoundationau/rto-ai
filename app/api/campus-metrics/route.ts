import { NextRequest, NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase/admin';
import { requireAdministrationOrSuperAdminCaller } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

export interface CampusMetricsData {
  totalStudents: string;
  placementRate: string;
  facultyStaff: string;
  studentsSubtitle?: string;
  placementSubtitle?: string;
  facultySubtitle?: string;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_CAMPUS_METRICS: CampusMetricsData = {
  totalStudents: '5,000+',
  placementRate: '96%',
  facultyStaff: '350+',
  studentsSubtitle: 'Active learners across all faculties',
  placementSubtitle: 'Graduate employment within 90 days',
  facultySubtitle: 'Academic educators & operational staff',
};

// In-memory runtime cache for high-speed local updates
let runtimeCache: CampusMetricsData = { ...DEFAULT_CAMPUS_METRICS };

export async function GET() {
  if (!isFirebaseConfigured) {
    return NextResponse.json({
      success: true,
      metrics: runtimeCache,
      source: 'memory_fallback',
    });
  }
  try {
    try {
      const docSnap = await db.collection('site_settings').doc('campus_metrics').get();
      if (docSnap.exists) {
        const data = docSnap.data() as CampusMetricsData;
        runtimeCache = {
          ...DEFAULT_CAMPUS_METRICS,
          ...data,
        };
        return NextResponse.json({
          success: true,
          metrics: runtimeCache,
          source: 'firestore',
        });
      }
    } catch (dbErr: any) {
      console.warn('[/api/campus-metrics GET] Firestore read fallback:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      metrics: runtimeCache,
      source: 'memory_fallback',
    });
  } catch (err: any) {
    console.error('[/api/campus-metrics GET] Error:', err);
    return NextResponse.json({
      success: true,
      metrics: runtimeCache,
      error: err.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      totalStudents,
      placementRate,
      facultyStaff,
      studentsSubtitle,
      placementSubtitle,
      facultySubtitle,
    } = body;

    // RBAC check: only administration and superadmin can modify campus metrics
    let updatedBy = 'system_admin';
    const authResult = await requireAdministrationOrSuperAdminCaller(req);
    if ('errorResponse' in authResult) {
      // In development mode without active auth headers, allow graceful admin fallback with warning
      if (process.env.NODE_ENV === 'development' && !req.headers.get('authorization')) {
        console.warn('[/api/campus-metrics POST] Dev mode: bypassing token check.');
        updatedBy = 'dev_admin';
      } else {
        return authResult.errorResponse;
      }
    } else {
      updatedBy = authResult.caller.email || authResult.caller.role;
    }

    const updatedMetrics: CampusMetricsData = {
      totalStudents: totalStudents?.trim() || runtimeCache.totalStudents || '5,000+',
      placementRate: placementRate?.trim() || runtimeCache.placementRate || '96%',
      facultyStaff: facultyStaff?.trim() || runtimeCache.facultyStaff || '350+',
      studentsSubtitle: studentsSubtitle?.trim() || 'Active learners across all faculties',
      placementSubtitle: placementSubtitle?.trim() || 'Graduate employment within 90 days',
      facultySubtitle: facultySubtitle?.trim() || 'Academic educators & operational staff',
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    runtimeCache = { ...updatedMetrics };

    try {
      await db.collection('site_settings').doc('campus_metrics').set(updatedMetrics, { merge: true });
    } catch (dbErr: any) {
      console.warn('[/api/campus-metrics POST] Firestore write warning:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      metrics: updatedMetrics,
      message: 'Campus metrics updated successfully.',
    });
  } catch (err: any) {
    console.error('[/api/campus-metrics POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update campus metrics' },
      { status: 500 }
    );
  }
}
