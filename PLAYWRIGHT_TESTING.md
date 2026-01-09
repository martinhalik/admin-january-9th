# Playwright End-to-End Testing

This project uses Playwright for end-to-end testing. Playwright is a modern testing framework that allows you to test your application across all major browsers.

## Quick Start

### Running Tests

```bash
# Run all E2E tests
cd frontend
npm run test:e2e

# Run tests with UI (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see the browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Run tests for specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# View test report
npm run test:e2e:report
```

## What's Included

### Test Files

Located in `frontend/e2e/`:

- **example.spec.ts** - Basic app loading and smoke tests
- **dashboard.spec.ts** - Dashboard page functionality
- **deals.spec.ts** - Deals page and search functionality
- **accounts.spec.ts** - Accounts page and filtering
- **navigation.spec.ts** - Routing and browser navigation
- **theme.spec.ts** - Theme toggle and persistence
- **test-utils.ts** - Shared test utilities

### Configuration

- **playwright.config.ts** - Main Playwright configuration
- Tests run on Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari
- Automatic dev server startup before tests
- Screenshots and traces on failure
- HTML reports generated automatically

## Test Features

### Automatic Dev Server
The dev server starts automatically when you run tests - no need to start it manually!

### Multi-Browser Testing
Tests run on all major browsers:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile browsers (Chrome & Safari)

### Visual Debugging
- Use `--ui` flag to see tests run in real-time
- Use `--headed` flag to see the actual browser
- Use `--debug` flag to step through tests

### Reports & Screenshots
- HTML reports generated after each run
- Screenshots captured on test failure
- Trace files for debugging failures

## Writing Tests

### Basic Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-page');
    await page.waitForLoadState('networkidle');
  });

  test('should work correctly', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/success/);
  });
});
```

### Using Test Utils

```typescript
import { test, expect } from './test-utils';

test('custom test', async ({ page }) => {
  // Use helper functions from test-utils
  await page.goto('/');
  // Your test logic
});
```

## Best Practices

1. **Wait for page load** - Always use `waitForLoadState('networkidle')` after navigation
2. **Use specific selectors** - Prefer data-testid attributes or accessible roles
3. **Test user flows** - Focus on actual user behavior
4. **Keep tests isolated** - Each test should work independently
5. **Use beforeEach** - Set up common state in beforeEach blocks
6. **Meaningful assertions** - Use clear, descriptive expect statements

## CI/CD Integration

The configuration is optimized for CI:
- Tests retry automatically on CI (2 retries)
- Serial execution on CI to avoid resource issues
- Screenshots and traces captured on failure
- HTML reports for easy debugging

## Debugging Tips

### Test is timing out
```bash
# Run with more time
npx playwright test --timeout=60000
```

### Can't find element
```bash
# Run in debug mode to inspect
npm run test:e2e:debug
```

### Test is flaky
- Add explicit waits with `waitForSelector`
- Use `waitForLoadState('networkidle')`
- Check for race conditions

### See what's happening
```bash
# Run in headed mode
npm run test:e2e:headed

# Or use UI mode
npm run test:e2e:ui
```

## Advanced Features

### Parallel Execution
Tests run in parallel by default for speed. Configure in `playwright.config.ts`:

```typescript
workers: process.env.CI ? 1 : undefined
```

### Custom Fixtures
Add custom fixtures in `test-utils.ts` for common setup:

```typescript
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Set up authentication
    await page.goto('/login');
    // ... login logic
    await use(page);
  },
});
```

### Page Objects
For complex pages, create page object classes:

```typescript
class DashboardPage {
  constructor(private page: Page) {}
  
  async navigate() {
    await this.page.goto('/dashboard');
  }
  
  async clickNewDeal() {
    await this.page.click('[data-testid="new-deal-btn"]');
  }
}
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Test Generator](https://playwright.dev/docs/codegen) - Generate tests by recording

## Troubleshooting

### Installation Issues
```bash
# Reinstall browsers
npx playwright install --with-deps
```

### Port Conflicts
If port 5173 is in use, update `playwright.config.ts`:
```typescript
baseURL: 'http://localhost:YOUR_PORT',
```

### Network Issues
Adjust timeouts in `playwright.config.ts`:
```typescript
timeout: 30000, // 30 seconds
```

## Getting Help

- Check the [Playwright docs](https://playwright.dev/)
- Use `--debug` flag to step through tests
- View HTML report: `npm run test:e2e:report`
- Check test output and screenshots in `test-results/`

---

**Next Steps:**
1. Run `npm run test:e2e:ui` to see tests in action
2. Explore existing test files in `frontend/e2e/`
3. Write your own tests for new features
4. Add data-testid attributes to make testing easier






