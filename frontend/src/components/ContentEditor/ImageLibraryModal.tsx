import React, { useState } from "react";
import {
  Modal,
  Tabs,
  Row,
  Col,
  Input,
  Button,
  Upload,
  Image,
  message,
  theme,
  Tag,
} from "antd";
import {
  Search,
  Upload as UploadIcon,
  CheckCircle,
  Square,
  Eye,
  GripVertical,
} from "lucide-react";
import type { UploadProps } from "antd";

const { useToken } = theme;

interface LibraryItem {
  id: string;
  url: string;
  caption?: string;
  source: "merchant" | "stock" | "previous";
  tags?: string[];
  uploadedAt?: string;
}

interface ImageLibraryModalProps {
  visible: boolean;
  onSelect: (imageUrls: string[]) => void;
  onCancel: () => void;
}

const ImageLibraryModal: React.FC<ImageLibraryModalProps> = ({
  visible,
  onSelect,
  onCancel,
}) => {
  const { token } = useToken();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("merchant");
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Mock library items (in production, fetch from API)
  const [libraryItems] = useState<LibraryItem[]>([
    {
      id: "lib1",
      url: "/images/restaurant-interior.jpg",
      caption: "Restaurant interior",
      source: "merchant",
      tags: ["interior", "restaurant"],
      uploadedAt: "2024-01-15",
    },
    {
      id: "lib2",
      url: "/images/steak-dinner.jpg",
      caption: "Signature steak dinner",
      source: "merchant",
      tags: ["food", "steak", "dinner"],
      uploadedAt: "2024-01-14",
    },
    {
      id: "lib3",
      url: "/images/pasta-dish.jpg",
      caption: "Fresh pasta",
      source: "merchant",
      tags: ["food", "pasta"],
      uploadedAt: "2024-01-13",
    },
    {
      id: "lib4",
      url: "/images/pizza.jpg",
      caption: "Wood-fired pizza",
      source: "merchant",
      tags: ["food", "pizza"],
      uploadedAt: "2024-01-12",
    },
    {
      id: "lib5",
      url: "/images/burger-fries.jpg",
      caption: "Classic burger and fries",
      source: "merchant",
      tags: ["food", "burger"],
      uploadedAt: "2024-01-11",
    },
    {
      id: "lib6",
      url: "/images/fresh-salad.jpg",
      caption: "Fresh garden salad",
      source: "merchant",
      tags: ["food", "salad", "healthy"],
      uploadedAt: "2024-01-10",
    },
  ]);

  const [uploadedImages, setUploadedImages] = useState<LibraryItem[]>([]);

  const filteredLibraryItems = [...uploadedImages, ...libraryItems].filter(
    (item) => {
      const matchesSearch =
        item.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesTab = activeTab === "all" || item.source === activeTab;
      return matchesSearch && matchesTab;
    }
  );

  const handleToggleSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleInsert = () => {
    const selectedUrls = filteredLibraryItems
      .filter((item) => selectedItems.includes(item.id))
      .map((item) => item.url);

    if (selectedUrls.length === 0) {
      message.warning("Please select at least one image");
      return;
    }

    onSelect(selectedUrls);
    setSelectedItems([]);
    message.success(`${selectedUrls.length} image(s) inserted!`);
  };

  const handleCancel = () => {
    setSelectedItems([]);
    setSearchQuery("");
    onCancel();
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("You can only upload image files!");
        return false;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: LibraryItem = {
          id: `upload_${Date.now()}_${Math.random()}`,
          url: e.target?.result as string,
          caption: file.name,
          source: "merchant",
          tags: ["uploaded"],
          uploadedAt: new Date().toISOString().split("T")[0],
        };

        setUploadedImages((prev) => [newImage, ...prev]);
        message.success(`${file.name} uploaded successfully!`);
      };
      reader.readAsDataURL(file);
      return false;
    },
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    // Set drag effect
    e.dataTransfer.effectAllowed = "move";
    // Set minimal data for compatibility
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (draggedItemId && draggedItemId !== itemId) {
      setDragOverItemId(itemId);
    }
  };

  const handleDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();

    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    // Reorder the items
    const allItems = [...uploadedImages, ...libraryItems];
    const draggedIndex = allItems.findIndex(
      (item) => item.id === draggedItemId
    );
    const targetIndex = allItems.findIndex((item) => item.id === targetItemId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newItems = [...allItems];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, removed);

      // Update the uploaded images (if the dragged item was uploaded)
      const uploadedIds = uploadedImages.map((img) => img.id);
      const newUploadedImages = newItems.filter((item) =>
        uploadedIds.includes(item.id)
      ) as LibraryItem[];

      setUploadedImages(newUploadedImages);
      message.success("Images reordered");
    }

    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  return (
    <>
      <Modal
        title="Insert Image from Library"
        open={visible}
        onCancel={handleCancel}
        width={1000}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="insert"
            type="primary"
            onClick={handleInsert}
            disabled={selectedItems.length === 0}
          >
            Insert {selectedItems.length > 0 ? selectedItems.length : ""} Image
            {selectedItems.length !== 1 ? "s" : ""}
          </Button>,
        ]}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "merchant",
              label: "Merchant Library",
              children: (
                <div>
                  {/* Upload Area */}
                  <Upload {...uploadProps}>
                    <div
                      style={{
                        border: `2px dashed ${token.colorBorder}`,
                        borderRadius: 8,
                        padding: 32,
                        textAlign: "center",
                        marginBottom: 24,
                        cursor: "pointer",
                        transition: "all 0.3s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = token.colorPrimary;
                        e.currentTarget.style.background = token.colorPrimaryBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = token.colorBorder;
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <UploadIcon
                        size={48}
                        color={token.colorPrimary}
                        style={{ marginBottom: 16 }}
                      />
                      <div style={{ fontSize: 16, marginBottom: 8 }}>
                        Click or drag images to upload
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: token.colorTextSecondary,
                        }}
                      >
                        Support for multiple images at once
                      </div>
                    </div>
                  </Upload>

                  {/* Search */}
                  <Input
                    placeholder="Search images..."
                    prefix={<Search size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ marginBottom: 16 }}
                  />

                  {/* Drag hint */}
                  <div
                    style={{
                      fontSize: 12,
                      color: token.colorTextSecondary,
                      marginBottom: 12,
                      padding: "8px 12px",
                      background: token.colorInfoBg,
                      borderRadius: 6,
                      border: `1px solid ${token.colorInfoBorder}`,
                    }}
                  >
                    💡 <strong>Tip:</strong> Drag images to reorder them in your
                    library
                  </div>

                  {/* Image Grid */}
                  <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    <Row gutter={[16, 16]}>
                      {filteredLibraryItems.map((item) => {
                        const isDragging = draggedItemId === item.id;
                        const isDragOver = dragOverItemId === item.id;
                        const isHovered = hoveredItemId === item.id;

                        return (
                          <Col span={6} key={item.id}>
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, item.id)}
                              onDragEnd={handleDragEnd}
                              onDragOver={(e) => handleDragOver(e, item.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, item.id)}
                              onMouseEnter={() => setHoveredItemId(item.id)}
                              onMouseLeave={() => setHoveredItemId(null)}
                              style={{
                                position: "relative",
                                cursor: isDragging ? "grabbing" : "grab",
                                border: selectedItems.includes(item.id)
                                  ? `3px solid ${token.colorPrimary}`
                                  : "3px solid transparent",
                                borderRadius: 8,
                                overflow: "hidden",
                                transition: "all 0.2s",
                                opacity: isDragging ? 0.5 : 1,
                                transform: isDragOver
                                  ? "scale(0.95)"
                                  : "scale(1)",
                                boxShadow: isDragOver
                                  ? `0 0 0 3px ${token.colorPrimary}, 0 4px 12px rgba(0,0,0,0.15)`
                                  : isHovered
                                  ? "0 2px 8px rgba(0,0,0,0.1)"
                                  : "none",
                                backgroundColor: isDragOver
                                  ? token.colorPrimaryBg
                                  : "transparent",
                              }}
                            >
                              <div
                                style={{
                                  position: "relative",
                                  paddingBottom: "100%",
                                  background: "#f0f0f0",
                                }}
                              >
                                <img
                                  src={item.url}
                                  alt={item.caption}
                                  draggable={false}
                                  style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    pointerEvents: "none",
                                    userSelect: "none",
                                  }}
                                />

                                {/* Drag Handle Indicator */}
                                {isHovered && !isDragging && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%, -50%)",
                                      background: "rgba(0, 0, 0, 0.7)",
                                      borderRadius: "50%",
                                      width: 48,
                                      height: 48,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      pointerEvents: "none",
                                      transition: "all 0.2s",
                                      animation: "fadeIn 0.2s",
                                    }}
                                  >
                                    <GripVertical size={24} color="white" />
                                  </div>
                                )}

                                {/* Selection Overlay */}
                                {selectedItems.includes(item.id) && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      background: "rgba(24, 144, 255, 0.2)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <CheckCircle
                                      size={48}
                                      color="white"
                                      fill={token.colorPrimary}
                                    />
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    display: "flex",
                                    gap: 8,
                                  }}
                                >
                                  <Button
                                    size="small"
                                    type={
                                      selectedItems.includes(item.id)
                                        ? "primary"
                                        : "default"
                                    }
                                    icon={<Square size={14} />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSelection(item.id);
                                    }}
                                    style={{
                                      background: selectedItems.includes(
                                        item.id
                                      )
                                        ? token.colorPrimary
                                        : "rgba(255, 255, 255, 0.9)",
                                      border: "none",
                                      color: selectedItems.includes(item.id)
                                        ? "white"
                                        : "black",
                                    }}
                                  />
                                  <Button
                                    size="small"
                                    icon={<Eye size={14} />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewItem(item);
                                    }}
                                    style={{
                                      background: "rgba(255, 255, 255, 0.9)",
                                      border: "none",
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Caption */}
                              <div
                                style={{
                                  padding: "8px 12px",
                                  background: "white",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    marginBottom: 4,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {item.caption}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: token.colorTextSecondary,
                                  }}
                                >
                                  {item.uploadedAt}
                                </div>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>

                    {filteredLibraryItems.length === 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: 48,
                          color: token.colorTextSecondary,
                        }}
                      >
                        No images found
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={previewItem !== null}
        footer={null}
        onCancel={() => setPreviewItem(null)}
        width="80vw"
        style={{ maxWidth: 1200 }}
      >
        {previewItem && (
          <div>
            <Image
              src={previewItem.url}
              alt={previewItem.caption}
              style={{ width: "100%" }}
              preview={false}
            />
            <div style={{ marginTop: 16 }}>
              <h3>{previewItem.caption}</h3>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {previewItem.tags?.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ImageLibraryModal;
