import React from "react";
import { theme } from "antd";

const { useToken } = theme;

interface EntityAvatarProps {
  /** Entity name (used for fallback initial) */
  name: string;
  /** Logo/image URL */
  logo?: string;
  /** Avatar size in pixels */
  size?: 32 | 40 | 48 | 64;
  /** Shape of avatar */
  shape?: "circle" | "square";
  /** Custom fallback color (defaults to primary color) */
  fallbackColor?: string;
  /** Additional styles */
  style?: React.CSSProperties;
  /** Class name */
  className?: string;
  /** On error callback */
  onError?: () => void;
}

/**
 * EntityAvatar - Displays entity logo/image with letter fallback
 * 
 * Use this component for merchant logos, account avatars, or any entity
 * that needs a visual identifier with a graceful fallback.
 * 
 * @example
 * <EntityAvatar name="Acme Corp" logo="/logos/acme.png" size={48} />
 * <EntityAvatar name="Jane Doe" shape="circle" size={40} />
 */
const EntityAvatar: React.FC<EntityAvatarProps> = ({
  name,
  logo,
  size = 40,
  shape = "square",
  fallbackColor,
  style,
  className,
  onError,
}) => {
  const { token } = useToken();
  const [imageError, setImageError] = React.useState(false);

  const borderRadius = shape === "circle" 
    ? "50%" 
    : size >= 48 
      ? token.borderRadiusLG 
      : token.borderRadius;

  const fontSize = size >= 48 ? token.fontSizeHeading4 : token.fontSizeLG;
  const bgColor = fallbackColor || `${token.colorPrimary}15`;
  const textColor = fallbackColor ? "#fff" : token.colorPrimary;

  const initial = name?.charAt(0)?.toUpperCase() || "?";

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Show fallback if no logo or image failed to load
  if (!logo || imageError) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius,
          background: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: textColor,
          fontSize,
          fontWeight: token.fontWeightStrong,
          flexShrink: 0,
          ...style,
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={name}
      className={className}
      onError={handleError}
      style={{
        width: size,
        height: size,
        borderRadius,
        objectFit: "cover",
        border: `1px solid ${token.colorBorder}`,
        flexShrink: 0,
        ...style,
      }}
    />
  );
};

export default EntityAvatar;


















