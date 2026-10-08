# RTO AI Data Contracts & System Integrity Specification

**System Code**: `rto-ai`  
**Database Code**: `rto-ai`  
**Parent Ecosystem**: AI Foundation Australia  
**Status**: Immutable Specification / Active Single Source of Truth  
**Target Storage**: Google Cloud Firestore (`projects/ai-foundation-firebase/databases/rto-ai` or `(default)` with `databaseCode: 'rto-ai'` multi-tenant partitioning)

---

## 1. System Identity & Multi-Tenant Partitioning Invariant

Every record written to the database or telemetry stream across this platform MUST be tagged with the multi-tenant discriminator:

```json
{
  "databaseCode": "rto-ai",
  "systemId": "rto-ai"
}
```

* **Client SDK Environment Key**: `NEXT_PUBLIC_DATABASE_CODE="rto-ai"`
* **Server/Admin Environment Key**: `DATABASE_CODE="rto-ai"`
* **Database Instance Key**: `FIRESTORE_DATABASE_ID="(default)"` (switchable to `"rto-ai"` upon named GCP Firestore database provisioning)

---

## 2. Domain Data Contracts

### 2.1 Student Applications Entity (`/applications/{id}`)
* **Ingestion Channels**:
  * UI Form: `ApplicationPortalView.tsx`
  * REST API Route: `POST /api/applications`
  * AI Agent Tool Call: `update_application_field`, `submit_student_application`
* **Data Classification**: PII (Personally Identifiable Information)
* **Regulatory Tagging**: Australian Privacy Principles (APP 1–13), Privacy Act 1988
* **Schema Definition**:
  | Field | Type | Required | Constraints & Validation | Ingestion Channel | Target Firestore Path |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `databaseCode` | string | Yes | Fixed value: `"rto-ai"` | Server injected | `applications/{id}.databaseCode` |
  | `id` | string | Yes | `APP-[0-9]{4}-[A-Z0-9]{4}` | System generated | Document Key |
  | `status` | enum | Yes | `Draft` \| `Submitted` \| `Under Review` \| `Approved` \| `Rejected` | UI / API / Agent | `applications/{id}.status` |
  | `personalDetails.fullName` | string | Yes | 2–100 chars, trimmed, HTML-escaped | UI / API / Agent | `personalDetails.fullName` |
  | `personalDetails.email` | string | Yes | RFC 5322 email regex, lowercase | UI / API / Agent | `personalDetails.email` |
  | `personalDetails.phone` | string | Yes | E.164 or Australian standard `04XXXXXXXX` | UI / API / Agent | `personalDetails.phone` |
  | `personalDetails.dateOfBirth` | string | Yes | ISO 8601 date `YYYY-MM-DD` | UI / API / Agent | `personalDetails.dateOfBirth` |
  | `personalDetails.citizenship` | enum | Yes | `Domestic` \| `International` | UI / API / Agent | `personalDetails.citizenship` |
  | `academicHistory.previousQualification` | string | Yes | 2–150 chars | UI / API / Agent | `academicHistory.previousQualification` |
  | `academicHistory.institution` | string | Yes | 2–150 chars | UI / API / Agent | `academicHistory.institution` |
  | `academicHistory.gpaOrScore` | string | Yes | Valid numeric format or ATAR (0.00–99.95) | UI / API / Agent | `academicHistory.gpaOrScore` |
  | `coursePreferences.firstChoiceCourseId` | string | Yes | Valid catalog course code (e.g. `CS100`, `AI500`) | UI / API / Agent | `coursePreferences.firstChoiceCourseId` |
  | `coursePreferences.firstChoiceCourseName`| string | Yes | Matches catalog course title | UI / API / Agent | `coursePreferences.firstChoiceCourseName` |
  | `coursePreferences.commencingTerm` | string | Yes | Term format (e.g. `Semester 1, 2026`) | UI / API / Agent | `coursePreferences.commencingTerm` |
  | `savedToFirestoreAt` | timestamp | Yes | `FieldValue.serverTimestamp()` | Server injected | `savedToFirestoreAt` |

---

### 2.2 User Identity, Student Numbers & RBAC Entity (`/users/{uid}`)
* **Ingestion Channels**:
  * Google SSO Modular Client (`firebase-auth-sso.js`, `GoogleClassroomLoginModal.tsx`)
  * REST API Route: `POST /api/assign-role`
* **Data Classification**: PII & High Security Identity
* **Regulatory Tagging**: OAuth 2.0 Identity Protocol, APP 11 (Security)
* **Schema Definition**:
  | Field | Type | Required | Invariants & Protection | Target Firestore Path |
  | :--- | :--- | :--- | :--- | :--- |
  | `databaseCode` | string | Yes | Fixed value: `"rto-ai"` | `users/{uid}.databaseCode` |
  | `uid` | string | Yes | Firebase Auth UID | Document Key |
  | `email` | string | Yes | Verified Google Workspace / organization email | `users/{uid}.email` |
  | `displayName` | string | Yes | Full name from Google Profile | `users/{uid}.displayName` |
  | `role` | enum | Yes | `STUDENT` \| `ACADEMIC_STAFF` \| `REGISTRAR` \| `ADMIN` \| `SUPERADMIN` | `users/{uid}.role` + Custom Claims |
  | `studentNumber` | string | Cond. | Format `STU-YYYY-XXXXX`. **Immutable by student**; generated atomically via counter `/counters/student_id_counter` | `users/{uid}.studentNumber` |
  | `updatedAt` | timestamp | Yes | `FieldValue.serverTimestamp()` | `users/{uid}.updatedAt` |

