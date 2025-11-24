# Timber Example with Skybolt

This is the Timber template migrated to use Skybolt.

The template used for this demo is available from <https://gt3themes.com/bootstrap/timber-free-one-page-bootstrap-template/>.

## Setup

```bash
# Install dependencies
composer install
bun install

# Build assets
bun run build

# Run server
make serve
```

Visit: http://localhost:8080

## Architecture

### CSS (Vite Bundled)

- `src/css/critical.css` → Inlined for first paint
- `src/css/main.css` → Async loaded (all site styles)
- `src/css/fonts+inline.css` → Async loaded (web fonts)

### JavaScript (Static Files)

Legacy jQuery plugins served as-is from `dist/js/`:

- jQuery 1.8.3
- jQuery Mobile, Easing, etc.
- Isotope, PrettyPhoto, SlickNav
- Leaflet maps
- Site scripts
