# Groupon Admin Prototype Boilerplate

A modern admin system boilerplate for rapid prototyping of Groupon internal tools. Built with React + Ant Design with mock data for quick prototyping. :)

> **🚀 Quick Start Template**: This is a clean boilerplate ready for your next admin prototype. See [TEMPLATE_SETUP.md](TEMPLATE_SETUP.md) for customization guide.

> **🔐 Authentication**: Automatically bypassed on localhost for easy development. Production requires Google OAuth. See [AUTHENTICATION.md](AUTHENTICATION.md) for details.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Supabase account (for authentication)
- Google Cloud Console access (for OAuth setup)

### Installation & Running

**Option 1: Automatic Start (Recommended)**

```bash
./start-dev.sh
```

**Option 2: Manual Start**

```bash
cd frontend
npm install             # First time only
npm run dev            # Start frontend on http://localhost:3000
```

Or from the root directory:

```bash
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Note**: On localhost, you'll be automatically logged in (no authentication required for development)

### Authentication Setup

To enable authentication:

1. **Configure Supabase**: Follow [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md) for detailed setup instructions
2. **Set Environment Variables**: Create `frontend/.env.local` with your Supabase credentials
3. **Configure Google OAuth**: Set up OAuth 2.0 credentials in Google Cloud Console

For a quick overview of the authentication implementation, see [GOOGLE_AUTH_IMPLEMENTATION.md](GOOGLE_AUTH_IMPLEMENTATION.md).

## ✨ Features

### 🎨 Design System

- **Primary Color**: #007C1F (Groupon Green)
- **Icon Library**: Lucide React
- **UI Framework**: Ant Design 5
- **Typography**: System font stack

### Main Features

#### 1. Layout & Navigation

- Header with global search, notifications, and user menu
- Collapsible sidebar with:
  - Home, My Tasks
  - Deals, Leads, Accounts (Core)
  - Marketing tools (Brands, Tags, Custom Fields)
  - Content management (Videos)
  - Admin tools (Users, API Tokens, AI Agents, Workflows)
  - Favorites section with quick access

#### 2. Deal Detail Page (Fully Refactored & Production-Ready) ⭐

> **🎉 Recently Refactored**: The DealDetail component has been modularized from 5,100+ lines to 2,196 lines with 11 reusable components. See [REFACTORING_COMPLETE.md](REFACTORING_COMPLETE.md) for details.

**Tabs Navigation:**

- **Overview** - Performance metrics, summary, and recommendations (fully modularized)
- **Content** - Rich text editor with media management
- **Settings** - Highlights and fine print configuration
- **Analytics** - Performance tracking (coming soon)
- **Reviews** - Customer feedback (coming soon)

**Overview Tab Features:**

- 📊 **Statistics Dashboard** - Interactive charts with time period selection (7d, 30d, 90d, all time)
- 📈 **Performance Metrics** - Gross Profit, Orders, GP per Visit, Conversion Rate, Visits, Refunds
- 🎯 **Deal Summary** - Quality rating, dates, division, category, web info
- 👥 **Roles Management** - Account owner, writer, designer, opportunity owner
- 🔍 **Similar Deals** - Related deals with click-through navigation
- 🤖 **AI Recommendations** - Priority-based suggestions with feedback

**Content Tab Features:**

- 💾 **Auto-save** - Real-time saving with status indicators
- 🌍 **Multi-language** - 6 locales (US, Canada, Netherlands, Belgium, France, Italy)
- 🤖 **AI Generation** - Title, description, and highlights generation
- 📸 **Media Manager** - Drag-and-drop photos and videos with featured image selection
- ✍️ **Rich Text Editor** - Inline editing for all content fields
- 💰 **Deal Options** - Multiple pricing options with enable/disable toggles
- 🎫 **Redemption Method** - Online, at-location, or customer-location redemption
- 📍 **Locations** - Interactive map with location selection (when applicable)

**Settings Tab Features:**

- ✨ **Highlights Editor** - Marketing highlights with version history
- 📋 **Fine Print Editor** - Terms and conditions management
- 🎯 **Change Tracking** - Automatic change detection and save prompts

#### 3. Right Sidebar

- Updates section with unpublished changes
- Task management with due dates and assignees
- Timeline with notes and activity log

## 🛠 Tech Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Full type safety
- **Vite**: Fast build tool and dev server
- **Ant Design 5**: Enterprise UI components
- **React Router**: Client-side routing
- **Recharts**: Data visualization
- **Lucide React**: Beautiful icon set
- **@dnd-kit**: Drag-and-drop functionality
- **Mock Data**: TypeScript-based mock data for rapid prototyping

## 📚 Documentation

This project has extensive documentation (45 files). Use **[DOCS_QUICK_REFERENCE.md](DOCS_QUICK_REFERENCE.md)** to quickly find what you need.

**Essential Docs:**
- [QUICKSTART.md](QUICKSTART.md) - Get started in 2 minutes
- [DOCS_QUICK_REFERENCE.md](DOCS_QUICK_REFERENCE.md) - Documentation navigation
- [REFACTORING_COMPLETE.md](REFACTORING_COMPLETE.md) - Architecture overview
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing scenarios
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide

## 📁 Project Structure

```
admin-prototype/
├── frontend/                       # React application
│   ├── src/
│   │   ├── main.tsx              # Entry point
│   │   ├── App.tsx               # Router & theme config
│   │   ├── index.css             # Global styles
│   │   │
│   │   ├── components/
│   │   │   ├── DealDetail/       # ⭐ Modular deal components (11 components)
│   │   │   │   ├── DealStatsCard.tsx
│   │   │   │   ├── DealHeaderInfo.tsx
│   │   │   │   ├── DealSummaryCard.tsx
│   │   │   │   ├── DealRolesCard.tsx
│   │   │   │   ├── SimilarDealsCard.tsx
│   │   │   │   ├── DealRecommendationsCard.tsx
│   │   │   │   └── ... (5 more components)
│   │   │   │
│   │   │   ├── Settings/         # Settings-related components
│   │   │   │   └── SettingsTabContent.tsx
│   │   │   │
│   │   │   ├── ContentEditor/    # Content editing components
│   │   │   │   ├── TitleEditor.tsx
│   │   │   │   ├── DescriptionEditor.tsx
│   │   │   │   ├── RedemptionMethodSection.tsx
│   │   │   │   └── ... (more editors)
│   │   │   │
│   │   │   ├── LocationManagement/ # Location features
│   │   │   ├── Layout.tsx        # Main layout (header + sidebar)
│   │   │   ├── LocationsSection.tsx # Reusable location picker
│   │   │   ├── ContentEditor.tsx # Main content orchestrator
│   │   │   └── MediaUpload.tsx   # Media upload component
│   │   │
│   │   ├── data/
│   │   │   ├── mockDeals.ts      # ⭐ Mock deal data
│   │   │   ├── merchantAccounts.ts # Mock account data
│   │   │   └── locationData.ts   # Mock location data
│   │   │
│   │   ├── lib/
│   │   │   └── api.ts            # API utilities (for future backend)
│   │   │
│   │   └── pages/
│   │       ├── Dashboard.tsx     # Dashboard (placeholder)
│   │       ├── Deals.tsx         # Deals list
│   │       ├── DealDetail.tsx    # ⭐ Main deal page (2,196 lines, fully modular)
│   │       ├── AccountDetail.tsx # Account detail page
│   │       ├── Tasks.tsx         # Tasks
│   │       └── Accounts.tsx      # Accounts list
│   │
│   ├── public/
│   │   ├── images/               # Sample images
│   │   └── videos/               # Sample videos
│   │
│   ├── vite.config.ts            # Vite configuration
│   └── package.json              # Frontend dependencies
│
├── docs/                          # 📚 Documentation (45 files)
│   ├── README.md                 # This file
│   ├── QUICKSTART.md            # Quick start guide
│   ├── REFACTORING_COMPLETE.md   # Complete refactoring overview
│   ├── DOCUMENTATION_CLEANUP_SUMMARY.md # Doc organization
│   ├── DEALDETAIL_TAB_STRUCTURE.md
│   └── ... (40+ feature and setup docs)
│
├── package.json                   # Root scripts
├── tsconfig.json                  # TypeScript config
├── start-dev.sh                   # Helper script
└── README.md                      # This file
```

## 🎯 Mock Data

All data is currently mocked in `frontend/src/data/mockDeals.ts`:

- **Deal data**: Complete deal information with stats, options, and recommendations
- **Chart data**: Time-series data for performance metrics
- **Easy to extend**: Add more mock data or switch to real API later

## 🎨 Color System

- **Primary**: #007C1F (Groupon Green)
- **High Priority**: #ff4d4f (Red)
- **Medium Priority**: #faad14 (Orange)
- **Low Priority**: #52c41a (Green)
- **Clarity Category**: #1890ff (Blue)
- **Pricing Category**: #722ed1 (Purple)
- **Other Category**: #13c2c2 (Cyan)

## 🚀 Deployment

### Deploy to Vercel

This project is configured for easy deployment to Vercel with AI chat API support.

**Quick Start:**

```bash
# Test build locally first
./test-vercel-build.sh

