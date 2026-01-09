import React, { useEffect, useState, useRef, useCallback } from "react";
import { Form, Input, Space, Button, Typography, Divider, message, Tag, Tooltip, Avatar, Modal } from "antd";
import { Trash2, Plus, Clock, CheckCircle, Check, Loader2, ExternalLink, Briefcase, TrendingUp, DollarSign, Eye, Bot, Zap, AlertTriangle, Hand, Pencil } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import RightSidebar from "../../../RightSidebar";
import { StageData, Task } from "../types";
import { ROLE_SHORTCUTS, AI_BOTS } from "../constants";
import { IconPickerModal } from "../modals";
import { Deal } from "../../../../data/mockDeals";
import { getDealsByStageId } from "../../../../data/dealStageUtils";

// Auto-save debounce delay in ms
const AUTO_SAVE_DELAY = 1500;

const { Text, Title } = Typography;

interface StageSidebarProps {
  open: boolean;
  stage: StageData | null;
  tasks: Task[];
  allStages: StageData[]; // Kept for interface compatibility
  selectedTaskId?: string | null; // Currently selected task (for toggle behavior)
  onClose: () => void;
  onSave: (stage: StageData) => void;
  onDelete: (stageId: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, toStageId: string) => void; // Kept for interface compatibility
  onTaskClick?: (task: Task) => void; // Opens second sidebar for editing
  onAddTaskClick?: () => void; // Opens second sidebar for creating
  onTaskClose?: () => void; // Close task sidebar (for toggle)
  rightOffset?: number; // Push sidebar left when second sidebar is open
  width?: number; // Sidebar width
}

