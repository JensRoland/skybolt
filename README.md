# Skybolt

High-performance asset management framework with intelligent client-side caching for modern web applications.

**Version:** 2.0.0 | **Status:** ✅ Production Ready | **License:** MIT

## Overview

Skybolt is a two-part asset management system that dramatically improves web performance by intelligently caching assets in the client's browser localStorage. On repeat visits, assets load in milliseconds with zero HTTP requests.

### Key Features

- 🚀 **Vite Integration** - Modern build pipeline with instant HMR
- 💾 **Smart Caching** - localStorage-based caching with automatic invalidation
- ⚡ **Critical CSS** - Automatic inlining for optimal First Contentful Paint
- 🎯 **Asset Versioning** - Manifest-based versioning with content hashing
- 🌐 **CDN Ready** - Built-in CDN support with configurable URLs
- 🔌 **Framework Agnostic** - Works with any PHP framework or vanilla PHP (support for other languages planned)
- 📝 **ES Modules** - Modern JavaScript with no legacy compatibility shims

## Quick Start

### Installation

```bash
composer require skybolt/skybolt-core
```

### Basic Usage

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
    <?= $skybolt->css('src/css/critical.css', inline: 'always') ?>
    <?= $skybolt->launchScript() ?>
    <?= $skybolt->css('src/css/main.css') ?>
</head>
<body>
    <h1>Hello Skybolt!</h1>
    <?= $skybolt->script('src/js/app.js') ?>
</body>
</html>
```

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite'

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
  }
})
```

## How It Works

### First Visit
1. Client requests page
2. Server checks session (empty - new user)
3. Server inlines all assets in HTML
4. Client stores assets in localStorage
5. Client reports inventory to server

### Repeat Visit

1. Client requests page (sends cached asset versions)
2. Server checks session (has inventory)
3. Server sends `<meta>` tags instead of full assets
4. Client loads assets from localStorage in ~40ms
5. **Zero HTTP requests for CSS/JS**

### After Asset Update

1. Developer runs `bun run build`
2. Vite generates new version hashes
3. Client requests page
4. Server detects version mismatch
5. Server inlines updated assets
6. **Cache automatically invalidated**

## Repository Structure

```text
skybolt/
├── packages/
│   └── skybolt-core/              # Composer package (distributable)
│       ├── src/                   # PHP source files
│       ├── assets/                # Client-side JavaScript
│       ├── composer.json
│       ├── README.md
│       ├── ARCHITECTURE.md
│       └── CHANGELOG.md
│
├── examples/
│   ├── timber-v2/                 # Full working example
│   └── minimal-example/           # Minimal setup
│
└── CLAUDE.md                      # AI assistant context
```

## Examples

### Full Working Example

See [`examples/timber-v2/`](examples/timber-v2/) for a complete implementation with:

- Vite build pipeline
- Critical CSS extraction
- Font loading optimization
- Image lazy loading
- Legacy jQuery plugins

This example is intentionally using a commercial template based on oldschool vanilla JavaScript to demonstrate Skybolt's compatibility with arbitrary JS/CSS, with no dependency on a particular JS framework.

```bash
cd examples/timber-v2
composer install && bun install
bun run build
make serve  # Visit http://localhost:8080
```

### Minimal Example

See [`examples/minimal-example/`](examples/minimal-example/) for the simplest possible setup.

## Documentation

- **[Architecture](packages/skybolt-core/ARCHITECTURE.md)** - Internal architecture and design decisions
- **[Package README](packages/skybolt-core/README.md)** - Package-specific documentation

## Configuration Options

```php
$skybolt = new Skybolt(
    manifestPath: '/path/to/.vite/manifest.json',  // Required
    basePath: '/assets/',                          // Default: '/assets/'
    session: $_SESSION,                            // Required for caching
    cdnUrl: 'https://cdn.example.com',             // Optional
    devServer: 'http://localhost:5173',            // Optional (auto-detected)
    printComments: true,                           // Debug mode
    inlineThreshold: 14336                         // 14KB threshold
);
```

## API Reference

### Core Methods

- `css(string $entry, ?string $inline = null, bool $async = true): string`
  - Load CSS with flexible options
  - `inline: 'always'` - Force inline (critical CSS)
  - `inline: 'never'` - Force external (no localStorage)
  - `inline: null` - Auto (default, uses localStorage cache)
  - `async: false` - Blocking `<link>` tag

- `script(string $entry, bool $async = true, bool $module = true): string`
  - Load JavaScript with flexible options
  - `async: false` - Blocking script tag
  - `module: false` - Non-module script (for legacy code)

- `preload(string $entry, string $as, ?string $fetchpriority = null, ?string $type = null): string`
  - Generate preload hints for critical resources
  - Example: `$skybolt->preload('images/hero.jpg', as: 'image', fetchpriority: 'high')`

- `launchScript(): string`
  - Render Skybolt client controller (call once in `<head>`)

### Advanced Methods

- `getAssetUrl(string $entry): ?string` - Get full URL for an asset
- `handleInventoryUpdate(?array $versions): void` - Process cache inventory update

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

**Requirements:**

- ES Modules support
- localStorage support
- Fetch API

**NO IE support** (ES Modules required)

## Performance Tips

1. **Keep Critical CSS Minimal** - Only include above-the-fold styles (<14KB)
2. **Use Async Loading** - Defer non-critical assets with `css()` and `script()` (async by default)
3. **Preload Critical Resources** - Use `preload()` for hero images and critical fonts
4. **Enable CDN** - Set `cdnUrl` for production deployments
5. **Long Cache Headers** - Vite's version hashes enable safe year-long caching

## Development

### Running Tests

```bash
cd packages/skybolt-core
composer test
```

### Building for Production

```bash
cd examples/timber-v2
bun run build
```

### Debug Mode

```php
$skybolt = new Skybolt(
    // ...
    printComments: true  // Enable HTML comments showing cache decisions
);
```

## Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed future plans including:

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (when available)
5. Submit a pull request

## Credits

**Original Concept:** Jens Roland & Morten Olsen (2012-2013)

Inspired by:

- [Paul Irish](https://paulirish.com/) - Initial concept of localStorage caching
- [Steve Souders](https://stevesouders.com/) - Web performance best practices
- [Nicholas Zakas](https://humanwhocodes.com/) - Module patterns
- [Addy Osmani](https://addyosmani.com/) - Performance optimization
- [Makinde Adeagbo](https://makinde.adeagbo.com/) - Performance optimization

## License

MIT License - see [LICENSE](packages/skybolt-core/LICENSE)

## Related Projects

- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Workbox](https://developer.chrome.com/docs/workbox/) - Service Worker libraries

---

**Need Help?** Check the [examples](examples/) or open an issue on GitHub.
