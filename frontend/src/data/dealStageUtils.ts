/**
 * Utility functions for getting deals by campaign stage
 */
import { Deal, deals as mockDeals } from "./mockDeals";
import { generatedMockDeals } from "./generatedMockDeals";

// Combine all deal sources (same as dealAdapter.ts)
const deals: Deal[] = [...mockDeals, ...generatedMockDeals];

export type CampaignMainStage = "draft" | "won" | "lost";

/**
 * Infer campaign stage from deal status if not explicitly set
 */
const inferCampaignStage = (deal: Deal): { 
  campaignStage: CampaignMainStage; 
  subStage: string | undefined 
} => {
  // If campaign stage is already set, use it
  if (deal.campaignStage) {
    let subStage: string | undefined;
    if (deal.campaignStage === "draft") {
      subStage = deal.draftSubStage;
    } else if (deal.campaignStage === "won") {
      subStage = deal.wonSubStage;
    } else if (deal.campaignStage === "lost") {
      subStage = deal.lostSubStage;
    }
    return { campaignStage: deal.campaignStage, subStage };
  }
  
  // Infer from status
  const status = deal.status?.toLowerCase() || "";
  
  if (status === "live") {
    return { campaignStage: "won", subStage: "live" };
  } else if (status === "paused") {
    return { campaignStage: "won", subStage: "paused" };
  } else if (status === "scheduled") {
    return { campaignStage: "won", subStage: "scheduled" };
  } else if (status === "ended" || status === "expired") {
    return { campaignStage: "won", subStage: "ended" };
  } else if (status === "sold out") {
    return { campaignStage: "won", subStage: "sold_out" };
  } else if (status === "draft") {
    return { campaignStage: "draft", subStage: "negotiation" };
  } else if (status === "closed lost" || status === "lost" || status === "cancelled") {
    return { campaignStage: "lost", subStage: "closed_lost" };
  }
  
  // Default to draft
  return { campaignStage: "draft", subStage: "prospecting" };
};

// Mapping from stage IDs (used in FlowDiagram) to deal campaign stages and sub-stages
// This supports both the stage IDs from the diagram and variations
const STAGE_TO_CAMPAIGN: Record<string, { campaignStage: CampaignMainStage; subStages: string[] }> = {
  // Draft phase stages - map diagram stage IDs to deal sub-stages
  "prospecting": { campaignStage: "draft", subStages: ["prospecting"] },
  "qualification": { campaignStage: "draft", subStages: ["pre_qualification", "qualification"] },
  "pre-qualification": { campaignStage: "draft", subStages: ["pre_qualification"] },
  "pre_qualification": { campaignStage: "draft", subStages: ["pre_qualification"] },
  "presentation": { campaignStage: "draft", subStages: ["presentation"] },
  "appointment": { campaignStage: "draft", subStages: ["appointment"] },
  "proposal": { campaignStage: "draft", subStages: ["proposal"] },
  "needs-assessment": { campaignStage: "draft", subStages: ["needs_assessment"] },
  "needs_assessment": { campaignStage: "draft", subStages: ["needs_assessment"] },
  "contract-sent": { campaignStage: "draft", subStages: ["contract_sent"] },
  "contract_sent": { campaignStage: "draft", subStages: ["contract_sent"] },
  "negotiation": { campaignStage: "draft", subStages: ["negotiation"] },
  "contract-signed": { campaignStage: "draft", subStages: ["contract_signed"] },
  "contract_signed": { campaignStage: "draft", subStages: ["contract_signed"] },
  "approved": { campaignStage: "draft", subStages: ["approved"] },
  
  // Won phase stages
  "scheduled": { campaignStage: "won", subStages: ["scheduled"] },
  "live": { campaignStage: "won", subStages: ["live"] },
  "paused": { campaignStage: "won", subStages: ["paused"] },
  "sold-out": { campaignStage: "won", subStages: ["sold_out"] },
  "sold_out": { campaignStage: "won", subStages: ["sold_out"] },
  "ended": { campaignStage: "won", subStages: ["ended"] },
  
  // Lost phase - matches all lost deals regardless of sub-stage
  "lost": { campaignStage: "lost", subStages: ["closed_lost", "archived"] },
  "closed-lost": { campaignStage: "lost", subStages: ["closed_lost"] },
  "closed_lost": { campaignStage: "lost", subStages: ["closed_lost"] },
  "archived": { campaignStage: "lost", subStages: ["archived"] },
};

