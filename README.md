# Skybolt

High-performance asset caching for multi-page applications.

**Version:** 3.0.0 | **Status:** Beta | **License:** MIT

## What is Skybolt?

Skybolt eliminates HTTP requests for cached assets on repeat visits. By combining Service Workers with intelligent server-side rendering, assets load from cache in ~1ms with zero network overhead.

### How It Works

**First Visit:**

1. Server inlines CSS/JS directly in the HTML (with special attributes)
2. Service Worker registers and caches the inlined content
3. Cookie records which asset versions are cached

**Repeat Visit:**

1. Server reads cookie, sees assets are cached
2. Server sends regular `<link>` and `<script>` tags
3. Service Worker intercepts requests, serves from Cache API
4. **Zero network requests for CSS/JS**

**After Rebuild:**

1. Vite generates new content hashes
2. Server detects version mismatch via cookie
3. Server inlines updated assets
4. Cache automatically invalidated

## Quick Start

### 1. Install Vite Plugin

```bash
npm install @skybolt/vite-plugin
```

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { skybolt } from '@skybolt/vite-plugin'

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        critical: 'src/css/critical.css',
        main: 'src/css/main.css',
        app: 'src/js/app.js'
      }
    }
  },
  plugins: [skybolt()]
})
```

### 2. Install Server Adapter

**PHP:**

```bash
composer require skybolt/skybolt
```

```php
<?php
$sb = new Skybolt\Skybolt(__DIR__ . '/dist/.skybolt/render-map.json');
?>
<head>
    <?= $sb->css('src/css/critical.css') ?>
    <?= $sb->launchScript() ?>
    <?= $sb->css('src/css/main.css') ?>
</head>
<body>
    <?= $sb->script('src/js/app.js') ?>
</body>
```

### 3. Build and Run

```bash
npm run build
php -S localhost:8080 -t public
```

### 4. Serve the Service Worker

Configure your web server to serve `/skybolt-sw.js` from `dist/skybolt-sw.js`.

## Packages

| Package                                       | Description                        | Install                            |
| --------------------------------------------- | ---------------------------------- | ---------------------------------- |
| [@skybolt/vite-plugin](packages/vite-plugin/) | Vite plugin (generates render map) | `npm install @skybolt/vite-plugin` |
| [skybolt/skybolt-php](packages/php/)          | PHP adapter                        | `composer require skybolt/skybolt` |

### Coming Soon

- **Ruby** - `gem install skybolt`
- **Python** - `pip install skybolt` /  `uv add skybolt`
- **Go** - `go get github.com/skybolt/skybolt-go`

## Examples

- [Minimal Example](examples/minimal/) - Basic PHP setup

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    BUILD TIME (Vite)                        │
├─────────────────────────────────────────────────────────────┤
│  @skybolt/vite-plugin                                       │
│  • Reads Vite manifest                                      │
│  • Reads asset contents                                     │
│  • Generates render-map.json                                │
│  • Copies skybolt-sw.js                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
              dist/.skybolt/render-map.json
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    RUNTIME (Server)                         │
├─────────────────────────────────────────────────────────────┤
│  Server adapter (PHP/Ruby/Python/etc)                       │
│  • Loads render-map.json                                    │
│  • Reads sb_assets cookie                                   │
│  • Returns inline or external tags                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER                                  │
├─────────────────────────────────────────────────────────────┤
│  skybolt-client.js (inlined)                                │
│  • Registers Service Worker                                 │
│  • Caches inlined assets                                    │
│  • Updates cookie with versions                             │
│                                                             │
│  skybolt-sw.js (Service Worker)                             │
│  • Intercepts asset requests                                │
│  • Serves from Cache API (~1ms)                             │
└─────────────────────────────────────────────────────────────┘
```

## API Reference

### Vite Plugin

```javascript
import { skybolt } from '@skybolt/vite-plugin'

skybolt({
  outDir: '.skybolt',        // Output directory for render-map.json
  swPath: '/skybolt-sw.js',  // URL path for Service Worker
  debug: false               // Enable debug logging
})
```

### PHP Adapter

```php
$sb = new Skybolt\Skybolt($renderMapPath);

// Render CSS
$sb->css('src/css/main.css');

// Render JavaScript
$sb->script('src/js/app.js');
$sb->script('src/js/legacy.js', module: false);

// Render client launcher (call once in <head>)
$sb->launchScript();

// Get asset URL (manual use)
$sb->getAssetUrl('src/css/main.css');
```

## Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 11.1+

Requires Service Worker and Cache API. Falls back gracefully to standard external assets when unavailable.

## Debugging

Browser console:

```javascript
// Cache info
await skybolt.getCacheInfo()

// Clear cache (keeps SW)
await skybolt.clearCache()

// Full reset
await skybolt.selfDestruct()
```

Query parameters:

- `?no-sw` - Disable Service Worker (for testing)

## Requirements

- **Build:** Vite 5.0+ or 6.0+
- **PHP:** 8.1+
- **Browser:** Service Worker support

## License

MIT

## Credits

**Original Concept:** Jens Roland & Morten Olsen (2012-2013)

Inspired by performance research from Paul Irish, Steve Souders, Addy Osmani, and others.
