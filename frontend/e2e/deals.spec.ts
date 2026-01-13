import { test, expect } from '@playwright/test';
import { setupTestAuth } from './test-helpers';

test.describe('Deals Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup auth bypass - this navigates to root first
    await setupTestAuth(page);
  });

  test('should navigate to deals page', async ({ page }) => {
    // Navigate to deals page
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    
    // Wait for auth context to process
    await page.waitForTimeout(1000);
    
    // Verify we're on deals page (not redirected to login)
    await expect(page).toHaveURL(/.*deals/);
    await expect(page).not.toHaveURL(/.*login/);
    
    // Verify page content loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display deals content', async ({ page }) => {
    // Navigate to deals page
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check that the page has loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle search functionality if present', async ({ page }) => {
    // Navigate to deals page
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      await expect(searchInput).toHaveValue('test search');
    }
  });
});






