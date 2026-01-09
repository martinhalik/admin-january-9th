import React from "react";
import { Progress, theme } from "antd";
import type { ProgressProps } from "antd";

const { useToken } = theme;

interface ScoreProgressProps {
  /** Score value (0-100) */
  score: number;
  /** Size of the progress bar */
  size?: "small" | "default";
  /** Show percentage info */
  showInfo?: boolean;
  /** Color scheme */
  colorType?: "gradient" | "solid" | "score-based";
  /** Custom color (for solid type) */
  color?: string;
  /** Additional Progress props */
  progressProps?: Omit<ProgressProps, "percent" | "strokeColor">;
}

/**
 * ScoreProgress - Displays a progress bar for scores with smart coloring
 * 
 * Color types:
 * - gradient: Error → Warning → Success (default for 0-100 scores)
 * - solid: Single color throughout
 * - score-based: Changes color based on thresholds (80+ green, 60-79 orange, <60 red)
 * 
 * @example
 * <ScoreProgress score={75} colorType="gradient" />
 * <ScoreProgress score={85} colorType="score-based" showInfo />
 * <ScoreProgress score={50} colorType="solid" color="#1890ff" />
 */
const ScoreProgress: React.FC<ScoreProgressProps> = ({
  score,
  size = "default",
  showInfo = false,
  colorType = "gradient",
  color,
  progressProps,
}) => {
  const { token } = useToken();

  // Clamp score to 0-100
  const clampedScore = Math.min(Math.max(score, 0), 100);

  const getStrokeColor = () => {
    switch (colorType) {
      case "gradient":
        return {
          "0%": token.colorError,
          "50%": token.colorWarning,
          "100%": token.colorSuccess,
        };
      
      case "score-based": {
        if (clampedScore >= 80) return token.colorSuccess;
        if (clampedScore >= 60) return token.colorWarning;
        return token.colorError;
      }
      
      case "solid":
        return color || token.colorPrimary;
      
      default:
        return token.colorPrimary;
    }
  };

  return (
    <Progress
      percent={clampedScore}
      strokeColor={getStrokeColor()}
      size={size === "small" ? "small" : "default"}
      showInfo={showInfo}
      {...progressProps}
    />
  );
};

export default ScoreProgress;


















