/**
 * Chain Lightning Server Adapter
 *
 * Generates import maps and modulepreload hints for ES module components.
 * Integrates with Skybolt for cache state tracking and asset caching.
 */

import { readFileSync } from 'node:fs'

/**
 * @typedef {Object} ComponentInfo
 * @property {string} url - Versioned URL for the component
 * @property {string} hash - Content hash
 * @property {string} src - Original source path
 * @property {string[]} deps - Dependency URLs for preloading
 */

/**
 * @typedef {Object} ChunkInfo
 * @property {string} url - Versioned URL for the chunk
 * @property {string} hash - Content hash
 * @property {string} content - Full chunk content for inlining
 * @property {string} dataUrl - Base64 data URL for import map override
 */

/**
 * @typedef {Object} ChainLightningManifest
 * @property {number} version
 * @property {string} generated
 * @property {string} basePath
 * @property {{imports: Record<string, string>}} importMap
 * @property {Record<string, ChunkInfo>} chunks - Shared chunks with content for inlining
 * @property {Record<string, ComponentInfo>} components
 * @property {{url: string, hash: string, content: string}} client
 */

export class ChainLightning {
  /** @type {ChainLightningManifest} */
  #manifest

  /** @type {object|null} */
  #skybolt

  /** @type {boolean} */
  #importMapRendered = false

  /** @type {boolean} */
  #clientRendered = false

  /** @type {Set<string>} */
  #preloadedUrls = new Set()

  /** @type {Set<string>} */
  #renderedComponents = new Set()

  /** @type {Set<string>} */
  #handledChunks = new Set()

  /**
   * Create a Chain Lightning instance
   * @param {string} manifestPath - Path to the Chain Lightning manifest.json
   * @param {object} [skybolt] - Optional Skybolt instance for cache state and inlining
   */
  constructor(manifestPath, skybolt = null) {
    const content = readFileSync(manifestPath, 'utf-8')
    this.#manifest = JSON.parse(content)
    this.#skybolt = skybolt
  }

  /**
   * Get the raw manifest data
   * @returns {ChainLightningManifest}
   */
  getManifest() {
    return this.#manifest
  }

