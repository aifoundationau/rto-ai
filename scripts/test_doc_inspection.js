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

const key = envVars.GEMINI_API_KEY;
console.log('Testing with key starting with:', key.substring(0, 10));

// 1x1 transparent png
const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const prompt = `You are a certified forensic credential auditor for university admissions, trained under the 'personal-id-inspection' and 'academic-transcript-inspection' standards.
Analyze this uploaded document image for authenticity verification.
Target Category: Proof of Identity (Passport, Driver License, National ID).
Applicant Name on File: "John Doe".
Uploaded Filename: "fake_passport.jpg".

CRITICAL ACCURACY DIRECTIVE:
1. Under NO circumstances should you hallucinate or invent document details.
2. If the image is NOT a legitimate identity document (e.g. blank, placeholder, icon, solid color, meme, or non-document image), you MUST:
   - Set authenticityStatus to "Suspect / Irregular" or "Requires Additional Review".
   - Set authenticityScore to 0 (or a number between 0 and 15).
   - Set documentType to "Invalid / Unrecognized Image".
   - Set issuingEntity to "None".
   - Set country to "Unknown".
   - Set nameMatchesApplicant to false.
   - Explain clearly in briefDescription and legitimacyNotes that the file does not contain a readable identity document.
3. If it IS a genuine document, carefully verify MRZ checksums, biometric logos, seals, fonts, and name matching against "John Doe".

Respond with ONLY valid JSON with this exact structure:
{
  "documentCategory": "identity",
  "documentType": "string",
  "issuingEntity": "string",
  "country": "string",
  "briefDescription": "string",
  "identifiedName": "string",
  "nameMatchesApplicant": false,
  "authenticityStatus": "Suspect / Irregular",
  "authenticityScore": 0,
  "legitimacyNotes": "string"
}`;

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/png', data: tinyPngBase64 } }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    })
  });

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('Gemini 3.8 Flash Forensic Result on Blank Image:');
  console.log(text);
}

test().catch(console.error);
