# Skybolt Architecture

This document explains the internal architecture of Skybolt and how all the pieces fit together.

## Overview

Skybolt is a two-part system:

1. **Server-side (PHP)**: Coordinates cache state and renders optimized HTML
2. **Client-side (JavaScript + Service Worker)**: Manages Cache API storage and serves cached assets

## Core Components

### 1. Config (`Config.php`)

Immutable configuration object using PHP 8.3 readonly properties.

**Responsibilities:**

- Store all configuration settings
- Provide asset URL resolution (CDN vs local)
- Detect Vite dev server availability
- Validate configuration on construction

**Key Methods:**

- `getAssetUrl(string $path): string` - Resolve full asset URL
- `isDevelopment(): bool` - Check if dev server is running

### 2. ManifestReader (`ManifestReader.php`)

Reads and parses Vite's `manifest.json` file.

**Responsibilities:**

- Load manifest from filesystem
- Map source files to compiled outputs
- Extract version hashes from filenames
- Provide asset content for inlining
- Cache parsed data for performance

**Key Methods:**

- `getFile(string $entry): ?string` - Get compiled filename
- `getUrl(string $entry): ?string` - Get full asset URL
- `getVersion(string $entry): ?string` - Extract version hash
- `getContent(string $entry): ?string` - Get file contents for inlining

**Manifest Structure:**

```json
{
  "src/main.js": {
    "file": "assets/main-a1b2c3d4.js",
    "css": ["assets/main-e5f6g7h8.css"],
    "imports": ["src/vendor.js"]
  }
}
```

### 3. CacheManager (`CacheManager.php`)

Manages client cache inventory using cookies.

**Responsibilities:**

- Track which assets each client has cached
- Sync with client via cookies
- Request inventory updates when needed
- Manage loader script cache state

**Key Methods:**

- `hasLatestVersion(string $name, string $version): bool` - Check client cache
- `updateInventory(array $versions): void` - Update from client
- `requestInventory(): void` - Request inventory report
- `clear(): void` - Force cache invalidation

**Storage Strategy:**

- Primary: Cookie `sb_assets` (JSON encoded)
- Client sync: Cookie `sb_inventory` (flag)

### 4. AssetRenderer (`AssetRenderer.php`)

Renders HTML tags with caching intelligence.

**Responsibilities:**

- Generate `<script>`, `<style>`, or `<link>` tags
- Decide whether to inline assets or use external tags
- Add Skybolt data attributes (`data-sb-cache`, `data-sb-url`) for inline assets
- Respect size thresholds for inlining
- Handle dev mode vs production

**Key Methods:**

- `renderAsyncCSS(string $entry): string` - Smart auto-optimization (inline small files, external for large)
- `renderBlockingCSS(string $entry): string` - Traditional blocking `<link>` tag
- `renderAsyncScript(string $entry): string` - Smart auto-optimization (inline small files, external for large)
- `renderBlockingScript(string $entry): string` - Traditional blocking `<script>` tag
- `renderLaunchScript(): string` - Render Skybolt client

**Rendering Logic:**

```text
┌─────────────────────────────────────────┐
│ Should we inline this asset?            │
└─────────────────────────────────────────┘
              ↓
     ┌────────┴────────────┐
     │ Client has cached?  │
     └────────┬────────────┘
              ↓ YES
    [<link>/<script> tag]
    (SW intercepts & serves)
              ↓ NO
     ┌────────┴────────────┐
     │ Size < threshold?   │
     │   (default: 50KB)   │
     └────────┬────────────┘
              ↓ YES
  [Inline with data-sb-cache]
  (Cached by SW for next visit)
              ↓ NO
     [External <link>/<script>]
     (Network fetch, SW caches)
```

### 5. Skybolt (`Skybolt.php`)

Main facade class - public API for users.

**Responsibilities:**

- Initialize all components
- Provide simple API for templates
- Manage asset render queue (fluent API)
- Handle inventory updates
- Expose advanced features

**API Style:**

```php
// Critical CSS (auto-optimized)
echo $skybolt->css('src/critical.css');

// Launch the client-side cache controller
echo $skybolt->launchScript();

// Async CSS (default behavior)
echo $skybolt->css('src/main.css');

// Async JavaScript
echo $skybolt->script('src/app.js');

// Preload critical resources
echo $skybolt->preload('images/hero.jpg', as: 'image', fetchpriority: 'high');

// Blocking script for legacy code
echo $skybolt->script('src/jquery.js', async: false, module: false);
```

