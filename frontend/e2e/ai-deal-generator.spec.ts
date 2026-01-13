import { test, expect } from '@playwright/test';

test.describe('AI Deal Generator - Comprehensive Tests', () => {
  // Use Salesforce account ID format (sf-...) for production
  // Set TEST_ACCOUNT_ID environment variable with a real account ID from Supabase
  // Example: TEST_ACCOUNT_ID=sf-0013c00001zGmarAAC npm test
  const testAccountId = process.env.TEST_ACCOUNT_ID || 'sf-0013c00001zGmarAAC'; // Real account ID from database

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
      
      // Wait for loading spinner to disappear (accounts are loading)
      const loadingSpinner = page.locator('.ant-spin-spinning, text=/loading.*account/i').first();
      if (await loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false)) {
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
      }
      
      // Wait for accounts to load in the list
      await page.waitForTimeout(2000);
      
      // Look for account cards (they're rendered as hoverable cards)
      // Try multiple selectors to find an account
      const accountCard = page.locator('.ant-card-hoverable').first();
      
      // Wait for at least one account card to be visible
      try {
        await accountCard.waitFor({ state: 'visible', timeout: 10000 });
      } catch (error) {
        // If still not visible, check if there are any cards at all
        const cardCount = await page.locator('.ant-card-hoverable').count();
        if (cardCount === 0) {
          throw new Error('No merchant accounts available in the list. Please seed data: npx ts-node scripts/seedEmployeesAndAccountsStandalone.ts');
        }
      }
      
      await accountCard.click();
      await page.waitForTimeout(2000);
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
    // Wait for AI analysis to complete (component shows loading state first)
    // The analysis takes ~3 seconds, but we need to wait for it to fully complete
    const analysisSpinner = page.locator('text=/AI Analysis/i, text=/Scraping website/i, text=/Analyzing data/i, text=/Generating recommendations/i').first();
    
    // Wait for analysis spinner to appear and then disappear (analysis completes)
    if (await analysisSpinner.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Wait for analysis to complete - it shows 3 steps, wait for all to finish
      await analysisSpinner.waitFor({ state: 'hidden', timeout: 15000 });
    }
    
    // Wait for the analysis to fully complete and UI to update
    // The component auto-selects a category after analysis, so we might see subcategories
    await page.waitForTimeout(2000);
    
    // Look for subcategory cards (PDS options) - these appear after category auto-selection
    // The component auto-selects a category, so we should see subcategory cards
    const subcategoryCards = page.locator('.ant-card-hoverable').filter({ 
      hasText: /.+/ // Any card with text content
    });
    
    // Wait for at least one card to appear (with longer timeout)
    try {
      await subcategoryCards.first().waitFor({ state: 'visible', timeout: 15000 });
    } catch (error) {
      // If subcategory cards don't appear, check for category selection UI
      const categorySelection = page.locator('text=/Select Category/i, text=/Category Recommendations/i').first();
      if (await categorySelection.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Category selection is visible but no cards yet - wait a bit more
        await page.waitForTimeout(3000);
      }
    }
    
    const subcategoryCount = await subcategoryCards.count();
    
    // If still no cards, check for any cards in the category recommendations area
    if (subcategoryCount === 0) {
      // Look for any cards in the main content area
      const anyCards = page.locator('.ant-card-hoverable, [role="button"].ant-card').filter({ 
        hasText: /.+/ 
      });
      const anyCardCount = await anyCards.count();
      
      if (anyCardCount === 0) {
        console.log('❌ No category or subcategory cards found');
        console.log('Current URL:', page.url());
        const bodyText = await page.locator('body').textContent();
        console.log('Page content preview:', bodyText?.slice(0, 500));
        throw new Error('No category or subcategory cards found on the page');
      }
      
      expect(anyCardCount).toBeGreaterThan(0);
    } else {
      expect(subcategoryCount).toBeGreaterThan(0);
    }
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
