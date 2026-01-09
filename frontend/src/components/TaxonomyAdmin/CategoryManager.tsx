/**
 * CategoryManager Component
 * 
 * Manage top-level categories:
 * - View all categories
 * - Create new categories
 * - Edit existing categories
 * - Delete categories (with confirmation)
 * - Reorder categories
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
  theme,
} from 'antd';
import { Plus, Edit2, Trash2, MoveUp, MoveDown, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;
const { useToken } = theme;

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  subcategory_count?: number;
}

interface CategoryManagerProps {
  onUpdate?: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onUpdate }) => {
  const { token } = useToken();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get root level nodes (categories) - level = 0 or parent_id IS NULL
      const { data, error } = await supabase
        .from('taxonomy_nodes')
        .select('*')
        .eq('level', 0)
        .order('sort_order');

      if (error) throw error;

      // Count children for each category
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (cat: any) => {
          const { count } = await supabase
            .from('taxonomy_nodes')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', cat.id);
          
          return {
            ...cat,
            subcategory_count: count || 0,
          };
        })
      );

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error loading categories:', error);
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      sort_order: categories.length,
    });
    setModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const values = await form.validateFields();
      
      // Generate slug from name if not provided
      if (!values.slug) {
        values.slug = values.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      if (editingCategory) {
        // Update existing
        const { error } = await supabase
          .from('taxonomy_nodes')
          .update(values)
          .eq('id', editingCategory.id);

        if (error) throw error;
        message.success('Category updated successfully');
      } else {
        // Create new (root level node)
        const { error } = await supabase
          .from('taxonomy_nodes')
          .insert({
            ...values,
            parent_id: null, // Root node
            node_type: 'category',
          });

        if (error) throw error;
        message.success('Category created successfully');
      }

      setModalOpen(false);
      loadCategories();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error saving category:', error);
      message.error(error.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Deleting a node will cascade delete all children (thanks to ON DELETE CASCADE)
      const { error } = await supabase
        .from('taxonomy_nodes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      message.success('Category deleted (including all subcategories)');
      loadCategories();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      message.error(error.message || 'Failed to delete category');
    }
  };

  const handleMove = async (category: Category, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === category.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === categories.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapCategory = categories[swapIndex];

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Swap sort orders
      await supabase
        .from('taxonomy_nodes')
        .update({ sort_order: swapCategory.sort_order })
        .eq('id', category.id);

      await supabase
        .from('taxonomy_nodes')
        .update({ sort_order: category.sort_order })
        .eq('id', swapCategory.id);

      loadCategories();
      onUpdate?.();
    } catch (error) {
      console.error('Error moving category:', error);
      message.error('Failed to move category');
    }
  };

  const columns: ColumnsType<Category> = [
    {
      title: 'Order',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      render: (_, record, index) => (
        <Space size="small">
          <Button
            size="small"
            type="text"
            icon={<MoveUp size={14} />}
            disabled={index === 0}
            onClick={() => handleMove(record, 'up')}
          />
          <Text>{record.sort_order}</Text>
          <Button
            size="small"
            type="text"
            icon={<MoveDown size={14} />}
            disabled={index === categories.length - 1}
            onClick={() => handleMove(record, 'down')}
          />
        </Space>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          {record.color && (
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: record.color,
              }}
            />
          )}
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug) => <Text code>{slug}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Subcategories',
      dataIndex: 'subcategory_count',
      key: 'subcategory_count',
      width: 120,
      render: (count) => <Tag color="blue">{count || 0}</Tag>,
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
            title="Delete category?"
            description="This will also remove all relationships. Are you sure?"
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
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">
            {categories.length > 0 
              ? `Manage top-level categories. ${categories.length} total.`
              : 'No categories found. Import taxonomy data or create manually.'}
          </Text>
          <Button type="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Add Category
          </Button>
        </div>

        {categories.length === 0 && !loading ? (
          <div
            style={{
              padding: '80px 20px',
              textAlign: 'center',
              border: `1px dashed ${token.colorBorder}`,
              borderRadius: token.borderRadius,
            }}
          >
            <Layers size={48} style={{ color: token.colorTextDisabled, marginBottom: 16 }} />
            <Title level={4} style={{ color: token.colorTextSecondary }}>
              No Categories Yet
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
              Get started by importing the taxonomy CSV or creating categories manually
            </Text>
            <Space>
              <Button type="primary" icon={<Plus size={16} />} onClick={handleCreate}>
                Create First Category
              </Button>
              <Button onClick={() => window.open('https://docs.google.com/spreadsheets/d/your-sheet', '_blank')}>
                View CSV Template
              </Button>
            </Space>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={categories}
            loading={loading}
            rowKey="id"
            pagination={false}
          />
        )}
      </Space>

      {/* Create/Edit Modal */}
      <Modal
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="e.g., Food & Drink" />
          </Form.Item>

          <Form.Item
            label="Slug"
            name="slug"
            rules={[{ required: true, message: 'Please enter slug' }]}
            help="URL-friendly identifier (auto-generated from name if empty)"
          >
            <Input placeholder="e.g., food-drink" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Optional description for this category"
            />
          </Form.Item>

          <Form.Item label="Icon" name="icon" help="Icon name (optional)">
            <Input placeholder="e.g., utensils" />
          </Form.Item>

          <Form.Item label="Color" name="color" help="Category color (optional)">
            <Input type="color" />
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

