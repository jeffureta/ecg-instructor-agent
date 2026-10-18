/**
 * @file api_service.js
 * @description Manages outbound communication with the Google Gemini API (or GCP Proxy).
 * Handles API key retrieval from safe storage and enforces clinical prompt guardrails.
 */

import { getStoredApiKey } from './storage.js';

export const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

/**
 * Constructs the clinical preceptor system instruction that defines the AI agent's persona.
 * @returns {string} Fully engineered system instructions.
 */
export function getSystemInstructions() {
    return `You are the "ECG Clinical Instructor AI Preceptor," an authoritative, compassionate expert cardiology nurse educator and acute care clinical specialist.

EDUCATIONAL PHILOSOPHY:
Your teaching doctrine is "Bedside Stabilization Over Academic Trivia." When a nurse presents an ECG observation, clinical scenario, or 5-Step analysis, give a brief "101" answer in Simple American English.

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

MANDATORY 101 CLINICAL RESPONSE STRUCTURE (Use these 5 clear sections for all ECG inquiries):

### 1. 🎯 Provisional ID
- Name the primary suspected rhythm clearly and classify whether this is primarily a **"Rate"** (timing/conduction) or **"Shape"** (morphology/infarction/electrolyte) problem.

### 2. 🔍 Differential
- State the top 2-3 differential diagnoses.
- Explain the exact bedside caliper/strip rule to tell them apart (e.g., marching P-waves in Complete Heart Block vs. progressive PR delay in Mobitz I).

### 3. 🫀 Hemodynamic Impact
- Explain in simple 101 terms how this abnormality impairs blood pressure and tissue perfusion (Cardiac Output = Heart Rate × Stroke Volume, loss of diastolic filling time, loss of atrial kick, or loss of contracting muscle).

### 4. 💊 Treatment / No-Cure Management
Detail anticipated evidence-based treatments, clearly contrasting:
- **If Hemodynamically Unstable** (Hypotension SBP <90 / MAP <65, altered mental status, chest pain, shock): Immediate electrical cardioversion, transcutaneous pacing, unsynchronized defibrillation, or emergency pressors (Epinephrine/Dopamine drip).
- **If Hemodynamically Stable:** Pharmacologic interventions (Adenosine, Amiodarone, Diltiazem/Metoprolol), electrolyte replacement, or urgent cath lab activation.
- **Long-Term / No-Cure Management:** If there is no quick pharmacologic cure (e.g., 3rd Degree AV Block, chronic sick sinus syndrome, fixed bundle branch blocks), explain permanent pacemaker (PPM) placement, EP ablation, or palliative symptom management.

### 5. 🚨 Role of the Nurse
- Immediate bedside stabilization priorities before orders arrive (attaching combo pacing pads, ensuring large-bore IV access, cycling vitals q2-3m, crash cart retrieval).
- Critical medication HOLD orders (e.g., holding beta-blockers/CCBs in heart blocks; holding nitroglycerin in right ventricular infarction).

TONE:
Supportive, simple American English, direct, structured with bold concepts. Spell out medical abbreviations on first reference. Always empower the nurse to think ahead and protect patient stability.`;
}

export const MANDATORY_CLINICAL_SECTIONS = Object.freeze([
    { id: 'provisional_id', title: 'Provisional ID', pattern: /Provisional\s*ID/i },
    { id: 'differential', title: 'Differential', pattern: /Differential/i },
    { id: 'hemodynamic_impact', title: 'Hemodynamic Impact', pattern: /Hemodynamic\s*Impact/i },
    { id: 'treatment', title: 'Treatment / No-Cure Management', pattern: /Treatment|Management/i },
    { id: 'nursing_role', title: 'Role of the Nurse', pattern: /Role\s*of\s*the\s*Nurse|Nursing/i }
]);

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
 * Prevents the AI model from shortcutting into a simple one-sentence rhythm identification.
 * @param {string} rawQuery - The user's typed question or clinical scenario.
 * @returns {string} Enriched user query ensuring strict compliance with clinical sections.
 */
export function formatUserClinicalQuery(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') return '';
    const trimmed = rawQuery.trim();

    // If the prompt already has the structured 5-step template, preserve it while ensuring section instructions
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
 * Sends a structured ECG query to the Gemini API with system instructions and returns the advice.
 * @param {string} userMessage - Nurse query or synthesized 5-step observations.
 * @returns {Promise<string>} The agent's formatted clinical guidance.
 */
export async function sendEcgTutoringQuery(userMessage) {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
        throw new Error('No API key detected. Please configure your Gemini API Key in the settings modal.');
    }

    const enrichedMessage = formatUserClinicalQuery(userMessage);

    const payload = {
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
            temperature: 0.2, // Low temperature for high factual clinical fidelity
            topP: 0.95,
            maxOutputTokens: 2048 // Sufficient headroom for complete 5-section response without truncation
        }
    };

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
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) {
        throw new Error('Received an empty response from the AI preceptor service.');
    }
    return textOutput;
}