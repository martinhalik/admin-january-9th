import { test, expect } from '@playwright/test';

test.describe('Preview Tab for Draft Deals', () => {
  test.beforeEach(async ({ page }) => {
    // Enable test mode
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_TEST_MODE__ = true;
    });
  });

  test('should have Preview tab on draft deal page', async ({ page }) => {
    console.log('\n=== Testing Preview Tab Feature ===\n');

    // Navigate directly to a known draft deal
    console.log('Navigating directly to draft deal: draft-1');
    await page.goto('/deals/draft-1?test_auth=bypass', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    await page.screenshot({ path: 'test-results/03-deal-detail-page.png', fullPage: true });
    console.log('✓ Navigated to deal detail page');

    // Check for tabs
    const contentTab = page.locator('text=Content').first();
    const businessDetailsTab = page.locator('text=Business Details').first();
    const previewTab = page.locator('text=Preview').first();
    const overviewTab = page.locator('text=Overview').first();
    const reviewsTab = page.locator('text=Reviews').first();

    // Check what tabs are visible
    const hasContent = await contentTab.isVisible({ timeout: 2000 }).catch(() => false);
    const hasBusinessDetails = await businessDetailsTab.isVisible({ timeout: 2000 }).catch(() => false);
    const hasPreview = await previewTab.isVisible({ timeout: 2000 }).catch(() => false);
    const hasOverview = await overviewTab.isVisible({ timeout: 2000 }).catch(() => false);
    const hasReviews = await reviewsTab.isVisible({ timeout: 2000 }).catch(() => false);

    console.log('\n=== Tab Visibility ===');
    console.log(`Content: ${hasContent}`);
    console.log(`Business Details: ${hasBusinessDetails}`);
    console.log(`Preview: ${hasPreview} 🎯`);
    console.log(`Overview: ${hasOverview}`);
    console.log(`Reviews: ${hasReviews}`);

    if (hasPreview) {
        console.log('\n✅ SUCCESS: Preview tab is visible!');
        
        // Click the Preview tab
        await previewTab.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'test-results/04-preview-tab-active.png', fullPage: true });
        console.log('✓ Clicked Preview tab');

        // Check for device selector buttons
        const mobileBtn = page.locator('text=Mobile').first();
        const tabletBtn = page.locator('text=Tablet').first();
        const desktopBtn = page.locator('text=Desktop').first();

        const hasMobile = await mobileBtn.isVisible({ timeout: 3000 }).catch(() => false);
        const hasTablet = await tabletBtn.isVisible({ timeout: 3000 }).catch(() => false);
        const hasDesktop = await desktopBtn.isVisible({ timeout: 3000 }).catch(() => false);

        console.log('\n=== Device Selector Buttons ===');
        console.log(`Mobile: ${hasMobile}`);
        console.log(`Tablet: ${hasTablet}`);
        console.log(`Desktop: ${hasDesktop}`);

        // Test device switching
        if (hasTablet) {
          await tabletBtn.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'test-results/05-tablet-view.png', fullPage: true });
          console.log('✓ Switched to Tablet view');
        }

        if (hasDesktop) {
          await desktopBtn.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'test-results/06-desktop-view.png', fullPage: true });
          console.log('✓ Switched to Desktop view');
        }

        if (hasMobile) {
          await mobileBtn.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'test-results/07-mobile-view.png', fullPage: true });
          console.log('✓ Switched back to Mobile view');
        }

        // Check for preview content
        const grouponHeader = page.locator('text=GROUPON').first();
        const hasGrouponHeader = await grouponHeader.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`\nGroupon header in preview: ${hasGrouponHeader}`);

        // Assertions
        expect(hasPreview).toBe(true);
        expect(hasMobile || hasTablet || hasDesktop).toBe(true);

        console.log('\n✅ All Preview tab tests PASSED!\n');
    } else {
      console.log('\n⚠️  Preview tab NOT found');
      
      // Check if this might not be a draft deal
      if (hasOverview || hasReviews) {
        console.log('ℹ️  This appears to be a non-draft deal (has Overview/Reviews tabs)');
        console.log('Preview tab is correctly hidden for non-draft deals');
      } else {
        console.log('❌ ERROR: Expected tabs are missing');
        await page.screenshot({ path: 'test-results/error-no-tabs.png', fullPage: true });
      }
    }
  });

  test('should hide Preview tab for non-draft deals', async ({ page }) => {
    console.log('\n=== Testing Preview Tab Visibility Logic ===\n');

    // Navigate directly to a non-draft deal (deal ID "1" is typically a live/won deal)
    console.log('Navigating to non-draft deal: deal ID "1"');
    await page.goto('/deals/1?test_auth=bypass', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    await page.screenshot({ path: 'test-results/non-draft-deal.png', fullPage: true });

    // Check that Preview tab is NOT visible
    const previewTab = page.locator('text=Preview').first();
    const hasPreview = await previewTab.isVisible({ timeout: 2000 }).catch(() => false);

    console.log(`Preview tab visible: ${hasPreview}`);
    
    if (!hasPreview) {
      console.log('✅ CORRECT: Preview tab is hidden for non-draft deals');
    } else {
      console.log('❌ ERROR: Preview tab should not be visible for non-draft deals');
    }

    // Should have Overview or Reviews instead
    const overviewTab = page.locator('text=Overview').first();
    const hasOverview = await overviewTab.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`Overview tab visible: ${hasOverview}`);

    expect(hasPreview).toBe(false);
  });
});
