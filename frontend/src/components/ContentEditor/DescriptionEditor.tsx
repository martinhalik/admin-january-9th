import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Typography,
  Button,
  Space,
  Tooltip,
  theme,
  Modal,
  Input,
  ColorPicker,
  Card,
  message as antdMessage,
  Dropdown,
  Divider,
} from "antd";
import { useDropzone } from "react-dropzone";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List as ListIcon,
  ListOrdered,
  RotateCcw,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Highlighter,
  CheckSquare,
  Minus,
  Palette,
  Copy,
  Trash2,
  Type,
  Code,
  Quote,
  Strikethrough,
  Clock,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import ImageLibraryModal from "./ImageLibraryModal";

const { Text } = Typography;
const { useToken } = theme;

// Create extensions outside component to prevent duplicate registration in StrictMode
const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    bulletList: {
      HTMLAttributes: {
        class: "notion-list",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "notion-list",
      },
    },
    dropcursor: false, // Disabled - not using dropcursor
    gapcursor: false, // Disabled - using dedicated Gapcursor extension below
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "editor-link",
    },
  }),
  Image.configure({
    HTMLAttributes: {
      class: "editor-image",
    },
  }),
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  TaskList,
  TaskItem.configure({
    HTMLAttributes: {
      class: "task-item",
    },
  }),
  Placeholder.configure({
    placeholder: "Type '/' for commands, or just start writing...",
  }),
  Gapcursor,
];

interface DescriptionEditorProps {
  description: string;
  originalDescription: string;
  onDescriptionChange: (description: string) => void;
}

