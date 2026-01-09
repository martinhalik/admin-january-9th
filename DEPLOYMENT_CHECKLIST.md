# Pre-Deployment Checklist

Use this checklist before deploying to Vercel.

## ✅ Local Testing

- [ ] Run `./test-vercel-build.sh` successfully
- [ ] Frontend builds without errors: `cd frontend && npm run build`
- [ ] API TypeScript compiles: `cd api && npx tsc --noEmit`
- [ ] No console errors when testing locally: `npm run dev`
- [ ] All critical features work locally

## ✅ Code Quality

- [ ] No TypeScript errors
- [ ] No console.log statements (or intentional only)
- [ ] Code is committed to git
- [ ] `.env.local` not committed (in .gitignore)
- [ ] No sensitive data in code (API keys, passwords, etc.)

## ✅ Configuration Files

- [ ] `vercel.json` exists and is correct
- [ ] `.vercelignore` exists (excludes unnecessary files)
- [ ] `.nvmrc` exists (specifies Node 20)
- [ ] `package.json` has correct build scripts
- [ ] `api/package.json` has all dependencies
- [ ] `frontend/package.json` has all dependencies

## ✅ API Function

- [ ] `api/ai-chat.ts` exports default function
- [ ] Function handles CORS (allowCors wrapper)
- [ ] Function checks for OPENAI_API_KEY
- [ ] Function has proper error handling
- [ ] TypeScript compiles without errors

## ✅ Environment Variables

### Documented
- [ ] All required environment variables documented in `env.template`
- [ ] Instructions clear on where to set them (Vercel Dashboard)

### Have API Keys Ready
- [ ] **OpenAI API Key** (required)
  - Get from: https://platform.openai.com/api-keys
  - Used by: `/api/ai-chat`
  
- [ ] **MapTiler API Key** (optional)
  - Get from: https://www.maptiler.com/cloud/
  - Used by: Frontend maps
  
- [ ] **Supabase Credentials** (optional)
  - URL and Anon Key
  - Used by: Frontend database

## ✅ Frontend

- [ ] Build output directory correct: `frontend/dist`
- [ ] Assets included in build (images, videos)
- [ ] No broken imports or missing files
- [ ] Routes configured for SPA (in vercel.json)
- [ ] All pages accessible

## ✅ Git Repository

- [ ] All changes committed
- [ ] No uncommitted sensitive files
- [ ] `.gitignore` properly configured
- [ ] Pushed to remote (if using GitHub deployment)

## ✅ Vercel Account

- [ ] Vercel account created
- [ ] Logged in to Vercel CLI: `vercel login`
- [ ] OR: GitHub repository ready to connect

## ✅ Documentation Review

- [ ] Read `VERCEL_QUICKSTART.md`
- [ ] Understand `VERCEL_DEPLOYMENT.md` (for reference)
- [ ] Know where to find `VERCEL_DEBUG.md` (if issues occur)

## 🚀 Ready to Deploy!

Once all items are checked:

### Option 1: Vercel CLI
```bash
vercel --prod
```

### Option 2: GitHub
```bash
git push
```
Then connect in Vercel Dashboard.

### After Deployment

- [ ] Set environment variables in Vercel Dashboard
- [ ] Redeploy after setting environment variables
- [ ] Test deployment URL
- [ ] Test API endpoint: `/api/ai-chat`
- [ ] Check Function logs for errors
- [ ] Test all critical features in production

## 🐛 If Something Goes Wrong

1. Check `VERCEL_DEBUG.md` for common issues
2. Check Vercel Dashboard → Logs
3. Check Vercel Dashboard → Functions
4. Re-run `./test-vercel-build.sh` locally

---

**Remember**: You can always redeploy! Vercel makes it easy to rollback or redeploy.

**Tip**: Start with a preview deployment first (just run `vercel` without `--prod`) to test before going to production.







