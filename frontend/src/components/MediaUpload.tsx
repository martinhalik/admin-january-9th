import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  Button,
  Upload,
  Image,
  Row,
  Col,
  message,
  Tag,
  Modal,
  Tabs,
  Input,
  Select,
  Progress,
  theme,
  Typography,
  Badge,
  Checkbox,
  Tooltip,
} from "antd";
import {
  Plus,
  Upload as UploadIcon,
  Image as ImageIcon,
  Video,
  Search,
  Star,
  Download,
  Wand2,
  Globe,
  X as XIcon,
  Eye,
  Move,
  ChevronLeft,
  ChevronRight,
  X,
  Edit3,
} from "lucide-react";
import type { UploadProps } from "antd";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { mediaLibraryItems } from "../data/mediaLibrary";

const { Text } = Typography;
const { useToken } = theme;

import { MediaItem } from "../data/mockDeals";

interface LibraryItem {
  id: string;
  url: string;
  caption?: string;
  source: "previous" | "stock" | "merchant" | "ai" | "website";
  dealId?: string;
  dealTitle?: string;
  tags?: string[];
  uploadedAt?: string;
  type: "image" | "video";
}

// Sortable Media Item Component
const SortableMediaItem = ({
  media,
  onRemove,
  onSetFeatured: _onSetFeatured,
  onOpenPreview,
  isFeatured = false,
  isSelected = false,
  onSelect,
}: {
  media: MediaItem;
  onRemove: () => void;
  onSetFeatured: () => void;
  onOpenPreview: () => void;
  isFeatured?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.id });

  const style = {
    // Let items move naturally to show where drop will happen
    transform: CSS.Transform.toString(transform),
    transition,
    // Dim the item being dragged, but keep visible
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        // Visual feedback: highlight the item being dragged
        ...(isDragging && {
          borderRadius: "8px",
          backgroundColor: "rgba(24, 144, 255, 0.08)",
        }),
      }}
      className="media-item"
      onMouseEnter={(e) => {
        setIsHovered(true);
        const overlay = e.currentTarget.querySelector(
          ".media-overlay"
        ) as HTMLElement;
        if (overlay) overlay.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        const overlay = e.currentTarget.querySelector(
          ".media-overlay"
        ) as HTMLElement;
        if (overlay) overlay.style.opacity = "0";
      }}
    >
      <div style={{ position: "relative", flex: 1, display: "flex" }}>
        {media.type === "image" ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              cursor: "default",
              position: "relative",
            }}
          >
            <Image
              src={media.url}
              alt="Media"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              wrapperStyle={{
                width: "100%",
                height: "100%",
                display: "block",
              }}
              preview={false}
              onError={(e) => {
                console.error("Failed to load image:", media.url);
                e.currentTarget.style.display = "none";
              }}
            />
            
            {/* Image Score Tag with Tooltip - Top Right */}
            {media.score !== undefined && (
              <Tooltip title={media.scoreReason || "Image quality score"} placement="top">
                <Tag
                  color={
                    media.score >= 90 ? "green" :
                    media.score >= 80 ? "blue" :
                    media.score >= 70 ? "orange" : "volcano"
                  }
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    fontWeight: 600,
                    zIndex: 15,
                    transition: "all 0.2s ease",
                    cursor: "help",
                  }}
                >
                  {media.score}
                </Tag>
              </Tooltip>
            )}

            {/* Preview Eye Icon - Bottom Right */}
            <div
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                background: "rgba(0, 0, 0, 0.6)",
                borderRadius: "50%",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                zIndex: 15,
                cursor: "pointer",
              }}
              className="preview-icon"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPreview();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Eye size={16} color="white" />
            </div>
          </div>
        ) : (
          <video
            src={media.url}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            controls
          />
        )}

        {/* Upload Progress Overlay */}
        {media.uploadProgress !== undefined && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.8)",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 20,
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
                color: "white",
                padding: "20px",
                textAlign: "center",
              }}
            >
              {/* Upload Icon with Animation */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulse 2s infinite",
                }}
              >
                <UploadIcon size={24} color="white" />
              </div>

              {/* Progress Text */}
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                  Uploading...
                </div>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
                  {media.uploadProgress}% complete
                </div>
              </div>

              {/* Progress Bar */}
              <Progress
                percent={media.uploadProgress}
                strokeColor={{
                  "0%": "#667eea",
                  "50%": "#764ba2",
                  "100%": "#f093fb",
                }}
                style={{ width: 160 }}
                showInfo={false}
                strokeWidth={6}
                trailColor="rgba(255, 255, 255, 0.2)"
              />
            </div>
          </div>
        )}

        {/* Selection checkbox - visible on hover or when selected */}
        {(isHovered || isSelected) && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              zIndex: 25,
              transition: "opacity 0.2s",
              pointerEvents: "auto",
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Checkbox
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect?.();
              }}
            />
          </div>
        )}

        {/* Featured tag */}
        {isFeatured && (
          <Tag
            color="green"
            style={{
              position: "absolute",
              top: 8,
              left: 40,
              fontWeight: 600,
              zIndex: 10,
              transition: "all 0.2s ease",
            }}
          >
            FEATURED
          </Tag>
        )}

        {/* Hover overlay with drag and select controls */}
        <div
          className="media-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transition: "opacity 0.2s",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          {/* Drag Handle - Only this area is draggable */}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 10,
              pointerEvents: "auto",
            }}
            {...attributes}
            {...listeners}
          >
            <Button
              size="small"
              icon={<Move size={14} />}
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                border: "none",
                color: "black",
                cursor: "move",
              }}
            />
          </div>

          {/* Remove Button */}
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              zIndex: 10,
              pointerEvents: "auto",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Button
              size="small"
              danger
              icon={<XIcon size={14} />}
              style={{
                background: "rgba(255, 77, 79, 0.9)",
                border: "none",
                color: "white",
              }}
              title="Remove from deal"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface MediaUploadProps {
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
  reels: MediaItem[];
  onReelsChange: (reels: MediaItem[]) => void;
  onOpenLibrary?: (libraryData: {
    items: LibraryItem[];
    onSelectItems: (selectedIds: string[]) => void;
    selectedIds: string[];
    mediaType: "image" | "video";
  }) => void;
  changeCount?: number;
}

// Export LibraryItem type for use in parent components
export type { LibraryItem };

