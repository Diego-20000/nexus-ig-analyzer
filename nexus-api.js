'use strict';

/**
 * ============================================================================
 * STUDIO ANALYTICS - API MODULE
 * ============================================================================
 * Advanced bot detection, engagement analysis, and external API integrations.
 *
 * @author NexusApp Studio
 * @version 2.0.0
 */

const StudioAPI = (function() {

    // ========================================================================
    // PRIVATE STATE
    // ========================================================================

    const logger = window.StudioLogger?.create('API') || console;
    const config = () => window.StudioConfig || {};

    // Cache for API responses
    const cache = {
        location: null,
        exchangeRate: null,
        lastFetch: {}
    };

    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    // ========================================================================
    // BOT DETECTION - ADVANCED ALGORITHM
    // ========================================================================

    /**
     * Analyze username for bot-like patterns
     * @param {string} username - Instagram username
     * @returns {object} Detection result
     */
    function detectBot(username) {
        // Validate input
        if (!username || typeof username !== 'string') {
            return createBotResult(0, 'Unknown', 'Invalid username');
        }

        const normalizedUsername = username.toLowerCase().trim();
        let score = 0;
        const detectedPatterns = [];

        // Get patterns from config or use defaults
        const patterns = config().BOT_DETECTION?.PATTERNS || getDefaultPatterns();
        const thresholds = config().BOT_DETECTION?.THRESHOLDS || {
            LIKELY_BOT: 70,
            SUSPICIOUS: 50,
            POSSIBLE_BOT: 30
        };

        // Test each pattern
        Object.entries(patterns).forEach(([name, pattern]) => {
            if (pattern.regex.test(normalizedUsername)) {
                score += pattern.score;
                detectedPatterns.push({
                    name,
                    description: pattern.description,
                    score: pattern.score
                });
            }
        });

        // Additional heuristics
        const additionalScore = analyzeAdditionalHeuristics(normalizedUsername);
        score += additionalScore.score;
        detectedPatterns.push(...additionalScore.patterns);

        // Cap score at 100
        score = Math.min(score, 100);

        // Determine classification
        let classification, color;
        const colors = config().BOT_DETECTION?.COLORS || {
            LIKELY_BOT: '#F44336',
            SUSPICIOUS: '#FF9800',
            POSSIBLE_BOT: '#FFC107',
            REAL_USER: '#4CAF50'
        };

        if (score >= thresholds.LIKELY_BOT) {
            classification = 'Bot Probable';
            color = colors.LIKELY_BOT;
        } else if (score >= thresholds.SUSPICIOUS) {
            classification = 'Sospechoso';
            color = colors.SUSPICIOUS;
        } else if (score >= thresholds.POSSIBLE_BOT) {
            classification = 'Posible Bot';
            color = colors.POSSIBLE_BOT;
        } else {
            classification = 'Usuario Real';
            color = colors.REAL_USER;
        }

        return createBotResult(score, classification, color, detectedPatterns);
    }

    /**
     * Get default patterns if config not available
     */
    function getDefaultPatterns() {
        return {
            MANY_NUMBERS: { regex: /\d{5,}/, score: 25, description: 'Muchos números consecutivos' },
            USER_PREFIX: { regex: /^user\d+$/i, score: 30, description: 'Patrón genérico de usuario' },
            RANDOM_STRING: { regex: /^[a-z]{2,4}\d{6,}$/i, score: 25, description: 'Cadena aleatoria' },
            UNDERSCORE_NUMBERS: { regex: /_\d{4,}$/, score: 20, description: 'Números al final con guión' },
            REPEATED_CHARS: { regex: /(.)\1{4,}/, score: 15, description: 'Caracteres repetidos' },
            NO_VOWELS: { regex: /^[^aeiou]{8,}$/i, score: 20, description: 'Sin vocales en nombre largo' },
            TEMP_PATTERN: { regex: /^(temp|test|fake|bot|spam)/i, score: 35, description: 'Prefijo sospechoso' },
            ALL_LOWERCASE_NUMBERS: { regex: /^[a-z]+\d+$/, score: 10, description: 'Minúsculas + números' },
            VERY_LONG: { regex: /^.{25,}$/, score: 15, description: 'Nombre muy largo' },
            VERY_SHORT: { regex: /^.{1,3}$/, score: 10, description: 'Nombre muy corto' }
        };
    }

    /**
     * Analyze additional heuristics
     * @param {string} username - Normalized username
     * @returns {object} Additional analysis
     */
    function analyzeAdditionalHeuristics(username) {
        const patterns = [];
        let score = 0;

        // Check entropy (randomness)
        const entropy = calculateEntropy(username);
        if (entropy > 4) {
            score += 15;
            patterns.push({
                name: 'HIGH_ENTROPY',
                description: 'Alta aleatoriedad en nombre',
                score: 15
            });
        }

        // Check for keyboard patterns
        if (hasKeyboardPattern(username)) {
            score += 10;
            patterns.push({
                name: 'KEYBOARD_PATTERN',
                description: 'Patrón de teclado detectado',
                score: 10
            });
        }

        // Check digit ratio
        const digitRatio = (username.match(/\d/g) || []).length / username.length;
        if (digitRatio > 0.5) {
            score += 20;
            patterns.push({
                name: 'HIGH_DIGIT_RATIO',
                description: 'Más del 50% son números',
                score: 20
            });
        }

        // Check for common bot suffixes
        if (/(_oficial|_real|_original|\d{4}$)/.test(username)) {
            score += 10;
            patterns.push({
                name: 'SUSPICIOUS_SUFFIX',
                description: 'Sufijo sospechoso',
                score: 10
            });
        }

        return { score, patterns };
    }

    /**
     * Calculate string entropy
     * @param {string} str - String to analyze
     * @returns {number} Entropy value
     */
    function calculateEntropy(str) {
        const len = str.length;
        const frequencies = {};

        for (const char of str) {
            frequencies[char] = (frequencies[char] || 0) + 1;
        }

        let entropy = 0;
        for (const count of Object.values(frequencies)) {
            const p = count / len;
            entropy -= p * Math.log2(p);
        }

        return entropy;
    }

    /**
     * Check for keyboard patterns
     * @param {string} str - String to check
     * @returns {boolean}
     */
    function hasKeyboardPattern(str) {
        const patterns = ['qwerty', 'asdf', 'zxcv', '1234', 'qazwsx'];
        return patterns.some(p => str.includes(p));
    }

    /**
     * Create bot detection result object
     */
    function createBotResult(score, classification, color, patterns = []) {
        return {
            isBot: score >= 50,
            score,
            classification,
            color,
            patterns,
            confidence: score >= 70 ? 'Alta' : score >= 40 ? 'Media' : 'Baja'
        };
    }

    /**
     * Batch analyze multiple usernames
     * @param {array} usernames - Array of usernames
     * @returns {object} Analysis results
     */
    function analyzeBatch(usernames) {
        if (!Array.isArray(usernames)) return { results: [], summary: {} };

        const results = usernames.map(username => ({
            username,
            analysis: detectBot(username)
        }));

        const summary = {
            total: results.length,
            likelyBots: results.filter(r => r.analysis.score >= 70).length,
            suspicious: results.filter(r => r.analysis.score >= 50 && r.analysis.score < 70).length,
            possibleBots: results.filter(r => r.analysis.score >= 30 && r.analysis.score < 50).length,
            realUsers: results.filter(r => r.analysis.score < 30).length,
            averageScore: results.reduce((sum, r) => sum + r.analysis.score, 0) / results.length || 0
        };

        return { results, summary };
    }

    // ========================================================================
    // ENGAGEMENT CALCULATOR
    // ========================================================================

    /**
     * Calculate engagement metrics
     * @param {number} followers - Follower count
     * @param {number} following - Following count
     * @returns {object} Engagement analysis
     */
    function calculateEngagement(followers, following) {
        followers = parseInt(followers) || 0;
        following = parseInt(following) || 0;

        // Handle edge cases
        if (followers === 0 && following === 0) {
            return {
                ratio: 0,
                rating: 'Sin Datos',
                insight: 'No hay datos suficientes para el análisis',
                color: '#9E9E9E',
                recommendation: 'Sube tus archivos de Instagram para obtener métricas'
            };
        }

        if (followers === 0) {
            return {
                ratio: Infinity,
                rating: 'Muy Bajo',
                insight: 'Sin seguidores detectados',
                color: '#F44336',
                recommendation: 'Enfócate en crear contenido de calidad para atraer seguidores'
            };
        }

        const ratio = following / followers;
        let rating, insight, color, recommendation;

        const ratings = config().ENGAGEMENT?.RATINGS || {
            EXCELLENT: { maxRatio: 0.5, color: '#4CAF50', insight: 'Excelente base de seguidores' },
            VERY_GOOD: { maxRatio: 1.0, color: '#8BC34A', insight: 'Cuenta bien equilibrada' },
            GOOD: { maxRatio: 2.0, color: '#FFC107', insight: 'Engagement activo' },
            AVERAGE: { maxRatio: 5.0, color: '#FF9800', insight: 'Considera optimizar' },
            LOW: { maxRatio: Infinity, color: '#F44336', insight: 'Ratio de seguimiento alto' }
        };

        if (ratio < ratings.EXCELLENT.maxRatio) {
            rating = 'Excelente';
            insight = ratings.EXCELLENT.insight;
            color = ratings.EXCELLENT.color;
            recommendation = '¡Mantén el buen trabajo! Tu cuenta tiene una presencia fuerte.';
        } else if (ratio < ratings.VERY_GOOD.maxRatio) {
            rating = 'Muy Bueno';
            insight = ratings.VERY_GOOD.insight;
            color = ratings.VERY_GOOD.color;
            recommendation = 'Tu cuenta está bien posicionada. Sigue creciendo orgánicamente.';
        } else if (ratio < ratings.GOOD.maxRatio) {
            rating = 'Bueno';
            insight = ratings.GOOD.insight;
            color = ratings.GOOD.color;
            recommendation = 'Considera dejar de seguir cuentas inactivas para mejorar tu ratio.';
        } else if (ratio < ratings.AVERAGE.maxRatio) {
            rating = 'Promedio';
            insight = ratings.AVERAGE.insight;
            color = ratings.AVERAGE.color;
            recommendation = 'Revisa las cuentas que sigues y limpia las que no te siguen de vuelta.';
        } else {
            rating = 'Bajo';
            insight = ratings.LOW.insight;
            color = ratings.LOW.color;
            recommendation = 'Te recomendamos hacer una limpieza de seguidos para mejorar tu presencia.';
        }

        return {
            ratio: ratio.toFixed(2),
            rating,
            insight,
            color,
            recommendation,
            followers,
            following,
            difference: followers - following
        };
    }

    // ========================================================================
    // AVATAR GENERATION
    // ========================================================================

    /**
     * Generate avatar URL
     * @param {string} name - User name
     * @param {object} options - Avatar options
     * @returns {string} Avatar URL
     */
    function getAvatar(name, options = {}) {
        const defaultOptions = {
            background: 'E1306C',
            color: 'fff',
            size: 128,
            rounded: true,
            bold: true
        };

        const opts = { ...defaultOptions, ...options };

        if (!name || typeof name !== 'string') {
            name = 'User';
        }

        const encodedName = encodeURIComponent(name.slice(0, 2).toUpperCase());
        const baseUrl = config().API?.AVATARS || 'https://ui-avatars.com/api/';

        return `${baseUrl}?name=${encodedName}&background=${opts.background}&color=${opts.color}&size=${opts.size}&rounded=${opts.rounded}&bold=${opts.bold}`;
    }

    // ========================================================================
    // GEOLOCATION API
    // ========================================================================

    /**
     * Get user's country from IP
     * @returns {Promise<object>} Location data
     */
    async function getUserCountry() {
        // Check cache
        if (cache.location && (Date.now() - cache.lastFetch.location) < CACHE_DURATION) {
            return cache.location;
        }

        try {
            const apiUrl = config().API?.GEOLOCATION || 'https://ipapi.co/json/';
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            cache.location = {
                success: true,
                country: data.country_name || 'Unknown',
                countryCode: data.country_code || 'US',
                currency: data.currency || 'USD',
                city: data.city || '',
                region: data.region || '',
                timezone: data.timezone || ''
            };

            cache.lastFetch.location = Date.now();
            logger.info?.('Location fetched successfully');

            return cache.location;

        } catch (error) {
            logger.warn?.('Location detection failed', error);
            return {
                success: false,
                country: 'Unknown',
                countryCode: 'US',
                currency: 'USD',
                error: error.message
            };
        }
    }

    // ========================================================================
    // EXCHANGE RATE API
    // ========================================================================

    /**
     * Get current exchange rate
     * @param {string} from - Source currency
     * @param {string} to - Target currency
     * @returns {Promise<number>} Exchange rate
     */
    async function getExchangeRate(from = 'USD', to = 'ARS') {
        const cacheKey = `${from}_${to}`;

        // Check cache
        if (cache.exchangeRate?.[cacheKey] &&
            (Date.now() - cache.lastFetch.exchangeRate) < CACHE_DURATION) {
            return cache.exchangeRate[cacheKey];
        }

        try {
            const apiUrl = config().API?.EXCHANGE_RATE || 'https://api.exchangerate-api.com/v4/latest/USD';
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!cache.exchangeRate) cache.exchangeRate = {};

            const rate = data.rates?.[to] || config().PRICING?.FALLBACK_EXCHANGE_RATE || 1000;
            cache.exchangeRate[cacheKey] = rate;
            cache.lastFetch.exchangeRate = Date.now();

            logger.info?.(`Exchange rate fetched: 1 ${from} = ${rate} ${to}`);
            return rate;

        } catch (error) {
            logger.warn?.('Exchange rate fetch failed', error);
            return config().PRICING?.FALLBACK_EXCHANGE_RATE || 1000;
        }
    }

    // ========================================================================
    // PRICING
    // ========================================================================

    /**
     * Get localized pricing
     * @returns {Promise<object>} Pricing data
     */
    async function getPricing() {
        try {
            const location = await getUserCountry();
            const isArgentina = location.countryCode === 'AR';

            const plans = config().PRICING?.PLANS || {
                FREE: { price: 0 },
                BASIC: { price: 1.99 },
                PRO: { price: 4.99 }
            };

            if (isArgentina) {
                const rate = await getExchangeRate('USD', 'ARS');
                return {
                    currency: 'ARS',
                    symbol: '$',
                    free: 0,
                    basic: Math.round(plans.BASIC.price * rate),
                    pro: Math.round(plans.PRO.price * rate),
                    exchangeRate: rate,
                    country: 'Argentina'
                };
            }

            return {
                currency: 'USD',
                symbol: '$',
                free: 0,
                basic: plans.BASIC.price,
                pro: plans.PRO.price,
                country: location.country
            };

        } catch (error) {
            logger.error?.('Pricing fetch failed', error);
            return {
                currency: 'USD',
                symbol: '$',
                free: 0,
                basic: 1.99,
                pro: 4.99,
                error: error.message
            };
        }
    }

    // ========================================================================
    // INSTAGRAM URL HELPERS
    // ========================================================================

    /**
     * Generate Instagram profile URL
     * @param {string} username - Instagram username
     * @returns {string} Profile URL
     */
    function getProfileUrl(username) {
        if (!username) return '#';
        const baseUrl = config().API?.INSTAGRAM || 'https://instagram.com/';
        return `${baseUrl}${encodeURIComponent(username)}`;
    }

    /**
     * Open Instagram profile in new tab
     * @param {string} username - Instagram username
     */
    function openProfile(username) {
        const url = getProfileUrl(username);
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    // ========================================================================
    // CACHE MANAGEMENT
    // ========================================================================

    /**
     * Clear all cached data
     */
    function clearCache() {
        cache.location = null;
        cache.exchangeRate = null;
        cache.lastFetch = {};
        logger.info?.('API cache cleared');
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    return Object.freeze({
        // Bot Detection
        detectBot,
        analyzeBatch,

        // Engagement
        calculateEngagement,

        // Avatar
        getAvatar,

        // External APIs
        getUserCountry,
        getExchangeRate,
        getPricing,

        // Instagram
        getProfileUrl,
        openProfile,

        // Cache
        clearCache
    });

})();

// Make available globally
window.StudioAPI = StudioAPI;
