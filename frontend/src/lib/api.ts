/**
 * API Utility
 *
 * This utility handles API calls in both development and production:
 * - Development: Uses Vite proxy to forward /api/* to http://localhost:4000
 * - Production: Uses VITE_API_URL environment variable (set in Vercel)
 */

const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || ""
  : "";

/**
 * Makes a GET request to the API
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API GET Error:", error);
    throw error;
  }
}

/**
 * Makes a POST request to the API
 */
export async function apiPost<T, D = any>(
  endpoint: string,
  data: D
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API POST Error:", error);
    throw error;
  }
}

/**
 * Makes a PUT request to the API
 */
export async function apiPut<T, D = any>(
  endpoint: string,
  data: D
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API PUT Error:", error);
    throw error;
  }
}

/**
 * Makes a DELETE request to the API
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API DELETE Error:", error);
    throw error;
  }
}

/**
 * LocalStorage-based Deal Persistence
 * This simulates a backend API using localStorage for the prototype
 */

import { Deal, getMockDeal } from "../data/mockDeals";
import { getAllSimilarDeals } from "../data/similarDeals";
import { generatedMockDeals } from "../data/generatedMockDeals";
import { isSupabaseConfigured, updateDealFields as supabaseUpdateDealFields, upsertDeal, SupabaseDeal, getDealById } from "./supabase";

const STORAGE_KEY = "groupon_deals_storage";

// Initialize storage with mock data if empty
const initStorage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initialData = {
      deals: {
        "1": getMockDeal("1"),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  }
};

// Helper function to convert SupabaseDeal to Deal format
function convertSupabaseDealToDeal(supabaseDeal: SupabaseDeal): Deal {
  const media = supabaseDeal.content?.media && supabaseDeal.content.media.length > 0
    ? supabaseDeal.content.media
    : supabaseDeal.image_url 
      ? [{
          id: "1",
          url: supabaseDeal.image_url,
          isFeatured: true,
          type: "image" as const,
        }]
      : [];

  // Extract options from content.options if they exist
  const options = supabaseDeal.content?.options || [];

  return {
    id: supabaseDeal.id,
    title: supabaseDeal.title,
    galleryTitle: supabaseDeal.title,
    shortDescriptor: "",
    descriptor: supabaseDeal.title,
    isGalleryTitleAuto: true,
    isDescriptorAuto: true,
    location: supabaseDeal.location,
    category: supabaseDeal.category,
    subcategory: supabaseDeal.subcategory,
    division: supabaseDeal.division,
    pos: supabaseDeal.merchant || "",
    web: "",
    dealStart: supabaseDeal.deal_start,
    dealEnd: supabaseDeal.deal_end,
    quality: supabaseDeal.quality,
    status: supabaseDeal.status,
    campaignStage: supabaseDeal.campaign_stage,
    wonSubStage: (supabaseDeal.won_sub_stage as any) === 'closed' ? 'ended' : supabaseDeal.won_sub_stage,
    draftSubStage: supabaseDeal.draft_sub_stage,
    lostSubStage: supabaseDeal.lost_sub_stage,
    aiReviewResult: supabaseDeal.ai_review_result,
    escalationReason: supabaseDeal.escalation_reason,
    accountId: supabaseDeal.account_id,
    stats: {
      revenue: supabaseDeal.revenue,
      purchases: supabaseDeal.purchases,
      views: supabaseDeal.views,
      conversionRate: supabaseDeal.conversion_rate,
      revenuePerView: supabaseDeal.views > 0 ? supabaseDeal.revenue / supabaseDeal.views : 0,
      likes: 0,
      chartData: [],
    },
    content: {
      media,
      description: supabaseDeal.content?.description || "",
      highlights: supabaseDeal.content?.highlights || [],
      finePoints: supabaseDeal.content?.finePoints || [],
    },
    options,
    roles: {
      accountOwner: "Unassigned",
      writer: "Unassigned", 
      imageDesigner: "Unassigned",
      opportunityOwner: "Unassigned",
    },
    recommendations: [],
  };
}

