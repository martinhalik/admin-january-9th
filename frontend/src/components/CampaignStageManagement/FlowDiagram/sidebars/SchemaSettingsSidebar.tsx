import React, { useState } from "react";
import {
  Typography,
  Space,
  Button,
  List,
  Tag,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Divider,
  Empty,
  Spin,
  Popconfirm,
} from "antd";
import {
  Plus,
  Copy,
  Trash2,
  Edit2,
  Globe,
  Building2,
  Check,
  Users,
} from "lucide-react";
import RightSidebar from "../../../RightSidebar";
import { WorkflowSchema } from "../../../../lib/workflowSchemas";

const { Text } = Typography;

interface SchemaSettingsSidebarProps {
  open: boolean;
  schemas: WorkflowSchema[];
  currentSchemaId: string | null;
  loading: boolean;
  saving: boolean;
  rightOffset?: number;
  onClose: () => void;
  onSelectSchema: (schemaId: string) => void;
  onCreateSchema: (name: string, settings?: Partial<WorkflowSchema>) => Promise<void>;
  onDuplicateSchema: (schemaId: string, newName: string) => Promise<void>;
  onUpdateSchema: (schemaId: string, settings: Partial<WorkflowSchema>) => Promise<void>;
  onDeleteSchema: (schemaId: string) => Promise<void>;
  onSetActive: (schemaId: string, isActive: boolean) => Promise<void>;
}

