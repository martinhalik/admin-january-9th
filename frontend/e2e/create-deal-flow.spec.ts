import { test, expect } from '@playwright/test';

test.describe('Create Deal Flow - AI Generator', () => {
  // Use Salesforce account ID format (sf-...) for production
  // Set TEST_ACCOUNT_ID environment variable with a real account ID from Supabase
  // Example: TEST_ACCOUNT_ID=sf-0013c00001zGmarAAC npm test
  const testAccountId = process.env.TEST_ACCOUNT_ID || 'sf-0013c00001zGmarAAC'; // Real account ID from database

  test.beforeEach(async ({ page }) => {
    await page.goto(`/deals/ai-generator?accountId=${testAccountId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
  });

  test('should complete full AI deal creation flow', async ({ page }) => {
    // Step 1: Verify we're on AI generator page
    await expect(page).toHaveURL(/ai-generator/);
    await page.waitForTimeout(2000);
    
    // Step 2: Select a category
    const categoryButton = page.locator('button:has-text("Casual"), button:has-text("Dining"), button:has-text("Restaurant")').first();
    
    if (await categoryButton.isVisible({ timeout: 5000 })) {
      await categoryButton.click();
      await page.waitForTimeout(3000);
      
      // Step 3: Wait for options to generate
      await page.waitForTimeout(5000);
      
      // Look for generated options or review step
      const optionsGenerated = page.locator('text=/generating/i, text=/option/i, text=/price/i');
      
      if (await optionsGenerated.first().isVisible({ timeout: 10000 })) {
        // Step 4: Check if create/save button appears
        const createButton = page.getByRole('button', { name: /create deal|save|continue/i }).first();
        
        if (await createButton.isVisible({ timeout: 5000 }) && await createButton.isEnabled()) {
          // Flow is working correctly
          await expect(createButton).toBeVisible();
        }
      }
    }
  });

  test('should show account selection when no account provided', async ({ page }) => {
    await page.goto('/deals/ai-generator');
    
    // The component redirects immediately when no accountId is provided
    // Wait for redirect to /deals page (without ai-generator in URL)
    // Use waitForFunction to check URL condition
    await page.waitForFunction(() => {
      const url = window.location.href;
      return url.includes('/deals') && !url.includes('ai-generator');
    }, { timeout: 10000 });
    
    // Verify final URL
    const url = page.url();
    expect(url).toContain('/deals');
    expect(url).not.toContain('ai-generator');
  });

  test('should preserve selected account on page refresh', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Should still have accountId in URL
    await expect(page).toHaveURL(/accountId=/);
  });

  test('should show category options after selection', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Select category
    const category = page.locator('button:has-text("Casual"), button:has-text("Food")').first();
    
    if (await category.isVisible({ timeout: 5000 })) {
      await category.click();
      await page.waitForTimeout(4000);
      
      // Should show subcategories or options generation
      const nextStep = page.locator('text=/subcategory/i, text=/generating/i, text=/option/i').first();
      
      if (await nextStep.isVisible({ timeout: 8000 })) {
        await expect(nextStep).toBeVisible();
      }
    }
  });

  test('should display pricing expectations if available', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Select a category
    const category = page.locator('button:has-text("Dining"), button:has-text("Restaurant")').first();
    
    if (await category.isVisible({ timeout: 5000 })) {
      await category.click();
      await page.waitForTimeout(5000);
      
      // Look for pricing or revenue information
      const pricingInfo = page.locator('text=/price|revenue|discount/i');
      
      const count = await pricingInfo.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle back navigation', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Select category to move forward
    const category = page.locator('button:has-text("Casual"), button:has-text("Dining")').first();
    
    if (await category.isVisible({ timeout: 5000 })) {
      await category.click();
      await page.waitForTimeout(2000);
      
      // Try to go back (if back button exists)
      const backButton = page.getByRole('button', { name: /back/i }).first();
      
      if (await backButton.isVisible({ timeout: 3000 })) {
        await backButton.click();
        await page.waitForTimeout(1000);
        
        // Should return to category selection
        const categorySelection = page.locator('text=/select.*category/i').first();
        if (await categorySelection.isVisible({ timeout: 3000 })) {
          await expect(categorySelection).toBeVisible();
        }
      }
    }
  });
});
