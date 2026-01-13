/**
 * Utility to fetch merchant accounts from Supabase
 * This replaces the mock data with real database queries
 */

import { MerchantAccount, AccountPerson } from './merchantAccounts';
import { getEmployeeById } from './companyHierarchy';
import { 
  fetchMerchantAccounts, 
  fetchAccountsForOwner, 
  fetchMerchantAccountsPaginated,
  getMerchantAccountsCount,
  type MerchantAccount as SupabaseMerchantAccount 
} from '../lib/supabaseData';
import { generateAvatar } from '../lib/avatarGenerator';
import { mockLocations } from './locationData';

// Cache for merchant accounts
let accountsCache: MerchantAccount[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Sample booking engines to rotate through
const BOOKING_ENGINES = [
  { name: 'OpenTable', logo: '/images/booking-engines/opentable.svg' },
  { name: 'Resy', logo: '/images/booking-engines/resy.svg' },
  { name: 'Yelp Reservations', logo: '/images/booking-engines/yelp.svg' },
  { name: 'Tock', logo: '/images/booking-engines/tock.svg' },
  { name: 'Mindbody', logo: '/images/booking-engines/mindbody.svg' },
  { name: 'Vagaro', logo: '/images/booking-engines/vagaro.svg' },
];

/**
 * Generate enriched scout data for accounts missing this information
 */
function generateScoutData(acc: SupabaseMerchantAccount, accountIndex: number) {
  // Generate a consistent but varied booking engine based on account ID
  const bookingEngineIndex = accountIndex % BOOKING_ENGINES.length;
  const bookingEngine = BOOKING_ENGINES[bookingEngineIndex];
  
  // Generate Google Maps data (4.0-4.8 stars, 100-2000 reviews)
  const stars = 4.0 + (accountIndex % 9) * 0.1;
  const reviews = 100 + (accountIndex * 47) % 1900;
  
  // Generate social media following (varied based on index)
  const instagramFollowers = 1000 + (accountIndex * 437) % 30000;
  const facebookLikes = 500 + (accountIndex * 327) % 15000;
  
  // Generate website from account name
  const websiteName = acc.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  
  // Generate description based on business type
  const description = `Popular ${acc.business_type.toLowerCase()} located in ${acc.location}. Known for quality service and customer satisfaction. Features modern amenities and professional staff dedicated to providing excellent experiences.`;
  
  // Generate business hours based on business type
  const isRestaurant = acc.business_type.toLowerCase().includes('restaurant') || 
                      acc.business_type.toLowerCase().includes('food');
  const isSpa = acc.business_type.toLowerCase().includes('spa') || 
                acc.business_type.toLowerCase().includes('beauty');
  const isFitness = acc.business_type.toLowerCase().includes('fitness') || 
                    acc.business_type.toLowerCase().includes('gym');
  
  let businessHours = 'Mon-Fri: 9:00 AM - 5:00 PM, Sat-Sun: Closed';
  let hours = {
    monday: { open: "09:00", close: "17:00", isClosed: false },
    tuesday: { open: "09:00", close: "17:00", isClosed: false },
    wednesday: { open: "09:00", close: "17:00", isClosed: false },
    thursday: { open: "09:00", close: "17:00", isClosed: false },
    friday: { open: "09:00", close: "17:00", isClosed: false },
    saturday: { open: "00:00", close: "00:00", isClosed: true },
    sunday: { open: "00:00", close: "00:00", isClosed: true },
  };
  
  if (isRestaurant) {
    businessHours = 'Mon-Thu: 11:00 AM - 10:00 PM, Fri-Sat: 11:00 AM - 11:00 PM, Sun: 10:00 AM - 9:00 PM';
    hours = {
      monday: { open: "11:00", close: "22:00", isClosed: false },
      tuesday: { open: "11:00", close: "22:00", isClosed: false },
      wednesday: { open: "11:00", close: "22:00", isClosed: false },
      thursday: { open: "11:00", close: "22:00", isClosed: false },
      friday: { open: "11:00", close: "23:00", isClosed: false },
      saturday: { open: "11:00", close: "23:00", isClosed: false },
      sunday: { open: "10:00", close: "21:00", isClosed: false },
    };
  } else if (isSpa) {
    businessHours = 'Mon-Sat: 9:00 AM - 8:00 PM, Sun: 10:00 AM - 6:00 PM';
    hours = {
      monday: { open: "09:00", close: "20:00", isClosed: false },
      tuesday: { open: "09:00", close: "20:00", isClosed: false },
      wednesday: { open: "09:00", close: "20:00", isClosed: false },
      thursday: { open: "09:00", close: "20:00", isClosed: false },
      friday: { open: "09:00", close: "20:00", isClosed: false },
      saturday: { open: "09:00", close: "20:00", isClosed: false },
      sunday: { open: "10:00", close: "18:00", isClosed: false },
    };
  } else if (isFitness) {
    businessHours = 'Mon-Fri: 5:00 AM - 11:00 PM, Sat-Sun: 7:00 AM - 9:00 PM';
    hours = {
      monday: { open: "05:00", close: "23:00", isClosed: false },
      tuesday: { open: "05:00", close: "23:00", isClosed: false },
      wednesday: { open: "05:00", close: "23:00", isClosed: false },
      thursday: { open: "05:00", close: "23:00", isClosed: false },
      friday: { open: "05:00", close: "23:00", isClosed: false },
      saturday: { open: "07:00", close: "21:00", isClosed: false },
      sunday: { open: "07:00", close: "21:00", isClosed: false },
    };
  }
  
  // Generate popular times (0-100 representing busyness percentage)
  // Pattern varies by business type
  const generateHourlyData = (peakHours: number[]) => {
    return Array.from({ length: 24 }, (_, hour) => {
      if (peakHours.includes(hour)) return 70 + (accountIndex % 30);
      if (Math.abs(peakHours[0] - hour) <= 1 || Math.abs(peakHours[1] - hour) <= 1) return 50 + (accountIndex % 20);
      return 20 + (accountIndex % 15);
    });
  };
  
  const popularTimes = {
    monday: generateHourlyData([12, 18]),
    tuesday: generateHourlyData([12, 18]),
    wednesday: generateHourlyData([12, 19]),
    thursday: generateHourlyData([12, 19]),
    friday: generateHourlyData([12, 19, 20]),
    saturday: generateHourlyData([13, 19, 20]),
    sunday: generateHourlyData([12, 18]),
  };
  
  // Generate nearby competitors
  const competitorTypes = [
    'Similar Business', 'Direct Competitor', 'Alternative Option', 'Nearby Location'
  ];
  
  const nearbyCompetitors = Array.from({ length: 3 + (accountIndex % 3) }, (_, i) => {
    const distance = (0.1 + (accountIndex * 7 + i * 13) % 50) / 10;
    const rating = 3.5 + ((accountIndex + i * 7) % 13) / 10;
    return {
      name: `${acc.business_type} ${String.fromCharCode(65 + ((accountIndex + i) % 26))}`,
      distance: `${distance.toFixed(1)} mi`,
      rating: parseFloat(rating.toFixed(1)),
      type: competitorTypes[(accountIndex + i) % competitorTypes.length],
    };
  });
  
  // Generate mock coordinates (spread around a central point for variety)
  // Base coordinates: somewhere in the US (39.8283° N, 98.5795° W - geographic center of US)
  const baseLat = 39.8283;
  const baseLng = -98.5795;
  // Spread coordinates over ~1000 mile radius
  const latOffset = ((accountIndex * 7) % 200 - 100) * 0.1; // ±10 degrees
  const lngOffset = ((accountIndex * 11) % 200 - 100) * 0.1; // ±10 degrees
  
  // Create location object with hours for MerchantInfoCard
  const location = {
    id: `loc-${acc.id}`,
    name: acc.name,
    address: {
      street: acc.location,
      city: acc.location.split(',')[0] || acc.location,
      state: acc.location.split(',')[1]?.trim() || '',
      zipCode: '',
      country: 'USA',
    },
    coordinates: {
      latitude: baseLat + latOffset,
      longitude: baseLng + lngOffset,
    },
    phone: '',
    hours,
    isActive: true,
    businessType: acc.business_type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    bookingEngine,
    googleMaps: {
      stars: parseFloat(stars.toFixed(1)),
      reviews,
      address: acc.location,
      url: `https://maps.google.com/?cid=${accountIndex}`,
    },
    instagram: {
      followers: instagramFollowers,
      url: `https://instagram.com/${websiteName}`,
    },
    facebook: {
      likes: facebookLikes,
      url: `https://facebook.com/${websiteName}`,
    },
    website: `www.${websiteName}.com`,
    description,
    logo: generateAvatar(acc.name, { type: 'initials' }),
    businessHours,
    popularTimes,
    nearbyCompetitors,
    location, // Add location object with hours
  };
}

/**
 * Convert Supabase merchant account to our MerchantAccount interface
 * with enriched scout data for testing
 */
function convertSupabaseMerchantAccount(acc: any, index: number): MerchantAccount {
  // Handle both nested owner object (from join) and flat fields (legacy)
  const owner = acc.owner || {};
  const accountOwner: AccountPerson | undefined = acc.account_owner_id ? {
    id: acc.account_owner_id,
    name: owner.name || acc.owner_name || 'Unknown',
    email: owner.email || acc.owner_email || '',
    avatar: owner.avatar || acc.owner_avatar,
    role: owner.role || acc.owner_role || '',
  } : undefined;
  
  // Debug log for first few accounts to verify owner data
  if (index < 3) {
    console.log(`[convertSupabaseMerchantAccount] Account ${index}:`, {
      name: acc.name,
      account_owner_id: acc.account_owner_id,
      hasNestedOwner: !!acc.owner,
      ownerName: accountOwner?.name,
    });
  }

  // Generate enriched scout data
  const scoutData = generateScoutData(acc, index);
  
  // Add location to mockLocations for map component
  if (scoutData.location && acc.id) {
    mockLocations[acc.id] = [scoutData.location];
  }
  
  // Generate more realistic potential analysis scores
  const baseScore = acc.potential === 'high' ? 85 : acc.potential === 'mid' ? 65 : 45;
  const variance = (index % 20) - 10; // -10 to +10 variance
  const score = Math.min(95, Math.max(30, baseScore + variance));
  
  // Generate factor scores around the base score
  const marketDemand = Math.min(95, Math.max(30, score + ((index * 7) % 20) - 10));
  const historicalPerformance = Math.min(95, Math.max(30, score + ((index * 11) % 20) - 10));
  const competitivePosition = Math.min(95, Math.max(30, score + ((index * 13) % 20) - 10));
  const growthTrend = Math.min(95, Math.max(30, score + ((index * 17) % 20) - 10));
  const customerSatisfaction = Math.min(95, Math.max(30, score + ((index * 19) % 20) - 10));

  return {
    id: acc.id,
    name: acc.name,
    permalink: acc.name.toLowerCase().replace(/\s+/g, '-'),
    businessType: acc.business_type,
    location: acc.location,
    contactName: '',
    contactEmail: '',
    phone: '',
    description: scoutData.description,
    status: acc.status,
    potential: acc.potential,
    dealsCount: acc.deals_count,
    createdDate: new Date().toISOString(),
    potentialAnalysis: {
      overall: acc.potential,
      score,
      factors: {
        marketDemand: { 
          score: marketDemand, 
          notes: `${marketDemand >= 70 ? 'Strong' : marketDemand >= 50 ? 'Moderate' : 'Limited'} market demand for ${acc.business_type.toLowerCase()} in ${acc.location}.`
        },
        historicalPerformance: { 
          score: historicalPerformance, 
          notes: `Deal performance at ${historicalPerformance >= 70 ? 'above' : historicalPerformance >= 50 ? 'near' : 'below'} category benchmark.`
        },
        competitivePosition: { 
          score: competitivePosition, 
          notes: `${competitivePosition >= 70 ? 'Strong' : competitivePosition >= 50 ? 'Moderate' : 'Developing'} competitive position in local market.`
        },
        growthTrend: { 
          score: growthTrend, 
          notes: `${growthTrend >= 70 ? 'Strong' : growthTrend >= 50 ? 'Steady' : 'Modest'} growth trajectory with ${acc.deals_count} deals.`
        },
        customerSatisfaction: { 
          score: customerSatisfaction, 
          notes: `${scoutData.googleMaps.stars.toFixed(1)}-star rating with ${scoutData.googleMaps.reviews} reviews.`
        },
      },
      recommendations: [
        'Leverage online presence to drive deal traffic',
        'Focus on customer retention and repeat purchases',
        'Optimize seasonal offerings based on demand patterns',
      ],
      insights: `${acc.name} shows ${acc.potential} potential with a score of ${score}/100. ${scoutData.googleMaps.stars >= 4.5 ? 'Strong customer satisfaction' : 'Good customer feedback'} and ${scoutData.instagram.followers >= 5000 ? 'solid' : 'developing'} social media presence provide foundation for growth.`,
    },
    accountOwner,
    logo: scoutData.logo,
    bookingEngine: scoutData.bookingEngine,
    googleMaps: scoutData.googleMaps,
    instagram: scoutData.instagram,
    facebook: scoutData.facebook,
    website: scoutData.website,
    businessHours: scoutData.businessHours,
    popularTimes: scoutData.popularTimes,
    nearbyCompetitors: scoutData.nearbyCompetitors,
    locationData: scoutData.location,
  };
}

/**
 * Load merchant accounts from Supabase with enriched scout data
 */
export async function loadMerchantAccounts(): Promise<MerchantAccount[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (accountsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return accountsCache;
  }

  try {
    console.log('[loadMerchantAccounts] Starting to fetch accounts...');
    const supabaseAccounts = await fetchMerchantAccounts();
    console.log(`[loadMerchantAccounts] Fetched ${supabaseAccounts.length} accounts from Supabase`);
    
    // Pass index to generate unique scout data for each account
    accountsCache = supabaseAccounts.map((acc, index) => convertSupabaseMerchantAccount(acc, index));
    cacheTimestamp = now;
    
    console.log(`[loadMerchantAccounts] ✅ Loaded ${accountsCache.length} accounts with enriched scout data`);
    console.log('[loadMerchantAccounts] Sample account:', accountsCache[0] ? {
      name: accountsCache[0].name,
      hasLogo: !!accountsCache[0].logo,
      hasBookingEngine: !!accountsCache[0].bookingEngine,
      hasGoogleMaps: !!accountsCache[0].googleMaps,
    } : 'No accounts');
    
    return accountsCache;
  } catch (error) {
    console.error('❌ [loadMerchantAccounts] Error loading merchant accounts from Supabase:', error);
    // Return cached data even if expired, or empty array
    return accountsCache || [];
  }
}

/**
 * Get merchant accounts with assigned owners (uses cache)
 * Synchronous version - returns empty array if not loaded yet
 */
export function getMerchantAccountsWithOwners(): MerchantAccount[] {
  if (!accountsCache) {
    console.warn('⚠️ Merchant accounts not loaded yet. Call loadMerchantAccounts() first.');
    return [];
  }
  console.log(`[getMerchantAccountsWithOwners] Returning ${accountsCache.length} accounts from cache`);
  return accountsCache;
}

/**
 * Get merchant accounts with assigned owners (async version)
 * Loads accounts if not cached, returns cached version if available
 */
export async function getMerchantAccountsWithOwnersAsync(): Promise<MerchantAccount[]> {
  // If cache is valid, return it immediately
  const now = Date.now();
  if (accountsCache && (now - cacheTimestamp < CACHE_DURATION)) {
    console.log(`[getMerchantAccountsWithOwnersAsync] Returning ${accountsCache.length} accounts from valid cache`);
    return accountsCache;
  }
  
  // Otherwise, load fresh data
  console.log('[getMerchantAccountsWithOwnersAsync] Loading accounts...');
  const accounts = await loadMerchantAccounts();
  return accounts;
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

/**
 * Get total count of merchant accounts (fast query, doesn't transform data)
 */
export async function getTotalAccountsCount(ownerId?: string | null): Promise<number> {
  try {
    return await getMerchantAccountsCount(ownerId);
  } catch (error) {
    console.error('Error getting accounts count:', error);
    return 0;
  }
}

/**
 * Load merchant accounts incrementally with pagination
 * This allows loading first N accounts quickly, then loading more in background
 */
export async function loadMerchantAccountsIncremental(
  limit: number = 10,
  offset: number = 0,
  ownerId?: string | null
): Promise<{ accounts: MerchantAccount[], total: number, hasMore: boolean }> {
  try {
    const { accounts: supabaseAccounts, total } = await fetchMerchantAccountsPaginated(limit, offset, ownerId);
    
    // Log raw data structure for debugging (first account only)
    if (supabaseAccounts.length > 0 && offset === 0) {
      console.log('[loadMerchantAccountsIncremental] Sample raw account:', {
        name: supabaseAccounts[0].name,
        account_owner_id: supabaseAccounts[0].account_owner_id,
        hasOwnerObject: !!supabaseAccounts[0].owner,
        ownerStructure: supabaseAccounts[0].owner,
      });
    }
    
    // Transform Supabase accounts to MerchantAccount format
    const transformedAccounts = supabaseAccounts.map((acc, index) => convertSupabaseMerchantAccount(acc, offset + index));
    
    // Update cache incrementally (append to existing)
    if (offset === 0) {
      // First batch - replace cache
      accountsCache = transformedAccounts;
      cacheTimestamp = Date.now();
    } else {
      // Subsequent batches - append to cache
      if (accountsCache) {
        accountsCache.push(...transformedAccounts);
      } else {
        accountsCache = transformedAccounts;
      }
    }
    
    const hasMore = offset + transformedAccounts.length < total;
    
    console.log(`[loadMerchantAccountsIncremental] Loaded ${transformedAccounts.length} accounts (offset: ${offset}, total: ${total}, hasMore: ${hasMore})`);
    
    return {
      accounts: transformedAccounts,
      total,
      hasMore
    };
  } catch (error) {
    console.error('Error loading merchant accounts incrementally:', error);
    return {
      accounts: [],
      total: 0,
      hasMore: false
    };
  }
}

