<?php
/**
 * Skybolt Minimal Example
 *
 * Demonstrates basic Skybolt usage with PHP
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Skybolt\Skybolt;

// Initialize Skybolt with the render map
$sb = new Skybolt(__DIR__ . '/../dist/.skybolt/render-map.json');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skybolt Minimal Example</title>

    <?php // Critical CSS - inlined on first visit, cached thereafter ?> 
    <?= $sb->css('src/css/critical.css') ?>

    <?php // Skybolt client launcher - must be in <head> ?> 
    <?= $sb->launchScript() ?>

    <?php // Main CSS - loaded async, cached by Service Worker ?> 
    <?= $sb->css('src/css/main.css') ?> 
</head>
<body>
    <div class="container">
        <header>
            <h1>Skybolt <span class="badge">PHP</span></h1>
            <p class="tagline">High-performance asset caching for multi-page applications</p>
        </header>

        <main>
            <div class="feature-grid">
                <div class="feature">
                    <h3>Zero HTTP Requests</h3>
                    <p>On repeat visits, assets are served from the Service Worker cache in ~5ms. No network requests needed.</p>
                </div>
                <div class="feature">
                    <h3>Automatic Invalidation</h3>
                    <p>When you rebuild, Vite generates new hashes. Skybolt detects the change and updates the cache.</p>
                </div>
                <div class="feature">
                    <h3>Multi-Language Support</h3>
                    <p>Vite plugin generates a render map. Simple adapters available for PHP, Ruby, Python, and more.</p>
                </div>
            </div>

            <div class="demo-section">
                <h2>Cache Status</h2>
                <div id="cache-status" class="cache-status">
                    Loading...
                </div>
                <div style="margin-top: 1rem;">
                    <button id="refresh-status">Refresh Status</button>
                    <button id="clear-cache">Clear Cache</button>
                    <button id="self-destruct" class="danger">Self-Destruct</button>
                </div>
            </div>

            <div class="demo-section">
                <h2>How to Test</h2>
                <ol>
                    <li><strong>First visit:</strong> Open DevTools Network tab. You'll see assets inlined in the HTML.</li>
                    <li><strong>Refresh:</strong> Network tab shows no requests for CSS/JS. Service Worker serves from cache.</li>
                    <li><strong>Rebuild:</strong> Run <code>npm run build</code>, refresh. New assets are cached automatically.</li>
                </ol>
            </div>
        </main>

        <footer>
            <p>
                Skybolt v<?= Skybolt::VERSION ?> |
                <a href="https://github.com/JensRoland/skybolt">GitHub</a>
            </p>
        </footer>
    </div>

    <?php // Application JavaScript - loaded async as ES module ?> 
    <?= $sb->script('src/js/app.js') ?> 
</body>
</html>
