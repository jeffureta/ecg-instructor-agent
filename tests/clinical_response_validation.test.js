/**
 * @file clinical_response_validation.test.js
 * @description Unit test suite validating:
 * 1. AI Preceptor system instructions contain mandatory 5-part structure & deflection rules.
 * 2. User query enrichment ensures all 5 sections are explicitly demanded even on short inputs.
 * 3. Clinical response validator catches incomplete or single-sentence rhythm answers.
 * 4. UI markdown parser correctly converts preceptor markdown into HTML without dropping content.
 */

import {
  getSystemInstructions,
  validateClinicalResponseSections,
  formatUserClinicalQuery,
  MANDATORY_CLINICAL_SECTIONS,
  GEMINI_API_ENDPOINT,
  DEFAULT_MAX_OUTPUT_TOKENS,
  buildEcgTutoringPayload
} from '../js/api_service.js';

import { formatMarkdownToHtml } from '../js/ui_controller.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('--- RUNNING CLINICAL RESPONSE & PROMPT VALIDATION TESTS ---');

// Suite 1: System Instruction Structure Verification
console.log('\n[Suite 1: System Instruction Verification]');
const instructions = getSystemInstructions();
assert(typeof instructions === 'string' && instructions.length > 500, 'System instructions are generated as non-empty string');
assert(instructions.includes('🎯 Provisional ID'), 'Instructions require Section 1 (🎯 Provisional ID)');
assert(instructions.includes('🔍 Differential'), 'Instructions require Section 2 (🔍 Differential)');
assert(instructions.includes('🫀 Hemodynamic Impact'), 'Instructions require Section 3 (🫀 Hemodynamic Impact)');
assert(instructions.includes('💊 Treatment / No-Cure Management'), 'Instructions require Section 4 (💊 Treatment / No-Cure Management)');
assert(instructions.includes('🚨 Role of the Nurse'), 'Instructions require Section 5 (🚨 Role of the Nurse)');
assert(instructions.includes('Bedside Stabilization Over Academic Trivia'), 'System instructions include core educational philosophy');
assert(instructions.includes('EXPLICIT REFUSAL & DEFLECTION INSTRUCTION'), 'System instructions include deflection protocol');

// Suite 2: User Query Enrichment (Preventing rhythm-only shortcuts)
console.log('\n[Suite 2: Query Enrichment Formatter]');
const rawShortQuery = 'What rhythm is regular with narrow QRS at 180 bpm?';
const enriched = formatUserClinicalQuery(rawShortQuery);
assert(enriched.includes(rawShortQuery), 'Enriched query preserves original user text');
assert(enriched.includes('[INSTRUCTION FOR CLINICAL PRECEPTOR]:'), 'Enriched query appends preceptor instruction banner');
assert(enriched.includes('### 1. 🎯 Provisional ID'), 'Enriched query mandates Section 1');
assert(enriched.includes('### 5. 🚨 Role of the Nurse'), 'Enriched query mandates Section 5');
assert(enriched.includes('Do NOT provide just the rhythm name'), 'Explicit negative constraint against rhythm-only answers');

// Suite 2b: Idempotency on pre-structured 5-step prompts
const structuredPrompt = 'MANDATORY PRECEPTOR QUESTIONS: Something else';
assert(formatUserClinicalQuery(structuredPrompt) === structuredPrompt, 'Does not duplicate instructions if already structured');

// Suite 3: Clinical Response Section Validator (Detecting rhythm-only answers)
console.log('\n[Suite 3: Response Structure Validator]');

// Case A: The problematic symptom reported by user (rhythm name only)
const rhythmOnlyAnswer = 'This rhythm is Supraventricular Tachycardia (SVT) at 180 bpm.';
const rhythmOnlyResult = validateClinicalResponseSections(rhythmOnlyAnswer);
assert(rhythmOnlyResult.isValid === false, 'Rhythm-only answer correctly flagged as INVALID');
assert(rhythmOnlyResult.missingSections.length >= 4, 'Rhythm-only answer correctly identifies missing sections');
assert(rhythmOnlyResult.foundCount === 0, 'Found 0 valid clinical sections in one-liner');

// Case B: Partial response missing Role of the Nurse and Hemodynamic impact
const partialAnswer = `
### 1. 🎯 Provisional ID
Supraventricular Tachycardia (Rate problem).
### 2. 🔍 Differential
Sinus Tachycardia vs Atrial Flutter.
### 4. 💊 Treatment / No-Cure Management
Adenosine 6mg rapid IV push.
`;
const partialResult = validateClinicalResponseSections(partialAnswer);
assert(partialResult.isValid === false, 'Partial answer missing sections flagged as INVALID');
assert(partialResult.missingSections.includes('Hemodynamic Impact'), 'Correctly identifies missing Hemodynamic Impact');
assert(partialResult.missingSections.includes('Role of the Nurse'), 'Correctly identifies missing Role of the Nurse');

