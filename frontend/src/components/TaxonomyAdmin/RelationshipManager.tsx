/**
 * RelationshipManager Component
 * 
 * Manage relationships between taxonomy entities:
 * - Assign subcategories to categories
 * - Assign services to subcategories
 * - Mark primary relationships
 * - Adjust relevance scores
 * - View all relationships for an entity
 */

import { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Button,
  Space,
  Typography,
  message,
  Table,
  Tag,
  Popconfirm,
  Slider,
  Switch,
} from 'antd';
import { Plus, Trash2, Link2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

interface Relationship {
  id: string;
  parent_name: string;
  child_name: string;
  is_primary: boolean;
  relevance_score?: number;
}

export const RelationshipManager: React.FC<{ onUpdate?: () => void }> = ({ onUpdate }) => {
  const [relationshipType, setRelationshipType] = useState<'cat-subcat' | 'subcat-service'>('cat-subcat');
  
  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // Selection
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [relevanceScore, setRelevanceScore] = useState(1.0);
  
  // Relationships
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [relationshipType]);

  const loadData = async () => {
    try {
      if (relationshipType === 'cat-subcat') {
        // Load categories and subcategories
        const [catRes, subcatRes] = await Promise.all([
          supabase.from('taxonomy_categories').select('id, name').eq('is_active', true).order('name'),
          supabase.from('taxonomy_subcategories').select('id, name').eq('is_active', true).order('name'),
        ]);

        setCategories(catRes.data || []);
        setSubcategories(subcatRes.data || []);
      } else {
        // Load subcategories and services
        const [subcatRes, serviceRes] = await Promise.all([
          supabase.from('taxonomy_subcategories').select('id, name').eq('is_active', true).order('name'),
          supabase.from('taxonomy_services').select('id, name').eq('is_active', true).order('name').limit(1000),
        ]);

        setSubcategories(subcatRes.data || []);
        setServices(serviceRes.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load data');
    }
  };

  useEffect(() => {
    if (selectedParent) {
      loadRelationships();
    }
  }, [selectedParent, relationshipType]);

  const loadRelationships = async () => {
    if (!selectedParent) return;

    setLoading(true);
    try {
      if (relationshipType === 'cat-subcat') {
        const { data, error } = await supabase
          .from('taxonomy_category_subcategories')
          .select(`
            category_id,
            subcategory_id,
            is_primary,
            subcategory:taxonomy_subcategories(name)
          `)
          .eq('category_id', selectedParent);

        if (error) throw error;

        const rels = data?.map((rel: any, idx) => ({
          id: `${rel.category_id}-${rel.subcategory_id}`,
          parent_name: '',
          child_name: rel.subcategory?.name || '',
          is_primary: rel.is_primary,
        })) || [];

        setRelationships(rels);
      } else {
        const { data, error } = await supabase
          .from('taxonomy_subcategory_services')
          .select(`
            subcategory_id,
            service_id,
            is_primary,
            relevance_score,
            service:taxonomy_services(name)
          `)
          .eq('subcategory_id', selectedParent);

        if (error) throw error;

        const rels = data?.map((rel: any) => ({
          id: `${rel.subcategory_id}-${rel.service_id}`,
          parent_name: '',
          child_name: rel.service?.name || '',
          is_primary: rel.is_primary,
          relevance_score: rel.relevance_score,
        })) || [];

        setRelationships(rels);
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
      message.error('Failed to load relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRelationship = async () => {
    if (!selectedParent || !selectedChild) {
      message.warning('Please select both parent and child');
      return;
    }

    try {
      if (relationshipType === 'cat-subcat') {
        const { error } = await supabase
          .from('taxonomy_category_subcategories')
          .insert({
            category_id: selectedParent,
            subcategory_id: selectedChild,
            is_primary: isPrimary,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('taxonomy_subcategory_services')
          .insert({
            subcategory_id: selectedParent,
            service_id: selectedChild,
            is_primary: isPrimary,
            relevance_score: relevanceScore,
          });

        if (error) throw error;
      }

      message.success('Relationship added');
      loadRelationships();
      onUpdate?.();
      
      // Reset selections
      setSelectedChild(null);
      setIsPrimary(false);
      setRelevanceScore(1.0);

      // Refresh materialized view
      await supabase.rpc('refresh_taxonomy_paths');
    } catch (error: any) {
      console.error('Error adding relationship:', error);
      message.error(error.message || 'Failed to add relationship');
    }
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    const [parentId, childId] = relationshipId.split('-');

    try {
      if (relationshipType === 'cat-subcat') {
        const { error } = await supabase
          .from('taxonomy_category_subcategories')
          .delete()
          .eq('category_id', parentId)
          .eq('subcategory_id', childId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('taxonomy_subcategory_services')
          .delete()
          .eq('subcategory_id', parentId)
          .eq('service_id', childId);

        if (error) throw error;
      }

      message.success('Relationship deleted');
      loadRelationships();
      onUpdate?.();

      // Refresh materialized view
      await supabase.rpc('refresh_taxonomy_paths');
    } catch (error: any) {
      console.error('Error deleting relationship:', error);
      message.error(error.message || 'Failed to delete relationship');
    }
  };

  const columns: ColumnsType<Relationship> = [
    {
      title: relationshipType === 'cat-subcat' ? 'Subcategory' : 'Service',
      dataIndex: 'child_name',
      key: 'child_name',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Primary',
      dataIndex: 'is_primary',
      key: 'is_primary',
      width: 100,
      render: (isPrimary) => (
        <Tag color={isPrimary ? 'success' : 'default'}>
          {isPrimary ? 'Primary' : 'Secondary'}
        </Tag>
      ),
    },
    ...(relationshipType === 'subcat-service'
      ? [
          {
            title: 'Relevance',
            dataIndex: 'relevance_score',
            key: 'relevance_score',
            width: 100,
            render: (score: number) => <Tag color="blue">{score?.toFixed(2) || '1.00'}</Tag>,
          },
        ]
      : []),
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Relationship) => (
        <Popconfirm
          title="Delete relationship?"
          onConfirm={() => handleDeleteRelationship(record.id)}
          okText="Yes"
          cancelText="No"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger icon={<Trash2 size={14} />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={5}>
          <Link2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Manage Relationships
        </Title>
        <Text type="secondary">
          Connect categories, subcategories, and services. Services can belong to multiple subcategories.
        </Text>
      </Card>

      {/* Relationship Type Selector */}
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Relationship Type:</Text>
            <Select
              style={{ width: 300, marginLeft: 12 }}
              value={relationshipType}
              onChange={setRelationshipType}
              options={[
                { label: 'Category → Subcategory', value: 'cat-subcat' },
                { label: 'Subcategory → Service', value: 'subcat-service' },
              ]}
            />
          </div>

          {/* Parent Selection */}
          <div>
            <Text strong>{relationshipType === 'cat-subcat' ? 'Category:' : 'Subcategory:'}</Text>
            <Select
              showSearch
              style={{ width: 400, marginLeft: 12 }}
              placeholder={`Select ${relationshipType === 'cat-subcat' ? 'category' : 'subcategory'}`}
              value={selectedParent}
              onChange={setSelectedParent}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={(relationshipType === 'cat-subcat' ? categories : subcategories).map(item => ({
                label: item.name,
                value: item.id,
              }))}
            />
          </div>

          {/* Child Selection */}
          {selectedParent && (
            <>
              <div>
                <Text strong>{relationshipType === 'cat-subcat' ? 'Subcategory:' : 'Service:'}</Text>
                <Select
                  showSearch
                  style={{ width: 400, marginLeft: 12 }}
                  placeholder={`Select ${relationshipType === 'cat-subcat' ? 'subcategory' : 'service'}`}
                  value={selectedChild}
                  onChange={setSelectedChild}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={(relationshipType === 'cat-subcat' ? subcategories : services).map(item => ({
                    label: item.name,
                    value: item.id,
                  }))}
                />
              </div>

              <Space size="large">
                <div>
                  <Text strong style={{ marginRight: 12 }}>Primary:</Text>
                  <Switch checked={isPrimary} onChange={setIsPrimary} />
                </div>

                {relationshipType === 'subcat-service' && (
                  <div style={{ width: 200 }}>
                    <Text strong>Relevance: {relevanceScore.toFixed(2)}</Text>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={relevanceScore}
                      onChange={setRelevanceScore}
                    />
                  </div>
                )}
              </Space>

              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={handleAddRelationship}
              >
                Add Relationship
              </Button>
            </>
          )}
        </Space>
      </Card>

      {/* Existing Relationships */}
      {selectedParent && (
        <Card title={`Existing Relationships (${relationships.length})`}>
          <Table
            columns={columns}
            dataSource={relationships}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 20 }}
          />
        </Card>
      )}
    </Space>
  );
};
















