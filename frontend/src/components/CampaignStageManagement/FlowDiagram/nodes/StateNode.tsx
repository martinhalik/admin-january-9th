import React from "react";
import { Handle, Position } from "reactflow";
import { Typography } from "antd";
import * as LucideIcons from "lucide-react";

const { Text } = Typography;

interface StateNodeProps {
  data: {
    id: string;
    label: string;
    icon: string;
    color: string;
    isNegative?: boolean;
    onClick?: (data: any) => void;
  };
}

const StateNode: React.FC<StateNodeProps> = ({ data }) => {
  const { label, icon, color, isNegative, onClick } = data;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(data);
  };

  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Circle;

  return (
    <div
      onClick={handleClick}
      style={{
        padding: "12px 16px",
        background: isNegative ? "#fff5f5" : "#f6ffed",
        border: `2px dashed ${color}`,
        borderRadius: 8,
        cursor: "pointer",
        transition: "all 0.2s",
        minWidth: 100,
        textAlign: "center",
        opacity: 0.9,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.9";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Handles for incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: color, width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, width: 8, height: 8 }}
      />

      {/* Node content */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <IconComponent size={14} style={{ color }} />
        <Text style={{ fontSize: 12, color }}>{label}</Text>
      </div>
    </div>
  );
};

export default StateNode;















