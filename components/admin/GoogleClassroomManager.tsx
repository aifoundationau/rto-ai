import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  FileSpreadsheet,
  Wand2,
  Users,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Trash2,
  Edit3,
  Archive,
  ExternalLink,
  Search,
  Filter,
  Check,
  X,
  Lock,
  ArrowRight,
  Layers,
  FileText,
  HelpCircle,
  UserPlus,
  Mail,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

// Google Classroom Batch Import Schema (Google Sheets / CSV Mapping)
export interface SpreadsheetCourseRow {
  courseName: string;       // Required: "Advanced Physics 101"
  section: string;          // e.g., "Period 2 / Fall 2026"
  descriptionHeading: string;
  room: string;             // e.g., "Lab 304 / Online"
  ownerId: string;          // Primary Teacher Email / Google ID
  weeklyTopics: string[];   // e.g., ["Week 1: Kinematics", "Week 2: Newton's Laws"]
  studentEmails: string[];  // Comma-separated emails to invite
  action: 'CREATE' | 'UPDATE' | 'ARCHIVE';
}

export interface GoogleClassroomCourse {
  id: string;
  name: string;
  section: string;
  descriptionHeading?: string;
  room?: string;
  ownerId: string;
  courseState: 'ACTIVE' | 'ARCHIVED';
  creationTime: string;
  enrollmentCode?: string;
  alternateLink?: string;
  topics: string[];
  courseworkCount: number;
  studentCount: number;
  students?: string[];
}

export interface CourseworkAssignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  state: 'PUBLISHED' | 'DRAFT';
  workType: 'ASSIGNMENT' | 'QUIZ' | 'MATERIAL';
  maxPoints?: number;
  dueDate?: string;
  topic?: string;
}

interface GoogleClassroomManagerProps {
  userPermissions?: string[]; // ['manage_google_classroom'], ['teacher_admin'], ['super_admin']
  onPermissionsChange?: (perms: string[]) => void;
}

