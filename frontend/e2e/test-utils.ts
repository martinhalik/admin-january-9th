import { test as base } from '@playwright/test';

// Extend basic test by providing common fixtures
export const test = base.extend({
  // Add custom fixtures here if needed
});

export { expect } from '@playwright/test';

/**
 * Common test utilities
 */

/**
 * Wait for network to be idle with a timeout
 */
export async function waitForNetworkIdle(page: any, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for element to be visible
 */
export async function waitForElement(page: any, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Clear local storage
 */
export async function clearLocalStorage(page: any) {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Set local storage item
 */
export async function setLocalStorageItem(page: any, key: string, value: string) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key, value }
  );
}

/**
 * Get local storage item
 */
export async function getLocalStorageItem(page: any, key: string): Promise<string | null> {
  return await page.evaluate((key: string) => localStorage.getItem(key), key);
}

/**
 * Take a screenshot with a name
 */
export async function takeScreenshot(page: any, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}






