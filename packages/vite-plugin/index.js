/**
 * @skybolt/vite-plugin
 *
 * Generates a render-map.json for multi-language server adapters.
 * Enables high-performance asset caching via Service Workers.
 *
 * @module @skybolt/vite-plugin
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKYBOLT_VERSION = '3.4.0'

/**
 * @typedef {Object} SkyboltPluginOptions
 * @property {string} [outDir='.skybolt'] - Output directory relative to build output
 * @property {string} [swPath='/skybolt-sw.js'] - URL path for Service Worker
 * @property {boolean} [debug=false] - Enable debug logging
 */

/**
 * @typedef {Object} AssetEntry
 * @property {string} url - Full URL path to the asset
 * @property {string} hash - Content hash extracted from filename
 * @property {number} size - Size in bytes
 * @property {string} content - Full minified content
 */

/**
 * @typedef {Object} LauncherEntry
 * @property {string} url - Full URL path to the launcher script
 * @property {string} hash - Content hash for cache invalidation
 * @property {string} content - Full minified content
 */

/**
 * @typedef {Object} RenderMap
 * @property {number} version - Render map schema version
 * @property {string} generated - ISO timestamp of generation
 * @property {string} skyboltVersion - Skybolt version
 * @property {string} basePath - Base path for assets
 * @property {Object<string, AssetEntry>} assets - Map of source paths to asset entries
 * @property {LauncherEntry} launcher - Launcher script entry (cached like assets)
 * @property {{filename: string, path: string}} serviceWorker - Service Worker info
 */

/**
 * Skybolt Vite Plugin
 *
 * Generates a render-map.json at build time containing all asset metadata
 * and content needed for server-side rendering with intelligent caching.
 *
 * @param {SkyboltPluginOptions} [options={}]
 * @returns {import('vite').Plugin}
 *
 * @example
 * // vite.config.js
 * import { defineConfig } from 'vite'
 * import { skybolt } from '@skybolt/vite-plugin'
 *
 * export default defineConfig({
 *   build: { manifest: true },
 *   plugins: [skybolt()]
 * })
 */
