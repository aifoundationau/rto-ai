const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');

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

const db = getFirestore();
const auth = getAuth();

async function runTests() {
  console.log('🧪 Starting Strict Supporter Registration & RBAC Verification Tests...');

  const testNewUid = 'test-strict-reg-' + Date.now();
  const testNewEmail = `testuser_${Date.now()}@example.org`;

  // 1. Test First-Time Registration via local fetch to Next.js API
  console.log(`\n1️⃣ Testing first-time registration for new email: ${testNewEmail}`);
  const postRes = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: testNewUid,
      email: testNewEmail,
      displayName: 'First Time Test Registrant',
      photoURL: 'https://example.com/avatar.jpg'
    })
  });

  const postData = await postRes.json();
  console.log('API POST Response:', JSON.stringify(postData, null, 2));

  if (postData.user?.role !== 'supporter') {
    throw new Error(`FAILURE: First-time registrant received role '${postData.user?.role}' instead of 'supporter'!`);
  }
  if (postData.user?.isSuperAdmin !== false) {
    throw new Error(`FAILURE: First-time registrant received isSuperAdmin: true!`);
  }
  console.log('✅ PASS: API assigned role: supporter and isSuperAdmin: false for first-time registration.');

  // 2. Verify directly in Cloud Firestore
  console.log(`\n2️⃣ Verifying Firestore record for ${testNewUid}...`);
  const docSnap = await db.collection('users').doc(testNewUid).get();
  if (!docSnap.exists) {
    throw new Error('FAILURE: Firestore user document was not created!');
  }
  const docData = docSnap.data();
  console.log('Firestore Doc Data:', {
    email: docData.email,
    role: docData.role,
    status: docData.status,
    isSuperAdmin: docData.isSuperAdmin,
    classification: docData.classification,
  });

  if (docData.role !== 'supporter' || docData.isSuperAdmin !== false) {
    throw new Error(`FAILURE: Firestore document has role: ${docData.role}, isSuperAdmin: ${docData.isSuperAdmin}`);
  }
  console.log('✅ PASS: Firestore record strictly has role: supporter and isSuperAdmin: false.');

  // 3. Verify that existing superadmin (support@aifoundation.net.au) logs in as superadmin
  console.log('\n3️⃣ Verifying existing superadmin (support@aifoundation.net.au)...');
  const superRes = await fetch('http://localhost:3000/api/users?email=support@aifoundation.net.au');
  const superData = await superRes.json();
  console.log('Superadmin GET Response:', {
    email: superData.user?.email,
    role: superData.user?.role,
    isSuperAdmin: superData.user?.isSuperAdmin
  });
  if (superData.user?.role !== 'superadmin' || superData.user?.isSuperAdmin !== true) {
    throw new Error('FAILURE: support@aifoundation.net.au did not receive superadmin role!');
  }
  console.log('✅ PASS: support@aifoundation.net.au retains role: superadmin and isSuperAdmin: true.');

  // 4. Verify that existing supporter (sellvideos@gmail.com) logs in as supporter
  console.log('\n4️⃣ Verifying existing supporter (sellvideos@gmail.com)...');
  const supporterRes = await fetch('http://localhost:3000/api/users?email=sellvideos@gmail.com');
  const supporterData = await supporterRes.json();
  console.log('Supporter GET Response:', {
    email: supporterData.user?.email,
    role: supporterData.user?.role,
    isSuperAdmin: supporterData.user?.isSuperAdmin
  });
  if (supporterData.user?.role !== 'supporter' || supporterData.user?.isSuperAdmin !== false) {
    throw new Error('FAILURE: sellvideos@gmail.com is not role: supporter!');
  }
  console.log('✅ PASS: sellvideos@gmail.com is strictly role: supporter and isSuperAdmin: false.');

  // 5. Cleanup temporary test user
  console.log(`\n🧹 Cleaning up test document ${testNewUid}...`);
  await db.collection('users').doc(testNewUid).delete();
  console.log('✅ Cleaned up temporary test document.');

  console.log('\n🏆 ALL STRICT RBAC & FIRST-TIME REGISTRATION TESTS PASSED PERFECTLY!');
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
