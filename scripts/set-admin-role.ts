import adminShim from '../lib/firebase/admin.cjs.js';
const { setUserRoles } = adminShim;

const uid = 'L5euSJAfNKdDOX6mT0qmrCGjUA53';
const roles = ['admin'];

(async () => {
  try {
    await setUserRoles(uid, roles);
    console.log(`✅ Roles ${roles.join(', ')} set for UID ${uid}`);
  } catch (err) {
    console.error('❌ Failed to set roles:', err);
  }
})();
