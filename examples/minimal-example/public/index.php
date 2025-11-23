<?php

/**
 * Timber + Vite + Skybolt v2 Example
 *
 * This demonstrates how to integrate Skybolt with a Vite build
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Skybolt\Skybolt;

// Start session for cache tracking
session_start();

// Create Skybolt instance
$skybolt = new Skybolt(
    manifestPath: __DIR__ . '/../dist/.vite/manifest.json',
    basePath: '/', // Vite outputs to dist/assets/, so we just need root
    session: $_SESSION,
    cdnUrl: null, // Set to CDN URL in production
    devServer: null, // Vite dev server (set to http://localhost:5173 for HMR)
    printComments: true, // Enable debug comments
);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="High-performance web template powered by Skybolt v2 and Vite">
    <title>Timber - Skybolt v2 + Vite Demo</title>

    <?php // Critical CSS - inlined for immediate First Contentful Paint ?>
    <?= $skybolt->css('src/css/critical.css', inline: 'always') ?>

    <?php // Skybolt launcher - must be called once in <head> ?>
    <?= $skybolt->launchScript() ?>

    <?php // Main CSS - loaded asynchronously (localStorage or CDN) ?>
    <?= $skybolt->css('src/css/main.css') ?>
</head>
<body>
    <header>
        <div class="container">
            <h1>Timber v2.0</h1>
            <p>Powered by Skybolt + Vite</p>
        </div>
    </header>

    <div class="hero">
        <div class="container">
            <h2>Lightning-Fast Asset Loading</h2>
            <p>Experience the power of localStorage caching with server-side coordination</p>
        </div>
    </div>

    <nav>
        <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#performance">Performance</a></li>
            <li><a href="#tech">Tech Stack</a></li>
        </ul>
    </nav>

    <section id="features">
        <div class="container">
            <h2>Features</h2>
            <div class="card-grid">
                <div class="card">
                    <h3>🚀 Blazing Fast</h3>
                    <p>Assets load in under 50ms on repeat visits thanks to localStorage caching</p>
                </div>
                <div class="card">
                    <h3>🎯 Smart Caching</h3>
                    <p>Server tracks what each client has cached, optimizing every request</p>
                </div>
                <div class="card">
                    <h3>⚡ Critical CSS</h3>
                    <p>Above-the-fold styles inlined for instant First Contentful Paint</p>
                </div>
                <div class="card">
                    <h3>🔄 Auto Invalidation</h3>
                    <p>Version-based cache busting ensures clients always get the latest code</p>
                </div>
                <div class="card">
                    <h3>📦 Vite Integration</h3>
                    <p>Modern build tooling with tree-shaking, code splitting, and more</p>
                </div>
                <div class="card">
                    <h3>🌐 CDN Ready</h3>
                    <p>Built-in CDN support for global asset delivery</p>
                </div>
            </div>
        </div>
    </section>

    <section id="performance">
        <div class="container">
            <h2>Performance Metrics</h2>
            <div class="card-grid">
                <div class="card">
                    <h3>First Visit</h3>
                    <p><strong>~500ms</strong> CSS/JS load time</p>
                    <p>Assets inlined for immediate availability</p>
                </div>
                <div class="card">
                    <h3>Return Visit</h3>
                    <p><strong>&lt;50ms</strong> CSS/JS load time</p>
                    <p>90% faster from localStorage</p>
                </div>
                <div class="card">
                    <h3>Transfer Size</h3>
                    <p><strong>92% reduction</strong> on repeat visits</p>
                    <p>From ~540KB to ~42KB</p>
                </div>
            </div>
            <p style="text-align: center; margin-top: 2rem; font-size: 1.1rem;">
                <strong id="cache-stats">Loading cache stats...</strong>
            </p>
        </div>
    </section>

    <section id="tech">
        <div class="container">
            <h2>Tech Stack</h2>
            <div class="card-grid">
                <div class="card">
                    <h3>PHP 8.3</h3>
                    <p>Modern PHP with typed properties, readonly classes, and enums</p>
                </div>
                <div class="card">
                    <h3>Vite 5</h3>
                    <p>Lightning-fast build tool with esbuild and Rollup</p>
                </div>
                <div class="card">
                    <h3>ES Modules</h3>
                    <p>Modern JavaScript with tree-shaking and code splitting</p>
                </div>
                <div class="card">
                    <h3>Lightning CSS</h3>
                    <p>Rust-based CSS minifier for optimal compression</p>
                </div>
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <p>&copy; <?= date('Y') ?> Timber Template - Powered by Skybolt v2</p>
            <p>Open the browser console to see performance metrics</p>
        </div>
    </footer>

    <?php // Main JavaScript - loaded asynchronously ?>
    <?= $skybolt->script('src/js/app.js') ?>
</body>
</html>
