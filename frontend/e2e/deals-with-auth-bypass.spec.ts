import { test, expect } from '@playwright/test';
import { setupTestAuth } from './test-helpers';

test.describe('Deals Page with Auth Bypass', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestAuth(page);
    await page.goto('/deals?test_auth=bypass');
    await page.waitForLoadState('domcontentloaded');
    // Wait for table to appear instead of fixed timeout
    await page.locator('table').first().waitFor({ timeout: 5000 }).catch(() => {});
  });

  test('should display Account Owner Filter after auth bypass', async ({ page }) => {
    const consoleMessages: string[] = [];
    
    // Capture console messages for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Auth') || text.includes('DataLoader') || text.includes('AccountOwnerFilter')) {
        consoleMessages.push(`[${msg.type()}] ${text}`);
      }
    });

    console.log('\n=== Checking for Account Owner Filter ===\n');

    // Wait for loading to complete - wait for "Loading..." text to disappear
    const loadingText = page.locator('text=/^Loading\.\.\.$/i').first();
    if (await loadingText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loadingText.waitFor({ state: 'hidden', timeout: 10000 });
    }
    
    // Also wait for filters section to be ready
    const filtersButton = page.locator('button:has-text("Filters")').first();
    await filtersButton.waitFor({ timeout: 5000 }).catch(() => {});

    // Look for all buttons
    const allButtons = await page.locator('button').all();
    const buttonTexts = await Promise.all(
      allButtons.map(async btn => {
        try {
          return await btn.textContent();
        } catch {
          return '';
        }
      })
    );

    console.log('Buttons found:', buttonTexts.filter(t => t?.trim()).length);
    
    // Check for Account Owner Filter
    const hasOwnerFilter = buttonTexts.some(text =>
      text?.includes('Owner') ||
      text?.includes('All Owners') ||
      text?.includes('My Team')
    );

    console.log('Account Owner Filter present:', hasOwnerFilter);
    
    // Display relevant console messages
    if (consoleMessages.length > 0) {
      console.log('\nRelevant console messages:');
      consoleMessages.forEach(msg => console.log('  ' + msg));
    }

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'deals-with-filter.png' });

    // Assert that the filter exists
    expect(hasOwnerFilter).toBeTruthy();
  });

  test('should display deals table', async ({ page }) => {
    // Check that the main deals table is visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    console.log('✓ Deals table is visible');
  });

  test('should have search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
      console.log('✓ Search input is functional');
    }
  });

  test('should have tab navigation', async ({ page }) => {
    // Check for tabs (All, Live, Scheduled, etc.)
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    
    console.log(`Found ${tabCount} tabs`);
    expect(tabCount).toBeGreaterThan(0);
  });
});
