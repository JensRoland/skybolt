<?php
/**
 * PHP Development Server Router
 *
 * Handles routing for the built-in PHP development server.
 * Usage: php -S localhost:8080 router.php
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Serve Service Worker from dist
if ($uri === '/skybolt-sw.js') {
    $swPath = __DIR__ . '/../dist/skybolt-sw.js';
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

// Serve built assets from dist
if (preg_match('#^/(assets/.+|\.vite/.+)$#', $uri)) {
    $filePath = __DIR__ . '/../dist' . $uri;
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

// Default to index.php
require __DIR__ . '/index.php';
