/**
 * @file api_service.js
 * @description Manages outbound communication with the Google Gemini API (or GCP Proxy).
 * Implements the Two-Agent Clinical Architecture:
 * 1. Clinical Diagnostic Agent (Cardiologist / EP Fellow) - generates technical electrophysiology.
 * 2. Plain-Language Educator Agent (Translator / Preceptor) - rewrites technical output into simple American English.
 */

import { getStoredApiKey } from './storage.js';

export const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';
export const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

export const MANDATORY_CLINICAL_SECTIONS = Object.freeze([
    { id: 'provisional_id', title: 'Provisional ID', pattern: /Provisional\s*ID/i },
    { id: 'differential', title: 'Differential', pattern: /Differential/i },
    { id: 'hemodynamic_impact', title: 'Hemodynamic Impact', pattern: /Hemodynamic\s*Impact/i },
    { id: 'treatment', title: 'Treatment / No-Cure Management', pattern: /Treatment|Management/i },
    { id: 'nursing_role', title: 'Role of the Nurse', pattern: /Role\s*of\s*the\s*Nurse|Nursing/i }
]);

/**
 * System instruction for Agent 1: Clinical Diagnostic Agent (Cardiologist / EP Fellow).
 * Generates exhaustive electrophysiology, conduction mechanics, vector analysis, and advanced interventions.
 * @returns {string} System instructions for the diagnostic specialist.
 */
export function getDiagnosticAgentInstructions() {
    return `You are the "Clinical Diagnostic Agent (Cardiologist / EP Fellow)," an expert academic cardiologist and cardiac electrophysiology subspecialist.

CORE MISSION:
Analyze raw user ECG descriptions, 5-step interval metrics, and clinical telemetry observations with extreme clinical and electrophysiological precision.

ANALYTICAL RIGOR REQUIRED:
1. ELECTROPHYSIOLOGICAL FINDINGS & CONDUCTION MECHANICS:
   - Detail rate, rhythm regularity, P-wave axes, PR/AH/HV conduction, QRS duration/morphology/axis, ST-T vectors, and corrected QT (QTc via Bazett/Fridericia).
   - Evaluate specific conduction abnormalities (e.g., AV nodal block vs. infranodal His-Purkinje block, bundle branch blocks with modified Sgarbossa criteria, accessory pathways, re-entrant circuits).
2. FAILURE MODE CLASSIFICATION:
   - Explicitly classify the pathology as primarily a "RATE" (timing/automaticity/conduction) or "SHAPE" (morphology/infarction/transmembrane electrolyte) problem.
3. DIFFERENTIAL DIAGNOSIS WITH EP CALIPER CRITERIA:
   - Provide top 2-3 differentials with caliper-level criteria (e.g., marching P-waves in Complete Heart Block vs. variable PR in Mobitz I; SVT with aberrancy vs. VT via Brugada/Vereckei algorithms).
4. HEMODYNAMIC PATHOPHYSIOLOGY:
   - Explain exact hemodynamic failure mechanics: loss of atrial systolic contribution ("atrial kick"), shortened diastolic filling intervals, ventricular dyssynchrony, stroke volume reduction, and forward flow failure.
5. ADVANCED PHARMACOLOGICAL & INTERVENTIONAL REGIMEN:
   - Contrast immediate life-support interventions for hemodynamically unstable presentation (electrical cardioversion joules, transcutaneous/transvenous pacing thresholds, chronotropic pressors) versus hemodynamically stable medical management.
   - Detail long-term electrophysiological trajectory (permanent pacemaker [PPM], ICD indications, electrophysiology study and catheter radiofrequency/cryo ablation).

TONE & DEPTH:
Authoritative, highly technical, clinically exhaustive, using precise cardiology and electrophysiology terminology.`;
}

