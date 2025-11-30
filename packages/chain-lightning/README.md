# Chain Lightning

Parallel dependency loading for ES modules with intelligent caching.

Chain Lightning eliminates the "waterfall" problem in ES module loading by analyzing your dependency graph at build time and generating import maps + modulepreload hints for parallel fetching.

## The Problem

What if you had a site with a lot of JS components with dependencies on each other -- a big hairy dependency graph like you might get when you compose your app from a lot of NPM packages.

And what if you wanted good caching and fast loading times?

- Application bundling: slow to load and every update invalidates the cache for the entire bundle. This is what many SPA frameworks do today, but this does indeed lead to slow initial load times and poor caching.
- Individual component bundling: shared dependencies become duplicated, cache invalidation of dependencies cause invalidation of all dependent component bundles, leading to duplication and bloat and inefficient caching.
- Dynamic importing at runtime: causes the 'waterfall chaining' effect where dependency chains are discovered and loaded sequentially, resulting in very large delays before a component would be ready.
- HTTP/2 Server Push: complicated to set up, not widely supported, and can lead to wasted bandwidth if not done carefully.

**THE HOLY GRAIL** is the ability to simply insert a 'script component' tag and have it seamlessly discover its entire dependency tree, begin fetching all of them immediately and in parallel, such that the server only returns non-cached assets, and the client is able to cache everything efficiently. If two components share a dependency, that dependency is only fetched once.

Not trivial.... but it's totally doable. And that's what Chain Lightning does.

### The chained waterfall problem

When the browser loads an ES module, it must:

1. Fetch the module
2. Parse it to discover imports
3. Fetch those imports
4. Repeat recursively

This creates a waterfall where each dependency level adds latency:

```text
component.js ─────────►
                       dependency-a.js ─────────►
                                                 shared-util.js ─────────►
```

### The Solution

Chain Lightning analyzes your dependency graph at build time and:

1. Generates an **import map** for stable, cache-friendly URLs
2. Emits **modulepreload** hints so the browser fetches all dependencies in parallel
3. Integrates with **Skybolt** for Service Worker caching

```text
component.js ─────────►
dependency-a.js ─────────►
shared-util.js ─────────►
```

## Installation

```bash
npm install @skybolt/chain-lightning
```

## Quick Start

### 1. Configure Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { chainLightning } from '@skybolt/chain-lightning/vite'

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        'search-component': 'src/components/search-component.js',
        'counter-component': 'src/components/counter-component.js'
      }
    }
  },
  plugins: [
    chainLightning({
      components: [
        'search-component',
        'counter-component'
      ]
    })
  ]
})
```

### 2. Server Integration (Node.js)

```javascript
import express from 'express'
import { ChainLightning } from '@skybolt/chain-lightning/server'

const app = express()

app.get('/', (req, res) => {
  const cl = new ChainLightning('./dist/.chain-lightning/manifest.json')

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      ${cl.headScripts()}
    </head>
    <body>
      ${cl.component('search-component')}
      <search-component></search-component>
    </body>
    </html>
  `)
})
```

### 3. Dynamic Imports (Client)

```javascript
// Components can be dynamically imported with parallel preloading
await chainLightning.import('search-component')
```

## Integration with Skybolt

Chain Lightning works best with [Skybolt](https://github.com/jensroland/skybolt) for optimal caching:

```javascript
import { Skybolt } from '@skybolt/server-adapter'
import { ChainLightning } from '@skybolt/chain-lightning/server'

app.get('/', (req, res) => {
  // Skybolt handles CSS and Service Worker caching
  const sb = new Skybolt('./dist/.skybolt/render-map.json', req.cookies)

  // Chain Lightning uses Skybolt for cache-aware decisions
  const cl = new ChainLightning('./dist/.chain-lightning/manifest.json', sb)

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      ${sb.css('src/css/main.css')}
      ${sb.launchScript()}
      ${cl.headScripts()}
    </head>
    <body>
      ${cl.component('search-component', { inlineDeps: true })}
      <search-component></search-component>
    </body>
    </html>
  `)
})
```

When integrated with Skybolt:

- First visit: Chunk dependencies are inlined via data URLs
- Repeat visits: Dependencies are loaded from Service Worker cache (~5ms)

## API Reference

### Vite Plugin

```javascript
import { chainLightning } from '@skybolt/chain-lightning/vite'

chainLightning({
  // Component entry points to track
  components: [
    'component-name',
    { name: 'component-name', version: '1' }
  ],

  // Output directory for manifest (default: '.chain-lightning')
  outDir: '.chain-lightning',

  // Add @major version specifiers to import map (default: true)
  majorVersionImports: true,

  // Enable debug logging (default: false)
  debug: false
})
```

### Server Adapter (Node.js)

```javascript
import { ChainLightning } from '@skybolt/chain-lightning/server'

const cl = new ChainLightning(manifestPath, skyboltInstance?)