  /**
   * Render the global import map script tag
   * Should be called once in <head>
   * @returns {string} HTML script tag with import map
   */
  importMap() {
    if (this.#importMapRendered) {
      console.warn('[Chain Lightning] Import map already rendered. Only call importMap() once.')
      return ''
    }
    this.#importMapRendered = true

    const json = JSON.stringify(this.#manifest.importMap, null, 2)
    return `<script type="importmap">${json}</script>`
  }

  /** @type {boolean} */
  #manifestRendered = false

  /**
   * Render the manifest data script (sets window.__CL_MANIFEST__ and fires ready event)
   * Uses Skybolt for caching if available. Always render-blocking to ensure
   * components have access to manifest data before executing.
   * Should be called in <head> after import map
   * @returns {string} HTML script tag (inlined or external, never deferred)
   */
  manifestScript() {
    if (this.#manifestRendered) {
      console.warn('[Chain Lightning] Manifest script already rendered. Only call manifestScript() once.')
      return ''
    }
    this.#manifestRendered = true

    // Check if manifest has the new format with manifestScript data
    const manifestData = this.#manifest.manifestScript
    if (!manifestData) {
      // Fallback for old manifest format (no caching)
      const data = { components: this.#manifest.components }
      const json = JSON.stringify(data)
      return `<script>window.__CL_MANIFEST__=${json};dispatchEvent(new Event('chain-lightning:ready'))</script>`
    }

    const { url, hash, content } = manifestData
    const entryName = 'cl-manifest'

    // If Skybolt is available, use it for caching
    if (this.#skybolt && typeof this.#skybolt.hasCachedEntry === 'function') {
      if (this.#skybolt.hasCachedEntry(entryName, hash)) {
        // Client has it cached - external script (render-blocking, no defer/async)
        return `<script src="${url}"></script>`
      }
      // First visit or hash mismatch - inline with Skybolt attributes for caching
      // Render-blocking to ensure manifest is available before modules execute
      return `<script sb-asset="${entryName}:${hash}" sb-url="${url}">${content}</script>`
    }

    // No Skybolt - just inline the script
    return `<script>${content}</script>`
  }

  /**
   * Render all head scripts: import map, manifest, and client runtime
   * Convenience method that combines importMap(), manifestScript(), and clientScript()
   * Should be called once in <head>
   * @returns {string} HTML for all Chain Lightning head scripts
   */
  headScripts() {
    return [
      this.importMap(),
      this.manifestScript(),
      this.clientScript()
    ].join('\n')
  }

  /**
   * Render the client runtime script
   * Uses Skybolt for caching if available
   * Should be called in <head> after manifestScript()
   * @returns {string} HTML script tag (inlined or external)
   */
  clientScript() {
    if (this.#clientRendered) {
      console.warn('[Chain Lightning] Client script already rendered. Only call clientScript() once.')
      return ''
    }
    this.#clientRendered = true

    const { url, hash, content } = this.#manifest.client
    const entryName = 'chain-lightning'

    // If Skybolt is available, use it for caching
    if (this.#skybolt && typeof this.#skybolt.hasCachedEntry === 'function') {
      if (this.#skybolt.hasCachedEntry(entryName, hash)) {
        // Client has it cached - external script
        return `<script type="module" src="${url}"></script>`
      }
      // First visit - inline with Skybolt attributes for caching
      return `<script type="module" sb-asset="${entryName}:${hash}" sb-url="${url}">${content}</script>`
    }

    // No Skybolt - just inline the script
    return `<script type="module">${content}</script>`
  }

  /**
   * Check if a chunk is cached (via Skybolt)
   * @param {string} specifier - Chunk specifier (e.g., "chunk:debounce")
   * @param {string} hash - Content hash
   * @returns {boolean}
   */
  #isChunkCached(specifier, hash) {
    if (!this.#skybolt) return false
    // Use hasCachedEntry since chunks are not in Skybolt's render-map
    // but are tracked in the sb_digest cookie with their specifier as the entry name
    return this.#skybolt.hasCachedEntry(specifier, hash)
  }

  /**
   * Get chunk info by specifier
   * @param {string} specifier - e.g., "chunk:debounce"
   * @returns {ChunkInfo|null}
   */
  #getChunk(specifier) {
    return this.#manifest.chunks?.[specifier] ?? null
  }

  /**
   * Render an importmap for a chunk specifier.
   * Since chunks are not in the static import map, we always need to provide
   * a mapping so the browser can resolve the import.
   *
   * @param {string} specifier - Chunk specifier (e.g., "chunk:debounce")
   * @param {ChunkInfo} chunk - Chunk info from manifest
   * @param {boolean} isCached - Whether the chunk is already cached
   * @param {boolean} inline - Whether to use data URL for inlining (first visit optimization)
   * @returns {string} HTML importmap script tag
   */
  #renderChunkImportMap(specifier, chunk, isCached, inline) {
    // Use data URL only if inlining is requested AND chunk is not cached
    const useDataUrl = inline && !isCached

    const importMap = {
      imports: {
        [specifier]: useDataUrl ? chunk.dataUrl : chunk.url
      }
    }

    if (useDataUrl) {
      // Inlined - use data URL and add sb-asset/sb-url for Skybolt caching
      return `<script type="importmap" sb-asset="${specifier}:${chunk.hash}" sb-url="${chunk.url}">${JSON.stringify(importMap)}</script>`
    }

    // Not inlined or cached - just need the mapping to the actual URL
    return `<script type="importmap">${JSON.stringify(importMap)}</script>`
  }

  /**
   * Get preload info for a component's dependencies
   * Returns specifiers and URLs for uncached chunks
   * @param {string} componentName
   * @returns {Array<{specifier: string, url: string}>}
   */
  #getPreloadInfo(componentName) {
    const component = this.#manifest.components[componentName]
    if (!component) return []

    const info = []

    for (const depSpecifier of component.deps) {
      const chunk = this.#getChunk(depSpecifier)
      if (!chunk) continue // Not a chunk we track

      if (!this.#isChunkCached(depSpecifier, chunk.hash) && !this.#preloadedUrls.has(depSpecifier)) {
        info.push({ specifier: depSpecifier, url: chunk.url })
      }
    }

