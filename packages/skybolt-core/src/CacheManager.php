<?php

declare(strict_types=1);

namespace Skybolt;

/**
 * Manages client-side cache inventory using cookies only
 *
 * Tracks which assets each client has cached in localStorage using a compact
 * cookie format. Supports multi-cookie spillover for large asset lists.
 */
class CacheManager
{
    private const COOKIE_NAME = 'sb_assets';
    private const COOKIE_COUNT = 'sb_assets_count';

    private array $inventory = [];

    public function __construct()
    {
        $this->loadInventory();
    }

    /**
     * Load inventory from cookies
     */
    private function loadInventory(): void
    {
        // Check if we have multiple cookies
        $count = isset($_COOKIE[self::COOKIE_COUNT])
            ? (int)$_COOKIE[self::COOKIE_COUNT]
            : 1;

        $data = '';

        // Collect data from all cookies
        for ($i = 1; $i <= $count; $i++) {
            $cookieName = $i === 1
                ? self::COOKIE_NAME
                : self::COOKIE_NAME . '_' . $i;

            if (isset($_COOKIE[$cookieName])) {
                $data .= $_COOKIE[$cookieName];
            }
        }

        if ($data === '') {
            return;
        }

        // Parse compact format: name:version,name2:version2
        $this->inventory = $this->parseCookieData($data);
    }

    /**
     * Parse cookie data from compact format
     *
     * @param string $data Compact cookie string
     * @return array<string, string> Asset name => version map
     */
    private function parseCookieData(string $data): array
    {
        $inventory = [];
        $pairs = explode(',', $data);

        foreach ($pairs as $pair) {
            $parts = explode(':', $pair, 2);
            if (count($parts) === 2) {
                [$name, $version] = $parts;
                $inventory[$name] = $version;
            }
        }

        return $inventory;
    }

    /**
     * Check if client has the latest version of an asset
     *
     * @param string $name Asset name/entry
     * @param string $version Current version hash
     */
    public function hasLatestVersion(string $name, string $version): bool
    {
        return isset($this->inventory[$name])
            && $this->inventory[$name] === $version;
    }

    /**
     * Clear inventory (force re-cache)
     *
     * Clears server-side inventory and deletes client cookies
     */
    public function clear(): void
    {
        $this->inventory = [];

        // Delete all cookies (main + overflow + count)
        setcookie(self::COOKIE_NAME, '', ['expires' => time() - 3600, 'path' => '/']);
        setcookie(self::COOKIE_COUNT, '', ['expires' => time() - 3600, 'path' => '/']);

        // Clean up potential overflow cookies
        for ($i = 2; $i <= 10; $i++) {
            $cookieName = self::COOKIE_NAME . '_' . $i;
            if (isset($_COOKIE[$cookieName])) {
                setcookie($cookieName, '', ['expires' => time() - 3600, 'path' => '/']);
            }
        }
    }

    /**
     * Get all cached asset names
     *
     * @return array<string>
     */
    public function getCachedAssets(): array
    {
        return array_keys($this->inventory);
    }

    /**
     * Get cache statistics
     */
    public function getStats(): array
    {
        return [
            'total_assets' => count($this->inventory),
            'assets' => $this->inventory,
        ];
    }
}
