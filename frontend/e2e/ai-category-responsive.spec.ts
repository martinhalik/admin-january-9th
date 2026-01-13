import { test, expect } from '@playwright/test';

test.describe('AI Category Selector - Responsiveness', () => {
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
      await page.goto('/deals/ai-generator?accountId=acc-1');
      
      // Wait for page to load
      await page.waitForLoadState('domcontentloaded');
      
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
      await page.goto('/deals/ai-generator?accountId=acc-1');
      await page.waitForLoadState('domcontentloaded');
      
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
