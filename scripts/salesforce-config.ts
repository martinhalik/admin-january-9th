/**
 * Salesforce to Supabase Sync Configuration
 * 
 * This file contains all mapping configurations for syncing Salesforce data to Supabase.
 * Edit the STAGE_MAPPING to match your Salesforce opportunity stages with your deal stages.
 */

// Salesforce credentials (from environment or hardcoded for development)
export const salesforceCredentials = {
  username: process.env.SF_USERNAME || 'salesforce@groupon.com',
  password: process.env.SF_PASSWORD || 'gRoup0n!',
  securityToken: process.env.SF_SECURITY_TOKEN || 'CYSCBNTRwp9ObHBAWOzLjWAT',
  consumerKey: process.env.SF_CONSUMER_KEY || '3MVG9CVKiXR7Ri5reEzOtLwbaXYpSCzt1zoj5ZOWbT2lWU9YBZOaJKbjQ8MkbsQNfySBhR15KPZ2iNZSX1.xi',
  consumerSecret: process.env.SF_CONSUMER_SECRET || '5500570727224626818',
  loginUrl: process.env.SF_LOGIN_URL || 'https://groupon-dev.my.salesforce.com',
};

// Sync configuration
export const syncConfig = {
  // Only sync deals from these countries (use Salesforce country codes)
  markets: ['US', 'USA', 'United States', 'FR', 'France'],
  
  // Historical deals: Only include Live deals from this many years back
  // (deals that are still active on the website)
  historicalYearsBack: 2,  // Reduced from 10 to 2 to speed up sync
  
  // Current year: Include ALL deals regardless of stage
  // (draft, live, ended, closed lost, DNR, etc.)
  currentYearAllStages: true,
  
  // For historical deals (before current year), only include these stages
  // These are deals still active on the website
  historicalStages: ['Live'],
  
  // Batch size for Salesforce queries and Supabase upserts
  batchSize: 100,
  
  // Whether to include inactive accounts
  includeInactiveAccounts: false,
  
  // Exclude accounts owned by these generic/system users (if any)
  // Note: 'House Account' = Unassigned accounts - keep these!
  excludeOwnerNames: [],
  
  // Maximum records to sync per entity (0 = unlimited)
  // Note: Live deals have NO LIMIT (we want all of them)
  // Only 2025 non-live deals are limited to avoid excessive data
  maxAccounts: 10000,        // Reduced from 50k to 10k
  maxCurrentYearDeals: 10000, // Reduced from 50k to 10k
  maxOpportunities: 0,       // DEPRECATED - now uses smart two-stage fetch
};

/**
 * Stage Mapping: Salesforce Stage Name → Supabase Deal Stage
 * 
 * Map your Salesforce opportunity stages to the Supabase schema:
 * - campaignStage: 'draft' | 'won' | 'lost'
 * - draftSubStage: 'prospecting' | 'pre_qualification' | 'presentation' | 'appointment' | 
 *                  'proposal' | 'needs_assessment' | 'contract_sent' | 'negotiation' | 
 *                  'contract_signed' | 'approved'
 * - wonSubStage: 'scheduled' | 'live' | 'paused' | 'sold_out' | 'ended'
 * - lostSubStage: 'closed_lost'
 */
