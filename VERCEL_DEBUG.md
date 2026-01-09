# Vercel Debugging Checklist

## 🔍 Common Issues and Solutions

### Issue 1: Build Fails on Vercel

#### Symptoms
- Build fails with `npm install` errors
- TypeScript compilation errors
- Module not found errors

#### Debug Steps

1. **Check Build Logs**
   - Go to Vercel Dashboard → Deployments → Click failed deployment
   - Look for the exact error message

2. **Test Build Locally**
   ```bash
   ./test-vercel-build.sh
   ```
   This will simulate the Vercel build process

3. **Common Fixes**
   - Missing dependencies: Add to `package.json`
   - Node version mismatch: Add `.nvmrc` file:
     ```bash
     echo "20" > .nvmrc
     ```
   - Build script error: Check `vercel.json` buildCommand

---

### Issue 2: API Function Returns 500

#### Symptoms
- `/api/ai-chat` returns 500 Internal Server Error
- Error message: "OpenAI API key not configured"

#### Debug Steps

1. **Check Environment Variables**
   - Vercel Dashboard → Settings → Environment Variables
   - Verify `OPENAI_API_KEY` is set
   - Make sure it's enabled for Production/Preview/Development

2. **Check API Function Logs**
   - Vercel Dashboard → Functions → `/api/ai-chat`
   - Look at recent invocations
   - Check for error messages

