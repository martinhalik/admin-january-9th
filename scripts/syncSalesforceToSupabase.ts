/**
 * Salesforce to Supabase Sync Script (ONE-WAY SYNC)
 * 
 * Syncs accounts, opportunities (deals), and users (employees) from Salesforce to Supabase.
 * This is a ONE-WAY sync - Supabase acts as a staging environment and never pushes back to Salesforce.
 * 
 * Features:
 * - ONE-WAY: Salesforce → Supabase only (no write-back to Salesforce)
 * - Filters by US market only
 * - Only syncs data from the last 2 years + live deals
 * - Maps Salesforce stages to Supabase deal stages
 * - Uses upsert for efficient incremental updates
 * - Maintains referential integrity (users → accounts → deals)
 * - Reset option to wipe and re-fetch fresh data
 * 
 * Usage:
 *   npx tsx scripts/syncSalesforceToSupabase.ts
 *   npx tsx scripts/syncSalesforceToSupabase.ts --dry-run  # Preview without changes
 *   npx tsx scripts/syncSalesforceToSupabase.ts --full     # Full sync (ignore date filters)
 *   npx tsx scripts/syncSalesforceToSupabase.ts --reset    # Delete all SF data and re-sync fresh
 */

import jsforce from 'jsforce';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import {
  salesforceCredentials,
  syncConfig,
  getMappedStage,
  getMappedRole,
  getBusinessType,
} from './salesforce-config';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isFullSync = args.includes('--full');
const isReset = args.includes('--reset'); // Delete all SF-synced data and re-sync fresh

// Types for Salesforce objects
interface SalesforceUser {
  Id: string;
  Name: string;
  Email: string;
  Phone?: string;
  UserRole?: { Name: string } | null;
  Division?: string;
  Department?: string;
  ManagerId?: string;
  City?: string;
  State?: string;
  IsActive: boolean;
  CreatedDate: string;
}

interface SalesforceAccount {
  Id: string;
  Name: string;
  Type?: string;
  Industry?: string;
  BillingCity?: string;
  BillingState?: string;
  BillingCountry?: string;
  Phone?: string;
  Website?: string;
  OwnerId: string;
  Owner?: { Name: string; Email: string };
  ParentId?: string;
  Parent?: { Name: string };
  NumberOfEmployees?: number;
  Description?: string;
  CreatedDate: string;
  LastModifiedDate: string;
  IsDeleted?: boolean;
}

interface SalesforceOpportunity {
  Id: string;
  Name: string;
  StageName: string;
  Amount?: number;
  CloseDate: string;
  AccountId: string;
  Account?: { Name: string; BillingCity?: string; BillingState?: string };
  OwnerId: string;
  Owner?: { Name: string; Email: string };
  Type?: string;
  Description?: string;
  CreatedDate: string;
  LastModifiedDate: string;
  IsClosed: boolean;
  IsWon: boolean;
  Deal_Status__c?: string; // Custom field: 'Live', 'Paused', or null
  End_Date__c?: string;     // Custom field: Deal end date
  Go_Live_Date__c?: string; // Custom field: Deal go-live date
  ForecastCategory?: string;
  Probability?: number;
}

// Supabase types
interface SupabaseEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  role_title: string;
  avatar?: string;
  phone?: string;
  division?: string;
  department?: string;
  manager_id?: string;
  location?: string;
  hire_date?: string;
  status: string;
}

interface SupabaseMerchantAccount {
  id: string;
  name: string;
  business_type: string;
  location: string;
  status: string;
  potential: string;
  deals_count: number;
  account_owner_id?: string;
  salesforce_url?: string;
  parent_account?: string;
  brand?: string;
  notes?: string;
}

interface SupabaseDeal {
  id: string;
  title: string;
  location: string;
  merchant: string;
  city: string;
  division: string;
  category: string;
  subcategory?: string;
  campaign_stage: string;
  status: string;
  won_sub_stage?: string;
  draft_sub_stage?: string;
  lost_sub_stage?: string;
  revenue: number;
  deal_start?: string;
  deal_end?: string;
  account_id?: string;
  account_owner_id?: string;
  opportunity_owner_id?: string;
  created_at: string;
  updated_at: string;
}

