<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skybolt Laravel Example</title>

    
    <?php echo \App\Providers\AppServiceProvider::css('resources/css/critical.css'); ?>

    
    <?php echo \App\Providers\AppServiceProvider::launchScript(); ?>

    
    <?php echo \App\Providers\AppServiceProvider::css('resources/css/app.css'); ?>
</head>
<body>
    <div class="container">
        <header>
            <h1>Skybolt <span class="badge">Laravel</span></h1>
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
                    <h3>Laravel Integration</h3>
                    <p>Simple Blade directives let you use Skybolt with any Laravel project. Just a few lines of code.</p>
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
                Skybolt v@skyboltVersion |
                <a href="https://github.com/JensRoland/skybolt">GitHub</a>
            </p>
        </footer>
    </div>

    
    <?php echo \App\Providers\AppServiceProvider::script('resources/js/app.js'); ?>
</body>
</html>
<?php /**PATH /Users/jensr/Documents/Code/git-repositories/skybolt/examples/php-laravel/resources/views/welcome.blade.php ENDPATH**/ ?>