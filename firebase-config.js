'use strict';

/**
 * ============================================================================
 * STUDIO ANALYTICS - FIREBASE CONFIGURATION
 * ============================================================================
 * Secure Firebase initialization and service setup.
 *
 * @author NexusApp Studio
 * @version 3.0.0
 */

const FirebaseService = (function() {

    // ========================================================================
    // PRIVATE STATE
    // ========================================================================

    const logger = window.StudioLogger?.create('Firebase') || console;
    let isInitialized = false;
    let authInstance = null;
    let dbInstance = null;
    let googleProviderInstance = null;

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * Initialize Firebase with configuration
     * @returns {boolean} Success status
     */
    function initialize() {
        // Check if already initialized
        if (isInitialized) {
            logger.info?.('Firebase already initialized');
            return true;
        }

        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            logger.error?.('Firebase SDK not loaded');
            return false;
        }

        // Check if already initialized by another instance
        if (firebase.apps && firebase.apps.length > 0) {
            logger.info?.('Firebase already initialized by another instance');
            setupServices();
            isInitialized = true;
            return true;
        }

        // Get configuration
        const config = window.StudioConfig?.FIREBASE;
        if (!config) {
            logger.error?.('Firebase configuration not found');
            return false;
        }

        // Firebase Configuration
        const firebaseConfig = {
            apiKey: config.API_KEY,
            authDomain: config.AUTH_DOMAIN,
            projectId: config.PROJECT_ID,
            storageBucket: config.STORAGE_BUCKET,
            messagingSenderId: config.MESSAGING_SENDER_ID,
            appId: config.APP_ID
        };

        try {
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            logger.info?.('Firebase app initialized');

            // Setup services
            setupServices();
            isInitialized = true;

            return true;

        } catch (error) {
            logger.error?.('Firebase initialization failed', error);
            return false;
        }
    }

    /**
     * Setup Firebase services
     */
    function setupServices() {
        try {
            // Initialize Auth
            authInstance = firebase.auth();

            // Configure auth settings
            authInstance.useDeviceLanguage();

            // Initialize Firestore
            dbInstance = firebase.firestore();

            // Enable offline persistence (with error handling)
            dbInstance.enablePersistence({ synchronizeTabs: true })
                .catch(err => {
                    if (err.code === 'failed-precondition') {
                        logger.warn?.('Persistence failed: Multiple tabs open');
                    } else if (err.code === 'unimplemented') {
                        logger.warn?.('Persistence not supported in this browser');
                    }
                });

            // Initialize Google Provider
            googleProviderInstance = new firebase.auth.GoogleAuthProvider();
            googleProviderInstance.setCustomParameters({
                prompt: 'select_account'
            });

            // Add additional scopes if needed
            googleProviderInstance.addScope('profile');
            googleProviderInstance.addScope('email');

            // Make available globally (for backward compatibility)
            window.auth = authInstance;
            window.db = dbInstance;
            window.googleProvider = googleProviderInstance;

            logger.info?.('Firebase services ready');

        } catch (error) {
            logger.error?.('Firebase services setup failed', error);
            throw error;
        }
    }

    // ========================================================================
    // ADMIN MANAGEMENT
    // ========================================================================

    // Admin emails from centralized config (in production, use Firebase Custom Claims)
    const ADMIN_EMAILS = window.StudioConfig?.APP?.ADMIN_EMAILS || [];

    /**
     * Check if email is admin
     * @param {string} email - Email to check
     * @returns {boolean}
     */
    function isAdminEmail(email) {
        if (!email) return false;
        return ADMIN_EMAILS.includes(email.toLowerCase());
    }

    /**
     * Check current user admin status using Custom Claims (preferred)
     * @returns {Promise<boolean>}
     */
    async function checkAdminClaim() {
        const user = authInstance?.currentUser;
        if (!user) return false;

        try {
            const idTokenResult = await user.getIdTokenResult();
            return idTokenResult.claims.admin === true;
        } catch (error) {
            logger.warn?.('Failed to check admin claim', error);
            // Fallback to email check
            return isAdminEmail(user.email);
        }
    }

    // ========================================================================
    // AUTH HELPERS
    // ========================================================================

    /**
     * Get current user
     * @returns {object|null}
     */
    function getCurrentUser() {
        return authInstance?.currentUser || null;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    function isAuthenticated() {
        return authInstance?.currentUser !== null;
    }

    /**
     * Sign in with Google redirect
     * @returns {Promise}
     */
    async function signInWithGoogle() {
        if (!authInstance || !googleProviderInstance) {
            throw new Error('Firebase not initialized');
        }

        logger.info?.('Initiating Google sign-in redirect');
        return authInstance.signInWithRedirect(googleProviderInstance);
    }

    /**
     * Sign out
     * @returns {Promise}
     */
    async function signOut() {
        if (!authInstance) {
            throw new Error('Firebase not initialized');
        }

        logger.info?.('Signing out');
        return authInstance.signOut();
    }

    /**
     * Get redirect result
     * @returns {Promise<object>}
     */
    async function getRedirectResult() {
        if (!authInstance) {
            throw new Error('Firebase not initialized');
        }

        return authInstance.getRedirectResult();
    }

    /**
     * Subscribe to auth state changes
     * @param {function} callback - Callback function
     * @returns {function} Unsubscribe function
     */
    function onAuthStateChanged(callback) {
        if (!authInstance) {
            logger.error?.('Auth not initialized');
            return () => {};
        }

        return authInstance.onAuthStateChanged(callback);
    }

    // ========================================================================
    // FIRESTORE HELPERS
    // ========================================================================

    /**
     * Get Firestore instance
     * @returns {object}
     */
    function getFirestore() {
        return dbInstance;
    }

    /**
     * Get collection reference
     * @param {string} path - Collection path
     * @returns {object}
     */
    function collection(path) {
        if (!dbInstance) {
            throw new Error('Firestore not initialized');
        }
        return dbInstance.collection(path);
    }

    /**
     * Get document reference
     * @param {string} collectionPath - Collection path
     * @param {string} docId - Document ID
     * @returns {object}
     */
    function doc(collectionPath, docId) {
        if (!dbInstance) {
            throw new Error('Firestore not initialized');
        }
        return dbInstance.collection(collectionPath).doc(docId);
    }

    /**
     * Get server timestamp
     * @returns {object}
     */
    function serverTimestamp() {
        return firebase.firestore.FieldValue.serverTimestamp();
    }

    /**
     * Get increment value
     * @param {number} n - Increment amount
     * @returns {object}
     */
    function increment(n = 1) {
        return firebase.firestore.FieldValue.increment(n);
    }

    // ========================================================================
    // ERROR HANDLING
    // ========================================================================

    /**
     * Parse Firebase error to user-friendly message
     * @param {object} error - Firebase error
     * @returns {string} User-friendly message
     */
    function parseError(error) {
        const errorMessages = {
            'auth/unauthorized-domain': `Dominio no autorizado. Agrega ${window.location.hostname} en Firebase Console`,
            'auth/operation-not-allowed': 'Login con Google no habilitado en Firebase',
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
            'auth/popup-blocked': 'Popup bloqueado. Permite popups para este sitio',
            'auth/popup-closed-by-user': 'Inicio de sesión cancelado',
            'auth/cancelled-popup-request': 'Solicitud cancelada',
            'auth/operation-not-supported-in-this-environment': 'Operación no soportada. Asegurate de tener cookies habilitadas y no estar en modo incógnito.',
            'auth/internal-error': 'Error interno de autenticación. Intentá de nuevo.',
            'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
            'permission-denied': 'No tienes permisos para esta acción',
            'unavailable': 'Servicio no disponible. Intenta más tarde'
        };

        return errorMessages[error.code] || error.message || 'Ha ocurrido un error';
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    return Object.freeze({
        // Initialization
        initialize,
        get isInitialized() { return isInitialized; },

        // Auth
        getCurrentUser,
        isAuthenticated,
        signInWithGoogle,
        signOut,
        getRedirectResult,
        onAuthStateChanged,

        // Admin
        isAdminEmail,
        checkAdminClaim,

        // Firestore
        getFirestore,
        collection,
        doc,
        serverTimestamp,
        increment,

        // Utilities
        parseError,

        // Direct access (for backward compatibility)
        get auth() { return authInstance; },
        get db() { return dbInstance; },
        get googleProvider() { return googleProviderInstance; }
    });

})();

// Make available globally
window.FirebaseService = FirebaseService;

// Auto-initialize when script loads
(function autoInit() {
    // Wait for dependencies
    const checkDependencies = () => {
        if (typeof firebase !== 'undefined' && window.StudioConfig) {
            FirebaseService.initialize();
        } else {
            setTimeout(checkDependencies, 50);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkDependencies);
    } else {
        checkDependencies();
    }
})();
