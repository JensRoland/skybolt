/**
 * Chain Lightning Vite Plugin
 *
 * Analyzes ES module dependencies and generates:
 * 1. Import map for version-flexible module resolution
 * 2. Dependency graph for parallel preloading
 * 3. Rewritten imports to use import map specifiers
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { createHash } from 'node:crypto'

/**
 * @typedef {Object} ComponentConfig
 * @property {string} name - Component entry name
 * @property {string} [package] - npm package name for @major versioning
 * @property {string} [version] - Explicit version specifier (e.g., "1" for @1)
 */

/**
 * @typedef {Object} ChainLightningOptions
 * @property {(string|ComponentConfig)[]} components - Entry point names to treat as components
 * @property {string} [outDir='.chain-lightning'] - Output directory for manifest
 * @property {boolean} [debug=false] - Enable debug logging
 * @property {boolean} [majorVersionImports=true] - Add @major version specifiers to import map
 */

/**
 * Chain Lightning Vite plugin
 * @param {ChainLightningOptions} options
 */
export function chainLightning(options = {}) {
  const {
    components = [],
    outDir = '.chain-lightning',
    debug = false,
    majorVersionImports = true
  } = options

  let config
  let buildOutDir
  let moduleOrigins = new Map() // filename -> origin module path

  const log = (...args) => {
    if (debug) console.log('[Chain Lightning]', ...args)
  }

  return {
    name: 'chain-lightning',
    apply: 'build',
    enforce: 'post', // Run after other plugins

    configResolved(resolvedConfig) {
      config = resolvedConfig
      buildOutDir = resolvedConfig.build.outDir
    },

    generateBundle(options, bundle) {
      // Capture module origins from Rollup's bundle info
      // This lets us trace: hashed filename → original module → package.json
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk') {
          // facadeModuleId is the entry point, moduleIds contains all modules in chunk
          const originModule = chunk.facadeModuleId || chunk.moduleIds?.[0]
          if (originModule) {
            moduleOrigins.set(fileName, originModule)
            log(`Module origin: ${fileName} <- ${originModule}`)
          }
        }
      }
    },

    closeBundle() {
      log('Processing build output...')

      // Read Vite's manifest
      const manifestPath = resolve(buildOutDir, '.vite', 'manifest.json')
      if (!existsSync(manifestPath)) {
        console.error('[Chain Lightning] Vite manifest not found. Ensure build.manifest is enabled.')
        return
      }

      const viteManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      log('Vite manifest entries:', Object.keys(viteManifest).length)

      // Read package.json for version info
      const pkgVersions = readPackageVersions(config.root)

      // Build mappings: filename -> specifier, and collect component info
      const {
        importMap,
        filenameToSpecifier,
        componentGraph,
        chunks
      } = buildMappings(viteManifest, components, pkgVersions, config.base, majorVersionImports, log, buildOutDir, moduleOrigins, config.root)

      // Rewrite imports in all JS files
      rewriteImports(buildOutDir, viteManifest, filenameToSpecifier, log)

      // Inject module registration code into components (for inlined script support)
      injectModuleRegistration(buildOutDir, componentGraph, log)

      // Read client script (prefer minified version)
      const pluginDir = dirname(import.meta.url.replace('file://', ''))
      const clientMinPath = resolve(pluginDir, 'client.min.js')
      const clientPath = resolve(pluginDir, 'client.js')
      let clientScript = ''
      if (existsSync(clientMinPath)) {
        clientScript = readFileSync(clientMinPath, 'utf-8')
        log('Using minified client script')
      } else if (existsSync(clientPath)) {
        clientScript = readFileSync(clientPath, 'utf-8')
        log('Using unminified client script (run npm run minify to optimize)')
      }

      // Generate content hash for client script
      const clientHash = createHash('sha256')
        .update(clientScript)
        .digest('base64url')
        .slice(0, 8)

      // Write client script as a separate cacheable asset
      const clientFilename = `chain-lightning-${clientHash}.js`
      const clientUrl = normalizeUrl(config.base, `assets/${clientFilename}`)
      const clientOutPath = resolve(buildOutDir, 'assets', clientFilename)
      writeFileSync(clientOutPath, clientScript)
      log(`Wrote client script to ${clientOutPath}`)

      // Generate manifest data script (component info for client)
      // This is a render-blocking script that sets window.__CL_MANIFEST__
      const manifestData = { components: componentGraph }
      const manifestScriptContent = `window.__CL_MANIFEST__=${JSON.stringify(manifestData)};dispatchEvent(new Event('chain-lightning:ready'))`

      // Hash and write manifest script as cacheable asset
      const manifestScriptHash = createHash('sha256')
        .update(manifestScriptContent)
        .digest('base64url')
        .slice(0, 8)
      const manifestScriptFilename = `cl-manifest-${manifestScriptHash}.js`
      const manifestScriptUrl = normalizeUrl(config.base, `assets/${manifestScriptFilename}`)
      const manifestScriptOutPath = resolve(buildOutDir, 'assets', manifestScriptFilename)
      writeFileSync(manifestScriptOutPath, manifestScriptContent)
      log(`Wrote manifest script to ${manifestScriptOutPath}`)

      // Create the Chain Lightning build manifest (for server adapter)
      const clOutDir = resolve(buildOutDir, outDir)
      mkdirSync(clOutDir, { recursive: true })

      const manifest = {
        version: 1,
        generated: new Date().toISOString(),
        chainLightningVersion: '0.1.0',
        basePath: config.base || '/',
        importMap,
        chunks,
        components: componentGraph,
        manifestScript: {
          url: manifestScriptUrl,
          hash: manifestScriptHash,
          content: manifestScriptContent
        },
        client: {
          url: clientUrl,
          hash: clientHash,
          content: clientScript
        }
      }

      const manifestOutPath = resolve(clOutDir, 'manifest.json')
      writeFileSync(manifestOutPath, JSON.stringify(manifest, null, 2))
      log('Wrote manifest to', manifestOutPath)

      // Update Skybolt render-map with rewritten content
      updateSkyboltRenderMap(buildOutDir, log)

      console.log(`[Chain Lightning] Generated manifest with ${Object.keys(componentGraph).length} components`)
    }
  }
}

