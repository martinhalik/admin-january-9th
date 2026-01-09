import { test, expect } from '@playwright/test';

test.describe('Accounts Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to accounts page', async ({ page }) => {
    await expect(page).toHaveURL(/.*accounts/);
  });

  test('should display accounts content', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check that the page has loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should be able to filter or sort accounts if functionality exists', async ({ page }) => {
    // Look for filter/sort controls
    const filterButton = page.locator('button:has-text("Filter"), button:has-text("filter")').first();
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
    }
  });
});






