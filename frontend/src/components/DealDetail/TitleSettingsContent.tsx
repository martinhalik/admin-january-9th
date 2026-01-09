import React from "react";
import { Space, Typography, Input, Button, Tooltip, Checkbox, Tag, theme } from "antd";
import { RotateCcw } from "lucide-react";
import { computeDiff } from "../ContentEditor/utils";
import { TitleSettingsContentProps } from "./types";

const { Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

const TitleSettingsContent: React.FC<TitleSettingsContentProps> = ({
  title,
  galleryTitle,
  shortDescriptor,
  descriptor,
  originalTitle,
  originalGalleryTitle,
  originalShortDescriptor,
  originalDescriptor,
  isGalleryTitleAuto,
  isDescriptorAuto,
  onTitleChange,
  onGalleryTitleChange,
  onShortDescriptorChange,
  onDescriptorChange,
  onIsGalleryTitleAutoChange,
  onIsDescriptorAutoChange,
}) => {
  const { token } = useToken();

  // Helper to render diff with smart ordering
  const renderDiff = (diff: any) => {
    if (!diff || !diff.changes) return originalTitle;

    return diff.changes.map((change: any, index: number) => {
      if (change.type === "equal") {
        return <span key={index}>{change.value}</span>;
      } else if (change.type === "delete") {
        return (
          <span
            key={index}
            style={{
              backgroundColor: token.colorErrorBg,
              textDecoration: "line-through",
            }}
          >
            {change.value}
          </span>
        );
      } else if (change.type === "insert") {
        return (
          <span key={index} style={{ backgroundColor: token.colorSuccessBg }}>
            {change.value}
          </span>
        );
      }
      return null;
    });
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      {/* Main Title */}
      <div>
        <Text
          type="secondary"
          style={{ fontSize: 12, display: "block", marginBottom: 8 }}
        >
          Deal Title *
        </Text>
        <TextArea
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter deal title..."
          rows={3}
          style={{
            fontSize: 16,
            fontWeight: 500,
            width: "100%",
            resize: "none",
          }}
        />
        {title !== originalTitle && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 8px 8px 10px",
              background: token.colorBgLayout,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: 6,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                flexShrink: 0,
                lineHeight: 1.5,
                padding: "2px 0",
              }}
            >
              Original:
            </Text>
            <div
              style={{
                flex: 1,
                fontSize: 12,
                lineHeight: 1.5,
                padding: "2px 0",
              }}
            >
              {renderDiff(computeDiff(originalTitle, title))}
            </div>
            <Tooltip title="Revert to original">
              <Button
                size="small"
                icon={<RotateCcw size={14} />}
                onClick={() => onTitleChange(originalTitle)}
                style={{ flexShrink: 0, marginTop: -2 }}
              />
            </Tooltip>
          </div>
        )}
      </div>

      {/* Gallery Title */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              Gallery Title
            </Text>
            {!isGalleryTitleAuto && (
              <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                Custom
              </Tag>
            )}
          </div>
          <Checkbox
            checked={isGalleryTitleAuto}
            onChange={(e) => onIsGalleryTitleAutoChange(e.target.checked)}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Same as Title
            </Text>
          </Checkbox>
        </div>
        <TextArea
          value={galleryTitle}
          onChange={(e) => onGalleryTitleChange(e.target.value)}
          placeholder="Enter gallery title..."
          readOnly={isGalleryTitleAuto}
          rows={3}
          onClick={() => {
            if (isGalleryTitleAuto) {
              onIsGalleryTitleAutoChange(false);
            }
          }}
          onBlur={() => {
            if (!isGalleryTitleAuto && galleryTitle === title) {
              onIsGalleryTitleAutoChange(true);
            }
          }}
          style={{
            cursor: isGalleryTitleAuto ? "pointer" : "text",
            backgroundColor: isGalleryTitleAuto
              ? token.colorBgContainerDisabled
              : undefined,
            color: isGalleryTitleAuto ? token.colorTextDisabled : undefined,
            resize: "none",
          }}
        />
        {!isGalleryTitleAuto &&
          galleryTitle !== title &&
          galleryTitle !==
            (originalGalleryTitle.length > 0
              ? originalGalleryTitle
              : title) && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 8px 8px 10px",
                background: token.colorBgLayout,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 6,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  flexShrink: 0,
                  lineHeight: 1.5,
                  padding: "2px 0",
                }}
              >
                Original:
              </Text>
              <div
                style={{
                  flex: 1,
                  fontSize: 12,
                  lineHeight: 1.5,
                  padding: "2px 0",
                }}
              >
                {renderDiff(
                  computeDiff(
                    originalGalleryTitle.length > 0
                      ? originalGalleryTitle
                      : title,
                    galleryTitle
                  )
                )}
              </div>
              <Tooltip title="Revert to original">
                <Button
                  size="small"
                  icon={<RotateCcw size={14} />}
                  onClick={() => onGalleryTitleChange(originalGalleryTitle)}
                  style={{ flexShrink: 0, marginTop: -2 }}
                />
              </Tooltip>
            </div>
          )}
      </div>

      {/* Descriptor */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              Descriptor
            </Text>
            {!isDescriptorAuto && (
              <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                Custom
              </Tag>
            )}
          </div>
          <Checkbox
            checked={isDescriptorAuto}
            onChange={(e) => onIsDescriptorAutoChange(e.target.checked)}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Same as Title
            </Text>
          </Checkbox>
        </div>
        <TextArea
          value={descriptor}
          onChange={(e) => onDescriptorChange(e.target.value)}
          placeholder="Enter descriptor..."
          readOnly={isDescriptorAuto}
          rows={3}
          onClick={() => {
            if (isDescriptorAuto) {
              onIsDescriptorAutoChange(false);
            }
          }}
          onBlur={() => {
            if (!isDescriptorAuto && descriptor === title) {
              onIsDescriptorAutoChange(true);
            }
          }}
          style={{
            cursor: isDescriptorAuto ? "pointer" : "text",
            backgroundColor: isDescriptorAuto
              ? token.colorBgContainerDisabled
              : undefined,
            color: isDescriptorAuto ? token.colorTextDisabled : undefined,
            resize: "none",
          }}
        />
        {!isDescriptorAuto &&
          descriptor !== title &&
          descriptor !==
            (originalDescriptor.length > 0 ? originalDescriptor : title) && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 8px 8px 10px",
                background: token.colorBgLayout,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 6,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  flexShrink: 0,
                  lineHeight: 1.5,
                  padding: "2px 0",
                }}
              >
                Original:
              </Text>
              <div
                style={{
                  flex: 1,
                  fontSize: 12,
                  lineHeight: 1.5,
                  padding: "2px 0",
                }}
              >
                {renderDiff(
                  computeDiff(
                    originalDescriptor.length > 0 ? originalDescriptor : title,
                    descriptor
                  )
                )}
              </div>
              <Tooltip title="Revert to original">
                <Button
                  size="small"
                  icon={<RotateCcw size={14} />}
                  onClick={() => onDescriptorChange(originalDescriptor)}
                  style={{ flexShrink: 0, marginTop: -2 }}
                />
              </Tooltip>
            </div>
          )}
      </div>

      {/* Short Descriptor */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              Short Descriptor
            </Text>
            {shortDescriptor.length > 0 && (
              <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                Custom
              </Tag>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {shortDescriptor.length}/32
          </Text>
        </div>
        <Input
          value={shortDescriptor}
          onChange={(e) => onShortDescriptorChange(e.target.value)}
          placeholder="Enter short descriptor..."
          maxLength={32}
          style={{
            width: "100%",
          }}
        />
        {shortDescriptor !== originalShortDescriptor &&
          (originalShortDescriptor.length > 0 ||
            shortDescriptor.length > 0) && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 8px 8px 10px",
                background: token.colorBgLayout,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 6,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  flexShrink: 0,
                  lineHeight: 1.5,
                  padding: "2px 0",
                }}
              >
                Original:
              </Text>
              <div
                style={{
                  flex: 1,
                  fontSize: 12,
                  lineHeight: 1.5,
                  padding: "2px 0",
                }}
              >
                {renderDiff(
                  computeDiff(originalShortDescriptor, shortDescriptor)
                )}
              </div>
              <Tooltip title="Revert to original">
                <Button
                  size="small"
                  icon={<RotateCcw size={14} />}
                  onClick={() =>
                    onShortDescriptorChange(originalShortDescriptor)
                  }
                  style={{ flexShrink: 0, marginTop: -2 }}
                />
              </Tooltip>
            </div>
          )}
      </div>
    </Space>
  );
};

export default TitleSettingsContent;