export const GoogleClassroomManager: React.FC<GoogleClassroomManagerProps> = ({
  userPermissions = ['manage_google_classroom', 'super_admin'],
  onPermissionsChange
}) => {
  // Current Permissions State for Live RBAC Simulation
  const [currentPermissions, setCurrentPermissions] = useState<string[]>(userPermissions);
  
  // OAuth 2.0 Connection State Simulation
  const [isOAuthConnected, setIsOAuthConnected] = useState<boolean>(false);
  const [oauthAccount, setOauthAccount] = useState<string>('');

  useEffect(() => {
    let unsubscribe = () => {};
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase/client');
        unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            setIsOAuthConnected(true);
            setOauthAccount(user.email || 'admin.faculty@edupulse.edu');
          } else {
            setIsOAuthConnected(false);
            setOauthAccount('');
          }
        });
      } catch (e) {
        console.error(e);
      }
    };
    checkAuth();
    return () => unsubscribe();
  }, []);

  // Check RBAC Permissions: 'manage_google_classroom' OR 'teacher_admin' OR 'super_admin'
  const canManageClassroom =
    currentPermissions.includes('manage_google_classroom') ||
    currentPermissions.includes('teacher_admin') ||
    currentPermissions.includes('super_admin');

  // Sub-Tab Navigation inside Google Classroom Manager
  const [activeSubTab, setActiveSubTab] = useState<'manager' | 'sheets_pipeline' | 'ai_wizard'>('manager');

  // Initial Seed Courses Data
  const [courses, setCourses] = useState<GoogleClassroomCourse[]>([
    {
      id: 'gc-course-101',
      name: 'Advanced Physics 101: Mechanics & Optics',
      section: 'Period 2 / Fall 2026',
      descriptionHeading: 'Foundational physics course covering Newton laws, kinematics, wave motion, and geometric optics.',
      room: 'Lab 304 / Online Hybrid',
      ownerId: 'prof.vance@edupulse.edu',
      courseState: 'ACTIVE',
      creationTime: '2026-08-20T10:00:00Z',
      enrollmentCode: 'x7k9p2',
      alternateLink: 'https://classroom.google.com/c/gc-course-101',
      topics: ['Week 1: Kinematics & Vectors', 'Week 2: Newton Laws of Motion', 'Week 3: Work, Energy & Power', 'Week 4: Geometric Optics'],
      courseworkCount: 6,
      studentCount: 42,
      students: ['alex.johnson@student.edu', 'maria.garcia@student.edu', 'sophia.m@student.edu']
    },
    {
      id: 'gc-course-102',
      name: 'CS 204: Data Structures & Neural Algorithms',
      section: 'Section B / Fall 2026',
      descriptionHeading: 'Advanced computer science module on tree algorithms, graph traversal, and deep learning neural architectures.',
      room: 'Turing Hall 102',
      ownerId: 'dr.jenkins@edupulse.edu',
      courseState: 'ACTIVE',
      creationTime: '2026-08-22T14:30:00Z',
      enrollmentCode: 'ai4m9z',
      alternateLink: 'https://classroom.google.com/c/gc-course-102',
      topics: ['Module 1: Binary Search Trees', 'Module 2: Graph Theory & Dijkstra', 'Module 3: Neural Net Fundamentals'],
      courseworkCount: 8,
      studentCount: 56,
      students: ['liam.chen@student.edu', 'david.kim@student.edu', 'chloe.b@student.edu']
    },
    {
      id: 'gc-course-103',
      name: 'ENG 310: Technical Writing & Research Methodology',
      section: 'Spring 2026 (Archived)',
      descriptionHeading: 'Comprehensive academic publishing workshop for engineering and computer science undergraduates.',
      room: 'Online Virtual Auditorium',
      ownerId: 'prof.sterling@edupulse.edu',
      courseState: 'ARCHIVED',
      creationTime: '2026-01-15T09:00:00Z',
      enrollmentCode: 'arch88',
      alternateLink: 'https://classroom.google.com/c/gc-course-103',
      topics: ['Topic 1: IEEE Citation Standards', 'Topic 2: Peer Review Workflows'],
      courseworkCount: 4,
      studentCount: 38,
      students: ['benjamin.w@student.edu']
    }
  ]);

  // Coursework Assignments Database State
  const [courseworkList, setCourseworkList] = useState<CourseworkAssignment[]>([
    {
      id: 'cw-1',
      courseId: 'gc-course-101',
      title: 'Lab Report 1: Projectile Motion Analysis',
      description: 'Submit your 3-page Jupyter notebook analysis with velocity vector charts.',
      state: 'PUBLISHED',
      workType: 'ASSIGNMENT',
      maxPoints: 100,
      dueDate: '2026-10-15',
      topic: 'Week 1: Kinematics & Vectors'
    },
    {
      id: 'cw-2',
      courseId: 'gc-course-101',
      title: 'Quiz 2: Newton Third Law Concept Check',
      description: 'Multiple choice 15-minute quiz on momentum conservation.',
      state: 'PUBLISHED',
      workType: 'QUIZ',
      maxPoints: 50,
      dueDate: '2026-10-22',
      topic: 'Week 2: Newton Laws of Motion'
    }
  ]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  // Modal States
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    name: '',
    section: '',
    descriptionHeading: '',
    room: '',
    ownerId: 'faculty.lead@edupulse.edu',
    weeklyTopics: 'Week 1: Foundations\nWeek 2: Core Concepts\nWeek 3: Advanced Applications',
    studentEmails: 'student1@edupulse.edu, student2@edupulse.edu'
  });

  // Roster Invite Modal State
  const [selectedRosterCourse, setSelectedRosterCourse] = useState<GoogleClassroomCourse | null>(null);
  const [newStudentEmailInput, setNewStudentEmailInput] = useState('');

  // Coursework Manager Modal State
  const [selectedCourseworkCourse, setSelectedCourseworkCourse] = useState<GoogleClassroomCourse | null>(null);
  const [newAssignmentForm, setNewAssignmentForm] = useState({
    title: '',
    description: '',
    workType: 'ASSIGNMENT' as 'ASSIGNMENT' | 'QUIZ' | 'MATERIAL',
    maxPoints: 100,
    dueDate: '2026-11-01',
    topic: ''
  });

  // Google Sheets Pipeline State
  const [sheetInputUrl, setSheetInputUrl] = useState('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchLogs, setBatchLogs] = useState<string[]>([]);
  const [parsedSpreadsheetRows, setParsedSpreadsheetRows] = useState<SpreadsheetCourseRow[]>([
    {
      courseName: 'BIO 202: Molecular Cell Genetics',
      section: 'Period 1 / Fall 2026',
      descriptionHeading: 'Comprehensive cell biology lab covering DNA sequencing and gene editing.',
      room: 'BioLab 108',
      ownerId: 'dr.smith@edupulse.edu',
      weeklyTopics: ['Week 1: DNA Replication', 'Week 2: CRISPR Technology', 'Week 3: Protein Synthesis'],
      studentEmails: ['cell.bio1@student.edu', 'cell.bio2@student.edu'],
      action: 'CREATE'
    },
    {
      courseName: 'CS 204: Data Structures & Neural Algorithms',
      section: 'Section B / Fall 2026 (Updated Roster)',
      descriptionHeading: 'Updated curriculum with 4 extra GPU lab assignments.',
      room: 'Turing Hall 102',
      ownerId: 'dr.jenkins@edupulse.edu',
      weeklyTopics: ['Module 1: BST Trees', 'Module 2: Graph Theory', 'Module 3: Neural Nets', 'Module 4: Transformer Architecture'],
      studentEmails: ['new.student@student.edu'],
      action: 'UPDATE'
    },
    {
      courseName: 'ENG 310: Technical Writing & Research Methodology',
      section: 'Spring 2026',
      descriptionHeading: 'Archiving previous academic session.',
      room: 'Online Auditorium',
      ownerId: 'prof.sterling@edupulse.edu',
      weeklyTopics: [],
      studentEmails: [],
      action: 'ARCHIVE'
    }
  ]);

  // AI Course Builder Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [aiPrompt, setAiPrompt] = useState('Build a 4-week introductory course on Artificial Intelligence in Healthcare for pre-med students, including weekly quizzes and a final diagnostic AI case study project.');
  const [aiGeneratedCourse, setAiGeneratedCourse] = useState<{
    courseName: string;
    section: string;
    room: string;
    description: string;
    topics: string[];
    assignments: { title: string; type: 'ASSIGNMENT' | 'QUIZ' | 'MATERIAL'; points: number; topic: string }[];
  }>({
    courseName: 'AI 401: Artificial Intelligence in Modern Healthcare',
    section: 'Fall 2026 / Medical Faculty',
    room: 'Health Sciences Hub 204',
    description: 'Explores AI diagnostic models, computer vision in MRI scanning, and ethical algorithmic decision-making in clinical environments.',
    topics: [
      'Week 1: Introduction to Medical AI & EHR Data',
      'Week 2: Neural Networks for Medical Image Diagnostics',
      'Week 3: NLP & Generative AI in Patient Documentation',
      'Week 4: Ethical AI & Clinical Safety Regulation'
    ],
    assignments: [
      { title: 'Quiz 1: EHR Data Standards & Privacy', type: 'QUIZ', points: 50, topic: 'Week 1: Introduction to Medical AI & EHR Data' },
      { title: 'Lab Assignment 1: Chest X-Ray Image Classifier', type: 'ASSIGNMENT', points: 100, topic: 'Week 2: Neural Networks for Medical Image Diagnostics' },
      { title: 'Reading Material: HIPAA & FDA Algorithmic Clearance', type: 'MATERIAL', points: 0, topic: 'Week 4: Ethical AI & Clinical Safety Regulation' },
      { title: 'Capstone Project: Diagnostic AI System Proposal', type: 'ASSIGNMENT', points: 200, topic: 'Week 4: Ethical AI & Clinical Safety Regulation' }
    ]
  });

  // Toast Feedback State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const togglePermissionRole = (role: 'super_admin' | 'teacher_admin' | 'read_only') => {
    let newPerms: string[] = [];
    if (role === 'super_admin') {
      newPerms = ['super_admin', 'manage_google_classroom'];
    } else if (role === 'teacher_admin') {
      newPerms = ['teacher_admin', 'manage_google_classroom'];
    } else {
      newPerms = ['view_analytics'];
    }
    setCurrentPermissions(newPerms);
    if (onPermissionsChange) onPermissionsChange(newPerms);
    showToast(`Role switched to: ${role === 'read_only' ? 'Read-Only Staff (Access Denied)' : role}`, 'info');
  };

  // CRUD Functions for Courses
  const handleOpenAddCourseModal = () => {
    setEditingCourseId(null);
    setCourseFormData({
      name: '',
      section: 'Fall 2026',
      descriptionHeading: '',
      room: 'Main Campus',
      ownerId: oauthAccount,
      weeklyTopics: 'Week 1: Introduction\nWeek 2: Core Theory\nWeek 3: Practical Lab',
      studentEmails: ''
    });
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourseModal = (course: GoogleClassroomCourse) => {
    setEditingCourseId(course.id);
    setCourseFormData({
      name: course.name,
      section: course.section,
      descriptionHeading: course.descriptionHeading || '',
      room: course.room || '',
      ownerId: course.ownerId,
      weeklyTopics: course.topics.join('\n'),
      studentEmails: (course.students || []).join(', ')
    });
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseFormData.name.trim()) {
      showToast('Course name is required', 'warning');
      return;
    }

    const topicList = courseFormData.weeklyTopics
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    const studentList = courseFormData.studentEmails
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingCourseId) {
      setCourses(prev =>
        prev.map(c =>
          c.id === editingCourseId
            ? {
                ...c,
                name: courseFormData.name,
                section: courseFormData.section,
                descriptionHeading: courseFormData.descriptionHeading,
                room: courseFormData.room,
                ownerId: courseFormData.ownerId,
                topics: topicList,
                students: studentList,
                studentCount: studentList.length
              }
            : c
        )
      );
      showToast(`Google Classroom course "${courseFormData.name}" updated!`, 'success');
    } else {
      const newCourse: GoogleClassroomCourse = {
        id: `gc-course-${Date.now().toString().slice(-4)}`,
        name: courseFormData.name,
        section: courseFormData.section,
        descriptionHeading: courseFormData.descriptionHeading,
        room: courseFormData.room,
        ownerId: courseFormData.ownerId,
        courseState: 'ACTIVE',
        creationTime: new Date().toISOString(),
        enrollmentCode: Math.random().toString(36).substring(2, 8),
        alternateLink: `https://classroom.google.com/c/new-${Date.now()}`,
        topics: topicList,
        courseworkCount: 0,
        studentCount: studentList.length,
        students: studentList
      };
      setCourses(prev => [newCourse, ...prev]);
      showToast(`New course "${courseFormData.name}" posted to Google Classroom API!`, 'success');
    }
    setIsCourseModalOpen(false);
  };

  const handleToggleArchiveCourse = (courseId: string) => {
    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          const nextState = c.courseState === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
          showToast(`Course "${c.name}" state updated to ${nextState}.`, 'info');
          return { ...c, courseState: nextState };
        }
        return c;
      })
    );
  };

  const handleDeleteCourse = (courseId: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete "${name}" from Google Classroom?`)) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      showToast(`Course "${name}" deleted.`, 'warning');
    }
  };

  // Student Roster Functions
  const handleAddStudentInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRosterCourse || !newStudentEmailInput.trim()) return;

    const email = newStudentEmailInput.trim();
    setCourses(prev =>
      prev.map(c => {
        if (c.id === selectedRosterCourse.id) {
          const currentStudents = c.students || [];
          if (currentStudents.includes(email)) {
            showToast(`${email} is already in the course roster.`, 'warning');
            return c;
          }
          const updated = [...currentStudents, email];
          return { ...c, students: updated, studentCount: updated.length };
        }
        return c;
      })
    );

    setSelectedRosterCourse(prev =>
      prev ? { ...prev, students: [...(prev.students || []), email], studentCount: (prev.studentCount || 0) + 1 } : null
    );
    setNewStudentEmailInput('');
    showToast(`Invitation sent via Google Classroom API to ${email}`, 'success');
  };

  // Coursework Functions
  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseworkCourse || !newAssignmentForm.title.trim()) return;

    const newAssignment: CourseworkAssignment = {
      id: `cw-${Date.now()}`,
      courseId: selectedCourseworkCourse.id,
      title: newAssignmentForm.title,
      description: newAssignmentForm.description,
      state: 'PUBLISHED',
      workType: newAssignmentForm.workType,
      maxPoints: newAssignmentForm.maxPoints,
      dueDate: newAssignmentForm.dueDate,
      topic: newAssignmentForm.topic || selectedCourseworkCourse.topics[0] || 'General'
    };

    setCourseworkList(prev => [...prev, newAssignment]);
    setCourses(prev =>
      prev.map(c => (c.id === selectedCourseworkCourse.id ? { ...c, courseworkCount: c.courseworkCount + 1 } : c))
    );

    setNewAssignmentForm({
      title: '',
      description: '',
      workType: 'ASSIGNMENT',
      maxPoints: 100,
      dueDate: '2026-11-01',
      topic: ''
    });
    showToast(`Posted coursework "${newAssignment.title}" to Google Classroom stream!`, 'success');
  };

  // Google Sheets Batch Import Pipeline Execution
  const handleRunBatchPipeline = () => {
    if (!sheetInputUrl.trim()) {
      showToast('Please enter a valid Google Sheets URL or ID.', 'warning');
      return;
    }

    setIsBatchSyncing(true);
    setBatchProgress(10);
    setBatchLogs([
      `[${new Date().toLocaleTimeString()}] Authenticating with Google OAuth Client...`,
      `[${new Date().toLocaleTimeString()}] Connecting to Google Sheets API v4 (spreadsheets.readonly)...`,
      `[${new Date().toLocaleTimeString()}] Fetching tab "Classroom_Courses_Import"...`
    ]);

    setTimeout(() => {
      setBatchProgress(40);
      setBatchLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Parsed ${parsedSpreadsheetRows.length} course mapping rows successfully.`
      ]);
    }, 1000);

    setTimeout(() => {
      setBatchProgress(75);
      setBatchLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Executing CREATE: "BIO 202: Molecular Cell Genetics"...`,
        `[${new Date().toLocaleTimeString()}] Executing UPDATE: "CS 204: Data Structures"...`,
        `[${new Date().toLocaleTimeString()}] Executing ARCHIVE: "ENG 310: Technical Writing"...`
      ]);

      // Apply batch operations to state
      setCourses(prev => {
        let updated = [...prev];
        parsedSpreadsheetRows.forEach(row => {
          if (row.action === 'CREATE') {
            updated.unshift({
              id: `gc-batch-${Date.now()}`,
              name: row.courseName,
              section: row.section,
              descriptionHeading: row.descriptionHeading,
              room: row.room,
              ownerId: row.ownerId,
              courseState: 'ACTIVE',
              creationTime: new Date().toISOString(),
              enrollmentCode: Math.random().toString(36).substring(2, 8),
              alternateLink: `https://classroom.google.com/c/batch-${Date.now()}`,
              topics: row.weeklyTopics,
              courseworkCount: 3,
              studentCount: row.studentEmails.length,
              students: row.studentEmails
            });
          } else if (row.action === 'ARCHIVE') {
            updated = updated.map(c => (c.name.includes(row.courseName.split(':')[0]) ? { ...c, courseState: 'ARCHIVED' } : c));
          }
        });
        return updated;
      });
    }, 2200);

    setTimeout(() => {
      setBatchProgress(100);
      setIsBatchSyncing(false);
      setBatchLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] SUCCESS: Batch synchronization completed! 1 Created, 1 Updated, 1 Archived.`
      ]);
      showToast('Google Sheets batch pipeline completed successfully!', 'success');
    }, 3200);
  };

  // AI Course Builder Wizard Execution
  const handleDeployAiCourse = () => {
    const newCourse: GoogleClassroomCourse = {
      id: `gc-ai-${Date.now()}`,
      name: aiGeneratedCourse.courseName,
      section: aiGeneratedCourse.section,
      descriptionHeading: aiGeneratedCourse.description,
      room: aiGeneratedCourse.room,
      ownerId: oauthAccount,
      courseState: 'ACTIVE',
      creationTime: new Date().toISOString(),
      enrollmentCode: Math.random().toString(36).substring(2, 8),
      alternateLink: `https://classroom.google.com/c/ai-${Date.now()}`,
      topics: aiGeneratedCourse.topics,
      courseworkCount: aiGeneratedCourse.assignments.length,
      studentCount: 15,
      students: ['med.student1@edupulse.edu', 'med.student2@edupulse.edu']
    };

    setCourses(prev => [newCourse, ...prev]);

    // Add generated assignments
    aiGeneratedCourse.assignments.forEach((asg, idx) => {
      setCourseworkList(prev => [
        ...prev,
        {
          id: `cw-ai-${idx}-${Date.now()}`,
          courseId: newCourse.id,
          title: asg.title,
          description: `AI Scaffolded Coursework for ${asg.topic}`,
          state: 'PUBLISHED',
          workType: asg.type,
          maxPoints: asg.points,
          dueDate: '2026-11-20',
          topic: asg.topic
        }
      ]);
    });

    setActiveSubTab('manager');
    setWizardStep(1);
    showToast(`AI Course "${aiGeneratedCourse.courseName}" deployed to Google Classroom!`, 'success');
  };

  // Filtered Courses
  const filteredCourses = courses.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ownerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.section.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'ALL' || c.courseState === stateFilter;
    return matchesSearch && matchesState;
  });

  // ACCESS DENIED PANEL (If permissions or OAuth token missing)
  if (!canManageClassroom || !isOAuthConnected) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-6">
        {/* Permission Simulator Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-2xl">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Google Workspace Security & RBAC Control
              </span>
              <span className="text-xs font-semibold text-slate-200">
                RBAC: <strong className="text-amber-300">{canManageClassroom ? 'Authorized' : 'Denied'}</strong> | OAuth Token: <strong className={isOAuthConnected ? 'text-emerald-300' : 'text-rose-300'}>{isOAuthConnected ? 'Active' : 'Missing'}</strong>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => togglePermissionRole('super_admin')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Grant `super_admin`
            </button>
            <button
              onClick={() => togglePermissionRole('teacher_admin')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Grant `teacher_admin`
            </button>
            <button
              onClick={() => setIsOAuthConnected(prev => !prev)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Toggle OAuth ({isOAuthConnected ? 'Connected' : 'Disconnected'})
            </button>
          </div>
        </div>

        {/* Guarded Access Denied Card */}
        <div className="p-8 max-w-xl mx-auto text-center bg-rose-50/80 rounded-3xl border border-rose-200 text-rose-800 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-rose-950">
              {!canManageClassroom ? 'RBAC Access Restricted' : 'Google Workspace OAuth Required'}
            </h3>
            <p className="text-xs text-rose-700 mt-2 leading-relaxed">
              {!canManageClassroom
                ? 'You do not have the required RBAC permissions (`manage_google_classroom`, `teacher_admin`, or `super_admin`) to access the Google Classroom API management suite.'
                : 'Active Google Workspace OAuth 2.0 credentials (`classroom.courses`, `classroom.rosters`, `spreadsheets.readonly`) are required to sync EduPulse with Google Classroom.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            {!isOAuthConnected && (
              <button
                onClick={async () => {
                  try {
                    const { auth } = await import('@/lib/firebase/client');
                    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
                    const provider = new GoogleAuthProvider();
                    provider.addScope('https://www.googleapis.com/auth/classroom.courses');
                    provider.addScope('https://www.googleapis.com/auth/classroom.rosters');
                    provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students');
                    await signInWithPopup(auth, provider);
                    showToast('Google Workspace OAuth token granted!', 'success');
                  } catch (e: any) {
                    showToast(e.message || 'OAuth connection failed', 'warning');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Connect Google Workspace OAuth
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Container */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all duration-300 animate-slide-in bg-slate-900 text-white border border-slate-700">
          <CheckCircle2 className={`w-4 h-4 ${toast.type === 'success' ? 'text-emerald-400' : 'text-purple-400'}`} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Header & Toolbar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> OAuth 2.0 Connected
              </span>
              <span className="text-xs text-slate-400 font-medium">&bull; Google Classroom API v1</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Google Classroom API Admin Hub
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Sync courses, batch import Google Sheets syllabuses, scaffold AI modules, and manage student rosters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAddCourseModal}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Course
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('manager')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'manager'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Course Roster & Classroom Manager</span>
            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              {courses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('sheets_pipeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'sheets_pipeline'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets Bulk Import Pipeline</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              v4 API
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('ai_wizard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'ai_wizard'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wand2 className="w-4 h-4 text-purple-600" />
            <span>AI Course Scaffolding Wizard</span>
            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              AI Wizard
            </span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: COURSE ROSTER & CLASSROOM MANAGER */}
      {activeSubTab === 'manager' && (
        <div className="space-y-6">
          {/* Metrics Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Courses</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{courses.length}</div>
              <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">&bull; Live in Google Classroom</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Enrolled Students</span>
              <div className="text-2xl font-black text-indigo-950 mt-1">
                {courses.reduce((sum, c) => sum + c.studentCount, 0)}
              </div>
              <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">Across active rosters</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Published Coursework</span>
              <div className="text-2xl font-black text-purple-950 mt-1">
                {courseworkList.length}
              </div>
              <span className="text-[11px] text-purple-600 font-bold mt-1 inline-block">Assignments & Quizzes</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">OAuth Account</span>
              <div className="text-xs font-bold text-slate-800 mt-2 truncate">{oauthAccount}</div>
              <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">&bull; Primary Teacher / Owner</span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> State:
              </span>
              {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStateFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    stateFilter === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search course, owner, section..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          {/* Courses Table / Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        course.courseState === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {course.courseState}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">
                      Code: {course.enrollmentCode}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{course.name}</h3>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">{course.section}</p>
                  </div>

                  {course.descriptionHeading && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.descriptionHeading}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Teacher:</span>
                      <span className="font-semibold text-slate-800">{course.ownerId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Room / Venue:</span>
                      <span className="font-semibold text-slate-800">{course.room || 'Online'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Weekly Topics:</span>
                      <span className="font-bold text-purple-700">{course.topics.length} Units</span>
                    </div>
                  </div>

                  {/* Topics Chips Preview */}
                  {course.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {course.topics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100">
                          {topic}
                        </span>
                      ))}
                      {course.topics.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-bold px-1.5 py-0.5">
                          +{course.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedRosterCourse(course)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1"
                      title="Manage Student Roster"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{course.studentCount} Roster</span>
                    </button>

                    <button
                      onClick={() => setSelectedCourseworkCourse(course)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1"
                      title="Post Coursework & Quizzes"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      <span>{course.courseworkCount} Work</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditCourseModal(course)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Course Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleArchiveCourse(course.id)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title={course.courseState === 'ACTIVE' ? 'Archive Course' : 'Unarchive Course'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.name)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: GOOGLE SHEETS BULK PARSER PIPELINE */}
      {activeSubTab === 'sheets_pipeline' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                  Google Sheets Bulk Course Synchronization Pipeline
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Parse Google Sheets or CSV structures (`SpreadsheetCourseRow`) to batch create, update, and archive courses in Google Classroom.
                </p>
              </div>
            </div>

            <button
              onClick={() => showToast('Downloading Google Sheets Course Import starter CSV template...', 'success')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download Schema CSV Template</span>
            </button>
          </div>

          {/* Spreadsheet Input Form */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
            <label className="block text-xs font-bold text-slate-800">
              Google Sheet URL or Public Spreadsheet ID (Read-Only Authorization):
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={sheetInputUrl}
                onChange={e => setSheetInputUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                className="flex-1 w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleRunBatchPipeline}
                disabled={isBatchSyncing}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isBatchSyncing ? 'animate-spin' : ''}`} />
                <span>{isBatchSyncing ? 'Processing Batch...' : 'Run Batch Pipeline'}</span>
              </button>
            </div>

            {/* Batch Execution Progress Bar */}
            {isBatchSyncing && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold text-emerald-800">
                  <span>Batch Sync Execution in Progress...</span>
                  <span>{batchProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${batchProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Batch Logs Output */}
          {batchLogs.length > 0 && (
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto">
              <span className="text-slate-400 font-bold block mb-1">&gt; Google Classroom API Execution Console:</span>
              {batchLogs.map((log, i) => (
                <div key={i} className="text-emerald-400 leading-relaxed">{log}</div>
              ))}
            </div>
          )}

          {/* Parsed Spreadsheet Rows Preview Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
              <span>Parsed Spreadsheet Import Queue ({parsedSpreadsheetRows.length} Courses)</span>
              <span className="text-xs text-slate-400 font-normal">SpreadsheetCourseRow schema compliant</span>
            </h4>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Action</th>
                    <th className="p-3">Course Name & Section</th>
                    <th className="p-3">Owner / Teacher</th>
                    <th className="p-3">Venue / Room</th>
                    <th className="p-3">Weekly Topics</th>
                    <th className="p-3">Student Invites</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {parsedSpreadsheetRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            row.action === 'CREATE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.action === 'UPDATE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {row.action}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{row.courseName}</div>
                        <div className="text-[11px] text-slate-400">{row.section}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{row.ownerId}</td>
                      <td className="p-3 text-slate-600">{row.room}</td>
                      <td className="p-3">
                        <span className="font-bold text-purple-700">{row.weeklyTopics.length} Topics</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-indigo-700">{row.studentEmails.length} Emails</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: INTERACTIVE WEB-BASED AI COURSE BUILDER WIZARD */}
      {activeSubTab === 'ai_wizard' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
                <Wand2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                  Interactive AI Course Scaffolding Wizard
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Dynamically scaffold Google Classroom courses, weekly modules, assignments, and quizzes using Gemini AI.
                </p>
              </div>
            </div>

            {/* Wizard Steps Indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map(step => (
                <div
                  key={step}
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    wizardStep === step
                      ? 'bg-purple-600 text-white shadow-sm'
                      : wizardStep > step
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {wizardStep > step ? <Check className="w-3.5 h-3.5" /> : step}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: AI Prompt Input */}
          {wizardStep === 1 && (
            <div className="space-y-4 max-w-2xl">
              <h4 className="font-bold text-slate-900 text-sm">Step 1: Describe the Course You Want to Build</h4>
              <textarea
                rows={4}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => {
                  showToast('AI generating course structure...', 'info');
                  setWizardStep(2);
                }}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
              >
                <span>Generate Course Scaffold</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Review Course identity & Topics */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Step 2: Review Generated Course & Weekly Topics</h4>
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400">Course Title:</span>
                  <div className="font-bold text-slate-900 text-sm">{aiGeneratedCourse.courseName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Description:</span>
                  <p className="text-slate-700 mt-0.5">{aiGeneratedCourse.description}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Generated Weekly Topics (Modules):</span>
                  <ul className="space-y-1 pl-4 list-disc text-purple-900 font-medium">
                    {aiGeneratedCourse.topics.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
                >
                  <span>Scaffold Coursework & Quizzes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review Assignments & Quizzes */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Step 3: Generated Coursework & Quizzes</h4>
              <div className="space-y-2">
                {aiGeneratedCourse.assignments.map((asg, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{asg.title}</div>
                      <div className="text-[11px] text-slate-500">{asg.topic}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                        {asg.type}
                      </span>
                      <span className="font-bold text-slate-700">{asg.points} Pts</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(4)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
                >
                  <span>Final Review & Deploy</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Deploy to Google Classroom API */}
          {wizardStep === 4 && (
            <div className="space-y-4 max-w-xl">
              <h4 className="font-bold text-slate-900 text-sm">Step 4: Ready to Deploy to Google Classroom API</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clicking <strong>"Deploy Course to Google Classroom"</strong> will create the course shell, register the 4 weekly topics, publish the 4 coursework items, and issue student enrollment codes.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Back
                </button>
                <button
                  onClick={handleDeployAiCourse}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Deploy Course to Google Classroom API</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT COURSE MODAL */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingCourseId ? 'Edit Google Classroom Course' : 'Create Google Classroom Course'}
                  </h2>
                  <p className="text-xs text-slate-500">Google Classroom API v1 Course Schema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCourseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Physics 101"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  value={courseFormData.name}
                  onChange={e => setCourseFormData({ ...courseFormData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section / Term</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fall 2026 / Period 2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    value={courseFormData.section}
                    onChange={e => setCourseFormData({ ...courseFormData, section: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room / Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 304 / Online"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    value={courseFormData.room}
                    onChange={e => setCourseFormData({ ...courseFormData, room: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Owner Email (Primary Teacher)</label>
                <input
                  type="email"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  value={courseFormData.ownerId}
                  onChange={e => setCourseFormData({ ...courseFormData, ownerId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Topics (One per line)</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  value={courseFormData.weeklyTopics}
                  onChange={e => setCourseFormData({ ...courseFormData, weeklyTopics: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Emails to Invite (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="student1@edupulse.edu, student2@edupulse.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  value={courseFormData.studentEmails}
                  onChange={e => setCourseFormData({ ...courseFormData, studentEmails: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all"
                >
                  {editingCourseId ? 'Update Course' : 'Save Course to API'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROSTER INVITATION MODAL */}
      {selectedRosterCourse && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Student Roster — {selectedRosterCourse.name}
                </h3>
                <p className="text-xs text-slate-400">Google Classroom Roster Enrollment API</p>
              </div>
              <button
                onClick={() => setSelectedRosterCourse(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddStudentInvite} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Enter student email to invite..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                value={newStudentEmailInput}
                onChange={e => setNewStudentEmailInput(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                Send Invite
              </button>
            </form>

            <div className="space-y-2 max-h-56 overflow-y-auto pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Enrolled Students ({(selectedRosterCourse.students || []).length}):
              </span>
              {(selectedRosterCourse.students || []).length === 0 ? (
                <div className="text-xs text-slate-400 py-2">No students enrolled yet.</div>
              ) : (
                (selectedRosterCourse.students || []).map((student, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{student}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Enrolled</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* COURSEWORK MANAGER MODAL */}
      {selectedCourseworkCourse && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Coursework Stream — {selectedCourseworkCourse.name}
                </h3>
                <p className="text-xs text-slate-400">Post assignments, quizzes, and materials to Google Classroom</p>
              </div>
              <button
                onClick={() => setSelectedCourseworkCourse(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Post New Coursework Form */}
            <form onSubmit={handleAddAssignment} className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3 text-xs">
              <h4 className="font-bold text-purple-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-purple-600" /> Post New Coursework Item
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Assignment Title *"
                  className="bg-white border border-purple-200 rounded-xl p-2 text-xs text-slate-800 outline-none"
                  value={newAssignmentForm.title}
                  onChange={e => setNewAssignmentForm({ ...newAssignmentForm, title: e.target.value })}
                />
                <select
                  className="bg-white border border-purple-200 rounded-xl p-2 text-xs text-slate-800 outline-none"
                  value={newAssignmentForm.workType}
                  onChange={e => setNewAssignmentForm({ ...newAssignmentForm, workType: e.target.value as any })}
                >
                  <option value="ASSIGNMENT">Assignment</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="MATERIAL">Material</option>
                </select>
              </div>
              <textarea
                rows={2}
                placeholder="Description / Instructions..."
                className="w-full bg-white border border-purple-200 rounded-xl p-2 text-xs text-slate-800 outline-none"
                value={newAssignmentForm.description}
                onChange={e => setNewAssignmentForm({ ...newAssignmentForm, description: e.target.value })}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Publish to Stream
                </button>
              </div>
            </form>

            {/* Existing Coursework Stream */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Published Coursework Items:
              </span>
              {courseworkList.filter(cw => cw.courseId === selectedCourseworkCourse.id).length === 0 ? (
                <div className="text-xs text-slate-400 py-2">No coursework items published yet.</div>
              ) : (
                courseworkList
                  .filter(cw => cw.courseId === selectedCourseworkCourse.id)
                  .map(cw => (
                    <div key={cw.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{cw.title}</div>
                        <div className="text-[11px] text-slate-500">{cw.topic || 'General'}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">
                        {cw.workType}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
