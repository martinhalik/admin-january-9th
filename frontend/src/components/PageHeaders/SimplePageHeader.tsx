import React, { ReactNode } from 'react';
import { Typography, Space, theme } from 'antd';

const { Title, Text } = Typography;
const { useToken } = theme;

interface SimplePageHeaderProps {
  /**
   * Page title
   */
  title: string;
  
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  
  /**
   * Action buttons displayed on the right side
   */
  actions?: ReactNode[];
  
  /**
   * Optional className for custom styling
   */
  className?: string;
  
  /**
   * Title level (default: 2)
   */
  level?: 1 | 2 | 3 | 4 | 5;
}

/**
 * SimplePageHeader
 * 
 * Minimal header component for simple/utility pages (Dashboard, Tasks, Settings, etc.)
 * 
 * Features:
 * - Page title with configurable level
 * - Optional subtitle
 * - Optional action buttons
 * - Minimal styling with consistent spacing
 * 
 * Spacing:
 * - Title margin bottom: token.marginLG
 * - Subtitle margin top: token.marginXS
 * 
 * @example
 * ```tsx
 * <SimplePageHeader
 *   title="Dashboard"
 *   subtitle="Welcome back, John!"
 *   actions={[
 *     <Button key="settings" icon={<Settings />}>Settings</Button>
 *   ]}
 * />
 * ```
 */
export const SimplePageHeader: React.FC<SimplePageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className,
  level = 2,
}) => {
  const { token } = useToken();

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: token.marginLG,
      }}
    >
      <div>
        <Title level={level} style={{ margin: 0 }}>
          {title}
        </Title>
        {subtitle && (
          <Text type="secondary" style={{ display: 'block', marginTop: token.marginXS }}>
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
  );
};

export default SimplePageHeader;




