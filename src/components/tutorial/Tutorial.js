/**
 * ============================================================================
 * STUDIO ANALYTICS - INTERACTIVE TUTORIAL SYSTEM
 * ============================================================================
 * Professional onboarding tutorial component
 * Enterprise-grade user experience
 * 
 * @author NexusApp Studio
 * @version 3.0.0
 * ============================================================================
 */

const Tutorial = (function() {
    'use strict';

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    const STORAGE_KEY = 'studio_tutorial_completed';
    const STORAGE_STEP_KEY = 'studio_tutorial_current_step';
    
    const TUTORIAL_STEPS = [
        {
            id: 'welcome',
            title: '¡Bienvenido a Studio Analytics!',
            content: 'Te guiaremos paso a paso para que aproveches al máximo nuestra plataforma de análisis profesional de Instagram.',
            target: null, // No target, centered
            position: 'center',
            icon: '👋',
            highlight: false
        },
        {
            id: 'upload',
            title: 'Subir tus Archivos',
            content: 'Primero, necesitas subir tus archivos JSON de Instagram. Puedes descargarlos desde tu perfil de Instagram en Configuración > Seguridad > Descargar datos.',
            target: '#uploadSection',
            position: 'bottom',
            icon: '📤',
            highlight: true,
            action: {
                type: 'scroll',
                target: '#uploadSection'
            }
        },
        {
            id: 'followers-file',
            title: 'Archivo de Seguidores',
            content: 'Haz clic aquí para seleccionar tu archivo de seguidores (followers_1.json). Este archivo contiene la lista de todas las personas que te siguen.',
            target: '#followersUploadBtn',
            position: 'right',
            icon: '👥',
            highlight: true
        },
        {
            id: 'following-file',
            title: 'Archivo de Seguidos',
            content: 'Ahora selecciona tu archivo de seguidos (following.json). Este archivo contiene la lista de todas las personas que sigues.',
            target: '#followingUploadBtn',
            position: 'right',
            icon: '➕',
            highlight: true
        },
        {
            id: 'analyze',
            title: 'Analizar Datos',
            content: 'Una vez que hayas subido ambos archivos, haz clic en "Analizar" para procesar tu información. Nuestro algoritmo de IA detectará bots, calculará métricas y generará insights profesionales.',
            target: '#analyzeBtn',
            position: 'top',
            icon: '🔍',
            highlight: true
        },
        {
            id: 'dashboard',
            title: 'Tu Dashboard',
            content: 'Aquí verás todas tus métricas: total de seguidores, seguidos, no te siguen de vuelta, engagement rate, y más. Todo presentado de forma visual y profesional.',
            target: '#dashboardSection',
            position: 'top',
            icon: '📊',
            highlight: true,
            action: {
                type: 'scroll',
                target: '#dashboardSection'
            }
        },
        {
            id: 'bot-detection',
            title: 'Detección de Bots',
            content: 'Nuestro sistema utiliza 15+ algoritmos de IA para detectar cuentas bot con 95% de precisión. Los bots se marcan automáticamente en tus listas.',
            target: '#botsTab',
            position: 'bottom',
            icon: '🤖',
            highlight: true
        },
        {
            id: 'export',
            title: 'Exportar Resultados',
            content: 'Puedes exportar tus análisis en 7 formatos diferentes: PDF, Excel, CSV, JSON, HTML, TXT y Markdown. Perfecto para reportes profesionales.',
            target: '#exportBtn',
            position: 'left',
            icon: '📥',
            highlight: true
        },
        {
            id: 'history',
            title: 'Historial',
            content: 'Todos tus análisis se guardan automáticamente en tu historial. Puedes compararlos y ver la evolución de tu cuenta a lo largo del tiempo.',
            target: '#historySection',
            position: 'top',
            icon: '📜',
            highlight: true,
            action: {
                type: 'scroll',
                target: '#historySection'
            }
        },
        {
            id: 'complete',
            title: '¡Todo Listo!',
            content: 'Ya conoces las funciones principales de Studio Analytics. Recuerda que tu información es 100% privada y nunca se comparte con terceros. ¡Disfruta del análisis profesional!',
            target: null,
            position: 'center',
            icon: '🎉',
            highlight: false
        }
    ];

    // ========================================================================
    // STATE
    // ========================================================================

    let currentStep = 0;
    let isActive = false;
    let tutorialOverlay = null;
    let tutorialTooltip = null;
    let highlightElement = null;

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * Initialize tutorial system
     */
    function init() {
        // Check if tutorial was already completed
        if (hasCompletedTutorial()) {
            console.log('[Tutorial] Already completed');
            return;
        }

        // Check if there's a saved step
        const savedStep = getSavedStep();
        if (savedStep !== null) {
            currentStep = savedStep;
        }

        // Create tutorial elements
        createTutorialElements();

        // Show tutorial after a short delay
        setTimeout(() => {
            start();
        }, 2000);
    }

    /**
     * Create tutorial DOM elements
     */
    function createTutorialElements() {
        // Create overlay
        tutorialOverlay = document.createElement('div');
        tutorialOverlay.id = 'tutorialOverlay';
        tutorialOverlay.className = 'tutorial-overlay';
        tutorialOverlay.style.display = 'none';

        // Create tooltip
        tutorialTooltip = document.createElement('div');
        tutorialTooltip.id = 'tutorialTooltip';
        tutorialTooltip.className = 'tutorial-tooltip';

        // Create highlight element
        highlightElement = document.createElement('div');
        highlightElement.id = 'tutorialHighlight';
        highlightElement.className = 'tutorial-highlight';

        // Append to body
        document.body.appendChild(tutorialOverlay);
        document.body.appendChild(highlightElement);
        document.body.appendChild(tutorialTooltip);

        // Event listeners
        tutorialOverlay.addEventListener('click', handleOverlayClick);
    }

    // ========================================================================
    // TUTORIAL CONTROL
    // ========================================================================

    /**
     * Start tutorial
     */
    function start() {
        if (isActive) return;

        isActive = true;
        currentStep = 0;
        tutorialOverlay.style.display = 'block';
        
        showStep(currentStep);
    }

    /**
     * Show specific step
     * @param {number} stepIndex - Step index
     */
    function showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= TUTORIAL_STEPS.length) {
            complete();
            return;
        }

        const step = TUTORIAL_STEPS[stepIndex];
        currentStep = stepIndex;

        // Save progress
        saveStep(stepIndex);

        // Execute step action if any
        if (step.action) {
            executeAction(step.action);
        }

        // Update highlight
        if (step.highlight && step.target) {
            showHighlight(step.target);
        } else {
            hideHighlight();
        }

        // Update tooltip
        updateTooltip(step);

        // Show elements with animation
        setTimeout(() => {
            tutorialTooltip.classList.add('show');
            if (step.highlight) {
                highlightElement.classList.add('show');
            }
        }, 100);
    }

    /**
     * Go to next step
     */
    function nextStep() {
        tutorialTooltip.classList.remove('show');
        highlightElement.classList.remove('show');

        setTimeout(() => {
            showStep(currentStep + 1);
        }, 300);
    }

    /**
     * Go to previous step
     */
    function previousStep() {
        if (currentStep > 0) {
            tutorialTooltip.classList.remove('show');
            highlightElement.classList.remove('show');

            setTimeout(() => {
                showStep(currentStep - 1);
            }, 300);
        }
    }

    /**
     * Skip tutorial
     */
    function skip() {
        if (confirm('¿Seguro que quieres saltar el tutorial? Siempre puedes verlo de nuevo desde el menú de ayuda.')) {
            complete();
        }
    }

    /**
     * Complete tutorial
     */
    function complete() {
        isActive = false;
        
        // Hide elements
        tutorialTooltip.classList.remove('show');
        highlightElement.classList.remove('show');
        
        setTimeout(() => {
            tutorialOverlay.style.display = 'none';
            hideHighlight();
        }, 300);

        // Mark as completed
        markAsCompleted();

        // Show completion message
        if (window.showToast) {
            window.showToast('¡Tutorial completado! Ya puedes comenzar a analizar tu Instagram', 'success');
        }
    }

    /**
     * Restart tutorial
     */
    function restart() {
        clearProgress();
        currentStep = 0;
        start();
    }

    // ========================================================================
    // TOOLTIP MANAGEMENT
    // ========================================================================

    /**
     * Update tooltip content and position
     * @param {Object} step - Tutorial step
     */
    function updateTooltip(step) {
        // Build tooltip HTML
        const html = `
            <div class="tutorial-tooltip-header">
                <span class="tutorial-icon">${step.icon}</span>
                <h3 class="tutorial-title">${step.title}</h3>
            </div>
            <div class="tutorial-tooltip-body">
                <p class="tutorial-content">${step.content}</p>
            </div>
            <div class="tutorial-tooltip-footer">
                <div class="tutorial-progress">
                    <span class="tutorial-step-counter">Paso ${currentStep + 1} de ${TUTORIAL_STEPS.length}</span>
                    <div class="tutorial-progress-bar">
                        ${generateProgressDots()}
                    </div>
                </div>
                <div class="tutorial-actions">
                    ${currentStep > 0 ? '<button class="btn-tutorial btn-tutorial-back" onclick="Tutorial.previousStep()">← Anterior</button>' : ''}
                    <button class="btn-tutorial btn-tutorial-skip" onclick="Tutorial.skip()">Saltar</button>
                    <button class="btn-tutorial btn-tutorial-next" onclick="Tutorial.nextStep()">
                        ${currentStep < TUTORIAL_STEPS.length - 1 ? 'Siguiente →' : '¡Comenzar!'}
                    </button>
                </div>
            </div>
        `;

        tutorialTooltip.innerHTML = html;

        // Position tooltip
        positionTooltip(step);
    }

    /**
     * Generate progress dots
     * @returns {string} HTML for progress dots
     */
    function generateProgressDots() {
        return TUTORIAL_STEPS.map((_, index) => {
            const className = index === currentStep ? 'active' : (index < currentStep ? 'completed' : '');
            return `<span class="progress-dot ${className}"></span>`;
        }).join('');
    }

    /**
     * Position tooltip relative to target
     * @param {Object} step - Tutorial step
     */
    function positionTooltip(step) {
        if (step.position === 'center' || !step.target) {
            // Center on screen
            tutorialTooltip.style.position = 'fixed';
            tutorialTooltip.style.top = '50%';
            tutorialTooltip.style.left = '50%';
            tutorialTooltip.style.transform = 'translate(-50%, -50%)';
            tutorialTooltip.style.maxWidth = '500px';
            return;
        }

        const targetElement = document.querySelector(step.target);
        if (!targetElement) {
            console.warn(`[Tutorial] Target not found: ${step.target}`);
            // Fallback to center
            tutorialTooltip.style.position = 'fixed';
            tutorialTooltip.style.top = '50%';
            tutorialTooltip.style.left = '50%';
            tutorialTooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = tutorialTooltip.getBoundingClientRect();
        
        tutorialTooltip.style.position = 'fixed';
        
        switch (step.position) {
            case 'top':
                tutorialTooltip.style.left = `${rect.left + rect.width / 2}px`;
                tutorialTooltip.style.top = `${rect.top - 20}px`;
                tutorialTooltip.style.transform = 'translate(-50%, -100%)';
                break;
            case 'bottom':
                tutorialTooltip.style.left = `${rect.left + rect.width / 2}px`;
                tutorialTooltip.style.top = `${rect.bottom + 20}px`;
                tutorialTooltip.style.transform = 'translateX(-50%)';
                break;
            case 'left':
                tutorialTooltip.style.left = `${rect.left - 20}px`;
                tutorialTooltip.style.top = `${rect.top + rect.height / 2}px`;
                tutorialTooltip.style.transform = 'translate(-100%, -50%)';
                break;
            case 'right':
                tutorialTooltip.style.left = `${rect.right + 20}px`;
                tutorialTooltip.style.top = `${rect.top + rect.height / 2}px`;
                tutorialTooltip.style.transform = 'translateY(-50%)';
                break;
        }
    }

    // ========================================================================
    // HIGHLIGHT MANAGEMENT
    // ========================================================================

    /**
     * Show highlight on target element
     * @param {string} selector - CSS selector
     */
    function showHighlight(selector) {
        const targetElement = document.querySelector(selector);
        if (!targetElement) {
            console.warn(`[Tutorial] Highlight target not found: ${selector}`);
            return;
        }

        const rect = targetElement.getBoundingClientRect();
        
        highlightElement.style.position = 'fixed';
        highlightElement.style.top = `${rect.top - 8}px`;
        highlightElement.style.left = `${rect.left - 8}px`;
        highlightElement.style.width = `${rect.width + 16}px`;
        highlightElement.style.height = `${rect.height + 16}px`;
        highlightElement.style.display = 'block';
    }

    /**
     * Hide highlight
     */
    function hideHighlight() {
        highlightElement.style.display = 'none';
    }

    // ========================================================================
    // ACTIONS
    // ========================================================================

    /**
     * Execute step action
     * @param {Object} action - Action object
     */
    function executeAction(action) {
        switch (action.type) {
            case 'scroll':
                scrollToElement(action.target);
                break;
            case 'click':
                // Could trigger clicks if needed
                break;
        }
    }

    /**
     * Scroll to element smoothly
     * @param {string} selector - CSS selector
     */
    function scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Handle overlay click
     * @param {Event} e - Click event
     */
    function handleOverlayClick(e) {
        if (e.target === tutorialOverlay) {
            // Click outside tooltip - do nothing or advance
            // nextStep();
        }
    }

    // ========================================================================
    // STORAGE
    // ========================================================================

    /**
     * Check if tutorial was completed
     * @returns {boolean}
     */
    function hasCompletedTutorial() {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch (e) {
            return false;
        }
    }

    /**
     * Mark tutorial as completed
     */
    function markAsCompleted() {
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
            localStorage.removeItem(STORAGE_STEP_KEY);
        } catch (e) {
            console.warn('[Tutorial] Could not save completion status');
        }
    }

    /**
     * Save current step
     * @param {number} step - Step index
     */
    function saveStep(step) {
        try {
            localStorage.setItem(STORAGE_STEP_KEY, step.toString());
        } catch (e) {
            console.warn('[Tutorial] Could not save step');
        }
    }

    /**
     * Get saved step
     * @returns {number|null}
     */
    function getSavedStep() {
        try {
            const saved = localStorage.getItem(STORAGE_STEP_KEY);
            return saved ? parseInt(saved, 10) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Clear tutorial progress
     */
    function clearProgress() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_STEP_KEY);
        } catch (e) {
            console.warn('[Tutorial] Could not clear progress');
        }
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    return Object.freeze({
        init,
        start,
        restart,
        nextStep,
        previousStep,
        skip,
        complete,
        isActive: () => isActive,
        getCurrentStep: () => currentStep
    });

})();

// Make available globally
window.Tutorial = Tutorial;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => Tutorial.init(), 1000);
    });
} else {
    setTimeout(() => Tutorial.init(), 1000);
}
