/**
 * TaxonomyImprovementPanel Component
 * 
 * Admin panel for reviewing and managing taxonomy improvements:
 * - Search misses (queries that didn't find results)
 * - User suggestions for new services/relationships
 * - Usage analytics to understand patterns
 */

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Input,
  message,
  Tabs,
  Typography,
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  AlertCircle,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface SearchMiss {
  id: string;
  search_query: string;
  miss_count: number;
  last_searched_at: string;
  created_at: string;
}

interface Suggestion {
  id: string;
  suggestion_type: string;
  entity_type: string;
  suggested_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  created_at: string;
}

interface UsageStats {
  service_name: string;
  usage_count: number;
  last_used: string;
}

export const TaxonomyImprovementPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('misses');
  const [searchMisses, setSearchMisses] = useState<SearchMiss[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSuggestionModalOpen, setNewSuggestionModalOpen] = useState(false);
  const [selectedMiss, setSelectedMiss] = useState<SearchMiss | null>(null);

  // Stats
  const [totalMisses, setTotalMisses] = useState(0);
  const [pendingSuggestions, setPendingSuggestions] = useState(0);
  const [recentUsage, setRecentUsage] = useState(0);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'misses') {
        await loadSearchMisses();
      } else if (activeTab === 'suggestions') {
        await loadSuggestions();
      } else if (activeTab === 'usage') {
        await loadUsageStats();
      }
      await loadStats();
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSearchMisses = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('taxonomy_search_misses')
      .select('*')
      .order('miss_count', { ascending: false })
      .limit(100);

    if (error) throw error;
    setSearchMisses(data || []);
  };

  const loadSuggestions = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('taxonomy_suggestions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setSuggestions(data || []);
  };

  const loadUsageStats = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('taxonomy_full_paths')
      .select('service_name, usage_count, last_used')
      .order('usage_count', { ascending: false })
      .limit(50);

    if (error) throw error;
    setUsageStats(data || []);
  };

  const loadStats = async () => {
    if (!supabase) return;
    // Total misses
    const { count: missCount } = await supabase
      .from('taxonomy_search_misses')
      .select('*', { count: 'exact', head: true });
    setTotalMisses(missCount || 0);

    // Pending suggestions
    const { count: suggestionCount } = await supabase
      .from('taxonomy_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingSuggestions(suggestionCount || 0);

    // Recent usage (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: usageCount } = await supabase
      .from('taxonomy_usage_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());
    setRecentUsage(usageCount || 0);
  };

  const createSuggestionFromMiss = (miss: SearchMiss) => {
    setSelectedMiss(miss);
    setNewSuggestionModalOpen(true);
  };

  // Unused function - kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreateSuggestion = async (values: any) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('taxonomy_suggestions').insert({
        suggestion_type: 'new_service',
        entity_type: 'service',
        suggested_name: selectedMiss?.search_query || values.name,
        reason: values.reason,
        status: 'pending',
      });

      if (error) throw error;

      message.success('Suggestion created!');
      setNewSuggestionModalOpen(false);
      setSelectedMiss(null);
      loadData();
    } catch (error) {
      console.error('Error creating suggestion:', error);
      message.error('Failed to create suggestion');
    }
  };

  const handleApproveSuggestion = async (suggestionId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('taxonomy_suggestions')
        .update({ status: 'approved' })
        .eq('id', suggestionId);

      if (error) throw error;

      message.success('Suggestion approved!');
      loadData();
    } catch (error) {
      console.error('Error approving suggestion:', error);
      message.error('Failed to approve suggestion');
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('taxonomy_suggestions')
        .update({ status: 'rejected' })
        .eq('id', suggestionId);

      if (error) throw error;

      message.success('Suggestion rejected');
      loadData();
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      message.error('Failed to reject suggestion');
    }
  };

  const missesColumns: ColumnsType<SearchMiss> = [
    {
      title: 'Search Query',
      dataIndex: 'search_query',
      key: 'search_query',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Miss Count',
      dataIndex: 'miss_count',
      key: 'miss_count',
      width: 120,
      sorter: (a, b) => a.miss_count - b.miss_count,
      render: (count) => (
        <Badge
          count={count}
          showZero
          style={{
            backgroundColor: count > 10 ? '#ff4d4f' : count > 5 ? '#faad14' : '#52c41a',
          }}
        />
      ),
    },
    {
      title: 'Last Searched',
      dataIndex: 'last_searched_at',
      key: 'last_searched_at',
      width: 200,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Button
          size="small"
          icon={<Lightbulb size={14} />}
          onClick={() => createSuggestionFromMiss(record)}
        >
          Create Suggestion
        </Button>
      ),
    },
  ];

  const suggestionsColumns: ColumnsType<Suggestion> = [
    {
      title: 'Type',
      dataIndex: 'suggestion_type',
      key: 'suggestion_type',
      width: 150,
      render: (type) => (
        <Tag color="blue">{type.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'suggested_name',
      key: 'suggested_name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colors = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red',
          implemented: 'blue',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 200,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) =>
        record.status === 'pending' ? (
          <Space>
            <Tooltip title="Approve">
              <Button
                size="small"
                type="primary"
                icon={<CheckCircle size={14} />}
                onClick={() => handleApproveSuggestion(record.id)}
              />
            </Tooltip>
            <Tooltip title="Reject">
              <Button
                size="small"
                danger
                icon={<XCircle size={14} />}
                onClick={() => handleRejectSuggestion(record.id)}
              />
            </Tooltip>
          </Space>
        ) : null,
    },
  ];

  const usageColumns: ColumnsType<UsageStats> = [
    {
      title: 'Service Name',
      dataIndex: 'service_name',
      key: 'service_name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Usage Count',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 150,
      sorter: (a, b) => a.usage_count - b.usage_count,
      render: (count) => (
        <Badge
          count={count}
          showZero
          style={{ backgroundColor: '#52c41a' }}
        />
      ),
    },
  ];

  return (
    <Card title={<Title level={4}>Taxonomy Improvement Center</Title>}>
      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Search Misses"
              value={totalMisses}
              prefix={<AlertCircle size={20} style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Pending Suggestions"
              value={pendingSuggestions}
              prefix={<Lightbulb size={20} style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Recent Usage (7d)"
              value={recentUsage}
              prefix={<TrendingUp size={20} style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'misses',
            label: (
              <Space>
                <AlertCircle size={16} />
                Search Misses
                {totalMisses > 0 && <Badge count={totalMisses} />}
              </Space>
            ),
            children: (
              <Table
                columns={missesColumns}
                dataSource={searchMisses}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 20 }}
              />
            ),
          },
          {
            key: 'suggestions',
            label: (
              <Space>
                <Lightbulb size={16} />
                Suggestions
                {pendingSuggestions > 0 && <Badge count={pendingSuggestions} />}
              </Space>
            ),
            children: (
              <Table
                columns={suggestionsColumns}
                dataSource={suggestions}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 20 }}
              />
            ),
          },
          {
            key: 'usage',
            label: (
              <Space>
                <TrendingUp size={16} />
                Usage Analytics
              </Space>
            ),
            children: (
              <Table
                columns={usageColumns}
                dataSource={usageStats}
                loading={loading}
                rowKey="service_name"
                pagination={{ pageSize: 20 }}
              />
            ),
          },
        ]}
      />

      {/* New Suggestion Modal */}
      <Modal
        title="Create Taxonomy Suggestion"
        open={newSuggestionModalOpen}
        onCancel={() => {
          setNewSuggestionModalOpen(false);
          setSelectedMiss(null);
        }}
        onOk={() => {
          // Handle form submit
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Search Query:</Text>
            <Input value={selectedMiss?.search_query} disabled />
          </div>
          <div>
            <Text strong>Suggested Name:</Text>
            <Input placeholder="Enter suggested service name" />
          </div>
          <div>
            <Text strong>Reason:</Text>
            <TextArea
              rows={4}
              placeholder="Why should this be added to the taxonomy?"
            />
          </div>
        </Space>
      </Modal>
    </Card>
  );
};



