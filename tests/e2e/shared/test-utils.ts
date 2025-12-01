import { test, expect, type Page, type ConsoleMessage, type Response } from '@playwright/test';

export interface CacheInfo {
  name: string;
  count: number;
  urls: string[];
  error?: string;
}

export interface FailedRequest {
  url: string;
  status: number;
}

export interface SkyboltTestConfig {
  name: string;
  baseUrl: string;
  expectedAssets: string[];
  expectedAssetCount: number;
  expectedInlinedStyles: number;
  expectedInlinedScripts: number;
  cachePathPatterns: string[];
  errorFilter?: (log: ConsoleMessage) => boolean;
}

export function setupConsoleCollector(page: Page): ConsoleMessage[] {
  const logs: ConsoleMessage[] = [];
  page.on('console', (msg) => logs.push(msg));
  return logs;
}

export function setupFailedRequestCollector(page: Page): FailedRequest[] {
  const failures: FailedRequest[] = [];
  page.on('response', (response: Response) => {
    const status = response.status();
    if (status >= 400) {
      failures.push({ url: response.url(), status });
    }
  });
  return failures;
}

export async function waitForSkyboltInit(page: Page, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    () => {
      const skybolt = (window as any).skybolt;
      return skybolt?.registration !== undefined;
    },
    { timeout }
  );
}

export function getSkyboltLogs(logs: ConsoleMessage[]): string[] {
  return logs
    .filter((log) => log.text().includes('[Skybolt'))
    .map((log) => log.text());
}

export function getConsoleErrors(logs: ConsoleMessage[]): string[] {
  return logs
    .filter((log) => log.type() === 'error')
    .map((log) => log.text());
}

export async function getCacheInfo(page: Page): Promise<CacheInfo> {
  return await page.evaluate(async () => {
    const skybolt = (window as any).skybolt;
    if (!skybolt) {
      return { name: '', count: 0, urls: [], error: 'skybolt not found' };
    }
    return await skybolt.getCacheInfo();
  });
}

export async function clearSkyboltState(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const skybolt = (window as any).skybolt;
    if (skybolt) {
      await skybolt.selfDestruct(false);
    }
  });
  await page.context().clearCookies();
}

export function createSkyboltTests(config: SkyboltTestConfig) {
  const {
    name,
    baseUrl,
    expectedAssets,
    expectedAssetCount,
    expectedInlinedStyles,
    expectedInlinedScripts,
    cachePathPatterns,
    errorFilter,
  } = config;

  test.describe(`Skybolt ${name}`, () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page }) => {
      await page.goto(baseUrl);
      await clearSkyboltState(page);
    });

    test('1. Cold cache (first visit) - assets are inlined', async ({ page }) => {
      const logs = setupConsoleCollector(page);
      const failedRequests = setupFailedRequestCollector(page);

      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      expect(failedRequests, 'Failed network request detected').toHaveLength(0);

      await waitForSkyboltInit(page);
      await page.waitForTimeout(500);

      const skyboltLogs = getSkyboltLogs(logs);
      const allErrors = getConsoleErrors(logs);
      const errors = errorFilter ? allErrors.filter(errorFilter) : allErrors;

      const swFailed = skyboltLogs.some((log) => log.includes('Service Worker registration failed'));
      expect(swFailed, 'Service Worker registration failed').toBe(false);

      expect(errors, 'Console error detected').toHaveLength(0);

      expect(skyboltLogs.some((log) => log.includes('Service Worker ready'))).toBe(true);
      expect(skyboltLogs.some((log) => log.includes(`Found ${expectedAssetCount} assets to cache`))).toBe(true);
      expect(skyboltLogs.some((log) => log.includes(`Ready (${expectedAssetCount} new assets cached)`))).toBe(true);

      for (const asset of expectedAssets) {
        expect(skyboltLogs.some((log) => log.includes(`Cached: ${asset}`))).toBe(true);
      }

      const inlinedStyles = await page.locator('style[sb-asset]').count();
      const inlinedScripts = await page.locator('script[sb-asset]').count();
      expect(inlinedStyles).toBe(expectedInlinedStyles);
      expect(inlinedScripts).toBe(expectedInlinedScripts);

      const cacheInfo = await getCacheInfo(page);
      expect(cacheInfo.count).toBe(expectedAssetCount);
      expect(cacheInfo.name).toBe('skybolt-v1');

      const cookies = await page.context().cookies();
      const sbCookie = cookies.find((c) => c.name === 'sb_digest');
      expect(sbCookie).toBeDefined();
    });

    test('2. Warm cache (second visit) - assets served from cache', async ({ page }) => {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await waitForSkyboltInit(page);
      await page.waitForTimeout(500);

      const cacheInfoBefore = await getCacheInfo(page);
      expect(cacheInfoBefore.count).toBe(expectedAssetCount);

      const logs = setupConsoleCollector(page);
      const failedRequests = setupFailedRequestCollector(page);
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
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
      expect(cacheInfo.count).toBe(expectedAssetCount);
    });

    test('3. Third visit (still warm cache) - consistent behavior', async ({ page }) => {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await waitForSkyboltInit(page);
      await page.waitForTimeout(500);

      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await waitForSkyboltInit(page);
      await page.waitForTimeout(500);

      const logs = setupConsoleCollector(page);
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await waitForSkyboltInit(page);
      await page.waitForTimeout(500);

      const skyboltLogs = getSkyboltLogs(logs);

      expect(skyboltLogs.some((log) => log.includes('Service Worker ready'))).toBe(true);

      const inlinedStyles = await page.locator('style[sb-asset]').count();
      const inlinedScripts = await page.locator('script[sb-asset]').count();
      expect(inlinedStyles).toBe(0);
      expect(inlinedScripts).toBe(0);

      const cacheInfo = await getCacheInfo(page);
      expect(cacheInfo.count).toBe(expectedAssetCount);
    });

    test('Page renders correctly without critical errors', async ({ page }) => {
      const logs = setupConsoleCollector(page);

      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      await expect(page.locator('body')).toBeVisible();

      const jsErrors = logs.filter((log) => {
        if (log.type() !== 'error') return false;
        if (log.text().includes('[Skybolt')) return false;
        if (errorFilter && !errorFilter(log)) return false;
        return true;
      });
      expect(jsErrors).toHaveLength(0);
    });

    test('Cache contains expected assets', async ({ page }) => {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await waitForSkyboltInit(page);
      await page.waitForTimeout(500);

      const cacheInfo = await getCacheInfo(page);
      expect(cacheInfo.urls.length).toBe(expectedAssetCount);
      expect(cacheInfo.name).toBe('skybolt-v1');

      const paths = cacheInfo.urls.map((u: string) => new URL(u).pathname);
      for (const pattern of cachePathPatterns) {
        expect(paths.some((p: string) => p.includes(pattern))).toBe(true);
      }
    });
  });
}
