<?php

declare(strict_types=1);

namespace ChainLightning;

use Skybolt\Skybolt;

/**
 * Chain Lightning - Parallel dependency loading for ES modules
 *
 * Generates import maps and modulepreload hints for ES module components.
 * Integrates with Skybolt for cache state tracking and asset caching.
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

    /** @var bool */
    private bool $manifestRendered = false;

    /** @var bool */
    private bool $clientRendered = false;

    /** @var array<string, bool> */
    private array $preloadedUrls = [];

    /** @var array<string, bool> */
    private array $renderedComponents = [];

    /** @var array<string, bool> */
    private array $handledChunks = [];

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
     * Render the manifest data script (sets window.__CL_MANIFEST__ and fires ready event)
     *
     * Uses Skybolt for caching if available. Always render-blocking to ensure
     * components have access to manifest data before executing.
     * Should be called in <head> after import map.
     *
     * @return string HTML script tag (inlined or external, never deferred)
     */
    public function manifestScript(): string
    {
        if ($this->manifestRendered) {
            trigger_error('Chain Lightning: Manifest script already rendered. Only call manifestScript() once.', E_USER_WARNING);
            return '';
        }
        $this->manifestRendered = true;

        // Check if manifest has the new format with manifestScript data
        $manifestData = $this->manifest['manifestScript'] ?? null;
        if ($manifestData === null) {
            // Fallback for old manifest format (no caching)
            $data = ['components' => $this->manifest['components']];
            $json = json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
            return '<script>window.__CL_MANIFEST__=' . $json . ';dispatchEvent(new Event(\'chain-lightning:ready\'))</script>';
        }

        $url = $manifestData['url'];
        $hash = $manifestData['hash'];
        $content = $manifestData['content'];
        $entryName = 'cl-manifest';

        // If Skybolt is available, use it for caching
        if ($this->skybolt !== null && method_exists($this->skybolt, 'hasCachedEntry')) {
            if ($this->skybolt->hasCachedEntry($entryName, $hash)) {
                // Client has it cached - external script (render-blocking, no defer/async)
                return '<script src="' . $this->esc($url) . '"></script>';
            }
            // First visit or hash mismatch - inline with Skybolt attributes for caching
            return '<script sb-asset="' . $this->esc($entryName . ':' . $hash) . '" sb-url="' . $this->esc($url) . '">' . $content . '</script>';
        }

        // No Skybolt - just inline the script
        return '<script>' . $content . '</script>';
    }

    /**
     * Render the client runtime script
     *
     * Uses Skybolt for caching if available.
     * Should be called in <head> after manifestScript().
     *
     * @return string HTML script tag (inlined or external)
     */
    public function clientScript(): string
    {
        if ($this->clientRendered) {
            trigger_error('Chain Lightning: Client script already rendered. Only call clientScript() once.', E_USER_WARNING);
            return '';
        }
        $this->clientRendered = true;

        $client = $this->manifest['client'];
        $url = $client['url'];
        $hash = $client['hash'];
        $content = $client['content'];
        $entryName = 'chain-lightning';

        // If Skybolt is available, use it for caching
        if ($this->skybolt !== null && method_exists($this->skybolt, 'hasCachedEntry')) {
            if ($this->skybolt->hasCachedEntry($entryName, $hash)) {
                // Client has it cached - external script
                return '<script type="module" src="' . $this->esc($url) . '"></script>';
            }
            // First visit - inline with Skybolt attributes for caching
            return '<script type="module" sb-asset="' . $this->esc($entryName . ':' . $hash) . '" sb-url="' . $this->esc($url) . '">' . $content . '</script>';
        }

        // No Skybolt - just inline the script
        return '<script type="module">' . $content . '</script>';
    }

    /**
     * Render all head scripts: import map, manifest, and client runtime
     *
     * Convenience method that combines importMap(), manifestScript(), and clientScript().
     * Should be called once in <head>.
     *
     * @return string HTML for all Chain Lightning head scripts
     */
    public function headScripts(): string
    {
        return implode("\n", [
            $this->importMap(),
            $this->manifestScript(),
            $this->clientScript(),
        ]);
    }

    /**
     * Check if a chunk is cached (via Skybolt)
     *
     * @param string $specifier Chunk specifier (e.g., "chunk:debounce")
     * @param string $hash Content hash
     * @return bool
     */
    private function isChunkCached(string $specifier, string $hash): bool
    {
        if ($this->skybolt === null) {
            return false;
        }
        // Use hasCachedEntry since chunks are not in Skybolt's render-map
        // but are tracked in the sb_digest cookie with their specifier as the entry name
        if (method_exists($this->skybolt, 'hasCachedEntry')) {
            return $this->skybolt->hasCachedEntry($specifier, $hash);
        }
        return false;
    }

    /**
     * Get chunk info by specifier
     *
     * @param string $specifier e.g., "chunk:debounce"
     * @return array<string, mixed>|null
     */
    private function getChunk(string $specifier): ?array
    {
        return $this->manifest['chunks'][$specifier] ?? null;
    }

    /**
     * Render an importmap for a chunk specifier
     *
     * Since chunks are not in the static import map, we always need to provide
     * a mapping so the browser can resolve the import.
     *
     * @param string $specifier Chunk specifier (e.g., "chunk:debounce")
     * @param array<string, mixed> $chunk Chunk info from manifest
     * @param bool $isCached Whether the chunk is already cached
     * @param bool $inline Whether to use data URL for inlining (first visit optimization)
     * @return string HTML importmap script tag
     */
    private function renderChunkImportMap(string $specifier, array $chunk, bool $isCached, bool $inline): string
    {
        // Use data URL only if inlining is requested AND chunk is not cached
        $useDataUrl = $inline && !$isCached;

        $importMap = [
            'imports' => [
                $specifier => $useDataUrl ? $chunk['dataUrl'] : $chunk['url'],
            ],
        ];

        $json = json_encode($importMap, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);

        if ($useDataUrl) {
            // Inlined - use data URL and add sb-asset/sb-url for Skybolt caching
            return '<script type="importmap" sb-asset="' . $this->esc($specifier . ':' . $chunk['hash']) . '" sb-url="' . $this->esc($chunk['url']) . '">' . $json . '</script>';
        }

        // Not inlined or cached - just need the mapping to the actual URL
        return '<script type="importmap">' . $json . '</script>';
    }

    /**
     * Render a component with its chunk dependencies
     *
     * Uses Skybolt for caching the component itself.
     * Safe to call multiple times - subsequent calls return empty string.
     *
     * Chunk dependencies are rendered via override importmaps + modulepreload:
     * - Importmap provides URL mapping (actual URL or data URL if inlineDeps: true)
     * - Modulepreload always included to trigger early fetch/parse/compile
     *
     * @param string $componentName Name of the component
     * @param bool $inlineDeps Inline chunk deps via data URLs (first visit optimization)
     * @return string HTML for chunk importmaps, preloads, and component script tag (empty if already rendered)
     */
    public function component(string $componentName, bool $inlineDeps = false): string
    {
        $component = $this->manifest['components'][$componentName] ?? null;
        if ($component === null) {
            trigger_error("Chain Lightning: Component \"{$componentName}\" not found in manifest", E_USER_WARNING);
            return '';
        }

        // Skip if already rendered - ES modules must only be included once
        if (isset($this->renderedComponents[$componentName])) {
            return '';
        }
        $this->renderedComponents[$componentName] = true;

        $importMaps = [];
        $preloads = [];

        // Handle chunk dependencies - since chunks are excluded from the static
        // import map, we ALWAYS need to provide an importmap for each chunk
        foreach ($component['deps'] as $depSpecifier) {
            // Skip if already handled
            if (isset($this->handledChunks[$depSpecifier])) {
                continue;
            }

            $chunk = $this->getChunk($depSpecifier);
            if ($chunk === null) {
                continue; // Not a chunk (external dep in static import map)
            }

            $isCached = $this->isChunkCached($depSpecifier, $chunk['hash']);

            // Always output importmap for chunks (they're not in static import map)
            $useDataUrl = $inlineDeps && !$isCached;
            $importMaps[] = $this->renderChunkImportMap($depSpecifier, $chunk, $isCached, $inlineDeps);

            // Add modulepreload only when NOT inlining via data URL
            // When inlined, the data URL in the import map already contains the content,
            // so a modulepreload would be redundant.
            if (!$useDataUrl && !isset($this->preloadedUrls[$depSpecifier])) {
                $preloads[] = '<link rel="modulepreload" href="' . $this->esc($chunk['url']) . '">';
                $this->preloadedUrls[$depSpecifier] = true;
            }

            $this->handledChunks[$depSpecifier] = true;
        }

        // Combine: importmaps first, then preloads
        $parts = array_merge($importMaps, $preloads);

        // Add the script tag - use Skybolt caching if available
        if ($this->skybolt !== null && method_exists($this->skybolt, 'script')) {
            // Use Skybolt's script method for proper caching
            $parts[] = $this->skybolt->script($component['src']);
        } else {
            // No Skybolt - just add external script tag
            $parts[] = '<script type="module" src="' . $this->esc($component['url']) . '"></script>';
        }

        return implode("\n", $parts);
    }

    /**
     * Get early hints for components (for HTTP 103)
     *
     * Call this before response body starts.
     * Note: Early Hints use actual URLs (not specifiers) since they're sent
     * as HTTP headers before the import map is available.
     *
     * @param string[] $componentNames Components that will be on the page
     * @return array<array{rel: string, href: string, as: string}> Link header entries
     */
    public function getEarlyHints(array $componentNames): array
    {
        $hints = [];

        foreach ($componentNames as $componentName) {
            $component = $this->manifest['components'][$componentName] ?? null;
            if ($component === null) {
                continue;
            }

            foreach ($component['deps'] as $depSpecifier) {
                $chunk = $this->getChunk($depSpecifier);
                if ($chunk === null) {
                    continue;
                }

                if (!$this->isChunkCached($depSpecifier, $chunk['hash']) && !isset($this->preloadedUrls[$depSpecifier])) {
                    $hints[] = ['rel' => 'preload', 'href' => $chunk['url'], 'as' => 'script'];
                    $this->preloadedUrls[$depSpecifier] = true;
                }
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
