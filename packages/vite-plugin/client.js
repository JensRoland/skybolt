/**
 * Skybolt Client
 *
 * Registers Service Worker and coordinates cache state via cookies.
 * Extracts inlined assets and stores them in Cache API.
 *
 * @version 3.0.0
 */

const CACHE_NAME = 'skybolt-v1'
const COOKIE_NAME = 'sb_assets'
const COOKIE_MAX_AGE = 31536000 // 1 year

class SkyboltClient {
  constructor() {
    /** @type {Record<string, string>} Asset name -> hash */
    this.versions = {}

    /** @type {ServiceWorkerRegistration|null} */
    this.registration = null

    this.init()
  }

  /**
   * Initialize Skybolt client
   */
  async init() {
    // Check for Service Worker support
    if (!('serviceWorker' in navigator)) {
      console.warn('[Skybolt] Service Workers not supported')
      this.handleNoServiceWorker()
      return
    }

    // Check for forced disable via query param (for debugging)
    if (new URLSearchParams(location.search).has('no-sw')) {
      console.warn('[Skybolt] Service Worker disabled via ?no-sw')
      this.handleNoServiceWorker()
      return
    }

    // Register Service Worker
    try {
      const config = this.loadConfig()
      this.registration = await navigator.serviceWorker.register(config.swPath, {
        scope: '/'
      })

      // Wait for SW to be ready
      await navigator.serviceWorker.ready
      console.log('[Skybolt] Service Worker ready')
    } catch (err) {
      console.error('[Skybolt] Service Worker registration failed:', err)
      this.handleNoServiceWorker()
      return
    }

    // Process any inlined assets on the page
    this.processInlinedAssets()

    // Update cookie when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.finalize())
    } else {
      this.finalize()
    }
  }

  /**
   * Load configuration from meta tag
   * @returns {{swPath: string}}
   */
  loadConfig() {
    const meta = document.querySelector('meta[name="skybolt-config"]')
    if (meta) {
      try {
        return JSON.parse(meta.content)
      } catch (err) {
        console.warn('[Skybolt] Invalid config meta tag')
      }
    }
    return { swPath: '/skybolt-sw.js' }
  }

  /**
   * Process all inlined assets and cache them
   */
  processInlinedAssets() {
    const elements = document.querySelectorAll('[data-sb-cache]')
    console.log(`[Skybolt] Found ${elements.length} assets to cache`)

    elements.forEach(el => {
      const cacheInfo = el.getAttribute('data-sb-cache')
      const url = el.getAttribute('data-sb-url')

      if (!cacheInfo || !url) {
        console.warn('[Skybolt] Invalid cache attributes on element:', el)
        return
      }

      // Parse "name:hash" format
      const colonIndex = cacheInfo.lastIndexOf(':')
      if (colonIndex === -1) {
        console.warn('[Skybolt] Invalid cache info format:', cacheInfo)
        return
      }

      const name = cacheInfo.substring(0, colonIndex)
      const hash = cacheInfo.substring(colonIndex + 1)

      // Track version for cookie
      this.versions[name] = hash

      // Get content and content type
      const content = el.textContent || ''
      const contentType = el.tagName === 'STYLE' ? 'text/css' : 'application/javascript'

      // Cache the asset
      this.cacheAsset(url, content, contentType, name, hash)
    })
  }

  /**
   * Cache an asset in the Service Worker cache
   *
   * @param {string} url - URL to use as cache key
   * @param {string} content - Asset content
   * @param {string} contentType - MIME type
   * @param {string} name - Asset name (source path)
   * @param {string} hash - Content hash
   */
  async cacheAsset(url, content, contentType, name, hash) {
    try {
      const cache = await caches.open(CACHE_NAME)

      const response = new Response(content, {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(new Blob([content]).size),
          'X-Skybolt-Name': name,
          'X-Skybolt-Hash': hash,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })

      await cache.put(url, response)
      console.log(`[Skybolt] Cached: ${name}`)
    } catch (err) {
      console.error(`[Skybolt] Failed to cache ${name}:`, err)
    }
  }

  /**
   * Finalize initialization - update cookie with cached versions
   */
  finalize() {
    const count = Object.keys(this.versions).length
    if (count > 0) {
      this.updateCookie()
      console.log(`[Skybolt] Ready (${count} assets cached)`)
    } else {
      // No new assets to cache - validate existing cache integrity
      this.validateCache()
    }
  }

  /**
   * Update the sb_assets cookie with current versions
   */
  updateCookie() {
    const data = Object.entries(this.versions)
      .map(([name, hash]) => `${name}:${hash}`)
      .join(',')

    // Encode to handle special characters in paths
    const encoded = encodeURIComponent(data)

    // Check if we need cookie sharding (>4KB)
    if (encoded.length > 4090) {
      this.updateCookieSharded(encoded)
    } else {
      document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
    }
  }

  /**
   * Update cookies with sharding for large data
   * @param {string} encoded - URL-encoded cookie data
   */
  updateCookieSharded(encoded) {
    const maxSize = 4090
    const chunks = []

    // Split at safe boundaries
    let offset = 0
    while (offset < encoded.length) {
      let chunkSize = Math.min(maxSize, encoded.length - offset)

      // Try to break at encoded comma (%2C) if not at end
      if (offset + chunkSize < encoded.length) {
        const chunk = encoded.substring(offset, offset + chunkSize)
        const lastComma = chunk.lastIndexOf('%2C')
        if (lastComma > 0) {
          chunkSize = lastComma + 3 // Include the %2C
        }
      }

      chunks.push(encoded.substring(offset, offset + chunkSize))
      offset += chunkSize
    }

    // Write chunks
    chunks.forEach((chunk, i) => {
      const cookieName = i === 0 ? COOKIE_NAME : `${COOKIE_NAME}_${i + 1}`
      document.cookie = `${cookieName}=${chunk}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
    })

    // Write count if multiple chunks
    if (chunks.length > 1) {
      document.cookie = `${COOKIE_NAME}_count=${chunks.length}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
    }

    // Clean up extra cookies from previous runs
    this.cleanupExtraCookies(chunks.length)
  }

  /**
   * Remove extra cookie chunks from previous sessions
   * @param {number} keepCount - Number of chunks to keep
   */
  cleanupExtraCookies(keepCount) {
    for (let i = keepCount + 1; i <= 10; i++) {
      document.cookie = `${COOKIE_NAME}_${i}=; path=/; max-age=0`
    }
    if (keepCount <= 1) {
      document.cookie = `${COOKIE_NAME}_count=; path=/; max-age=0`
    }
  }

  /**
   * Validate cache integrity when no new assets to cache
   * Handles case where cache was cleared but cookies remain
   */
  async validateCache() {
    // Check if we have cookie data
    const hasCookie = document.cookie.includes(COOKIE_NAME)
    if (!hasCookie) return

    try {
      const cache = await caches.open(CACHE_NAME)
      const keys = await cache.keys()

      if (keys.length === 0) {
        // Cookie exists but cache is empty - mismatch
        console.warn('[Skybolt] Cache/cookie mismatch detected, clearing cookies')
        this.clearCookies()
        location.reload()
      }
    } catch (err) {
      console.error('[Skybolt] Cache validation failed:', err)
    }
  }

  /**
   * Handle case where Service Worker is unavailable
   * Convert inlined assets back to external links
   */
  handleNoServiceWorker() {
    console.warn('[Skybolt] Falling back to external assets')

    document.querySelectorAll('[data-sb-cache]').forEach(el => {
      const url = el.getAttribute('data-sb-url')
      if (!url) return

      if (el.tagName === 'STYLE') {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = url
        el.replaceWith(link)
      } else if (el.tagName === 'SCRIPT') {
        const script = document.createElement('script')
        script.src = url
        if (el.type === 'module') script.type = 'module'
        if (el.hasAttribute('async')) script.async = true
        el.replaceWith(script)
      }
    })
  }

  /**
   * Clear all Skybolt cookies
   */
  clearCookies() {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
    document.cookie = `${COOKIE_NAME}_count=; path=/; max-age=0`
    for (let i = 2; i <= 10; i++) {
      document.cookie = `${COOKIE_NAME}_${i}=; path=/; max-age=0`
    }
  }

  /**
   * Clear cache (public API for debugging)
   * Clears Cache API but keeps Service Worker registered
   */
  async clearCache() {
    try {
      await caches.delete(CACHE_NAME)
      this.clearCookies()
      console.log('[Skybolt] Cache cleared')
    } catch (err) {
      console.error('[Skybolt] Failed to clear cache:', err)
    }
  }

  /**
   * Full reset (public API for debugging)
   * Clears cache, unregisters Service Worker, reloads page
   */
  async selfDestruct(reload=true) {
    console.warn('[Skybolt] Self-destruct initiated')

    // Clear cache
    try {
      await caches.delete(CACHE_NAME)
    } catch (err) {
      // Ignore
    }

    // Clear cookies
    this.clearCookies()

    // Unregister Service Workers
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(r => r.unregister()))
    } catch (err) {
      // Ignore
    }

    // Reload
    if (reload) { location.reload() }
  }

  /**
   * Get cache information (public API for debugging)
   * @returns {Promise<{name: string, count: number, urls: string[]}>}
   */
  async getCacheInfo() {
    try {
      const cache = await caches.open(CACHE_NAME)
      const keys = await cache.keys()
      return {
        name: CACHE_NAME,
        count: keys.length,
        urls: keys.map(r => r.url)
      }
    } catch (err) {
      return { name: CACHE_NAME, count: 0, urls: [], error: err.message }
    }
  }
}

// Auto-initialize and expose globally
const skybolt = new SkyboltClient()

if (typeof window !== 'undefined') {
  window.skybolt = skybolt
}

export default skybolt
