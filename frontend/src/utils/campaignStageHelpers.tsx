import React from "react";
import { Tag } from "antd";
import type { 
  CampaignMainStage, 
  DraftSubStage, 
  WonSubStage, 
  LostSubStage 
} from "../components/CampaignStages";

type CampaignSubStage = DraftSubStage | WonSubStage | LostSubStage;

/**
 * Get the display label for a campaign stage
 */
export const getCampaignStageLabel = (
  stage: CampaignMainStage,
  subStage?: CampaignSubStage
): string => {
  if (stage === "draft" && subStage) {
    const draftLabels: Record<DraftSubStage, string> = {
      prospecting: "Prospecting",
      pre_qualification: "Pre-qualification",
      presentation: "Presentation",
      appointment: "Appointment",
      proposal: "Proposal",
      needs_assessment: "Needs Assessment",
      contract_sent: "Contract Sent",
      negotiation: "Negotiation",
      contract_signed: "Contract Signed",
      approved: "Approved",
    };
    return draftLabels[subStage as DraftSubStage] || "Draft";
  }

  if (stage === "won" && subStage) {
    const wonLabels: Record<WonSubStage, string> = {
      scheduled: "Scheduled",
      live: "Live",
      paused: "Paused",
      sold_out: "Sold Out",
      ended: "Ended",
    };
    return wonLabels[subStage as WonSubStage] || "Won";
  }

  if (stage === "lost") {
    return "Closed Lost";
  }

  return "Draft";
};

/**
 * Get the color for a campaign stage
 */
export const getCampaignStageColor = (
  stage: CampaignMainStage,
  subStage?: CampaignSubStage
): string => {
  if (stage === "draft") {
    return "blue";
  }

  if (stage === "won") {
    switch (subStage as WonSubStage) {
      case "live":
        return "green";
      case "scheduled":
        return "cyan";
      case "paused":
        return "orange";
      case "sold_out":
        return "purple";
      case "ended":
        return "default";
      default:
        return "green";
    }
  }

  if (stage === "lost") {
    return "red";
  }

  return "default";
};

/**
 * Get stage progress (0-1) for draft stages
 */
export const getDraftStageProgress = (subStage?: DraftSubStage): number => {
  const stages: DraftSubStage[] = [
    "prospecting",
    "pre_qualification",
    "presentation",
    "appointment",
    "proposal",
    "needs_assessment",
    "contract_sent",
    "negotiation",
    "contract_signed",
    "approved",
  ];

  if (!subStage) return 0;
  const index = stages.indexOf(subStage);
  if (index === -1) return 0;
  return (index + 1) / stages.length;
};

/**
 * Get stage progress (0-1) for won stages
 */
export const getWonStageProgress = (subStage?: WonSubStage): number => {
  const stages: WonSubStage[] = [
    "scheduled",
    "live",
    "paused",
    "sold_out",
    "ended",
  ];

  if (!subStage) return 0;
  const index = stages.indexOf(subStage);
  if (index === -1) return 0;
  return (index + 1) / stages.length;
};

interface CampaignStageTagProps {
  stage: CampaignMainStage;
  subStage?: CampaignSubStage;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Reusable component for displaying campaign stage as a tag
 */
export const CampaignStageTag: React.FC<CampaignStageTagProps> = ({
  stage,
  subStage,
  style,
  onClick,
}) => {
  return (
    <Tag
      color={getCampaignStageColor(stage, subStage)}
      style={{
        margin: 0,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      onClick={onClick}
    >
      {getCampaignStageLabel(stage, subStage)}
    </Tag>
  );
};

/**
 * Check if a stage is considered "active" (live or similar)
 */
export const isActiveStage = (
  stage: CampaignMainStage,
  subStage?: CampaignSubStage
): boolean => {
  if (stage === "won") {
    return subStage === "live" || subStage === "scheduled";
  }
  return false;
};

/**
 * Check if a stage is considered "complete" (ended or lost)
 */
export const isCompleteStage = (
  stage: CampaignMainStage,
  subStage?: CampaignSubStage
): boolean => {
  if (stage === "lost") return true;
  if (stage === "won" && (subStage === "ended" || subStage === "sold_out")) {
    return true;
  }
  return false;
};


















