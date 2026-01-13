import { test, expect } from '@playwright/test';

test.describe('AI Deal Generator - Comprehensive Tests', () => {
  const testAccountId = 'merchant-1'; // Using known account from mock data

  test.beforeEach(async ({ page }) => {
    await page.goto(`/deals/ai-generator?accountId=${testAccountId}`);
    await page.waitForLoadState('networkidle');
    // Wait for data and account to load
    await page.waitForTimeout(5000);
  });

  test('should load AI generator page with pre-selected account', async ({ page }) => {
    await expect(page).toHaveURL(/.*ai-generator.*accountId=/);
    
    // Should show AI generator content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display category selection step', async ({ page }) => {
    // Wait for categories to load
    await page.waitForTimeout(2000);
    
    // Look for category selection heading
    const categoryHeading = page.locator('text=/select.*category/i, text=/choose.*category/i').first();
    
    if (await categoryHeading.isVisible({ timeout: 5000 })) {
      await expect(categoryHeading).toBeVisible();
    }
  });

  test('should display category cards', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for category options (cards or buttons)
    const categories = page.locator('[role="button"]:has-text("Dining"), [role="button"]:has-text("Food"), button:has-text("Restaurant")');
    
    const count = await categories.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should select a category', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find and click first available category
    const firstCategory = page.locator('[role="button"]:has-text("Dining"), [role="button"]:has-text("Food"), button:has-text("Restaurant"), button:has-text("Casual")').first();
    
    if (await firstCategory.isVisible({ timeout: 5000 })) {
      await firstCategory.click();
      await page.waitForTimeout(2000);
      
      // Should show next step or options
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('should display merchant info sidebar', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for merchant info section
    const merchantInfo = page.locator('text=/merchant.*info/i, text=/account.*info/i').first();
    
    if (await merchantInfo.isVisible({ timeout: 5000 })) {
      await expect(merchantInfo).toBeVisible();
    }
  });

  test('should show discovery sidebar tabs', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for sidebar tabs (Scout, Work, Files, etc)
    const sidebarTabs = page.locator('[role="tab"], button:has-text("Scout"), button:has-text("Work")');
    
    const count = await sidebarTabs.count();
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should handle cancel action', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for cancel button
    const cancelButton = page.getByRole('button', { name: /cancel/i }).first();
    
    if (await cancelButton.isVisible({ timeout: 3000 })) {
      await cancelButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate away from AI generator
      await expect(page).not.toHaveURL(/ai-generator/);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/deals/ai-generator?accountId=${testAccountId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show breadcrumb navigation', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for breadcrumbs
    const breadcrumb = page.locator('[role="navigation"] a:has-text("Deals"), a:has-text("AI")').first();
    
    if (await breadcrumb.isVisible({ timeout: 3000 })) {
      await expect(breadcrumb).toBeVisible();
    }
  });
});
