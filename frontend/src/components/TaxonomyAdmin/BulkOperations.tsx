/**
 * BulkOperations Component
 * 
 * Perform bulk operations on taxonomy:
 * - Merge duplicate services
 * - Bulk activate/deactivate
 * - Bulk delete
 * - Export taxonomy
 * - Refresh materialized view
 * - Find and fix orphaned entities
 */

import { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  message,
  Modal,
  Select,
  Alert,
  Divider,
  Spin,
  Result,
} from 'antd';
import {
  RefreshCw,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Merge,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const { Text, Title } = Typography;

interface BulkOperationsProps {
  onUpdate?: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({ onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [operationType, setOperationType] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const handleRefreshMaterializedView = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('refresh_taxonomy_paths');
      if (error) throw error;
      
      message.success('Materialized view refreshed successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Error refreshing view:', error);
      message.error('Failed to refresh materialized view');
    } finally {
      setLoading(false);
    }
  };

  const handleExportTaxonomy = async () => {
    setLoading(true);
    try {
      // Export full taxonomy to CSV
      const { data, error } = await supabase
        .from('taxonomy_full_paths')
        .select('*')
        .order('category_name')
        .order('subcategory_name')
        .order('service_name');

      if (error) throw error;

      // Convert to CSV
      const headers = ['Category', 'Subcategory', 'Service', 'Usage Count', 'Primary', 'Relevance'];
      const rows = data?.map(row => [
        row.category_name,
        row.subcategory_name,
        row.service_name,
        row.usage_count || 0,
        row.is_primary_subcategory ? 'Yes' : 'No',
        row.relevance_score || 1.0,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taxonomy-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      message.success('Taxonomy exported successfully');
    } catch (error) {
      console.error('Error exporting taxonomy:', error);
      message.error('Failed to export taxonomy');
    } finally {
      setLoading(false);
    }
  };

  const handleFindDuplicates = async () => {
    setLoading(true);
    setOperationType('duplicates');
    setModalOpen(true);
    
    try {
      // Find services with similar names
      const { data, error } = await supabase
        .from('taxonomy_services')
        .select('name, slug, id')
        .order('name');

      if (error) throw error;

      // Group by similar names (simple approach)
      const groups: Record<string, any[]> = {};
      data?.forEach(service => {
        const normalized = service.name.toLowerCase().trim();
        if (!groups[normalized]) {
          groups[normalized] = [];
        }
        groups[normalized].push(service);
      });

      // Find duplicates
      const duplicates = Object.entries(groups)
        .filter(([_, services]) => services.length > 1)
        .map(([name, services]) => ({
          name,
          count: services.length,
          services,
        }));

      if (duplicates.length === 0) {
        setResult('No duplicate services found! ✓');
      } else {
        setResult(
          `Found ${duplicates.length} potential duplicate groups:\n\n` +
          duplicates.slice(0, 10).map(d => 
            `- "${d.name}" (${d.count} entries)`
          ).join('\n') +
          (duplicates.length > 10 ? `\n\n...and ${duplicates.length - 10} more` : '')
        );
      }
    } catch (error) {
      console.error('Error finding duplicates:', error);
      setResult('Error finding duplicates');
    } finally {
      setLoading(false);
    }
  };

  const handleFindOrphans = async () => {
    setLoading(true);
    setOperationType('orphans');
    setModalOpen(true);
    
    try {
      // Find subcategories without categories
      const { data: orphanedSubcats, error: subcatError } = await supabase
        .from('taxonomy_subcategories')
        .select(`
          id,
          name,
          categories:taxonomy_category_subcategories(count)
        `);

      if (subcatError) throw subcatError;

      const orphanSubcats = orphanedSubcats?.filter(
        s => (s.categories[0]?.count || 0) === 0
      ) || [];

      // Find services without subcategories
      const { data: orphanedServices, error: serviceError } = await supabase
        .from('taxonomy_services')
        .select(`
          id,
          name,
          subcategories:taxonomy_subcategory_services(count)
        `);

      if (serviceError) throw serviceError;

      const orphanServices = orphanedServices?.filter(
        s => (s.subcategories[0]?.count || 0) === 0
      ) || [];

      if (orphanSubcats.length === 0 && orphanServices.length === 0) {
        setResult('No orphaned entities found! ✓');
      } else {
        setResult(
          `Found orphaned entities:\n\n` +
          (orphanSubcats.length > 0
            ? `Subcategories without categories: ${orphanSubcats.length}\n${orphanSubcats.slice(0, 5).map(s => `- ${s.name}`).join('\n')}\n\n`
            : '') +
          (orphanServices.length > 0
            ? `Services without subcategories: ${orphanServices.length}\n${orphanServices.slice(0, 5).map(s => `- ${s.name}`).join('\n')}`
            : '')
        );
      }
    } catch (error) {
      console.error('Error finding orphans:', error);
      setResult('Error finding orphaned entities');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupInactive = async () => {
    if (!confirm('This will delete all inactive categories, subcategories, and services. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      // Delete inactive entities
      const [catRes, subcatRes, serviceRes] = await Promise.all([
        supabase.from('taxonomy_categories').delete().eq('is_active', false),
        supabase.from('taxonomy_subcategories').delete().eq('is_active', false),
        supabase.from('taxonomy_services').delete().eq('is_active', false),
      ]);

      if (catRes.error) throw catRes.error;
      if (subcatRes.error) throw subcatRes.error;
      if (serviceRes.error) throw serviceRes.error;

      message.success('Inactive entities deleted');
      onUpdate?.();
      
      // Refresh materialized view
      await supabase.rpc('refresh_taxonomy_paths');
    } catch (error) {
      console.error('Error cleaning up:', error);
      message.error('Failed to cleanup inactive entities');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Title level={5}>
            <AlertTriangle size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Bulk Operations
          </Title>
          <Alert
            message="Caution"
            description="These operations affect multiple entities. Always backup your data before proceeding."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>

        {/* Maintenance Operations */}
        <Card title="Maintenance">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Refresh Materialized View</Text>
                <br />
                <Text type="secondary">
                  Update the cached taxonomy paths for better search performance
                </Text>
              </div>
              <Button
                icon={<RefreshCw size={16} />}
                onClick={handleRefreshMaterializedView}
                loading={loading}
              >
                Refresh
              </Button>
            </div>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Export Taxonomy</Text>
                <br />
                <Text type="secondary">
                  Download the complete taxonomy as CSV
                </Text>
              </div>
              <Button
                icon={<Download size={16} />}
                onClick={handleExportTaxonomy}
                loading={loading}
              >
                Export CSV
              </Button>
            </div>
          </Space>
        </Card>

        {/* Data Quality Operations */}
        <Card title="Data Quality">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Find Duplicate Services</Text>
                <br />
                <Text type="secondary">
                  Identify services with similar or identical names
                </Text>
              </div>
              <Button
                icon={<Merge size={16} />}
                onClick={handleFindDuplicates}
                loading={loading}
              >
                Find Duplicates
              </Button>
            </div>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Find Orphaned Entities</Text>
                <br />
                <Text type="secondary">
                  Find subcategories/services without parent relationships
                </Text>
              </div>
              <Button
                icon={<AlertTriangle size={16} />}
                onClick={handleFindOrphans}
                loading={loading}
              >
                Find Orphans
              </Button>
            </div>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Cleanup Inactive Entities</Text>
                <br />
                <Text type="secondary">
                  Delete all entities marked as inactive
                </Text>
              </div>
              <Button
                danger
                icon={<Trash2 size={16} />}
                onClick={handleCleanupInactive}
                loading={loading}
              >
                Cleanup
              </Button>
            </div>
          </Space>
        </Card>

        {/* Statistics */}
        <Card title="Database Statistics">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              Use these operations regularly to maintain taxonomy health and performance.
            </Text>
            <Alert
              message="Tip"
              description="Run 'Refresh Materialized View' after making bulk changes to taxonomy for optimal search performance."
              type="info"
              showIcon
            />
          </Space>
        </Card>
      </Space>

      {/* Results Modal */}
      <Modal
        title={operationType === 'duplicates' ? 'Duplicate Services' : 'Orphaned Entities'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setResult('');
        }}
        footer={[
          <Button key="close" onClick={() => setModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Analyzing taxonomy...</Text>
            </div>
          </div>
        ) : result.includes('No ') || result.includes('found! ✓') ? (
          <Result
            status="success"
            title="All Good!"
            subTitle={result}
            icon={<CheckCircle size={64} color="#52c41a" />}
          />
        ) : (
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {result}
          </pre>
        )}
      </Modal>
    </>
  );
};
















