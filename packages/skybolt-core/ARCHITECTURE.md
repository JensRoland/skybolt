# Skybolt Architecture

This document explains the internal architecture of Skybolt v2 and how all the pieces fit together.

## Overview

Skybolt is a two-part system:

1. **Server-side (PHP)**: Coordinates cache state and renders optimized HTML
2. **Client-side (JavaScript)**: Manages localStorage and loads cached assets

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

Manages client cache inventory using sessions and cookies.

**Responsibilities:**

- Track which assets each client has cached
- Store inventory in PHP session
- Sync with client via cookies
- Request inventory updates when needed
- Manage loader script cache state

**Key Methods:**

- `hasLatestVersion(string $name, string $version): bool` - Check client cache
- `updateInventory(array $versions): void` - Update from client
- `requestInventory(): void` - Request inventory report
- `clear(): void` - Force cache invalidation

**Storage Strategy:**

- Primary: PHP `$_SESSION['skybolt_inventory']`
- Backup: Cookie `sb_assets` (JSON encoded)
- Client sync: Cookie `sb_inventory` (flag)

### 4. AssetRenderer (`AssetRenderer.php`)

Renders HTML tags with caching intelligence.

**Responsibilities:**

- Generate `<script>`, `<style>`, or `<meta>` tags
- Decide whether to inline or reference assets
- Add Skybolt data attributes for client processing
- Respect size thresholds for inlining
- Handle dev mode vs production

**Key Methods:**

- `renderCriticalCSS(string $entry): string` - Always inline
- `renderAsyncCSS(string $entry): string` - Inline or async
- `renderAsyncScript(string $entry): string` - Inline or async
- `renderLaunchScript(): string` - Render Skybolt client

**Rendering Logic:**

```text
┌─────────────────────────────────────────┐
│ Should we inline this asset?            │
└─────────────────────────────────────────┘
              ↓
     ┌────────┴────────┐
     │  Is Critical?   │
     └────────┬────────┘
              ↓ YES
        [Inline it]
              ↓ NO
     ┌────────┴────────────┐
     │ Client has cached?  │
     └────────┬────────────┘
              ↓ YES
      [Send <meta> tag]
              ↓ NO
     ┌────────┴────────────┐
     │ Size < threshold?   │
     └────────┬────────────┘
              ↓ YES
        [Inline it]
              ↓ NO
     [Async <script>/<link>]
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
// Critical CSS (always inlined)
echo $skybolt->css('src/critical.css', inline: 'always');

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

Modern ES module for client-side cache management.

**Initialization Flow:**

1. Load config from <meta name="skybolt-config">
2. Load asset map from localStorage
3. Process <head> assets immediately
4. Wait for DOMContentLoaded
5. Process <body> assets
6. Report inventory if requested

**Asset Processing:**

```javascript
// Store inlined assets
document.querySelectorAll('[data-sb-state="store"]')
  → Extract content
  → Save to localStorage
  → Mark as stored

// Load cached assets
document.querySelectorAll('meta[data-sb-state="load"]')
  → Validate cache
  → Create <script>/<style> element
  → Inject content from localStorage
  → Replace <meta> tag

// Load async assets
document.querySelectorAll('meta[data-sb-state="load-async"]')
  → Create <script>/<link> element
  → Set src/href
  → Append to <head> on window.load
```

**localStorage Structure:**

```javascript
{
  "sb_cache": {
    "src/main.css": {
      "type": "style",
      "version": "a1b2c3d4",
      "data": "body{margin:0}...",
      "size": 12345
    },
    "src/app.js": {
      "type": "script",
      "version": "e5f6g7h8",
      "data": "console.log('hello')...",
      "size": 6789
    }
  }
}
```

### Cache Validation & Corruption Detection

Skybolt includes robust cache validation to ensure integrity and automatically recover from corrupted states.

**Validation Triggers:**

The client validates the cache in two scenarios:

1. **On Load** (`loadFromStorage`): When reading from localStorage
2. **On Use** (`loadCachedAssets`): When injecting cached assets into the page

**Validation Checks:**

When loading a cached asset, Skybolt performs three validation checks:

```javascript
const item = this.assetMap[name];

// 1. Asset exists in cache
if (!item) {
    this.selfDestruct();
    return;
}

// 2. Version matches server expectation
if (item.version !== version) {
    this.selfDestruct();
    return;
}

