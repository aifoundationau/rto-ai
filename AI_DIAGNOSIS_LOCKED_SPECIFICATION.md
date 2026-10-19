# 🔒 LOCKED SPECIFICATION: AI DIAGNOSIS & INTERACTION TRACKING
## Institutional Observability, Latency & Accuracy Contract

> **STATUS: LOCKED & PERMANENT (DO NOT MODIFY OR REGRESS)**  
> **Effective Date:** 2026-10-18  
> **Scope:** Entire `rto-ai` Platform (`app/api/chat`, `lib/firebase/admin`, `components/admin/AiDiagnosisView`, `components/admin/FirebaseTelemetryView`, and `/api/admin/ai-diagnosis`).  
> **Authority:** Higher Education & RTO Governance Directive.

---

## 1. INVIOLABLE CORE DIRECTIVES

This design is permanently locked and must never be altered, removed, or simplified:

1. **Mandatory `#ai-interactions` Tagging**:
   - Every single interaction with the AI assistant MUST be tagged with `#ai-interactions`.
   - Contextual sub-tags (`#admissions`, `#syllabus`, `#course-inquiry`, `#rag-retrieval`, `#event-booking`, `#faq`) may supplement `#ai-interactions`, but `#ai-interactions` is **strictly non-negotiable and mandatory**.

2. **Mandatory End-to-End Latency Tracking (`latencyMs`)**:
   - Every AI query/response cycle must record high-precision round-trip execution latency in milliseconds (`Date.now() - startTime`).
   - Latency must be recorded in Firestore `ai_interactions` and displayed in the admin audit table with color-coded speed tiers (<500ms Ultra-Fast, 500–1200ms Optimal, 1200–2500ms Normal, >2500ms High Latency).

3. **Mandatory Hybrid Perceived Accuracy Score (`0–100%`)**:
   - Every interaction must compute an automated perceived accuracy score (`perceivedAccuracy`, 0 to 100) and confidence tier (`HIGH` ≥90%, `MEDIUM` 75–89%, `LOW` <75%).
   - Scoring criteria:
     - **Base score**: 50 points.
     - **Tool Resolution Grounding**: Up to +30 points for error-free tool execution (`lookup_course_details`, `lookup_unit_syllabus`, `query_multilingual_rag`, `register_prospective_event`).
     - **Curriculum / Regulatory Citation Grounding**: Up to +20 points for verified course codes (`BCS`, `MIT`, `DIT`), unit codes (`COMP1001`), ATAR cutoffs, or TEQSA/ASQA/CRICOS references.
     - **UI Widget Rendering**: +10 points for interactive rich cards.
     - **Resilient Fallback Penalty**: Capped at 65% (`LOW` confidence) if offline/resilient fallback is engaged.
   - An explanation string (`accuracyRationale`) must accompany every calculation.

4. **Mandatory Administrative Override & Verification**:
   - Authorized administrators in the Admin & Operations Panel have the permanent right to review any interaction, adjust the verified accuracy score (0–100%), and attach audit notes via the Inspection Modal and `PATCH /api/admin/ai-diagnosis`.

5. **Mandatory Placement in Admin & Operations Panel**:
   - The function is housed under the tab **AI Telemetry & Diagnosis** (marked with `#ai` badge) in `components/admin/AdminDashboardView.tsx`.
   - It maintains a dedicated tab switcher at the top of `components/admin/FirebaseTelemetryView.tsx`:
     - **`[AI Diagnosis & #ai-interactions]`**: The primary diagnostic dashboard (`AiDiagnosisView.tsx`).
     - **`[Universal Event Stream]`**: The general Firestore platform activity logs.

6. **Mandatory Non-Blocking Asynchronous Persistence**:
   - Saving AI interactions via `saveAiInteraction` must remain non-blocking. It must never throw or hold back the student's real-time chat response under the Absolute Reliability Directive.
   - In-memory runtime caching must always be available as a fallback so local development and unconfigured Firestore states never crash or produce blank diagnostic screens.