export const STAGE_MAPPING: Record<string, {
  campaignStage: 'draft' | 'won' | 'lost';
  subStage: string;
  status: string;
}> = {
  // ===============================================
  // GROUPON-SPECIFIC STAGES (from live Salesforce)
  // ===============================================
  
  // Early pipeline stages
  'Newly Assigned': {
    campaignStage: 'draft',
    subStage: 'prospecting',
    status: 'Draft',
  },
  'Appointment Set': {
    campaignStage: 'draft',
    subStage: 'appointment',
    status: 'Draft',
  },
  'ROI/Capacity': {
    campaignStage: 'draft',
    subStage: 'needs_assessment',
    status: 'Draft',
  },
  'Deal Structure Approved': {
    campaignStage: 'draft',
    subStage: 'contract_signed',
    status: 'Draft',
  },
  'Pending Margin Approval': {
    campaignStage: 'draft',
    subStage: 'negotiation',
    status: 'Draft',
  },
  'Approval Needed': {
    campaignStage: 'draft',
    subStage: 'proposal',
    status: 'Draft',
  },
  
  // Additional Groupon stages
  'Initial Outreach': {
    campaignStage: 'draft',
    subStage: 'prospecting',
    status: 'Draft',
  },
  'Proposal Sent': {
    campaignStage: 'draft',
    subStage: 'proposal',
    status: 'Draft',
  },
  'Paper Contract Attached': {
    campaignStage: 'draft',
    subStage: 'contract_sent',
    status: 'Draft',
  },
  'Contract Phase': {
    campaignStage: 'draft',
    subStage: 'contract_sent',
    status: 'Draft',
  },
  'Re-Structure': {
    campaignStage: 'draft',
    subStage: 'negotiation',
    status: 'Draft',
  },
  'Groupon Restructure': {
    campaignStage: 'draft',
    subStage: 'negotiation',
    status: 'Draft',
  },
  'Merchant Change': {
    campaignStage: 'draft',
    subStage: 'negotiation',
    status: 'Draft',
  },
  'Rejected 1st Approval': {
    campaignStage: 'draft',
    subStage: 'proposal',
    status: 'Draft',
  },
  'IO Sent': {
    campaignStage: 'draft',
    subStage: 'contract_sent',
    status: 'Draft',
  },
  'Closed Expired': {
    campaignStage: 'won',
    subStage: 'ended',
    status: 'Expired',
  },
  
  // Disqualified/Lost stages
  'Unqualified': {
    campaignStage: 'lost',
    subStage: 'closed_lost',
    status: 'Unqualified',
  },
  'Merchant Not Interested': {
    campaignStage: 'lost',
    subStage: 'closed_lost',
    status: 'Merchant Not Interested',
  },
  'Closed': {
    campaignStage: 'lost',
    subStage: 'closed_lost',
    status: 'Closed',
  },
  
  // ===============================================
  // STANDARD SALESFORCE STAGES
  // ===============================================
  
  // Draft/Sales Pipeline stages
  'Prospecting': {
    campaignStage: 'draft',
    subStage: 'prospecting',
    status: 'Draft',
  },
  'Qualification': {
    campaignStage: 'draft',
    subStage: 'pre_qualification',
    status: 'Draft',
  },
  'Pre-Qualification': {
    campaignStage: 'draft',
    subStage: 'pre_qualification',
    status: 'Draft',
  },
  'Needs Analysis': {
    campaignStage: 'draft',
    subStage: 'needs_assessment',
    status: 'Draft',
  },
  'Needs Assessment': {
    campaignStage: 'draft',
    subStage: 'needs_assessment',
    status: 'Draft',
  },
  'Value Proposition': {
    campaignStage: 'draft',
    subStage: 'presentation',
    status: 'Draft',
  },
  'Presentation': {
    campaignStage: 'draft',
    subStage: 'presentation',
    status: 'Draft',
  },
  'Id. Decision Makers': {
    campaignStage: 'draft',
    subStage: 'appointment',
    status: 'Draft',
  },
  'Appointment': {
    campaignStage: 'draft',
    subStage: 'appointment',
    status: 'Draft',
  },
  'Perception Analysis': {
    campaignStage: 'draft',
    subStage: 'proposal',
    status: 'Draft',
  },
  'Proposal/Price Quote': {
    campaignStage: 'draft',
    subStage: 'proposal',
    status: 'Draft',
  },
  'Proposal': {
    campaignStage: 'draft',
    subStage: 'proposal',
    status: 'Draft',
  },
  'Contract Sent': {
    campaignStage: 'draft',
    subStage: 'contract_sent',
    status: 'Draft',
  },
  'Negotiation/Review': {
    campaignStage: 'draft',
    subStage: 'negotiation',
    status: 'Draft',
  },
  'Negotiation': {
    campaignStage: 'draft',
    subStage: 'negotiation',
    status: 'Draft',
  },
  'Contract Signed': {
    campaignStage: 'draft',
    subStage: 'contract_signed',
    status: 'Draft',
  },
  'Approved': {
    campaignStage: 'draft',
    subStage: 'approved',
    status: 'Draft',
  },
  
  // Won stages (live deals)
  'Closed Won': {
    campaignStage: 'won',
    subStage: 'live',
    status: 'Live',
  },
  'Live': {
    campaignStage: 'won',
    subStage: 'live',
    status: 'Live',
  },
  'Scheduled': {
    campaignStage: 'won',
    subStage: 'scheduled',
    status: 'Scheduled',
  },
  'Paused': {
    campaignStage: 'won',
    subStage: 'paused',
    status: 'Paused',
  },
  'Sold Out': {
    campaignStage: 'won',
    subStage: 'sold_out',
    status: 'Sold Out',
  },
  'Ended': {
    campaignStage: 'won',
    subStage: 'ended',
    status: 'Ended',
  },
  'Expired': {
    campaignStage: 'won',
    subStage: 'ended',
    status: 'Ended',
  },
  
  // Lost stages
  'Closed Lost': {
    campaignStage: 'lost',
    subStage: 'closed_lost',
    status: 'Closed Lost',
  },
  'Lost': {
    campaignStage: 'lost',
    subStage: 'closed_lost',
    status: 'Closed Lost',
  },
  'Cancelled': {
    campaignStage: 'lost',
    subStage: 'closed_lost',
    status: 'Cancelled',
  },
};

