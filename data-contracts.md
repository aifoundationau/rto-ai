# Permanent Data Contracts & System Integrity Specification
**Project:** EduPulse AI / RTO AI Admission & Academic Management Portal  
**Document Version:** 1.0.0 (Immutable Single Source of Truth)  
**Primary Working Path:** `D:\Agy\rto-ai`  
**Governing Authorities:** Australian Privacy Act 1988 (APPs), Higher Education Standards Framework (TEQSA / ASQA), PCI DSS, OWASP Top 10.

---

## 1. Architectural Principles & Boundaries

1. **Strict Client-Side Identity Authority:** All end-user identity must originate from Firebase Authentication using the Google Identity Provider (`GoogleAuthProvider`). No secondary auth database or plain password store shall exist.
2. **Stateless Hosting:** Edge hosting services (Vercel, Firebase Hosting) act strictly as static and serverless edge delivery nodes with zero server-side state.
3. **Defense in Depth:** Validation occurs across all three tiers:
   - Client Tier: Real-time UI input constraints, maskings, and regex checks.
   - Agent Tier: Slot extraction validation, strict enum rejection, and anti-hallucination guardrails.
   - Database / Rule Tier: Firestore Security Rules (`firestore.rules`) and Admin SDK schema validation before commit.
4. **Data Isolation:** All administrative updates, student number generation, and role assignments are mediated exclusively via the Firebase Admin SDK (`lib/firebase/admin.ts`).

---

## 2. Domain Entity Contracts

### Domain Entity 1: Student Application (`applications`)

* **Target Storage:** Firestore Collection `/applications/{id}`
* **Data Classification:** PII / Sensitive Educational Record
* **Regulatory Standard:** Australian Privacy Principles (APP 1, 3, 6, 11), TEQSA Records Retention (7 Years)

| Field Name | Type | Ingestion Channel | Constraints & Invariants | Sanitization / Normalization | Lifecycle & Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | System / API | Format: `APP-YYYY-XXXXX` | Uppercase, immutable | Primary Document Key |
| `status` | `enum` | UI / API / AI | `'Draft' \| 'Submitted' \| 'Under Review' \| 'Accepted' \| 'Rejected'` | Strict enum | Indexed, retention: 7 yrs |
| `personalDetails.fullName` | `string` | UI Form, AI Slot | Length: 2–100 chars, no HTML | Trimmed, title-cased | Encrypted at rest |
| `personalDetails.email` | `string` | UI Form, AI Slot | RFC 5322 email regex, required | Trimmed, lowercase | Indexed query filter |
| `personalDetails.phone` | `string` | UI Form, AI Slot | E.164 Australian/International format regex | Stripped spaces/dashes | Encrypted at rest |
| `personalDetails.dateOfBirth` | `string` | UI Form, AI Slot | ISO 8601 (`YYYY-MM-DD`), Age >= 16 | Validated date object | Encrypted at rest |
| `personalDetails.citizenship` | `enum` | UI Form, AI Slot | `'Domestic (Australian/NZ Citizen/PR)' \| 'International'` | Strict enum | Audited field |
| `personalDetails.countryOfResidence`| `string` | UI Form, AI Slot | ISO 3166-1 country name | Trimmed | Standard text |
| `personalDetails.address` | `string` | UI Form, AI Slot | Length: 5–250 chars | Sanitized text | Encrypted at rest |
| `academicDetails.highestEducation` | `enum` | UI Form, AI Slot | `'High School / Year 12' \| 'Bachelor Degree' \| 'Master Degree' \| 'Diploma'` | Strict enum | Normal text |
| `academicDetails.institutionName` | `string` | UI Form, AI Slot | Length: 2–150 chars | Trimmed text | Normal text |
| `academicDetails.graduationYear` | `string` | UI Form, AI Slot | Range: 1970 to `currentYear + 5` | Strict numeric string | Normal text |
| `academicDetails.atarOrGpa` | `string` | UI Form, AI Slot | Length: 1–30 chars (e.g., `94.20`, `6.5/7.0`) | Trimmed | Normal text |
| `academicDetails.englishProficiencyTest`| `string`| UI Form, AI Slot | Native Speaker, IELTS, TOEFL, PTE | Standard enum/string | Normal text |
| `coursePreferences.firstChoiceCourseId`| `string`| UI Form, AI Slot | Must match valid course in `courses.ts` (`b-cs`, `m-ai`, etc.) | Strict foreign key | Foreign Index |
| `coursePreferences.firstChoiceCourseName`| `string`| System / AI | Course title auto-resolved from catalog | Normal string | Denormalized display |
| `coursePreferences.intakeSemester` | `enum` | UI Form, AI Slot | `'February (Semester 1)' \| 'July (Semester 2)'` | Strict enum | Normal text |
| `coursePreferences.studyMode` | `enum` | UI Form, AI Slot | `'Full-time' \| 'Part-time'` | Strict enum | Normal text |
| `statementsAndDocuments.statementOfPurpose` | `string` | UI Form, AI Slot | Max length: 5000 chars | Sanitized text | Encrypted at rest |
| `statementsAndDocuments.scholarshipInterest`| `boolean`| UI Form, AI Slot | Required boolean | Strict boolean | Filtering flag |
| `statementsAndDocuments.declarationAgreed` | `boolean` | UI Form, AI Slot | Must be `true` upon submission | Strict invariant | Non-repudiation audit |

