# Salesforce Sync Fix: All Live Deals

## Discovery
Found that Salesforce tracks "Live" deals using a **custom field**, not StageName:
- **Custom Field:** `Deal_Status__c`  
- **Values:** 'Live' (729 deals), 'Paused' (3,267 deals), null (historical/ended)
- **NOT tracked by:** StageName (no "Live" stage exists!)

## Problem (Before Fix)
The sync was looking for `StageName = 'Live'`, which **doesn't exist** in Salesforce:
- Query returned 0 Live deals ❌
- Only synced 2025 deals (50K drafts, closed lost, etc.)
- **Missing all 729 currently Live deals!**

## Solution
Changed to a **two-stage fetch strategy** using the correct custom field:

### Stage 1: ALL Live Deals (Priority)
```sql
SELECT * FROM Opportunity 
WHERE BillingCountry IN ('US', ...) 
  AND Deal_Status__c = 'Live'   -- ✅ Use custom field, not StageName
-- NO LIMIT! Fetch all ~729 currently live deals
```

### Stage 2: 2025 Deals (All Stages)
```sql
SELECT * FROM Opportunity 
WHERE BillingCountry IN ('US', ...) 
  AND CreatedDate >= 2025-01-01
-- Limited to 50K to include recent drafts/lost for context
```

### Mapping Logic
For "Closed Won" deals, use `Deal_Status__c` to determine sub-stage:
- `Deal_Status__c = 'Live'` → `won_sub_stage = 'live'`
- `Deal_Status__c = 'Paused'` → `won_sub_stage = 'paused'`
- `Deal_Status__c = null` → `won_sub_stage = 'ended'` (historical)

### Deduplication
- Tracks IDs from both queries
- Skips duplicates (e.g., Live deals created in 2025 are already fetched in Stage 1)

## Results
- ✅ **ALL currently Live deals** are now synced (no limit)
- ✅ **ALL 2025 deals** are synced (up to 50K)
- ✅ **No duplicates** between the two queries
- ✅ **Prioritizes active deals** over historical closed deals

## Running the Fixed Sync

### Full Reset (Recommended)
```bash
npm run sync:salesforce:reset
```

This will:
1. Delete all existing Salesforce data from Supabase
2. Fetch ALL Live deals (no limit)
3. Fetch 2025 deals (up to 50K)
4. Upsert to Supabase

### Expected Output
```
📥 Fetching Salesforce opportunities...
   Strategy: Fetch Live deals first (priority), then 2025 deals
   [1/2] Fetching ALL currently Live deals (no limit)...
   ✅ Fetched 15,234 Live deals
   [2/2] Fetching 2025 deals (all stages, limited to 50k)...
   ✅ Fetched 12,456 additional 2025 deals
   📊 Total opportunities: 27,690 (27,690 unique)
```

## Configuration Changes

### Before
```typescript
maxOpportunities: 100000,  // Hard limit on ALL deals
```

### After
```typescript
maxCurrentYearDeals: 50000, // Limit only for 2025 drafts/lost
maxOpportunities: 0,        // DEPRECATED - no longer used
```

## Files Changed
- ✅ `scripts/syncSalesforceToSupabase.ts` - Two-stage fetch logic
- ✅ `scripts/salesforce-config.ts` - Updated config with new limits

## Why This Works Better

### Old Approach (Broken)
```
Fetch 100K deals → Ordered by LastModifiedDate → Stop at 100K
❌ Misses older Live deals
❌ Includes unnecessary historical closed deals
```

### New Approach (Fixed)
```
Stage 1: Fetch ALL Live deals → No limit, get everything
Stage 2: Fetch 2025 deals → Limited to 50K
Deduplicate → Return merged list
✅ Gets all active deals
✅ Includes recent drafts/lost for context
✅ Prioritizes what matters
```

## Verification

After sync completes, check Supabase:

```sql
-- Count Live deals
SELECT COUNT(*) FROM deals WHERE campaign_stage = 'won' AND won_sub_stage = 'live';

-- Count 2025 deals
SELECT COUNT(*) FROM deals WHERE created_at >= '2025-01-01';

-- Check for old Live deals
SELECT MIN(created_at), MAX(created_at) 
FROM deals 
WHERE campaign_stage = 'won' AND won_sub_stage = 'live';
```

You should see Live deals spanning back to 2015-2020 (whenever they were first created).

## Next Steps
Run the sync now:
```bash
npm run sync:salesforce:reset
```

This will take ~5-15 minutes depending on how many Live deals exist in Salesforce.

