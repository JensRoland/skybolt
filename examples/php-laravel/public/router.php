<?php
/**
 * Development Server Router for Laravel
 *
 * Handles routing for the built-in PHP development server.
 * Usage: php -S localhost:8080 -t public public/router.php
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Serve Service Worker from build directory (handles both /skybolt-sw.js and /build/skybolt-sw.js)
if ($uri === '/skybolt-sw.js' || $uri === '/build/skybolt-sw.js') {
    $swPath = __DIR__ . '/build/skybolt-sw.js';
    if (file_exists($swPath)) {
        header('Content-Type: application/javascript');
        header('Service-Worker-Allowed: /');
        header('Cache-Control: public, max-age=86400');
        readfile($swPath);
        exit;
    }
    http_response_code(404);
    echo 'Service Worker not found. Run `npm run build` first.';
    exit;
}

// Serve built assets from build directory
if (preg_match('#^/build/(assets/.+|\.vite/.+)$#', $uri)) {
    $filePath = __DIR__ . $uri;
    if (file_exists($filePath)) {
        // Determine content type
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        $contentTypes = [
            'js' => 'application/javascript',
            'mjs' => 'application/javascript',
            'css' => 'text/css',
            'json' => 'application/json',
            'map' => 'application/json',
        ];
        $contentType = $contentTypes[$ext] ?? 'application/octet-stream';

        header('Content-Type: ' . $contentType);
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($filePath);
        exit;
    }
    http_response_code(404);
    echo 'Asset not found';
    exit;
}

// Serve static files from public directory
$staticFile = __DIR__ . $uri;
if ($uri !== '/' && file_exists($staticFile) && is_file($staticFile)) {
    return false; // Let PHP's built-in server handle it
}

// Default to index.php (Laravel)
require __DIR__ . '/index.php';
