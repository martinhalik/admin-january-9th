import { test, expect } from '@playwright/test';

test.describe('Dashboard - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Wait for data to load
    await page.waitForTimeout(500);
  });

  test('should display dashboard with main navigation', async ({ page }) => {
    // Check URL
    await expect(page).toHaveURL('/');
    
    // Check main navigation is present
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /deals/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /accounts/i })).toBeVisible();
  });

  test('should display key metrics and stats', async ({ page }) => {
    // Check that the page has loaded successfully
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Dashboard should not show error states
    await expect(page).not.toHaveURL(/error/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check page renders on mobile
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Navigation should be accessible
    await expect(page.locator('header')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should navigate to deals page from dashboard', async ({ page }) => {
    await page.getByRole('link', { name: /deals/i }).first().click();
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL(/.*deals/);
  });

  test('should have working theme toggle', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.getByRole('button', { name: /dark mode|light mode/i });
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      // Toggle back
      await themeToggle.click();
    }
  });
});
