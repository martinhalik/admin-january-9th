import { useState, useCallback, useEffect } from "react";
import {
  Typography,
  Button,
  Space,
  Tooltip,
  theme,
  Card,
  Dropdown,
} from "antd";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List as ListIcon,
  ListOrdered,
  RotateCcw,
  Strikethrough,
  Variable,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";

const { Text } = Typography;
const { useToken } = theme;

// Available variables that can be inserted
const AVAILABLE_VARIABLES = [
  // Deal/Pricing variables
  { id: "$lowest_sell_price", label: "Lowest Sell Price", category: "Pricing" },
  { id: "$maximum_of_discount_amount", label: "Max Discount Amount", category: "Pricing" },
  { id: "$maximum_of_discount_percentage", label: "Max Discount %", category: "Pricing" },
  { id: "$price_1", label: "Option 1 Price", category: "Pricing" },
  { id: "$value_1", label: "Option 1 Value", category: "Pricing" },
  
  // Merchant/Location variables
  { id: "$merchant_name", label: "Merchant Name", category: "Merchant" },
  { id: "$location_address", label: "Location Address", category: "Merchant" },
  { id: "$business_hours", label: "Business Hours", category: "Merchant" },
  { id: "$phone", label: "Phone Number", category: "Contact" },
  { id: "$email", label: "Email Address", category: "Contact" },
  { id: "$website", label: "Website", category: "Contact" },
  { id: "$booking_url", label: "Booking URL", category: "Contact" },
  
  // Deal details
  { id: "$validity_days", label: "Validity Period", category: "Deal Details" },
  { id: "$custom_url", label: "Custom URL", category: "Deal Details" },
];

// Mention suggestion component
const MentionList = ({ items, command }: any) => {
  const { token } = useToken();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command({ id: item.id, label: item.label });
    }
  };

  return (
    <div
      className="variable-menu"
      style={{
        background: token.colorBgElevated,
        border: "none",
        borderRadius: 8,
        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12), 0 9px 28px rgba(0, 0, 0, 0.05)",
        padding: "4px",
        maxHeight: 320,
        overflowY: "auto",
        minWidth: 280,
      }}
    >
      {items.length > 0 ? (
        items.map((item: any, index: number) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              border: "none",
              background: index === selectedIndex ? token.colorInfoBg : "transparent",
              cursor: "pointer",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.2s ease",
              marginBottom: "2px",
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: index === selectedIndex ? token.colorInfo : token.colorInfoBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              <Variable
                size={14}
                style={{
                  color: index === selectedIndex ? "white" : token.colorInfo,
                  transition: "all 0.2s ease",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: token.colorText,
                  marginBottom: 2,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: token.colorTextSecondary,
                  fontFamily: "Monaco, Menlo, monospace",
                }}
              >
                <span>{item.id}</span>
                <span style={{ margin: "0 6px", color: token.colorTextTertiary }}>•</span>
                <span>{item.category}</span>
              </div>
            </div>
          </button>
        ))
      ) : (
        <div
          style={{
            padding: "12px 16px",
            color: token.colorTextSecondary,
            fontSize: 13,
            textAlign: "center",
          }}
        >
          No variables found
        </div>
      )}
    </div>
  );
};

// Create extensions outside component to prevent duplicate registration in StrictMode
const editorExtensions = [
  StarterKit.configure({
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
    dropcursor: false,
    gapcursor: false,
  }),
  Underline,
  Placeholder.configure({
    placeholder: "Capture the key benefits in a nutshell... Type $ to insert variables",
  }),
  Gapcursor,
  Mention.configure({
    HTMLAttributes: {
      class: "variable-mention",
    },
    renderLabel({ node }) {
      return `${node.attrs.id}`;
    },
    suggestion: {
      char: "$",
      items: ({ query }: any) => {
        return AVAILABLE_VARIABLES.filter((item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.id.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
      },
      render: () => {
        let component: any;
        let popup: TippyInstance[];

        return {
          onStart: (props: any) => {
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            });

            popup = tippy("body", {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
              theme: "light",
              maxWidth: "none",
              arrow: false,
              offset: [0, 8],
              zIndex: 9999,
            });
          },
          onUpdate(props: any) {
            component.updateProps(props);

            if (popup && popup[0]) {
              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            }
          },
          onKeyDown(props: any) {
            if (props.event.key === "Escape") {
              if (popup && popup[0]) {
                popup[0].hide();
              }
              return true;
            }
            return false;
          },
          onExit() {
            if (popup && popup[0]) {
              popup[0].destroy();
            }
            if (component) {
              component.destroy();
            }
          },
        };
      },
    },
  }),
];

