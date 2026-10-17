---
name: personal-id-inspection
description: "Forensic inspection guide and visual authenticity criteria for personal identification documents (passports, driver licences, national ID cards). Includes security features, anti-fraud checks, and brief description standards for admissions."
---

# Personal Identification Document Inspection & Authenticity Guide

This skill guides the AI agent on how to forensically inspect personal identification documents submitted by prospective students, evaluate visual authenticity, and produce standardized brief descriptions for admissions staff.

---

## 1. Supported Document Classes

### A. International Passports (ICAO Doc 9303 Compliant)
1. **Machine Readable Zone (MRZ)**:
   - Located on the lower portion of the biographical data page (2 lines of 44 characters for Type 3 passports).
   - Standard monospace OCR-B font without serifs.
   - Contains country code, passport number, nationality, date of birth (`YYMMDD`), sex, expiration date (`YYMMDD`), personal number, and modulo-7/modulo-10 check digits.
   - Format: `P<AUS<<SURNAME<<GIVEN<NAMES<<<<<<<<<<<<<<<<<<`
2. **Biometric e-Passport Symbol**:
   - Rectangular gold/metallic camera-style chip icon on the cover or data page.
3. **Ghost Image / Secondary Portrait**:
   - Smaller, semi-transparent duplicate of the applicant's photo printed near the center-right.
4. **Guilloche Security Patterns**:
   - Continuous, interlocking curved line patterns across the entire background that cannot be replicated by standard inkjet printers.
5. **Holographic / Kinegram Elements**:
   - National emblems (e.g., Australian coat of arms, kangaroo, state floral emblems) overlaid across the portrait photo and data text.
6. **Laser Perforation & Microprinting**:
   - Passport number perforated through page edges or microprinted along baseline data fields.

### B. State Driver Licences & Photo Cards
1. **Header & Issuing Authority**:
   - Official government state department branding (e.g., *Transport for NSW*, *VicRoads*, *Department of Transport QLD*, *California DMV*).
2. **Security Laminate & Optically Variable Ink (OVI)**:
   - State emblem changes color or reflects light under angles.
3. **2D Barcode (PDF417)**:
   - High-density 2D barcode on the reverse containing encoded biographical data.
4. **Class, Licence Number, & Conditions**:
   - Clear distinction between full licences, provisional (P1/P2), and learner permits.
5. **Portrait Integration**:
   - Portrait photo must have crisp edges without blur or artificial halos, with date of birth or licence number laser-engraved across the lower portrait edge.

---

## 2. Fraud & Tampering Red Flags

When inspecting document images in memory, the AI agent must flag the following anomalies:

| Anomaly Type | Visual Indicator | Risk Level |
| :--- | :--- | :--- |
| **Font Inconsistency** | Name or DOB uses a different font weight, kerning, or color tone than surrounding label text. | High (Suspect) |
| **Compression Splicing** | JPEG compression artifacts or pixel blocks appear clustered solely around the name, photo, or expiry date. | High (Suspect) |
| **Baselines & Misalignment** | Characters in the name or ID number drift up or down from the printed baseline. | High (Suspect) |
| **Digital Insert Halos** | White or blurred outlines around the applicant's head indicating a cut-and-paste Photoshop operation. | High (Suspect) |
| **Mismatched Lighting** | Facial shadows on the portrait do not match the flat, diffused flash lighting mandated by passport standards. | Medium (Review) |
| **Blur / Extreme Glare** | Critical text or security patterns obscured by camera flash reflections or motion blur. | Low/Medium (Review) |

---

## 3. Mandatory Brief Description Standard

The AI agent must **always generate a concise, factual 1–2 sentence Brief Description** for the Admissions & Operations Panel.

### Brief Description Template
`[Document Class & Series] belonging to [Identified Full Name], issued by [Issuing Authority] ([Country]). [Validity status / Expiration date] with [Security feature confirmation].`

### Approved Examples
- *"Australian Passport (Series R) for Emma Watson, issued by the Australian Passport Office (DFAT). Valid through 2034 with verified biometric MRZ and holographic seal."*
- *"State Driver Licence (Class C - Car) for Alex Taylor, issued by Transport for NSW (Australia). Valid through 2028 with authentic security guilloche background."*
- *"Republic of India Passport for Rajesh Kumar, issued by the Ministry of External Affairs at Bangalore. Machine-readable zone and photo alignment confirmed legitimate."*
