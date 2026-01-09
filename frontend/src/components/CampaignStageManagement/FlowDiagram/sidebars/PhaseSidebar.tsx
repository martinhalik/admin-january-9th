import React, { useEffect, useState, useRef, useCallback } from "react";
import { Form, Input, Space, Button, Typography, Divider, message, Tag, Dropdown } from "antd";
import { Trash2, Check, Loader2, ChevronDown } from "lucide-react";
import RightSidebar from "../../../RightSidebar";

// Auto-save debounce delay in ms
const AUTO_SAVE_DELAY = 1500;

const { Text } = Typography;

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

interface Phase {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon: string;
  sortOrder: number;
  stages: any[];
}

interface PhaseSidebarProps {
  open: boolean;
  phase: Phase | null;
  onClose: () => void;
  onSave: (phase: Phase) => void;
  onDelete?: (phaseId: string) => void;
  rightOffset?: number;
  width?: number;
}

const PhaseSidebar: React.FC<PhaseSidebarProps> = ({
  open,
  phase,
  onClose,
  onSave,
  onDelete,
  rightOffset = 0,
  width = 420,
}) => {
  const [form] = Form.useForm();
  
  // Auto-save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialValuesRef = useRef<{ displayName: string; color: string } | null>(null);

  // Update form when phase changes
  useEffect(() => {
    if (phase) {
      const values = {
        displayName: phase.displayName,
        color: phase.color,
      };
      form.setFieldsValue(values);
      initialValuesRef.current = values;
    }
  }, [phase, form]);

  // Auto-save function
  const performAutoSave = useCallback(() => {
    if (!phase) return;
    
    const values = form.getFieldsValue();
    const hasChanges = 
      values.displayName !== initialValuesRef.current?.displayName ||
      values.color !== initialValuesRef.current?.color;

    if (!hasChanges) return;

    setIsSaving(true);
    try {
      onSave({
        ...phase,
        displayName: values.displayName,
        name: values.displayName.toLowerCase().replace(/\s+/g, "-"),
        color: values.color,
      });
      initialValuesRef.current = { displayName: values.displayName, color: values.color };
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [phase, onSave, form]);

  // Handle form value changes - trigger debounced auto-save
  const handleValuesChange = useCallback(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, AUTO_SAVE_DELAY);
  }, [performAutoSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleDelete = () => {
    if (phase && onDelete) {
      if (phase.stages.length > 0) {
        message.error("Cannot delete phase with stages. Remove all stages first.");
        return;
      }
      onDelete(phase.id);
      onClose();
    }
  };

  if (!phase) return null;

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
              background: phase.color,
            }}
          />
          <span>Phase Settings</span>
        </Space>
      }
      onClose={onClose}
      width={width}
      rightOffset={rightOffset}
      topOffset={64}
      zIndex={100} // Higher z-index to appear above React Flow canvas
    >
      <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Auto-save Status */}
        <div style={{ marginBottom: 16 }}>
          {isSaving ? (
            <Tag color="blue" icon={<Loader2 size={12} className="animate-spin" />}>
              Saving...
            </Tag>
          ) : lastSaved ? (
            <Tag color="green" icon={<Check size={12} />}>
              Saved {lastSaved.toLocaleTimeString()}
            </Tag>
          ) : null}
        </div>

        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
          style={{ flex: 1 }}
        >
          <Form.Item
            label="Phase Name"
            name="displayName"
            rules={[{ required: true, message: "Please enter a phase name" }]}
          >
            <Input placeholder="e.g., Draft, Review, Onboarding" size="large" />
          </Form.Item>

          <Form.Item label="Color" name="color">
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const selectedColor = getFieldValue('color') || phase.color;
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
                      <ChevronDown size={12} />
                    </Button>
                  </Dropdown>
                );
              }}
            </Form.Item>
          </Form.Item>

          {/* Phase Info */}
          <Divider />
          
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Stages in this phase: <strong>{phase.stages.length}</strong>
            </Text>
          </div>
          
          <Text type="secondary" style={{ fontSize: 12 }}>
            Use the connection handles on the phase frame to create transitions between phases.
          </Text>
        </Form>

        <Divider style={{ margin: "16px 0" }} />

        {/* Actions */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          {onDelete && (
            <Button
              danger
              icon={<Trash2 size={14} />}
              onClick={handleDelete}
              disabled={phase.stages.length > 0}
            >
              Delete Phase
            </Button>
          )}
          <Button onClick={onClose}>
            Close
          </Button>
        </Space>
      </div>
    </RightSidebar>
  );
};

export default PhaseSidebar;