    return info
  }

  /**
   * Render a component with its chunk dependencies
   * Uses Skybolt for caching the component itself
   * Safe to call multiple times - subsequent calls return empty string
   *
   * Chunk dependencies are rendered via override importmaps + modulepreload:
   * - Importmap provides URL mapping (actual URL or data URL if inlineDeps: true)
   * - Modulepreload always included to trigger early fetch/parse/compile
   *
   * @param {string} componentName - Name of the component
   * @param {Object} [options] - Options
   * @param {boolean} [options.inlineDeps=false] - Inline chunk deps via data URLs (first visit optimization)
   * @returns {string} HTML for chunk importmaps, preloads, and component script tag (empty if already rendered)
   */
  component(componentName, options = {}) {
    const { inlineDeps = false } = options

    const component = this.#manifest.components[componentName]
    if (!component) {
      console.warn(`[Chain Lightning] Component "${componentName}" not found in manifest`)
      return ''
    }

    // Skip if already rendered - ES modules must only be included once
    if (this.#renderedComponents.has(componentName)) {
      return ''
    }
    this.#renderedComponents.add(componentName)

    const importMaps = []
    const preloads = []

    // Handle chunk dependencies - since chunks are excluded from the static
    // import map, we ALWAYS need to provide an importmap for each chunk
    for (const depSpecifier of component.deps) {
      // Skip if already handled
      if (this.#handledChunks.has(depSpecifier)) continue

      const chunk = this.#getChunk(depSpecifier)
      if (!chunk) continue // Not a chunk (external dep in static import map)

      const isCached = this.#isChunkCached(depSpecifier, chunk.hash)

      // Always output importmap for chunks (they're not in static import map)
      const useDataUrl = inlineDeps && !isCached
      importMaps.push(this.#renderChunkImportMap(depSpecifier, chunk, isCached, inlineDeps))

      // Add modulepreload only when NOT inlining via data URL
      // When inlined, the data URL in the import map already contains the content,
      // so a modulepreload would be redundant.
      // Note: modulepreload href must be an actual URL, not an import map specifier
      // (browsers interpret "chunk:" as a protocol, causing CORS errors)
      if (!useDataUrl && !this.#preloadedUrls.has(depSpecifier)) {
        preloads.push(`<link rel="modulepreload" href="${chunk.url}">`)
        this.#preloadedUrls.add(depSpecifier)
      }

      this.#handledChunks.add(depSpecifier)
    }

    // Combine: importmaps first, then preloads
    const parts = [...importMaps, ...preloads]

    // Add the script tag - use Skybolt caching if available
    if (this.#skybolt) {
      // Use Skybolt's script method for proper caching
      const scriptHtml = this.#skybolt.script(component.src)
      parts.push(scriptHtml)
    } else {
      // No Skybolt - just add external script tag
      parts.push(`<script type="module" src="${component.url}"></script>`)
    }

    return parts.join('\n')
  }

  /**
   * Get early hints for components (for HTTP 103)
   * Call this before response body starts
   * Note: Early Hints use actual URLs (not specifiers) since they're sent
   * as HTTP headers before the import map is available
   * @param {string[]} componentNames - Components that will be on the page
   * @returns {Array<{rel: string, href: string}>} Link header entries
   */
  getEarlyHints(componentNames) {
    const hints = []

    for (const componentName of componentNames) {
      const preloadInfo = this.#getPreloadInfo(componentName)
      for (const { specifier, url } of preloadInfo) {
        // Use actual URL for HTTP headers (import map not available yet)
        hints.push({ rel: 'preload', href: url, as: 'script' })
        // Track by specifier for consistency with component() method
        this.#preloadedUrls.add(specifier)
      }
    }

    return hints
  }

  /**
   * Get the URL for a component (for manual use)
   * @param {string} componentName
   * @returns {string|null}
   */
  getComponentUrl(componentName) {
    const component = this.#manifest.components[componentName]
    return component?.url ?? null
  }

  /**
   * Get the URL for a module specifier (for manual use)
   * @param {string} specifier - e.g., "lodash-es@4"
   * @returns {string|null}
   */
  getModuleUrl(specifier) {
    return this.#manifest.importMap.imports[specifier] ?? null
  }
}

export default ChainLightning
