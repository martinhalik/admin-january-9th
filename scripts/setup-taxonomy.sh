#!/bin/bash

# Taxonomy Setup Script
# This script sets up the flexible taxonomy system

set -e

echo "🚀 Setting up Flexible Taxonomy System..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "../.env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create a .env file with:"
    echo "  VITE_SUPABASE_URL=your-url"
    echo "  VITE_SUPABASE_ANON_KEY=your-key"
    exit 1
fi

# Source environment variables
export $(cat ../.env | grep -v '^#' | xargs)

# Check if Supabase credentials are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Supabase credentials not found in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Environment variables loaded"

# Step 1: Check if CSV exists
CSV_PATH="$HOME/Downloads/Full Merchant Taxonomy - Snapshot Oct 2025 - Q2 2025 Taxonomy.csv"
if [ ! -f "$CSV_PATH" ]; then
    echo -e "${RED}❌ CSV file not found at: $CSV_PATH${NC}"
    echo "Please download the taxonomy CSV file first."
    exit 1
fi

echo -e "${GREEN}✓${NC} CSV file found"

# Step 2: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

echo -e "${GREEN}✓${NC} Dependencies installed"

# Step 3: Apply database schema
echo ""
echo "🗄️  Applying database schema..."
echo -e "${YELLOW}⚠️  Please run the following SQL in Supabase Studio:${NC}"
echo ""
echo "   1. Go to: https://app.supabase.com/project/${VITE_SUPABASE_URL#*//}/sql/new"
echo "   2. Copy the contents of: supabase/taxonomy-schema.sql"
echo "   3. Run the query"
echo ""
read -p "Press Enter after you've run the schema SQL..."

# Step 4: Import taxonomy data
echo ""
echo "📊 Importing taxonomy data..."
echo "This will take 2-3 minutes..."
echo ""

npx tsx importTaxonomy.ts "$CSV_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✨ Taxonomy setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. The SearchableServiceSelector is already integrated into DealSummaryCard"
    echo "  2. Try editing a deal's category in the Overview tab"
    echo "  3. Search for services like 'massage', 'yoga', or 'restaurant'"
    echo ""
    echo "For admin features:"
    echo "  - Add TaxonomyImprovementPanel to your admin area"
    echo "  - Review search misses and suggestions"
    echo "  - Monitor usage analytics"
    echo ""
    echo "Read TAXONOMY_SYSTEM.md for full documentation"
else
    echo ""
    echo -e "${RED}❌ Import failed!${NC}"
    echo "Check the error messages above."
    exit 1
fi
















