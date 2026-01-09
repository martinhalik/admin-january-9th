import React, { useEffect } from "react";
import { Form, Radio, Select, Divider, Space, Button, Card, Typography, message } from "antd";
import { Zap, User, CheckCircle, Trash2 } from "lucide-react";
import RightSidebar from "../../../RightSidebar";
import {
  EdgeConfig,
  TransitionType,
  TransitionTrigger,
  VALID_TRIGGERS,
  getDefaultTrigger,
} from "../types";

const { Text } = Typography;

interface ConnectionSidebarProps {
  open: boolean;
  edge: EdgeConfig | null;
  rightOffset?: number;
  onClose: () => void;
  onSave: (edge: EdgeConfig) => void;
  onDelete: (edgeId: string) => void;
}

const ConnectionSidebar: React.FC<ConnectionSidebarProps> = ({
  open,
  edge,
  rightOffset = 0,
  onClose,
  onSave,
  onDelete,
}) => {
  const [form] = Form.useForm();

  // Update form when edge changes
  useEffect(() => {
    if (edge) {
      form.setFieldsValue({
        transitionType: edge.transitionType,
        transitionTrigger: edge.transitionTrigger,
        approvalRoles: edge.approvalRoles || [],
        aiBotApprovers: edge.aiBotApprovers || [],
      });
    }
  }, [edge, form]);

  // When transition type changes, validate and update trigger
  const handleTypeChange = (type: TransitionType) => {
    const currentTrigger = form.getFieldValue("transitionTrigger") as TransitionTrigger;

    // If current trigger is not valid for new type, set to default
    if (!VALID_TRIGGERS[type].includes(currentTrigger)) {
      form.setFieldValue("transitionTrigger", getDefaultTrigger(type));
    }
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (!edge) return;

      // Validate trigger for transition type
      if (!VALID_TRIGGERS[values.transitionType].includes(values.transitionTrigger)) {
        message.error(
          `"${values.transitionTrigger}" is not valid for "${values.transitionType}" transitions`
        );
        return;
      }

      onSave({
        ...edge,
        transitionType: values.transitionType,
        transitionTrigger: values.transitionTrigger,
        approvalRoles: values.approvalRoles,
        aiBotApprovers: values.aiBotApprovers,
      });
    });
  };

  const handleDelete = () => {
    if (edge) {
      onDelete(edge.id);
    }
  };

  const currentType = Form.useWatch("transitionType", form) || edge?.transitionType || "manual";
  const validTriggers = VALID_TRIGGERS[currentType as TransitionType];

  return (
    <RightSidebar
      open={open}
      title="Connection Settings"
      onClose={onClose}
      rightOffset={rightOffset}
      width={420}
      topOffset={64}
      zIndex={100} // Higher z-index to appear above React Flow canvas
    >
      <div style={{ padding: 24 }}>
        {edge && (
          <Form form={form} layout="vertical">
            <Card size="small" style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {edge.source} → {edge.target}
              </Text>
            </Card>

            <Form.Item label="Transition Type" name="transitionType">
              <Radio.Group buttonStyle="solid" onChange={(e) => handleTypeChange(e.target.value)}>
                <Radio.Button value="auto">
                  <Zap size={12} style={{ marginRight: 4 }} />
                  Auto
                </Radio.Button>
                <Radio.Button value="manual">
                  <User size={12} style={{ marginRight: 4 }} />
                  Manual
                </Radio.Button>
                <Radio.Button value="approval">
                  <CheckCircle size={12} style={{ marginRight: 4 }} />
                  Approval
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="Trigger"
              name="transitionTrigger"
              help={
                currentType === "auto" ? (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Auto transitions require task completion
                  </Text>
                ) : currentType === "approval" ? (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Approval requires task completion before review
                  </Text>
                ) : null
              }
            >
              <Select>
                <Select.Option value="all-tasks" disabled={!validTriggers.includes("all-tasks")}>
                  All tasks complete
                </Select.Option>
                <Select.Option
                  value="required-tasks"
                  disabled={!validTriggers.includes("required-tasks")}
                >
                  Required tasks complete
                </Select.Option>
                <Select.Option value="any-time" disabled={!validTriggers.includes("any-time")}>
                  Anytime {currentType !== "manual" && "(not available)"}
                </Select.Option>
              </Select>
            </Form.Item>

            <Divider />

            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Button danger icon={<Trash2 size={14} />} onClick={handleDelete}>
                Delete
              </Button>
              <Space>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="primary" onClick={handleSave}>
                  Save
                </Button>
              </Space>
            </Space>
          </Form>
        )}
      </div>
    </RightSidebar>
  );
};

export default ConnectionSidebar;

