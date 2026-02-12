'use strict';

/**
 * ============================================================================
 * STUDIO ANALYTICS - AUTHENTICATION SYSTEM
 * ============================================================================
 * Complete authentication flow with Google Sign-in (redirect-based for mobile).
 *
 * @author NexusApp Studio
 * @version 3.0.0
 */

const AuthSystem = (function() {

    // ========================================================================
    // PRIVATE STATE
    // ========================================================================

    const logger = window.StudioLogger?.create('Auth') || console;
    const config = () => window.StudioConfig || {};
    const utils = () => window.StudioUtils || {};

    let currentUser = null;
    let isAdmin = false;
    let authUnsubscribe = null;

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * Initialize the authentication system
     */
    function init() {
        logger.info?.('Initializing authentication system');

        // Wait for Firebase
        if (!window.FirebaseService?.isInitialized && typeof auth === 'undefined') {
            logger.warn?.('Firebase not ready, retrying...');
            setTimeout(init, 100);
            return;
        }

        // Check for redirect result first
        checkRedirectResult();

        // Setup auth state listener
        setupAuthStateListener();

        // Setup UI event listeners
        setupEventListeners();

        // Load saved theme preference
        loadThemePreference();

        logger.info?.('Authentication system ready');
    }

    /**
     * Setup auth state change listener
     */
    function setupAuthStateListener() {
        const authInstance = window.auth || window.FirebaseService?.auth;

        if (!authInstance) {
            logger.error?.('Auth instance not available');
            return;
        }

        // Unsubscribe from previous listener if exists
        if (authUnsubscribe) {
            authUnsubscribe();
        }

        authUnsubscribe = authInstance.onAuthStateChanged(handleAuthStateChange);
    }

    /**
     * Check redirect result after Google login
     */
    async function checkRedirectResult() {
        try {
            const authInstance = window.auth || window.FirebaseService?.auth;
            if (!authInstance) return;

            const result = await authInstance.getRedirectResult();

            if (result && result.user) {
                logger.info?.('Login via redirect successful');
                showToast(config().MESSAGES?.SUCCESS?.LOGIN_SUCCESS || '¡Bienvenido!', 'success');
            }
        } catch (error) {
            logger.error?.('Redirect result error', error);
            handleAuthError(error);
        }
    }

    // ========================================================================
    // AUTH STATE HANDLING
    // ========================================================================

    /**
     * Handle authentication state changes
     * @param {object} user - Firebase user object
     */
    async function handleAuthStateChange(user) {
        if (user) {
            // User is signed in
            currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
                photoURL: user.photoURL
            };

            // Check admin status (centralized in config.js)
            isAdmin = window.FirebaseService?.isAdminEmail(user.email) || false;

            if (isAdmin) {
                logger.info?.('Admin access granted');
            }

            logger.info?.('User authenticated', { email: user.email });

            // Show dashboard
            showDashboard();

            // Load/create user profile
            await loadUserProfile();

            // Update last login
            if (window.DatabaseManager?.updateLastLogin) {
                await window.DatabaseManager.updateLastLogin(user.uid);
            }

        } else {
            // User is signed out
            currentUser = null;
            isAdmin = false;

            logger.info?.('User signed out');

            // Show landing page
            showLanding();
        }
    }

    /**
     * Load user profile from database
     */
    async function loadUserProfile() {
        if (!currentUser || !window.DatabaseManager) return;

        try {
            const profile = await window.DatabaseManager.getUserProfile(currentUser.uid);

            if (profile) {
                // Update current user with profile data
                currentUser.plan = profile.plan || 'free';
                currentUser.analysisCount = profile.analysisCount || 0;

                // Apply saved preferences
                if (profile.preferences?.theme) {
                    setTheme(profile.preferences.theme);
                }
            }
        } catch (error) {
            logger.error?.('Error loading user profile', error);
        }
    }

    // ========================================================================
    // LOGIN / LOGOUT
    // ========================================================================

    /**
     * Check if web storage is available
     * @returns {boolean}
     */
    function isWebStorageAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, '1');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Login with Google — tries popup first, falls back to redirect
     */
    async function loginWithGoogle() {
        const authInstance = window.auth || window.FirebaseService?.auth;
        const provider = window.googleProvider || window.FirebaseService?.googleProvider;

        if (!authInstance || !provider) {
            logger.error?.('Firebase not ready for login');
            showToast(config().MESSAGES?.ERRORS?.FIREBASE_NOT_READY || 'Error: Firebase no disponible', 'error');
            return;
        }

        // Check web storage availability
        if (!isWebStorageAvailable()) {
            showToast('Habilita las cookies y el almacenamiento web para iniciar sesión. Si estás en modo incógnito, probá en modo normal.', 'error');
            return;
        }

        logger.info?.('Initiating Google sign-in');
        showToast('Conectando con Google...', 'info');

        try {
            // Try popup first (works on most desktop and many mobile browsers)
            await authInstance.signInWithPopup(provider);
            logger.info?.('Login via popup successful');
        } catch (popupError) {
            logger.warn?.('Popup login failed, trying redirect', popupError.code);

            // If popup blocked, not supported, or environment issue — fallback to redirect
            if (popupError.code === 'auth/popup-blocked' ||
                popupError.code === 'auth/popup-closed-by-user' ||
                popupError.code === 'auth/cancelled-popup-request' ||
                popupError.code === 'auth/operation-not-supported-in-this-environment') {
                try {
                    showToast('Redirigiendo a Google...', 'info');
                    await authInstance.signInWithRedirect(provider);
                } catch (redirectError) {
                    logger.error?.('Redirect login also failed', redirectError);
                    handleAuthError(redirectError);
                }
            } else {
                handleAuthError(popupError);
            }
        }
    }

    /**
     * Logout the current user
     */
    async function logout() {
        const authInstance = window.auth || window.FirebaseService?.auth;

        if (!authInstance) {
            logger.error?.('Auth not available for logout');
            return;
        }

        try {
            await authInstance.signOut();

            // Reset app state
            if (window.InstagramAnalyzer?.reset) {
                window.InstagramAnalyzer.reset();
            }

            showToast(config().MESSAGES?.SUCCESS?.LOGOUT_SUCCESS || 'Sesión cerrada', 'info');

        } catch (error) {
            logger.error?.('Logout error', error);
            showToast('Error al cerrar sesión', 'error');
        }
    }

    /**
     * Handle authentication errors
     * @param {object} error - Firebase auth error
     */
    function handleAuthError(error) {
        const message = window.FirebaseService?.parseError(error) ||
                       error.message ||
                       'Error al iniciar sesión';

        showToast(message, 'error');
    }

    // ========================================================================
    // UI MANAGEMENT
    // ========================================================================

    /**
     * Show dashboard view
     */
    function showDashboard() {
        const $ = utils().$ || document.getElementById.bind(document);

        const hero = $('heroSection');
        const dash = $('dashboardSection');
        const loginBtn = $('loginBtn');
        const userMenu = $('userMenu');
        const adminDash = $('adminDashboard');

        if (hero) hero.style.display = 'none';
        if (dash) dash.style.display = 'block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';

        // Update user info in UI
        updateUserInfo();

        // Show admin dashboard if admin
        if (isAdmin && adminDash) {
            adminDash.style.display = 'block';
            loadAdminStats();
        }

        // Load analysis history
        if (window.InstagramAnalyzer?.loadHistory) {
            window.InstagramAnalyzer.loadHistory();
        }
    }

    /**
     * Show landing view
     */
    function showLanding() {
        const $ = utils().$ || document.getElementById.bind(document);

        const hero = $('heroSection');
        const dash = $('dashboardSection');
        const loginBtn = $('loginBtn');
        const userMenu = $('userMenu');
        const adminDash = $('adminDashboard');

        if (hero) hero.style.display = 'flex';
        if (dash) dash.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
        if (adminDash) adminDash.style.display = 'none';
    }

    /**
     * Update user information in the UI
     */
    function updateUserInfo() {
        if (!currentUser) return;

        const $ = utils().$ || document.getElementById.bind(document);

        const elements = {
            userName: $('userName'),
            userAvatar: $('userAvatar'),
            dashUserName: $('dashUserName'),
            dashAvatar: $('dashAvatar'),
            dashUserPlan: $('dashUserPlan')
        };

        const name = currentUser.displayName;
        const avatar = currentUser.photoURL ||
                      (window.StudioAPI?.getAvatar(name)) ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E1306C&color=fff`;

        if (elements.userName) elements.userName.textContent = name;
        if (elements.dashUserName) elements.dashUserName.textContent = name;

        if (elements.userAvatar) {
            elements.userAvatar.src = avatar;
            elements.userAvatar.alt = name;
        }

        if (elements.dashAvatar) {
            elements.dashAvatar.src = avatar;
            elements.dashAvatar.alt = name;
        }

        if (elements.dashUserPlan) {
            const planText = currentUser.plan === 'pro' ? 'Pro' :
                            currentUser.plan === 'basic' ? 'Basic' : 'Free';
            elements.dashUserPlan.textContent = planText;
        }
    }

    // ========================================================================
    // ADMIN FUNCTIONS
    // ========================================================================

    /**
     * Load admin statistics
     */
    async function loadAdminStats() {
        if (!isAdmin) return;

        const $ = utils().$ || document.getElementById.bind(document);

        try {
            const stats = await window.DatabaseManager?.getAdminStats() || {
                totalUsers: 0,
                activeToday: 0,
                totalAnalyses: 0
            };

            const totalEl = $('adminTotalUsers');
            const activeEl = $('adminActiveToday');
            const analysesEl = $('adminTotalAnalyses');

            if (totalEl) totalEl.textContent = stats.totalUsers;
            if (activeEl) activeEl.textContent = stats.activeToday;
            if (analysesEl) analysesEl.textContent = stats.totalAnalyses;

            logger.info?.('Admin stats loaded', stats);

        } catch (error) {
            logger.error?.('Error loading admin stats', error);
        }
    }

    // ========================================================================
    // THEME MANAGEMENT
    // ========================================================================

    /**
     * Set theme
     * @param {string} theme - 'light' or 'dark'
     */
    function setTheme(theme) {
        const validThemes = ['light', 'dark'];
        if (!validThemes.includes(theme)) {
            theme = 'light';
        }

        document.documentElement.setAttribute('data-theme', theme);
        saveThemePreference(theme);

        logger.info?.('Theme changed to', theme);
    }

    /**
     * Toggle theme
     */
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = current === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }

    /**
     * Save theme preference
     * @param {string} theme - Theme name
     */
    function saveThemePreference(theme) {
        try {
            localStorage.setItem(config().UI?.STORAGE_KEYS?.THEME || 'studio_theme', theme);

            // Also save to user profile if logged in
            if (currentUser && window.DatabaseManager?.updatePreferences) {
                window.DatabaseManager.updatePreferences(currentUser.uid, { theme });
            }
        } catch (error) {
            logger.warn?.('Error saving theme preference', error);
        }
    }

    /**
     * Load saved theme preference
     */
    function loadThemePreference() {
        try {
            const saved = localStorage.getItem(config().UI?.STORAGE_KEYS?.THEME || 'studio_theme');
            if (saved) {
                setTheme(saved);
            }
        } catch (error) {
            logger.warn?.('Error loading theme preference', error);
        }
    }

    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================

    /**
     * Setup UI event listeners
     */
    function setupEventListeners() {
        document.addEventListener('DOMContentLoaded', onDOMReady);

        // If DOM already loaded
        if (document.readyState !== 'loading') {
            onDOMReady();
        }
    }

    /**
     * DOM ready handler
     */
    function onDOMReady() {
        const $ = utils().$ || document.getElementById.bind(document);

        // Hide splash screen
        hideSplashScreen();

        // Login buttons
        const loginBtn = $('loginBtn');
        const heroLoginBtn = $('heroLoginBtn');

        if (loginBtn) {
            loginBtn.addEventListener('click', loginWithGoogle);
        }

        if (heroLoginBtn) {
            heroLoginBtn.addEventListener('click', loginWithGoogle);
        }

        // Logout button
        const logoutBtn = $('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('¿Cerrar sesión?')) {
                    logout();
                }
            });
        }

        // Close admin dashboard
        const closeAdmin = $('closeAdmin');
        if (closeAdmin) {
            closeAdmin.addEventListener('click', () => {
                const adminDash = $('adminDashboard');
                if (adminDash) adminDash.style.display = 'none';
            });
        }

        // Theme toggle
        const themeToggle = $('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }

        logger.info?.('Event listeners ready');
    }

    /**
     * Hide splash screen with animation
     */
    function hideSplashScreen() {
        const duration = config().UI?.SPLASH_DURATION || 2000;

        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            if (splash) {
                splash.style.opacity = '0';
                setTimeout(() => {
                    splash.style.display = 'none';
                }, 500);
            }
        }, duration);
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    return Object.freeze({
        // Initialization
        init,

        // Authentication
        loginWithGoogle,
        logout,

        // User state
        getCurrentUser: () => currentUser,
        isAuthenticated: () => currentUser !== null,
        isAdmin: () => isAdmin,

        // Theme
        setTheme,
        toggleTheme,

        // Admin
        loadAdminStats
    });

})();

// Make available globally
window.AuthSystem = AuthSystem;

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'info', 'warning'
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const config = window.StudioConfig?.UI || {};

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    // Add icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${window.StudioUtils?.Strings?.escapeHTML(message) || message}</span>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto remove
    const duration = config.TOAST_DURATION || 4000;

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Make toast available globally
window.showToast = showToast;

// Auto-initialize
(function autoInit() {
    const checkDependencies = () => {
        if (typeof firebase !== 'undefined' || window.FirebaseService) {
            if (window.AuthSystem) {
                window.AuthSystem.init();
            }
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
