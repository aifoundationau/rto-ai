import { SystemRole, SYSTEM_ROLES } from './roles';

export interface SystemPermission {
  id: string;
  name: string;
  description: string;
  category: 'Academic & LMS' | 'Admissions & Students' | 'Finance & Operations' | 'Communications & AI' | 'Administration & Governance';
}

export const SYSTEM_PERMISSIONS: SystemPermission[] = [
  // Academic & LMS
  {
    id: 'courses.view',
    name: 'View Courses & Units',
    description: 'Inspect full course syllabus, accreditation details, unit structures, and learning outcomes.',
    category: 'Academic & LMS'
  },
  {
    id: 'courses.create',
    name: 'Create & Edit Courses',
    description: 'Build new courses and units in LMS Course Builder, add modules and learning outcomes.',
    category: 'Academic & LMS'
  },
  {
    id: 'courses.publish',
    name: 'Publish Courses to Catalog',
    description: 'Publish draft courses to the live public university catalog and admissions portal.',
    category: 'Academic & LMS'
  },
  {
    id: 'grades.view',
    name: 'View Student Grades & Transcripts',
    description: 'Access academic performance, assessment results, GPA, and student transcripts.',
    category: 'Academic & LMS'
  },
  {
    id: 'grades.edit',
    name: 'Grade Assessments & Units',
    description: 'Enter scores, mark assignments, and record student competency evaluations.',
    category: 'Academic & LMS'
  },
  {
    id: 'classroom.manage',
    name: 'Manage Google Classroom',
    description: 'Synchronize rosters, invite teachers/students, and link Google Classroom coursework.',
    category: 'Academic & LMS'
  },

  // Admissions & Students
  {
    id: 'applications.view',
    name: 'View Applications',
    description: 'Read submitted student applications, declarations, and attached documents.',
    category: 'Admissions & Students'
  },
  {
    id: 'applications.review',
    name: 'Review & Decide Applications',
    description: 'Approve, place on hold, or reject prospective student admissions applications.',
    category: 'Admissions & Students'
  },
  {
    id: 'applications.export',
    name: 'Export Application Records',
    description: 'Download full JSON and document dossiers for admissions board audits.',
    category: 'Admissions & Students'
  },
  {
    id: 'students.manage',
    name: 'Manage Student Identifiers',
    description: 'Issue official Student Numbers (STU-2026-XXXXX) and manage student profiles.',
    category: 'Admissions & Students'
  },

  // Finance & Operations
  {
    id: 'finance.view',
    name: 'View Financial Ledgers',
    description: 'Monitor tuition revenue, fee status, departmental budgets, and balance sheets.',
    category: 'Finance & Operations'
  },
  {
    id: 'finance.approve',
    name: 'Approve Budgets & Waivers',
    description: 'Approve capital expenditures, tuition discounts, scholarship waivers, and refunds.',
    category: 'Finance & Operations'
  },
  {
    id: 'tokens.manage',
    name: 'Emergency Fund & Tokens',
    description: 'Authorize and disburse student emergency food, housing, and transit tokens.',
    category: 'Finance & Operations'
  },
  {
    id: 'events.manage',
    name: 'Manage Events & RSVPs',
    description: 'Schedule campus open days, academic orientations, webinars, and track registrations.',
    category: 'Finance & Operations'
  },
  {
    id: 'calendar.manage',
    name: 'Administer Campus Calendar',
    description: 'Manage institutional timetable, room bookings, examinations, and term dates.',
    category: 'Finance & Operations'
  },

  // Communications & AI
  {
    id: 'ai.customize',
    name: 'Configure AI Knowledge & Tools',
    description: 'Tune AI Advisor system guidelines, FAQ ground truth, tools, and response boundaries.',
    category: 'Communications & AI'
  },
  {
    id: 'faqs.edit',
    name: 'Manage FAQs & Knowledge Base',
    description: 'Create and update university Q&A, safety protocols, and student guidance articles.',
    category: 'Communications & AI'
  },
  {
    id: 'messaging.staff',
    name: 'Staff Communications Channel',
    description: 'Access real-time internal staff messaging channels and institutional announcements.',
    category: 'Communications & AI'
  },
  {
    id: 'telemetry.view',
    name: 'View Telemetry & Analytics',
    description: 'Inspect Firebase telemetry events, error monitoring, and page conversion graphs.',
    category: 'Communications & AI'
  },

  // Administration & Governance
  {
    id: 'users.manage',
    name: 'Manage User Profiles & Roles',
    description: 'Assign system roles, audit account logins, and manage staff credentials.',
    category: 'Administration & Governance'
  },
  {
    id: 'roles.manage',
    name: 'Configure Role Permissions',
    description: 'Grant and revoke specific permissions for each of the 11 system roles.',
    category: 'Administration & Governance'
  },
  {
    id: 'sheets.sync',
    name: 'Google Sheets 24/7 Sync',
    description: 'Trigger bidirectional real-time data sync with Google Sheets master database.',
    category: 'Administration & Governance'
  },
  {
    id: 'api_keys.manage',
    name: 'Manage API Keys & Integrations',
    description: 'Configure Gemini API keys, Firebase service accounts, and external credentials.',
    category: 'Administration & Governance'
  },
  {
    id: 'campus_metrics.manage',
    name: 'Manage Front Page Campus Metrics',
    description: 'Adjust front page headline statistics (Total Students, Employment Placement Rate, Total Faculty & Admin Staff).',
    category: 'Administration & Governance'
  }
];


