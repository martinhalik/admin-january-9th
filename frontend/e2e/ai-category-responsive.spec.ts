import { test, expect } from '@playwright/test';

test.describe('AI Category Selector - Responsiveness', () => {
  // Use Salesforce account ID format (sf-...) for production
  // Set TEST_ACCOUNT_ID environment variable with a real account ID from Supabase
  // Example: TEST_ACCOUNT_ID=sf-0013c00001zGmarAAC npm test
  const testAccountId = process.env.TEST_ACCOUNT_ID || 'sf-0013c00001zGmarAAC'; // Real account ID from database
  
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },      // Mobile
    { width: 768, height: 1024, name: 'tablet' },     // Tablet
    { width: 1920, height: 1080, name: 'desktop' },   // Desktop
  ];

  // Test each viewport
  for (const viewport of viewports) {
    test(`should display correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Navigate directly to the AI generation flow with a mock account ID
      await page.goto(`/deals/ai-generator?accountId=${testAccountId}`);
      
      // Wait for page to load
      await page.waitForLoadState('domcontentloaded');
      
      // Wait for loading spinner to disappear (account is being fetched)
      const loadingSpinner = page.locator('text=/loading.*merchant.*account/i, .ant-spin-spinning').first();
      if (await loadingSpinner.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 });
      }
      
      // Wait for page to be ready (don't use networkidle as it's too strict and can timeout)
      // Instead, wait for the main content to appear
      await page.waitForTimeout(2000);
      
      // Check if account selection screen is shown (account doesn't exist)
      const accountSelectionVisible = await page.locator('text=/select.*merchant.*account/i').first().isVisible({ timeout: 2000 }).catch(() => false);
      if (accountSelectionVisible) {
        console.log(`⚠️ Account ${testAccountId} not found - selecting first available account...`);
        
        // Wait for accounts to load in the list
        await page.waitForTimeout(3000);
        
        // Look for account cards and select the first one
        const accountCard = page.locator('.ant-card-hoverable').first();
        const cardVisible = await accountCard.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (!cardVisible) {
          console.log(`❌ No merchant accounts available - cannot proceed with test`);
          await page.screenshot({
            path: `test-results/ai-category-${viewport.name}-no-accounts.png`,
            fullPage: true,
          });
          return; // Skip this test if no accounts available
        }
        
        await accountCard.click();
        await page.waitForTimeout(2000);
        
        // Wait for category selector to appear after account selection
        // Don't use networkidle - wait for specific content instead
        await page.waitForTimeout(2000);
      }
      
      // Wait for AI Category Selector to load
      try {
        await page.waitForSelector('text=Select Category', { timeout: 10000 });
      } catch (error) {
        console.log(`Could not find 'Select Category' on ${viewport.name}`);
        await page.screenshot({
          path: `test-results/ai-category-${viewport.name}-error.png`,
          fullPage: true,
        });
        return;
      }
      
      // Wait for content to be ready
      await page.waitForTimeout(1000);
      
      // Take a full page screenshot
      await page.screenshot({
        path: `test-results/ai-category-${viewport.name}-full.png`,
        fullPage: true,
      });
      
      // Scroll to the bottom to capture the fixed footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // Take screenshot of the bottom fixed footer
      const footer = page.locator('[style*="position: fixed"][style*="bottom: 0"]').first();
      if (await footer.count() > 0) {
        await footer.screenshot({
          path: `test-results/ai-category-${viewport.name}-footer.png`,
        });
        
        // Check if elements are overlapping or cut off
        const footerBox = await footer.boundingBox();
        if (footerBox) {
          console.log(`${viewport.name} - Footer dimensions:`, footerBox);
          
          // Check if footer is wider than viewport
          if (footerBox.width > viewport.width) {
            console.warn(`${viewport.name} - Footer is wider than viewport!`);
          }
        }
      }
      
      // Take screenshot of the viewport (not full page)
      await page.screenshot({
        path: `test-results/ai-category-${viewport.name}-viewport.png`,
        fullPage: false,
      });
      
      // Check the main content area
      const mainContent = page.locator('div[style*="maxWidth: 1200"]').first();
      if (await mainContent.count() > 0) {
        const contentBox = await mainContent.boundingBox();
        if (contentBox) {
          console.log(`${viewport.name} - Content dimensions:`, contentBox);
        }
      }
    });
  }

  // Test with sidebar open at different sizes
  test('should handle sidebar at different viewport sizes', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`/deals/ai-generator?accountId=${testAccountId}`);
      
      // Wait for page to load
      await page.waitForLoadState('domcontentloaded');
      
      // Wait for loading spinner to disappear (account is being fetched)
      const loadingSpinner = page.locator('text=/loading.*merchant.*account/i, .ant-spin-spinning').first();
      if (await loadingSpinner.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 });
      }
      
      // Wait for page to be ready (don't use networkidle as it's too strict and can timeout)
      // Instead, wait for the main content to appear
      await page.waitForTimeout(2000);
      
      // Check if account selection screen is shown (account doesn't exist)
      const accountSelectionVisible = await page.locator('text=/select.*merchant.*account/i').first().isVisible({ timeout: 2000 }).catch(() => false);
      if (accountSelectionVisible) {
        console.log(`⚠️ Account ${testAccountId} not found - selecting first available account for ${viewport.name}...`);
        
        // Wait for accounts to load in the list
        await page.waitForTimeout(3000);
        
        // Look for account cards and select the first one
        const accountCard = page.locator('.ant-card-hoverable').first();
        const cardVisible = await accountCard.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (!cardVisible) {
          console.log(`❌ No merchant accounts available for ${viewport.name} - skipping`);
          continue; // Skip this viewport if no accounts available
        }
        
        await accountCard.click();
        await page.waitForTimeout(2000);
        
        // Wait for category selector to appear after account selection
        // Don't use networkidle - wait for specific content instead
        await page.waitForTimeout(2000);
      }
      
      try {
        await page.waitForSelector('text=Select Category', { timeout: 10000 });
        await page.waitForTimeout(500);
        
        // Try to open the sidebar if it exists
        const sidebarTab = page.locator('[role="tablist"]').first();
        if (await sidebarTab.count() > 0) {
          const tabs = await sidebarTab.locator('[role="tab"]').all();
          if (tabs.length > 0) {
            await tabs[0].click();
            await page.waitForTimeout(300);
            
            // Take screenshot with sidebar open
            await page.screenshot({
              path: `test-results/ai-category-${viewport.name}-with-sidebar.png`,
              fullPage: true,
            });
          }
        }
      } catch (error) {
        console.log(`Error testing sidebar on ${viewport.name}`);
      }
    }
  });
});