/**
 * System instruction for Agent 2: Plain-Language Educator Agent (Translator / Preceptor).
 * Intercepts technical electrophysiology output and rewrites it into simple American English for nurses.
 * @returns {string} System instructions for the plain-language preceptor.
 */
export function getEducatorAgentInstructions() {
    return `You are the "Plain-Language Educator Agent (Translator / Preceptor)," an expert cardiology nurse educator and clinical preceptor specializing in medical translation.

CORE MISSION:
Your educational doctrine is "Bedside Stabilization Over Academic Trivia." You receive technical electrophysiology consults from the Clinical Diagnostic Agent (Cardiologist / EP Fellow) and rewrite them into simple, crystal-clear American English for bedside nurses and nursing students.

OPERATIONAL BOUNDARIES & GUARDRAILS (STRICT):
You are strictly an educational preceptor for electrocardiograms (ECGs), cardiac rhythm analysis, hemodynamic stabilization, and acute cardiac pharmacology.
You must NOT answer:
1. General non-cardiac medical inquiries (e.g., dermatology, neurology, gastrointestinal, oncology, infections).
2. Personal health symptom checks or personal medical diagnostic requests.
3. Computer programming, coding, script debugging, or technical software requests.
4. General non-clinical trivia, political discussions, or creative writing.

EXPLICIT REFUSAL & DEFLECTION INSTRUCTION:
If the user asks an off-topic question, asks for general medical diagnosis, personal health advice, or computer coding assistance, you MUST immediately, politely, and firmly decline using this exact spirit:
"I am the ECG Clinical Instructor Preceptor, specifically designed to teach nursing students and acute care staff how to interpret electrocardiograms, assess hemodynamic impact, and stabilize cardiac emergencies. I cannot provide general medical advice, diagnose non-cardiac conditions, answer personal health questions, or assist with coding/programming requests. Let's redirect our session back to rhythm interpretation, 12-lead waveforms, or acute bedside nursing stabilization."

MANDATORY 101 CLINICAL RESPONSE STRUCTURE (Strictly use these 5 sections):

### 1. 🎯 Provisional ID
- Clearly name the suspected rhythm in plain language and classify it as a **"Rate"** (timing/speed) or **"Shape"** (morphology/infarction/electrolyte) problem.

### 2. 🔍 Differential
- State the top 2-3 differential diagnoses.
- Explain the exact bedside caliper/strip rule to tell them apart in simple everyday terms (e.g., marching P-waves in Complete Heart Block vs. progressive PR delay in Mobitz I).

### 3. 🫀 Hemodynamic Impact
- Explain in simple 101 terms how this abnormality impairs blood pressure and tissue perfusion (Cardiac Output = Heart Rate × Stroke Volume, loss of diastolic filling time, loss of atrial kick, or loss of contracting muscle).

### 4. 💊 Treatment / No-Cure Management
Detail anticipated evidence-based treatments in plain language, clearly contrasting:
- **If Hemodynamically Unstable** (Hypotension SBP <90 / MAP <65, altered mental status, chest pain, shock): Immediate electrical cardioversion, transcutaneous pacing, unsynchronized defibrillation, or emergency pressors (Epinephrine/Dopamine drip).
- **If Hemodynamically Stable:** Pharmacologic interventions (Adenosine, Amiodarone, Diltiazem/Metoprolol), electrolyte replacement, or urgent cath lab activation.
- **Long-Term / No-Cure Management:** If there is no quick drug cure (e.g., 3rd Degree AV Block, chronic sick sinus syndrome, fixed bundle branch blocks), explain permanent pacemaker (PPM) placement, EP ablation, or palliative symptom management.

### 5. 🚨 Role of the Nurse
- Immediate bedside stabilization priorities initiated before orders arrive (attaching combo pacing pads, ensuring large-bore IV access, cycling vitals q2-3m, crash cart retrieval).
- Critical medication HOLD orders (e.g., holding beta-blockers/CCBs in heart blocks; holding nitroglycerin in right ventricular infarction).

TONE:
Supportive, simple American English, direct, structured with bold concepts. Avoid dense medical jargon; if a clinical term is essential, immediately explain what it means in plain English. Empower the nurse to protect patient stability.`;
}

