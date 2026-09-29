/**
 * Firebase Database Seeding & Migration Script
 * 
 * Seeds Firestore with sample student profiles, staff accounts, and the
 * auto-incrementing student ID counter doc (/counters/student_id_counter)
 * ensuring all sample records have valid Student Numbers in STU-2026-XXXXX format.
 */

import { db } from '../lib/firebase/admin';

export const SAMPLE_STUDENTS = [
  {
    uid: 'stu_alex_001',
    studentNumber: 'STU-2026-00001',
    displayName: 'Alex Rivera',
    email: 'alex.rivera@student.edupulse.edu.au',
    role: 'STUDENT',
    dept: 'School of Computer Science & Engineering',
    degree: 'Bachelor of Computer Science',
    enrollmentYear: 2026,
    status: 'Active',
    gpa: '3.85',
  },
  {
    uid: 'stu_sarah_002',
    studentNumber: 'STU-2026-00002',
    displayName: 'Sarah Chen',
    email: 'sarah.chen@student.edupulse.edu.au',
    role: 'STUDENT',
    dept: 'School of Artificial Intelligence & Data Science',
    degree: 'Master of Artificial Intelligence',
    enrollmentYear: 2026,
    status: 'Active',
    gpa: '3.92',
  },
  {
    uid: 'stu_marcus_003',
    studentNumber: 'STU-2026-00003',
    displayName: 'Marcus Vance',
    email: 'marcus.vance@student.edupulse.edu.au',
    role: 'STUDENT',
    dept: 'Faculty of Business & Analytics',
    degree: 'Bachelor of Business Analytics',
    enrollmentYear: 2026,
    status: 'Active',
    gpa: '3.65',
  },
  {
    uid: 'stu_elena_004',
    studentNumber: 'STU-2026-00004',
    displayName: 'Elena Rostova',
    email: 'elena.rostova@student.edupulse.edu.au',
    role: 'STUDENT',
    dept: 'School of Cybersecurity & Systems',
    degree: 'Master of Cybersecurity & Privacy',
    enrollmentYear: 2026,
    status: 'Active',
    gpa: '4.00',
  },
  {
    uid: 'stu_liam_005',
    studentNumber: 'STU-2026-00005',
    displayName: 'Liam O\'Connor',
    email: 'liam.oconnor@student.edupulse.edu.au',
    role: 'STUDENT',
    dept: 'School of Software Engineering',
    degree: 'Bachelor of Software Engineering (Honours)',
    enrollmentYear: 2026,
    status: 'Active',
    gpa: '3.70',
  }
];

export const SAMPLE_STAFF = [
  {
    uid: 'admin_super_01',
    displayName: 'Dr. Eleanor Vance',
    email: 'eleanor.vance@edupulse.edu.au',
    role: 'SUPERADMIN',
    dept: 'Academic Operations & Executive Leadership',
  },
  {
    uid: 'staff_reg_01',
    displayName: 'David Miller',
    email: 'david.miller@edupulse.edu.au',
    role: 'REGISTRAR',
    dept: 'Office of the Registrar & Admissions',
  },
  {
    uid: 'staff_prof_01',
    displayName: 'Prof. Alan Turing',
    email: 'alan.turing@edupulse.edu.au',
    role: 'ACADEMIC_STAFF',
    dept: 'School of Computer Science & Engineering',
  }
];

async function seedDatabase() {
  console.log('🚀 Starting Firebase Database Seed...');

  try {
    // 1. Seed Counter Document
    const counterRef = db.collection('counters').doc('student_id_counter');
    await counterRef.set({
      count: SAMPLE_STUDENTS.length,
      year: 2026,
      lastAssignedStudentNumber: `STU-2026-${String(SAMPLE_STUDENTS.length).padStart(5, '0')}`,
      updatedAt: new Date(),
    });
    console.log(`✅ Seeded /counters/student_id_counter (count: ${SAMPLE_STUDENTS.length})`);

    // 2. Seed Student Records in /users and /students
    for (const student of SAMPLE_STUDENTS) {
      const studentData = {
        ...student,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      await db.collection('users').doc(student.uid).set(studentData, { merge: true });
      await db.collection('students').doc(student.uid).set(studentData, { merge: true });
      console.log(`✅ Seeded Student Profile: ${student.displayName} (${student.studentNumber})`);
    }

    // 3. Seed Staff Records in /users
    for (const staff of SAMPLE_STAFF) {
      const staffData = {
        ...staff,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      await db.collection('users').doc(staff.uid).set(staffData, { merge: true });
      console.log(`✅ Seeded Staff Account: ${staff.displayName} (${staff.role})`);
    }

    console.log('🎉 Database seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

if (require.main === module) {
  seedDatabase();
}
