import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Tag,
  Typography,
  Space,
  Button,
  Dropdown,
  Progress,
  Tooltip,
  theme,
  message,
  Divider,
  Spin,
} from "antd";
import type { MenuProps } from "antd";
import {
  ChevronRight,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Search,
  ClipboardCheck,
  FileCheck,
  AlertCircle,
  UserCheck,
  Package,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { Deal } from "../../data/mockDeals";
import {
  getDefaultWorkflowSchema,
  FullWorkflowSchema,
  isSupabaseConfigured,
} from "../../lib/workflowSchemas";

const { Text, Title } = Typography;
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
  // Add more as needed
};

// Get icon component from string name
const getIconComponent = (iconName?: string) => {
  if (!iconName) return FileText;
  // Try direct match
  if (ICON_MAP[iconName]) return ICON_MAP[iconName];
  // Try from LucideIcons
  const lucideIcon = (LucideIcons as any)[iconName];
  if (lucideIcon) return lucideIcon;
  return FileText;
};

// Fallback stages for when schema is not available - matches campaign-stage-management-schema.sql
const FALLBACK_DRAFT_STAGES = [
  { key: "prospecting", label: "Prospecting", icon: Search },
  { key: "pre_qualification", label: "Pre-qualification", icon: ClipboardCheck },
  { key: "presentation", label: "Presentation", icon: FileText },
  { key: "appointment", label: "Appointment", icon: Calendar },
  { key: "proposal", label: "Proposal", icon: FileText },
  { key: "needs_assessment", label: "Needs Assessment", icon: UserCheck },
  { key: "contract_sent", label: "Contract Sent", icon: FileText },
  { key: "negotiation", label: "Negotiation", icon: AlertCircle },
  { key: "contract_signed", label: "Contract Signed", icon: FileCheck },
  { key: "approved", label: "Approved", icon: CheckCircle },
];

const FALLBACK_WON_STAGES = [
  { key: "scheduled", label: "Scheduled", icon: Calendar },
  { key: "live", label: "Live", icon: PlayCircle },
  { key: "paused", label: "Paused", icon: PauseCircle },
  { key: "sold_out", label: "Sold Out", icon: Package },
  { key: "ended", label: "Ended", icon: CheckCircle },
];

const FALLBACK_LOST_STAGES = [
  { key: "closed_lost", label: "Closed Lost", icon: XCircle },
];

