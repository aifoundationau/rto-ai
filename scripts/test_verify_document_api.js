async function testVerifyDocumentRoute() {
  console.log('🧪 Testing POST /api/applications/verify-document with fake passport.jpg...');

  // 1x1 transparent png
  const fakePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const res = await fetch('http://localhost:3000/api/applications/verify-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentCategory: 'identity',
      imageBase64: fakePngBase64,
      mimeType: 'image/png',
      applicantName: 'Test Applicant',
      fileName: 'passport.jpg', // <--- Previously, this fake file named passport.jpg was given "Legitimate 96%"!
    }),
  });

  console.log(`Status: ${res.status} ${res.statusText}`);
  const data = await res.json();
  console.log('Response Body:', JSON.stringify(data, null, 2));

  if (!data.audit) {
    throw new Error('No audit object in response!');
  }

  // Verify that it DID NOT fabricate Legitimate 96%
  if (data.audit.authenticityStatus === 'Legitimate' && data.audit.authenticityScore >= 90) {
    throw new Error('❌ FAILURE: Fake image was still marked as Legitimate 96%!');
  }

  console.log('\nAudit Verdict:');
  console.log('  Status:', data.audit.authenticityStatus);
  console.log('  Score:', data.audit.authenticityScore);
  console.log('  Document Type:', data.audit.documentType);
  console.log('  Brief Description:', data.audit.briefDescription);
  console.log('  Legitimacy Notes:', data.audit.legitimacyNotes);

  if (data.audit.authenticityStatus === 'Suspect / Irregular' || data.audit.authenticityStatus === 'Requires Additional Review') {
    console.log('\n✅ PASS: Fake passport.jpg was correctly evaluated and flagged (NOT fabricated as Legitimate)!');
  } else {
    throw new Error(`Unexpected status: ${data.audit.authenticityStatus}`);
  }
}

testVerifyDocumentRoute()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