const MediaUpload = ({
  media,
  onMediaChange,
  reels,
  onReelsChange,
  onOpenLibrary: onOpenLibraryProp,
  changeCount = 0,
}: MediaUploadProps) => {
  const { token } = useToken();

  // Use refs to track current state for batching multiple uploads
  const mediaRef = useRef(media);
  const reelsRef = useRef(reels);

  // Update refs when props change
  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  useEffect(() => {
    reelsRef.current = reels;
  }, [reels]);

  // Add CSS animation for upload progress and responsive grid
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes dragPulse {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.02); opacity: 1; }
        100% { transform: scale(1); opacity: 0.8; }
      }
      
      @keyframes dragGlow {
        0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4); }
        50% { box-shadow: 0 0 0 8px rgba(24, 144, 255, 0.1); }
        100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4); }
      }
      
      .preview-icon {
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      .media-item:hover .preview-icon {
        opacity: 1 !important;
      }
      
      .drag-over {
        animation: dragPulse 1.5s infinite, dragGlow 2s infinite;
        border-color: #1890ff !important;
        background: rgba(24, 144, 255, 0.05) !important;
        transform: scale(1.02);
      }
      
      .drag-over .upload-icon {
        animation: pulse 1s infinite;
      }
      
      /* Custom drag preview styling */
      .sortable-ghost {
        opacity: 0.3;
        transform: scale(0.95);
        z-index: 1;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        transition: all 0.2s ease;
      }
      
      .sortable-chosen {
        opacity: 0.6;
        transform: scale(0.98);
        z-index: 1;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
      }
      
      /* Ensure dragged item doesn't completely disappear */
      [data-sortable-id] {
        transition: all 0.2s ease;
      }
      
      /* Ensure drag preview maintains the rounded corners and proper aspect ratio */
      .sortable-ghost .media-item {
        border-radius: 8px;
        overflow: hidden;
      }
      
      .sortable-ghost img,
      .sortable-ghost video {
        border-radius: 8px;
        object-fit: cover;
      }
      
      @media (max-width: 768px) {
        .media-grid {
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important;
        }
      }
      
      @media (max-width: 480px) {
        .media-grid {
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)) !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(true);
  const [selectedLibraryItems, setSelectedLibraryItems] = useState<string[]>(
    []
  );
  const [initiallySelectedItems, setInitiallySelectedItems] = useState<
    string[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("merchant");
  const [selectedMediaItems, setSelectedMediaItems] = useState<string[]>([]);
  const [mediaFilter, setMediaFilter] = useState<"all" | "photos" | "videos">(
    "all"
  );

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editingCaption, setEditingCaption] = useState("");

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverArea, setDragOverArea] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Use shared library data - allow updates for newly uploaded items
  const [libraryItems, setLibraryItems] =
    useState<LibraryItem[]>(mediaLibraryItems);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDndDragOver = (event: any) => {
    const { over } = event;
    setOverId(over?.id || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (over && active.id !== over.id) {
      const currentMedia = [...media];
      const oldIndex = currentMedia.findIndex(
        (item: MediaItem) => item.id === active.id
      );
      const newIndex = currentMedia.findIndex(
        (item: MediaItem) => item.id === over.id
      );
      const newMedia = arrayMove(currentMedia, oldIndex, newIndex);

      // Preserve featured status during reorder
      onMediaChange(newMedia);
      message.success("Media order updated!");
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent, area: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    setDragOverArea(area);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragOverArea(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, _area: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverArea(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Process files using the same logic as the upload component
      files.forEach((file) => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          message.error("You can only upload image or video files!");
          return;
        }

        // Create preview URL immediately
        const previewUrl = URL.createObjectURL(file);

        const newMedia: MediaItem = {
          id: Date.now().toString() + Math.random(),
          url: previewUrl,
          source: "upload",
          uploadProgress: 0,
          type: isImage ? "image" : "video",
        };

        // If it's a video, add to reels automatically
        if (isVideo) {
          const updatedReels = [...reelsRef.current, newMedia];
          reelsRef.current = updatedReels;
          onReelsChange(updatedReels);
        } else {
          const updatedMedia = [...mediaRef.current, newMedia];
          mediaRef.current = updatedMedia;
          onMediaChange(updatedMedia);
        }

        // Simulate upload progress with smooth animation
        const reader = new FileReader();
        reader.onload = (e) => {
          let progress = 0;
          const updateProgress = () => {
            const increment = progress < 20 ? 8 : progress < 80 ? 4 : 2;
            progress = Math.min(progress + increment, 100);

            if (isVideo) {
              const updatedReels = reelsRef.current.map((r: MediaItem) =>
                r.id === newMedia.id ? { ...r, uploadProgress: progress } : r
              );
              reelsRef.current = updatedReels;
              onReelsChange(updatedReels);
            } else {
              const updatedMedia = mediaRef.current.map((m: MediaItem) =>
                m.id === newMedia.id ? { ...m, uploadProgress: progress } : m
              );
              mediaRef.current = updatedMedia;
              onMediaChange(updatedMedia);
            }

            if (progress >= 100) {
              setTimeout(() => {
                URL.revokeObjectURL(previewUrl);

                const finalMedia = {
                  ...newMedia,
                  url: e.target?.result as string,
                  uploadProgress: undefined,
                };

                if (isVideo) {
                  const updatedReels = reelsRef.current.map((r: MediaItem) =>
                    r.id === newMedia.id ? finalMedia : r
                  );
                  reelsRef.current = updatedReels;
                  onReelsChange(updatedReels);
                  message.success({
                    content: "Video uploaded and added to reels!",
                    duration: 3,
                    style: { marginTop: "20vh" },
                  });
                } else {
                  const updatedMedia = mediaRef.current.map((m: MediaItem) =>
                    m.id === newMedia.id ? finalMedia : m
                  );
                  mediaRef.current = updatedMedia;
                  onMediaChange(updatedMedia);

                  // Add to merchant library
                  const libraryItem: LibraryItem = {
                    id: `lib_${Date.now()}`,
                    url: finalMedia.url,
                    caption: "Uploaded image",
                    source: "merchant",
                    tags: ["uploaded", "restaurant"],
                    uploadedAt: new Date().toISOString().split("T")[0],
                    type: "image",
                  };
                  setLibraryItems((prev) => [libraryItem, ...prev]);

                  message.success({
                    content: "Image uploaded successfully!",
                    duration: 3,
                    style: { marginTop: "20vh" },
                  });
                }
              }, 500);
            } else {
              setTimeout(updateProgress, 150);
            }
          };

          updateProgress();
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        message.error("You can only upload image or video files!");
        return false;
      }

      // Create preview URL immediately
      const previewUrl = URL.createObjectURL(file);

      const newMedia: MediaItem = {
        id: Date.now().toString(),
        url: previewUrl, // Show image immediately
        source: "upload",
        uploadProgress: 0,
        type: isImage ? "image" : "video",
      };

      // If it's a video, add to reels automatically
      if (isVideo) {
        const updatedReels = [...reelsRef.current, newMedia];
        reelsRef.current = updatedReels;
        onReelsChange(updatedReels);
      } else {
        const updatedMedia = [...mediaRef.current, newMedia];
        mediaRef.current = updatedMedia;
        onMediaChange(updatedMedia);
      }

      // Simulate upload progress with smooth animation
      const reader = new FileReader();
      reader.onload = (e) => {
        let progress = 0;
        const updateProgress = () => {
          // Smooth progress animation - starts fast, slows down
          const increment = progress < 20 ? 8 : progress < 80 ? 4 : 2;
          progress = Math.min(progress + increment, 100);

          if (isVideo) {
            const updatedReels = reelsRef.current.map((r: MediaItem) =>
              r.id === newMedia.id ? { ...r, uploadProgress: progress } : r
            );
            reelsRef.current = updatedReels;
            onReelsChange(updatedReels);
          } else {
            const updatedMedia = mediaRef.current.map((m: MediaItem) =>
              m.id === newMedia.id ? { ...m, uploadProgress: progress } : m
            );
            mediaRef.current = updatedMedia;
            onMediaChange(updatedMedia);
          }

          if (progress >= 100) {
            // Show completion state briefly before finishing
            setTimeout(() => {
              // Clean up preview URL
              URL.revokeObjectURL(previewUrl);

              const finalMedia = {
                ...newMedia,
                url: e.target?.result as string,
                uploadProgress: undefined,
              };

              if (isVideo) {
                const updatedReels = reelsRef.current.map((r: MediaItem) =>
                  r.id === newMedia.id ? finalMedia : r
                );
                reelsRef.current = updatedReels;
                onReelsChange(updatedReels);
                message.success({
                  content: "Video uploaded and added to reels!",
                  duration: 3,
                  style: { marginTop: "20vh" },
                });
              } else {
                const updatedMedia = mediaRef.current.map((m: MediaItem) =>
                  m.id === newMedia.id ? finalMedia : m
                );
                mediaRef.current = updatedMedia;
                onMediaChange(updatedMedia);

                // Add to merchant library
                const libraryItem: LibraryItem = {
                  id: `lib_${Date.now()}`,
                  url: finalMedia.url,
                  caption: "Uploaded image",
                  source: "merchant",
                  tags: ["uploaded", "restaurant"],
                  uploadedAt: new Date().toISOString().split("T")[0],
                  type: "image",
                };
                setLibraryItems((prev) => [libraryItem, ...prev]);

                message.success({
                  content: "Image uploaded successfully!",
                  duration: 3,
                  style: { marginTop: "20vh" },
                });
              }
            }, 500);
          } else {
            setTimeout(updateProgress, 150);
          }
        };

        updateProgress();
      };
      reader.readAsDataURL(file);
      return false;
    },
  };

  const handleSetFeatured = (id: string) => {
    onMediaChange(
      media.map((m) => ({
        ...m,
        isFeatured: m.id === id,
      }))
    );
    message.success("Featured media updated");
  };

  const handleRemoveMedia = (id: string) => {
    const removedItem = media.find((m) => m.id === id);
    const updatedMedia = media.filter((m) => m.id !== id);

    // If the removed item was featured and there are remaining items, make the first one featured
    if (removedItem?.isFeatured && updatedMedia.length > 0) {
      updatedMedia[0].isFeatured = true;
    }

    onMediaChange(updatedMedia);
    message.success("Media removed from deal");
  };

  const handleOpenPreview = (index: number) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
    setEditingCaption(media[index].caption || "");
    setIsEditingCaption(false);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setIsEditingCaption(false);

    // Clean up temporary preview media if it exists
    if ((window as any).previewCleanup) {
      (window as any).previewCleanup();
      (window as any).previewCleanup = null;
    }
  };

  const handleNextImage = () => {
    const nextIndex = (previewIndex + 1) % media.length;
    setPreviewIndex(nextIndex);
    setEditingCaption(media[nextIndex].caption || "");
    setIsEditingCaption(false);
  };

  const handlePrevImage = () => {
    const prevIndex = previewIndex === 0 ? media.length - 1 : previewIndex - 1;
    setPreviewIndex(prevIndex);
    setEditingCaption(media[prevIndex].caption || "");
    setIsEditingCaption(false);
  };

  const handleRemoveFromPreview = () => {
    const currentMedia = media[previewIndex];
    const updatedMedia = media.filter((m) => m.id !== currentMedia.id);

    // If the removed item was featured and there are remaining items, make the first one featured
    if (currentMedia?.isFeatured && updatedMedia.length > 0) {
      updatedMedia[0].isFeatured = true;
    }

    onMediaChange(updatedMedia);
    message.success("Media removed from deal");

    // Adjust preview index if needed
    if (previewIndex >= media.length - 1) {
      const newIndex = media.length - 2;
      if (newIndex >= 0) {
        setPreviewIndex(newIndex);
        setEditingCaption(media[newIndex].caption || "");
      } else {
        handleClosePreview();
        return;
      }
    }
  };

  const handleSaveCaption = () => {
    const currentMedia = media[previewIndex];
    onMediaChange(
      media.map((m) =>
        m.id === currentMedia.id ? { ...m, caption: editingCaption } : m
      )
    );
    setIsEditingCaption(false);
    message.success("Caption saved");
  };

  const handleSelectMediaItem = (id: string) => {
    if (selectedMediaItems.includes(id)) {
      setSelectedMediaItems(
        selectedMediaItems.filter((itemId) => itemId !== id)
      );
    } else {
      setSelectedMediaItems([...selectedMediaItems, id]);
    }
  };

  const handleRemoveSelectedMedia = () => {
    if (selectedMediaItems.length === 0) return;

    const removedFeaturedItem = media.find(
      (m) => selectedMediaItems.includes(m.id) && m.isFeatured
    );
    const updatedMedia = media.filter(
      (m) => !selectedMediaItems.includes(m.id)
    );

    // If a featured item was removed and there are remaining items, make the first one featured
    if (removedFeaturedItem && updatedMedia.length > 0) {
      updatedMedia[0].isFeatured = true;
    }

    onMediaChange(updatedMedia);
    setSelectedMediaItems([]);
    message.success(
      `${selectedMediaItems.length} media items removed from deal`
    );
  };

  const handleSelectMultipleFromLibrary = () => {
    // Items to add: newly selected items (not initially selected)
    const itemsToAdd = selectedLibraryItems.filter(
      (id) => !initiallySelectedItems.includes(id)
    );

    // Items to remove: initially selected items that are now deselected
    const itemsToRemove = initiallySelectedItems.filter(
      (id) => !selectedLibraryItems.includes(id)
    );

    // Handle additions
    if (itemsToAdd.length > 0) {
      const selectedItems = libraryItems.filter((item) =>
        itemsToAdd.includes(item.id)
      );

      const newMediaItems: MediaItem[] = [];
      const newReelItems: MediaItem[] = [];

      selectedItems.forEach((item) => {
        const newMedia: MediaItem = {
          id: Date.now().toString() + Math.random(),
          url: item.url,
          source: item.source === "previous" ? "previous" : "library",
          type: item.type,
        };

        if (item.type === "video") {
          newReelItems.push(newMedia);
        } else {
          newMediaItems.push(newMedia);
        }
      });

      if (newReelItems.length > 0) {
        const updatedReels = [...reelsRef.current, ...newReelItems];
        reelsRef.current = updatedReels;
        onReelsChange(updatedReels);
      }
      if (newMediaItems.length > 0) {
        const updatedMedia = [...mediaRef.current, ...newMediaItems];

        // If no media exists yet and none are featured, make the first one featured
        const hasFeatured = updatedMedia.some((m) => m.isFeatured);
        if (!hasFeatured && updatedMedia.length > 0) {
          updatedMedia[0].isFeatured = true;
        }

        mediaRef.current = updatedMedia;
        onMediaChange(updatedMedia);
      }
    }

    // Handle removals
    if (itemsToRemove.length > 0) {
      const itemsToRemoveUrls = libraryItems
        .filter((item) => itemsToRemove.includes(item.id))
        .map((item) => item.url);

      // Remove from media
      const updatedMedia = media.filter(
        (m) => !itemsToRemoveUrls.includes(m.url)
      );
      onMediaChange(updatedMedia);

      // Remove from reels
      const updatedReels = reels.filter(
        (r) => !itemsToRemoveUrls.includes(r.url)
      );
      onReelsChange(updatedReels);
    }

    setSelectedLibraryItems([]);
    setInitiallySelectedItems([]);
    setIsUploadModalOpen(false);

    // Show appropriate message
    if (itemsToAdd.length > 0 && itemsToRemove.length > 0) {
      message.success(
        `Added ${itemsToAdd.length} and removed ${itemsToRemove.length} items!`
      );
    } else if (itemsToAdd.length > 0) {
      message.success(`${itemsToAdd.length} items added from library!`);
    } else if (itemsToRemove.length > 0) {
      message.success(`${itemsToRemove.length} items removed!`);
    }
  };

  const handlePreviewLibraryItem = (item: LibraryItem) => {
    // Create a temporary media item for preview
    const tempMedia: MediaItem = {
      id: `preview_${item.id}`,
      url: item.url,
      caption: item.caption,
      type: item.type,
      source: "library",
    };

    // Add to media temporarily for preview
    const originalMedia = [...media];
    onMediaChange([...media, tempMedia]);
    setPreviewIndex(media.length); // Preview the newly added item
    setIsPreviewOpen(true);
    setEditingCaption(item.caption || "");
    setIsEditingCaption(false);

    // Clean up after preview closes
    const cleanup = () => {
      onMediaChange(originalMedia);
      setIsPreviewOpen(false);
    };

    // Store cleanup function for later use
    (window as any).previewCleanup = cleanup;
  };

  const filteredLibraryItems = libraryItems.filter((item) => {
    const matchesSearch =
      item.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Only apply filterType in Merchant Library tab
    const matchesFilter =
      activeTab !== "merchant" ||
      filterType === "all" ||
      item.source === filterType;

    // Apply media type filter (photos vs videos)
    const matchesMediaFilter =
      mediaFilter === "all" ||
      (mediaFilter === "photos" && item.type === "image") ||
      (mediaFilter === "videos" && item.type === "video");

    return matchesSearch && matchesFilter && matchesMediaFilter;
  });

  // Helper function to check if a library item is already added to the deal
  const isLibraryItemAlreadyAdded = (libraryItemUrl: string): boolean => {
    return [...media, ...reels].some(
      (mediaItem) => mediaItem.url === libraryItemUrl
    );
  };

  // Count selected items per category
  const getSelectedCountByCategory = (category: string): number => {
    return selectedLibraryItems.filter((id) => {
      const item = libraryItems.find((lib) => lib.id === id);
      return item?.source === category;
    }).length;
  };

  // Open modal and pre-select items that are already in use
  const handleOpenLibrary = (
    showUpload: boolean = true,
    mediaType: "image" | "video" = "image"
  ) => {
    // Find all library items that are currently in use
    const inUseItemIds = libraryItems
      .filter((libItem) => isLibraryItemAlreadyAdded(libItem.url))
      .map((libItem) => libItem.id);

    // If onOpenLibrary prop is provided, use universal sidebar instead
    if (onOpenLibraryProp) {
      setSelectedLibraryItems(inUseItemIds);
      setInitiallySelectedItems(inUseItemIds);
      onOpenLibraryProp({
        items: libraryItems,
        selectedIds: inUseItemIds,
        mediaType,
        onSelectItems: (newSelectedIds) => {
          // Process the selection changes directly
          const itemsToAdd = newSelectedIds.filter(
            (id) => !inUseItemIds.includes(id)
          );

          const itemsToRemove = inUseItemIds.filter(
            (id) => !newSelectedIds.includes(id)
          );

          // Handle additions
          if (itemsToAdd.length > 0) {
            const selectedItems = libraryItems.filter((item) =>
              itemsToAdd.includes(item.id)
            );

            const newMediaItems: MediaItem[] = [];
            const newReelItems: MediaItem[] = [];

            selectedItems.forEach((item) => {
              const newMedia: MediaItem = {
                id: Date.now().toString() + Math.random(),
                url: item.url,
                source: item.source === "previous" ? "previous" : "library",
                type: item.type,
              };

              if (item.type === "video") {
                newReelItems.push(newMedia);
              } else {
                newMediaItems.push(newMedia);
              }
            });

            if (newReelItems.length > 0) {
              const updatedReels = [...reelsRef.current, ...newReelItems];
              reelsRef.current = updatedReels;
              onReelsChange(updatedReels);
            }
            if (newMediaItems.length > 0) {
              const updatedMedia = [...mediaRef.current, ...newMediaItems];

              // If no media exists yet and none are featured, make the first one featured
              const hasFeatured = updatedMedia.some((m) => m.isFeatured);
              if (!hasFeatured && updatedMedia.length > 0) {
                updatedMedia[0].isFeatured = true;
              }

              mediaRef.current = updatedMedia;
              onMediaChange(updatedMedia);
            }

            message.success(
              `Added ${itemsToAdd.length} ${
                itemsToAdd.length === 1 ? "item" : "items"
              }`
            );
          }

          // Handle removals
          if (itemsToRemove.length > 0) {
            const itemsToRemoveUrls = libraryItems
              .filter((item) => itemsToRemove.includes(item.id))
              .map((item) => item.url);

            const updatedMedia = mediaRef.current.filter(
              (m) => !itemsToRemoveUrls.includes(m.url)
            );
            const updatedReels = reelsRef.current.filter(
              (r) => !itemsToRemoveUrls.includes(r.url)
            );

            mediaRef.current = updatedMedia;
            reelsRef.current = updatedReels;
            onMediaChange(updatedMedia);
            onReelsChange(updatedReels);

            message.success(
              `Removed ${itemsToRemove.length} ${
                itemsToRemove.length === 1 ? "item" : "items"
              }`
            );
          }

          if (itemsToAdd.length === 0 && itemsToRemove.length === 0) {
            message.info("No changes made");
          }
        },
      });
      return;
    }

    // Otherwise, use the old modal mode
    setSelectedLibraryItems(inUseItemIds);
    setInitiallySelectedItems(inUseItemIds);
    setShowUploadArea(showUpload);
    setIsUploadModalOpen(true);
  };

  const renderEmptyState = () => (
    <div
      className={isDragOver && dragOverArea === "main" ? "drag-over" : ""}
      style={{
        height: 300,
        border: `2px dashed ${token.colorBorder}`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: token.colorBgLayout,
        transition: "all 0.3s",
        width: "100%",
        gap: 12,
        padding: 24,
        cursor: "pointer",
      }}
      onDragEnter={(e) => handleDragEnter(e, "main")}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, "main")}
      onClick={() => {
        setActiveTab("merchant");
        setFilterType("merchant");
        setSearchQuery("");
        handleOpenLibrary(false, "image");
      }}
    >
      <ImageIcon
        size={48}
        color={token.colorTextTertiary}
        className="upload-icon"
      />
      <Text strong style={{ fontSize: 16, display: "block" }}>
        Upload Pictures
      </Text>
      <Button
        icon={<ImageIcon size={16} />}
        onClick={(e) => {
          e.stopPropagation();
          setActiveTab("merchant");
          setFilterType("merchant");
          setSearchQuery("");
          handleOpenLibrary(false, "image");
        }}
      >
        Add images
      </Button>
      <Text type="secondary" style={{ fontSize: 12, textAlign: "center" }}>
        Drop or add images
      </Text>
      <Text type="secondary" style={{ fontSize: 12, textAlign: "center" }}>
        By uploading, you confirm you have rights to use these images
      </Text>
    </div>
  );

  return (
    <div>
      {/* Media Section */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text strong>Media</Text>
            {changeCount > 0 && (
              <Tag color="orange" style={{ fontSize: 11 }}>
                {changeCount} {changeCount === 1 ? "change" : "changes"}
              </Tag>
            )}
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        {/* Featured Media and Reel Layout */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {/* Responsive Media Grid */}
          <Col xs={24} sm={24} md={16} lg={16} xl={16}>
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDndDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={media.map((m) => m.id)}
                strategy={rectSortingStrategy}
              >
                {media.length === 0 ? (
                  renderEmptyState()
                ) : (
                  <div
                    className="media-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 0,
                      alignItems: "start",
                      justifyContent: "center",
                    }}
                  >
                    {/* All Media Items in Responsive Grid */}
                    {media.map((mediaItem, index) => (
                      <div
                        key={mediaItem.id}
                        style={{
                          position: "relative",
                          gridColumn: index === 0 ? "span 2" : "span 1", // First item takes 2 columns
                          gridRow: index === 0 ? "span 2" : "span 1", // First item takes 2 rows
                          height: index === 0 ? 260 : 120,
                          margin: "8px",
                          border: `1px solid ${token.colorBorder}`,
                          borderRadius: 8,
                          overflow: "hidden",
                          background: token.colorBgContainer,
                        }}
                      >
                        <SortableMediaItem
                          media={mediaItem}
                          onRemove={() => handleRemoveMedia(mediaItem.id)}
                          onSetFeatured={() => handleSetFeatured(mediaItem.id)}
                          onOpenPreview={() => handleOpenPreview(index)}
                          isFeatured={!!mediaItem.isFeatured}
                          isSelected={selectedMediaItems.includes(mediaItem.id)}
                          onSelect={() => handleSelectMediaItem(mediaItem.id)}
                        />

                        {/* Ghost Preview Overlay - Positioned in parent, NOT transformed! */}
                        {overId === mediaItem.id &&
                          activeId &&
                          activeId !== mediaItem.id &&
                          (() => {
                            const draggedMedia = media.find(
                              (m) => m.id === activeId
                            );

                            return (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  pointerEvents: "none",
                                  zIndex: 999,
                                  borderRadius: "8px",
                                  overflow: "hidden",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "rgba(24, 144, 255, 0.3)",
                                  border: "3px solid #1890ff",
                                  boxShadow:
                                    "inset 0 0 30px rgba(24, 144, 255, 0.4), 0 0 10px rgba(24, 144, 255, 0.5)",
                                }}
                              >
                                {draggedMedia ? (
                                  <>
                                    {/* Semi-transparent preview of dragged image */}
                                    {draggedMedia.type === "image" ? (
                                      <img
                                        src={draggedMedia.url}
                                        alt="Drop preview"
                                        style={{
                                          position: "absolute",
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                          opacity: 0.6,
                                          zIndex: 1,
                                        }}
                                      />
                                    ) : (
                                      <video
                                        src={draggedMedia.url}
                                        style={{
                                          position: "absolute",
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                          opacity: 0.6,
                                          zIndex: 1,
                                        }}
                                        muted
                                      />
                                    )}
                                    {/* Drop here indicator on top */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        zIndex: 2,
                                        backgroundColor:
                                          "rgba(24, 144, 255, 0.85)",
                                        padding: "8px 16px",
                                        borderRadius: "6px",
                                        boxShadow: token.boxShadowSecondary,
                                      }}
                                    >
                                      <Typography.Text
                                        style={{
                                          color: "white",
                                          fontWeight: 600,
                                          fontSize: "14px",
                                        }}
                                      >
                                        Drop here
                                      </Typography.Text>
                                    </div>
                                  </>
                                ) : (
                                  <Typography.Text
                                    style={{
                                      color: "#1890ff",
                                      fontWeight: 600,
                                      fontSize: "16px",
                                      textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                                    }}
                                  >
                                    Drop here
                                  </Typography.Text>
                                )}
                              </div>
                            );
                          })()}
                      </div>
                    ))}

                    {/* Add New Placeholder */}
                    <div
                      style={{
                        position: "relative",
                        gridColumn: "span 1",
                        height: 120,
                        margin: "8px",
                        borderRadius: 8,
                        overflow: "hidden",
                        background: token.colorBgContainer,
                      }}
                    >
                      <div
                        className={
                          isDragOver && dragOverArea === "grid"
                            ? "drag-over"
                            : ""
                        }
                        style={{
                          height: "100%",
                          width: "100%",
                          border: `2px dashed ${token.colorBorder}`,
                          borderRadius: 8,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          background: token.colorBgLayout,
                          transition: "all 0.3s",
                          cursor: "pointer",
                        }}
                        onDragEnter={(e) => handleDragEnter(e, "grid")}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "grid")}
                        onClick={() => {
                          setActiveTab("merchant");
                          setFilterType("merchant");
                          setSearchQuery("");
                          handleOpenLibrary(false, "image");
                        }}
                      >
                        <Plus
                          size={32}
                          color={token.colorTextTertiary}
                          className="upload-icon"
                        />
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                            marginTop: 8,
                            textAlign: "center",
                          }}
                        >
                          Drop or add images
                        </Text>
                      </div>
                    </div>
                  </div>
                )}
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeId ? (
                  <div
                    style={{
                      width: 180,
                      height: 120,
                      borderRadius: 8,
                      overflow: "hidden",
                      boxShadow: token.boxShadowSecondary,
                      transform: "rotate(5deg)",
                      opacity: 0.8,
                      border: "2px solid #1890ff",
                    }}
                  >
                    {(() => {
                      const activeMedia = media.find((m) => m.id === activeId);
                      if (!activeMedia) return null;

                      return activeMedia.type === "image" ? (
                        <Image
                          src={activeMedia.url}
                          alt="Dragging"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          preview={false}
                        />
                      ) : (
                        <video
                          src={activeMedia.url}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          muted
                        />
                      );
                    })()}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </Col>

          {/* Reel */}
          <Col xs={24} sm={24} md={8} lg={8} xl={8}>
            {reels.length > 0 ? (
              <div style={{ position: "relative", height: 300 }}>
                <video
                  src={reels[0].url}
                  style={{
                    borderRadius: 8,
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                  }}
                  controls
                />
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 20,
                  }}
                >
                  <Button
                    size="small"
                    danger
                    icon={<XIcon size={14} />}
                    onClick={() => {
                      onReelsChange(reels.filter((r) => r.id !== reels[0].id));
                      message.success("Reel removed from deal");
                    }}
                    title="Remove reel from deal"
                  />
                </div>
              </div>
            ) : (
              <div
                className={
                  isDragOver && dragOverArea === "reel" ? "drag-over" : ""
                }
                style={{
                  height: 300,
                  border: `2px dashed ${token.colorBorder}`,
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: token.colorBgLayout,
                  transition: "all 0.3s",
                  gap: 12,
                  padding: 24,
                  cursor: "pointer",
                }}
                onDragEnter={(e) => handleDragEnter(e, "reel")}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "reel")}
                onClick={() => {
                  setActiveTab("merchant");
                  setFilterType("merchant");
                  setSearchQuery("");
                  handleOpenLibrary(true, "video");
                }}
              >
                <Video
                  size={48}
                  color={token.colorTextTertiary}
                  className="upload-icon"
                />
                <Text strong style={{ fontSize: 16, display: "block" }}>
                  Upload Reel
                </Text>
                <Button
                  icon={<Video size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("merchant");
                    setFilterType("merchant");
                    setSearchQuery("");
                    handleOpenLibrary(true, "video");
                  }}
                >
                  Add reel
                </Button>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, textAlign: "center" }}
                >
                  or drag and drop here
                </Text>
              </div>
            )}
          </Col>
        </Row>

        {/* Multi-selection Actions - Sticky at bottom */}
        {selectedMediaItems.length > 0 && (
          <div
            style={{
              position: "sticky",
              bottom: 0,
              marginTop: 16,
              padding: "12px 16px",
              background: token.colorBgElevated,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              boxShadow: token.boxShadow,
              zIndex: 10,
              borderTop: `1px solid ${token.colorBorder}`,
            }}
          >
            <Text strong style={{ fontSize: 14 }}>
              {selectedMediaItems.length}{" "}
              {selectedMediaItems.length === 1 ? "item" : "items"} selected
            </Text>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                danger
                icon={<XIcon size={14} />}
                onClick={handleRemoveSelectedMedia}
              >
                Remove Selected
              </Button>
              <Button onClick={() => setSelectedMediaItems([])}>
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Select Media"
        open={isUploadModalOpen}
        onCancel={() => {
          setIsUploadModalOpen(false);
          setSelectedLibraryItems([]);
          setInitiallySelectedItems([]);
        }}
        width={1000}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            padding: "24px",
          },
          header: {
            position: "sticky",
            top: 0,
            zIndex: 1000,
            background: token.colorBgElevated,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            marginBottom: 0,
            paddingBottom: 16,
          },
          footer: {
            position: "sticky",
            bottom: 0,
            zIndex: 1000,
            background: token.colorBgElevated,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            marginTop: 0,
            paddingTop: 16,
          },
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsUploadModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="done"
            type="primary"
            onClick={handleSelectMultipleFromLibrary}
            disabled={
              selectedLibraryItems.length === initiallySelectedItems.length &&
              selectedLibraryItems.every((id) =>
                initiallySelectedItems.includes(id)
              )
            }
          >
            {(() => {
              const itemsToAdd = selectedLibraryItems.filter(
                (id) => !initiallySelectedItems.includes(id)
              );
              const itemsToRemove = initiallySelectedItems.filter(
                (id) => !selectedLibraryItems.includes(id)
              );

              if (itemsToAdd.length > 0 && itemsToRemove.length > 0) {
                return `Add ${itemsToAdd.length} & Remove ${itemsToRemove.length}`;
              } else if (itemsToRemove.length > 0) {
                return `Remove ${itemsToRemove.length} ${
                  itemsToRemove.length === 1 ? "image" : "images"
                }`;
              } else if (itemsToAdd.length > 0) {
                return `Add ${itemsToAdd.length} selected`;
              }
              return "No changes";
            })()}
          </Button>,
        ]}
      >
        {/* Common Upload Area - Conditionally Visible at Top */}
        {showUploadArea && (
          <div style={{ marginBottom: 24 }}>
            <Upload {...uploadProps} showUploadList={false}>
              <div
                className={
                  isDragOver && dragOverArea === "modal-upload"
                    ? "drag-over"
                    : ""
                }
                style={{
                  height: 120,
                  border: `2px dashed ${token.colorBorder}`,
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: token.colorBgLayout,
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  if (!isDragOver) {
                    e.currentTarget.style.borderColor = token.colorPrimary;
                    e.currentTarget.style.background = token.colorPrimaryBg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDragOver) {
                    e.currentTarget.style.borderColor = token.colorBorder;
                    e.currentTarget.style.background = token.colorBgLayout;
                  }
                }}
                onDragEnter={(e) => handleDragEnter(e, "modal-upload")}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "modal-upload")}
              >
                <UploadIcon
                  size={32}
                  color={token.colorTextTertiary}
                  className="upload-icon"
                />
                <Text
                  type="secondary"
                  style={{ fontSize: 16, display: "block", marginTop: 8 }}
                >
                  Drag and drop files here
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  or click to browse
                </Text>
              </div>
            </Upload>
          </div>
        )}

        {/* Tabs for Different Media Sources */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setSearchQuery(""); // Clear search when switching tabs
          }}
          items={[
            {
              key: "merchant",
              label: (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Star size={14} />
                  Merchant Library
                  {getSelectedCountByCategory("merchant") > 0 && (
                    <Badge
                      count={getSelectedCountByCategory("merchant")}
                      style={{
                        backgroundColor: token.colorPrimary,
                        marginLeft: 4,
                      }}
                    />
                  )}
                </span>
              ),
              children: (
                <div>
                  <div
                    style={{
                      marginBottom: 16,
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <Input
                      placeholder="Search photos..."
                      prefix={<Search size={14} />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <Select
                      value={filterType}
                      onChange={setFilterType}
                      style={{ width: 120 }}
                      options={[
                        { value: "all", label: "All" },
                        { value: "merchant", label: "Merchant" },
                        { value: "previous", label: "Previous" },
                      ]}
                    />
                  </div>

                  {/* Modern Segmented Filter */}
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        background: token.colorFillSecondary,
                        borderRadius: 8,
                        padding: 4,
                        width: "fit-content",
                      }}
                    >
                      {[
                        { key: "all", label: "All Media", icon: null },
                        {
                          key: "photos",
                          label: "Photos",
                          icon: <ImageIcon size={14} />,
                        },
                        {
                          key: "videos",
                          label: "Videos",
                          icon: <Video size={14} />,
                        },
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() =>
                            setMediaFilter(
                              option.key as "all" | "photos" | "videos"
                            )
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: 6,
                            background:
                              mediaFilter === option.key
                                ? token.colorPrimary
                                : "transparent",
                            color:
                              mediaFilter === option.key
                                ? "white"
                                : token.colorText,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            fontWeight: 500,
                            fontSize: 14,
                            minWidth: 100,
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            if (mediaFilter !== option.key) {
                              e.currentTarget.style.background =
                                token.colorFillTertiary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (mediaFilter !== option.key) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Row gutter={[16, 16]}>
                    {filteredLibraryItems
                      .filter((item) => item.source === "merchant")
                      .map((item) => {
                        const isSelected = selectedLibraryItems.includes(
                          item.id
                        );
                        const isAlreadyAdded = isLibraryItemAlreadyAdded(
                          item.url
                        );

                        return (
                          <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
                            <div
                              style={{
                                position: "relative",
                                cursor: "pointer",
                                border: isSelected
                                  ? `2px solid ${token.colorPrimary}`
                                  : "2px solid transparent",
                                borderRadius: 8,
                                overflow: "hidden",
                                transition: "all 0.2s",
                                height: 160,
                                boxShadow: isSelected
                                  ? "0 4px 12px rgba(24, 144, 255, 0.2)"
                                  : "none",
                              }}
                              onMouseEnter={(e) => {
                                const overlay = e.currentTarget.querySelector(
                                  ".library-overlay"
                                ) as HTMLElement;
                                if (overlay) overlay.style.opacity = "1";
                              }}
                              onMouseLeave={(e) => {
                                const overlay = e.currentTarget.querySelector(
                                  ".library-overlay"
                                ) as HTMLElement;
                                if (overlay) overlay.style.opacity = "0";
                              }}
                              onClick={() => {
                                handlePreviewLibraryItem(item);
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  pointerEvents: "none",
                                }}
                              >
                                {item.type === "image" ? (
                                  <Image
                                    src={item.url}
                                    alt="Library item"
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                    preview={false}
                                  />
                                ) : (
                                  <video
                                    src={item.url}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                    muted
                                    preload="metadata"
                                  />
                                )}
                              </div>

                              {/* Checkbox - Always visible in top-left corner */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: 8,
                                  left: 8,
                                  zIndex: 20,
                                  pointerEvents: "auto",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      setSelectedLibraryItems(
                                        selectedLibraryItems.filter(
                                          (id) => id !== item.id
                                        )
                                      );
                                    } else {
                                      setSelectedLibraryItems([
                                        ...selectedLibraryItems,
                                        item.id,
                                      ]);
                                    }
                                  }}
                                />
                              </div>

                              {/* Already Added Indicator */}
                              {isAlreadyAdded && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    zIndex: 10,
                                  }}
                                >
                                  <Tag
                                    color="success"
                                    style={{
                                      margin: 0,
                                      fontWeight: 600,
                                      fontSize: 11,
                                      boxShadow: token.boxShadow,
                                    }}
                                  >
                                    IN USE
                                  </Tag>
                                </div>
                              )}

                              {/* Hover overlay for preview */}
                              <div
                                className="library-overlay"
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: "rgba(0, 0, 0, 0.3)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: 0,
                                  transition: "opacity 0.2s",
                                  zIndex: 5,
                                  pointerEvents: "none",
                                }}
                              >
                                {/* Preview Icon */}
                                <div
                                  style={{
                                    background: "rgba(255, 255, 255, 0.9)",
                                    borderRadius: "50%",
                                    width: 40,
                                    height: 40,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Eye size={20} color={token.colorText} />
                                </div>
                              </div>

                              {/* Bottom info overlay */}
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  background:
                                    "linear-gradient(transparent, rgba(0,0,0,0.7))",
                                  color: "white",
                                  padding: "8px",
                                  fontSize: 12,
                                  zIndex: 10,
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  {item.type === "video" && <Video size={12} />}
                                  {item.source === "merchant"
                                    ? "Merchant Library"
                                    : item.source}
                                </div>
                                <div>{item.uploadedAt}</div>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                  </Row>
                </div>
              ),
            },
            {
              key: "stock",
              label: (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Download size={14} />
                  Stock Pictures
                  {getSelectedCountByCategory("stock") > 0 && (
                    <Badge
                      count={getSelectedCountByCategory("stock")}
                      style={{
                        backgroundColor: token.colorPrimary,
                        marginLeft: 4,
                      }}
                    />
                  )}
                </span>
              ),
              children: (
                <div>
                  <div
                    style={{
                      marginBottom: 16,
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <Input
                      placeholder="Search stock photos..."
                      prefix={<Search size={14} />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>

                  {/* Modern Segmented Filter */}
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        background: token.colorFillSecondary,
                        borderRadius: 8,
                        padding: 4,
                        width: "fit-content",
                      }}
                    >
                      {[
                        { key: "all", label: "All Media", icon: null },
                        {
                          key: "photos",
                          label: "Photos",
                          icon: <ImageIcon size={14} />,
                        },
                        {
                          key: "videos",
                          label: "Videos",
                          icon: <Video size={14} />,
                        },
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() =>
                            setMediaFilter(
                              option.key as "all" | "photos" | "videos"
                            )
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: 6,
                            background:
                              mediaFilter === option.key
                                ? token.colorPrimary
                                : "transparent",
                            color:
                              mediaFilter === option.key
                                ? "white"
                                : token.colorText,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            fontWeight: 500,
                            fontSize: 14,
                            minWidth: 100,
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            if (mediaFilter !== option.key) {
                              e.currentTarget.style.background =
                                token.colorFillTertiary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (mediaFilter !== option.key) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Row gutter={[16, 16]}>
                    {filteredLibraryItems
                      .filter((item) => item.source === "stock")
                      .map((item) => {
                        const isSelected = selectedLibraryItems.includes(
                          item.id
                        );
                        const isAlreadyAdded = isLibraryItemAlreadyAdded(
                          item.url
                        );

                        return (
                          <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
                            <div
                              style={{
                                position: "relative",
                                cursor: "pointer",
                                border: isSelected
                                  ? `2px solid ${token.colorPrimary}`
                                  : "2px solid transparent",
                                borderRadius: 8,
                                overflow: "hidden",
                                transition: "all 0.2s",
                                height: 160,
                                boxShadow: isSelected
                                  ? "0 4px 12px rgba(24, 144, 255, 0.2)"
                                  : "none",
                              }}
                              onMouseEnter={(e) => {
                                const overlay = e.currentTarget.querySelector(
                                  ".library-overlay"
                                ) as HTMLElement;
                                if (overlay) overlay.style.opacity = "1";
                              }}
                              onMouseLeave={(e) => {
                                const overlay = e.currentTarget.querySelector(
                                  ".library-overlay"
                                ) as HTMLElement;
                                if (overlay) overlay.style.opacity = "0";
                              }}
                              onClick={() => {
                                handlePreviewLibraryItem(item);
                              }}
                            >
                              <Image
                                src={item.url}
                                alt="Stock photo"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                preview={false}
                              />

                              {/* Checkbox - Always visible in top-left corner */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: 8,
                                  left: 8,
                                  zIndex: 20,
                                  pointerEvents: "auto",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      setSelectedLibraryItems(
                                        selectedLibraryItems.filter(
                                          (id) => id !== item.id
                                        )
                                      );
                                    } else {
                                      setSelectedLibraryItems([
                                        ...selectedLibraryItems,
                                        item.id,
                                      ]);
                                    }
                                  }}
                                />
                              </div>

                              {/* Already Added Indicator */}
                              {isAlreadyAdded && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    zIndex: 10,
                                  }}
                                >
                                  <Tag
                                    color="success"
                                    style={{
                                      margin: 0,
                                      fontWeight: 600,
                                      fontSize: 11,
                                      boxShadow: token.boxShadow,
                                    }}
                                  >
                                    IN USE
                                  </Tag>
                                </div>
                              )}

                              {/* Hover overlay for preview */}
                              <div
                                className="library-overlay"
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: "rgba(0, 0, 0, 0.3)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: 0,
                                  transition: "opacity 0.2s",
                                  zIndex: 5,
                                  pointerEvents: "none",
                                }}
                              >
                                {/* Preview Icon */}
                                <div
                                  style={{
                                    background: "rgba(255, 255, 255, 0.9)",
                                    borderRadius: "50%",
                                    width: 40,
                                    height: 40,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Eye size={20} color={token.colorText} />
                                </div>
                              </div>

                              {/* Bottom info overlay */}
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  background:
                                    "linear-gradient(transparent, rgba(0,0,0,0.7))",
                                  color: "white",
                                  padding: "8px",
                                  fontSize: 12,
                                  zIndex: 10,
                                }}
                              >
                                <div style={{ fontWeight: 600 }}>
                                  Stock Photo
                                </div>
                                <div>{item.uploadedAt}</div>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                  </Row>
                </div>
              ),
            },
            {
              key: "ai",
              label: (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Wand2 size={14} />
                  AI Generated
                  {getSelectedCountByCategory("ai") > 0 && (
                    <Badge
                      count={getSelectedCountByCategory("ai")}
                      style={{
                        backgroundColor: token.colorPrimary,
                        marginLeft: 4,
                      }}
                    />
                  )}
                </span>
              ),
              children: (
                <div>
                  <div
                    style={{
                      marginBottom: 16,
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <Input
                      placeholder="Search AI generated images..."
                      prefix={<Search size={14} />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>

                  {/* Modern Segmented Filter */}
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        background: token.colorFillSecondary,
                        borderRadius: 8,
                        padding: 4,
                        width: "fit-content",
                      }}
                    >
                      {[
                        { key: "all", label: "All Media", icon: null },
                        {
                          key: "photos",
                          label: "Photos",
                          icon: <ImageIcon size={14} />,
                        },
                        {
                          key: "videos",
                          label: "Videos",
                          icon: <Video size={14} />,
                        },
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() =>
                            setMediaFilter(
                              option.key as "all" | "photos" | "videos"
                            )
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: 6,
                            background:
                              mediaFilter === option.key
                                ? token.colorPrimary
                                : "transparent",
                            color:
                              mediaFilter === option.key
                                ? "white"
                                : token.colorText,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            fontWeight: 500,
                            fontSize: 14,
                            minWidth: 100,
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            if (mediaFilter !== option.key) {
                              e.currentTarget.style.background =
                                token.colorFillTertiary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (mediaFilter !== option.key) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Row gutter={[16, 16]}>
                    {filteredLibraryItems
                      .filter((item) => item.source === "ai")
                      .map((item) => {
                        const isSelected = selectedLibraryItems.includes(
                          item.id
                        );
                        const isAlreadyAdded = isLibraryItemAlreadyAdded(
                          item.url
                        );

                        return (
                          <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
                            <div
                              style={{
                                position: "relative",
                                cursor: "pointer",
                                border: isSelected
                                  ? `2px solid ${token.colorPrimary}`
                                  : "2px solid transparent",
                                borderRadius: 8,
                                overflow: "hidden",
                                transition: "all 0.2s",
                                height: 160,
                                boxShadow: isSelected
                                  ? "0 4px 12px rgba(24, 144, 255, 0.2)"
                                  : "none",
                              }}
                              onMouseEnter={(e) => {
                                const overlay = e.currentTarget.querySelector(
                                  ".library-overlay"
                                ) as HTMLElement;
                                if (overlay) overlay.style.opacity = "1";
                              }}
                              onMouseLeave={(e) => {
                                const overlay = e.currentTarget.querySelector(
                                  ".library-overlay"
                                ) as HTMLElement;
                                if (overlay) overlay.style.opacity = "0";
                              }}
                              onClick={() => {
                                handlePreviewLibraryItem(item);
                              }}
                            >
                              <Image
                                src={item.url}
                                alt="AI Generated"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                preview={false}
                              />

                              {/* Checkbox - Always visible in top-left corner */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: 8,
                                  left: 8,
                                  zIndex: 20,
                                  pointerEvents: "auto",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      setSelectedLibraryItems(
                                        selectedLibraryItems.filter(
                                          (id) => id !== item.id
                                        )
                                      );
                                    } else {
                                      setSelectedLibraryItems([
                                        ...selectedLibraryItems,
                                        item.id,
                                      ]);
                                    }
                                  }}
                                />
                              </div>

                              {/* Already Added Indicator */}
                              {isAlreadyAdded && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    zIndex: 10,
                                  }}
                                >
                                  <Tag
                                    color="success"
                                    style={{
                                      margin: 0,
                                      fontWeight: 600,
                                      fontSize: 11,
                                      boxShadow: token.boxShadow,
                                    }}
                                  >
                                    IN USE
                                  </Tag>
                                </div>
                              )}

                              {/* Hover overlay for preview */}
                              <div
                                className="library-overlay"
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: "rgba(0, 0, 0, 0.3)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: 0,
                                  transition: "opacity 0.2s",
                                  zIndex: 5,
                                  pointerEvents: "none",
                                }}
                              >
                                {/* Preview Icon */}
                                <div
                                  style={{
                                    background: "rgba(255, 255, 255, 0.9)",
                                    borderRadius: "50%",
                                    width: 40,
                                    height: 40,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Eye size={20} color={token.colorText} />
                                </div>
                              </div>

                              {/* Bottom info overlay */}
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  background:
                                    "linear-gradient(transparent, rgba(0,0,0,0.7))",
                                  color: "white",
                                  padding: "8px",
                                  fontSize: 12,
                                  zIndex: 10,
                                }}
                              >
                                <div style={{ fontWeight: 600 }}>
                                  AI Generated
                                </div>
                                <div>{item.uploadedAt}</div>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                  </Row>
                </div>
              ),
            },
            {
              key: "website",
              label: (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Globe size={14} />
                  From Merchant's Website
                  {getSelectedCountByCategory("website") > 0 && (
                    <Badge
                      count={getSelectedCountByCategory("website")}
                      style={{
                        backgroundColor: token.colorPrimary,
                        marginLeft: 4,
                      }}
                    />
                  )}
                </span>
              ),
              children: (
                <div>
                  <div
                    style={{
                      marginBottom: 16,
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <Input
                      placeholder="Search website images..."
                      prefix={<Search size={14} />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>

                  {/* Modern Segmented Filter */}
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        background: token.colorFillSecondary,
                        borderRadius: 8,
                        padding: 4,
                        width: "fit-content",
                      }}
                    >
                      {[
                        { key: "all", label: "All Media", icon: null },
                        {
                          key: "photos",
                          label: "Photos",
                          icon: <ImageIcon size={14} />,
                        },
                        {
                          key: "videos",
                          label: "Videos",
                          icon: <Video size={14} />,
                        },
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() =>
                            setMediaFilter(
                              option.key as "all" | "photos" | "videos"
                            )
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: 6,
                            background:
                              mediaFilter === option.key
                                ? token.colorPrimary
                                : "transparent",
                            color:
                              mediaFilter === option.key
                                ? "white"
                                : token.colorText,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            fontWeight: 500,
                            fontSize: 14,
                            minWidth: 100,
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            if (mediaFilter !== option.key) {
                              e.currentTarget.style.background =
                                token.colorFillTertiary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (mediaFilter !== option.key) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Row gutter={[16, 16]}>
                    {filteredLibraryItems
                      .filter((item) => item.source === "website")
                      .map((item) => {
                        const isSelected = selectedLibraryItems.includes(
                          item.id
                        );
                        const isAlreadyAdded = isLibraryItemAlreadyAdded(
                          item.url
                        );

                        return (
                          <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
                            <div
                              style={{
                                position: "relative",
                                cursor: "pointer",
                                border: isSelected
                                  ? `2px solid ${token.colorPrimary}`
                                  : "2px solid transparent",
                                borderRadius: 8,
                                overflow: "hidden",
                                transition: "all 0.2s",
                                height: 160,
                                boxShadow: isSelected
                                  ? "0 4px 12px rgba(24, 144, 255, 0.2)"
                                  : "none",
                              }}
                              onMouseEnter={(e) => {
                                const overlay = e.currentTarget.querySelector(
                                  ".library-overlay"
                                ) as HTMLElement;
                                if (overlay) overlay.style.opacity = "1";
                              }}
                              onMouseLeave={(e) => {
                                const overlay = e.currentTarget.querySelector(
                                  ".library-overlay"
                                ) as HTMLElement;
                                if (overlay) overlay.style.opacity = "0";
                              }}
                              onClick={() => {
                                handlePreviewLibraryItem(item);
                              }}
                            >
                              <Image
                                src={item.url}
                                alt="Website image"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                preview={false}
                              />

                              {/* Checkbox - Always visible in top-left corner */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: 8,
                                  left: 8,
                                  zIndex: 20,
                                  pointerEvents: "auto",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      setSelectedLibraryItems(
                                        selectedLibraryItems.filter(
                                          (id) => id !== item.id
                                        )
                                      );
                                    } else {
                                      setSelectedLibraryItems([
                                        ...selectedLibraryItems,
                                        item.id,
                                      ]);
                                    }
                                  }}
                                />
                              </div>

                              {/* Already Added Indicator */}
                              {isAlreadyAdded && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    zIndex: 10,
                                  }}
                                >
                                  <Tag
                                    color="success"
                                    style={{
                                      margin: 0,
                                      fontWeight: 600,
                                      fontSize: 11,
                                      boxShadow: token.boxShadow,
                                    }}
                                  >
                                    IN USE
                                  </Tag>
                                </div>
                              )}

                              {/* Hover overlay for preview */}
                              <div
                                className="library-overlay"
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: "rgba(0, 0, 0, 0.3)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: 0,
                                  transition: "opacity 0.2s",
                                  zIndex: 5,
                                  pointerEvents: "none",
                                }}
                              >
                                {/* Preview Icon */}
                                <div
                                  style={{
                                    background: "rgba(255, 255, 255, 0.9)",
                                    borderRadius: "50%",
                                    width: 40,
                                    height: 40,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Eye size={20} color={token.colorText} />
                                </div>
                              </div>

                              {/* Bottom info overlay */}
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  background:
                                    "linear-gradient(transparent, rgba(0,0,0,0.7))",
                                  color: "white",
                                  padding: "8px",
                                  fontSize: 12,
                                  zIndex: 10,
                                }}
                              >
                                <div style={{ fontWeight: 600 }}>
                                  From Website
                                </div>
                                <div>{item.uploadedAt}</div>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Modal>

      {/* Custom Preview Modal */}
      <Modal
        open={isPreviewOpen}
        onCancel={handleClosePreview}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        styles={{ body: { padding: 0, height: "90vh" } }}
        closable={false}
        zIndex={1100}
      >
        {media.length > 0 && (
          <div
            style={{
              position: "relative",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header with close button */}
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 10,
                display: "flex",
                gap: 8,
              }}
            >
              <Button
                icon={<Edit3 size={16} />}
                onClick={() => setIsEditingCaption(!isEditingCaption)}
                type={isEditingCaption ? "primary" : "default"}
              >
                {isEditingCaption ? "Cancel" : "Edit Caption"}
              </Button>
              <Button
                danger
                icon={<XIcon size={16} />}
                onClick={handleRemoveFromPreview}
              >
                Remove
              </Button>
              <Button icon={<X size={16} />} onClick={handleClosePreview}>
                Close
              </Button>
            </div>

            {/* Navigation arrows */}
            {media.length > 1 && (
              <>
                <Button
                  icon={<ChevronLeft size={20} />}
                  onClick={handlePrevImage}
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                  }}
                />
                <Button
                  icon={<ChevronRight size={20} />}
                  onClick={handleNextImage}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                  }}
                />
              </>
            )}

            {/* Image display */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#000",
                position: "relative",
              }}
            >
              {media[previewIndex].type === "image" ? (
                <Image
                  src={media[previewIndex].url}
                  alt="Preview"
                  preview={false}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <video
                  src={media[previewIndex].url}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                  controls
                  autoPlay
                />
              )}
            </div>

            {/* Caption section */}
            <div
              style={{
                padding: 16,
                background: token.colorBgContainer,
                borderTop: `1px solid ${token.colorBorder}`,
              }}
            >
              {isEditingCaption ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Input
                    value={editingCaption}
                    onChange={(e) => setEditingCaption(e.target.value)}
                    placeholder="Enter caption..."
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <Button type="primary" onClick={handleSaveCaption}>
                    Save
                  </Button>
                </div>
              ) : (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Caption:
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {media[previewIndex].caption ? (
                      <Text>{media[previewIndex].caption}</Text>
                    ) : (
                      <Text type="secondary" style={{ fontStyle: "italic" }}>
                        No caption
                      </Text>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Image counter */}
            {media.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: 16,
                  fontSize: 12,
                }}
              >
                {previewIndex + 1} of {media.length}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MediaUpload;