// Synchronous version of getDeal for components that need immediate access (Breadcrumbs, etc.)
// This only checks localStorage and generatedMockDeals - does NOT query Supabase
export const getDealSync = (id: string): Deal => {
  // Check if this is a similar deal
  if (id.startsWith("similar-")) {
    const allSimilarDeals = getAllSimilarDeals();
    const similarDeal = allSimilarDeals.find((deal) => deal.id === id);
    if (similarDeal) {
      // Convert SimilarDeal to Deal format
      return {
        id: similarDeal.id,
        title: similarDeal.title,
        galleryTitle: similarDeal.title,
        shortDescriptor: "",
        descriptor: similarDeal.title,
        isGalleryTitleAuto: true,
        isDescriptorAuto: true,
        location: similarDeal.location,
        category: similarDeal.category,
        subcategory: "Similar Deal",
        division: "Similar Deals",
        pos: "Similar",
        web: "similar-deals.com",
        dealStart: "1. 1. 2024",
        dealEnd: "31. 12. 2024",
        quality: similarDeal.quality,
        status: similarDeal.status,
        options: similarDeal.options.map((option) => ({
          ...option,
          subtitle: "",
          details: "",
          validity: "Valid for 6 months",
          enabled: true,
          monthlyCapacity: 50,
          merchantMargin: 50,
          grouponMargin: 50,
          merchantPayout: option.grouponPrice * 0.8,
          customFields: [],
        })),
        stats: {
          revenue: similarDeal.stats.revenue,
          purchases: similarDeal.stats.purchases,
          revenuePerView: similarDeal.stats.revenue / similarDeal.stats.views,
          conversionRate:
            (similarDeal.stats.purchases / similarDeal.stats.views) * 100,
          views: similarDeal.stats.views,
          likes: Math.floor(similarDeal.stats.purchases * 0.1),
          chartData: [],
        },
        roles: {
          accountOwner: "Similar Deal",
          writer: "Similar Deal",
          imageDesigner: "Similar Deal",
          opportunityOwner: "Similar Deal",
        },
        recommendations: [],
        content: {
          description: `<p>This is a similar deal to help you discover related offers.</p>`,
          media: similarDeal.content.media,
          highlights: [
            {
              id: "1",
              text: "Similar deal recommendation",
              icon: "✓",
            },
          ],
          finePoints: [
            {
              id: "1",
              text: "This is a similar deal recommendation",
            },
          ],
        },
      };
    }
  }

  // Check localStorage
  initStorage();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored);
    const localDeal = data.deals[id];
    if (localDeal) {
      return localDeal;
    }
  }
  
  // Check generatedMockDeals
  const generatedDeal = generatedMockDeals.find((d: any) => d.id === id);
  if (generatedDeal) {
    return generatedDeal as Deal;
  }
  
  // Final fallback to mock deal template
  return getMockDeal(id);
};

// Async version of getDeal that queries Supabase (primary method for DealDetail page)
export const getDeal = async (id: string): Promise<Deal> => {
  // Check if this is a similar deal
  if (id.startsWith("similar-")) {
    const allSimilarDeals = getAllSimilarDeals();
    const similarDeal = allSimilarDeals.find((deal) => deal.id === id);
    if (similarDeal) {
      // Convert SimilarDeal to Deal format
      return {
        id: similarDeal.id,
        title: similarDeal.title,
        galleryTitle: similarDeal.title,
        shortDescriptor: "",
        descriptor: similarDeal.title,
        isGalleryTitleAuto: true,
        isDescriptorAuto: true,
        location: similarDeal.location,
        category: similarDeal.category,
        subcategory: "Similar Deal",
        division: "Similar Deals",
        pos: "Similar",
        web: "similar-deals.com",
        dealStart: "1. 1. 2024",
        dealEnd: "31. 12. 2024",
        quality: similarDeal.quality,
        status: similarDeal.status,
        options: similarDeal.options.map((option) => ({
          ...option,
          subtitle: "",
          details: "",
          validity: "Valid for 6 months",
          enabled: true,
          monthlyCapacity: 50,
          merchantMargin: 50,
          grouponMargin: 50,
          merchantPayout: option.grouponPrice * 0.8,
          customFields: [],
        })),
        stats: {
          revenue: similarDeal.stats.revenue,
          purchases: similarDeal.stats.purchases,
          revenuePerView: similarDeal.stats.revenue / similarDeal.stats.views,
          conversionRate:
            (similarDeal.stats.purchases / similarDeal.stats.views) * 100,
          views: similarDeal.stats.views,
          likes: Math.floor(similarDeal.stats.purchases * 0.1),
          chartData: [],
        },
        roles: {
          accountOwner: "Similar Deal",
          writer: "Similar Deal",
          imageDesigner: "Similar Deal",
          opportunityOwner: "Similar Deal",
        },
        recommendations: [],
        content: {
          description: `<p>This is a similar deal to help you discover related offers.</p>`,
          media: similarDeal.content.media,
          highlights: [
            {
              id: "1",
              text: "Similar deal recommendation",
              icon: "✓",
            },
          ],
          finePoints: [
            {
              id: "1",
              text: "This is a similar deal recommendation",
            },
          ],
        },
      };
    }
  }

  // First, check localStorage (for newly created deals)
  initStorage();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored);
    const localDeal = data.deals[id];
    if (localDeal) {
      return localDeal;
    }
  }
  
  // If not in localStorage and Supabase is configured, query Supabase
  if (isSupabaseConfigured) {
    try {
      const supabaseDeal = await getDealById(id);
      if (supabaseDeal) {
        const convertedDeal = convertSupabaseDealToDeal(supabaseDeal);
        
        // Cache the deal in localStorage so getDealSync can find it (for breadcrumbs, etc.)
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const data = JSON.parse(stored);
            data.deals[id] = convertedDeal;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
        } catch (error) {
          console.error('Failed to cache deal in localStorage:', error);
        }
        
        return convertedDeal;
      }
    } catch (error) {
      console.error(`Deal ${id} not found in Supabase:`, error);
      // Continue to fallbacks below
    }
  }
  
  // Check if it's a generated mock deal (for backward compatibility)
  const generatedDeal = generatedMockDeals.find((d: any) => d.id === id);
  if (generatedDeal) {
    return generatedDeal as Deal;
  }
  
  // Final fallback to mock deal template
  return getMockDeal(id);
};

