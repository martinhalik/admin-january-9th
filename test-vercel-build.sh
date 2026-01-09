#!/bin/bash

# Vercel Deployment Test Script
# This script tests the build process locally before deploying to Vercel

set -e  # Exit on error

echo "🧪 Testing Vercel Build Configuration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Node version
echo "1️⃣  Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node version: $NODE_VERSION"
if [[ "$NODE_VERSION" < "v20" ]]; then
    echo -e "   ${RED}❌ Node.js 20+ required${NC}"
    exit 1
fi
echo -e "   ${GREEN}✅ Node version OK${NC}"
echo ""

# Test 2: Check if required files exist
echo "2️⃣  Checking required files..."
files=("vercel.json" "frontend/package.json" "api/package.json" "api/ai-chat.ts")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅${NC} $file"
    else
        echo -e "   ${RED}❌${NC} $file (missing)"
        exit 1
    fi
done
echo ""

# Test 3: Install frontend dependencies
echo "3️⃣  Installing frontend dependencies..."
cd frontend
if npm ci --silent; then
    echo -e "   ${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "   ${RED}❌ Frontend install failed${NC}"
    exit 1
fi
cd ..
echo ""

# Test 4: Install API dependencies
echo "4️⃣  Installing API dependencies..."
cd api
if npm install --silent; then
    echo -e "   ${GREEN}✅ API dependencies installed${NC}"
else
    echo -e "   ${RED}❌ API install failed${NC}"
    exit 1
fi
cd ..
echo ""

# Test 5: TypeScript compilation check for API
echo "5️⃣  Checking API TypeScript compilation..."
cd api
if npx tsc --noEmit; then
    echo -e "   ${GREEN}✅ API TypeScript OK${NC}"
else
    echo -e "   ${RED}❌ API TypeScript errors${NC}"
    exit 1
fi
cd ..
echo ""

# Test 6: Build frontend
echo "6️⃣  Building frontend..."
cd frontend
if npm run build; then
    echo -e "   ${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "   ${RED}❌ Frontend build failed${NC}"
    exit 1
fi
cd ..
echo ""

# Test 7: Check build output
echo "7️⃣  Checking build output..."
if [ -f "frontend/dist/index.html" ]; then
    echo -e "   ${GREEN}✅${NC} index.html exists"
else
    echo -e "   ${RED}❌${NC} index.html missing"
    exit 1
fi

if [ -d "frontend/dist/assets" ]; then
    echo -e "   ${GREEN}✅${NC} assets directory exists"
    ASSET_COUNT=$(find frontend/dist/assets -type f | wc -l | tr -d ' ')
    echo "      Found $ASSET_COUNT asset files"
else
    echo -e "   ${RED}❌${NC} assets directory missing"
    exit 1
fi
echo ""

# Test 8: Check environment variables
echo "8️⃣  Checking environment variables..."
echo -e "   ${YELLOW}ℹ️  These should be set in Vercel:${NC}"
echo "      - OPENAI_API_KEY (required for AI chat)"
echo "      - VITE_MAPTILER_API_KEY (optional, for maps)"
echo "      - VITE_SUPABASE_URL (optional, for database)"
echo "      - VITE_SUPABASE_ANON_KEY (optional, for database)"
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo "================================"
echo ""
echo "📦 Build artifacts ready:"
echo "   - Frontend: frontend/dist/"
echo "   - API: api/*.ts (will be deployed as serverless functions)"
echo ""
echo "🚀 Ready to deploy to Vercel!"
echo ""
echo "Next steps:"
echo "   1. Set environment variables in Vercel dashboard"
echo "   2. Run: vercel"
echo "   3. Or: git push (if connected to GitHub)"
echo ""
echo "📚 See VERCEL_DEPLOYMENT.md for detailed guide"