---

### Domain Entity 2: Admissions Events & Consultations (`events`, `event_bookings`)

* **Target Storage:** Firestore Collection `/event_bookings/{bookingId}`
* **Data Classification:** PII (Booking Details)
* **Regulatory Standard:** Australian Privacy Act (APP 3 & 6), RFC 5545 iCalendar standard

| Field Name | Type | Ingestion Channel | Constraints & Invariants | Sanitization / Normalization | Lifecycle & Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bookingId` | `string` | API / System | Format: `BK-XXXXXX` | Uppercase timestamp string | Document Key |
| `eventId` | `string` | UI / API / AI | Must match active event ID in catalog | Foreign Key check | Indexed query |
| `studentName` | `string` | UI / API / AI | Length: 2–100 chars | Trimmed | Encrypted at rest |
| `studentEmail` | `string` | UI / API / AI | Valid RFC 5322 email | Lowercase, trimmed | Attendee notification |
| `startTime` | `string` | UI / API / AI | ISO 8601 UTC string | Validated date | Calendar sync |
| `endTime` | `string` | UI / API / AI | ISO 8601 UTC string (`endTime > startTime`) | Validated date | Calendar sync |
| `slotId` | `string` | UI / API / AI | Must match unbooked consultation slot | Concurrency lock (`isBooked: true`)| Atomic reservation |
| `notes` | `string` | UI / API / AI | Max 1000 chars | HTML-escaped text | Document field |

---

### Domain Entity 3: User Identity & RBAC (`users`, `students`)

* **Target Storage:** Firebase Auth Claims + Firestore `/users/{uid}` + `/students/{uid}`
* **Data Classification:** Confidential Identity / Credential Record
* **Regulatory Standard:** Zero-Trust Access Control, Australian Privacy Principles (APP 11)

| Field Name | Type | Ingestion Channel | Constraints & Invariants | Sanitization / Normalization | Lifecycle & Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `uid` | `string` | Firebase Auth | Authenticated Google OAuth UID | Immutable identifier | Document Key |
| `email` | `string` | Google SSO | Lowercase, verified email | Strictly normalized | Unique user index |
| `displayName` | `string` | Google SSO / Form | Max 100 chars | Trimmed text | User profile |
| `role` | `enum` | Server Admin API | `'STUDENT' \| 'SUPERADMIN' \| 'REGISTRAR' \| 'ACADEMIC_STAFF'` | Strict RBAC enum | Token Claim + Doc |
| `studentNumber` | `string` | Server Counter | Format: `STU-YYYY-XXXXX`, immutable | Generated via atomic transaction | Unique Student Index |
| `dept` | `string` | Server Admin API | Department title | Sanitized text | User profile |
| `updatedAt` | `timestamp` | Server Admin API | Server timestamp | Server-generated | Audit metadata |

---

### Domain Entity 4: AI Advisor Chat Interactions (`chat_interactions`)

* **Target Storage:** Firestore Collection `/chat_interactions/{id}`
* **Data Classification:** Transient Inquiry / Non-sensitive Telemetry
* **Regulatory Standard:** AI Ethics Framework, APP 3 (Collection with Consent)

| Field Name | Type | Ingestion Channel | Constraints & Invariants | Sanitization / Normalization | Lifecycle & Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sessionId` | `string` | Client SDK | Client UUID | Trimmed | Document metadata |
| `userMessage` | `string` | UI Chat | Max length: 4000 chars | Sanitized text | 90-day retention |
| `assistantResponse` | `string` | Gemini API | Valid markdown string | Verified output | 90-day retention |
| `toolsExecuted` | `array` | AI Engine | List of executed tool names & args | JSON serialized | Audit trail |
| `applicantEmail` | `string` | Session State | Optional email | Lowercase | User correlation |
| `currentApplicationId`| `string`| Session State | Optional application ID | Validated string | Application audit |

