'use strict';

/**
 * ============================================================================
 * STUDIO ANALYTICS - SERVICE WORKER
 * ============================================================================
 * Advanced caching strategy with offline support and update management.
 * Paths corrected for GitHub Pages deployment.
 *
 * @author NexusApp Studio
 * @version 3.0.0
 */

const CACHE_VERSION = 'v3.0.0';
const CACHE_NAME = `studio-analytics-${CACHE_VERSION}`;
const BASE_PATH = '/nexus-ig-analyzer-app';
const OFFLINE_URL = `${BASE_PATH}/offline.html`;

// Static assets to cache on install (GitHub Pages paths)
const STATIC_ASSETS = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/offline.html`,
    `${BASE_PATH}/styles.css`,
    `${BASE_PATH}/config.js`,
    `${BASE_PATH}/logger.js`,
    `${BASE_PATH}/utils.js`,
    `${BASE_PATH}/firebase-config.js`,
    `${BASE_PATH}/nexus-api.js`,
    `${BASE_PATH}/auth.js`,
    `${BASE_PATH}/database.js`,
    `${BASE_PATH}/network-monitor.js`,
    `${BASE_PATH}/app.js`,
    `${BASE_PATH}/analytics.js`,
    `${BASE_PATH}/manifest.json`
];

// External resources to cache
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap'
];

// Network-first URLs (always try network first)
const NETWORK_FIRST_URLS = [
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'firebase',
    '/api/'
];

// Cache-first extensions (static resources)
const CACHE_FIRST_EXTENSIONS = [
    '.css',
    '.js',
    '.woff2',
    '.woff',
    '.ttf',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.ico'
];

// ============================================================================
// INSTALLATION
// ============================================================================

self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v' + CACHE_VERSION);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                // Cache static assets individually to avoid failing all if one fails
                return Promise.allSettled(
                    STATIC_ASSETS.map(url =>
                        cache.add(url).catch(err => {
                            console.warn('[SW] Failed to cache:', url, err.message);
                        })
                    )
                );
            })
            .then(() => {
                // Try to cache external assets (non-critical)
                return caches.open(CACHE_NAME).then(cache =>
                    Promise.allSettled(
                        EXTERNAL_ASSETS.map(url =>
                            cache.add(url).catch(() => {})
                        )
                    )
                );
            })
            .then(() => {
                console.log('[SW] Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Installation failed:', error);
            })
    );
});

// ============================================================================
// ACTIVATION
// ============================================================================

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker v' + CACHE_VERSION);

    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('studio-analytics-') && name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            }),

            // Take control of all clients
            self.clients.claim()
        ])
        .then(() => {
            console.log('[SW] Activation complete');
            return notifyClients({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
        })
    );
});

// ============================================================================
// FETCH HANDLING
// ============================================================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    // Determine caching strategy
    if (isNetworkFirst(url)) {
        event.respondWith(networkFirst(request));
    } else if (isCacheFirst(url)) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(staleWhileRevalidate(request));
    }
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Network First Strategy
 * Try network, fall back to cache, then offline page
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;

    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);

        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlineResponse = await caches.match(OFFLINE_URL);
            if (offlineResponse) return offlineResponse;
        }

        throw error;
    }
}

/**
 * Cache First Strategy
 * Try cache, fall back to network
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        updateCache(request);
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;

    } catch (error) {
        console.error('[SW] Both cache and network failed:', request.url);

        // For navigation, show offline page
        if (request.mode === 'navigate') {
            const offlineResponse = await caches.match(OFFLINE_URL);
            if (offlineResponse) return offlineResponse;
        }

        throw error;
    }
}

/**
 * Stale While Revalidate Strategy
 * Return cache immediately, update in background
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    const networkPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    return cachedResponse || networkPromise;
}

/**
 * Update cache in background (non-blocking)
 */
async function updateCache(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response);
        }
    } catch (error) {
        // Ignore background update errors silently
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isNetworkFirst(url) {
    return NETWORK_FIRST_URLS.some((pattern) => url.href.includes(pattern));
}

function isCacheFirst(url) {
    return CACHE_FIRST_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

async function notifyClients(message) {
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
        client.postMessage(message);
    });
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

self.addEventListener('message', (event) => {
    const { data } = event;

    switch (data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'GET_VERSION':
            event.ports[0]?.postMessage({ version: CACHE_VERSION });
            break;

        case 'CLEAR_CACHE':
            caches.delete(CACHE_NAME).then(() => {
                event.ports[0]?.postMessage({ success: true });
            });
            break;

        case 'CACHE_URLS':
            if (data.urls && Array.isArray(data.urls)) {
                caches.open(CACHE_NAME).then((cache) => {
                    Promise.allSettled(
                        data.urls.map(url => cache.add(url).catch(() => {}))
                    );
                });
            }
            break;
    }
});

// ============================================================================
// PUSH NOTIFICATIONS (placeholder for future)
// ============================================================================

self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();

    const options = {
        body: data.body || 'Nueva notificacion',
        icon: `${BASE_PATH}/icon-192.png`,
        badge: `${BASE_PATH}/icon-72.png`,
        vibrate: [100, 50, 100],
        data: {
            url: data.url || `${BASE_PATH}/`
        },
        actions: [
            { action: 'open', title: 'Abrir' },
            { action: 'close', title: 'Cerrar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Studio Analytics', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    event.waitUntil(
        clients.openWindow(event.notification.data.url || `${BASE_PATH}/`)
    );
});

// ============================================================================
// BACKGROUND SYNC (placeholder for future)
// ============================================================================

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-analysis') {
        event.waitUntil(syncAnalysis());
    }
});

async function syncAnalysis() {
    console.log('[SW] Background sync triggered');
}

console.log('[SW] Service Worker loaded - Version:', CACHE_VERSION);
