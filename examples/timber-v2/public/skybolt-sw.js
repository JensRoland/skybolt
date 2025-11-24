/**
 * Skybolt Service Worker
 *
 * Lightweight cache-first Service Worker for Skybolt assets.
 * Intercepts requests and serves from Cache API with instant response times.
 *
 * Features:
 * - Cache-first strategy for versioned assets
 * - Stores inlined assets in Cache API
 * - Dev mode bypass
 * - Graceful cache cleanup
 */

const CACHE_NAME = 'skybolt-assets';
const CACHE_VERSION = 'v1';
const FULL_CACHE_NAME = `${CACHE_NAME}-${CACHE_VERSION}`;

/**
 * Check if we're in development mode
 */
function isDevMode() {
    // Check for dev mode query parameter
    if (self.location.search.includes('dev-mode')) {
        return true;
    }

    // Check if running on localhost with dev server (port 5173 is Vite default)
    if (self.location.hostname === 'localhost' &&
        (self.location.port === '5173' || self.location.port === '3000')) {
        return true;
    }

    return false;
}

/**
 * Check if request should be handled by Skybolt
 */
function shouldHandle(url) {
    // Only handle requests from same origin
    if (url.origin !== self.location.origin) {
        return false;
    }

    // Handle JS and CSS assets
    const pathname = url.pathname;
    return pathname.endsWith('.js') ||
           pathname.endsWith('.css') ||
           pathname.endsWith('.mjs');
}

/**
 * Install event: activate immediately
 */
self.addEventListener('install', (event) => {
    console.log('[Skybolt SW] Installing...');

    // Skip waiting to activate immediately
    self.skipWaiting();
});

/**
 * Activate event: claim clients and clean old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[Skybolt SW] Activating...');

    event.waitUntil(
        Promise.all([
            // Take control of all pages immediately
            self.clients.claim(),

            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name.startsWith(CACHE_NAME) && name !== FULL_CACHE_NAME)
                        .map(name => {
                            console.log('[Skybolt SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
        ])
    );
});

/**
 * Fetch event: cache-first strategy
 */
self.addEventListener('fetch', (event) => {
    // Bypass in dev mode
    if (isDevMode()) {
        return;
    }

    const url = new URL(event.request.url);

    // Only handle Skybolt assets
    if (!shouldHandle(url)) {
        return;
    }

    // Cache-first strategy
    event.respondWith(
        caches.open(FULL_CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    console.log('[Skybolt SW] Cache hit:', url.pathname);
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                console.log('[Skybolt SW] Cache miss, fetching:', url.pathname);
                return fetch(event.request).then(networkResponse => {
                    // Cache the network response for future use
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                });
            });
        })
    );
});

/**
 * Message event: handle cache commands from client
 */
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'CLEAR_CACHE':
            handleClearCache();
            break;

        case 'GET_CACHE_INFO':
            handleGetCacheInfo(event);
            break;

        default:
            console.warn('[Skybolt SW] Unknown message type:', type);
    }
});

/**
 * Clear all Skybolt caches
 */
async function handleClearCache() {
    console.log('[Skybolt SW] Clearing cache...');

    try {
        await caches.delete(FULL_CACHE_NAME);
        console.log('[Skybolt SW] Cache cleared');
    } catch (error) {
        console.error('[Skybolt SW] Failed to clear cache:', error);
    }
}

/**
 * Get cache information for debugging
 */
async function handleGetCacheInfo(event) {
    try {
        const cache = await caches.open(FULL_CACHE_NAME);
        const keys = await cache.keys();
        const urls = keys.map(req => req.url);

        event.ports[0].postMessage({
            cacheName: FULL_CACHE_NAME,
            assetCount: urls.length,
            urls
        });
    } catch (error) {
        console.error('[Skybolt SW] Failed to get cache info:', error);
        event.ports[0].postMessage({ error: error.message });
    }
}
