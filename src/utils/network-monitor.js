'use strict';

/**
 * ============================================================================
 * STUDIO ANALYTICS - NETWORK MONITOR
 * ============================================================================
 * Monitors network connectivity and provides UI feedback.
 * Shows/hides offline banner and retries failed operations.
 *
 * @author NexusApp Studio
 * @version 2.0.0
 */

const NetworkMonitor = (function() {

    // ========================================================================
    // STATE
    // ========================================================================

    let isOnline = navigator.onLine;
    let offlineBanner = null;
    let closeBtn = null;
    let pendingRetries = [];
    const logger = window.StudioLogger ? window.StudioLogger.create('NetworkMonitor') : console;

    // ========================================================================
    // UI
    // ========================================================================

    /**
     * Show the offline banner
     */
    function showOfflineBanner() {
        if (offlineBanner) {
            offlineBanner.style.display = 'flex';
        }
    }

    /**
     * Hide the offline banner
     */
    function hideOfflineBanner() {
        if (offlineBanner) {
            offlineBanner.style.display = 'none';
        }
    }

    /**
     * Show a toast notification about connectivity change
     * @param {boolean} online - Whether we're back online
     */
    function showConnectivityToast(online) {
        if (typeof window.showToast === 'function') {
            if (online) {
                window.showToast('Conexión restaurada', 'success');
            } else {
                window.showToast('Sin conexión a internet', 'warning');
            }
        }
    }

    // ========================================================================
    // RETRY SYSTEM
    // ========================================================================

    /**
     * Register a function to retry when connection is restored
     * @param {Function} fn - Function to retry
     * @param {string} label - Description of the operation
     */
    function retryWhenOnline(fn, label = 'operation') {
        if (isOnline) {
            fn();
        } else {
            pendingRetries.push({ fn, label });
            if (logger.info) {
                logger.info(`Queued "${label}" for retry when online`);
            }
        }
    }

    /**
     * Execute all pending retries
     */
    function executePendingRetries() {
        if (pendingRetries.length === 0) return;

        if (logger.info) {
            logger.info(`Executing ${pendingRetries.length} pending retries`);
        }

        const retries = [...pendingRetries];
        pendingRetries = [];

        retries.forEach(({ fn, label }) => {
            try {
                fn();
            } catch (e) {
                if (logger.error) {
                    logger.error(`Retry failed for "${label}"`, e);
                }
            }
        });
    }

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Handle going online
     */
    function handleOnline() {
        isOnline = true;
        hideOfflineBanner();
        showConnectivityToast(true);
        executePendingRetries();

        if (logger.info) {
            logger.info('Connection restored');
        }
    }

    /**
     * Handle going offline
     */
    function handleOffline() {
        isOnline = false;
        showOfflineBanner();
        showConnectivityToast(false);

        if (logger.warn) {
            logger.warn('Connection lost');
        }
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * Initialize the network monitor
     */
    function init() {
        offlineBanner = document.getElementById('offlineBanner');
        closeBtn = document.getElementById('closeOfflineBanner');

        // Set initial state
        if (!navigator.onLine) {
            showOfflineBanner();
        }

        // Listen for connectivity changes
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Close button for banner
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                hideOfflineBanner();
            });
        }

        if (logger.info) {
            logger.info(`Initialized. Status: ${navigator.onLine ? 'online' : 'offline'}`);
        }
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    return Object.freeze({
        /** Check if currently online */
        get isOnline() { return isOnline; },

        /** Register a function to retry when online */
        retryWhenOnline,

        /** Get count of pending retries */
        get pendingCount() { return pendingRetries.length; },

        /** Manually trigger retry of pending operations */
        retryNow: executePendingRetries
    });

})();

// Make available globally
window.NetworkMonitor = NetworkMonitor;
