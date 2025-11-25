# Skybolt Laravel Example

A Laravel example demonstrating Skybolt's asset caching.

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
│   ├── Providers/
│   │   └── AppServiceProvider.php
│   └── View/
│       └── Components/
│           └── Skybolt.php        # Blade helper for Skybolt
├── bootstrap/
│   └── app.php                    # Laravel bootstrap
├── config/
│   ├── app.php
│   └── view.php
├── public/
│   ├── index.php                  # Entry point
│   ├── router.php                 # Dev server router
│   └── build/                     # Built assets (generated)
├── resources/
│   ├── css/
│   │   ├── critical.css           # Above-the-fold styles
│   │   └── app.css                # Main styles
│   ├── js/
│   │   └── app.js                 # Application JavaScript
│   └── views/
│       └── welcome.blade.php      # Main Blade template
├── routes/
│   └── web.php                    # Route definitions
├── storage/                       # Laravel storage
├── vite.config.js                 # Vite configuration
├── package.json                   # NPM dependencies
├── composer.json                  # PHP dependencies
└── Makefile                       # Build commands
```

## Usage in Blade Templates

```blade
{{-- In your <head> --}}
{!! App\View\Components\Skybolt::css('resources/css/critical.css') !!}
{!! App\View\Components\Skybolt::launchScript() !!}
{!! App\View\Components\Skybolt::css('resources/css/app.css') !!}

{{-- Before </body> --}}
{!! App\View\Components\Skybolt::script('resources/js/app.js') !!}
```

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
