<?php

declare(strict_types=1);

namespace Skybolt;

/**
 * Renders HTML tags for assets with Service Worker caching support
 *
 * Hybrid approach:
 * - First visit (no cookie): Inline assets with data-sb-cache attributes
 * - Subsequent visits (has cookie): Standard link/script tags (SW intercepts)
 *
 * This eliminates meta tag complexity while keeping first-visit performance benefits.
 */
class AssetRenderer
{
    public function __construct(
        private readonly Config $config,
        private readonly ManifestReader $manifest,
        private readonly CacheManager $cache,
        private readonly string $version
    ) {}


    /**
     * Render async CSS
     * First visit: inline (if small enough)
     * Subsequent visits: link tag (SW intercepts)
     */
    public function renderAsyncCSS(string $entry): string
    {
        $version = $this->manifest->getVersion($entry);
        $url = $this->manifest->getUrl($entry);

        if ($version === null || $url === null) {
            return $this->renderComment("CSS not found: {$entry}");
        }

        // Check if client has it cached
        if ($this->cache->hasLatestVersion($entry, $version)) {
            // Client has it - use standard link tag (SW will intercept)
            $comment = $this->renderComment("CSS from cache (via SW)");
            return $comment . "\n" . $this->buildTag('link', [
                'rel' => 'stylesheet',
                'href' => $url,
            ]);
        }

        // Client doesn't have it - decide whether to inline
        $content = $this->manifest->getContent($entry);

        if ($content !== null && strlen($content) <= $this->config->inlineThreshold) {
            // Small enough to inline
            $comment = $this->renderComment("CSS inlined for caching");
            return $comment . "\n" . $this->buildInlineStyle($entry, $version, $url, $content);
        }

        // Too large to inline - use external link with cache attributes
        $comment = $this->renderComment("CSS too large, external link");
        return $comment . "\n" . $this->buildTag('link', [
            'rel' => 'stylesheet',
            'href' => $url,
            'data-sb-cache' => "{$entry}:{$version}",
            'data-sb-url' => $url,
        ]);
    }

    /**
     * Render blocking CSS (traditional <link> tag, no caching)
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
     * Render async script
     * First visit: inline (if small enough)
     * Subsequent visits: script tag (SW intercepts)
     */
    public function renderAsyncScript(string $entry, bool $isModule = true): string
    {
        $version = $this->manifest->getVersion($entry);
        $url = $this->manifest->getUrl($entry);

        if ($version === null || $url === null) {
            return $this->renderComment("Script not found: {$entry}");
        }

        // Check if client has it cached
        if ($this->cache->hasLatestVersion($entry, $version)) {
            // Client has it - use standard script tag (SW will intercept)
            $comment = $this->renderComment("Script from cache (via SW)");
            $attrs = [
                'src' => $url,
                'async' => null, // Boolean attribute
            ];

            if ($isModule) {
                $attrs['type'] = 'module';
            }

            return $comment . "\n" . $this->buildTag('script', $attrs, '');
        }

        // Client doesn't have it - decide whether to inline
        $content = $this->manifest->getContent($entry);

        if ($content !== null && strlen($content) <= $this->config->inlineThreshold) {
            // Small enough to inline
            $comment = $this->renderComment("Script inlined for caching");
            return $comment . "\n" . $this->buildInlineScript($entry, $version, $url, $content, $isModule, true);
        }

        // Too large to inline - use external script with cache attributes
        $comment = $this->renderComment("Script too large, external load (pre-cached)");
        $attrs = [
            'src' => $url,
            'async' => null, // Boolean attribute
            'data-sb-cache' => "{$entry}:{$version}",
            'data-sb-url' => $url,
        ];

        if ($isModule) {
            $attrs['type'] = 'module';
            $attrs['data-sb-module'] = 'true';
        }

        return $comment . "\n" . $this->buildTag('script', $attrs, '');
    }

