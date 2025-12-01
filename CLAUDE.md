# CLAUDE.md - Skybolt Project Context

This document provides context for AI assistants working on the Skybolt project.

## Project Overview

**Skybolt** is a high-performance asset caching library for multi-page applications. It eliminates HTTP requests for cached assets on repeat visits by combining Service Workers with intelligent server-side rendering.

### Key Architecture (v3)

Skybolt v3 uses a **build-time render map** approach:

1. **Vite Plugin** (`@skybolt/vite-plugin`) generates `render-map.json` at build time
2. **Server Adapters** (Node.js, PHP, Ruby, Python, Go) read the render map and output HTML
3. **Client Script** caches inlined assets and manages Service Worker
4. **Service Worker** serves cached assets with ~5ms response time

This architecture enables trivial multi-language support - adapters are ~50-150 lines of code.

## Repository Structure

```text
skybolt/
├── packages/
│   ├── vite-plugin/           # @skybolt/vite-plugin (NPM)
│   │   ├── index.js           # Main plugin
│   │   ├── client.js          # Client script source
│   │   ├── sw.js              # Service Worker source
│   │   └── package.json
│   │
│   ├── javascript/            # @skybolt/server-adapter (NPM)
│   │   ├── src/skybolt.js     # ~475 lines
│   │   └── package.json
│   │
│   ├── php/                   # jensroland/skybolt (Composer)
│   │   ├── src/Skybolt.php    # ~170 lines
│   │   └── composer.json
│   │
│   ├── python/                # skybolt (PyPI)
│   ├── ruby/                  # skybolt (RubyGems)
│   └── go/                    # skybolt-go (Go Modules)
│
├── examples/
│   ├── node-express/          # Node.js Express example
│   ├── php-vanilla/           # Minimal PHP example
│   ├── php-portfolio-timber/  # Full-featured PHP example
│   ├── php-laravel/           # Laravel example
│   ├── python-django/         # Django example
│   ├── ruby-rails/            # Rails example
│   └── go-gin/                # Gin example
│
├── README.md
├── CLAUDE.md                  # This file
└── DEVELOPING.md              # Maintainer documentation
```

## How It Works

### Build Time

1. Developer runs `npm run build`
2. Vite builds assets with content hashes
3. Skybolt plugin reads Vite manifest
4. Plugin generates `dist/.skybolt/render-map.json` containing:
   - Asset URLs and hashes
   - Full asset content (for inlining)
   - Client script (minified)
5. Plugin copies `skybolt-sw.js` to dist

### First Visit

1. Server loads render-map.json
2. Server checks `sb_assets` cookie (empty)
3. Server inlines assets with `sb-asset` attributes
4. Browser receives HTML with inlined CSS/JS
5. Client script registers Service Worker
6. Client extracts inlined content → Cache API
7. Client writes asset versions to cookie

### Repeat Visit

1. Server loads render-map.json
2. Server reads `sb_assets` cookie
3. Server compares versions (match!)
4. Server outputs `<link>` and `<script>` tags
5. Browser requests assets
6. Service Worker intercepts → serves from cache (~5ms)
7. **Zero network requests**

### After Rebuild

1. New build generates new hashes
2. Server detects version mismatch
3. Server inlines updated assets
4. Client updates Cache API and cookie
5. **Automatic invalidation**

## Key Design Decisions

### Build-time vs Runtime

v2 parsed Vite manifest at runtime. v3 generates a render map at build time because:

- Server adapters become trivial (just JSON parsing)
- No runtime file I/O for manifest
- Asset content pre-loaded for inlining
- Easy to add new language adapters

### No Inline Threshold

v2 had a configurable threshold for inlining. v3 always inlines on first visit because:

- Simplifies logic
- Service Worker cache has no size limit
- First visit performance is consistent
- Large files are rare in practice

### Cookie-based State

Client cache state is tracked via cookies because:

- Works with stateless servers
- No server-side session required
- Survives browser restarts
- Multi-cookie sharding handles >4KB

## Development

### Running the Example

```sh
cd examples/php-vanilla

# Install dependencies
npm install
composer install

# Build assets
npm run build

# Run server
make serve
# Visit http://localhost:8080
```

### Minifying Client Script

```sh
cd packages/vite-plugin
npm run minify  # Creates client.min.js
```

### Testing Changes

1. Edit `packages/vite-plugin/client.js` or `sw.js`
2. Run `npm run minify` in vite-plugin
3. Run `npm run build` in example
4. Test in browser with DevTools open

## API Reference

### Vite Plugin

```javascript
import { skybolt } from '@skybolt/vite-plugin'

skybolt({
  outDir: '.skybolt',        // Output dir for render-map.json
  swPath: '/skybolt-sw.js',  // URL path for Service Worker
  debug: false               // Enable debug logging
})
```

### Node.js Adapter

```javascript
import { Skybolt } from '@skybolt/server-adapter'

const sb = new Skybolt('./dist/.skybolt/render-map.json', req.cookies)

sb.css('src/css/main.css')                   // Render CSS (blocking)
sb.css('src/css/main.css', { async: true })  // Render CSS (non-blocking)
sb.script('src/js/app.js')                   // Render JS (ES module)
sb.script('src/js/old.js', { module: false }) // Render JS (classic)
sb.launchScript()                            // Render client launcher
sb.getAssetUrl('src/css/main.css')           // Get URL (manual use)
```

### PHP Adapter

```php
$sb = new Skybolt\Skybolt($renderMapPath, $cookies);

$sb->css('src/css/main.css');                // Render CSS (blocking)
$sb->css('src/css/main.css', async: true);   // Render CSS (non-blocking)
$sb->script('src/js/app.js');                // Render JS (ES module)
$sb->script('src/js/old.js', module: false); // Render JS (classic)
$sb->launchScript();                         // Render client launcher
$sb->getAssetUrl('src/css/main.css');        // Get URL (manual use)
```

### Client API (Browser)

```javascript
await skybolt.getCacheInfo()  // {name, count, urls}
await skybolt.clearCache()    // Clear cache, keep SW
await skybolt.selfDestruct()  // Clear all, unregister SW, reload
```

## Render Map Schema

```json
{
  "version": 1,
  "generated": "2025-11-24T12:00:00.000Z",
  "skyboltVersion": "3.0.0",
  "basePath": "/",
  "assets": {
    "src/css/main.css": {
      "url": "/assets/main-Pw3rT8vL.css",
      "hash": "Pw3rT8vL",
      "size": 85000,
      "content": "body{margin:0}..."
    }
  },
  "client": {
    "script": "class SkyboltClient{..."
  },
  "serviceWorker": {
    "filename": "skybolt-sw.js",
    "path": "/skybolt-sw.js"
  }
}
```

## HTML Attributes

Inlined assets use these attributes:

| Attribute  | Purpose         | Example                     |
| ---------- | --------------- | --------------------------- |
| `sb-asset` | Asset ID + hash | `src/css/main.css:Pw3rT8vL` |
| `sb-url`   | Cache key URL   | `/assets/main-Pw3rT8vL.css` |

## Cookie Format

```text
sb_assets = src/css/main.css:Pw3rT8vL,src/js/app.js:Km5nR2xQ
```

URL-encoded, comma-separated `name:hash` pairs. Sharded into multiple cookies if >4KB.

## Debugging

Enable debug logging in Vite plugin:

```javascript
skybolt({ debug: true })
```

Disable Service Worker via URL:

```text
http://localhost:8080/?no-sw
```

Browser console:

```javascript
await skybolt.getCacheInfo()
await skybolt.clearCache()
await skybolt.selfDestruct()
```

---

**Last Updated:** November 2025
