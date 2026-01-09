import React from "react";
import { Modal, Form, Input, Select, Space, ColorPicker } from "antd";
import * as LucideIcons from "lucide-react";
import { StageData, StageRow } from "../types";
import { STAGE_ICONS } from "../constants";

interface AddStageModalProps {
  open: boolean;
  row: StageRow;
  stages: StageData[]; // stages in the target row (for position selection)
  defaultPosition?: string; // stage id to insert after, or undefined
  onCancel: () => void;
  onSave: (stage: StageData, position: string) => void;
}

const AddStageModal: React.FC<AddStageModalProps> = ({
  open,
  row,
  stages,
  defaultPosition,
  onCancel,
  onSave,
}) => {
  const [form] = Form.useForm();

  // Set default position when modal opens
  React.useEffect(() => {
    if (open) {
      if (defaultPosition) {
        form.setFieldValue("position", defaultPosition);
      } else {
        form.setFieldValue("position", "end");
      }
    }
  }, [open, defaultPosition, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      const newStage: StageData = {
        id: `stage-${Date.now()}`,
        label: values.name,
        icon: values.icon || "Star",
        color:
          typeof values.color === "string"
            ? values.color
            : values.color?.toHexString() || (row === "draft" ? "#1890ff" : "#52c41a"),
        row,
      };
      onSave(newStage, values.position || "end");
      form.resetFields();
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Filter out "end" stage from position options
  const availablePositions = stages.filter((s) => !s.isEnd);

  return (
    <Modal
      title={`Add ${row === "draft" ? "Draft" : "Won"} Stage`}
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="Add Stage"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          color: row === "draft" ? "#1890ff" : "#52c41a",
          icon: "Star",
          position: "end",
        }}
      >
        <Form.Item
          label="Stage Name"
          name="name"
          rules={[{ required: true, message: "Please enter a stage name" }]}
        >
          <Input placeholder="e.g., Review, Vetting, Setup" />
        </Form.Item>

        <Form.Item label="Insert Position" name="position">
          <Select>
            <Select.Option value="start">At the beginning</Select.Option>
            {availablePositions.map((stage) => (
              <Select.Option key={stage.id} value={stage.id}>
                After "{stage.label}"
              </Select.Option>
            ))}
            <Select.Option value="end">At the end</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Icon" name="icon">
          <Select>
            {STAGE_ICONS.map((iconName) => {
              const IconComp = (LucideIcons as any)[iconName];
              return (
                <Select.Option key={iconName} value={iconName}>
                  <Space>
                    {IconComp && <IconComp size={14} />}
                    {iconName}
                  </Space>
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item label="Color" name="color">
          <ColorPicker />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddStageModal;

