/**
 * Skybolt Express Example
 *
 * Demonstrates basic Skybolt usage with Express
 */

import express from 'express'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'
import path from 'path'
import { Skybolt } from '@skybolt/server-adapter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 8086

// Parse cookies (required for Skybolt to detect cached assets)
app.use(cookieParser())

// Serve static files from dist (built assets, service worker)
app.use(express.static(path.join(__dirname, 'dist')))

// Main route
app.get('/', (req, res) => {
  // Initialize Skybolt with the render map and request cookies
  const skybolt = new Skybolt(
    path.join(__dirname, 'dist/.skybolt/render-map.json'),
    req.cookies
  )

  // Render the page
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skybolt Express Example</title>

    <!-- Critical CSS - inlined on first visit, cached thereafter -->
    ${skybolt.css('src/css/critical.css')}

    <!-- Skybolt client launcher - must be in <head> -->
    ${skybolt.launchScript()}

    <!-- Main CSS - loaded async (non-blocking), cached by Service Worker -->
    ${skybolt.css('src/css/main.css', { async: true })}
</head>
<body>
    <div class="container">
        <header>
            <h1>Skybolt <span class="badge">Express</span></h1>
            <p class="tagline">High-performance asset caching for multi-page applications</p>
        </header>

        <main>
            <div class="feature-grid">
                <div class="feature">
                    <h3>Zero HTTP Requests</h3>
                    <p>On repeat visits, assets are served from the Service Worker cache in ~5ms. No network requests needed.</p>
                </div>
                <div class="feature">
                    <h3>Automatic Invalidation</h3>
                    <p>When you rebuild, Vite generates new hashes. Skybolt detects the change and updates the cache.</p>
                </div>
                <div class="feature">
                    <h3>Multi-Language Support</h3>
                    <p>Vite plugin generates a render map. Simple adapters available for PHP, Ruby, Python, Node.js, and more.</p>
                </div>
            </div>

            <div class="demo-section">
                <h2>Cache Status</h2>
                <div id="cache-status" class="cache-status">
                    Loading...
                </div>
                <div style="margin-top: 1rem;">
                    <button id="refresh-status">Refresh Status</button>
                    <button id="clear-cache">Clear Cache</button>
                    <button id="self-destruct" class="danger">Self-Destruct</button>
                </div>
            </div>

            <div class="demo-section">
                <h2>How to Test</h2>
                <ol>
                    <li><strong>First visit:</strong> Open DevTools Network tab. You'll see assets inlined in the HTML.</li>
                    <li><strong>Refresh:</strong> Network tab shows no requests for CSS/JS. Service Worker serves from cache.</li>
                    <li><strong>Rebuild:</strong> Run <code>npm run build</code>, refresh. New assets are cached automatically.</li>
                </ol>
            </div>
        </main>

        <footer>
            <p>
                <a href="https://github.com/JensRoland/skybolt">GitHub</a>
            </p>
        </footer>
    </div>

    <!-- Application JavaScript - loaded async as ES module -->
    ${skybolt.script('src/js/app.js')}
</body>
</html>`)
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