export function skybolt(options = {}) {
  const {
    outDir = '.skybolt',
    swPath = '/skybolt-sw.js',
    debug = false
  } = options

  /** @type {import('vite').ResolvedConfig} */
  let config

  /** @type {string} */
  let buildOutDir

  /**
   * Log message if debug enabled
   * @param {string} message
   */
  const log = (message) => {
    if (debug) {
      console.log(`[skybolt] ${message}`)
    }
  }

  return {
    name: 'skybolt',
    apply: 'build',

    configResolved(resolvedConfig) {
      config = resolvedConfig
      buildOutDir = resolvedConfig.build.outDir

      // Warn if manifest is not enabled
      if (!resolvedConfig.build.manifest) {
        console.warn('[skybolt] Warning: build.manifest is not enabled in vite.config.js')
        console.warn('[skybolt] Add `build: { manifest: true }` to your Vite config')
      }
    },

    closeBundle() {
      const manifestPath = resolve(buildOutDir, '.vite/manifest.json')

      // Check manifest exists
      if (!existsSync(manifestPath)) {
        console.error('[skybolt] Error: manifest.json not found at', manifestPath)
        console.error('[skybolt] Ensure build.manifest is true in vite.config.js')
        return
      }

      /** @type {Record<string, import('vite').ManifestChunk>} */
      let manifest
      try {
        manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        log(`Read manifest with ${Object.keys(manifest).length} entries`)
      } catch (err) {
        console.error('[skybolt] Failed to read manifest.json:', err.message)
        return
      }

      // Build assets map
      /** @type {Object<string, AssetEntry>} */
      const assets = {}

      for (const [src, entry] of Object.entries(manifest)) {
        const outputPath = resolve(buildOutDir, entry.file)

        // Check if file exists and read content
        if (!existsSync(outputPath)) {
          log(`Skipping ${src}: output file not found`)
          continue
        }

        const content = readFileSync(outputPath, 'utf-8')
        const hash = extractHash(entry.file)
        const url = normalizeUrl(config.base, entry.file)

        assets[src] = {
          url,
          hash,
          size: Buffer.byteLength(content, 'utf-8'),
          content
        }

        log(`Added asset: ${src} -> ${url} (${assets[src].size} bytes)`)

        // Also process CSS files imported by JS entries
        if (entry.css && entry.css.length > 0) {
          for (const cssFile of entry.css) {
            const cssOutputPath = resolve(buildOutDir, cssFile)

            if (!existsSync(cssOutputPath)) {
              log(`Skipping CSS ${cssFile}: file not found`)
              continue
            }

            const cssContent = readFileSync(cssOutputPath, 'utf-8')
            const cssHash = extractHash(cssFile)
            const cssUrl = normalizeUrl(config.base, cssFile)

            // Find source path for this CSS file
            const cssSrc = findSourceForOutput(manifest, cssFile)

            if (cssSrc && !assets[cssSrc]) {
              assets[cssSrc] = {
                url: cssUrl,
                hash: cssHash,
                size: Buffer.byteLength(cssContent, 'utf-8'),
                content: cssContent
              }
              log(`Added CSS: ${cssSrc} -> ${cssUrl}`)
            }
          }
        }
      }

      // Read client script and generate launcher entry
      const clientPath = resolve(__dirname, 'client.min.js')
      let clientScript

      if (existsSync(clientPath)) {
        clientScript = readFileSync(clientPath, 'utf-8')
      } else {
        console.error('[skybolt] Error: minified client-min.js not found')
        return
      }

      // Generate hash for launcher (8 chars like Vite assets)
      const launcherHash = createHash('sha256')
        .update(clientScript)
        .digest('base64url')
        .slice(0, 8)
      const launcherFilename = `skybolt-launcher-${launcherHash}.js`
      const launcherUrl = normalizeUrl(config.base, `assets/${launcherFilename}`)

      // Build render map
      /** @type {RenderMap} */
      const renderMap = {
        version: 1,
        generated: new Date().toISOString(),
        skyboltVersion: SKYBOLT_VERSION,
        basePath: config.base,
        assets,
        launcher: {
          url: launcherUrl,
          hash: launcherHash,
          content: clientScript
        },
        serviceWorker: {
          filename: 'skybolt-sw.js',
          path: swPath
        }
      }

      // Create output directory
      const skyboltOutDir = resolve(buildOutDir, outDir)
      mkdirSync(skyboltOutDir, { recursive: true })

      // Write render map
      const renderMapPath = resolve(skyboltOutDir, 'render-map.json')
      writeFileSync(renderMapPath, JSON.stringify(renderMap, null, 2))
      console.log(`[skybolt] Generated ${outDir}/render-map.json (${Object.keys(assets).length} assets)`)

      // Copy minified Service Worker to build output
      const swSourcePath = resolve(__dirname, 'sw.min.js')
      const swDestPath = resolve(buildOutDir, 'skybolt-sw.js')

      if (existsSync(swSourcePath)) {
        copyFileSync(swSourcePath, swDestPath)
        console.log(`[skybolt] Copied skybolt-sw.js to ${buildOutDir}/`)
      } else {
        console.error('[skybolt] Error: sw.min.js not found in plugin directory')
      }

      // Copy launcher script to assets directory (for external loading on repeat visits)
      const assetsDir = resolve(buildOutDir, 'assets')
      mkdirSync(assetsDir, { recursive: true })
      const launcherDestPath = resolve(assetsDir, launcherFilename)
      writeFileSync(launcherDestPath, clientScript)
      console.log(`[skybolt] Generated ${launcherFilename} (${Buffer.byteLength(clientScript)} bytes)`)
    }
  }
}

/**
 * Extract hash from Vite-generated filename
 *
 * Vite generates filenames like "main-Hx7kQ9mN.js" or "style-AbC12345.css"
 * This extracts the 8-character hash portion.
 *
 * @param {string} filename - The filename to extract hash from
 * @returns {string} The extracted hash, or the full basename if no hash found
 */
function extractHash(filename) {
  const base = basename(filename)
  // Match pattern: name-HASH.ext where HASH is 8 alphanumeric chars
  const match = base.match(/-([a-zA-Z0-9_-]{8})\.(js|css|mjs)$/)
  return match ? match[1] : base.replace(/\.(js|css|mjs)$/, '')
}

/**
 * Normalize URL by combining base path and file path
 *
 * @param {string} base - Base path (e.g., '/' or '/assets/')
 * @param {string} file - File path from manifest
 * @returns {string} Normalized URL
 */
function normalizeUrl(base, file) {
  // Remove trailing slash from base, leading slash from file
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
  const cleanFile = file.startsWith('/') ? file.slice(1) : file
  return `${cleanBase}/${cleanFile}`
}

/**
 * Find the source file path for a given output file
 *
 * @param {Record<string, import('vite').ManifestChunk>} manifest
 * @param {string} outputFile
 * @returns {string|null}
 */
function findSourceForOutput(manifest, outputFile) {
  for (const [src, entry] of Object.entries(manifest)) {
    if (entry.file === outputFile) {
      return src
    }
  }
  return null
}

// Default export for convenience
export default skybolt
