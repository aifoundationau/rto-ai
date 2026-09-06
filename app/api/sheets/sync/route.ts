import { NextRequest, NextResponse } from 'next/server';
import {
  syncFromGoogleSheet,
  generateStarterCsv,
  extractGoogleSheetId
} from '@/lib/sheets/googleSheetsSync';
import {
  getGoogleSheetsSyncStatus,
  getDynamicCourses,
  getDynamicUnits,
  getDynamicFaqs
} from '@/data/dynamicStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const template = searchParams.get('template');

  // Handle template CSV file download
  if (template === 'courses' || template === 'units' || template === 'faqs') {
    const csvContent = generateStarterCsv(template);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="university_${template}_template.csv"`
      }
    });
  }

  // Otherwise return sync status
  const status = getGoogleSheetsSyncStatus();
  return NextResponse.json({
    ...status,
    courses: getDynamicCourses(),
    units: getDynamicUnits(),
    faqs: getDynamicFaqs()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sheetIdOrUrl } = body;

    if (!sheetIdOrUrl) {
      return NextResponse.json(
        { error: 'Please provide a valid Google Sheet ID or public Google Sheets URL.' },
        { status: 400 }
      );
    }

    const result = await syncFromGoogleSheet(sheetIdOrUrl);
    const updatedStatus = getGoogleSheetsSyncStatus();

    return NextResponse.json({
      ...result,
      syncStatus: updatedStatus
    });
  } catch (error: any) {
    console.error('Error in /api/sheets/sync POST:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during Google Sheets sync' },
      { status: 500 }
    );
  }
}