/**
 * Employee role mapping: Salesforce User Role → Supabase Employee Role
 */
export const ROLE_MAPPING: Record<string, {
  role: 'admin' | 'bd' | 'md' | 'mm' | 'dsm' | 'executive' | 'content-ops-staff' | 'content-ops-manager';
  roleTitle: string;
}> = {
  // ===============================================
  // GROUPON-SPECIFIC ROLES (from live Salesforce)
  // ===============================================
  
  'Global': { role: 'executive', roleTitle: 'Global Operations' },
  'MD North America': { role: 'md', roleTitle: 'Merchant Development - North America' },
  'Operations': { role: 'content-ops-staff', roleTitle: 'Operations Specialist' },
  'Merchant Support': { role: 'content-ops-staff', roleTitle: 'Merchant Support' },
  'Multi-Market Team': { role: 'mm', roleTitle: 'Multi-Market Team' },
  'Channels (Travel) - Matt C.': { role: 'mm', roleTitle: 'Travel Channels Manager' },
  'Warm Leads Sales': { role: 'bd', roleTitle: 'Warm Leads Sales' },
  'Inactive Users': { role: 'bd', roleTitle: 'Inactive' },
  
  // ===============================================
  // STANDARD SALESFORCE ROLES
  // ===============================================
  
  // Sales roles
  'Business Development': { role: 'bd', roleTitle: 'Business Development Representative' },
  'BD Rep': { role: 'bd', roleTitle: 'Business Development Representative' },
  'BDR': { role: 'bd', roleTitle: 'Business Development Representative' },
  'Sales Rep': { role: 'bd', roleTitle: 'Sales Representative' },
  'Account Executive': { role: 'bd', roleTitle: 'Account Executive' },
  
  'Merchant Development': { role: 'md', roleTitle: 'Merchant Development Representative' },
  'MD Rep': { role: 'md', roleTitle: 'Merchant Development Representative' },
  'MDR': { role: 'md', roleTitle: 'Merchant Development Representative' },
  
  'Market Manager': { role: 'mm', roleTitle: 'Market Manager' },
  'Regional Manager': { role: 'mm', roleTitle: 'Regional Manager' },
  
  'Divisional Sales Manager': { role: 'dsm', roleTitle: 'Divisional Sales Manager' },
  'DSM': { role: 'dsm', roleTitle: 'Divisional Sales Manager' },
  'Sales Director': { role: 'dsm', roleTitle: 'Sales Director' },
  
  'VP': { role: 'executive', roleTitle: 'Vice President' },
  'Vice President': { role: 'executive', roleTitle: 'Vice President' },
  'Director': { role: 'executive', roleTitle: 'Director' },
  'C-Level': { role: 'executive', roleTitle: 'Executive' },
  
  'Admin': { role: 'admin', roleTitle: 'Administrator' },
  'System Admin': { role: 'admin', roleTitle: 'System Administrator' },
  
  // Content roles
  'Content Ops': { role: 'content-ops-staff', roleTitle: 'Content Operations Specialist' },
  'Content Manager': { role: 'content-ops-manager', roleTitle: 'Content Operations Manager' },
};