# Deploy with Vercel CLI
npm i -g vercel
vercel --prod
```

**Documentation:**
- 📖 **[5-Minute Quick Start](VERCEL_QUICKSTART.md)** - Get deployed fast
- 📖 **[Complete Deployment Guide](VERCEL_DEPLOYMENT.md)** - Detailed instructions
- 🐛 **[Debugging Guide](VERCEL_DEBUG.md)** - Troubleshooting help
- ✅ **[Fix Summary](VERCEL_FIX_SUMMARY.md)** - What was fixed and why

**Automatic Deployments:**

- Connect your GitHub repository to Vercel
- Every push to `main` will trigger a production deployment
- Pull requests will get preview deployments

**Environment Variables:**

Set these in Vercel Dashboard → Settings → Environment Variables:
- `OPENAI_API_KEY` (required for AI chat)
- `VITE_MAPTILER_API_KEY` (optional, for maps)
- `VITE_SUPABASE_URL` (optional, for database)
- `VITE_SUPABASE_ANON_KEY` (optional, for database)

### Adding a Backend Later

This prototype currently uses mock data. When you're ready to add a real backend:

1. Create your backend API (Encore.dev, Next.js API routes, etc.)
2. Update `frontend/src/lib/api.ts` to point to your backend
3. Replace mock data imports in pages with API calls
4. Add `VITE_API_URL` environment variable in Vercel

## 📝 Development

### Hot Reload

Frontend supports hot reload - changes to `.tsx` files update instantly in the browser.

### Adding Features

1. **Mock Data**: Add or modify data in `frontend/src/data/mockDeals.ts`
2. **Components**: Add to `frontend/src/components/`
3. **Pages**: Add to `frontend/src/pages/` and update `App.tsx` routes

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill
```