/**
 * Get deals for a specific stage ID
 */
export const getDealsByStageId = (stageId: string): Deal[] => {
  const normalizedId = stageId.toLowerCase();
  const mapping = STAGE_TO_CAMPAIGN[normalizedId] || STAGE_TO_CAMPAIGN[stageId];
  
  if (!mapping) {
    // Try to match by further normalizing the stage ID
    const cleanId = normalizedId.replace(/[-_\s]/g, "");
    const matchingKey = Object.keys(STAGE_TO_CAMPAIGN).find(
      key => key.toLowerCase().replace(/[-_\s]/g, "") === cleanId
    );
    
    if (matchingKey) {
      return getDealsByStageId(matchingKey);
    }
    
    return [];
  }
  
  const { campaignStage, subStages } = mapping;
  
  return deals.filter(deal => {
    // Infer campaign stage from status if not explicitly set
    const inferred = inferCampaignStage(deal);
    
    // Match campaign stage
    if (inferred.campaignStage !== campaignStage) return false;
    
    // Match any of the sub-stages
    if (subStages.length > 0) {
      return subStages.includes(inferred.subStage || "");
    }
    
    return true;
  });
};

/**
 * Get deal count for a specific stage ID
 */
export const getDealCountByStageId = (stageId: string): number => {
  return getDealsByStageId(stageId).length;
};

/**
 * Get deals grouped by main campaign stage
 */
export const getDealsByMainStage = (mainStage: CampaignMainStage): Deal[] => {
  return deals.filter(deal => {
    const inferred = inferCampaignStage(deal);
    return inferred.campaignStage === mainStage;
  });
};

/**
 * Get deal counts for all stages (for display in the flow diagram)
 */
export const getAllStageDealCounts = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  
  // Get counts for all mapped stage IDs
  for (const stageId of Object.keys(STAGE_TO_CAMPAIGN)) {
    counts[stageId] = getDealCountByStageId(stageId);
  }
  
  return counts;
};

/**
 * Summary of deals by campaign stage
 */
export interface DealStageSummary {
  total: number;
  draft: number;
  won: number;
  lost: number;
  live: number;
  paused: number;
}

export const getDealStageSummary = (): DealStageSummary => {
  const draftDeals = getDealsByMainStage("draft");
  const wonDeals = getDealsByMainStage("won");
  const lostDeals = getDealsByMainStage("lost");
  
  // Count live and paused using inferred stages
  const liveDeals = deals.filter(d => {
    const inferred = inferCampaignStage(d);
    return inferred.campaignStage === "won" && inferred.subStage === "live";
  });
  const pausedDeals = deals.filter(d => {
    const inferred = inferCampaignStage(d);
    return inferred.campaignStage === "won" && inferred.subStage === "paused";
  });
  
  return {
    total: deals.length,
    draft: draftDeals.length,
    won: wonDeals.length,
    lost: lostDeals.length,
    live: liveDeals.length,
    paused: pausedDeals.length,
  };
};

/**
 * Get the stage ID from a deal's campaign stage and sub-stage
 */
export const getStageIdFromDeal = (deal: Deal): string | null => {
  const inferred = inferCampaignStage(deal);
  
  if (inferred.subStage) {
    return inferred.subStage.replace(/_/g, "-");
  }
  
  if (inferred.campaignStage === "lost") {
    return "lost";
  }
  
  return inferred.campaignStage;
};

/**
 * Export the infer function for use in other components
 */
export { inferCampaignStage };

