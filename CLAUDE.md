# CLAUDE.md - Skybolt v2 Project Context

This document provides context for AI assistants working on the Skybolt v2 project across multiple conversation sessions.

## Project Overview

**Skybolt** is a high-performance asset management framework with intelligent client-side caching. The project is currently in the process of transitioning from v1 (legacy runtime minification) to v2 (modern Vite-based build pipeline with PHP 8.3+).

### Project Goals

1. **Separate concerns**: Decouple Vite/JS tooling (language-agnostic) from PHP implementation (site-specific)
2. **Create distributable packages**:
   - PHP: Composer package (`skybolt/skybolt-core`)
   - JavaScript: NPM package (planned)
   - Python: PyPI package (future)
3. **Do not maintain backward compatibility**: Noone is using v1 in production; a clean break allows for modern architecture
4. **Modern stack**: PHP 8.3+, Vite, ES Modules, Lightning CSS

## Repository Structure

```text
timber/0.4.0/
├── packages/
│   └── skybolt-core/              # Main PHP package (distributable)
│       ├── src/
│       │   ├── Skybolt.php        # Main API facade
│       │   ├── Config.php         # Immutable configuration
│       │   ├── ManifestReader.php # Vite manifest parser
│       │   ├── CacheManager.php   # Cookie-based cache tracking
│       │   └── AssetRenderer.php  # HTML tag generation
│       ├── assets/
│       │   └── skybolt-client.js  # Client-side ES module
│       ├── composer.json          # Package definition
│       ├── README.md              # Package documentation
│       ├── ARCHITECTURE.md        # Internal architecture docs
│       └── CHANGELOG.md           # Version history
│
├── examples/
│   ├── timber-v2/                 # Complete working example (Timber template)
│   │   ├── public/
│   │   │   └── index.php          # Demo site using Skybolt v2
│   │   ├── src/
│   │   │   ├── css/               # CSS source files
│   │   │   └── js/                # JS source files
│   │   ├── dist/                  # Vite build output
│   │   ├── vite.config.js         # Vite configuration
│   │   ├── package.json           # Node dependencies
│   │   └── composer.json          # PHP dependencies
│   │
│   └── minimal-example/           # Minimal setup example
│
├── README.md                      # User-facing documentation
├── ROADMAP.md                     # Future plans and feature roadmap
└── CLAUDE.md                      # AI assistant context (this file)
```

## Current Status (November 2025)

### ✅ Completed

- [x] Skybolt v2 core PHP package (`packages/skybolt-core/`)
- [x] Vite integration with manifest-based asset discovery
- [x] ES Module client-side JavaScript (`skybolt-client.js`)
- [x] Full working example with Timber template (`examples/timber-v2/`)
- [x] Comprehensive documentation (README, ARCHITECTURE, MIGRATION, CHANGELOG)
- [x] PHP 8.3 modern features (readonly properties, constructor promotion, typed everything)
- [x] CDN support with configurable URLs
- [x] Dev server detection for Vite HMR
- [x] Self-contained examples with all assets (no root folder dependencies)
- [x] Consolidated documentation (single main README.md)

### 🚧 In Progress

- [ ] Preparing for package distribution (Packagist for Composer)
- [ ] Creating minimal-example documentation
- [ ] Writing comprehensive tests (PHPUnit)

### 📋 Planned

See [ROADMAP.md](ROADMAP.md) for detailed future plans.

## Key Technical Concepts

### Architecture Overview

Skybolt is a **two-part system**:

1. **Server-side (PHP)**: Coordinates cache state, renders optimized HTML
2. **Client-side (JavaScript)**: Manages localStorage, loads cached assets

### Core Components