---

### 2.3 Event Bookings & Calendar Sync Entity (`/event_bookings/{id}`)
* **Ingestion Channels**:
  * UI Form: `EventsCalendarView.tsx`
  * REST API Route: `POST /api/events`
  * AI Agent Tool Call: `book_admissions_event`
* **Data Classification**: PII
* **Regulatory Tagging**: APP 3 & APP 6 (Use and disclosure of personal info)
* **Schema Definition**:
  | Field | Type | Required | Constraints & Validation | Target Firestore Path |
  | :--- | :--- | :--- | :--- | :--- |
  | `databaseCode` | string | Yes | Fixed value: `"rto-ai"` | `event_bookings/{id}.databaseCode` |
  | `eventId` | string | Yes | Matches catalog event identifier | `event_bookings/{id}.eventId` |
  | `title` | string | Yes | Event title | `event_bookings/{id}.title` |
  | `studentName` | string | Yes | Attendee name, trimmed | `event_bookings/{id}.studentName` |
  | `studentEmail` | string | Yes | Attendee email regex, lowercase | `event_bookings/{id}.studentEmail` |
  | `studentPhone` | string | No | Australian phone format | `event_bookings/{id}.studentPhone` |
  | `sessionTime` | string | Yes | ISO 8601 UTC timestamp | `event_bookings/{id}.sessionTime` |
  | `calendarUrl` | string | No | Pre-generated Google Calendar direct link | `event_bookings/{id}.calendarUrl` |
  | `createdAt` | timestamp | Yes | `FieldValue.serverTimestamp()` | `event_bookings/{id}.createdAt` |

---

### 2.4 Conversational Telemetry & Chat Interaction (`/chat_interactions/{id}`)
* **Ingestion Channels**:
  * UI: `ChatInterface.tsx`
  * REST API Route: `POST /api/chat`
* **Data Classification**: Internal Operational Telemetry / Chat Auditing
* **Regulatory Tagging**: APP 11 (Audit trails, data retention)
* **Schema Definition**:
  | Field | Type | Required | Constraints & Validation | Target Firestore Path |
  | :--- | :--- | :--- | :--- | :--- |
  | `databaseCode` | string | Yes | Fixed value: `"rto-ai"` | `chat_interactions/{id}.databaseCode` |
  | `userMessage` | string | Yes | Sanitized input string, max 4000 chars | `userMessage` |
  | `assistantResponse` | string | Yes | Assistant markdown response | `assistantResponse` |
  | `toolsExecuted` | array | Yes | Array of `{ tool: string, args: object, result: object }` | `toolsExecuted` |
  | `uiWidgets` | array | No | UI Cards triggered (CourseCard, UnitCard, EventCard) | `uiWidgets` |
  | `applicantEmail` | string | No | Tracked applicant email if authenticated | `applicantEmail` |
  | `currentApplicationId`| string | No | Linked draft/submitted application | `currentApplicationId` |
  | `createdAt` | timestamp | Yes | `FieldValue.serverTimestamp()` | `createdAt` |

---

### 2.5 Activity & Security Logs (`/activity_logs/{id}`)
* **Ingestion Channels**:
  * Client: `lib/firebase/telemetry.ts` (`trackClientEvent`)
  * Server: `lib/firebase/admin.ts` (`recordActivity`)
* **Data Classification**: Operational Security & Telemetry
* **Schema Definition**:
  | Field | Type | Required | Constraints |
  | :--- | :--- | :--- | :--- |
  | `databaseCode` | string | Yes | Fixed value: `"rto-ai"` |
  | `systemId` | string | Yes | Fixed value: `"rto-ai"` |
  | `category` | enum | Yes | `AUTH` \| `APPLICATION` \| `CHAT` \| `TOKEN` \| `CALENDAR` \| `NAVIGATION` \| `ADMIN` |
  | `action` | string | Yes | Standard action verb (e.g. `GOOGLE_CLASSROOM_TEACHER_LOGIN`) |
  | `userId` | string | No | Google Workspace ID / Firebase UID |
  | `userEmail` | string | No | User email address |
  | `userRole` | string | No | Current session role |
  | `metadata` | object | No | Cleaned JSON key-value pairs (undefined stripped) |
  | `timestamp` | string | Yes | ISO 8601 UTC timestamp |
  | `createdAt` | timestamp | Yes | `FieldValue.serverTimestamp()` |

---

## 3. Storage & Security Invariants

1. **Firestore Security Rules**:
   * Domain rules allow authenticated staff matching `@aifoundation.net.au` and `@aifoundation.com.au` admin privileges.
   * `studentNumber` can never be written or modified by the student (`isModifyingStudentNumber()` returns false).
   * All queries filtering by organization MUST filter by `databaseCode == 'rto-ai'`.

2. **Stateless Edge Hosting**:
   * The hosting layer executes zero custom session authorization; identity is handled client-side via Firebase Auth (`GoogleAuthProvider`).
   * Google OAuth access tokens are stored strictly in `sessionStorage` and destroyed upon `signOut`.
