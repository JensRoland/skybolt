import { test, expect, type Page, type ConsoleMessage, type Response } from '@playwright/test';

const BASE_URL = 'http://localhost:8082'; // Different port to avoid conflicts

// Expected assets based on vite.config.js
const EXPECTED_ASSETS = [
  'resources/css/critical.css',
  'resources/css/app.css',
  'resources/js/app.js',
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
    // Collect 4xx and 5xx errors
    if (status >= 400) {
      failures.push({ url: response.url(), status });
    }
  });
  return failures;
}

/**
 * Helper to wait for Skybolt to initialize (success or failure)
 */
async function waitForSkyboltInit(page: Page, timeout = 5000): Promise<void> {
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
  await page.context().clearCookies();
}

test.describe('Skybolt PHP Laravel Example', () => {
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
    expect(skyboltLogs.some((log) => log.includes('Found 3 assets to cache'))).toBe(true);
    expect(skyboltLogs.some((log) => log.includes('Ready (3 assets cached)'))).toBe(true);

    // Check each asset was cached
    for (const asset of EXPECTED_ASSETS) {
      expect(skyboltLogs.some((log) => log.includes(`Cached: ${asset}`))).toBe(true);
    }

    // Verify inlined assets are present in DOM with sb-asset attributes
    const inlinedStyles = await page.locator('style[sb-asset]').count();
    const inlinedScripts = await page.locator('script[sb-asset]').count();
    expect(inlinedStyles).toBe(2); // critical.css + app.css
    expect(inlinedScripts).toBe(1); // app.js

    // Check cache status via API
    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.count).toBe(3);
    expect(cacheInfo.name).toBe('skybolt-v1');

    // Verify sb_assets cookie was set
    const cookies = await page.context().cookies();
    const sbCookie = cookies.find((c) => c.name === 'sb_assets');
    expect(sbCookie).toBeDefined();
    expect(sbCookie!.value).toContain('resources%2Fcss%2Fcritical.css');
  });

  test('2. Warm cache (second visit) - assets served from cache', async ({ page }) => {
    // First, do a cold visit to populate the cache
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    // Verify cache was populated
    const cacheInfoBefore = await getCacheInfo(page);
    expect(cacheInfoBefore.count).toBe(3);

    // Now do a second visit with the cache warm - track failures
    const logs = setupConsoleCollector(page);
    const failedRequests = setupFailedRequestCollector(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    // Check no failed network requests (assets should be served from SW cache)
    expect(failedRequests, 'Failed network request detected').toHaveLength(0);

    const skyboltLogs = getSkyboltLogs(logs);

    // Check Service Worker is ready
    expect(skyboltLogs.some((log) => log.includes('Service Worker ready'))).toBe(true);

    // On warm cache, should NOT find assets to cache (they're loaded via link/script tags)
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

    // Cache should still have 3 assets
    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.count).toBe(3);
  });

  test('3. Third visit (still warm cache) - consistent behavior', async ({ page }) => {
    // First visit - populate cache
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    // Second visit
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    // Third visit - collect logs
    const logs = setupConsoleCollector(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    const skyboltLogs = getSkyboltLogs(logs);

    // Should behave same as second visit
    expect(skyboltLogs.some((log) => log.includes('Service Worker ready'))).toBe(true);

    // No inlined assets
    const inlinedStyles = await page.locator('style[sb-asset]').count();
    const inlinedScripts = await page.locator('script[sb-asset]').count();
    expect(inlinedStyles).toBe(0);
    expect(inlinedScripts).toBe(0);

    // Cache still has 3 assets
    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.count).toBe(3);
  });

  test('Page renders correctly without critical errors', async ({ page }) => {
    const logs = setupConsoleCollector(page);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Check page has content
    await expect(page.locator('body')).toBeVisible();

    // Check no critical JavaScript errors
    const jsErrors = logs.filter(
      (log) => log.type() === 'error' && !log.text().includes('[Skybolt')
    );
    expect(jsErrors).toHaveLength(0);
  });

  test('Cache contains expected assets', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    // Get cache info to verify assets were cached
    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.urls.length).toBe(3);
    expect(cacheInfo.name).toBe('skybolt-v1');

    // Verify URLs contain expected asset paths
    const paths = cacheInfo.urls.map((u: string) => new URL(u).pathname);
    expect(paths.some((p: string) => p.includes('critical'))).toBe(true);
    expect(paths.some((p: string) => p.includes('app'))).toBe(true);
  });
});