// Deep merge helper function to preserve nested objects
const deepMerge = (target: any, source: any): any => {
  const output = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      // Recursively merge nested objects
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      // Direct assignment for primitives and arrays
      output[key] = source[key];
    }
  }

  return output;
};

// Save deal to storage
export const saveDeal = async (
  id: string,
  dealData: Partial<Deal>
): Promise<Deal> => {
  initStorage();

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored);
    const currentDeal = data.deals[id] || getMockDeal(id);
    const isNewDeal = !data.deals[id];

    // Deep merge the updates with current deal to preserve nested data
    const updatedDeal = deepMerge(currentDeal, dealData);
    
    // Set timestamps
    const now = new Date().toISOString();
    if (isNewDeal) {
      updatedDeal.createdAt = now;
    }
    updatedDeal.updatedAt = now;

    data.deals[id] = updatedDeal;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Also save to Supabase if configured (especially for new deals)
    if (isSupabaseConfigured) {
      try {
        // Convert to Supabase format
        // Prepare content with options embedded
        const contentWithOptions = {
          ...(updatedDeal.content || {}),
          options: updatedDeal.options || [],
        };

        const supabaseDeal: Partial<SupabaseDeal> = {
          id: updatedDeal.id,
          title: updatedDeal.title,
          location: updatedDeal.location,
          merchant: updatedDeal.location.split(',')[0]?.trim() || 'Merchant',
          city: updatedDeal.location.split(',')[0]?.trim() || 'City',
          division: updatedDeal.division,
          category: updatedDeal.category,
          subcategory: updatedDeal.subcategory || '',
          campaign_stage: updatedDeal.campaignStage,
          status: updatedDeal.status,
          won_sub_stage: updatedDeal.wonSubStage,
          draft_sub_stage: updatedDeal.draftSubStage,
          lost_sub_stage: updatedDeal.lostSubStage,
          revenue: updatedDeal.stats?.revenue || 0,
          purchases: updatedDeal.stats?.purchases || 0,
          views: updatedDeal.stats?.views || 0,
          conversion_rate: updatedDeal.stats?.conversionRate || 0,
          margin: 50,
          deal_start: updatedDeal.dealStart || new Date().toISOString().split('T')[0],
          deal_end: updatedDeal.dealEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          quality: (updatedDeal.quality === 'Ace' || updatedDeal.quality === 'Good' || updatedDeal.quality === 'Fair') ? updatedDeal.quality : 'Good',
          content: contentWithOptions,
        };
        
        // Get featured image
        if (updatedDeal.content?.media) {
          const featuredImage = updatedDeal.content.media.find((m: any) => m.isFeatured) || updatedDeal.content.media[0];
          if (featuredImage) {
            supabaseDeal.image_url = featuredImage.url;
          }
        }
        
        // Use upsert for new deals (will create if doesn't exist, update if it does)
        await upsertDeal(supabaseDeal as SupabaseDeal);
        console.log(`✅ Saved deal to Supabase: ${id}`);
      } catch (error) {
        console.error(`Failed to save deal to Supabase: ${id}`, error);
        // Don't throw - localStorage save succeeded
      }
    }
    
    return updatedDeal;
  }

  throw new Error("Storage not initialized");
};

