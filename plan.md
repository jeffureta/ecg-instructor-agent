---

### File 2: `plan.md`

```markdown
# ECG Instructor AI Agent: Implementation & Deployment Plan
**Target Stack:** Vanilla HTML5, Materialize CSS, Modular Vanilla ES6+ JavaScript  
**Hosting & Cloud Infrastructure:** GitHub Pages (Frontend CDN) + Google Cloud Platform (Cloud Run / Functions Serverless Gateway)  
**Standard:** Prototype to Production (AgentOps Framework)

---

## 1. Project Overview & Milestones

The goal of this project is to take the ECG Instructor AI Agent from concept to a production-ready, mobile-first web app deployed on GitHub Pages with an optional Google Cloud enterprise proxy.

| Phase | Milestone | Deliverables | Target Timeline |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Clinical Core & Rules Engine | `ecg_engine.js` (5-step parser, interval checker, normal values) | Sprint 1 |
| **Phase 2** | UI/UX & Google Web App Layout | `index.html`, `css/style.css` (Materialize CSS, mobile-first cards) | Sprint 1 |
| **Phase 3** | AI Preceptor & Key Safeguards | `api_service.js`, `storage.js` (BYOK modal, Gemini API client) | Sprint 2 |
| **Phase 4** | GitHub Pages Deployment | GitHub Actions workflow, PWA manifest, live GitHub Pages URL | Sprint 2 |
| **Phase 5** | Google Cloud Enterprise Gateway | Python Cloud Run proxy, Secret Manager, Model Armor, CORS | Sprint 3 |
| **Phase 6** | AgentOps Evaluation & Monitoring | Golden Dataset test suite, LLM-as-a-Judge CI gate, OpenTelemetry | Sprint 3 |

---

## 2. Directory & Component Breakdown

ecg-instructor-agent/
├── index.html                   # Semantic Vanilla HTML5 markup
├── manifest.json                # Mobile PWA installation manifest
├── gemini.md                    # Architecture & Philosophy Specification
├── plan.md                      # Implementation & Deployment Roadmap
├── css/
│   ├── materialize.min.css      # Materialize CSS Framework (v1.0.0+)
│   └── style.css                # Custom Google Material Design styles & overrides
├── js/
│   ├── app.js                   # Application coordinator & event wiring
│   ├── ecg_engine.js            # Clinical calculation & 5-step classification
│   ├── api_service.js           # Gemini API client & proxy request handler
│   ├── ui_controller.js         # DOM manipulation, chat rendering, Materialize hooks
│   └── storage.js               # Safe credential storage & session persistence
├── assets/
│   ├── img/                     # Educational SVG diagrams & waveforms
│   └── data/
│       └── ecg_library.json     # Curated Rate & Shape database with LITFL links
├── backend/                     # Google Cloud Run proxy (Optional Production Tier)
│   ├── main.py                  # FastAPI serverless proxy with Secret Manager
│   ├── requirements.txt         # Dependencies (google-genai, fastapi, uvicorn)
│   └── Dockerfile               # Production container image
└── .github/
└── workflows/
├── deploy-pages.yml     # Automated GitHub Pages static deployment
└── eval-quality-gate.yml# CI quality test against golden ECG cases

---

## 3. Step-by-Step Implementation Guide

### Step 1: Establish Clinical Data & Core Engine (`js/ecg_engine.js`)
* Implement pure mathematical and boundary checking functions for:
  * Heart Rate (`classifyHeartRate`: < 60 Brady, 60–100 Normal, > 100 Tachy).
  * PR Interval (`evaluatePrInterval`: < 120 ms WPW/short, 120–200 ms Normal, > 200 ms 1st deg AV block).
  * QRS Duration (`classifyQrsWidth`: < 120 ms Narrow, ≥ 120 ms Wide).
  * Corrected QTc (`calculateCorrectedQtc` using Bazett formula, `isQtcSeverelyProlonged` checking > 500 ms).
  * 5-Step Assessment Compiler (`buildFiveStepAssessment`).

### Step 2: Build the Google-Style Mobile-First UI (`index.html` & `css/style.css`)
* Integrate Materialize CSS grid and components:
  * Fixed Google Blue (`#1a73e8`) header with navigation drawer.
  * 4 Materialize Tabs:
    1. **Preceptor Chat:** Conversational dialogue with the AI instructor.
    2. **5-Step Analyzer:** Rapid input fields for measured values with instant normal/abnormal badges.
    3. **Emergency Stabilization:** Rapid clinical checklist (unstable patient priority: airway, breathing, circulation, pads, IV access, cardioversion/defibrillation/pacing).
    4. **Reference Library:** LITFL canonical reference links.
* Responsive viewport configuration with thumb-zone ergonomics.

### Step 3: Implement Safe Credential Management (`js/storage.js`)
* Enforce zero plain-text API keys in Git.
* Build a client-side settings modal for Bring-Your-Own-Key (BYOK):
  * Input field with password masking.
  * Save to `sessionStorage` (recommended) or `localStorage`.
  * One-click "Purge Credentials" button to remove stored keys immediately.

### Step 4: Wire AI Preceptor Client (`js/api_service.js`)
* Construct didactic clinical system instructions instructing Gemini 3.8 Flash to act as an acute cardiology nurse preceptor.
* Ensure low temperature (`0.2`) to eliminate hallucinations and adhere to standard ACLS resuscitation guidelines.
* Implement structured error parsing (handling quota limits, missing keys, and invalid formats gracefully).

### Step 5: Configure GitHub Pages CI/CD (`.github/workflows/deploy-pages.yml`)
* Configure GitHub Actions to automatically deploy the `main` branch to GitHub Pages on every push.
* Ensure that no `.env` or sensitive secret files are checked in.

### Step 6: Deploy Optional Google Cloud Run Proxy (`backend/`)
* For institutional or hospital education deployments where students should not supply their own API keys:
  1. Store the Gemini API key in Google Secret Manager (`gemini-api-key`).
  2. Deploy `backend/main.py` on Cloud Run.
  3. Cloud Run authenticates via IAM, pulls the key from Secret Manager, applies rate limits, and restricts CORS exclusively to `https://<org>.github.io`.

---

## 4. Operationalization: The AgentOps Quality Flywheel

Based on the 5 whitepapers from Google Cloud Agent Engineering:
1. **Golden Dataset:** Create a benchmark of 50 validated clinical scenarios (STEMI, Ventricular Tachycardia, 3rd-Degree AV Block, Hyperkalemia, etc.).
2. **LLM-as-a-Judge:** Integrate an automated evaluation workflow that grades the agent's responses on clinical correctness, safety, and nursing role guidance before promoting new code.
3. **Observability:** Monitor P99 latency, token consumption, and failure rates via Google Cloud Trace and Logging.
4. **Observe-Act-Evolve:** Aggregate user feedback (thumbs up/down) to continuously refine system prompts and update test cases.