/**
 * Get the mapped stage info, with fallback to prospecting if unknown
 */
export function getMappedStage(salesforceStage: string) {
  const mapped = STAGE_MAPPING[salesforceStage];
  if (mapped) {
    return mapped;
  }
  
  // Fallback: try case-insensitive match
  const normalizedStage = salesforceStage.toLowerCase().trim();
  for (const [key, value] of Object.entries(STAGE_MAPPING)) {
    if (key.toLowerCase() === normalizedStage) {
      return value;
    }
  }
  
  // Default fallback
  console.warn(`Unknown Salesforce stage: "${salesforceStage}" - defaulting to prospecting`);
  return {
    campaignStage: 'draft' as const,
    subStage: 'prospecting',
    status: 'Draft',
  };
}

/**
 * Get the mapped role info, with fallback to BD if unknown
 */
export function getMappedRole(salesforceRole: string | null | undefined) {
  if (!salesforceRole) {
    return { role: 'bd' as const, roleTitle: 'Sales Representative' };
  }
  
  const mapped = ROLE_MAPPING[salesforceRole];
  if (mapped) {
    return mapped;
  }
  
  // Fallback: try case-insensitive partial match
  const normalizedRole = salesforceRole.toLowerCase().trim();
  for (const [key, value] of Object.entries(ROLE_MAPPING)) {
    if (normalizedRole.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedRole)) {
      return value;
    }
  }
  
  // Default fallback
  console.warn(`Unknown Salesforce role: "${salesforceRole}" - defaulting to BD`);
  return { role: 'bd' as const, roleTitle: salesforceRole || 'Sales Representative' };
}

/**
 * Business type mapping from Salesforce Industry field
 */
export const INDUSTRY_TO_BUSINESS_TYPE: Record<string, string> = {
  'Food & Beverage': 'Restaurant',
  'Restaurant': 'Restaurant',
  'Restaurants': 'Restaurant',
  'Hospitality': 'Restaurant',
  'Food Services': 'Restaurant',
  
  'Health & Wellness': 'Spa',
  'Spa': 'Spa',
  'Beauty': 'Salon',
  'Salon': 'Salon',
  'Hair Salon': 'Salon',
  'Nail Salon': 'Salon',
  
  'Fitness': 'Gym',
  'Gym': 'Gym',
  'Health Club': 'Gym',
  'Yoga': 'Yoga Studio',
  'Pilates': 'Fitness',
  
  'Retail': 'Retail',
  'Shopping': 'Retail',
  'Electronics': 'Electronics',
  'Technology': 'Electronics',
  
  'Entertainment': 'Entertainment',
  'Recreation': 'Entertainment',
  'Events': 'Entertainment',
  
  'Automotive': 'Automotive',
  'Auto': 'Automotive',
  
  'Travel': 'Travel',
  'Tourism': 'Travel',
  'Hotel': 'Hotel',
  'Lodging': 'Hotel',
};

export function getBusinessType(industry: string | null | undefined): string {
  if (!industry) return 'Other';
  
  const mapped = INDUSTRY_TO_BUSINESS_TYPE[industry];
  if (mapped) return mapped;
  
  // Try partial match
  const normalizedIndustry = industry.toLowerCase();
  for (const [key, value] of Object.entries(INDUSTRY_TO_BUSINESS_TYPE)) {
    if (normalizedIndustry.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return industry; // Return original if no mapping found
}

