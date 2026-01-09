import React from "react";
import { EdgeProps, getBezierPath } from "reactflow";

const StateEdge: React.FC<EdgeProps> = (props) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
  } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke={(style?.stroke as string) || "#ff4d4f"}
      strokeWidth={1.5}
      strokeDasharray="5,5"
      opacity={0.6}
    />
  );
};

export default StateEdge;















