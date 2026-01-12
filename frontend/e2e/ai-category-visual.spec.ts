import { test } from '@playwright/test';

test.describe('AI Category Selector - Visual Test', () => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile-small' },
    { width: 414, height: 896, name: 'mobile-large' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1024, height: 768, name: 'tablet-landscape' },
    { width: 1366, height: 768, name: 'desktop-small' },
    { width: 1920, height: 1080, name: 'desktop-large' },
  ];

  for (const viewport of viewports) {
    test(`Visual check ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Enable test mode
      await page.addInitScript(() => {
        (window as any).__PLAYWRIGHT_TEST_MODE__ = true;
      });
      
      // Navigate with test auth bypass
      await page.goto('/deals/ai-generator?accountId=acc-1&test_auth=bypass');
      
      // Wait for page load
      await page.waitForLoadState('networkidle');
      
      // Wait a bit for React to render
      await page.waitForTimeout(5000);
      
      // Take full page screenshot
      await page.screenshot({
        path: `test-results/visual-${viewport.name}-full.png`,
        fullPage: true,
      });
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // Take viewport screenshot (shows fixed footer)
      await page.screenshot({
        path: `test-results/visual-${viewport.name}-bottom.png`,
        fullPage: false,
      });
      
      // Log viewport info
      console.log(`✓ ${viewport.name} (${viewport.width}x${viewport.height}) - Screenshots captured`);
    });
  }
});
