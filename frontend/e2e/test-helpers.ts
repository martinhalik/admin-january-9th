import { Page } from '@playwright/test';

/**
 * Enable authentication bypass for E2E tests
 * This allows tests to run without requiring actual authentication
 * 
 * IMPORTANT: Call this BEFORE any page.goto() calls
 */
export async function enableAuthBypass(page: Page) {
  // Set auth bypass flags that will run on EVERY page load
  await page.addInitScript(() => {
    // Set localStorage flag
    localStorage.setItem('test_auth_bypass', 'true');
    
    // Set window flag
    (window as any).__PLAYWRIGHT_TEST_MODE__ = true;
    
    // Log for debugging
    console.log('[TEST] Auth bypass enabled');
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
  // Give React time to process the auth bypass
  await page.waitForTimeout(500);
}

/**
 * Setup function to call in beforeEach for all tests
 * This ensures auth is bypassed for the entire test suite
 */
export async function setupTestAuth(page: Page) {
  // Enable bypass for all page loads
  await enableAuthBypass(page);
  
  // Also navigate to root first to set the flags in browser context
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  
  // Verify the flags are set
  const testMode = await page.evaluate(() => {
    return {
      localStorage: localStorage.getItem('test_auth_bypass'),
      window: (window as any).__PLAYWRIGHT_TEST_MODE__,
      hostname: window.location.hostname
    };
  });
  
  console.log('[TEST] Auth bypass status:', testMode);
}
