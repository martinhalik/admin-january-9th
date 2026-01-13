import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if running on localhost
const isLocalhost = 
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname === '');

// Check if Supabase is configured AND not on localhost
// On localhost, we disable Supabase entirely to force auth bypass
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !isLocalhost);

// Create Supabase client only if configured AND not on localhost
// Configure with auth settings for Google OAuth
export const supabase: SupabaseClient | null = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface SupabaseDeal {
  id: string;
  title: string;
  location: string;
  merchant: string;
  city: string;
  division: string;
  category: string;
  subcategory: string;
  campaign_stage: 'draft' | 'won' | 'lost';
  status: string;
  won_sub_stage?: 'scheduled' | 'live' | 'paused' | 'sold_out' | 'ended';
  draft_sub_stage?: 'prospecting' | 'pre_qualification' | 'presentation' | 'appointment' | 'proposal' | 'needs_assessment' | 'contract_sent' | 'negotiation' | 'contract_signed' | 'approved';
  lost_sub_stage?: 'closed_lost';
  ai_review_result?: any; // JSONB field
  escalation_reason?: string;
  revenue: number;
  purchases: number;
  views: number;
  conversion_rate: number;
  margin: number;
  deal_start: string;
  deal_end: string;
  quality: 'Ace' | 'Good' | 'Fair';
  image_url?: string;
  content?: any; // JSONB field for media array, description, highlights, finePoints
  account_id?: string; // Foreign key to merchant_accounts
  account_owner_id?: string; // Denormalized account owner for faster queries
  opportunity_owner_id?: string; // Deal/opportunity owner
  created_at: string;
  updated_at: string;
}

export interface DealFilters {
  campaignStage?: 'all' | 'draft' | 'won' | 'lost';
  division?: string;
  category?: string;
  searchText?: string;
  minRevenue?: number;
  maxRevenue?: number;
  quality?: string;
  // Pagination
  page?: number;
  pageSize?: number;
}

export interface PaginatedDeals {
  data: SupabaseDeal[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getDeals(filters?: DealFilters): Promise<SupabaseDeal[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const page = filters?.page || 0;
  const pageSize = filters?.pageSize || 1000;
  
  let query = supabase
    .from('deals')
    .select('*', { count: 'exact' });
  
  // Apply filters
  if (filters?.campaignStage && filters.campaignStage !== 'all') {
    query = query.eq('campaign_stage', filters.campaignStage);
  }
  
  if (filters?.division) {
    query = query.eq('division', filters.division);
  }
  
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters?.quality) {
    query = query.eq('quality', filters.quality);
  }
  
  if (filters?.minRevenue) {
    query = query.gte('revenue', filters.minRevenue);
  }
  
  if (filters?.maxRevenue) {
    query = query.lte('revenue', filters.maxRevenue);
  }
  
  if (filters?.searchText) {
    // Use text search for better performance
    query = query.or(`title.ilike.%${filters.searchText}%,merchant.ilike.%${filters.searchText}%,location.ilike.%${filters.searchText}%`);
  }
  
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  
  if (error) {
    // Throw error without logging (handled by adapter)
    throw error;
  }
  
  return data as SupabaseDeal[];
}

/**
 * Get deals with pagination info for the Deals page
 */
export async function getDealsPaginated(filters?: DealFilters): Promise<PaginatedDeals> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const page = filters?.page || 0;
  const pageSize = filters?.pageSize || 100; // Smaller default for paginated view
  
  let query = supabase
    .from('deals')
    .select('*', { count: 'exact' });
  
  // Apply filters
  if (filters?.campaignStage && filters.campaignStage !== 'all') {
    query = query.eq('campaign_stage', filters.campaignStage);
  }
  
  if (filters?.division) {
    query = query.eq('division', filters.division);
  }
  
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters?.quality) {
    query = query.eq('quality', filters.quality);
  }
  
  if (filters?.minRevenue) {
    query = query.gte('revenue', filters.minRevenue);
  }
  
  if (filters?.maxRevenue) {
    query = query.lte('revenue', filters.maxRevenue);
  }
  
  if (filters?.searchText) {
    query = query.or(`title.ilike.%${filters.searchText}%,merchant.ilike.%${filters.searchText}%,location.ilike.%${filters.searchText}%`);
  }
  
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  
  if (error) {
    throw error;
  }
  
  const total = count || 0;
  
  return {
    data: data as SupabaseDeal[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getDealById(id: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    // Throw error without logging (handled by caller)
    throw error;
  }
  
  return data as SupabaseDeal;
}

export async function getDealStats() {
  if (!supabase) {
    return { draft: 0, won: 0, lost: 0, live: 0, scheduled: 0, paused: 0, ended: 0 };
  }
  
  try {
    // Try to use the optimized RPC function first
    const { data, error } = await supabase.rpc('get_deal_aggregations');
    
    if (!error && data?.byStage) {
      return {
        draft: data.byStage.draft || 0,
        won: data.byStage.won || 0,
        live: data.byStage.live || 0,
        lost: data.byStage.lost || 0,
        scheduled: data.byStage.scheduled || 0,
        paused: data.byStage.paused || 0,
        ended: data.byStage.ended || 0,
      };
    }
  } catch (err) {
    console.log('[getDealStats] RPC not available, using fallback');
  }
  
  // FALLBACK: Fetch all deals and count client-side (slower)
  const { data: allDeals } = await supabase
    .from('deals')
    .select('campaign_stage, won_sub_stage');
  
  if (!allDeals) return { draft: 0, won: 0, lost: 0, live: 0, scheduled: 0, paused: 0, ended: 0 };
  
  return {
    draft: allDeals.filter(d => d.campaign_stage === 'draft').length,
    won: allDeals.filter(d => d.campaign_stage === 'won').length,
    live: allDeals.filter(d => d.campaign_stage === 'won' && d.won_sub_stage === 'live').length,
    lost: allDeals.filter(d => d.campaign_stage === 'lost').length,
    scheduled: allDeals.filter(d => d.campaign_stage === 'won' && d.won_sub_stage === 'scheduled').length,
    paused: allDeals.filter(d => d.campaign_stage === 'won' && d.won_sub_stage === 'paused').length,
    ended: allDeals.filter(d => d.campaign_stage === 'won' && d.won_sub_stage === 'ended').length,
  };
}

export async function updateDealContent(id: string, content: any) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { data, error } = await supabase
    .from('deals')
    .update({ content })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as SupabaseDeal;
}

