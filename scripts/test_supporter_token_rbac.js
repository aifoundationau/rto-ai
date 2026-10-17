const fs = require('fs');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

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

async function testWithRealIdToken() {
  console.log('🧪 Testing real Firebase ID Token lifecycle and privilege boundaries...\n');

  const testUid = 'test-supporter-' + Date.now();
  const testEmail = `supporter_${Date.now()}@example.org`;

  // 1. Create a Firebase Auth user
  console.log(`1️⃣ Creating test Firebase Auth user: ${testEmail} (${testUid})`);
  await auth.createUser({
    uid: testUid,
    email: testEmail,
    displayName: 'Regular Supporter',
  });

  // 2. Mint custom token and exchange for ID token via Google Identity Toolkit
  console.log('2️⃣ Minting custom token and exchanging for Google ID token...');
  const customToken = await auth.createCustomToken(testUid, { email: testEmail });
  
  const exchangeRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${envVars.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true,
      }),
    }
  );

  const exchangeData = await exchangeRes.json();
  if (!exchangeData.idToken) {
    throw new Error('Failed to exchange custom token for ID token: ' + JSON.stringify(exchangeData));
  }
  const idToken = exchangeData.idToken;
  console.log('✅ Received genuine cryptographically signed Firebase ID token from Google.\n');

  // 3. User attempts to register/sync via POST /api/users with their valid ID token
  console.log('3️⃣ User registers via POST /api/users using their genuine Bearer token...');
  const regRes = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      displayName: 'Regular Supporter',
      // Notice: even if malicious client tried to send another email or uid in the body:
      email: 'support@aifoundation.net.au',
      uid: 'spoofed-admin-uid',
    }),
  });

  const regData = await regRes.json();
  console.log('Registration Response:', {
    status: regRes.status,
    role: regData.user?.role,
    email: regData.user?.email,
    isSuperAdmin: regData.user?.isSuperAdmin,
  });

  // Verify that the server IGNORING the spoofed body email and UID, and strictly used the token
  if (regData.user?.email !== testEmail) {
    throw new Error(`FAILURE: Server used body email instead of token email! Got ${regData.user?.email}`);
  }
  if (regData.user?.role !== 'supporter' || regData.user?.isSuperAdmin !== false) {
    throw new Error(`FAILURE: User received role ${regData.user?.role} instead of 'supporter'!`);
  }
  console.log('✅ PASS: Server discarded spoofed body values and assigned role: supporter based on verified token.\n');

  // 4. Supporter attempts to promote themselves or someone else via PATCH /api/users
  console.log('4️⃣ Supporter attempts to elevate role via PATCH /api/users...');
  const patchRes = await fetch('http://localhost:3000/api/users', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      uid: testUid,
      role: 'superadmin',
    }),
  });
  console.log(`PATCH status: ${patchRes.status}`);
  const patchData = await patchRes.json().catch(() => ({}));
  console.log('PATCH Response:', patchData);
  if (patchRes.status !== 403) {
    throw new Error(`FAILURE: Non-superadmin was able to call PATCH /api/users! Got status ${patchRes.status}`);
  }
  console.log('✅ PASS: Non-superadmin correctly blocked with 403 Forbidden.\n');

  // 5. Supporter attempts to assign role via POST /api/assign-role
  console.log('5️⃣ Supporter attempts to call POST /api/assign-role...');
  const assignRes = await fetch('http://localhost:3000/api/assign-role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      email: testEmail,
      role: 'superadmin',
    }),
  });
  console.log(`Assign status: ${assignRes.status}`);
  const assignData = await assignRes.json().catch(() => ({}));
  console.log('Assign Response:', assignData);
  if (assignRes.status !== 403) {
    throw new Error(`FAILURE: Non-superadmin was able to call POST /api/assign-role! Got status ${assignRes.status}`);
  }
  console.log('✅ PASS: Non-superadmin correctly blocked with 403 Forbidden.\n');

  // 6. Cleanup
  console.log('🧹 Cleaning up test user from Auth and Firestore...');
  await auth.deleteUser(testUid).catch(() => {});
  await db.collection('users').doc(testUid).delete().catch(() => {});
  console.log('✅ Test user cleaned up.');

  console.log('\n🏆 ALL PRIVILEGE BOUNDARY & CRYPTOGRAPHIC TOKEN VERIFICATION TESTS PASSED!');
  process.exit(0);
}

testWithRealIdToken().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