---

### Domain Entity 5: Dynamic Catalog & Google Sheets Sync (`dynamicStore`)

* **Target Storage:** In-Memory Server Store synced from Google Sheets CSV Export
* **Data Classification:** Public University Syllabus & Course Catalog
* **Regulatory Standard:** Higher Education Standards Framework (Public Course Accuracy)

| Field Name | Type | Ingestion Channel | Constraints & Invariants | Sanitization / Normalization | Lifecycle & Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sheetIdOrUrl` | `string` | Admin UI Form | Valid Google Sheet ID or public Docs URL | Extracted via regex | Transient input |
| `courses` | `array` | CSV Sheet Tab | Must include ID, Name, Level, Faculty, Duration, ATAR, Fee | Type-cast & validated | In-memory cache |
| `units` | `array` | CSV Sheet Tab | Must include Code, Name, Credits, Semesters, Prerequisites | Type-cast & validated | In-memory cache |
| `faqs` | `array` | CSV Sheet Tab | Must include Question, Answer, Category, Keywords | Comma-separated parse | In-memory cache |

---

### Domain Entity 6: TokenPulse Academic Ledger (`token_transactions`)

* **Target Storage:** Firestore Collection `/token_transactions/{id}`
* **Data Classification:** Financial Ledger Record
* **Regulatory Standard:** Australian Corporations Act, Immutable Audit Logging

| Field Name | Type | Ingestion Channel | Constraints & Invariants | Sanitization / Normalization | Lifecycle & Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `action` | `string` | Admin Portal | Transaction title / type | Trimmed | Audit field |
| `performedBy` | `string` | Admin Session | Admin user email / UID | Verified email | Audit field |
| `tokensAmount` | `number` | Admin Portal | Numeric, positive non-zero | Strict integer | Ledger balance |
| `audEquivalent` | `number` | Admin Portal | Currency float >= 0 | Rounded to 2 decimals | Financial value |
| `targetAllocation` | `string` | Admin Portal | Recipient department or grant | Sanitized text | Ledger target |
| `reason` | `string` | Admin Portal | Justification notes | Trimmed text | Audit justification |
| `createdAt` | `timestamp` | Server FieldValue | Server timestamp | Immutable | Append-only ledger |

---

### Domain Entity 7: Platform Telemetry & Activity Auditing (`activity_logs`, `metrics`)

* **Target Storage:** Firestore Collection `/activity_logs/{id}` + Counter `/metrics/platform_stats`
* **Data Classification:** Operational Security Log
* **Regulatory Standard:** Australian Privacy Principle 11 (Security Governance)

| Field Name | Type | Ingestion Channel | Constraints & Invariants | Sanitization / Normalization | Lifecycle & Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `category` | `enum` | API / Client SDK | `'APPLICATION' \| 'CHAT' \| 'TOKEN' \| 'AUTH' \| 'PAGE_VIEW'` | Strict enum | Partition key |
| `action` | `string` | API / Client SDK | Action verb identifier | Uppercase identifier | Event name |
| `userId` | `string` | Session State | Optional user UID | Cleaned string | Audit trail |
| `userEmail` | `string` | Session State | Optional user email | Lowercase | Audit trail |
| `metadata` | `object` | Client / API | Valid JSON dictionary | Undefined keys stripped | Event context |
| `userAgent` | `string` | HTTP Request | Browser user agent string | Header parsed | Security audit |
| `ip` | `string` | HTTP Request | Client IP address | Header parsed | Security audit |

---

## 3. Enforcement & Validation Invariants

1. **Anti-Hallucination Agent Boundaries:**
   - The AI Agent (`lib/agent/engine.ts`) is strictly forbidden from fabricating course IDs, unit codes, or event slot IDs.
   - Any tool invocation referencing an invalid `courseId` or `unitCode` automatically falls back to an error message requesting the student clarify their selection.
2. **Atomic Student Number Generation:**
   - Student numbers (`STU-YYYY-XXXXX`) are produced using a Firestore atomic transaction on the `/counters/student_id_counter` document. Once assigned, student numbers are immutable and permanently bound to both the student's Firestore document and Firebase Auth Custom Claims.
3. **No In-Place File Deletions for Ledgers:**
   - The `/token_transactions` collection is strictly append-only. Firestore security rules prohibit `update` or `delete` actions on this collection.
