/**
 * Skybolt Client
 *
 * Registers Service Worker and manages cache coordination via cookies.
 * Extracts inlined assets and stores them in Cache API via Service Worker.
 *
 * Features:
 * - Service Worker registration with fallback
 * - Inline asset extraction and caching
 * - Cookie-based version tracking
 * - Graceful degradation when SW unavailable
 */

class SkyboltClient {
    constructor() {
        this.config = this.loadConfig();
        this.versions = {};
        this.cookieName = 'sb_assets';
        this.cookieCount = 'sb_assets_count';
        this.cookieMaxSize = 4090;
        this.swRegistration = null;
        this.swReady = false;
        this.forceNoSW = new URLSearchParams(location.search).has('no-sw');

        this.init();
    }

    /**
     * Load configuration from meta tag
     */
    loadConfig() {
        const meta = document.querySelector('meta[name="skybolt-config"]');
        if (!meta) {
            console.warn('[Skybolt] Config meta tag not found, using defaults');
            return { swPath: '/skybolt-sw.js' };
        }

        return JSON.parse(meta.content);
    }

    /**
     * Initialize Skybolt
     */
    async init() {
        console.log('[Skybolt] Initializing...');

        // Register Service Worker
        if (this.supportsServiceWorker() && !this.forceNoSW) {
            await this.registerServiceWorker();
        } else {
            console.warn('[Skybolt] Service Worker not available or disabled');
            this.handleNoServiceWorker();
            return;
        }

        // Process inlined assets
        this.processInlinedAssets();

        // Wait for DOM ready to finalize
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDomReady());
        } else {
            this.onDomReady();
        }
    }

    /**
     * Check if Service Workers are supported
     */
    supportsServiceWorker() {
        return 'serviceWorker' in navigator;
    }

    /**
     * Register the Service Worker
     */
    async registerServiceWorker() {
        try {
            const swPath = this.config.swPath || '/skybolt-sw.js';

            console.log('[Skybolt] Registering Service Worker:', swPath);

            this.swRegistration = await navigator.serviceWorker.register(swPath, {
                scope: '/'
            });

            console.log('[Skybolt] Service Worker registered:', this.swRegistration.scope);

            // Wait for SW to be ready
            await navigator.serviceWorker.ready;
            this.swReady = true;

            console.log('[Skybolt] Service Worker ready');

            // Handle SW updates
            this.swRegistration.addEventListener('updatefound', () => {
                console.log('[Skybolt] Service Worker update found');
            });

        } catch (error) {
            console.error('[Skybolt] Service Worker registration failed:', error);
            this.handleNoServiceWorker();
        }
    }

    /**
     * Process all Skybolt-managed assets on the page
     * Handles both inlined assets and external assets that need pre-caching
     */
    processInlinedAssets() {
        // Find all assets with data-sb-cache attribute
        const skyboltElements = document.querySelectorAll('[data-sb-cache]');

        console.log('[Skybolt] Found', skyboltElements.length, 'Skybolt-managed assets');

        skyboltElements.forEach(element => {
            const cacheInfo = element.getAttribute('data-sb-cache');
            const url = element.getAttribute('data-sb-url');

            if (!cacheInfo || !url) {
                console.warn('[Skybolt] Invalid cache info on element:', element);
                return;
            }

            const [name, version] = cacheInfo.split(':');

            // Store version for cookie
            this.versions[name] = version;

            // Check if this is an inline asset or external asset
            const isExternal = element.hasAttribute('src') || element.hasAttribute('href');

            if (isExternal) {
                // External asset - fetch and cache it
                this.cacheExternalAsset({
                    url,
                    name,
                    version,
                    element
                });
            } else {
                // Inline asset - extract content and cache it
                const content = element.textContent || '';
                const contentType = this.getContentType(element, url);

                this.cacheInlineAsset({
                    url,
                    content,
                    name,
                    version,
                    contentType
                });
            }
        });
    }

    /**
     * Cache inlined asset directly using Cache API
     * Works even on first visit when SW isn't controller yet
     */
    async cacheInlineAsset(data) {
        const { url, content, name, version, contentType } = data;

        console.log('[Skybolt] Caching inline asset:', name, version);

        try {
            // Open the same cache the SW uses
            const cache = await caches.open('skybolt-assets-v1');

            // Create a Response object from the inlined content
            const blob = new Blob([content], { type: contentType });
            const response = new Response(blob, {
                status: 200,
                statusText: 'OK',
                headers: {
                    'Content-Type': contentType,
                    'Content-Length': String(blob.size),
                    'X-Skybolt-Version': version,
                    'X-Skybolt-Name': name,
                    'X-Skybolt-Source': 'inline',
                    'Cache-Control': 'public, max-age=31536000, immutable'
                }
            });

            // Store in cache with the asset's URL as key
            await cache.put(url, response);

            console.log('[Skybolt] Cached:', url);
        } catch (error) {
            console.error('[Skybolt] Failed to cache inline asset:', error);
        }
    }

    /**
     * Cache external asset by fetching and storing in Cache API
     * Used for too-large-to-inline assets on first visit
     */
    async cacheExternalAsset(data) {
        const { url, name, version } = data;

        console.log('[Skybolt] Pre-caching external asset:', name, version);

        try {
            // Open the same cache the SW uses
            const cache = await caches.open('skybolt-assets-v1');

            // Fetch the asset
            const response = await fetch(url);

            if (!response.ok) {
                console.error('[Skybolt] Failed to fetch external asset:', url, response.status);
                return;
            }

            // Clone and store in cache
            await cache.put(url, response.clone());

            console.log('[Skybolt] Pre-cached external asset:', url);
        } catch (error) {
            console.error('[Skybolt] Failed to pre-cache external asset:', error);
        }
    }

    /**
     * Get content type from element and URL
     */
    getContentType(element, url) {
        if (element.tagName === 'STYLE' || url.endsWith('.css')) {
            return 'text/css';
        } else if (element.tagName === 'SCRIPT' || url.endsWith('.js') || url.endsWith('.mjs')) {
            return 'application/javascript';
        }

        return 'text/plain';
    }

    /**
     * Encode versions to compact cookie format
     * Format: name:version,name2:version2
     */
    encodeVersions() {
        const pairs = [];
        for (const [name, version] of Object.entries(this.versions)) {
            pairs.push(`${name}:${version}`);
        }
        return pairs.join(',');
    }

    /**
     * Split cookie data into chunks
     */
    splitCookieData(data) {
        if (data.length <= this.cookieMaxSize) {
            return [data];
        }

        const chunks = [];
        let offset = 0;

        while (offset < data.length) {
            let chunkSize = Math.min(this.cookieMaxSize, data.length - offset);

            // Try to break at a comma if not at the end
            if (offset + chunkSize < data.length) {
                const chunk = data.substring(offset, offset + chunkSize);
                const lastComma = chunk.lastIndexOf(',');
                if (lastComma > 0) {
                    chunkSize = lastComma + 1; // Include the comma
                }
            }

            chunks.push(data.substring(offset, offset + chunkSize));
            offset += chunkSize;
        }

        return chunks;
    }

    /**
     * Update asset versions cookies
     */
    updateCookie() {
        const data = this.encodeVersions();
        const chunks = this.splitCookieData(data);
        const count = chunks.length;

        console.log('[Skybolt] Updating cookies with', Object.keys(this.versions).length, 'assets');

        // Write each cookie chunk
        for (let i = 0; i < count; i++) {
            const cookieName = i === 0
                ? this.cookieName
                : `${this.cookieName}_${i + 1}`;

            document.cookie = `${cookieName}=${chunks[i]}; path=/; max-age=31536000; SameSite=Lax`;
        }

        // Write count cookie if we have multiple chunks
        if (count > 1) {
            document.cookie = `${this.cookieCount}=${count}; path=/; max-age=31536000; SameSite=Lax`;
        } else {
            // Clear count cookie
            document.cookie = `${this.cookieCount}=; path=/; max-age=0`;
        }

        // Clean up extra cookies
        this.cleanupExtraCookies(count);
    }

    /**
     * Clean up extra cookies from previous runs
     */
    cleanupExtraCookies(keepCount) {
        for (let i = keepCount + 1; i <= 10; i++) {
            const cookieName = `${this.cookieName}_${i}`;
            document.cookie = `${cookieName}=; path=/; max-age=0`;
        }
    }

    /**
     * DOM ready handler
     */
    async onDomReady() {
        // Update cookie with versions
        if (Object.keys(this.versions).length > 0) {
            this.updateCookie();
        } else {
            // No assets to cache, but check if cookie exists (potential cache/cookie mismatch)
            await this.validateCacheIntegrity();
        }

        console.log('[Skybolt] Ready');
    }

    /**
     * Validate cache integrity
     * If we have cookies but no assets to cache, check if cache actually exists
     * This handles cases where cache was cleared but cookies remained
     */
    async validateCacheIntegrity() {
        // Check if we have any cookie data
        const cookieData = this.readCookie();
        if (!cookieData || cookieData.length === 0) {
            // No cookies, nothing to validate
            return;
        }

        console.log('[Skybolt] Validating cache integrity...');

        try {
            // Open cache and check if it exists and has entries
            const cache = await caches.open('skybolt-assets-v1');
            const keys = await cache.keys();

            if (keys.length === 0) {
                // Cache is empty but we have cookies - mismatch detected!
                console.warn('[Skybolt] Cache/cookie mismatch detected: cookies exist but cache is empty');
                console.warn('[Skybolt] Clearing cookies and reloading to recover...');

                // Clear cookies and reload
                await this.selfDestruct(true);
            } else {
                console.log('[Skybolt] Cache integrity validated:', keys.length, 'cached assets');
            }
        } catch (error) {
            console.error('[Skybolt] Cache validation failed:', error);
        }
    }

    /**
     * Read cookie data
     */
    readCookie() {
        const cookies = document.cookie.split(';');
        const sbCookies = cookies
            .filter(c => c.trim().startsWith(this.cookieName))
            .map(c => c.split('=')[1])
            .filter(v => v && v.length > 0);

        return sbCookies.join('');
    }

    /**
     * Handle case where Service Worker is not available
     * Convert inline assets to external links as fallback
     */
    handleNoServiceWorker() {
        console.warn('[Skybolt] Falling back to external assets (no Service Worker)');

        const inlinedElements = document.querySelectorAll('[data-sb-cache]');

        inlinedElements.forEach(element => {
            const url = element.getAttribute('data-sb-url');

            if (!url) {
                return;
            }

            // Convert inlined style to link tag
            if (element.tagName === 'STYLE') {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url;
                element.parentNode.replaceChild(link, element);
            }

            // Convert inlined script to external script
            else if (element.tagName === 'SCRIPT') {
                const script = document.createElement('script');
                script.src = url;

                // Preserve attributes
                if (element.getAttribute('data-sb-module') === 'true') {
                    script.type = 'module';
                }
                if (element.getAttribute('data-sb-async') === 'true') {
                    script.async = true;
                }

                element.parentNode.replaceChild(script, element);
            }
        });
    }

    /**
     * Clear cache (for debugging)
     * Clears Cache API entries and cookies, but keeps SW registered
     */
    async clearCache() {
        // Clear Cache API entries
        try {
            await caches.delete('skybolt-assets-v1');
            console.log('[Skybolt] Cache API cleared');
        } catch (error) {
            console.error('[Skybolt] Failed to clear Cache API:', error);
        }

        // Clear cookies
        document.cookie = `${this.cookieName}=; path=/; max-age=0`;
        document.cookie = `${this.cookieCount}=; path=/; max-age=0`;
        this.cleanupExtraCookies(0);

        console.log('[Skybolt] Cache cleared');
    }

    /**
     * Full reset: clear cache, unregister SW, reload page
     * Use this for complete clean slate during development
     */
    async selfDestruct(reload = true) {
        console.warn('[Skybolt] Self-destruct initiated: clearing all caches and reloading...');

        // Clear Cache API entries
        try {
            await caches.delete('skybolt-assets-v1');
        } catch (error) {
            console.error('[Skybolt] Failed to clear Cache API:', error);
        }

        // Clear cookies
        document.cookie = `${this.cookieName}=; path=/; max-age=0`;
        document.cookie = `${this.cookieCount}=; path=/; max-age=0`;
        this.cleanupExtraCookies(0);

        // Unregister Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                    console.log('[Skybolt] Service Worker unregistered');
                }
            } catch (error) {
                console.error('[Skybolt] Failed to unregister Service Worker:', error);
            }
        }

        // Reload page to start fresh
        if (reload) {
            console.log('[Skybolt] Reloading page...');
            location.reload();
        }
    }

    /**
     * Get cache info (for debugging)
     */
    async getCacheInfo() {
        if (!navigator.serviceWorker.controller) {
            return { error: 'No Service Worker controller' };
        }

        return new Promise((resolve) => {
            const channel = new MessageChannel();

            channel.port1.onmessage = (event) => {
                resolve(event.data);
            };

            navigator.serviceWorker.controller.postMessage(
                { type: 'GET_CACHE_INFO' },
                [channel.port2]
            );
        });
    }
}

// Auto-initialize
const skybolt = new SkyboltClient();

// Export for manual control if needed
export default skybolt;

// Expose debug methods globally
if (typeof window !== 'undefined') {
    window.skybolt = skybolt;
}