## Client-Side Architecture

### SkyboltClient (`skybolt-client.js`)

Modern ES module for client-side Service Worker registration and cache coordination.

**Initialization Flow:**

1. Load config from `<meta name="skybolt-config">`
2. Register Service Worker (`/skybolt-sw.php`)
3. Wait for Service Worker to be ready
4. Process inlined assets (extract and cache)
5. Wait for DOMContentLoaded
6. Update cookie with cached asset versions

**Service Worker (`skybolt-sw.js`)**

Lightweight custom Service Worker for cache-first asset serving.

**Features:**

- Cache-first strategy for `.js`, `.css`, `.mjs` files
- Dev mode bypass (checks for `?dev-mode` or localhost:5173)
- Automatic cache cleanup on activation
- Message handlers for cache info and clearing

**Asset Processing:**

```javascript
// Extract and cache inlined assets
document.querySelectorAll('[data-sb-cache]')
  → Extract content from <style>/<script>
  → Create Response object
  → Store in Cache API (cache name: 'skybolt-assets-v1')
  → Update version tracking

// Service Worker intercepts requests
fetch event
  → Check if asset request (.js, .css)
  → Look in Cache API
  → If found: serve from cache (instant)
  → If not found: fetch from network + cache for next time
```

**Cache API Structure:**

```javascript
// Cache name: 'skybolt-assets-v1'
{
  '/assets/main-a1b2c3d4.css': Response {
    body: 'body{margin:0}...',
    headers: {
      'Content-Type': 'text/css',
      'X-Skybolt-Version': 'a1b2c3d4',
      'X-Skybolt-Name': 'src/css/main.css',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  }
}
```

**Cookie Structure:**

```javascript
// Cookie: sb_assets
"src/css/critical.css:DGWO61LE,src/css/main.css:wsCF4wOV,src/js/app.js:X8kM9nPQ"

// Multi-cookie sharding (if data exceeds 4KB)
// sb_assets: first 4KB chunk
// sb_assets_2: second chunk
// sb_assets_3: third chunk
// sb_assets_count: total number of chunks
```

### Cache Management & Recovery

**Version Tracking:**

The client tracks cached asset versions via cookies and compares with the server on each request:

```javascript
// Client stores versions after caching
this.versions = {
  'src/css/main.css': 'a1b2c3d4',
  'src/js/app.js': 'e5f6g7h8'
};
this.updateCookie(); // Write to sb_assets cookie
```

**Cache Invalidation:**

When the server detects a version mismatch (new build deployed):

1. Server inlines updated assets with `data-sb-cache` attributes
2. Client extracts and caches to Cache API
3. Client updates cookie with new versions
4. Service Worker automatically serves new version on next request

**Recovery Methods:**

```javascript
// Clear cache without unregistering Service Worker
window.skybolt.clearCache()
  → Delete 'skybolt-assets-v1' from Cache API
  → Clear sb_assets cookies
  → Keep Service Worker registered

// Full reset (development/debugging)
window.skybolt.selfDestruct()
  → Clear Cache API
  → Clear cookies
  → Unregister Service Worker
  → Reload page
```

**Graceful Degradation:**

If Service Workers are not supported or fail to register:

```javascript
handleNoServiceWorker() {
  // Convert inlined assets to external links
  document.querySelectorAll('[data-sb-cache]').forEach(element => {
    const url = element.getAttribute('data-sb-url');

    // Replace inline <style> with <link>
    if (element.tagName === 'STYLE') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      element.parentNode.replaceChild(link, element);
    }

    // Replace inline <script> with external <script>
    if (element.tagName === 'SCRIPT') {
      const script = document.createElement('script');
      script.src = url;
      // Preserve module/async attributes
      element.parentNode.replaceChild(script, element);
    }
  });
}
```

**Design Rationale:**

- **Browser Native**: Uses standard Cache API (no quota limits like localStorage)
- **Persistent**: Cache survives browser restarts
- **Offline Capable**: Assets available even without network
- **Transparent**: Standard HTTP caching semantics
- **Debuggable**: Inspect cache in DevTools Application tab

## Request Flow

### First Visit

