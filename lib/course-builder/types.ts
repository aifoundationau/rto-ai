/**
 * Globally Agnostic Multi-Tenant Course Builder Schema
 * Complies with AQF, EQF, US Carnegie, and UK CATS accreditation frameworks.
 */

export type AccreditationFramework = 'AQF' | 'EQF' | 'US_CARNEGIE' | 'UK_CATS' | 'UNACCREDITED';

export interface FrameworkLevel {
  level: number | string;
  name: string;
  description?: string;
}

export interface CreditSystemConfig {
  name: string; // e.g. "Credit Points", "ECTS", "Carnegie Units", "EFTSL"
  standardAnnualVolume: number; // e.g. 48 for AU, 60 for EU, 30 for US
  standardUnitVolume: number; // e.g. 6 credit points per unit
}

export interface TerminologyMapping {
  program: string; // "Program" | "Degree" | "Qualification"
  unit: string;    // "Unit" | "Subject" | "Course"
  module: string;  // "Module" | "Week" | "Topic"
  outcome: string; // "Learning Outcome" | "Competency"
}

export interface TenantConfig {
  tenantId: string;
  institutionName: string;
  countryCode: string;
  framework: AccreditationFramework;
  frameworkLevels: FrameworkLevel[];
  creditSystem: CreditSystemConfig;
  terminology: TerminologyMapping;
  isK12OrUnaccredited?: boolean;
  updatedAt: string;
}

export interface ProgramOutcome {
  id: string;
  code: string; // e.g. "PLO-1", "PLO-2"
  title: string;
  statement: string;
  category: 'Knowledge' | 'Skills' | 'Application' | 'Autonomy';
}

export interface UnitOutcome {
  id: string;
  code: string; // e.g. "ULO-1", "ULO-2"
  statement: string;
  mappedPloIds: string[]; // Junction: Maps this ULO to parent Program Outcomes
}

export type AssessmentType = 'Formative' | 'Summative' | 'Capstone' | 'Practical / Lab';

export interface AssessmentItem {
  id: string;
  title: string;
  type: AssessmentType;
  weight: number; // percentage (sum must equal 100 per unit)
  dueDateWeek?: number;
  wordCountOrDuration?: string;
  mappedUloIds: string[]; // Maps assessment to Unit Outcomes for compliance
}

export type ContentBlockType = 'rich_text' | 'video' | 'quiz' | 'scorm' | 'lti_tool' | 'downloadable_resource';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  title: string;
  content: string; // markdown or html content
  mediaUrl?: string;
  durationMinutes?: number;
  isMandatory?: boolean;
}

export interface PresentationItem {
  id?: string;
  title?: string;
  url?: string; // Google Slides or presentation URL
  type?: 'link' | 'attachment';
  attachmentName?: string;
  attachmentSize?: string;
  attachmentData?: string; // Base64 data URL or storage reference
  updatedAt?: string;
}

export interface HandoutItem {
  id: string;
  title: string;
  type: 'gdrive' | 'attachment' | 'url';
  driveUrl?: string; // Google Drive document or folder link
  attachmentName?: string;
  attachmentSize?: string;
  attachmentData?: string; // Base64 data URL or storage reference
  category?: 'worksheet' | 'reading' | 'slides_notes' | 'lab_manual' | 'reference' | 'other';
  description?: string;
  updatedAt?: string;
}

export interface ModuleItem {
  id: string;
  order: number;
  title: string;
  studyHours: number;
  learningObjectives: string[];
  contentBlocks: ContentBlock[];
  presentation?: PresentationItem;
  handouts?: HandoutItem[];
}

export type ProgramStatus = 'draft' | 'in_review' | 'approved' | 'published';

export interface ProgramDocument {
  id: string;
  tenantId: string;
  code: string; // e.g. "B-CS", "M-AI"
  title: string;
  degreeLevel: 'Undergraduate' | 'Postgraduate' | 'Vocational / Diploma';
  frameworkLevel: number | string; // e.g. 7 for Bachelor, 9 for Master
  totalCredits: number;
  durationYears: number;
  faculty: string;
  overview: string;
  careerOutcomes: string[];
  atarRequirement?: number;
  annualFeeAud?: number;
  status: ProgramStatus;
  version: string; // e.g. "v1.0"
  outcomes: ProgramOutcome[];
  unitIds: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface UnitDocument {
  id: string;
  tenantId: string;
  programId: string;
  code: string; // e.g. "COMP1001", "AI5001"
  title: string;
  creditWeight: number; // e.g. 6
  deliveryMode: 'Online' | 'On-Campus' | 'Hybrid';
  overview: string;
  coordinator?: {
    name: string;
    email: string;
    room?: string;
  };
  prerequisites: string[]; // array of unitCodes or unitIds
  coRequisites: string[];
  outcomes: UnitOutcome[];
  assessments: AssessmentItem[];
  modules: ModuleItem[];
  status: 'draft' | 'published';
  updatedAt: string;
}

export interface ComplianceAuditResult {
  isCompliant: boolean;
  totalAssessmentWeight: number;
  weightingError?: string;
  orphanedPlos: ProgramOutcome[]; // PLOs with no ULOs mapped
  unassessedUlos: UnitOutcome[];   // ULOs not evaluated by any assessment
  warnings: string[];
}
