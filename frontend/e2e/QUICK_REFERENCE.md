# Playwright Quick Reference

A quick reference guide for common Playwright commands and patterns.

## Running Tests

```bash
# All tests
npm run test:e2e

# UI mode (interactive)
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Specific file
npx playwright test e2e/dashboard.spec.ts

# Specific test
npx playwright test -g "should display dashboard"

# View report
npm run test:e2e:report
```

## Common Assertions

```typescript
// URL
await expect(page).toHaveURL('https://example.com');
await expect(page).toHaveURL(/.*dashboard/);

// Title
await expect(page).toHaveTitle('My App');
await expect(page).toHaveTitle(/Dashboard/);

// Element visible
await expect(page.locator('.my-element')).toBeVisible();

// Element hidden
await expect(page.locator('.my-element')).toBeHidden();

// Text content
await expect(page.locator('.title')).toHaveText('Hello');
await expect(page.locator('.title')).toContainText('Hel');

// Count
await expect(page.locator('.item')).toHaveCount(5);

// Value
await expect(page.locator('input')).toHaveValue('test');

// Attribute
await expect(page.locator('button')).toHaveAttribute('disabled');
await expect(page.locator('a')).toHaveAttribute('href', '/path');

// Class
await expect(page.locator('.item')).toHaveClass('active');
await expect(page.locator('.item')).toHaveClass(/active/);
```

## Locators

```typescript
// By CSS selector
page.locator('.my-class')
page.locator('#my-id')
page.locator('button')

// By text
page.locator('text=Login')
page.getByText('Login')

// By role
page.getByRole('button', { name: 'Submit' })
page.getByRole('textbox', { name: 'Email' })

// By label
page.getByLabel('Email')

// By placeholder
page.getByPlaceholder('Enter email')

// By test ID
page.locator('[data-testid="submit-btn"]')
page.getByTestId('submit-btn')

// By alt text (images)
page.getByAltText('Logo')

// By title
page.getByTitle('Close')

// Chaining
page.locator('.container').locator('button').first()
page.locator('.list').locator('.item').nth(2)
```

## Actions

```typescript
// Click
await page.click('button');
await page.locator('button').click();

// Double click
await page.dblclick('button');

// Right click
await page.click('button', { button: 'right' });

// Type
await page.fill('input', 'text');
await page.locator('input').fill('text');

// Type slowly (triggers events)
await page.type('input', 'text', { delay: 100 });

// Clear
await page.fill('input', '');

// Press key
await page.press('input', 'Enter');
await page.keyboard.press('Escape');

// Select option
await page.selectOption('select', 'value');
await page.selectOption('select', { label: 'Text' });

// Check/uncheck
await page.check('input[type="checkbox"]');
await page.uncheck('input[type="checkbox"]');

// Hover
await page.hover('.menu-item');

// Focus
await page.focus('input');

// Upload file
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');

// Drag and drop
await page.dragAndDrop('.source', '.target');
```

## Navigation

```typescript
// Navigate
await page.goto('https://example.com');
await page.goto('/dashboard');

// Back
await page.goBack();

// Forward
await page.goForward();

// Reload
await page.reload();

// Wait for navigation
await page.waitForNavigation();
```

## Waiting

```typescript
// Wait for load state
await page.waitForLoadState('networkidle');
await page.waitForLoadState('domcontentloaded');

// Wait for selector
await page.waitForSelector('.my-element');
await page.waitForSelector('.my-element', { state: 'visible' });
await page.waitForSelector('.my-element', { state: 'hidden' });

// Wait for function
await page.waitForFunction(() => document.title === 'Loaded');

// Wait for response
await page.waitForResponse('**/api/data');
await page.waitForResponse(resp => resp.url().includes('/api/'));

// Wait for timeout
await page.waitForTimeout(1000); // Avoid if possible!

// Wait for element to be stable
await page.locator('.element').waitFor({ state: 'visible' });
```

## Page Interactions

```typescript
// Get text
const text = await page.locator('.title').textContent();

// Get value
const value = await page.locator('input').inputValue();

// Get attribute
const href = await page.locator('a').getAttribute('href');

// Get count
const count = await page.locator('.item').count();

// Is visible
const visible = await page.locator('.element').isVisible();

// Is enabled
const enabled = await page.locator('button').isEnabled();

// Is checked
const checked = await page.locator('input').isChecked();

// Evaluate
const result = await page.evaluate(() => {
  return document.title;
});

// Evaluate with element
const text = await page.locator('.element').evaluate(el => el.textContent);
```

## Screenshots & Videos

```typescript
// Full page screenshot
await page.screenshot({ path: 'screenshot.png', fullPage: true });

// Element screenshot
await page.locator('.element').screenshot({ path: 'element.png' });

// Screenshot to buffer
const buffer = await page.screenshot();

// Video recording (in config)
use: {
  video: 'on',
  video: 'retain-on-failure',
  video: 'on-first-retry',
}
```

## Multiple Pages

```typescript
// Listen for popup
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.click('a[target="_blank"]')
]);

// Work with popup
await popup.waitForLoadState();
await popup.click('button');

// Close popup
await popup.close();
```

## Network

```typescript
// Wait for request
await page.waitForRequest('**/api/data');

// Wait for response
const response = await page.waitForResponse('**/api/data');
const json = await response.json();

// Mock response
await page.route('**/api/data', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'mocked' })
  });
});

// Abort requests
await page.route('**/*.{png,jpg}', route => route.abort());
```

## Browser Context & Storage

```typescript
// Local storage
await page.evaluate(() => localStorage.setItem('key', 'value'));
const value = await page.evaluate(() => localStorage.getItem('key'));

// Session storage
await page.evaluate(() => sessionStorage.setItem('key', 'value'));

// Cookies
await context.addCookies([{
  name: 'token',
  value: 'abc123',
  url: 'https://example.com'
}]);

const cookies = await context.cookies();
```

## Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test.beforeAll(async () => {
    // Runs once before all tests
  });

  test.beforeEach(async ({ page }) => {
    // Runs before each test
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    // Runs after each test
  });

  test.afterAll(async () => {
    // Runs once after all tests
  });

  test('test case', async ({ page }) => {
    // Test code
  });

  test.skip('skipped test', async ({ page }) => {
    // This test will be skipped
  });

  test.fixme('broken test', async ({ page }) => {
    // This test is marked as fixme
  });

  test.only('focused test', async ({ page }) => {
    // Only this test will run
  });
});
```

## Debugging

```typescript
// Pause execution
await page.pause();

// Debug specific locator
await page.locator('.element').highlight();

// Console log
console.log(await page.locator('.title').textContent());

// Step through with debugger
// Run: npm run test:e2e:debug

// Trace viewer
// Config:
use: {
  trace: 'on-first-retry',
}
```

## Best Practices

```typescript
// ✅ Good - Specific locator
await page.getByRole('button', { name: 'Submit' });

// ❌ Bad - Fragile selector
await page.click('.css-1234567');

// ✅ Good - Wait for element
await page.locator('button').waitFor();
await page.locator('button').click();

// ❌ Bad - Fixed timeout
await page.waitForTimeout(1000);
await page.click('button');

// ✅ Good - Auto-retry assertion
await expect(page.locator('.status')).toHaveText('Success');

// ❌ Bad - No auto-retry
const text = await page.locator('.status').textContent();
expect(text).toBe('Success');
```

## Resources

- [Playwright Docs](https://playwright.dev/)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Test Generator](https://playwright.dev/docs/codegen)






