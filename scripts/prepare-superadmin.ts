/**
 * Superadmin & Course Builder Preparation Script
 * 
 * 1. Prepares Cloud Firestore with the Course Builder taxonomy, accreditation models,
 *    and default accredited programs (AQF Level 7 Bachelor & AQF Level 9 Master).
 * 2. Elevates the designated Superadmin user with Custom Claims & RBAC profile.
 */

import { assignUniversityRole } from '../lib/firebase/admin';
import { initializeCourseBuilderDatabase } from '../lib/course-builder/service';

const SUPERADMIN_ACCOUNTS = [
  {
    uid: 'admin_super_01',
    email: 'eleanor.vance@edupulse.edu.au',
    fullName: 'Dr. Eleanor Vance',
    role: 'SUPERADMIN',
    dept: 'Academic Operations & Curriculum Commission',
  },
  {
    uid: 'L5euSJAfNKdDOX6mT0qmrCGjUA53', // Active developer / admin UID
    email: 'admin@aifoundation.net.au',
    fullName: 'Executive Superadmin',
    role: 'SUPERADMIN',
    dept: 'Executive Directorate & Course Governance',
  }
];

async function main() {
  console.log('🚀 Initializing Course Builder Database...');
  const dbInit = await initializeCourseBuilderDatabase();
  console.log(dbInit.message);

  console.log('\n👑 Preparing Superadmin Accounts...');
  for (const account of SUPERADMIN_ACCOUNTS) {
    try {
      const res = await assignUniversityRole(account);
      console.log(`✅ Superadmin configured for ${account.fullName} (${account.email}) -> UID: ${account.uid}`);
    } catch (e: any) {
      console.warn(`⚠️ Warning configuring ${account.email}:`, e.message);
    }
  }

  console.log('\n🎉 Course Builder Database & Superadmin preparation complete!');
}

main().catch(console.error);
