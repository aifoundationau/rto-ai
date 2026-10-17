const fs = require('fs');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Load environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[match[1].trim()] = val;
  }
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: envVars.FIREBASE_PROJECT_ID,
      clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
      privateKey: envVars.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

async function runSecurityAudit() {
  console.log('🔒 ========================================================');
  console.log('🔒 RUNNING COMPREHENSIVE API ROUTE & RBAC SECURITY AUDIT');
  console.log('🔒 ========================================================\n');

  // Pre-cleanup of any fake attacker documents
  await db.collection('users').doc('fake-attacker-uid-999').delete().catch(() => {});
  await db.collection('users').doc('fake-attacker-uid-888').delete().catch(() => {});

  let passed = 0;
  let failed = 0;

  // Test 1: Spoofed unauthenticated POST /api/users trying to claim superadmin email
  console.log('Test 1: Attacker attempts unauthenticated POST /api/users with spoofed superadmin email...');
  const res1 = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: 'fake-attacker-uid-999',
      email: 'support@aifoundation.net.au',
      displayName: 'Evil Hacker',
    }),
  });
  console.log(`Status: ${res1.status} ${res1.statusText}`);
  const data1 = await res1.json().catch(() => ({}));
  console.log(`Response:`, data1);
  if (res1.status === 401 && data1.error?.includes('Unauthorized')) {
    console.log('✅ PASS: Unauthenticated spoof attempt blocked with 401 Unauthorized.\n');
    passed++;
  } else {
    console.error('❌ FAIL: Exploit succeeded or wrong status code!\n');
    failed++;
  }

  // Test 2: Attacker sends forged/garbage Bearer token
  console.log('Test 2: Attacker sends forged Bearer token to POST /api/users...');
  const res2 = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer fake-signature-token-xyz123',
    },
    body: JSON.stringify({
      uid: 'fake-attacker-uid-888',
      email: 'support@aifoundation.net.au',
    }),
  });
  console.log(`Status: ${res2.status} ${res2.statusText}`);
  const data2 = await res2.json().catch(() => ({}));
  console.log(`Response:`, data2);
  if (res2.status === 401) {
    console.log('✅ PASS: Forged token blocked with 401 Unauthorized.\n');
    passed++;
  } else {
    console.error('❌ FAIL: Forged token was not blocked!\n');
    failed++;
  }

  // Test 3: Attacker attempts unauthenticated PATCH /api/users to grant superadmin role
  console.log('Test 3: Attacker attempts unauthenticated PATCH /api/users to promote a user to superadmin...');
  const res3 = await fetch('http://localhost:3000/api/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: 'some-user-uid',
      role: 'superadmin',
    }),
  });
  console.log(`Status: ${res3.status} ${res3.statusText}`);
  const data3 = await res3.json().catch(() => ({}));
  console.log(`Response:`, data3);
  if (res3.status === 403 || res3.status === 401) {
    console.log('✅ PASS: Role elevation blocked with 403 Forbidden.\n');
    passed++;
  } else {
    console.error('❌ FAIL: Role elevation was not blocked!\n');
    failed++;
  }

  // Test 4: Attacker attempts unauthenticated POST /api/assign-role
  console.log('Test 4: Attacker attempts unauthenticated POST /api/assign-role...');
  const res4 = await fetch('http://localhost:3000/api/assign-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'attacker@example.com',
      role: 'superadmin',
    }),
  });
  console.log(`Status: ${res4.status} ${res4.statusText}`);
  const data4 = await res4.json().catch(() => ({}));
  console.log(`Response:`, data4);
  if (res4.status === 403 || res4.status === 401) {
    console.log('✅ PASS: Role assignment blocked with 403 Forbidden.\n');
    passed++;
  } else {
    console.error('❌ FAIL: /api/assign-role was not protected!\n');
    failed++;
  }

  // Test 5: Attacker attempts unauthenticated directory scraping GET /api/users
  console.log('Test 5: Attacker attempts unauthenticated directory scraping GET /api/users...');
  const res5 = await fetch('http://localhost:3000/api/users');
  console.log(`Status: ${res5.status} ${res5.statusText}`);
  const data5 = await res5.json().catch(() => ({}));
  console.log(`Response:`, data5);
  if (res5.status === 403 || res5.status === 401) {
    console.log('✅ PASS: Directory scraping blocked with 403 Forbidden.\n');
    passed++;
  } else {
    console.error('❌ FAIL: Directory scraping was permitted!\n');
    failed++;
  }

  // Test 6: Verify Firestore database integrity for legitimate Superadmin & Supporters
  console.log('Test 6: Verifying Cloud Firestore records integrity for legitimate accounts...');
  const superDoc = await db.collection('users').where('email', '==', 'support@aifoundation.net.au').get();
  if (superDoc.empty) {
    console.error('❌ FAIL: support@aifoundation.net.au user document not found in Firestore!');
    failed++;
  } else {
    const superData = superDoc.docs[0].data();
    console.log('Verified Superadmin:', {
      email: superData.email,
      role: superData.role,
      isSuperAdmin: superData.isSuperAdmin,
    });
    if (superData.role === 'superadmin' && superData.isSuperAdmin === true) {
      console.log('✅ PASS: support@aifoundation.net.au is strictly superadmin in Firestore.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Superadmin record has invalid role or isSuperAdmin flag!\n');
      failed++;
    }
  }

  // Check that other users are not superadmin
  const supporterDoc = await db.collection('users').where('email', '==', 'sellvideos@gmail.com').get();
  if (!supporterDoc.empty) {
    const suppData = supporterDoc.docs[0].data();
    console.log('Verified Supporter:', {
      email: suppData.email,
      role: suppData.role,
      isSuperAdmin: suppData.isSuperAdmin,
    });
    if (suppData.role === 'supporter' && suppData.isSuperAdmin === false) {
      console.log('✅ PASS: Supporter user strictly has role: supporter and isSuperAdmin: false.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Supporter user has elevated permissions!\n');
      failed++;
    }
  }

  console.log('========================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
