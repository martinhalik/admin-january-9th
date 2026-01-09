import { useState } from "react";
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  theme,
  Tooltip,
  Drawer,
  List,
  Tag,
  Modal,
} from "antd";
import { RotateCcw, History, Eye, Save } from "lucide-react";
import { HighlightVersion } from "./types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

interface HighlightsSettingsEditorProps {
  highlights: string;
  originalHighlights: string;
  onHighlightsChange: (highlights: string) => void;
  versions?: HighlightVersion[];
  onSaveVersion?: (content: string, label?: string) => void;
}

const HighlightsSettingsEditor = ({
  highlights,
  originalHighlights,
  onHighlightsChange,
  versions = [],
  onSaveVersion,
}: HighlightsSettingsEditorProps) => {
  const { token } = useToken();
  const maxLength = 140;
  const hasChanges = highlights !== originalHighlights;

  const [showHistory, setShowHistory] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<HighlightVersion | null>(
    null
  );
  const [showSaveVersionModal, setShowSaveVersionModal] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");

  const handleRevertAll = () => {
    onHighlightsChange(originalHighlights);
  };

  const handleSaveVersion = () => {
    if (onSaveVersion) {
      onSaveVersion(highlights, versionLabel || undefined);
      setVersionLabel("");
      setShowSaveVersionModal(false);
    }
  };

  const handlePreviewVersion = (version: HighlightVersion) => {
    setPreviewVersion(version);
  };

  const handleRestoreVersion = (version: HighlightVersion) => {
    Modal.confirm({
      title: "Restore this version?",
      content:
        "Your current highlights will be saved as a new version before restoring.",
      okText: "Restore",
      cancelText: "Cancel",
      onOk: () => {
        // Save current content before restoring
        if (onSaveVersion && highlights !== version.content) {
          onSaveVersion(highlights, "Before restore");
        }
        onHighlightsChange(version.content);
        setShowHistory(false);
      },
    });
  };

  return (
    <>
      <Card
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text strong>Highlights</Text>
            <Space size="small">
              {hasChanges && (
                <Tooltip title="Revert changes">
                  <Button
                    size="small"
                    icon={<RotateCcw size={14} />}
                    onClick={handleRevertAll}
                    type="text"
                  />
                </Tooltip>
              )}
              {versions.length > 0 && (
                <Tooltip title="View version history">
                  <Button
                    size="small"
                    type="text"
                    icon={<History size={14} />}
                    onClick={() => setShowHistory(true)}
                  >
                    {versions.length}{" "}
                    {versions.length === 1 ? "version" : "versions"}
                  </Button>
                </Tooltip>
              )}
              {onSaveVersion && (
                <Tooltip title="Save current version">
                  <Button
                    size="small"
                    type="text"
                    icon={<Save size={14} />}
                    onClick={() => setShowSaveVersionModal(true)}
                  >
                    Save Version
                  </Button>
                </Tooltip>
              )}
            </Space>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <TextArea
            value={highlights}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= maxLength) {
                onHighlightsChange(value);
              }
            }}
            placeholder="Enter highlights text (max 140 characters)..."
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={maxLength}
            showCount
            style={{
              border: hasChanges
                ? `1px solid ${token.colorWarning}`
                : `1px solid ${token.colorBorder}`,
            }}
          />
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginTop: 4 }}
          >
            Plain text only. Maximum {maxLength} characters.
          </Text>
        </Space>
      </Card>

      {/* Version History Drawer */}
      <Drawer
        title="Version History"
        placement="right"
        width={500}
        open={showHistory}
        onClose={() => setShowHistory(false)}
      >
        <List
          dataSource={[...versions].reverse()}
          renderItem={(version) => (
            <List.Item
              key={version.id}
              actions={[
                <Button
                  key="preview"
                  type="link"
                  size="small"
                  icon={<Eye size={14} />}
                  onClick={() => handlePreviewVersion(version)}
                >
                  Preview
                </Button>,
                <Button
                  key="restore"
                  type="link"
                  size="small"
                  onClick={() => handleRestoreVersion(version)}
                >
                  Restore
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {version.label && <Tag color="blue">{version.label}</Tag>}
                    <Text>
                      {dayjs(version.timestamp).format("MMM D, YYYY h:mm A")}
                    </Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">By {version.author}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(version.timestamp).fromNow()}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Preview Modal */}
      <Modal
        title="Preview Version"
        open={!!previewVersion}
        onCancel={() => setPreviewVersion(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewVersion(null)}>
            Close
          </Button>,
          <Button
            key="restore"
            type="primary"
            onClick={() => {
              if (previewVersion) {
                handleRestoreVersion(previewVersion);
                setPreviewVersion(null);
              }
            }}
          >
            Restore This Version
          </Button>,
        ]}
        width={600}
      >
        {previewVersion && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              {previewVersion.label && (
                <Tag color="blue">{previewVersion.label}</Tag>
              )}
              <Text type="secondary">
                {dayjs(previewVersion.timestamp).format("MMM D, YYYY h:mm A")}
              </Text>
              <Text type="secondary">By {previewVersion.author}</Text>
            </Space>
            <div
              style={{
                padding: 16,
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 8,
                whiteSpace: "pre-wrap",
              }}
            >
              {previewVersion.content}
            </div>
          </div>
        )}
      </Modal>

      {/* Save Version Modal */}
      <Modal
        title="Save Version"
        open={showSaveVersionModal}
        onOk={handleSaveVersion}
        onCancel={() => {
          setShowSaveVersionModal(false);
          setVersionLabel("");
        }}
        okText="Save"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>
            Add an optional label to help identify this version later:
          </Text>
          <Input
            placeholder="e.g., Final draft, Marketing approved"
            value={versionLabel}
            onChange={(e) => setVersionLabel(e.target.value)}
            maxLength={50}
          />
        </Space>
      </Modal>
    </>
  );
};

export default HighlightsSettingsEditor;
