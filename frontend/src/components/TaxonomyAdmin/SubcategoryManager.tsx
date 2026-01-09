/**
 * SubcategoryManager Component
 * 
 * Manage subcategories (~560 items):
 * - View all subcategories
 * - Create new subcategories
 * - Edit existing subcategories
 * - Delete subcategories
 * - See which categories they belong to
 */

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Typography,
} from 'antd';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  service_count?: number;
  category_names?: string[];
}

interface SubcategoryManagerProps {
  onUpdate?: () => void;
}

export const SubcategoryManager: React.FC<SubcategoryManagerProps> = ({ onUpdate }) => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadSubcategories();
  }, [searchQuery]);

  const loadSubcategories = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase
        .from('taxonomy_subcategories')
        .select(`
          *,
          service_count:taxonomy_subcategory_services(count),
          categories:taxonomy_category_subcategories(
            category:taxonomy_categories(name)
          )
        `);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('sort_order');

      if (error) throw error;

      // Transform data to extract counts and category names
      const subcatsWithData = data?.map((subcat: any) => ({
        ...subcat,
        service_count: subcat.service_count?.[0]?.count || 0,
        category_names: subcat.categories?.map((c: any) => c.category?.name).filter(Boolean) || [],
      })) || [];

      setSubcategories(subcatsWithData);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      message.error('Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSubcategory(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      sort_order: subcategories.length,
    });
    setModalOpen(true);
  };

  const handleEdit = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    form.setFieldsValue(subcategory);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Generate slug from name if not provided
      if (!values.slug) {
        values.slug = values.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      if (editingSubcategory) {
        // Update existing
        if (!supabase) return;
        const { error } = await supabase
          .from('taxonomy_subcategories')
          .update(values)
          .eq('id', editingSubcategory.id);

        if (error) throw error;
        message.success('Subcategory updated successfully');
      } else {
        // Create new
        if (!supabase) return;
        const { error } = await supabase
          .from('taxonomy_subcategories')
          .insert(values);

        if (error) throw error;
        message.success('Subcategory created successfully');
      }

      setModalOpen(false);
      loadSubcategories();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error saving subcategory:', error);
      message.error(error.message || 'Failed to save subcategory');
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('taxonomy_subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      message.success('Subcategory deleted');
      loadSubcategories();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error deleting subcategory:', error);
      message.error(error.message || 'Failed to delete subcategory');
    }
  };

  const columns: ColumnsType<Subcategory> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.slug}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Categories',
      dataIndex: 'category_names',
      key: 'category_names',
      width: 200,
      render: (names: string[]) => (
        <Space size={4} wrap>
          {names.map((name, idx) => (
            <Tag key={idx} color="blue" style={{ fontSize: 11 }}>
              {name}
            </Tag>
          ))}
          {names.length === 0 && <Text type="secondary">None</Text>}
        </Space>
      ),
    },
    {
      title: 'Services',
      dataIndex: 'service_count',
      key: 'service_count',
      width: 100,
      render: (count) => <Tag color="green">{count || 0}</Tag>,
    },
    {
      title: 'Order',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<Edit2 size={14} />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete subcategory?"
            description="This will remove all relationships. Are you sure?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <Input
            placeholder="Search subcategories..."
            allowClear
            style={{ maxWidth: 400 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Space>
            <Text type="secondary">{subcategories.length} subcategories</Text>
            <Button type="primary" icon={<Plus size={16} />} onClick={handleCreate}>
              Add Subcategory
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={subcategories}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 50, showSizeChanger: true }}
        />
      </Space>

      {/* Create/Edit Modal */}
      <Modal
        title={editingSubcategory ? 'Edit Subcategory' : 'Create Subcategory'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter subcategory name' }]}
          >
            <Input placeholder="e.g., Alternative Medicine" />
          </Form.Item>

          <Form.Item
            label="Slug"
            name="slug"
            rules={[{ required: true, message: 'Please enter slug' }]}
            help="URL-friendly identifier (auto-generated from name if empty)"
          >
            <Input placeholder="e.g., alternative-medicine" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Optional description for this subcategory"
            />
          </Form.Item>

          <Form.Item label="Sort Order" name="sort_order">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Active" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};



