import React from "react";
import { Form, Input, Select, Space, Button, Typography, Divider } from "antd";
import * as LucideIcons from "lucide-react";
import { StageData, StageRow } from "../types";
import { STAGE_ICONS } from "../constants";
import RightSidebar from "../../../RightSidebar";

const { Text } = Typography;

interface AddStageSidebarProps {
  open: boolean;
  row?: StageRow; // Legacy - optional now
  phaseId?: string; // Dynamic phase ID
  phaseName?: string; // Dynamic phase display name
  phaseColor?: string; // Dynamic phase color
  stages: StageData[]; // stages in the target phase (for position selection)
  defaultPosition?: string; // stage id to insert after, or undefined
  position?: "start" | "end" | "after" | "above" | "below";
  onClose: () => void;
  onSave: (stage: StageData & { phaseId?: string }, position: string) => void;
  width?: number;
  rightOffset?: number;
}

const AddStageSidebar: React.FC<AddStageSidebarProps> = ({
  open,
  row,
  phaseId,
  phaseName: propPhaseName,
  phaseColor: propPhaseColor,
  stages,
  defaultPosition,
  position: insertPosition,
  onClose,
  onSave,
  width = 420,
  rightOffset = 0,
}) => {
  const [form] = Form.useForm();

  // Set default position when sidebar opens
  React.useEffect(() => {
    if (open) {
      // Reset form when opening
      form.resetFields();
      
      // Determine the form position value based on insertPosition and defaultPosition
      let positionValue = "end";
      
      if (insertPosition === "start") {
        positionValue = "start";
      } else if (insertPosition === "after" && defaultPosition) {
        positionValue = defaultPosition;
      } else if (defaultPosition) {
        positionValue = defaultPosition;
      }
      
      form.setFieldValue("position", positionValue);
    }
  }, [open, defaultPosition, insertPosition, form]);

  // Use provided phase info or derive from legacy row
  const phaseColor = propPhaseColor || (row === "draft" ? "#1890ff" : "#52c41a");
  const phaseName = propPhaseName || (row === "draft" ? "Draft" : "Won");

  const handleSave = () => {
    form.validateFields().then((values) => {
      const newStage: StageData & { phaseId?: string } = {
        id: `stage-${Date.now()}`,
        label: values.name,
        icon: values.icon || "Star",
        color: phaseColor, // Always use phase color
        row: row || "draft", // Fallback for legacy
        phaseId, // Pass through for dynamic phases
      };
      onSave(newStage, values.position || "end");
      form.resetFields();
    });
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  // Filter out "end" stage from position options
  const availablePositions = stages.filter((s) => !s.isEnd);

  return (
    <RightSidebar
      open={open}
      title={
        <Space>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: phaseColor,
            }}
          />
          <span>Add {phaseName} Stage</span>
        </Space>
      }
      onClose={handleClose}
      width={width}
      rightOffset={rightOffset}
      topOffset={64}
    >
      <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column" }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            color: phaseColor,
            icon: "Star",
            position: "end",
          }}
          style={{ flex: 1 }}
        >
          <Form.Item
            label="Stage Name"
            name="name"
            rules={[{ required: true, message: "Please enter a stage name" }]}
          >
            <Input placeholder="e.g., Review, Vetting, Setup" autoFocus size="large" />
          </Form.Item>

          <Form.Item label="Insert Position" name="position">
            <Select size="large">
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
            <Select
              size="large"
              showSearch
              optionFilterProp="label"
              options={STAGE_ICONS.map((iconName) => ({
                value: iconName,
                label: iconName,
              }))}
              optionRender={(option) => {
                const IconComp = (LucideIcons as any)[option.value as string];
                return (
                  <Space>
                    {IconComp && <IconComp size={16} />}
                    <span>{option.label}</span>
                  </Space>
                );
              }}
              labelRender={(props) => {
                const IconComp = (LucideIcons as any)[props.value as string];
                return (
                  <Space>
                    {IconComp && <IconComp size={16} />}
                    <span>{props.label}</span>
                  </Space>
                );
              }}
            />
          </Form.Item>
        </Form>

        <Divider style={{ margin: "16px 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Stage will be added to {phaseName} Phase
          </Text>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" onClick={handleSave}>
              Add Stage
            </Button>
          </Space>
        </div>
      </div>
    </RightSidebar>
  );
};

export default AddStageSidebar;