cl.headScripts()                            // Render all head scripts (convenience)
cl.importMap()                              // Render <script type="importmap">
cl.manifestScript()                         // Render manifest data script
cl.clientScript()                           // Render client runtime script
cl.component('name')                        // Render component with preloads
cl.component('name', { inlineDeps: true })  // Inline chunk deps on first visit
cl.getComponentUrl('name')                  // Get component URL
cl.getModuleUrl('specifier')                // Get module URL from import map
cl.getEarlyHints(['comp1', 'comp2'])        // Get Link headers for HTTP 103
```

### Client API (Browser)

```javascript
await chainLightning.import('name')       // Dynamic import with preloading
await chainLightning.preload('name')      // Preload without executing
chainLightning.getComponentInfo('name')   // Get component metadata
chainLightning.listComponents()           // List all components
chainLightning.getComponentUrls('name')   // Get component + dependency URLs
```

## How It Works

### Build Time

1. Vite builds your components with content-hashed filenames
2. Chain Lightning plugin reads the Vite manifest
3. Rewrites relative imports to use import map specifiers
4. Generates `manifest.json` with:
   - Import map for all modules
   - Component dependency graphs
   - Chunk content for inlining

### Runtime (First Visit)

1. Server reads manifest and renders:
   - Global import map in `<head>`
   - Modulepreload hints for dependencies
   - Component script tag
2. Browser fetches all dependencies in parallel
3. If using Skybolt, chunks are cached for future visits

### Runtime (Repeat Visit)

1. Server checks cache state (via Skybolt cookies)
2. For cached chunks, renders external URLs instead of inlined content
3. Service Worker serves cached modules (~5ms response time)

## Manifest Schema

```json
{
  "version": 1,
  "generated": "2025-11-30T12:00:00.000Z",
  "chainLightningVersion": "0.1.0",
  "basePath": "/",
  "importMap": {
    "imports": {
      "search-component": "/assets/search-component-abc123.js",
      "search-component@1": "/assets/search-component-abc123.js"
    }
  },
  "chunks": {
    "chunk:debounce@4": {
      "url": "/assets/debounce-xyz789.js",
      "hash": "xyz789",
      "content": "export function debounce...",
      "dataUrl": "data:application/javascript;base64,..."
    }
  },
  "components": {
    "search-component": {
      "url": "/assets/search-component-abc123.js",
      "hash": "abc123",
      "src": "src/components/search-component.js",
      "deps": ["chunk:debounce@4"]
    }
  },
  "client": {
    "url": "/assets/chain-lightning-def456.js",
    "hash": "def456",
    "content": "class ChainLightningClient..."
  }
}
```

Note: Chunk specifiers include `@major` version suffix (e.g., `chunk:debounce@4` for lodash-es v4.x). This enables non-breaking updates to dependencies without invalidating cached components.

## Versioning Strategy

Chain Lightning solves the versioning challenge using **major version specifiers**:

### The Versioning Problem

Consider two components that share a dependency:

- `search-component` uses lodash-es v4.x (debounce function)
- `admin-panel` uses lodash-es v4.x (debounce function)

**With bundling or exact/hash versioning**: Each component/bundles is tightly coupled to an exact version of debounce. When lodash-es gets a patch update, both components/bundles must be rebuilt and re-downloaded. Wasteful duplication and poor caching.

**With external dependencies but no versioning**: Both components import from a shared `chunk:debounce`. Minor/patch updates work great - the import map points to the new hash and both components automatically use it.

But what happens when `admin-panel` upgrades to lodash-es v5.x (breaking API changes)?

- The import map updates: `"chunk:debounce"` → new v5 hash
- `search-component` (still expecting v4 API) breaks!
- You can't update one component without affecting all others sharing that dependency

### The Versioning Solution

Chain Lightning derives the **major version** from each dependency's `package.json` and includes it in specifiers:

1. **Build time**: Analyzes dependency graph and extracts major versions
2. **Import statements**: Rewritten to `import "chunk:debounce@4"` (major version from lodash-es)
3. **Import maps**: Map `"chunk:debounce@4"` → `/assets/debounce-xyz789.js`

### How Version Updates Work

**Minor/patch update** (lodash-es 4.17.21 → 4.17.22):

- New build generates new hash: `debounce-abc123.js`
- Import map updates: `"chunk:debounce@4"` → `/assets/debounce-abc123.js`
- Cached components still import `"chunk:debounce@4"` → automatically get new version
- **No component cache invalidation needed**

**Major update** (lodash-es 4.x → 5.x in admin-panel only):

- New specifier added: `"chunk:debounce@5"` → `/assets/debounce-v5-def456.js`
- Old specifier preserved: `"chunk:debounce@4"` → `/assets/debounce-xyz789.js`
- `search-component` keeps importing `@4`, `admin-panel` imports `@5`
- **Both versions coexist safely** - components upgrade independently

## License

MIT
