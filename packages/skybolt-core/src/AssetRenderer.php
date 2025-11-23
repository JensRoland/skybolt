<?php

declare(strict_types=1);

namespace Skybolt;

/**
 * Renders HTML tags for assets with caching support
 *
 * Generates <script>, <style>, or <meta> tags depending on:
 * - Whether the client has the asset cached
 * - Whether the asset should be inlined
 * - Whether async loading is requested
 */
class AssetRenderer
{
    private const ATTR_PREFIX = 'data-sb-';

    public function __construct(
        private readonly Config $config,
        private readonly ManifestReader $manifest,
        private readonly CacheManager $cache,
        private readonly string $version
    ) {}

    /**
     * Render critical CSS (inline, synchronous)
     */
    public function renderCriticalCSS(string $entry): string
    {
        $content = $this->manifest->getContent($entry);
        $version = $this->manifest->getVersion($entry);

        if ($content === null || $version === null) {
            return $this->renderComment("Critical CSS not found: {$entry}");
        }

        // Always inline critical CSS (it's critical!)
        return $this->buildInlineStyle($entry, $version, $content, store: true);
    }

    /**
     * Render async CSS (localStorage cached or external link)
     */
    public function renderAsyncCSS(string $entry, bool $forceExternal = false): string
    {
        $version = $this->manifest->getVersion($entry);

        if ($version === null) {
            return $this->renderComment("CSS not found: {$entry}");
        }

        // Check if client has it cached
        if ($this->cache->hasLatestVersion($entry, $version)) {
            // Client has it - send meta tag for loading from localStorage
            return $this->buildLoadMeta('style', $entry, $version);
        }

        // Force external mode (no inlining)
        if ($forceExternal) {
            $url = $this->manifest->getUrl($entry);
            return $this->buildAsyncStyleLink($url ?? '');
        }

        // Client doesn't have it - inline it
        $content = $this->manifest->getContent($entry);

        if ($content !== null && strlen($content) <= $this->config->inlineThreshold) {
            // Small enough to inline
            return $this->buildInlineStyle($entry, $version, $content, store: true);
        }

        // Too large or in dev mode - use async link
        $url = $this->manifest->getUrl($entry);
        return $this->buildAsyncStyleLink($url ?? '');
    }

    /**
     * Render blocking CSS (traditional <link> tag)
     */
    public function renderBlockingCSS(string $entry): string
    {
        $url = $this->manifest->getUrl($entry);

        if ($url === null) {
            return $this->renderComment("CSS not found: {$entry}");
        }

        return $this->buildTag('link', [
            'rel' => 'stylesheet',
            'href' => $url,
        ]);
    }

    /**
     * Render async script (localStorage cached or external)
     */
    public function renderAsyncScript(string $entry, bool $isModule = true): string
    {
        $version = $this->manifest->getVersion($entry);

        if ($version === null) {
            return $this->renderComment("Script not found: {$entry}");
        }

        // Check if client has it cached
        if ($this->cache->hasLatestVersion($entry, $version)) {
            // Client has it - send meta tag for loading from localStorage
            return $this->buildLoadMeta('script', $entry, $version);
        }

        // Client doesn't have it - inline it
        $content = $this->manifest->getContent($entry);

        if ($content !== null && strlen($content) <= $this->config->inlineThreshold) {
            // Small enough to inline
            return $this->buildInlineScript($entry, $version, $content, store: true, isModule: $isModule);
        }

        // Too large or in dev mode - use async script tag
        $url = $this->manifest->getUrl($entry);
        return $this->buildAsyncScriptTag($url ?? '', $isModule);
    }

    /**
     * Render blocking script (traditional <script> tag)
     */
    public function renderBlockingScript(string $entry, bool $isModule = false): string
    {
        $url = $this->manifest->getUrl($entry);

        if ($url === null) {
            return $this->renderComment("Script not found: {$entry}");
        }

        return $this->buildScriptTag($url, $isModule);
    }

    /**
     * Render preload link for critical resources
     */
    public function renderPreload(string $entry, string $as, ?string $fetchpriority = null, ?string $type = null): string
    {
        // Try to get URL from manifest first
        $url = $this->manifest->getUrl($entry);

        // If not in manifest, treat as direct URL
        if ($url === null) {
            $url = $entry;
        }

        $attrs = [
            'rel' => 'preload',
            'as' => $as,
            'href' => $url,
        ];

        if ($fetchpriority !== null) {
            $attrs['fetchpriority'] = $fetchpriority;
        }

        if ($type !== null) {
            $attrs['type'] = $type;
        }

        return $this->buildTag('link', $attrs);
    }