export const ALL_PERMISSION_IDS: string[] = SYSTEM_PERMISSIONS.map((p) => p.id);

export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, string[]> = {
  superadmin: [...ALL_PERMISSION_IDS],
  chancellor: [
    'courses.view',
    'grades.view',
    'applications.view',
    'finance.view',
    'events.manage',
    'calendar.manage',
    'messaging.staff',
    'telemetry.view'
  ],
  president: [
    'courses.view',
    'grades.view',
    'applications.view',
    'applications.review',
    'finance.view',
    'finance.approve',
    'events.manage',
    'calendar.manage',
    'messaging.staff',
    'telemetry.view',
    'sheets.sync'
  ],
  ceo: [
    'courses.view',
    'applications.view',
    'applications.review',
    'finance.view',
    'finance.approve',
    'events.manage',
    'calendar.manage',
    'messaging.staff',
    'telemetry.view'
  ],
  coo: [
    'courses.view',
    'applications.view',
    'events.manage',
    'calendar.manage',
    'messaging.staff',
    'telemetry.view',
    'sheets.sync'
  ],
  cfo: [
    'finance.view',
    'finance.approve',
    'tokens.manage',
    'applications.view',
    'messaging.staff',
    'telemetry.view'
  ],
  accounting: [
    'finance.view',
    'finance.approve',
    'tokens.manage',
    'applications.view',
    'messaging.staff'
  ],
  administration: [
    'courses.view',
    'applications.view',
    'applications.review',
    'applications.export',
    'students.manage',
    'events.manage',
    'calendar.manage',
    'faqs.edit',
    'messaging.staff',
    'users.manage',
    'sheets.sync',
    'campus_metrics.manage'
  ],

  teacher: [
    'courses.view',
    'courses.create',
    'grades.view',
    'grades.edit',
    'classroom.manage',
    'events.manage',
    'calendar.manage',
    'messaging.staff'
  ],
  student: [
    'courses.view',
    'grades.view',
    'events.manage'
  ],
  supporter: [
    'courses.view'
  ]
};

export const PERMISSION_CATEGORIES = [
  'Academic & LMS',
  'Admissions & Students',
  'Finance & Operations',
  'Communications & AI',
  'Administration & Governance'
] as const;

export function getPermissionsForRole(
  role: SystemRole,
  customMap?: Partial<Record<SystemRole, string[]>>
): string[] {
  if (role === 'superadmin') {
    return [...ALL_PERMISSION_IDS];
  }
  if (customMap && customMap[role]) {
    return customMap[role]!;
  }
  return DEFAULT_ROLE_PERMISSIONS[role] || ['courses.view'];
}

export function roleHasPermission(
  role: SystemRole,
  permissionId: string,
  customMap?: Partial<Record<SystemRole, string[]>>
): boolean {
  if (role === 'superadmin') return true;
  const rolePerms = getPermissionsForRole(role, customMap);
  return rolePerms.includes(permissionId);
}