// Update specific fields of a deal
export const updateDealFields = async (
  id: string,
  fields: Partial<Deal>
): Promise<Deal> => {
  // Save to localStorage
  const updatedDeal = await saveDeal(id, fields);
  
  // Also update in Supabase if configured
  if (isSupabaseConfigured) {
    try {
      // Convert frontend fields to Supabase format
      const supabaseUpdate: Partial<SupabaseDeal> = {};
      
      // Map frontend fields to Supabase fields (only include fields that are being updated)
      if (fields.title !== undefined) supabaseUpdate.title = fields.title;
      if (fields.location !== undefined) supabaseUpdate.location = fields.location;
      if (fields.division !== undefined) supabaseUpdate.division = fields.division;
      if (fields.category !== undefined) supabaseUpdate.category = fields.category;
      if (fields.subcategory !== undefined) supabaseUpdate.subcategory = fields.subcategory;
      if (fields.campaignStage !== undefined) supabaseUpdate.campaign_stage = fields.campaignStage;
      if (fields.status !== undefined) supabaseUpdate.status = fields.status;
      if (fields.wonSubStage !== undefined) supabaseUpdate.won_sub_stage = fields.wonSubStage;
      if (fields.draftSubStage !== undefined) supabaseUpdate.draft_sub_stage = fields.draftSubStage;
      if (fields.lostSubStage !== undefined) supabaseUpdate.lost_sub_stage = fields.lostSubStage;
      if (fields.quality !== undefined && (fields.quality === 'Ace' || fields.quality === 'Good' || fields.quality === 'Fair')) {
        supabaseUpdate.quality = fields.quality;
      }
      if (fields.dealStart !== undefined) supabaseUpdate.deal_start = fields.dealStart;
      if (fields.dealEnd !== undefined) supabaseUpdate.deal_end = fields.dealEnd;
      
      // Handle content and options together - options are stored inside content.options
      if (fields.content !== undefined || fields.options !== undefined) {
        // Merge content and options - we have the full deal in updatedDeal from saveDeal above
        supabaseUpdate.content = {
          ...(fields.content || updatedDeal.content || {}),
          options: fields.options !== undefined ? fields.options : (updatedDeal.options || []),
        };
      }
      
      // Update stats if provided
      if (fields.stats) {
        if (fields.stats.revenue !== undefined) supabaseUpdate.revenue = fields.stats.revenue;
        if (fields.stats.purchases !== undefined) supabaseUpdate.purchases = fields.stats.purchases;
        if (fields.stats.views !== undefined) supabaseUpdate.views = fields.stats.views;
        if (fields.stats.conversionRate !== undefined) supabaseUpdate.conversion_rate = fields.stats.conversionRate;
      }
      
      // Get featured image for backward compatibility
      if (fields.content?.media) {
        const featuredImage = fields.content.media.find((m: any) => m.isFeatured) || fields.content.media[0];
        if (featuredImage) {
          supabaseUpdate.image_url = featuredImage.url;
        }
      }
      
      // Only update if there are fields to update
      if (Object.keys(supabaseUpdate).length > 0) {
        await supabaseUpdateDealFields(id, supabaseUpdate);
        console.log(`✅ Synced deal to Supabase: ${id}`, Object.keys(supabaseUpdate));
      }
      
    } catch (error) {
      console.error(`Failed to sync deal to Supabase: ${id}`, error);
      // Don't throw - localStorage update succeeded, Supabase sync is best-effort
    }
  }
  
  return updatedDeal;
};

/**
 * Example usage:
 *
 * import { apiGet, apiPost, apiPut, getDeal, saveDeal, updateDealFields } from './lib/api';
 *
 * // Fetch deals
 * const deals = await apiGet<Deal[]>('/deals');
 *
 * // Get specific deal
 * const deal = await apiGet<Deal>(`/deals/${id}`);
 *
 * // Update deal
 * const updated = await apiPut<Deal>(`/deals/${id}`, dealData);
 *
 * // For prototype: Get deal from localStorage
 * const deal = getDeal('1');
 *
 * // For prototype: Save deal to localStorage
 * const updated = await saveDeal('1', { title: 'New Title' });
 *
 * // For prototype: Update specific fields
 * const updated = await updateDealFields('1', {
 *   title: 'New Title',
 *   galleryTitle: 'Gallery Title'
 * });
 */
