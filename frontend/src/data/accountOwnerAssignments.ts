/**
 * Utility to fetch merchant accounts from Supabase
 * This replaces the mock data with real database queries
 */

import { MerchantAccount, AccountPerson } from './merchantAccounts';
import { getEmployeeById } from './companyHierarchy';
import { fetchMerchantAccounts, fetchAccountsForOwner, type MerchantAccount as SupabaseMerchantAccount } from '../lib/supabaseData';

// Cache for merchant accounts
let accountsCache: MerchantAccount[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Convert Supabase merchant account to our MerchantAccount interface
 */
function convertSupabaseMerchantAccount(acc: SupabaseMerchantAccount): MerchantAccount {
  const accountOwner: AccountPerson | undefined = acc.account_owner_id ? {
    id: acc.account_owner_id,
    name: acc.owner_name || '',
    email: acc.owner_email || '',
    avatar: acc.owner_avatar,
    role: acc.owner_role || '',
  } : undefined;

  return {
    id: acc.id,
    name: acc.name,
    permalink: acc.name.toLowerCase().replace(/\s+/g, '-'),
    businessType: acc.business_type,
    location: acc.location,
    contactName: '',
    contactEmail: '',
    phone: '',
    description: '',
    status: acc.status,
    potential: acc.potential,
    dealsCount: acc.deals_count,
    createdDate: new Date().toISOString(),
    potentialAnalysis: {
      overall: acc.potential,
      score: acc.potential === 'high' ? 85 : acc.potential === 'mid' ? 60 : 35,
      factors: {
        marketDemand: { score: 0, notes: '' },
        historicalPerformance: { score: 0, notes: '' },
        competitivePosition: { score: 0, notes: '' },
        growthTrend: { score: 0, notes: '' },
        customerSatisfaction: { score: 0, notes: '' },
      },
      recommendations: [],
      insights: '',
    },
    accountOwner,
  };
}

/**
 * Load merchant accounts from Supabase
 */
export async function loadMerchantAccounts(): Promise<MerchantAccount[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (accountsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return accountsCache;
  }

  try {
    const supabaseAccounts = await fetchMerchantAccounts();
    accountsCache = supabaseAccounts.map(convertSupabaseMerchantAccount);
    cacheTimestamp = now;
    return accountsCache;
  } catch (error) {
    console.error('Error loading merchant accounts from Supabase:', error);
    // Return cached data even if expired, or empty array
    return accountsCache || [];
  }
}

/**
 * Get merchant accounts with assigned owners (uses cache)
 */
export function getMerchantAccountsWithOwners(): MerchantAccount[] {
  if (!accountsCache) {
    console.warn('Merchant accounts not loaded yet. Call loadMerchantAccounts() first.');
    return [];
  }
  return accountsCache;
}

/**
 * Legacy export for backward compatibility
 */
export const merchantAccountsWithOwners: MerchantAccount[] = [];

/**
 * Update the merchantAccountsWithOwners array (called after loading)
 */
export function updateMerchantAccountsData(accounts: MerchantAccount[]) {
  merchantAccountsWithOwners.length = 0;
  merchantAccountsWithOwners.push(...accounts);
}

/**
 * Get accounts for a specific owner
 */
export function getAccountsForOwner(ownerId: string): MerchantAccount[] {
  const accounts = getMerchantAccountsWithOwners();
  return accounts.filter(account => account.accountOwner?.id === ownerId);
}

/**
 * Get account statistics for an owner
 */
export function getOwnerAccountStats(ownerId: string) {
  const accounts = getAccountsForOwner(ownerId);
  
  return {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(a => a.status === 'active').length,
    totalDeals: accounts.reduce((sum, a) => sum + a.dealsCount, 0),
    highPotential: accounts.filter(a => a.potential === 'high').length,
    midPotential: accounts.filter(a => a.potential === 'mid').length,
    lowPotential: accounts.filter(a => a.potential === 'low').length,
  };
}

/**
 * Get a single merchant account by ID from the cache
 */
export function getMerchantAccount(accountId: string): MerchantAccount | undefined {
  if (!accountsCache) {
    console.warn('Merchant accounts not loaded yet. Call loadMerchantAccounts() first.');
    return undefined;
  }
  return accountsCache.find(account => account.id === accountId);
}

