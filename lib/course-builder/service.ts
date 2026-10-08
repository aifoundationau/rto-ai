import { db, FieldValue } from '@/lib/firebase/admin';
import {
  TenantConfig,
  ProgramDocument,
  UnitDocument,
  ComplianceAuditResult,
  ProgramOutcome,
  UnitOutcome,
  AssessmentItem
} from './types';

// Default Tenant Configuration for Australian AQF / TEQSA
export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  tenantId: 'aifoundation-edupulse',
  institutionName: 'EduPulse Institute of Technology & AI',
  countryCode: 'AU',
  framework: 'AQF',
  frameworkLevels: [
    { level: 5, name: 'AQF Level 5 – Diploma' },
    { level: 6, name: 'AQF Level 6 – Advanced Diploma / Associate Degree' },
    { level: 7, name: 'AQF Level 7 – Bachelor Degree' },
    { level: 8, name: 'AQF Level 8 – Bachelor Honours / Graduate Certificate' },
    { level: 9, name: 'AQF Level 9 – Master Degree (Coursework & Research)' },
    { level: 10, name: 'AQF Level 10 – Doctoral Degree (PhD)' },
  ],
  creditSystem: {
    name: 'Credit Points',
    standardAnnualVolume: 48,
    standardUnitVolume: 6,
  },
  terminology: {
    program: 'Program',
    unit: 'Unit',
    module: 'Module',
    outcome: 'Learning Outcome',
  },
  updatedAt: new Date().toISOString(),
};

