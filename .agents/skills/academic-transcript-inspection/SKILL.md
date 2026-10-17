---
name: academic-transcript-inspection
description: "Forensic evaluation and academic credential audit guide for university transcripts, degree testamurs, and certificates. Covers institutional accreditation, registrar security seals, grading scales, and brief description standards."
---

# University Transcript & Academic Credential Inspection Guide

This skill guides the AI agent on how to forensically inspect academic qualifications, university transcripts, diplomas, and degree testamurs, evaluate visual authenticity, and produce standardized brief descriptions for admissions staff.

---

## 1. Supported Academic Credential Classes

### A. Official University Academic Transcripts
1. **Institutional Letterhead & Crest**:
   - High-resolution university crest, motto, and official faculty/registrar banner.
2. **Office of the Registrar Authorization**:
   - Signature or digital cryptoseal of the Academic Registrar or University Secretary.
3. **Student Profile Data**:
   - Student ID, Full Legal Name, Degree Program title, Commencement Date, and Program Major.
4. **Semester Progression & Course Codes**:
   - Chronological breakdown by academic year and study period (e.g., *Semester 1, 2023*, *Term 3, 2024*).
   - Standard departmental course codes (e.g., *COMP1001*, *MATH1050*, *ENGG2000*), unit credit point values (e.g., 6.0 units), and grade letters/percentages.
5. **Grading Legend & Scale**:
   - Printed grade key on reverse or footer explaining mark boundaries:
     - HD (High Distinction): 85–100%
     - D (Distinction): 75–84%
     - CR (Credit): 65–74%
     - P (Pass): 50–64%
     - F (Fail): <50%
     - GPA (Grade Point Average) or WAM (Weighted Average Mark) calculation.
6. **Conferral & Completion Endorsement**:
   - Formal statement confirming: *"All requirements for the award of Bachelor of Computer Science were completed on 15 November 2024. Degree conferred at ceremony on 12 December 2024."*

### B. Degree Testamurs & Diplomas
1. **Parchment Framing & Formal Wording**:
   - Formal conferral text: *"By the authority of the Council and Senate of the University..."*
2. **Signatory Blocks**:
   - Signatures of the Chancellor, Vice-Chancellor, and Dean/Registrar.
3. **Institutional Seal**:
   - Blind embossed wax/stamp seal, gold foil wafer, or thermal micro-print stamp.
4. **Degree Nomenclature**:
   - Latin or English title (e.g., *Baccalaureus Scientiae*, *Bachelor of Science in Information Technology*), including Honours classification (First Class Honours, Class II Division I).

---

## 2. Fraud & Diploma Mill Red Flags

When reviewing academic credential images in memory, the AI agent must flag:

| Red Flag | Description & Indicator | Assessment |
| :--- | :--- | :--- |
| **Diploma Mill Naming** | Using variations of renowned institutions (e.g., *"University of Sydney Global Online"* instead of *"The University of Sydney"*). | Suspect |
| **Font Mismatches** | Student's name or grade points appear in an Arial or Times font that clashes with the surrounding calligraphy or gothic script. | Suspect |
| **Math Inconsistencies** | Cumulative WAM or GPA does not mathematically tally with individual course marks. | Suspect / Irregular |
| **Missing Security Borders** | Plain unadorned white paper lacking security borders, watermarks, micro-print, or registrar stamps. | Requires Review |
| **Pixelation around Grades** | Low-quality compression blocks or halos solely around HD/Distinction marks or ATAR scores. | Suspect |

---

## 3. Mandatory Brief Description Standard

The AI agent must **always generate a concise, factual 1–2 sentence Brief Description** for the Admissions & Operations Panel.

### Brief Description Template
`[Official Document Type] from [Institution Name] ([Country]) awarded to [Student Name]. Confers [Degree Name with Major/Honours] with [Cumulative WAM/GPA or completion note], verified with [Seal/Registrar details].`

### Approved Examples
- *"Official Academic Transcript from University of Sydney (Australia) for Emma Watson. Confirms Bachelor of Computer Science with 144 credits completed at High Distinction (WAM 86.2) with Registrar digital seal."*
- *"Higher School Certificate (HSC) Record of Achievement issued by NSW Education Standards Authority (NESA) for Alex Taylor. Confirms ATAR score of 94.20 with official state crest."*
- *"Bachelor Degree Official Testamur from University of Melbourne (Australia) conferring Bachelor of Science (Computing) upon Marcus Vance with Senate seal and Chancellor signatures."*
