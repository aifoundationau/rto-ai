import { NextRequest, NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase/admin';
import { requireAdministrationOrSuperAdminCaller } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

export interface CampusMetricsData {
  heroBadgeText?: string;
  totalStudents: string;
  placementRate: string;
  facultyStaff: string;
  studentsSubtitle?: string;
  placementSubtitle?: string;
  facultySubtitle?: string;
  // Severe Emergency Update (Weather / Environmental Hazard)
  emergencyAlert?: string;
  emergencyTitle?: string;
  emergencyActive?: boolean;
  emergencySeverity?: 'critical' | 'severe' | 'warning';
  emergencyUpdatedAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_CAMPUS_METRICS: CampusMetricsData = {
  heroBadgeText: 'Your Future is Now • Powered by Gemini',
  totalStudents: '5,000+',
  placementRate: '96%',
  facultyStaff: '350+',
  studentsSubtitle: 'Active learners across all faculties',
  placementSubtitle: 'Graduate employment within 90 days',
  facultySubtitle: 'Academic educators & operational staff',
  emergencyAlert: '',
  emergencyTitle: '',
  emergencyActive: false,
  emergencySeverity: 'severe',
  emergencyUpdatedAt: '',
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
      heroBadgeText,
      totalStudents,
      placementRate,
      facultyStaff,
      studentsSubtitle,
      placementSubtitle,
      facultySubtitle,
      emergencyAlert,
      emergencyTitle,
      emergencyActive,
      emergencySeverity,
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

    const hasEmergencyContent = typeof emergencyAlert === 'string' && emergencyAlert.trim().length > 0;
    const isEmergencyActive = Boolean(emergencyActive && hasEmergencyContent);

    const updatedMetrics: CampusMetricsData = {
      heroBadgeText: heroBadgeText !== undefined ? heroBadgeText.trim() : (runtimeCache.heroBadgeText || 'Your Future is Now • Powered by Gemini'),
      totalStudents: totalStudents?.trim() || runtimeCache.totalStudents || '5,000+',
      placementRate: placementRate?.trim() || runtimeCache.placementRate || '96%',
      facultyStaff: facultyStaff?.trim() || runtimeCache.facultyStaff || '350+',
      studentsSubtitle: studentsSubtitle?.trim() || 'Active learners across all faculties',
      placementSubtitle: placementSubtitle?.trim() || 'Graduate employment within 90 days',
      facultySubtitle: facultySubtitle?.trim() || 'Academic educators & operational staff',
      emergencyAlert: typeof emergencyAlert === 'string' ? emergencyAlert.trim() : (runtimeCache.emergencyAlert || ''),
      emergencyTitle: typeof emergencyTitle === 'string' ? emergencyTitle.trim() : (runtimeCache.emergencyTitle || ''),
      emergencyActive: isEmergencyActive,
      emergencySeverity: emergencySeverity || runtimeCache.emergencySeverity || 'severe',
      emergencyUpdatedAt: isEmergencyActive ? (runtimeCache.emergencyActive && runtimeCache.emergencyAlert === emergencyAlert?.trim() && runtimeCache.emergencyUpdatedAt ? runtimeCache.emergencyUpdatedAt : new Date().toISOString()) : '',
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