// Seed Program: Bachelor of Computer Science
export const SEED_PROGRAMS: ProgramDocument[] = [
  {
    id: 'prog-b-cs',
    tenantId: 'aifoundation-edupulse',
    code: 'B-CS',
    title: 'Bachelor of Computer Science (Artificial Intelligence)',
    degreeLevel: 'Undergraduate',
    frameworkLevel: 7,
    totalCredits: 144,
    durationYears: 3,
    faculty: 'School of Computer Science & Engineering',
    overview: 'An accredited 3-year degree equipping graduates with foundational computer science theory, autonomous systems architecture, machine learning algorithms, and ethical AI deployment.',
    careerOutcomes: ['AI Solutions Engineer', 'Machine Learning Specialist', 'Full-Stack Software Engineer', 'Autonomous Systems Developer'],
    atarRequirement: 85.0,
    annualFeeAud: 36000,
    status: 'published',
    version: 'v1.0',
    outcomes: [
      {
        id: 'plo-1',
        code: 'PLO-1',
        title: 'Core Computing Principles',
        statement: 'Apply fundamental concepts of data structures, computational algorithms, and computer systems architecture to complex problem solving.',
        category: 'Knowledge',
      },
      {
        id: 'plo-2',
        code: 'PLO-2',
        title: 'AI & Machine Learning Engineering',
        statement: 'Design, implement, and evaluate deep neural networks and frontier agentic systems adhering to mathematical rigor.',
        category: 'Skills',
      },
      {
        id: 'plo-3',
        code: 'PLO-3',
        title: 'Professional Ethics & Governance',
        statement: 'Formulate ethical frameworks and regulatory compliance policies for trustworthy autonomous intelligence under the Australian AI Ethics Framework.',
        category: 'Application',
      },
      {
        id: 'plo-4',
        code: 'PLO-4',
        title: 'Collaborative Engineering & Delivery',
        statement: 'Lead multidisciplinary engineering teams to deliver robust, scalable, and secure cloud software architectures.',
        category: 'Autonomy',
      },
    ],
    unitIds: ['unit-comp1001', 'unit-data2001', 'unit-ai3001'],
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: new Date().toISOString(),
    publishedAt: '2026-02-01T12:00:00Z',
  },
  {
    id: 'prog-m-ai',
    tenantId: 'aifoundation-edupulse',
    code: 'M-AI',
    title: 'Master of Artificial Intelligence & Machine Learning',
    degreeLevel: 'Postgraduate',
    frameworkLevel: 9,
    totalCredits: 96,
    durationYears: 2,
    faculty: 'School of Artificial Intelligence & Data Science',
    overview: 'Advanced postgraduate coursework and research specialization focusing on LLM alignment, multimodal models, multi-agent frameworks, and enterprise scaling.',
    careerOutcomes: ['Lead AI Architect', 'Research Scientist', 'AI Ethics & Safety Director', 'MLOps Engineering Lead'],
    atarRequirement: 0,
    annualFeeAud: 42000,
    status: 'draft',
    version: 'v1.1',
    outcomes: [
      {
        id: 'plo-m-1',
        code: 'PLO-1',
        title: 'Frontier AI Architectures',
        statement: 'Synthesize state-of-the-art transformer architectures, diffusion systems, and reinforcement learning paradigms.',
        category: 'Knowledge',
      },
      {
        id: 'plo-m-2',
        code: 'PLO-2',
        title: 'Applied Research & Innovation',
        statement: 'Execute original academic and empirical research in artificial intelligence, contributing to peer-reviewed publications.',
        category: 'Skills',
      },
    ],
    unitIds: ['unit-ai5001'],
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

// Seed Units
export const SEED_UNITS: UnitDocument[] = [
  {
    id: 'unit-comp1001',
    tenantId: 'aifoundation-edupulse',
    programId: 'prog-b-cs',
    code: 'COMP1001',
    title: 'Foundations of Computer Science & Programming',
    creditWeight: 6,
    deliveryMode: 'Hybrid',
    overview: 'Introduces core computational problem solving, data structures, algorithm complexity analysis, and modern TypeScript / Python syntax.',
    coordinator: {
      name: 'Dr. Marcus Vance',
      email: 'marcus.vance@edupulse.edu.au',
      room: 'Building 14, Rm 302',
    },
    prerequisites: [],
    coRequisites: [],
    outcomes: [
      {
        id: 'ulo-1',
        code: 'ULO-1',
        statement: 'Design, write, and debug modular algorithms using modern procedural and object-oriented paradigms.',
        mappedPloIds: ['plo-1'],
      },
      {
        id: 'ulo-2',
        code: 'ULO-2',
        statement: 'Analyze algorithmic time and space complexity using Big-O notation.',
        mappedPloIds: ['plo-1', 'plo-2'],
      },
      {
        id: 'ulo-3',
        code: 'ULO-3',
        statement: 'Implement professional code hygiene, automated unit tests, and Git version control.',
        mappedPloIds: ['plo-4'],
      },
    ],
    assessments: [
      {
        id: 'asmt-1',
        title: 'Mid-Semester Algorithmic Coding Exam',
        type: 'Summative',
        weight: 30,
        dueDateWeek: 6,
        wordCountOrDuration: '2 Hours Live Coding',
        mappedUloIds: ['ulo-1', 'ulo-2'],
      },
      {
        id: 'asmt-2',
        title: 'Practical Software Project: Autonomous Maze Solver',
        type: 'Summative',
        weight: 40,
        dueDateWeek: 11,
        wordCountOrDuration: '2,500 words codebase + report',
        mappedUloIds: ['ulo-1', 'ulo-3'],
      },
      {
        id: 'asmt-3',
        title: 'Weekly Lab Quizzes & Problem Sets',
        type: 'Formative',
        weight: 30,
        dueDateWeek: 12,
        wordCountOrDuration: '10 weekly problem sets (3% each)',
        mappedUloIds: ['ulo-1', 'ulo-2', 'ulo-3'],
      },
    ],
    modules: [
      {
        id: 'mod-1',
        order: 1,
        title: 'Week 1: Computational Thinking & Algorithmic Abstraction',
        studyHours: 8,
        learningObjectives: ['Deconstruct complex challenges into pseudocode', 'Setup Node.js and TypeScript compiler'],
        contentBlocks: [
          {
            id: 'cb-1',
            type: 'rich_text',
            title: 'Welcome to Algorithmic Foundations',
            content: '### Introduction to Computational Abstraction\n\nAlgorithms are precise recipes for transforming raw inputs into deterministic outputs. In this module, we examine how state machines model computational steps.',
            durationMinutes: 45,
            isMandatory: true,
          },
          {
            id: 'cb-2',
            type: 'video',
            title: 'Lecture 1: The Anatomy of a Function',
            content: 'Full recorded video walkthrough covering stack frames, call conventions, and memory allocation.',
            mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            durationMinutes: 50,
          },
        ],
        presentation: {
          id: 'pres-1',
          title: 'Week 1 Lecture Slides: Computational Thinking & State Machines',
          url: 'https://docs.google.com/presentation/d/1examplePresentationId/edit?usp=sharing',
          type: 'link',
          attachmentName: 'COMP1001_Week01_Slides.pdf',
          attachmentSize: '4.2 MB',
          updatedAt: new Date().toISOString(),
        },
        handouts: [
          {
            id: 'ho-1',
            title: 'Week 1 Lab Setup & Git Workflow Guide',
            type: 'gdrive',
            driveUrl: 'https://drive.google.com/file/d/1exampleDriveFileId/view?usp=sharing',
            category: 'lab_manual',
            description: 'Step-by-step instructions for initializing the Git development environment.',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'ho-2',
            title: 'Big-O Cheat Sheet & Complexity Reference',
            type: 'attachment',
            driveUrl: 'https://drive.google.com/file/d/1exampleDriveComplexity/view?usp=sharing',
            attachmentName: 'Algorithmic_Complexity_Reference.pdf',
            attachmentSize: '1.8 MB',
            category: 'reference',
            description: 'Comprehensive table of worst-case, average-case time and space complexities.',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'ho-3',
            title: 'Shared Lab Exercises Google Drive Folder',
            type: 'gdrive',
            driveUrl: 'https://drive.google.com/drive/folders/1exampleDriveFolderId?usp=sharing',
            category: 'worksheet',
            description: 'Google Drive folder containing all problem set templates and test fixtures.',
            updatedAt: new Date().toISOString(),
          }
        ],
      },
      {
        id: 'mod-2',
        order: 2,
        title: 'Week 2: Data Structures – Arrays, Lists, and Hash Maps',
        studyHours: 10,
        learningObjectives: ['Inspect memory layout of contiguous vs linked nodes', 'Compute amortized array resizing costs'],
        contentBlocks: [
          {
            id: 'cb-3',
            type: 'rich_text',
            title: 'Memory Layouts & Pointer Arithmetic',
            content: 'Contiguous arrays offer O(1) random indexing through address arithmetic: `base + index * size`. We compare this with pointer-chasing in linked lists.',
            durationMinutes: 60,
          },
        ],
      },
    ],
    status: 'published',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'unit-data2001',
    tenantId: 'aifoundation-edupulse',
    programId: 'prog-b-cs',
    code: 'DATA2001',
    title: 'Data Systems & Big Data Engineering',
    creditWeight: 6,
    deliveryMode: 'On-Campus',
    overview: 'Covers relational database normalization, distributed storage engines, SQL optimization, and streaming pipelines.',
    coordinator: {
      name: 'Prof. Alan Turing',
      email: 'alan.turing@edupulse.edu.au',
    },
    prerequisites: ['COMP1001'],
    coRequisites: [],
    outcomes: [
      {
        id: 'ulo-data-1',
        code: 'ULO-1',
        statement: 'Architect 3NF and Star Schemas for relational and dimensional data warehouses.',
        mappedPloIds: ['plo-1'],
      },
      {
        id: 'ulo-data-2',
        code: 'ULO-2',
        statement: 'Write optimized SQL queries and indexing strategies for multi-million row datasets.',
        mappedPloIds: ['plo-1', 'plo-2'],
      },
    ],
    assessments: [
      {
        id: 'asmt-data-1',
        title: 'Enterprise Schema Design Case Study',
        type: 'Summative',
        weight: 50,
        dueDateWeek: 7,
        mappedUloIds: ['ulo-data-1'],
      },
      {
        id: 'asmt-data-2',
        title: 'BigQuery & Data Pipeline Capstone Project',
        type: 'Capstone',
        weight: 50,
        dueDateWeek: 12,
        mappedUloIds: ['ulo-data-1', 'ulo-data-2'],
      },
    ],
    modules: [],
    status: 'published',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'unit-ai3001',
    tenantId: 'aifoundation-edupulse',
    programId: 'prog-b-cs',
    code: 'AI3001',
    title: 'Deep Learning & Agentic Artificial Intelligence',
    creditWeight: 6,
    deliveryMode: 'Online',
    overview: 'Explores artificial neural networks, transformers, diffusion models, function-calling agents, and real-time inference optimization.',
    coordinator: {
      name: 'Dr. Eleanor Vance',
      email: 'eleanor.vance@edupulse.edu.au',
    },
    prerequisites: ['COMP1001', 'DATA2001'],
    coRequisites: [],
    outcomes: [
      {
        id: 'ulo-ai-1',
        code: 'ULO-1',
        statement: 'Construct multi-layer transformer attention blocks using PyTorch.',
        mappedPloIds: ['plo-2'],
      },
      {
        id: 'ulo-ai-2',
        code: 'ULO-2',
        statement: 'Deploy autonomous LLM agents with function-calling tools and safety verification.',
        mappedPloIds: ['plo-2', 'plo-3', 'plo-4'],
      },
    ],
    assessments: [
      {
        id: 'asmt-ai-1',
        title: 'Neural Architecture Research Paper Re-Implementation',
        type: 'Summative',
        weight: 40,
        dueDateWeek: 8,
        mappedUloIds: ['ulo-ai-1'],
      },
      {
        id: 'asmt-ai-2',
        title: 'Autonomous Multi-Agent Capstone Project',
        type: 'Capstone',
        weight: 60,
        dueDateWeek: 12,
        mappedUloIds: ['ulo-ai-1', 'ulo-ai-2'],
      },
    ],
    modules: [],
    status: 'published',
    updatedAt: new Date().toISOString(),
  },
];

// In-Memory Fallback Cache
let cachedTenantConfig: TenantConfig = DEFAULT_TENANT_CONFIG;
let cachedPrograms: ProgramDocument[] = [...SEED_PROGRAMS];
let cachedUnits: UnitDocument[] = [...SEED_UNITS];

// -------------------------------------------------------------
// Validation & Accreditation Invariants Engine
// -------------------------------------------------------------

/**
 * Validates that all assessment items for a unit sum to exactly 100%.
 */
export function validateAssessmentWeighting(unit: UnitDocument): {
  isValid: boolean;
  totalWeight: number;
  error?: string;
} {
  const total = unit.assessments.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
  if (total !== 100) {
    return {
      isValid: false,
      totalWeight: total,
      error: `Assessment weights must total exactly 100%. Current total: ${total}%. (${100 - total}% ${total < 100 ? 'remaining' : 'over limit'})`,
    };
  }
  return { isValid: true, totalWeight: total };
}

/**
 * Compliance Matrix: Traverses the outcome graph and detects orphaned or unassessed outcomes.
 */
export function auditProgramCompliance(
  program: ProgramDocument,
  units: UnitDocument[]
): ComplianceAuditResult {
  const warnings: string[] = [];
  let isCompliant = true;

  // 1. Check unit assessment weights
  let totalAssessmentWeight = 100;
  for (const unit of units) {
    const weightResult = validateAssessmentWeighting(unit);
    if (!weightResult.isValid) {
      isCompliant = false;
      warnings.push(`Unit ${unit.code} (${unit.title}): ${weightResult.error}`);
    }
  }

  // 2. Map all covered PLO IDs from unit outcomes
  const coveredPloIds = new Set<string>();
  const unassessedUlos: UnitOutcome[] = [];

  for (const unit of units) {
    const assessedUloIds = new Set<string>();
    for (const asmt of unit.assessments) {
      (asmt.mappedUloIds || []).forEach(id => assessedUloIds.add(id));
    }

    for (const ulo of unit.outcomes) {
      (ulo.mappedPloIds || []).forEach(ploId => coveredPloIds.add(ploId));
      if (!assessedUloIds.has(ulo.id)) {
        unassessedUlos.push(ulo);
        warnings.push(`Unit ${unit.code}: Learning Outcome [${ulo.code}] has no assigned assessment!`);
      }
    }
  }

  // 3. Find Orphaned PLOs (Program Outcomes with no Unit Outcomes mapping to them)
  const orphanedPlos = program.outcomes.filter(plo => !coveredPloIds.has(plo.id));
  for (const orphan of orphanedPlos) {
    warnings.push(`Program Outcome [${orphan.code}: ${orphan.title}] is orphaned! No unit outcome maps to it.`);
  }

  if (orphanedPlos.length > 0 || unassessedUlos.length > 0) {
    isCompliant = false;
  }

  return {
    isCompliant,
    totalAssessmentWeight,
    orphanedPlos,
    unassessedUlos,
    warnings,
  };
}

// -------------------------------------------------------------
// Database Operations (Cloud Firestore with Fallback Cache)
// -------------------------------------------------------------

/**
 * Initializes tenant configuration and seeds default accredited programs if empty.
 */
export async function initializeCourseBuilderDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const tenantDocRef = db.collection('tenants').doc(DEFAULT_TENANT_CONFIG.tenantId);
    const tenantSnap = await tenantDocRef.get();

    const now = (FieldValue && typeof FieldValue.serverTimestamp === 'function')
      ? FieldValue.serverTimestamp()
      : new Date().toISOString();

    if (!tenantSnap.exists) {
      await tenantDocRef.set({
        ...DEFAULT_TENANT_CONFIG,
        createdAt: now,
      });
      console.log('✅ Created Tenant Configuration in Firestore:', DEFAULT_TENANT_CONFIG.tenantId);
    }

    // Seed Programs
    const progCollection = db.collection('programs');
    const existingProgs = await progCollection.get();

    if (existingProgs.empty) {
      for (const prog of SEED_PROGRAMS) {
        await progCollection.doc(prog.id).set({
          ...prog,
          createdAt: now,
          updatedAt: now,
        });
      }
      console.log(`✅ Seeded ${SEED_PROGRAMS.length} accredited Programs to Firestore.`);
    }

    // Seed Units
    const unitCollection = db.collection('units');
    const existingUnits = await unitCollection.get();

    if (existingUnits.empty) {
      for (const unit of SEED_UNITS) {
        await unitCollection.doc(unit.id).set({
          ...unit,
          updatedAt: now,
        });
      }
      console.log(`✅ Seeded ${SEED_UNITS.length} accredited Units to Firestore.`);
    }

    return { success: true, message: 'Database initialized with Course Builder accreditation schema.' };
  } catch (error: any) {
    console.warn('[CourseBuilder] Firestore initialization fallback to local in-memory:', error);
    return { success: true, message: 'Running with in-memory Course Builder store fallback.' };
  }
}

