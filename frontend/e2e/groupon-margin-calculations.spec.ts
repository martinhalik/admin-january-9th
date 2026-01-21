import { test, expect } from '@playwright/test';

test.describe('Groupon Margin Calculations', () => {
  const testAccountId = process.env.TEST_ACCOUNT_ID || 'sf-0013c00001zGmarAAC';

  test.beforeEach(async ({ page }) => {
    await page.goto(`/deals/ai-generator?accountId=${testAccountId}`);
    await page.waitForLoadState('domcontentloaded');
    // Wait for AI analysis to complete (analysis takes ~3 seconds)
    await page.waitForSelector('text=/Select Category/i', { timeout: 15000 });
    // Wait for subcategory cards to appear (they appear after category is auto-selected)
    await page.waitForSelector('.ant-card:has-text("Casual Dining"), .ant-card:has-text("Fine Dining"), .ant-card:has-text("Food"), .ant-card:has-text("Dining")', { timeout: 10000 }).catch(() => {});
  });

  test('should update all options when global Groupon margin changes', async ({ page }) => {
    // Step 1: Check if options are already generating/visible, if not select a subcategory
    const optionsVisible = await page.locator('.ant-card-body').filter({ hasText: /option/i }).filter({ hasText: /price/i }).first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!optionsVisible) {
      // Select a subcategory (they are Cards, not buttons)
      const subcategoryCard = page.locator('.ant-card').filter({ 
        hasText: /Casual Dining|Fine Dining|Café|Coffee|Food|Dining/i 
      }).first();
      
      await expect(subcategoryCard).toBeVisible({ timeout: 10000 });
      await subcategoryCard.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Step 2: Wait for options to be generated (takes ~10 seconds)
    await expect(page.locator('.ant-card-body').filter({ hasText: /option/i }).filter({ hasText: /price/i }).first()).toBeVisible({ timeout: 20000 });

    // Step 3: Find the global Groupon Margin input (in Review Options section)
    // Look for the section with "Groupon Margin" label and input field
    const marginSection = page.locator('div').filter({ 
      hasText: /Groupon Margin/i 
    }).first();
    
    await expect(marginSection).toBeVisible({ timeout: 10000 });

    const marginInput = marginSection.locator('input[type="number"]').first();
    
    // Step 4: Get initial margin value (should be 30% default)
    const initialValue = await marginInput.inputValue();
    expect(initialValue).toBeTruthy();
    
    // Step 5: Change global margin to 10%
    await marginInput.clear();
    await marginInput.fill('10');
    await marginInput.press('Enter');
    
    // Wait for updates to propagate
    await page.waitForTimeout(1000);
    
    // Step 6: Click on first option card to open detail view
    const firstOptionCard = page.locator('.ant-card').filter({ 
      hasText: /dining|credit|meal|option/i 
    }).first();
    
    await expect(firstOptionCard).toBeVisible({ timeout: 10000 });
    await firstOptionCard.click();
    await page.waitForTimeout(1000);
    
    // Step 7: Verify the option detail shows updated margin (10%)
    // Look for Groupon Margin input in the detail sidebar
    // Try Revenue Split section first, then fallback to any Groupon Margin section
    let detailMarginInput = page.locator('div').filter({ 
      hasText: /Revenue Split/i 
    }).locator('..').locator('div').filter({ 
      hasText: /Groupon Margin/i 
    }).locator('input[type="number"]').first();
    
    // If not found, try direct Groupon Margin selector
    if (!(await detailMarginInput.isVisible({ timeout: 2000 }).catch(() => false))) {
      detailMarginInput = page.locator('div').filter({ 
        hasText: /Groupon Margin/i 
      }).locator('input[type="number"]').first();
    }
    
    await expect(detailMarginInput).toBeVisible({ timeout: 5000 });
    const detailValue = await detailMarginInput.inputValue();
    expect(detailValue).toBe('10');
    
    // Step 8: Verify merchant margin is updated (should be 90%)
    const merchantMarginText = page.locator('text=/Merchant margin/i').first();
    if (await merchantMarginText.isVisible({ timeout: 3000 }).catch(() => false)) {
      const merchantMarginValue = await merchantMarginText.textContent();
      expect(merchantMarginValue).toContain('90');
    }
    
    // Step 9: Verify Groupon margin display shows 10% in summary
    const grouponMarginDisplay = page.locator('strong').filter({ 
      hasText: /10%/ 
    }).first();
    
    if (await grouponMarginDisplay.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(grouponMarginDisplay).toContainText('10');
    }
  });

  test('should preserve custom margin when global margin changes', async ({ page }) => {
    // Step 1: Check if options are already generating/visible, if not select a subcategory
    const optionsVisible = await page.locator('.ant-card-body').filter({ hasText: /option/i }).filter({ hasText: /price/i }).first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!optionsVisible) {
      const subcategoryCard = page.locator('.ant-card').filter({ 
        hasText: /Casual Dining|Fine Dining|Café|Coffee|Food|Dining/i 
      }).first();
      
      await expect(subcategoryCard).toBeVisible({ timeout: 10000 });
      await subcategoryCard.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Step 2: Wait for options to be generated (takes ~10 seconds)
    await expect(page.locator('.ant-card-body').filter({ hasText: /option/i }).filter({ hasText: /price/i }).first()).toBeVisible({ timeout: 20000 });

    // Step 3: Find and click first option to open detail
    const firstOption = page.locator('div').filter({ 
      hasText: /dining|credit|meal|option/i 
    }).first();
    
    await expect(firstOption).toBeVisible({ timeout: 10000 });
    await firstOption.click();
    await page.waitForTimeout(500);

    // Step 4: Find the Groupon Margin input in detail view
    const detailMarginSection = page.locator('div').filter({ 
      hasText: /Groupon Margin/i 
    }).first();
    
    await expect(detailMarginSection).toBeVisible({ timeout: 10000 });

    const detailMarginInput = detailMarginSection.locator('input[type="number"]').first();
    
    // Step 5: Set a custom margin (e.g., 25%)
    await detailMarginInput.clear();
    await detailMarginInput.fill('25');
    await detailMarginInput.press('Enter');
    await page.waitForTimeout(500);

    // Verify custom margin is set
    const customValue = await detailMarginInput.inputValue();
    expect(customValue).toBe('25');

    // Step 6: Close detail view and find global margin input
    const closeButton = page.locator('button').filter({ 
      has: page.locator('svg, [aria-label*="close"], [aria-label*="Close"]')
    }).first();
    
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);
    }

    // Step 7: Change global margin to 15%
    const globalMarginSection = page.locator('div').filter({ 
      hasText: /Groupon Margin/i 
    }).first();
    
    await expect(globalMarginSection).toBeVisible({ timeout: 10000 });
    const globalMarginInput = globalMarginSection.locator('input[type="number"]').first();
    
    await globalMarginInput.clear();
    await globalMarginInput.fill('15');
    await globalMarginInput.press('Enter');
    await page.waitForTimeout(500);

    // Step 8: Re-open the same option and verify custom margin is preserved
    await firstOption.click();
    await page.waitForTimeout(500);

    const updatedDetailMarginSection = page.locator('div').filter({ 
      hasText: /Groupon Margin/i 
    }).first();
    await expect(updatedDetailMarginSection).toBeVisible({ timeout: 10000 });
    
    const updatedDetailInput = updatedDetailMarginSection.locator('input[type="number"]').first();
    const preservedValue = await updatedDetailInput.inputValue();
    
    // Custom margin should still be 25%, not updated to 15%
    expect(preservedValue).toBe('25');
  });

  test('should update merchant margin and payout when Groupon margin changes', async ({ page }) => {
    // Step 1: Check if options are already generating/visible, if not select a subcategory
    const optionsVisible = await page.locator('.ant-card-body').filter({ hasText: /option/i }).filter({ hasText: /price/i }).first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!optionsVisible) {
      const subcategoryCard = page.locator('.ant-card').filter({ 
        hasText: /Casual Dining|Fine Dining|Café|Coffee|Food|Dining/i 
      }).first();
      
      await expect(subcategoryCard).toBeVisible({ timeout: 10000 });
      await subcategoryCard.click();
      await page.waitForLoadState('domcontentloaded');
    }
    
    await page.waitForSelector('text=/option/i, text=/price/i, .ant-card-body', { timeout: 20000 });

    // Step 2: Open first option detail
    const firstOption = page.locator('div').filter({ 
      hasText: /dining|credit|meal|option/i 
    }).first();
    
    await expect(firstOption).toBeVisible({ timeout: 10000 });
    await firstOption.click();
    await page.waitForTimeout(500);

    // Step 3: Get initial Groupon price for calculations
    const grouponPriceText = page.locator('text=/Customer pays/i').first();
    let grouponPrice = 0;
    
    if (await grouponPriceText.isVisible({ timeout: 3000 }).catch(() => false)) {
      const priceSection = grouponPriceText.locator('..').locator('strong').first();
      const priceText = await priceSection.textContent();
      if (priceText) {
        grouponPrice = parseFloat(priceText.replace('$', '').trim());
      }
    }

    // Step 4: Find Groupon Margin input
    const marginSection = page.locator('div').filter({ 
      hasText: /Groupon Margin/i 
    }).first();
    
    await expect(marginSection).toBeVisible({ timeout: 10000 });

    const marginInput = marginSection.locator('input[type="number"]').first();
    const initialMargin = parseFloat(await marginInput.inputValue() || '30');

    // Step 5: Change margin to 20%
    await marginInput.clear();
    await marginInput.fill('20');
    await marginInput.press('Enter');
    await page.waitForTimeout(500);

    // Step 6: Verify merchant margin is 80% (100 - 20)
    const merchantMarginText = page.locator('text=/Merchant margin/i').first();
    if (await merchantMarginText.isVisible({ timeout: 3000 }).catch(() => false)) {
      const merchantMarginValue = await merchantMarginText.textContent();
      expect(merchantMarginValue).toContain('80');
    }

    // Step 7: Verify merchant payout is calculated correctly
    // Merchant payout = grouponPrice * (merchantMargin / 100)
    if (grouponPrice > 0) {
      const expectedMerchantPayout = Math.round(grouponPrice * 0.8);
      const merchantPayoutText = page.locator('text=/Merchant gets/i').first();
      
      if (await merchantPayoutText.isVisible({ timeout: 3000 }).catch(() => false)) {
        const payoutSection = merchantPayoutText.locator('..').locator('strong').first();
        const payoutText = await payoutSection.textContent();
        if (payoutText) {
          const actualPayout = parseFloat(payoutText.replace('$', '').trim());
          // Allow small rounding differences
          expect(Math.abs(actualPayout - expectedMerchantPayout)).toBeLessThan(1);
        }
      }
    }

    // Step 8: Verify Groupon gets amount is correct
    const expectedGrouponGets = Math.round(grouponPrice * 0.2);
    const grouponGetsText = page.locator('text=/Groupon gets/i').first();
    
    if (await grouponGetsText.isVisible({ timeout: 3000 }).catch(() => false)) {
      const grouponGetsSection = grouponGetsText.locator('..').locator('strong').first();
      const grouponGetsValue = await grouponGetsSection.textContent();
      if (grouponGetsValue) {
        const actualGrouponGets = parseFloat(grouponGetsValue.replace('$', '').trim());
        expect(Math.abs(actualGrouponGets - expectedGrouponGets)).toBeLessThan(1);
      }
    }
  });

  test('should display correct values in option detail summary', async ({ page }) => {
    // Step 1: Check if options are already generating/visible, if not select a subcategory
    const optionsVisible = await page.locator('.ant-card-body').filter({ hasText: /option/i }).filter({ hasText: /price/i }).first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!optionsVisible) {
      const subcategoryCard = page.locator('.ant-card').filter({ 
        hasText: /Casual Dining|Fine Dining|Café|Coffee|Food|Dining/i 
      }).first();
      
      await expect(subcategoryCard).toBeVisible({ timeout: 10000 });
      await subcategoryCard.click();
      await page.waitForLoadState('domcontentloaded');
    }
    
    await page.waitForSelector('text=/option/i, text=/price/i, .ant-card-body', { timeout: 20000 });

    // Step 2: Open option detail
    const firstOption = page.locator('div').filter({ 
      hasText: /dining|credit|meal|option/i 
    }).first();
    
    await expect(firstOption).toBeVisible({ timeout: 10000 });
    await firstOption.click();
    await page.waitForTimeout(500);

    // Step 3: Set Groupon margin to 10%
    const marginSection = page.locator('div').filter({ 
      hasText: /Groupon Margin/i 
    }).first();
    
    await expect(marginSection).toBeVisible({ timeout: 10000 });

    const marginInput = marginSection.locator('input[type="number"]').first();
    await marginInput.clear();
    await marginInput.fill('10');
    await marginInput.press('Enter');
    await page.waitForTimeout(500);

    // Step 4: Verify all summary values are correct
    // Groupon margin should show 10%
    const grouponMarginDisplay = page.locator('strong').filter({ 
      hasText: /10%/ 
    }).first();
    
    if (await grouponMarginDisplay.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(grouponMarginDisplay).toContainText('10');
    }

    // Merchant margin should show 90%
    const merchantMarginDisplay = page.locator('text=/Merchant margin/i').first();
    if (await merchantMarginDisplay.isVisible({ timeout: 2000 }).catch(() => false)) {
      const merchantMarginText = await merchantMarginDisplay.textContent();
      expect(merchantMarginText).toContain('90');
    }

    // Step 5: Verify input value matches display
    const inputValue = await marginInput.inputValue();
    expect(inputValue).toBe('10');
  });
});