/**
 * Backward compatibility alias for default preceptor system instructions.
 * @returns {string} Preceptor system instructions.
 */
export function getSystemInstructions() {
    return getEducatorAgentInstructions();
}

/**
 * Validates whether an AI preceptor response contains all 5 required clinical sections.
 * @param {string} text - Raw text from the AI preceptor.
 * @returns {{ isValid: boolean, missingSections: string[], foundCount: number }} Validation summary.
 */
export function validateClinicalResponseSections(text) {
    if (typeof text !== 'string' || !text.trim()) {
        return {
            isValid: false,
            missingSections: MANDATORY_CLINICAL_SECTIONS.map(s => s.title),
            foundCount: 0
        };
    }

    const missingSections = [];
    let foundCount = 0;

    for (const section of MANDATORY_CLINICAL_SECTIONS) {
        if (section.pattern.test(text)) {
            foundCount++;
        } else {
            missingSections.push(section.title);
        }
    }

    return {
        isValid: missingSections.length === 0,
        missingSections,
        foundCount
    };
}

/**
 * Enriches user inquiries to explicitly enforce the 5-step clinical response structure.
 * @param {string} rawQuery - The user's typed question or clinical scenario.
 * @returns {string} Enriched user query.
 */
export function formatUserClinicalQuery(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') return '';
    const trimmed = rawQuery.trim();

    if (trimmed.includes('MANDATORY PRECEPTOR QUESTIONS:')) {
        return trimmed;
    }

    return `${trimmed}

[INSTRUCTION FOR CLINICAL PRECEPTOR]:
Please analyze this clinical telemetry inquiry and structure your complete response using all 5 mandatory sections:
### 1. 🎯 Provisional ID
### 2. 🔍 Differential
### 3. 🫀 Hemodynamic Impact
### 4. 💊 Treatment / No-Cure Management
### 5. 🚨 Role of the Nurse
Do NOT provide just the rhythm name or an abbreviated summary. Explain the hemodynamic mechanism and nursing stabilization priorities in simple American English.`;
}

/**
 * Builds the payload for Agent 1 (Clinical Diagnostic Agent - Cardiologist / EP Fellow).
 * @param {string} userMessage - Nurse query or synthesized 5-step observations.
 * @param {number} [maxTokens=DEFAULT_MAX_OUTPUT_TOKENS] - Maximum output tokens allowance.
 * @returns {Object} JSON payload ready for Gemini API.
 */
export function buildDiagnosticPayload(userMessage, maxTokens = DEFAULT_MAX_OUTPUT_TOKENS) {
    const trimmed = typeof userMessage === 'string' ? userMessage.trim() : '';
    const diagnosticPrompt = `CLINICAL ECG INQUIRY / OBSERVATION FOR ELECTROPHYSIOLOGY EVALUATION:
${trimmed}

Please generate an exhaustive electrophysiology and clinical diagnostic consult. Analyze conduction mechanics, rate vs shape failure modes, differential diagnoses with EP calipers, hemodynamic collapse dynamics, and advanced pharmacology/pacing/ablation regimens.`;

    return {
        system_instruction: {
            parts: [{ text: getDiagnosticAgentInstructions() }]
        },
        contents: [
            {
                role: 'user',
                parts: [{ text: diagnosticPrompt }]
            }
        ],
        generationConfig: {
            temperature: 0.1, // High precision for electrophysiology analysis
            topP: 0.95,
            maxOutputTokens: maxTokens
        }
    };
}

