# Salesforce Deal Stage Mapping

## Summary
This document explains how Salesforce Opportunity stages are mapped to our internal campaign stages, and specifically how to differentiate won sub-stages like scheduled, live, paused, ended, etc.

## Key Discovery
Salesforce uses **custom fields**, not just StageName, to track the actual status of won deals:
- **`Deal_Status__c`**: Custom picklist field with values 'Live', 'Paused', or null
- **`Go_Live_Date__c`**: Custom date field indicating when a deal goes live
- **`End_Date__c`**: Custom date field indicating when a deal ends (rarely populated)

## Current Data (US Market, as of sync)
- **Total Closed Won deals in SF (2023+):** ~228,587
- **Currently Live:** 729 deals (Deal_Status__c = 'Live')
- **Paused:** 3,267 deals (Deal_Status__c = 'Paused')
- **Scheduled:** 406 deals (Go_Live_Date__c > TODAY)
- **Ended/Historical:** ~2.9M deals (Closed Won with Deal_Status__c = null)

## Mapping Logic

### Campaign Stages (Top Level)
```typescript
// Salesforce StageName → Our campaign_stage
'Newly Assigned'           → 'draft'
'Prospecting'              → 'draft'
'Appointment Set'          → 'draft'
'Proposal Sent'            → 'draft'
'Contract Sent'            → 'draft'
'Deal Structure Approved'  → 'draft'

'Closed Won'               → 'won'

'Closed Lost'              → 'lost'
'Unqualified'              → 'lost'
'Merchant Not Interested'  → 'lost'
'DNR'                      → 'lost'
```

### Won Sub-Stages (The Important Part)
For deals with `StageName = 'Closed Won'`, use **custom fields** to determine sub-stage:

```typescript
if (Go_Live_Date__c > TODAY) {
  won_sub_stage = 'scheduled'  // 406 deals
}
else if (Deal_Status__c === 'Live') {
  won_sub_stage = 'live'  // 729 deals
}
else if (Deal_Status__c === 'Paused') {
  won_sub_stage = 'paused'  // 3,267 deals
}
else if (Deal_Status__c === null || Deal_Status__c === '') {
  won_sub_stage = 'ended'  // ~2.9M deals (historical)
}
```

## Sub-Stage Definitions

### Scheduled (won_sub_stage = 'scheduled')
- **Criteria:** Go_Live_Date__c > TODAY
- **Count:** ~406 deals
- **Meaning:** Deal is won but hasn't gone live yet
- **Example:** Deal closed today, scheduled to go live January 1st

### Live (won_sub_stage = 'live')
- **Criteria:** Deal_Status__c = 'Live'
- **Count:** ~729 deals
- **Meaning:** Deal is currently active on the website
- **Example:** Active Groupon deal customers can purchase right now

### Paused (won_sub_stage = 'paused')
- **Criteria:** Deal_Status__c = 'Paused'
- **Count:** ~3,267 deals
- **Meaning:** Deal was live but is temporarily paused
- **Example:** Merchant requested to pause due to capacity issues

### Ended (won_sub_stage = 'ended')
- **Criteria:** StageName = 'Closed Won' AND Deal_Status__c = null
- **Count:** ~2.9M deals (historical)
- **Meaning:** Deal ran and has completed/expired
- **Note:** We currently DO NOT sync these historical deals unless they have a specific status

### Sold Out (won_sub_stage = 'sold_out')
- **Criteria:** TBD - needs custom logic or field
- **Meaning:** Deal ended early because inventory sold out
- **Note:** Not yet implemented in sync

## Draft Sub-Stages
```typescript
'Newly Assigned'           → draft_sub_stage = 'prospecting'
'Initial Outreach'         → draft_sub_stage = 'prospecting'
'Appointment Set'          → draft_sub_stage = 'appointment'
'Proposal Sent'            → draft_sub_stage = 'proposal'
'Contract Sent'            → draft_sub_stage = 'contract_sent'
'Deal Structure Approved'  → draft_sub_stage = 'approved'
```

## Lost Sub-Stages
```typescript
'Closed Lost'              → lost_sub_stage = 'closed_lost'
'Unqualified'              → lost_sub_stage = 'closed_lost'
'DNR'                      → lost_sub_stage = 'closed_lost'
'ROI/Capacity'             → lost_sub_stage = 'closed_lost'
```

## Sync Strategy

### What We Currently Sync
1. **ALL Live deals** (729 deals with Deal_Status__c = 'Live')
   - No limit, fetch everything
   - Priority #1 - these are active revenue-generating deals

2. **ALL 2025 deals** (up to 50K)
   - All stages: Draft, Won, Lost
   - Includes scheduled, paused, and recent deals

### What We DON'T Sync
- **Historical Closed Won deals** (~2.9M deals with Deal_Status__c = null)
  - Too much data for a staging environment
  - These deals have ended and are not actively generating revenue
  - Can be synced on-demand if needed with `--full` flag

## IR Request / Change Request
**Question:** How to identify deals with IR (Image Revision) requests or change requests?

**Investigation Results:**
- No specific `IR_Request__c` field found
- Possible indicators:
  - `Structure_Change_post_CW__c` (picklist) - Structure Change post CW?
  - `Feature_Date_Change_Date__c` (date) - Feature Date Change Date
  - `Re-Structure` stage - might indicate restructure in progress
  - `Merchant_Editorial_Review_Required__c` (boolean) - Expedite This!

**Recommendation:** Ask the business team which field tracks IR requests, or if it's a separate system/process.

## Recently Closed
**Definition:** Deals where CloseDate = LAST_N_DAYS:30

**Distribution (US, Last 30 days):**
- Closed Lost: 22,024 deals
- Closed Won: 4,277 deals
- Newly Assigned: 17,584 deals
- Prospecting: 10,040 deals

This could be a useful filter in the UI to show "Recently Closed Deals" (last 30 days).

## View Your Stage Mapping
Navigate to **Admin → Salesforce Stage Mapping** to see:
- How many deals are in each campaign stage
- Breakdown of sub-stages
- Percentage distribution
- Live comparison with Salesforce numbers

## Files
- **Sync Script:** `scripts/syncSalesforceToSupabase.ts`
- **Config:** `scripts/salesforce-config.ts`
- **Mapping Logic:** `scripts/salesforce-config.ts` → `salesforceStageToSupabaseMap`
- **Debug Page:** `frontend/src/pages/SalesforceStageMapping.tsx`
- **Investigation Scripts:**
  - `scripts/investigate-live-deals.ts`
  - `scripts/investigate-stage-mapping.ts`

## Next Steps
1. Confirm with business team what "IR Request" means and how to identify them
2. Decide if we need to sync historical ended deals (or keep limit at 50K total)
3. Implement "Sold Out" detection if there's a specific field for it
4. Add "Recently Closed" filter to deals page (CloseDate = LAST_N_DAYS:30)




