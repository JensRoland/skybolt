# Timber v2 - Full Template Migration

This is the complete Timber template migrated to use Skybolt v2 with Vite.

## What's Different from v1

- ✅ **Vite for CSS**: All CSS bundled and minified by Vite (154KB → 29KB gzipped)
- ✅ **PHP 8.3**: Modern PHP with Skybolt v2
- ✅ **Static JS**: Legacy jQuery served as individual files (works with HTTP/2)
- ✅ **localStorage caching**: Same smart caching as v1

## Setup

```bash
# Install dependencies
composer install
bun install

# Build assets
bun run build

# Run server
php -S localhost:8001 -t public
```

Visit: http://localhost:8001

## Architecture

### CSS (Vite Bundled)
- `src/css/critical.css` → Inlined for first paint
- `src/css/main.css` → Async loaded (all site styles)
- `src/css/fonts.css` → Async loaded (web fonts)

### JavaScript (Static Files)
Legacy jQuery plugins served as-is from `dist/js/`:
- jQuery 1.8.3
- jQuery Mobile, Easing, etc.
- Isotope, PrettyPhoto, SlickNav
- Leaflet maps
- Site scripts

**Why not bundle JS?** These ancient jQuery plugins don't work with modern bundlers.
Serving them individually is fine with HTTP/2 multiplexing.

## Performance

| Metric | v1 | v2 |
|--------|----|----|
| CSS Size | ~312KB | 154KB (29KB gzipped) |
| Build Time | Runtime | <200ms |
| First Paint | TBD | TBD |

## Files

- `public/index.php` - Main template with Skybolt v2
- `public/inventory.php` - Cache inventory endpoint
- `src/css/` - CSS source files (imported by Vite)
- `dist/` - Build output
- `vite.config.js` - Vite configuration
