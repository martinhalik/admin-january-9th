# 🔐 Google Authentication - Quick Reference

## ✅ What's Been Done

✨ **Complete Google OAuth Integration with Groupon Domain Restriction**

### Files Created
- `frontend/src/contexts/AuthContext.tsx` - Auth state management
- `frontend/src/components/LoginPage.tsx` - Login UI
- `frontend/src/components/ProtectedRoute.tsx` - Route protection
- `GOOGLE_AUTH_SETUP.md` - Detailed setup guide
- `GOOGLE_AUTH_IMPLEMENTATION.md` - Implementation overview
- `supabase/rls-policies-google-auth.sql` - Database security policies

### Files Modified
- `frontend/src/App.tsx` - Added auth routing
- `frontend/src/components/Layout.tsx` - Added sign-out
- `frontend/src/lib/supabase.ts` - Enhanced auth config
- `env.template` - Added Supabase variables
- `README.md` - Updated with auth info

## 🚀 How to Set Up

### 1. Configure Google Cloud Console (5 minutes)
```
1. Create OAuth 2.0 Client ID
2. Set consent screen to "Internal"
3. Add redirect URIs:
   - https://YOUR_PROJECT.supabase.co/auth/v1/callback
   - http://localhost:54321/auth/v1/callback
4. Copy Client ID and Secret
```

### 2. Configure Supabase (3 minutes)
```
1. Enable Google provider in Authentication
2. Paste Client ID and Secret
3. Copy your project URL and anon key
```

### 3. Set Environment Variables (2 minutes)
```bash
# Create frontend/.env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### 4. Run the App
```bash
cd frontend
npm run dev
```

## 🔒 Security Features

| Feature | Status | Details |
|---------|--------|---------|
| Domain Restriction | ✅ | Only @groupon.com emails allowed |
| OAuth Level | ✅ | `hd=groupon.com` parameter sent |
| App Level | ✅ | Email validation + auto sign-out |
| Protected Routes | ✅ | All routes require authentication |
| Session Management | ✅ | Persistent + auto-refresh |
| RLS Policies | 📋 | Optional (see SQL file) |

## 🎯 Key Components

### AuthContext
```typescript
const { user, signInWithGoogle, signOut, isGrouponUser } = useAuth();
```

### ProtectedRoute
```typescript
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### Login Page
- Clean branded UI
- Google sign-in button
- Groupon-specific messaging
- Responsive design

## 📋 Testing Checklist

- [ ] Can navigate to app (redirects to login)
- [ ] Can click "Sign in with Google"
- [ ] See only Groupon accounts in OAuth
- [ ] Successfully sign in with @groupon.com
- [ ] Redirected to dashboard after login
- [ ] Can sign out via user menu
- [ ] Non-Groupon users are denied/signed out
- [ ] Session persists after browser refresh
- [ ] All routes are protected

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Supabase not configured" | Check env vars have `VITE_` prefix |
| "redirect_uri_mismatch" | Verify redirect URI in Google Console |
| Non-Groupon can sign in | Set consent screen to "Internal" |
| Infinite redirect loop | Clear cache, check `/login` is public |
| Session doesn't persist | Verify `persistSession: true` in config |

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `GOOGLE_AUTH_SETUP.md` | Complete step-by-step setup guide |
| `GOOGLE_AUTH_IMPLEMENTATION.md` | Technical overview & architecture |
| `supabase/rls-policies-google-auth.sql` | Database security policies |
| `env.template` | Environment variable reference |

## 🔐 Domain Restriction Flow

```
User clicks "Sign in with Google"
          ↓
OAuth request with hd=groupon.com
          ↓
Google shows only Groupon accounts
          ↓
User authenticates
          ↓
Supabase receives callback
          ↓
AuthContext checks email domain
          ↓
If @groupon.com → Allow access
If not → Sign out + redirect to login
```

## 💡 Pro Tips

1. **Test with Multiple Accounts**: Try both Groupon and non-Groupon emails
2. **Check Console Logs**: Look for "Non-Groupon user detected" warnings
3. **Clear Cache**: If stuck, clear browser cache and cookies
4. **Use Incognito**: Test fresh sessions without cached data
5. **Monitor Supabase**: Check Authentication logs in Supabase dashboard

## 🎨 Customization

### Change Branding
Edit `frontend/src/components/LoginPage.tsx`:
- Title: "Groupon Admin Portal"
- Subtitle: "Merchant & Deal Management System"
- Colors: Uses Groupon green (#007C1F)

### Add More Restrictions
Edit `frontend/src/contexts/AuthContext.tsx`:
- Add role checks
- Add IP restrictions
- Add time-based access
- Add MFA requirements

### Enhance Security
Run `supabase/rls-policies-google-auth.sql` to:
- Enable Row Level Security
- Restrict database access by email domain
- Add audit logging

## 📞 Support

Need help?
1. Read `GOOGLE_AUTH_SETUP.md` for detailed instructions
2. Check Supabase logs for auth errors
3. Review Google Cloud Console for OAuth issues
4. Contact the development team

## ✨ Next Steps (Optional)

- [ ] Configure Row Level Security (run SQL file)
- [ ] Set up role-based permissions
- [ ] Add MFA for sensitive operations
- [ ] Configure custom session timeouts
- [ ] Set up audit logging
- [ ] Add email notifications for login events

---

**Ready to deploy?** Set environment variables in Vercel and redeploy!