    /**
     * Render blocking script
     */
    public function renderBlockingScript(string $entry, bool $isModule = false): string
    {
        $version = $this->manifest->getVersion($entry);
        $url = $this->manifest->getUrl($entry);

        if ($version === null || $url === null) {
            return $this->renderComment("Script not found: {$entry}");
        }

        // Check if client has it cached
        if ($this->cache->hasLatestVersion($entry, $version)) {
            // Client has it - use standard script tag (SW will intercept)
            $attrs = ['src' => $url];

            if ($isModule) {
                $attrs['type'] = 'module';
            }

            return $this->buildTag('script', $attrs, '');
        }

        // Client doesn't have it - decide whether to inline
        $content = $this->manifest->getContent($entry);

        if ($content !== null && strlen($content) <= $this->config->inlineThreshold) {
            // Small enough to inline
            return $this->buildInlineScript($entry, $version, $url, $content, $isModule, false);
        }

        // Too large to inline - use external script with cache attributes
        // so client can pre-cache it on first load
        $attrs = [
            'src' => $url,
            'data-sb-cache' => "{$entry}:{$version}",
            'data-sb-url' => $url,
        ];

        // TODO: Does this make sense? If we want it to be blocking, it can't be a module
        if ($isModule) {
            $attrs['type'] = 'module';
            $attrs['data-sb-module'] = 'true';
        }

        if ($async) {
            $attrs['data-sb-async'] = 'true';
        }

        return $this->buildTag('script', $attrs, '');
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
        $clientName = 'skybolt-client';
        $clientVersion = $this->version;
        $clientUrl = $this->config->basePath . 'skybolt-client.php?v=' . $this->version;

        // Config meta tag (includes SW path)
        $configMeta = $this->buildConfigMeta();

        // Add version comment if debug mode is enabled
        $versionComment = $this->renderComment("Skybolt v{$this->version} with Service Worker caching");

        // Check if client has the client script cached
        if ($this->cache->hasLatestVersion($clientName, $clientVersion)) {
            // Client has it - use external script tag (SW will serve from cache)
            $comment = $this->renderComment("Client script from cache (via SW)");
            $scriptTag = $this->buildTag('script', [
                'type' => 'module',
                'src' => $clientUrl,
            ], '');

            return $versionComment . "\n" . $configMeta . "\n" . $comment . "\n" . $scriptTag;
        }

        // First visit - inline it with cache attributes
        $loaderPath = __DIR__ . '/../assets/skybolt-client.min.js';
        $loaderContent = file_get_contents($loaderPath);

        if ($loaderContent === false) {
            throw new \RuntimeException("Skybolt client script not found: {$loaderPath}");
        }

        $comment = $this->renderComment("Client script inlined for first visit");
        $inlineScript = $this->buildTag('script', [
            'type' => 'module',
            'data-sb-cache' => "{$clientName}:{$clientVersion}",
            'data-sb-url' => $clientUrl,
            'data-sb-module' => 'true',
        ], $loaderContent);

        return $versionComment . "\n" . $configMeta . "\n" . $comment . "\n" . $inlineScript;
    }

    /**
     * Build config meta tag for client
     */
    private function buildConfigMeta(): string
    {
        $config = [
            'basePath' => $this->config->basePath,
            'swPath' => '/skybolt-sw.php', // PHP endpoint that serves SW from vendor
        ];

        return $this->buildTag('meta', [
            'name' => 'skybolt-config',
            'content' => json_encode($config, JSON_THROW_ON_ERROR)
        ]);
    }

    /**
     * Build inline <style> tag with Service Worker cache attributes
     */
    private function buildInlineStyle(
        string $name,
        string $version,
        string $url,
        string $content
    ): string {
        $attrs = [
            'data-sb-cache' => "{$name}:{$version}",
            'data-sb-url' => $url,
        ];

        return $this->buildTag('style', $attrs, $content);
    }

    /**
     * Build inline <script> tag with Service Worker cache attributes
     */
    private function buildInlineScript(
        string $name,
        string $version,
        string $url,
        string $content,
        bool $isModule = true,
        bool $async = true
    ): string {
        $attrs = [
            'data-sb-cache' => "{$name}:{$version}",
            'data-sb-url' => $url,
        ];

        // Preserve module attribute
        if ($isModule) {
            $attrs['type'] = 'module';
            $attrs['data-sb-module'] = 'true';
        }

        // Preserve async attribute
        if ($async) {
            $attrs['data-sb-async'] = 'true';
        }

        return $this->buildTag('script', $attrs, $content);
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
                // Boolean attribute (e.g., async, defer)
                $attrs[] = $key;
            } else {
                $escapedValue = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                $attrs[] = "{$key}=\"{$escapedValue}\"";
            }
        }

        $attrString = empty($attrs) ? '' : ' ' . implode(' ', $attrs);

        // Void elements (self-closing)
        if ($content === null && in_array($tagName, ['meta', 'link'])) {
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
