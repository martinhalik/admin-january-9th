# Documentation Cleanup Plan

## Current State: 58 MD files in root (too many!)

## Target: ~10 essential docs

### Files to DELETE (Obsolete fixes/duplicates) - 20 files

**Fix docs (completed work, no longer needed):**
- ACCOUNT_OWNER_DISPLAY_FIX.md
- ACCOUNT_OWNER_FILTER_FINAL.md
- ACCOUNT_OWNER_FILTER_FIX.md
- ACCOUNT_OWNER_FILTER_STYLING_FIX.md
- AI_CATEGORY_RESPONSIVE_FIX.md
- DEAL_ACCOUNT_OWNER_FIX.md
- FILTER_LOAD_ON_DEMAND_FIX.md
- FILTER_NEUTRAL_COLORS.md
- HOOKS_ORDER_FIX.md
- RESPONSIVE_FIX_SUMMARY.md
- SALESFORCE_SYNC_FIX.md
- RESPONSIVE_TESTING_GUIDE.md
- PREVIEW_TAB_TEST_RESULTS.md
- SCOUT_FEATURES_DEBUG.md
- VERCEL_DEBUG.md

**Duplicate/superseded docs:**
- AUTH_REDIRECT_FIX.md (superseded by AUTHENTICATION_REDIRECT_FIX_COMPLETE.md)
- DEPLOYMENT_SUCCESS.md (obsolete)
- VERCEL_READY.md (obsolete)

### Files to CONSOLIDATE (Merge similar docs)

**Performance (10 files → 1 file: PERFORMANCE.md)**
- PERFORMANCE_IMPROVEMENTS.md
- PERFORMANCE_INITIAL_LOAD.md
- PERFORMANCE_OPTIMIZATION.md
- PERFORMANCE_QUICKSTART.md
- PERFORMANCE_SUMMARY.md
- LARGE_DATASET_STRATEGY.md
- LAZY_LOADING_IMPLEMENTATION.md
- LOADING_STRATEGY_FIX.md
- OPTIMIZED_LOADING_STRATEGY.md
- SMART_INCREMENTAL_LOADING.md

**Google Auth (5 files → 1 file: GOOGLE_AUTH.md)**
- GOOGLE_AUTH_ARCHITECTURE.md
- GOOGLE_AUTH_COMPLETE.md
- GOOGLE_AUTH_IMPLEMENTATION.md
- GOOGLE_AUTH_QUICK_REF.md
- GOOGLE_AUTH_MIGRATION.md (delete - migration done)

**Vercel/Deployment (7 files → 1 file: DEPLOYMENT.md)**
- VERCEL_DEPLOYMENT.md
- VERCEL_DEPLOYMENT_FIXES.md
- VERCEL_FIX_SUMMARY.md
- VERCEL_QUICKSTART.md
- DEPLOYMENT_CHECKLIST.md

**Testing (3 files → keep separate or consolidate to TESTING.md)**
- PLAYWRIGHT_CI.md
- PLAYWRIGHT_SETUP.md
- PLAYWRIGHT_TESTING.md

**Filtering/Roles (3 files → 1 file: FILTERING.md)**
- DEALS_FILTERING_IMPLEMENTATION.md
- ROLE_BASED_DEFAULT_FILTERING.md
- ROLE_BASED_FILTERING_IMPLEMENTATION.md
- ROLE_FILTERING_VISUAL_GUIDE.md

**Design System (2 files → 1 file)**
- DESIGN_SYSTEM.md
- DESIGN_SYSTEM_IMPLEMENTATION.md

### Files to KEEP (Essential docs) - ~10 files

1. **README.md** - Main project documentation
2. **AUTHENTICATION.md** - Auth overview
3. **AUTHENTICATION_REDIRECT_FIX_COMPLETE.md** - Recent fix (keep for now)
4. **DEPLOYMENT_READY.md** - Current deployment status (just created)
5. **GOOGLE_AUTH_SETUP.md** - Setup instructions (keep separate)
6. **SUPABASE_SETUP.md** - Database setup
7. **SALESFORCE_STAGE_MAPPING.md** - Business logic
8. **EMPLOYEES_ACCOUNTS_MIGRATION.md** - Data migration
9. **WORKSPACE_SIDEBAR_CHANGES.md** - UI changes
10. **ICONS_LOCALIZATION.md** - Localization
11. **DEVICE_PREVIEW_IMPLEMENTATION.md** - Feature doc

### New Consolidated Files to CREATE

1. **PERFORMANCE.md** - All performance optimizations
2. **GOOGLE_AUTH.md** - Complete auth architecture and implementation
3. **DEPLOYMENT.md** - Complete deployment guide
4. **TESTING.md** - All testing documentation
5. **FILTERING.md** - All filtering and role-based features

## Final Structure (~15 essential files)

```
/
├── README.md (main)
├── AUTHENTICATION.md (overview)
├── AUTHENTICATION_REDIRECT_FIX_COMPLETE.md (recent fix)
├── DEPLOYMENT.md (consolidated)
├── DEPLOYMENT_READY.md (current status)
├── GOOGLE_AUTH.md (consolidated)
├── GOOGLE_AUTH_SETUP.md (setup only)
├── SUPABASE_SETUP.md
├── PERFORMANCE.md (consolidated)
├── TESTING.md (consolidated)
├── FILTERING.md (consolidated)
├── DESIGN_SYSTEM.md (consolidated)
├── SALESFORCE_STAGE_MAPPING.md
├── EMPLOYEES_ACCOUNTS_MIGRATION.md
├── DEVICE_PREVIEW_IMPLEMENTATION.md
├── WORKSPACE_SIDEBAR_CHANGES.md
├── ICONS_LOCALIZATION.md
```

## Action Plan

1. Create new consolidated files
2. Delete obsolete fix docs
3. Move to archive folder if uncertain
4. Update README.md with new structure
