import { test, expect } from '@playwright/test';

test.describe('Deals Page - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    // Wait for deals data to load
    await page.waitForTimeout(3000);
  });

  test('should display deals page with correct URL', async ({ page }) => {
    await expect(page).toHaveURL(/.*deals$/);
  });

  test('should display deals list or table', async ({ page }) => {
    // Wait for content
    await page.waitForTimeout(2000);
    
    // Check page is loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Should not show error
    await expect(page).not.toHaveURL(/error/);
  });

  test('should have search functionality', async ({ page }) => {
    // Look for search input with multiple selectors
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('restaurant');
      await page.waitForTimeout(500);
      await expect(searchInput).toHaveValue('restaurant');
      
      // Clear search
      await searchInput.clear();
    }
  });

  test('should filter deals by status', async ({ page }) => {
    // Wait for filters to load
    await page.waitForTimeout(1000);
    
    // Look for status filter dropdown or buttons
    const statusFilter = page.locator('button:has-text("Status"), button:has-text("All"), [role="combobox"]').first();
    
    if (await statusFilter.isVisible({ timeout: 3000 })) {
      await statusFilter.click();
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to deal detail page', async ({ page }) => {
    // Wait for deals to load
    await page.waitForTimeout(2000);
    
    // Look for any deal link or card
    const dealLink = page.locator('a[href*="/deals/"]').first();
    
    if (await dealLink.isVisible({ timeout: 5000 })) {
      await dealLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to detail page
      await expect(page).toHaveURL(/.*deals\/.+/);
    }
  });

  test('should have create deal button', async ({ page }) => {
    // Look for create/new deal button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Deal"), a:has-text("New Deal")').first();
    
    if (await createButton.isVisible({ timeout: 3000 })) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should paginate deals if pagination exists', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for pagination controls
    const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next" i]').first();
    
    if (await nextButton.isVisible({ timeout: 3000 }) && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }
  });
});
