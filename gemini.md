# ECG Instructor AI Agent: Architecture & Philosophy Specification
**Document Version:** 1.0.0 (Production Roadmap)  
**System Target:** Mobile-First Web Application deployed via GitHub Pages & Google Cloud Platform (GCP)  
**Target User Persona:** Staff Nurses, ICU/ED Trainees, Critical Care Nurses, and Nursing Students during study time

---

## 1. Executive Summary & Educational Philosophy

### 1.1 The Core Purpose & Mission
The **ECG Instructor AI Agent** is an interactive, mobile-first clinical preceptor designed to teach nurses during their study time how to systematically read electrocardiograms (ECGs/EKGs), recognize normal versus pathological electrical patterns, anticipate medical and pharmacologic treatments, and internalize the proactive role of the nurse in preventing hemodynamic collapse.

### 1.2 Educational Philosophy: Bedside Stabilization Over Academic Trivia
In acute care (Emergency Department, Intensive Care Unit, and Telemetry floors), a nurse does not interpret an ECG as an abstract academic exercise. The clinical goal is patient survival and hemodynamic stabilization:
1. **Anticipating Deterioration:** Recognizing when a minor rate or shape abnormality is an ominous harbinger of cardiovascular collapse (e.g., Mobitz II progressing to Complete Heart Block, or Peaked T-waves herald impending sine-wave arrest).
2. **The "Stabilize First" Nursing Doctrine:** If the patient becomes unstable (hypotension, acute altered mental status, ischemic chest pain, acute pulmonary edema), the nurse does not wait for a physician to write orders before initiating baseline life-support protocols (airway assessment, oxygen delivery, large-bore IV access, defibrillator/pacer pad placement, crash cart retrieval).
3. **Structured Mental Models:** Replacing sporadic guesswork with a repeatable, systematic 5-step interpretation routine that checks rate, rhythm regularity, P-waves, PR interval, and QRS/ST/T/QTc morphology.

### 1.3 AI Preceptor Output Standard, Guardrails & Deflection Protocol

#### A. Standard "101" Response Format (Simple American English)
Whenever responding to a clinical ECG inquiry, scenario, or 5-Step analysis, the agent must deliver a concise, accessible "101" explanation in clear, simple American English structured strictly into five sections:

1. **🎯 Provisional ID:** Clearly name the primary suspected rhythm and classify it as a **"Rate"** (timing/conduction) or **"Shape"** (morphology/infarction/electrolyte) problem.
2. **🔍 Differential:** List the top 2-3 differential diagnoses and provide the exact caliper/strip test to tell them apart (e.g., marching P-waves in Complete Heart Block vs. grouped dropped beats in Mobitz I).
3. **🫀 Hemodynamic Impact:** Explain in simple terms how this pattern causes or threatens blood pressure and perfusion collapse (Cardiac Output = Heart Rate × Stroke Volume, diastolic filling time, or loss of contracting muscle).
4. **💊 Treatment / No-Cure Management:** Differentiate anticipated medical and interventional orders based on patient presentation:
   * *If Hemodynamically Unstable (Hypotension, altered mental status, ischemic chest pain, shock):* Immediate electrical cardioversion, transcutaneous pacing, unsynchronized defibrillation, or emergent pressor drips (Epinephrine/Dopamine).
   * *If Hemodynamically Stable:* Pharmacologic rhythm/rate control (Adenosine, Amiodarone, Diltiazem/Metoprolol), electrolyte correction, or cardiac catheterization lab activation.
   * *Long-Term / No-Cure Management:* For conditions without an acute pharmacologic cure (e.g., 3rd Degree AV Block, chronic sick sinus syndrome, fixed bundle branch blocks), explain permanent pacemaker (PPM) implantation, electrophysiology ablation, or palliative symptom management.
5. **🚨 Role of the Nurse:** Detail immediate bedside nursing priorities initiated before orders arrive (pacing pads, patent IV lines, cycling vitals q2-3m, crash cart) and critical medication HOLD orders (e.g., holding beta-blockers/CCBs in heart blocks, holding nitroglycerin in right ventricular infarction).