const SchemaSettingsSidebar: React.FC<SchemaSettingsSidebarProps> = ({
  open,
  schemas,
  currentSchemaId,
  loading,
  saving,
  rightOffset = 0,
  onClose,
  onSelectSchema,
  onCreateSchema,
  onDuplicateSchema,
  onUpdateSchema,
  onDeleteSchema,
  onSetActive,
}) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<WorkflowSchema | null>(null);
  const [form] = Form.useForm();

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await onCreateSchema(values.name, {
        description: values.description,
        account_type: values.account_type,
        deal_type: values.deal_type,
        team: values.team,
        division: values.division,
      });
      setCreateModalOpen(false);
      form.resetFields();
    } catch (error) {
      // Validation error
    }
  };

  const handleEdit = async () => {
    if (!selectedSchema) return;
    try {
      const values = await form.validateFields();
      await onUpdateSchema(selectedSchema.id, {
        name: values.name,
        description: values.description,
        account_type: values.account_type || null,
        deal_type: values.deal_type || null,
        team: values.team || null,
        division: values.division || null,
        is_shared_externally: values.is_shared_externally,
      });
      setEditModalOpen(false);
      setSelectedSchema(null);
      form.resetFields();
    } catch (error) {
      // Validation error
    }
  };

  const handleDuplicate = async () => {
    if (!selectedSchema) return;
    try {
      const values = await form.validateFields();
      await onDuplicateSchema(selectedSchema.id, values.name);
      setDuplicateModalOpen(false);
      setSelectedSchema(null);
      form.resetFields();
    } catch (error) {
      // Validation error
    }
  };

  const openEditModal = (schema: WorkflowSchema) => {
    setSelectedSchema(schema);
    form.setFieldsValue({
      name: schema.name,
      description: schema.description,
      account_type: schema.account_type,
      deal_type: schema.deal_type,
      team: schema.team,
      division: schema.division,
      is_shared_externally: schema.is_shared_externally,
    });
    setEditModalOpen(true);
  };

  const openDuplicateModal = (schema: WorkflowSchema) => {
    setSelectedSchema(schema);
    form.setFieldValue("name", `${schema.name} (Copy)`);
    setDuplicateModalOpen(true);
  };

  // Sort schemas: active first, then by name
  const sortedSchemas = [...schemas].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <RightSidebar
        open={open}
        onClose={onClose}
        title="Workflow Schemas"
        width={420}
        rightOffset={rightOffset}
        topOffset={64}
      >
        <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header with Create button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text type="secondary">
              {schemas.length} schema{schemas.length !== 1 ? "s" : ""}
            </Text>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => setCreateModalOpen(true)}
              loading={saving}
            >
              New Schema
            </Button>
          </div>

          <Divider style={{ margin: "0 0 16px 0" }} />

          {/* Schema List */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Spin />
              </div>
            ) : schemas.length === 0 ? (
              <Empty description="No schemas found" />
            ) : (
              <List
                dataSource={sortedSchemas}
                renderItem={(schema) => (
                  <List.Item
                    style={{
                      padding: "12px",
                      background: schema.id === currentSchemaId ? "#e6f7ff" : "transparent",
                      borderRadius: 8,
                      marginBottom: 8,
                      border: schema.id === currentSchemaId ? "1px solid #91d5ff" : "1px solid #f0f0f0",
                      cursor: "pointer",
                    }}
                    onClick={() => onSelectSchema(schema.id)}
                  >
                    <div style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        {/* Green dot for active */}
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: schema.is_active ? "#52c41a" : "#d9d9d9",
                            flexShrink: 0,
                          }}
                        />
                        
                        <Text strong style={{ flex: 1 }}>
                          {schema.name}
                        </Text>

                        {schema.is_default && (
                          <Tag color="blue" style={{ marginRight: 0 }}>Default</Tag>
                        )}

                        {schema.is_shared_externally && (
                          <Tooltip title="Shared externally">
                            <Globe size={14} style={{ color: "#52c41a" }} />
                          </Tooltip>
                        )}
                      </div>

                      {/* Assignment criteria */}
                      {(schema.account_type || schema.deal_type || schema.team || schema.division) && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                          {schema.account_type && (
                            <Tag icon={<Building2 size={10} />}>
                              {schema.account_type}
                            </Tag>
                          )}
                          {schema.deal_type && (
                            <Tag>
                              {schema.deal_type}
                            </Tag>
                          )}
                          {schema.team && (
                            <Tag icon={<Users size={10} />}>
                              {schema.team}
                            </Tag>
                          )}
                          {schema.division && (
                            <Tag>
                              {schema.division}
                            </Tag>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <Space size="small" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Edit">
                          <Button
                            size="small"
                            type="text"
                            icon={<Edit2 size={12} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(schema);
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="Duplicate">
                          <Button
                            size="small"
                            type="text"
                            icon={<Copy size={12} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDuplicateModal(schema);
                            }}
                          />
                        </Tooltip>
                        <Tooltip title={schema.is_active ? "Deactivate" : "Activate"}>
                          <Button
                            size="small"
                            type="text"
                            icon={
                              <Check
                                size={12}
                                style={{ color: schema.is_active ? "#52c41a" : "#d9d9d9" }}
                              />
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetActive(schema.id, !schema.is_active);
                            }}
                          />
                        </Tooltip>
                        {!schema.is_default && (
                          <Popconfirm
                            title="Delete schema?"
                            description="This will delete all stages and tasks in this schema."
                            onConfirm={(e) => {
                              e?.stopPropagation();
                              onDeleteSchema(schema.id);
                            }}
                            onCancel={(e) => e?.stopPropagation()}
                          >
                            <Tooltip title="Delete">
                              <Button
                                size="small"
                                type="text"
                                danger
                                icon={<Trash2 size={12} />}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </Tooltip>
                          </Popconfirm>
                        )}
                      </Space>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>
      </RightSidebar>

      {/* Create Schema Modal */}
      <Modal
        title="Create New Schema"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        onOk={handleCreate}
        okText="Create"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Schema Name"
            name="name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="e.g., Enterprise Accounts, US Sales Team" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="What is this schema for?" />
          </Form.Item>

          <Divider orientation="left" plain>
            <Text type="secondary" style={{ fontSize: 12 }}>Assignment Rules (Optional)</Text>
          </Divider>

          <Form.Item label="Account Type" name="account_type">
            <Select placeholder="Any account type" allowClear>
              <Select.Option value="enterprise">Enterprise</Select.Option>
              <Select.Option value="smb">SMB</Select.Option>
              <Select.Option value="local">Local</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Deal Type" name="deal_type">
            <Select placeholder="Any deal type" allowClear>
              <Select.Option value="pds">PDS</Select.Option>
              <Select.Option value="standard">Standard</Select.Option>
              <Select.Option value="custom">Custom</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Team" name="team">
            <Input placeholder="e.g., us-sales, enterprise-team" />
          </Form.Item>

          <Form.Item label="Division" name="division">
            <Select placeholder="Any division" allowClear>
              <Select.Option value="local">Local</Select.Option>
              <Select.Option value="national">National</Select.Option>
              <Select.Option value="goods">Goods</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Schema Modal */}
      <Modal
        title="Edit Schema"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedSchema(null);
          form.resetFields();
        }}
        onOk={handleEdit}
        okText="Save"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Schema Name"
            name="name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Divider orientation="left" plain>
            <Text type="secondary" style={{ fontSize: 12 }}>Assignment Rules</Text>
          </Divider>

          <Form.Item label="Account Type" name="account_type">
            <Select placeholder="Any" allowClear>
              <Select.Option value="enterprise">Enterprise</Select.Option>
              <Select.Option value="smb">SMB</Select.Option>
              <Select.Option value="local">Local</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Deal Type" name="deal_type">
            <Select placeholder="Any" allowClear>
              <Select.Option value="pds">PDS</Select.Option>
              <Select.Option value="standard">Standard</Select.Option>
              <Select.Option value="custom">Custom</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Team" name="team">
            <Input placeholder="e.g., us-sales" />
          </Form.Item>

          <Form.Item label="Division" name="division">
            <Select placeholder="Any" allowClear>
              <Select.Option value="local">Local</Select.Option>
              <Select.Option value="national">National</Select.Option>
              <Select.Option value="goods">Goods</Select.Option>
            </Select>
          </Form.Item>

          <Divider orientation="left" plain>
            <Text type="secondary" style={{ fontSize: 12 }}>Sharing</Text>
          </Divider>

          <Form.Item
            label="Share Externally"
            name="is_shared_externally"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Allow partners (e.g., Onlane) to view and collaborate on this schema.
          </Text>
        </Form>
      </Modal>

      {/* Duplicate Schema Modal */}
      <Modal
        title="Duplicate Schema"
        open={duplicateModalOpen}
        onCancel={() => {
          setDuplicateModalOpen(false);
          setSelectedSchema(null);
          form.resetFields();
        }}
        onOk={handleDuplicate}
        okText="Duplicate"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="New Schema Name"
            name="name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SchemaSettingsSidebar;