### Dependency Issues

```bash
# Clean install
rm -rf frontend/node_modules
cd frontend && npm install
```

## 🎓 Content Editor Best Practices

### Photos

- Upload high-quality images (minimum 1200x800px)
- Use the first photo as your hero/featured image
- Add descriptive captions for accessibility
- Include 4-8 photos for best engagement

### Title

- Keep under 100 characters
- Include the discount percentage
- Focus on the benefit, not just the service

### Description

- 3-5 sentences
- Explain what's included
- Highlight unique selling points
- Use engaging, customer-focused language

### Highlights

- List 4-8 key benefits
- Be specific and concrete
- Focus on what customers get/experience

### Fine Print

- Be clear and comprehensive
- Include expiration dates
- List all restrictions
- Specify redemption details

## 🎯 What's Included

This boilerplate provides:

- ✅ **Modern Frontend**: React 18 + TypeScript + Vite + Ant Design 5
- ✅ **Mock Data**: TypeScript-based mock data for rapid prototyping
- ✅ **Sample Features**: Fully implemented deal detail page with content editor
- ✅ **Layout System**: Responsive header, sidebar, and page structure
- ✅ **Dev Tools**: Hot reload, TypeScript, ESLint configuration
- ✅ **Deployment Ready**: Vercel config included
- ✅ **Media Assets**: Sample images and videos for prototyping

## 🛠 Customization

This is a **template** - customize it for your needs:

1. **Rename the project** - Update `package.json` and README
2. **Add mock data** - Extend `frontend/src/data/mockDeals.ts` with your data structures
3. **Build your pages** - Use `DealDetail.tsx` as a reference for complex pages
4. **Customize branding** - Update colors, logo, and theme in `App.tsx`
5. **Add authentication** - Integrate with your auth provider
6. **Add backend** - When ready, integrate with your API backend

See [TEMPLATE_SETUP.md](TEMPLATE_SETUP.md) for detailed customization guide.

## 📄 License

Internal Groupon prototype boilerplate.

---

**Built with ❤️ using React and Ant Design**
