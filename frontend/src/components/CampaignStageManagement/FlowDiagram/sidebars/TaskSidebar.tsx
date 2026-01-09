import React, { useEffect, useRef, useState, useCallback } from "react";
import { Form, Input, Select, Space, Button, Typography, Divider, Switch, InputNumber, Tag, Tooltip, Segmented, Alert, Radio, Card } from "antd";
import { Trash2, ArrowLeft, Clock, Shield, CheckCircle, User, Check, Loader2, Bot, Zap, AlertTriangle, Hand, Pencil } from "lucide-react";
import * as LucideIcons from "lucide-react";
import RightSidebar from "../../../RightSidebar";
import { Task } from "../types";
import { AVAILABLE_ROLES, ROLE_SHORTCUTS, AI_BOTS } from "../constants";

const { Text, Title } = Typography;

// Auto-save debounce delay in ms
const AUTO_SAVE_DELAY = 1500;

interface TaskSidebarProps {
  open: boolean;
  task: Task | null;
  stageColor: string;
  stageName: string;
  isCreateMode?: boolean; // True when adding a new task
  onClose: () => void;
  onSave: (task: Task) => void;
  onCreate?: (task: Task) => void; // For creating new tasks
  onDelete: (taskId: string) => void;
  onOpenStage?: () => void; // Optional: reopen stage sidebar
}