7. **Mandatory Multilingual Inspect, "Edit AI Response" & Direct RAG Sync**:
   - The Inspect modal MUST provide multilingual translation capabilities covering **all ASEAN languages** and regional dialogue partners (with EN English / Global as default and top of all lists):
     - 🌐 **EN English / Global** (`en`)
     - 🇰🇭 **Khmer** (`kh` / `km` - ភាសាខ្មែរ - Cambodia)
     - 🇮🇩 **Indonesian** (`id` - Bahasa Indonesia)
     - 🇻🇳 **Vietnamese** (`vi` - Tiếng Việt)
     - 🇹🇭 **Thai** (`th` - ภาษาไทย)
     - 🇵🇭 **Filipino / Tagalog** (`tl` - Wikang Filipino)
     - 🇲🇾 / 🇧🇳 **Malay** (`ms` - Bahasa Melayu)
     - 🇲🇲 **Burmese** (`my` - မြန်မာဘာသာ - Myanmar)
     - 🇱🇦 **Lao** (`lo` - ພາສາລາວ - Laos)
     - 🇹🇱 **Tetum** (`tet` - Lian Tetun - Timor-Leste)
     - 🇨🇳 **Chinese** (`zh` - 中文)
     - 🇯🇵 **Japanese** (`ja` - 日本語)
     - 🇰🇷 **Korean** (`ko` - 한국어)
   - Automatic script & keyword detection identifies student inquiry languages accurately.
   - Staff MUST have an **"Edit AI Response"** mode allowing authorized staff to edit the answer, auto-translate drafts into any ASEAN language via 1-click toolbar pills, and click **"Save & Ingest into RAG"**.
   - Saving an edited response MUST automatically update the interaction in Firestore, set perceived accuracy to **100%**, and ingest the verified Q&A into the Multilingual RAG vector index under `Verified Q&A Knowledge Bank`. Future student queries in any language will immediately retrieve and synthesize this authoritative staff-verified response.


---

## 2. DATA SCHEMA SPECIFICATION (`ai_interactions`)

The schema for every record in Firestore collection `ai_interactions` is locked:

```typescript
export interface AiInteractionRecord {
  id: string;                               // Unique deterministic or timestamped ID
  userQuestion: string;                     // Full verbatim user prompt
  aiAnswer: string;                         // Full verbatim AI agent response
  latencyMs: number;                        // Round-trip processing time in milliseconds
  perceivedAccuracy: number;                // 0 to 100 percentage score
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  accuracyRationale: string;                // Grounding explanation
  tags: string[];                           // MUST contain '#ai-interactions'
  toolsExecuted?: {                         // Tools called during generation
    toolName: string;
    args?: any;
    output?: any;
  }[];
  uiWidgets?: {                             // Interactive widgets generated
    type: string;
    data: any;
  }[];
  model: string;                            // e.g. 'gemini-3.8-flash'
  userEmail?: string;                       // Student / applicant email if authenticated
  applicantId?: string;                     // Associated application draft ID
  timestamp: string;                        // ISO 8601 string
  createdAt?: any;                          // Firestore serverTimestamp()
  adminFeedback?: {                         // Administrator verification record
    reviewed: boolean;
    verifiedAccuracy?: number;
    reviewerEmail?: string;
    reviewedAt?: string;
    notes?: string;
  };
}
```

---

## 3. FOUR LOCKED KPI METRIC CARDS

The AI Diagnosis dashboard must always present the 4 primary institutional observability KPIs:

| KPI Card | Description & Formula | Speed / Quality Thresholds |
| :--- | :--- | :--- |
| **Average Processing Latency** | Mean latency across all logged `#ai-interactions` + P95 Latency calculation | Green (<600ms) • Blue (600–1200ms) • Amber (1200–2500ms) • Red (>2500ms) |
| **Perceived AI Accuracy** | Arithmetic mean of perceived accuracy percentages + count of `HIGH` confidence queries | Target ≥ 95.0% across TEQSA/ASQA curriculum queries |
| **Total AI Interactions** | Absolute count of logged records carrying `#ai-interactions` | Real-time counter with auto-refresh |
| **Curriculum Grounding Ratio** | % of queries grounded in verified unit syllabuses, courses, or Multilingual RAG | Target ≥ 90.0% institutional citation rate |

---

## 4. UI/UX COMPONENTS & CONTROLS SPECIFICATION

