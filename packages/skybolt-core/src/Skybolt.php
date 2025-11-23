<?php

declare(strict_types=1);

namespace Skybolt;

/**
 * Skybolt - High-performance asset management with intelligent caching
 *
 * Main facade class providing a simple API for asset rendering
 */
class Skybolt
{
    public const VERSION = '2.0.0';

    private Config $config;
    private ManifestReader $manifest;
    private CacheManager $cache;
    private AssetRenderer $renderer;

    /**
     * Create a new Skybolt instance
     *
     * @param string $manifestPath Absolute path to Vite manifest.json
     * @param string $basePath Base URL path for assets (e.g., '/assets/')
     * @param array $session Reference to session array (e.g., $_SESSION)
     * @param string|null $cdnUrl Optional CDN URL prefix
     * @param string|null $devServer Optional Vite dev server URL
     * @param bool $printComments Whether to print debug comments
     * @param int $inlineThreshold Max file size to inline (bytes)
     */
    public function __construct(
        string $manifestPath,
        string $basePath = '/assets/',
        array &$session = [],
        ?string $cdnUrl = null,
        ?string $devServer = null,
        bool $printComments = false,
        int $inlineThreshold = 14336,
    ) {
        $this->config = new Config(
            manifestPath: $manifestPath,
            basePath: $basePath,
            cdnUrl: $cdnUrl,
            devServer: $devServer,
            printComments: $printComments,
            inlineThreshold: $inlineThreshold,
        );

        $this->manifest = new ManifestReader($this->config);
        $this->cache = new CacheManager($session);
        $this->renderer = new AssetRenderer($this->config, $this->manifest, $this->cache, self::VERSION);

        // Request inventory update if needed
        if (!$this->cache->isInventoryRequested()) {
            $this->cache->requestInventory();
        }
    }

    /**
     * Render CSS with flexible loading options
     *
     * @param string $entry Source file path (e.g., 'src/main.css')
     * @param string|null $inline Control inlining: 'always' (critical CSS), 'never' (always external), null (auto)
     * @param bool $async Whether to load asynchronously (default: true)
     * @return string|self Returns HTML string, or $this for fluent API (deprecated)
     */
    public function css(string $entry, ?string $inline = null, bool $async = true): string|self
    {
        // Handle 'always' inline mode (critical CSS)
        if ($inline === 'always') {
            return $this->renderer->renderCriticalCSS($entry);
        }

        // Handle async CSS (default)
        if ($async) {
            return $this->renderer->renderAsyncCSS($entry, forceExternal: $inline === 'never');
        }

        // Blocking CSS (rare case)
        return $this->renderer->renderBlockingCSS($entry);
    }

    /**
     * Render JavaScript with flexible loading options
     *
     * @param string $entry Source file path (e.g., 'src/app.js')
     * @param bool $async Whether to load asynchronously (default: true)
     * @param bool $module Whether to load as ES module (default: true)
     * @return string|self Returns HTML string, or $this for fluent API (deprecated)
     */
    public function script(string $entry, bool $async = true, bool $module = true): string|self
    {
        if ($async) {
            return $this->renderer->renderAsyncScript($entry, isModule: $module);
        }

        // Blocking script
        return $this->renderer->renderBlockingScript($entry, isModule: $module);
    }

    /**
     * Generate preload link for critical resources
     *
     * @param string $entry Source file path or URL
     * @param string $as Resource type (image, font, style, script, etc.)
     * @param string|null $fetchpriority Priority hint: 'high', 'low', 'auto'
     * @param string|null $type MIME type (optional)
     */
    public function preload(string $entry, string $as, ?string $fetchpriority = null, ?string $type = null): string
    {
        return $this->renderer->renderPreload($entry, $as, $fetchpriority, $type);
    }

    /**
     * Render the Skybolt launcher script
     *
     * Call this once in the <head> before any other Skybolt assets
     */
    public function launchScript(): string
    {
        return $this->renderer->renderLaunchScript();
    }

    /**
     * Handle inventory update from client
     *
     * Call this from your inventory endpoint
     *
     * @param array<string, string>|null $versions Asset versions from client
     */
    public function handleInventoryUpdate(?array $versions = null): void
    {
        if ($versions === null) {
            // Try to get from POST body
            $input = file_get_contents('php://input');
            if ($input !== false && $input !== '') {
                try {
                    $versions = json_decode($input, true, 512, JSON_THROW_ON_ERROR);
                } catch (\JsonException) {
                    return;
                }
            }
        }

        if (is_array($versions)) {
            $this->cache->updateInventory($versions);
        }
    }

    /**
     * Get cache statistics
     */
    public function getCacheStats(): array
    {
        return $this->cache->getStats();
    }

    /**
     * Clear client cache (force re-download)
     */
    public function clearCache(): void
    {
        $this->cache->clear();
    }

    /**
     * Get the manifest reader (for advanced usage)
     */
    public function getManifest(): ManifestReader
    {
        return $this->manifest;
    }

    /**
     * Get the cache manager (for advanced usage)
     */
    public function getCache(): CacheManager
    {
        return $this->cache;
    }

    /**
     * Get the config (for advanced usage)
     */
    public function getConfig(): Config
    {
        return $this->config;
    }

    /**
     * Check if running in development mode
     */
    public function isDevelopment(): bool
    {
        return $this->config->isDevelopment();
    }

    /**
     * Get asset URL (for manual usage)
     */
    public function getAssetUrl(string $entry): ?string
    {
        return $this->manifest->getUrl($entry);
    }
}
