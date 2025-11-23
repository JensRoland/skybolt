<?php

declare(strict_types=1);

namespace Skybolt;

/**
 * Reads and parses Vite manifest.json files
 *
 * The Vite manifest maps source file paths to their compiled, versioned outputs:
 * {
 *   "src/main.js": {
 *     "file": "assets/main-a1b2c3d4.js",
 *     "css": ["assets/main-e5f6g7h8.css"],
 *     "imports": ["src/vendor.js"]
 *   }
 * }
 */
class ManifestReader
{
    private array $manifest;
    private array $cache = [];

    public function __construct(
        private readonly Config $config
    ) {
        $this->loadManifest();
    }

    /**
     * Load and parse the manifest file
     */
    private function loadManifest(): void
    {
        $content = file_get_contents($this->config->manifestPath);

        if ($content === false) {
            throw new \RuntimeException(
                "Failed to read manifest file: {$this->config->manifestPath}"
            );
        }

        $this->manifest = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
    }

    /**
     * Get asset entry by source path
     *
     * @param string $entry Source file path (e.g., 'src/main.js')
     * @return array|null Asset entry or null if not found
     */
    public function getEntry(string $entry): ?array
    {
        return $this->manifest[$entry] ?? null;
    }

    /**
     * Get the compiled file path for an entry
     *
     * @param string $entry Source file path
     * @return string|null Compiled file path or null if not found
     */
    public function getFile(string $entry): ?string
    {
        return $this->manifest[$entry]['file'] ?? null;
    }

    /**
     * Get full URL for an asset entry
     *
     * @param string $entry Source file path
     * @return string|null Full URL or null if not found
     */
    public function getUrl(string $entry): ?string
    {
        $file = $this->getFile($entry);

        if ($file === null) {
            return null;
        }

        return $this->config->getAssetUrl($file);
    }

    /**
     * Get associated CSS files for a JS entry
     *
     * @param string $entry Source file path
     * @return array<string> Array of CSS file URLs
     */
    public function getCss(string $entry): array
    {
        $cssFiles = $this->manifest[$entry]['css'] ?? [];

        return array_map(
            fn(string $file) => $this->config->getAssetUrl($file),
            $cssFiles
        );
    }

    /**
     * Get imports/dependencies for an entry
     *
     * @param string $entry Source file path
     * @return array<string> Array of import entry paths
     */
    public function getImports(string $entry): array
    {
        return $this->manifest[$entry]['imports'] ?? [];
    }

    /**
     * Get version hash for an asset (extracted from filename)
     *
     * Vite generates files like: main-a1b2c3d4.js
     * This extracts the hash: a1b2c3d4
     *
     * @param string $entry Source file path
     * @return string|null Version hash or null if not found
     */
    public function getVersion(string $entry): ?string
    {
        if (isset($this->cache['version'][$entry])) {
            return $this->cache['version'][$entry];
        }

        $file = $this->getFile($entry);

        if ($file === null) {
            return null;
        }

        // Extract hash from filename: assets/main-D_DnpHir.js -> D_DnpHir
        // Vite uses base64-like hashes with letters, numbers, underscores, hyphens
        if (preg_match('/-([A-Za-z0-9_-]{8,})\./', $file, $matches)) {
            $version = $matches[1];
            $this->cache['version'][$entry] = $version;
            return $version;
        }

        return null;
    }

    /**
     * Get asset content (for inlining)
     *
     * @param string $entry Source file path
     * @return string|null File contents or null if not found
     */
    public function getContent(string $entry): ?string
    {
        $file = $this->getFile($entry);

        if ($file === null) {
            return null;
        }

        // In dev mode, don't inline - use dev server
        if ($this->config->isDevelopment()) {
            return null;
        }

        // Construct absolute path to the compiled file
        $manifestDir = dirname($this->config->manifestPath);
        $absolutePath = $manifestDir . '/../' . $file;

        if (!file_exists($absolutePath)) {
            throw new \RuntimeException("Asset file not found: {$absolutePath}");
        }

        return file_get_contents($absolutePath);
    }

    /**
     * Check if asset exists in manifest
     */
    public function hasEntry(string $entry): bool
    {
        return isset($this->manifest[$entry]);
    }

    /**
     * Get all entries in the manifest
     *
     * @return array<string> Array of entry paths
     */
    public function getAllEntries(): array
    {
        return array_keys($this->manifest);
    }

    /**
     * Reload the manifest (useful in development)
     */
    public function reload(): void
    {
        $this->loadManifest();
        $this->cache = [];
    }
}
