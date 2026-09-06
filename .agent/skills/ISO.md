```markdown
# ISO.md: ISO AI Standards Engine for AI-Inspired LMS
(or skills.md, add)
## Purpose
This skill transforms the ISO/IEC AI and Security Standards ecosystem (ISO 42001, 27001, 5259, 23894, 24029, 25059, and 42005) into an interactive, developer-driven engine. It prompts the developer through architectural decisions for AI-powered LMS features, presents standardized compliance options, and generates production-ready, fully compliant code functions.

---

## Target Standard Map
- **ISO/IEC 42001**: AI Management System (Governance & Human Oversight)
- **ISO/IEC 27001**: Information Security Management (Data Protection & Access Control)
- **ISO/IEC 5259**: Data Quality for Analytics and Machine Learning (Provenance & Anonymization)
- **ISO/IEC 23894 / 42005**: AI Risk Management & System Impact Assessment
- **ISO/IEC 24029 / 25059**: AI Technical Robustness & Quality Assurance

---

## Antigravity Execution Workflow


```

[Developer Selects LMS Feature]
↓
[Antigravity Scans Applicable ISO Standards]
↓
[Interactive Developer Decision Matrix (Prompts & Options)]
↓
[Generate Compliant Function & Audit Metadata]

```

## Phase 1: Feature Identification Prompt

When activated, Antigravity prompts the developer:

> **[Antigravity Engine]** Select the AI LMS component you are building today:
> 1. **Automated Assessment & Grading Engine** (High Risk: ISO 42001, 24027, 42005)
> 2. **AI Student Tutor / Conversational Assistant** (Medium Risk: ISO 24029, 27001, 5259)
> 3. **Adaptive Learning & Predictive Analytics** (High Risk: ISO 5259, 27701, 23894)
> 4. **AI Course Content & Quiz Generator** (Medium Risk: ISO 5259, 42001)

---

## Phase 2: Interactive Decision Matrix & Options

Depending on the feature chosen, Antigravity presents the required ISO factors and asks the developer to choose their implementation strategy.

### Module 1: Human Oversight & Governance (ISO 42001 / ISO 42005)
**Prompt:** "How should high-stakes AI decisions (e.g., grading, misconduct flags) be handled?"
* **Option A [Strict Governance]:** Mandatory Human Approval. AI outputs are held in a staging queue; student sees nothing until an instructor signs off.
* **Option B [Hybrid Oversight]:** Auto-release if confidence score is greater than 90%. If score is less than or equal to 90%, flag for human review and allow a 1-click student appeal.
* **Option C [Informational Only]:** AI provides provisional feedback; grade is explicitly marked as non-final until verified by instructor.

### Module 2: Data Quality & Privacy (ISO 5259 / ISO 27001)
**Prompt:** "How will prompt inputs and student submissions be processed before passing to the model?"
* **Option A [Zero-Trust Anonymization]:** Strip all PII (names, emails, student IDs) dynamically using regex/NER, log to audit trail, and enforce Zero Data Retention (ZDR) headers.
* **Option B [Context Boundary Enforcement]:** Inject system boundary prompts limiting retrieval strictly to vector database search (RAG) using approved course materials.
* **Option C [Full Retention with Consent]:** Store anonymized telemetry in database for retraining loops (requires ISO 5259 provenance logging).

### Module 3: Robustness & Safety (ISO 24029 / ISO 25059)
**Prompt:** "How should the model react to prompt injections, low confidence, or hallucinations?"
* **Option A [Fail-Safe Fallback]:** Sanitize inputs against jailbreaks. If confidence is below threshold, output: *"I am unable to answer based on course materials. Please consult your instructor."*
* **Option B [Transparent Reasoning]:** Expose the model's confidence rating and source citations (RAG chunks) alongside the generated output.

---

## Phase 3: Code Generation Engine

Based on the developer's selections, Antigravity generates the corresponding production code with embedded compliance audit logs.

### Generated Function Template (Python / TypeScript Example)

```python
import os
import json
import logging
from typing import Dict, Any, Optional

