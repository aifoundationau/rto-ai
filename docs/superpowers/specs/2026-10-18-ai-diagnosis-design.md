# Design Specification: AI Diagnosis & Interaction Tracking

- **Feature**: AI Diagnosis Function in Admin & Operations Panel
- **Status**: Approved
- **Date**: 2026-10-18
- **Scope**: Chat API instrumentation, latency & perceived accuracy tracking, `#ai-interactions` tagging, Firestore persistence, diagnostic API, and Admin Telemetry view.

---

## 1. Executive Summary & Goals

The **AI Diagnosis Function** provides institutional visibility and observability into all interactions with the EduPulse AI assistant. It tracks:
1. Every question asked by students and visitors.
2. Every response returned by the AI agent.
3. Precise end-to-end processing latency (in milliseconds).
4. AI's perceived accuracy score (0–100%) and confidence level (`HIGH`, `MEDIUM`, `LOW`) grounded in factual course/syllabus/RAG data.
5. Tagging of all AI interactions with `#ai-interactions` alongside contextual domain tags.
6. Admin verification and audit override capabilities.
7. A unified experience under **AI & Platform Telemetry** in the Admin & Operations Panel, featuring a tab switcher between the Universal Event Stream and the AI Diagnosis dashboard.

---

## 2. System Architecture & Data Flow

```
[Student / User Chat Client]
           │
           ▼
[POST /api/chat]
    │  ├─ Start timer: Date.now()
    │  ├─ Execute: processAgentConversation (Gemini 3.8 Flash / Semantic Engine)
    │  ├─ Compute latencyMs = Date.now() - startTime
    │  ├─ Compute perceivedAccuracy (0–100%) based on grounding signals
    │  ├─ Assign tags: ['#ai-interactions', ...contextTags]
    │  └─ Async save: saveAiInteraction(...) (non-blocking)
           │
           ├───────────────────────────────┐
           ▼                               ▼
[Firestore: ai_interactions]   [Firestore: activity_logs]
           ▲
           │
[GET /api/admin/ai-diagnosis]
           │
           ▼
[Admin & Operations Panel: AI & Platform Telemetry]
    ├── [Universal Event Stream] (Platform logs)
    └── [AI Diagnosis & #ai-interactions] (KPIs, Latency charts, Audit table, Inspection modal)
```

---

## 3. Data Schema & Contracts

### 3.1 Firestore Collection: `ai_interactions`
Stored under database code `rto-ai` (or configured database ID):

```typescript
export interface AiInteractionRecord {
  id: string;
  userQuestion: string;
  aiAnswer: string;
  latencyMs: number;
  perceivedAccuracy: number;             // 0 to 100
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  accuracyRationale: string;
  tags: string[];                        // Must include '#ai-interactions'
  toolsExecuted: {
    toolName: string;
    args: Record<string, any>;
    output: Record<string, any>;
  }[];
  uiWidgets: {
    type: string;
    data: any;
  }[];
  model: string;                         // 'gemini-3.8-flash' | 'local-semantic-engine'
  userEmail?: string;
  applicantId?: string;
  timestamp: string;                     // ISO string
  createdAt: any;                        // Firestore FieldValue.serverTimestamp()
  adminFeedback?: {
    reviewed: boolean;
    verifiedAccuracy?: number;
    reviewerEmail?: string;
    reviewedAt?: string;
    notes?: string;
  };
}
```

### 3.2 Perceived Accuracy Calculation (Hybrid Grounding Model)
The automated score is computed on a 0–100 scale:
- **Baseline**: 50 points (valid conversation turn).
- **Tool Resolution Grounding (+30 points)**:
  - Tool executed successfully with structured output (e.g., `lookup_course_details`, `query_multilingual_rag`, `lookup_unit_syllabus`): +30.
  - Tool threw error or warned: -15.
- **Data Grounding & Citation (+20 points)**:
  - Response contains verified course codes (e.g., `BCS`, `MIT`, `DIT`), unit codes (e.g., `COMP1001`), or official fee/event citations: +20.
  - Response matches verified FAQ answer bank: +20.
