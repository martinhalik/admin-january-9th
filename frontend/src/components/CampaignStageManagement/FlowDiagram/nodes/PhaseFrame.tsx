import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { Typography, Button, Tooltip } from "antd";
import { Plus } from "lucide-react";

const { Text } = Typography;

interface PhaseFrameProps {
  data: {
    label: string;
    color: string;
    width: number;
    height: number;
    hasRightHandle?: boolean;
    hasBottomHandle?: boolean;
    hasLeftHandle?: boolean;
    hasTopHandle?: boolean;
    isEmpty?: boolean; // True if no stages in this phase
    onAddFirstStage?: () => void; // Callback to add first stage
    onClick?: () => void; // Callback when phase label is clicked
  };
}

const PhaseFrame: React.FC<PhaseFrameProps> = ({ data }) => {
  const { label, color, width, height, hasRightHandle, hasBottomHandle, hasLeftHandle, hasTopHandle, isEmpty, onAddFirstStage, onClick } = data;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        width,
        height,
        background: `${color}08`,
        border: `2px dashed ${color}40`,
        borderRadius: 16,
        padding: "12px", // Symmetric padding all around
        position: "relative",
        cursor: "grab",
        overflow: "visible", // Ensure children are not clipped
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Phase-to-phase connection handles - visible source, invisible target underneath */}
      {hasRightHandle && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="phase-right"
            style={{
              background: color,
              width: 16,
              height: 16,
              border: "3px solid #fff",
              boxShadow: `0 2px 8px ${color}60`,
              cursor: "crosshair",
              zIndex: 10,
            }}
          />
          <Handle
            type="target"
            position={Position.Right}
            id="phase-right-target"
            style={{
              background: "transparent",
              border: "none",
              width: 16,
              height: 16,
              zIndex: 9,
            }}
          />
        </>
      )}
      {hasBottomHandle && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="phase-bottom"
            style={{
              background: color,
              width: 16,
              height: 16,
              border: "3px solid #fff",
              boxShadow: `0 2px 8px ${color}60`,
              cursor: "crosshair",
              zIndex: 10,
            }}
          />
          <Handle
            type="target"
            position={Position.Bottom}
            id="phase-bottom-target"
            style={{
              background: "transparent",
              border: "none",
              width: 16,
              height: 16,
              zIndex: 9,
            }}
          />
        </>
      )}
      {hasLeftHandle && (
        <>
          <Handle
            type="source"
            position={Position.Left}
            id="phase-left"
            style={{
              background: color,
              width: 16,
              height: 16,
              border: "3px solid #fff",
              boxShadow: `0 2px 8px ${color}60`,
              cursor: "crosshair",
              zIndex: 10,
            }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id="phase-left-target"
            style={{
              background: "transparent",
              border: "none",
              width: 16,
              height: 16,
              zIndex: 9,
            }}
          />
        </>
      )}
      {hasTopHandle && (
        <>
          <Handle
            type="source"
            position={Position.Top}
            id="phase-top"
            style={{
              background: color,
              width: 16,
              height: 16,
              border: "3px solid #fff",
              boxShadow: `0 2px 8px ${color}60`,
              cursor: "crosshair",
              zIndex: 10,
            }}
          />
          <Handle
            type="target"
            position={Position.Top}
            id="phase-top-target"
            style={{
              background: "transparent",
              border: "none",
              width: 16,
              height: 16,
              zIndex: 9,
            }}
          />
        </>
      )}

      <div
        onClick={(e) => {
          if (onClick) {
            e.stopPropagation();
            onClick();
          }
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          background: `${color}15`,
          borderRadius: 12,
          marginBottom: 8,
          cursor: onClick ? "pointer" : "default",
          transition: "background 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.background = `${color}25`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${color}15`;
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
          }}
        />
        <Text strong style={{ fontSize: 12, color }}>
          {label}
        </Text>
      </div>

      {/* Add First Stage button - shown when phase is empty */}
      {isEmpty && onAddFirstStage && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -30%)",
            opacity: isHovered ? 1 : 0.6,
            transition: "opacity 0.2s ease",
          }}
        >
          <Tooltip title="Add first stage">
            <Button
              type="dashed"
              icon={<Plus size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onAddFirstStage();
              }}
              style={{
                borderColor: color,
                color: color,
              }}
            >
              Add Stage
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default PhaseFrame;

