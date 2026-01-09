import React from "react";
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from "reactflow";
import { Tooltip } from "antd";
import { ArrowRight } from "lucide-react";

interface PhaseEdgeData {
  sourcePhase: string;
  targetPhase: string;
  color: string;
}

const PhaseEdge: React.FC<EdgeProps<PhaseEdgeData>> = (props) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style,
  } = props;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12, // Slightly larger radius for phase edges
    offset: 30, // More offset for phase transitions
  });

  const color = data?.color || (style?.stroke as string) || "#1890ff";

  return (
    <>
      {/* Thicker invisible path for easier interaction */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={30}
        style={{ cursor: "pointer" }}
      />
      {/* Visible path - thicker for phase transitions */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray="8,4"
        markerEnd={`url(#arrow-phase-${color === "#1890ff" ? "blue" : color === "#52c41a" ? "green" : "red"})`}
      />
      {/* Label in the middle */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <Tooltip title={`${data?.sourcePhase || "Phase"} → ${data?.targetPhase || "Phase"}`}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#fff",
                border: `3px solid ${color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 2px 8px ${color}40`,
              }}
            >
              <ArrowRight size={14} style={{ color }} />
            </div>
          </Tooltip>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default PhaseEdge;









