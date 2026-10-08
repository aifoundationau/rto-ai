import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_TENANT_CONFIG,
  initializeCourseBuilderDatabase,
  getPrograms,
  saveProgram,
  getUnits,
  saveUnit,
  auditProgramCompliance,
  validateAssessmentWeighting,
  createProgramVersion
} from '@/lib/course-builder/service';
import { ProgramDocument, UnitDocument } from '@/lib/course-builder/types';
import { assignUniversityRole } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get('programId');

    const programs = await getPrograms();
    const units = await getUnits(programId || undefined);

    let complianceReport = null;
    if (programId) {
      const selectedProgram = programs.find(p => p.id === programId);
      if (selectedProgram) {
        complianceReport = auditProgramCompliance(selectedProgram, units);
      }
    }

    return NextResponse.json({
      success: true,
      tenantConfig: DEFAULT_TENANT_CONFIG,
      programs,
      units,
      complianceReport,
    });
  } catch (error: any) {
    console.error('Error in /api/course-builder GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case 'init_database': {
        const initResult = await initializeCourseBuilderDatabase();
        const programs = await getPrograms();
        const units = await getUnits();
        return NextResponse.json({
          ...initResult,
          tenantConfig: DEFAULT_TENANT_CONFIG,
          programs,
          units,
        });
      }

      case 'prepare_superadmin': {
        const superadminAccounts = [
          {
            uid: 'admin_super_01',
            email: 'eleanor.vance@edupulse.edu.au',
            fullName: 'Dr. Eleanor Vance',
            role: 'SUPERADMIN',
            dept: 'Academic Operations & Curriculum Commission',
          },
          {
            uid: 'L5euSJAfNKdDOX6mT0qmrCGjUA53',
            email: 'admin@aifoundation.net.au',
            fullName: 'Executive Superadmin',
            role: 'SUPERADMIN',
            dept: 'Executive Directorate & Course Governance',
          }
        ];

        const results = [];
        for (const account of superadminAccounts) {
          try {
            await assignUniversityRole(account);
            results.push({ uid: account.uid, email: account.email, status: 'success' });
          } catch (e: any) {
            results.push({ uid: account.uid, email: account.email, status: 'warning', error: e.message });
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Superadmin accounts prepared with custom claims and administrative roles.',
          accounts: results
        });
      }

      case 'save_program': {
        const program: ProgramDocument = payload.program;
        if (!program || !program.id || !program.title) {
          return NextResponse.json({ error: 'Invalid program data' }, { status: 400 });
        }
        const result = await saveProgram(program);
        return NextResponse.json(result);
      }

      case 'save_unit': {
        const unit: UnitDocument = payload.unit;
        if (!unit || !unit.id || !unit.title) {
          return NextResponse.json({ error: 'Invalid unit data' }, { status: 400 });
        }

        // Validate 100% assessment weight
        const weightValidation = validateAssessmentWeighting(unit);
        const result = await saveUnit(unit);

        return NextResponse.json({
          ...result,
          weightValidation,
        });
      }

      case 'audit_compliance': {
        const { programId } = payload;
        const programs = await getPrograms();
        const targetProgram = programs.find(p => p.id === programId);
        if (!targetProgram) {
          return NextResponse.json({ error: 'Program not found' }, { status: 404 });
        }
        const units = await getUnits(programId);
        const report = auditProgramCompliance(targetProgram, units);
        return NextResponse.json({ success: true, report });
      }

      case 'create_version': {
        const { programId } = payload;
        const result = await createProgramVersion(programId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in /api/course-builder POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