3. **Test API Function Locally**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Run locally with environment variables
   vercel dev
   
   # Test the API
   curl -X POST http://localhost:3000/api/ai-chat \
     -H "Content-Type: application/json" \
     -d '{"message": "test"}'
   ```

4. **Common Fixes**
   - Add environment variable in Vercel
   - Redeploy after adding variables
   - Check API key is valid (test on OpenAI platform)

---

### Issue 3: API Function Returns 404

#### Symptoms
- `/api/ai-chat` returns 404 Not Found
- API endpoint doesn't exist

#### Debug Steps

1. **Check File Location**
   - Verify file exists at: `api/ai-chat.ts`
   - Check file is committed to git
   
2. **Check Export**
   - File must have `export default` at the end
   - Should export a function that takes `(req, res)`

3. **Check Vercel Configuration**
   - API files in `/api` folder are auto-detected
   - TypeScript files (.ts) should work automatically

4. **Common Fixes**
   - Rename file to match route: `ai-chat.ts` → `/api/ai-chat`
   - Ensure file is in git (not ignored by .gitignore)
   - Redeploy after fixing

---

### Issue 4: CORS Errors

#### Symptoms
- Browser console shows CORS error
- `Access-Control-Allow-Origin` error

#### Debug Steps

1. **Check Browser Console**
   - Open DevTools → Console
   - Look for exact CORS error message

2. **Verify API Response Headers**
   ```bash
   curl -i -X OPTIONS https://your-app.vercel.app/api/ai-chat
   ```
   Should return CORS headers

3. **Common Fixes**
   - Already handled in `api/ai-chat.ts` with `allowCors` wrapper
   - Check API is called from same domain
   - For local dev, ensure API allows `*` origin

---

### Issue 5: Frontend Routes Return 404

#### Symptoms
- Direct URL access returns 404
- Routes work from home page but fail on refresh
- Only index.html loads

#### Debug Steps

1. **Check Vercel Rewrites**
   - File: `vercel.json`
   - Should have rewrite rule for SPA routing:
     ```json
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
     ```

2. **Check Build Output**
   - Verify `outputDirectory` is correct
   - Should point to `frontend/dist`
   - Check `index.html` exists in build output

3. **Common Fixes**
   - Update `vercel.json` with proper rewrites
   - Redeploy after fixing configuration

---

### Issue 6: Assets Not Loading

#### Symptoms
- Images/CSS/JS files return 404
- Broken styles or missing images
- Console shows 404 for `/assets/*` files

#### Debug Steps

1. **Check Build Output Structure**
   ```bash
   ls -R frontend/dist/
   ```
   Should show:
   ```
   frontend/dist/
   ├── index.html
   └── assets/
       ├── index-[hash].js
       ├── index-[hash].css
       └── ...
   ```

2. **Check Asset Paths**
   - Vite builds with hashed filenames
   - Paths should be relative: `/assets/...`
   - Check HTML references correct paths

3. **Common Fixes**
   - Verify Vite config `base` is not set to custom value
   - Check assets are included in git
   - Clear build cache: `rm -rf frontend/dist && npm run build`

---

### Issue 7: Environment Variables Not Working

#### Symptoms
- Frontend can't access environment variables
- `import.meta.env.VITE_*` is undefined

#### Debug Steps

1. **Check Variable Naming**
   - Frontend variables MUST start with `VITE_`
   - API variables don't need prefix
   - Correct: `VITE_MAPTILER_API_KEY`
   - Wrong: `MAPTILER_API_KEY` (won't work in frontend)

2. **Check Vercel Configuration**
   - Vercel Dashboard → Settings → Environment Variables
   - Check variable is enabled for correct environment
   - Options: Production, Preview, Development

3. **Check Build Order**
   - Environment variables are embedded at build time
   - Changing variables requires redeploy
   - Preview/Production have separate variables

4. **Common Fixes**
   - Rename frontend variables to start with `VITE_`
   - Redeploy after changing environment variables
   - Check variable is set for correct environment

---

## 🧪 Testing Checklist

Run through this checklist before deploying:

### Pre-Deploy
- [ ] Run `./test-vercel-build.sh` successfully
- [ ] All environment variables documented
- [ ] `.vercelignore` excludes unnecessary files
- [ ] `vercel.json` configuration is correct

### Post-Deploy
- [ ] Homepage loads correctly
- [ ] All routes accessible (test deep links)
- [ ] Assets (CSS, JS, images) load correctly
- [ ] API endpoint responds: `/api/ai-chat`
- [ ] Environment variables work in frontend
- [ ] Check Function logs for errors

### API Testing
```bash
# Test API endpoint
curl -X POST https://your-app.vercel.app/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What makes a good deal?",
    "context": {
      "merchant": "Test Restaurant",
      "category": "Food & Drink"
    }
  }'

# Expected: JSON response with "response" field
```

### Frontend Testing
- [ ] Open app in browser
- [ ] Test navigation between pages
- [ ] Open browser DevTools Console (check for errors)
- [ ] Test AI chat (if applicable)
- [ ] Test all major features

---

## 🔧 Useful Commands

### Local Testing
```bash
# Test build locally
./test-vercel-build.sh

# Run Vercel dev server (simulates production)
vercel dev

# Run normal dev server
npm run dev
```

### Vercel CLI
```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# View environment variables
vercel env ls

# Add environment variable
vercel env add OPENAI_API_KEY
```

### Debugging
```bash
# Check Node version
node -v

# Check npm version
npm -v

# Clear node_modules and reinstall
rm -rf node_modules frontend/node_modules api/node_modules
npm install
cd frontend && npm install
cd ../api && npm install

# Clear build cache
rm -rf frontend/dist .vercel
```

---

## 📊 Monitoring

### Check Logs
1. Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Filter by:
   - Deployment logs (build errors)
   - Function logs (API errors)
   - Static logs (routing errors)

### Check Function Performance
1. Vercel Dashboard → Functions
2. View:
   - Invocation count
   - Error rate
   - Execution time
   - Memory usage

### Check Analytics
1. Vercel Dashboard → Analytics
2. Monitor:
   - Page views
   - Top pages
   - Performance metrics
   - Error rates

---

## 🆘 Getting Help

### Vercel Support
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Vercel Support](https://vercel.com/support)

### OpenAI Support
- [API Documentation](https://platform.openai.com/docs)
- [Community Forum](https://community.openai.com/)
- [API Status](https://status.openai.com/)

### Project-Specific
- Check `VERCEL_DEPLOYMENT.md` for detailed deployment guide
- Check `README.md` for project overview
- Run `./test-vercel-build.sh` for local testing

---

## 📝 Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Build fails | Run `./test-vercel-build.sh` locally |
| API 500 | Check `OPENAI_API_KEY` in Vercel env vars |
| API 404 | Verify `api/ai-chat.ts` exists and has default export |
| CORS error | Already handled, check API call origin |
| Routes 404 | Check `vercel.json` has SPA rewrite rule |
| Assets 404 | Verify `outputDirectory: "frontend/dist"` |
| Env vars undefined | Prefix with `VITE_` for frontend, redeploy |

---

**Last Updated**: December 2024