/**
 * Read package versions from package-lock.json or package.json
 * Also reads the root project version for local source files
 */
function readPackageVersions(root) {
  const versions = {}
  let rootVersion = '0.0.0'

  // Read root package.json for project version
  const pkgPath = resolve(root, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      if (pkg.version) {
        rootVersion = pkg.version
      }
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      for (const [name, range] of Object.entries(deps)) {
        if (!versions[name]) {
          const match = range.match(/(\d+)\./)
          if (match) {
            versions[name] = match[0] + '0.0'
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Read package-lock.json for exact versions
  const lockPath = resolve(root, 'package-lock.json')
  if (existsSync(lockPath)) {
    try {
      const lock = JSON.parse(readFileSync(lockPath, 'utf-8'))
      if (lock.packages) {
        for (const [path, info] of Object.entries(lock.packages)) {
          if (path.startsWith('node_modules/') && info.version) {
            const name = path.replace('node_modules/', '')
            if (!name.includes('node_modules/')) {
              versions[name] = info.version
            }
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Store root version under special key
  versions['__root__'] = rootVersion

  return versions
}

/**
 * Resolve the major version for a module based on its origin path
 * @param {string|undefined} modulePath - Absolute path to the module
 * @param {string} root - Project root directory
 * @param {Object} pkgVersions - Cached package versions
 * @returns {string} Major version (e.g., "1", "4", "0")
 */
function resolveModuleVersion(modulePath, root, pkgVersions) {
  if (!modulePath) {
    return getMajorVersion(pkgVersions['__root__'])
  }

  // Check if this is from node_modules
  const nodeModulesMatch = modulePath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/)
  if (nodeModulesMatch) {
    const pkgName = nodeModulesMatch[1]
    if (pkgVersions[pkgName]) {
      return getMajorVersion(pkgVersions[pkgName])
    }
    // Try to read package.json directly from node_modules
    const pkgJsonPath = resolve(root, 'node_modules', pkgName, 'package.json')
    if (existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
        if (pkg.version) {
          return getMajorVersion(pkg.version)
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // Local source file - use project version
  return getMajorVersion(pkgVersions['__root__'])
}

/**
 * Extract major version from a version string
 */
function getMajorVersion(version) {
  if (!version) return '0'
  const match = version.match(/^(\d+)/)
  return match ? match[1] : '0'
}

/**
 * Extract the base name from a Vite hashed filename
 * e.g., "debounce-CJ01Vb4c.js" -> "debounce"
 */
function extractBaseName(filename) {
  const base = basename(filename)
  // Remove hash suffix: name-XXXXXXXX.js -> name
  const match = base.match(/^(.+)-[a-zA-Z0-9_-]{8}\.(js|mjs)$/)
  return match ? match[1] : base.replace(/\.(js|mjs)$/, '')
}

/**
 * Extract 8-char hash from Vite filename
 */
function extractHash(filename) {
  const match = basename(filename).match(/-([a-zA-Z0-9_-]{8})\.(js|css|mjs)$/)
  return match ? match[1] : basename(filename).replace(/\.(js|css|mjs)$/, '')
}

/**
 * Normalize URL with base path
 */
function normalizeUrl(base, file) {
  const cleanBase = (base || '/').replace(/\/$/, '')
  return `${cleanBase}/${file}`
}

/**
 * Build import map and filename-to-specifier mappings
 */
function buildMappings(viteManifest, componentConfigs, pkgVersions, base, majorVersionImports, log, buildOutDir, moduleOrigins, root) {
  const importMap = { imports: {} }
  const filenameToSpecifier = new Map() // hashed filename -> specifier (with @version)
  const componentGraph = {}
  const keyToUrl = new Map()
  const chunks = {} // specifier -> { url, hash, content }

  // First pass: build specifier mappings for all chunks
  for (const [key, entry] of Object.entries(viteManifest)) {
    const url = normalizeUrl(base, entry.file)
    const filename = basename(entry.file)

    keyToUrl.set(key, url)

    // Skip CSS files
    if (key.endsWith('.css') || filename.endsWith('.css')) continue

    // Determine the specifier for this file
    let specifier = null

    if (entry.isEntry) {
      // Entry points use their name as specifier
      specifier = basename(key).replace(/\.(js|ts|mjs)$/, '')
    } else if (key.startsWith('_')) {
      // Shared chunks use chunk:name@version format
      const chunkName = extractBaseName(entry.file)
      // Resolve major version from module origin
      const moduleOrigin = moduleOrigins.get(entry.file)
      const majorVersion = resolveModuleVersion(moduleOrigin, root, pkgVersions)
      specifier = `chunk:${chunkName}@${majorVersion}`
      log(`Chunk "${chunkName}" from ${moduleOrigin || 'unknown'} -> @${majorVersion}`)
    }

    if (specifier) {
      filenameToSpecifier.set(filename, specifier)

      // For shared chunks, DON'T add to static import map - they'll be resolved
      // via override importmaps (data URL on first visit, regular URL on repeat)
      if (key.startsWith('_')) {
        const hash = extractHash(entry.file)
        const filePath = resolve(buildOutDir, entry.file)
        let content = ''
        let dataUrl = ''
        if (existsSync(filePath)) {
          content = readFileSync(filePath, 'utf-8')
          // Generate data URL for import map inlining
          const base64 = Buffer.from(content).toString('base64')
          dataUrl = `data:application/javascript;base64,${base64}`
        }
        chunks[specifier] = { url, hash, content, dataUrl }
        log(`Chunk "${specifier}": ${content.length} bytes (excluded from static import map)`)
      } else {
        // Non-chunk entries go in the static import map
        importMap.imports[specifier] = url
        log(`Import map: ${specifier} -> ${url} (file: ${filename})`)
      }
      // Note: @version specifiers for components are added in the second pass
      // based on explicit component config, not auto-detected here
    }
  }

  // Second pass: build component dependency graphs
  for (const componentConfig of componentConfigs) {
    const componentName = typeof componentConfig === 'string' ? componentConfig : componentConfig.name
    const explicitVersion = typeof componentConfig === 'object' ? componentConfig.version : null
    const explicitPackage = typeof componentConfig === 'object' ? componentConfig.package : null

    // Find the component in the manifest
    let componentEntry = null
    let componentKey = null

    for (const [key, entry] of Object.entries(viteManifest)) {
      const name = basename(key).replace(/\.(js|ts|mjs)$/, '')
      if (name === componentName && entry.isEntry) {
        componentEntry = entry
        componentKey = key
        break
      }
    }

    if (!componentEntry) {
      log(`Warning: Component "${componentName}" not found in manifest`)
      continue
    }

    const url = normalizeUrl(base, componentEntry.file)
    const hash = extractHash(componentEntry.file)

    // Add @version specifier if configured
    if (majorVersionImports && explicitVersion) {
      importMap.imports[`${componentName}@${explicitVersion}`] = url
    } else if (majorVersionImports && explicitPackage && pkgVersions[explicitPackage]) {
      const majorVersion = getMajorVersion(pkgVersions[explicitPackage])
      importMap.imports[`${componentName}@${majorVersion}`] = url
    }

    // Collect dependency specifiers (not URLs)
    const depSpecifiers = []

    const collectDeps = (entry, visited = new Set()) => {
      if (visited.has(entry.file)) return
      visited.add(entry.file)

      if (entry.imports) {
        for (const importKey of entry.imports) {
          const importEntry = viteManifest[importKey]
          if (importEntry) {
            const importFilename = basename(importEntry.file)
            const specifier = filenameToSpecifier.get(importFilename)
            if (specifier && !depSpecifiers.includes(specifier)) {
              depSpecifiers.push(specifier)
            }
            collectDeps(importEntry, visited)
          }
        }
      }
    }

    collectDeps(componentEntry)

    componentGraph[componentName] = {
      url,
      hash,
      src: componentKey,
      deps: depSpecifiers // Now stores specifiers, not URLs
    }

    log(`Component "${componentName}": ${depSpecifiers.length} dependencies`)
    if (depSpecifiers.length > 0) {
      log(`  Dependencies: ${depSpecifiers.join(', ')}`)
    }
  }

  return { importMap, filenameToSpecifier, componentGraph, chunks }
}

/**
 * Rewrite imports in all JS files to use import map specifiers
 */
function rewriteImports(buildOutDir, viteManifest, filenameToSpecifier, log) {
  for (const entry of Object.values(viteManifest)) {
    // Skip non-JS files
    if (!entry.file.endsWith('.js') && !entry.file.endsWith('.mjs')) continue

    const filePath = resolve(buildOutDir, entry.file)
    if (!existsSync(filePath)) continue

    let content = readFileSync(filePath, 'utf-8')
    let modified = false

    // Find and replace relative imports like:
    // from"./debounce-CJ01Vb4c.js"
    // from "./debounce-CJ01Vb4c.js"
    // import("./debounce-CJ01Vb4c.js")

    // Match: from followed by optional space, then quoted relative path
    const importRegex = /(from\s*["'])(\.\/[^"']+)(["'])/g

    content = content.replace(importRegex, (match, prefix, relativePath, suffix) => {
      const filename = basename(relativePath)
      const specifier = filenameToSpecifier.get(filename)

      if (specifier) {
        log(`Rewrite: ${relativePath} -> ${specifier}`)
        modified = true
        return `${prefix}${specifier}${suffix}`
      }
      return match
    })

    // Also handle dynamic imports: import("./file.js")
    const dynamicImportRegex = /(import\s*\(\s*["'])(\.\/[^"']+)(["']\s*\))/g

    content = content.replace(dynamicImportRegex, (match, prefix, relativePath, suffix) => {
      const filename = basename(relativePath)
      const specifier = filenameToSpecifier.get(filename)

      if (specifier) {
        log(`Rewrite dynamic: ${relativePath} -> ${specifier}`)
        modified = true
        return `${prefix}${specifier}${suffix}`
      }
      return match
    })

    if (modified) {
      writeFileSync(filePath, content)
      log(`Rewrote imports in ${entry.file}`)
    }
  }
}

/**
 * Inject self-registration code into component files
 * This allows inlined scripts to register their exports for later retrieval
 */
function injectModuleRegistration(buildOutDir, componentGraph, log) {
  for (const [componentName, info] of Object.entries(componentGraph)) {
    const filePath = resolve(buildOutDir, info.url.replace(/^\//, ''))
    if (!existsSync(filePath)) continue

    let content = readFileSync(filePath, 'utf-8')

    // Parse exports from the module
    // Match: export { name1, name2 as alias }
    // Match: export default ...
    const exportNames = []
    let hasDefaultExport = false

    // Named exports: export { foo, bar as baz }
    const namedExportMatch = content.match(/export\s*\{([^}]+)\}/)
    if (namedExportMatch) {
      const exports = namedExportMatch[1].split(',').map(e => {
        const parts = e.trim().split(/\s+as\s+/)
        return parts[parts.length - 1].trim() // Use the alias if present
      })
      exportNames.push(...exports)
    }

    // Default export
    if (/export\s+default\s/.test(content)) {
      hasDefaultExport = true
    }

    // Build registration code
    const moduleExports = []
    if (hasDefaultExport) {
      moduleExports.push('default: null') // Can't easily capture default, will be null
    }
    for (const name of exportNames) {
      if (name !== 'default') {
        moduleExports.push(`${name}`)
      }
    }

    // Append self-registration
    // Use IIFE to avoid polluting scope
    const registrationCode = `\n;(()=>{if(typeof window!=="undefined"){window.__CL_MODULES__=window.__CL_MODULES__||new Map();window.__CL_MODULES__.set("${info.url}",{${moduleExports.join(',')}})}})()`

    content += registrationCode
    writeFileSync(filePath, content)
    log(`Injected module registration for ${componentName}`)
  }
}

/**
 * Update Skybolt render-map with rewritten file contents
 */
function updateSkyboltRenderMap(buildOutDir, log) {
  const renderMapPath = resolve(buildOutDir, '.skybolt', 'render-map.json')

  if (!existsSync(renderMapPath)) {
    log('Skybolt render-map not found, skipping update')
    return
  }

  const renderMap = JSON.parse(readFileSync(renderMapPath, 'utf-8'))
  let updated = false

  for (const [key, asset] of Object.entries(renderMap.assets)) {
    // Only update JS assets
    if (!asset.url.endsWith('.js') && !asset.url.endsWith('.mjs')) continue

    // Find the file and read updated content
    const filePath = resolve(buildOutDir, asset.url.replace(/^\//, ''))
    if (existsSync(filePath)) {
      const newContent = readFileSync(filePath, 'utf-8')
      if (newContent !== asset.content) {
        asset.content = newContent
        asset.size = Buffer.byteLength(newContent, 'utf-8')
        updated = true
        log(`Updated render-map content for ${key}`)
      }
    }
  }

  if (updated) {
    writeFileSync(renderMapPath, JSON.stringify(renderMap, null, 2))
    log('Wrote updated render-map.json')
  }
}

export default chainLightning