/**
 * Fetch all programs for tenant.
 */
export async function getPrograms(): Promise<ProgramDocument[]> {
  try {
    const snap = await db.collection('programs').orderBy('code', 'asc').get();
    if (!snap.empty) {
      const items: ProgramDocument[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as ProgramDocument));
      cachedPrograms = items;
      return items;
    }
  } catch (e) {
    console.warn('[getPrograms] Fallback to cached:', e);
  }
  return cachedPrograms;
}

/**
 * Save or update a program document.
 */
export async function saveProgram(program: ProgramDocument): Promise<{ success: boolean; program: ProgramDocument }> {
  try {
    const docRef = db.collection('programs').doc(program.id);
    const payload = {
      ...program,
      updatedAt: new Date().toISOString(),
    };
    await docRef.set(payload, { merge: true });

    const idx = cachedPrograms.findIndex(p => p.id === program.id);
    if (idx >= 0) cachedPrograms[idx] = payload;
    else cachedPrograms.push(payload);

    return { success: true, program: payload };
  } catch (e) {
    const idx = cachedPrograms.findIndex(p => p.id === program.id);
    if (idx >= 0) cachedPrograms[idx] = program;
    else cachedPrograms.push(program);
    return { success: true, program };
  }
}

/**
 * Fetch all units for tenant or program.
 */
