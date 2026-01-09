import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Table,
  Input,
  Select,
  Space,
  Card,
  Tooltip,
  Empty,
  message,
  Divider,
  Collapse,
  theme,
  Form,
  Badge,
  Avatar,
  Timeline,
  Switch,
  App,
} from 'antd';
import {
  FileText,
  Plus,
  Search,
  Copy,
  Trash2,
  Loader2,
  Check,
  Settings,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import type { TableProps } from 'antd';
import {
  type RedemptionTemplate,
  type TemplateRule,
  getTemplates,
  saveTemplate,
  deleteTemplate,
  duplicateTemplate,
  availableVariables,
  extractVariables,
  ruleParameters,
  operatorLabels,
  mockUsers,
  getDealsByTemplateId,
  getDealCountByTemplateId,
  getDealsMatchingTemplateRules,
} from '../data/redemptionTemplates';
import Breadcrumbs from '../components/Breadcrumbs';
import SidebarLayout from '../components/SidebarLayout';
import RightSidebar from '../components/RightSidebar';
import { ListPageHeader } from '../components/PageHeaders';

const { Text, Paragraph, Title } = Typography;
const { useToken } = theme;

// Helper function to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

const RedemptionTemplates = () => {
  const { token } = useToken();
  const { modal } = App.useApp();
  const [templates, setTemplates] = useState<RedemptionTemplate[]>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'built-in' | 'custom'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RedemptionTemplate | null>(null);
  const [originalTemplate, setOriginalTemplate] = useState<RedemptionTemplate | null>(null);
  
  // Autosave state
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = () => {
    setTemplates(getTemplates());
  };

  // Track changes for autosave
  useEffect(() => {
    if (!editingTemplate || !originalTemplate) return;

    const hasChanges =
      editingTemplate.name !== originalTemplate.name ||
      editingTemplate.description !== originalTemplate.description ||
      editingTemplate.status !== originalTemplate.status ||
      editingTemplate.content !== originalTemplate.content;

    setHasUnsavedChanges(hasChanges);
  }, [editingTemplate, originalTemplate]);

  // Autosave effect
  useEffect(() => {
    if (!hasUnsavedChanges || !editingTemplate) return;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer for 2 seconds
    saveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [editingTemplate, hasUnsavedChanges]);

  const performAutoSave = async () => {
    if (!editingTemplate) return;

    setIsSaving(true);
    try {
      // Mock current user (in a real app, this would come from auth context)
      const currentUser = mockUsers[1]; // Samuel Garcia Rio

      // Extract variables from content
      const variables = extractVariables(editingTemplate.content);
      const now = new Date();
      
      // Add history entry for update
      const newHistoryEntry = {
        id: `h-${Date.now()}`,
        action: 'updated' as const,
        user: currentUser,
        timestamp: now,
        changes: 'Template updated',
      };

      const templateToSave = {
        ...editingTemplate,
        variables,
        updatedAt: now,
        history: [...(editingTemplate.history || []), newHistoryEntry],
      };

      saveTemplate(templateToSave);
      setOriginalTemplate(templateToSave);
      setEditingTemplate(templateToSave);
      setLastSaved(now);
      setHasUnsavedChanges(false);
      loadTemplates(); // Reload to update table

      message.success({
        content: 'Auto-saved',
        duration: 1,
      });
    } catch (error) {
      console.error('Autosave failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter and sort templates
  const filteredTemplates = templates
    .filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchText.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchText.toLowerCase());
      const matchesType = typeFilter === 'all' || template.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // Sort by last modified (newest first)

  // Handle actions
  const handleEdit = (template: RedemptionTemplate) => {
    // If we have unsaved changes and switching to a different template, confirm first
    if (hasUnsavedChanges && editingTemplate && editingTemplate.id !== template.id) {
      modal.confirm({
        title: 'Unsaved changes',
        content: 'You have unsaved changes. Do you want to switch templates without saving?',
        okText: 'Switch anyway',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: () => {
          switchToTemplate(template);
        },
      });
    } else {
      switchToTemplate(template);
    }
  };

  const switchToTemplate = (template: RedemptionTemplate) => {
    const templateCopy = { ...template };
    setEditingTemplate(templateCopy);
    setOriginalTemplate({ ...template });
    setHasUnsavedChanges(false);
    setLastSaved(null);
    setSidebarOpen(true);
  };

  const handleCreate = () => {
    // Mock current user (in a real app, this would come from auth context)
    const currentUser = mockUsers[1]; // John Doe

    const now = new Date();
    const newTemplate: RedemptionTemplate = {
      id: `custom-${Date.now()}`,
      name: 'New Custom Template',
      type: 'custom',
      content: '<p>Enter your redemption instructions here...</p>',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser,
      variables: [],
      history: [
        {
          id: `h-${Date.now()}`,
          action: 'created',
          user: currentUser,
          timestamp: now,
          changes: 'Template created',
        },
      ],
    };
    setEditingTemplate(newTemplate);
    setOriginalTemplate(newTemplate);
    setHasUnsavedChanges(false);
    setLastSaved(null);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    if (hasUnsavedChanges) {
      modal.confirm({
        title: 'Unsaved changes',
        content: 'You have unsaved changes. Do you want to close without saving?',
        okText: 'Close anyway',
        okType: 'danger',
        onOk: () => {
          setSidebarOpen(false);
          setEditingTemplate(null);
          setOriginalTemplate(null);
          setHasUnsavedChanges(false);
        },
      });
    } else {
      setSidebarOpen(false);
      setEditingTemplate(null);
      setOriginalTemplate(null);
    }
  };

  const handleDuplicate = (template: RedemptionTemplate) => {
    const newTemplate = duplicateTemplate(template.id);
    if (newTemplate) {
      message.success('Template duplicated successfully');
      loadTemplates();
    }
  };

  const handleDelete = (template: RedemptionTemplate) => {
    try {
      deleteTemplate(template.id);
      loadTemplates();
      message.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      message.error('Failed to delete template');
    }
  };

  // Table columns
  const columns: TableProps<RedemptionTemplate>['columns'] = [
    {
      title: <Text type="secondary">Template Name</Text>,
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      fixed: 'left',
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      onCell: (record: RedemptionTemplate) => ({
        style: {
          backgroundColor: editingTemplate?.id === record.id ? '#f0f0f0' : undefined,
        },
      }),
      render: (name: string) => (
        <Tooltip title={name}>
          <Text strong>{name}</Text>
        </Tooltip>
      ),
    },
    {
      title: <Text type="secondary">Priority</Text>,
      key: 'priority',
      width: 90,
      ellipsis: true,
      sorter: (a, b) => (a.priority || 0) - (b.priority || 0),
      render: (_: any, record: RedemptionTemplate) => (
        <Text type="secondary">{record.priority || 0}</Text>
      ),
    },
    {
      title: <Text type="secondary">Rules</Text>,
      key: 'rules',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (_: any, record: RedemptionTemplate) => {
        if (!record.rules || record.rules.length === 0) {
          return (
            <Text 
              style={{ 
                color: token.colorTextTertiary,
                fontStyle: 'italic',
                fontSize: token.fontSizeSM,
              }}
            >
              No rules
            </Text>
          );
        }
        
        const firstRuleDescription = getRuleDescription(record.rules[0]);
        
        if (record.rules.length === 1) {
          // Show single rule with ellipsis
          return (
            <Tooltip title={firstRuleDescription}>
              <div style={{ 
                maxWidth: '100%', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}>
                <Text style={{ fontSize: token.fontSizeSM }}>
                  {firstRuleDescription}
                </Text>
              </div>
            </Tooltip>
          );
        }
        
        // Multiple rules: show first + "x more"
        return (
          <Tooltip 
            title={
              <div>
                <div style={{ marginBottom: 4 }}>
                  <strong>Rules ({record.rules.length}):</strong>
                </div>
                {record.rules.map((rule, idx) => (
                  <div key={rule.id} style={{ fontSize: 12 }}>
                    {idx + 1}. {getRuleDescription(rule)}
                  </div>
                ))}
              </div>
            }
          >
            <div style={{ 
              maxWidth: '100%', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              <Text style={{ fontSize: token.fontSizeSM }}>
                {firstRuleDescription}
              </Text>
              <Text type="secondary" style={{ fontSize: token.fontSizeSM, marginLeft: 4 }}>
                +{record.rules.length - 1} more
              </Text>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: <Text type="secondary">Live Deals</Text>,
      key: 'liveDeals',
      width: 110,
      ellipsis: true,
      render: (_: any, record: RedemptionTemplate) => {
        const dealCount = getDealCountByTemplateId(record.id);
        if (dealCount === 0) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <div
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
            }}
          >
            <Badge status="success" />
            <Text strong>{formatNumber(dealCount)}</Text>
          </div>
        );
      },
    },
    {
      title: <Text type="secondary">Created By</Text>,
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 180,
      ellipsis: {
        showTitle: false,
      },
      render: (createdBy: any) => (
        <Tooltip title={createdBy?.name || 'Unknown'}>
          <Space size="small">
            <Avatar 
              size="small" 
              src={createdBy?.avatar}
            >
              {createdBy?.name?.charAt(0) || 'U'}
            </Avatar>
            <Text>{createdBy?.name || 'Unknown'}</Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: <Text type="secondary">Last Modified</Text>,
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 140,
      ellipsis: true,
      sorter: (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
      render: (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        let displayText: string;
        if (minutes < 1) {
          displayText = 'Just now';
        } else if (minutes < 60) {
          displayText = `${minutes}m ago`;
        } else if (hours < 24) {
          displayText = `${hours}h ago`;
        } else if (days < 7) {
          displayText = `${days}d ago`;
        } else {
          // US date format: Oct 10, 2024 or Oct 10 (if current year)
          const isCurrentYear = date.getFullYear() === now.getFullYear();
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = monthNames[date.getMonth()];
          const day = date.getDate();
          const year = date.getFullYear();
          displayText = isCurrentYear ? `${month} ${day}` : `${month} ${day}, ${year}`;
        }
        
        return <Text type="secondary">{displayText}</Text>;
      },
    },
    {
      title: <Text type="secondary">Status</Text>,
      dataIndex: 'status',
      key: 'status',
      width: 100,
      ellipsis: true,
      render: (status: string) => (
        <Badge
          status={status === 'active' ? 'success' : 'default'}
          text={status === 'active' ? 'Active' : 'Inactive'}
        />
      ),
    },
  ];

  // Get save status badge helper function
  const getSaveStatusBadge = () => {
    // Show "Saving..." when there are unsaved changes OR actively saving
    if (hasUnsavedChanges || isSaving) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            background: token.colorWarningBg,
            border: `1px solid ${token.colorWarningBorder}`,
            borderRadius: 16,
          }}
        >
          <Loader2 size={12} className="spin-icon" />
          <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
            Saving...
          </Text>
        </div>
      );
    }

    // Show "Saved" when successfully saved
    if (lastSaved) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            background: token.colorSuccessBg,
            border: `1px solid ${token.colorSuccessBorder}`,
            borderRadius: 16,
          }}
        >
          <Check size={12} style={{ color: token.colorSuccess }} />
          <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
            Saved
          </Text>
        </div>
      );
    }

    return null;
  };

  return (
    <SidebarLayout sidebarOpen={sidebarOpen} sidebarWidth={600}>
      <div>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: token.marginLG }}>
          <Breadcrumbs />
        </div>

      <ListPageHeader
        title="Redemption Templates"
        actions={[
          <Button
            key="create"
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleCreate}
          >
            Create Custom Template
          </Button>,
        ]}
        searchBar={
          <Input
            placeholder="Search templates..."
            prefix={<Search size={16} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ flex: 1, maxWidth: 300 }}
            allowClear
          />
        }
        filters={
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            options={[
              { label: 'All Types', value: 'all' },
              { label: 'Built-in', value: 'built-in' },
              { label: 'Custom', value: 'custom' },
            ]}
          />
        }
      />

      {/* Templates Table */}
      {filteredTemplates.length === 0 && templates.filter(t => t.type === 'custom').length === 0 ? (
        <Card>
          <Empty
            image={<FileText size={64} color={token.colorTextDisabled} />}
            description={
              <div>
                <Title level={4} style={{ color: token.colorTextSecondary }}>
                  No Custom Templates Yet
                </Title>
                <Text type="secondary">
                  Create custom redemption templates with auto-selection rules
                </Text>
              </div>
            }
          >
            <Button type="primary" icon={<Plus size={16} />} onClick={handleCreate}>
              Create First Template
            </Button>
          </Empty>
        </Card>
      ) : (
        <div
          style={{
            boxShadow: token.boxShadow,
            borderRadius: token.borderRadius,
            overflow: 'hidden',
          }}
        >
          <style>{`
            .ant-table-pagination.ant-pagination {
              margin: ${token.margin}px !important;
            }
          `}</style>
          <Table
            columns={columns}
            dataSource={filteredTemplates}
            rowKey="id"
            scroll={{ x: 'max-content', scrollToFirstRowOnChange: false }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: ['10', '25', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} templates`,
              responsive: true,
            }}
            onRow={(record) => ({
              style: { 
                cursor: 'pointer',
                backgroundColor: editingTemplate?.id === record.id ? token.colorBgTextHover : undefined,
              },
              onClick: (e) => {
                const target = e.target as HTMLElement;
                if (!target.closest('button')) {
                  // Always open editor when clicking row
                  handleEdit(record);
                }
              },
            })}
          />
        </div>
      )}

        {/* Editor Sidebar */}
        <style>{`
          .spin-icon {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        <RightSidebar
          open={sidebarOpen}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={16} />
                <Text strong style={{ fontSize: token.fontSizeLG }}>
                  {editingTemplate?.id.startsWith('custom-') && editingTemplate.createdAt.getTime() === editingTemplate.updatedAt.getTime()
                    ? 'Create Custom Template'
                    : 'Edit Template'}
                </Text>
              </div>
              {getSaveStatusBadge()}
            </div>
          }
          showBackButton={false}
          onClose={handleCloseSidebar}
          width={600}
          topOffset={64}
        >
          {editingTemplate && (
            <EditorSidebarContent
              template={editingTemplate}
              onTemplateChange={setEditingTemplate}
              onDuplicate={(template) => {
                handleDuplicate(template);
                setSidebarOpen(false);
                setEditingTemplate(null);
                setOriginalTemplate(null);
              }}
              onDelete={(template) => {
                // Close sidebar first to avoid UI issues
                setSidebarOpen(false);
                setEditingTemplate(null);
                setOriginalTemplate(null);
                setHasUnsavedChanges(false);
                // Then delete the template
                handleDelete(template);
              }}
            />
          )}
        </RightSidebar>
      </div>
    </SidebarLayout>
  );
};

// Editor Sidebar Content Component
interface EditorSidebarContentProps {
  template: RedemptionTemplate;
  onTemplateChange: (template: RedemptionTemplate) => void;
  onDuplicate: (template: RedemptionTemplate) => void;
  onDelete: (template: RedemptionTemplate) => void;
}

const EditorSidebarContent = ({
  template,
  onTemplateChange,
  onDuplicate,
  onDelete,
}: EditorSidebarContentProps) => {
  const { token } = useToken();
  const { modal } = App.useApp();
  const navigate = useNavigate();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: 'Enter redemption instructions...',
      }),
    ],
    content: template?.content || '',
    onUpdate: ({ editor }) => {
      if (template) {
        onTemplateChange({
          ...template,
          content: editor.getHTML(),
        });
      }
    },
  });

  // Update editor content when template changes
  useEffect(() => {
    if (editor && template?.content && template.content !== editor.getHTML()) {
      editor.commands.setContent(template.content);
    }
  }, [template?.id, editor]);

  const insertVariable = (variable: string) => {
    if (editor) {
      editor.chain().focus().insertContent(variable).run();
    }
  };

  return (
    <>
      <div style={{ padding: `${token.paddingLG}px ${token.paddingLG}px ${token.paddingLG}px ${token.paddingLG}px` }}>
        {/* Basic Info */}
        <Card title="Basic Information" style={{ marginBottom: token.marginMD }}>
          <Form layout="vertical">
            <Form.Item label="Template Name" required>
              <Input
                value={template.name}
                onChange={(e) => onTemplateChange({ ...template, name: e.target.value })}
                placeholder="e.g., Walk-in Only"
              />
            </Form.Item>

            <Form.Item label="Status">
              <Switch
                checked={template.status === 'active'}
                onChange={(checked) => onTemplateChange({ ...template, status: checked ? 'active' : 'inactive' })}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
            </Form.Item>
          </Form>
        </Card>

        {/* Auto-Selection Rules */}
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong>Auto-Selection Rules</Text>
              <Tooltip title="Define conditions when this template should be automatically suggested">
                <Badge count="?" style={{ backgroundColor: token.colorPrimary }} />
              </Tooltip>
            </div>
          }
          style={{ marginBottom: token.marginMD }}
        >
          <div style={{ marginBottom: token.marginMD }}>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              Set rules to automatically suggest this template based on deal parameters (location count, booking system, etc.)
            </Text>
          </div>

          {/* Priority */}
          <Form layout="vertical">
            <Form.Item 
              label="Priority" 
              tooltip="When multiple templates match, higher priority wins (0-100)"
            >
              <Input
                type="number"
                value={template.priority || 0}
                onChange={(e) => onTemplateChange({ 
                  ...template, 
                  priority: parseInt(e.target.value) || 0 
                })}
                placeholder="0-100"
                min={0}
                max={100}
                style={{ width: 120 }}
              />
            </Form.Item>
          </Form>

          {/* Rules List */}
          <div style={{ marginBottom: token.marginSM }}>
            <Text strong style={{ fontSize: token.fontSizeSM }}>Conditions (all must match):</Text>
          </div>

          {template.rules && template.rules.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {template.rules.map((rule, index) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onUpdate={(updatedRule) => {
                    const newRules = [...(template.rules || [])];
                    newRules[index] = updatedRule;
                    onTemplateChange({ ...template, rules: newRules });
                  }}
                  onDelete={() => {
                    const newRules = (template.rules || []).filter((_, i) => i !== index);
                    onTemplateChange({ ...template, rules: newRules });
                  }}
                />
              ))}
            </Space>
          ) : (
            <Empty 
              description="No rules defined - template won't auto-suggest"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ margin: '8px 0' }}
            />
          )}

          <Button
            type="dashed"
            icon={<Plus size={14} />}
            onClick={() => {
              const newRule: TemplateRule = {
                id: `rule-${Date.now()}`,
                parameter: 'location_count',
                operator: 'equals',
                value: 1,
              };
              onTemplateChange({
                ...template,
                rules: [...(template.rules || []), newRule],
              });
            }}
            style={{ marginTop: token.marginSM, width: '100%' }}
          >
            Add Rule
          </Button>

          {/* Matching Deals */}
          {template.rules && template.rules.length > 0 && (() => {
            const matchingDeals = getDealsMatchingTemplateRules(template);
            
            if (matchingDeals.length === 0) {
              return (
                <div style={{ marginTop: token.marginMD, padding: token.paddingSM, background: token.colorBgLayout, borderRadius: token.borderRadius }}>
                  <Text type="secondary" style={{ fontSize: token.fontSizeSM, fontStyle: 'italic' }}>
                    No deals currently match these rules
                  </Text>
                </div>
              );
            }
            
            const displayDeals = matchingDeals.slice(0, 3);
            
            return (
              <div style={{ marginTop: token.marginMD }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  marginBottom: token.marginSM,
                }}>
                  <Text strong style={{ fontSize: token.fontSizeSM }}>
                    Deals matching these rules:
                  </Text>
                  <Badge 
                    count={formatNumber(matchingDeals.length)} 
                    style={{ backgroundColor: token.colorSuccess }}
                  />
                </div>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {displayDeals.map((deal: any) => (
                    <div 
                      key={deal.id}
                      style={{ 
                        padding: token.paddingXS,
                        background: token.colorBgLayout,
                        borderRadius: token.borderRadiusSM,
                        cursor: 'pointer',
                        fontSize: token.fontSizeSM,
                      }}
                      onClick={() => navigate(`/deals/${deal.id}`)}
                    >
                      <Text strong style={{ fontSize: token.fontSizeSM }}>{deal.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                        {deal.location}
                      </Text>
                    </div>
                  ))}
                  
                  {matchingDeals.length > 3 && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        // In a real app, this would filter by the template rules
                        message.info(`Showing ${matchingDeals.length} matching deals`);
                      }}
                      style={{ padding: 0, height: 'auto', fontSize: token.fontSizeSM }}
                    >
                      +{matchingDeals.length - 3} more deals
                    </Button>
                  )}
                </Space>
              </div>
            );
          })()}
        </Card>

        {/* Live Deals Using This Template */}
        {(() => {
          const deals = getDealsByTemplateId(template.id);
          if (deals.length === 0) return null;
          
          const displayDeals = deals.slice(0, 3);
          
          return (
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong>Live Deals Using This Template</Text>
                  <Badge count={formatNumber(deals.length)} style={{ backgroundColor: token.colorPrimary }} />
                </div>
              }
              style={{ marginBottom: token.marginMD }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {displayDeals.map((deal: any) => (
                  <div 
                    key={deal.id} 
                    style={{ 
                      padding: token.paddingSM,
                      background: token.colorBgLayout,
                      borderRadius: token.borderRadius,
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    <Text strong style={{ fontSize: token.fontSize }}>{deal.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      {deal.location}
                    </Text>
                  </div>
                ))}
                
                {deals.length > 3 && (
                  <Button
                    type="link"
                    onClick={() => navigate(`/deals?template=${template.id}`)}
                    style={{ padding: 0, marginTop: token.marginXS }}
                  >
                    View all {formatNumber(deals.length)} deals →
                  </Button>
                )}
              </Space>
            </Card>
          );
        })()}

        {/* Template Content */}
        <Card title="Template Content" style={{ marginBottom: token.marginMD }}>
          {/* Formatting Toolbar */}
          {editor && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                padding: 8,
                background: token.colorBgLayout,
                border: `1px solid ${token.colorBorder}`,
                borderBottom: 'none',
                borderRadius: '8px 8px 0 0',
              }}
            >
              <Tooltip title="Bold">
                <Button
                  size="small"
                  type={editor.isActive('bold') ? 'primary' : 'text'}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <strong>B</strong>
                </Button>
              </Tooltip>
              <Tooltip title="Italic">
                <Button
                  size="small"
                  type={editor.isActive('italic') ? 'primary' : 'text'}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <em>I</em>
                </Button>
              </Tooltip>
              <Tooltip title="Underline">
                <Button
                  size="small"
                  type={editor.isActive('underline') ? 'primary' : 'text'}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                  <u>U</u>
                </Button>
              </Tooltip>
              <Divider type="vertical" />
              <Tooltip title="Bullet List">
                <Button
                  size="small"
                  type={editor.isActive('bulletList') ? 'primary' : 'text'}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                  • List
                </Button>
              </Tooltip>
              <Tooltip title="Numbered List">
                <Button
                  size="small"
                  type={editor.isActive('orderedList') ? 'primary' : 'text'}
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                  1. List
                </Button>
              </Tooltip>
            </div>
          )}

          {/* Editor */}
          <div
            style={{
              border: `1px solid ${token.colorBorder}`,
              borderRadius: editor ? '0 0 8px 8px' : 8,
              minHeight: 300,
              padding: token.paddingMD,
            }}
          >
            <style>{`
              .ProseMirror {
                outline: none;
                min-height: 270px;
              }
              .ProseMirror p {
                margin: 0.5em 0;
              }
              .ProseMirror ul, .ProseMirror ol {
                padding-left: 1.5em;
                margin: 0.5em 0;
              }
              .ProseMirror strong {
                font-weight: 600;
              }
              .ProseMirror em {
                font-style: italic;
              }
              .ProseMirror u {
                text-decoration: underline;
              }
              .ProseMirror a {
                color: ${token.colorPrimary};
                text-decoration: underline;
              }
            `}</style>
            <EditorContent editor={editor} />
          </div>
        </Card>

        {/* Variables */}
        <Collapse
          items={[
            {
              key: 'variables',
              label: 'Available Variables',
              children: (
                <div>
                  <Paragraph type="secondary" style={{ fontSize: token.fontSizeSM }}>
                    Click on a variable to insert it at cursor position:
                  </Paragraph>
                  <Space wrap>
                    {availableVariables.map((variable) => (
                      <Tooltip key={variable.key} title={variable.description}>
                        <Button
                          onClick={() => insertVariable(variable.key)}
                        >
                          {variable.key} - {variable.label}
                        </Button>
                      </Tooltip>
                    ))}
                  </Space>
                </div>
              ),
            },
          ]}
          style={{ marginBottom: token.marginMD }}
        />

        {/* History Timeline */}
        {template.history && template.history.length > 0 && (
          <Card title="History" style={{ marginBottom: token.marginMD }}>
            <Timeline
              items={[...template.history]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((entry) => {
                  const now = new Date();
                  const diff = now.getTime() - entry.timestamp.getTime();
                  const minutes = Math.floor(diff / (1000 * 60));
                  const hours = Math.floor(diff / (1000 * 60 * 60));
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  
                  let timeText: string;
                  if (minutes < 1) {
                    timeText = 'Just now';
                  } else if (minutes < 60) {
                    timeText = `${minutes}m ago`;
                  } else if (hours < 24) {
                    timeText = `${hours}h ago`;
                  } else if (days < 7) {
                    timeText = `${days}d ago`;
                  } else {
                    const isCurrentYear = entry.timestamp.getFullYear() === now.getFullYear();
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const month = monthNames[entry.timestamp.getMonth()];
                    const day = entry.timestamp.getDate();
                    const year = entry.timestamp.getFullYear();
                    timeText = isCurrentYear ? `${month} ${day}` : `${month} ${day}, ${year}`;
                  }

                  const actionLabels = {
                    created: 'Created',
                    updated: 'Updated',
                    activated: 'Activated',
                    deactivated: 'Deactivated',
                  };

                  return {
                    color: entry.action === 'created' ? 'green' : entry.action === 'deactivated' ? 'red' : 'blue',
                    dot: (
                      <Avatar 
                        size="small" 
                        src={entry.user.avatar}
                      >
                        {entry.user.name.charAt(0)}
                      </Avatar>
                    ),
                    children: (
                      <div>
                        <div>
                          <Text strong>{entry.user.name}</Text>
                          {' '}
                          <Text type="secondary">{actionLabels[entry.action]}</Text>
                          {' • '}
                          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                            {timeText}
                          </Text>
                        </div>
                        {entry.changes && (
                          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                            {entry.changes}
                          </Text>
                        )}
                      </div>
                    ),
                  };
                })}
            />
          </Card>
        )}

        {/* Duplicate and Delete Buttons */}
        <div style={{ marginTop: token.marginLG }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              block
              icon={<Copy size={16} />}
              onClick={() => onDuplicate(template)}
            >
              Duplicate Template
            </Button>
            <Button
              danger
              block
              icon={<Trash2 size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                modal.confirm({
                  title: 'Delete Template',
                  content: `Are you sure you want to delete "${template.name}"?`,
                  okText: 'Delete',
                  okType: 'danger',
                  cancelText: 'Cancel',
                  onOk: () => {
                    onDelete(template);
                  },
                });
              }}
            >
              Delete Template
            </Button>
          </Space>
        </div>
      </div>
    </>
  );
};

