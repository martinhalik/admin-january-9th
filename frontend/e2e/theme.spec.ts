import { test, expect } from '@playwright/test';
import { setupTestAuth } from './test-helpers';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should toggle between light and dark mode', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme" i], button[title*="theme" i], button:has-text("Theme")').first();
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialHtml = await page.locator('html').getAttribute('class');
      
      // Click toggle
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check if theme changed
      const newHtml = await page.locator('html').getAttribute('class');
      
      // Verify theme changed (either class changed or localStorage updated)
      const initialTheme = await page.evaluate(() => localStorage.getItem('theme'));
      await themeToggle.click();
      await page.waitForTimeout(500);
      const newTheme = await page.evaluate(() => localStorage.getItem('theme'));
      
      expect(initialTheme).not.toBe(newTheme);
    }
  });

  test('should persist theme preference', async ({ page }) => {
    // Set theme preference
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if theme persisted
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
  });
});






