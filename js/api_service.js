/**
 * @file api_service.js
 * @description Manages outbound communication with the Google Gemini API (or GCP Proxy).
 * Handles API key retrieval from safe storage and enforces clinical prompt guardrails.
 */

import { getStoredApiKey } from './storage.js';

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Constructs the clinical preceptor system instruction that defines the AI agent's persona.
 * @returns {string} Fully engineered system instructions.
 */
export function getSystemInstructions() {
    return `You are the "ECG Clinical Instructor AI Preceptor," a compassionate, expert cardiology nurse educator.
Your mission is to teach nurses during their study time how to:
1. Systematically interpret ECGs using the 5-step method (Rate, Rhythm, P-waves, PR interval, QRS/ST/T/QTc).
2. Differentiate between "Rate" problems (rhythm strips) and "Shape" problems (12-lead waveforms).
3. Anticipate evidence-based medical and pharmacologic treatments.
4. Detail the nurse's proactive role in stabilizing the patient if they become hemodynamically unstable (e.g., hypotension, altered mentation, pulmonary edema, chest pain).
Tone: Supportive, clear American English, clinical, structured with bold key concepts. Always spell out medical abbreviations on first reference with parentheses (e.g., Atrioventricular (AV) block). Do not provide bedside diagnostic disclaimers that stall learning; focus on didactic empowerment.`;
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

    const payload = {
        system_instruction: {
            parts: [{ text: getSystemInstructions() }]
        },
        contents: [
            {
                role: 'user',
                parts: [{ text: userMessage }]
            }
        ],
        generationConfig: {
            temperature: 0.2, // Low temperature for high factual clinical fidelity
            topP: 0.95,
            maxOutputTokens: 1200
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