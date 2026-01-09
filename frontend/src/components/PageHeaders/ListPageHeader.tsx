import React, { ReactNode } from 'react';
import { Typography, Space, theme } from 'antd';

const { Title } = Typography;
const { useToken } = theme;

interface ListPageHeaderProps {
  /**
   * Page title - typically the name of the list (e.g., "Deals", "Accounts")
   */
  title: string;
  
  /**
   * Action buttons displayed on the right side of the header
   */
  actions?: ReactNode[];
  
  /**
   * Tabs for filtering/categorization (e.g., All, Live, Scheduled)
   */
  tabs?: ReactNode;
  
  /**
   * Search bar and filter controls
   */
  searchBar?: ReactNode;
  
  /**
   * Additional filters (e.g., AccountOwnerFilter)
   */
  filters?: ReactNode;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
  
  /**
   * Optional extra content between title and tabs
   */
  extra?: ReactNode;
}

/**
 * ListPageHeader
 * 
 * Consistent header component for list/table pages (Deals, Accounts, etc.)
 * 
 * Features:
 * - Page title with consistent typography
 * - Action buttons (right-aligned)
 * - Optional tabs for filtering
 * - Search and filter controls
 * - Consistent spacing using design tokens
 * 
 * Spacing:
 * - Header to tabs: token.marginSM
 * - Tabs to search: token.marginXS
 * - Search to content: token.margin
 * 
 * @example
 * ```tsx
 * <ListPageHeader
 *   title="Deals"
 *   actions={[
 *     <Button key="process">Process All Deals</Button>,
 *     <Button key="create" type="primary">Create Deal</Button>
 *   ]}
 *   tabs={<Tabs items={[...]} />}
 *   searchBar={<Input placeholder="Search deals..." />}
 *   filters={<AccountOwnerFilter />}
 * />
 * ```
 */
export const ListPageHeader: React.FC<ListPageHeaderProps> = ({
  title,
  actions,
  tabs,
  searchBar,
  filters,
  className,
  extra,
}) => {
  const { token } = useToken();

  return (
    <div className={className}>
      {/* Title and Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: tabs ? token.marginSM : token.marginLG,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {title}
        </Title>
        
        {actions && actions.length > 0 && (
          <Space size="small">
            {actions.map((action, index) => (
              <React.Fragment key={index}>{action}</React.Fragment>
            ))}
          </Space>
        )}
      </div>

      {/* Extra Content */}
      {extra && (
        <div style={{ marginBottom: token.marginSM }}>
          {extra}
        </div>
      )}

      {/* Tabs */}
      {tabs && (
        <div style={{ marginBottom: token.marginXS }}>
          {tabs}
        </div>
      )}

      {/* Search Bar and Filters */}
      {(searchBar || filters) && (
        <div
          style={{
            display: 'flex',
            gap: token.marginXS,
            marginBottom: token.margin,
            flexWrap: 'wrap',
          }}
        >
          {searchBar}
          {filters}
        </div>
      )}
    </div>
  );
};

export default ListPageHeader;




