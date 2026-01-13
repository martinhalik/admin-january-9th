import { test, expect } from '@playwright/test';
import { setupTestAuth } from './test-helpers';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate between pages', async ({ page }) => {
    // Navigate to deals
    await page.goto('/deals');
    await expect(page).toHaveURL(/.*deals/);
    
    // Navigate to accounts
    await page.goto('/accounts');
    await expect(page).toHaveURL(/.*accounts/);
    
    // Navigate to tasks
    await page.goto('/tasks');
    await expect(page).toHaveURL(/.*tasks/);
  });

  test('should handle browser back button', async ({ page }) => {
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await page.goBack();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*deals/);
  });

  test('should handle browser forward button', async ({ page }) => {
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await page.goBack();
    await page.waitForTimeout(500);
    await page.goForward();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*accounts/);
  });
});






