/**
 * SearchableServiceSelector Component
 * 
 * Advanced service selector with:
 * - Semantic search across 8K+ services
 * - Shows multiple paths when service exists in multiple contexts
 * - Category/subcategory filtering
 * - Usage tracking
 * - Search miss tracking for taxonomy improvement
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  Input,
  Select,
  List,
  Tag,
  Space,
  Typography,
  Empty,
  Spin,
  Badge,
  Tooltip,
  Button,
  Divider,
  message,
} from 'antd';
import { Search, Filter, TrendingUp, Sparkles, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

const { Text } = Typography;

interface ServicePath {
  service_id: string;
  service_name: string;
  service_slug: string;
  subcategory_id: string;
  subcategory_name: string;
  subcategory_slug: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  full_path: string;
  short_path: string;
  is_primary_subcategory: boolean;
  is_primary_category: boolean;
  relevance_score: number;
  usage_count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SearchableServiceSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (service: ServicePath) => void;
  currentValue?: string; // Currently selected service name
  dealId?: string; // For usage tracking
}

export const SearchableServiceSelector: React.FC<SearchableServiceSelectorProps> = ({
  open,
  onClose,
  onSelect,
  currentValue,
  dealId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ServicePath[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedService, setSelectedService] = useState<ServicePath | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load categories on mount
  useEffect(() => {
    if (open) {
      loadCategories();
      // Pre-populate search with current value if exists
      if (currentValue) {
        setSearchQuery(currentValue);
      }
    }
  }, [open, currentValue]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery, categoryFilter);
      }, 300);
    } else if (searchQuery.length === 0) {
      // Show popular services when empty
      loadPopularServices(categoryFilter);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, categoryFilter]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('taxonomy_categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      message.error('Failed to load categories');
    }
  };

  const performSearch = async (query: string, category?: string) => {
    setLoading(true);
    try {
      // Use direct query instead of RPC function (more reliable)
      let dbQuery = supabase
        .from('taxonomy_full_paths')
        .select('*')
        .or(`service_name.ilike.%${query}%,full_path.ilike.%${query}%`)
        .order('usage_count', { ascending: false })
        .limit(50);

      if (category) {
        dbQuery = dbQuery.eq('category_id', category);
      }

      const { data, error } = await dbQuery;

      if (error) throw error;

      if (!data || data.length === 0) {
        // Track search miss for taxonomy improvement
        await trackSearchMiss(query, category);
      }

      setResults(data || []);
    } catch (error) {
      console.error('Error searching services:', error);
      message.error('Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPopularServices = async (category?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('taxonomy_full_paths')
        .select('*')
        .eq('is_primary_subcategory', true);

      if (category) {
        query = query.eq('category_id', category);
      }

      const { data, error } = await query
        .order('usage_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error loading popular services:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const trackSearchMiss = async (query: string, category?: string) => {
    try {
      // Check if this miss already exists
      const { data: existing } = await supabase
        .from('taxonomy_search_misses')
        .select('id, miss_count')
        .eq('search_query', query.toLowerCase())
        .maybeSingle();

      if (existing) {
        // Increment miss count
        await supabase
          .from('taxonomy_search_misses')
          .update({
            miss_count: existing.miss_count + 1,
            last_searched_at: new Date().toISOString(),
            search_context: { category_filter: category },
          })
          .eq('id', existing.id);
      } else {
        // Create new miss record
        await supabase.from('taxonomy_search_misses').insert({
          search_query: query.toLowerCase(),
          search_context: { category_filter: category },
          deal_id: dealId,
        });
      }
    } catch (error) {
      console.error('Error tracking search miss:', error);
    }
  };

  const trackUsage = async (service: ServicePath) => {
    try {
      await supabase.from('taxonomy_usage_log').insert({
        service_id: service.service_id,
        deal_id: dealId,
        subcategory_id: service.subcategory_id,
        category_id: service.category_id,
        search_query: searchQuery || null,
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  };

  const handleSelect = async (service: ServicePath) => {
    setSelectedService(service);
    await trackUsage(service);
    onSelect(service);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setCategoryFilter(undefined);
    setResults([]);
    setSelectedService(null);
    onClose();
  };

  // Group results by service (to show multiple paths)
  const groupedResults = results.reduce((acc, path) => {
    if (!acc[path.service_id]) {
      acc[path.service_id] = {
        service: path,
        paths: [],
      };
    }
    acc[path.service_id].paths.push(path);
    return acc;
  }, {} as Record<string, { service: ServicePath; paths: ServicePath[] }>);

  const groupedResultsArray = Object.values(groupedResults);

  return (
    <Modal
      title={
        <Space>
          <Search size={20} />
          <span>Select Service Category</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      styles={{
        body: { paddingTop: 16, maxHeight: '70vh', overflowY: 'auto' },
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Search Input */}
        <Input
          size="large"
          placeholder="Search services... (e.g., 'massage', 'yoga', 'italian restaurant')"
          prefix={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          autoFocus
        />

        {/* Category Filter */}
        <Select
          placeholder="Filter by category"
          allowClear
          style={{ width: '100%' }}
          value={categoryFilter}
          onChange={setCategoryFilter}
          suffixIcon={<Filter size={16} />}
          options={categories.map((cat) => ({
            label: cat.name,
            value: cat.id,
          }))}
        />

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Searching {searchQuery ? `"${searchQuery}"` : 'popular services'}...</Text>
            </div>
          </div>
        ) : results.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchQuery.length >= 2 ? (
                <Space direction="vertical">
                  <Text type="secondary">
                    No services found for "{searchQuery}"
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Your search will help us improve our taxonomy
                  </Text>
                </Space>
              ) : searchQuery.length === 1 ? (
                <Text type="secondary">Type at least 2 characters to search</Text>
              ) : (
                <Text type="secondary">Start typing to search services</Text>
              )
            }
          />
        ) : (
          <>
            {/* Results Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">
                {groupedResultsArray.length} service{groupedResultsArray.length !== 1 ? 's' : ''} found
              </Text>
              {!searchQuery && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Popular services
                </Text>
              )}
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Results List */}
            <List
              dataSource={groupedResultsArray}
              renderItem={({ service, paths }) => {
                const isMultiPath = paths.length > 1;
                const primaryPath = paths.find((p) => p.is_primary_subcategory) || paths[0];

                return (
                  <List.Item
                    key={service.service_id}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 16px',
                      borderRadius: 8,
                      marginBottom: 8,
                      border: '1px solid #f0f0f0',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#f0f0f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => handleSelect(primaryPath)}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{service.service_name}</Text>
                          {service.usage_count > 0 && (
                            <Tooltip title={`Used ${service.usage_count} times`}>
                              <Badge
                                count={service.usage_count}
                                showZero={false}
                                style={{ backgroundColor: '#52c41a' }}
                              />
                            </Tooltip>
                          )}
                          {isMultiPath && (
                            <Tooltip title="This service appears in multiple categories">
                              <Tag color="purple" style={{ fontSize: 11, padding: '0 4px' }}>
                                <Info size={10} style={{ marginRight: 2 }} />
                                Multi-context
                              </Tag>
                            </Tooltip>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          {/* Primary path */}
                          <Space size={4} wrap>
                            <Tag color="blue">{primaryPath.category_name}</Tag>
                            <Text type="secondary">→</Text>
                            <Tag color="cyan">{primaryPath.subcategory_name}</Tag>
                            {primaryPath.is_primary_subcategory && (
                              <Tag color="success" style={{ fontSize: 10 }}>
                                Primary
                              </Tag>
                            )}
                          </Space>

                          {/* Additional paths */}
                          {isMultiPath && (
                            <>
                              {paths.slice(1).map((path, idx) => (
                                <Space key={idx} size={4} wrap style={{ marginLeft: 8 }}>
                                  <Tag color="default" style={{ fontSize: 11 }}>
                                    {path.category_name}
                                  </Tag>
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    →
                                  </Text>
                                  <Tag color="default" style={{ fontSize: 11 }}>
                                    {path.subcategory_name}
                                  </Tag>
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    (alt. context)
                                  </Text>
                                </Space>
                              ))}
                            </>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </>
        )}

        {/* Help Text */}
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 16 }}>
          <Info size={12} style={{ display: 'inline', marginRight: 4 }} />
          Tip: Services can appear in multiple categories. Select the most relevant one for your deal.
        </Text>
      </Space>
    </Modal>
  );
};