const TaskSidebar: React.FC<TaskSidebarProps> = ({
  open,
  task,
  stageColor,
  stageName,
  isCreateMode = false,
  onClose,
  onSave,
  onCreate,
  onDelete,
  onOpenStage,
}) => {
  const [form] = Form.useForm();
  
  // Assignment type state
  const [assignmentType, setAssignmentType] = useState<"human" | "bot">("human");
  
  // Inline edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const titleInputRef = useRef<any>(null);
  
  // Auto-save state (only for edit mode)
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTaskIdRef = useRef<string | null>(null);

  // Update form when task changes or entering create mode
  useEffect(() => {
    if (isCreateMode) {
      // Reset form for new task with defaults
      form.resetFields();
      form.setFieldsValue({ isRequired: true });
      setAssignmentType("human");
      setLastSaved(null);
      currentTaskIdRef.current = null;
      setIsEditingTitle(false);
      setEditedTitle("");
    } else if (task) {
      // Determine assignment type
      const hasBot = !!task.assignedBot;
      setAssignmentType(hasBot ? "bot" : "human");
      
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        assignedBot: task.assignedBot,
        isRequired: task.isRequired,
        estimatedTime: task.estimatedTime,
        requiresApproval: task.requiresApproval,
        approvalFrom: task.approvalFrom,
        aiBotApprovers: task.aiBotApprovers,
        // Bot configuration
        botApprovalMode: task.botApprovalMode || "normal",
        botEscalationRole: task.botEscalationRole,
        botReviewRole: task.botReviewRole,
      });
      // Reset save state and editing state when switching tasks
      if (currentTaskIdRef.current !== task.id) {
        setLastSaved(null);
        currentTaskIdRef.current = task.id;
        setIsEditingTitle(false);
        setEditedTitle(task.title);
      }
    } else {
      form.resetFields();
      setAssignmentType("human");
      currentTaskIdRef.current = null;
      setIsEditingTitle(false);
      setEditedTitle("");
    }
  }, [task, form, isCreateMode]);

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Auto-save function (only for edit mode)
  const performAutoSave = useCallback(async () => {
    if (!task || isCreateMode) return;
    
    setIsSaving(true);
    try {
      const values = form.getFieldsValue();
      onSave({
        ...task,
        title: values.title,
        description: values.description,
        // Human assignment
        assignedTo: assignmentType === "human" ? values.assignedTo : undefined,
        requiresApproval: assignmentType === "human" ? values.requiresApproval : undefined,
        approvalFrom: assignmentType === "human" ? values.approvalFrom : undefined,
        aiBotApprovers: assignmentType === "human" ? values.aiBotApprovers : undefined,
        // Bot assignment
        assignedBot: assignmentType === "bot" ? values.assignedBot : undefined,
        botApprovalMode: assignmentType === "bot" ? values.botApprovalMode : undefined,
        botEscalationRole: assignmentType === "bot" ? values.botEscalationRole : undefined,
        botReviewRole: assignmentType === "bot" ? values.botReviewRole : undefined,
        // Common fields
        isRequired: values.isRequired ?? true,
        estimatedTime: values.estimatedTime,
      });
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [task, form, onSave, isCreateMode, assignmentType]);

  // Handle form value changes - trigger debounced auto-save (only in edit mode)
  const handleValuesChange = useCallback(() => {
    if (isCreateMode) return; // Don't auto-save in create mode
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, AUTO_SAVE_DELAY);
  }, [performAutoSave, isCreateMode]);

  // Handle create new task
  const handleCreate = useCallback(() => {
    form.validateFields().then((values) => {
      if (!onCreate) return;
      
      const newTask: Task = {
        id: `task-${Date.now()}`, // Temporary ID, will be replaced by server
        title: values.title,
        description: values.description,
        isRequired: values.isRequired ?? true,
        estimatedTime: values.estimatedTime,
        // Human assignment
        assignedTo: assignmentType === "human" ? values.assignedTo : undefined,
        requiresApproval: assignmentType === "human" ? values.requiresApproval : undefined,
        approvalFrom: assignmentType === "human" ? values.approvalFrom : undefined,
        aiBotApprovers: assignmentType === "human" ? values.aiBotApprovers : undefined,
        // Bot assignment
        assignedBot: assignmentType === "bot" ? values.assignedBot : undefined,
        botApprovalMode: assignmentType === "bot" ? values.botApprovalMode : undefined,
        botEscalationRole: assignmentType === "bot" ? values.botEscalationRole : undefined,
        botReviewRole: assignmentType === "bot" ? values.botReviewRole : undefined,
      };
      onCreate(newTask);
      onClose();
    });
  }, [form, onCreate, onClose, assignmentType]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Legacy manual save (now just triggers immediate save)
  const handleSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    performAutoSave();
  };

  const handleDelete = () => {
    if (task) {
      onDelete(task.id);
    }
  };

  // Handle inline title edit
  const handleTitleClick = () => {
    if (task) {
      setEditedTitle(task.title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    if (!task || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    if (editedTitle !== task.title) {
      onSave({
        ...task,
        title: editedTitle.trim(),
      });
      form.setFieldsValue({ title: editedTitle.trim() });
      setLastSaved(new Date());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditedTitle(task?.title || "");
      setIsEditingTitle(false);
    }
  };

  const getRoleShortcut = (role?: string) => {
    if (!role) return null;
    return ROLE_SHORTCUTS[role] || role.split(" ")[0];
  };

  const getAssignedRolesDisplay = (roles?: string[]) => {
    if (!roles || roles.length === 0) return null;
    if (roles.length === 1) return getRoleShortcut(roles[0]);
    return `${roles.length} roles`;
  };

  // Build sidebar title with editable task name
  const sidebarTitle = task && !isCreateMode ? (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Task Icon */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: task.isRequired ? `${stageColor}15` : "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: task.isRequired ? stageColor : "#999",
          flexShrink: 0,
        }}
      >
        <CheckCircle size={14} />
      </div>
      
      {/* Editable Title */}
      {isEditingTitle ? (
        <Input
          ref={titleInputRef}
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyDown}
          size="small"
          style={{ 
            fontSize: 14, 
            fontWeight: 600,
            width: 200,
          }}
        />
      ) : (
        <div
          onClick={handleTitleClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 4,
            transition: "all 0.15s",
            maxWidth: 220,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f5f5f5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Text strong style={{ fontSize: 14 }} ellipsis>{task.title}</Text>
          <Pencil size={12} style={{ color: "#999", flexShrink: 0 }} />
        </div>
      )}
      
      {/* Save Status */}
      {isSaving ? (
        <Loader2 size={14} className="animate-spin" style={{ color: "#1890ff" }} />
      ) : lastSaved ? (
        <Tooltip title={`Saved: ${lastSaved.toLocaleTimeString()}`}>
          <Check size={14} style={{ color: "#52c41a" }} />
        </Tooltip>
      ) : null}
    </div>
  ) : (
    <Space>
      <Button 
        type="text" 
        size="small" 
        icon={<ArrowLeft size={16} />} 
        onClick={onClose}
        style={{ marginRight: 4 }}
      />
      New Task
    </Space>
  );

  return (
    <RightSidebar
      open={open}
      title={sidebarTitle}
      onClose={onClose}
      width={420}
      topOffset={64}
      zIndex={20} // Higher than stage sidebar (10) to stack on top
    >
      <div style={{ padding: 20 }}>
        {(task || isCreateMode) && (
          <>
            {/* Task Info - only in edit mode */}
            {task && !isCreateMode && (
              <div style={{ marginBottom: 16 }}>
                {/* Stage link and status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {onOpenStage ? (
                      <Text
                        type="secondary"
                        style={{ 
                          fontSize: 12, 
                          cursor: "pointer",
                          color: stageColor,
                          textDecoration: "underline",
                        }}
                        onClick={onOpenStage}
                      >
                        {stageName}
                      </Text>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 12 }}>{stageName}</Text>
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      • {task.isRequired ? "Required" : "Optional"}
                    </Text>
                  </div>
                  <Button 
                    size="small" 
                    danger 
                    type="text"
                    icon={<Trash2 size={14} />} 
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </div>
                
                {/* Quick Info Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {task.assignedBot && (
                    <Tag color="purple" icon={<Bot size={10} />} style={{ margin: 0 }}>
                      {AI_BOTS[task.assignedBot]?.name || task.assignedBot}
                    </Tag>
                  )}
                  
                  {task.assignedTo && task.assignedTo.length > 0 && (
                    <Tooltip title={task.assignedTo.join(", ")}>
                      <Tag icon={<User size={10} />} style={{ margin: 0 }}>
                        {getAssignedRolesDisplay(task.assignedTo)}
                      </Tag>
                    </Tooltip>
                  )}
                  
                  {task.botApprovalMode && (
                    <Tag 
                      color={
                        task.botApprovalMode === "turbo" ? "green" :
                        task.botApprovalMode === "normal" ? "blue" :
                        "orange"
                      }
                      icon={
                        task.botApprovalMode === "turbo" ? <Zap size={10} /> :
                        task.botApprovalMode === "normal" ? <AlertTriangle size={10} /> :
                        <Hand size={10} />
                      }
                      style={{ margin: 0 }}
                    >
                      {task.botApprovalMode === "turbo" ? "Turbo" :
                       task.botApprovalMode === "normal" ? "Normal" :
                       "Manual"}
                    </Tag>
                  )}
                  
                  {task.estimatedTime && (
                    <Tag icon={<Clock size={10} />} style={{ margin: 0 }}>
                      {task.estimatedTime}m
                    </Tag>
                  )}
                  
                  {task.requiresApproval && (
                    <Tag color="warning" icon={<Shield size={10} />} style={{ margin: 0 }}>
                      Approval
                    </Tag>
                  )}
                </div>
              </div>
            )}
            
            <Form form={form} layout="vertical" size="small" onValuesChange={handleValuesChange}>
              {/* Only show title field in create mode - edit mode uses inline edit */}
              {isCreateMode && (
                <Form.Item
                  label="Task Title"
                  name="title"
                  rules={[{ required: true, message: "Please enter a task title" }]}
                >
                  <Input placeholder="e.g., Review contract terms" autoFocus />
                </Form.Item>
              )}

              {/* Description - simple for both modes */}
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={2} placeholder="Describe what needs to be done..." />
              </Form.Item>

              {/* Assignment Type Selector */}
              <Form.Item label="Assign To">
                <Segmented
                  value={assignmentType}
                  onChange={(value) => {
                    setAssignmentType(value as "human" | "bot");
                    // Clear opposite assignment when switching
                    if (value === "human") {
                      form.setFieldsValue({ 
                        assignedBot: undefined,
                        botApprovalMode: undefined,
                        botEscalationRole: undefined,
                        botReviewRole: undefined,
                      });
                    } else {
                      form.setFieldsValue({ 
                        assignedTo: undefined,
                        requiresApproval: false,
                        approvalFrom: undefined,
                        aiBotApprovers: undefined,
                      });
                    }
                  }}
                  options={[
                    { label: "Human Roles", value: "human", icon: <User size={14} /> },
                    { label: "AI Bot", value: "bot", icon: <Bot size={14} /> },
                  ]}
                  block
                />
              </Form.Item>

              {/* Human Assignment */}
              {assignmentType === "human" && (
                <Form.Item label="Assigned To" name="assignedTo">
                  <Select 
                    mode="multiple"
                    placeholder="Select roles" 
                    allowClear 
                    options={AVAILABLE_ROLES}
                    maxTagCount={2}
                    maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
                  />
                </Form.Item>
              )}

              {/* Bot Assignment */}
              {assignmentType === "bot" && (
                <>
                  <Form.Item 
                    label="AI Bot" 
                    name="assignedBot"
                    rules={[{ required: true, message: "Please select a bot" }]}
                  >
                    <Select placeholder="Select AI bot" allowClear>
                      {Object.entries(AI_BOTS).map(([key, bot]) => (
                        <Select.Option key={key} value={key}>
                          <Space>
                            {bot.icon && React.createElement((LucideIcons as any)[bot.icon] || LucideIcons.Bot, { size: 14 })}
                            <span>{bot.name}</span>
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item 
                    label="Approval Mode" 
                    name="botApprovalMode"
                    rules={[{ required: true, message: "Please select approval mode" }]}
                  >
                    <Radio.Group style={{ width: "100%" }}>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Card size="small" style={{ marginBottom: 8 }}>
                          <Radio value="turbo">
                            <Space>
                              <Zap size={14} color="#52c41a" />
                              <Text strong>Turbo Mode</Text>
                            </Space>
                            <div style={{ paddingLeft: 22, marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Fully automated, no human approval
                              </Text>
                            </div>
                          </Radio>
                        </Card>
                        <Card size="small" style={{ marginBottom: 8 }}>
                          <Radio value="normal">
                            <Space>
                              <AlertTriangle size={14} color="#1890ff" />
                              <Text strong>Normal Mode</Text>
                              <Tag color="blue" style={{ fontSize: 10 }}>Recommended</Tag>
                            </Space>
                            <div style={{ paddingLeft: 22, marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Escalates uncertain cases, approves confident ones
                              </Text>
                            </div>
                          </Radio>
                        </Card>
                        <Card size="small">
                          <Radio value="manual">
                            <Space>
                              <Hand size={14} color="#faad14" />
                              <Text strong>Manual Mode</Text>
                            </Space>
                            <div style={{ paddingLeft: 22, marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Every case requires human approval
                              </Text>
                            </div>
                          </Radio>
                        </Card>
                      </Space>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item 
                    label="Escalation Role" 
                    name="botEscalationRole"
                    rules={[{ required: true, message: "Required: who handles escalated cases?" }]}
                    tooltip="Who receives cases when bot is uncertain or encounters errors"
                  >
                    <Select placeholder="Select role" allowClear options={AVAILABLE_ROLES} />
                  </Form.Item>

                  <Form.Item 
                    label="Review Role" 
                    name="botReviewRole"
                    tooltip="Optional: who reviews bot's completed work periodically"
                  >
                    <Select placeholder="Select role (optional)" allowClear options={AVAILABLE_ROLES} />
                  </Form.Item>

                  <Alert
                    message="Bot Workflow"
                    description={
                      <div style={{ fontSize: 12 }}>
                        Bot will process tasks automatically. Escalated cases go to <strong>{form.getFieldValue('botEscalationRole') || 'Escalation Role'}</strong>.
                        {form.getFieldValue('botReviewRole') && ` Completed work reviewed by ${form.getFieldValue('botReviewRole')}.`}
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                </>
              )}

              <Form.Item label="Est. Time" name="estimatedTime" style={{ width: 150 }}>
                <InputNumber 
                  min={1} 
                  placeholder="30" 
                  style={{ width: "100%" }}
                  addonAfter="min"
                />
              </Form.Item>

              <Form.Item name="isRequired" valuePropName="checked">
                <Space>
                  <Switch />
                  <Text>Required Task</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    (Must be completed before stage transition)
                  </Text>
                </Space>
              </Form.Item>

              <Divider style={{ margin: "16px 0" }} />

              {/* Approval Settings - Only for Human Assignment */}
              {assignmentType === "human" && (
                <>
                  <Title level={5} style={{ marginBottom: 12, fontSize: 13 }}>Approval Settings</Title>

                  <Form.Item name="requiresApproval" valuePropName="checked">
                    <Space>
                      <Switch />
                      <Text>Requires Approval</Text>
                    </Space>
                  </Form.Item>

                  <Form.Item 
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => 
                      prevValues.requiresApproval !== currentValues.requiresApproval
                    }
                  >
                    {({ getFieldValue }) => 
                      getFieldValue("requiresApproval") && (
                        <>
                          <Form.Item label="Human Approvers" name="approvalFrom">
                            <Select 
                              mode="multiple" 
                              placeholder="Select roles that can approve" 
                              options={AVAILABLE_ROLES}
                            />
                          </Form.Item>
                          <Form.Item label="AI Bot Approvers" name="aiBotApprovers">
                            <Select mode="multiple" placeholder="Select AI bots">
                              {Object.entries(AI_BOTS).map(([key, bot]) => {
                                const BotIcon = (LucideIcons as any)[bot.icon];
                                return (
                                  <Select.Option key={key} value={key}>
                                    <Space>
                                      {BotIcon && <BotIcon size={14} style={{ color: bot.color }} />}
                                      {bot.name}
                                    </Space>
                                  </Select.Option>
                                );
                              })}
                            </Select>
                          </Form.Item>
                        </>
                      )
                    }
                  </Form.Item>
                </>
              )}

              <Divider style={{ margin: "16px 0" }} />

              {/* Action buttons */}
              {isCreateMode && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <Button onClick={onClose}>Cancel</Button>
                  <Button type="primary" onClick={handleCreate}>
                    Create Task
                  </Button>
                </div>
              )}
            </Form>
          </>
        )}
      </div>
    </RightSidebar>
  );
};

export default TaskSidebar;

