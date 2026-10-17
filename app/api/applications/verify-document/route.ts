import { NextRequest, NextResponse } from 'next/server';
import { DocumentAuthenticityAudit } from '@/data/applications';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentCategory, imageBase64, mimeType = 'image/jpeg', applicantName = '', fileName = '' } = body;

    if (!documentCategory || !imageBase64) {
      return NextResponse.json(
        { error: 'Missing required fields: documentCategory and imageBase64' },
        { status: 400 }
      );
    }

    // Clean base64 data
    const cleanBase64 = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;

    const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();

    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI document inspection service is not configured (missing Gemini API key). Document cannot be verified.',
          audit: {
            documentCategory: documentCategory as 'identity' | 'academic',
            documentType: 'Unverified Upload',
            issuingEntity: 'Unknown',
            country: 'Unknown',
            briefDescription: `Unverified ${documentCategory === 'identity' ? 'Identity Document' : 'Academic Credential'} (${fileName || 'file'}). Manual admissions officer inspection required.`,
            identifiedName: 'Unverified',
            nameMatchesApplicant: false,
            authenticityStatus: 'Requires Additional Review',
            authenticityScore: 0,
            legitimacyNotes: 'Automated inspection service is unconfigured. Zero automated verification performed.',
            verifiedAt: new Date().toISOString(),
            filename: fileName
          }
        },
        { status: 503 }
      );
    }

    const isIdentity = documentCategory === 'identity';

    const prompt = `You are a certified forensic credential auditor for university admissions, trained under the 'personal-id-inspection' and 'academic-transcript-inspection' forensic standards.
Analyze this uploaded document image for authenticity verification.
Target Category: ${isIdentity ? 'Proof of Identity (Passport, Driver License, National ID)' : 'Academic Qualification (University Transcript, Diploma, Degree Testamur)'}.
Applicant Name on File: "${applicantName}".
Uploaded Filename: "${fileName}".

PRIVACY AND SECURITY DIRECTIVE:
You are analyzing this image in volatile memory only. The image will be discarded immediately after this check. Zero copies will be stored.

CRITICAL ACCURACY & INTEGRITY MANDATES:
1. ZERO HALLUCINATIONS: Under NO circumstances should you invent, assume, or fabricate document details based on the filename. You must base your findings SOLELY on the visual content present in the image.
2. INVALID / NON-DOCUMENT HANDLING: If the image is blank, a placeholder, a generic logo, an icon, a corrupted image, a selfie/photo without document text, or completely unrelated:
   - Set "authenticityStatus" to "Suspect / Irregular".
   - Set "authenticityScore" to 0 (or a number between 0 and 15).
   - Set "documentType" to "Invalid / Unrecognized Image".
   - Set "issuingEntity" to "None".
   - Set "country" to "Unknown".
   - Set "nameMatchesApplicant" to false.
   - Set "identifiedName" to "None".
   - State clearly in "briefDescription" and "legitimacyNotes" that the uploaded file does not contain a recognizable, authentic credential.
3. FORENSIC VERIFICATION CRITERIA (If document is present):
${isIdentity ? `
   - Passports: ICAO Doc 9303 compliance, Machine Readable Zone (MRZ) 2-line OCR-B typography and check digits, biometric camera symbol, ghost portrait opacity, holographic laminate patterns, and issuing department (e.g. DFAT, State Dept).
   - Driver Licences / National IDs: PDF417 2D barcodes, state transport authority logos, security laminates, micro-lines (guilloche curved patterns), expiration date validity.
   - Tampering Red Flags: Font weight discrepancies around name/DOB, compression block noise clustered solely around personal details, misaligned baselines, artificial halos around portrait photo.
` : `
   - University Transcripts: Institutional letterhead & crest, Registrar signature or digital seal, sequential semester course codes & credit points, grading scale (WAM/GPA/HD/D/CR/P), and official completion/conferral statement.
   - Degree Testamurs & Diplomas: Senate/Council authorization wording, Chancellor signatures, embossed or gold foil seals, graduation date, calligraphy consistency.
   - Tampering Red Flags: Diploma mill naming variations, font mismatch between student name and certificate body, arithmetic grade errors, missing security borders.