// Rule Row Component
interface RuleRowProps {
  rule: TemplateRule;
  onUpdate: (rule: TemplateRule) => void;
  onDelete: () => void;
}

const RuleRow = ({ rule, onUpdate, onDelete }: RuleRowProps) => {
  const { token } = useToken();
  
  const parameterConfig = ruleParameters.find(p => p.value === rule.parameter);
  const availableOperators = parameterConfig?.operators || [];
  
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: token.paddingXS,
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
      }}
    >
      {/* Parameter */}
      <Select
        value={rule.parameter}
        onChange={(value) => {
          const newParamConfig = ruleParameters.find(p => p.value === value);
          onUpdate({
            ...rule,
            parameter: value as any,
            operator: newParamConfig?.operators[0] as any || 'equals',
            value: newParamConfig?.type === 'number' ? 1 : '',
          });
        }}
        style={{ width: 160 }}
        options={ruleParameters.map(p => ({ value: p.value, label: p.label }))}
      />

      {/* Operator */}
      <Select
        value={rule.operator}
        onChange={(value) => onUpdate({ ...rule, operator: value as any })}
        style={{ width: 140 }}
        options={availableOperators.map(op => ({ 
          value: op, 
          label: operatorLabels[op] || op 
        }))}
      />

      {/* Value(s) */}
      {rule.operator === 'between' ? (
        <>
          <Input
            type="number"
            value={rule.value}
            onChange={(e) => onUpdate({ ...rule, value: parseInt(e.target.value) || 0 })}
            style={{ width: 100 }}
            placeholder="Min"
          />
          <Text type="secondary">and</Text>
          <Input
            type="number"
            value={rule.secondValue}
            onChange={(e) => onUpdate({ ...rule, secondValue: parseInt(e.target.value) || 0 })}
            style={{ width: 100 }}
            placeholder="Max"
          />
        </>
      ) : parameterConfig?.type === 'number' ? (
        <Input
          type="number"
          value={rule.value}
          onChange={(e) => onUpdate({ ...rule, value: parseInt(e.target.value) || 0 })}
          style={{ width: 120 }}
        />
      ) : rule.operator === 'in' || rule.operator === 'not_in' ? (
        <Select
          mode="multiple"
          value={Array.isArray(rule.value) ? rule.value : (rule.value !== undefined && rule.value !== null ? [String(rule.value)] : [])}
          onChange={(value) => onUpdate({ ...rule, value })}
          style={{ flex: 1, minWidth: 200 }}
          options={parameterConfig?.options ? [...parameterConfig.options] : []}
        />
      ) : (
        <Select
          value={rule.value}
          onChange={(value) => onUpdate({ ...rule, value })}
          style={{ flex: 1, minWidth: 200 }}
          options={parameterConfig?.options ? [...parameterConfig.options] : []}
        />
      )}

      {/* Delete */}
      <Button
        type="text"
        danger
        icon={<Trash2 size={14} />}
        onClick={onDelete}
        size="small"
      />
    </div>
  );
};

// Helper to get human-readable rule description
const getRuleDescription = (rule: TemplateRule): string => {
  const paramConfig = ruleParameters.find(p => p.value === rule.parameter);
  const paramLabel = paramConfig?.label || rule.parameter;
  const operatorLabel = operatorLabels[rule.operator] || rule.operator;
  
  if (rule.operator === 'between') {
    return `${paramLabel} ${operatorLabel.toLowerCase()} ${rule.value} and ${rule.secondValue}`;
  }
  
  if (rule.operator === 'in' || rule.operator === 'not_in') {
    const values = Array.isArray(rule.value) ? rule.value : [rule.value];
    const valueLabels = values.map(v => {
      const option = (paramConfig as any)?.options?.find((opt: any) => opt.value === v);
      return option?.label || v;
    });
    return `${paramLabel} ${operatorLabel.toLowerCase()} [${valueLabels.join(', ')}]`;
  }
  
  let valueLabel: any = rule.value;
  if ((paramConfig as any)?.options) {
    const option = (paramConfig as any).options.find((opt: any) => opt.value === rule.value);
    valueLabel = option?.label || rule.value;
  }
  
  return `${paramLabel} ${operatorLabel.toLowerCase()} ${valueLabel}`;
};

export default RedemptionTemplates;

