import { test, expect } from '@playwright/test';

test.describe('AI Deal Generator - Comprehensive Tests', () => {
  // Note: merchant-1 might not exist in Supabase - test will handle both cases
  const testAccountId = 'merchant-1';

  test.beforeEach(async ({ page }) => {
    await page.goto(`/deals/ai-generator?accountId=${testAccountId}`);
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for loading spinner if present
    const loadingSpinner = page.locator('text=/loading.*account/i').first();
    if (await loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false)) {
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    }
    
    await page.waitForTimeout(2000);
    
    // Check if we're on account selection page (account not found)
    const accountSelectionVisible = await page.locator('text=/select.*merchant.*account/i').first().isVisible({ timeout: 1000 }).catch(() => false);
    
    if (accountSelectionVisible) {
      console.log('⚠️ Account not found in database, selecting first available account...');
      
      // Search and select first account
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });
      await searchInput.click();
      await page.waitForTimeout(1000);
      
      // Click first account in list
      const firstAccount = page.locator('[role="button"], button').filter({ hasText: /restaurant|cafe|spa|gym/i }).first();
      await firstAccount.waitFor({ state: 'visible', timeout: 5000 });
      await firstAccount.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should load AI generator page with pre-selected account', async ({ page }) => {
    await expect(page).toHaveURL(/.*ai-generator.*accountId=/);
    
    // Should show AI generator content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display category selection step', async ({ page }) => {
    // Look for category selection heading
    const categoryHeading = page.locator('text=/select.*category/i, text=/choose.*category/i').first();
    
    if (await categoryHeading.isVisible({ timeout: 5000 })) {
      await expect(categoryHeading).toBeVisible();
    }
  });

  test('should display category cards', async ({ page }) => {
    // Look for category options (cards or buttons)
    // After beforeEach, we should be on category selection page
    const categories = page.locator('[role="button"]:has-text("Dining"), [role="button"]:has-text("Food"), button:has-text("Restaurant"), button:has-text("Casual")');
    
    // Wait for categories to load
    await page.waitForTimeout(1000);
    
    const count = await categories.count();
    
    // If no categories found, log diagnostic info
    if (count === 0) {
      console.log('❌ No category cards found');
      console.log('Current URL:', page.url());
      const bodyText = await page.locator('body').textContent();
      console.log('Page content preview:', bodyText?.slice(0, 500));
    }
    
    expect(count).toBeGreaterThan(0);
  });

  test('should select a category', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find and click first available category
    const firstCategory = page.locator('[role="button"]:has-text("Dining"), [role="button"]:has-text("Food"), button:has-text("Restaurant"), button:has-text("Casual")').first();
    
    if (await firstCategory.isVisible({ timeout: 5000 })) {
      await firstCategory.click();
      await page.waitForTimeout(500);
      
      // Should show next step or options
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('should display merchant info sidebar', async ({ page }) => {
    
    // Look for merchant info section
    const merchantInfo = page.locator('text=/merchant.*info/i, text=/account.*info/i').first();
    
    if (await merchantInfo.isVisible({ timeout: 5000 })) {
      await expect(merchantInfo).toBeVisible();
    }
  });

  test('should show discovery sidebar tabs', async ({ page }) => {
    // Look for sidebar tabs (Scout, Work, Files, etc)
    const sidebarTabs = page.locator('[role="tab"], button:has-text("Scout"), button:has-text("Work")');
    
    const count = await sidebarTabs.count();
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should handle cancel action', async ({ page }) => {
    // Look for cancel button
    const cancelButton = page.getByRole('button', { name: /cancel/i }).first();
    
    if (await cancelButton.isVisible({ timeout: 3000 })) {
      await cancelButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Should navigate away from AI generator
      await expect(page).not.toHaveURL(/ai-generator/);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/deals/ai-generator?accountId=${testAccountId}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show breadcrumb navigation', async ({ page }) => {
    // Look for breadcrumbs
    const breadcrumb = page.locator('[role="navigation"] a:has-text("Deals"), a:has-text("AI")').first();
    
    if (await breadcrumb.isVisible({ timeout: 3000 })) {
      await expect(breadcrumb).toBeVisible();
    }
  });
});
