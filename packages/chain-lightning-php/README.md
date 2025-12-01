# Chain Lightning PHP

PHP server adapter for [Chain Lightning](https://github.com/jensroland/skybolt/tree/main/packages/chain-lightning) - cache-efficient parallel dependency loading for ES modules.

## Installation

```bash
composer require jensroland/chain-lightning
```

## Quick Start

```php
<?php
use ChainLightning\ChainLightning;

$cl = new ChainLightning('./dist/.chain-lightning/manifest.json');
?>
<!DOCTYPE html>
<html>
<head>
  <?= $cl->headScripts() ?>
</head>
<body>
  <?= $cl->component('search-component') ?>
  <search-component></search-component>
</body>
</html>
```

## Integration with Skybolt

Chain Lightning works best with [Skybolt](https://github.com/jensroland/skybolt) for optimal caching:

```php
<?php
use Skybolt\Skybolt;
use ChainLightning\ChainLightning;

// Skybolt handles CSS and Service Worker caching
$sb = new Skybolt('./dist/.skybolt/render-map.json');

// Chain Lightning uses Skybolt for cache-aware decisions
$cl = new ChainLightning('./dist/.chain-lightning/manifest.json', $sb);
?>
<!DOCTYPE html>
<html>
<head>
  <?= $sb->css('src/css/main.css') ?>
  <?= $sb->launchScript() ?>
  <?= $cl->headScripts() ?>
</head>
<body>
  <?= $cl->component('search-component', inlineDeps: true) ?>
  <search-component></search-component>
</body>
</html>
```

When integrated with Skybolt:

- First visit: Chunk dependencies are inlined via data URLs
- Repeat visits: Dependencies are loaded from Service Worker cache (~5ms)

## API Reference

```php
use ChainLightning\ChainLightning;

$cl = new ChainLightning($manifestPath, $skyboltInstance = null);

// Convenience method - renders all head scripts
$cl->headScripts();

// Individual head scripts (if you need more control)
$cl->importMap();        // Render <script type="importmap">
$cl->manifestScript();   // Render manifest data script
$cl->clientScript();     // Render client runtime script

// Render component with preloads
$cl->component('name');
$cl->component('name', inlineDeps: true);  // Inline chunk deps on first visit

// Utility methods
$cl->getComponentUrl('name');       // Get component URL
$cl->getModuleUrl('specifier');     // Get module URL from import map
$cl->getManifest();                 // Get raw manifest data

// HTTP 103 Early Hints
$hints = $cl->getEarlyHints(['comp1', 'comp2']);
foreach ($hints as $hint) {
    header("Link: <{$hint['href']}>; rel={$hint['rel']}; as={$hint['as']}", false);
}
```

## Requirements

- PHP 8.1+
- Vite build with `@skybolt/chain-lightning` plugin

## Vite Configuration

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
      components: ['search-component', 'counter-component']
    })
  ]
})
```

## How It Works

See the main [Chain Lightning documentation](https://github.com/jensroland/skybolt/tree/main/packages/chain-lightning) for details on:

- The waterfall problem Chain Lightning solves
- Build-time dependency analysis
- Import map generation
- Versioning strategy

## License

MIT
