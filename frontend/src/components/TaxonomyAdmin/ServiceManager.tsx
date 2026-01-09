/**
 * ServiceManager Component
 * 
 * Manage services (the 8,400+ leaf nodes):
 * - View all services with pagination
 * - Search and filter
 * - Create new services
 * - Edit existing services
 * - Delete services
 * - Manage keywords for search
 * - View usage statistics
 */

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Badge,
  Typography,
  Select,
  Tooltip,
} from 'antd';
import { Plus, Edit2, Trash2, Search, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  keywords: string[];
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceManagerProps {
  onUpdate?: () => void;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({ onUpdate }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [form] = Form.useForm();

  useEffect(() => {
    loadServices();
  }, [page, pageSize, searchQuery]);

  const loadServices = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase
        .from('taxonomy_services')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('usage_count', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setServices(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error('Error loading services:', error);
      message.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingService(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      keywords: [],
    });
    setModalOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue(service);
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

      if (editingService) {
        // Update existing
        if (!supabase) return;
        const { error } = await supabase
          .from('taxonomy_services')
          .update(values)
          .eq('id', editingService.id);

        if (error) throw error;
        message.success('Service updated successfully');
      } else {
        // Create new
        if (!supabase) return;
        const { error } = await supabase
          .from('taxonomy_services')
          .insert(values);

        if (error) throw error;
        message.success('Service created successfully');
      }

      setModalOpen(false);
      loadServices();
      onUpdate?.();
      
      // Refresh materialized view
      if (supabase) {
        await supabase.rpc('refresh_taxonomy_paths');
      }
    } catch (error: any) {
      console.error('Error saving service:', error);
      message.error(error.message || 'Failed to save service');
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('taxonomy_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      message.success('Service deleted');
      loadServices();
      onUpdate?.();
      
      // Refresh materialized view
      if (supabase) {
        await supabase.rpc('refresh_taxonomy_paths');
      }
    } catch (error: any) {
      console.error('Error deleting service:', error);
      message.error(error.message || 'Failed to delete service');
    }
  };

  const columns: ColumnsType<Service> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 300,
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
      title: 'Keywords',
      dataIndex: 'keywords',
      key: 'keywords',
      width: 250,
      render: (keywords: string[]) => (
        <Space size={4} wrap>
          {keywords?.slice(0, 3).map((keyword, idx) => (
            <Tag key={idx} style={{ fontSize: 11 }}>
              {keyword}
            </Tag>
          ))}
          {keywords?.length > 3 && (
            <Tooltip title={keywords.slice(3).join(', ')}>
              <Tag style={{ fontSize: 11 }}>+{keywords.length - 3} more</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Usage',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 100,
      sorter: true,
      render: (count) => (
        <Badge
          count={count}
          showZero
          style={{
            backgroundColor: count > 20 ? '#52c41a' : count > 5 ? '#1890ff' : '#d9d9d9',
          }}
        />
      ),
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
            title="Delete service?"
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
            placeholder="Search services by name or slug..."
            prefix={<Search size={16} />}
            allowClear
            style={{ maxWidth: 400 }}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1); // Reset to first page on search
            }}
          />
          <Space>
            <Text type="secondary">
              <TrendingUp size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {total.toLocaleString()} services
            </Text>
            <Button type="primary" icon={<Plus size={16} />} onClick={handleCreate}>
              Add Service
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={services}
          loading={loading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `${total} services`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </Space>

      {/* Create/Edit Modal */}
      <Modal
        title={editingService ? 'Edit Service' : 'Create Service'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={700}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter service name' }]}
          >
            <Input placeholder="e.g., Hot Stone Massage" />
          </Form.Item>

          <Form.Item
            label="Slug"
            name="slug"
            rules={[{ required: true, message: 'Please enter slug' }]}
            help="URL-friendly identifier (auto-generated from name if empty)"
          >
            <Input placeholder="e.g., hot-stone-massage" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Optional description for this service"
            />
          </Form.Item>

          <Form.Item
            label="Keywords"
            name="keywords"
            help="Keywords for search (press Enter to add)"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="e.g., massage, therapy, spa"
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item label="Active" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};



