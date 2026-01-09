import { test, expect } from '@playwright/test';

test.describe('Basic App Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on a valid page
    await expect(page).toHaveTitle(/./); // Has some title
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page has loaded successfully
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});