| Component      | File                 | Purpose                                                   |
| -------------- | -------------------- | --------------------------------------------------------- |
| Config         | `Config.php`         | Immutable configuration using PHP 8.3 readonly properties |
| ManifestReader | `ManifestReader.php` | Reads Vite's `manifest.json`, extracts version hashes     |
| CacheManager   | `CacheManager.php`   | Tracks client cache inventory via cookies only            |
| AssetRenderer  | `AssetRenderer.php`  | Generates HTML tags with caching intelligence             |
| Skybolt        | `Skybolt.php`        | Main API facade, provides simple API for templates        |
| SkyboltClient  | `skybolt-client.js`  | Client-side ES module for cache management                |

### Performance Improvements (v1 → v2)

**Build & Tooling:**

- Build speed: Runtime minification → <1s with Vite (significantly faster)
- Minification: Custom PHP → esbuild/Lightning CSS (modern, optimized)
- Modern stack: ES Modules, PHP 8.3, Vite

**Caching Behavior:**

- Repeat visits: Assets loaded from localStorage in milliseconds
- Zero HTTP requests for cached CSS/JS
- Automatic cache invalidation via manifest versioning

### Request Flow

#### First Visit

1. Client → Server: GET /index.php
2. Server checks cookie (empty - new user)
3. Server inlines all assets in HTML
4. Client stores assets in localStorage
5. Client writes asset versions to cookie

#### Repeat Visit (Cached)

1. Client → Server: GET /index.php (with cookie containing asset versions)
2. Server reads cookie and parses asset inventory
3. Server sends `<meta>` tags for cached assets
4. Client loads from localStorage (~40ms)
5. **Zero HTTP requests for CSS/JS**

#### After Asset Update

1. Developer runs `bun run build`
2. Vite generates new version hashes
3. Client requests page
4. Server detects version mismatch (via cookie)
5. Server inlines updated assets
6. Client updates localStorage and cookie (automatic cache invalidation)

## Common Tasks

### Running the Example

```bash
cd examples/timber-v2

# Install dependencies
composer install
bun install

# Build assets
bun run build

# Run dev server
make serve
# Visit: http://localhost:8080

# Or run dev server as a daemon
make start
# Visit: http://localhost:8080
```

### Development Mode with HMR

```bash
# Terminal 1: Vite dev server
bun run dev

# Terminal 2: PHP server
php -S localhost:8001 -t public
```

### Building for Production

```bash
cd examples/timber-v2
bun run build
# Output in dist/
```

## API Reference

### PHP API (Server-side)

```php
use Skybolt\Skybolt;

$skybolt = new Skybolt(
    manifestPath: __DIR__ . '/dist/.vite/manifest.json',  // Required
    basePath: '/assets/',                                 // Default: '/assets/'
    cdnUrl: 'https://cdn.example.com',                    // Optional
    devServer: 'http://localhost:5173',                   // Optional (auto-detected)
    printComments: true,                                  // Debug mode
    inlineThreshold: 14336                                // 14KB inline threshold
);

// Critical CSS (always inlined, blocking)
echo $skybolt->css('src/css/critical.css', inline: 'always');

// Launch script (call once in <head>)
echo $skybolt->launchScript();

// Async CSS (localStorage or external link)
echo $skybolt->css('src/css/main.css');

// Async JavaScript (localStorage or external script)
echo $skybolt->script('src/js/app.js');

// Preload critical resources
echo $skybolt->preload('images/hero.jpg', as: 'image', fetchpriority: 'high');

// Blocking script for legacy code
echo $skybolt->script('src/legacy.js', async: false, module: false);
```

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    manifest: true,  // REQUIRED for Skybolt
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

## Documentation Files

| File                                    | Purpose                                      |
| --------------------------------------- | -------------------------------------------- |
| `README.md`                             | User-facing documentation (installation, usage, features) |
| `ROADMAP.md`                            | Future plans and feature roadmap             |
| `CLAUDE.md`                             | AI assistant context (this file)             |
| `packages/skybolt-core/README.md`       | Package documentation for Composer           |
| `packages/skybolt-core/ARCHITECTURE.md` | Internal architecture, design decisions      |
| `packages/skybolt-core/CHANGELOG.md`    | Version history, breaking changes            |
| `examples/timber-v2/README.md`          | Example setup instructions                   |
| `docs-legacy/`                          | Historical documentation (v1, old templates) |