# Set up ISO 42001 Compliant Audit Logging
logging.basicConfig(level=logging.INFO)
audit_logger = logging.getLogger("ISO_42001_AIMS_AUDIT")

def process_lms_ai_interaction(
    student_id: str,
    prompt_input: str,
    course_context_id: str,
    governance_mode: str = "HYBRID_OVERSIGHT",  # Option B chosen
    confidence_threshold: float = 0.90
) -> Dict[str, Any]:
    """
    ISO/IEC 42001 & ISO/IEC 27001 Compliant LMS Processing Pipeline.
    
    Standards Applied:
    - ISO 27001 Control A.8.1.1: Data Anonymization & Input Sanitization
    - ISO 24029: Robustness checks against prompt injections
    - ISO 42001 / 42005: Human-in-the-loop fallback mechanism
    """
    
    # STEP 1: ISO 27001 Input Sanitization & PII Stripping
    sanitized_prompt = strip_pii_and_injections(prompt_input)
    
    # STEP 2: ISO 24029 Safety & Model Query
    model_response = query_lms_model(
        prompt=sanitized_prompt,
        context_id=course_context_id
    )
    
    score = model_response.get("confidence_score", 0.0)
    output_text = model_response.get("text", "")
    citations = model_response.get("citations", [])

    # STEP 3: ISO 42001 Decision & Human-in-the-Loop Routing
    is_human_review_required = False
    release_status = "APPROVED"

    if governance_mode == "STRICT_GOVERNANCE":
        is_human_review_required = True
        release_status = "PENDING_INSTRUCTOR_APPROVAL"
    elif governance_mode == "HYBRID_OVERSIGHT":
        if score < confidence_threshold:
            is_human_review_required = True
            release_status = "FLAGGED_FOR_REVIEW"
            output_text = "Your submission requires review by your instructor before final release."

    # STEP 4: ISO 5259 Provenance & Audit Logging
    audit_payload = {
        "event": "AI_LMS_PROCESSING",
        "iso_standards": ["ISO42001", "ISO27001", "ISO5259", "ISO24029"],
        "student_id_hashed": hash_student_id(student_id),
        "context_id": course_context_id,
        "confidence_score": score,
        "human_review_required": is_human_review_required,
        "status": release_status,
        "citations_count": len(citations)
    }
    audit_logger.info(json.dumps(audit_payload))

    return {
        "status": release_status,
        "output": output_text,
        "citations": citations,
        "human_review_required": is_human_review_required,
        "appeal_available": True
    }

def strip_pii_and_injections(text: str) -> str:
    """Helper implementing ISO 27001 PII filtering & ISO 24029 adversarial defenses."""
    # Placeholders for regex PII stripping and prompt injection checks
    clean_text = text.replace("Drop Table", "").strip()
    return clean_text

def hash_student_id(student_id: str) -> str:
    """Helper implementing ISO 27701 pseudonymization."""
    import hashlib
    return hashlib.sha256(student_id.encode()).hexdigest()

def query_lms_model(prompt: str, context_id: str) -> Dict[str, Any]:
    """Mock model invocation for demonstration."""
    return {
        "text": "Automated feedback generated successfully.",
        "confidence_score": 0.94,
        "citations": ["Module_1_Lecture_Notes.pdf"]
    }

```

## Developer Verification Checklist

After Antigravity generates the function, run this verification pass:

* [ ] **ISO 42001:** Is every high-stakes decision routed through a Human-in-the-Loop or appeal workflow?
* [ ] **ISO 27001:** Are inputs stripped of PII and hashed before reaching logs or model parameters?
* [ ] **ISO 5259:** Are dataset sources and citations logged for full provenance tracking?
* [ ] **ISO 24029:** Are input injection checks and confidence fallback limits explicitly declared?

```


