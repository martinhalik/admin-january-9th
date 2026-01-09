# 🚀 Quick Vercel Setup (5 Minutes)

## Step 1: Verify Local Setup
```bash
./test-vercel-build.sh
```
✅ If this passes, you're ready to deploy!

## Step 2: Deploy to Vercel

### Option A: GitHub (Recommended)
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your repository
5. ✅ Vercel auto-detects settings from `vercel.json`

### Option B: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

## Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

### Required
- `OPENAI_API_KEY` - Your OpenAI API key
  - Get it: https://platform.openai.com/api-keys
  - Used for AI chat feature

### Optional
- `VITE_MAPTILER_API_KEY` - For maps (if used)
- `VITE_SUPABASE_URL` - For database (if used)
- `VITE_SUPABASE_ANON_KEY` - For database (if used)

⚠️ **Important**: After adding variables, redeploy!

## Step 4: Test Your Deployment

Visit your URL and test:
- ✅ Homepage loads
- ✅ Navigation works
- ✅ All pages accessible

Test API:
```bash
curl -X POST https://your-app.vercel.app/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

## ✅ Done!

Your app is live! 🎉

---

## Need Help?

- **Build Issues**: Check `VERCEL_DEBUG.md`
- **Detailed Guide**: See `VERCEL_DEPLOYMENT.md`
- **Local Testing**: Run `./test-vercel-build.sh`

## Common Issues

| Problem | Solution |
|---------|----------|
| Build fails | Run `./test-vercel-build.sh` locally to see exact error |
| API returns 500 | Add `OPENAI_API_KEY` in Vercel env vars and redeploy |
| Routes return 404 | Already fixed in `vercel.json`, just redeploy |

---

**Next Steps**: 
- Set up custom domain
- Monitor usage in Vercel Dashboard
- Check Function logs for any errors







