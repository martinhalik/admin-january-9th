/**
 * Taxonomy Admin Page
 * 
 * Comprehensive admin interface for managing the taxonomy:
 * - Create, edit, delete categories, subcategories, services
 * - Manage relationships (which services belong to which subcategories)
 * - View full taxonomy tree
 * - Merge duplicates
 * - Bulk operations
 * - Import/export
 */

import { useState } from 'react';
import {
  Tabs,
  Button,
  Space,
  Typography,
  message,
  theme,
} from 'antd';
import {
  FolderTree,
  Layers,
  Tag as TagIcon,
  Sparkles,
  Settings,
  RefreshCw,
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { CategoryManager } from '../components/TaxonomyAdmin/CategoryManager';
import { SubcategoryManager } from '../components/TaxonomyAdmin/SubcategoryManager';
import { ServiceManager } from '../components/TaxonomyAdmin/ServiceManager';
import { TaxonomyTree } from '../components/TaxonomyAdmin/TaxonomyTree';
import { TaxonomyImprovementPanel } from '../components/TaxonomyImprovementPanel';
import { RelationshipManager } from '../components/TaxonomyAdmin/RelationshipManager';
import { BulkOperations } from '../components/TaxonomyAdmin/BulkOperations';
import { SimplePageHeader } from '../components/PageHeaders';

const { Text } = Typography;
const { useToken } = theme;

const TaxonomyAdmin = () => {
  const { token } = useToken();
  const [activeTab, setActiveTab] = useState('categories');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    message.success('Taxonomy refreshed');
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: token.marginSM }}>
        <Breadcrumbs />
      </div>

      {/* Page Header */}
      <SimplePageHeader
        title="Taxonomy Management"
        level={3}
        actions={[
          <Button key="refresh" icon={<RefreshCw size={16} />} onClick={handleRefresh}>
            Refresh
          </Button>,
        ]}
      />

      {/* Description */}
      <div style={{ marginBottom: token.marginLG }}>
        <Text type="secondary">
          Manage categories, subcategories, and services for deal classification. System contains ~10 categories, ~560 subcategories, and ~8,400 services.
        </Text>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'categories',
            label: (
              <Space>
                <Layers size={16} />
                <span>Categories</span>
              </Space>
            ),
            children: <CategoryManager key={`cat-${refreshKey}`} onUpdate={handleRefresh} />,
          },
          {
            key: 'subcategories',
            label: (
              <Space>
                <TagIcon size={16} />
                <span>Subcategories</span>
              </Space>
            ),
            children: <SubcategoryManager key={`subcat-${refreshKey}`} onUpdate={handleRefresh} />,
          },
          {
            key: 'services',
            label: (
              <Space>
                <Sparkles size={16} />
                <span>Services</span>
              </Space>
            ),
            children: <ServiceManager key={`service-${refreshKey}`} onUpdate={handleRefresh} />,
          },
          {
            key: 'tree',
            label: (
              <Space>
                <FolderTree size={16} />
                <span>Tree View</span>
              </Space>
            ),
            children: <TaxonomyTree key={`tree-${refreshKey}`} />,
          },
          {
            key: 'relationships',
            label: (
              <Space>
                <Settings size={16} />
                <span>Relationships</span>
              </Space>
            ),
            children: <RelationshipManager key={`rel-${refreshKey}`} onUpdate={handleRefresh} />,
          },
          {
            key: 'bulk',
            label: (
              <Space>
                <Settings size={16} />
                <span>Bulk Operations</span>
              </Space>
            ),
            children: <BulkOperations key={`bulk-${refreshKey}`} onUpdate={handleRefresh} />,
          },
          {
            key: 'improvements',
            label: (
              <Space>
                <Sparkles size={16} />
                <span>Improvements</span>
              </Space>
            ),
            children: <TaxonomyImprovementPanel />,
          },
        ]}
      />
    </div>
  );
};

export default TaxonomyAdmin;

