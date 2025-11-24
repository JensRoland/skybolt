<?php

declare(strict_types=1);

namespace Skybolt;

/**
 * Asset Endpoint
 *
 * Serves Skybolt's internal JavaScript assets (Service Worker and Client script).
 * Use this in public endpoints to serve assets from the vendor package.
 */
class AssetEndpoint
{
    /**
     * Serve the Service Worker file
     *
     * @param bool $exit Whether to exit after serving (default: true)
     * @return void
     */
    public static function serveServiceWorker(bool $exit = true): void
    {
        self::serveAsset('skybolt-sw.js', 'Service Worker', $exit, [
            'Service-Worker-Allowed' => '/',
        ], false); // SW should not use immutable cache
    }

    /**
     * Serve the Client script file
     *
     * @param bool $exit Whether to exit after serving (default: true)
     * @return void
     */
    public static function serveClient(bool $exit = true): void
    {
        self::serveAsset('skybolt-client.min.js', 'Client script', $exit);
    }

    /**
     * Internal method to serve an asset file
     *
     * @param string $filename Filename in the assets directory
     * @param string $description Human-readable description for error messages
     * @param bool $exit Whether to exit after serving
     * @param array<string, string> $extraHeaders Additional headers to send
     * @param bool $immutable Whether to use immutable cache (default: true)
     * @return void
     */
    private static function serveAsset(string $filename, string $description, bool $exit, array $extraHeaders = [], bool $immutable = true): void
    {
        $assetPath = __DIR__ . '/../assets/' . $filename;

        if (!file_exists($assetPath)) {
            http_response_code(404);
            header('Content-Type: text/plain');
            echo "Skybolt {$description} not found";
            if ($exit) {
                exit(1);
            }
            return;
        }

        // Get file modification time for caching
        $lastModified = filemtime($assetPath);
        $etag = md5_file($assetPath);

        // Check if client has cached version
        $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
        $ifModifiedSince = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? null;

        if ($ifNoneMatch === $etag || ($ifModifiedSince && strtotime($ifModifiedSince) >= $lastModified)) {
            http_response_code(304);
            if ($exit) {
                exit;
            }
            return;
        }

        // Serve the file with appropriate headers
        header('Content-Type: application/javascript; charset=utf-8');

        // Service Workers need shorter cache to enable updates
        // Client scripts can use long cache with versioned URLs
        if ($immutable) {
            header('Cache-Control: public, max-age=31536000, immutable'); // 1 year cache (versioned)
            header('ETag: ' . $etag);
        } else {
            header('Cache-Control: public, max-age=86400'); // 24 hours for SW (browser handles SW updates)
        }

        header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
        header('X-Skybolt-Version: ' . Skybolt::VERSION);

        // Add any extra headers (e.g., Service-Worker-Allowed)
        foreach ($extraHeaders as $name => $value) {
            header("{$name}: {$value}");
        }

        readfile($assetPath);

        if ($exit) {
            exit;
        }
    }
}
