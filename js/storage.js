/**
 * @file storage.js
 * @description Manages browser-local persistent state, student bookmarks, and secure credential handling.
 * Ensures API keys are protected and never leaked into source control or URLs.
 */

const STORAGE_KEYS = Object.freeze({
    API_KEY: 'ecg_agent_user_api_key',
    STUDY_HISTORY: 'ecg_agent_study_history',
    THEME_PREFERENCE: 'ecg_agent_theme'
});

/**
 * Stores the user's Gemini API key in session storage (recommended) or local storage.
 * @param {string} apiKey - Raw API key string entered by the nurse.
 * @param {boolean} persistAcrossSessions - If true, saves to localStorage; otherwise sessionStorage.
 */
export function saveApiKey(apiKey, persistAcrossSessions = false) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        throw new Error('Invalid API key. Key cannot be empty.');
    }
    const cleanKey = apiKey.trim();
    if (persistAcrossSessions) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, cleanKey);
    } else {
        sessionStorage.setItem(STORAGE_KEYS.API_KEY, cleanKey);
    }
}

/**
 * Retrieves the currently saved Gemini API key, checking session storage first.
 * @returns {string|null} The stored API key or null if not found.
 */
export function getStoredApiKey() {
    return sessionStorage.getItem(STORAGE_KEYS.API_KEY) || localStorage.getItem(STORAGE_KEYS.API_KEY);
}

/**
 * Permanently removes all saved API keys from browser storage to ensure complete user privacy.
 */
export function purgeStoredApiKey() {
    sessionStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
}