export async function upsertDeal(deal: Partial<SupabaseDeal>) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { data, error } = await supabase
    .from('deals')
    .upsert(deal)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as SupabaseDeal;
}

/**
 * Update specific fields of an existing deal
 * Use this instead of upsert when you only want to update certain fields
 */
export async function updateDealFields(dealId: string, fields: Partial<SupabaseDeal>) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { data, error } = await supabase
    .from('deals')
    .update(fields)
    .eq('id', dealId)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as SupabaseDeal;
}

/**
 * Get deal counts grouped by division
 * Returns real data from Supabase for the Dashboard
 */
export interface DivisionCount {
  division: string;
  total: number;
  categories: { name: string; count: number; color: string }[];
}

/**
 * Category color mapping for dashboard display
 */
const categoryColors: Record<string, string> = {
  'Food & Drink': '#fa8c16', // orange
  'Health & Beauty': '#eb2f96', // magenta
  'Health & Fitness': '#52c41a', // green
  'Activities & Entertainment': '#1890ff', // blue
  'Travel & Lodging': '#722ed1', // purple
  'Shopping': '#13c2c2', // cyan
  'Automotive': '#faad14', // gold
  'Education': '#eb2f96', // pink
  'Other': '#8c8c8c', // gray
};

/**
 * Get deal counts grouped by division (OPTIMIZED - uses backend aggregation)
 * This calls a Postgres function that calculates aggregations in the database
 * instead of fetching 100k+ records to the frontend.
 */
export async function getDealCountsByDivision(): Promise<DivisionCount[]> {
  if (!supabase) {
    return [];
  }
  
  console.log('[Dashboard] Fetching deal counts from database function...');
  
  try {
    // Try to use the optimized RPC function first
    const { data, error } = await supabase.rpc('get_deal_aggregations');
    
    if (!error && data?.byDivision) {
      console.log(`[Dashboard] ✓ Loaded aggregations from database (${data.total?.toLocaleString()} total deals)`);
      if (data.lastUpdated) {
        console.log(`[Dashboard] 🕒 Data last updated: ${new Date(data.lastUpdated).toLocaleString()}`);
      }
      
      // Transform the database response to DivisionCount format
      return data.byDivision.map((div: any) => ({
        division: div.division,
        total: div.total,
        categories: (div.categories || []).map((cat: any) => ({
          name: cat.name,
          count: cat.count,
          color: categoryColors[cat.name] || '#8c8c8c',
        })),
      }));
    } else if (error) {
      console.error('[Dashboard] RPC Error:', error);
    }
    
    // Fallback to manual aggregation if function doesn't exist
    console.log('[Dashboard] Database function failed or returned no data.');
  } catch (err) {
    console.log('[Dashboard] RPC call failed:', err);
  }
  
  // DISABLE MASSIVE FALLBACK
  // Fetching 50k+ records on the client is too slow (10s+) and causes poor UX.
  // If the DB optimization fails, we should fix the DB optimization.
  console.warn('[Dashboard] Skipping slow client-side fallback. Please run "supabase/migrations/optimize_dashboard_load.sql" to fix dashboard stats.');
  return [];
}

/**
 * Get deal counts grouped by campaign stage
 */
export async function getDealCountsByStage(): Promise<{ stage: string; count: number }[]> {
  if (!supabase) {
    return [];
  }
  
  try {
    // Try to use the optimized RPC function first
    const { data, error } = await supabase.rpc('get_deal_aggregations');
    
    if (!error && data?.byStage) {
      console.log('[getDealCountsByStage] Using optimized DB aggregations');
      return Object.entries(data.byStage).map(([stage, count]) => ({ 
        stage, 
        count: count as number 
      }));
    }
  } catch (err) {
    console.log('[getDealCountsByStage] RPC not available, using fallback');
  }
  
  // Fallback: Fetch all deals (slower)
  const { data, error } = await supabase
    .from('deals')
    .select('campaign_stage, won_sub_stage');
  
  if (error || !data) {
    return [];
  }
  
  const stageCounts = {
    draft: 0,
    live: 0,
    paused: 0,
    scheduled: 0,
    ended: 0,
    lost: 0,
  };
  
  for (const deal of data) {
    if (deal.campaign_stage === 'draft') {
      stageCounts.draft++;
    } else if (deal.campaign_stage === 'lost') {
      stageCounts.lost++;
    } else if (deal.campaign_stage === 'won') {
      const subStage = deal.won_sub_stage || 'live';
      if (subStage in stageCounts) {
        stageCounts[subStage as keyof typeof stageCounts]++;
      }
    }
  }
  
  return Object.entries(stageCounts).map(([stage, count]) => ({ stage, count }));
}

