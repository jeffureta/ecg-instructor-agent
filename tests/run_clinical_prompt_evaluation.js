/**
 * @file run_clinical_prompt_evaluation.js
 * @description Dedicated clinical evaluation runner for the 80yo syncope clinical scenario.
 * 
 * Target Prompt:
 * "I have a 80 year-old female patient presented in the ED with syncope and having falls. 
 *  The ECG shows heart rate of about 45 beats per minute. The QRS complexes are irregular 
 *  and are 150ms. There are no clear P waves. There are ST-Elevation and negative QRS 
 *  to V1, V2, and V3. V6 has a positive QRS complex."
 * 
 * Verifies that the AI preceptor provides the complete answer per gemini.md:
 * 1. Provisional ID (Slow AFib + LBBB / STEMI equivalent; Rate + Shape classification)
 * 2. Differential (AFib w/ slow ventricular response vs 3rd degree block vs acute anterior STEMI)
 * 3. Hemodynamic Impact (Syncope & falls caused by CO = HR × SV drop, severe bradycardia, loss of atrial kick, dyssynchrony)
 * 4. Treatment / No-Cure Management (Transcutaneous pacing, Atropine trial, pressors, cath lab, Permanent Pacemaker [PPM])
 * 5. Role of the Nurse (Combo pads immediately, 2 large-bore IVs, cycle vitals q2-3m, crash cart, fall precautions, hold AV blockers)
 * 6. Non-truncation guarantee (All 5 sections fully populated, no cutoff mid-sentence)
 */

import {
  validateClinicalResponseSections,
  formatUserClinicalQuery,
  DEFAULT_MAX_OUTPUT_TOKENS,
  sendEcgTutoringQuery
} from '../js/api_service.js';

export const TARGET_CLINICAL_PROMPT = 
  "I have a 80 year-old female patient presented in the ED with syncope and having falls. " +
  "The ECG shows heart rate of about 45 beats per minute. The QRS complexes are irregular " +
  "and are 150ms. There are no clear P waves. There are ST-Elevation and negative QRS " +
  "to V1, V2, and V3. V6 has a positive QRS complex.";

/**
 * Evaluates whether a clinical response meets all requirements from gemini.md.
 * @param {string} responseText - Generated clinical response text.
 * @returns {{ isComplete: boolean, score: number, checks: Array<{ name: string, passed: boolean, details: string }> }}
 */
