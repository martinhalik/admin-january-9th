import React, { useState, useEffect, useMemo } from "react";
import { Card, Typography, Space, theme, Tag, Button, Spin } from "antd";
import {
  FileText,
  UserCheck,
  Calendar,
  PlayCircle,
  PauseCircle,
  XCircle,
  CheckCircle,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  ClipboardCheck,
  FileCheck,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { FullWorkflowSchema } from "../lib/workflowSchemas";
import { getDefaultWorkflowSchema, isSupabaseConfigured } from "../lib/workflowSchemas";

const { Text } = Typography;
const { useToken } = theme;

// Icon mapping for dynamic stages
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Search,
  ClipboardCheck,
  FileText,
  Calendar,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  Package,
  UserCheck,
  FileCheck,
  AlertCircle,
};

// Get icon component from string name
const getIconComponent = (iconName?: string): React.ComponentType<{ size?: number; style?: React.CSSProperties }> => {
  if (!iconName) return FileText;
  if (ICON_MAP[iconName]) return ICON_MAP[iconName];
  const lucideIcon = (LucideIcons as any)[iconName];
  if (lucideIcon) return lucideIcon;
  return FileText;
};

export type CampaignMainStage = "draft" | "won" | "lost";
export type DraftSubStage =
  | "prospecting"
  | "pre_qualification"
  | "presentation"
  | "appointment"
  | "proposal"
  | "needs_assessment"
  | "contract_sent"
  | "negotiation"
  | "contract_signed"
  | "approved";
export type WonSubStage =
  | "scheduled"
  | "live"
  | "paused"
  | "sold_out"
  | "ended";
export type LostSubStage = "closed_lost";

interface CampaignStagesProps {
  mainStage: CampaignMainStage;
  subStage?: DraftSubStage | WonSubStage | LostSubStage;
  onStageChange?: (
    mainStage: CampaignMainStage,
    subStage?: DraftSubStage | WonSubStage | LostSubStage
  ) => void;
  dealStart?: string;
  dealEnd?: string;
}