const DescriptionEditor = ({
  description,
  originalDescription,
  onDescriptionChange,
}: DescriptionEditorProps) => {
  const { token } = useToken();
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [bubbleMenuPos, setBubbleMenuPos] = useState({ top: 0, left: 0 });
  const [isMenuHovered, setIsMenuHovered] = useState(false);

  // Link and Image modals
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageLibrary, setShowImageLibrary] = useState(false);

  // Context menu for drag handle
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuNode, setContextMenuNode] = useState<{
    from: number;
    to: number;
  } | null>(null);

  // Initialize TipTap editor with all conversion-boosting features
  const editor = useEditor(
    {
      extensions: editorExtensions,
      content: description,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onDescriptionChange(html);
      },
      editorProps: {
        attributes: {
          class: "notion-editor",
        },
      },
    },
    [] // Empty dependency array - only create editor once
  );

  // Check if description has changed
  const hasChanged = description !== originalDescription;

  // Calculate read time (average 200 words per minute)
  const readingTimeMinutes = useMemo(() => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = description;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    const words = textContent
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const wordCount = words.length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [description]);

  const handleRevert = () => {
    onDescriptionChange(originalDescription);
    editor?.commands.setContent(originalDescription);
  };

  const handleAddImage = () => {
    setShowImageLibrary(true);
  };

  const handleInsertImagesFromLibrary = (imageUrls: string[]) => {
    if (!editor) return;

    // Insert each image as a separate block
    imageUrls.forEach((url, index) => {
      if (index === 0) {
        // First image - insert at current position
        editor.chain().focus().setImage({ src: url }).run();
      } else {
        // Subsequent images - create new paragraph and insert
        editor
          .chain()
          .focus()
          .createParagraphNear()
          .setImage({ src: url })
          .run();
      }
    });

    setShowImageLibrary(false);
    onDescriptionChange(editor.getHTML());
  };

  const handleAddLink = () => {
    setShowLinkModal(true);
    if (editor?.isActive("link")) {
      const href = editor.getAttributes("link").href;
      setLinkUrl(href || "");
    }
  };

  const handleLinkSubmit = () => {
    if (linkUrl && editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl("");
      setShowLinkModal(false);
      antdMessage.success("Link added!");
    }
  };

  const handleRemoveLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
      antdMessage.success("Link removed!");
    }
  };

  // Drag and drop image handler
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!editor) return;

      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          editor.chain().focus().setImage({ src: dataUrl }).run();
          antdMessage.success(`Image "${file.name}" inserted!`);
        };
        reader.readAsDataURL(file);
      });
    },
    [editor]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    noClick: true,
    noKeyboard: true,
  });

  // Custom bubble menu positioning with viewport bounds and improved hover persistence
  useEffect(() => {
    if (!editor) return;

    let hideTimeout: NodeJS.Timeout | null = null;

    const updateBubbleMenu = () => {
      const { from, to, empty } = editor.state.selection;

      // Clear any pending hide timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      // Only show if there's a text selection (not just cursor position)
      if (!empty && from !== to) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            try {
              const range = domSelection.getRangeAt(0);
              const rect = range.getBoundingClientRect();

              if (rect.width > 0 && rect.height > 0) {
                // Calculate position - rect is already relative to viewport
                // For fixed positioning, we don't need scrollY
                let top = rect.top - 50; // 50px above the selection
                let left = rect.left + rect.width / 2;

                // Keep within viewport bounds
                const menuWidth = 650; // Approximate menu width
                const viewportWidth = window.innerWidth;

                // Adjust left position to stay in viewport
                if (left + menuWidth / 2 > viewportWidth - 20) {
                  left = viewportWidth - menuWidth / 2 - 20;
                }
                if (left - menuWidth / 2 < 20) {
                  left = menuWidth / 2 + 20;
                }

                // Adjust top position if too close to top
                if (top < 20) {
                  top = rect.bottom + 15;
                }

                setBubbleMenuPos({ top, left });
                setShowBubbleMenu(true);
              }
            } catch (e) {
              // Ignore selection errors
            }
          }
        }, 10);
      } else {
        // Use timeout to allow menu interaction before hiding
        hideTimeout = setTimeout(() => {
          if (!isMenuHovered) {
            setShowBubbleMenu(false);
          }
        }, 150);
      }
    };

    // Debounced version for selectionchange to reduce flickering
    let selectionTimeout: NodeJS.Timeout | null = null;
    const debouncedUpdateBubbleMenu = () => {
      if (selectionTimeout) clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(updateBubbleMenu, 50);
    };

    editor.on("selectionUpdate", updateBubbleMenu);
    editor.on("update", updateBubbleMenu);
    editor.on("focus", updateBubbleMenu);

    // Use debounced version for document selection changes
    document.addEventListener("selectionchange", debouncedUpdateBubbleMenu);

    return () => {
      if (hideTimeout) clearTimeout(hideTimeout);
      if (selectionTimeout) clearTimeout(selectionTimeout);
      editor.off("selectionUpdate", updateBubbleMenu);
      editor.off("update", updateBubbleMenu);
      editor.off("focus", updateBubbleMenu);
      document.removeEventListener(
        "selectionchange",
        debouncedUpdateBubbleMenu
      );
    };
  }, [editor, isMenuHovered]);

  // Sync editor content when description prop changes externally
  useEffect(() => {
    if (!editor || !description) return;

    // Only update if the content is different from what's currently in the editor
    const currentContent = editor.getHTML();
    if (currentContent !== description) {
      editor.commands.setContent(description, { emitUpdate: false });
    }
  }, [description, editor]);

  // Context Menu Handlers
  const handleDeleteBlock = useCallback(() => {
    if (!editor || !contextMenuNode) return;
    const { from, to } = contextMenuNode;
    editor.chain().focus().deleteRange({ from, to }).run();
    setContextMenuVisible(false);
    antdMessage.success("Block deleted");
  }, [editor, contextMenuNode]);

  const handleDuplicateBlock = useCallback(() => {
    if (!editor || !contextMenuNode) return;
    const { from, to } = contextMenuNode;
    const content = editor.state.doc.slice(from, to).content;
    editor.chain().focus().insertContentAt(to, content.toJSON()).run();
    setContextMenuVisible(false);
    antdMessage.success("Block duplicated");
  }, [editor, contextMenuNode]);

  const handleTurnInto = useCallback(
    (type: string) => {
      if (!editor || !contextMenuNode) return;
      const { from, to } = contextMenuNode;
      editor.chain().focus().setTextSelection({ from, to });

      if (type === "paragraph") {
        editor.chain().focus().setParagraph().run();
      } else if (type === "h1") {
        editor.chain().focus().setHeading({ level: 1 }).run();
      } else if (type === "h2") {
        editor.chain().focus().setHeading({ level: 2 }).run();
      } else if (type === "h3") {
        editor.chain().focus().setHeading({ level: 3 }).run();
      } else if (type === "bulletList") {
        editor.chain().focus().toggleBulletList().run();
      } else if (type === "orderedList") {
        editor.chain().focus().toggleOrderedList().run();
      }

      setContextMenuVisible(false);
      antdMessage.success(`Converted to ${type}`);
    },
    [editor, contextMenuNode]
  );

  // Notion-like drag handles implementation with DEBUG logging
  useEffect(() => {
    if (!editor) {
      return;
    }

    const editorElement = editor.view.dom;
    const editorContainer = editorElement.parentElement;

    if (!editorContainer) {
      return;
    }

    let draggedNode: {
      node: any;
      from: number;
      to: number;
      parentListType?: string;
    } | null = null;
    let isHoveringHandle = false; // Track if mouse is over the handle itself
    let hideTimeout: NodeJS.Timeout | null = null; // Delay before hiding
    let dragPreview: HTMLElement | null = null; // Ghost element that follows cursor
    let isDragging = false; // Prevent concurrent drag operations

    // Create the drag handle element
    const dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";
    dragHandle.contentEditable = "false";
    dragHandle.draggable = true;
    dragHandle.innerHTML = `⋮⋮`;
    dragHandle.style.cssText = `
      position: absolute;
      display: none;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      left: 8px;
      cursor: grab;
      user-select: none;
      color: #9ca3af;
      font-size: 14px;
      letter-spacing: -1px;
      z-index: 10;
      background: transparent;
      border-radius: 3px;
      pointer-events: auto;
    `;
    editorContainer.appendChild(dragHandle);

    // Create custom drop indicator (blue line) - only shown at valid positions
    const dropIndicator = document.createElement("div");
    dropIndicator.className = "custom-drop-indicator";
    dropIndicator.style.cssText = `
      position: absolute;
      display: none;
      height: 3px;
      background-color: #1890ff;
      pointer-events: none;
      z-index: 100;
      border-radius: 2px;
      box-shadow: 0 0 4px rgba(24, 144, 255, 0.5);
    `;
    editorContainer.appendChild(dropIndicator);

    let currentBlockElement: HTMLElement | null = null;

    // Function to update drag handle position
    const updateDragHandlePosition = (target: HTMLElement) => {
      try {
        const targetRect = target.getBoundingClientRect();
        const containerRect = editorContainer.getBoundingClientRect();

        // Safety check: ensure elements are visible
        if (targetRect.height === 0 || containerRect.height === 0) {
          return;
        }

        // Notion-style: Always align with first line of text
        let topPos;
        let leftPos = 8; // Default

        if (target.tagName === "LI") {
          // For list items, find the actual text content position
          // This accounts for padding and line-height
          const computedStyle = window.getComputedStyle(target);
          const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
          const lineHeight = parseFloat(computedStyle.lineHeight) || 24;

          // Position at the vertical center of the first line of text
          // Adjusted: -5 instead of -10 to align better with text
          topPos =
            targetRect.top -
            containerRect.top +
            paddingTop +
            lineHeight / 2 -
            5;

          // Calculate nesting level to position handle closer to nested items
          let nestingLevel = 0;
          let parent = target.parentElement;
          while (parent) {
            if (parent.tagName === "LI") {
              nestingLevel++;
            }
            if (parent === editorElement) break;
            parent = parent.parentElement;
          }

          // Adjust horizontal position for nested items
          // Position handle closer to where the item actually is
          // Adjusted: -40 instead of -28 to position closer to nested items
          const targetLeftOffset = targetRect.left - containerRect.left;
          const handleLeftPosition = Math.max(8, targetLeftOffset - 40);

          leftPos = handleLeftPosition;
          dragHandle.style.left = `${handleLeftPosition}px`;
        } else if (target.tagName === "UL" || target.tagName === "OL") {
          // For whole lists, align with the first list item's text
          const firstItem = target.querySelector("li");
          if (firstItem) {
            const firstItemRect = firstItem.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(firstItem);
            const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
            const lineHeight = parseFloat(computedStyle.lineHeight) || 24;

            // Adjusted: -5 instead of -10 for consistent alignment
            topPos =
              firstItemRect.top -
              containerRect.top +
              paddingTop +
              lineHeight / 2 -
              5;

            // Reset to default left position for lists
            leftPos = 8;
            dragHandle.style.left = "8px";
          } else {
            // Fallback if no list items
            topPos = targetRect.top - containerRect.top + 8;
            leftPos = 8;
            dragHandle.style.left = "8px";
          }
        } else {
          // For paragraphs and headings, align with the first line
          const computedStyle = window.getComputedStyle(target);
          const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
          const lineHeight = parseFloat(computedStyle.lineHeight) || 24;

          // Position at the vertical center of the first line
          // Adjusted: -5 instead of -10 for consistent alignment
          topPos =
            targetRect.top -
            containerRect.top +
            paddingTop +
            lineHeight / 2 -
            5;

          // Reset to default left position for regular blocks
          leftPos = 8;
          dragHandle.style.left = "8px";
        }

        // Ensure the position is within reasonable bounds
        const minTop = 0;
        const maxTop = containerRect.height - 20;
        const boundedTopPos = Math.max(minTop, Math.min(topPos, maxTop));

        dragHandle.style.display = "flex";
        dragHandle.style.top = `${boundedTopPos}px`;
      } catch (error) {
        console.error("❌ DRAG HANDLE: Error positioning handle:", error);
      }
    };

    // Mouse move handler to show/hide drag handle
    let mouseMoveCount = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseMoveCount++;

      const target = e.target as HTMLElement;

      // CRITICAL: Check if mouse is over the drag handle itself or near it
      if (target === dragHandle || dragHandle.contains(target)) {
        isHoveringHandle = true;
        // Clear any pending hide timeout
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        return; // Don't hide it!
      }

      // Get mouse position relative to the editor container
      const containerRect = editorContainer.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const relativeY = e.clientY - containerRect.top;

      // If mouse is in the drag handle zone (0-44px), keep it visible
      if (relativeX >= 0 && relativeX <= 44 && currentBlockElement) {
        isHoveringHandle = true;
        // Clear any pending hide timeout
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        // Don't return - continue to check for block element updates
      } else {
        isHoveringHandle = false;
      }

      // NOTION BEHAVIOR: Find block based on VERTICAL position only
      // This prevents jumping when moving horizontally between bullet and text
      let blockElement: HTMLElement | null = null;

      // Get all block elements including individual list items
      const blocks = editorElement.querySelectorAll(
        "p, h1, h2, h3, li, blockquote, pre"
      );

      // Find which block the mouse Y position falls within
      for (const block of blocks) {
        const blockRect = block.getBoundingClientRect();
        const blockTop = blockRect.top - containerRect.top;
        const blockBottom = blockRect.bottom - containerRect.top;

        // Check if mouse Y position is within this block's vertical bounds
        if (relativeY >= blockTop && relativeY <= blockBottom) {
          blockElement = block as HTMLElement;
          break;
        }
      }

      // If we found a list item, use it directly (Notion behavior)
      if (blockElement && blockElement.tagName === "LI") {
        // Use list item from vertical detection
      }

      if (blockElement && blockElement !== currentBlockElement) {
        // Clear any pending hide timeout
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        currentBlockElement = blockElement;
        isHoveringHandle = false;
        updateDragHandlePosition(blockElement);
      } else if (!blockElement && !isHoveringHandle) {
        // Don't hide immediately - give user time to move mouse to handle
        if (currentBlockElement && !hideTimeout) {
          hideTimeout = setTimeout(() => {
            dragHandle.style.display = "none";
            currentBlockElement = null;
            isHoveringHandle = false;
            hideTimeout = null;
          }, 500); // 500ms grace period (longer for nested items)
        }
      }
    };

    // Drag start handler
    const handleDragStart = (e: DragEvent) => {

      // Prevent concurrent drag operations
      if (isDragging) {
        e.preventDefault();
        return;
      }

      // Don't preventDefault - we need the drag to start!
      // Just stop propagation to prevent interference
      e.stopPropagation();

      if (!currentBlockElement) {
        isDragging = false;
        return;
      }

      isDragging = true;

      try {
        // Find position more reliably by looking at the first child of the element
        let pos: number;
        try {
          // For better reliability with single-character paragraphs, try to get position from child
          const firstChild = currentBlockElement.firstChild;
          if (firstChild) {
            pos = editor.view.posAtDOM(firstChild, 0);
          } else {
            pos = editor.view.posAtDOM(currentBlockElement, 0);
          }
        } catch (e) {
          // Fallback to the original method
          pos = editor.view.posAtDOM(currentBlockElement, 0);
        }

        const $pos = editor.state.doc.resolve(pos);

        // Find the actual block node
        let depth = $pos.depth;
        let foundNode = false;
        while (depth > 0) {
          const node = $pos.node(depth);

          if (
            node.type.name === "paragraph" ||
            node.type.name === "heading" ||
            node.type.name === "listItem" || // Individual list items with their children
            node.type.name === "bulletList" ||
            node.type.name === "orderedList" ||
            node.type.name === "taskList"
          ) {
            foundNode = true;
            // If dragging a list item, store its parent list type
            let parentListType: string | undefined;
            if (node.type.name === "listItem") {
              // Look up to find parent list
              for (let i = depth + 1; i <= $pos.depth; i++) {
                const parentNode = $pos.node(i);
                if (
                  parentNode.type.name === "bulletList" ||
                  parentNode.type.name === "orderedList" ||
                  parentNode.type.name === "taskList"
                ) {
                  parentListType = parentNode.type.name;
                  break;
                }
              }
            }

            draggedNode = {
              node: node,
              from: $pos.before(depth),
              to: $pos.after(depth),
              parentListType,
            };
            break;
          }
          depth--;
        }

        if (!foundNode) {
          // No valid block node found
        }

        if (draggedNode) {
          // Validate node positions before starting drag
          const { from, to } = draggedNode;
          if (
            from < 0 ||
            to < 0 ||
            from >= to ||
            to > editor.state.doc.content.size
          ) {
            console.error(
              "❌ DRAG HANDLE: Invalid node positions, aborting drag!",
              { from, to }
            );
            isDragging = false;
            draggedNode = null;
            return;
          }

          // Highlight the block being dragged (including individual list items with their children)
          currentBlockElement.classList.add("is-dragging");

          // Create a ghost/preview element that follows the cursor (Notion-style)
          dragPreview = currentBlockElement.cloneNode(true) as HTMLElement;

          // Get the exact bounding box BEFORE appending
          const blockRect = currentBlockElement.getBoundingClientRect();

          // Validate bounding box
          if (blockRect.width === 0 || blockRect.height === 0) {
            console.error(
              "❌ DRAG HANDLE: Invalid block dimensions, aborting drag!"
            );
            currentBlockElement.classList.remove("is-dragging");
            isDragging = false;
            draggedNode = null;
            return;
          }

          dragPreview.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: ${blockRect.width}px;
            padding: 0;
            margin: 0;
            background: transparent;
            border: none;
            border-radius: 6px;
            opacity: 0.3;
            pointer-events: none;
            z-index: 10000;
          `;
          document.body.appendChild(dragPreview);

          // Calculate the EXACT offset to keep the ghost at the cursor position
          // This prevents any "jump" or shift when drag starts
          const offsetX = e.clientX - blockRect.left;
          const offsetY = e.clientY - blockRect.top;

          // Set the drag image to the preview element at the exact cursor position
          e.dataTransfer!.setDragImage(dragPreview, offsetX, offsetY);

          // Set minimal data to enable drag
          e.dataTransfer!.effectAllowed = "move";
          e.dataTransfer!.setData("text/plain", ""); // Required for drag to work
        } else {
          isDragging = false;
        }
      } catch (error) {
        console.error("❌ DRAG HANDLE: Drag start error:", error);
        isDragging = false;
        draggedNode = null;
        if (currentBlockElement) {
          currentBlockElement.classList.remove("is-dragging");
        }
      }
    };

    // Drag end handler
    const handleDragEnd = () => {
      isDragging = false;
      dropIndicator.style.display = "none";
      if (currentBlockElement) {
        currentBlockElement.classList.remove("is-dragging");
      }
      // Clean up the drag preview element
      if (dragPreview && dragPreview.parentNode) {
        dragPreview.parentNode.removeChild(dragPreview);
      }
      dragPreview = null;
      draggedNode = null;
    };

    // Drop handler
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedNode) {
        // Clean up even if there's no dragged node
        isDragging = false;
        dropIndicator.style.display = "none";
        currentBlockElement?.classList.remove("is-dragging");
        if (dragPreview && dragPreview.parentNode) {
          dragPreview.parentNode.removeChild(dragPreview);
        }
        dragPreview = null;
        return;
      }

      try {
        const dropPos = editor.view.posAtCoords({
          left: e.clientX,
          top: e.clientY,
        });

        if (!dropPos) {
          throw new Error("Invalid drop position");
        }

        // Smart position snapping: find nearest block boundary
        let $dropPos = editor.state.doc.resolve(dropPos.pos);
        let finalDropPos = dropPos.pos;

        // If we're inside a text block, snap to block boundary
        if ($dropPos.parent.isTextblock && $dropPos.parent.content.size > 0) {
          const distToStart = $dropPos.parentOffset;
          const distToEnd =
            $dropPos.parent.content.size - $dropPos.parentOffset;

          if (distToStart < distToEnd) {
            // Closer to start - drop before this block
            finalDropPos = $dropPos.before($dropPos.depth);
          } else {
            // Closer to end - drop after this block
            finalDropPos = $dropPos.after($dropPos.depth);
          }
        }

        // For list items: ensure we're at list item boundaries
        if ($dropPos.parent.type.name === "listItem") {
          finalDropPos = $dropPos.after($dropPos.depth);
        }

        const { from, to, node, parentListType } = draggedNode;

        // Validation: Check if positions are valid
        if (from < 0 || to < 0 || from >= to) {
          throw new Error("Invalid node positions");
        }

        // Don't drop on itself or within itself
        if (finalDropPos >= from && finalDropPos <= to) {
          return;
        }

        // Check if dropping immediately adjacent (no actual move needed)
        // This prevents empty list items when dropping just below itself
        const nodeSize = to - from;
        if (
          finalDropPos === to ||
          finalDropPos === from ||
          finalDropPos === to + 1 ||
          finalDropPos === from - 1
        ) {
          return;
        }

        // Additional validation: ensure drop position is within document bounds
        if (finalDropPos < 0 || finalDropPos > editor.state.doc.content.size) {
          throw new Error("Drop position out of bounds");
        }

        // CRITICAL: Validate we're at a block boundary, not in the middle of text
        const $finalDropPos = editor.state.doc.resolve(finalDropPos);

        // If dropping into a text block, must be at start (0) or end of the block
        if ($finalDropPos.parent.isTextblock) {
          if (
            $finalDropPos.parentOffset !== 0 &&
            $finalDropPos.parentOffset !== $finalDropPos.parent.content.size
          ) {
            return; // Don't allow splitting text/words
          }
        }
        const isDropInList = (() => {
          for (let i = $finalDropPos.depth; i > 0; i--) {
            const parentType = $finalDropPos.node(i).type.name;
            if (
              parentType === "bulletList" ||
              parentType === "orderedList" ||
              parentType === "taskList"
            ) {
              return true;
            }
          }
          return false;
        })();

        // If moving a list item outside a list, wrap it in its parent list type
        let nodeToInsert = node;
        if (node.type.name === "listItem" && !isDropInList && parentListType) {
          const listType = editor.schema.nodes[parentListType];
          if (listType) {
            nodeToInsert = listType.create(null, [node]);
          }
        }

        // Create a new transaction with validation
        const tr = editor.state.tr;

        // Calculate positions carefully and validate
        if (finalDropPos > to) {
          // Dropping after: delete first, then insert
          const newPos = finalDropPos - nodeSize;

          if (
            newPos === to ||
            newPos < 0 ||
            newPos > editor.state.doc.content.size - nodeSize
          ) {
            return;
          }

          tr.delete(from, to);
          tr.insert(newPos, nodeToInsert);
        } else {
          // Dropping before: insert first, then delete (with adjusted positions)
          const newPos = finalDropPos;

          if (
            newPos + nodeSize === from ||
            newPos < 0 ||
            newPos > editor.state.doc.content.size
          ) {
            return;
          }

          tr.insert(newPos, nodeToInsert);
          // After insertion, the original node's position shifts by inserted node size
          const insertedSize = nodeToInsert.nodeSize;
          tr.delete(from + insertedSize, to + insertedSize);
        }

        // Dispatch the transaction only if it's valid
        if (tr.docChanged) {
          editor.view.dispatch(tr);
        }
      } catch (error) {
        // Silently handle errors and clean up
      } finally {
        // Clean up in all cases
        isDragging = false;
        dropIndicator.style.display = "none";
        currentBlockElement?.classList.remove("is-dragging");
        if (dragPreview && dragPreview.parentNode) {
          dragPreview.parentNode.removeChild(dragPreview);
        }
        dragPreview = null;
        draggedNode = null;
      }
    };

    // Validate drag over positions - show blue line only at valid positions
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();

      if (!draggedNode) {
        dropIndicator.style.display = "none";
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "none";
        }
        return;
      }

      // Check if we can drop at this position
      const dropPos = editor.view.posAtCoords({
        left: e.clientX,
        top: e.clientY,
      });

      if (!dropPos) {
        dropIndicator.style.display = "none";
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "none";
        }
        return;
      }

      // Calculate snapped position (same logic as handleDrop)
      let $dropPos = editor.state.doc.resolve(dropPos.pos);
      let finalDropPos = dropPos.pos;

      if ($dropPos.parent.isTextblock && $dropPos.parent.content.size > 0) {
        const distToStart = $dropPos.parentOffset;
        const distToEnd = $dropPos.parent.content.size - $dropPos.parentOffset;

        if (distToStart < distToEnd) {
          finalDropPos = $dropPos.before($dropPos.depth);
        } else {
          finalDropPos = $dropPos.after($dropPos.depth);
        }
      }

      if ($dropPos.parent.type.name === "listItem") {
        finalDropPos = $dropPos.after($dropPos.depth);
      }

      const $finalDropPos = editor.state.doc.resolve(finalDropPos);

      // Check if position is at block boundary
      if ($finalDropPos.parent.isTextblock) {
        if (
          $finalDropPos.parentOffset !== 0 &&
          $finalDropPos.parentOffset !== $finalDropPos.parent.content.size
        ) {
          // In middle of text - don't allow, hide indicator
          dropIndicator.style.display = "none";
          if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "none";
          }
          return;
        }
      }

      // Check adjacency
      const { from, to } = draggedNode;

      if (
        (finalDropPos >= from && finalDropPos <= to) ||
        finalDropPos === to ||
        finalDropPos === from ||
        finalDropPos === to + 1 ||
        finalDropPos === from - 1
      ) {
        dropIndicator.style.display = "none";
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "none";
        }
        return;
      }

      // Valid position - show blue line and allow move
      const containerRect = editorContainer.getBoundingClientRect();
      const coords = editor.view.coordsAtPos(finalDropPos);
      const topPos = coords.top - containerRect.top;

      dropIndicator.style.display = "block";
      dropIndicator.style.top = `${topPos}px`;
      dropIndicator.style.left = "0px";
      dropIndicator.style.right = "12px";

      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
    };

    // Hover effects for drag handle
    const handleDragHandleMouseEnter = () => {
      dragHandle.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
      dragHandle.style.color = "#1890ff";
      isHoveringHandle = true;
    };

    const handleDragHandleMouseLeave = () => {
      dragHandle.style.backgroundColor = "transparent";
      dragHandle.style.color = "#9ca3af";
      isHoveringHandle = false;
    };

    // Attach event listeners
    editorContainer.addEventListener("mousemove", handleMouseMove);
    dragHandle.addEventListener("dragstart", handleDragStart);
    dragHandle.addEventListener("dragend", handleDragEnd);
    dragHandle.addEventListener("mouseenter", handleDragHandleMouseEnter);
    dragHandle.addEventListener("mouseleave", handleDragHandleMouseLeave);
    editorElement.addEventListener("drop", handleDrop);
    editorElement.addEventListener("dragover", handleDragOver);

    // Hide drag handle when mouse leaves editor
    const handleMouseLeave = () => {
      // Clear any pending timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      dragHandle.style.display = "none";
      currentBlockElement = null;
    };
    editorContainer.addEventListener("mouseleave", handleMouseLeave);

    // Click handler to show context menu
    const handleDragHandleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!currentBlockElement) return;

      try {
        const pos = editor.view.posAtDOM(currentBlockElement, 0);
        const $pos = editor.state.doc.resolve(pos);

        // Find the block node
        let depth = $pos.depth;
        while (depth > 0) {
          const node = $pos.node(depth);
          if (
            node.type.name === "paragraph" ||
            node.type.name === "heading" ||
            node.type.name === "listItem" || // Individual list items
            node.type.name === "bulletList" ||
            node.type.name === "orderedList" ||
            node.type.name === "taskList"
          ) {
            setContextMenuNode({
              from: $pos.before(depth),
              to: $pos.after(depth),
            });
            setContextMenuPos({ x: e.clientX, y: e.clientY });
            setContextMenuVisible(true);
            break;
          }
          depth--;
        }
      } catch (error) {
        console.error("❌ Context menu error:", error);
      }
    };

    dragHandle.addEventListener("click", handleDragHandleClick);

    // Cleanup
    return () => {
      // Clear any pending timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      editorContainer.removeEventListener("mousemove", handleMouseMove);
      dragHandle.removeEventListener("dragstart", handleDragStart);
      dragHandle.removeEventListener("dragend", handleDragEnd);
      dragHandle.removeEventListener("mouseenter", handleDragHandleMouseEnter);
      dragHandle.removeEventListener("mouseleave", handleDragHandleMouseLeave);
      dragHandle.removeEventListener("click", handleDragHandleClick);
      editorElement.removeEventListener("drop", handleDrop);
      editorElement.removeEventListener("dragover", handleDragOver);
      editorContainer.removeEventListener("mouseleave", handleMouseLeave);
      dragHandle.remove();
      dropIndicator.remove();
    };
  }, [editor]);

  // Hide bubble menu when clicking outside and menu is not hovered
  useEffect(() => {
    const handleClickOutside = () => {
      if (!isMenuHovered && showBubbleMenu) {
        setShowBubbleMenu(false);
      }
    };

    if (showBubbleMenu) {
      // Add a small delay before activating the click handler
      // This prevents it from immediately hiding when selection triggers mouseup
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 200);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showBubbleMenu, isMenuHovered]);

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenuVisible) return;

    const handleClickOutside = () => {
      // Close the context menu
      setContextMenuVisible(false);
    };

    // Add a small delay to prevent the menu from closing immediately when it opens
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenuVisible]);

  // Keyboard accessibility - ESC to close modals and bubble menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (contextMenuVisible) {
          setContextMenuVisible(false);
        }
        if (showBubbleMenu && !isMenuHovered) {
          setShowBubbleMenu(false);
        }
        if (showLinkModal) {
          setShowLinkModal(false);
          setLinkUrl("");
        }
        if (showImageLibrary) {
          setShowImageLibrary(false);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [
    contextMenuVisible,
    showBubbleMenu,
    isMenuHovered,
    showLinkModal,
    showImageLibrary,
  ]);

  return (
    <>
      {/* Description Card */}
      <Card style={{ marginBottom: 24 }}>
        {/* Header row - minimal and clean */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Text
              strong
              style={{
                fontSize: 14,
                color: token.colorText,
              }}
            >
              Description
            </Text>
          </div>
          <Space size="small" style={{ alignItems: "center" }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Type <code style={{ background: token.colorFillQuaternary, padding: "1px 4px", borderRadius: 3, fontSize: 11, color: token.colorText }}>$</code> to insert variables
            </Text>
            {hasChanged && (
              <Tooltip title="Revert to original">
                <Button
                  size="small"
                  type="text"
                  icon={<RotateCcw size={14} />}
                  onClick={handleRevert}
                >
                  Revert
                </Button>
              </Tooltip>
            )}
            <Space size={4} style={{ marginLeft: 8 }}>
              <Clock size={12} color={token.colorTextTertiary} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {readingTimeMinutes} min read
              </Text>
            </Space>
          </Space>
        </div>

        {/* Formatting Toolbar */}
        {editor && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              padding: "8px 12px",
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 6,
              marginBottom: 12,
            }}
          >
            <Tooltip title="Bold (⌘B)">
              <Button
                size="small"
                type={editor.isActive("bold") ? "primary" : "text"}
                icon={<Bold size={16} />}
                onClick={() => editor.chain().focus().toggleBold().run()}
              />
            </Tooltip>
            <Tooltip title="Italic (⌘I)">
              <Button
                size="small"
                type={editor.isActive("italic") ? "primary" : "text"}
                icon={<Italic size={16} />}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              />
            </Tooltip>
            <Tooltip title="Underline (⌘U)">
              <Button
                size="small"
                type={editor.isActive("underline") ? "primary" : "text"}
                icon={<UnderlineIcon size={16} />}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              />
            </Tooltip>
            <Tooltip title="Strikethrough">
              <Button
                size="small"
                type={editor.isActive("strike") ? "primary" : "text"}
                icon={<Strikethrough size={16} />}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              />
            </Tooltip>

            <Divider
              type="vertical"
              style={{ height: "auto", margin: "0 4px" }}
            />

            <Tooltip title="Heading 1">
              <Button
                size="small"
                type={
                  editor.isActive("heading", { level: 1 }) ? "primary" : "text"
                }
                icon={<Heading1 size={16} />}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
              />
            </Tooltip>
            <Tooltip title="Heading 2">
              <Button
                size="small"
                type={
                  editor.isActive("heading", { level: 2 }) ? "primary" : "text"
                }
                icon={<Heading2 size={16} />}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
              />
            </Tooltip>
            <Tooltip title="Heading 3">
              <Button
                size="small"
                type={
                  editor.isActive("heading", { level: 3 }) ? "primary" : "text"
                }
                icon={<Heading3 size={16} />}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
              />
            </Tooltip>

            <Divider
              type="vertical"
              style={{ height: "auto", margin: "0 4px" }}
            />

            <Tooltip title="Bullet List">
              <Button
                size="small"
                type={editor.isActive("bulletList") ? "primary" : "text"}
                icon={<ListIcon size={16} />}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              />
            </Tooltip>
            <Tooltip title="Numbered List">
              <Button
                size="small"
                type={editor.isActive("orderedList") ? "primary" : "text"}
                icon={<ListOrdered size={16} />}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              />
            </Tooltip>
            <Tooltip title="Task List">
              <Button
                size="small"
                type={editor.isActive("taskList") ? "primary" : "text"}
                icon={<CheckSquare size={16} />}
                onClick={() => editor.chain().focus().toggleTaskList().run()}
              />
            </Tooltip>

            <Divider
              type="vertical"
              style={{ height: "auto", margin: "0 4px" }}
            />

            <Tooltip title="Code Block">
              <Button
                size="small"
                type={editor.isActive("codeBlock") ? "primary" : "text"}
                icon={<Code size={16} />}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              />
            </Tooltip>
            <Tooltip title="Blockquote">
              <Button
                size="small"
                type={editor.isActive("blockquote") ? "primary" : "text"}
                icon={<Quote size={16} />}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              />
            </Tooltip>
            <Tooltip title="Horizontal Rule">
              <Button
                size="small"
                type="text"
                icon={<Minus size={16} />}
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              />
            </Tooltip>

            <Divider
              type="vertical"
              style={{ height: "auto", margin: "0 4px" }}
            />

            <Tooltip title="Highlight">
              <Button
                size="small"
                type={editor.isActive("highlight") ? "primary" : "text"}
                icon={<Highlighter size={16} />}
                onClick={() => editor.chain().focus().toggleHighlight().run()}
              />
            </Tooltip>
            <Tooltip title="Link">
              <Button
                size="small"
                type={editor.isActive("link") ? "primary" : "text"}
                icon={<LinkIcon size={16} />}
                onClick={() => {
                  if (editor.isActive("link")) {
                    editor.chain().focus().unsetLink().run();
                  } else {
                    handleAddLink();
                  }
                }}
              />
            </Tooltip>
            <Tooltip title="Image">
              <Button
                size="small"
                type="text"
                icon={<ImageIcon size={16} />}
                onClick={handleAddImage}
              />
            </Tooltip>
          </div>
        )}

        <div style={{ position: "relative" }}>
          {/* Enhanced Bubble Menu - Appears when text is selected */}
          {editor && showBubbleMenu && (
            <div
              role="toolbar"
              aria-label="Text formatting toolbar"
              onMouseEnter={() => setIsMenuHovered(true)}
              onMouseLeave={() => setIsMenuHovered(false)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                position: "fixed",
                top: bubbleMenuPos.top,
                left: bubbleMenuPos.left,
                transform: "translateX(-50%)",
                zIndex: 9999,
                background: token.colorBgElevated,
                border: `2px solid ${token.colorPrimary}`,
                borderRadius: 8,
                padding: "6px",
                boxShadow: token.boxShadowSecondary,
                display: "flex",
                gap: 2,
                maxWidth: "min(90vw, 650px)",
                flexWrap: "wrap",
                pointerEvents: "auto",
              }}
            >
              <Tooltip title="Heading 1">
                <Button
                  size="small"
                  type={
                    editor.isActive("heading", { level: 1 })
                      ? "primary"
                      : "text"
                  }
                  icon={<Heading1 size={16} />}
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  style={{ minWidth: 32 }}
                  aria-label="Heading 1"
                />
              </Tooltip>
              <Tooltip title="Heading 2">
                <Button
                  size="small"
                  type={
                    editor.isActive("heading", { level: 2 })
                      ? "primary"
                      : "text"
                  }
                  icon={<Heading2 size={16} />}
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  style={{ minWidth: 32 }}
                />
              </Tooltip>
              <Tooltip title="Heading 3">
                <Button
                  size="small"
                  type={
                    editor.isActive("heading", { level: 3 })
                      ? "primary"
                      : "text"
                  }
                  icon={<Heading3 size={16} />}
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  style={{ minWidth: 32 }}
                />
              </Tooltip>
              <div
                style={{
                  width: 1,
                  height: 24,
                  background: token.colorBorder,
                  margin: "0 4px",
                }}
              />
              <Tooltip title="Bold (⌘/Ctrl+B)">
                <Button
                  size="small"
                  type={editor.isActive("bold") ? "primary" : "text"}
                  icon={<Bold size={16} />}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  style={{ minWidth: 32 }}
                  aria-label="Bold"
                  aria-pressed={editor.isActive("bold")}
                />
              </Tooltip>
              <Tooltip title="Italic (⌘/Ctrl+I)">
                <Button
                  size="small"
                  type={editor.isActive("italic") ? "primary" : "text"}
                  icon={<Italic size={16} />}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  style={{ minWidth: 32 }}
                  aria-label="Italic"
                  aria-pressed={editor.isActive("italic")}
                />
              </Tooltip>
              <Tooltip title="Underline (⌘/Ctrl+U)">
                <Button
                  size="small"
                  type={editor.isActive("underline") ? "primary" : "text"}
                  icon={<UnderlineIcon size={16} />}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  style={{ minWidth: 32 }}
                  aria-label="Underline"
                  aria-pressed={editor.isActive("underline")}
                />
              </Tooltip>
              <div
                style={{
                  width: 1,
                  height: 24,
                  background: token.colorBorder,
                  margin: "0 4px",
                }}
              />
              <Tooltip title="Bullet List">
                <Button
                  size="small"
                  type={editor.isActive("bulletList") ? "primary" : "text"}
                  icon={<ListIcon size={16} />}
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  style={{ minWidth: 32 }}
                />
              </Tooltip>
              <Tooltip title="Numbered List">
                <Button
                  size="small"
                  type={editor.isActive("orderedList") ? "primary" : "text"}
                  icon={<ListOrdered size={16} />}
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  style={{ minWidth: 32 }}
                />
              </Tooltip>
              <Tooltip title="Task List (Checklist)">
                <Button
                  size="small"
                  type={editor.isActive("taskList") ? "primary" : "text"}
                  icon={<CheckSquare size={16} />}
                  onClick={() => editor.chain().focus().toggleTaskList().run()}
                  style={{ minWidth: 32 }}
                />
              </Tooltip>
              <div
                style={{
                  width: 1,
                  height: 24,
                  background: token.colorBorder,
                  margin: "0 4px",
                }}
              />
              <Tooltip title="Highlight">
                <Button
                  size="small"
                  type={editor.isActive("highlight") ? "primary" : "text"}
                  icon={<Highlighter size={16} />}
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .toggleHighlight({ color: "#fef08a" })
                      .run()
                  }
                  style={{ minWidth: 32 }}
                />
              </Tooltip>
              <Tooltip title="Text Color">
                <ColorPicker
                  size="small"
                  value={editor.getAttributes("textStyle").color || "#000000"}
                  onChange={(color) => {
                    editor.chain().focus().setColor(color.toHexString()).run();
                  }}
                  presets={[
                    {
                      label: "Conversion Colors",
                      colors: [
                        "#000000",
                        "#ef4444",
                        "#f97316",
                        "#eab308",
                        "#22c55e",
                        "#3b82f6",
                        "#8b5cf6",
                      ],
                    },
                  ]}
                >
                  <Button
                    size="small"
                    type="text"
                    icon={<Palette size={16} />}
                    style={{ minWidth: 32 }}
                  />
                </ColorPicker>
              </Tooltip>
              <div
                style={{
                  width: 1,
                  height: 24,
                  background: token.colorBorder,
                  margin: "0 4px",
                }}
              />
              <Tooltip
                title={editor.isActive("link") ? "Remove Link" : "Add Link"}
              >
                <Button
                  size="small"
                  type={editor.isActive("link") ? "primary" : "text"}
                  icon={<LinkIcon size={16} />}
                  onClick={() => {
                    if (editor.isActive("link")) {
                      handleRemoveLink();
                    } else {
                      handleAddLink();
                    }
                  }}
                  style={{ minWidth: 32 }}
                  aria-label={
                    editor.isActive("link") ? "Remove Link" : "Add Link"
                  }
                  aria-pressed={editor.isActive("link")}
                />
              </Tooltip>
              <Tooltip title="Insert Image">
                <Button
                  size="small"
                  type="text"
                  icon={<ImageIcon size={16} />}
                  onClick={handleAddImage}
                  style={{ minWidth: 32 }}
                  aria-label="Insert Image"
                />
              </Tooltip>
              <Tooltip title="Divider">
                <Button
                  size="small"
                  type="text"
                  icon={<Minus size={16} />}
                  onClick={() =>
                    editor.chain().focus().setHorizontalRule().run()
                  }
                  style={{ minWidth: 32 }}
                />
              </Tooltip>
            </div>
          )}

          {/* Notion-style Editor Container - Seamless with Drag & Drop */}
          <div
            {...getRootProps()}
            className="notion-editor-container"
            style={{
              border: isDragActive
                ? `2px dashed ${token.colorPrimary}`
                : "none",
              borderRadius: isDragActive ? 8 : 0,
              minHeight: 500,
              padding: "8px 0",
              background: isDragActive ? token.colorPrimaryBg : "transparent",
              transition: "all 0.2s",
              position: "relative",
            }}
          >
            <input {...getInputProps()} />
            {isDragActive && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                <ImageIcon
                  size={48}
                  color={token.colorPrimary}
                  style={{ marginBottom: 12 }}
                />
                <Text
                  style={{
                    fontSize: 18,
                    color: token.colorPrimary,
                    fontWeight: 600,
                  }}
                >
                  Drop images here to insert
                </Text>
              </div>
            )}
            <EditorContent editor={editor} />
          </div>
        </div>
      </Card>

      {/* Link Modal */}
      <Modal
        title={editor?.isActive("link") ? "Edit Link" : "Add Link"}
        open={showLinkModal}
        onCancel={() => {
          setShowLinkModal(false);
          setLinkUrl("");
        }}
        onOk={handleLinkSubmit}
        okText={editor?.isActive("link") ? "Update" : "Add"}
        okButtonProps={{ disabled: !linkUrl }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Text>Enter the URL for the link:</Text>
          <Input
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onPressEnter={handleLinkSubmit}
            autoFocus
          />
        </Space>
      </Modal>

      {/* Image Library Modal */}
      <ImageLibraryModal
        visible={showImageLibrary}
        onSelect={handleInsertImagesFromLibrary}
        onCancel={() => setShowImageLibrary(false)}
      />

      {/* Context Menu for Drag Handle */}
      <Dropdown
        open={contextMenuVisible}
        onOpenChange={setContextMenuVisible}
        trigger={[]}
        menu={{
          items: [
            {
              key: "delete",
              label: "Delete",
              icon: <Trash2 size={14} />,
              onClick: handleDeleteBlock,
              danger: true,
            },
            {
              key: "duplicate",
              label: "Duplicate",
              icon: <Copy size={14} />,
              onClick: handleDuplicateBlock,
            },
            {
              type: "divider",
            },
            {
              key: "turnInto",
              label: "Turn into",
              icon: <Type size={14} />,
              children: [
                {
                  key: "paragraph",
                  label: "Text",
                  icon: <Type size={14} />,
                  onClick: () => handleTurnInto("paragraph"),
                },
                {
                  key: "h1",
                  label: "Heading 1",
                  icon: <Heading1 size={14} />,
                  onClick: () => handleTurnInto("h1"),
                },
                {
                  key: "h2",
                  label: "Heading 2",
                  icon: <Heading2 size={14} />,
                  onClick: () => handleTurnInto("h2"),
                },
                {
                  key: "h3",
                  label: "Heading 3",
                  icon: <Heading3 size={14} />,
                  onClick: () => handleTurnInto("h3"),
                },
                {
                  type: "divider",
                },
                {
                  key: "bulletList",
                  label: "Bullet List",
                  icon: <ListIcon size={14} />,
                  onClick: () => handleTurnInto("bulletList"),
                },
                {
                  key: "orderedList",
                  label: "Numbered List",
                  icon: <ListOrdered size={14} />,
                  onClick: () => handleTurnInto("orderedList"),
                },
              ],
            },
          ],
        }}
      >
        <div
          style={{
            position: "fixed",
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            width: 1,
            height: 1,
            pointerEvents: "none",
          }}
        />
      </Dropdown>
    </>
  );
};

export default DescriptionEditor;