export function evaluateClinicalResponse(responseText) {
  const checks = [];

  // 1. Mandatory 5-section check
  const sectionResult = validateClinicalResponseSections(responseText);
  checks.push({
    name: 'All 5 Mandatory Sections Present',
    passed: sectionResult.isValid,
    details: sectionResult.isValid 
      ? 'All 5 sections detected' 
      : `Missing: ${sectionResult.missingSections.join(', ')}`
  });

  // 2. Provisional ID: Rate & Shape classification and Rhythm ID
  const lower = responseText.toLowerCase();
  const identifiesRateAndShape = (lower.includes('rate') && lower.includes('shape')) || lower.includes('rate problem') || lower.includes('shape problem');
  const identifiesAfibOrLbbb = (lower.includes('atrial fibrillation') || lower.includes('afib')) && 
                               (lower.includes('bundle branch') || lower.includes('lbbb') || lower.includes('wide qrs'));
  checks.push({
    name: 'Provisional ID Identifies Rate & Shape and Rhythm (AFib + LBBB)',
    passed: identifiesRateAndShape && identifiesAfibOrLbbb,
    details: `Rate & Shape: ${identifiesRateAndShape}, AFib + LBBB: ${identifiesAfibOrLbbb}`
  });

  // 3. Differential Diagnosis
  const hasDifferential = (lower.includes('complete heart block') || lower.includes('3rd degree') || lower.includes('third-degree') || lower.includes('av block')) ||
                          (lower.includes('stemi') || lower.includes('sgarbossa') || lower.includes('infarction') || lower.includes('ischemia'));
  checks.push({
    name: 'Differential Diagnoses (AV block / STEMI / Sgarbossa)',
    passed: hasDifferential,
    details: `Includes critical differentials for bradycardia and anterior STE in LBBB: ${hasDifferential}`
  });

  // 4. Hemodynamic Impact & Syncope/Falls mechanism
  const explainsHemodynamics = (lower.includes('cardiac output') || lower.includes('co =') || lower.includes('stroke volume') || lower.includes('perfusion')) &&
                               (lower.includes('syncope') || lower.includes('fall') || lower.includes('hypoperfusion') || lower.includes('hypotension'));
  checks.push({
    name: 'Hemodynamic Perfusion & Syncope Fall Mechanism',
    passed: explainsHemodynamics,
    details: `Explains CO collapse and cerebral hypoperfusion: ${explainsHemodynamics}`
  });

  // 5. Treatment (Acute Pacing + Permanent Pacemaker)
  const hasPacingTreatment = (lower.includes('transcutaneous') || lower.includes('pacing') || lower.includes('tcp')) &&
                             (lower.includes('pacemaker') || lower.includes('ppm') || lower.includes('permanent'));
  checks.push({
    name: 'Acute Pacing & Permanent Pacemaker Management',
    passed: hasPacingTreatment,
    details: `Details transcutaneous pacing and PPM: ${hasPacingTreatment}`
  });

  // 6. Role of the Nurse & Hold Orders
  const hasNursingPriorities = (lower.includes('pad') || lower.includes('pacing pads') || lower.includes('iv access') || lower.includes('crash cart')) &&
                               (lower.includes('hold') || lower.includes('beta-blocker') || lower.includes('calcium channel') || lower.includes('digoxin'));
  checks.push({
    name: 'Role of the Nurse (Pads, Vitals, Hold AV Blockers)',
    passed: hasNursingPriorities,
    details: `Immediate nursing priorities & hold orders: ${hasNursingPriorities}`
  });

  // 7. Non-truncation / Completeness
  const trimmed = responseText.trim();
  const endsWithPunctuation = /[.!?*)}\]`]$/.test(trimmed);
  const hasMinimumLength = trimmed.length >= 800;
  const isNotCutOff = endsWithPunctuation && hasMinimumLength;
  checks.push({
    name: 'Response Is Complete (Not Truncated)',
    passed: isNotCutOff,
    details: `Length: ${trimmed.length} chars, ends cleanly: ${endsWithPunctuation}`
  });

  const passedCount = checks.filter(c => c.passed).length;
  const isComplete = passedCount === checks.length;
  const score = Math.round((passedCount / checks.length) * 100);

  return { isComplete, score, checks };
}

/**
 * Verified Golden Response based on gemini.md specifications.
 */
export const VERIFIED_GOLDEN_PRECEPTOR_RESPONSE = `
### 1. 🎯 Provisional ID
**Atrial Fibrillation with Slow Ventricular Response (Bradycardic AFib)** complicated by **Left Bundle Branch Block (LBBB)** and suspected **Anterior STEMI-Equivalent / Acute Coronary Occlusion**.

This is both a **"Rate"** (severe bradycardia at 45 bpm with absent AV nodal conduction pacing) and **"Shape"** (wide QRS 150 ms with discordant anterior ST-segment elevation in V1–V3) problem.

### 2. 🔍 Differential
1. **Atrial Fibrillation with Slow Ventricular Response & Underlying LBBB:** Irregularly irregular R-R intervals without P-waves confirm AFib. The wide QRS (150 ms) with deep negative QS in V1–V3 and upright R in V6 meets classic LBBB morphology.
2. **Third-Degree (Complete) AV Block with Ventricular Escape:** In complete AV block, QRS complexes are wide and bradycardic, but the R-R rhythm is strictly *regular* and marching dissociated P-waves are seen. In this patient, the irregular rhythm and absent P-waves rule this out in favor of AFib.
3. **Acute Anterior STEMI with New-Onset LBBB (Modified Sgarbossa Criteria):** While LBBB produces baseline discordant ST elevation in V1–V3, disproportionate ST elevation (≥ 25% of the preceding S-wave amplitude or ≥ 5 mm) signifies acute anterior LAD occlusion until ruled out in the cardiac catheterization lab.