    /**
     * Render the Skybolt launcher script
     */
    public function renderLaunchScript(): string
    {
        // The launcher script is embedded in the package (minified version)
        $loaderPath = __DIR__ . '/../assets/skybolt-client.min.js';
        $loaderContent = file_get_contents($loaderPath);

        if ($loaderContent === false) {
            throw new \RuntimeException("Skybolt client script not found: {$loaderPath}");
        }

        // Inject Skybolt version into the loader script header comment
        $loaderContent = preg_replace(
            '/(\* Skybolt Client)/',
            "$1 - v{$this->version}",
            $loaderContent,
            1
        );

        // Generate a version hash for the loader
        $loaderHash = substr(md5($loaderContent), 0, 8);

        // Config meta tag
        $configMeta = $this->buildConfigMeta($loaderHash);

        // Add version comment if debug mode is enabled
        $versionComment = $this->renderComment("Skybolt v{$this->version}");

        // Check if client has the loader cached in browser cache
        if ($this->cache->isLoaderCached($loaderHash)) {
            // Use external script tag
            $scriptUrl = $this->config->getAssetUrl('skybolt-client.js');
            return $versionComment . "\n" . $configMeta . "\n" . $this->buildScriptTag($scriptUrl);
        }

        // Inline the loader (don't store in localStorage - it's too meta!)
        return $versionComment . "\n" . $configMeta . "\n" . $this->buildInlineScript(
            'skybolt-loader',
            $loaderHash,
            $loaderContent,
            store: false,
            isModule: true
        );
    }

    /**
     * Build config meta tag for client
     */
    private function buildConfigMeta(string $loaderVersion): string
    {
        $config = [
            'basePath' => $this->config->basePath,
            'loaderVersion' => $loaderVersion,
        ];

        return $this->buildTag('meta', [
            'name' => 'skybolt-config',
            'content' => json_encode($config, JSON_THROW_ON_ERROR)
        ]);
    }

    /**
     * Build inline <style> tag with caching attributes
     */
    private function buildInlineStyle(
        string $name,
        string $version,
        string $content,
        bool $store
    ): string {
        $attrs = [
            self::ATTR_PREFIX . 'type' => 'style',
            self::ATTR_PREFIX . 'name' => $name,
            self::ATTR_PREFIX . 'version' => $version,
        ];

        if ($store) {
            $attrs[self::ATTR_PREFIX . 'state'] = 'store';
        }

        $comment = $this->renderComment("Inlined for performance by Skybolt");
        return $comment . "\n" . $this->buildTag('style', $attrs, $content);
    }

    /**
     * Build inline <script> tag with caching attributes
     */
    private function buildInlineScript(
        string $name,
        string $version,
        string $content,
        bool $store,
        bool $isModule = true
    ): string {
        $attrs = [
            self::ATTR_PREFIX . 'type' => 'script',
            self::ATTR_PREFIX . 'name' => $name,
            self::ATTR_PREFIX . 'version' => $version,
        ];

        if ($store) {
            $attrs[self::ATTR_PREFIX . 'state'] = 'store';
        }

        // Add type="module" for ES module scripts
        if ($isModule) {
            $attrs['type'] = 'module';
        }

        $comment = $this->renderComment("Inlined for performance by Skybolt");
        return $comment . "\n" . $this->buildTag('script', $attrs, $content);
    }

    /**
     * Build <meta> tag for loading from localStorage
     */
    private function buildLoadMeta(string $type, string $name, string $version): string
    {
        $comment = $this->renderComment("Cached by Skybolt");
        return $comment . ' ' . $this->buildTag('meta', [
            self::ATTR_PREFIX . 'type' => $type,
            self::ATTR_PREFIX . 'name' => $name,
            self::ATTR_PREFIX . 'version' => $version,
            self::ATTR_PREFIX . 'state' => 'load',
        ]);
    }

    /**
     * Build async <meta> tag for lazy loading
     */
    private function buildAsyncMeta(string $type, string $url): string
    {
        return $this->buildTag('meta', [
            self::ATTR_PREFIX . 'type' => $type,
            self::ATTR_PREFIX . 'src' => $url,
            self::ATTR_PREFIX . 'state' => 'load-async',
        ]);
    }

    /**
     * Build async <script> tag
     */
    private function buildAsyncScriptTag(string $src, bool $isModule = true): string
    {
        // For now, use meta tags for async loading (handled by client)
        // We could extend this to add module type to the meta tag if needed
        return $this->buildAsyncMeta('script', $src);
    }

    /**
     * Build async <link rel="stylesheet"> tag
     */
    private function buildAsyncStyleLink(string $href): string
    {
        return $this->buildAsyncMeta('style', $href);
    }

    /**
     * Build regular <script> tag
     */
    private function buildScriptTag(string $src, bool $isModule = true): string
    {
        $attrs = ['src' => $src];
        if ($isModule) {
            $attrs['type'] = 'module';
        }
        return $this->buildTag('script', $attrs, '');
    }

    /**
     * Build HTML tag with attributes and optional content
     */
    private function buildTag(
        string $tagName,
        array $attributes,
        ?string $content = null
    ): string {
        $attrs = [];
        foreach ($attributes as $key => $value) {
            if ($value === null) {
                $attrs[] = $key;
            } else {
                $escapedValue = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                $attrs[] = "{$key}=\"{$escapedValue}\"";
            }
        }

        $attrString = empty($attrs) ? '' : ' ' . implode(' ', $attrs);

        // Void elements (self-closing)
        if ($content === null && $tagName === 'meta') {
            return "<{$tagName}{$attrString}>";
        }

        // Elements with content
        if ($content !== null && $content !== '') {
            return "<{$tagName}{$attrString}>\n{$content}\n</{$tagName}>";
        }

        // Empty elements
        return "<{$tagName}{$attrString}></{$tagName}>";
    }

    /**
     * Render HTML comment (if enabled)
     */
    private function renderComment(string $text): string
    {
        if (!$this->config->printComments) {
            return '';
        }

        return "<!-- {$text} -->";
    }
}
