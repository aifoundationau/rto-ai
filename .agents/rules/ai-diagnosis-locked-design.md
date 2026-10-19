# AI Diagnosis & #ai-interactions Inviolable Rule

## Permanent Architectural Rule: Do Not Regress AI Diagnosis

The AI Diagnosis function in the Admin & Operations Panel is a permanent, locked architectural contract defined in [AI_DIAGNOSIS_LOCKED_SPECIFICATION.md](file:///e:/Antigravity%20Projects/rto-ai/AI_DIAGNOSIS_LOCKED_SPECIFICATION.md).

### Inviolable Constraints:
1. **Always Tag `#ai-interactions`**:
   - Every AI interaction logged through `saveAiInteraction` or processed in `/api/chat` MUST include the tag `#ai-interactions`. Do not remove, rename, or omit this tag under any circumstances.
2. **Always Track Latency & Perceived Accuracy**:
   - Every AI conversation turn must measure `latencyMs` and compute `perceivedAccuracy` (0–100%) grounded in curriculum tools and RAG sources.
3. **Preserve the Telemetry Sub-Navigation**:
   - In `components/admin/FirebaseTelemetryView.tsx`, the tab switcher between `[AI Diagnosis & #ai-interactions]` and `[Universal Event Stream]` must remain intact.
4. **Preserve Inspection & Override Controls**:
   - The deep-dive inspection modal and admin feedback capability in `components/admin/AiDiagnosisView.tsx` and `app/api/admin/ai-diagnosis/route.ts` must never be stripped.
   - Multilingual translation ("Translate Q&A to:") and Auto-Translate Draft toolbar must support all ASEAN member languages (Indonesian, Vietnamese, Thai, Filipino/Tagalog, Malay, Burmese, Khmer, Lao, Tetum, English) and regional partners (Chinese, Japanese, Korean).
5. **Non-Blocking Execution**:
   - Diagnostic persistence must run asynchronously and never block or fail student chat interactions.
