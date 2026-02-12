'use strict';

/**
 * ============================================================================
 * STUDIO ANALYTICS - ANALYTICS MODULE
 * ============================================================================
 * Google Analytics integration with privacy-first approach.
 *
 * @author NexusApp Studio
 * @version 2.0.0
 */

const Analytics = (function() {

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    // Google Analytics Measurement ID (leave empty to disable)
    const GA_ID = '';

    // Privacy settings
    const PRIVACY_SETTINGS = {
        anonymizeIp: true,
        allowAdPersonalization: false,
        respectDoNotTrack: true
    };

    // ========================================================================
    // PRIVATE STATE
    // ========================================================================

    const logger = window.StudioLogger?.create('Analytics') || console;
    let isInitialized = false;
    let isEnabled = false;

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * Initialize Google Analytics
     */
    function init() {
        // Check if analytics is enabled
        if (!GA_ID) {
            logger.info?.('Analytics disabled (no GA_ID configured)');
            return;
        }

        // Check feature flag
        if (window.StudioConfig?.FEATURES?.ENABLE_ANALYTICS === false) {
            logger.info?.('Analytics disabled by feature flag');
            return;
        }

        // Respect Do Not Track
        if (PRIVACY_SETTINGS.respectDoNotTrack && navigator.doNotTrack === '1') {
            logger.info?.('Analytics disabled (Do Not Track enabled)');
            return;
        }

        // Check for user consent (GDPR)
        if (!hasUserConsent()) {
            logger.info?.('Analytics disabled (no user consent)');
            return;
        }

        try {
            loadGoogleAnalytics();
            isEnabled = true;
            isInitialized = true;
            logger.info?.('Analytics initialized');
        } catch (error) {
            logger.error?.('Analytics initialization failed', error);
        }
    }

    /**
     * Load Google Analytics script
     */
    function loadGoogleAnalytics() {
        // Create script element
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(script);

        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];

        function gtag() {
            window.dataLayer.push(arguments);
        }

        window.gtag = gtag;

        // Configure
        gtag('js', new Date());

        gtag('config', GA_ID, {
            anonymize_ip: PRIVACY_SETTINGS.anonymizeIp,
            allow_google_signals: !PRIVACY_SETTINGS.allowAdPersonalization,
            allow_ad_personalization_signals: PRIVACY_SETTINGS.allowAdPersonalization,
            send_page_view: true
        });
    }

    /**
     * Check if user has given consent
     */
    function hasUserConsent() {
        const key = window.StudioConfig?.UI?.STORAGE_KEYS?.ANALYTICS_CONSENT || 'studio_analytics_consent';
        const consent = localStorage.getItem(key);
        return consent === 'true';
    }

    /**
     * Check if user has made a consent decision (accept or reject)
     */
    function hasConsentDecision() {
        const key = window.StudioConfig?.UI?.STORAGE_KEYS?.ANALYTICS_CONSENT || 'studio_analytics_consent';
        return localStorage.getItem(key) !== null;
    }

    /**
     * Set user consent
     */
    function setConsent(allowed) {
        const key = window.StudioConfig?.UI?.STORAGE_KEYS?.ANALYTICS_CONSENT || 'studio_analytics_consent';
        localStorage.setItem(key, allowed ? 'true' : 'false');

        if (allowed && !isInitialized) {
            init();
        } else if (!allowed && isInitialized) {
            isEnabled = false;
        }

        // Hide consent banner
        const banner = document.getElementById('consentBanner');
        if (banner) banner.style.display = 'none';

        logger.info?.('Analytics consent updated:', allowed);
    }

    /**
     * Show consent banner if no decision has been made
     */
    function showConsentBannerIfNeeded() {
        if (hasConsentDecision()) return;

        const banner = document.getElementById('consentBanner');
        if (!banner) return;

        banner.style.display = 'block';

        const acceptBtn = document.getElementById('consentAccept');
        const rejectBtn = document.getElementById('consentReject');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => setConsent(true), { once: true });
        }
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => setConsent(false), { once: true });
        }
    }

    // ========================================================================
    // EVENT TRACKING
    // ========================================================================

    /**
     * Track page view
     */
    function trackPageView(path, title) {
        if (!isEnabled || typeof gtag !== 'function') return;

        gtag('event', 'page_view', {
            page_path: path || window.location.pathname,
            page_title: title || document.title
        });

        logger.info?.('Page view tracked:', path);
    }

    /**
     * Track custom event
     */
    function trackEvent(eventName, params = {}) {
        if (!isEnabled || typeof gtag !== 'function') return;

        gtag('event', eventName, {
            ...params,
            timestamp: new Date().toISOString()
        });

        logger.info?.('Event tracked:', eventName, params);
    }

    /**
     * Track user action
     */
    function trackAction(action, category, label, value) {
        trackEvent(action, {
            event_category: category,
            event_label: label,
            value: value
        });
    }

    // ========================================================================
    // SPECIFIC TRACKING METHODS
    // ========================================================================

    /**
     * Track analysis completion
     */
    function trackAnalysis(results) {
        trackEvent('analysis_complete', {
            followers_count: results.followers,
            following_count: results.following,
            not_following_back: results.notFollowingBack?.length || 0,
            mutuals: results.mutuals?.length || 0
        });
    }

    /**
     * Track file upload
     */
    function trackFileUpload(type, count) {
        trackEvent('file_upload', {
            file_type: type,
            user_count: count
        });
    }

    /**
     * Track export action
     */
    function trackExport(format) {
        trackEvent('export', {
            export_format: format
        });
    }

    /**
     * Track login
     */
    function trackLogin(method = 'google') {
        trackEvent('login', {
            method: method
        });
    }

    /**
     * Track error
     */
    function trackError(errorType, errorMessage) {
        trackEvent('error', {
            error_type: errorType,
            error_message: errorMessage?.substring(0, 100)
        });
    }

    /**
     * Track timing
     */
    function trackTiming(category, variable, value, label) {
        if (!isEnabled || typeof gtag !== 'function') return;

        gtag('event', 'timing_complete', {
            name: variable,
            value: value,
            event_category: category,
            event_label: label
        });
    }

    // ========================================================================
    // USER PROPERTIES
    // ========================================================================

    /**
     * Set user ID
     */
    function setUserId(userId) {
        if (!isEnabled || typeof gtag !== 'function') return;

        gtag('set', { user_id: userId });
        logger.info?.('User ID set');
    }

    /**
     * Set user properties
     */
    function setUserProperties(properties) {
        if (!isEnabled || typeof gtag !== 'function') return;

        gtag('set', 'user_properties', properties);
        logger.info?.('User properties set', Object.keys(properties));
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    return Object.freeze({
        // Initialization
        init,
        setConsent,
        hasUserConsent,
        hasConsentDecision,
        showConsentBannerIfNeeded,

        // State
        get isEnabled() { return isEnabled; },
        get isInitialized() { return isInitialized; },

        // General tracking
        trackPageView,
        trackEvent,
        trackAction,

        // Specific tracking
        trackAnalysis,
        trackFileUpload,
        trackExport,
        trackLogin,
        trackError,
        trackTiming,

        // User
        setUserId,
        setUserProperties
    });

})();

// Make available globally
window.Analytics = Analytics;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Delay init slightly to not block main thread
    setTimeout(() => {
        if (window.Analytics) {
            window.Analytics.init();
            window.Analytics.showConsentBannerIfNeeded();
        }
    }, 1500);
});
