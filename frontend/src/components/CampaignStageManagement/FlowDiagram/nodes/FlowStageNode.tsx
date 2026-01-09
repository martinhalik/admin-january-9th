import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { Typography, Badge, Tooltip } from "antd";
import * as LucideIcons from "lucide-react";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

const { Text } = Typography;

interface FlowStageNodeProps {
  data: {
    id: string;
    label: string;
    icon: string;
    color: string;
    row: "draft" | "won";
    isEnd?: boolean;
    isSystem?: boolean; // System stages like "lost", "paused" can't have add buttons
    taskCount?: number;
    onClick?: (data: any) => void;
    onAddLeft?: () => void;
    onAddRight?: () => void;
    onAddAbove?: () => void;
    onAddBelow?: () => void;
  };
}

// Add button component
const AddButton: React.FC<{
  position: "left" | "right" | "top" | "bottom";
  tooltip: string;
  onClick: () => void;
  visible: boolean;
}> = ({ position, tooltip, onClick, visible }) => {
  const [isHovered, setIsHovered] = useState(false);

  const tooltipPlacement = {
    left: "left" as const,
    right: "right" as const,
    top: "top" as const,
    bottom: "bottom" as const,
  };

  return (
    <Tooltip title={tooltip} placement={tooltipPlacement[position]}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: isHovered ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.06)",
          border: isHovered ? "1px solid rgba(0, 0, 0, 0.4)" : "1px dashed rgba(0, 0, 0, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.15s ease",
          padding: 0,
          transform: isHovered ? "scale(1.2)" : "scale(1)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <Plus size={10} style={{ color: isHovered ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.4)" }} />
      </button>
    </Tooltip>
  );
};

const FlowStageNode: React.FC<FlowStageNodeProps> = ({ data }) => {
  const { label, icon, color, isEnd, isSystem, taskCount, onClick, id, onAddLeft, onAddRight, onAddAbove, onAddBelow } = data;
  const [isHovered, setIsHovered] = useState(false);

  // Make this node a droppable target for tasks
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(data);
  };

  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Circle;

  // Don't show add buttons for system stages (lost, paused) or end stages
  const showAddButtons = !isSystem && !isEnd;

  // Button spacing from edge of node
  const BUTTON_GAP = 4;

  return (
    // Grid layout: buttons in their positions, node in center
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto auto",
        gridTemplateRows: "auto auto auto",
        alignItems: "center",
        justifyItems: "center",
        gap: BUTTON_GAP,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top row: empty | top button | empty */}
      <div />
      <div style={{ height: 20 }}>
        {showAddButtons && onAddAbove && (
          <AddButton position="top" tooltip="Add stage above" onClick={onAddAbove} visible={isHovered} />
        )}
      </div>
      <div />

      {/* Middle row: left button | NODE | right button */}
      <div style={{ width: 20 }}>
        {showAddButtons && onAddLeft && (
          <AddButton position="left" tooltip="Add stage before" onClick={onAddLeft} visible={isHovered} />
        )}
      </div>
      
      {/* The actual node */}
      <div
        ref={setNodeRef}
        onClick={handleClick}
        style={{
          padding: "16px 24px",
          background: isOver ? `${color}15` : "#fff",
          border: `2px solid ${color}`,
          borderRadius: isEnd ? 24 : 12,
          boxShadow: isOver ? `0 8px 24px ${color}60` : `0 4px 12px ${color}30`,
          cursor: "pointer",
          transition: "all 0.2s ease",
          minWidth: 140,
          textAlign: "center",
          position: "relative",
          transform: isOver ? "scale(1.05)" : "scale(1)",
        }}
      >
        {/* Handles for connections */}
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: color, width: 10, height: 10, border: "2px solid #fff" }}
        />
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: color, width: 10, height: 10, border: "2px solid #fff" }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{ background: color, width: 10, height: 10, border: "2px solid #fff" }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{ background: color, width: 10, height: 10, border: "2px solid #fff" }}
        />

        {/* Node content */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
            }}
          >
            <IconComponent size={16} />
          </div>
          <Text strong style={{ fontSize: 14 }}>
            {label}
          </Text>
          {taskCount !== undefined && taskCount > 0 && (
            <Badge
              count={taskCount}
              style={{
                backgroundColor: color,
                fontSize: 10,
                minWidth: 18,
                height: 18,
                lineHeight: "18px",
              }}
            />
          )}
        </div>
      </div>

      <div style={{ width: 20 }}>
        {showAddButtons && onAddRight && (
          <AddButton position="right" tooltip="Add stage after" onClick={onAddRight} visible={isHovered} />
        )}
      </div>

      {/* Bottom row: empty | bottom button | empty */}
      <div />
      <div style={{ height: 20 }}>
        {showAddButtons && onAddBelow && (
          <AddButton position="bottom" tooltip="Add stage below" onClick={onAddBelow} visible={isHovered} />
        )}
      </div>
      <div />
    </div>
  );
};

export default FlowStageNode;

