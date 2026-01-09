import { Deal, deals as mockDeals } from "../data/mockDeals";
import { generatedMockDeals } from "../data/generatedMockDeals";

export interface AccountMetrics {
  liveDealsCount: number;
  totalRevenue: number;
  formattedRevenue: string;
}

/**
 * Format revenue in short format ($xM, $xK)
 */
export function formatRevenue(revenue: number): string {
  if (revenue >= 1_000_000) {
    const millions = revenue / 1_000_000;
    return `$${millions.toFixed(1)}M`;
  } else if (revenue >= 1_000) {
    const thousands = revenue / 1_000;
    return `$${Math.round(thousands)}K`;
  } else if (revenue > 0) {
    return `$${Math.round(revenue)}`;
  }
  return "$0";
}

/**
 * Get all deals for a specific account
 */
export function getAccountDeals(accountId: string): Deal[] {
  const allDeals = [...mockDeals, ...generatedMockDeals] as Deal[];
  return allDeals.filter(deal => deal.accountId === accountId);
}

/**
 * Calculate metrics for an account
 */
export function calculateAccountMetrics(accountId: string): AccountMetrics {
  const deals = getAccountDeals(accountId);
  
  // Count live deals
  const liveDealsCount = deals.filter(
    deal => 
      deal.campaignStage === "won" && 
      deal.wonSubStage === "live"
  ).length;
  
  // Sum all revenue from all deals (all-time)
  const totalRevenue = deals.reduce((sum, deal) => {
    return sum + (deal.stats?.revenue || 0);
  }, 0);
  
  return {
    liveDealsCount,
    totalRevenue,
    formattedRevenue: formatRevenue(totalRevenue),
  };
}

/**
 * Get display text for account metrics
 */
export function getAccountMetricsDisplay(metrics: AccountMetrics): string {
  const parts: string[] = [];
  
  if (metrics.liveDealsCount > 0) {
    parts.push(`${metrics.liveDealsCount} deal${metrics.liveDealsCount > 1 ? 's' : ''} live`);
  }
  
  if (metrics.totalRevenue > 0) {
    parts.push(metrics.formattedRevenue);
  }
  
  if (parts.length === 0) {
    return "No deals yet";
  }
  
  return parts.join(" • ");
}

