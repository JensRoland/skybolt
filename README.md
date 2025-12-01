# Skybolt

[Skybolt animated header](https://github.com/user-attachments/assets/3cae1e2a-aefb-45a2-83d7-e86ad365cca8)

High-performance asset caching for multi-page applications.

**Status:** Beta | **License:** MIT

**Works with:** PHP, Python, Ruby, Go, Node.js/Bun

![Language logos](./readme-assets/language-dark.webp#gh-dark-mode-only)
![Language logos](./readme-assets/language-light.webp#gh-light-mode-only)

## What is Skybolt?

Skybolt is a web application caching library for the performance-obsessed who want to squeeze every last drop of speed out of their multi-page applications.

Skybolt eliminates HTTP requests for JS/CSS assets by inlining them in the HTML page on a user's first visit, and caching the inlined payloads using Service Workers and the Cache API. On return visits, assets load from cache in ~5ms with zero network overhead.

### How It Works

Without Skybolt, your first visit loads assets normally:

![Sequence diagram - normal web request](./readme-assets/sequence-diagram-normal-dark.webp#gh-dark-mode-only)
![Sequence diagram - normal web request](./readme-assets/sequence-diagram-normal-light.webp#gh-light-mode-only)

With Skybolt, the first visit inlines assets and caches them via Service Worker:

![Sequence diagram - with Skybolt](./readme-assets/sequence-diagram-skybolt-dark.webp#gh-dark-mode-only)
![Sequence diagram - with Skybolt](./readme-assets/sequence-diagram-skybolt-light.webp#gh-light-mode-only)

**First Visit:**

1. Server inlines CSS/JS directly in the HTML (with special attributes)
2. Service Worker registers and caches the inlined content
3. Cookie records which asset versions are cached

**Return Visit:**

1. Server reads cookie, sees assets are cached
2. Server sends regular `<link>` and `<script>` tags
3. Service Worker intercepts requests, serves from Cache API
4. **Zero network requests for CSS/JS**

**After Rebuild:**

1. Vite generates new content hashes
2. Server detects version mismatch via cookie
3. Server inlines updated assets
4. Cache automatically invalidated

### Is this even a good idea?

Inlining assets makes the initial HTML larger, but eliminates multiple HTTP requests. Return visits will make no network requests for the cached assets.

However, using plain old versioned asset URLs and the right cache headers achieves similar results on return visits (no network requests for the cached assets) without the complexity of a Service Worker and the Cache API.

So the question is really all about that first visit: *Is a single large payload faster than multiple smaller ones?*

Well, it depends:

- Since HTTP/2, multiple requests are cheaper and we have proper response multiplexing so the benefits of inlining are much less pronounced.
- If your assets are small (under ~50KB total), inlining is almost always faster.
- If your assets are large (hundreds of KBs), the initial HTML bloat may outweigh the benefits.
- If you inline assets which should have been lazyloaded, you will actively hurt performance.
- If you use Skybolt only for critical assets (e.g., critical CSS, core JS) and document fragments, you will likely see the best results.

If you are trying to optimize your site, Skybolt is not your first port of call. First, reduce your total critical payload to less than 170KB, optimize images, use a CDN, and implement lazy loading for non-critical assets. If you are still front-loading below-the-fold images without proper cache headers, you have bigger problems than Skybolt can solve.

However, if you are here, you are likely more performance-obsessed than average, so give Skybolt a try and measure the results!

## Quick Start

### 1. Install Vite Plugin

```bash
npm install @skybolt/vite-plugin
```

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { skybolt } from '@skybolt/vite-plugin'

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
  },
  plugins: [skybolt()]
})
```

### 2. Install Server Adapter

Choose your language:

<details>
<summary><strong>PHP</strong></summary>

```bash
composer require jensroland/skybolt
```

```php
<?php
$sb = new Skybolt\Skybolt(__DIR__ . '/dist/.skybolt/render-map.json');
?>
<head>
    <?= $sb->css('src/css/critical.css') ?>
    <?= $sb->launchScript() ?>
    <?= $sb->css('src/css/main.css') ?>
</head>
<body>
    <?= $sb->script('src/js/app.js') ?>
</body>
```

</details>

<details>
<summary><strong>Python</strong></summary>

```bash
pip install skybolt
# or: uv add skybolt
```

```python
from skybolt import Skybolt

sb = Skybolt("dist/.skybolt/render-map.json", cookies=request.cookies)
```

```html
<head>
    {{ sb.css("src/css/critical.css")|safe }}
    {{ sb.launch_script()|safe }}
    {{ sb.css("src/css/main.css")|safe }}
</head>
<body>
    {{ sb.script("src/js/app.js")|safe }}
</body>
```

</details>

<details>
<summary><strong>Ruby</strong></summary>

```ruby
# Gemfile
gem "skybolt"
```

```ruby
sb = Skybolt::Renderer.new(
  "public/dist/.skybolt/render-map.json",
  cookies: request.cookies
)
```

```erb
<head>
  <%= raw skybolt.css("src/css/critical.css") %>
  <%= raw skybolt.launch_script %>
  <%= raw skybolt.css("src/css/main.css") %>
</head>
<body>
  <%= raw skybolt.script("src/js/app.js") %>
</body>
```

</details>

<details>
<summary><strong>Go</strong></summary>

```bash
go get github.com/JensRoland/skybolt-go
```

```go
import skybolt "github.com/JensRoland/skybolt-go"

sb, err := skybolt.New("static/.skybolt/render-map.json", cookies, "")
```

```go
// In your template
sb.CSS("src/css/critical.css")
sb.LaunchScript()
sb.CSS("src/css/main.css")
sb.Script("src/js/app.js", true)
```

</details>

<details>
<summary><strong>Node.js / Bun</strong></summary>

```bash
npm install @skybolt/server-adapter
```

```javascript
import { Skybolt } from '@skybolt/server-adapter'

const skybolt = new Skybolt('./dist/.skybolt/render-map.json', req.cookies)
```

```javascript
// In your template
`<head>
  ${skybolt.css('src/css/critical.css')}
  ${skybolt.launchScript()}
  ${skybolt.css('src/css/main.css', { async: true })}
</head>
<body>
  ${skybolt.script('src/js/app.js')}
</body>`
```

</details>

### 3. Build and Run

```bash
npm run build
```

Then start your server:

```bash
# PHP
php -S localhost:8080 -t public

# Python (Django)
python manage.py runserver

# Ruby (Rails)
rails server

# Go
go run main.go

# Node.js
node server.js
```

### 4. Serve the Service Worker

Configure your web server to serve `/skybolt-sw.js` from `dist/skybolt-sw.js`.

## Packages

| Package                                                                               | Description                        | Install                                   |
| ------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| [@skybolt/vite-plugin](https://www.npmjs.com/package/@skybolt/vite-plugin)            | Vite plugin (generates render map) | `npm install @skybolt/vite-plugin`        |
| [@skybolt/server-adapter](https://www.npmjs.com/package/@skybolt/server-adapter) (JS) | Node.js/Bun adapter                | `npm install @skybolt/server-adapter`     |
| [skybolt (PHP)](https://packagist.org/packages/jensroland/skybolt)                    | PHP adapter                        | `composer require jensroland/skybolt`     |
| [skybolt (Python)](https://pypi.org/project/skybolt/)                                 | Python adapter                     | `pip install skybolt`                     |
| [skybolt (Ruby)](https://rubygems.org/gems/skybolt)                                   | Ruby adapter                       | `gem install skybolt`                     |
| [skybolt-go (Go)](https://pkg.go.dev/github.com/JensRoland/skybolt-go)                | Go adapter                         | `go get github.com/JensRoland/skybolt-go` |

## Examples

| Example                                                | Language | Framework |
| ------------------------------------------------------ | -------- | --------- |
| [node-express](examples/node-express/)                 | Node.js  | Express   |
| [php-vanilla](examples/php-vanilla/)                   | PHP      | -         |
| [php-portfolio-timber](examples/php-portfolio-timber/) | PHP      | -         |
| [php-laravel](examples/php-laravel/)                   | PHP      | Laravel   |
| [python-django](examples/python-django/)               | Python   | Django    |
| [ruby-rails](examples/ruby-rails/)                     | Ruby     | Rails     |
| [go-gin](examples/go-gin/)                             | Go       | Gin       |

## Chain Lightning

Chain Lightning is a companion library that solves the ES module "waterfall" problem - where the browser must fetch, parse, and discover imports sequentially before fetching dependencies.

```text
Without Chain Lightning:
component.js ─────────►
                       dependency-a.js ─────────►
                                                 shared-util.js ─────────►

With Chain Lightning:
component.js ─────────►
dependency-a.js ─────────►
shared-util.js ─────────►
```

This challenge is usually addressed with bundling, but bundling has its own performance drawbacks (cache invalidation, large payloads, etc), especially as applications grow in size and complexity.

In contrast, Chain Lightning analyzes your dependency graph at build time and generates import maps + modulepreload hints so the browser fetches all dependencies in parallel.

### Quick Example

```javascript
// vite.config.js
import { skybolt } from '@skybolt/vite-plugin'
import { chainLightning } from '@skybolt/chain-lightning/vite'

export default defineConfig({
  plugins: [
    skybolt(),
    chainLightning({
      components: ['search-component', 'counter-component']
    })
  ]
})
```

```javascript
// server.js
const sb = new Skybolt('./dist/.skybolt/render-map.json', req.cookies)
const cl = new ChainLightning('./dist/.chain-lightning/manifest.json', sb)

res.send(`
  <head>
    ${sb.css('src/css/main.css')}
    ${sb.launchScript()}
    ${cl.headScripts()}
  </head>
  <body>
    ${cl.component('search-component')}
    <search-component></search-component>
  </body>
`)
```

When integrated with Skybolt, chunk dependencies are cached via Service Worker for ~5ms response times on repeat visits.

See the [Chain Lightning README](packages/chain-lightning/README.md) for full documentation.

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    BUILD TIME (Vite)                        │
├─────────────────────────────────────────────────────────────┤
│  @skybolt/vite-plugin                                       │
│  • Reads Vite manifest                                      │
│  • Reads asset contents                                     │
│  • Generates render-map.json                                │
│  • Copies skybolt-sw.js                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
              dist/.skybolt/render-map.json
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    RUNTIME (Server)                         │
├─────────────────────────────────────────────────────────────┤
│  Server adapter (Node.js/PHP/Python/Ruby/Go/etc)            │
│  • Loads render-map.json                                    │
│  • Reads sb_assets cookie                                   │
│  • Returns inline or external tags                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER                                  │
├─────────────────────────────────────────────────────────────┤
│  skybolt-client.js (inlined)                                │
│  • Registers Service Worker                                 │
│  • Caches inlined assets                                    │
│  • Updates cookie with versions                             │
│                                                             │
│  skybolt-sw.js (Service Worker)                             │
│  • Intercepts asset requests                                │
│  • Serves from Cache API (~5ms)                             │
└─────────────────────────────────────────────────────────────┘
```

## API Reference

### Vite Plugin

```javascript
import { skybolt } from '@skybolt/vite-plugin'

skybolt({
  outDir: '.skybolt',        // Output directory for render-map.json
  swPath: '/skybolt-sw.js',  // URL path for Service Worker
  debug: false               // Enable debug logging
})
```

### Server Adapters

All adapters share the same API pattern:

| Method     | Node.js                  | PHP                         | Python                      | Ruby                     | Go                       |
| ---------- | ------------------------ | --------------------------- | --------------------------- | ------------------------ | ------------------------ |
| Render CSS | `sb.css(entry, {async})` | `$sb->css($entry, $async)`  | `sb.css(entry, async_load)` | `sb.css(entry, async:)`  | `sb.CSS(entry, async)`   |
| Render JS  | `sb.script(entry)`       | `$sb->script($entry)`       | `sb.script(entry)`          | `sb.script(entry)`       | `sb.Script(entry, true)` |
| Launcher   | `sb.launchScript()`      | `$sb->launchScript()`       | `sb.launch_script()`        | `sb.launch_script`       | `sb.LaunchScript()`      |
| Preload    | `sb.preload(entry, {})`  | `$sb->preload($entry, ...)` | `sb.preload(entry, ...)`    | `sb.preload(entry, ...)` | `sb.Preload(entry, ...)` |
| Get URL    | `sb.getAssetUrl(entry)`  | `$sb->getAssetUrl($entry)`  | `sb.get_asset_url(entry)`   | `sb.asset_url(entry)`    | `sb.GetAssetURL(entry)`  |

#### Async CSS Loading

The `async` parameter enables non-render-blocking CSS loading:

```javascript
// Node.js
sb.css('src/css/main.css', { async: true })
```

```php
// PHP
$sb->css('src/css/main.css', async: true);
```

```python
# Python
sb.css("src/css/main.css", async_load=True)
```

```ruby
# Ruby
sb.css("src/css/main.css", async: true)
```

```go
// Go
sb.CSS("src/css/main.css", true)
```

When `async` is enabled:

- **First visit:** Uses `media="print"` trick - CSS is parsed but not applied until `onload` swaps to `media="all"`
- **Repeat visit:** Uses `<link rel="preload">` with `onload` to apply styles non-blocking

This is ideal for non-critical CSS that shouldn't block initial render.

See each adapter's README for full API documentation.

## Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 11.1+

Requires Service Worker and Cache API. Falls back gracefully to standard external assets when unavailable.

## Debugging

Browser console:

```javascript
// Cache info
await skybolt.getCacheInfo()

// Clear cache (keeps SW)
await skybolt.clearCache()

// Full reset
await skybolt.selfDestruct(reload=true)
```

Query parameters:

- `?no-sw` - Disable Service Worker (for testing)

## Requirements

- **Build:** Vite 5.0+ or 6.0+
- **Server:** PHP 8.1+ / Python 3.9+ / Ruby 3.0+ / Go 1.21+
- **Browser:** Service Worker support

## License

MIT

## Credits

**Original Concept:** Jens Roland & Morten Olsen (2012-2013)

Inspired by performance research from Paul Irish (GMail mobile IIRC), Steve Souders, Addy Osmani, Stoyan Stefanov, and others.

The same approach was described in a [Filament Group 2017 blog post](https://www.filamentgroup.com/lab/inlining-cache.html) by Scott Jehl