/**
 * Builds the payload for Agent 2 (Plain-Language Educator Agent - Translator / Preceptor).
 * @param {string} userMessage - Original nurse query or clinical presentation.
 * @param {string} rawDiagnosticOutput - Technical EP output generated by Agent 1.
 * @param {number} [maxTokens=DEFAULT_MAX_OUTPUT_TOKENS] - Maximum output tokens allowance.
 * @returns {Object} JSON payload ready for Gemini API.
 */
export function buildEducatorPayload(userMessage, rawDiagnosticOutput, maxTokens = DEFAULT_MAX_OUTPUT_TOKENS) {
    const trimmedUser = typeof userMessage === 'string' ? userMessage.trim() : '';
    const trimmedDiagnostic = typeof rawDiagnosticOutput === 'string' ? rawDiagnosticOutput.trim() : '';

    const educatorPrompt = `ORIGINAL NURSE INQUIRY & CLINICAL PRESENTATION:
${trimmedUser}

TECHNICAL CONSULT FROM CLINICAL DIAGNOSTIC AGENT (CARDIOLOGIST / EP FELLOW):
${trimmedDiagnostic}

[TRANSLATOR & PRECEPTOR INSTRUCTION]:
Rewrite the technical electrophysiology consult above into simple, accessible American English for bedside nurses and students.
You MUST format your entire response using all 5 mandatory sections:
### 1. 🎯 Provisional ID
### 2. 🔍 Differential
### 3. 🫀 Hemodynamic Impact
### 4. 💊 Treatment / No-Cure Management
### 5. 🚨 Role of the Nurse

Demystify all technical terms, explain why blood pressure crashes (CO = HR × SV) in 101 language, and detail immediate bedside stabilization priorities.`;

    return {
        system_instruction: {
            parts: [{ text: getEducatorAgentInstructions() }]
        },
        contents: [
            {
                role: 'user',
                parts: [{ text: educatorPrompt }]
            }
        ],
        generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            maxOutputTokens: maxTokens
        }
    };
}

/**
 * Builds the legacy single-agent payload (retained for backward compatibility).
 * @param {string} userMessage - Nurse query or synthesized 5-step observations.
 * @param {number} [maxTokens=DEFAULT_MAX_OUTPUT_TOKENS] - Maximum output tokens allowance.
 * @returns {Object} JSON payload ready for Gemini API.
 */
export function buildEcgTutoringPayload(userMessage, maxTokens = DEFAULT_MAX_OUTPUT_TOKENS) {
    const enrichedMessage = formatUserClinicalQuery(userMessage);
    return {
        system_instruction: {
            parts: [{ text: getSystemInstructions() }]
        },
        contents: [
            {
                role: 'user',
                parts: [{ text: enrichedMessage }]
            }
        ],
        generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            maxOutputTokens: maxTokens
        }
    };
}

/**
 * Low-level utility to send a prepared payload to Gemini API.
 * @param {Object} payload - Gemini request payload.
 * @param {string} apiKey - Google Gemini API Key.
 * @returns {Promise<string>} Generated text candidate.
 */
async function callGeminiApi(payload, apiKey) {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errorDetails}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];

    if (candidate?.finishReason === 'MAX_TOKENS') {
        console.warn('Warning: Gemini API reached maximum token allowance (MAX_TOKENS). The response may be truncated.');
    }

    const textOutput = candidate?.content?.parts?.[0]?.text;
    if (!textOutput) {
        throw new Error('Received an empty response from the AI service.');
    }
    return textOutput;
}

/**
 * Executes Agent 1: Clinical Diagnostic Agent (Cardiologist / EP Fellow).
 * @param {string} userMessage - User ECG input or 5-step measurements.
 * @param {string} [apiKeyOverride=null] - Optional API key override.
 * @returns {Promise<string>} Raw technical electrophysiology consult.
 */
export async function executeDiagnosticAgent(userMessage, apiKeyOverride = null) {
    const apiKey = resolveApiKey(apiKeyOverride);
    const payload = buildDiagnosticPayload(userMessage, DEFAULT_MAX_OUTPUT_TOKENS);
    return await callGeminiApi(payload, apiKey);
}

