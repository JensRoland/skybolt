/*! Chain Lightning - @version 0.1.0 */
/**
 * Provides dynamic import with parallel dependency preloading.
 * Works with Skybolt for cache state tracking.
 */

// Registry for inlined scripts to register their exports
// This prevents double-execution when import() is called on an already-inlined module
// since ES modules must only be executed once per URL, but inlined scripts don't have URLs
if (typeof window !== 'undefined' && !window.__CL_MODULES__) {
  window.__CL_MODULES__ = new Map()
}

class ChainLightningClient {
  constructor() {
    this.manifest = null
    this.preloadedUrls = new Set()
    this._ready = this._init()
  }

  /**
   * Initialize by waiting for manifest
   */
  async _init() {
    // Manifest may already be set
    if (window.__CL_MANIFEST__) {
      this.manifest = window.__CL_MANIFEST__
    } else {
      // Wait for manifest via event
      await new Promise((resolve) => {
        window.addEventListener('chain-lightning:ready', () => {
          this.manifest = window.__CL_MANIFEST__
          resolve()
        }, { once: true })
      })
    }
  }

  /**
   * Get the inlined module registry
   * Inlined scripts register here to prevent double-execution on dynamic import
   * @returns {Map<string, object>} URL -> module exports
   */
  get inlinedModules() {
    return window.__CL_MODULES__
  }

  /**
   * Ensure client is ready (manifest loaded)
   */
  async ready() {
    return this._ready
  }

  /**
   * Check if a URL is cached (via Skybolt)
   * @param {string} url
   * @returns {boolean}
   */
  isCached(url) {
    return typeof window !== 'undefined' &&
           window.skybolt &&
           typeof window.skybolt.isCachedUrl === 'function' &&
           window.skybolt.isCachedUrl(url)
  }

  /**
   * Inject modulepreload hints for URLs
   * @param {string[]} urls
   */
  injectPreloads(urls) {
    for (const url of urls) {
      if (this.preloadedUrls.has(url)) continue

      const link = document.createElement('link')
      link.rel = 'modulepreload'
      link.href = url
      document.head.appendChild(link)
      this.preloadedUrls.add(url)
    }
  }

  /**
   * Get all URLs needed for a component (including dependencies)
   * @param {string} componentName
   * @returns {string[]}
   */
  getComponentUrls(componentName) {
    if (!this.manifest) {
      console.warn('[Chain Lightning] Manifest not loaded yet')
      return []
    }
    const component = this.manifest.components[componentName]
    if (!component) {
      console.warn(`[Chain Lightning] Component "${componentName}" not found`)
      return []
    }
    return [component.url, ...component.deps]
  }

  /**
   * Dynamically import a component with parallel dependency preloading
   * @param {string} componentName - Name of the component to import
   * @returns {Promise<any>} The imported module
   */
  async import(componentName) {
    await this._ready

    const component = this.manifest.components[componentName]
    if (!component) {
      throw new Error(`[Chain Lightning] Component "${componentName}" not found in manifest`)
    }

    // If this module was inlined on the page, return its registered exports
    // This prevents double-execution of inlined code
    if (this.inlinedModules.has(component.url)) {
      return this.inlinedModules.get(component.url)
    }

    const allUrls = this.getComponentUrls(componentName)
    const uncachedUrls = allUrls.filter(url => !this.isCached(url))

    this.injectPreloads(uncachedUrls)

    // Small delay to let preloads start
    await new Promise(resolve => setTimeout(resolve, 0))

    // Dynamic import - browser's module cache handles deduplication for URL-based modules
    return import(component.url)
  }

  /**
   * Preload a component and its dependencies without executing
   * @param {string} componentName
   */
  async preload(componentName) {
    await this._ready
    const urls = this.getComponentUrls(componentName)
    const uncachedUrls = urls.filter(url => !this.isCached(url))
    this.injectPreloads(uncachedUrls)
  }

  /**
   * Get info about a component
   * @param {string} componentName
   * @returns {object|null}
   */
  getComponentInfo(componentName) {
    return this.manifest?.components[componentName] ?? null
  }

  /**
   * List all available components
   * @returns {string[]}
   */
  listComponents() {
    return Object.keys(this.manifest?.components ?? {})
  }

  /**
   * Check if a component was inlined on the current page
   * Note: This doesn't track externally loaded modules (browser handles those)
   * @param {string} componentName
   * @returns {boolean}
   */
  wasInlined(componentName) {
    const component = this.manifest?.components[componentName]
    return component ? this.inlinedModules.has(component.url) : false
  }

  /**
   * List all inlined component URLs on the current page
   * @returns {string[]}
   */
  listInlinedUrls() {
    return [...this.inlinedModules.keys()]
  }
}

// Auto-initialize and expose globally
const chainLightning = new ChainLightningClient()
if (typeof window !== 'undefined') {
  window.chainLightning = chainLightning
}

export { chainLightning, ChainLightningClient }
