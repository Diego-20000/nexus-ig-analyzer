'use strict';

/**
 * ============================================================================
 * STUDIO ANALYTICS - LOGGING SYSTEM
 * ============================================================================
 * Professional logging system with levels, formatting, and optional persistence.
 *
 * @author NexusApp Studio
 * @version 2.0.0
 */

const StudioLogger = (function() {

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    const LOG_LEVELS = Object.freeze({
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        NONE: 4
    });

    const LEVEL_COLORS = Object.freeze({
        DEBUG: '#9E9E9E',
        INFO: '#2196F3',
        WARN: '#FF9800',
        ERROR: '#F44336'
    });

    const LEVEL_ICONS = Object.freeze({
        DEBUG: '🔍',
        INFO: '📘',
        WARN: '⚠️',
        ERROR: '❌'
    });

    // Current log level (can be changed at runtime)
    let currentLevel = LOG_LEVELS.INFO;

    // Log history for debugging
    const logHistory = [];
    const MAX_HISTORY = 100;

    // ========================================================================
    // FORMATTING
    // ========================================================================

    /**
     * Get formatted timestamp
     * @returns {string} Formatted timestamp
     */
    function getTimestamp() {
        const now = new Date();
        return now.toISOString().slice(11, 23);
    }

    /**
     * Format the log message
     * @param {string} level - Log level
     * @param {string} module - Module name
     * @param {string} message - Log message
     * @returns {object} Formatted log object
     */
    function formatLog(level, module, message) {
        return {
            timestamp: getTimestamp(),
            level,
            module,
            message,
            fullMessage: `[${getTimestamp()}] ${LEVEL_ICONS[level]} [${module}] ${message}`
        };
    }

    // ========================================================================
    // CORE LOGGING
    // ========================================================================

    /**
     * Internal log function
     * @param {string} level - Log level
     * @param {string} module - Module name
     * @param {string} message - Log message
     * @param {any} data - Additional data
     */
    function log(level, module, message, data = null) {
        // Check if logging is enabled for this level
        if (LOG_LEVELS[level] < currentLevel) return;

        // Check if console logs are enabled
        const config = window.StudioConfig;
        if (config && !config.FEATURES.ENABLE_CONSOLE_LOGS && !config.isDevelopment()) {
            // Still store in history for debugging
            const formatted = formatLog(level, module, message);
            addToHistory(formatted, data);
            return;
        }

        const formatted = formatLog(level, module, message);
        addToHistory(formatted, data);

        // Console output with styling
        const style = `color: ${LEVEL_COLORS[level]}; font-weight: bold;`;

        switch (level) {
            case 'DEBUG':
                console.debug(`%c${formatted.fullMessage}`, style, data || '');
                break;
            case 'INFO':
                console.info(`%c${formatted.fullMessage}`, style, data || '');
                break;
            case 'WARN':
                console.warn(`%c${formatted.fullMessage}`, style, data || '');
                break;
            case 'ERROR':
                console.error(`%c${formatted.fullMessage}`, style, data || '');
                break;
        }
    }

    /**
     * Add log to history
     * @param {object} formatted - Formatted log
     * @param {any} data - Additional data
     */
    function addToHistory(formatted, data) {
        logHistory.push({ ...formatted, data, time: Date.now() });

        // Trim history if needed
        if (logHistory.length > MAX_HISTORY) {
            logHistory.shift();
        }
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Create a logger instance for a specific module
     * @param {string} moduleName - Name of the module
     * @returns {object} Logger instance
     */
    function createLogger(moduleName) {
        return {
            debug: (message, data) => log('DEBUG', moduleName, message, data),
            info: (message, data) => log('INFO', moduleName, message, data),
            warn: (message, data) => log('WARN', moduleName, message, data),
            error: (message, data) => log('ERROR', moduleName, message, data),

            // Group logging
            group: (label) => console.group(`📁 [${moduleName}] ${label}`),
            groupEnd: () => console.groupEnd(),

            // Table logging for arrays/objects
            table: (data, label = 'Data') => {
                log('INFO', moduleName, label);
                console.table(data);
            },

            // Time tracking
            time: (label) => console.time(`⏱️ [${moduleName}] ${label}`),
            timeEnd: (label) => console.timeEnd(`⏱️ [${moduleName}] ${label}`)
        };
    }

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================

    /**
     * Set the minimum log level
     * @param {string} level - Log level name
     */
    function setLevel(level) {
        if (LOG_LEVELS.hasOwnProperty(level)) {
            currentLevel = LOG_LEVELS[level];
            log('INFO', 'Logger', `Log level set to ${level}`);
        }
    }

    /**
     * Get log history
     * @param {number} count - Number of logs to retrieve
     * @returns {array} Log history
     */
    function getHistory(count = MAX_HISTORY) {
        return logHistory.slice(-count);
    }

    /**
     * Clear log history
     */
    function clearHistory() {
        logHistory.length = 0;
        log('INFO', 'Logger', 'Log history cleared');
    }

    /**
     * Export logs for debugging
     * @returns {string} JSON string of logs
     */
    function exportLogs() {
        return JSON.stringify(logHistory, null, 2);
    }

    /**
     * Log performance metrics
     * @param {string} module - Module name
     * @param {string} operation - Operation name
     * @param {number} startTime - Start timestamp
     */
    function logPerformance(module, operation, startTime) {
        const duration = performance.now() - startTime;
        log('DEBUG', module, `${operation} completed in ${duration.toFixed(2)}ms`);
    }

    // ========================================================================
    // GLOBAL ERROR HANDLING
    // ========================================================================

    /**
     * Setup global error handlers
     */
    function setupGlobalErrorHandlers() {
        // Unhandled errors
        window.addEventListener('error', (event) => {
            log('ERROR', 'Global', `Unhandled error: ${event.message}`, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            log('ERROR', 'Global', `Unhandled promise rejection: ${event.reason}`, {
                reason: event.reason
            });
        });

        log('INFO', 'Logger', 'Global error handlers initialized');
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    // Auto-setup error handlers
    if (typeof window !== 'undefined') {
        setupGlobalErrorHandlers();
    }

    // ========================================================================
    // EXPORT
    // ========================================================================

    return Object.freeze({
        // Factory
        create: createLogger,

        // Configuration
        setLevel,
        LEVELS: LOG_LEVELS,

        // History
        getHistory,
        clearHistory,
        exportLogs,

        // Utilities
        logPerformance,

        // Quick access loggers
        debug: (module, message, data) => log('DEBUG', module, message, data),
        info: (module, message, data) => log('INFO', module, message, data),
        warn: (module, message, data) => log('WARN', module, message, data),
        error: (module, message, data) => log('ERROR', module, message, data)
    });

})();

// Make available globally
window.StudioLogger = StudioLogger;
