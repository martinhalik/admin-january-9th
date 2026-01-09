# Vercel Deployment Guide

This guide helps you deploy the Groupon Admin application to Vercel with the AI Chat API.

## 🚀 Quick Deploy

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Deploy to production
vercel --prod
```

### Option 2: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect settings from `vercel.json`

3. **Configure Environment Variables** (see below)

## 🔐 Environment Variables

You need to set these in the Vercel Dashboard:

### Required for AI Chat Feature

Go to **Project Settings → Environment Variables** and add:

| Variable | Value | Used By |
|----------|-------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `/api/ai-chat.ts` |

Get your OpenAI API key: https://platform.openai.com/api-keys

### Optional (If using Supabase)

| Variable | Value | Used By |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Frontend |

### Optional (If using Maps)

| Variable | Value | Used By |
|----------|-------|---------|
| `VITE_MAPTILER_API_KEY` | Your MapTiler API key | Frontend maps |

Get your MapTiler API key: https://www.maptiler.com/cloud/

## 📝 Vercel Configuration Explained

The `vercel.json` file configures:

### Build Settings
- **Build Command**: `npm run build` (builds frontend)
- **Output Directory**: `frontend/dist` (where built files go)
- **Install Command**: Installs dependencies for both frontend and API

### API Functions
- All TypeScript files in `/api` folder become serverless functions
- Runtime: `@vercel/node@3`
- Endpoint: `/api/ai-chat` → `api/ai-chat.ts`

### Routing
1. **API Routes**: `/api/*` → API serverless functions
2. **Frontend Routes**: Everything else → `index.html` (SPA routing)

### Performance
- Assets (`/assets/*`) cached for 1 year with immutable flag

## 🧪 Testing Your Deployment

After deployment:

1. **Test Frontend**
   - Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
   - Navigate through the app
   - Check that all pages load

2. **Test AI Chat API**
   ```bash
   curl -X POST https://your-app.vercel.app/api/ai-chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "What makes a good Groupon deal?",
       "context": {
         "merchant": "Test Restaurant"
       }
     }'
   ```

   Expected response:
   ```json
   {
     "response": "A good Groupon deal should...",
     "usage": {
       "prompt_tokens": 123,
       "completion_tokens": 456,
       "total_tokens": 579
     }
   }
   ```

3. **Check AI Chat in App**
   - Go to any deal page
   - Click the AI Assistant button
   - Try asking a question
   - Verify you get a response

## 🐛 Troubleshooting

### API Function Not Working

**Error**: `500 Internal Server Error` or `OpenAI API key not configured`

**Solution**: 
1. Check that `OPENAI_API_KEY` is set in Vercel environment variables
2. Redeploy after adding the variable:
   ```bash
   vercel --prod
   ```

### Build Fails

**Error**: `npm install failed` or `TypeScript errors`

**Solution**:
1. Test build locally first:
   ```bash
   npm run build
   ```
2. Check the build logs in Vercel dashboard
3. Ensure all dependencies are in `package.json`

### Frontend Loads but API 404

**Error**: `/api/ai-chat` returns 404

**Solution**:
1. Check that `api/ai-chat.ts` exists in your repo
2. Verify the file exports a default function
3. Check Vercel Functions logs in dashboard

### CORS Errors

**Error**: `Access-Control-Allow-Origin` error

**Solution**:
- The API already has CORS enabled in `allowCors` wrapper
- Make sure you're calling the API from the same domain
- For local development, the API allows all origins (`*`)

## 📊 Monitoring

### View Function Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click "Functions" tab
4. Click on `/api/ai-chat`
5. View invocations and logs

### Check Usage

Monitor your OpenAI API usage:
- Go to: https://platform.openai.com/usage
- Track requests and costs
- Set usage limits if needed

## 🔄 Automatic Deployments

Once connected to GitHub:

- **Production**: Every push to `main` → Production deployment
- **Preview**: Every pull request → Preview deployment with unique URL
- **Rollback**: Instant rollback to previous deployments in dashboard

## 💰 Costs

### Vercel
- **Hobby Plan**: Free
  - Unlimited deployments
  - 100GB bandwidth/month
  - Serverless Functions: 100 GB-hours/month
  - **Good for development and small-scale production**

### OpenAI
- **GPT-4o-mini** (configured in `/api/ai-chat.ts`):
  - Input: $0.15 / 1M tokens (~$0.0001 per request)
  - Output: $0.60 / 1M tokens (~$0.0003 per request)
  - **~$0.0004 per AI chat message**
  - 1000 messages ≈ $0.40

**Estimated costs for moderate use**: $5-20/month

## 🔒 Security Best Practices

1. **Never commit API keys** to git
2. **Set environment variables** only in Vercel dashboard
3. **Rotate keys** periodically
4. **Monitor usage** for suspicious activity
5. **Rate limit** API calls in production (add middleware)

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 🎯 Next Steps

After successful deployment:

1. ✅ Test all features in production
2. ✅ Set up custom domain (optional)
3. ✅ Configure analytics (optional)
4. ✅ Add more API functions as needed
5. ✅ Set up staging environment (optional)

---

**Need help?** Check the [Vercel Support](https://vercel.com/support) or [OpenAI Support](https://help.openai.com/)







