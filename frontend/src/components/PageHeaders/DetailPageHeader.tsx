import React, { ReactNode } from 'react';
import { Typography, Space, theme } from 'antd';

const { Title, Text } = Typography;
const { useToken } = theme;

interface DetailPageHeaderProps {
  /**
   * Breadcrumbs component for navigation
   */
  breadcrumbs?: ReactNode;
  
  /**
   * Main title - typically the name of the entity (e.g., deal name, account name)
   */
  title: string;
  
  /**
   * Subtitle or metadata (e.g., account name for a deal, status)
   */
  subtitle?: string;
  
  /**
   * Additional metadata to display below the title
   */
  metadata?: ReactNode;
  
  /**
   * Action buttons displayed on the right side
   */
  actions?: ReactNode[];
  
  /**
   * Tabs for different sections (e.g., Overview, Performance, Settings)
   */
  tabs?: ReactNode;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * DetailPageHeader
 * 
 * Consistent header component for detail pages (DealDetail, AccountDetail, etc.)
 * 
 * Features:
 * - Breadcrumbs for navigation
 * - Page title with metadata
 * - Action buttons
 * - Optional tabs for sections
 * 
 * Spacing:
 * - Breadcrumbs to title: token.marginSM
 * - Title to tabs: token.margin
 * - Header padding: token.paddingLG
 * 
 * @example
 * ```tsx
 * <DetailPageHeader
 *   breadcrumbs={<DynamicBreadcrumbs />}
 *   title="Summer Sale 2024"
 *   subtitle="Acme Restaurant"
 *   metadata={<Space><Tag>Live</Tag><Text>50 sold</Text></Space>}
 *   actions={[
 *     <Button key="edit" icon={<Edit />}>Edit</Button>,
 *     <Button key="duplicate" icon={<Copy />}>Duplicate</Button>
 *   ]}
 *   tabs={<Tabs items={[...]} />}
 * />
 * ```
 */
export const DetailPageHeader: React.FC<DetailPageHeaderProps> = ({
  breadcrumbs,
  title,
  subtitle,
  metadata,
  actions,
  tabs,
  className,
}) => {
  const { token } = useToken();

  return (
    <div className={className}>
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <div style={{ marginBottom: token.marginSM }}>
          {breadcrumbs}
        </div>
      )}

      {/* Title, Subtitle, and Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: metadata ? token.marginSM : (tabs ? token.margin : token.marginLG),
        }}
      >
        <div style={{ flex: 1 }}>
          <Title level={2} style={{ margin: 0, marginBottom: subtitle ? token.marginXS : 0 }}>
            {title}
          </Title>
          {subtitle && (
            <Text type="secondary" style={{ fontSize: token.fontSizeLG }}>
              {subtitle}
            </Text>
          )}
        </div>
        
        {actions && actions.length > 0 && (
          <Space size="small">
            {actions.map((action, index) => (
              <React.Fragment key={index}>{action}</React.Fragment>
            ))}
          </Space>
        )}
      </div>

      {/* Metadata */}
      {metadata && (
        <div style={{ marginBottom: tabs ? token.margin : token.marginLG }}>
          {metadata}
        </div>
      )}

      {/* Tabs */}
      {tabs && (
        <div style={{ marginBottom: token.margin }}>
          {tabs}
        </div>
      )}
    </div>
  );
};

export default DetailPageHeader;




