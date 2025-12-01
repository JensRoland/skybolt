# @skybolt/vite-plugin

Vite plugin for [Skybolt](https://github.com/JensRoland/skybolt) - High-performance asset caching for multi-page applications.

## What is Skybolt?

Skybolt eliminates HTTP requests for cached assets on repeat visits by using Service Workers and the Cache API. On first visit, assets are inlined in the HTML and cached. On subsequent visits, the server sends regular `<link>` and `<script>` tags, which the Service Worker intercepts and serves instantly from cache.

**Result:** Zero network requests for CSS/JS on repeat visits. Assets load in ~5ms.

## Installation

```bash
pnpm add @skybolt/vite-plugin
```

## Usage

### 1. Configure Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { skybolt } from '@skybolt/vite-plugin'

export default defineConfig({
  base: '/assets/',
  build: {
    manifest: true,  // Required!
    outDir: 'dist',
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

### 2. Build

```bash
pnpm run build
```

This generates:

```text
dist/
├── assets/
│   ├── critical-Hx7kQ9mN.css
│   ├── main-Pw3rT8vL.css
│   └── app-Km5nR2xQ.js
├── .skybolt/
│   └── render-map.json      # For server adapters
└── skybolt-sw.js            # Service Worker
```

### 3. Use with a Server Adapter

Install a Skybolt adapter for your language:

- **PHP:** `composer require jensroland/skybolt`
- **Ruby:** `gem install skybolt`
- **Python:** `pip install skybolt` (or: `uv add skybolt` / `poetry add skybolt`)
- **Go:** `go get github.com/JensRoland/skybolt-go`

Then, use the adapter to include Skybolt-managed assets in your HTML.

Example (PHP):

```php
<?php
$sb = new Skybolt\Skybolt(__DIR__ . '/dist/.skybolt/render-map.json');
?>
<!DOCTYPE html>
<html>
<head>
    <?= $sb->css('src/css/critical.css') ?> 
    <?= $sb->launchScript() ?> 
    <?= $sb->css('src/css/main.css') ?> 
</head>
<body>
    <h1>Hello Skybolt!</h1>
    <?= $sb->script('src/js/app.js') ?> 
</body>
</html>
```

### 4. Serve the Service Worker

Configure your web server to serve `/skybolt-sw.js` from `dist/skybolt-sw.js`.

**Apache (.htaccess):**

```apache
RewriteRule ^skybolt-sw\.js$ dist/skybolt-sw.js [L]
```

**Nginx:**

```nginx
location = /skybolt-sw.js {
    alias /path/to/dist/skybolt-sw.js;
}
```

**PHP (development):**

```php
<?php
// public/skybolt-sw.js (or use a router)
header('Content-Type: application/javascript');
header('Service-Worker-Allowed: /');
readfile(__DIR__ . '/../dist/skybolt-sw.js');
```

## Options

```javascript
skybolt({
  // Output directory for render-map.json (relative to build output)
  outDir: '.skybolt',

  // URL path where Service Worker will be served
  swPath: '/skybolt-sw.js',

  // Enable debug logging
  debug: false
})
```

## How It Works

### First Visit

1. Server reads `render-map.json`
2. Server checks cookie (empty - new visitor)
3. Server inlines assets with `sb-*` attributes
4. Browser receives HTML with inlined CSS/JS
5. Skybolt client extracts content and caches via Service Worker
6. Client writes asset versions to cookie

### Repeat Visit

1. Server reads `render-map.json`
2. Server checks cookie (has asset versions)
3. Server sends regular `<link>` and `<script>` tags
4. Browser requests assets
5. Service Worker intercepts and serves from Cache API (~5ms)
6. **Zero network requests!**

### After Build (Cache Invalidation)

1. You run `pnpm run build`
2. Vite generates new hashes for changed files
3. Plugin updates `render-map.json`
4. Visitor returns, server detects hash mismatch
5. Server inlines new assets
6. Client updates cache and cookie
7. **Automatic invalidation!**

## Render Map Schema

The `render-map.json` contains everything server adapters need:

```json
{
  "version": 1,
  "generated": "2025-11-24T12:00:00.000Z",
  "skyboltVersion": "3.0.0",
  "basePath": "/assets/",
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

## Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 11.1+

Requires Service Worker and Cache API support. Falls back gracefully to standard external assets when unavailable.

## Publishing

To publish a new version, run one command from the `packages/vite-plugin` directory:

```sh
pnpm version patch   # 3.1.1 → 3.1.2
pnpm version minor   # 3.1.1 → 3.2.0
pnpm version major   # 3.1.1 → 4.0.0
```

This automatically:

1. Updates `package.json`
2. Syncs version to `README.md` and the JS source files using `scripts/sync-version.js`
3. Regenerates minified files
4. Commits all changes
5. Creates a git tag (e.g., `v3.1.2`)
6. Triggers the `postversion` script, which creates the `vite-plugin-v*` tag

You then have to run `git push origin main --tags` to push the changes and tag to GitHub, which triggers the publish workflow.

The workflow uses `vite-plugin-v*` tags (not just `v*`) to differentiate from the adapter package tags. It also includes `--provenance` for supply chain security.

The `publish-vite-plugin.yml` Github Action will automatically build and publish the package to NPM using OIDC authentication.

## License

MIT
