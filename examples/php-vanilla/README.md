# Skybolt PHP Vanilla Example

A vanilla PHP example demonstrating Skybolt's asset caching.

## Quick Start

```bash
# Install dependencies
make install

# Build assets
make build

# Run development server
make serve

# Visit http://localhost:8080
```

## What This Demonstrates

1. **First Visit**: Assets are inlined in the HTML with `sb-*` attributes
2. **Service Worker**: Registers and caches the inlined assets
3. **Repeat Visit**: Assets are served from Service Worker cache (~1ms)
4. **Cache Invalidation**: Rebuild with `make build`, refresh to see new assets cached

## File Structure

```text
php-vanilla/
├── public/
│   ├── index.php          # Main page using Skybolt
│   └── router.php         # Dev server router
├── src/
│   ├── css/
│   │   ├── critical.css   # Above-the-fold styles
│   │   └── main.css       # Below-the-fold styles
│   └── js/
│       └── app.js         # Application JavaScript
├── dist/                  # Build output (generated)
│   ├── assets/            # Vite-built assets
│   ├── .skybolt/          # Skybolt render map
│   └── skybolt-sw.js      # Service Worker
├── vite.config.js         # Vite configuration
├── package.json           # NPM dependencies
├── composer.json          # PHP dependencies
└── Makefile               # Build commands
```

## Testing the Cache

1. Open DevTools → Network tab
2. Load the page (first visit)
3. Observe: CSS/JS are inlined in the HTML
4. Refresh the page
5. Observe: No network requests for CSS/JS (served by Service Worker)

## Debug Tools

The example includes buttons to:

- **Refresh Status**: Update the cache status display
- **Clear Cache**: Clear the Service Worker cache (keeps SW registered)
- **Self-Destruct**: Clear cache, unregister SW, and reload

You can also use the browser console:

```javascript
// Get cache info
await skybolt.getCacheInfo()

// Clear cache
await skybolt.clearCache()

// Full reset
await skybolt.selfDestruct()
```

## Requirements

- Node.js 18+
- PHP 8.1+
- Composer
