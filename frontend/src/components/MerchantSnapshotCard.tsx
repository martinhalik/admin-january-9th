import React, { useState } from "react";
import { Card, Space, Typography, Divider, theme } from "antd";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MerchantAccount } from "../data/merchantAccounts";
import EntityAvatar from "./EntityAvatar";
import ScoreProgress from "./ScoreProgress";
import { PotentialTag } from "../utils/potentialHelpers";

// Filled brand icons
const GoogleMapsIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84L12 6l5.59 7.84C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7z" fill="#4285F4"/>
    <path d="M5 9c0 5.25 7 13 7 13V6L6.41 13.84C5.5 12.37 5 10.74 5 9z" fill="#34A853"/>
    <path d="M12 6v16s7-7.75 7-13c0-1.74-.5-3.37-1.41-4.84L12 6z" fill="#FBBC04"/>
    <circle cx="12" cy="9" r="2.5" fill="white"/>
  </svg>
);

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#F77737"/>
        <stop offset="50%" stopColor="#E1306C"/>
        <stop offset="75%" stopColor="#C13584"/>
        <stop offset="100%" stopColor="#833AB4"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#instagram-gradient)"/>
    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="17.5" cy="6.5" r="1.5" fill="white"/>
  </svg>
);

const FacebookIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#1877F2"/>
    <path d="M16.5 12.5h-2.5v8h-3v-8H9v-2.5h2v-1.5c0-2.5 1.5-4 4-4h2v2.5h-1.5c-1 0-1.5.5-1.5 1.5v1.5h3l-.5 2.5z" fill="white"/>
  </svg>
);

const WebsiteIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#6366F1"/>
    <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5" fill="none"/>
    <ellipse cx="12" cy="12" rx="3" ry="7" stroke="white" strokeWidth="1.5" fill="none"/>
    <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="1.5"/>
  </svg>
);

const { Text } = Typography;
const { useToken } = theme;

// Format large numbers to K/M format
function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return count.toString();
}

interface MerchantSnapshotCardProps {
  /** Merchant account data */
  merchant: MerchantAccount;
  /** Wrap in Card component */
  showCard?: boolean;
  /** Compact layout (smaller spacing, fonts) */
  compact?: boolean;
  /** Show merchant potential details */
  showPotentialScore?: boolean;
  /** Allow clicking on potential tag for details */
  onPotentialClick?: (e: React.MouseEvent) => void;
  /** Additional styles for wrapper */
  style?: React.CSSProperties;
}

/**
 * MerchantSnapshotCard - Displays merchant snapshot with logo, name, merchant potential
 * 
 * This component consolidates the merchant info display pattern that was duplicated
 * across AIAdvisorySidebar, DefaultSidebarContent, and DealPreviewModal.
 * 
 * @example
 * // Full card display
 * <MerchantSnapshotCard merchant={account} showCard showPotentialScore />
 * 
 * // Compact inline display (for sidebars)
 * <MerchantSnapshotCard merchant={account} compact showCard={false} />
 * 
 * // With potential click handler
 * <MerchantSnapshotCard 
 *   merchant={account} 
 *   onPotentialClick={(e) => showAnalysisModal()} 
 * />
 */