export async function getUnits(programId?: string): Promise<UnitDocument[]> {
  try {
    let query: any = db.collection('units');
    if (programId) query = query.where('programId', '==', programId);
    const snap = await query.get();

    if (!snap.empty) {
      const items: UnitDocument[] = [];
      snap.forEach((d: any) => items.push({ id: d.id, ...d.data() } as UnitDocument));
      cachedUnits = items;
      return items;
    }
  } catch (e) {
    console.warn('[getUnits] Fallback to cached:', e);
  }
  if (programId) return cachedUnits.filter(u => u.programId === programId);
  return cachedUnits;
}

/**
 * Save or update a unit document.
 */
export async function saveUnit(unit: UnitDocument): Promise<{ success: boolean; unit: UnitDocument }> {
  try {
    const docRef = db.collection('units').doc(unit.id);
    const payload = {
      ...unit,
      updatedAt: new Date().toISOString(),
    };
    await docRef.set(payload, { merge: true });

    const idx = cachedUnits.findIndex(u => u.id === unit.id);
    if (idx >= 0) cachedUnits[idx] = payload;
    else cachedUnits.push(payload);

    return { success: true, unit: payload };
  } catch (e) {
    const idx = cachedUnits.findIndex(u => u.id === unit.id);
    if (idx >= 0) cachedUnits[idx] = unit;
    else cachedUnits.push(unit);
    return { success: true, unit };
  }
}

/**
 * Snapshot & Version a program.
 */
export async function createProgramVersion(programId: string): Promise<{ success: boolean; newProgram?: ProgramDocument }> {
  const current = (await getPrograms()).find(p => p.id === programId);
  if (!current) throw new Error('Program not found');

  const versionNumber = parseFloat(current.version.replace('v', '')) || 1.0;
  const newVersion = `v${(versionNumber + 0.1).toFixed(1)}`;
  const newId = `${current.code.toLowerCase()}-${newVersion.replace('.', '-')}-${Date.now().toString().slice(-4)}`;

  const clonedProgram: ProgramDocument = {
    ...current,
    id: newId,
    version: newVersion,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: undefined,
  };

  await saveProgram(clonedProgram);
  return { success: true, newProgram: clonedProgram };
}
