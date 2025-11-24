# Minimal Skybolt Example

Modern implementation using Vite for asset bundling and Skybolt for intelligent caching with Service Workers.

## Setup

### 1. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install JavaScript dependencies
bun install
```

### 2. Build Assets

```bash
# Production build
bun run build
```

### 3. Run the Site

```bash
# Using PHP's built-in server
make serve
```

Then visit: http://localhost:8010

## Project Structure

```text
minimal-example/
├── src/
│   ├── css/
│   │   ├── critical.css    # Above-the-fold CSS (inlined)
│   │   └── main.css        # Main styles (async)
│   └── js/
│       └── app.js          # Main JavaScript
├── public/
│   ├── index.php           # Entry point
│   └── skybolt-sw.php      # Service Worker endpoint
├── dist/                   # Vite build output (generated)
│   ├── .vite/
│   │   └── manifest.json   # Asset manifest
│   └── assets/             # Compiled assets
├── vite.config.js
├── package.json
├── Makefile
└── composer.json
```

## How It Works

1. **Build Time**: Vite bundles and optimizes assets, generating a manifest
2. **First Visit**: Skybolt inlines small assets with `data-sb-cache` attributes
3. **Service Worker**: Registers and client extracts/caches assets to Cache API
4. **Subsequent Visits**: Service Worker intercepts requests and serves from cache (~1ms)
5. **Updates**: Version changes trigger automatic cache invalidation

## Service Worker Setup

The example includes `public/skybolt-sw.php` which serves the Service Worker from the Skybolt package. This endpoint must be accessible for the Service Worker registration to work.

## Debugging

Check cache status in browser console:

```javascript
// List all caches
console.log(await caches.keys());

// Inspect Skybolt cache
const cache = await caches.open('skybolt-assets-v1');
console.log(await cache.keys());

// Clear cache and reload
window.skybolt.selfDestruct();
```
