import React from "react";
import { theme } from "antd";

const { useToken } = theme;

interface IconBadgeProps {
  /** Icon element to display */
  icon: React.ReactNode;
  /** Badge size in pixels */
  size?: 32 | 40 | 48 | 64;
  /** Icon color */
  color?: string;
  /** Background color (defaults to color with 15% opacity) */
  backgroundColor?: string;
  /** Shape of badge */
  shape?: "square" | "circle";
  /** Border radius (for square shape, overrides default) */
  borderRadius?: number;
  /** Shadow intensity */
  shadow?: "none" | "small" | "medium" | "large";
  /** Additional styles */
  style?: React.CSSProperties;
  /** Click handler */
  onClick?: () => void;
  /** Class name */
  className?: string;
}

/**
 * IconBadge - Display an icon within a colored badge/container
 * 
 * Commonly used for status indicators, feature icons, or decorative elements
 * with consistent sizing and styling.
 * 
 * @example
 * <IconBadge icon={<MapPin size={20} />} size={48} color="#1890ff" />
 * <IconBadge icon={<Star size={16} />} size={40} shape="circle" shadow="medium" />
 */
const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  size = 40,
  color,
  backgroundColor,
  shape = "square",
  borderRadius,
  shadow = "none",
  style,
  onClick,
  className,
}) => {
  const { token } = useToken();

  const iconColor = color || token.colorPrimary;
  // Create semi-transparent background (15% opacity equivalent)
  const bgColor = backgroundColor || (color ? `${color}1A` : token.colorPrimaryBg);

  const getBorderRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    if (shape === "circle") return "50%";
    if (size >= 48) return token.borderRadiusLG;
    return token.borderRadius;
  };

  const getShadow = () => {
    switch (shadow) {
      case "small":
        return `0 ${token.paddingXXS}px ${token.paddingSM}px ${color ? `${color}33` : token.colorPrimaryBg}`;
      case "medium":
        return `0 ${token.paddingXS}px ${token.padding}px ${color ? `${color}4D` : token.colorPrimaryBg}`;
      case "large":
        return `0 ${token.paddingSM}px ${token.paddingLG}px ${color ? `${color}66` : token.colorPrimaryBg}`;
      default:
        return "none";
    }
  };

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: getBorderRadius(),
        background: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: iconColor,
        boxShadow: getShadow(),
        flexShrink: 0,
        cursor: onClick ? "pointer" : "default",
        transition: onClick ? `all ${token.motionDurationMid}` : "none",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "scale(1.05)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "scale(1)";
        }
      }}
    >
      {icon}
    </div>
  );
};

export default IconBadge;

