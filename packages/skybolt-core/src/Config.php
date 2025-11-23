<?php

declare(strict_types=1);

namespace Skybolt;

/**
 * Skybolt configuration with immutable properties
 *
 * Uses PHP 8.3 readonly properties for type-safe, immutable configuration
 */
readonly class Config
{
    /**
     * @param string $manifestPath Absolute path to Vite manifest.json
     * @param string $basePath Base URL path for assets (e.g., '/assets/')
     * @param string|null $cdnUrl Optional CDN URL prefix (e.g., 'https://cdn.example.com')
     * @param string|null $devServer Optional Vite dev server URL (e.g., 'http://localhost:5173')
     * @param bool $printComments Whether to print HTML comments for debugging
     * @param int $inlineThreshold Max file size (bytes) to inline (14KB default for HTTP/2)
     */
    public function __construct(
        public string $manifestPath,
        public string $basePath = '/assets/',
        public ?string $cdnUrl = null,
        public ?string $devServer = null,
        public bool $printComments = false,
        public int $inlineThreshold = 14336, // 14KB
    ) {
        if (!file_exists($this->manifestPath)) {
            throw new \InvalidArgumentException(
                "Manifest file not found: {$this->manifestPath}"
            );
        }
    }

    /**
     * Get the full asset URL (CDN or local)
     */
    public function getAssetUrl(string $path): string
    {
        // If dev server is running, use it
        if ($this->devServer !== null && $this->isDevServerRunning()) {
            return rtrim($this->devServer, '/') . '/' . ltrim($path, '/');
        }

        $base = $this->cdnUrl ?? $this->basePath;
        return rtrim($base, '/') . '/' . ltrim($path, '/');
    }

    /**
     * Check if Vite dev server is running
     */
    private function isDevServerRunning(): bool
    {
        if ($this->devServer === null) {
            return false;
        }

        // Simple check: try to connect to dev server
        // Cache the result for 5 seconds to avoid repeated checks
        static $cache = null;
        static $cacheTime = 0;

        if ($cache !== null && (time() - $cacheTime) < 5) {
            return $cache;
        }

        $ch = curl_init($this->devServer);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 1);
        curl_setopt($ch, CURLOPT_NOBODY, true);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $cache = $result !== false && $httpCode === 200;
        $cacheTime = time();

        return $cache;
    }

    /**
     * Check if we're in development mode
     */
    public function isDevelopment(): bool
    {
        return $this->devServer !== null && $this->isDevServerRunning();
    }
}