class SalesforceSync {
  private sfConnection: jsforce.Connection;
  private supabase: SupabaseClient;
  private userCache: Map<string, SalesforceUser> = new Map();
  private accountCache: Map<string, SalesforceAccount> = new Map();
  private syncedEmployees: Set<string> = new Set();
  private syncedAccounts: Set<string> = new Set();
  
  constructor() {
    this.sfConnection = new jsforce.Connection({
      loginUrl: salesforceCredentials.loginUrl,
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  
  async connect(): Promise<void> {
    console.log('🔌 Connecting to Salesforce...');
    
    const password = salesforceCredentials.password + salesforceCredentials.securityToken;
    
    // Try OAuth2 first (with consumer key/secret)
    try {
      await this.sfConnection.login(
        salesforceCredentials.username,
        password
      );
      console.log('✅ Connected to Salesforce');
      console.log(`   Instance URL: ${this.sfConnection.instanceUrl}`);
    } catch (error) {
      console.error('❌ Failed to connect to Salesforce:', error);
      throw error;
    }
  }
  
  /**
   * Get the date filter for SOQL queries
   * Salesforce requires ISO 8601 datetime format: YYYY-MM-DDTHH:mm:ssZ
   */
  private getDateFilter(): string {
    if (isFullSync) {
      return '';
    }
    
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - (syncConfig.historicalYearsBack || 10));
    // Salesforce requires full datetime format with T and Z
    const dateStr = cutoffDate.toISOString();
    
    return `CreatedDate >= ${dateStr}`;
  }
  
  /**
   * Get the start of current year for filtering
   */
  private getCurrentYearStart(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return startOfYear.toISOString();
  }
  
  /**
   * Get the market filter for SOQL queries
   */
  private getMarketFilter(countryField: string = 'BillingCountry'): string {
    const markets = syncConfig.markets.map(m => `'${m}'`).join(', ');
    return `${countryField} IN (${markets})`;
  }
  
  /**
   * Fetch and cache Salesforce users (account owners and opportunity owners)
   */
  async fetchUsers(userIds: Set<string>): Promise<void> {
    if (userIds.size === 0) return;
    
    console.log(`📥 Fetching ${userIds.size} Salesforce users...`);
    
    const idList = Array.from(userIds).map(id => `'${id}'`).join(', ');
    
    const query = `
      SELECT Id, Name, Email, Phone, UserRole.Name, Division, Department, 
             ManagerId, City, State, IsActive, CreatedDate
      FROM User
      WHERE Id IN (${idList})
    `;
    
    const result = await this.sfConnection.query<SalesforceUser>(query);
    
    for (const user of result.records) {
      this.userCache.set(user.Id, user);
    }
    
    console.log(`   Cached ${result.records.length} users`);
  }
  
  /**
   * Fetch accounts from Salesforce (US market only)
   * Handles pagination for large datasets
   * Excludes accounts owned by generic/system users
   */
  async fetchAccounts(): Promise<SalesforceAccount[]> {
    console.log('📥 Fetching Salesforce accounts (US market, real owners only)...');
    
    const dateFilter = this.getDateFilter();
    const marketFilter = this.getMarketFilter();
    
    let whereClause = marketFilter;
    if (dateFilter) {
      whereClause += ` AND ${dateFilter}`;
    }
    
    // Exclude generic/system account owners
    if (syncConfig.excludeOwnerNames && syncConfig.excludeOwnerNames.length > 0) {
      const excludeList = syncConfig.excludeOwnerNames.map(n => `'${n}'`).join(', ');
      whereClause += ` AND Owner.Name NOT IN (${excludeList})`;
    }
    
    const query = `
      SELECT Id, Name, Type, Industry, BillingCity, BillingState, BillingCountry,
             Phone, Website, OwnerId, Owner.Name, Owner.Email,
             ParentId, Parent.Name, NumberOfEmployees, Description,
             CreatedDate, LastModifiedDate
      FROM Account
      WHERE ${whereClause}
      ORDER BY LastModifiedDate DESC
    `;
    
    console.log('   Query:', query.replace(/\s+/g, ' ').trim());
    
    // Use queryAll to handle pagination automatically
    const allRecords: SalesforceAccount[] = [];
    let result = await this.sfConnection.query<SalesforceAccount>(query);
    allRecords.push(...result.records);
    
    // Handle pagination if there are more records
    const maxRecords = syncConfig.maxAccounts || Infinity;
    while (!result.done && result.nextRecordsUrl && allRecords.length < maxRecords) {
      console.log(`   Fetching more accounts (${allRecords.length} so far)...`);
      result = await this.sfConnection.queryMore<SalesforceAccount>(result.nextRecordsUrl);
      allRecords.push(...result.records);
    }
    
    // Apply limit if set
    const finalRecords = maxRecords < Infinity ? allRecords.slice(0, maxRecords) : allRecords;
    
    // Cache accounts
    for (const account of finalRecords) {
      this.accountCache.set(account.Id, account);
    }
    
    console.log(`   Found ${finalRecords.length} accounts${maxRecords < Infinity ? ` (limited to ${maxRecords})` : ''}`);
    return finalRecords;
  }
  
  /**
   * Fetch opportunities from Salesforce
   * - 2025 (current year): ALL deals regardless of stage
   * - 2015-2024: Only Live deals (still active on website)
   * - US market only (via Account relationship)
   * - Handles pagination for large datasets
   */
  async fetchOpportunities(): Promise<SalesforceOpportunity[]> {
    console.log('📥 Fetching Salesforce opportunities...');
    console.log('   Strategy: Fetch Live deals first (priority), then 2025 deals');
    
    const historicalCutoff = this.getDateFilter();
    const currentYearStart = this.getCurrentYearStart();
    const marketFilter = this.getMarketFilter('Account.BillingCountry');
    const allRecords: SalesforceOpportunity[] = [];
    const seenIds = new Set<string>();
    
    // STEP 1: Fetch ALL "Live" deals (no limit - these are the important ones!)
    // Note: Live deals are tracked via Deal_Status__c custom field, not StageName
    console.log('   [1/2] Fetching ALL currently Live deals (Deal_Status__c = Live)...');
    const liveQuery = `
      SELECT Id, Name, StageName, Amount, CloseDate, 
      AccountId, Account.Name, Account.BillingCity, Account.BillingState,
      OwnerId, Owner.Name, Owner.Email,
      Type, Description, CreatedDate, LastModifiedDate,
      IsClosed, IsWon, ForecastCategory, Probability,
      Deal_Status__c, End_Date__c, Go_Live_Date__c
      FROM Opportunity
      WHERE ${marketFilter} AND Deal_Status__c = 'Live'
      ORDER BY LastModifiedDate DESC
    `;
    
    console.log('   Query:', liveQuery.replace(/\s+/g, ' ').trim());
    
    let liveResult = await this.sfConnection.query<SalesforceOpportunity>(liveQuery);
    for (const record of liveResult.records) {
      if (!seenIds.has(record.Id)) {
        allRecords.push(record);
        seenIds.add(record.Id);
      }
    }
    
    // Handle pagination for Live deals (no limit!)
    while (!liveResult.done && liveResult.nextRecordsUrl) {
      console.log(`   Fetching more Live deals (${allRecords.length} so far)...`);
      liveResult = await this.sfConnection.queryMore<SalesforceOpportunity>(liveResult.nextRecordsUrl);
      for (const record of liveResult.records) {
        if (!seenIds.has(record.Id)) {
          allRecords.push(record);
          seenIds.add(record.Id);
        }
      }
    }
    
    console.log(`   ✅ Fetched ${allRecords.length} Live deals`);
    
    // STEP 2: Fetch 2025 deals (all stages) with a reasonable limit
    console.log('   [2/2] Fetching 2025 deals (all stages, limited to 50k)...');
    const currentYearQuery = `
      SELECT Id, Name, StageName, Amount, CloseDate, 
             AccountId, Account.Name, Account.BillingCity, Account.BillingState,
             OwnerId, Owner.Name, Owner.Email,
             Type, Description, CreatedDate, LastModifiedDate,
             IsClosed, IsWon, ForecastCategory, Probability,
             Deal_Status__c, End_Date__c, Go_Live_Date__c
      FROM Opportunity
      WHERE ${marketFilter} AND CreatedDate >= ${currentYearStart}
      ORDER BY LastModifiedDate DESC
    `;
    
    console.log('   Query:', currentYearQuery.replace(/\s+/g, ' ').trim());
    
    let currentYearResult = await this.sfConnection.query<SalesforceOpportunity>(currentYearQuery);
    for (const record of currentYearResult.records) {
      if (!seenIds.has(record.Id)) {
        allRecords.push(record);
        seenIds.add(record.Id);
      }
    }
    
    // Handle pagination for 2025 deals (limit to avoid over-fetching drafts/lost deals)
    const maxCurrentYearDeals = syncConfig.maxCurrentYearDeals || 50000;
    let currentYearCount = currentYearResult.records.length;
    while (!currentYearResult.done && currentYearResult.nextRecordsUrl && currentYearCount < maxCurrentYearDeals) {
      console.log(`   Fetching more 2025 deals (${currentYearCount} so far, max ${maxCurrentYearDeals})...`);
      currentYearResult = await this.sfConnection.queryMore<SalesforceOpportunity>(currentYearResult.nextRecordsUrl);
      for (const record of currentYearResult.records) {
        if (!seenIds.has(record.Id)) {
          allRecords.push(record);
          seenIds.add(record.Id);
          currentYearCount++;
          if (currentYearCount >= maxCurrentYearDeals) break;
        }
      }
    }
    
    console.log(`   ✅ Fetched ${currentYearCount} additional 2025 deals`);
    console.log(`   📊 Total opportunities: ${allRecords.length} (${seenIds.size} unique)`);
    
    return allRecords;
  }
  
  /**
   * Collect all user IDs that need to be synced
   */
  collectUserIds(accounts: SalesforceAccount[], opportunities: SalesforceOpportunity[]): Set<string> {
    const userIds = new Set<string>();
    
    for (const account of accounts) {
      if (account.OwnerId) userIds.add(account.OwnerId);
    }
    
    for (const opp of opportunities) {
      if (opp.OwnerId) userIds.add(opp.OwnerId);
    }
    
    return userIds;
  }
  
  /**
   * Transform Salesforce User to Supabase Employee
   */
  transformUserToEmployee(user: SalesforceUser): SupabaseEmployee {
    const roleInfo = getMappedRole(user.UserRole?.Name);
    const location = [user.City, user.State].filter(Boolean).join(', ');
    
    return {
      id: `sf-${user.Id}`,
      name: user.Name,
      email: user.Email,
      role: roleInfo.role,
      role_title: roleInfo.roleTitle,
      phone: user.Phone,
      division: user.Division || undefined,
      department: user.Department || undefined,
      manager_id: user.ManagerId ? `sf-${user.ManagerId}` : undefined,
      location: location || undefined,
      hire_date: user.CreatedDate ? user.CreatedDate.split('T')[0] : undefined,
      status: user.IsActive ? 'active' : 'inactive',
    };
  }
  
  /**
   * Transform Salesforce Account to Supabase Merchant Account
   */
  transformAccountToMerchant(account: SalesforceAccount): SupabaseMerchantAccount {
    const location = [account.BillingCity, account.BillingState].filter(Boolean).join(', ');
    
    // Determine potential based on various factors
    let potential: 'high' | 'mid' | 'low' = 'mid';
    if (account.NumberOfEmployees && account.NumberOfEmployees > 100) {
      potential = 'high';
    } else if (account.NumberOfEmployees && account.NumberOfEmployees < 10) {
      potential = 'low';
    }
    
    return {
      id: `sf-${account.Id}`,
      name: account.Name,
      business_type: getBusinessType(account.Industry),
      location: location || 'Unknown',
      status: 'active',
      potential,
      deals_count: 0, // Will be updated after opportunity sync
      account_owner_id: account.OwnerId ? `sf-${account.OwnerId}` : undefined,
      salesforce_url: `${this.sfConnection.instanceUrl}/${account.Id}`,
      parent_account: account.Parent?.Name,
      notes: account.Description,
    };
  }
  
  /**
   * Transform Salesforce Opportunity to Supabase Deal
   */
  transformOpportunityToDeal(opp: SalesforceOpportunity): SupabaseDeal {
    const stageInfo = getMappedStage(opp.StageName);
    const location = opp.Account 
      ? [opp.Account.BillingCity, opp.Account.BillingState].filter(Boolean).join(', ')
      : 'Unknown';
    
    // Determine division based on state
    const division = this.getDivisionFromState(opp.Account?.BillingState);
    
    // Build sub-stage fields
    // IMPORTANT: Use Deal_Status__c custom field to determine won sub-stage
    const subStageFields: Partial<SupabaseDeal> = {};
    if (stageInfo.campaignStage === 'draft') {
      subStageFields.draft_sub_stage = stageInfo.subStage;
    } else if (stageInfo.campaignStage === 'won' || opp.StageName === 'Closed Won') {
      // For won deals, use Deal_Status__c custom field (more accurate than stage mapping)
      const dealStatus = (opp as any).Deal_Status__c;
      if (dealStatus === 'Live') {
        subStageFields.won_sub_stage = 'live';
      } else if (dealStatus === 'Paused') {
        subStageFields.won_sub_stage = 'paused';
      } else {
        // No status or null = ended/historical deal
        subStageFields.won_sub_stage = 'ended';
      }
    } else if (stageInfo.campaignStage === 'lost') {
      subStageFields.lost_sub_stage = stageInfo.subStage;
    }
    
    return {
      id: `sf-${opp.Id}`,
      title: opp.Name,
      location: location,
      merchant: opp.Account?.Name || 'Unknown Merchant',
      city: opp.Account?.BillingCity || 'Unknown',
      division: division,
      category: this.getCategoryFromType(opp.Type),
      campaign_stage: stageInfo.campaignStage,
      status: stageInfo.status,
      ...subStageFields,
      revenue: opp.Amount || 0,
      deal_start: opp.CreatedDate?.split('T')[0],
      deal_end: opp.CloseDate,
      account_id: opp.AccountId ? `sf-${opp.AccountId}` : undefined,
      account_owner_id: this.accountCache.get(opp.AccountId)?.OwnerId 
        ? `sf-${this.accountCache.get(opp.AccountId)!.OwnerId}` 
        : undefined,
      opportunity_owner_id: opp.OwnerId ? `sf-${opp.OwnerId}` : undefined,
      created_at: opp.CreatedDate,
      updated_at: opp.LastModifiedDate,
    };
  }
  
  /**
   * Map US state to division
   */
  private getDivisionFromState(state?: string): string {
    if (!state) return 'East (USA)';
    
    const eastStates = ['NY', 'NJ', 'PA', 'MA', 'CT', 'RI', 'NH', 'VT', 'ME', 'MD', 'DE', 'DC', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL'];
    const centralStates = ['IL', 'OH', 'MI', 'IN', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'SD', 'ND', 'TX', 'OK', 'AR', 'LA', 'MS', 'AL', 'TN', 'KY'];
    const westStates = ['CA', 'WA', 'OR', 'NV', 'AZ', 'NM', 'CO', 'UT', 'ID', 'MT', 'WY', 'AK', 'HI'];
    
    const normalizedState = state.toUpperCase().trim();
    
    if (eastStates.includes(normalizedState)) return 'East (USA)';
    if (centralStates.includes(normalizedState)) return 'Central (USA)';
    if (westStates.includes(normalizedState)) return 'West (USA)';
    
    return 'East (USA)'; // Default
  }
  
  /**
   * Map opportunity type to category
   */
  private getCategoryFromType(type?: string): string {
    if (!type) return 'Food & Drink';
    
    const typeMapping: Record<string, string> = {
      'New Business': 'Food & Drink',
      'Existing Business': 'Food & Drink',
      'Restaurant': 'Food & Drink',
      'Spa': 'Health & Beauty',
      'Wellness': 'Health & Beauty',
      'Fitness': 'Health & Fitness',
      'Retail': 'Shopping',
      'Entertainment': 'Activities & Entertainment',
      'Travel': 'Travel & Lodging',
    };
    
    return typeMapping[type] || 'Food & Drink';
  }
  
  /**
   * Upsert employees to Supabase
   * Handles manager hierarchy by first inserting without manager_id, then updating
   * Deduplicates by email to avoid unique constraint violations
   */
  async upsertEmployees(employees: SupabaseEmployee[]): Promise<void> {
    if (isDryRun) {
      console.log(`[DRY RUN] Would upsert ${employees.length} employees`);
      return;
    }
    
    console.log(`📤 Upserting ${employees.length} employees to Supabase...`);
    
    // Deduplicate by email (keep first occurrence)
    const emailMap = new Map<string, SupabaseEmployee>();
    for (const emp of employees) {
      if (!emailMap.has(emp.email)) {
        emailMap.set(emp.email, emp);
      }
    }
    const dedupedEmployees = Array.from(emailMap.values());
    console.log(`   Deduplicated: ${employees.length} → ${dedupedEmployees.length} unique emails`);
    
    // Step 1: Insert all employees WITHOUT manager_id to avoid FK issues
    const employeesWithoutManagers = dedupedEmployees.map(e => ({
      ...e,
      manager_id: null, // Remove manager reference initially
    }));
    
    for (let i = 0; i < employeesWithoutManagers.length; i += syncConfig.batchSize) {
      const batch = employeesWithoutManagers.slice(i, i + syncConfig.batchSize);
      
      const { error } = await this.supabase
        .from('employees')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`   Error upserting employees batch ${i}:`, error);
        throw error;
      }
      
      batch.forEach(e => this.syncedEmployees.add(e.id));
    }
    
    // Step 2: Update manager_id for employees that have managers in our sync
    console.log(`   Updating manager relationships...`);
    const employeesWithManagers = dedupedEmployees.filter(e => e.manager_id && this.syncedEmployees.has(e.manager_id));
    
    for (const emp of employeesWithManagers) {
      await this.supabase
        .from('employees')
        .update({ manager_id: emp.manager_id })
        .eq('id', emp.id);
    }
    
    console.log(`   ✅ Upserted ${dedupedEmployees.length} employees (${employeesWithManagers.length} with managers)`);
  }
  
  /**
   * Upsert merchant accounts to Supabase
   */
  async upsertAccounts(accounts: SupabaseMerchantAccount[]): Promise<void> {
    if (isDryRun) {
      console.log(`[DRY RUN] Would upsert ${accounts.length} merchant accounts`);
      return;
    }
    
    console.log(`📤 Upserting ${accounts.length} merchant accounts to Supabase...`);
    
    // Process in batches
    for (let i = 0; i < accounts.length; i += syncConfig.batchSize) {
      const batch = accounts.slice(i, i + syncConfig.batchSize);
      
      // Filter out accounts with non-existent account owners
      const validBatch = batch.map(a => ({
        ...a,
        account_owner_id: a.account_owner_id && this.syncedEmployees.has(a.account_owner_id) 
          ? a.account_owner_id 
          : null,
      }));
      
      const { error } = await this.supabase
        .from('merchant_accounts')
        .upsert(validBatch, { onConflict: 'id' });
      
      if (error) {
        console.error(`   Error upserting accounts batch ${i}:`, error);
        throw error;
      }
      
      batch.forEach(a => this.syncedAccounts.add(a.id));
    }
    
    console.log(`   ✅ Upserted ${accounts.length} merchant accounts`);
  }
  
  /**
   * Upsert deals to Supabase
   */
  async upsertDeals(deals: SupabaseDeal[]): Promise<void> {
    if (isDryRun) {
      console.log(`[DRY RUN] Would upsert ${deals.length} deals`);
      return;
    }
    
    console.log(`📤 Upserting ${deals.length} deals to Supabase...`);
    
    // Process in batches
    for (let i = 0; i < deals.length; i += syncConfig.batchSize) {
      const batch = deals.slice(i, i + syncConfig.batchSize);
      
      // Filter out deals with non-existent foreign keys
      const validBatch = batch.map(d => ({
        ...d,
        account_id: d.account_id && this.syncedAccounts.has(d.account_id) 
          ? d.account_id 
          : null,
        account_owner_id: d.account_owner_id && this.syncedEmployees.has(d.account_owner_id) 
          ? d.account_owner_id 
          : null,
        opportunity_owner_id: d.opportunity_owner_id && this.syncedEmployees.has(d.opportunity_owner_id) 
          ? d.opportunity_owner_id 
          : null,
      }));
      
      const { error } = await this.supabase
        .from('deals')
        .upsert(validBatch, { onConflict: 'id' });
      
      if (error) {
        console.error(`   Error upserting deals batch ${i}:`, error);
        throw error;
      }
    }
    
    console.log(`   ✅ Upserted ${deals.length} deals`);
  }
  
  /**
   * Delete all Salesforce-synced data from Supabase
   * This allows a fresh re-sync without manual cleanup
   * Only deletes records with IDs starting with 'sf-'
   */
  async resetSalesforceData(): Promise<void> {
    if (isDryRun) {
      console.log('[DRY RUN] Would delete all Salesforce-synced data (sf-* records)');
      return;
    }
    
    console.log('🗑️  Deleting all Salesforce-synced data from Supabase...');
    
    // Delete in reverse order of dependencies: deals → accounts → employees
    
    // 1. Delete deals with sf- prefix
    const { error: dealsError, count: dealsCount } = await this.supabase
      .from('deals')
      .delete({ count: 'exact' })
      .like('id', 'sf-%');
    
    if (dealsError) {
      console.error('   Error deleting deals:', dealsError);
    } else {
      console.log(`   Deleted ${dealsCount || 0} deals`);
    }
    
    // 2. Delete merchant accounts with sf- prefix
    const { error: accountsError, count: accountsCount } = await this.supabase
      .from('merchant_accounts')
      .delete({ count: 'exact' })
      .like('id', 'sf-%');
    
    if (accountsError) {
      console.error('   Error deleting accounts:', accountsError);
    } else {
      console.log(`   Deleted ${accountsCount || 0} merchant accounts`);
    }
    
    // 3. Delete employees with sf- prefix
    const { error: employeesError, count: employeesCount } = await this.supabase
      .from('employees')
      .delete({ count: 'exact' })
      .like('id', 'sf-%');
    
    if (employeesError) {
      console.error('   Error deleting employees:', employeesError);
    } else {
      console.log(`   Deleted ${employeesCount || 0} employees`);
    }
    
    console.log('   ✅ Salesforce data cleared - ready for fresh sync');
  }
  
  /**
   * Update deal counts on merchant accounts
   */
  async updateDealCounts(): Promise<void> {
    if (isDryRun) {
      console.log('[DRY RUN] Would update deal counts');
      return;
    }
    
    console.log('📊 Updating deal counts on merchant accounts...');
    
    // Get deal counts per account
    const { data: dealCounts, error: countError } = await this.supabase
      .from('deals')
      .select('account_id')
      .not('account_id', 'is', null);
    
    if (countError) {
      console.error('   Error getting deal counts:', countError);
      return;
    }
    
    // Count deals per account
    const counts: Record<string, number> = {};
    for (const deal of dealCounts || []) {
      if (deal.account_id) {
        counts[deal.account_id] = (counts[deal.account_id] || 0) + 1;
      }
    }
    
    // Update each account
    for (const [accountId, count] of Object.entries(counts)) {
      await this.supabase
        .from('merchant_accounts')
        .update({ deals_count: count })
        .eq('id', accountId);
    }
    
    console.log(`   ✅ Updated deal counts for ${Object.keys(counts).length} accounts`);
  }
  
  /**
   * Fetch missing accounts that are referenced by opportunities but not in cache
   */
  async fetchMissingAccounts(accountIds: Set<string>): Promise<SalesforceAccount[]> {
    const missingIds = Array.from(accountIds).filter(id => !this.accountCache.has(id));
    
    if (missingIds.length === 0) {
      console.log('   ✅ All opportunity accounts are already cached');
      return [];
    }
    
    console.log(`📥 Fetching ${missingIds.length} additional accounts referenced by opportunities...`);
    
    const missingAccounts: SalesforceAccount[] = [];
    const batchSize = 200; // Salesforce has a limit on query length
    
    for (let i = 0; i < missingIds.length; i += batchSize) {
      const batch = missingIds.slice(i, i + batchSize);
      const idList = batch.map(id => `'${id}'`).join(', ');
      
      const query = `
        SELECT Id, Name, Type, Industry, BillingCity, BillingState, BillingCountry,
               Phone, Website, OwnerId, Owner.Name, Owner.Email,
               ParentId, Parent.Name, NumberOfEmployees, Description,
               CreatedDate, LastModifiedDate
        FROM Account
        WHERE Id IN (${idList})
      `;
      
      try {
        const result = await this.sfConnection.query<SalesforceAccount>(query);
        missingAccounts.push(...result.records);
        
        // Add to cache
        for (const account of result.records) {
          this.accountCache.set(account.Id, account);
        }
        
        if (i + batchSize < missingIds.length) {
          console.log(`   Fetched ${missingAccounts.length}/${missingIds.length} missing accounts...`);
        }
      } catch (error) {
        console.error(`   Error fetching accounts batch starting at ${i}:`, error);
      }
    }
    
    console.log(`   ✅ Fetched ${missingAccounts.length} missing accounts`);
    return missingAccounts;
  }
  
  /**
   * Run the full sync process (ONE-WAY: Salesforce → Supabase)
   */
  async sync(): Promise<void> {
    console.log('🚀 Starting Salesforce to Supabase sync (ONE-WAY)...');
    console.log(`   Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`   Reset: ${isReset ? 'YES - will delete existing SF data first' : 'NO - incremental update'}`);
    console.log(`   Date filter: ${isFullSync ? 'FULL (no date filter)' : `2025: all stages | 2015-2024: Live only`}`);
    console.log(`   Markets: ${syncConfig.markets.join(', ')}`);
    console.log('');
    
    try {
      // 0. Reset Salesforce data if requested
      if (isReset) {
        await this.resetSalesforceData();
        console.log('');
      }
      
      // 1. Connect to Salesforce
      await this.connect();
      console.log('');
      
      // 2. Fetch initial accounts (with date filter)
      const sfAccounts = await this.fetchAccounts();
      console.log('');
      
      // 3. Fetch opportunities
      const sfOpportunities = await this.fetchOpportunities();
      console.log('');
      
      // 4. Fetch any missing accounts that opportunities reference
      const opportunityAccountIds = new Set(
        sfOpportunities
          .filter(opp => opp.AccountId)
          .map(opp => opp.AccountId)
      );
      console.log(`🔍 Checking for missing accounts (${opportunityAccountIds.size} unique account IDs in opportunities)...`);
      const missingAccounts = await this.fetchMissingAccounts(opportunityAccountIds);
      const allAccounts = [...sfAccounts, ...missingAccounts];
      console.log(`   📊 Total accounts: ${allAccounts.length} (${sfAccounts.length} initial + ${missingAccounts.length} missing)`);
      console.log('');
      
      // 5. Collect and fetch users
      const userIds = this.collectUserIds(allAccounts, sfOpportunities);
      await this.fetchUsers(userIds);
      console.log('');
      
      // 6. Transform data
      console.log('🔄 Transforming data...');
      
      const employees: SupabaseEmployee[] = [];
      for (const userId of userIds) {
        const user = this.userCache.get(userId);
        if (user) {
          employees.push(this.transformUserToEmployee(user));
        }
      }
      console.log(`   ${employees.length} employees`);
      
      const accounts = allAccounts.map(a => this.transformAccountToMerchant(a));
      console.log(`   ${accounts.length} merchant accounts`);
      
      const deals = sfOpportunities.map(o => this.transformOpportunityToDeal(o));
      console.log(`   ${deals.length} deals`);
      console.log('');
      
      // 7. Upsert to Supabase (in order: employees → accounts → deals)
      await this.upsertEmployees(employees);
      await this.upsertAccounts(accounts);
      await this.upsertDeals(deals);
      console.log('');
      
      // 8. Update deal counts
      await this.updateDealCounts();

      // 9. Refresh materialized views (for dashboard performance)
      if (!isDryRun) {
        console.log('🔄 Refreshing dashboard stats (Materialized View)...');
        const { error: refreshError } = await this.supabase.rpc('refresh_deal_stats');
        if (refreshError) {
          console.log('⚠️  Could not refresh deal stats (function might not exist yet).');
          console.log('   Please run supabase/migrations/optimize_dashboard_load.sql');
        } else {
          console.log('✅ Dashboard stats refreshed!');
        }
      }
      console.log('');
      
      // 10. Summary
      console.log('═'.repeat(50));
      console.log('📊 SYNC SUMMARY');
      console.log('═'.repeat(50));
      console.log(`   Employees synced: ${employees.length}`);
      console.log(`   Accounts synced:  ${accounts.length}`);
      console.log(`   Deals synced:     ${deals.length}`);
      console.log('');
      
      if (isDryRun) {
        console.log('⚠️  This was a DRY RUN - no data was written to Supabase');
      } else {
        console.log('✅ Sync completed successfully!');
      }
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      throw error;
    }
  }
}

// Main entry point
async function main() {
  const syncer = new SalesforceSync();
  await syncer.sync();
}

main().catch(console.error);

