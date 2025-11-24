# Skybolt Core

High-performance asset management framework with intelligent client-side caching for PHP 8.3+.

## Features

- 🚀 **Vite Integration** - Seamless integration with Vite's build pipeline
- 💾 **Service Worker Caching** - Unlimited cache storage via Cache API with automatic invalidation
- ⚡ **Critical CSS** - Automatic critical CSS inlining for optimal First Contentful Paint
- 🎯 **Asset Versioning** - Automatic cache invalidation via manifest-based versioning
- 🌐 **CDN Ready** - Built-in CDN support with configurable base URLs
- 🔌 **Framework Agnostic** - Works with any PHP framework or vanilla PHP

## Installation

```bash
composer require skybolt/skybolt-core
```

### Service Worker Setup

Create a PHP endpoint to serve the Service Worker:

```php
<?php
// public/skybolt-sw.php
require_once __DIR__ . '/../vendor/autoload.php';

use Skybolt\ServiceWorkerEndpoint;

ServiceWorkerEndpoint::serve();
```

## Quick Start

```php
<?php

use Skybolt\Skybolt;

$skybolt = new Skybolt(
    manifestPath: __DIR__ . '/dist/.vite/manifest.json',
    basePath: '/assets/'
);
?>
<!DOCTYPE html>
<html>
<head>
    <?= $skybolt->css('src/critical.css') ?>
    <?= $skybolt->launchScript() ?>
    <?= $skybolt->css('src/main.css') ?>
</head>
<body>
    <h1>Hello Skybolt!</h1>
    <?= $skybolt->script('src/app.js') ?>
</body>
</html>
```

## Configuration

```php
$skybolt = new Skybolt(
    manifestPath: '/path/to/.vite/manifest.json',  // Required: Vite manifest file
    basePath: '/assets/',                          // Base URL path for assets
    cdnUrl: 'https://cdn.example.com',             // Optional: CDN URL prefix
    devServer: 'http://localhost:5173',            // Optional: Vite dev server URL
);
```

## Vite Setup

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: 'src/main.js',
        critical: 'src/critical.css'
      }
    }
  }
})
```

## API Reference

### Core Methods

#### `css(string $entry, bool $async = true): string`

Load CSS with automatic optimization.

**Parameters:**

- `$entry` - Source file path (e.g., `'src/main.css'`)
- `$async` - Whether to load asynchronously (default: `true`)

**Examples:**

```php
// Critical CSS (auto-optimization, default)
<?= $skybolt->css('src/critical.css') ?>

// Main CSS (async, Service Worker cache)
<?= $skybolt->css('src/main.css') ?>

// Blocking CSS (traditional <link> tag, rare)
<?= $skybolt->css('src/legacy.css', async: false) ?>
```

**Auto-optimization behavior:**

- **First visit**: Small files (≤50KB) are inlined, large files use external link with pre-caching
- **Subsequent visits**: All files use external `<link>` tags served instantly from Service Worker cache
- Configure threshold with `inlineThreshold` parameter (default: 51200 bytes)

#### `script(string $entry, bool $async = true, bool $module = true): string`

Load JavaScript with flexible options.

**Parameters:**

- `$entry` - Source file path (e.g., `'src/app.js'`)
- `$async` - Whether to load asynchronously (default: `true`)
- `$module` - Whether to load as ES module (default: `true`)

**Examples:**

```php
// Async ES module (default)
<?= $skybolt->script('src/app.js') ?>

// Blocking script for legacy code
<?= $skybolt->script('src/jquery.js', async: false, module: false) ?>
```

#### `preload(string $entry, string $as, ?string $fetchpriority = null, ?string $type = null): string`

Generate preload hints for critical resources.

**Examples:**

```php
// Preload critical hero image
<?= $skybolt->preload('images/hero.jpg', as: 'image', fetchpriority: 'high') ?>

// Preload critical font
<?= $skybolt->preload('fonts/main.woff2', as: 'font', type: 'font/woff2') ?>
```

#### `launchScript(): string`

Renders the Skybolt client-side cache controller. Call this once in the `<head>`.

## How It Works

1. **First Visit**: Assets are inlined in the HTML with `data-sb-cache` attributes
2. **Client-side**: Service Worker registers, JavaScript extracts and caches assets to Cache API
3. **Version Tracking**: Client stores asset versions in cookies
4. **Subsequent Visits**: Server sends standard `<link>`/`<script>` tags
5. **Service Worker**: Intercepts requests and serves from Cache API (~1ms)
6. **Version Changes**: Automatic cache invalidation via manifest versions

## License

MIT
