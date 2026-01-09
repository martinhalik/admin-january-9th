import React, { useState } from "react";
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from "reactflow";
import { Tooltip } from "antd";
import { Zap, User, CheckCircle, Plus } from "lucide-react";
import { TransitionType, ConnectionData } from "../types";
import { COLORS } from "../constants";

const getTransitionConfig = (type: TransitionType) => {
  switch (type) {
    case "auto":
      return { color: COLORS.AUTO, icon: Zap, label: "Auto" };
    case "approval":
      return { color: COLORS.APPROVAL, icon: CheckCircle, label: "Approval" };
    default:
      return { color: COLORS.MANUAL, icon: User, label: "Manual" };
  }
};

const getTriggerLabel = (trigger: string) => {
  switch (trigger) {
    case "all-tasks":
      return "All tasks complete";
    case "required-tasks":
      return "Required tasks complete";
    default:
      return "Anytime";
  }
};

const ConnectionEdge: React.FC<EdgeProps<ConnectionData>> = (props) => {
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

  const [isHovered, setIsHovered] = useState(false);

  // Use smooth step path for better routing around other nodes
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8, // Rounded corners
    offset: 20, // Distance from source/target before turning
  });

  const transitionType = data?.transitionType || "manual";
  const config = getTransitionConfig(transitionType);
  const strokeColor = (style?.stroke as string) || config.color;
  const strokeWidth = (style?.strokeWidth as number) || 2;
  const IconComponent = config.icon;

  // Check if this edge supports inserting stages
  // Don't allow insert for phase-to-phase connections
  const isPhaseConnection = data?.isPhaseConnection;
  const canInsert = !!data?.onInsertStage && !isPhaseConnection;

  // For phase connections, create a unique marker ID based on the color
  const markerColor = isPhaseConnection ? strokeColor : config.color;
  const markerId = isPhaseConnection 
    ? `arrow-phase-${strokeColor?.replace('#', '')}` 
    : `arrow-${transitionType}`;

  return (
    <>
      {/* Custom arrow marker for phase connections with dynamic color */}
      {isPhaseConnection && (
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={markerColor} />
          </marker>
        </defs>
      )}
      
      {/* Invisible wider path for hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={60}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {/* Visible path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={3}
        markerEnd={`url(#${markerId})`}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            zIndex: 1000,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Insert Button - absolutely positioned above, only visible on hover */}
          {canInsert && isHovered && (
            <div
              style={{
                position: "absolute",
                top: -38,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1,
              }}
            >
              <Tooltip title="Insert stage here" placement="top">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    data?.onInsertStage?.(data.sourceId, data.targetId);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.12)";
                    e.currentTarget.style.border = "1px solid rgba(0, 0, 0, 0.35)";
                    e.currentTarget.style.transform = "scale(1.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.06)";
                    e.currentTarget.style.border = "1px dashed rgba(0, 0, 0, 0.25)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "rgba(0, 0, 0, 0.06)",
                    border: "1px dashed rgba(0, 0, 0, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    padding: 0,
                  }}
                >
                  <Plus size={12} style={{ color: "rgba(0, 0, 0, 0.45)" }} />
                </button>
              </Tooltip>
            </div>
          )}

          {/* Transition Type Icon - always centered and always clickable */}
          <Tooltip
            title={
              <div style={{ fontSize: 11 }}>
                <div>
                  <strong>{config.label} Transition</strong>
                </div>
                {data?.trigger && <div>{getTriggerLabel(data.trigger)}</div>}
                {data?.approvers && <div>👤 {data.approvers}</div>}
                {data?.bots && <div>🤖 {data.bots}</div>}
                <div style={{ marginTop: 4, color: "#aaa" }}>Click to edit</div>
              </div>
            }
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                data?.onEdgeClick?.(data);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#fff",
                border: `2px solid ${config.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                transition: "all 0.15s ease",
                padding: 0,
                position: "relative",
                zIndex: 2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
              }}
            >
              <IconComponent size={16} style={{ color: config.color }} />
            </button>
          </Tooltip>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default ConnectionEdge;
