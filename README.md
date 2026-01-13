# Groupon Admin - January 9th

A modern admin system for managing Groupon deals, accounts, and merchant relationships. Built with React, TypeScript, Ant Design, and Supabase.

## 🚀 Quick Start

### Run the Development Server

```bash
./start-dev.sh
```

Or manually:

```bash
cd frontend
npm install        # First time only
npm run dev
```

### Access the Application

- **Local**: http://localhost:3000
- **Authentication**: Automatically bypassed on localhost for development
- **Production**: Requires Google OAuth (`@groupon.com` or `@krm.sk` emails)

## ✨ Features

### Core Functionality
- **Dashboard**: Overview with deal statistics and performance metrics
- **Deals Management**: Browse, filter, and manage 100K+ deals
- **Accounts**: Merchant account management with hierarchy
- **Content Editor**: Rich text editing with media management
- **AI Integration**: AI-powered deal generation and recommendations
- **Role-Based Filtering**: Users see deals relevant to their role
- **Real-time Search**: Fast search across deals, accounts, and locations

### Performance Optimizations
- **Backend Aggregations**: Database-level calculations for instant loading
- **Smart Caching**: Intelligent data caching and invalidation
- **Lazy Loading**: Components and data loaded on-demand
- **Virtual Scrolling**: Handles large lists efficiently

### Authentication & Security
- **Google OAuth**: Domain-restricted authentication via Supabase
- **Role-Based Access**: Permissions based on org hierarchy
- **Protected Routes**: Automatic auth enforcement
- **Session Management**: Persistent sessions with auto-refresh

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Ant Design 5, Lucide Icons
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Google OAuth
- **Maps**: MapTiler
- **Charting**: Recharts
- **Testing**: Playwright

## 📚 Documentation

### Getting Started
- **[README.md](README.md)** - This file (overview and quick start)
- **[GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md)** - Authentication setup guide
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Database setup instructions

### Core Features
- **[AUTHENTICATION.md](AUTHENTICATION.md)** - Auth architecture overview
- **[GOOGLE_AUTH.md](GOOGLE_AUTH.md)** - Complete Google OAuth guide
- **[FILTERING.md](FILTERING.md)** - Filtering and role-based views
- **[PERFORMANCE.md](PERFORMANCE.md)** - Performance optimizations

### Development & Deployment
- **[TESTING.md](TESTING.md)** - E2E testing with Playwright
- **[DEPLOYMENT_READY.md](DEPLOYMENT_READY.md)** - Deployment checklist and guide
- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - Design system and components

### Technical Documentation
- **[AUTHENTICATION_REDIRECT_FIX_COMPLETE.md](AUTHENTICATION_REDIRECT_FIX_COMPLETE.md)** - OAuth redirect fix
- **[SALESFORCE_STAGE_MAPPING.md](SALESFORCE_STAGE_MAPPING.md)** - Salesforce integration
- **[EMPLOYEES_ACCOUNTS_MIGRATION.md](EMPLOYEES_ACCOUNTS_MIGRATION.md)** - Data migration guide
- **[DEVICE_PREVIEW_IMPLEMENTATION.md](DEVICE_PREVIEW_IMPLEMENTATION.md)** - Device preview feature
- **[WORKSPACE_SIDEBAR_CHANGES.md](WORKSPACE_SIDEBAR_CHANGES.md)** - UI changes
- **[ICONS_LOCALIZATION.md](ICONS_LOCALIZATION.md)** - Icon system

## 📁 Project Structure

```
admin-january-9th/
├── frontend/                           # React application
│   ├── src/
│   │   ├── components/                # UI components
│   │   │   ├── Layout.tsx             # Main layout
│   │   │   ├── LoginPage.tsx          # Login UI
│   │   │   ├── ProtectedRoute.tsx     # Route protection
│   │   │   └── ...
│   │   │
│   │   ├── contexts/                  # React contexts
│   │   │   ├── AuthContext.tsx        # Authentication state
│   │   │   ├── RoleViewContext.tsx    # Role-based filtering
│   │   │   └── ...
│   │   │
│   │   ├── data/                      # Mock data
│   │   │   ├── mockDeals.ts
│   │   │   ├── merchantAccounts.ts
│   │   │   └── ...
│   │   │
│   │   ├── lib/                       # Utilities
│   │   │   ├── supabase.ts            # Database client
│   │   │   ├── dealAdapter.ts         # Data adapters
│   │   │   └── api.ts
│   │   │
│   │   └── pages/                     # Page components
│   │       ├── Dashboard.tsx
│   │       ├── Deals.tsx
│   │       ├── DealDetail.tsx
│   │       ├── Accounts.tsx
│   │       └── ...
│   │
│   ├── e2e/                           # Playwright tests
│   │   ├── dashboard.spec.ts
│   │   ├── deals.spec.ts
│   │   └── ...
│   │
│   ├── public/                        # Static assets
│   └── package.json
│
├── supabase/                          # Database migrations
│   └── migrations/
│       └── optimize_dashboard_load.sql
│
├── scripts/                           # Utility scripts
│   ├── syncSalesforceToSupabase.ts
│   └── ...
│
├── api/                               # Serverless functions
│   └── ai-chat.ts
│
└── *.md                               # Documentation (16 files)
```