const StageSidebar: React.FC<StageSidebarProps> = ({
  open,
  stage,
  tasks,
  selectedTaskId,
  onClose,
  onSave,
  onDelete,
  onAddTask,
  onDeleteTask,
  onTaskClick,
  onAddTaskClick,
  onTaskClose,
  rightOffset = 0,
  width = 420,
}) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  // Get deals for this stage - use label (e.g., "Live") since IDs are UUIDs
  const stageDeals = stage ? getDealsByStageId(stage.label) : [];
  
  // Inline edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const nameInputRef = useRef<any>(null);
  const sidebarContentRef = useRef<HTMLDivElement>(null);
  
  // Auto-save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialValuesRef = useRef<{ label: string; icon: string; color: string } | null>(null);

  // Update form and reset editing state when stage changes
  useEffect(() => {
    if (stage) {
      const values = {
        label: stage.label,
        icon: stage.icon,
        color: stage.color,
      };
      form.setFieldsValue(values);
      initialValuesRef.current = values;
      setEditedName(stage.label);
      setIsEditingName(false);
    }
  }, [stage, form]);
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!stage) return;
    
    const values = form.getFieldsValue();
    const hasChanges = 
      values.label !== initialValuesRef.current?.label ||
      values.icon !== initialValuesRef.current?.icon ||
      (typeof values.color === "string" ? values.color : values.color?.toHexString()) !== initialValuesRef.current?.color;

    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const colorValue = typeof values.color === "string" ? values.color : values.color?.toHexString() || stage.color;
      onSave({
        ...stage,
        label: values.label,
        icon: values.icon,
        color: colorValue,
      });
      initialValuesRef.current = { label: values.label, icon: values.icon, color: colorValue };
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [stage, form, onSave]);

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

  // Legacy manual save (now just triggers immediate save)
  const handleSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    performAutoSave();
  };

  // Handle inline name edit
  const handleNameClick = () => {
    if (stage) {
      setEditedName(stage.label);
      setIsEditingName(true);
    }
  };

  const handleNameSave = useCallback(() => {
    if (!stage || !editedName.trim()) {
      setIsEditingName(false);
      return;
    }
    if (editedName !== stage.label) {
      onSave({
        ...stage,
        label: editedName.trim(),
      });
      setLastSaved(new Date());
    }
    setIsEditingName(false);
  }, [stage, editedName, onSave]);

  // Handle click outside to save and close edit mode
  useEffect(() => {
    if (!isEditingName) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on the input itself
      if (nameInputRef.current && nameInputRef.current.input.contains(target)) {
        return;
      }
      
      // Don't close if clicking anywhere in the sidebar content
      if (sidebarContentRef.current && sidebarContentRef.current.contains(target)) {
        return;
      }
      
      // Clicked outside - save and close
      handleNameSave();
    };

    // Add listener after a small delay to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingName, handleNameSave]);

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setEditedName(stage?.label || "");
      setIsEditingName(false);
    }
  };

  // Handle icon selection
  const handleIconSelect = (icon: string) => {
    if (!stage) return;
    onSave({
      ...stage,
      icon,
    });
    setLastSaved(new Date());
    setIconPickerOpen(false);
  };

  const handleDelete = () => {
    if (!stage) return;
    
    // Allow deletion of ANY stage in draft mode
    // Migration will be required before publishing
    onDelete(stage.id);
    onClose();
  };

  // Handle adding a new task - opens TaskSidebar in create mode
  const handleAddTaskClick = () => {
    if (onAddTaskClick) {
      onAddTaskClick();
    }
  };

  const handleTaskClick = (task: Task) => {
    // Toggle behavior: clicking same task again closes the sidebar
    if (selectedTaskId === task.id && onTaskClose) {
      onTaskClose();
      return;
    }
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    Modal.confirm({
      title: "Delete Task",
      content: "Are you sure you want to delete this task?",
      okText: "Delete",
      okType: "danger",
      onOk: () => onDeleteTask(taskId),
    });
  };

  const requiredTasks = tasks.filter(t => t.isRequired);
  const optionalTasks = tasks.filter(t => !t.isRequired);

  const getRoleShortcut = (role?: string) => {
    if (!role) return null;
    return ROLE_SHORTCUTS[role] || role.split(" ")[0];
  };

  const getAssignedRolesDisplay = (roles?: string[]) => {
    if (!roles || roles.length === 0) return null;
    if (roles.length === 1) return getRoleShortcut(roles[0]);
    return `${roles.length} roles`;
  };

  // Build sidebar title with editable name
  const sidebarTitle = stage ? (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Clickable Icon */}
      <Tooltip title="Change icon">
        <div
          onClick={() => setIconPickerOpen(true)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${stage.color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: stage.color,
            cursor: "pointer",
            transition: "all 0.15s",
            border: "2px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = stage.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          {React.createElement(
            (LucideIcons as any)[stage.icon] || LucideIcons.Circle,
            { size: 16 }
          )}
        </div>
      </Tooltip>
      
      {/* Editable Name */}
      {isEditingName ? (
        <Input
          ref={nameInputRef}
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onKeyDown={handleNameKeyDown}
          size="small"
          placeholder="Stage name"
          style={{ 
            fontSize: 14, 
            fontWeight: 600,
            width: 180,
          }}
        />
      ) : (
        <div
          onClick={handleNameClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 4,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f5f5f5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span style={{ fontWeight: 600 }}>{stage.label}</span>
          <Pencil size={12} style={{ color: "#999" }} />
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
  ) : "Stage";

  return (
    <>
      <RightSidebar
        open={open}
        title={sidebarTitle}
        onClose={onClose}
        width={420}
        topOffset={64}
        rightOffset={rightOffset}
        zIndex={100} // Higher z-index to appear above React Flow canvas
      >
        <div ref={sidebarContentRef} style={{ padding: 20 }}>
          {stage && (
            <>
              {/* Stage Info */}
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {stage.row === "draft" ? "Draft Phase" : "Won Phase"} • {tasks.length} task{tasks.length !== 1 ? 's' : ''} • {stageDeals.length} deal{stageDeals.length !== 1 ? 's' : ''}
                </Text>
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

              {/* Icon Picker Modal */}
              <IconPickerModal
                open={iconPickerOpen}
                currentIcon={stage.icon}
                color={stage.color}
                onSelect={handleIconSelect}
                onCancel={() => setIconPickerOpen(false)}
              />

              {/* Tasks Section - drag tasks to stage nodes in the flow diagram */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Title level={5} style={{ margin: 0 }}>Tasks</Title>
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<Plus size={14} />}
                    onClick={handleAddTaskClick}
                  >
                    Add Task
                  </Button>
                </div>

                {/* Hint for drag and drop */}
                {tasks.length > 0 && (
                  <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 12 }}>
                    Drag tasks to stage nodes in the diagram to move them
                  </Text>
                )}

                {/* Required Tasks */}
                {requiredTasks.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Required ({requiredTasks.length})
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      {requiredTasks.map((task) => (
                        <DraggableTaskCard 
                          key={task.id} 
                          task={task}
                          stageId={stage.id}
                          stageColor={stage.color}
                          isSelected={selectedTaskId === task.id}
                          onClick={() => handleTaskClick(task)}
                          onDelete={() => handleTaskDelete(task.id)}
                          getRoleShortcut={getRoleShortcut}
                          getAssignedRolesDisplay={getAssignedRolesDisplay}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional Tasks */}
                {optionalTasks.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Optional ({optionalTasks.length})
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      {optionalTasks.map((task) => (
                        <DraggableTaskCard 
                          key={task.id} 
                          task={task}
                          stageId={stage.id}
                          stageColor={stage.color}
                          isSelected={selectedTaskId === task.id}
                          onClick={() => handleTaskClick(task)}
                          onDelete={() => handleTaskDelete(task.id)}
                          getRoleShortcut={getRoleShortcut}
                          getAssignedRolesDisplay={getAssignedRolesDisplay}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {tasks.length === 0 && (
                  <div style={{ textAlign: "center", padding: 24, background: "#fafafa", borderRadius: 8 }}>
                    <Text type="secondary">No tasks in this stage</Text>
                    <br />
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<Plus size={14} />}
                      onClick={handleAddTaskClick}
                    >
                      Add your first task
                    </Button>
                  </div>
                )}
              </div>

              {/* Deals Section */}
              <Divider style={{ margin: "16px 0" }} />
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Title level={5} style={{ margin: 0 }}>
                    <Space>
                      <Briefcase size={16} />
                      Deals in this Stage
                      <Tag>{stageDeals.length}</Tag>
                    </Space>
                  </Title>
                </div>

                {stageDeals.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {stageDeals.slice(0, 10).map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        stageColor={stage?.color || "#1890ff"}
                        onClick={() => navigate(`/deals/${deal.id}`)}
                      />
                    ))}
                    {stageDeals.length > 10 && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => navigate(`/deals?stage=${stage?.id}`)}
                      >
                        View all {stageDeals.length} deals →
                      </Button>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 24, background: "#fafafa", borderRadius: 8 }}>
                    <Briefcase size={24} style={{ color: "#bfbfbf", marginBottom: 8 }} />
                    <br />
                    <Text type="secondary">No deals in this stage yet</Text>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </RightSidebar>
    </>
  );
};

// Task Card Component
interface TaskCardProps {
  task: Task;
  stageColor: string;
  isSelected?: boolean;
  isDragOverlay?: boolean;
  onClick: () => void;
  onDelete: () => void;
  getRoleShortcut: (role?: string) => string | null;
  getAssignedRolesDisplay: (roles?: string[]) => string | null;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, stageColor, isSelected, isDragOverlay, onClick, onDelete, getRoleShortcut, getAssignedRolesDisplay }) => {
  const hasApproval = task.requiresApproval && ((task.approvalFrom?.length || 0) > 0 || (task.aiBotApprovers?.length || 0) > 0);
  
  return (
    <div
      style={{
        padding: "10px 12px",
        background: isDragOverlay ? "#fff" : isSelected ? `${stageColor}10` : task.isRequired ? "#fff" : "#fafafa",
        border: isDragOverlay ? `2px solid ${stageColor}` : isSelected ? `2px solid ${stageColor}` : "1px solid #f0f0f0",
        borderRadius: 8,
        marginBottom: isDragOverlay ? 0 : 8,
        opacity: task.isRequired ? 1 : 0.85,
        cursor: isDragOverlay ? "grabbing" : "pointer",
        transition: isDragOverlay ? "none" : "all 0.2s",
        boxShadow: isDragOverlay ? `0 8px 24px rgba(0,0,0,0.15)` : isSelected ? `0 2px 8px ${stageColor}30` : "none",
        transform: isDragOverlay ? "rotate(3deg)" : "none",
        width: isDragOverlay ? 380 : undefined,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isDragOverlay) {
          e.currentTarget.style.borderColor = stageColor;
          e.currentTarget.style.boxShadow = `0 2px 8px ${stageColor}20`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragOverlay && !isSelected) {
          e.currentTarget.style.borderColor = "#f0f0f0";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <Text strong style={{ fontSize: 13 }}>{task.title}</Text>
          
          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {task.assignedBot && (
              <Tooltip title={`AI Bot: ${AI_BOTS[task.assignedBot]?.name || task.assignedBot}`}>
                <Tag 
                  color="purple" 
                  icon={<Bot size={10} />}
                  style={{ margin: 0, fontSize: 11 }}
                >
                  {AI_BOTS[task.assignedBot]?.name || task.assignedBot}
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
                style={{ margin: 0, fontSize: 11 }}
              >
                {task.botApprovalMode === "turbo" ? "Turbo" :
                 task.botApprovalMode === "normal" ? "Normal" :
                 "Manual"}
              </Tag>
            )}
            
            {task.assignedTo && task.assignedTo.length > 0 && (
              <Tooltip title={task.assignedTo.join(", ")}>
                <Tag style={{ margin: 0, fontSize: 11 }}>
                  {getAssignedRolesDisplay(task.assignedTo)}
                </Tag>
              </Tooltip>
            )}
            
            {task.estimatedTime && (
              <Tooltip title={`${task.estimatedTime} minutes`}>
                <Tag icon={<Clock size={10} />} style={{ margin: 0, fontSize: 11 }}>
                  {task.estimatedTime}m
                </Tag>
              </Tooltip>
            )}

            {!task.isRequired && (
              <Tag color="default" style={{ margin: 0, fontSize: 11 }}>Optional</Tag>
            )}

            {hasApproval && (
              <Tooltip title={
                <div>
                  <div>Requires approval from:</div>
                  {task.approvalFrom?.map(role => (
                    <div key={role}>• {role}</div>
                  ))}
                  {task.aiBotApprovers?.map(bot => (
                    <div key={bot}>• {AI_BOTS[bot]?.name || bot}</div>
                  ))}
                </div>
              }>
                <Tag color="warning" icon={<CheckCircle size={10} />} style={{ margin: 0, fontSize: 11 }}>
                  Approval
                </Tag>
              </Tooltip>
            )}
          </div>
        </div>

        {!isDragOverlay && (
          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }}
            onMouseDown={(e) => {
              e.stopPropagation(); // Prevent drag from starting
            }}
            style={{ marginLeft: 8, zIndex: 10, position: 'relative' }}
          />
        )}
      </div>
    </div>
  );
};

// Draggable Task Card - drag to stage nodes in the flow diagram
interface DraggableTaskCardProps extends Omit<TaskCardProps, 'isDragOverlay'> {
  stageId: string; // Stage this task belongs to
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({ task, stageId, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { stageId }, // Pass stageId so parent can identify source
  });

  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : {};

  // Filter out listeners to prevent interference with button clicks
  const filteredListeners = {
    ...listeners,
    onClick: (e: React.MouseEvent) => {
      // Don't initiate drag if clicking on a button
      const target = e.target as HTMLElement;
      if (target.closest('button')) {
        return;
      }
      listeners?.onClick?.(e);
    },
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...filteredListeners}
      style={{
        ...style,
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
      }}
    >
      <TaskCard task={task} {...props} />
    </div>
  );
};

// Deal Card Component - displays a deal in the stage sidebar
interface DealCardProps {
  deal: Deal;
  stageColor: string;
  onClick: () => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, stageColor, onClick }) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px",
        background: "#fff",
        border: "1px solid #f0f0f0",
        borderRadius: 8,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = stageColor;
        e.currentTarget.style.boxShadow = `0 2px 8px ${stageColor}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#f0f0f0";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Deal Image or Logo */}
        <Avatar
          shape="square"
          size={48}
          src={deal.content?.media?.[0]?.url || deal.logo}
          style={{ flexShrink: 0, borderRadius: 6 }}
        >
          {deal.title.charAt(0)}
        </Avatar>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Deal Title */}
          <Text strong style={{ fontSize: 13, display: "block" }} ellipsis>
            {deal.title}
          </Text>
          
          {/* Location */}
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 2 }} ellipsis>
            {deal.location}
          </Text>
          
          {/* Stats Row */}
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            {deal.stats?.revenue > 0 && (
              <Tooltip title="Revenue">
                <Space size={4} style={{ fontSize: 11, color: "#52c41a" }}>
                  <DollarSign size={12} />
                  {formatCurrency(deal.stats.revenue)}
                </Space>
              </Tooltip>
            )}
            {deal.stats?.purchases > 0 && (
              <Tooltip title="Purchases">
                <Space size={4} style={{ fontSize: 11, color: "#1890ff" }}>
                  <TrendingUp size={12} />
                  {formatNumber(deal.stats.purchases)}
                </Space>
              </Tooltip>
            )}
            {deal.stats?.views > 0 && (
              <Tooltip title="Views">
                <Space size={4} style={{ fontSize: 11, color: "#8c8c8c" }}>
                  <Eye size={12} />
                  {formatNumber(deal.stats.views)}
                </Space>
              </Tooltip>
            )}
          </div>
        </div>
        
        {/* Open Icon */}
        <ExternalLink size={14} style={{ color: "#bfbfbf", flexShrink: 0, marginTop: 4 }} />
      </div>
    </div>
  );
};

export default StageSidebar;