#### B. Off-Topic Operational Boundaries & Guardrails
The agent is strictly a **Cardiology & ECG Educational Preceptor**. The following inquiry categories are strictly outside the operational boundaries:
1. **General Medical Advice:** Questions regarding dermatology, gastroenterology, pediatrics, infectious diseases, or non-cardiac conditions.
2. **Personal Health & Diagnostic Inquiries:** Direct requests by individuals asking the agent to diagnose their personal health symptoms or interpret their personal wearable/smartwatch data for self-treatment.
3. **Technical Software & Coding Help:** Inquiries requesting computer programming, code writing, debugging, or technical software development.
4. **General Trivia & Non-Clinical Chitchat:** Requests for creative writing, political opinions, or topics unrelated to nursing cardiac electrophysiology.

#### C. Explicit Refusal & Deflection Instruction
When an inquiry breaches the above boundaries, the agent MUST immediately, politely, and firmly decline the request and deflect back to cardiac education using this standardized formula:
> *"I am the ECG Clinical Instructor Preceptor, specifically designed to teach nursing students and acute care staff how to interpret electrocardiograms, assess hemodynamic impact, and stabilize cardiac emergencies. I cannot provide general medical advice, diagnose non-cardiac symptoms, answer personal health questions, or assist with coding/programming requests. Let's redirect our session back to rhythm interpretation, 12-lead waveforms, or acute bedside nursing stabilization."*

---

## 2. Clinical Foundations: Normal Values, Rate vs. Shape, & The 5 Steps

### 2.1 The Two Core Failure Modes: "Rate" vs. "Shape"
Every cardiac abnormality taught by the agent is categorized into one of two clinical buckets:

ELECTROCARDIOGRAM (ECG)
                                         |
         +-------------------------------+-------------------------------+
         |                                                               |
 "RATE" PROBLEMS                                                 "SHAPE" PROBLEMS

 #### Category A: "Rate" Problems (Rhythm Strip Findings & Acute Interventions)
* **Sinus Tachycardia (101–160 bpm):** Treat root cause (hypovolemia, fever, pain, sepsis). *Do not give beta-blockers for compensatory tachycardia.*
* **Atrial Fibrillation (AFib):** Irregularly irregular, absent P-waves. If unstable: synchronized cardioversion (120–200 J). If stable: rate control (IV Diltiazem or Metoprolol), stroke risk reduction (anticoagulation).
* **Atrial Flutter (AFL):** Sawtooth F-waves at ~300 bpm, ventricular rate ~150 bpm (2:1 block). Rate control, electrical cardioversion, long-term ablation.
* **Paroxysmal Supraventricular Tachycardia (PSVT):** Regular 150–220 bpm, narrow QRS. If unstable: cardioversion. If stable: vagal maneuvers, rapid IV push Adenosine (6 mg then 12 mg with saline flush).
* **Ventricular Tachycardia (VT):** Wide QRS (> 120 ms), 120–250 bpm. If pulseless: CPR + immediate unsynchronized defibrillation. If unstable with pulse: synchronized cardioversion (100 J). If stable: IV Amiodarone infusion (150 mg over 10 min).
* **Ventricular Fibrillation (VF):** Chaotic wave, zero cardiac output. Immediate CPR + Defibrillation (120–200 J biphasic), IV Epinephrine 1 mg every 3–5 min, IV Amiodarone 300 mg.
* **Sinus Bradycardia (< 60 bpm):** If symptomatic (hypotensive, dizzy): IV Atropine 1 mg push (repeat up to 3 mg max), transcutaneous pacing, Epinephrine/Dopamine infusion.
* **Atrioventricular (AV) Blocks:**
  * *1st Degree:* PR > 200 ms, 1:1 conduction. Monitor, review AV-nodal blocking drugs.
  * *2nd Degree Mobitz I (Wenckebach):* Progressive PR prolongation until dropped QRS. Usually benign; monitor, Atropine if symptomatic.
  * *2nd Degree Mobitz II:* Fixed PR interval with sudden dropped QRS. High danger of complete heart block. Attach pacing pads immediately; prepare permanent pacemaker.
  * *3rd Degree (Complete Heart Block):* Complete AV dissociation. P-waves and QRS march independently. Immediate transcutaneous pacing, ICU admission, transvenous/permanent pacemaker.