- **Fallback / Resilient Degradation Penalty (-30 points)**:
  - If offline/resilient fallback was triggered due to network timeout: capped at 65%.
- **Confidence Levels**:
  - `HIGH`: Score ≥ 90%
  - `MEDIUM`: Score 75% – 89%
  - `LOW`: Score < 75%

### 3.3 Tagging Rules
Every interaction receives:
- Mandatory tag: `#ai-interactions`
- Contextual tags (auto-detected):
  - `#admissions` (application form updates, eligibility)
  - `#syllabus` (unit inquiry, prerequisite checks)
  - `#course-inquiry` (degree programs, fees, career pathways)
  - `#rag-retrieval` (TEQSA/ASQA/CRICOS knowledge base search)
  - `#event-booking` (open days, consultation RSVPs)
  - `#faq` (general questions)

---

## 4. Backend API Endpoints

### 4.1 `GET /api/admin/ai-diagnosis`
- **Query Params**:
  - `tag` (optional, default: `#ai-interactions`)
  - `confidence` (optional: `all`, `high`, `medium`, `low`)
  - `search` (optional text query)
  - `limit` (optional, default: 50)
- **Response**:
  ```json
  {
    "success": true,
    "metrics": {
      "totalInteractions": 124,
      "avgLatencyMs": 520,
      "p95LatencyMs": 1420,
      "avgPerceivedAccuracy": 94.2,
      "highConfidenceCount": 110,
      "mediumConfidenceCount": 12,
      "lowConfidenceCount": 2,
      "groundedToolsRatio": 91.5
    },
    "interactions": [ ...AiInteractionRecord[] ]
  }
  ```

### 4.2 `PATCH /api/admin/ai-diagnosis`
- **Body**: `{ id: string, verifiedAccuracy: number, notes?: string, reviewerEmail?: string }`
- **Response**: `{ success: true, updated: AiInteractionRecord }`

---

## 5. User Interface Specifications

### 5.1 Tab Switcher in AI & Platform Telemetry
In `components/admin/FirebaseTelemetryView.tsx`:
- Header sub-nav switcher:
  - Button 1: **Universal Event Stream** (`activity_logs`)
  - Button 2: **AI Diagnosis & #ai-interactions** (Diagnostic dashboard)

### 5.2 `AiDiagnosisView` Component Layout
1. **Header KPI Summary**:
   - Total `#ai-interactions`
   - Avg Latency (with speed indicator badge: <800ms fast / green, 800-2000ms normal / amber, >2000ms slow / red)
   - Avg Perceived Accuracy (e.g. 96.2%)
   - High Confidence Ratio (e.g. 92%)
2. **Filter & Search Bar**:
   - Tag filter pills: `#ai-interactions`, `#syllabus`, `#admissions`, `#course-inquiry`, `#rag-retrieval`
   - Confidence dropdown (`All`, `High ≥90%`, `Medium 75–89%`, `Low <75%`)
   - Text search input (searches question and answer)
   - "Run Live Diagnostic Probe" button (sends a test prompt and live-measures latency & accuracy)
3. **Audit Data Table**:
   - Timestamp (formatted with local time)
   - User Question (truncated with expand tooltip)
   - AI Answer (rendered markdown preview)
   - Latency (color-coded badge, e.g. `420 ms`)
   - Perceived Accuracy (badge with confidence ring, e.g. `98% HIGH`)
   - Tags (pills, with `#ai-interactions` highlighted)
   - Action: "Inspect" button opening full inspection drawer
4. **Inspection Drawer / Modal**:
   - Complete multi-turn context
   - Accuracy score breakdown & rationale
   - Tools executed & payload inspect
   - Admin override form: Adjust verified accuracy & save review notes.

---

## 6. Resilience & Non-Blocking Design

In line with the Absolute Reliability Directive:
- AI interaction persistence in `/api/chat` must run asynchronously and never block or throw exceptions that break student chat responses.
- If Firestore is offline or unconfigured, an in-memory runtime buffer provides diagnosis data for local development without crashes.
