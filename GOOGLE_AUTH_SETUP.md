# Google Authentication Setup Guide

This guide walks you through setting up Google OAuth authentication with domain restriction for Groupon employees only.

## Overview

The application uses Supabase Auth with Google OAuth provider to authenticate users. Only users with `@groupon.com` email addresses are allowed to access the application.

## Prerequisites

- Supabase account and project
- Google Cloud Console account with admin access
- Groupon Google Workspace domain access (for domain restriction)

## Step 1: Configure Google Cloud Console

### 1.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project for your application
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **Internal** (for Groupon employees only)
   - Fill in the required fields:
     - App name: `Groupon Admin Portal`
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`

### 1.2 Configure OAuth Client

1. Select **Web application** as the application type
2. Name: `Groupon Admin Portal - Supabase`
3. Configure **Authorized JavaScript origins**:
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co
   http://localhost:5173 (for local development)
   ```
4. Configure **Authorized redirect URIs**:
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback (for local Supabase)
   ```
5. Click **Create**
6. **Save the Client ID and Client Secret** - you'll need these for Supabase

## Step 2: Configure Supabase Authentication

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click to expand
5. Toggle **Enable Sign in with Google** to ON

### 2.2 Add Google OAuth Credentials

1. In the Google provider settings:
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console
2. Click **Save**

### 2.3 Configure Redirect URLs (Optional)

If needed, add your application URLs to the allowed redirect URLs:
1. Go to **Authentication** > **URL Configuration**
2. Add your site URLs:
   - Production: `https://your-domain.com`
   - Development: `http://localhost:5173`

## Step 3: Configure Environment Variables

### 3.1 Get Supabase Credentials

1. In Supabase Dashboard, go to **Settings** > **API**
2. Copy the following:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (the long key starting with `eyJ...`)

### 3.2 Create Environment File

Create `frontend/.env.local` (for local development):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3.3 Configure Vercel (for production)

In your Vercel dashboard:
1. Go to **Project Settings** > **Environment Variables**
2. Add the following variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
3. Redeploy your application

## Step 4: Domain Restriction Implementation

The application implements domain restriction at two levels:

### 4.1 OAuth Level (Google Console)

The authentication request includes the `hd` (hosted domain) parameter:
```typescript
queryParams: {
  hd: 'groupon.com', // Restricts to Groupon domain
}
```

This parameter **suggests** to Google that only Groupon accounts should be shown, but doesn't enforce it.

### 4.2 Application Level (Enforced)

The application enforces domain restriction in `AuthContext.tsx`:

```typescript
const checkGrouponDomain = (user: User | null | undefined) => {
  if (!user || !user.email) {
    setIsGrouponUser(false);
    return;
  }

  // Check if email ends with @groupon.com
  const isGroupon = user.email.toLowerCase().endsWith('@groupon.com');
  setIsGrouponUser(isGroupon);

  // If user is authenticated but not a Groupon user, sign them out
  if (!isGroupon && supabase) {
    console.warn('Non-Groupon user detected, signing out:', user.email);
    supabase.auth.signOut();
  }
};
```

This ensures that even if a non-Groupon user somehow gets through the OAuth flow, they will be immediately signed out.

## Step 5: Test the Implementation

### 5.1 Start Local Development

```bash
cd frontend
npm run dev
```

### 5.2 Test Authentication Flow

1. Navigate to `http://localhost:5173`
2. You should be redirected to the login page
3. Click "Sign in with Google"
4. You should see only Groupon Google accounts (if configured correctly)
5. Sign in with your `@groupon.com` account
6. You should be redirected back to the application

### 5.3 Test Domain Restriction

1. Try signing in with a non-Groupon email (if OAuth allows it)
2. The application should immediately sign you out
3. Check the browser console for the warning message

## Step 6: Configure Row Level Security (RLS) in Supabase

For additional security, you can configure RLS policies in Supabase:

### 6.1 Enable RLS on Tables

```sql
-- Enable RLS on all tables
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
-- Add other tables as needed
```

### 6.2 Create Policies Based on User Email

```sql
-- Example: Allow Groupon users to read deals
CREATE POLICY "Allow groupon users to read deals"
ON deals FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@groupon.com'
);

-- Example: Allow all authenticated users to insert
CREATE POLICY "Allow authenticated users to insert deals"
ON deals FOR INSERT
TO authenticated
WITH CHECK (true);
```

## Troubleshooting

### Issue: OAuth Error "redirect_uri_mismatch"

**Solution**: Ensure the redirect URI in Google Cloud Console exactly matches:
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

### Issue: Users Can Sign In with Non-Groupon Accounts

**Solution**: 
1. Ensure OAuth consent screen is set to **Internal** in Google Cloud Console
2. Verify domain restriction code in `AuthContext.tsx`
3. Check that the `hd` parameter is being sent in the OAuth request

### Issue: "Supabase not configured" Warning

**Solution**: 
1. Verify environment variables are set correctly
2. Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are prefixed with `VITE_`
3. Restart the development server after adding environment variables

### Issue: Infinite Redirect Loop

**Solution**:
1. Check browser console for errors
2. Verify Supabase redirect URLs are configured correctly
3. Clear browser cache and cookies
4. Check that the login page route (`/login`) is public in `App.tsx`

## Security Best Practices

1. **Never commit** `.env.local` files to version control
2. **Rotate credentials** periodically
3. **Enable MFA** for Google Workspace accounts
4. **Monitor authentication logs** in Supabase Dashboard
5. **Implement rate limiting** for login attempts
6. **Use HTTPS** in production (Vercel does this by default)
7. **Review RLS policies** regularly

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

## Support

For issues specific to:
- **Supabase**: Contact Supabase support or check their Discord
- **Google OAuth**: Review Google Cloud Console documentation
- **Application**: Contact the development team