interface StageDefinition {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

interface CampaignStageProgressProps {
  deal: Deal;
  onStageChange?: (
    campaignStage: "draft" | "won" | "lost",
    subStage?: string
  ) => void;
  compact?: boolean;
}

const CampaignStageProgress: React.FC<CampaignStageProgressProps> = ({
  deal,
  onStageChange,
  compact = false,
}) => {
  const { token } = useToken();
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [schema, setSchema] = useState<FullWorkflowSchema | null>(null);
  const [loading, setLoading] = useState(true);

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

    // Find phases by type
    const draftPhase = phases.find(p => p.phase_type === "standard" || p.name?.toLowerCase().includes("draft"));
    const wonPhase = phases.find(p => p.phase_type === "won" || p.name?.toLowerCase().includes("won"));
    const lostPhase = phases.find(p => p.phase_type === "lost" || p.name?.toLowerCase().includes("lost"));

    // Map stages to StageDefinition format
    const mapStages = (phaseId: string | undefined): StageDefinition[] => {
      if (!phaseId) return [];
      return stages
        .filter(s => s.phase_id === phaseId)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(s => ({
          key: s.display_name.toLowerCase().replace(/\s+/g, "_"),
          label: s.display_name,
          icon: getIconComponent(s.icon),
        }));
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

  // Get current stage info
  const campaignStage = deal.campaignStage || "draft";
  const subStage =
    campaignStage === "draft"
      ? deal.draftSubStage
      : campaignStage === "won"
      ? deal.wonSubStage
      : deal.lostSubStage;

  // Get stage list based on campaign stage
  const getStageList = (): StageDefinition[] => {
    if (campaignStage === "draft") return draftStages;
    if (campaignStage === "won") return wonStages;
    return lostStages;
  };

  const stageList = getStageList();
  
  // Find current stage by matching key or label
  const findStageIndex = () => {
    if (!subStage) return 0;
    const normalizedSubStage = subStage.toLowerCase().replace(/[_\s-]/g, "");
    const index = stageList.findIndex((s) => {
      const normalizedKey = s.key.toLowerCase().replace(/[_\s-]/g, "");
      const normalizedLabel = s.label.toLowerCase().replace(/[_\s-]/g, "");
      return normalizedKey === normalizedSubStage || normalizedLabel === normalizedSubStage;
    });
    return index >= 0 ? index : 0;
  };
  
  const currentStageIndex = findStageIndex();
  const currentStage = stageList[currentStageIndex] || stageList[0];
  const nextStage = stageList[currentStageIndex + 1];

  // Calculate progress percentage
  const progressPercent =
    stageList.length > 1
      ? Math.round(((currentStageIndex + 1) / stageList.length) * 100)
      : 100;

  // Get stage color based on campaign stage
  const getStageColor = () => {
    if (campaignStage === "lost") return token.colorError;
    if (campaignStage === "won") return token.colorSuccess;
    return token.colorPrimary;
  };

  // Get stage tag color
  const getTagColor = () => {
    if (campaignStage === "lost") return "error";
    if (campaignStage === "won") {
      if (subStage === "paused") return "warning";
      if (subStage === "ended") return "default";
      return "success";
    }
    return "processing";
  };

  // Handle stage change
  const handleAdvanceStage = () => {
    if (nextStage && onStageChange) {
      onStageChange(campaignStage, nextStage.key);
      message.success(`Deal moved to ${nextStage.label}`);
    }
  };

  // Build dropdown menu for stage selection
  const buildStageMenu = (): MenuProps["items"] => {
    const items: MenuProps["items"] = [];

    // Draft stages
    items.push({
      key: "draft-header",
      type: "group",
      label: "Draft Phase",
      children: draftStages.map((stage) => ({
        key: `draft-${stage.key}`,
        icon: React.createElement(stage.icon, { size: 14 }),
        label: stage.label,
        onClick: () => {
          if (onStageChange) {
            onStageChange("draft", stage.key);
            message.success(`Deal moved to ${stage.label}`);
          }
        },
      })),
    });

    items.push({ type: "divider" });

    // Won stages
    items.push({
      key: "won-header",
      type: "group",
      label: "Won Phase",
      children: wonStages.map((stage) => ({
        key: `won-${stage.key}`,
        icon: React.createElement(stage.icon, { size: 14 }),
        label: stage.label,
        onClick: () => {
          if (onStageChange) {
            onStageChange("won", stage.key);
            message.success(`Deal moved to ${stage.label}`);
          }
        },
      })),
    });

    items.push({ type: "divider" });

    // Lost stage
    items.push({
      key: "lost-header",
      type: "group",
      label: "Lost Phase",
      children: lostStages.map((stage) => ({
        key: `lost-${stage.key}`,
        icon: React.createElement(stage.icon, { size: 14 }),
        label: stage.label,
        danger: true,
        onClick: () => {
          if (onStageChange) {
            onStageChange("lost", stage.key);
            message.warning(`Deal marked as ${stage.label}`);
          }
        },
      })),
    });

    return items;
  };

  // Loading state
  if (loading) {
    return (
      <Card size="small">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Spin size="small" />
          <Text type="secondary" style={{ marginLeft: 8 }}>Loading stages...</Text>
        </div>
      </Card>
    );
  }

  // Compact view - just the tag
  if (compact && !isExpanded) {
    return (
      <Space>
        <Tag
          color={getTagColor()}
          style={{ margin: 0, cursor: "pointer" }}
          onClick={() => setIsExpanded(true)}
        >
          {currentStage?.label || "Unknown"}
        </Tag>
        {nextStage && (
          <Tooltip title={`Next: ${nextStage.label}`}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ArrowRight size={12} style={{ verticalAlign: "middle" }} />{" "}
              {nextStage.label}
            </Text>
          </Tooltip>
        )}
      </Space>
    );
  }

  const IconComponent = currentStage?.icon || FileText;

  return (
    <Card
      size="small"
      style={{
        borderColor: `${getStageColor()}30`,
        background: `${getStageColor()}05`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Stage Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${getStageColor()}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: getStageColor(),
            flexShrink: 0,
          }}
        >
          <IconComponent size={20} />
        </div>

        {/* Stage Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Tag color={getTagColor()} style={{ margin: 0 }}>
              {campaignStage === "draft"
                ? "Draft"
                : campaignStage === "won"
                ? "Won"
                : "Lost"}
            </Tag>
            <Text strong>{currentStage?.label || "Unknown Stage"}</Text>
          </div>

          {/* Progress bar */}
          <Progress
            percent={progressPercent}
            size="small"
            showInfo={false}
            strokeColor={getStageColor()}
            trailColor={`${getStageColor()}20`}
            style={{ marginBottom: 4 }}
          />

          {/* Next stage indicator */}
          {nextStage && campaignStage !== "lost" && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Next: <Text style={{ fontSize: 12 }}>{nextStage.label}</Text>
            </Text>
          )}
          {campaignStage === "lost" && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              This deal is closed
            </Text>
          )}
          {!nextStage && campaignStage === "won" && subStage === "ended" && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Campaign completed
            </Text>
          )}
        </div>

