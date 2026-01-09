/**
 * Adapter to convert Supabase deals to frontend Deal format
 * and provide fallback to mock data
 */

import { SupabaseDeal, getDeals as getSupabaseDeals, getDealStats, isSupabaseConfigured, supabase } from './supabase';
import { deals as mockDeals } from '../data/mockDeals';
import { generatedMockDeals } from '../data/generatedMockDeals';

// Get localStorage deals
function getLocalStorageDeals(): FrontendDeal[] {
  try {
    const stored = localStorage.getItem('groupon_deals_storage');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.deals) {
        // Return deals as array, filtering out any that are just placeholders
        return Object.values(data.deals).filter((deal: any) => deal && deal.id) as FrontendDeal[];
      }
    }
  } catch (error) {
    console.error('Error reading localStorage deals:', error);
  }
  return [];
}

export interface FrontendDeal {
  id: string;
  title: string;
  galleryTitle?: string;
  shortDescriptor?: string;
  descriptor?: string;
  location: string;
  category: string;
  subcategory?: string;
  division: string;
  accountId?: string; // Merchant account ID
  accountOwnerId?: string; // Account owner ID (denormalized from merchant account)
  pos?: string;
  web?: string;
  dealStart: string;
  dealEnd: string;
  quality: string;
  status: string;
  campaignStage?: "draft" | "won" | "lost";
  wonSubStage?: "scheduled" | "live" | "paused" | "sold_out" | "ended";
  draftSubStage?: "prospecting" | "pre_qualification" | "presentation" | "appointment" | "proposal" | "needs_assessment" | "contract_sent" | "negotiation" | "contract_signed" | "approved";
  lostSubStage?: "closed_lost";
  aiReviewResult?: any;
  escalationReason?: string;
  options?: any[];
  stats?: {
    revenue: number;
    purchases: number;
    revenuePerView?: number;
    conversionRate: number;
    views: number;
    likes?: number;
    chartData?: any[];
  };
  content?: {
    media?: Array<{
      id: string;
      url: string;
      isFeatured?: boolean;
      type: "image" | "video";
    }>;
    description?: string;
    highlights?: any[];
    finePoints?: any[];
  };
  roles?: any;
  recommendations?: any[];
}

function convertSupabaseDealToFrontend(deal: SupabaseDeal): FrontendDeal {
  // Map Supabase "closed" to frontend "ended"
  const wonSubStage = (deal.won_sub_stage as string) === 'closed' ? 'ended' : deal.won_sub_stage;
  
  // Use content.media from Supabase if available, otherwise fall back to image_url
  const media = deal.content?.media && deal.content.media.length > 0
    ? deal.content.media
    : deal.image_url 
      ? [{
          id: "1",
          url: deal.image_url,
          isFeatured: true,
          type: "image" as const,
        }]
      : [];
  
  return {
    id: deal.id,
    title: deal.title,
    galleryTitle: deal.title,
    descriptor: deal.title,
    location: deal.location,
    category: deal.category,
    subcategory: deal.subcategory,
    division: deal.division,
    accountId: deal.account_id, // Copy account_id from Supabase
    accountOwnerId: deal.account_owner_id, // Copy account_owner_id from Supabase
    dealStart: deal.deal_start,
    dealEnd: deal.deal_end,
    quality: deal.quality,
    status: deal.status,
    campaignStage: deal.campaign_stage,
    wonSubStage: wonSubStage || undefined,
    draftSubStage: deal.draft_sub_stage || undefined,
    lostSubStage: deal.lost_sub_stage || undefined,
    aiReviewResult: deal.ai_review_result || undefined,
    escalationReason: deal.escalation_reason || undefined,
    stats: {
      revenue: deal.revenue,
      purchases: deal.purchases,
      views: deal.views,
      conversionRate: deal.conversion_rate,
      revenuePerView: deal.views > 0 ? deal.revenue / deal.views : 0,
    },
    content: {
      media,
      description: deal.content?.description || "",
      highlights: deal.content?.highlights || [],
      finePoints: deal.content?.finePoints || [],
    },
    options: [],
  };
}

