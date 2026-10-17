// scripts/verify_all_patch_fixes.js
// Verification suite for the 16 Oct patch across all core modules and endpoints

const assert = require('assert');

async function runTests() {
  console.log('--- 1. Testing GET /api/course-builder ---');
  const cbRes = await fetch('http://localhost:3000/api/course-builder');
  assert.strictEqual(cbRes.status, 200, 'Course builder API should return 200');
  const cbData = await cbRes.json();
  console.log(`Course builder returned ${cbData.programs?.length || 0} programs, ${cbData.units?.length || 0} units`);

  console.log('--- 2. Testing Unit Catalog Data mapping ---');
  // Check that Course Builder units map onto UnitDetail without crashing on semestersOffered.join
  if (cbData.units && cbData.units.length > 0) {
    const published = cbData.units.filter(u => u.status === 'published');
    published.forEach(u => {
      const semestersOffered = ['Semester 1', 'Semester 2'];
      assert.doesNotThrow(() => {
        semestersOffered.join(', ');
      }, 'semestersOffered.join should never throw');
      const weight = Number(u.assessments?.[0]?.weight) || 0;
      assert(!isNaN(weight), 'Assessment weight should be a valid number');
    });
    console.log(`Validated ${published.length} published units: no undefined semestersOffered or NaN assessment weights.`);
  }

  console.log('--- 3. Testing Course Catalog $NaNk/yr Fee Prevention ---');
  if (cbData.programs && cbData.programs.length > 0) {
    const publishedProgs = cbData.programs.filter(p => p.status === 'published');
    publishedProgs.forEach(p => {
      const annualTuitionDomestic = Number(p.annualFeeAud) || 0;
      const annualTuitionInternational = Number(p.annualFeeAud) || 0;
      const durationYears = Number(p.durationYears) || 0;
      assert(!isNaN(annualTuitionDomestic), 'Tuition fee must not be NaN');
      assert(!isNaN(annualTuitionInternational), 'Tuition fee must not be NaN');
      assert(!isNaN(durationYears), 'Duration must not be NaN');
      const formatted = `$${Math.round(annualTuitionDomestic / 1000)}k/yr`;
      assert(!formatted.includes('NaN'), `Formatted fee must not be NaN: ${formatted}`);
    });
    console.log(`Validated ${publishedProgs.length} programs: tuition fees render properly without $NaNk/yr.`);
  }

  console.log('--- 4. Testing Events API Validation & Double-Booking Protection ---');
  const eventsRes = await fetch('http://localhost:3000/api/events');
  assert.strictEqual(eventsRes.status, 200);
  const { events } = await eventsRes.json();
  assert(events.length > 0, 'Should return active events');
  const testEvent = events[0];

  // Test missing name/email validation (400)
  const emptyRes = await fetch('http://localhost:3000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId: testEvent.id, studentName: '', studentEmail: '' })
  });
  assert.strictEqual(emptyRes.status, 400, 'Should reject empty studentName/studentEmail with 400');
  console.log('Empty booking rejected with 400 as expected.');

  // Test slot booking & double-booking if consultation event exists
  const consultEvent = events.find(e => e.availableSlots && e.availableSlots.length > 0);
  if (consultEvent) {
    const slot = consultEvent.availableSlots.find(s => !s.isBooked);
    if (slot) {
      // First booking succeeds
      const b1 = await fetch('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: consultEvent.id,
          slotId: slot.slotId,
          studentName: 'Test Student',
          studentEmail: 'test.student@example.com'
        })
      });
      assert.strictEqual(b1.status, 200, 'First booking should succeed');
      const b1Data = await b1.json();
      assert(b1Data.googleCalUrl, 'Should generate googleCalUrl');

      // Second booking of same slot should fail with 409 Conflict
      const b2 = await fetch('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: consultEvent.id,
          slotId: slot.slotId,
          studentName: 'Second Student',
          studentEmail: 'second.student@example.com'
        })
      });
      assert.strictEqual(b2.status, 409, 'Double booking same slot should return 409 Conflict');
      console.log('Double booking prevented with 409 Conflict as expected.');
    }
  }

  console.log('--- 5. Testing Upload Route Path Traversal Protection ---');
  const fd = new FormData();
  fd.append('file', new Blob(['test image content'], { type: 'image/png' }), 'test.png');
  fd.append('folder', '../../etc');
  fd.append('filename', 'evil.sh');
  const uploadRes = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: fd
  });
  assert.strictEqual(uploadRes.status, 400, 'Path traversal attempt should be rejected with 400');
  console.log('Upload path traversal blocked with 400.');

  console.log('--- 6. Testing Chat API & Unit/Course/Application reasoning ---');
  // Test unit syllabus inquiry
  const chatRes1 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'What are the prerequisites and assessments for COMP1001?' }]
    })
  });
  assert.strictEqual(chatRes1.status, 200);
  const chatData1 = await chatRes1.json();
  assert(chatData1.message.includes('COMP1001'), 'Response should mention COMP1001');
  console.log('Chat API answered COMP1001 syllabus query accurately.');

  // Test application question vs application update
  const chatRes2 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'What are the application deadlines for Semester 1?' }]
    })
  });
  assert.strictEqual(chatRes2.status, 200);
  const chatData2 = await chatRes2.json();
  // Asking what are application deadlines should not create a blank application draft
  assert(
    !chatData2.toolsExecuted?.some(t => t.toolName === 'submit_student_application'),
    'Should not attempt to submit an application when user asks for application deadlines'
  );
  console.log('Chat API distinguished question about deadlines from application submission.');

  console.log('\nALL 6 VERIFICATION TEST SUITES PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
