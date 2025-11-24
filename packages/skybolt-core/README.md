# Skybolt Core

High-performance asset management framework with intelligent client-side caching for PHP 8.3+.

## Features

- 🚀 **Vite Integration** - Seamless integration with Vite's build pipeline
- 💾 **Smart Caching** - localStorage-based caching with server-side tracking
- ⚡ **Critical CSS** - Automatic critical CSS inlining for optimal First Contentful Paint
- 🎯 **Asset Versioning** - Automatic cache invalidation via manifest-based versioning
- 🌐 **CDN Ready** - Built-in CDN support with configurable base URLs
- 🔌 **Framework Agnostic** - Works with any PHP framework or vanilla PHP

## Installation

```bash
composer require skybolt/skybolt-core
```

## Quick Start

```php
<?php

use Skybolt\Skybolt;

session_start();

$skybolt = new Skybolt(
    manifestPath: __DIR__ . '/dist/.vite/manifest.json',
    basePath: '/assets/',
    session: $_SESSION
);
?>
<!DOCTYPE html>
<html>
<head>
    <?= $skybolt->css('src/critical.css', inline: 'always') ?>
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

#### `css(string $entry, ?string $inline = null, bool $async = true): string`

Load CSS with flexible options.

**Parameters:**

- `$entry` - Source file path (e.g., `'src/main.css'`)
- `$inline` - Control inlining behavior:
  - `'always'` - Force inline (critical CSS)
  - `'never'` - Force external (no localStorage)
  - `null` - Auto (default, uses localStorage cache)
- `$async` - Whether to load asynchronously (default: `true`)

**Examples:**

```php
// Critical CSS (always inlined, blocking)
<?= $skybolt->css('src/critical.css', inline: 'always') ?>

// Async CSS (localStorage or CDN, default)
<?= $skybolt->css('src/main.css') ?>

// Force external (no localStorage)
<?= $skybolt->css('src/print.css', inline: 'never') ?>

// Blocking CSS (traditional <link> tag)
<?= $skybolt->css('src/legacy.css', async: false) ?>
```

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

1. **First Visit**: Assets are inlined in the HTML with cache instructions
2. **Client-side**: JavaScript stores assets in localStorage and a version map in cookies
3. **Subsequent Visits**: Server knows what client has cached, sends only meta tags
4. **Client-side**: Assets load instantly from localStorage
5. **Version Changes**: Automatic cache invalidation via manifest versions

## License

MIT
