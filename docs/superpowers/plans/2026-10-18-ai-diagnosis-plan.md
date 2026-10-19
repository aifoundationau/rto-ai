# Implementation Plan: AI Diagnosis & Interaction Tracking

- **Spec**: [docs/superpowers/specs/2026-10-18-ai-diagnosis-design.md](file:///e:/Antigravity%20Projects/rto-ai/docs/superpowers/specs/2026-10-18-ai-diagnosis-design.md)
- **Date**: 2026-10-18
- **Goal**: Implement complete AI Diagnosis system with latency measurement, hybrid perceived accuracy scoring, `#ai-interactions` tagging, Firestore persistence, diagnostic API, and an integrated Admin Telemetry tab view.

---

## Task Breakdown

### Task 1: Firestore Admin SDK Functions & Type Definitions
- **File**: `lib/firebase/admin.ts`
- **Actions**:
  - Define `AiInteractionRecord` interface.
  - Implement `saveAiInteraction(record)` with Firestore collection `ai_interactions` and in-memory buffer fallback.
  - Implement `getAiInteractions(options: { tag?: string; confidence?: string; search?: string; limit?: number })`.
  - Implement `updateAiInteractionReview(id, reviewData)`.
  - Dual-post a summary telemetry event to `recordActivity` with category `CHAT`, action `AI_INTERACTION_DIAGNOSED`, and tag `#ai-interactions`.
- **Verification**: Type-check and verify in-memory & Firestore paths.

### Task 2: Chat API Route Instrumentation (`/api/chat`)
- **File**: `app/api/chat/route.ts`
- **Actions**:
  - High-precision timestamp start before invoking `processAgentConversation`.
  - Measure `latencyMs = Date.now() - startTime`.
  - Implement `calculatePerceivedAccuracy(userMsg, result)`:
    - Tool execution success (+30)
    - Source/Unit/Course/FAQ citation grounding (+20)
    - Fallback penalty (-30 if degraded fallback triggered)
    - Base confidence (50)
    - Map score to `HIGH` (≥90%), `MEDIUM` (75–89%), `LOW` (<75%).
  - Auto-generate tags: `['#ai-interactions', ...contextTags]`.
  - Call `saveAiInteraction` asynchronously (non-blocking).
- **Verification**: Test `/api/chat` returns valid response while persisting diagnostic payload with `#ai-interactions` and `latencyMs`.

### Task 3: Backend Diagnostic API Endpoint
- **File**: `app/api/admin/ai-diagnosis/route.ts`
- **Actions**:
  - `GET`: Return aggregate metrics (avg latency, p95 latency, avg accuracy, confidence counts, grounded ratio) and filtered interaction records.
  - `PATCH`: Allow admin to update `verifiedAccuracy`, `reviewerEmail`, and `notes`.
  - Non-blocking error handling and in-memory fallback.
- **Verification**: Query `/api/admin/ai-diagnosis` and verify JSON payload structure.

### Task 4: AI Diagnosis Frontend Component
- **File**: `components/admin/AiDiagnosisView.tsx`
- **Actions**:
  - Hero banner with AI health status and model info (`gemini-3.8-flash`).
  - 4 KPI Stat Cards: Average Latency (ms), Average Perceived Accuracy (%), Total `#ai-interactions`, and Grounded Tool Ratio.
  - Interactive Filter Bar: Tag pills (`#ai-interactions`, `#syllabus`, `#admissions`, etc.), Confidence filter, and search input.
  - Live Diagnostic Probe button: Sends a real-time prompt to `/api/chat` and immediately measures live latency, accuracy, and tool execution.
  - Real-time Audit Table: Timestamp, Question, Answer preview, Latency badge, Accuracy badge, Tags, and Inspect button.
  - Deep-dive Inspection Modal: Markdown view of question and answer, latency breakdown, tool calls, raw metadata, and admin accuracy verification form.
- **Verification**: Component compiles cleanly with responsive styling and accessibility.

### Task 5: Telemetry Tab Switcher Integration
- **File**: `components/admin/FirebaseTelemetryView.tsx`
- **Actions**:
  - Add sub-view switcher at top of Telemetry view:
    - `Universal Event Stream` (existing activity logs)
    - `AI Diagnosis & #ai-interactions` (renders `AiDiagnosisView`)
  - Show active interaction badge counter.
- **Verification**: Toggle smoothly between event stream and AI diagnosis view in admin dashboard.

### Task 6: Build & Runtime Verification
- **Actions**:
  - Run `npx tsc --noEmit` or `npm run build` to ensure 0 TypeScript or build regressions.
  - Run diagnostic test ping and confirm `#ai-interactions` appear with latency and perceived accuracy.
