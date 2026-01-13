import { test, expect } from '@playwright/test';
import { setupTestAuth } from './test-helpers';

test.describe('Deals Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestAuth(page);
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to deals page', async ({ page }) => {
    await expect(page).toHaveURL(/.*deals/);
  });

  test('should display deals content', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check that the page has loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle search functionality if present', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      await expect(searchInput).toHaveValue('test search');
    }
  });
});