The component [components/admin/AiDiagnosisView.tsx](file:///e:/Antigravity%20Projects/rto-ai/components/admin/AiDiagnosisView.tsx) contains:

1. **Live Diagnostic Probe**:
   - A dedicated button *"Run Live Diagnostic Probe"* that sends a test prompt directly to `/api/chat`, measures latency in real time, displays a live feedback banner, and refreshes the audit stream.
2. **Tag Quick-Filter Pills**:
   - `ALL`, `#ai-interactions`, `#syllabus`, `#admissions`, `#course-inquiry`, `#rag-retrieval`, `#event-booking`, `#faq`.
3. **Confidence Filter Dropdown**:
   - `All Confidence Levels`, `High (≥90%)`, `Medium (75–89%)`, `Low (<75%)`.
4. **Audit Data Table**:
   - Columns: `Time`, `User Question`, `AI Response Summary`, `Latency`, `Perceived Accuracy`, `Tags`, `Actions`.
   - Each row provides an **"Inspect"** button.
5. **Deep-Dive Inspection Modal**:
   - Automatic language detection badge (🇦🇺 English, 🇯🇵 Japanese, 🇨🇳 Chinese, 🇻🇳 Vietnamese, 🇹🇭 Thai, 🇮🇩 Indonesian, 🇰🇷 Korean).
   - Instant Multilingual Translation Switcher: Translate both user question and AI answer to any supported language with one click.
   - **"Edit AI Response" Mode**:
     - Rich editable textarea allowing staff to refine the answer.
     - Auto-translate draft button to assist staff with non-English student inquiries.
     - Target RAG language selector.
     - **"Save & Ingest into RAG"** button: Updates the interaction record and immediately registers the verified Q&A into the Multilingual Vector RAG store.
   - Latency, Accuracy, Confidence, and Engine metrics.
   - Grounding signal explanation.
   - Raw tools executed JSON viewer.
   - Admin Accuracy Verification & Override input form with instant Firestore save.


---

## 5. FILE INVENTORY & LOCK REGISTRY

The following files constitute the AI Diagnosis implementation and are locked:

- [AI_DIAGNOSIS_LOCKED_SPECIFICATION.md](file:///e:/Antigravity%20Projects/rto-ai/AI_DIAGNOSIS_LOCKED_SPECIFICATION.md) (This Contract)
- [docs/superpowers/specs/2026-10-18-ai-diagnosis-design.md](file:///e:/Antigravity%20Projects/rto-ai/docs/superpowers/specs/2026-10-18-ai-diagnosis-design.md) (Design Document)
- [docs/superpowers/plans/2026-10-18-ai-diagnosis-plan.md](file:///e:/Antigravity%20Projects/rto-ai/docs/superpowers/plans/2026-10-18-ai-diagnosis-plan.md) (Execution Plan)
- [app/api/chat/route.ts](file:///e:/Antigravity%20Projects/rto-ai/app/api/chat/route.ts) (Timing, Evaluation & Tagging)
- [app/api/admin/ai-diagnosis/route.ts](file:///e:/Antigravity%20Projects/rto-ai/app/api/admin/ai-diagnosis/route.ts) (Diagnostic KPI & Audit API)
- [lib/firebase/admin.ts](file:///e:/Antigravity%20Projects/rto-ai/lib/firebase/admin.ts) (Persistence & Aggregation Engine)
- [components/admin/AiDiagnosisView.tsx](file:///e:/Antigravity%20Projects/rto-ai/components/admin/AiDiagnosisView.tsx) (Diagnostic UI Dashboard)
- [components/admin/FirebaseTelemetryView.tsx](file:///e:/Antigravity%20Projects/rto-ai/components/admin/FirebaseTelemetryView.tsx) (Telemetry Tab Switcher)
- [components/admin/AdminDashboardView.tsx](file:///e:/Antigravity%20Projects/rto-ai/components/admin/AdminDashboardView.tsx) (Admin Navigation Entry)

> **Notice to all future AI agents & developers:**  
> Any modification that removes `#ai-interactions`, eliminates latency or accuracy tracking, deletes the Inspection Modal, or decouples the AI Diagnosis tab from the Admin & Operations Panel is a violation of this specification.
