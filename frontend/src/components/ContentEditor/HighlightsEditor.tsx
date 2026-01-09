import { useState } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
  Button,
  Input,
  theme,
  Tooltip,
} from "antd";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { HighlightItem } from "./types";
import { computeDiff } from "./utils";

const { Text } = Typography;
const { useToken } = theme;

interface HighlightsEditorProps {
  highlights: HighlightItem[];
  originalHighlights: HighlightItem[];
  onHighlightsChange: (highlights: HighlightItem[]) => void;
}

const HighlightsEditor = ({
  highlights,
  originalHighlights,
  onHighlightsChange,
}: HighlightsEditorProps) => {
  const { token } = useToken();
  const [isAddingHighlight, setIsAddingHighlight] = useState(false);

  // Helper to find original highlight by id
  const getOriginalHighlight = (id: string) => {
    return originalHighlights.find((h) => h.id === id);
  };

  // Check if a highlight has changed
  const hasHighlightChanged = (highlight: HighlightItem) => {
    const original = getOriginalHighlight(highlight.id);
    return original && original.text !== highlight.text;
  };

  // Check if highlights array has structural changes
  const hasStructuralChanges =
    highlights.length !== originalHighlights.length ||
    highlights.some((h) => !originalHighlights.find((o) => o.id === h.id));

  const handleHighlightChange = (index: number, text: string) => {
    const newHighlights = [...highlights];
    newHighlights[index].text = text;
    onHighlightsChange(newHighlights);
  };

  const handleRemoveHighlight = (id: string) => {
    onHighlightsChange(highlights.filter((h) => h.id !== id));
  };

  const handleAddHighlight = (text: string) => {
    if (text.trim()) {
      onHighlightsChange([
        ...highlights,
        {
          id: Date.now().toString(),
          text,
          icon: "✓",
        },
      ]);
    }
    setIsAddingHighlight(false);
  };

  const handleRevertHighlight = (id: string) => {
    const original = getOriginalHighlight(id);
    if (original) {
      const newHighlights = highlights.map((h) =>
        h.id === id ? { ...h, text: original.text } : h
      );
      onHighlightsChange(newHighlights);
    }
  };

  const handleRevertAll = () => {
    onHighlightsChange([...originalHighlights]);
  };

  const hasAnyChanges =
    hasStructuralChanges || highlights.some((h) => hasHighlightChanged(h));

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text strong>What to Expect</Text>
          <Tag>{highlights.length} highlights</Tag>
          {hasAnyChanges && (
            <Tooltip title="Highlights have been modified">
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: token.colorWarning,
                }}
              />
            </Tooltip>
          )}
        </div>
      }
      extra={
        <Space>
          {hasAnyChanges && (
            <Tooltip title="Revert all highlights">
              <Button
                size="small"
                icon={<RotateCcw size={14} />}
                onClick={handleRevertAll}
              >
                Revert All
              </Button>
            </Tooltip>
          )}
          <Button
            icon={<Plus size={16} />}
            onClick={() => setIsAddingHighlight(true)}
          >
            Add Highlight
          </Button>
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {highlights.map((highlight, index) => {
          const isChanged = hasHighlightChanged(highlight);
          const original = getOriginalHighlight(highlight.id);
          const isNew = !original;

          return (
            <div key={highlight.id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "8px 12px",
                  background: isNew
                    ? token.colorSuccessBg
                    : token.colorBgLayout,
                  borderRadius: 6,
                  border: isNew
                    ? `1px solid ${token.colorSuccessBorder}`
                    : "none",
                }}
              >
                <Text style={{ fontSize: 16 }}>{highlight.icon}</Text>
                <Input
                  value={highlight.text}
                  onChange={(e) => handleHighlightChange(index, e.target.value)}
                  variant="borderless"
                  style={{ flex: 1 }}
                />
                {isChanged && (
                  <Tooltip title="Revert to original">
                    <Button
                      type="text"
                      size="small"
                      icon={<RotateCcw size={14} />}
                      onClick={() => handleRevertHighlight(highlight.id)}
                    />
                  </Tooltip>
                )}
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<Trash2 size={14} />}
                  onClick={() => handleRemoveHighlight(highlight.id)}
                />
              </div>
              {isChanged && original && (
                <div
                  style={{
                    marginTop: 4,
                    marginLeft: 32,
                    padding: "6px 10px",
                    background: token.colorBgLayout,
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, marginRight: 8 }}
                  >
                    Original:
                  </Text>
                  {computeDiff(original.text, highlight.text).map(
                    (part, idx) => {
                      if (part.type === "same") {
                        return (
                          <span
                            key={idx}
                            style={{ color: token.colorTextDescription }}
                          >
                            {part.text}
                          </span>
                        );
                      } else if (part.type === "removed") {
                        return (
                          <span
                            key={idx}
                            style={{
                              color: token.colorErrorText,
                              backgroundColor: token.colorErrorBg,
                              padding: "1px 2px",
                              borderRadius: 2,
                            }}
                          >
                            {part.text}
                          </span>
                        );
                      } else {
                        return (
                          <span
                            key={idx}
                            style={{
                              color: token.colorSuccessText,
                              backgroundColor: token.colorSuccessBg,
                              padding: "1px 2px",
                              borderRadius: 2,
                              fontWeight: 500,
                            }}
                          >
                            {part.text}
                          </span>
                        );
                      }
                    }
                  )}
                </div>
              )}
            </div>
          );
        })}
        {isAddingHighlight && (
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "8px 12px",
              background: token.colorPrimaryBg,
              borderRadius: 6,
              border: `2px dashed ${token.colorPrimary}`,
            }}
          >
            <Text style={{ fontSize: 16 }}>✓</Text>
            <Input
              placeholder="Enter new highlight..."
              autoFocus
              onBlur={(e) => handleAddHighlight(e.target.value)}
              onPressEnter={(e) => handleAddHighlight(e.currentTarget.value)}
              variant="borderless"
            />
          </div>
        )}
      </Space>
    </Card>
  );
};

export default HighlightsEditor;
