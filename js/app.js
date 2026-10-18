/**
 * @file app.js
 * @description Main application coordinator and event wiring for ECG Instructor AI Agent.
 * Initializes Materialize UI components, wires event handlers, and coordinates clinical modules.
 */

import { initializeMaterializeComponents, renderChatMessage, toggleLoadingSpinner, updateAnalyzerBadges } from './ui_controller.js';
import { saveApiKey, getStoredApiKey, purgeStoredApiKey } from './storage.js';
import { sendEcgTutoringQuery } from './api_service.js';
import { buildFiveStepAssessment, calculateCorrectedQtc } from './ecg_engine.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Materialize components
    initializeMaterializeComponents();

    // 2. Setup Settings / BYOK Modal
    setupSettingsModal();

    // 3. Setup Chat Tab interactions
    setupChatInterface();

    // 4. Setup 5-Step Analyzer Tab
    setupAnalyzerTab();

    // 5. Setup LITFL Reference Library
    loadReferenceLibrary();
});

/**
 * Handles API key modal initialization, validation, and storage.
 */
function setupSettingsModal() {
    const apiKeyInput = document.getElementById('api-key-input');
    const persistCheckbox = document.getElementById('persist-key-checkbox');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const purgeKeyBtn = document.getElementById('purge-key-btn');
    const keyStatusText = document.getElementById('key-status-text');

    function refreshKeyStatus() {
        const key = getStoredApiKey();
        if (key) {
            keyStatusText.textContent = 'API Key is configured and ready.';
            keyStatusText.className = 'green-text text-darken-2';
            if (apiKeyInput) apiKeyInput.value = '••••••••••••••••••••••••';
        } else {
            keyStatusText.textContent = 'No API Key configured. Please supply a Gemini API Key to use AI features.';
            keyStatusText.className = 'amber-text text-darken-3';
            if (apiKeyInput) apiKeyInput.value = '';
        }
    }

    refreshKeyStatus();

    if (saveKeyBtn) {
        saveKeyBtn.addEventListener('click', () => {
            const val = apiKeyInput ? apiKeyInput.value.trim() : '';
            if (!val || val.startsWith('••••')) {
                M.toast({ html: 'Please enter a valid Gemini API Key', classes: 'red' });
                return;
            }
            try {
                saveApiKey(val, persistCheckbox ? persistCheckbox.checked : false);
                refreshKeyStatus();
                M.toast({ html: 'API Key safely saved!', classes: 'green' });
                const modalEl = document.getElementById('settings-modal');
                const instance = M.Modal.getInstance(modalEl);
                if (instance) instance.close();
            } catch (err) {
                M.toast({ html: err.message, classes: 'red' });
            }
        });
    }

    if (purgeKeyBtn) {
        purgeKeyBtn.addEventListener('click', () => {
            purgeStoredApiKey();
            refreshKeyStatus();
            M.toast({ html: 'API Key completely purged from browser.', classes: 'grey darken-3' });
        });
    }
}

/**
 * Handles sending messages, displaying bubbles, and receiving AI preceptor guidance.
 */
function setupChatInterface() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-message-btn');
    const quickChips = document.querySelectorAll('.quick-chip');

    async function handleSendMessage(message) {
        const text = message || (chatInput ? chatInput.value.trim() : '');
        if (!text) return;

        if (chatInput) chatInput.value = '';

        // Render user message
        renderChatMessage('user', text);

        const apiKey = getStoredApiKey();
        if (!apiKey) {
            renderChatMessage('system', '⚠️ **No API Key Found.** Please click the **Settings** gear icon in the top bar to provide your Google Gemini API Key. Your key is stored solely in your local browser and never exposed.');
            return;
        }

        toggleLoadingSpinner(true);
        try {
            const aiResponse = await sendEcgTutoringQuery(text);
            renderChatMessage('agent', aiResponse);
        } catch (err) {
            renderChatMessage('system', `❌ **Preceptor Error:** ${err.message}`);
        } finally {
            toggleLoadingSpinner(false);
        }
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', () => handleSendMessage());
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptText = chip.getAttribute('data-prompt');
            if (promptText) {
                handleSendMessage(promptText);
            }
        });
    });
}

/**
 * Coordinates live calculations in the 5-step analyzer form.
 */