`}
4. NAME MATCHING: Compare the name printed on the document with the Applicant Name on File ("${applicantName}"). Set "nameMatchesApplicant" to true only if they clearly match or represent a standard nickname/legal variation.

5. MANDATORY BRIEF DESCRIPTION STANDARD:
Provide a concise, factual 1-2 sentence "briefDescription" tailored for university admissions officers.
- Format if Authentic: "[Official Document Type] for [Identified Name], issued by [Issuing Authority] ([Country]). [Validity status / Expiration] with [Security feature confirmation]."
- Format if Invalid / Suspect: "Uploaded file does not contain a verifiable [Identity/Academic] document. [Specific visual failure description]."

Respond with ONLY valid JSON with this exact structure:
{
  "documentCategory": "${documentCategory}",
  "documentType": "string",
  "issuingEntity": "string",
  "country": "string",
  "briefDescription": "string",
  "identifiedName": "string",
  "nameMatchesApplicant": false,
  "authenticityStatus": "Legitimate",
  "authenticityScore": 95,
  "legitimacyNotes": "string"
}`;

    // Target Gemini 3.8 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[verify-document] Gemini 3.8 Flash returned error:', res.status, errText);
      return NextResponse.json(
        {
          success: false,
          error: `AI document inspection service returned status ${res.status}: ${errText}`,
          audit: {
            documentCategory: documentCategory as 'identity' | 'academic',
            documentType: 'Unverified Upload',
            issuingEntity: 'Unknown',
            country: 'Unknown',
            briefDescription: `Document inspection could not be completed by Gemini AI (${res.status}). Manual inspection required.`,
            identifiedName: 'Unverified',
            nameMatchesApplicant: false,
            authenticityStatus: 'Requires Additional Review',
            authenticityScore: 0,
            legitimacyNotes: `AI vision service failed with status ${res.status}. No automated legitimacy claims can be made. Document must be inspected manually.`,
            verifiedAt: new Date().toISOString(),
            filename: fileName
          }
        },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI vision model returned empty inspection output.',
          audit: {
            documentCategory: documentCategory as 'identity' | 'academic',
            documentType: 'Unverified Upload',
            issuingEntity: 'Unknown',
            country: 'Unknown',
            briefDescription: 'Document inspection returned empty result. Manual inspection required.',
            identifiedName: 'Unverified',
            nameMatchesApplicant: false,
            authenticityStatus: 'Requires Additional Review',
            authenticityScore: 0,
            legitimacyNotes: 'Model was unable to generate a forensic analysis for the supplied image data.',
            verifiedAt: new Date().toISOString(),
            filename: fileName
          }
        },
        { status: 502 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('[verify-document] Failed to parse JSON from model:', rawText);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse model inspection response.',
          rawText
        },
        { status: 500 }
      );
    }

    // Sanitize score and status
    const status: 'Legitimate' | 'Requires Additional Review' | 'Suspect / Irregular' = 
      ['Legitimate', 'Requires Additional Review', 'Suspect / Irregular'].includes(parsed.authenticityStatus)
        ? parsed.authenticityStatus
        : (parsed.authenticityScore >= 75 ? 'Legitimate' : parsed.authenticityScore >= 50 ? 'Requires Additional Review' : 'Suspect / Irregular');

    const score = typeof parsed.authenticityScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.authenticityScore)))
      : (status === 'Legitimate' ? 90 : status === 'Requires Additional Review' ? 50 : 0);

    const auditResult: DocumentAuthenticityAudit = {
      documentCategory: documentCategory as 'identity' | 'academic',
      documentType: parsed.documentType || (isIdentity ? 'Identity Document' : 'Academic Credential'),
      issuingEntity: parsed.issuingEntity || 'Unknown Authority',
      country: parsed.country || 'Unknown',
      briefDescription: parsed.briefDescription || 'Document inspected by automated forensic system.',
      identifiedName: parsed.identifiedName || 'None',
      nameMatchesApplicant: Boolean(parsed.nameMatchesApplicant),
      authenticityStatus: status,
      authenticityScore: score,
      legitimacyNotes: parsed.legitimacyNotes || 'Forensic evaluation completed.',
      verifiedAt: new Date().toISOString(),
      filename: fileName
    };

    return NextResponse.json({
      success: true,
      audit: auditResult,
      privacyGuarantee: 'Image analyzed in volatile memory only and discarded immediately. Zero copies stored in database.'
    });
  } catch (error: any) {
    console.error('[verify-document] Unhandled Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze document' },
      { status: 500 }
    );
  }
}
