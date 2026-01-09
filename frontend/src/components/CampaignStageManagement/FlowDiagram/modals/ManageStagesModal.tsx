import React from "react";
import { Modal, Space, Typography, Divider, Button } from "antd";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { StageData, StageRow as StageRowType } from "../types";

const { Text } = Typography;

interface ManageStagesModalProps {
  open: boolean;
  draftStages: StageData[];
  wonStages: StageData[];
  onCancel: () => void;
  onMoveStage: (row: StageRowType, stageId: string, direction: "up" | "down") => void;
  onDeleteStage: (row: StageRowType, stageId: string) => void;
}

const StageRowItem: React.FC<{
  stage: StageData;
  index: number;
  totalCount: number;
  row: StageRowType;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
}> = ({ stage, index, totalCount, row, onMove, onDelete }) => {
  const IconComp = (LucideIcons as any)[stage.icon];
  const isLast = stage.isEnd;
  const isNextEnd = index === totalCount - 2 && row === "won";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",
        background: isLast ? "#f6ffed" : "#fafafa",
        borderRadius: 8,
        border: `1px solid ${isLast ? "#b7eb8f" : "#f0f0f0"}`,
        opacity: isLast ? 0.8 : 1,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Button
          type="text"
          size="small"
          icon={<ChevronUp size={14} />}
          disabled={index === 0 || isLast}
          onClick={() => onMove("up")}
          style={{ padding: 0, height: 18 }}
        />
        <Button
          type="text"
          size="small"
          icon={<ChevronDown size={14} />}
          disabled={index === totalCount - 1 || isLast || isNextEnd}
          onClick={() => onMove("down")}
          style={{ padding: 0, height: 18 }}
        />
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: `${stage.color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: stage.color,
        }}
      >
        {IconComp && <IconComp size={14} />}
      </div>
      <Text style={{ flex: 1 }}>{stage.label}</Text>
      {isLast && (
        <Text type="secondary" style={{ fontSize: 10 }}>
          FINAL
        </Text>
      )}
      <Text type="secondary" style={{ fontSize: 11 }}>
        #{index + 1}
      </Text>
      <Button
        type="text"
        size="small"
        danger
        icon={<Trash2 size={14} />}
        disabled={isLast}
        onClick={onDelete}
      />
    </div>
  );
};

const ManageStagesModal: React.FC<ManageStagesModalProps> = ({
  open,
  draftStages,
  wonStages,
  onCancel,
  onMoveStage,
  onDeleteStage,
}) => {
  return (
    <Modal
      title="Manage Stages"
      open={open}
      onCancel={onCancel}
      footer={<Button onClick={onCancel}>Done</Button>}
      width={500}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        {/* Draft Stages */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#1890ff" }} />
            <Text strong>Draft Stages</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({draftStages.length})
            </Text>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {draftStages.map((stage, index) => (
              <StageRowItem
                key={stage.id}
                stage={stage}
                index={index}
                totalCount={draftStages.length}
                row="draft"
                onMove={(dir) => onMoveStage("draft", stage.id, dir)}
                onDelete={() => onDeleteStage("draft", stage.id)}
              />
            ))}
          </div>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Won Stages */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#52c41a" }} />
            <Text strong>Won Stages</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({wonStages.length})
            </Text>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {wonStages.map((stage, index) => (
              <StageRowItem
                key={stage.id}
                stage={stage}
                index={index}
                totalCount={wonStages.length}
                row="won"
                onMove={(dir) => onMoveStage("won", stage.id, dir)}
                onDelete={() => onDeleteStage("won", stage.id)}
              />
            ))}
          </div>
        </div>
      </Space>
    </Modal>
  );
};

export default ManageStagesModal;

