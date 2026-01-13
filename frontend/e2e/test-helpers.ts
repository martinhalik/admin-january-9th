import { Page } from '@playwright/test';

/**
 * Enable authentication bypass for E2E tests
 * This allows tests to run without requiring actual authentication
 * 
 * IMPORTANT: Call this BEFORE any page.goto() calls
 */
export async function enableAuthBypass(page: Page) {
  await page.addInitScript(() => {
    // Set test mode flags
    localStorage.setItem('test_auth_bypass', 'true');
    (window as any).__PLAYWRIGHT_TEST_MODE__ = true;
  });
}

/**
 * Navigate to a page with auth bypass enabled
 * This is a convenience wrapper that enables auth bypass and navigates
 */
export async function gotoWithAuthBypass(page: Page, url: string) {
  await enableAuthBypass(page);
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

/**
 * Setup function to call in beforeEach for all tests
 * This ensures auth is bypassed for the entire test suite
 */
export async function setupTestAuth(page: Page) {
  await enableAuthBypass(page);
}
