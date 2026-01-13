# Testing

## Overview

This project uses Playwright for end-to-end testing with support for multiple browsers and devices.

## Setup

### Install Playwright

```bash
cd frontend
npm install
npx playwright install  # Install browser binaries
```

### Run Tests

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- deals.spec.ts

# Run in specific browser
npm run test:e2e -- --project=chromium

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Debug mode
npm run test:e2e -- --debug
```

## Test Structure

Tests are in `frontend/e2e/`:

```
frontend/e2e/
├── README.md                    # E2E testing guide
├── QUICK_REFERENCE.md          # Quick commands
├── example.spec.ts             # Basic tests
├── navigation.spec.ts          # Navigation tests
├── dashboard.spec.ts           # Dashboard tests
├── deals.spec.ts               # Deals page tests
├── accounts.spec.ts            # Accounts tests
└── ...
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup - runs before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/deals');
    
    // Act
    await page.click('button');
    
    // Assert
    await expect(page.locator('h1')).toHaveText('Deals');
  });
});
```

### Authentication Bypass for Tests

For tests that don't specifically test authentication:

```typescript
test.beforeEach(async ({ page }) => {
  // Enable test mode - bypasses authentication
  await page.addInitScript(() => {
    localStorage.setItem('test_auth_bypass', 'true');
    (window as any).__PLAYWRIGHT_TEST_MODE__ = true;
  });
  
  await page.goto('/');
});
```

### Common Patterns

#### Wait for Network Idle
```typescript
await page.goto('/deals');
await page.waitForLoadState('networkidle');
```

#### Interact with Elements
```typescript
// Click
await page.click('button:has-text("Submit")');

// Type
await page.fill('input[name="search"]', 'test');

// Select
await page.selectOption('select', 'option-value');
```

#### Assertions
```typescript
// Visibility
await expect(page.locator('.loading')).toBeVisible();
await expect(page.locator('.error')).not.toBeVisible();

// Text
await expect(page.locator('h1')).toHaveText('Dashboard');
await expect(page.locator('.count')).toContainText('42');

// URL
await expect(page).toHaveURL(/.*deals/);

// Attributes
await expect(page.locator('input')).toHaveAttribute('disabled');
```

## Configuration

### Playwright Config

File: `frontend/playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
```

## CI/CD Integration

### GitHub Actions

File: `.github/workflows/playwright.yml`

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      - name: Run tests
        run: cd frontend && npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Test Reports

### HTML Report

After running tests:

```bash
npx playwright show-report
```

This opens an interactive HTML report with:
- Test results
- Screenshots of failures
- Network logs
- Console logs
- Trace viewer

### Trace Viewer

For failed tests with traces:

```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

## Debugging

### Debug Mode

```bash
npm run test:e2e -- --debug
```

This opens:
- Playwright Inspector
- Step-by-step execution
- Selector playground

### Screenshots

Automatically taken on failure and saved to `test-results/`

### Console Logs

Capture console output in tests:

```typescript
test('logs console messages', async ({ page }) => {
  const messages: string[] = [];
  
  page.on('console', msg => {
    messages.push(msg.text());
  });
  
  await page.goto('/');
  
  console.log('Console messages:', messages);
});
```

## Best Practices

### 1. Use Data Test IDs

```tsx
// Component
<button data-testid="submit-button">Submit</button>

// Test
await page.click('[data-testid="submit-button"]');
```

### 2. Avoid Hard Waits

❌ **Bad:**
```typescript
await page.waitForTimeout(5000);
```

✅ **Good:**
```typescript
await page.waitForLoadState('networkidle');
await expect(page.locator('.content')).toBeVisible();
```

### 3. Use Specific Selectors

❌ **Bad:**
```typescript
await page.click('button');  // Which button?
```

✅ **Good:**
```typescript
await page.click('button:has-text("Submit")');
await page.click('[data-testid="submit-button"]');
```

### 4. Test User Flows, Not Implementation

Focus on what users do, not how the code works internally.

### 5. Keep Tests Independent

Each test should be able to run in isolation.

## Common Issues

### Test Timeout

**Problem**: Test exceeds 30s timeout

**Solution**: 
- Increase timeout: `test.setTimeout(60000)`
- Or optimize test to be faster
- Check if app is actually loading

### Element Not Found

**Problem**: `element(s) not found` error

**Solution**:
- Wait for element: `await page.waitForSelector('.element')`
- Check if auth bypass is configured
- Verify element actually renders

### Flaky Tests

**Problem**: Tests pass/fail randomly

**Solutions**:
- Add proper waits (`waitForLoadState`, `waitForSelector`)
- Avoid `waitForTimeout`
- Use `toBeVisible()` assertions
- Check for race conditions

## Authentication in Tests

### Test Mode

The app automatically bypasses authentication when:
1. `localStorage.getItem('test_auth_bypass') === 'true'`
2. `(window as any).__PLAYWRIGHT_TEST_MODE__ === true`
3. `window.location.search.includes('test_auth=bypass')`

### Enable in Tests

```typescript
await page.addInitScript(() => {
  localStorage.setItem('test_auth_bypass', 'true');
  (window as any).__PLAYWRIGHT_TEST_MODE__ = true;
});
```

### Navigate with Query Param

```typescript
await page.goto('/deals?test_auth=bypass');
```

## Useful Commands

```bash
# Run tests in UI mode (interactive)
npx playwright test --ui

# Generate tests by recording actions
npx playwright codegen http://localhost:3000

# List all tests
npx playwright test --list

# Run only tests with specific tag
npx playwright test --grep @smoke

# Update snapshots
npx playwright test --update-snapshots
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)
- [Test Generator](https://playwright.dev/docs/codegen)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
