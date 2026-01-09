import React from "react";
import { Form, Input, Space, Button, Typography, Divider, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import RightSidebar from "../../../RightSidebar";

const { Text } = Typography;

interface AddPhaseSidebarProps {
  open: boolean;
  onClose: () => void;
  onSave: (phase: { name: string; displayName: string; color: string }) => void;
  width?: number;
  rightOffset?: number;
}

// Ant Design preset colors - 10 distinct colors in 5x2 grid
const PRESET_COLORS = [
  '#1890ff', // Blue
  '#52c41a', // Green
  '#faad14', // Orange
  '#f5222d', // Red
  '#722ed1', // Purple
  '#eb2f96', // Magenta
  '#13c2c2', // Cyan
  '#fa8c16', // Volcano/Orange
  '#2f54eb', // Geek Blue
  '#a0d911', // Lime
];

const AddPhaseSidebar: React.FC<AddPhaseSidebarProps> = ({
  open,
  onClose,
  onSave,
  width = 420,
  rightOffset = 0,
}) => {
  const [form] = Form.useForm();

  // Reset form when opening
  React.useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave({
        name: values.name.toLowerCase().replace(/\s+/g, "-"),
        displayName: values.name,
        color: typeof values.color === "string" ? values.color : values.color?.toHexString() || "#1890ff",
      });
      form.resetFields();
      onClose();
    });
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <RightSidebar
      open={open}
      title="Add New Phase"
      onClose={handleClose}
      width={width}
      rightOffset={rightOffset}
      topOffset={64}
    >
      <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column" }}>
        <Text type="secondary" style={{ marginBottom: 16 }}>
          Phases are containers for stages. Each phase represents a major step in your workflow.
        </Text>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            color: "#1890ff",
          }}
          style={{ flex: 1 }}
        >
          <Form.Item
            label="Phase Name"
            name="name"
            rules={[{ required: true, message: "Please enter a phase name" }]}
          >
            <Input placeholder="e.g., Draft, Review, Onboarding, Fulfillment" autoFocus size="large" />
          </Form.Item>

          <Form.Item label="Color" name="color">
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const selectedColor = getFieldValue('color') || '#1890ff';
                return (
                  <Dropdown
                    trigger={['click']}
                    dropdownRender={() => (
                      <div style={{
                        background: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
                        padding: '8px 12px 12px 12px',
                      }}>
                        <div style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: '#999',
                          marginBottom: 8,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          Recommended Colors
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 40px)',
                          gap: 8,
                        }}>
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => form.setFieldValue('color', color)}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 4,
                                background: color,
                                border: selectedColor === color ? '3px solid #1890ff' : '1px solid rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: selectedColor === color ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
                              }}
                              onMouseEnter={(e) => {
                                if (selectedColor !== color) {
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  >
                    <Button
                      size="large"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: 40,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          background: selectedColor,
                          border: '1px solid rgba(0,0,0,0.1)',
                        }} />
                        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                          {selectedColor.toUpperCase()}
                        </span>
                      </div>
                      <DownOutlined style={{ fontSize: 12 }} />
                    </Button>
                  </Dropdown>
                );
              }}
            </Form.Item>
          </Form.Item>
        </Form>

        <Divider style={{ margin: "16px 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            You can add stages to this phase after creating it
          </Text>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" onClick={handleSave}>
              Add Phase
            </Button>
          </Space>
        </div>
      </div>
    </RightSidebar>
  );
};

export default AddPhaseSidebar;

