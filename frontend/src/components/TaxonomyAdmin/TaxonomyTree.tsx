/**
 * TaxonomyTree Component
 * 
 * Visual tree representation of the entire taxonomy:
 * - Category → Subcategory → Service hierarchy
 * - Expandable/collapsible nodes
 * - Search and filter
 * - Statistics for each node
 * - Quick actions (edit, add child)
 */

import { useState, useEffect } from 'react';
import {
  Tree,
  Input,
  Space,
  Typography,
  Tag,
  Button,
  Spin,
  Empty,
  message,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { Search, FolderTree, Layers, TagIcon, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const { Text } = Typography;

export const TaxonomyTree: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [stats, setStats] = useState({
    categories: 0,
    subcategories: 0,
    services: 0,
    multiContextServices: 0,
  });

  useEffect(() => {
    loadTaxonomy();
  }, []);

  const loadTaxonomy = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Load categories with related data
      const { data: categories, error: catError } = await supabase
        .from('taxonomy_categories')
        .select(`
          id,
          name,
          slug,
          is_active,
          sort_order,
          subcategories:taxonomy_category_subcategories(
            subcategory:taxonomy_subcategories(
              id,
              name,
              slug,
              is_active,
              sort_order,
              services:taxonomy_subcategory_services(
                service:taxonomy_services(
                  id,
                  name,
                  slug,
                  usage_count,
                  is_active
                )
              )
            )
          )
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (catError) throw catError;

      // Build tree structure
      const tree = buildTreeData(categories || []);
      setTreeData(tree);

      // Calculate stats
      const totalSubcats = categories?.reduce(
        (sum, cat) => sum + (cat.subcategories?.length || 0),
        0
      ) || 0;

      const allServices = new Set<string>();
      const serviceContextCount: Record<string, number> = {};

      categories?.forEach((cat: any) => {
        cat.subcategories?.forEach((rel: any) => {
          const subcat = rel.subcategory;
          subcat?.services?.forEach((svcRel: any) => {
            const service = svcRel.service;
            if (service?.id) {
              allServices.add(service.id);
              serviceContextCount[service.id] = (serviceContextCount[service.id] || 0) + 1;
            }
          });
        });
      });

      const multiContext = Object.values(serviceContextCount).filter(count => count > 1).length;

      setStats({
        categories: categories?.length || 0,
        subcategories: totalSubcats,
        services: allServices.size,
        multiContextServices: multiContext,
      });
    } catch (error) {
      console.error('Error loading taxonomy:', error);
      message.error('Failed to load taxonomy');
    } finally {
      setLoading(false);
    }
  };

  const buildTreeData = (categories: any[]): DataNode[] => {
    return categories.map((category) => {
      const subcatNodes = category.subcategories
        ?.map((rel: any) => {
          const subcat = rel.subcategory;
          if (!subcat) return null;

          const serviceNodes = subcat.services
            ?.map((svcRel: any) => {
              const service = svcRel.service;
              if (!service) return null;

              return {
                title: (
                  <Space>
                    <Sparkles size={12} />
                    <Text>{service.name}</Text>
                    {service.usage_count > 0 && (
                      <Tag color="green" style={{ fontSize: 10 }}>
                        {service.usage_count}
                      </Tag>
                    )}
                  </Space>
                ),
                key: `service-${service.id}`,
                isLeaf: true,
              };
            })
            .filter(Boolean) || [];

          return {
            title: (
              <Space>
                <TagIcon size={14} />
                <Text strong>{subcat.name}</Text>
                <Tag color="blue" style={{ fontSize: 10 }}>
                  {serviceNodes.length}
                </Tag>
              </Space>
            ),
            key: `subcat-${subcat.id}`,
            children: serviceNodes,
          };
        })
        .filter(Boolean) || [];

      return {
        title: (
          <Space>
            <Layers size={16} />
            <Text strong style={{ fontSize: 15 }}>
              {category.name}
            </Text>
            <Tag color="purple" style={{ fontSize: 10 }}>
              {subcatNodes.length}
            </Tag>
          </Space>
        ),
        key: `cat-${category.id}`,
        children: subcatNodes,
      };
    });
  };

  const onExpand = (expandedKeysValue: React.Key[]) => {
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    
    if (!value) {
      setExpandedKeys([]);
      setAutoExpandParent(false);
      return;
    }

    // Expand all nodes that match the search
    const expandedKeys: React.Key[] = [];
    const searchLower = value.toLowerCase();

    const searchTree = (nodes: DataNode[]) => {
      nodes.forEach((node) => {
        const title = typeof node.title === 'string' ? node.title : '';
        if (title.toLowerCase().includes(searchLower)) {
          expandedKeys.push(node.key);
        }
        if (node.children) {
          searchTree(node.children);
        }
      });
    };

    searchTree(treeData);
    setExpandedKeys(expandedKeys);
    setAutoExpandParent(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading taxonomy tree...</Text>
        </div>
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Stats Cards */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Categories"
              value={stats.categories}
              prefix={<Layers size={20} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Subcategories"
              value={stats.subcategories}
              prefix={<TagIcon size={20} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Services"
              value={stats.services}
              prefix={<Sparkles size={20} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Multi-Context"
              value={stats.multiContextServices}
              prefix={<FolderTree size={20} />}
              valueStyle={{ color: '#fa8c16' }}
              suffix={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  / {stats.services}
                </Text>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Input
          placeholder="Search taxonomy tree..."
          prefix={<Search size={16} />}
          allowClear
          style={{ maxWidth: 400 }}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Space>
          <Button onClick={() => setExpandedKeys([])}>Collapse All</Button>
          <Button
            onClick={() => {
              // Expand all category and subcategory nodes
              const keys: React.Key[] = [];
              treeData.forEach((cat) => {
                keys.push(cat.key);
                if (cat.children) {
                  cat.children.forEach((subcat) => {
                    keys.push(subcat.key);
                  });
                }
              });
              setExpandedKeys(keys);
            }}
          >
            Expand All Categories
          </Button>
        </Space>
      </div>

      {/* Tree */}
      <Card>
        {treeData.length === 0 ? (
          <Empty description="No taxonomy data found" />
        ) : (
          <Tree
            showLine
            showIcon={false}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            onExpand={onExpand}
            treeData={treeData}
            height={600}
            virtual
          />
        )}
      </Card>
    </Space>
  );
};



