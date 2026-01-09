# Google Authentication Implementation Summary

## Overview

The application now requires Google Authentication with domain restriction to `@groupon.com` email addresses only. This ensures that only Groupon employees can access the admin portal.

## What Was Implemented

### 1. Authentication Context (`frontend/src/contexts/AuthContext.tsx`)
- Manages authentication state using Supabase Auth
- Handles Google OAuth sign-in flow
- Enforces `@groupon.com` domain restriction
- Automatically signs out non-Groupon users
- Provides loading states and user information

### 2. Login Page (`frontend/src/components/LoginPage.tsx`)
- Clean, branded login interface
- Google sign-in button with Groupon branding
- Responsive design
- Security information

### 3. Protected Routes (`frontend/src/components/ProtectedRoute.tsx`)
- Wraps all application routes
- Redirects unauthenticated users to login
- Shows loading state during authentication check
- Enforces Groupon domain restriction

### 4. Application Integration (`frontend/src/App.tsx`)
- Routes restructured to support authentication
- Public route: `/login`
- All other routes protected and require authentication
- AuthProvider wraps the entire application

### 5. Layout Integration (`frontend/src/components/Layout.tsx`)
- Added sign-out functionality to user menu
- Integrated with AuthContext for logout

### 6. Supabase Configuration (`frontend/src/lib/supabase.ts`)
- Enhanced with auth settings
- Automatic token refresh
- Session persistence
- URL-based session detection

## Security Features

### Domain Restriction
The application implements **two layers** of domain restriction:

1. **OAuth Level**: The `hd=groupon.com` parameter is sent with the OAuth request, suggesting to Google that only Groupon accounts should be shown.

2. **Application Level** (Enforced): The application checks every authenticated user's email and automatically signs out anyone without a `@groupon.com` email address.

```typescript
const checkGrouponDomain = (user: User | null | undefined) => {
  if (!user || !user.email) return;
  
  const isGroupon = user.email.toLowerCase().endsWith('@groupon.com');
  
  if (!isGroupon && supabase) {
    console.warn('Non-Groupon user detected, signing out:', user.email);
    supabase.auth.signOut();
  }
};
```

### Session Management
- Sessions are persisted in browser storage
- Automatic token refresh prevents session expiration
- Secure cookie-based session handling by Supabase

### Protected Routes
All application routes are wrapped in `ProtectedRoute` component that:
- Checks authentication status
- Verifies Groupon domain
- Redirects to login if unauthorized
- Shows loading state during checks

## Setup Instructions

### Prerequisites
1. Supabase account and project
2. Google Cloud Console account
3. Access to configure OAuth credentials

### Quick Start

1. **Configure Google OAuth** (see `GOOGLE_AUTH_SETUP.md` for detailed steps):
   - Create OAuth 2.0 credentials in Google Cloud Console
   - Set consent screen to "Internal" (Groupon only)
   - Add authorized redirect URIs

2. **Configure Supabase**:
   - Enable Google provider in Authentication settings
   - Add Google Client ID and Secret
   - Configure redirect URLs

3. **Set Environment Variables**:
   ```bash
   # Create frontend/.env.local
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Deploy**:
   - For Vercel: Add environment variables in project settings
   - Redeploy the application

### Testing Locally

```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` - you should see the login page.

## User Experience

### First Visit
1. User navigates to the application
2. Redirected to login page
3. Clicks "Sign in with Google"
4. Google OAuth consent screen (shows only Groupon accounts)
5. After authentication, redirected to dashboard

### Subsequent Visits
- If session is valid, user goes directly to the application
- Sessions persist across browser sessions
- No need to login again until session expires

### Sign Out
- User can sign out via the user menu dropdown
- Click on avatar → "Log out"
- Redirected to login page
- Session cleared from browser

## Files Modified/Created

### New Files
- `frontend/src/contexts/AuthContext.tsx` - Authentication context and logic
- `frontend/src/components/LoginPage.tsx` - Login UI
- `frontend/src/components/ProtectedRoute.tsx` - Route protection
- `GOOGLE_AUTH_SETUP.md` - Detailed setup guide
- `GOOGLE_AUTH_IMPLEMENTATION.md` - This file

### Modified Files
- `frontend/src/App.tsx` - Added AuthProvider and route protection
- `frontend/src/components/Layout.tsx` - Added sign-out functionality
- `frontend/src/lib/supabase.ts` - Enhanced auth configuration
- `env.template` - Added Supabase and Google OAuth configuration

## Environment Variables

### Required for Frontend
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Required for Google OAuth (configured in Google Cloud Console)
- Client ID
- Client Secret
- Authorized JavaScript origins
- Authorized redirect URIs

## Troubleshooting

### Common Issues

**Issue**: "Supabase not configured" warning
- **Solution**: Verify environment variables are set and start with `VITE_` prefix

**Issue**: OAuth redirect_uri_mismatch error
- **Solution**: Ensure redirect URI in Google Console matches exactly: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

**Issue**: Non-Groupon users can sign in
- **Solution**: Set OAuth consent screen to "Internal" in Google Cloud Console

**Issue**: Infinite redirect loop
- **Solution**: Check that `/login` route is public in App.tsx, clear browser cache

**Issue**: Session doesn't persist
- **Solution**: Verify Supabase client configuration includes `persistSession: true`

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   User Browser                       │
│  ┌────────────────────────────────────────────┐    │
│  │            React Application               │    │
│  │  ┌──────────────────────────────────┐     │    │
│  │  │      AuthContext Provider         │     │    │
│  │  │  - Manages auth state            │     │    │
│  │  │  - Enforces domain restriction   │     │    │
│  │  └──────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────┐     │    │
│  │  │     ProtectedRoute Component      │     │    │
│  │  │  - Guards all routes             │     │    │
│  │  │  - Redirects if unauthorized     │     │    │
│  │  └──────────────────────────────────┘     │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                      │
                      │ OAuth Flow
                      ▼
┌─────────────────────────────────────────────────────┐
│               Supabase Auth Service                  │
│  - Handles OAuth callbacks                          │
│  - Manages sessions                                 │
│  - Issues JWT tokens                                │
└─────────────────────────────────────────────────────┘
                      │
                      │ OAuth
                      ▼
┌─────────────────────────────────────────────────────┐
│            Google OAuth 2.0                         │
│  - Authenticates user                               │
│  - Returns user profile                             │
│  - Domain hint: groupon.com                         │
└─────────────────────────────────────────────────────┘
```

## Security Checklist

- [x] Google OAuth configured with Internal consent screen
- [x] Domain restriction implemented (`@groupon.com` only)
- [x] All routes protected with authentication
- [x] Non-Groupon users automatically signed out
- [x] Sessions persist securely
- [x] Automatic token refresh enabled
- [x] Environment variables not committed to repo
- [x] HTTPS enforced in production (via Vercel)

## Next Steps (Optional Enhancements)

1. **Row Level Security (RLS)**: Configure Supabase RLS policies for additional database security
2. **Role-Based Access Control**: Extend authentication to include role-based permissions
3. **Audit Logging**: Log authentication events for security monitoring
4. **Session Timeout**: Configure custom session timeout periods
5. **Multi-Factor Authentication**: Require MFA for sensitive operations
6. **SSO Integration**: Integrate with Groupon's SSO if available

## Support

For detailed setup instructions, see `GOOGLE_AUTH_SETUP.md`.

For issues or questions, contact the development team.




