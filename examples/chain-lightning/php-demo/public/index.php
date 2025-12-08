<?php
/**
 * Chain Lightning PHP Demo
 *
 * Demonstrates Chain Lightning + Skybolt working together in PHP.
 * - Skybolt handles CSS caching and the Chain Lightning client script
 * - Chain Lightning handles component dependency preloading
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Skybolt\Skybolt;
use ChainLightning\ChainLightning;

// Initialize Skybolt for CSS caching
$sb = new Skybolt(__DIR__ . '/../dist/.skybolt/render-map.json');

// Initialize Chain Lightning with User-Agent (for Firefox detection) and Skybolt
$cl = new ChainLightning(__DIR__ . '/../dist/.chain-lightning/manifest.json', $_SERVER['HTTP_USER_AGENT'] ?? '', $sb);

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chain Lightning PHP Demo</title>

  <!-- CSS via Skybolt (inlined on first visit, cached after) -->
  <?= $sb->css('src/css/main.css') ?>

  <!-- Skybolt client launcher (registers SW, caches inlined assets) -->
  <?= $sb->launchScript() ?>

  <!-- Chain Lightning (import map, manifest, and client script) -->
  <?= $cl->headScripts() ?>
</head>
<body>
  <h1>&#9889; Chain Lightning PHP Demo</h1>

  <p>This demo shows ES module components with parallel dependency preloading, powered by PHP.</p>

  <div class="demo-section">
    <h2>Search Component</h2>
    <!-- Chunk deps use data URL on first visit, actual URL on cached visits -->
    <?= $cl->component('search-component', inlineDeps: true) ?>
    <search-component></search-component>
  </div>

  <div class="demo-section">
    <h2>Counter Component</h2>
    <!-- Shares chunk:debounce with search-component (already rendered above) -->
    <?= $cl->component('counter-component') ?>
    <counter-component></counter-component>
  </div>

  <div class="dynamic-section">
    <h2>Dynamic Loading Test</h2>
    <p>Open DevTools Network tab, then click to dynamically load a component:</p>
    <button class="load-btn" onclick="testDynamicLoad('search-component')">
      Load Search (dynamic)
    </button>
    <button class="load-btn" onclick="testDynamicLoad('counter-component')">
      Load Counter (dynamic)
    </button>
    <div id="dynamic-container"></div>
    <div class="info-box">
      <strong>Note:</strong> When you click "Load" with an empty cache, watch the Network tab.
      Dependencies should load in parallel, not sequentially (waterfall).
    </div>
  </div>

  <script type="module">
    async function testDynamicLoad(componentName) {
      const container = document.getElementById('dynamic-container')
      container.innerHTML = '<p>Loading...</p>'

      try {
        console.log('[Demo] Starting dynamic import:', componentName)
        const start = performance.now()

        await window.chainLightning.import(componentName)

        const elapsed = (performance.now() - start).toFixed(2)
        console.log('[Demo] Loaded in', elapsed, 'ms')

        container.innerHTML = `
          <p>&#10003; Loaded <strong>${componentName}</strong> in ${elapsed}ms</p>
          <${componentName}></${componentName}>
        `
      } catch (err) {
        console.error('[Demo] Failed to load:', err)
        container.innerHTML = '<p>&#10007; Failed to load: ' + err.message + '</p>'
      }
    }

    // Expose for button onclick
    window.testDynamicLoad = testDynamicLoad
  </script>
</body>
</html>
