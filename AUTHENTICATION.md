# Authentication Setup

## Overview

The application uses **environment-aware authentication**:
- **Localhost**: Authentication is automatically bypassed for easier development
- **Production**: Google OAuth is required to protect Supabase data

## Local Development

When running on `localhost` or `127.0.0.1`, the app automatically:
- Bypasses Google OAuth login
- Creates a mock authenticated user (`dev@groupon.com`)
- Loads all data from Supabase normally
- No login required!

Just run `npm run dev` and navigate to `http://localhost:3000` - you'll be logged in automatically.

## Production Deployment

In production (deployed to Vercel, etc.), the app:
- Requires Google OAuth authentication
- Only allows `@groupon.com` or `@krm.sk` email domains
- Protects Supabase data from unauthorized access
- Redirects unauthenticated users to `/login`

## Testing with Playwright

For automated E2E tests, authentication bypass is also enabled when:
- URL contains `?test_auth=bypass`
- localStorage has `test_auth_bypass=true`
- Playwright sets `window.__PLAYWRIGHT_TEST_MODE__ = true`

Example test:
```typescript
test('my test', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_TEST_MODE__ = true;
  });
  await page.goto('/deals');
  // Now authenticated automatically
});
```

## Security Notes

⚠️ **IMPORTANT**: The localhost bypass is safe because:
1. Supabase connection requires environment variables (not committed to git)
2. Only works when hostname is literally `localhost` or `127.0.0.1`
3. Production deployments have different hostnames (vercel.app, custom domains)
4. Row Level Security (RLS) policies in Supabase provide additional protection

## Configuration Files

- `frontend/src/contexts/AuthContext.tsx` - Authentication logic and bypass
- `frontend/src/components/ProtectedRoute.tsx` - Route protection
- `.env` - Supabase credentials (not in git)
