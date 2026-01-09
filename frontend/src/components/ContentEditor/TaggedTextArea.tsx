import { useRef, useEffect } from "react";
import { theme } from "antd";
import { REDEMPTION_DYNAMIC_TEXT_OPTIONS } from "./types";

const { useToken } = theme;

interface TaggedTextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onClick?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  style?: React.CSSProperties;
  resolveDynamicText?: (text: string) => string;
  autoSize?: { minRows?: number; maxRows?: number };
}

interface TextPart {
  type: "text" | "tag";
  content: string;
  index: number;
  position: number;
}

const TaggedTextArea = ({
  value,
  onChange,
  onKeyDown,
  onClick,
  onBlur,
  placeholder,
  readOnly = false,
  style = {},
  resolveDynamicText,
  autoSize = { minRows: 3, maxRows: 8 },
}: TaggedTextAreaProps) => {
  const { token } = useToken();
  const editableRef = useRef<HTMLDivElement>(null);
  const isUpdatingContent = useRef(false);
  // const isReplacingTag = useRef(false);

  // Parse the value into text and tag parts
  const parseValue = (text: string): TextPart[] => {
    const parts: TextPart[] = [];
    const validVariables = REDEMPTION_DYNAMIC_TEXT_OPTIONS.map((opt: any) =>
      opt.value.replace(/\$/g, "\\$")
    );
    const regex = new RegExp(`(${validVariables.join("|")})`, "gi");

    let lastIndex = 0;
    let match;
    let index = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
          index: index++,
          position: lastIndex,
        });
      }

      parts.push({
        type: "tag",
        content: match[0],
        index: index++,
        position: match.index,
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex),
        index: index++,
        position: lastIndex,
      });
    }

    return parts;
  };

  // Extract text content from contenteditable div
  const extractTextFromDiv = (): string => {
    if (!editableRef.current) return "";
    
    let text = "";
    const nodes = editableRef.current.childNodes;
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || "";
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.classList.contains("tag-wrapper")) {
          const tagContent = element.getAttribute("data-tag");
          text += tagContent || "";
        } else if (element.tagName === "BR") {
          text += "\n";
        } else {
          text += element.textContent || "";
        }
      }
    }
    
    return text;
  };

  // Handle input in the contenteditable div
  const handleInput = () => {
    if (isUpdatingContent.current) return;
    
    const newValue = extractTextFromDiv();
    const syntheticEvent = {
      target: { value: newValue },
      currentTarget: { value: newValue },
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onChange(syntheticEvent);
  };

  // Handle keydown events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onKeyDown) {
      const syntheticEvent = e as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
      onKeyDown(syntheticEvent);
    }
  };

  // Update content when value changes from outside
  useEffect(() => {
    if (!editableRef.current || isUpdatingContent.current) return;
    
    const currentText = extractTextFromDiv();
    if (currentText === value) return;
    
    isUpdatingContent.current = true;
    
    // Save current selection
    const selection = window.getSelection();
    let cursorOffset = 0;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorOffset = range.startOffset;
    }
    
    // Render new content
    renderContent();
    
    // Try to restore cursor position
    setTimeout(() => {
      if (editableRef.current && selection) {
        try {
          const range = document.createRange();
          const firstTextNode = findFirstTextNode(editableRef.current);
          if (firstTextNode) {
            const offset = Math.min(cursorOffset, firstTextNode.textContent?.length || 0);
            range.setStart(firstTextNode, offset);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } catch (e) {
          // Ignore cursor restoration errors
        }
      }
      isUpdatingContent.current = false;
    }, 0);
  }, [value]);

  // Find first text node for cursor positioning
  const findFirstTextNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) return node;
    for (let i = 0; i < node.childNodes.length; i++) {
      const result = findFirstTextNode(node.childNodes[i]);
      if (result) return result;
    }
    return null;
  };

  // Render content into the contenteditable div
  const renderContent = () => {
    if (!editableRef.current) return;
    
    const parts = parseValue(value);
    editableRef.current.innerHTML = "";
    
    if (parts.length === 0 && !value) {
      return; // Show placeholder
    }
    
    parts.forEach((part) => {
      if (part.type === "text") {
        // Split by newlines and add BR tags
        const lines = part.content.split("\n");
        lines.forEach((line, lineIndex) => {
          if (line) {
            const textNode = document.createTextNode(line);
            editableRef.current!.appendChild(textNode);
          }
          if (lineIndex < lines.length - 1) {
            const br = document.createElement("br");
            editableRef.current!.appendChild(br);
          }
        });
      } else {
        // Create tag element
        const tagSpan = createTagElement(part.content, part.position);
        editableRef.current!.appendChild(tagSpan);
      }
    });
  };

  // Create a tag element using Ant Design Tag styles
  const createTagElement = (tagContent: string, position: number): HTMLSpanElement => {
    const wrapper = document.createElement("span");
    wrapper.className = "tag-wrapper";
    wrapper.contentEditable = "false";
    wrapper.setAttribute("data-tag", tagContent);
    wrapper.setAttribute("data-position", position.toString());
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";
    wrapper.style.margin = "0";
    wrapper.style.verticalAlign = "middle";
    
    const displayValue = resolveDynamicText ? resolveDynamicText(tagContent) : tagContent;
    
    const tagElement = document.createElement("span");
    // Using Ant Design Tag styles with tokens
    tagElement.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: ${token.marginXXS}px;
      background-color: ${token.colorSuccessBg};
      color: ${token.colorSuccess};
      border: 1px solid ${token.colorSuccessBorder};
      border-radius: ${token.borderRadiusSM}px;
      padding: 0 ${token.paddingXS}px;
      font-size: ${token.fontSizeSM}px;
      line-height: ${token.lineHeightSM};
      height: auto;
      max-height: 22px;
      cursor: ${readOnly ? 'default' : 'pointer'};
      transition: all ${token.motionDurationMid};
      box-sizing: border-box;
      white-space: nowrap;
      font-family: ${token.fontFamily};
    `;
    
    // Add hover effect if not readonly
    if (!readOnly) {
      tagElement.addEventListener("mouseenter", () => {
        tagElement.style.opacity = "0.85";
      });
      tagElement.addEventListener("mouseleave", () => {
        tagElement.style.opacity = "1";
      });
    }
    
    // Content span
    const contentSpan = document.createElement("span");
    contentSpan.textContent = displayValue;
    contentSpan.title = `Variable: ${tagContent}`;
    contentSpan.style.cssText = `
      line-height: 1;
      font-weight: normal;
    `;
    tagElement.appendChild(contentSpan);
    
    if (!readOnly) {
      // Add dropdown icon
      const dropdownIcon = document.createElement("span");
      dropdownIcon.innerHTML = `
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="opacity: 0.7; display: block;">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      `;
      dropdownIcon.style.cssText = `
        display: inline-flex;
        align-items: center;
        line-height: 1;
      `;
      tagElement.appendChild(dropdownIcon);
      
      // Add click handler for dropdown
      // tagElement.addEventListener("click", (e) => {
      //   e.stopPropagation();
      //   showTagDropdown(tagContent, position, tagElement);
      // });
      
      // Add remove button
      const removeBtn = document.createElement("span");
      removeBtn.innerHTML = `
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="display: block;">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      removeBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        line-height: 1;
        margin-left: ${token.marginXXS}px;
        opacity: 0.7;
        transition: opacity ${token.motionDurationMid};
      `;
      removeBtn.addEventListener("mouseenter", () => {
        removeBtn.style.opacity = "1";
      });
      removeBtn.addEventListener("mouseleave", () => {
        removeBtn.style.opacity = "0.7";
      });
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleRemoveTag(tagContent, position);
      });
      tagElement.appendChild(removeBtn);
    }
    
    wrapper.appendChild(tagElement);
    return wrapper;
  };

  // Show dropdown menu for tag (simplified version)
  // const showTagDropdown = (oldTag: string, position: number, element: HTMLElement) => {
  //   // This would need to be implemented with Ant Design Dropdown programmatically
  //   // For now, this is a placeholder
  // };

  // Handle tag removal
  const handleRemoveTag = (tagContent: string, tagPosition: number) => {
    if (readOnly) return;
    
    const newValue = value.substring(0, tagPosition) + 
                     value.substring(tagPosition + tagContent.length);
    
    const syntheticEvent = {
      target: { value: newValue },
      currentTarget: { value: newValue },
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onChange(syntheticEvent);
  };

  // Handle tag replacement
  // const handleReplaceTag = (oldTag: string, newTag: string, tagPosition: number) => {
  //   isReplacingTag.current = true;
  //   
  //   const newValue = value.substring(0, tagPosition) +
  //                    newTag +
  //                    value.substring(tagPosition + oldTag.length);
  //   
  //   const syntheticEvent = {
  //     target: { value: newValue },
  //     currentTarget: { value: newValue },
  //   } as React.ChangeEvent<HTMLTextAreaElement>;
  //   
  //   onChange(syntheticEvent);
  //   
  //   setTimeout(() => {
  //     isReplacingTag.current = false;
  //   }, 100);
  // };

  // Get display value
  // const getDisplayValue = (content: string) => {
  //   if (resolveDynamicText) {
  //     return resolveDynamicText(content);
  //   }
  //   return content;
  // };

  // const parts = parseValue(value);

  return (
    <>
      <style>
        {`
          [data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: ${token.colorTextPlaceholder};
            pointer-events: none;
          }
          [contenteditable]:focus {
            border-color: ${token.colorPrimary} !important;
            box-shadow: 0 0 0 2px ${token.colorPrimaryBg} !important;
          }
        `}
      </style>
      <div
        ref={editableRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onClick={onClick}
        onBlur={() => {
          if (onBlur) onBlur();
        }}
        suppressContentEditableWarning
        style={{
          minHeight: autoSize.minRows ? autoSize.minRows * (token.fontSize * (typeof token.lineHeight === 'number' ? token.lineHeight : 1.5)) + token.paddingXXS * 2 : 74,
          maxHeight: autoSize.maxRows ? autoSize.maxRows * (token.fontSize * (typeof token.lineHeight === 'number' ? token.lineHeight : 1.5)) + token.paddingXXS * 2 : 600,
          overflowY: "auto",
          padding: `${token.paddingXXS}px ${token.paddingSM}px`,
          border: `${token.lineWidth}px solid ${token.colorBorder}`,
          borderRadius: token.borderRadius,
          backgroundColor: readOnly ? token.colorBgContainerDisabled : token.colorBgContainer,
          cursor: readOnly ? "not-allowed" : "text",
          fontSize: style.fontSize || token.fontSize,
          lineHeight: token.lineHeight,
          fontFamily: token.fontFamily,
          color: token.colorText,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          outline: "none",
          transition: `all ${token.motionDurationMid}`,
          ...style,
        }}
        data-placeholder={!value && placeholder ? placeholder : undefined}
      >
        {/* Content will be rendered dynamically */}
      </div>
    </>
  );
};

export default TaggedTextArea;