interface StageDefinition {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Fallback stages when schema is not available
const FALLBACK_DRAFT_STAGES: StageDefinition[] = [
  {
    key: "prospecting",
    title: "Prospecting",
    description: "Identifying and researching potential merchant leads",
    icon: <Search size={16} />,
  },
  {
    key: "pre_qualification",
    title: "Pre-qualification",
    description: "Internal approval from manager before proceeding",
    icon: <ClipboardCheck size={16} />,
  },
  {
    key: "presentation",
    title: "Presentation",
    description: "Initial deal setup and content creation",
    icon: <FileText size={16} />,
  },
  {
    key: "appointment",
    title: "Appointment",
    description: "Configure booking and appointment settings",
    icon: <Calendar size={16} />,
  },
  {
    key: "proposal",
    title: "Proposal",
    description: "Create and review deal proposal",
    icon: <FileText size={16} />,
  },
  {
    key: "needs_assessment",
    title: "Needs Assessment",
    description: "Assess merchant requirements and expectations",
    icon: <UserCheck size={16} />,
  },
  {
    key: "contract_sent",
    title: "Contract Sent",
    description: "Contract sent to merchant for review",
    icon: <FileText size={16} />,
  },
  {
    key: "negotiation",
    title: "Negotiation",
    description: "Terms and pricing negotiation in progress",
    icon: <AlertCircle size={16} />,
  },
  {
    key: "contract_signed",
    title: "Contract Signed",
    description: "Contract finalized by merchant",
    icon: <FileCheck size={16} />,
  },
  {
    key: "approved",
    title: "Approved",
    description: "Deal approved and ready to schedule",
    icon: <CheckCircle size={16} />,
  },
];

const FALLBACK_WON_STAGES: StageDefinition[] = [
  {
    key: "scheduled",
    title: "Scheduled",
    description: "Deal scheduled for launch",
    icon: <Calendar size={16} />,
  },
  {
    key: "live",
    title: "Live",
    description: "Deal is active and taking orders",
    icon: <PlayCircle size={16} />,
  },
  {
    key: "paused",
    title: "Paused",
    description: "Deal temporarily paused",
    icon: <PauseCircle size={16} />,
  },
  {
    key: "sold_out",
    title: "Sold Out",
    description: "All inventory sold",
    icon: <Package size={16} />,
  },
  {
    key: "ended",
    title: "Ended",
    description: "Deal campaign completed",
    icon: <CheckCircle size={16} />,
  },
];

const FALLBACK_LOST_STAGES: StageDefinition[] = [
  {
    key: "closed_lost",
    title: "Closed Lost",
    description: "This deal was not closed successfully",
    icon: <XCircle size={16} />,
  },
];

const CampaignStages: React.FC<CampaignStagesProps> = ({
  mainStage,
  subStage,
  onStageChange,
  dealStart,
  dealEnd,
}) => {
  const { token } = useToken();
  const [schema, setSchema] = useState<FullWorkflowSchema | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for expansion - collapsed by default
  const [isExpanded, setIsExpanded] = useState(false);

  // Load workflow schema on mount
  useEffect(() => {
    const loadSchema = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      
      try {
        const defaultSchema = await getDefaultWorkflowSchema();
        if (defaultSchema) {
          setSchema(defaultSchema);
        }
      } catch (error) {
        console.error("Failed to load workflow schema:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSchema();
  }, []);

  // Convert schema to stage definitions
  const { draftStages, wonStages, lostStages } = useMemo(() => {
    if (!schema) {
      return {
        draftStages: FALLBACK_DRAFT_STAGES,
        wonStages: FALLBACK_WON_STAGES,
        lostStages: FALLBACK_LOST_STAGES,
      };
    }

    const { phases, stages } = schema;

    const draftPhase = phases.find(p => p.phase_type === "standard" || p.name?.toLowerCase().includes("draft"));
    const wonPhase = phases.find(p => p.phase_type === "won" || p.name?.toLowerCase().includes("won"));
    const lostPhase = phases.find(p => p.phase_type === "lost" || p.name?.toLowerCase().includes("lost"));

    const mapStages = (phaseId: string | undefined): StageDefinition[] => {
      if (!phaseId) return [];
      return stages
        .filter(s => s.phase_id === phaseId)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(s => {
          const IconComponent = getIconComponent(s.icon);
          return {
            key: s.display_name.toLowerCase().replace(/\s+/g, "_"),
            title: s.display_name,
            description: "",
            icon: <IconComponent size={16} />,
          };
        });
    };

    const draft = mapStages(draftPhase?.id);
    const won = mapStages(wonPhase?.id);
    const lost = mapStages(lostPhase?.id);

    return {
      draftStages: draft.length > 0 ? draft : FALLBACK_DRAFT_STAGES,
      wonStages: won.length > 0 ? won : FALLBACK_WON_STAGES,
      lostStages: lost.length > 0 ? lost : FALLBACK_LOST_STAGES,
    };
  }, [schema]);

  // Loading state - check AFTER all hooks
  if (loading) {
    return (
      <Card size="small" bodyStyle={{ padding: token.paddingSM }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
          <Spin size="small" />
          <Text type="secondary" style={{ marginLeft: 8, fontSize: token.fontSizeSM }}>Loading...</Text>
        </div>
      </Card>
    );
  }

  // Get current stage list
  const getStageList = (): StageDefinition[] => {
    if (mainStage === "draft") return draftStages;
    if (mainStage === "won") return wonStages;
    return lostStages;
  };

  const stageList = getStageList();
  
  // Find current stage index
  const findStageIndex = () => {
    if (!subStage) return 0;
    const normalizedSubStage = subStage.toLowerCase().replace(/[_\s-]/g, "");
    const index = stageList.findIndex((s) => {
      const normalizedKey = s.key.toLowerCase().replace(/[_\s-]/g, "");
      const normalizedTitle = s.title.toLowerCase().replace(/[_\s-]/g, "");
      return normalizedKey === normalizedSubStage || normalizedTitle === normalizedSubStage;
    });
    return index >= 0 ? index : 0;
  };

  const currentIndex = findStageIndex();
  const currentStage = stageList[currentIndex] || stageList[0];

  // Calculate stage color
  const getStageColor = () => {
    if (mainStage === "lost") return token.colorError;
    if (mainStage === "won") {
      const position = currentIndex / (wonStages.length - 1);
      const red = Math.round(74 * (1 - position) + 21 * position);
      const green = Math.round(222 * (1 - position) + 128 * position);
      const blue = Math.round(128 * (1 - position) + 61 * position);
      return `rgb(${red}, ${green}, ${blue})`;
    }
    // Draft gradient
    const position = currentIndex / (draftStages.length - 1);
    const colors = [
      { r: 251, g: 146, b: 60 },   // Orange
      { r: 250, g: 204, b: 21 },   // Yellow
      { r: 168, g: 85, b: 247 },   // Purple
      { r: 59, g: 130, b: 246 },   // Blue
      { r: 34, g: 197, b: 94 },    // Green
    ];
    
    const segmentCount = colors.length - 1;
    const segment = Math.min(Math.floor(position * segmentCount), segmentCount - 1);
    const segmentProgress = (position * segmentCount) - segment;
    
    const startColor = colors[segment];
    const endColor = colors[segment + 1];
    
    const red = Math.round(startColor.r * (1 - segmentProgress) + endColor.r * segmentProgress);
    const green = Math.round(startColor.g * (1 - segmentProgress) + endColor.g * segmentProgress);
    const blue = Math.round(startColor.b * (1 - segmentProgress) + endColor.b * segmentProgress);
    
    return `rgb(${red}, ${green}, ${blue})`;
  };

  const stageColor = getStageColor();

  return (
    <div style={{ marginBottom: token.margin }}>
      <Card size="small" bodyStyle={{ padding: `${token.paddingSM}px ${token.padding}px` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: token.marginSM,
          }}
        >
          {/* Stage Icon */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: token.borderRadius,
              background: stageColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorWhite,
              flexShrink: 0,
            }}
          >
            {currentStage.icon}
          </div>

          {/* Stage Info - Clickable to expand */}
          <div 
            style={{ 
              cursor: "pointer",
              transition: `opacity ${token.motionDurationMid}`,
              minWidth: 0,
              flex: 1,
            }}
            onClick={() => setIsExpanded(!isExpanded)}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = String(token.opacityLoading);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: token.marginXS, flexWrap: "nowrap" }}>
              <Text strong style={{ fontSize: token.fontSize, whiteSpace: "nowrap" }}>
                {currentStage.title}
              </Text>
              <Text type="secondary" style={{ fontSize: token.fontSizeSM, whiteSpace: "nowrap" }}>
                • Stage {currentIndex + 1} of {stageList.length}
                {mainStage === "won" && dealEnd && subStage === "live" && (
                  <> • Ends: <Text strong style={{ fontSize: token.fontSizeSM }}>{dealEnd}</Text></>
                )}
                {mainStage === "won" && dealEnd && subStage === "scheduled" && dealStart && (
                  <> • {dealStart} - {dealEnd}</>
                )}
              </Text>
            </div>
            </div>

           {/* Quick Actions - Show when collapsed */}
          {!isExpanded && onStageChange && (
            <Space size={4}>
              {mainStage === "draft" && (
                <>
                  <Button
                    size="small"
                    onClick={() => onStageChange("lost", "closed_lost")}
                  >
                    Mark as Lost
                  </Button>
                  {currentIndex < draftStages.length - 1 ? (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        const nextStage = stageList[currentIndex + 1];
                        if (nextStage) {
                          onStageChange("draft", nextStage.key as DraftSubStage);
                        }
                      }}
                    >
                      Proceed
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => onStageChange("won", "scheduled")}
                    >
                      Close as Won
                    </Button>
                  )}
                </>
              )}
              {mainStage === "won" && (
                <>
                  {subStage === "live" && (
                    <>
                      <Button size="small" onClick={() => onStageChange("won", "paused")}>
                        Pause
                      </Button>
                      <Button size="small" onClick={() => onStageChange("won", "ended")}>
                        End
                      </Button>
                    </>
                  )}
                  {subStage === "paused" && (
                    <>
                      <Button size="small" type="primary" onClick={() => onStageChange("won", "live")}>
                        Resume
                      </Button>
                      <Button size="small" onClick={() => onStageChange("won", "ended")}>
                        End
                      </Button>
                    </>
                  )}
                  {subStage === "scheduled" && (
                    <Button size="small" type="primary" onClick={() => onStageChange("won", "live")}>
                      Launch
                    </Button>
                  )}
                </>
              )}
            </Space>
          )}

          {/* Expand/Collapse Button */}
          <Button
            type="text"
            size="small"
            icon={isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              color: token.colorTextSecondary,
            }}
          />
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div style={{ marginTop: token.marginSM }}>
            {/* Progress Bar */}
            <div style={{ 
              position: "relative", 
              marginBottom: token.marginSM,
            }}>
              <div
                style={{
                  height: 6,
                  background: token.colorBorderSecondary,
                  borderRadius: token.borderRadiusSM,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    width: `${((currentIndex + 1) / stageList.length) * 100}%`,
                    height: "100%",
                    background: mainStage === "draft" 
                      ? `linear-gradient(to right, #FB923C, ${stageColor})`
                      : stageColor,
                    borderRadius: token.borderRadiusSM,
                    transition: `width ${token.motionDurationSlow}, background ${token.motionDurationMid}`,
                  }}
                />
              </div>
            </div>

            {/* Action Buttons when expanded */}
            {onStageChange && (
              <Space size={token.marginXS} style={{ marginBottom: token.marginSM }}>
                {mainStage === "draft" && (
                  <>
                    <Button
                      onClick={() => onStageChange("lost", "closed_lost")}
                    >
                      Mark as Lost
                    </Button>
                    {currentIndex < draftStages.length - 1 ? (
                      <Button
                        type="primary"
                        onClick={() => {
                          const nextStage = stageList[currentIndex + 1];
                          if (nextStage) {
                            onStageChange("draft", nextStage.key as DraftSubStage);
                          }
                        }}
                      >
                        Proceed to {stageList[currentIndex + 1]?.title}
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        onClick={() => onStageChange("won", "scheduled")}
                      >
                        Close as Won
                      </Button>
                    )}
                  </>
                )}
                {mainStage === "won" && (
                  <>
                    {subStage === "live" && (
                      <>
                        <Button onClick={() => onStageChange("won", "paused")}>
                          Pause Deal
                        </Button>
                        <Button onClick={() => onStageChange("won", "ended")}>
                          End Deal
                        </Button>
                      </>
                    )}
                    {subStage === "paused" && (
                      <>
                        <Button type="primary" onClick={() => onStageChange("won", "live")}>
                          Resume Deal
                        </Button>
                        <Button onClick={() => onStageChange("won", "ended")}>
                          End Deal
                        </Button>
                      </>
                    )}
                    {subStage === "scheduled" && (
                      <Button type="primary" onClick={() => onStageChange("won", "live")}>
                        Launch Deal
                      </Button>
                    )}
                  </>
                )}
              </Space>
            )}

            {/* All Stages List */}
            <div>
              {stageList.map((stage, index) => {
                const isActive = index === currentIndex;
                const isCompleted = index < currentIndex;
                const isClickable = !isActive && onStageChange;

                // Calculate gradient color for this stage
                let itemStageColor = stageColor;
                if (mainStage === "draft") {
                  const stagePosition = index / (draftStages.length - 1);
                  const colors = [
                    { r: 251, g: 146, b: 60 },
                    { r: 250, g: 204, b: 21 },
                    { r: 168, g: 85, b: 247 },
                    { r: 59, g: 130, b: 246 },
                    { r: 34, g: 197, b: 94 },
                  ];
                  const segmentCount = colors.length - 1;
                  const segment = Math.min(Math.floor(stagePosition * segmentCount), segmentCount - 1);
                  const segmentProgress = (stagePosition * segmentCount) - segment;
                  const startColor = colors[segment];
                  const endColor = colors[segment + 1];
                  const red = Math.round(startColor.r * (1 - segmentProgress) + endColor.r * segmentProgress);
                  const green = Math.round(startColor.g * (1 - segmentProgress) + endColor.g * segmentProgress);
                  const blue = Math.round(startColor.b * (1 - segmentProgress) + endColor.b * segmentProgress);
                  itemStageColor = `rgb(${red}, ${green}, ${blue})`;
                } else if (mainStage === "won") {
                  const stagePosition = index / (wonStages.length - 1);
                  const red = Math.round(74 * (1 - stagePosition) + 21 * stagePosition);
                  const green = Math.round(222 * (1 - stagePosition) + 128 * stagePosition);
                  const blue = Math.round(128 * (1 - stagePosition) + 61 * stagePosition);
                  itemStageColor = `rgb(${red}, ${green}, ${blue})`;
                }

                return (
                  <div
                    key={`${mainStage}-stage-${stage.key}-${index}`}
                    style={{
                      padding: token.paddingSM,
                      marginBottom: token.marginXS,
                      borderRadius: token.borderRadius,
                      border: isActive
                        ? `2px solid ${itemStageColor}`
                        : `1px solid ${token.colorBorder}`,
                      background: isActive
                        ? `${itemStageColor}12`
                        : undefined,
                      cursor: isClickable ? "pointer" : "default",
                      transition: `all ${token.motionDurationMid}`,
                      opacity: isActive ? 1 : isCompleted ? 0.5 : 0.7,
                      filter: isCompleted ? "grayscale(0.3)" : "none",
                    }}
                    onClick={() => {
                      if (isClickable) {
                        onStageChange(mainStage, stage.key as DraftSubStage | WonSubStage);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.background = `${itemStageColor}15`;
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.filter = "grayscale(0)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.opacity = isCompleted ? "0.5" : "0.7";
                        e.currentTarget.style.filter = isCompleted ? "grayscale(0.3)" : "none";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: token.marginSM,
                      }}
                    >
                      <div
                        style={{
                          color: isActive
                            ? itemStageColor
                            : token.colorTextSecondary,
                          paddingTop: token.paddingXXS,
                        }}
                      >
                        {stage.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: token.marginXS }}>
                          <Text strong={isActive} style={{ fontSize: token.fontSize }}>
                            {stage.title}
                          </Text>
                          {isActive && (
                            <Tag style={{ margin: 0, background: `${itemStageColor}20`, color: itemStageColor, border: `1px solid ${itemStageColor}` }}>
                              Current
                            </Tag>
                          )}
                        </div>
                        <Text
                          type="secondary"
                          style={{ fontSize: token.fontSizeSM, display: "block", marginTop: token.marginXXS }}
                        >
                          {stage.description}
                        </Text>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CampaignStages;
