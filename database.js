'use strict';

/**
 * ============================================================================
 * STUDIO ANALYTICS - DATABASE MANAGER
 * ============================================================================
 * Firestore database operations with offline support and error handling.
 *
 * @author NexusApp Studio
 * @version 2.0.0
 */

const DatabaseManager = (function() {

    // ========================================================================
    // PRIVATE STATE
    // ========================================================================

    const logger = window.StudioLogger?.create('Database') || console;
    const config = () => window.StudioConfig || {};

    // Collection names
    const COLLECTIONS = {
        USERS: 'users',
        ANALYSES: 'analyses'
    };

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    /**
     * Get Firestore instance
     * @returns {object|null}
     */
    function getDb() {
        return window.db || window.FirebaseService?.db || null;
    }

    /**
     * Get server timestamp
     * @returns {object}
     */
    function getTimestamp() {
        if (window.FirebaseService?.serverTimestamp) {
            return window.FirebaseService.serverTimestamp();
        }
        return firebase.firestore.FieldValue.serverTimestamp();
    }

    /**
     * Get increment value
     * @param {number} n - Increment amount
     * @returns {object}
     */
    function getIncrement(n = 1) {
        if (window.FirebaseService?.increment) {
            return window.FirebaseService.increment(n);
        }
        return firebase.firestore.FieldValue.increment(n);
    }

    /**
     * Validate user ID
     * @param {string} uid - User ID
     * @returns {boolean}
     */
    function isValidUid(uid) {
        return uid && typeof uid === 'string' && uid.length > 0;
    }

    // ========================================================================
    // USER PROFILE OPERATIONS
    // ========================================================================

    /**
     * Get or create user profile
     * @param {string} uid - User ID
     * @returns {Promise<object|null>}
     */
    async function getUserProfile(uid) {
        if (!isValidUid(uid)) {
            logger.warn?.('Invalid UID provided');
            return null;
        }

        const db = getDb();
        if (!db) {
            logger.error?.('Firestore not available');
            return null;
        }

        try {
            const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
            const doc = await userRef.get();

            if (doc.exists) {
                logger.info?.('User profile loaded');
                return { id: doc.id, ...doc.data() };
            }

            // Create new profile if doesn't exist
            const user = window.auth?.currentUser || window.FirebaseService?.getCurrentUser();
            if (!user) {
                logger.warn?.('No authenticated user to create profile');
                return null;
            }

            const newProfile = {
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
                photoURL: user.photoURL || null,
                createdAt: getTimestamp(),
                lastLoginAt: getTimestamp(),
                analysisCount: 0,
                plan: 'free',
                preferences: {
                    theme: 'light',
                    notifications: true,
                    language: 'es'
                }
            };

            await userRef.set(newProfile);
            logger.info?.('New user profile created');

            return { id: uid, ...newProfile };

        } catch (error) {
            logger.error?.('Error getting/creating user profile', error);
            return null;
        }
    }

    /**
     * Update user profile
     * @param {string} uid - User ID
     * @param {object} updates - Fields to update
     * @returns {Promise<boolean>}
     */
    async function updateUserProfile(uid, updates) {
        if (!isValidUid(uid) || !updates) {
            return false;
        }

        const db = getDb();
        if (!db) return false;

        try {
            const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
            await userRef.update({
                ...updates,
                updatedAt: getTimestamp()
            });

            logger.info?.('User profile updated');
            return true;

        } catch (error) {
            logger.error?.('Error updating user profile', error);
            return false;
        }
    }

    /**
     * Update last login timestamp
     * @param {string} uid - User ID
     * @returns {Promise<boolean>}
     */
    async function updateLastLogin(uid) {
        return updateUserProfile(uid, { lastLoginAt: getTimestamp() });
    }

    /**
     * Update user preferences
     * @param {string} uid - User ID
     * @param {object} preferences - Preference updates
     * @returns {Promise<boolean>}
     */
    async function updatePreferences(uid, preferences) {
        if (!isValidUid(uid) || !preferences) {
            return false;
        }

        const db = getDb();
        if (!db) return false;

        try {
            const userRef = db.collection(COLLECTIONS.USERS).doc(uid);

            // Merge preferences
            const updates = {};
            Object.entries(preferences).forEach(([key, value]) => {
                updates[`preferences.${key}`] = value;
            });

            await userRef.update(updates);
            logger.info?.('User preferences updated');
            return true;

        } catch (error) {
            logger.error?.('Error updating preferences', error);
            return false;
        }
    }

    // ========================================================================
    // ANALYSIS OPERATIONS
    // ========================================================================

    /**
     * Save analysis results
     * @param {string} uid - User ID
     * @param {object} data - Analysis data
     * @returns {Promise<string|null>} Analysis ID or null
     */
    async function saveAnalysis(uid, data) {
        if (!isValidUid(uid) || !data) {
            logger.warn?.('Invalid data for saveAnalysis');
            return null;
        }

        const db = getDb();
        if (!db) {
            logger.error?.('Firestore not available');
            return null;
        }

        try {
            // Validate and sanitize data
            const analysisData = {
                followers: parseInt(data.followers) || 0,
                following: parseInt(data.following) || 0,
                notFollowingBackCount: parseInt(data.notFollowingBackCount) || 0,
                mutualsCount: parseInt(data.mutualsCount) || 0,
                onlyFollowersCount: parseInt(data.onlyFollowersCount) || 0,
                createdAt: getTimestamp(),
                version: config().APP?.VERSION || '2.0.0'
            };

            // Optional: Save bot analysis summary if provided
            if (data.botAnalysis) {
                analysisData.botAnalysis = {
                    likelyBots: parseInt(data.botAnalysis.likelyBots) || 0,
                    suspicious: parseInt(data.botAnalysis.suspicious) || 0,
                    averageScore: parseFloat(data.botAnalysis.averageScore) || 0
                };
            }

            // Save analysis to subcollection
            const analysisRef = db
                .collection(COLLECTIONS.USERS)
                .doc(uid)
                .collection(COLLECTIONS.ANALYSES)
                .doc();

            await analysisRef.set(analysisData);

            // Update user stats
            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                analysisCount: getIncrement(1),
                lastAnalysisAt: getTimestamp()
            });

            logger.info?.('Analysis saved successfully', { id: analysisRef.id });
            return analysisRef.id;

        } catch (error) {
            logger.error?.('Error saving analysis', error);
            return null;
        }
    }

    /**
     * Load analysis history
     * @param {string} uid - User ID
     * @param {number} limit - Max results
     * @returns {Promise<array>}
     */
    async function loadHistory(uid, limit = 10) {
        if (!isValidUid(uid)) {
            return [];
        }

        const db = getDb();
        if (!db) {
            return [];
        }

        try {
            const snapshot = await db
                .collection(COLLECTIONS.USERS)
                .doc(uid)
                .collection(COLLECTIONS.ANALYSES)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const history = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            logger.info?.(`Loaded ${history.length} analysis records`);
            return history;

        } catch (error) {
            logger.error?.('Error loading history', error);
            return [];
        }
    }

    /**
     * Get single analysis by ID
     * @param {string} uid - User ID
     * @param {string} analysisId - Analysis ID
     * @returns {Promise<object|null>}
     */
    async function getAnalysis(uid, analysisId) {
        if (!isValidUid(uid) || !analysisId) {
            return null;
        }

        const db = getDb();
        if (!db) return null;

        try {
            const doc = await db
                .collection(COLLECTIONS.USERS)
                .doc(uid)
                .collection(COLLECTIONS.ANALYSES)
                .doc(analysisId)
                .get();

            if (!doc.exists) {
                return null;
            }

            return { id: doc.id, ...doc.data() };

        } catch (error) {
            logger.error?.('Error getting analysis', error);
            return null;
        }
    }

    /**
     * Delete analysis
     * @param {string} uid - User ID
     * @param {string} analysisId - Analysis ID
     * @returns {Promise<boolean>}
     */
    async function deleteAnalysis(uid, analysisId) {
        if (!isValidUid(uid) || !analysisId) {
            return false;
        }

        const db = getDb();
        if (!db) return false;

        try {
            await db
                .collection(COLLECTIONS.USERS)
                .doc(uid)
                .collection(COLLECTIONS.ANALYSES)
                .doc(analysisId)
                .delete();

            // Decrement analysis count
            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                analysisCount: getIncrement(-1)
            });

            logger.info?.('Analysis deleted', { analysisId });
            return true;

        } catch (error) {
            logger.error?.('Error deleting analysis', error);
            return false;
        }
    }

    /**
     * Delete all user analyses
     * @param {string} uid - User ID
     * @returns {Promise<boolean>}
     */
    async function deleteAllAnalyses(uid) {
        if (!isValidUid(uid)) {
            return false;
        }

        const db = getDb();
        if (!db) return false;

        try {
            const snapshot = await db
                .collection(COLLECTIONS.USERS)
                .doc(uid)
                .collection(COLLECTIONS.ANALYSES)
                .get();

            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            // Reset analysis count
            await db.collection(COLLECTIONS.USERS).doc(uid).update({
                analysisCount: 0
            });

            logger.info?.(`Deleted ${snapshot.size} analyses`);
            return true;

        } catch (error) {
            logger.error?.('Error deleting all analyses', error);
            return false;
        }
    }

    // ========================================================================
    // ADMIN OPERATIONS
    // ========================================================================

    /**
     * Get all users (admin only)
     * @param {number} limit - Max results
     * @returns {Promise<array>}
     */
    async function getAllUsers(limit = 100) {
        const db = getDb();
        if (!db) return [];

        try {
            const snapshot = await db
                .collection(COLLECTIONS.USERS)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            logger.error?.('Error getting all users', error);
            return [];
        }
    }

    /**
     * Get admin statistics
     * @returns {Promise<object>}
     */
    async function getAdminStats() {
        const db = getDb();
        if (!db) {
            return { totalUsers: 0, activeToday: 0, totalAnalyses: 0 };
        }

        try {
            const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let activeToday = 0;
            let totalAnalyses = 0;

            usersSnapshot.forEach(doc => {
                const data = doc.data();

                // Count active today
                if (data.lastLoginAt) {
                    const lastLogin = data.lastLoginAt.toDate?.() || new Date(data.lastLoginAt);
                    if (lastLogin >= today) {
                        activeToday++;
                    }
                }

                // Sum analyses
                totalAnalyses += data.analysisCount || 0;
            });

            return {
                totalUsers: usersSnapshot.size,
                activeToday,
                totalAnalyses
            };

        } catch (error) {
            logger.error?.('Error getting admin stats', error);
            return { totalUsers: 0, activeToday: 0, totalAnalyses: 0 };
        }
    }

    // ========================================================================
    // OFFLINE SUPPORT
    // ========================================================================

    /**
     * Save data locally for offline use
     * @param {string} key - Storage key
     * @param {object} data - Data to save
     */
    function saveOffline(key, data) {
        try {
            const storageKey = `studio_offline_${key}`;
            localStorage.setItem(storageKey, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
            logger.info?.('Data saved offline', { key });
        } catch (error) {
            logger.warn?.('Error saving offline data', error);
        }
    }

    /**
     * Load data from offline storage
     * @param {string} key - Storage key
     * @param {number} maxAge - Max age in ms
     * @returns {object|null}
     */
    function loadOffline(key, maxAge = 24 * 60 * 60 * 1000) {
        try {
            const storageKey = `studio_offline_${key}`;
            const stored = localStorage.getItem(storageKey);

            if (!stored) return null;

            const { data, timestamp } = JSON.parse(stored);

            // Check if data is still valid
            if (Date.now() - timestamp > maxAge) {
                localStorage.removeItem(storageKey);
                return null;
            }

            return data;

        } catch (error) {
            logger.warn?.('Error loading offline data', error);
            return null;
        }
    }

    /**
     * Clear offline storage
     */
    function clearOffline() {
        try {
            const keys = Object.keys(localStorage).filter(k =>
                k.startsWith('studio_offline_')
            );
            keys.forEach(k => localStorage.removeItem(k));
            logger.info?.('Offline storage cleared');
        } catch (error) {
            logger.warn?.('Error clearing offline storage', error);
        }
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    return Object.freeze({
        // User operations
        getUserProfile,
        updateUserProfile,
        updateLastLogin,
        updatePreferences,

        // Analysis operations
        saveAnalysis,
        loadHistory,
        getAnalysis,
        deleteAnalysis,
        deleteAllAnalyses,

        // Admin operations
        getAllUsers,
        getAdminStats,

        // Offline support
        saveOffline,
        loadOffline,
        clearOffline,

        // Constants
        COLLECTIONS
    });

})();

// Make available globally
window.DatabaseManager = DatabaseManager;
