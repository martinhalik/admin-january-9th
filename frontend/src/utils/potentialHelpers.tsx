import React from "react";
import { Tag, theme } from "antd";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const { useToken } = theme;

export type PotentialLevel = "high" | "mid" | "low";

/**
 * Get the color for a potential level
 */
export const getPotentialColor = (potential: string): string => {
  switch (potential.toLowerCase()) {
    case "high":
      return "green";
    case "mid":
      return "blue";
    case "low":
      return "orange";
    default:
      return "default";
  }
};

/**
 * Get the icon for a potential level
 */
export const getPotentialIcon = (potential: string, size: number = 12) => {
  switch (potential.toLowerCase()) {
    case "high":
      return <TrendingUp size={size} />;
    case "mid":
      return <Minus size={size} />;
    case "low":
      return <TrendingDown size={size} />;
    default:
      return null;
  }
};

/**
 * Get a score-based color (for numeric potential scores)
 * Uses Ant Design color tokens
 */
export const getScoreColor = (token: any, score: number): string => {
  if (score >= 80) return token.colorSuccess;
  if (score >= 60) return token.colorWarning;
  return token.colorError;
};

interface PotentialTagProps {
  potential: string;
  showIcon?: boolean;
  showLabel?: boolean;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  size?: "small" | "default";
}

/**
 * Reusable component for displaying potential level as a tag
 */
export const PotentialTag: React.FC<PotentialTagProps> = ({
  potential,
  showIcon = false,
  showLabel = true,
  style,
  onClick,
  size = "default",
}) => {
  const { token } = useToken();
  const fontSize = size === "small" ? token.fontSizeSM - 2 : token.fontSizeSM;
  const iconSize = size === "small" ? 10 : 12;

  return (
    <Tag
      color={getPotentialColor(potential)}
      style={{
        margin: 0,
        fontSize,
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: token.marginXXS,
        ...style,
      }}
      onClick={onClick}
    >
      {showIcon && getPotentialIcon(potential, iconSize)}
      {showLabel && potential.toUpperCase()}
    </Tag>
  );
};

interface PotentialScoreDisplayProps {
  potential: string;
  score: number;
  showIcon?: boolean;
  compact?: boolean;
}

/**
 * Display potential level with score (e.g., "HIGH 85%")
 */
export const PotentialScoreDisplay: React.FC<PotentialScoreDisplayProps> = ({
  potential,
  score,
  showIcon = true,
  compact = false,
}) => {
  const { token } = useToken();
  
  if (compact) {
    return (
      <PotentialTag
        potential={potential}
        showIcon={showIcon}
        showLabel={false}
        style={{ padding: `${token.paddingXXS}px ${token.paddingXS}px` }}
      />
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: token.marginXS }}>
      <PotentialTag potential={potential} showIcon={showIcon} />
      <span style={{ fontWeight: token.fontWeightStrong, fontSize: token.fontSize }}>
        {score}%
      </span>
    </div>
  );
};