## 🔐 Authentication Setup

### 1. Supabase Configuration

1. Create a Supabase project at https://supabase.com
2. Get your Project URL and anon key from Settings > API
3. Create `frontend/.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Google OAuth Setup

1. Go to Google Cloud Console
2. Create OAuth 2.0 Client ID
3. Add authorized origins and redirect URIs
4. Configure in Supabase: Authentication > Providers > Google

See **[GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md)** for detailed instructions.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_PRODUCTION_URL=https://your-domain.vercel.app
   ```
3. Deploy!

See **[DEPLOYMENT_READY.md](DEPLOYMENT_READY.md)** for complete deployment guide.

## 🧪 Testing

### Run E2E Tests

```bash
cd frontend
npm run test:e2e
```

### Run Specific Test

```bash
npm run test:e2e -- deals.spec.ts
```

### Debug Tests

```bash
npm run test:e2e -- --debug
```

See **[TESTING.md](TESTING.md)** for comprehensive testing guide.

## 💡 Development Tips

### Localhost Authentication

Authentication is automatically bypassed on localhost - just run the dev server and you're logged in as a mock user.

### Environment Variables

**Frontend** (`frontend/.env.local`):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_MAPTILER_API_KEY=your-maptiler-key
```

**Production** (Vercel):
```bash
# All of the above, plus:
VITE_PRODUCTION_URL=https://your-domain.vercel.app
OPENAI_API_KEY=your-openai-key  # For AI features
```

### Hot Reload

Changes to `.tsx` and `.ts` files update instantly in the browser.

### Database Migrations

Run SQL migrations in Supabase SQL Editor:
```bash
supabase/migrations/*.sql
```

## 🎨 Design System

- **Primary Color**: #007C1F (Groupon Green)
- **UI Framework**: Ant Design 5
- **Icons**: Lucide React
- **Typography**: System fonts
- **Dark Mode**: Supported

See **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** for complete design guidelines.

## 🔍 Key Features Deep Dive

### Role-Based Filtering

Users automatically see data relevant to their role:
- **Account Executives**: Own deals only
- **Regional Managers**: Team's deals
- **Directors/Executives**: All deals

See **[FILTERING.md](FILTERING.md)** for implementation details.

### Performance Optimization

Dashboard and deals page load 150-300x faster using:
- Database-level aggregations
- Smart caching
- Lazy loading
- Backend pre-calculation

See **[PERFORMANCE.md](PERFORMANCE.md)** for technical details.

### Google Authentication

OAuth-based authentication with:
- Domain restriction (@groupon.com, @krm.sk)
- Automatic session management
- Localhost bypass for development

See **[GOOGLE_AUTH.md](GOOGLE_AUTH.md)** for architecture overview.

## 🐛 Troubleshooting

### Authentication Issues

**Problem**: Redirects to localhost:3000 after OAuth on production

**Solution**: Set `VITE_PRODUCTION_URL` in Vercel and add production URL to Supabase redirect URLs

**See**: [AUTHENTICATION_REDIRECT_FIX_COMPLETE.md](AUTHENTICATION_REDIRECT_FIX_COMPLETE.md)

### Performance Issues

**Problem**: Dashboard loads slowly

**Solution**: Deploy the SQL optimization function in Supabase

**See**: [PERFORMANCE.md](PERFORMANCE.md)

### Test Failures

**Problem**: Playwright tests fail with auth errors

**Solution**: Enable auth bypass in tests

**See**: [TESTING.md](TESTING.md)

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server (from root)
cd frontend && npm run dev  # Start dev server (from frontend)
./start-dev.sh          # Start dev server (helper script)

# Testing
cd frontend && npm run test:e2e         # Run all E2E tests
cd frontend && npm run test:e2e -- --ui # Interactive test UI

# Building
cd frontend && npm run build    # Build for production
cd frontend && npm run preview  # Preview production build

# Linting
cd frontend && npm run lint     # Run ESLint
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test:e2e`
4. Create a pull request

## 📞 Support

For questions or issues:
1. Check the relevant documentation file
2. Search existing issues
3. Create a new issue with details

## 🎯 What's Next?

- [ ] Implement real-time notifications
- [ ] Add collaborative editing
- [ ] Enhance analytics dashboard
- [ ] Mobile app version
- [ ] Advanced reporting features

---

**Built with React, TypeScript, and Ant Design**

*Last updated: January 2026*
