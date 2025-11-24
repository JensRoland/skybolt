# Minimal Skybolt v2 Example

Modern implementation using Vite for asset bundling and Skybolt v2 for intelligent caching.

## Setup

### 1. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install JavaScript dependencies
bun install
```

### 2. Build Assets

```bash
# Production build
bun run build
```

### 3. Run the Site

```bash
# Using PHP's built-in server
php -S localhost:8000 -t public
```

Then visit: http://localhost:8000

## Project Structure

```text
minimal-example/
├── src/
│   ├── css/
│   │   ├── critical.css    # Above-the-fold CSS (inlined)
│   │   └── main.css        # Main styles (async)
│   └── js/
│       └── app.js          # Main JavaScript
├── public/
│   ├── index.php           # Entry point
├── dist/                   # Vite build output (generated)
│   ├── .vite/
│   │   └── manifest.json   # Asset manifest
│   └── assets/             # Compiled assets
├── vite.config.js
├── package.json
└── composer.json
```

## How It Works

1. **Build Time**: Vite bundles and optimizes assets, generating a manifest
2. **First Visit**: Skybolt inlines critical CSS and sends cacheable assets
3. **Client**: JavaScript stores assets in localStorage
4. **Subsequent Visits**: Assets loaded instantly from localStorage
5. **Updates**: Version changes trigger automatic cache invalidation
