/**
 * EduPulse AI / RTO-AI Strict Role-Based Access Control (RBAC) Definitions
 * 
 * Strict system roles:
 * - supporter (Default assigned to ALL users upon registration)
 * - cfo
 * - coo
 * - ceo
 * - administration
 * - accounting
 * - president
 * - chancellor
 * - superadmin (Can see everything and do everything)
 * - student
 * - teacher
 */

export const SYSTEM_ROLES = [
  'supporter',
  'cfo',
  'coo',
  'ceo',
  'administration',
  'accounting',
  'president',
  'chancellor',
  'superadmin',
  'student',
  'teacher',
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export interface RoleMeta {
  role: SystemRole;
  label: string;
  category: 'Public' | 'Executive' | 'Operations' | 'Academic' | 'Superadmin';
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  hierarchyLevel: number;
}

export const ROLE_DEFINITIONS: Record<SystemRole, RoleMeta> = {
  superadmin: {
    role: 'superadmin',
    label: 'Superadmin',
    category: 'Superadmin',
    description: 'Master unrestricted access across all systems, Course Builder, database tenants, and RBAC.',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    badgeBorder: 'border-purple-700',
    hierarchyLevel: 100,
  },
  chancellor: {
    role: 'chancellor',
    label: 'Chancellor',
    category: 'Executive',
    description: 'Highest ceremonial and institutional governance authority, degree conferral, and board reports.',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    badgeBorder: 'border-amber-700',
    hierarchyLevel: 90,
  },
  president: {
    role: 'president',
    label: 'President',
    category: 'Executive',
    description: 'Executive institutional president directing university-wide operations, governance, and strategy.',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    badgeBorder: 'border-sky-700',
    hierarchyLevel: 85,
  },
  ceo: {
    role: 'ceo',
    label: 'CEO',
    category: 'Executive',
    description: 'Chief Executive Officer supervising executive workflows, business development, and enterprise partnerships.',
    badgeBg: 'bg-blue-700',
    badgeText: 'text-white',
    badgeBorder: 'border-blue-800',
    hierarchyLevel: 80,
  },
  coo: {
    role: 'coo',
    label: 'COO',
    category: 'Operations',
    description: 'Chief Operating Officer steering internal university operations, institutional schedules, and facilities.',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    badgeBorder: 'border-indigo-700',
    hierarchyLevel: 75,
  },
  cfo: {
    role: 'cfo',
    label: 'CFO',
    category: 'Executive',
    description: 'Chief Financial Officer directing fiscal management, budget governance, audits, and capital allocations.',
    badgeBg: 'bg-emerald-700',
    badgeText: 'text-white',
    badgeBorder: 'border-emerald-800',
    hierarchyLevel: 70,
  },
  accounting: {
    role: 'accounting',
    label: 'Accounting',
    category: 'Operations',
    description: 'Financial ledger management, invoicing, tuition reconciliations, and expense approvals.',
    badgeBg: 'bg-teal-600',
    badgeText: 'text-white',
    badgeBorder: 'border-teal-700',
    hierarchyLevel: 60,
  },
  administration: {
    role: 'administration',
    label: 'Administration',
    category: 'Operations',
    description: 'Registrar, admissions processing, student enrolments, course catalog compliance, and records.',
    badgeBg: 'bg-slate-700',
    badgeText: 'text-white',
    badgeBorder: 'border-slate-800',
    hierarchyLevel: 50,
  },
  teacher: {
    role: 'teacher',
    label: 'Teacher',
    category: 'Academic',
    description: 'Course instruction, syllabus delivery, coursework assignments, feedback, and student grading.',
    badgeBg: 'bg-orange-600',
    badgeText: 'text-white',
    badgeBorder: 'border-orange-700',
    hierarchyLevel: 40,
  },
  student: {
    role: 'student',
    label: 'Student',
    category: 'Academic',
    description: 'Enrolled learner accessing course units, lecture streams, assignments, quizzes, and transcripts.',
    badgeBg: 'bg-cyan-600',
    badgeText: 'text-white',
    badgeBorder: 'border-cyan-700',
    hierarchyLevel: 30,
  },
  supporter: {
    role: 'supporter',
    label: 'Supporter',
    category: 'Public',
    description: 'Default role assigned to all users upon registration. General prospective community member.',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    badgeBorder: 'border-emerald-700',
    hierarchyLevel: 10,
  },
};

export const DEFAULT_REGISTRATION_ROLE: SystemRole = 'supporter';

export function isValidRole(role: any): role is SystemRole {
  if (typeof role !== 'string') return false;
  return SYSTEM_ROLES.includes(role.toLowerCase() as SystemRole);
}

export function normalizeRole(rawRole: string | null | undefined): SystemRole {
  if (!rawRole) return DEFAULT_REGISTRATION_ROLE;
  const lower = rawRole.toLowerCase().trim();

  // Handle common legacy aliases
  if (lower === 'admin' || lower === 'super_admin' || lower === 'superadmin') return 'superadmin';
  if (lower === 'academic_staff' || lower === 'academic staff' || lower === 'faculty' || lower === 'instructor') return 'teacher';
  if (lower === 'registrar') return 'administration';
  if (lower === 'finance') return 'accounting';

  if (isValidRole(lower)) {
    return lower;
  }

  return DEFAULT_REGISTRATION_ROLE;
}

export function getRoleMeta(rawRole: string | null | undefined): RoleMeta {
  const norm = normalizeRole(rawRole);
  return ROLE_DEFINITIONS[norm];
}

export function isSuperAdmin(rawRole: string | null | undefined, flag?: boolean, email?: string | null): boolean {
  if (email && isProjectOwnerEmail(email)) return true;
  if (flag === true && rawRole === 'superadmin') return true;
  return normalizeRole(rawRole) === 'superadmin';
}

/**
 * Checks if an email address is strictly listed as an Owner in Firebase Project settings.
 * Only verified project owners receive superadmin on registration.
 */
export function isProjectOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Read from FIREBASE_PROJECT_OWNERS / SUPERADMIN_EMAILS environment variables
  const envOwners = (
    process.env.FIREBASE_PROJECT_OWNERS ||
    process.env.SUPERADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS ||
    ''
  )
    .toLowerCase()
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  if (envOwners.includes(cleanEmail)) {
    return true;
  }

  // 2. Strict verified Firebase Project owners for AI Foundation Firebase (Utmost high security, no typos)
  const strictProjectOwners = [
    'admin@aifoundation.net.au',
    'support@aifoundation.net.au',
    'eleanor.vance@edupulse.edu.au',
    'davidrobertson.info@gmail.com',
  ];

  return strictProjectOwners.includes(cleanEmail);
}

export * from './permissions';

