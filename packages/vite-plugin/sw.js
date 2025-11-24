/**
 * Skybolt Service Worker
 *
 * Cache-first Service Worker for Skybolt assets.
 * Intercepts requests for JS/CSS and serves from Cache API.
 *
 * @version 3.0.0
 */

const CACHE_NAME = 'skybolt-v1'

/**
 * Install event - activate immediately
 */
self.addEventListener('install', () => {
  console.log('[Skybolt SW] Installing')
  self.skipWaiting()
})

/**
 * Activate event - claim clients and clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Skybolt SW] Activating')

  event.waitUntil(
    Promise.all([
      // Take control of all pages immediately
      self.clients.claim(),

      // Clean up old Skybolt caches
      caches.keys().then(names =>
        Promise.all(
          names
            .filter(name => name.startsWith('skybolt-') && name !== CACHE_NAME)
            .map(name => {
              console.log('[Skybolt SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      )
    ])
  )
})

/**
 * Fetch event - cache-first strategy for assets
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return
  }

  // Only handle JS and CSS files
  const isAsset = url.pathname.endsWith('.js') ||
                  url.pathname.endsWith('.css') ||
                  url.pathname.endsWith('.mjs')

  if (!isAsset) {
    return
  }

  // Skip in development mode
  if (isDevMode()) {
    return
  }

  // Cache-first strategy
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        if (cached) {
          console.log('[Skybolt SW] Cache hit:', url.pathname)
          return cached
        }

        // Not in cache - fetch from network and cache
        console.log('[Skybolt SW] Cache miss:', url.pathname)
        return fetch(event.request).then(response => {
          // Only cache successful responses
          if (response.ok) {
            cache.put(event.request, response.clone())
          }
          return response
        })
      })
    )
  )
})

/**
 * Message event - handle commands from client
 */
self.addEventListener('message', (event) => {
  const { type } = event.data || {}

  switch (type) {
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        console.log('[Skybolt SW] Cache cleared via message')
        if (event.ports[0]) {
          event.ports[0].postMessage({ success: true })
        }
      })
      break

    case 'GET_CACHE_INFO':
      caches.open(CACHE_NAME).then(cache =>
        cache.keys().then(keys => {
          if (event.ports[0]) {
            event.ports[0].postMessage({
              name: CACHE_NAME,
              count: keys.length,
              urls: keys.map(r => r.url)
            })
          }
        })
      )
      break

    default:
      console.warn('[Skybolt SW] Unknown message type:', type)
  }
})

/**
 * Check if running in development mode
 * @returns {boolean}
 */
function isDevMode() {
  // Query param override
  if (self.location.search.includes('dev-mode')) {
    return true
  }

  // Vite dev server ports
  const devPorts = ['5173', '5174', '3000', '3001']
  if (self.location.hostname === 'localhost' && devPorts.includes(self.location.port)) {
    return true
  }

  return false
}
