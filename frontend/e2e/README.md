# End-to-End Testing with Playwright

This directory contains end-to-end tests for the application using Playwright.

## Setup

Playwright has been installed and configured. All browsers (Chromium, Firefox, WebKit) are installed.

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see the browser)
```bash
npm run test:e2e:headed
```

### Run specific test file
```bash
npx playwright test e2e/dashboard.spec.ts
```

### Run tests for a specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug tests
```bash
npm run test:e2e:debug
```

## Test Structure

- `example.spec.ts` - Basic app loading tests
- `dashboard.spec.ts` - Dashboard page tests
- `deals.spec.ts` - Deals page tests
- `accounts.spec.ts` - Accounts page tests
- `navigation.spec.ts` - Navigation and routing tests
- `theme.spec.ts` - Theme toggle functionality tests
- `test-utils.ts` - Shared test utilities and fixtures

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Your test code here
    await expect(page).toHaveURL(/expected-url/);
  });
});
```

### Using Test Utils

```typescript
import { test, expect, waitForNetworkIdle, setLocalStorageItem } from './test-utils';

test('example with utils', async ({ page }) => {
  await setLocalStorageItem(page, 'theme', 'dark');
  await page.goto('/');
  await waitForNetworkIdle(page);
  // Continue testing...
});
```

## Configuration

The Playwright configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:5173` (Vite dev server)
- **Test Directory**: `./e2e`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Dev Server**: Automatically starts the Vite dev server before tests

## CI/CD

The configuration is optimized for CI environments:
- Tests run with retries on CI
- Screenshots and traces are captured on failure
- HTML reports are generated

## Best Practices

1. **Use meaningful test names** - Describe what the test does
2. **Wait for network idle** - Use `waitForLoadState('networkidle')` after navigation
3. **Use specific selectors** - Prefer data-testid or accessible roles
4. **Keep tests independent** - Each test should be able to run in isolation
5. **Clean up state** - Use `beforeEach` to reset state if needed
6. **Use page object pattern** - For complex pages, create page objects
7. **Test user flows** - Focus on what users actually do

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is starting properly
- Use `--debug` flag to see what's happening

### Element not found
- Use `page.waitForSelector()` to wait for elements
- Check if element selectors are correct
- Use Playwright Inspector to debug: `npx playwright test --debug`

### Tests flaky
- Add appropriate waits (`waitForLoadState`, `waitForSelector`)
- Use `expect.toPass()` for eventually consistent assertions
- Check for race conditions

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)






