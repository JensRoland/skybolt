<?php

declare(strict_types=1);

namespace Skybolt;

/**
 * Manages client-side cache inventory using sessions and cookies
 *
 * Tracks which assets each client has cached in localStorage, enabling
 * the server to send only meta tags for cached assets instead of inlining them again.
 */
class CacheManager
{
    private const COOKIE_NAME = 'sb_assets';
    private const SESSION_KEY = 'skybolt_inventory';
    private const INVENTORY_COOKIE = 'sb_inventory';

    private array $inventory = [];

    public function __construct(
        private array &$session
    ) {
        $this->loadInventory();
    }

    /**
     * Load inventory from session and cookies
     */
    private function loadInventory(): void
    {
        // Load from session if available
        if (isset($this->session[self::SESSION_KEY])) {
            $this->inventory = $this->session[self::SESSION_KEY];
            return;
        }

        // Otherwise, try to load from cookie
        if (isset($_COOKIE[self::COOKIE_NAME])) {
            try {
                $this->inventory = json_decode(
                    $_COOKIE[self::COOKIE_NAME],
                    true,
                    512,
                    JSON_THROW_ON_ERROR
                );
                $this->saveInventory();
            } catch (\JsonException) {
                $this->inventory = [];
            }
        }
    }

    /**
     * Save inventory to session
     */
    private function saveInventory(): void
    {
        $this->session[self::SESSION_KEY] = $this->inventory;
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
     * Update inventory with asset versions from client
     *
     * Called when client reports its cache inventory
     *
     * @param array<string, string> $versions Map of asset names to version hashes
     */
    public function updateInventory(array $versions): void
    {
        $this->inventory = array_merge($this->inventory, $versions);
        $this->saveInventory();
    }

    /**
     * Mark that we need an inventory report from the client
     *
     * Sets a cookie that the client-side script will detect
     */
    public function requestInventory(): void
    {
        setcookie(
            self::INVENTORY_COOKIE,
            '1',
            [
                'expires' => 0, // Session cookie
                'path' => '/',
                'secure' => isset($_SERVER['HTTPS']),
                'httponly' => false, // Needs to be readable by JS
                'samesite' => 'Lax'
            ]
        );
    }

    /**
     * Check if an inventory report was requested
     */
    public function isInventoryRequested(): bool
    {
        return isset($_COOKIE[self::INVENTORY_COOKIE]);
    }

    /**
     * Clear inventory (force re-cache)
     */
    public function clear(): void
    {
        $this->inventory = [];
        unset($this->session[self::SESSION_KEY]);

        setcookie(
            self::COOKIE_NAME,
            '',
            [
                'expires' => time() - 3600,
                'path' => '/'
            ]
        );
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

    /**
     * Set the "loader cached" flag
     *
     * Indicates that the Skybolt loader script itself is in browser cache
     */
    public function setLoaderCached(string $version): void
    {
        setcookie(
            'sb_loader',
            $version,
            [
                'expires' => time() + (86400 * 30), // 30 days
                'path' => '/',
                'secure' => isset($_SERVER['HTTPS']),
                'httponly' => true,
                'samesite' => 'Lax'
            ]
        );
    }

    /**
     * Check if loader script is cached
     */
    public function isLoaderCached(string $version): bool
    {
        return isset($_COOKIE['sb_loader'])
            && $_COOKIE['sb_loader'] === $version;
    }
}
