import React from "react";
import { Input, Tabs, Button, Typography, Checkbox, theme, message, Tag, Tooltip } from "antd";
import { Upload as UploadIcon, Search, Eye } from "lucide-react";

const { Text } = Typography;
const { useToken } = theme;

interface LibraryData {
  items: Array<{
    id: string;
    url: string;
    type: "image" | "video";
    source: string;
    caption?: string;
    score?: number;
    scoreReason?: string;
  }>;
  selectedIds: string[];
  onSelectItems: (ids: string[]) => void;
}

interface LibrarySidebarContentProps {
  libraryData: LibraryData;
  libraryTab: string;
  setLibraryTab: (tab: string) => void;
  librarySearch: string;
  setLibrarySearch: (search: string) => void;
  libraryMediaType: "image" | "video";
  onCancel: () => void;
  onAddItems: () => void;
  onUpdateSelection: (selectedIds: string[]) => void;
}

const LibrarySidebarContent: React.FC<LibrarySidebarContentProps> = ({
  libraryData,
  libraryTab,
  setLibraryTab,
  librarySearch,
  setLibrarySearch,
  libraryMediaType,
  onCancel,
  onAddItems,
  onUpdateSelection,
}) => {
  const { token } = useToken();

  const filteredItems = libraryData.items.filter((item: any) => {
    // Filter by media type (image vs video)
    if (libraryMediaType === "image" && item.type !== "image") {
      return false;
    }
    if (libraryMediaType === "video" && item.type !== "video") {
      return false;
    }

    // Filter by tab
    if (libraryTab === "merchant" && item.source !== "merchant") {
      return false;
    } else if (libraryTab === "stock" && item.source !== "stock") {
      return false;
    } else if (libraryTab === "ai" && item.source !== "ai") {
      return false;
    } else if (libraryTab === "website" && item.source !== "website") {
      return false;
    } else if (libraryTab === "previous" && item.source !== "previous") {
      return false;
    }

    // Filter by search
    if (librarySearch) {
      const searchLower = librarySearch.toLowerCase();
      return (
        item.caption?.toLowerCase().includes(searchLower) ||
        item.source?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 220px)",
        padding: `${token.paddingLG}px ${token.paddingLG}px ${token.paddingLG}px ${token.paddingLG}px`,
      }}
    >
      {/* Upload Area */}
      <div
        style={{
          padding: token.padding,
          border: `2px dashed ${token.colorBorder}`,
          borderRadius: token.borderRadius,
          textAlign: "center",
          marginBottom: token.marginSM,
          cursor: "pointer",
          background: token.colorBgLayout,
        }}
        onClick={() => {
          message.info("Upload functionality - coming soon");
        }}
      >
        <UploadIcon size={20} style={{ marginBottom: 4 }} />
        <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
          click or drag {libraryMediaType === "video" ? "videos" : "images"} to upload
        </Text>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={libraryTab}
        onChange={setLibraryTab}
        size="small"
        items={[
          { label: "Merchant", key: "merchant" },
          { label: "Stock", key: "stock" },
          { label: "AI", key: "ai" },
          { label: "Website", key: "website" },
          { label: "Previous", key: "previous" },
        ]}
        style={{ marginBottom: token.marginSM }}
      />

      {/* Search */}
      <Input
        placeholder={`Search ${libraryMediaType === "video" ? "videos" : "images"}...`}
        prefix={<Search size={14} />}
        value={librarySearch}
        onChange={(e) => setLibrarySearch(e.target.value)}
        style={{ marginBottom: token.marginSM }}
        allowClear
      />

      {/* Library Items Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: token.marginXS,
          flex: 1,
          overflowY: "auto",
          paddingBottom: token.paddingXS,
          alignContent: "start",
        }}
      >
        {filteredItems.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "40px 20px",
            }}
          >
            <Text type="secondary">
              {librarySearch
                ? `No ${libraryMediaType === "video" ? "videos" : "images"} found matching "${librarySearch}"`
                : `No ${libraryMediaType === "video" ? "videos" : "images"} in ${libraryTab} library`}
            </Text>
          </div>
        ) : (
          filteredItems.map((item: any) => {
            const isSelected = libraryData.selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                className="library-item-hover"
                style={{
                  position: "relative",
                  cursor: "pointer",
                  border: isSelected
                    ? `2px solid ${token.colorPrimary}`
                    : `1px solid ${token.colorBorder}`,
                  borderRadius: 8,
                  overflow: "hidden",
                  transition: "all 0.2s",
                  width: "100%",
                  paddingBottom: "100%",
                  height: 0,
                }}
                onClick={() => {
                  const newSelection = isSelected
                    ? libraryData.selectedIds.filter((id: string) => id !== item.id)
                    : [...libraryData.selectedIds, item.id];
                  onUpdateSelection(newSelection);
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={item.caption || "Library item"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <video
                      src={item.url}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}

                  {/* Checkbox - Top Left - Only show when at least one item is selected */}
                  {libraryData.selectedIds.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Checkbox checked={isSelected} />
                    </div>
                  )}

                  {/* Image Score Tag - Top Right */}
                  {item.score !== undefined && (
                    <Tooltip title={item.scoreReason || "Image quality score"} placement="topRight">
                      <Tag
                        color={
                          item.score >= 90 ? "green" :
                          item.score >= 80 ? "blue" :
                          item.score >= 70 ? "orange" : "volcano"
                        }
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          fontWeight: 600,
                          fontSize: 11,
                          cursor: "help",
                          zIndex: 10,
                        }}
                      >
                        {item.score}
                      </Tag>
                    </Tooltip>
                  )}

                  {/* Preview Icon - Bottom Right - Only show on hover */}
                  <div
                    className="library-preview-icon"
                    style={{
                      position: "absolute",
                      bottom: 6,
                      right: 6,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(0, 0, 0, 0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      cursor: "pointer",
                      opacity: 0,
                      transition: "opacity 0.2s",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      message.info("Preview functionality - coming soon");
                    }}
                  >
                    <Eye size={16} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Button block onClick={onCancel}>
          Cancel
        </Button>
        <Button type="primary" block onClick={onAddItems}>
          Add ({libraryData.selectedIds.length})
        </Button>
      </div>
    </div>
  );
};

export default LibrarySidebarContent;