```text
1. Client → Server: GET /index.php
2. Server:
   - Check cookie (empty - new user)
   - Read Vite manifest
   - Inline small assets with data-sb-cache attributes
   - Send large assets as external links
3. Server → Client: HTML with inlined assets
4. Client:
   - Register Service Worker (/skybolt-sw.php)
   - Extract inlined assets from DOM
   - Store directly to Cache API
   - Large assets fetched, SW caches them
   - Update sb_assets cookie with versions
```

### Repeat Visit (Cached)

```text
1. Client → Server: GET /index.php
   - Sends cookie with asset versions
2. Server:
   - Check cookie (has asset versions)
   - Read Vite manifest
   - Compare versions (match)
   - Send standard <link>/<script> tags
3. Server → Client: HTML with external asset references
4. Browser:
   - Request assets (GET /assets/main-abc123.css)
5. Service Worker:
   - Intercept fetch event
   - Check Cache API
   - Serve from cache (~1ms response time)
   - **Zero network requests**
```

### After Asset Update

```text
1. Developer: Run `bun run build`
   - Vite generates new hashes
   - manifest.json updated
2. Client → Server: GET /index.php
   - Sends cookie with old versions
3. Server:
   - Read new manifest
   - Detect version mismatch (cookie vs manifest)
   - Inline updated assets with data-sb-cache
4. Client:
   - Extract inlined assets
   - Update Cache API (overwrites old versions)
   - Update sb_assets cookie with new versions
5. Next Request:
   - Service Worker serves new version from cache
```

## Data Attributes

Skybolt uses custom data attributes with `data-sb-` prefix for inline assets:

| Attribute        | Purpose                    | Values                          |
| ---------------- | -------------------------- | ------------------------------- |
| `data-sb-cache`  | Cache identifier + version | `{name}:{version}` (e.g., "src/css/main.css:a1b2c3d4") |
| `data-sb-url`    | Asset URL for caching      | Full URL path (e.g., "/assets/main-a1b2c3d4.css") |
| `data-sb-module` | ES module flag (scripts)   | `"true"` if type="module"       |
| `data-sb-async`  | Async flag (scripts)       | `"true"` if async attribute     |

**Example Usage:**

```html
<!-- Inlined CSS with cache attributes -->
<style data-sb-cache="src/css/main.css:wsCF4wOV" data-sb-url="/assets/main-wsCF4wOV.css">
body{margin:0}...
</style>

<!-- Inlined script with module + async -->
<script type="module"
        data-sb-cache="src/js/app.js:X8kM9nPQ"
        data-sb-url="/assets/app-X8kM9nPQ.js"
        data-sb-module="true"
        data-sb-async="true">
console.log('app')...
</script>
```

## Error Handling

### Service Worker Registration Failure

```javascript
// Graceful fallback to external loading
try {
  await navigator.serviceWorker.register('/skybolt-sw.php');
} catch (error) {
  console.error('[Skybolt] Service Worker registration failed:', error);
  this.handleNoServiceWorker(); // Convert inline to external
}
```

### Missing Manifest

```php
if (!file_exists($this->manifestPath)) {
  throw new \InvalidArgumentException("Manifest not found");
}
```

### Missing Assets

```php
if ($file === null) {
  return $this->renderComment("Asset not found: {$entry}");
}
```

### Cache API Errors

```javascript
// Safe Cache API operations with fallback
async cacheInlineAsset(data) {
  try {
    const cache = await caches.open('skybolt-assets-v1');
    await cache.put(url, response);
  } catch (error) {
    console.error('[Skybolt] Failed to cache inline asset:', error);
    // Continue without caching - next visit will inline again
  }
}
```

## Security Considerations

### 1. Cookie Security

```php
setcookie($name, $value, [
  'secure' => isset($_SERVER['HTTPS']),
  'httponly' => true,
  'samesite' => 'Lax'
]);
```

### 2. HTML Escaping

```php
$escapedValue = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
```

### 3. JSON Safety

```php
json_decode($input, true, 512, JSON_THROW_ON_ERROR);
```

### 4. Path Validation

```php
// Manifest paths are validated by Vite
// Only files in manifest can be served
```

## Testing Strategy

### Unit Tests

- Config validation
- Manifest parsing
- Version extraction
- URL resolution

### Integration Tests

- Full render pipeline
- Cache coordination
- Inventory updates

### E2E Tests

- First visit flow
- Repeat visit flow
- Cache invalidation
- Dev mode switching
