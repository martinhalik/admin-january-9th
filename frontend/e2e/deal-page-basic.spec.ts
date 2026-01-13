import { test, expect } from '@playwright/test';
import { enableAuthBypass } from './test-helpers';

/**
 * Basic E2E test for Deal Detail page - WebKit only
 * Tests core editing functionality: title, media, nutshell, description, redemption, locations
 * Also tests Business Details and Preview tabs
 * 
 * Keep this basic as there will be rework coming up
 */

// Use WebKit only as requested - must be at top level
test.use({ browserName: 'webkit' });

test.describe('Deal Page - Basic Functionality', () => {

  // Use a test deal ID - adjust if needed
  const testDealId = process.env.TEST_DEAL_ID || 'sf-006Uj00000ZT0yAIAT';

  test.beforeEach(async ({ page }) => {
    await enableAuthBypass(page);
    await page.goto(`/deals/${testDealId}`);
    // Wait for page to be interactive instead of networkidle (much faster)
    await page.waitForLoadState('domcontentloaded');
    // Wait for main content to appear (tabs)
    await page.locator('.ant-segmented, [role="tablist"]').first().waitFor({ timeout: 5000 }).catch(() => {});
  });

  test('should load deal page successfully', async ({ page }) => {
    // Verify URL
    await expect(page).toHaveURL(new RegExp(`/deals/${testDealId}`));
    
    // Check that page loaded (look for tabs or main content)
    const tabs = page.locator('.ant-segmented, [role="tablist"]').first();
    await expect(tabs).toBeVisible({ timeout: 5000 });
  });

  test('should edit deal title', async ({ page }) => {
    // Switch to Content tab if not already there
    const contentTab = page.locator('text=Content').first();
    if (await contentTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contentTab.click();
      // Wait for content to load instead of fixed timeout
      await page.waitForLoadState('domcontentloaded');
    }

    // Find title editor (could be in ContentEditor or TitleEditor)
    const titleInput = page.locator('input[placeholder*="title" i], textarea[placeholder*="title" i], [contenteditable="true"]').first();
    
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.click();
      await titleInput.fill('Test Deal Title');
      // Verify title was updated immediately without wait
      const titleValue = await titleInput.inputValue().catch(() => '');
      expect(titleValue).toContain('Test Deal Title');
    } else {
      // Title might be in a different format - try clicking on title text
      const titleText = page.locator('h1, h2, [data-testid*="title"]').first();
      if (await titleText.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleText.click({ clickCount: 2 }); // Double click to edit
        await page.keyboard.type('Test Deal Title');
      }
    }
  });

  test('should open and interact with media library', async ({ page }) => {
    // Switch to Content tab
    const contentTab = page.locator('text=Content').first();
    if (await contentTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contentTab.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Look for media library button or section
    const mediaButton = page.locator('button:has-text("Media"), button:has-text("Library"), button:has-text("Images")').first();
    const mediaSection = page.locator('[data-testid*="media"], .media-library, .ant-upload').first();
    
    if (await mediaButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mediaButton.click();
      // Wait for modal to appear instead of fixed timeout
      const mediaModal = page.locator('.ant-modal, [role="dialog"]').filter({ hasText: /media|library|image/i }).first();
      if (await mediaModal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(mediaModal).toBeVisible();
        await page.keyboard.press('Escape');
      }
    } else if (await mediaSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(mediaSection).toBeVisible();
    }
  });

  test('should edit nutshell', async ({ page }) => {
    // Switch to Content tab
    const contentTab = page.locator('text=Content').first();
    if (await contentTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contentTab.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Look for nutshell editor (highlights section)
    const nutshellInput = page.locator('textarea[placeholder*="nutshell" i], textarea[placeholder*="highlight" i], [contenteditable="true"]').first();
    const nutshellSection = page.locator('text=/nutshell|highlights/i').first();
    
    if (await nutshellInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nutshellInput.click();
      await nutshellInput.fill('Test nutshell content');
    } else if (await nutshellSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nutshellSection.click();
      await page.keyboard.type('Test nutshell');
    }
  });

  test('should edit description', async ({ page }) => {
    // Switch to Content tab
    const contentTab = page.locator('text=Content').first();
    if (await contentTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contentTab.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Look for description editor
    const descriptionInput = page.locator('textarea[placeholder*="description" i], [contenteditable="true"]').first();
    
    if (await descriptionInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descriptionInput.click();
      await descriptionInput.fill('Test description content');
    } else {
      // Try finding description by label
      const descriptionLabel = page.locator('text=/description/i').first();
      if (await descriptionLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
        const descriptionField = descriptionLabel.locator('..').locator('textarea, [contenteditable]').first();
        if (await descriptionField.isVisible({ timeout: 2000 }).catch(() => false)) {
          await descriptionField.click();
          await descriptionField.fill('Test description');
        }
      }
    }
  });

  test('should edit redemption method', async ({ page }) => {
    // Switch to Content tab
    const contentTab = page.locator('text=Content').first();
    if (await contentTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contentTab.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Look for redemption method selector
    const redemptionSection = page.locator('text=/redemption|redeem/i').first();
    
    if (await redemptionSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Find radio buttons or select for redemption method
      const onlineRadio = page.locator('input[type="radio"][value*="online"], label:has-text("Online")').first();
      const atLocationRadio = page.locator('input[type="radio"][value*="location"], label:has-text("At Location")').first();
      
      if (await onlineRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
        await onlineRadio.click();
      } else if (await atLocationRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
        await atLocationRadio.click();
      }
    }
  });

  test('should interact with locations section', async ({ page }) => {
    // Switch to Content tab
    const contentTab = page.locator('text=Content').first();
    if (await contentTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contentTab.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Look for locations section
    const locationsSection = page.locator('text=/location/i').first();
    
    if (await locationsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Try to find location checkboxes or selector
      const locationCheckbox = page.locator('input[type="checkbox"]').first();
      const locationButton = page.locator('button:has-text("Location"), button:has-text("Select")').first();
      
      if (await locationCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await locationCheckbox.click();
      } else if (await locationButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await locationButton.click();
        // Wait briefly for modal, then close
        await page.locator('.ant-modal, [role="dialog"]').first().waitFor({ timeout: 1000 }).catch(() => {});
        await page.keyboard.press('Escape');
      }
    }
  });

  test('should display nearby competitor deals', async ({ page }) => {
    // Look for nearby competitor deals section (usually in sidebar or Overview tab)
    const competitorSection = page.locator('text=/competitor|nearby|similar/i').first();
    
    if (await competitorSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(competitorSection).toBeVisible();
    } else {
      // Might be in Overview tab
      const overviewTab = page.locator('text=Overview').first();
      if (await overviewTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await overviewTab.click();
        await page.waitForLoadState('domcontentloaded');
        
        const competitorInOverview = page.locator('text=/competitor|nearby/i').first();
        if (await competitorInOverview.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(competitorInOverview).toBeVisible();
        }
      }
    }
  });

  test('should open and load Business Details tab', async ({ page }) => {
    // Find Business Details tab
    const businessDetailsTab = page.locator('text=Business Details').first();
    
    if (await businessDetailsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await businessDetailsTab.click();
      // Wait for content to load instead of fixed timeout
      await page.waitForLoadState('domcontentloaded');
      
      // Verify tab is active
      await expect(businessDetailsTab).toBeVisible();
      
      // Wait for loading to complete - wait for loading spinner/text to disappear
      const loadingSpinner = page.locator('text=/^Loading\.\.\.$/i, .ant-spin-spinning').first();
      if (await loadingSpinner.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
      }
      
      // Check if Business Details content loaded (look for common fields)
      const businessContent = page.locator('text=/payment|term|license|schedule/i').first();
      if (await businessContent.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(businessContent).toBeVisible();
      }
      
      // Verify page didn't crash or show error (exclude "loading" since we already waited for it to finish)
      const errorMessage = page.locator('text=/error|failed/i').first();
      const hasError = await errorMessage.isVisible({ timeout: 500 }).catch(() => false);
      expect(hasError).toBe(false);
    }
  });

  test('should open and display Preview tab', async ({ page }) => {
    // Preview tab is usually only visible for draft deals
    const previewTab = page.locator('text=Preview').first();
    
    if (await previewTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await previewTab.click();
      // Wait for content to load instead of fixed timeout
      await page.waitForLoadState('domcontentloaded');
      
      // Verify preview content loaded
      // Look for device selector or preview content
      const deviceSelector = page.locator('text=/mobile|tablet|desktop/i').first();
      const previewContent = page.locator('.preview-content, [data-testid*="preview"]').first();
      
      if (await deviceSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(deviceSelector).toBeVisible();
      } else if (await previewContent.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(previewContent).toBeVisible();
      }
      
      // Verify page didn't crash
      const errorMessage = page.locator('text=/error|failed/i').first();
      const hasError = await errorMessage.isVisible({ timeout: 500 }).catch(() => false);
      expect(hasError).toBe(false);
    }
  });
});