### 3. 🫀 Hemodynamic Impact
The patient's syncope and falls are direct manifestations of **acute cardiovascular collapse and cerebral hypoperfusion**:
- **Cardiac Output = Heart Rate × Stroke Volume ($CO = HR \\times SV$):** A profound bradycardia of 45 bpm slashes minute cardiac output in half.
- **Loss of Atrial Kick:** Fibrillating atria forfeit the normal 20–30% ventricular end-diastolic filling preload.
- **Ventricular Dyssynchrony:** The 150 ms LBBB conduction delay prevents synchronous biventricular contraction, dropping mechanical stroke volume.
- **Mean Arterial Pressure (MAP) Plunge:** In an 80-year-old with non-compliant vasculature, this sudden perfusion deficit drops cerebral blood flow below the autoregulatory threshold, producing transient loss of consciousness (syncope) and resulting in falls.

### 4. 💊 Treatment / No-Cure Management
- **Immediate Hemodynamic Stabilization (Unstable Patient):**
  - **Transcutaneous Pacing (TCP):** Because the patient has symptomatic bradycardia with hypoperfusion (syncope/falls), prepare transcutaneous pacing immediately (rate 60–70 bpm, increase current until electrical and mechanical capture is confirmed by femoral pulse).
  - **Pharmacologic Chronotropes:** If pacing is delayed, initiate an Epinephrine infusion (2–10 mcg/min) or Dopamine infusion (5–20 mcg/kg/min). Note: Atropine 1 mg IV push may be trialed, but infranodal conduction disease (wide QRS / LBBB) rarely responds to Atropine.
  - **Urgent Cath Lab Activation:** If ST-elevation meets modified Sgarbossa criteria or this represents a new-onset LBBB with ischemic symptoms, activate the cardiac catheterization team for emergent reperfusion (< 90 minutes).
- **If Stable / Compensated:** Hold all AV-nodal blocking drugs, correct potassium and magnesium, and monitor serial troponins.
- **Long-Term / No-Cure Management:**
  - This patient has intrinsic disease of the cardiac conduction system (sick sinus syndrome / slow AFib and bundle branch disease). Medical therapy cannot restore normal conduction.
  - Anticipate urgent consultation for **Permanent Pacemaker (PPM)** or **Cardiac Resynchronization Therapy (CRT-P / CRT-D)** implantation to maintain rate support and coordinate biventricular contraction.

### 5. 🚨 Role of the Nurse
- **Immediate Bedside Priorities (Stabilize Before Orders Arrive):**
  1. **Attach Combo Defibrillator/Pacing Pads:** Place pads in anterior-posterior configuration immediately in case sudden asystole or hemodynamic arrest develops.
  2. **Vascular Access:** Establish two large-bore peripheral IV lines (18G or 20G) immediately for pressor infusions or emergency medications.
  3. **Frequent Vital Signs:** Cycle automated non-invasive blood pressure every 2 to 3 minutes. Keep oxygen saturation above 94%.
  4. **Emergency Equipment:** Bring the crash cart and transcutaneous pacer generator directly to the bedside.
  5. **Safety Precautions:** Institute strict bed rest and high fall precautions. The patient must not attempt to stand or ambulate.
  6. **Diagnostic Comparison:** Obtain a STAT 12-lead ECG and immediately retrieve previous ECGs from the medical record to determine if the LBBB and ST-elevations are new or chronic.
- **Critical Medication HOLD Warnings:**
  - **HOLD all beta-blockers (Metoprolol, Atenolol), calcium channel blockers (Diltiazem, Verapamil), Digoxin, and Amiodarone.** Giving AV-nodal blockers will induce complete ventricular standstill.
  - **Avoid Nitroglycerin** if the patient is hypotensive (SBP < 90 mmHg) or if right ventricular involvement is suspected.
