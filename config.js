'use strict';

/**
 * ============================================================================
 * STUDIO ANALYTICS - CONFIGURATION
 * ============================================================================
 * Centralized configuration for the entire application.
 * All constants, settings, and environment variables are managed here.
 *
 * @author NexusApp Studio
 * @version 3.0.0
 * @license MIT
 */

const StudioConfig = (function() {

    // ========================================================================
    // APPLICATION INFO
    // ========================================================================

    const APP = Object.freeze({
        NAME: 'Studio Analytics',
        EDITION: 'Premium Edition',
        VERSION: '3.0.0',
        AUTHOR: 'NexusApp Studio',
        DESCRIPTION: 'Professional Instagram Analytics Tool',
        SUPPORT_EMAIL: 'support@nexusapp.studio',
        WEBSITE: 'https://nexusapp.studio',
        BASE_PATH: '/Nexus-ig-analyzer',
        ADMIN_EMAILS: ['diegoandresh2008@gmail.com']
    });

    // ========================================================================
    // FIREBASE CONFIGURATION
    // ========================================================================

    const FIREBASE = Object.freeze({
        API_KEY: 'AIzaSyBN7GKNaMtQAfEv1IIMGLy4fXLE4ZMV-g0',
        AUTH_DOMAIN: 'nexus-ig-analyzer.firebaseapp.com',
        PROJECT_ID: 'nexus-ig-analyzer',
        STORAGE_BUCKET: 'nexus-ig-analyzer.firebasestorage.app',
        MESSAGING_SENDER_ID: '118787217614',
        APP_ID: '1:118787217614:web:1830dc491f01e734235897'
    });

    // ========================================================================
    // API ENDPOINTS
    // ========================================================================

    const API = Object.freeze({
        GEOLOCATION: 'https://ipapi.co/json/',
        EXCHANGE_RATE: 'https://api.exchangerate-api.com/v4/latest/USD',
        AVATARS: 'https://ui-avatars.com/api/',
        INSTAGRAM: 'https://instagram.com/'
    });

    // ========================================================================
    // FILE UPLOAD SETTINGS
    // ========================================================================

    const UPLOAD = Object.freeze({
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_TYPES: ['.json'],
        MIME_TYPES: ['application/json'],
        MAX_USERS_DISPLAY: 1000,
        CHUNK_SIZE: 100
    });

    // ========================================================================
    // BOT DETECTION CONFIGURATION
    // ========================================================================

    const BOT_DETECTION = Object.freeze({
        // Scoring thresholds
        THRESHOLDS: {
            LIKELY_BOT: 70,
            SUSPICIOUS: 50,
            POSSIBLE_BOT: 30,
            REAL_USER: 0
        },

        // Pattern scores
        PATTERNS: {
            MANY_NUMBERS: { regex: /\d{5,}/, score: 25, description: 'Many consecutive numbers' },
            USER_PREFIX: { regex: /^user\d+$/i, score: 30, description: 'Generic user pattern' },
            RANDOM_STRING: { regex: /^[a-z]{2,4}\d{6,}$/i, score: 25, description: 'Random string pattern' },
            UNDERSCORE_NUMBERS: { regex: /_\d{4,}$/, score: 20, description: 'Trailing underscore numbers' },
            REPEATED_CHARS: { regex: /(.)\1{4,}/, score: 15, description: 'Repeated characters' },
            NO_VOWELS: { regex: /^[^aeiou]{8,}$/i, score: 20, description: 'No vowels in long name' },
            TEMP_PATTERN: { regex: /^temp|test|fake|bot/i, score: 35, description: 'Suspicious prefix' },
            ALL_LOWERCASE_NUMBERS: { regex: /^[a-z]+\d+$/, score: 10, description: 'Lowercase + numbers' },
            VERY_LONG: { regex: /^.{25,}$/, score: 15, description: 'Very long username' },
            VERY_SHORT: { regex: /^.{1,3}$/, score: 10, description: 'Very short username' }
        },

        // Classification colors
        COLORS: {
            LIKELY_BOT: '#8B3A3A',
            SUSPICIOUS: '#C9A24D',
            POSSIBLE_BOT: '#5C4A1A',
            REAL_USER: '#4A5D4A',
            UNKNOWN: '#3A4F6B'
        }
    });

    // ========================================================================
    // ENGAGEMENT CALCULATOR SETTINGS
    // ========================================================================

    const ENGAGEMENT = Object.freeze({
        RATINGS: {
            EXCELLENT: { maxRatio: 0.5, color: '#4A5D4A', insight: 'Base de seguidores excelente' },
            VERY_GOOD: { maxRatio: 1.0, color: '#2E3F2F', insight: 'Cuenta bien equilibrada' },
            GOOD: { maxRatio: 2.0, color: '#C9A24D', insight: 'Engagement activo' },
            AVERAGE: { maxRatio: 5.0, color: '#8A6F2F', insight: 'Considerar optimizar' },
            LOW: { maxRatio: Infinity, color: '#8B3A3A', insight: 'Ratio de seguimiento alto' }
        }
    });

    // ========================================================================
    // CACHE SETTINGS
    // ========================================================================

    const CACHE = Object.freeze({
        NAME: 'studio-analytics-v3',
        MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
        STATIC_ASSETS: [
            '/nexus-ig-analyzer-app/',
            '/nexus-ig-analyzer-app/index.html',
            '/nexus-ig-analyzer-app/styles.css',
            '/nexus-ig-analyzer-app/config.js',
            '/nexus-ig-analyzer-app/logger.js',
            '/nexus-ig-analyzer-app/utils.js',
            '/nexus-ig-analyzer-app/firebase-config.js',
            '/nexus-ig-analyzer-app/nexus-api.js',
            '/nexus-ig-analyzer-app/auth.js',
            '/nexus-ig-analyzer-app/database.js',
            '/nexus-ig-analyzer-app/network-monitor.js',
            '/nexus-ig-analyzer-app/app.js',
            '/nexus-ig-analyzer-app/analytics.js',
            '/nexus-ig-analyzer-app/manifest.json',
            '/nexus-ig-analyzer-app/offline.html'
        ],
        NETWORK_FIRST: [
            '/api/',
            'firestore.googleapis.com',
            'identitytoolkit.googleapis.com'
        ]
    });

    // ========================================================================
    // UI SETTINGS
    // ========================================================================

    const UI = Object.freeze({
        TOAST_DURATION: 4000,
        SPLASH_DURATION: 2000,
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 300,
        ITEMS_PER_PAGE: 50,

        THEMES: {
            LIGHT: 'light',
            DARK: 'dark'
        },

        STORAGE_KEYS: {
            THEME: 'studio_theme',
            USER_PREFS: 'studio_user_prefs',
            LAST_ANALYSIS: 'studio_last_analysis',
            OFFLINE_DATA: 'studio_offline_data',
            ANALYTICS_CONSENT: 'studio_analytics_consent'
        }
    });

    // ========================================================================
    // EXPORT SETTINGS
    // ========================================================================

    const EXPORT = Object.freeze({
        FORMATS: ['pdf', 'excel', 'csv', 'json', 'html', 'txt', 'markdown'],
        PDF: {
            TITLE_SIZE: 24,
            SUBTITLE_SIZE: 14,
            BODY_SIZE: 12,
            MARGIN: 20,
            LINE_HEIGHT: 10
        },
        CSV: {
            DELIMITER: ',',
            USE_BOM: true
        },
        FILENAME_PREFIX: 'studio-analytics'
    });

    // ========================================================================
    // PRICING (for premium features)
    // ========================================================================

    const PRICING = Object.freeze({
        DEFAULT_CURRENCY: 'USD',
        PLANS: {
            FREE: { price: 0, analysisLimit: 5, exportFormats: ['json', 'txt'] },
            BASIC: { price: 1.99, analysisLimit: 50, exportFormats: ['json', 'txt', 'csv'] },
            PRO: { price: 4.99, analysisLimit: Infinity, exportFormats: 'all' }
        },
        FALLBACK_EXCHANGE_RATE: 1000 // ARS fallback
    });

    // ========================================================================
    // VALIDATION RULES
    // ========================================================================

    const VALIDATION = Object.freeze({
        USERNAME: {
            MIN_LENGTH: 1,
            MAX_LENGTH: 30,
            PATTERN: /^[a-zA-Z0-9._]+$/
        },
        FILE: {
            REQUIRED_FIELDS: ['string_list_data', 'value'],
            ALTERNATIVE_FIELDS: ['username', 'relationships_followers', 'relationships_following']
        }
    });

    // ========================================================================
    // ERROR MESSAGES
    // ========================================================================

    const MESSAGES = Object.freeze({
        ERRORS: {
            FILE_TOO_LARGE: 'El archivo es demasiado grande. Máximo 10MB.',
            INVALID_FILE_TYPE: 'Tipo de archivo no válido. Solo se permiten archivos JSON.',
            INVALID_JSON: 'El archivo JSON no es válido.',
            NO_USERS_FOUND: 'No se encontraron usuarios en el archivo.',
            NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
            AUTH_ERROR: 'Error de autenticación.',
            FIREBASE_NOT_READY: 'Firebase no está disponible.',
            UNKNOWN_ERROR: 'Ha ocurrido un error inesperado.'
        },
        SUCCESS: {
            ANALYSIS_COMPLETE: '¡Análisis completado!',
            FILE_LOADED: 'Archivo cargado correctamente.',
            EXPORT_COMPLETE: 'Exportación completada.',
            LOGIN_SUCCESS: '¡Bienvenido!',
            LOGOUT_SUCCESS: 'Sesión cerrada correctamente.'
        },
        INFO: {
            LOADING: 'Cargando...',
            PROCESSING: 'Procesando...',
            REDIRECTING: 'Redirigiendo...',
            NO_HISTORY: 'No hay análisis previos.'
        }
    });

    // ========================================================================
    // FEATURE FLAGS
    // ========================================================================

    const FEATURES = Object.freeze({
        ENABLE_BOT_DETECTION: true,
        ENABLE_ANALYTICS: true,
        ENABLE_OFFLINE_MODE: true,
        ENABLE_PUSH_NOTIFICATIONS: false,
        ENABLE_PREMIUM_FEATURES: false,
        ENABLE_DEBUG_MODE: false,
        ENABLE_CONSOLE_LOGS: false
    });

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    return Object.freeze({
        APP,
        FIREBASE,
        API,
        UPLOAD,
        BOT_DETECTION,
        ENGAGEMENT,
        CACHE,
        UI,
        EXPORT,
        PRICING,
        VALIDATION,
        MESSAGES,
        FEATURES,

        // Helper method to check if in development
        isDevelopment: () => {
            return window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';
        },

        // Helper to get full config
        getAll: () => ({
            APP, FIREBASE, API, UPLOAD, BOT_DETECTION, ENGAGEMENT,
            CACHE, UI, EXPORT, PRICING, VALIDATION, MESSAGES, FEATURES
        })
    });

})();

// Make available globally
window.StudioConfig = StudioConfig;
