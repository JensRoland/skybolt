# Skybolt Laravel Example

A Laravel example demonstrating Skybolt's asset caching using Blade directives.

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
php-laravel/
├── app/
│   └── Providers/
│       └── AppServiceProvider.php  # Blade directives for Skybolt
├── bootstrap/
│   └── app.php                     # Laravel bootstrap
├── config/
│   ├── app.php
│   └── view.php
├── public/
│   ├── index.php                   # Entry point
│   ├── router.php                  # Dev server router
│   └── build/                      # Built assets (generated)
├── resources/
│   ├── css/
│   │   ├── critical.css            # Above-the-fold styles
│   │   └── app.css                 # Main styles
│   ├── js/
│   │   └── app.js                  # Application JavaScript
│   └── views/
│       └── welcome.blade.php       # Main Blade template
├── routes/
│   └── web.php                     # Route definitions
├── storage/                        # Laravel storage
├── vite.config.js                  # Vite configuration
├── package.json                    # NPM dependencies
├── composer.json                   # PHP dependencies
└── Makefile                        # Build commands
```

## Usage in Blade Templates

Skybolt provides clean Blade directives for asset management:

```blade
{{-- In your <head> --}}
@skyboltCss('resources/css/critical.css')
@skyboltLaunch
@skyboltCss('resources/css/app.css')

{{-- Before </body> --}}
@skyboltScript('resources/js/app.js')

{{-- Display version (optional) --}}
Skybolt v@skyboltVersion
```

### Available Directives

| Directive                | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `@skyboltCss('path')`    | Render CSS (inlined on first visit, cached thereafter)    |
| `@skyboltScript('path')` | Render JavaScript as ES module                            |
| `@skyboltLaunch`         | Render the Skybolt client launcher (required in `<head>`) |
| `@skyboltVersion`        | Output the Skybolt version number                         |

## Testing the Cache

1. Open DevTools → Network tab
2. Load the page (first visit)
3. Observe: CSS/JS are inlined in the HTML
4. Refresh the page
5. Observe: No network requests for CSS/JS (served by Service Worker)

## Requirements

- Node.js 18+
- PHP 8.2+
- Composer