export async function getDeals(filters?: {
  campaignStage?: 'all' | 'live' | 'scheduled' | 'recently-closed' | 'paused' | 'pending' | 'draft' | 'all-won' | 'sold-out' | 'lost';
  searchText?: string;
  category?: string;
  division?: string;
  maxRecords?: number; // Optional limit on total records to fetch
}): Promise<FrontendDeal[]> {
  let allDeals: FrontendDeal[];
  
  // Use Supabase if configured, otherwise fall back to mock data
  if (isSupabaseConfigured && supabase) {
    try {
      // Map new stages to Supabase filters
      let campaignStageFilter: 'all' | 'draft' | 'won' | 'lost' | undefined;
      
      if (filters?.campaignStage && !['all', 'draft', 'won', 'lost'].includes(filters.campaignStage)) {
        // For 'live', 'scheduled', 'paused', 'pending', 'all-won' - fetch all deals
        campaignStageFilter = filters.campaignStage === 'pending' ? 'all' : 'won';
      } else {
        campaignStageFilter = filters?.campaignStage as 'all' | 'draft' | 'won' | 'lost' | undefined;
      }
      
      // Fetch deals with pagination to get more than default 1000 limit
      const maxRecords = filters?.maxRecords || 5000; // Default to 5000 for reasonable performance
      const pageSize = 1000; // Supabase max per request
      const allSupabaseDeals: SupabaseDeal[] = [];
      let page = 0;
      let hasMore = true;
      
      while (hasMore && allSupabaseDeals.length < maxRecords) {
        let query = supabase.from('deals').select('*');
        
        // Apply filters
        if (campaignStageFilter && campaignStageFilter !== 'all') {
          query = query.eq('campaign_stage', campaignStageFilter);
        }
        if (filters?.searchText) {
          query = query.or(`title.ilike.%${filters.searchText}%,merchant.ilike.%${filters.searchText}%,location.ilike.%${filters.searchText}%`);
        }
        if (filters?.category) {
          query = query.eq('category', filters.category);
        }
        if (filters?.division) {
          query = query.eq('division', filters.division);
        }
        
        const { data, error } = await query
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allSupabaseDeals.push(...data);
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      allDeals = allSupabaseDeals.map(convertSupabaseDealToFrontend);
      
      // Also include localStorage deals (newly created deals not yet in Supabase)
      const localDeals = getLocalStorageDeals();
      
      // Merge, preferring localStorage version if same ID exists
      const localDealIds = new Set(localDeals.map(d => d.id));
      const supabaseOnlyDeals = allDeals.filter(d => !localDealIds.has(d.id));
      allDeals = [...localDeals, ...supabaseOnlyDeals];
      
    } catch (error) {
      console.error('Error loading from Supabase, falling back to mock data:', error);
      // Silently fall back to mock data (Supabase not configured)
      allDeals = [...mockDeals, ...generatedMockDeals] as FrontendDeal[];
    }
  } else {
    // Fallback to mock data (original + generated)
    allDeals = [...mockDeals, ...generatedMockDeals] as FrontendDeal[];
  }
  
  // Handle pending filter separately (requires async query)
  if (filters?.campaignStage === 'pending' && isSupabaseConfigured && supabase) {
    try {
      // Query deal_tasks to find deals with active information request tasks
      const { data: tasks, error } = await supabase
        .from('deal_tasks')
        .select('deal_id')
        .in('status', ['pending', 'in_progress', 'blocked'])
        .or('title.ilike.%information request%,title.ilike.%info request%,description.ilike.%information request%');
      
      if (!error && tasks) {
        const pendingDealIds = new Set(tasks.map(t => t.deal_id));
        allDeals = allDeals.filter(d => pendingDealIds.has(d.id));
      } else {
        allDeals = [];
      }
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      allDeals = [];
    }
    return allDeals;
  }
  
  // Apply client-side filtering for other sub-stages
  if (filters?.campaignStage && filters.campaignStage !== 'all') {
    switch (filters.campaignStage) {
      case 'live':
        allDeals = allDeals.filter(d => d.campaignStage === 'won' && d.wonSubStage === 'live');
        break;
      case 'scheduled':
        allDeals = allDeals.filter(d => d.campaignStage === 'won' && d.wonSubStage === 'scheduled');
        break;
      case 'paused':
        allDeals = allDeals.filter(d => d.campaignStage === 'won' && d.wonSubStage === 'paused');
        break;
      case 'recently-closed':
        allDeals = allDeals.filter(d => d.campaignStage === 'won' && d.wonSubStage === 'ended');
        break;
      case 'sold-out':
        allDeals = allDeals.filter(d => d.campaignStage === 'won' && d.wonSubStage === 'sold_out');
        break;
      case 'draft':
        allDeals = allDeals.filter(d => d.campaignStage === 'draft');
        break;
      case 'all-won':
        allDeals = allDeals.filter(d => d.campaignStage === 'won');
        break;
      case 'lost':
        allDeals = allDeals.filter(d => d.campaignStage === 'lost');
        break;
    }
  }
  
  return allDeals;
}

export async function getDealCounts(): Promise<{
  draft: number;
  live: number;
  won: number;
  lost: number;
  scheduled?: number;
  paused?: number;
  ended?: number;
}> {
  if (isSupabaseConfigured) {
    try {
      const stats = await getDealStats();
      return stats;
    } catch (error) {
      console.error('Failed to fetch stats from Supabase:', error);
    }
  }
  
  // Fallback to mock data counts (original + generated)
  const allDeals = [...mockDeals, ...generatedMockDeals];
  return {
    draft: allDeals.filter((d: any) => "campaignStage" in d && d.campaignStage === "draft").length,
    live: allDeals.filter((d: any) => "campaignStage" in d && d.campaignStage === "won" && "wonSubStage" in d && d.wonSubStage === "live").length,
    won: allDeals.filter((d: any) => "campaignStage" in d && d.campaignStage === "won").length,
    lost: allDeals.filter((d: any) => "campaignStage" in d && d.campaignStage === "lost").length,
  };
}

export { isSupabaseConfigured };

