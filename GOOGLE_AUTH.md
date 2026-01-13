# Google Authentication

## Overview

The application uses Google OAuth authentication via Supabase Auth with domain restriction for `@groupon.com` and `@krm.sk` emails.

## Quick Reference

### For Developers

**Localhost**: Authentication is automatically bypassed - just run `npm run dev` and go to http://localhost:3000

**Production**: Requires Google OAuth with `@groupon.com` or `@krm.sk` email

### Key Components

1. **AuthContext** (`frontend/src/contexts/AuthContext.tsx`)
   - Manages authentication state
   - Provides `signInWithGoogle()` and `signOut()` functions
   - Automatically bypasses auth on localhost
   - Handles OAuth redirect URLs intelligently

2. **ProtectedRoute** (`frontend/src/components/ProtectedRoute.tsx`)
   - Wraps protected routes
   - Redirects unauthenticated users to `/login`

3. **LoginPage** (`frontend/src/components/LoginPage.tsx`)
   - Google sign-in button
   - Groupon IQ branding

## Setup (One-time)

### 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID:
   - **Type**: Web application
   - **Name**: Groupon Admin Portal
   - **Authorized JavaScript origins**:
     ```
     https://YOUR_SUPABASE_PROJECT.supabase.co
     https://your-production-domain.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
     ```
3. Save Client ID and Client Secret

### 2. Supabase Configuration

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Authentication > Providers > Google
3. Enter Client ID and Client Secret from step 1
4. Save

### 3. Environment Variables

**Frontend** (`frontend/.env.local`):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Production** (Vercel):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_PRODUCTION_URL=https://your-domain.vercel.app
```

### 4. Supabase Redirect URLs

Add to Authentication > URL Configuration > Redirect URLs:
```
https://your-production-domain.vercel.app
https://your-production-domain.vercel.app/**
```

## Usage

### In Components

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, signInWithGoogle, signOut, isGrouponUser } = useAuth();
  
  if (!user) {
    return <button onClick={signInWithGoogle}>Sign In</button>;
  }
  
  return (
    <div>
      <p>Welcome {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protect Routes

```tsx
<Route path="/*" element={
  <ProtectedRoute>
    <YourApp />
  </ProtectedRoute>
} />
```

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google"
2. Redirects to Google OAuth consent screen
3. User authorizes with Google account
4. Google redirects back to Supabase callback URL
5. Supabase processes OAuth and creates session
6. User redirected back to application
7. `AuthContext` detects session and sets user state

### Localhost Bypass

For development convenience, authentication is automatically bypassed on localhost:

```typescript
if (isLocalhost || isTestMode) {
  // Create mock user for development
  const mockUser = {
    id: 'emp-ceo-1',
    email: 'dev@groupon.com',
    // ...
  };
  setUser(mockUser);
  return;
}
```

### Domain Restriction

Only `@groupon.com` and `@krm.sk` emails are allowed:

```typescript
const checkGrouponDomain = (user) => {
  const isGroupon = 
    user.email.endsWith('@groupon.com') || 
    user.email.endsWith('@krm.sk');
  
  if (!isGroupon) {
    console.warn('Non-Groupon user, signing out');
    supabase.auth.signOut();
  }
};
```

## OAuth Redirect Fix

**Recent Fix**: The application now correctly redirects back to the production URL after authentication (previously redirected to localhost:3000).

**How it works**:
1. Checks for `VITE_PRODUCTION_URL` environment variable
2. Falls back to `VITE_VERCEL_URL` for Vercel deployments
3. Falls back to `window.location.origin` for localhost

See `AUTHENTICATION_REDIRECT_FIX_COMPLETE.md` for details.

## Testing

### E2E Tests with Auth Bypass

```typescript
await page.addInitScript(() => {
  localStorage.setItem('test_auth_bypass', 'true');
  (window as any).__PLAYWRIGHT_TEST_MODE__ = true;
});
```

### Test Mode Query Parameter

Navigate to `?test_auth=bypass` to enable auth bypass for testing.

## Troubleshooting

### "Access denied" on production

**Cause**: Non-Groupon email tried to sign in

**Solution**: Use `@groupon.com` or `@krm.sk` email

### Redirects to localhost:3000 after OAuth

**Cause**: `VITE_PRODUCTION_URL` not set in Vercel

**Solution**: Add environment variable and redeploy

### "Supabase not configured" error

**Cause**: Missing environment variables

**Solution**: Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Authentication works on localhost but not production

**Causes**:
1. Production URL not in Supabase redirect URLs
2. Production URL not in Google OAuth origins
3. Environment variables not set in Vercel

**Solution**: Verify all configuration steps above

## Security

- ✅ Domain restriction: Only `@groupon.com` and `@krm.sk`
- ✅ OAuth 2.0 via Google
- ✅ Supabase handles token management
- ✅ No passwords stored
- ✅ Automatic session refresh
- ✅ Protected routes on frontend
- ✅ Row-level security on database (Supabase)

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ signInWithGoogle()
       ▼
┌─────────────┐
│  Supabase   │ ◄─── OAuth Client ID/Secret
│    Auth     │
└──────┬──────┘
       │ Redirect to Google
       ▼
┌─────────────┐
│   Google    │
│    OAuth    │
└──────┬──────┘
       │ User authorizes
       ▼
┌─────────────┐
│  Supabase   │ ◄─── Callback from Google
│  Callback   │
└──────┬──────┘
       │ Create session
       ▼
┌─────────────┐
│   Browser   │ ◄─── Redirect with session
│ (AuthContext)│
└─────────────┘
```

## Files

- `frontend/src/contexts/AuthContext.tsx` - Auth state management
- `frontend/src/components/ProtectedRoute.tsx` - Route protection
- `frontend/src/components/LoginPage.tsx` - Login UI
- `frontend/src/lib/supabase.ts` - Supabase client

## Related Documentation

- `GOOGLE_AUTH_SETUP.md` - Detailed setup instructions
- `AUTHENTICATION.md` - General authentication overview
- `AUTHENTICATION_REDIRECT_FIX_COMPLETE.md` - Recent redirect fix
