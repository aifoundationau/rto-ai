import { COURSES_DATA, CourseProgram } from './courses';
import { UNITS_DATA, UnitDetail } from './units';
import { FAQS_DATA, FAQItem } from './faqs';

export interface GoogleSheetsSyncStatus {
  sheetId: string;
  sheetUrl?: string;
  lastSyncedAt: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  coursesCount: number;
  unitsCount: number;
  faqsCount: number;
  source: 'default_database' | 'google_sheets_live';
}

// Global runtime store (persists while server is running)
class DynamicStore {
  private courses: CourseProgram[] = [...COURSES_DATA];
  private units: UnitDetail[] = [...UNITS_DATA];
  private faqs: FAQItem[] = [...FAQS_DATA];
  private syncStatus: GoogleSheetsSyncStatus = {
    sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', // Demo default or user sheet
    lastSyncedAt: null,
    status: 'idle',
    coursesCount: COURSES_DATA.length,
    unitsCount: UNITS_DATA.length,
    faqsCount: FAQS_DATA.length,
    source: 'default_database'
  };

  getCourses(): CourseProgram[] {
    return this.courses;
  }

  setCourses(newCourses: CourseProgram[]): void {
    if (newCourses && newCourses.length > 0) {
      this.courses = newCourses;
      this.syncStatus.coursesCount = newCourses.length;
    }
  }

  getUnits(): UnitDetail[] {
    return this.units;
  }

  setUnits(newUnits: UnitDetail[]): void {
    if (newUnits && newUnits.length > 0) {
      this.units = newUnits;
      this.syncStatus.unitsCount = newUnits.length;
    }
  }

  getFaqs(): FAQItem[] {
    return this.faqs;
  }

  setFaqs(newFaqs: FAQItem[]): void {
    if (newFaqs && newFaqs.length > 0) {
      this.faqs = newFaqs;
      this.syncStatus.faqsCount = newFaqs.length;
    }
  }

  getSyncStatus(): GoogleSheetsSyncStatus {
    return {
      ...this.syncStatus,
      coursesCount: this.courses.length,
      unitsCount: this.units.length,
      faqsCount: this.faqs.length
    };
  }

  setSyncStatus(status: Partial<GoogleSheetsSyncStatus>): void {
    this.syncStatus = {
      ...this.syncStatus,
      ...status
    };
  }
}

// Singleton instance for the Node server runtime
const globalStore = new DynamicStore();

export function getDynamicCourses(): CourseProgram[] {
  return globalStore.getCourses();
}

export function setDynamicCourses(courses: CourseProgram[]): void {
  globalStore.setCourses(courses);
}

export function getDynamicUnits(): UnitDetail[] {
  return globalStore.getUnits();
}

export function setDynamicUnits(units: UnitDetail[]): void {
  globalStore.setUnits(units);
}

export function getDynamicFaqs(): FAQItem[] {
  return globalStore.getFaqs();
}

export function setDynamicFaqs(faqs: FAQItem[]): void {
  globalStore.setFaqs(faqs);
}

export function getGoogleSheetsSyncStatus(): GoogleSheetsSyncStatus {
  return globalStore.getSyncStatus();
}

export function setGoogleSheetsSyncStatus(status: Partial<GoogleSheetsSyncStatus>): void {
  globalStore.setSyncStatus(status);
}