// Case C: Complete, high-standard 5-section response
const fullCompliantAnswer = `
### 1. 🎯 Provisional ID
**Supraventricular Tachycardia (PSVT)** — Primary **Rate** problem.

### 2. 🔍 Differential
1. Sinus Tachycardia (look for gradual onset and identifiable P-waves).
2. Atrial Flutter with 2:1 conduction (look for flutter waves at ~300 bpm).

### 3. 🫀 Hemodynamic Impact
Heart rate of 180 bpm drastically truncates diastolic ventricular filling time. Reduced end-diastolic volume drops stroke volume and causes blood pressure to collapse (Cardiac Output = HR × SV).

### 4. 💊 Treatment / No-Cure Management
- **Unstable:** Immediate synchronized cardioversion (50-100 J).
- **Stable:** Vagal maneuvers followed by IV Adenosine 6 mg rapid push with 20 mL saline flush; repeat 12 mg if needed.
- **Long-Term:** Catheter ablation of reentry pathway.

### 5. 🚨 Role of the Nurse
- Place patient supine, ensure high-flow oxygen and attach combo defibrillator pads.
- Establish large-bore IV access in antecubital fossa (elevate arm during Adenosine flush).
- Cycle vitals q2m and have crash cart at bedside.
`;
const fullResult = validateClinicalResponseSections(fullCompliantAnswer);
assert(fullResult.isValid === true, 'Complete 5-section preceptor response passes validation');
assert(fullResult.missingSections.length === 0, 'No missing sections in complete response');
assert(fullResult.foundCount === 5, 'All 5 sections successfully detected');

// Suite 4: Markdown Parser & HTML Renderer
console.log('\n[Suite 4: Markdown Parser & HTML Renderer]');
const rawMarkdown = `### 1. 🎯 Provisional ID\r\nVentricular Tachycardia (**Rate / Shape**).\n\n### 2. 🔍 Differential\n- SVT with aberrancy\n- Antidromic WPW\n\n\`Hold beta blockers\``;
const htmlOutput = formatMarkdownToHtml(rawMarkdown);

assert(htmlOutput.includes('<h4 class="chat-section-title">1. 🎯 Provisional ID</h4>'), 'Section 1 rendered to h4 title');
assert(htmlOutput.includes('<h4 class="chat-section-title">2. 🔍 Differential</h4>'), 'Section 2 rendered to h4 title');
assert(htmlOutput.includes('<strong>Rate / Shape</strong>'), 'Markdown bold converted to strong tag');
assert(htmlOutput.includes('<li>SVT with aberrancy</li>'), 'Bullet items converted to li tags');
assert(htmlOutput.includes('<ul>'), 'List wrapped in ul tags');
assert(htmlOutput.includes('<code class="chat-code">Hold beta blockers</code>'), 'Inline code converted to code tag');
assert(!htmlOutput.includes('\r'), 'CRLF line endings successfully normalized');

// Suite 5: Model Endpoint & Deprecation Guard
console.log('\n[Suite 5: Model Endpoint & Deprecation Guard]');
assert(GEMINI_API_ENDPOINT.includes('gemini-3.8-flash'), 'API endpoint uses current baseline model gemini-3.8-flash');
assert(!GEMINI_API_ENDPOINT.includes('gemini-2.5-flash'), 'API endpoint does NOT use deprecated model gemini-2.5-flash');

// Suite 6: Token Allowance & Truncation Guard
console.log('\n[Suite 6: Token Allowance & Truncation Guard]');
assert(DEFAULT_MAX_OUTPUT_TOKENS >= 4096, `Token allowance DEFAULT_MAX_OUTPUT_TOKENS (${DEFAULT_MAX_OUTPUT_TOKENS}) provides >= 4096 tokens`);
assert(DEFAULT_MAX_OUTPUT_TOKENS === 8192, 'Token allowance DEFAULT_MAX_OUTPUT_TOKENS is configured to standard 8192 token ceiling');

const testPayload = buildEcgTutoringPayload('Clinical scenario test with 80yo patient');
assert(testPayload.generationConfig.maxOutputTokens === 8192, 'Generated payload has maxOutputTokens set to 8192');
assert(testPayload.generationConfig.temperature === 0.2, 'Generated payload maintains clinical fidelity temperature of 0.2');
assert(testPayload.contents[0].parts[0].text.includes('[INSTRUCTION FOR CLINICAL PRECEPTOR]:'), 'Generated payload automatically enriches user query with 5 sections');

// Suite 7: Agent 1 - Clinical Diagnostic Agent (Cardiologist / EP Fellow)
console.log('\n[Suite 7: Clinical Diagnostic Agent (Cardiologist / EP Fellow)]');
import {
  getDiagnosticAgentInstructions,
  getEducatorAgentInstructions,
  buildDiagnosticPayload,
  buildEducatorPayload
} from '../js/api_service.js';

