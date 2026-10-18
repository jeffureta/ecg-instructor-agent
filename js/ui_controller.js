/**
 * @file ui_controller.js
 * @description Manages Materialize CSS components, dynamic chat rendering,
 * and user alert badges. Adheres to strict DOM manipulation separation.
 */

/**
 * Initializes all Materialize CSS dynamic components (tabs, modals, tooltips, sidenav, selects).
 */
export function initializeMaterializeComponents() {
    const tabs = document.querySelectorAll('.tabs');
    if (tabs.length) {
        M.Tabs.init(tabs, { swipeable: false });
    }

    const modals = document.querySelectorAll('.modal');
    if (modals.length) {
        M.Modal.init(modals, { dismissible: true });
    }

    const sidenavs = document.querySelectorAll('.sidenav');
    if (sidenavs.length) {
        M.Sidenav.init(sidenavs);
    }

    const selects = document.querySelectorAll('select');
    if (selects.length) {
        M.FormSelect.init(selects);
    }

    const tooltips = document.querySelectorAll('.tooltipped');
    if (tooltips.length) {
        M.Tooltip.init(tooltips);
    }

    const collapsibles = document.querySelectorAll('.collapsible');
    if (collapsibles.length) {
        M.Collapsible.init(collapsibles);
    }
}

/**
 * Creates and appends a structured chat bubble to the study discussion thread.
 * @param {'user' | 'agent' | 'system'} sender - The message origin.
 * @param {string} messageText - The formatted clinical message text.
 */
export function renderChatMessage(sender, messageText) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.className = `chat-row ${sender === 'user' ? 'user-align' : sender === 'system' ? 'system-align' : 'agent-align'}`;

    const card = document.createElement('div');
    let colorClass = 'white grey-text text-darken-4';
    if (sender === 'user') {
        colorClass = 'blue darken-2 white-text';
    } else if (sender === 'system') {
        colorClass = 'amber lighten-5 amber-text text-darken-4';
    }
    card.className = `card-panel z-depth-1 chat-card ${colorClass}`;

    // Convert markdown to clean HTML
    let formattedHtml = messageText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="chat-code">$1</code>')
        .replace(/\n\n/g, '<p></p>')
        .replace(/\n- (.*?)/g, '<li>$1</li>');

    if (formattedHtml.includes('<li>')) {
        formattedHtml = formattedHtml.replace(/<li>(.*?)(?=<li>|$|<p>)/gs, '<ul><li>$1</ul>');
    }

    card.innerHTML = formattedHtml;
    bubbleWrapper.appendChild(card);
    container.appendChild(bubbleWrapper);
    container.scrollTop = container.scrollHeight;
}

/**
 * Displays an active loading spinner while waiting for the AI response.
 * @param {boolean} isLoading - State of the network request.
 */
export function toggleLoadingSpinner(isLoading) {
    const spinnerElement = document.getElementById('ai-loading-indicator');
    if (spinnerElement) {
        spinnerElement.style.display = isLoading ? 'flex' : 'none';
    }
}

/**
 * Updates clinical badge states in the 5-step analyzer tab.
 * @param {Object} assessment - Output from buildFiveStepAssessment.
 */
export function updateAnalyzerBadges(assessment) {
    const rateBadge = document.getElementById('rate-badge');
    const prBadge = document.getElementById('pr-badge');
    const qrsBadge = document.getElementById('qrs-badge');
    const qtcBadge = document.getElementById('qtc-badge');

    if (rateBadge && assessment.step1_rate) {
        const rateClass = assessment.step1_rate.classification;
        rateBadge.textContent = `${assessment.step1_rate.value ? assessment.step1_rate.value + ' bpm • ' : ''}${rateClass.toUpperCase()}`;
        rateBadge.className = `badge-pill ${rateClass === 'normal' ? 'badge-stable' : rateClass === 'bradycardia' ? 'badge-warning' : 'badge-danger'}`;
    }

    if (prBadge && assessment.step4_prInterval) {
        const prClass = assessment.step4_prInterval.conduction;
        prBadge.textContent = `${assessment.step4_prInterval.value ? assessment.step4_prInterval.value + ' ms • ' : ''}${prClass.toUpperCase()}`;
        prBadge.className = `badge-pill ${prClass === 'normal' ? 'badge-stable' : 'badge-danger'}`;
    }

    if (qrsBadge && assessment.step5_shapeAndIntervals) {
        const qrsClass = assessment.step5_shapeAndIntervals.qrsWidth;
        qrsBadge.textContent = `${assessment.step5_shapeAndIntervals.qrsDurationMs ? assessment.step5_shapeAndIntervals.qrsDurationMs + ' ms • ' : ''}${qrsClass.toUpperCase()}`;
        qrsBadge.className = `badge-pill ${qrsClass === 'narrow' ? 'badge-stable' : 'badge-danger'}`;
    }

    if (qtcBadge && assessment.step5_shapeAndIntervals) {
        const qtc = assessment.step5_shapeAndIntervals.qtcMs;
        const isDangerous = assessment.step5_shapeAndIntervals.isDangerousQtc;
        if (qtc) {
            qtcBadge.textContent = `${qtc} ms • ${isDangerous ? 'CRITICAL (>500ms)' : qtc > 450 ? 'BORDERLINE' : 'NORMAL'}`;
            qtcBadge.className = `badge-pill ${isDangerous ? 'badge-danger' : qtc > 450 ? 'badge-warning' : 'badge-stable'}`;
        } else {
            qtcBadge.textContent = 'Awaiting QT/HR';
            qtcBadge.className = 'badge-pill badge-neutral';
        }
    }
}