import { test, expect, type Page, type ConsoleMessage, type Response } from '@playwright/test';

const BASE_URL = 'http://localhost:8084'; // Different port to avoid conflicts

// Expected assets based on vite.config.js
const EXPECTED_ASSETS = [
  'static/css/critical.css',
  'static/css/app.css',
  'static/js/app.js',
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
 * Helper to check for console errors
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
      await skybolt.selfDestruct(false);
    }
  });
  await page.context().clearCookies();
}

test.describe('Skybolt Python Django Example', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearSkyboltState(page);
  });

  test('1. Cold cache (first visit) - assets are inlined', async ({ page }) => {
    const logs = setupConsoleCollector(page);
    const failedRequests = setupFailedRequestCollector(page);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    expect(failedRequests, 'Failed network request detected').toHaveLength(0);

    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    const skyboltLogs = getSkyboltLogs(logs);
    const errors = getConsoleErrors(logs);

    const swFailed = skyboltLogs.some((log) => log.includes('Service Worker registration failed'));
    expect(swFailed, 'Service Worker registration failed').toBe(false);

    expect(errors, 'Console error detected').toHaveLength(0);

    expect(skyboltLogs.some((log) => log.includes('Service Worker ready'))).toBe(true);
    expect(skyboltLogs.some((log) => log.includes('Found 3 assets to cache'))).toBe(true);
    expect(skyboltLogs.some((log) => log.includes('Ready (3 assets cached)'))).toBe(true);

    for (const asset of EXPECTED_ASSETS) {
      expect(skyboltLogs.some((log) => log.includes(`Cached: ${asset}`))).toBe(true);
    }

    const inlinedStyles = await page.locator('style[sb-asset]').count();
    const inlinedScripts = await page.locator('script[sb-asset]').count();
    expect(inlinedStyles).toBe(2);
    expect(inlinedScripts).toBe(1);

    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.count).toBe(3);
    expect(cacheInfo.name).toBe('skybolt-v1');

    const cookies = await page.context().cookies();
    const sbCookie = cookies.find((c) => c.name === 'sb_assets');
    expect(sbCookie).toBeDefined();
  });

  test('2. Warm cache (second visit) - assets served from cache', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    const cacheInfoBefore = await getCacheInfo(page);
    expect(cacheInfoBefore.count).toBe(3);

    const logs = setupConsoleCollector(page);
    const failedRequests = setupFailedRequestCollector(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    expect(failedRequests, 'Failed network request detected').toHaveLength(0);

    const skyboltLogs = getSkyboltLogs(logs);

    expect(skyboltLogs.some((log) => log.includes('Service Worker ready'))).toBe(true);

    const inlinedStyles = await page.locator('style[sb-asset]').count();
    const inlinedScripts = await page.locator('script[sb-asset]').count();
    expect(inlinedStyles).toBe(0);
    expect(inlinedScripts).toBe(0);

    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.count).toBe(3);
  });

  test('3. Third visit (still warm cache) - consistent behavior', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    const logs = setupConsoleCollector(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    const skyboltLogs = getSkyboltLogs(logs);

    expect(skyboltLogs.some((log) => log.includes('Service Worker ready'))).toBe(true);

    const inlinedStyles = await page.locator('style[sb-asset]').count();
    const inlinedScripts = await page.locator('script[sb-asset]').count();
    expect(inlinedStyles).toBe(0);
    expect(inlinedScripts).toBe(0);

    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.count).toBe(3);
  });

  test('Page renders correctly without critical errors', async ({ page }) => {
    const logs = setupConsoleCollector(page);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await expect(page.locator('body')).toBeVisible();

    const jsErrors = logs.filter(
      (log) => log.type() === 'error' && !log.text().includes('[Skybolt')
    );
    expect(jsErrors).toHaveLength(0);
  });

  test('Cache contains expected assets', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForSkyboltInit(page);
    await page.waitForTimeout(500);

    const cacheInfo = await getCacheInfo(page);
    expect(cacheInfo.urls.length).toBe(3);
    expect(cacheInfo.name).toBe('skybolt-v1');

    const paths = cacheInfo.urls.map((u: string) => new URL(u).pathname);
    expect(paths.some((p: string) => p.includes('critical'))).toBe(true);
    expect(paths.some((p: string) => p.includes('app'))).toBe(true);
  });
});
