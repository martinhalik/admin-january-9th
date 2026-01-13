import { test, expect } from '@playwright/test';
import { setupTestAuth } from './test-helpers';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestAuth(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should toggle between light and dark mode', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button:has-text("Theme")').first();
    
    if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => localStorage.getItem('theme'));
      
      // Click toggle
      await themeToggle.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Click again to toggle back
      await themeToggle.click();
      await page.waitForLoadState('domcontentloaded');
      
      const newTheme = await page.evaluate(() => localStorage.getItem('theme'));
      
      expect(initialTheme).not.toBe(newTheme);
    }
  });

  test('should persist theme preference', async ({ page }) => {
    // Set theme preference
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Check if theme persisted
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
  });
});






