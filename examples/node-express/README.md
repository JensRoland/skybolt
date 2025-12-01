# Skybolt Node.js/Express Example

A Node.js/Express example demonstrating Skybolt's asset caching.

## Quick Start

```bash
make install
make build
make serve
# Visit http://localhost:8086
```

## What This Demonstrates

1. **First Visit:** Assets are inlined directly in the HTML with `sb-asset` attributes
2. **Service Worker:** Registers and caches the inlined assets via Cache API
3. **Repeat Visit:** Assets served from Service Worker cache (~5ms response time)
4. **Cache Invalidation:** Rebuild with `npm run build` to auto-invalidate stale assets

## File Structure

```
node-express/
├── src/
│   ├── css/
│   │   ├── critical.css    # Above-the-fold styles (blocking)
│   │   └── main.css        # Below-the-fold styles (async)
│   └── js/
│       └── app.js          # Client application
├── dist/                   # Built assets (generated)
├── server.js               # Express application
├── vite.config.js          # Vite + Skybolt plugin config
├── package.json
├── Makefile
├── Dockerfile
└── docker-compose.yml
```

## How It Works

### Build Time

1. Vite builds assets with content hashes
2. Skybolt plugin generates `dist/.skybolt/render-map.json`
3. Render map contains asset URLs, hashes, and full content

### First Visit

```javascript
const skybolt = new Skybolt('./dist/.skybolt/render-map.json', req.cookies)

// Returns inlined <style> with sb-asset attribute
skybolt.css('src/css/critical.css')

// Returns inlined <script> with sb-asset attribute
skybolt.script('src/js/app.js')
```

The client script extracts inlined content, caches it, and sets a cookie.

### Repeat Visit

Server reads the `sb_digest` cookie (Cuckoo filter), detects cached versions match, and outputs standard `<link>` and `<script>` tags. Service Worker intercepts and serves from cache.

## Testing the Cache

1. Open DevTools → Network tab
2. First load: See the HTML response with inlined assets
3. Refresh: Notice zero CSS/JS network requests
4. Application tab → Service Workers: See `skybolt-sw.js` active
5. Application tab → Cache Storage: See cached assets

## Commands

| Command | Description |
|---------|-------------|
| `make install` | Install npm dependencies |
| `make build` | Build assets with Vite |
| `make serve` | Start Express server |
| `make dev` | Start Vite dev server (HMR) |
| `make clean` | Remove dist and node_modules |
| `make docker-up` | Start with Docker Compose |
| `make docker-down` | Stop Docker containers |

## Requirements

- Node.js 18+
- npm