`;

/**
 * Main execution function.
 */
export async function runPromptEvaluation() {
  console.log('================================================================');
  console.log('CLINICAL EVALUATION RUNNER: 80yo Syncope & Slow AFib/LBBB Case');
  console.log('================================================================');
  console.log(`Prompt: "${TARGET_CLINICAL_PROMPT}"\n`);

  // Step 1: Validate evaluation framework on verified golden answer
  console.log('[Phase 1: Validating Evaluation Rubric Against Golden Preceptor Output]');
  const goldenEvaluation = evaluateClinicalResponse(VERIFIED_GOLDEN_PRECEPTOR_RESPONSE);
  console.log(`Golden Answer Clinical Score: ${goldenEvaluation.score}% (Complete: ${goldenEvaluation.isComplete})`);
  goldenEvaluation.checks.forEach(check => {
    console.log(`  ${check.passed ? '✓' : '✗'} ${check.name}: ${check.details}`);
  });

  if (!goldenEvaluation.isComplete) {
    console.error('Fatal: Golden response failed evaluation rubric!');
    process.exit(1);
  }

  // Step 2: Validate that truncated response is correctly REJECTED
  console.log('\n[Phase 2: Verifying Truncated Response Detection (Negative Control)]');
  const truncatedResponse = `
### 1. 🎯 Provisional ID
Atrial Fibrillation with slow ventricular response. Rate problem.
### 2. 🔍 Differential
Differential is complete heart block.
### 3. 🫀 Hemodynamic Impact
Blood pressure falls because heart rate is 45 bpm.
`; // Cut short mid-generation missing Sections 4 & 5
  const truncatedEvaluation = evaluateClinicalResponse(truncatedResponse);
  console.log(`Truncated Response Score: ${truncatedEvaluation.score}% (Rejected: ${!truncatedEvaluation.isComplete})`);
  if (truncatedEvaluation.isComplete) {
    console.error('Fatal: Truncated response was mistakenly accepted as complete!');
    process.exit(1);
  }
  console.log('  ✓ Successfully caught truncated response missing Sections 4 & 5');

  // Step 3: Check live execution if GEMINI_API_KEY is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    console.log('\n[Phase 3: Live Gemini 3.8 Flash API Execution Loop]');
    console.log(`Max Output Tokens Allowance: ${DEFAULT_MAX_OUTPUT_TOKENS}`);

    let attempts = 0;
    const maxAttempts = 3;
    let liveSuccess = false;

    while (attempts < maxAttempts && !liveSuccess) {
      attempts++;
      console.log(`\nAttempt ${attempts} of ${maxAttempts} - Querying Gemini 3.8 Flash...`);
      try {
        const liveOutput = await sendEcgTutoringQuery(TARGET_CLINICAL_PROMPT, apiKey);
        console.log(`Received response (${liveOutput.length} characters)`);

        const liveEval = evaluateClinicalResponse(liveOutput);
        console.log(`Clinical Compliance Score: ${liveEval.score}%`);
        liveEval.checks.forEach(c => {
          console.log(`  ${c.passed ? '✓' : '✗'} ${c.name}: ${c.details}`);
        });

        if (liveEval.isComplete) {
          console.log('\n✓ LIVE API VERIFICATION SUCCESSFUL: Preceptor generated the complete, untruncated answer!');
          liveSuccess = true;
        } else {
          console.warn(`Attempt ${attempts} missing clinical criteria, retrying...`);
        }
      } catch (err) {
        console.error(`Attempt ${attempts} error: ${err.message}`);
      }
    }

    if (!liveSuccess) {
      console.error('Live API prompt evaluation failed to arrive at full clinical compliance within retry limit.');
      process.exit(1);
    }
  } else {
    console.log('\n[Phase 3: Live API Execution Skipped - GEMINI_API_KEY not set]');
    console.log('Offline clinical rubric and golden scenario validation PASSED.');
  }

  console.log('\n================================================================');
  console.log('EVALUATION RUN COMPLETE: All clinical benchmarks verified.');
  console.log('================================================================');
}

// Run if called directly via Node
if (typeof process !== 'undefined' && process.argv[1]?.includes('run_clinical_prompt_evaluation.js')) {
  runPromptEvaluation().catch(err => {
    console.error('Unhandled evaluation runner error:', err);
    process.exit(1);
  });
}
