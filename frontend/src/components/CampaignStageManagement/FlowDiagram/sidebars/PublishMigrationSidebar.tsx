import React, { useState, useEffect } from "react";
import { Typography, Space, Select, Button, Alert, Divider, Card, Tag, Empty } from "antd";
import { AlertTriangle, ArrowRight, Upload, Check } from "lucide-react";
import { StageData } from "../types";
import RightSidebar from "../../../RightSidebar";

const { Text, Title } = Typography;

interface DeletedStage {
  id: string;
  name: string;
}

interface PublishMigrationSidebarProps {
  open: boolean;
  deletedStages: DeletedStage[];
  currentStages: StageData[];
  onClose: () => void;
  onPublish: (stageMappings: Record<string, string>) => void;
  width?: number;
}

const PublishMigrationSidebar: React.FC<PublishMigrationSidebarProps> = ({
  open,
  deletedStages,
  currentStages,
  onClose,
  onPublish,
  width = 420,
}) => {
  // State for stage mappings (deleted stage ID -> new stage ID)
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isPublishing, setIsPublishing] = useState(false);

  // Reset mappings when sidebar opens
  useEffect(() => {
    if (open) {
      setMappings({});
      setIsPublishing(false);
    }
  }, [open]);

  // Filter out deleted stages from current stages (for mapping options)
  const availableStages = currentStages.filter(
    s => !deletedStages.some(d => d.id === s.id)
  );

  const handleMappingChange = (deletedId: string, newId: string) => {
    setMappings(prev => ({
      ...prev,
      [deletedId]: newId,
    }));
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish(mappings);
      onClose();
    } catch (error) {
      console.error("Failed to publish:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Check if all deleted stages have mappings
  const allMapped = deletedStages.every(d => mappings[d.id]);
  const hasDeletedStages = deletedStages.length > 0;

  return (
    <RightSidebar
      open={open}
      title={
        <Space>
          <Upload size={18} />
          <span>Publish Workflow</span>
        </Space>
      }
      onClose={onClose}
      width={width}
      topOffset={64}
    >
      <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column" }}>
        {hasDeletedStages ? (
          <>
            <Alert
              type="warning"
              icon={<AlertTriangle size={16} />}
              message="Stage Migration Required"
              description="Some stages have been removed. Deals in these stages need to be migrated to new stages."
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Title level={5} style={{ marginBottom: 16 }}>
              Map Deleted Stages
            </Title>
            <Text type="secondary" style={{ marginBottom: 16, display: "block" }}>
              Select where deals from each deleted stage should be moved to:
            </Text>

            <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
              {deletedStages.map(deleted => (
                <Card
                  key={deleted.id}
                  size="small"
                  style={{ marginBottom: 12 }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Space>
                      <Tag color="red">{deleted.name}</Tag>
                      <ArrowRight size={14} style={{ color: "#999" }} />
                      {mappings[deleted.id] ? (
                        <Tag color="green">
                          {availableStages.find(s => s.id === mappings[deleted.id])?.label || "Selected"}
                        </Tag>
                      ) : (
                        <Tag>Not mapped</Tag>
                      )}
                    </Space>
                    <Select
                      style={{ width: "100%" }}
                      placeholder="Select destination stage"
                      value={mappings[deleted.id]}
                      onChange={(value) => handleMappingChange(deleted.id, value)}
                      options={availableStages.map(stage => ({
                        value: stage.id,
                        label: (
                          <Space>
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: stage.color,
                              }}
                            />
                            {stage.label}
                          </Space>
                        ),
                      }))}
                    />
                  </Space>
                </Card>
              ))}
            </div>

            {!allMapped && (
              <Alert
                type="info"
                message="All deleted stages must be mapped before publishing"
                style={{ marginBottom: 16 }}
              />
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Empty
              image={<Check size={48} style={{ color: "#52c41a" }} />}
              description={
                <Space direction="vertical" size={4}>
                  <Text strong>No Migration Needed</Text>
                  <Text type="secondary">
                    Your workflow changes don't require any stage migrations.
                  </Text>
                </Space>
              }
            />
          </div>
        )}

        <Divider style={{ margin: "16px 0" }} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<Upload size={14} />}
            onClick={handlePublish}
            loading={isPublishing}
            disabled={hasDeletedStages && !allMapped}
          >
            {hasDeletedStages ? "Publish & Migrate" : "Publish"}
          </Button>
        </div>
      </div>
    </RightSidebar>
  );
};

export default PublishMigrationSidebar;














