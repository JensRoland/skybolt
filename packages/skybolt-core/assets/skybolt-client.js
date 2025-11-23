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
        this.inventoryCookie = 'sb_inventory';
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

        // Load async assets
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

            // Scripts should be type="module" for ES module support
            if (type === 'script') {
                element.type = 'module';
            }

            meta.parentNode.replaceChild(element, meta);
        });
    }

    /**
     * Load async assets (external URLs)
     */
    loadAsyncAssets() {
        const metaTags = Array.from(
            document.querySelectorAll(`meta[${this.attrPrefix}state="load-async"]`)
        );

        metaTags.forEach(meta => {
            const type = meta.getAttribute(`${this.attrPrefix}type`);
            const src = meta.getAttribute(`${this.attrPrefix}src`);

            meta.remove();

            // Defer async assets to window.load
            window.addEventListener('load', () => {
                if (type === 'script') {
                    this.loadScript(src);
                } else if (type === 'style') {
                    this.loadStylesheet(src);
                }
            }, { once: true });
        });
    }

    /**
     * Load external script
     */
    loadScript(src) {
        const script = document.createElement('script');
        script.type = 'module';
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
     * Update asset versions cookie
     */
    updateCookie() {
        const value = JSON.stringify(this.versions);
        document.cookie = `${this.cookieName}=${value}; path=/; SameSite=Lax`;
    }

    /**
     * Report inventory to server
     */
    reportInventory() {
        this.updateCookie();

        // Use beacon API if available, otherwise Image
        const url = `${this.config.basePath}inventory.php`;

        if (navigator.sendBeacon) {
            navigator.sendBeacon(url, JSON.stringify(this.versions));
        } else {
            // Fallback: image beacon
            new Image().src = url;
        }
    }

    /**
     * Check if inventory report is requested
     */
    shouldReportInventory() {
        return document.cookie.includes(this.inventoryCookie);
    }

    /**
     * DOM ready handler
     */
    onDomReady() {
        // Process any remaining assets
        this.processAssets();

        // Report inventory if requested
        if (this.shouldReportInventory()) {
            // Delay to not impact page load
            setTimeout(() => this.reportInventory(), 2000);
        }
    }

    /**
     * Self-destruct: clear cache and reload
     */
    selfDestruct() {
        console.warn('Skybolt: Cache corrupted, clearing and reloading');
        localStorage.removeItem(this.cacheKey);
        document.cookie = `${this.cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        location.reload();
    }
}

// Auto-initialize
const skybolt = new SkyboltClient();

// Export for manual control if needed
export default skybolt;