## Documentation Standards

All markdown files in this repository follow [markdownlint](https://github.com/DavidAnson/markdownlint) rules for consistency and quality. When editing documentation, ensure compliance with these rules:

### Markdown Formatting Rules

**MD022/blanks-around-headings**: Headings should be surrounded by blank lines

- ✅ Good: Blank line before and after heading
- ❌ Bad: Heading directly adjacent to text
- Ensures visual separation and readability

**MD031/blanks-around-fences**: Fenced code blocks should be surrounded by blank lines

- ✅ Good: Blank line before and after code fence (```)
- ❌ Bad: Code fence directly adjacent to text
- Prevents rendering issues and improves clarity

**MD032/blanks-around-lists**: Lists should be surrounded by blank lines

- ✅ Good: Blank line before and after list
- ❌ Bad: List directly adjacent to paragraphs
- Ensures proper list rendering

**MD040/fenced-code-language**: Fenced code blocks should have a language specified

- ✅ Good: ` ```javascript ` or ` ```php ` or ` ```bash `
- ❌ Bad: ` ``` ` (no language)
- Enables syntax highlighting

### Applying These Rules

- Run markdownlint before committing documentation changes
- These rules apply to all `.md` files in the repository
- Consistent formatting improves readability and maintainability
- AI assistants should follow these rules when editing documentation

## Git Status (Current Branch: main)

Recent commits:

- `e91c0a1` - feat: Changed to Leaflet map, add CSS minification, less janky top menu, fixed isotope portfolio, made various perf improvements
- `4e70f64` - fix: get the old code working and dockerize it
- `b504a19` - feat: old Timber/Skybolt code imported

Staged changes:

- Added: `README-SKYBOLT-V2.md`
- Added: `packages/skybolt-core/` (entire package)
- Deleted: `examples/timber-vite/` (renamed to `timber-v2`)
- Modified: Various CSS files (minified and optimized)

## Known Issues & Technical Debt

1. **Legacy jQuery**: `examples/timber-v2` uses ancient jQuery 1.8.3 plugins that don't work with modern bundlers. Currently served as individual files (acceptable with HTTP/2).

2. **Package Distribution**: Not yet published to Packagist (Composer) or npm.

3. **Testing**: No automated tests yet (PHPUnit/PHPStan configured but not implemented).

## Dependencies

### PHP (Composer)

- PHP 8.3+ (required)
- No runtime dependencies (framework-agnostic)
- Dev: PHPUnit 11.0, PHPStan 1.10

### JavaScript (npm/bun)

- Vite 5.0+ (build tool)
- Lightning CSS 1.23+ (CSS minification)
- No runtime dependencies (vanilla ES modules)

## Security Considerations

- HTML escaping with `htmlspecialchars()` for all attribute values
- Secure cookie flags (`secure`, `httponly`, `samesite`)
- JSON parsing with `JSON_THROW_ON_ERROR`
- Manifest path validation on construction
- Only files in Vite manifest can be served

## Performance Best Practices

1. **Keep Critical CSS Minimal**: Only above-the-fold styles
2. **Lazy Load Non-Critical**: Use `css()` and `script()` (async by default)
3. **Preload Critical Resources**: Use `preload()` for hero images and fonts
4. **Use CDN in Production**: Set `cdnUrl` parameter
5. **Enable Long Cache Headers**: Vite's version hashes enable safe long-term caching

## Debugging

Enable debug comments:

```php
$skybolt = new Skybolt(
    // ...
    printComments: true
);
```

Check browser console and localStorage:

```javascript
// Browser console
console.log(localStorage.getItem('sb_cache'));
```

---

**Last Updated**: November 23, 2025
**Status**: 🚧 Active Development (v2.1.0)
**Main Branch**: `main`