interface NutshellEditorProps {
  nutshell: string;
  originalNutshell: string;
  onNutshellChange: (nutshell: string) => void;
}

const NutshellEditor = ({
  nutshell,
  originalNutshell,
  onNutshellChange,
}: NutshellEditorProps) => {
  const { token } = useToken();

  // Initialize TipTap editor
  const editor = useEditor(
    {
      extensions: editorExtensions,
      content: nutshell,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onNutshellChange(html);
      },
      editorProps: {
        attributes: {
          class: "notion-editor",
        },
      },
    },
    [] // Empty dependency array - only create editor once
  );

  const handleInsertVariable = (variableId: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`${variableId} `).run();
  };

  // Check if nutshell has changed
  const hasChanged = nutshell !== originalNutshell;

  const handleRevert = () => {
    onNutshellChange(originalNutshell);
    editor?.commands.setContent(originalNutshell);
  };

  // Sync editor content when nutshell prop changes externally
  useEffect(() => {
    if (!editor || !nutshell) return;

    // Only update if the content is different from what's currently in the editor
    const currentContent = editor.getHTML();
    if (currentContent !== nutshell) {
      editor.commands.setContent(nutshell, { emitUpdate: false });
    }
  }, [nutshell, editor]);

  // Add CSS for variable mentions and scrollbar
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .variable-mention {
        background: ${token.colorInfoBg};
        color: ${token.colorInfoText};
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
        font-size: 0.95em;
        border: 1px solid ${token.colorInfoBorder};
        white-space: nowrap;
      }
      
      /* Custom scrollbar for variable menu */
      .variable-menu::-webkit-scrollbar {
        width: 6px;
      }
      
      .variable-menu::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 8px;
      }
      
      .variable-menu::-webkit-scrollbar-thumb {
        background: #d9d9d9;
        border-radius: 8px;
      }
      
      .variable-menu::-webkit-scrollbar-thumb:hover {
        background: #bfbfbf;
      }
      
      /* Override tippy.js default border and styling */
      .tippy-box {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        background-color: transparent !important;
      }
      
      .tippy-content {
        padding: 0 !important;
        background: transparent !important;
      }
      
      .tippy-box[data-theme~='light'] {
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      
      .tippy-box[data-placement^='bottom'] > .tippy-arrow:before {
        border-bottom-color: transparent !important;
      }
      
      .tippy-box > .tippy-backdrop {
        background-color: transparent !important;
      }
      
      .tippy-box > .tippy-svg-arrow {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [token]);

  // Notion-like drag handles implementation
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
    let isHoveringHandle = false;
    let hideTimeout: NodeJS.Timeout | null = null;
    let dragPreview: HTMLElement | null = null;
    let isDragging = false;

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

    // Create custom drop indicator
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

        if (targetRect.height === 0 || containerRect.height === 0) {
          return;
        }

        let topPos;
        let leftPos = 8;

        if (target.tagName === "LI") {
          const computedStyle = window.getComputedStyle(target);
          const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
          const lineHeight = parseFloat(computedStyle.lineHeight) || 24;

          topPos = targetRect.top - containerRect.top + paddingTop + lineHeight / 2 - 5;

          let nestingLevel = 0;
          let parent = target.parentElement;
          while (parent) {
            if (parent.tagName === "LI") {
              nestingLevel++;
            }
            if (parent === editorElement) break;
            parent = parent.parentElement;
          }

          const targetLeftOffset = targetRect.left - containerRect.left;
          const handleLeftPosition = Math.max(8, targetLeftOffset - 40);
          leftPos = handleLeftPosition;
          dragHandle.style.left = `${handleLeftPosition}px`;
        } else if (target.tagName === "UL" || target.tagName === "OL") {
          const firstItem = target.querySelector("li");
          if (firstItem) {
            const firstItemRect = firstItem.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(firstItem);
            const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
            const lineHeight = parseFloat(computedStyle.lineHeight) || 24;

            topPos = firstItemRect.top - containerRect.top + paddingTop + lineHeight / 2 - 5;
            leftPos = 8;
            dragHandle.style.left = "8px";
          } else {
            topPos = targetRect.top - containerRect.top + 8;
            leftPos = 8;
            dragHandle.style.left = "8px";
          }
        } else {
          const computedStyle = window.getComputedStyle(target);
          const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
          const lineHeight = parseFloat(computedStyle.lineHeight) || 24;

          topPos = targetRect.top - containerRect.top + paddingTop + lineHeight / 2 - 5;
          leftPos = 8;
          dragHandle.style.left = "8px";
        }

        const minTop = 0;
        const maxTop = containerRect.height - 20;
        const boundedTopPos = Math.max(minTop, Math.min(topPos, maxTop));

        dragHandle.style.display = "flex";
        dragHandle.style.top = `${boundedTopPos}px`;
      } catch (error) {
        // Silently handle errors
      }
    };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target === dragHandle || dragHandle.contains(target)) {
        isHoveringHandle = true;
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        return;
      }

      const containerRect = editorContainer.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const relativeY = e.clientY - containerRect.top;

      if (relativeX >= 0 && relativeX <= 44 && currentBlockElement) {
        isHoveringHandle = true;
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
      } else {
        isHoveringHandle = false;
      }

      let blockElement: HTMLElement | null = null;

      const blocks = editorElement.querySelectorAll("p, h1, h2, h3, li, blockquote, pre");

      for (const block of blocks) {
        const blockRect = block.getBoundingClientRect();
        const blockTop = blockRect.top - containerRect.top;
        const blockBottom = blockRect.bottom - containerRect.top;

        if (relativeY >= blockTop && relativeY <= blockBottom) {
          blockElement = block as HTMLElement;
          break;
        }
      }

      if (blockElement && blockElement !== currentBlockElement) {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        currentBlockElement = blockElement;
        isHoveringHandle = false;
        updateDragHandlePosition(blockElement);
      } else if (!blockElement && !isHoveringHandle) {
        if (currentBlockElement && !hideTimeout) {
          hideTimeout = setTimeout(() => {
            dragHandle.style.display = "none";
            currentBlockElement = null;
            isHoveringHandle = false;
            hideTimeout = null;
          }, 500);
        }
      }
    };

    // Drag start handler
    const handleDragStart = (e: DragEvent) => {
      if (isDragging) {
        e.preventDefault();
        return;
      }

      e.stopPropagation();

      if (!currentBlockElement) {
        isDragging = false;
        return;
      }

      isDragging = true;

      try {
        let pos: number;
        try {
          const firstChild = currentBlockElement.firstChild;
          if (firstChild) {
            pos = editor.view.posAtDOM(firstChild, 0);
          } else {
            pos = editor.view.posAtDOM(currentBlockElement, 0);
          }
        } catch (e) {
          pos = editor.view.posAtDOM(currentBlockElement, 0);
        }

        const $pos = editor.state.doc.resolve(pos);

        let depth = $pos.depth;
        let foundNode = false;
        while (depth > 0) {
          const node = $pos.node(depth);

          if (
            node.type.name === "paragraph" ||
            node.type.name === "heading" ||
            node.type.name === "listItem" ||
            node.type.name === "bulletList" ||
            node.type.name === "orderedList"
          ) {
            foundNode = true;
            let parentListType: string | undefined;
            if (node.type.name === "listItem") {
              for (let i = depth + 1; i <= $pos.depth; i++) {
                const parentNode = $pos.node(i);
                if (
                  parentNode.type.name === "bulletList" ||
                  parentNode.type.name === "orderedList"
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
          isDragging = false;
          return;
        }

        if (draggedNode) {
          const { from, to } = draggedNode;
          if (
            from < 0 ||
            to < 0 ||
            from >= to ||
            to > editor.state.doc.content.size
          ) {
            isDragging = false;
            draggedNode = null;
            return;
          }

          currentBlockElement.classList.add("is-dragging");

          dragPreview = currentBlockElement.cloneNode(true) as HTMLElement;
          const blockRect = currentBlockElement.getBoundingClientRect();

          if (blockRect.width === 0 || blockRect.height === 0) {
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

          const offsetX = e.clientX - blockRect.left;
          const offsetY = e.clientY - blockRect.top;

          e.dataTransfer!.setDragImage(dragPreview, offsetX, offsetY);
          e.dataTransfer!.effectAllowed = "move";
          e.dataTransfer!.setData("text/plain", "");
        } else {
          isDragging = false;
        }
      } catch (error) {
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

        const { from, to, node, parentListType } = draggedNode;

        if (from < 0 || to < 0 || from >= to) {
          throw new Error("Invalid node positions");
        }

        if (finalDropPos >= from && finalDropPos <= to) {
          return;
        }

        const nodeSize = to - from;
        if (
          finalDropPos === to ||
          finalDropPos === from ||
          finalDropPos === to + 1 ||
          finalDropPos === from - 1
        ) {
          return;
        }

        if (finalDropPos < 0 || finalDropPos > editor.state.doc.content.size) {
          throw new Error("Drop position out of bounds");
        }

        const $finalDropPos = editor.state.doc.resolve(finalDropPos);

        if ($finalDropPos.parent.isTextblock) {
          if (
            $finalDropPos.parentOffset !== 0 &&
            $finalDropPos.parentOffset !== $finalDropPos.parent.content.size
          ) {
            return;
          }
        }

        const isDropInList = (() => {
          for (let i = $finalDropPos.depth; i > 0; i--) {
            const parentType = $finalDropPos.node(i).type.name;
            if (parentType === "bulletList" || parentType === "orderedList") {
              return true;
            }
          }
          return false;
        })();

        let nodeToInsert = node;
        if (node.type.name === "listItem" && !isDropInList && parentListType) {
          const listType = editor.schema.nodes[parentListType];
          if (listType) {
            nodeToInsert = listType.create(null, [node]);
          }
        }

        const tr = editor.state.tr;

        if (finalDropPos > to) {
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
          const newPos = finalDropPos;

          if (
            newPos + nodeSize === from ||
            newPos < 0 ||
            newPos > editor.state.doc.content.size
          ) {
            return;
          }

          tr.insert(newPos, nodeToInsert);
          const insertedSize = nodeToInsert.nodeSize;
          tr.delete(from + insertedSize, to + insertedSize);
        }

        if (tr.docChanged) {
          editor.view.dispatch(tr);
        }
      } catch (error) {
        // Silently handle errors
      } finally {
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

    // Drag over handler
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();

      if (!draggedNode) {
        dropIndicator.style.display = "none";
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "none";
        }
        return;
      }

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

      if ($finalDropPos.parent.isTextblock) {
        if (
          $finalDropPos.parentOffset !== 0 &&
          $finalDropPos.parentOffset !== $finalDropPos.parent.content.size
        ) {
          dropIndicator.style.display = "none";
          if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "none";
          }
          return;
        }
      }

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

    // Hover effects
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

    const handleMouseLeave = () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      dragHandle.style.display = "none";
      currentBlockElement = null;
    };
    editorContainer.addEventListener("mouseleave", handleMouseLeave);

    // Cleanup
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      editorContainer.removeEventListener("mousemove", handleMouseMove);
      dragHandle.removeEventListener("dragstart", handleDragStart);
      dragHandle.removeEventListener("dragend", handleDragEnd);
      dragHandle.removeEventListener("mouseenter", handleDragHandleMouseEnter);
      dragHandle.removeEventListener("mouseleave", handleDragHandleMouseLeave);
      editorElement.removeEventListener("drop", handleDrop);
      editorElement.removeEventListener("dragover", handleDragOver);
      editorContainer.removeEventListener("mouseleave", handleMouseLeave);
      dragHandle.remove();
      dropIndicator.remove();
    };
  }, [editor]);

  return (
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
            Nutshell
          </Text>
          <Text
            type="secondary"
            style={{
              fontSize: 12,
            }}
          >
            Quick summary of key benefits
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

          <div
            style={{
              width: 1,
              height: 24,
              background: token.colorBorder,
              margin: "0 8px",
            }}
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

          <div
            style={{
              width: 1,
              height: 24,
              background: token.colorBorder,
              margin: "0 8px",
            }}
          />

          <Tooltip title="Insert Variable (or type $)">
            <Dropdown
              menu={{
                items: AVAILABLE_VARIABLES.map((variable) => ({
                  key: variable.id,
                  label: (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          background: token.colorInfoBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Variable size={12} style={{ color: token.colorInfo }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: token.colorText }}>
                          {variable.label}
                        </div>
                        <div style={{ fontSize: 11, color: token.colorTextSecondary, fontFamily: "Monaco, Menlo, monospace" }}>
                          <span>{variable.id}</span>
                          <span style={{ margin: "0 6px", color: token.colorTextTertiary }}>•</span>
                          <span>{variable.category}</span>
                        </div>
                      </div>
                    </div>
                  ),
                  onClick: () => handleInsertVariable(variable.id),
                })),
                style: { 
                  maxHeight: 400, 
                  overflowY: "auto",
                  minWidth: 280,
                },
              }}
              trigger={["click"]}
            >
              <Button
                size="small"
                type="text"
                icon={<Variable size={16} />}
              />
            </Dropdown>
          </Tooltip>
        </div>
      )}

      <div style={{ position: "relative" }}>
        {/* Editor Container */}
        <div
          className="notion-editor-container"
          style={{
            minHeight: 150,
            padding: "8px 0",
            position: "relative",
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </Card>
  );
};

export default NutshellEditor;