const diagInstructions = getDiagnosticAgentInstructions();
assert(typeof diagInstructions === 'string' && diagInstructions.length > 300, 'Diagnostic agent instructions generated');
assert(diagInstructions.includes('Clinical Diagnostic Agent (Cardiologist / EP Fellow)'), 'Diagnostic agent defines Cardiologist/EP Fellow persona');
assert(diagInstructions.includes('ELECTROPHYSIOLOGICAL FINDINGS & CONDUCTION MECHANICS'), 'Diagnostic agent enforces electrophysiological depth');
assert(diagInstructions.includes('DIFFERENTIAL DIAGNOSIS WITH EP CALIPER CRITERIA'), 'Diagnostic agent enforces caliper criteria');
assert(diagInstructions.includes('ADVANCED PHARMACOLOGICAL & INTERVENTIONAL REGIMEN'), 'Diagnostic agent covers pacing/ablation regimens');

const diagPayload = buildDiagnosticPayload('80yo female syncope, HR 45, irregular wide QRS 150ms, no P waves, STE V1-V3');
assert(diagPayload.contents[0].parts[0].text.includes('CLINICAL ECG INQUIRY / OBSERVATION FOR ELECTROPHYSIOLOGY EVALUATION:'), 'Diagnostic payload sets EP evaluation prompt');
assert(diagPayload.system_instruction.parts[0].text.includes('Cardiologist / EP Fellow'), 'Diagnostic payload includes specialist system instructions');
assert(diagPayload.generationConfig.temperature === 0.1, 'Diagnostic payload uses high precision temperature 0.1');

// Suite 8: Agent 2 - Plain-Language Educator Agent (Translator / Preceptor)
console.log('\n[Suite 8: Plain-Language Educator Agent (Translator / Preceptor)]');
const eduInstructions = getEducatorAgentInstructions();
assert(typeof eduInstructions === 'string' && eduInstructions.length > 300, 'Educator agent instructions generated');
assert(eduInstructions.includes('Plain-Language Educator Agent (Translator / Preceptor)'), 'Educator agent defines Translator & Preceptor persona');
assert(eduInstructions.includes('Bedside Stabilization Over Academic Trivia'), 'Educator agent enforces bedside stabilization doctrine');
assert(eduInstructions.includes('MANDATORY 101 CLINICAL RESPONSE STRUCTURE'), 'Educator agent mandates 5 sections');

const mockRawDiagnostic = `
ELECTROPHYSIOLOGICAL ASSESSMENT:
1. Conduction: Atrial fibrillation with slow ventricular response (ventricular rate ~45 bpm), secondary to high-grade AV nodal conduction impairment.
2. Morphology: Left bundle branch block pattern (QRS 150 ms) with secondary repolarization discordance in V1-V3.
3. Differential: Complete AV dissociation, acute anterior STEMI (apply modified Sgarbossa).
4. Interventions: Transcutaneous pacing pads, Atropine 1 mg, consider Epinephrine infusion, evaluate for dual-chamber permanent pacemaker (PPM).
`;

const eduPayload = buildEducatorPayload('80yo female syncope HR 45', mockRawDiagnostic);
assert(eduPayload.contents[0].parts[0].text.includes('TECHNICAL CONSULT FROM CLINICAL DIAGNOSTIC AGENT (CARDIOLOGIST / EP FELLOW):'), 'Educator payload includes raw diagnostic input from Agent 1');
assert(eduPayload.contents[0].parts[0].text.includes('Rewrite the technical electrophysiology consult above into simple, accessible American English'), 'Educator payload instructs plain-language rewriting');
assert(eduPayload.contents[0].parts[0].text.includes('### 1. 🎯 Provisional ID'), 'Educator payload requires Section 1');
assert(eduPayload.contents[0].parts[0].text.includes('### 5. 🚨 Role of the Nurse'), 'Educator payload requires Section 5');

// Suite 9: Educational UI Accordion & Deep-Dive Component
console.log('\n[Suite 9: UI Accordion & Deep-Dive Component]');
const mockTranslatedAnswer = `
### 1. 🎯 Provisional ID
Slow Atrial Fibrillation with Left Bundle Branch Block (**Rate and Shape** problem).

### 2. 🔍 Differential
- Third-degree heart block
- Anterior STEMI with bundle branch block

### 3. 🫀 Hemodynamic Impact
Heart rate is 45 bpm, dropping cardiac output (CO = HR × SV).

### 4. 💊 Treatment / No-Cure Management
Attach transcutaneous pacing pads. Prepare permanent pacemaker.

### 5. 🚨 Role of the Nurse
Place pacing pads, start large-bore IV, cycle vitals q2m, hold all beta-blockers.
`;

const validationOfTranslated = validateClinicalResponseSections(mockTranslatedAnswer);
assert(validationOfTranslated.isValid === true, 'Translated educator answer passes all 5-section requirements');

console.log(`\n======================================================`);
console.log(`CLINICAL VALIDATION SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log(`======================================================`);

if (failed > 0) {
  process.exit(1);
}