#### Category B: "Shape" Problems (12-Lead Findings & Pathologies)
* **ST-Segment Elevation:** J-point elevation ≥ 1 mm in limb leads or ≥ 1.5–2.5 mm in precordial leads. Urgent catheterization lab activation (< 90 min door-to-balloon), Aspirin 325 mg chewable, Heparin, dual antiplatelet therapy. (Differentiate from diffuse concave ST elevation in Pericarditis).
* **ST-Segment Depression & T-Wave Inversion:** Horizontal or downsloping ST depression ≥ 0.5 mm in contiguous leads. Subendocardial ischemia, NSTEMI, or Wellens' syndrome (critical LAD stenosis). Anti-ischemics (Nitroglycerin), antiplatelets, serial troponins.
* **Peaked T-Waves (Hyperkalemia, K+ > 5.5 mEq/L):** Tall, tented, narrow-based T-waves. 3-step stabilization: (1) IV Calcium Gluconate to stabilize myocardium, (2) IV Insulin + D50 + inhaled Albuterol to shift potassium into cells, (3) Furosemide or Lokelma/Kayexalate/dialysis to eliminate potassium.
* **Flattened T-Waves & Prominent U-Waves (Hypokalemia, K+ < 3.5 mEq/L):** ST sagging, flat T-wave, prominent U-wave in V2–V3. Replenish Potassium Chloride (target > 4.0 mEq/L) and IV Magnesium Sulfate.
* **Corrected QT (QTc) Prolongation:** QTc > 450 ms (men), > 460 ms (women), > 500 ms (critical danger). Severe risk of polymorphic VT (Torsades de Pointes). Stop QT-prolonging drugs, give IV Magnesium Sulfate (2 g over 1–2 min).
* **Bundle Branch Blocks:** Wide QRS (≥ 120 ms). RBBB (RSR' "rabbit ears" in V1, wide slurred S in I/V6) vs. LBBB (broad notched R-wave in I/aVL/V5–V6, deep QS in V1; new LBBB considered STEMI-equivalent until proven otherwise).

---

### 2.2 The 5 Systematic Steps to Read Any ECG
The app structures both user input and agent reasoning around the verified 5-Step Clinical Method:

+--------------------------------------------------------------------------------------------------+
| STEP 1: RATE                                                                                     |
|   - Calculate ventricular rate (QRS/min). Normal: 60-100 bpm.                                    |
|   - Quick methods: 300 ÷ (large boxes between R-R) or (R-waves in 6-second strip) × 10.          |
+--------------------------------------------------------------------------------------------------+
| STEP 2: RHYTHM REGULARITY                                                                        |
|   - Measure R-R intervals across the strip with calipers or paper marks.                         |
|   - Categorize: Regular, Regularly Irregular (e.g. Mobitz I), or Irregularly Irregular (AFib).   |
+--------------------------------------------------------------------------------------------------+
| STEP 3: P-WAVE EVALUATION                                                                        |
|   - Are P-waves present? Are they upright and uniform in Lead II?                                |
|   - Is there a 1:1 ratio between P-waves and QRS complexes? (Rule out flutter, AV dissociation). |
+--------------------------------------------------------------------------------------------------+
| STEP 4: PR INTERVAL CONDUCTION                                                                   |
|   - Measure from beginning of P-wave to beginning of QRS complex.                                |
|   - Normal: 120 to 200 ms (3 to 5 small boxes). > 200 ms = 1st-degree AV block; variable = block. |
+--------------------------------------------------------------------------------------------------+
| STEP 5: QRS COMPLEX & INTERVAL/MORPHOLOGY (SHAPE)                                                |
|   - QRS Width: Normal is < 120 ms (< 3 small boxes). Wide (≥ 120 ms) = ventricular origin/BBB.   |
|   - ST Segment: Isoelectric baseline. Look for ST-elevation (STEMI) or ST-depression (ischemia). |
|   - T-Waves & QTc: Upright, normal height. Check for peaked (hyperkalemia), inverted, or QTc > 460|
+--------------------------------------------------------------------------------------------------+

---

## 3. Web App Technical Architecture

### 3.1 Stack Selection Rationale
* **HTML:** Modern Semantic HTML5. No heavy JS frameworks (React/Vue/Angular) to guarantee zero build overhead, instantaneous initial load (< 500 ms), and pristine compatibility with static GitHub Pages hosting.
* **CSS:** Materialize CSS (v1.0.0+ / Materialize Next) supplemented by custom Material Design 3 variables. Delivers standard Google Web App aesthetics: responsive cards, elevated paper surfaces, floating action buttons (FAB), modals, tabs, and mobile slide-out drawers.
* **JavaScript:** Vanilla ES6+ modules. Modern `async/await`, `fetch`, class-free functional modules, strict separation of concerns, and rigorous Single Responsibility Principle per function.
* **Hosting:** GitHub Pages (Frontend static hosting via CDN) paired with Google Cloud Run / Cloud Functions (Backend serverless proxy for secure AI orchestration).

---

### 3.2 Directory & File Architecture
Strict separation of concerns ensures that no JavaScript is mixed into HTML files and all styles reside exclusively in dedicated stylesheets:

ecg-instructor-agent/
├── index.html                           # Root Semantic HTML5 entry document
├── manifest.json                        # Web App manifest for PWA mobile installability
├── gemini.md                            # Comprehensive Architecture & Philosophy specification
├── css/
│   ├── materialize.min.css              # Materialize CSS core library
│   └── style.css                        # Google Web App custom theme, typography, & overrides
├── js/
│   ├── app.js                           # Application orchestrator & DOM initialization
│   ├── ecg_engine.js                    # Clinical rules, interval validation, & 5-step evaluator
│   ├── api_service.js                   # Gemini API communication, proxy routing, & BYOK handler
│   ├── ui_controller.js                 # UI rendering, chat bubble generator, & Materialize hooks
│   └── storage.js                       # Safe local credential store, session history, & bookmarks
├── assets/
│   ├── img/
│   │   ├── ECG-waves-segments-and-intervals-LITFL-ECG-library-3.jpg # Verified LITFL reference chart
│   │   ├── litfl_directory.json         # Offline database of verified LITFL clinical links
│   │   └── google_ai_icon.svg           # Google branding badge
│   └── icons/                           # Material Icons local fallback fonts
├── backend/                             # Google Cloud Platform Serverless Proxy (Optional Enterprise)
│   ├── main.py                          # Python FastAPI / Cloud Function gateway
│   ├── requirements.txt                 # google-genai, google-cloud-secret-manager, fastapi
│   ├── Dockerfile                       # Container definition for Cloud Run
│   └── cloudbuild.yaml                  # Automated CI/CD build configuration
└── .github/
└── workflows/
├── deploy-gh-pages.yml          # GitHub Pages automated deployment workflow
└── agentops-eval.yml            # CI evaluation quality gate against golden dataset

## 4. Frontend UI/UX Design: Google Web App Vibes & Mobile-First Principles

### 4.1 Mobile-First Ergonomics
1. **Viewport Optimization:** Configured for mobile viewport (`width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes`).
2. **Thumb-Zone Navigation:** Action buttons, 5-step quick pickers, and input fields placed in the lower two-thirds of the screen for natural one-handed thumb interaction.
3. **Card-Based Progressive Disclosure:** Clinical data is chunked into Google-style Material cards with clean elevation (0 to 4dp), subtle borders (`#e0e0e0`), rounded corners (`16px`), and high-contrast typography.
4. **Color-Coded Clinical Triage Badges:**
   * **Stable / Physiological (Green):** `#2e7d32` / background `#e8f5e9`
   * **Borderline / Requiring Investigation (Amber):** `#f57f17` / background `#fffde7`
   * **Unstable / Life-Threatening (Red):** `#c62828` / background `#ffebee`

### 4.2 Materialize CSS Integration & Layout Structure
* **Top App Bar:** Google Blue (`#1a73e8`) header with hamburger drawer toggle, active scenario badge, and API Key / Settings button.
* **Interactive 5-Step Input Drawer / Modal:** Allows the nurse to enter measured numbers (e.g. Heart Rate: 130, PR: 240 ms, QRS: 140 ms, QTc: 510 ms, ST Elevation: Yes) or type freeform conversational descriptions (e.g., *"My patient's telemetry shows an irregular rhythm with no P-waves and wide complexes"*).
* **Tabbed Learning Workspace:**
  1. *Tab 1: Preceptor Chat:* Dynamic conversational tutoring with the AI agent.
  2. *Tab 2: 5-Step Calculator & Normal Values:* Interactive interval reference guide.
  3. *Tab 3: Emergency Stabilization Checklist:* Rapid bedside action protocols.
  4. *Tab 4: LITFL Reference Library:* Direct links to verified electrophysiology references.

---

## 5. Security & API Key Safeguards for GitHub Pages & Google Cloud

### 5.1 The Threat Model of GitHub Pages
Because GitHub Pages serves static, publicly readable files from a Git repository, **never embed, commit, or expose a Google Cloud API key in client-side HTML, CSS, or JS.** Any key checked into GitHub is immediately scraped and compromised.

### 5.2 The Two-Tier Production Safeguard Architecture

TIER 1: CLIENT-SIDE BYOK
                          (For Individual Study / Open Source)
                                            |
           +--------------------------------+--------------------------------+
           |                                                                 |
[Nurse's Mobile Device]                                            [Browser Local Storage]

Enters Gemini API Key in Modal                                      Encrypted AES-GCM / Base64
|                                                                 |
+---------------------> Directly Calls <--------------------------+
Google Gemini API
(https://generativelanguage.googleapis.com)
(Key never stored on any server)

OR

                             TIER 2: GCP ENTERPRISE PROXY
                           (For Production Hospital / School Deployment)
                                            |
[GitHub Pages Static Frontend]                                    [GCP Cloud Run / Functions]
(Hosted on github.io)                                             (Serverless Backend Gateway)
           |                                                                 |
           |--- 1. POST /api/ecg-preceptor (No Keys) ---------------------->|
           |    Header: Origin: [https://username.github.io](https://username.github.io)                   |-- 2. Validate Origin & CORS
           |                                                                 |-- 3. Fetch Secret Key from
           |                                                                 |      GCP Secret Manager
           |                                                                 |-- 4. Pass through Model Armor
           |                                                                 |-- 5. Call Gemini 3.8 Flash API
           |<-- 6. Returns Filtered AI Response (JSON) ----------------------|

#### Safeguard Implementation Details:
1. **Tier 1 (Bring-Your-Own-Key / BYOK):**
   * Key is entered in a secure client-side Materialize modal (`type="password"`).
   * Stored in `sessionStorage` (cleared automatically on tab close) or optionally `localStorage` with a visible warning and a one-click "Purge Key" button.
   * Key is transmitted only via HTTPS header directly to Google's official Gemini endpoint.
2. **Tier 2 (Enterprise GCP Cloud Run Proxy):**
   * Backend deployed on Google Cloud Run with **Secret Manager** injecting `GEMINI_API_KEY` at runtime into container environment variables.
   * **CORS Whitelist:** Strict enforcement restricting callers exclusively to `https://<org>.github.io`.
   * **Rate Limiting & Quotas:** Google Cloud Armor or Cloud Run per-IP throttling prevents denial-of-wallet attacks.
   * **Input/Output Sanitization:** Employs Google Cloud **Model Armor** to sanitize prompts against injection and redact accidental Patient Health Information (PHI/PII).

#### 5.3 Baseline Model Selection: Gemini 3.8 Flash
> **Standard Model Rationale (`gemini-3.8-flash`):**  
> The application standardizes on `gemini-3.8-flash` (`models/gemini-3.8-flash`) as the current baseline model.  
> Legacy model versions such as `gemini-2.5-flash` have been deprecated by Google for new users (returning HTTP 404 `NOT_FOUND` errors).  
> For this educational preceptor application, `gemini-3.8-flash` provides the ideal lightweight balance: low latency, high electrophysiology reasoning fidelity, structured markdown formatting, and cost efficiency. Its fast inference and ACLS adherence make heavier pro models unnecessary for routine rhythm interpretation, 5-step interval analysis, and bedside nursing stabilization guidance.

---

## 6. JavaScript Modular Architecture & Coding Standards

### 6.1 Coding Standards Enforced
1. **Explicit Function Names:** Verb-first, highly descriptive camelCase (e.g., `calculateCorrectedQtInterval`, `formatClinicalNursingGuidance`).
2. **Single Responsibility Principle (SRP):** Every function accomplishes exactly one logical task (pure calculation, DOM rendering, or API fetching).
3. **Comprehensive JSDoc Comments:** Clear typing, explanation of clinical purpose, parameters, and return signatures.
4. **Defensive Programming:** Robust input validation and fallback handling for missing or malformed clinical values.

### 6.2 Key JavaScript Modules & Function Implementations

#### Module 1: `js/ecg_engine.js` (Clinical Validation & Step Parsing)
```javascript
/**
 * @file ecg_engine.js
 * @description Encapsulates clinical electrophysiology rules, normal interval benchmarks,
 * and 5-step ECG parsing logic. Adheres strictly to the Single Responsibility Principle.
 */

export const ECG_NORMAL_RANGES = Object.freeze({
  heartRate: { min: 60, max: 100, unit: 'bpm' },
  prInterval: { min: 120, max: 200, unit: 'ms' },
  qrsDuration: { min: 60, max: 119, unit: 'ms' },
  qtcMen: { max: 450, unit: 'ms' },
  qtcWomen: { max: 460, unit: 'ms' },
  qtcCriticalDanger: { min: 500, unit: 'ms' }
});

/**
 * Evaluates whether a measured heart rate represents bradycardia, normal rate, or tachycardia.
 * @param {number} rateInBpm - Heart rate in beats per minute.
 * @returns {'bradycardia' | 'normal' | 'tachycardia'} Clinical rate classification.
 */
export function classifyHeartRate(rateInBpm) {
  if (typeof rateInBpm !== 'number' || isNaN(rateInBpm) || rateInBpm <= 0) {
    throw new Error('Invalid heart rate provided. Must be a positive number.');
  }
  if (rateInBpm < ECG_NORMAL_RANGES.heartRate.min) {
    return 'bradycardia';
  }
  if (rateInBpm > ECG_NORMAL_RANGES.heartRate.max) {
    return 'tachycardia';
  }
  return 'normal';
}

/**
 * Determines whether a PR interval is normal, abnormally shortened, or prolonged.
 * @param {number} prIntervalMs - PR interval measured in milliseconds.
 * @returns {'shortened' | 'normal' | 'prolonged'} Conduction status.
 */
export function evaluatePrInterval(prIntervalMs) {
  if (typeof prIntervalMs !== 'number' || isNaN(prIntervalMs) || prIntervalMs <= 0) {
    throw new Error('Invalid PR interval provided. Must be a positive number.');
  }
  if (prIntervalMs < ECG_NORMAL_RANGES.prInterval.min) {
    return 'shortened';
  }
  if (prIntervalMs > ECG_NORMAL_RANGES.prInterval.max) {
    return 'prolonged';
  }
  return 'normal';
}

/**
 * Classifies QRS complex duration as normal or pathologically wide.
 * @param {number} qrsDurationMs - QRS duration in milliseconds.
 * @returns {'narrow' | 'wide'} QRS width classification.
 */
export function classifyQrsWidth(qrsDurationMs) {
  if (typeof qrsDurationMs !== 'number' || isNaN(qrsDurationMs) || qrsDurationMs <= 0) {
    throw new Error('Invalid QRS duration provided. Must be a positive number.');
  }
  return qrsDurationMs >= 120 ? 'wide' : 'narrow';
}

/**
 * Calculates corrected QT interval (QTc) using Bazett's formula: QTc = QT / sqrt(RR in seconds).
 * @param {number} qtIntervalMs - Measured QT interval in milliseconds.
 * @param {number} heartRateBpm - Ventricular rate in beats per minute.
 * @returns {number} Corrected QTc interval in milliseconds rounded to the nearest integer.
 */
export function calculateCorrectedQtc(qtIntervalMs, heartRateBpm) {
  if (qtIntervalMs <= 0 || heartRateBpm <= 0) {
    throw new Error('Both QT interval and heart rate must be positive values.');
  }
  const rrIntervalSeconds = 60 / heartRateBpm;
  const qtcMs = qtIntervalMs / Math.sqrt(rrIntervalSeconds);
  return Math.round(qtcMs);
}

/**
 * Checks whether a given QTc value poses high risk for Torsades de Pointes.
 * @param {number} qtcMs - Corrected QT interval in milliseconds.
 * @returns {boolean} True if QTc exceeds critical threshold of 500 ms.
 */
export function isQtcSeverelyProlonged(qtcMs) {
  return qtcMs >= ECG_NORMAL_RANGES.qtcCriticalDanger.min;
}

/**
 * Constructs a structured 5-step ECG clinical summary object from raw nurse observations.
 * @param {Object} rawInputs - Measurements collected from the nurse.
 * @returns {Object} Standardized 5-step diagnostic assessment payload.
 */
export function buildFiveStepAssessment(rawInputs) {
  return {
    step1_rate: {
      value: rawInputs.heartRate,
      classification: classifyHeartRate(rawInputs.heartRate)
    },
    step2_rhythm: {
      regularity: rawInputs.isRegular ? 'regular' : 'irregular',
      type: rawInputs.rhythmType || 'unspecified'
    },
    step3_pWaves: {
      present: Boolean(rawInputs.pWavesPresent),
      ratio: rawInputs.pToQrsRatio || '1:1'
    },
    step4_prInterval: {
      value: rawInputs.prIntervalMs,
      conduction: evaluatePrInterval(rawInputs.prIntervalMs)
    },
    step5_shapeAndIntervals: {
      qrsWidth: classifyQrsWidth(rawInputs.qrsDurationMs),
      qrsDurationMs: rawInputs.qrsDurationMs,
      stDeviation: rawInputs.stDeviation || 'isoelectric',
      tWaveMorphology: rawInputs.tWaveMorphology || 'normal',
      qtcMs: calculateCorrectedQtc(rawInputs.qtIntervalMs, rawInputs.heartRate),
      isDangerousQtc: isQtcSeverelyProlonged(calculateCorrectedQtc(rawInputs.qtIntervalMs, rawInputs.heartRate))
    }
  };
}

7. "Prototype to Production" (AgentOps) Lifecycle
Grounded in the 5-part Google Cloud Agent engineering curriculum, the app progresses through five distinct maturity milestones:

+----------------------------------------------------------------------------------------------------+
| 1. CORE ANATOMY (Day 1)                                                                            |
|    - Brain: Gemini 3.8 Flash (low latency, high reasoning fidelity, cost-effective).              |
|    - Hands: LITFL Reference Tool, 5-Step Interval Engine, ACLS Action Playbook.                  |
|    - Nervous System: Context Engineering assembling user role, rhythm parameters, and history.     |
|    - Deployment: GitHub Pages (static client) + Google Cloud Run (serverless secure proxy).        |
+----------------------------------------------------------------------------------------------------+
| 2. TOOLS & MCP INTEROPERABILITY (Day 2)                                                            |
|    - Formal Model Context Protocol (MCP) tool contracts for external ECG querying.                |
|    - Strict input/output JSON schemas avoiding tool shadowing and dynamic capability injection.    |
+----------------------------------------------------------------------------------------------------+
| 3. CONTEXT ENGINEERING & SESSIONS (Day 3)                                                          |
|    - Session State: Tracking current practice strip, prior nurse queries, and verified steps.     |
|    - Working Memory Compaction: Sliding-window history truncation to maintain snappy speed.       |
|    - Procedural Memory: Codifying best-practice emergency stabilization algorithms.                |
+----------------------------------------------------------------------------------------------------+
| 4. QUALITY & OBSERVABILITY FLYWHEEL (Day 4)                                                        |
|    - Outside-In Evaluation Hierarchy: Measuring Clinical Accuracy and Nurse Usability.            |
|    - LLM-as-a-Judge: Automated evaluation suite testing 50+ classic ECG cases (STEMI, AFib, etc.). |
|    - Telemetry & Traces: OpenTelemetry instrumentation for token cost, latency, and reasoning.    |
+----------------------------------------------------------------------------------------------------+
| 5. PRE-PRODUCTION GATES & CI/CD PIPELINE (Day 5)                                                   |
|    - GitHub Actions automated pre-merge evaluation gate (PR blocked if clinical accuracy < 98%).   |
|    - Automated static deployment to GitHub Pages on merge to `main`.                               |
|    - Observe-Act-Evolve production feedback loop refining system prompts from user feedback.      |
+----------------------------------------------------------------------------------------------------+

8. Deployment Playbook
8.1 GitHub Pages Deployment (Frontend)
Initialize Git repository and push index.html, css/, js/, assets/, and manifest.json to GitHub.

In GitHub Repository Settings, navigate to Pages -> Build and deployment -> Source: Deploy from a branch -> Branch: main / root.

The app is live at https://<username>.github.io/<repository-name>/.

Provide the built-in BYOK modal for immediate testing and study without configuring cloud servers.

8.2 Google Cloud Run Enterprise Proxy Deployment (Backend Option)
Enable GCP Services: gcloud services enable run.googleapis.com secretmanager.com.

Store API Key in Secret Manager:
echo -n "AIzaSy..." | gcloud secrets create gemini-api-key --data-file=-

Deploy Container to Cloud Run:
gcloud run deploy ecg-preceptor-backend --source ./backend --set-secrets="GEMINI_API_KEY=gemini-api-key:latest" --allow-unauthenticated

Set CORS Header to only accept requests originating from your GitHub Pages domain.

9. Verification & Quality Checklist
[x] Educational Philosophy: Nurse-centric, study-time optimization, stabilization-first doctrine.

[x] Rate vs. Shape Differentiation: Rhythm strip analysis vs. 12-lead full morphology explicitly detailed.

[x] 5-Step Method: Full clinical parameters, normal intervals (PR: 120–200 ms, QRS < 120 ms, QTc < 450/460 ms), and formulas.

[x] Architecture Standards: Latest Vanilla HTML5, Materialize CSS (Google Web App look and feel), Vanilla ES6+ JS.

[x] Strict Separation: Dedicated /css and /js folders with zero inline scripts or styling.

[x] Function Integrity: Every function performs strictly one task with clear JSDoc comments.

[x] Security Safeguards: Multi-tier API key protection for public GitHub Pages deployment.

[x] Production Maturity: Complete AgentOps lifecycle (Day 1 to Day 5) incorporated into gemini.md.
