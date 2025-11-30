<?php

declare(strict_types=1);

namespace ChainLightning;

use Skybolt\Skybolt;

/**
 * Chain Lightning - Parallel dependency loading for ES modules
 *
 * Generates import maps and modulepreload hints for ES module components.
 * Integrates with Skybolt for cache state tracking.
 *
 * @package ChainLightning
 * @version 0.1.0
 */
class ChainLightning
{
    public const VERSION = '0.1.0';

    /** @var array<string, mixed> */
    private array $manifest;

    /** @var Skybolt|null */
    private ?Skybolt $skybolt;

    /** @var bool */
    private bool $importMapRendered = false;

    /** @var array<string, bool> */
    private array $preloadedUrls = [];

    /**
     * Create a new Chain Lightning instance
     *
     * @param string $manifestPath Path to Chain Lightning manifest.json
     * @param Skybolt|null $skybolt Optional Skybolt instance for cache state
     *
     * @throws \RuntimeException If manifest cannot be read
     * @throws \JsonException If manifest contains invalid JSON
     */
    public function __construct(string $manifestPath, ?Skybolt $skybolt = null)
    {
        $json = @file_get_contents($manifestPath);

        if ($json === false) {
            throw new \RuntimeException("Cannot read Chain Lightning manifest: {$manifestPath}");
        }

        $this->manifest = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        $this->skybolt = $skybolt;
    }

    /**
     * Render the global import map script tag
     *
     * Should be called once in <head> before any module scripts.
     *
     * @return string HTML script tag with import map
     */
    public function importMap(): string
    {
        if ($this->importMapRendered) {
            trigger_error('Chain Lightning: Import map already rendered. Only call importMap() once.', E_USER_WARNING);
            return '';
        }
        $this->importMapRendered = true;

        $json = json_encode($this->manifest['importMap'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        return '<script type="importmap">' . $json . '</script>';
    }

    /**
     * Render the client runtime script
     *
     * Should be called in <head> after import map.
     *
     * @return string HTML script tag with client runtime
     */
    public function clientScript(): string
    {
        $manifestData = [
            'components' => $this->manifest['components'],
            'importMap' => $this->manifest['importMap'],
        ];
        $manifestJson = json_encode($manifestData, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);

        // Inject manifest into client script
        $script = str_replace('__CHAIN_LIGHTNING_MANIFEST__', $manifestJson, $this->manifest['client']['script']);

        return '<script type="module">' . $script . '</script>';
    }

    /**
     * Check if a URL is cached (via Skybolt)
     */
    private function isCached(string $url): bool
    {
        if ($this->skybolt === null) {
            return false;
        }

        // Use Skybolt's isCachedUrl method if available
        if (method_exists($this->skybolt, 'isCachedUrl')) {
            return $this->skybolt->isCachedUrl($url);
        }

        return false;
    }

    /**
     * Get modulepreload hints for a component's dependencies
     *
     * @return string[] Array of URLs that need preloading
     */
    private function getPreloadUrls(string $componentName): array
    {
        $component = $this->manifest['components'][$componentName] ?? null;
        if ($component === null) {
            return [];
        }

        $urls = [];

        // Only preload dependencies, not the component itself
        // (the component is loaded immediately by the script tag)
        foreach ($component['deps'] as $depUrl) {
            if (!$this->isCached($depUrl) && !isset($this->preloadedUrls[$depUrl])) {
                $urls[] = $depUrl;
            }
        }

        return $urls;
    }

    /**
     * Render a component with modulepreload hints
     *
     * @param string $componentName Name of the component
     * @param bool $preload Include modulepreload hints (default: true)
     * @param bool $defer Use defer instead of module type (default: false)
     * @return string HTML for preload hints and script tag
     */
    public function component(string $componentName, bool $preload = true, bool $defer = false): string
    {
        $component = $this->manifest['components'][$componentName] ?? null;
        if ($component === null) {
            trigger_error("Chain Lightning: Component \"{$componentName}\" not found in manifest", E_USER_WARNING);
            return '';
        }

        $parts = [];

        // Add modulepreload hints for uncached dependencies
        if ($preload) {
            $preloadUrls = $this->getPreloadUrls($componentName);
            foreach ($preloadUrls as $url) {
                $parts[] = '<link rel="modulepreload" href="' . $this->esc($url) . '">';
                $this->preloadedUrls[$url] = true; // Track to avoid duplicates
            }
        }

        // Add the script tag
        $typeAttr = $defer ? '' : ' type="module"';
        $deferAttr = $defer ? ' defer' : '';
        $parts[] = '<script' . $typeAttr . $deferAttr . ' src="' . $this->esc($component['url']) . '"></script>';

        return implode("\n", $parts);
    }

    /**
     * Get early hints for components (for HTTP 103)
     *
     * Call this before response body starts.
     *
     * @param string[] $componentNames Components that will be on the page
     * @return array<array{rel: string, href: string, as: string}> Link header entries
     */
    public function getEarlyHints(array $componentNames): array
    {
        $hints = [];

        foreach ($componentNames as $componentName) {
            $preloadUrls = $this->getPreloadUrls($componentName);
            foreach ($preloadUrls as $url) {
                $hints[] = ['rel' => 'preload', 'href' => $url, 'as' => 'script'];
                $this->preloadedUrls[$url] = true;
            }
        }

        return $hints;
    }

    /**
     * Get the URL for a component (for manual use)
     */
    public function getComponentUrl(string $componentName): ?string
    {
        return $this->manifest['components'][$componentName]['url'] ?? null;
    }

    /**
     * Get the URL for a module specifier (for manual use)
     *
     * @param string $specifier e.g., "lodash-es@4"
     */
    public function getModuleUrl(string $specifier): ?string
    {
        return $this->manifest['importMap']['imports'][$specifier] ?? null;
    }

    /**
     * Get the raw manifest data
     *
     * @return array<string, mixed>
     */
    public function getManifest(): array
    {
        return $this->manifest;
    }

    /**
     * HTML-escape a string
     */
    private function esc(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}