const MerchantSnapshotCard: React.FC<MerchantSnapshotCardProps> = ({
  merchant,
  showCard = true,
  compact = false,
  showPotentialScore = true,
  onPotentialClick,
  style,
}) => {
  const { token } = useToken();
  const [showDescription, setShowDescription] = useState(true);

  const avatarSize = compact ? 40 : 48;
  const nameSize = token.fontSize;
  const infoSize = compact ? token.fontSizeSM : token.fontSize - 2;

  const content = (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      {/* Merchant Header */}
      <div style={{ display: "flex", gap: token.marginSM, alignItems: "flex-start" }}>
        <EntityAvatar
          name={merchant.name}
          logo={merchant.logo}
          size={avatarSize}
          shape="square"
        />
        
        <div style={{ flex: 1, minWidth: 0, }}>
          <Text strong style={{ fontSize: nameSize, display: "block" }}>
            {merchant.name}
          </Text>          
          <Text type="secondary" style={{ fontSize: infoSize, display: "block"  }}>
            {merchant.businessType}
            {merchant.googleMaps && (
              <>
                <span style={{ margin: `0 ${token.marginXS}px` }}>·</span>
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: infoSize,
                    lineHeight: token.lineHeight,
                  }}
                >
                  {merchant.googleMaps.address}
                </Text>
              </>
            )}
          </Text>
          
          {/* Booking Software */}
          <div style={{ marginTop: token.marginXS }}>
            {merchant.bookingEngine ? (
              <div style={{ display: "flex", alignItems: "center", gap: token.marginXS }}>
                <img 
                  src={merchant.bookingEngine.logo} 
                  alt={merchant.bookingEngine.name}
                  style={{ 
                    width: 16, 
                    height: 16, 
                    objectFit: "contain",
                    borderRadius: 2,
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Text type="secondary" style={{ fontSize: infoSize }}>
                  {merchant.bookingEngine.name}
                </Text>
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: infoSize }}>
                No booking software
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* Social Stats - Google Maps, Instagram, Facebook, Website */}
      {(merchant.googleMaps || merchant.instagram || merchant.facebook || merchant.website) && (
        <>
          <Divider style={{ margin: compact ? `${token.marginXS}px 0` : `${token.margin}px 0` }} />
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap",
            gap: compact ? token.marginXS : token.marginSM,
          }}>
            {/* Google Maps Rating */}
            {merchant.googleMaps && (
              <a 
                href={merchant.googleMaps.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6,
                  textDecoration: "none",
                  padding: "5px 10px",
                  borderRadius: token.borderRadius,
                  background: token.colorFillQuaternary,
                  transition: "background 0.2s",
                }}
              >
                <GoogleMapsIcon size={16} />
                <Text style={{ fontSize: infoSize, fontWeight: 500 }}>
                  {merchant.googleMaps.stars}
                </Text>
                <Text type="secondary" style={{ fontSize: infoSize - 1 }}>
                  ({merchant.googleMaps.reviews.toLocaleString()})
                </Text>
              </a>
            )}
            
            {/* Instagram Followers */}
            {merchant.instagram && (
              <a 
                href={merchant.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6,
                  textDecoration: "none",
                  padding: "5px 10px",
                  borderRadius: token.borderRadius,
                  background: token.colorFillQuaternary,
                  transition: "background 0.2s",
                }}
              >
                <InstagramIcon size={16} />
                <Text style={{ fontSize: infoSize }}>
                  {formatFollowerCount(merchant.instagram.followers)}
                </Text>
              </a>
            )}
            
            {/* Facebook Likes */}
            {merchant.facebook && (
              <a 
                href={merchant.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6,
                  textDecoration: "none",
                  padding: "5px 10px",
                  borderRadius: token.borderRadius,
                  background: token.colorFillQuaternary,
                  transition: "background 0.2s",
                }}
              >
                <FacebookIcon size={16} />
                <Text style={{ fontSize: infoSize }}>
                  {formatFollowerCount(merchant.facebook.likes)}
                </Text>
              </a>
            )}
            
            {/* Website */}
            {merchant.website && (
              <a 
                href={merchant.website.startsWith('http') ? merchant.website : `https://${merchant.website}`}
                target="_blank"
                rel="noopener noreferrer"
                title={merchant.website}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6,
                  textDecoration: "none",
                  padding: "5px 10px",
                  borderRadius: token.borderRadius,
                  background: token.colorFillQuaternary,
                  transition: "background 0.2s",
                }}
              >
                <WebsiteIcon size={16} />
                <Text 
                  style={{ 
                    fontSize: infoSize,
                    maxWidth: 40,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {merchant.website.replace(/^(https?:\/\/)?(www\.)?/, '')}
                </Text>
              </a>
            )}
          </div>
        </>
      )}

      {/* Merchant Potential Section */}
      {showPotentialScore && (
        <>
          <Divider style={{ margin: compact ? `${token.marginXS}px 0` : `${token.margin}px 0` }} />
          
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              Merchant Potential
            </Text>
            <Space size="small">
              <PotentialTag
                potential={merchant.potential}
                showIcon={false}
                onClick={onPotentialClick}
                size="small"
                style={{
                  cursor: onPotentialClick ? "pointer" : "default",
                  transition: onPotentialClick ? `all ${token.motionDurationMid}` : "none",
                }}
              />
              <Text strong style={{ fontSize: compact ? token.fontSizeSM + 1 : token.fontSize }}>
                {merchant.potentialAnalysis.score}%
              </Text>
            </Space>
          </div>
          
          <ScoreProgress
            score={merchant.potentialAnalysis.score}
            colorType="gradient"
            size="small"
            showInfo={false}
          />
        </>
      )}

      {/* AI Review Section */}
      {merchant.description && (
        <>
          <Divider style={{ margin: `${token.marginXS}px 0` }} />
          <div>
            <div 
              style={{ 
                marginBottom: showDescription ? 12 : 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
              onClick={() => setShowDescription(!showDescription)}
            >
              <Text strong style={{ fontSize: 13 }}>
                AI Review
              </Text>
              {showDescription ? (
                <ChevronUp size={14} style={{ color: token.colorTextSecondary }} />
              ) : (
                <ChevronDown size={14} style={{ color: token.colorTextSecondary }} />
              )}
            </div>
            {showDescription && (
              <div style={{ marginTop: 12 }}>
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: infoSize,
                    lineHeight: 1.5,
                    display: "block",
                  }}
                >
                  {merchant.description}
                </Text>
              </div>
            )}
          </div>
        </>
      )}
    </Space>
  );

  if (showCard) {
    return (
      <Card size="small" style={style}>
        {content}
      </Card>
    );
  }

  return <div style={style}>{content}</div>;
};

export default MerchantSnapshotCard;

