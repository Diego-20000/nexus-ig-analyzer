'use strict';

/**
 * ============================================================================
 * STUDIO ANALYTICS - UTILITIES
 * ============================================================================
 * Common utility functions used throughout the application.
 *
 * @author NexusApp Studio
 * @version 2.0.0
 */

const StudioUtils = (function() {

    const logger = window.StudioLogger?.create('Utils') || console;

    // ========================================================================
    // DOM UTILITIES
    // ========================================================================

    const DOM = {
        /**
         * Safely get element by ID
         * @param {string} id - Element ID
         * @returns {HTMLElement|null}
         */
        getById(id) {
            return document.getElementById(id);
        },

        /**
         * Safely query selector
         * @param {string} selector - CSS selector
         * @param {Element} parent - Parent element
         * @returns {Element|null}
         */
        query(selector, parent = document) {
            return parent.querySelector(selector);
        },

        /**
         * Safely query all
         * @param {string} selector - CSS selector
         * @param {Element} parent - Parent element
         * @returns {NodeList}
         */
        queryAll(selector, parent = document) {
            return parent.querySelectorAll(selector);
        },

        /**
         * Create element with attributes
         * @param {string} tag - Tag name
         * @param {object} attrs - Attributes
         * @param {string|Element} content - Content
         * @returns {Element}
         */
        create(tag, attrs = {}, content = null) {
            const element = document.createElement(tag);

            Object.entries(attrs).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'dataset') {
                    Object.entries(value).forEach(([dataKey, dataValue]) => {
                        element.dataset[dataKey] = dataValue;
                    });
                } else if (key.startsWith('on') && typeof value === 'function') {
                    element.addEventListener(key.slice(2).toLowerCase(), value);
                } else {
                    element.setAttribute(key, value);
                }
            });

            if (content) {
                if (typeof content === 'string') {
                    element.textContent = content;
                } else if (content instanceof Element) {
                    element.appendChild(content);
                }
            }

            return element;
        },

        /**
         * Safely set text content (prevents XSS)
         * @param {Element} element - Target element
         * @param {string} text - Text content
         */
        setText(element, text) {
            if (element) {
                element.textContent = text;
            }
        },

        /**
         * Safely set HTML content (sanitized)
         * @param {Element} element - Target element
         * @param {string} html - HTML content
         */
        setHTML(element, html) {
            if (element) {
                element.innerHTML = this.sanitizeHTML(html);
            }
        },

        /**
         * Sanitize HTML to prevent XSS
         * @param {string} str - String to sanitize
         * @returns {string} Sanitized string
         */
        sanitizeHTML(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        /**
         * Show element
         * @param {Element|string} element - Element or ID
         * @param {string} display - Display value
         */
        show(element, display = 'block') {
            const el = typeof element === 'string' ? this.getById(element) : element;
            if (el) el.style.display = display;
        },

        /**
         * Hide element
         * @param {Element|string} element - Element or ID
         */
        hide(element) {
            const el = typeof element === 'string' ? this.getById(element) : element;
            if (el) el.style.display = 'none';
        },

        /**
         * Toggle element visibility
         * @param {Element|string} element - Element or ID
         * @param {boolean} show - Force show/hide
         */
        toggle(element, show = null) {
            const el = typeof element === 'string' ? this.getById(element) : element;
            if (!el) return;

            if (show === null) {
                el.style.display = el.style.display === 'none' ? 'block' : 'none';
            } else {
                el.style.display = show ? 'block' : 'none';
            }
        },

        /**
         * Add class with optional remove after delay
         * @param {Element} element - Target element
         * @param {string} className - Class name
         * @param {number} duration - Auto-remove after ms
         */
        addClass(element, className, duration = 0) {
            if (!element) return;
            element.classList.add(className);

            if (duration > 0) {
                setTimeout(() => {
                    element.classList.remove(className);
                }, duration);
            }
        },

        /**
         * Remove class
         * @param {Element} element - Target element
         * @param {string} className - Class name
         */
        removeClass(element, className) {
            if (element) {
                element.classList.remove(className);
            }
        },

        /**
         * Toggle class
         * @param {Element} element - Target element
         * @param {string} className - Class name
         * @param {boolean} force - Force add/remove
         */
        toggleClass(element, className, force = null) {
            if (!element) return;

            if (force === null) {
                element.classList.toggle(className);
            } else {
                element.classList.toggle(className, force);
            }
        }
    };

    // ========================================================================
    // STRING UTILITIES
    // ========================================================================

    const Strings = {
        /**
         * Escape HTML entities
         * @param {string} str - String to escape
         * @returns {string} Escaped string
         */
        escapeHTML(str) {
            const escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return String(str).replace(/[&<>"']/g, char => escapeMap[char]);
        },

        /**
         * Truncate string
         * @param {string} str - String to truncate
         * @param {number} length - Max length
         * @param {string} suffix - Suffix to add
         * @returns {string} Truncated string
         */
        truncate(str, length = 50, suffix = '...') {
            if (!str || str.length <= length) return str;
            return str.slice(0, length - suffix.length) + suffix;
        },

        /**
         * Capitalize first letter
         * @param {string} str - String to capitalize
         * @returns {string} Capitalized string
         */
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },

        /**
         * Format number with thousands separator
         * @param {number} num - Number to format
         * @param {string} locale - Locale for formatting
         * @returns {string} Formatted number
         */
        formatNumber(num, locale = 'es-ES') {
            return new Intl.NumberFormat(locale).format(num);
        },

        /**
         * Format date
         * @param {Date|number} date - Date to format
         * @param {object} options - Intl options
         * @returns {string} Formatted date
         */
        formatDate(date, options = {}) {
            const defaultOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options })
                .format(date instanceof Date ? date : new Date(date));
        },

        /**
         * Generate random ID
         * @param {number} length - ID length
         * @returns {string} Random ID
         */
        generateId(length = 8) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        },

        /**
         * Slugify string
         * @param {string} str - String to slugify
         * @returns {string} Slugified string
         */
        slugify(str) {
            return String(str)
                .toLowerCase()
                .trim()
                .replace(/[áàäâ]/g, 'a')
                .replace(/[éèëê]/g, 'e')
                .replace(/[íìïî]/g, 'i')
                .replace(/[óòöô]/g, 'o')
                .replace(/[úùüû]/g, 'u')
                .replace(/ñ/g, 'n')
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/[\s_]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
        }
    };

    // ========================================================================
    // VALIDATION UTILITIES
    // ========================================================================

    const Validation = {
        /**
         * Check if value is empty
         * @param {any} value - Value to check
         * @returns {boolean}
         */
        isEmpty(value) {
            if (value === null || value === undefined) return true;
            if (typeof value === 'string') return value.trim() === '';
            if (Array.isArray(value)) return value.length === 0;
            if (typeof value === 'object') return Object.keys(value).length === 0;
            return false;
        },

        /**
         * Validate email
         * @param {string} email - Email to validate
         * @returns {boolean}
         */
        isEmail(email) {
            const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return pattern.test(email);
        },

        /**
         * Validate Instagram username
         * @param {string} username - Username to validate
         * @returns {boolean}
         */
        isValidUsername(username) {
            if (!username || typeof username !== 'string') return false;
            const config = window.StudioConfig?.VALIDATION.USERNAME;
            if (!config) return /^[a-zA-Z0-9._]{1,30}$/.test(username);

            return username.length >= config.MIN_LENGTH &&
                   username.length <= config.MAX_LENGTH &&
                   config.PATTERN.test(username);
        },

        /**
         * Validate file size
         * @param {File} file - File to validate
         * @param {number} maxSize - Max size in bytes
         * @returns {boolean}
         */
        isValidFileSize(file, maxSize = null) {
            const max = maxSize || window.StudioConfig?.UPLOAD.MAX_FILE_SIZE || 10485760;
            return file && file.size <= max;
        },

        /**
         * Validate file type
         * @param {File} file - File to validate
         * @param {array} allowedTypes - Allowed MIME types
         * @returns {boolean}
         */
        isValidFileType(file, allowedTypes = null) {
            const types = allowedTypes || window.StudioConfig?.UPLOAD.MIME_TYPES || ['application/json'];
            return file && types.includes(file.type);
        }
    };

    // ========================================================================
    // ASYNC UTILITIES
    // ========================================================================

    const Async = {
        /**
         * Debounce function
         * @param {function} func - Function to debounce
         * @param {number} wait - Wait time in ms
         * @returns {function} Debounced function
         */
        debounce(func, wait = 300) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Throttle function
         * @param {function} func - Function to throttle
         * @param {number} limit - Limit in ms
         * @returns {function} Throttled function
         */
        throttle(func, limit = 300) {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func(...args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * Sleep/delay
         * @param {number} ms - Milliseconds to sleep
         * @returns {Promise}
         */
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        /**
         * Retry async function
         * @param {function} fn - Async function to retry
         * @param {number} retries - Number of retries
         * @param {number} delay - Delay between retries
         * @returns {Promise}
         */
        async retry(fn, retries = 3, delay = 1000) {
            for (let i = 0; i < retries; i++) {
                try {
                    return await fn();
                } catch (error) {
                    if (i === retries - 1) throw error;
                    logger.warn?.(`Retry ${i + 1}/${retries} failed, waiting ${delay}ms...`);
                    await this.sleep(delay);
                    delay *= 2; // Exponential backoff
                }
            }
        },

        /**
         * Run with timeout
         * @param {Promise} promise - Promise to wrap
         * @param {number} ms - Timeout in ms
         * @returns {Promise}
         */
        withTimeout(promise, ms = 5000) {
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), ms)
            );
            return Promise.race([promise, timeout]);
        }
    };

    // ========================================================================
    // STORAGE UTILITIES
    // ========================================================================

    const Storage = {
        /**
         * Get item from localStorage
         * @param {string} key - Storage key
         * @param {any} defaultValue - Default value
         * @returns {any}
         */
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                logger.warn?.('Storage get error', error);
                return defaultValue;
            }
        },

        /**
         * Set item in localStorage
         * @param {string} key - Storage key
         * @param {any} value - Value to store
         * @returns {boolean}
         */
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                logger.warn?.('Storage set error', error);
                return false;
            }
        },

        /**
         * Remove item from localStorage
         * @param {string} key - Storage key
         */
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                logger.warn?.('Storage remove error', error);
            }
        },

        /**
         * Clear all storage
         */
        clear() {
            try {
                localStorage.clear();
            } catch (error) {
                logger.warn?.('Storage clear error', error);
            }
        },

        /**
         * Check if storage is available
         * @returns {boolean}
         */
        isAvailable() {
            try {
                const test = '__storage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        }
    };

    // ========================================================================
    // FILE UTILITIES
    // ========================================================================

    const Files = {
        /**
         * Read file as text
         * @param {File} file - File to read
         * @returns {Promise<string>}
         */
        readAsText(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsText(file);
            });
        },

        /**
         * Parse JSON file safely
         * @param {File} file - JSON file
         * @returns {Promise<object>}
         */
        async parseJSON(file) {
            const text = await this.readAsText(file);
            return JSON.parse(text);
        },

        /**
         * Download content as file
         * @param {string} content - File content
         * @param {string} filename - File name
         * @param {string} mimeType - MIME type
         */
        download(content, filename, mimeType = 'text/plain') {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        /**
         * Get file extension
         * @param {string} filename - File name
         * @returns {string}
         */
        getExtension(filename) {
            return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
        },

        /**
         * Format file size
         * @param {number} bytes - Size in bytes
         * @returns {string}
         */
        formatSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    };

    // ========================================================================
    // ARRAY UTILITIES
    // ========================================================================

    const Arrays = {
        /**
         * Chunk array into smaller arrays
         * @param {array} array - Array to chunk
         * @param {number} size - Chunk size
         * @returns {array}
         */
        chunk(array, size) {
            const chunks = [];
            for (let i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }
            return chunks;
        },

        /**
         * Remove duplicates
         * @param {array} array - Array with duplicates
         * @returns {array}
         */
        unique(array) {
            return [...new Set(array)];
        },

        /**
         * Shuffle array
         * @param {array} array - Array to shuffle
         * @returns {array}
         */
        shuffle(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        },

        /**
         * Sort array by property
         * @param {array} array - Array to sort
         * @param {string} prop - Property name
         * @param {boolean} desc - Descending order
         * @returns {array}
         */
        sortBy(array, prop, desc = false) {
            return [...array].sort((a, b) => {
                const aVal = a[prop];
                const bVal = b[prop];
                if (aVal < bVal) return desc ? 1 : -1;
                if (aVal > bVal) return desc ? -1 : 1;
                return 0;
            });
        },

        /**
         * Group array by property
         * @param {array} array - Array to group
         * @param {string} prop - Property name
         * @returns {object}
         */
        groupBy(array, prop) {
            return array.reduce((acc, item) => {
                const key = item[prop];
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {});
        }
    };

    // ========================================================================
    // EXPORT
    // ========================================================================

    return Object.freeze({
        DOM,
        Strings,
        Validation,
        Async,
        Storage,
        Files,
        Arrays,

        // Quick access to commonly used
        $: DOM.getById.bind(DOM),
        $$: DOM.queryAll.bind(DOM),
        create: DOM.create.bind(DOM),
        escape: Strings.escapeHTML.bind(Strings),
        debounce: Async.debounce.bind(Async),
        throttle: Async.throttle.bind(Async)
    });

})();

// Make available globally
window.StudioUtils = StudioUtils;
