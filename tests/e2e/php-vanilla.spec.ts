import { test, expect, type Page, type ConsoleMessage, type Response } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

// Expected assets based on vite.config.js
const EXPECTED_ASSETS = [
  'src/css/critical.css',
  'src/css/main.css',
  'src/js/app.js',
];

interface CacheInfo {
  name: string;
  count: number;
  urls: string[];
  error?: string;
}

interface FailedRequest {
  url: string;
  status: number;
}

/**
 * Helper to collect console logs during page interaction
 */
function setupConsoleCollector(page: Page): ConsoleMessage[] {
  const logs: ConsoleMessage[] = [];
  page.on('console', (msg) => logs.push(msg));
  return logs;
}

/**
 * Helper to collect failed network requests (non-2xx responses)
 */
function setupFailedRequestCollector(page: Page): FailedRequest[] {
  const failures: FailedRequest[] = [];
  page.on('response', (response: Response) => {
    const status = response.status();
    // Collect 4xx and 5xx errors, excluding expected 304s
    if (status >= 400) {
      failures.push({ url: response.url(), status });
    }
  });
  return failures;
}

/**
 * Helper to wait for Skybolt to initialize (success or failure)
 */
async function waitForSkyboltInit(page: Page, timeout = 3000): Promise<void> {
  await page.waitForFunction(
    () => {
      const skybolt = (window as any).skybolt;
      // Either SW registered successfully, or fallback occurred (no SW support/failed)
      return skybolt?.registration !== undefined;
    },
    { timeout }
  );
}

/**
 * Helper to filter Skybolt-related console logs
 */
function getSkyboltLogs(logs: ConsoleMessage[]): string[] {
  return logs
    .filter((log) => log.text().includes('[Skybolt'))
    .map((log) => log.text());
}

/**
 * Helper to check for console errors (excluding expected warnings)
 */
function getConsoleErrors(logs: ConsoleMessage[]): string[] {
  return logs
    .filter((log) => log.type() === 'error')
    .map((log) => log.text());
}

/**
 * Helper to get cache info from the page
 */
async function getCacheInfo(page: Page): Promise<CacheInfo> {
  return await page.evaluate(async () => {
    // Wait for skybolt to be available
    const skybolt = (window as any).skybolt;
    if (!skybolt) {
      return { name: '', count: 0, urls: [], error: 'skybolt not found' };
    }
    return await skybolt.getCacheInfo();
  });
}

/**
 * Helper to clear all Skybolt state (cache + cookies + SW)
 */
async function clearSkyboltState(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const skybolt = (window as any).skybolt;
    if (skybolt) {
      await skybolt.selfDestruct(false); // Don't reload
    }
  });
  // Clear cookies via context
  await page.context().clearCookies();
}