// 3. Data integrity check (size matches)
if (item.data.length !== item.size) {
    this.selfDestruct();
    return;
}
```

**Recovery Process (`selfDestruct`):**

When corruption is detected, Skybolt executes an automatic recovery sequence:

1. Clear localStorage cache
2. Clear version cookie
3. Reload page (server will detect clean state and inline assets)

**Common Corruption Scenarios:**

| Scenario             | Detection                                      | Recovery                                             |
| -------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| **Version Mismatch** | Server deployed new assets with different hash | selfDestruct() → reload → server inlines new version |
| **Partial Write**    | localStorage quota exceeded mid-write          | Size check fails → selfDestruct() → clean reload     |
| **Manual Tampering** | User/extension modified localStorage           | Any validation check fails → selfDestruct()          |
| **Parse Error**      | Corrupted JSON in localStorage                 | try/catch in loadFromStorage() → selfDestruct()      |
| **Missing Asset**    | Asset deleted but version cookie still present | Null check fails → selfDestruct()                    |

**Error Handling:**

```javascript
// Safe localStorage operations with fallback
loadFromStorage() {
    try {
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
            this.assetMap = JSON.parse(cached);
        }
    } catch (err) {
        console.warn('Skybolt: Failed to load cache', err);
        this.selfDestruct();  // Recover from parse errors
    }
}

saveToStorage() {
    try {
        localStorage.setItem(this.cacheKey, JSON.stringify(this.assetMap));
    } catch (err) {
        console.warn('Skybolt: Failed to save cache', err);
        // Don't self-destruct on save errors (e.g., quota exceeded)
        // Just log the error and continue
    }
}
```

**Design Rationale:**

- **Fail-Safe by Default**: Any validation failure triggers automatic recovery
- **User Experience**: Silent recovery with console warnings (no user-facing errors)
- **Zero Maintenance**: No manual cache clearing required
- **Performance**: Validation checks are fast (simple equality comparisons)
- **Reliability**: One bad asset doesn't corrupt the entire cache (per-asset validation)

## Request Flow

### First Visit

```text
1. Client → Server: GET /index.php
2. Server:
   - Check session (empty - new user)
   - Read Vite manifest
   - Decide to inline all assets
3. Server → Client: HTML with inlined assets
4. Client:
   - Parse HTML
   - Store assets to localStorage
   - Report inventory via beacon
5. Client → Server: POST /inventory.php (versions)
6. Server:
   - Update session with asset versions
   - Respond 204 No Content
```

### Repeat Visit (Cached)

```text
1. Client → Server: GET /index.php
   - Sends cookie with asset versions
2. Server:
   - Check session (has inventory)
   - Read Vite manifest
   - Compare versions
   - Send <meta> tags for cached assets
3. Server → Client: HTML with <meta> tags
4. Client:
   - Load assets from localStorage
   - Replace <meta> tags with <script>/<style>
   - Assets appear instantly
```

### After Asset Update

```text
1. Developer: Run `bun run build`
   - Vite generates new hashes
   - manifest.json updated
2. Client → Server: GET /index.php
3. Server:
   - Read new manifest
   - Detect version mismatch
   - Inline new assets
4. Client:
   - Update localStorage
   - Report new inventory
5. Server:
   - Update session
```

## Data Attributes

Skybolt uses custom data attributes with `data-sb-` prefix:

| Attribute         | Purpose          | Values                                            |
| ----------------- | ---------------- | ------------------------------------------------- |
| `data-sb-type`    | Asset type       | `script`, `style`                                 |
| `data-sb-name`    | Asset identifier | Entry path from manifest                          |
| `data-sb-version` | Version hash     | Extracted from filename                           |
| `data-sb-state`   | Processing state | `store`, `load`, `load-async`, `stored`, `loaded` |
| `data-sb-src`     | External URL     | For async assets                                  |

## Performance Optimizations

### 1. Lazy Dev Server Check

```php
// Only check once per 5 seconds, cache result
static $cache = null;
static $cacheTime = 0;
```

### 2. Manifest Caching

```php
// Version hashes cached in ManifestReader
$this->cache['version'][$entry] = $version;
```

### 3. Session Storage

```php
// Inventory stored in session, not re-parsed each request
$this->session['skybolt_inventory'] = $this->inventory;
```

### 4. Critical CSS Inline

```php
// Critical CSS always inlined - no round-trip
$this->buildInlineStyle($entry, $version, $content);
```

### 5. Async Non-Critical

```php
// Non-critical assets deferred to window.load
window.addEventListener('load', () => {
  this.loadScript(src);
});
```

## Error Handling

### Client Cache Corruption

```javascript
// Validate size and version
if (item.data.length !== item.size || item.version !== version) {
  this.selfDestruct(); // Clear and reload
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

## Extension Points

### Custom Session Adapter

```php
interface SessionInterface {
  public function get(string $key): mixed;
  public function set(string $key, mixed $value): void;
}
```

### Custom Rendering Strategy

```php
interface StrategyInterface {
  public function shouldInline(string $entry, int $size): bool;
  public function shouldCache(string $entry): bool;
}
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