function setupAnalyzerTab() {
    const hrInput = document.getElementById('input-heart-rate');
    const rhythmSelect = document.getElementById('input-rhythm-reg');
    const pWaveSelect = document.getElementById('input-p-waves');
    const prInput = document.getElementById('input-pr-interval');
    const qrsInput = document.getElementById('input-qrs-duration');
    const qtInput = document.getElementById('input-qt-interval');
    const stSelect = document.getElementById('input-st-deviation');
    const tWaveSelect = document.getElementById('input-t-wave');
    const consultPreceptorBtn = document.getElementById('consult-preceptor-btn');

    function recalculate() {
        const raw = {
            heartRate: Number(hrInput ? hrInput.value : 0),
            isRegular: rhythmSelect ? rhythmSelect.value === 'regular' : true,
            pWavesPresent: pWaveSelect ? pWaveSelect.value === 'present' : false,
            prIntervalMs: Number(prInput ? prInput.value : 0),
            qrsDurationMs: Number(qrsInput ? qrsInput.value : 0),
            qtIntervalMs: Number(qtInput ? qtInput.value : 0),
            stDeviation: stSelect ? stSelect.value : 'isoelectric',
            tWaveMorphology: tWaveSelect ? tWaveSelect.value : 'normal'
        };

        const assessment = buildFiveStepAssessment(raw);
        updateAnalyzerBadges(assessment);
        return assessment;
    }

    [hrInput, rhythmSelect, pWaveSelect, prInput, qrsInput, qtInput, stSelect, tWaveSelect].forEach(el => {
        if (el) {
            el.addEventListener('input', recalculate);
            el.addEventListener('change', recalculate);
        }
    });

    if (consultPreceptorBtn) {
        consultPreceptorBtn.addEventListener('click', () => {
            const assessment = recalculate();
            const hr = hrInput ? hrInput.value : '';
            const pr = prInput ? prInput.value : '';
            const qrs = qrsInput ? qrsInput.value : '';
            const qt = qtInput ? qtInput.value : '';
            const reg = rhythmSelect ? rhythmSelect.value : '';
            const p = pWaveSelect ? pWaveSelect.value : '';
            const st = stSelect ? stSelect.value : '';
            const t = tWaveSelect ? tWaveSelect.value : '';

            const prompt = `Please review my systematic 5-Step ECG analysis:
- Heart Rate: ${hr ? hr + ' bpm' : 'not entered'} (${assessment.step1_rate.classification})
- Rhythm Regularity: ${reg}
- P-Waves: ${p}
- PR Interval: ${pr ? pr + ' ms' : 'not entered'} (${assessment.step4_prInterval.conduction})
- QRS Duration: ${qrs ? qrs + ' ms' : 'not entered'} (${assessment.step5_shapeAndIntervals.qrsWidth})
- ST Deviation: ${st}
- T-Wave / QTc: ${t}, QTc = ${assessment.step5_shapeAndIntervals.qtcMs ? assessment.step5_shapeAndIntervals.qtcMs + ' ms' : 'N/A'} (Dangerous: ${assessment.step5_shapeAndIntervals.isDangerousQtc})

What is your clinical evaluation, differential diagnosis, potential deterioration risks, and what are my priority nursing interventions to stabilize this patient?`;

            // Switch to chat tab
            const tabsInstance = M.Tabs.getInstance(document.querySelector('.tabs'));
            if (tabsInstance) {
                tabsInstance.select('tab-chat');
            }

            // Populate and trigger
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.value = prompt;
                const sendBtn = document.getElementById('send-message-btn');
                if (sendBtn) sendBtn.click();
            }
        });
    }
}

/**
 * Loads clinical ECG reference items from ecg_library.json.
 */
async function loadReferenceLibrary() {
    const listContainer = document.getElementById('reference-library-list');
    if (!listContainer) return;

    try {
        const response = await fetch('assets/data/ecg_library.json');
        if (!response.ok) throw new Error('Could not load ECG library');
        const items = await response.json();

        listContainer.innerHTML = items.map(item => `
            <div class="ref-list-item">
                <div class="ref-meta">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="ref-title">${item.name}</span>
                        <span class="badge-pill ${item.category === 'Rate' ? 'badge-stable' : 'badge-warning'}">${item.category}</span>
                    </div>
                    <div class="ref-desc">${item.summary}</div>
                    <div style="font-size:0.75rem; color:#888;">Rate: ${item.rate} | Rhythm: ${item.rhythm}</div>
                </div>
                <div>
                    <a href="${item.litfl_url}" target="_blank" rel="noopener noreferrer" class="btn-flat waves-effect blue-text" title="Open LITFL Guide">
                        <i class="material-icons">open_in_new</i>
                    </a>
                </div>
            </div>
        `).join('');
    } catch (err) {
        listContainer.innerHTML = `<div class="p-3 red-text">Failed to load reference items: ${err.message}</div>`;
    }
}
