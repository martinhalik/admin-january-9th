# Migration Guide: Adding Google Authentication

If you already have this application deployed, follow these steps to add Google Authentication.

## Before You Begin

⚠️ **Warning**: Enabling authentication will lock out all users until they sign in with Google.

**Recommended approach**: Test in a separate Supabase project first, then apply to production.

## Migration Steps

### Step 1: Backup Current Environment
```bash
# Save your current .env.local (if it exists)
cp frontend/.env.local frontend/.env.local.backup

# Note: Git will ignore .env files, so manual backup is needed
```

### Step 2: Set Up Google OAuth (15 minutes)

Follow the detailed guide in [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md):

1. **Google Cloud Console**:
   - Create OAuth 2.0 credentials
   - Set consent screen to "Internal"
   - Configure redirect URIs

2. **Supabase Dashboard**:
   - Create account/project if needed
   - Enable Google authentication provider
   - Add Google OAuth credentials
   - Copy Supabase URL and anon key

### Step 3: Update Environment Variables

**Local Development** (`frontend/.env.local`):
```bash
# Add these new variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Keep existing variables
VITE_API_URL=http://localhost:4000
VITE_MAPTILER_API_KEY=your-existing-key
```

**Production (Vercel)**:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Keep existing variables unchanged

### Step 4: Test Locally

```bash
cd frontend
npm run dev
```

Expected behavior:
1. ✅ App redirects to login page
2. ✅ Can sign in with @groupon.com account
3. ✅ Redirected to dashboard after login
4. ✅ Can sign out via user menu
5. ✅ Session persists on page refresh

### Step 5: Update Database Policies (Optional but Recommended)

Run `supabase/rls-policies-google-auth.sql` in Supabase SQL Editor:

```bash
# This will:
# - Enable Row Level Security
# - Restrict database access to Groupon users only
# - Add helper functions for email checks
```

### Step 6: Deploy to Production

**If everything works locally:**

```bash
# Commit changes
git add .
git commit -m "Add Google Authentication with Groupon domain restriction"

# Push to trigger Vercel deployment
git push origin main
```

**Verify deployment**:
1. Vercel will automatically deploy
2. Check deployment logs for errors
3. Test authentication in production URL

### Step 7: Communicate with Users

**Before deployment**, notify users:
```
Subject: New Authentication Required for Admin Portal

The admin portal now requires Google Authentication for enhanced security.

What you need to know:
- Sign in with your @groupon.com Google account
- Only Groupon employees can access the portal
- Sessions will persist so you won't need to login frequently

If you encounter issues, contact [your-team]
```

## Rollback Plan

If you need to rollback:

### Option 1: Quick Disable (Keep Code)

Comment out the auth check in `frontend/src/App.tsx`:

```typescript
// Temporarily disable auth
<Route
  path="/*"
  element={
    // <ProtectedRoute>  // Comment out
      <UserPreferencesProvider>
        {/* ... rest of code ... */}
      </UserPreferencesProvider>
    // </ProtectedRoute>  // Comment out
  }
/>
```

### Option 2: Full Rollback (Revert Code)

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-before-auth>
git push --force origin main  # ⚠️ Use with caution
```

## Troubleshooting

### Users Can't Sign In

**Check**:
1. Environment variables are set in Vercel
2. Redirect URI matches in Google Console
3. OAuth consent screen is "Internal"
4. Supabase Google provider is enabled

### Infinite Redirect Loop

**Fix**:
1. Clear browser cache and cookies
2. Verify `/login` route is public in App.tsx
3. Check Supabase redirect URLs are correct

### "Supabase not configured" Error

**Fix**:
1. Verify environment variables in Vercel
2. Check they start with `VITE_` prefix
3. Redeploy after adding variables

### Non-Groupon Users Can Access

**Fix**:
1. Set OAuth consent screen to "Internal"
2. Verify `checkGrouponDomain()` in AuthContext.tsx
3. Check browser console for warnings

## Verification Checklist

After migration, verify:

- [ ] Local development works with auth
- [ ] Can sign in with Groupon account
- [ ] Can sign out successfully
- [ ] Non-Groupon users are blocked
- [ ] Session persists after refresh
- [ ] Production deployment successful
- [ ] Environment variables set in Vercel
- [ ] All existing features still work
- [ ] Database access restricted (if RLS enabled)
- [ ] Users have been notified

## Data Migration

**Note**: This authentication system doesn't affect existing data.

- ✅ All deals, accounts, and other data remain unchanged
- ✅ No database schema changes required
- ✅ Existing functionality preserved
- ✅ Role simulation still works as before

The authentication layer is **additive** - it just gates access to the existing application.

## Performance Impact

Expected impact:
- **Load Time**: +200-500ms for initial auth check
- **API Calls**: +1 call per session (auth verification)
- **Bundle Size**: +15KB (Supabase client)

Minimal impact on user experience.

## Security Considerations

After enabling auth:

1. **Environment Variables**: Never commit `.env.local` files
2. **API Keys**: Rotate Supabase keys periodically
3. **Logs**: Monitor Supabase authentication logs
4. **RLS**: Enable Row Level Security for additional protection
5. **MFA**: Consider requiring MFA for admin users

## Support

Need help with migration?

1. **Setup Issues**: See [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md)
2. **Technical Details**: See [GOOGLE_AUTH_IMPLEMENTATION.md](GOOGLE_AUTH_IMPLEMENTATION.md)
3. **Quick Reference**: See [GOOGLE_AUTH_QUICK_REF.md](GOOGLE_AUTH_QUICK_REF.md)

## Timeline Estimate

| Step | Time | Can Skip? |
|------|------|-----------|
| Google OAuth setup | 10 min | No |
| Supabase setup | 5 min | No |
| Environment variables | 5 min | No |
| Local testing | 15 min | No |
| RLS policies | 10 min | Yes |
| Production deploy | 5 min | No |
| User notification | 10 min | Recommended |
| **Total** | **60 min** | |

## Post-Migration

After successful migration:

1. **Monitor**: Check Supabase auth logs for failed logins
2. **Optimize**: Enable RLS if not done yet
3. **Document**: Update internal docs with new login process
4. **Train**: Brief team on new authentication flow
5. **Review**: Schedule security review after 1 week

---

**Ready to migrate?** Follow the steps above and reach out if you need help!