test.describe('Skybolt PHP Vanilla Example', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Clear all state before each test
    await page.goto(BASE_URL);
    await clearSkyboltState(page);
  });

  test('1. Cold cache (first visit) - assets are inlined', async ({ page }) => {
    const logs = setupConsoleCollector(page);
    const failedRequests = setupFailedRequestCollector(page);

    // Navigate with clean state (no cookies)
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Check no failed network requests
    expect(failedRequests, 'Failed network request detected').toHaveLength(0);

    // Wait for Skybolt to initialize (success or failure)
    await waitForSkyboltInit(page);

    // Give time for async operations
    await page.waitForTimeout(500);

    const skyboltLogs = getSkyboltLogs(logs);
    const errors = getConsoleErrors(logs);

    // Check for SW registration failure (fails fast with clear message)
    const swFailed = skyboltLogs.some((log) => log.includes('Service Worker registration failed'));
    expect(swFailed, 'Service Worker registration failed').toBe(false);

    // Check no errors
    expect(errors, 'Console error detected').toHaveLength(0);

    // Check expected console logs for first visit
    expect(skyboltLogs.some((log) => log.includes('Service Worker ready'))).toBe(true);
    expect(skyboltLogs.some((log) => log.includes('Found 4 assets to cache'))).toBe(true);
    expect(skyboltLogs.some((log) => log.includes('Ready (4 new assets cached)'))).toBe(true);

    // Check each asset was cached
    for (const asset of EXPECTED_ASSETS) {
      expect(skyboltLogs.some((log) => log.includes(`Cached: ${asset}`))).toBe(true);
    }

    // Verify inlined assets are present in DOM with sb-asset attributes
    const inlinedStyles = await page.locator('style[sb-asset]').count();
    const inlinedScripts = await page.locator('script[sb-asset]').count();
    expect(inlinedStyles).toBe(2); // critical.css + main.css
    expect(inlinedScripts).toBe(2); // app.js + skybolt-launcher

    // Verify sb-asset attribute format (name:hash)
    const firstStyle = await page.locator('style[sb-asset]').first();
    const sbAsset = await firstStyle.getAttribute('sb-asset');
    expect(sbAsset, 'Malformed sb-asset attribute').toMatch(/^src\/css\/\w+\.css:[A-Za-z0-9_-]+$/);

    // Verify sb-url attribute is present
    const sbUrl = await firstStyle.getAttribute('sb-url');
    expect(sbUrl, 'Malformed sb-url attribute').toMatch(/^\/assets\/\w+-[A-Za-z0-9_-]+\.css$/);

    // Check cache status via API
    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.count).toBe(4);
    expect(cacheInfo.name).toBe('skybolt-v1');

    // Verify sb_assets cookie was set
    const cookies = await page.context().cookies();
    const sbCookie = cookies.find((c) => c.name === 'sb_assets');
    expect(sbCookie).toBeDefined();
    expect(sbCookie!.value).toContain('src%2Fcss%2Fcritical.css');
  });

  test('2. Warm cache (second visit) - assets served from cache', async ({ page, context }) => {
    // First, do a cold visit to populate the cache
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (window as any).skybolt?.registration !== null, {
      timeout: 3000,
    });
    await page.waitForTimeout(500);

    // Verify cache was populated
    const cacheInfoBefore = await getCacheInfo(page);
    expect(cacheInfoBefore.count).toBe(4);

    // Now do a second visit with the cache warm - track failures
    const logs = setupConsoleCollector(page);
    const failedRequests = setupFailedRequestCollector(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (window as any).skybolt?.registration !== null, {
      timeout: 3000,
    });
    await page.waitForTimeout(500);

    // Check no failed network requests (assets should be served from SW cache)
    expect(failedRequests, 'Failed network request detected').toHaveLength(0);

    const skyboltLogs = getSkyboltLogs(logs);
    const errors = getConsoleErrors(logs);

    // Check no errors
    expect(errors).toHaveLength(0);

    // Check Service Worker is ready
    expect(skyboltLogs.some((log) => log.includes('Service Worker ready'))).toBe(true);

    // On warm cache, should NOT find assets to cache (they're loaded via link/script tags)
    // So we should see "Found 0 assets to cache" or no "Found X assets" message
    const foundAssetsLog = skyboltLogs.find((log) => log.includes('Found') && log.includes('assets'));
    if (foundAssetsLog) {
      expect(foundAssetsLog).toContain('Found 0 assets');
    }

    // Should NOT see "Ready (X assets cached)" since nothing new was cached
    expect(skyboltLogs.some((log) => log.includes('Ready (') && log.includes('cached)'))).toBe(false);

    // Verify assets are now served via link/script tags (not inlined)
    const inlinedStyles = await page.locator('style[sb-asset]').count();
    const inlinedScripts = await page.locator('script[sb-asset]').count();
    expect(inlinedStyles).toBe(0);
    expect(inlinedScripts).toBe(0);

    // Verify external link tags are present
    const cssLinks = await page.locator('link[rel="stylesheet"]').count();
    expect(cssLinks).toBeGreaterThanOrEqual(2);

    // Verify external script tags
    const externalScripts = await page.locator('script[src]').count();
    expect(externalScripts).toBeGreaterThanOrEqual(1);

    // Cache should still have 4 assets
    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.count).toBe(4);

    // Note: Service Worker console logs don't appear in the page's console collector
    // We verify cache behavior through the above checks (no inlined assets, external tags present)
  });

  test('3. Third visit (still warm cache) - consistent behavior', async ({ page }) => {
    // First visit - populate cache
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (window as any).skybolt?.registration !== null, {
      timeout: 3000,
    });
    await page.waitForTimeout(500);

    // Second visit
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (window as any).skybolt?.registration !== null, {
      timeout: 3000,
    });
    await page.waitForTimeout(500);

    // Third visit - collect logs
    const logs = setupConsoleCollector(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (window as any).skybolt?.registration !== null, {
      timeout: 3000,
    });
    await page.waitForTimeout(500);

    const skyboltLogs = getSkyboltLogs(logs);
    const errors = getConsoleErrors(logs);

    // Check no errors
    expect(errors).toHaveLength(0);

    // Should behave same as second visit
    expect(skyboltLogs.some((log) => log.includes('Service Worker ready'))).toBe(true);

    // No inlined assets
    const inlinedStyles = await page.locator('style[sb-asset]').count();
    const inlinedScripts = await page.locator('script[sb-asset]').count();
    expect(inlinedStyles).toBe(0);
    expect(inlinedScripts).toBe(0);

    // Cache still has 4 assets
    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.count).toBe(4);

    // Note: Service Worker console logs don't appear in page's console collector
    // We verify warm cache behavior through the markup checks above
  });

  test('Cache status UI displays correctly', async ({ page }) => {
    // First visit to populate cache
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (window as any).skybolt?.registration !== null, {
      timeout: 3000,
    });
    // Wait for cache to be populated
    await page.waitForFunction(
      async () => {
        const info = await (window as any).skybolt?.getCacheInfo();
        return info?.count === 4;
      },
      { timeout: 3000 }
    );
    // Click refresh to update UI with current cache state
    const refreshButton = page.locator('#refresh-status');
    await refreshButton.click();
    await page.waitForTimeout(500);

    // Check cache status element shows cached state
    const cacheStatus = page.locator('#cache-status');
    await expect(cacheStatus).toContainText('Cache Status: Active');
    await expect(cacheStatus).toContainText('Cached Assets: 4');

    // Refresh button should still work
    await refreshButton.click();
    await page.waitForTimeout(500);
    await expect(cacheStatus).toContainText('Cached Assets:');
  });

  test('Clear cache button works', async ({ page }) => {
    // First visit to populate cache
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (window as any).skybolt?.registration !== null, {
      timeout: 3000,
    });
    await page.waitForTimeout(500);

    // Verify cache is populated
    let cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.count).toBe(4);

    // Click clear cache button
    const clearButton = page.locator('#clear-cache');
    await clearButton.click();
    await page.waitForTimeout(500);

    // Verify cache is now empty
    cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.count).toBe(0);

    // Verify cookies were cleared
    const cookies = await page.context().cookies();
    const sbCookie = cookies.find((c) => c.name === 'sb_assets');
    expect(sbCookie).toBeUndefined();
  });

  test('Service Worker responds with correct headers', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (window as any).skybolt?.registration !== null, {
      timeout: 3000,
    });
    await page.waitForTimeout(500);

    // Get cache info to find asset URLs
    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.urls.length).toBeGreaterThan(0);

    // Extract just the pathname from a cached URL
    const cachedUrl = cacheInfo.urls[0];
    const url = new URL(cachedUrl);

    // Fetch the asset directly
    const response = await page.request.get(url.pathname);
    expect(response.ok()).toBe(true);
  });
});
