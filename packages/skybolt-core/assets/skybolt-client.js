/**
 * Skybolt Client
 *
 * High-performance client-side cache controller using localStorage
 * Requires: ES modules, localStorage, DOMContentLoaded support
 */

class SkyboltClient {
    constructor() {
        this.config = this.loadConfig();
        this.assetMap = {};
        this.versions = {};
        this.cacheKey = 'sb_cache';
        this.cookieName = 'sb_assets';
        this.cookieCount = 'sb_assets_count';
        this.cookieMaxSize = 4090;
        this.attrPrefix = 'data-sb-';

        this.init();
    }

    /**
     * Load configuration from meta tag
     */
    loadConfig() {
        const meta = document.querySelector('meta[name="skybolt-config"]');
        if (!meta) {
            throw new Error('Skybolt config meta tag not found');
        }

        return JSON.parse(meta.content);
    }

    /**
     * Initialize Skybolt
     */
    init() {
        // Load existing cache
        this.loadFromStorage();

        // Process <head> assets immediately
        this.processAssets();

        // Process <body> assets on DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDomReady());
        } else {
            this.onDomReady();
        }
    }

    /**
     * Load asset map from localStorage
     */
    loadFromStorage() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                this.assetMap = JSON.parse(cached);

                // Rebuild versions map from loaded assets
                for (const [name, item] of Object.entries(this.assetMap)) {
                    this.versions[name] = item.version;
                }
            }
        } catch (err) {
            console.warn('Skybolt: Failed to load cache', err);
            this.selfDestruct();
        }
    }

    /**
     * Save asset map to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(this.assetMap));
        } catch (err) {
            console.warn('Skybolt: Failed to save cache', err);
        }
    }

    /**
     * Process all Skybolt assets on the page
     */
    processAssets() {
        // Load assets from cache
        this.loadCachedAssets();

        // Store new assets
        this.storeAssets();

        // Load async assets (no caching)
        this.loadAsyncAssets();
    }

    /**
     * Store inlined assets to cache
     */
    storeAssets() {
        const elements = document.querySelectorAll(`[${this.attrPrefix}state="store"]`);

        elements.forEach(element => {
            const type = element.getAttribute(`${this.attrPrefix}type`);
            const name = element.getAttribute(`${this.attrPrefix}name`);
            const version = element.getAttribute(`${this.attrPrefix}version`);
            const data = element.textContent || '';

            const item = {
                type,
                version,
                data,
                size: data.length
            };

            this.assetMap[name] = item;
            this.versions[name] = version;

            element.setAttribute(`${this.attrPrefix}state`, 'stored');
        });

        if (elements.length > 0) {
            this.saveToStorage();
            this.updateCookie();
        }
    }

    /**
     * Load cached assets from localStorage
     */
    loadCachedAssets() {
        const metaTags = Array.from(
            document.querySelectorAll(`meta[${this.attrPrefix}state="load"]`)
        );

        metaTags.forEach(meta => {
            const type = meta.getAttribute(`${this.attrPrefix}type`);
            const name = meta.getAttribute(`${this.attrPrefix}name`);
            const version = meta.getAttribute(`${this.attrPrefix}version`);
            const isModule = meta.getAttribute(`${this.attrPrefix}module`) !== 'false';

            const item = this.assetMap[name];

            // Validate cache
            if (!item || item.version !== version || item.data.length !== item.size) {
                this.selfDestruct();
                return;
            }

            // Create element and inject
            const element = document.createElement(type);
            element.textContent = item.data;
            element.setAttribute(`${this.attrPrefix}name`, name);
            element.setAttribute(`${this.attrPrefix}state`, 'loaded');

            // Set script type based on module attribute
            if (type === 'script' && isModule) {
                element.type = 'module';
            }

            meta.parentNode.replaceChild(element, meta);
        });
    }

    /**
     * Load async assets (external URLs, no caching)
     */
    loadAsyncAssets() {
        const metaTags = Array.from(
            document.querySelectorAll(`meta[${this.attrPrefix}state="load-async"]`)
        );

        metaTags.forEach(meta => {
            const type = meta.getAttribute(`${this.attrPrefix}type`);
            const src = meta.getAttribute(`${this.attrPrefix}src`);
            const isModule = meta.getAttribute(`${this.attrPrefix}module`) !== 'false';

            meta.remove();

            // Defer async assets to window.load
            window.addEventListener('load', () => {
                if (type === 'script') {
                    this.loadScript(src, isModule);
                } else if (type === 'style') {
                    this.loadStylesheet(src);
                }
            }, { once: true });
        });
    }

    /**
     * Load external script
     */
    loadScript(src, isModule) {
        const script = document.createElement('script');
        if (isModule) {
            script.type = 'module';
        }
        script.async = true;
        script.src = src;
        document.head.appendChild(script);
    }

    /**
     * Load external stylesheet
     */
    loadStylesheet(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
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

        console.log('Skybolt: Updating cookies with', Object.keys(this.versions).length, 'assets');

        // Write each cookie chunk
        for (let i = 0; i < count; i++) {
            const cookieName = i === 0
                ? this.cookieName
                : `${this.cookieName}_${i + 1}`;

            document.cookie = `${cookieName}=${chunks[i]}; path=/; max-age=31536000; SameSite=Lax`;
            console.log('Skybolt: Set cookie', cookieName, '=', chunks[i].substring(0, 50) + '...');
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
    onDomReady() {
        // Process any remaining assets
        this.processAssets();
    }

    /**
     * Self-destruct: clear cache and reload
     */
    selfDestruct() {
        console.warn('Skybolt: Cache corrupted, clearing and reloading');
        localStorage.removeItem(this.cacheKey);
        document.cookie = `${this.cookieName}=; path=/; max-age=0`;
        document.cookie = `${this.cookieCount}=; path=/; max-age=0`;
        this.cleanupExtraCookies(0);
        location.reload();
    }
}

// Auto-initialize
const skybolt = new SkyboltClient();

// Export for manual control if needed
export default skybolt;
