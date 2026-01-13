import { test, expect } from '@playwright/test';

/**
 * Test to verify DealDetail component doesn't have React Hooks order errors
 * 
 * This test was created to catch the bug where a useEffect was called
 * after an early return statement, causing React to detect different
 * numbers of hooks between renders.
 */

test.describe.skip('DealDetail - React Hooks Order', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the deals page
    await page.goto('/deals');
    
    // Wait for deals to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });
  });

  test('should not have React Hooks order errors when loading a deal', async ({ page }) => {
    // Set up console error listener
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Click on the first deal to open DealDetail
    const firstDeal = page.locator('tbody tr').first();
    await firstDeal.click();
    
    // Wait for the deal detail page to load
    await page.waitForURL(/\/deals\/\d+/, { timeout: 10000 });
    
    // Wait for the deal content to be visible
    await page.waitForSelector('.ant-segmented', { timeout: 10000 });
    
    // Give React time to render and execute all effects
    await page.waitForTimeout(2000);
    
    // Check that there are no React Hooks errors in console
    const hooksErrors = consoleErrors.filter(error => 
      error.includes('React has detected a change in the order of Hooks') ||
      error.includes('Rendered more hooks than during the previous render') ||
      error.includes('Rendered fewer hooks than during the previous render')
    );
    
    expect(hooksErrors).toHaveLength(0);
    
    // Verify the page is functional
    await expect(page.locator('.ant-segmented')).toBeVisible();
  });

  test('should not have Hooks errors when switching between views', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Open a deal
    await page.locator('tbody tr').first().click();
    await page.waitForURL(/\/deals\/\d+/);
    
    // Wait for initial render
    await page.waitForSelector('.ant-segmented', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Switch to Content view
    const contentTab = page.locator('.ant-segmented-item').filter({ hasText: 'Content' });
    if (await contentTab.isVisible()) {
      await contentTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Switch to Business Details
    const businessTab = page.locator('.ant-segmented-item').filter({ hasText: 'Business Details' });
    if (await businessTab.isVisible()) {
      await businessTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Switch back to Overview
    const overviewTab = page.locator('.ant-segmented-item').filter({ hasText: 'Overview' });
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Check for Hooks errors
    const hooksErrors = consoleErrors.filter(error => 
      error.includes('React has detected a change in the order of Hooks') ||
      error.includes('Rendered more hooks than during the previous render') ||
      error.includes('Rendered fewer hooks than during the previous render')
    );
    
    expect(hooksErrors).toHaveLength(0);
  });

  test('should not have Hooks errors with loading states', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate directly to a deal URL to catch initial loading state
    await page.goto('/deals/deal-2');
    
    // Wait for any loading state to complete
    await page.waitForSelector('.ant-segmented, .ant-card-loading, .ant-skeleton', { timeout: 10000 });
    
    // Wait for final render
    await page.waitForTimeout(2000);
    
    // Check for Hooks errors
    const hooksErrors = consoleErrors.filter(error => 
      error.includes('React has detected a change in the order of Hooks') ||
      error.includes('Rendered more hooks than during the previous render') ||
      error.includes('Rendered fewer hooks than during the previous render')
    );
    
    expect(hooksErrors).toHaveLength(0);
  });

  test('should not have Hooks errors when deal data updates', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Open a deal
    await page.locator('tbody tr').first().click();
    await page.waitForURL(/\/deals\/\d+/);
    await page.waitForSelector('.ant-segmented', { timeout: 10000 });
    
    // Try to interact with the page to trigger re-renders
    // This might trigger the Hooks error if hooks are conditionally called
    
    // Try clicking on different elements
    const moreButton = page.locator('button').filter({ hasText: 'More' }).first();
    if (await moreButton.isVisible()) {
      await moreButton.click();
      await page.waitForTimeout(500);
      // Close dropdown
      await page.keyboard.press('Escape');
    }
    
    // Try opening sidebar tabs if visible
    const sidebarTabs = page.locator('[role="tab"]').first();
    if (await sidebarTabs.isVisible()) {
      await sidebarTabs.click();
      await page.waitForTimeout(500);
    }
    
    // Give React time to process all updates
    await page.waitForTimeout(1500);
    
    // Check for Hooks errors
    const hooksErrors = consoleErrors.filter(error => 
      error.includes('React has detected a change in the order of Hooks') ||
      error.includes('Rendered more hooks than during the previous render') ||
      error.includes('Rendered fewer hooks than during the previous render')
    );
    
    expect(hooksErrors).toHaveLength(0);
  });
});