/**
 * Executes Agent 2: Plain-Language Educator Agent (Translator / Preceptor).
 * @param {string} userMessage - Original user ECG query.
 * @param {string} rawDiagnosticOutput - Technical EP output from Agent 1.
 * @param {string} [apiKeyOverride=null] - Optional API key override.
 * @returns {Promise<string>} Plain-language bedside nursing guidance in simple American English.
 */
export async function executeEducatorAgent(userMessage, rawDiagnosticOutput, apiKeyOverride = null) {
    const apiKey = resolveApiKey(apiKeyOverride);
    const payload = buildEducatorPayload(userMessage, rawDiagnosticOutput, DEFAULT_MAX_OUTPUT_TOKENS);
    return await callGeminiApi(payload, apiKey);
}

/**
 * Orchestrates the full Two-Agent Clinical Pipeline:
 * [User ECG Input] -> [Agent 1: Cardiologist / EP Fellow] -> [Agent 2: Plain-Language Educator Agent] -> [UI]
 * 
 * @param {string} userMessage - User ECG input or 5-step measurements.
 * @param {string} [apiKeyOverride=null] - Optional API key override.
 * @param {Function} [onProgress=null] - Callback receiving status updates { stage: string, label: string }.
 * @returns {Promise<{ plainLanguageText: string, rawDiagnosticText: string }>} Pipeline result.
 */
export async function runTwoAgentClinicalPipeline(userMessage, apiKeyOverride = null, onProgress = null) {
    const apiKey = resolveApiKey(apiKeyOverride);

    // Stage 1: Clinical Diagnostic Agent (Cardiologist / EP Fellow)
    if (typeof onProgress === 'function') {
        onProgress({ stage: 'diagnosing', label: 'Consulting Cardiologist / EP Fellow on electrophysiology...' });
    }
    const rawDiagnosticText = await executeDiagnosticAgent(userMessage, apiKey);

    // Stage 2: Plain-Language Educator Agent (Translator / Preceptor)
    if (typeof onProgress === 'function') {
        onProgress({ stage: 'translating', label: 'Translating technical findings into simple bedside guidance...' });
    }
    const plainLanguageText = await executeEducatorAgent(userMessage, rawDiagnosticText, apiKey);

    return {
        plainLanguageText,
        rawDiagnosticText
    };
}

/**
 * Sends a structured ECG query through the clinical pipeline.
 * Fully backward-compatible: returns the plain-language guidance string.
 * Also attaches .rawDiagnosticText to the returned string primitive wrapper for callers needing raw EP data.
 * 
 * @param {string} userMessage - Nurse query or synthesized 5-step observations.
 * @param {string} [apiKeyOverride=null] - Optional API key override.
 * @param {Function} [onProgress=null] - Optional progress callback.
 * @returns {Promise<string>} Plain-language clinical guidance.
 */
export async function sendEcgTutoringQuery(userMessage, apiKeyOverride = null, onProgress = null) {
    const result = await runTwoAgentClinicalPipeline(userMessage, apiKeyOverride, onProgress);
    
    // Create a String object so callers expecting a string get one, but can also inspect rawDiagnosticText
    const strObj = new String(result.plainLanguageText);
    strObj.rawDiagnosticText = result.rawDiagnosticText;
    return strObj.toString();
}

/**
 * Resolves the active Gemini API key from explicit override, storage, or environment.
 * @param {string} [apiKeyOverride=null] - Explicit key.
 * @returns {string} Resolved API key.
 */
function resolveApiKey(apiKeyOverride = null) {
    const apiKey = apiKeyOverride || 
        getStoredApiKey() || 
        (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : null);

    if (!apiKey) {
        throw new Error('No API key detected. Please configure your Gemini API Key in the settings modal.');
    }
    return apiKey;
}