        {/* Actions */}
        <Space size={4}>
          {nextStage && onStageChange && (
            <Tooltip title={`Advance to ${nextStage.label}`}>
              <Button
                type="primary"
                size="small"
                icon={<ChevronRight size={14} />}
                onClick={handleAdvanceStage}
              >
                Advance
              </Button>
            </Tooltip>
          )}
          {onStageChange && (
            <Dropdown menu={{ items: buildStageMenu() }} trigger={["click"]}>
              <Button size="small" icon={<MoreHorizontal size={14} />} />
            </Dropdown>
          )}
        </Space>
      </div>

      {/* Stage timeline for draft/won */}
      {(campaignStage === "draft" || campaignStage === "won") && (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <div
            style={{
              display: "flex",
              gap: 4,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {stageList.map((stage, index) => {
              const StageIcon = stage.icon;
              const isActive = index === currentStageIndex;
              const isPast = index < currentStageIndex;
              const isFuture = index > currentStageIndex;

              return (
                <Tooltip key={stage.key} title={stage.label}>
                  <div
                    onClick={() => {
                      if (onStageChange) {
                        onStageChange(campaignStage, stage.key);
                        message.success(`Deal moved to ${stage.label}`);
                      }
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 8px",
                      borderRadius: 8,
                      background: isActive
                        ? `${getStageColor()}20`
                        : isPast
                        ? `${token.colorSuccess}10`
                        : "transparent",
                      border: isActive
                        ? `1px solid ${getStageColor()}`
                        : "1px solid transparent",
                      cursor: onStageChange ? "pointer" : "default",
                      minWidth: 48,
                      opacity: isFuture ? 0.5 : 1,
                      transition: "all 0.2s",
                    }}
                  >
                    <StageIcon
                      size={14}
                      style={{
                        color: isActive
                          ? getStageColor()
                          : isPast
                          ? token.colorSuccess
                          : token.colorTextSecondary,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        color: isActive
                          ? getStageColor()
                          : isPast
                          ? token.colorSuccess
                          : token.colorTextSecondary,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 60,
                      }}
                    >
                      {stage.label.split(" ")[0]}
                    </Text>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
};

export default CampaignStageProgress;

