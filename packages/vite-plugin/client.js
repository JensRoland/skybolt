/*! Skybolt - @version 3.5.1 */
/**
 * Registers Service Worker and coordinates cache state via cookies.
 * Extracts inlined assets and stores them in Cache API.
 */

import { CuckooFilter } from './cache-digest.js'

const CACHE_NAME = 'skybolt-v1'
const COOKIE_NAME = 'sb_digest'
const COOKIE_MAX_AGE = 31536000 // 1 year

// ============================================================================
// Skybolt Client
// ============================================================================

class SkyboltClient {
  constructor() {
    /** @type {Record<string, string>} Asset name -> hash */
    this.versions = {}

    /** @type {ServiceWorkerRegistration|null} */
    this.registration = null

    /** @type {{swPath: string}} */
    this.config = null

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
      this.config = this.loadConfig()
      this.registration = await navigator.serviceWorker.register(this.config.swPath, {
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

    // Process any inlined assets on the page, then finalize
    // We need to wait for DOM to be ready so we can find all sb-asset elements
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.processAndFinalize())
    } else {
      this.processAndFinalize()
    }
  }

  /**
   * Process inlined assets and update cookie
   * Must wait for cache operations to complete before updating cookie
   */
  async processAndFinalize() {
    await this.processInlinedAssets()
    await this.finalize()
  }

  /**
   * Load configuration from meta tag
   * @returns {{swPath: string}}
   */
  loadConfig() {
    const defaults = { swPath: '/skybolt-sw.js' }
    const meta = document.querySelector('meta[name="skybolt-config"]')
    if (meta) {
      try {
        return { ...defaults, ...JSON.parse(meta.content) }
      } catch (err) {
        console.warn('[Skybolt] Invalid config meta tag')
      }
    }
    return defaults
  }

  /**
   * Process all inlined assets and cache them
   * @returns {Promise<void>}
   */
  async processInlinedAssets() {
    const elements = document.querySelectorAll('[sb-asset]')
    console.log(`[Skybolt] Found ${elements.length} assets to cache`)

    const cachePromises = []

    elements.forEach(el => {
      const cacheInfo = el.getAttribute('sb-asset')
      const url = el.getAttribute('sb-url')

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

      // Handle importmap elements specially - extract data URL content
      if (el.type === 'importmap') {
        cachePromises.push(this.processImportMapAsset(el, url, name, hash))
        return
      }

      // Get content and content type for regular elements
      const content = el.textContent || ''
      const contentType = el.tagName === 'STYLE' ? 'text/css' : 'application/javascript'

      // Cache the asset
      cachePromises.push(this.cacheAsset(url, content, contentType, name, hash))
    })

    // Wait for all cache operations to complete
    await Promise.all(cachePromises)
  }

  /**
   * Process an importmap element with sb-asset attributes
   * Extracts the data URL content and caches the decoded JavaScript
   * @param {HTMLScriptElement} el - The importmap script element
   * @param {string} url - Cache URL
   * @param {string} name - Asset name
   * @param {string} hash - Content hash
   * @returns {Promise<void>}
   */
  async processImportMapAsset(el, url, name, hash) {
    try {
      const importMap = JSON.parse(el.textContent || '{}')
      // Skybolt importmaps contain exactly one entry
      const dataUrl = Object.values(importMap.imports || {})[0]

      if (!dataUrl?.startsWith('data:application/javascript;base64,')) {
        console.warn('[Skybolt] Invalid importmap data URL:', name)
        return
      }

      // Decode the base64 content and cache
      const base64 = dataUrl.slice('data:application/javascript;base64,'.length)
      await this.cacheAsset(url, atob(base64), 'application/javascript', name, hash)
    } catch (err) {
      console.error('[Skybolt] Failed to process importmap:', name, err)
    }
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
  async finalize() {
    const count = Object.keys(this.versions).length
    if (count > 0) {
      await this.updateCookieFromCache()
      console.log(`[Skybolt] Ready (${count} new assets cached)`)
    } else {
      // No new assets to cache - validate existing cache integrity
      this.validateCache()
    }
  }

  /**
   * Update cookie based on actual Cache API contents
   * Uses Cache Digest (Cuckoo filter) for compact storage
   */
  async updateCookieFromCache() {
    try {
      const cache = await caches.open(CACHE_NAME)
      const keys = await cache.keys()
      const versions = {}

      // Read metadata from each cached response
      for (const request of keys) {
        const response = await cache.match(request)
        if (response) {
          const name = response.headers.get('X-Skybolt-Name')
          const hash = response.headers.get('X-Skybolt-Hash')
          if (name && hash) {
            versions[name] = hash
          }
        }
      }

      const entries = Object.entries(versions)
      if (entries.length === 0) return

      // Write Cache Digest cookie (compact Cuckoo filter)
      const filter = new CuckooFilter(entries.length)
      for (const [name, hash] of entries) {
        filter.insert(`${name}:${hash}`)
      }
      const digest = filter.toBase64()
      document.cookie = `${COOKIE_NAME}=${digest}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
      console.log(`[Skybolt] Cache state stored (${digest.length} bytes, ${entries.length} assets)`)
    } catch (err) {
      console.error('[Skybolt] Failed to update cookie from cache:', err)
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
   * Clear cookies so next visit will inline assets again
   */
  handleNoServiceWorker() {
    console.warn('[Skybolt] Service Worker unavailable, clearing cookies')
    this.clearCookies()
  }

  /**
   * Clear all Skybolt cookies
   */
  clearCookies() {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
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

  /**
   * Check if a URL is cached (public API for integrations like Chain Lightning)
   * Uses the versions tracked during this page load
   * @param {string} url - URL to check (can be relative or absolute)
   * @returns {boolean} True if URL hash matches a cached asset
   */
  isCachedUrl(url) {
    // Check if URL contains any hash we've cached this session
    for (const hash of Object.values(this.versions)) {
      if (url.includes(hash)) {
        return true
      }
    }
    return false
  }
}

// Auto-initialize and expose globally
const skybolt = new SkyboltClient()

if (typeof window !== 'undefined') {
  window.skybolt = skybolt
}

export default skybolt
