/**
 * Chain Lightning Demo Server
 *
 * Demonstrates Chain Lightning + Skybolt working together.
 * - Skybolt handles CSS caching and the Chain Lightning client script
 * - Chain Lightning handles component dependency preloading
 */

import express from 'express'
import cookieParser from 'cookie-parser'
import { Skybolt } from '@skybolt/server-adapter'
import { ChainLightning } from '@skybolt/chain-lightning/server'

const app = express()
const PORT = 8080

// One year in seconds (for immutable versioned assets)
const ONE_YEAR = 31536000

app.use(cookieParser())

// Serve /assets with immutable cache headers (versioned files)
app.use('/assets', express.static('dist/assets', {
  maxAge: ONE_YEAR * 1000,
  immutable: true
}))

// Serve service worker with no-cache (must always be fresh)
app.get('/skybolt-sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile('skybolt-sw.js', { root: 'dist' })
})

// Serve other static files with short cache
app.use(express.static('dist', {
  maxAge: 3600 * 1000 // 1 hour for non-versioned files
}))

app.get('/', (req, res) => {
  // Initialize Skybolt for CSS caching
  const sb = new Skybolt('./dist/.skybolt/render-map.json', req.cookies)

  // Initialize Chain Lightning with Skybolt for cache-aware preloading
  const cl = new ChainLightning('./dist/.chain-lightning/manifest.json', sb)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chain Lightning Demo</title>

  <!-- CSS via Skybolt (inlined on first visit, cached after) -->
  ${sb.css('src/css/main.css')}

  <!-- Skybolt client launcher (registers SW, caches inlined assets) -->
  ${sb.launchScript()}

  <!-- Chain Lightning import map (must come before module scripts) -->
  ${cl.importMap()}

  <!-- Chain Lightning manifest (component data for dynamic imports) -->
  ${cl.manifestScript()}

  <!-- Chain Lightning client (cached by Skybolt) -->
  ${cl.clientScript()}
</head>
<body>
  <h1>⚡ Chain Lightning Demo</h1>

  <p>This demo shows ES module components with parallel dependency preloading.</p>

  <div class="demo-section">
    <h2>Search Component</h2>
    <!-- Chunk deps use data URL on first visit, actual URL on cached visits -->
    ${cl.component('search-component', { inlineDeps: true })}
    <search-component></search-component>
  </div>

  <div class="demo-section">
    <h2>Counter Component</h2>
    <!-- Shares chunk:debounce with search-component (already rendered above) -->
    ${cl.component('counter-component')}
    <counter-component></counter-component>
  </div>

  <div class="dynamic-section">
    <h2>Dynamic Loading Test</h2>
    <p>Open DevTools Network tab, then click to dynamically load a component:</p>
    <button class="load-btn" onclick="testDynamicLoad('search-component')">
      Load Search (dynamic)
    </button>
    <button class="load-btn" onclick="testDynamicLoad('counter-component')">
      Load Counter (dynamic)
    </button>
    <div id="dynamic-container"></div>
    <div class="info-box">
      <strong>Note:</strong> When you click "Load" with an empty cache, watch the Network tab.
      Dependencies should load in parallel, not sequentially (waterfall).
    </div>
  </div>

  <script type="module">
    async function testDynamicLoad(componentName) {
      const container = document.getElementById('dynamic-container')
      container.innerHTML = '<p>Loading...</p>'

      try {
        console.log('[Demo] Starting dynamic import:', componentName)
        const start = performance.now()

        await window.chainLightning.import(componentName)

        const elapsed = (performance.now() - start).toFixed(2)
        console.log('[Demo] Loaded in', elapsed, 'ms')

        container.innerHTML = \`
          <p>✅ Loaded <strong>\${componentName}</strong> in \${elapsed}ms</p>
          <\${componentName}></\${componentName}>
        \`
      } catch (err) {
        console.error('[Demo] Failed to load:', err)
        container.innerHTML = '<p>❌ Failed to load: ' + err.message + '</p>'
      }
    }

    // Expose for button onclick
    window.testDynamicLoad = testDynamicLoad
  </script>
</body>
</html>`

  res.send(html)
})

app.listen(PORT, () => {
  console.log(`Chain Lightning demo running at http://localhost:${PORT}`)
  console.log('Build first with: npm run build')
})
