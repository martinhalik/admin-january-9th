import { useRef, useState, useEffect } from "react";
import { theme, Tag, Input, Dropdown, Tooltip } from "antd";
import { X, ChevronDown } from "lucide-react";
import { DYNAMIC_TEXT_OPTIONS } from "./types";

const { useToken } = theme;

interface TaggedInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClick?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  suffix?: React.ReactNode;
  style?: React.CSSProperties;
  resolveDynamicText?: (text: string) => string;
  maxLength?: number;
}

interface TextPart {
  type: "text" | "tag";
  content: string;
  index: number;
  position: number; // Character position in the original string
}

const TaggedInput = ({
  value,
  onChange,
  onKeyDown,
  onClick,
  onBlur,
  placeholder,
  readOnly = false,
  suffix,
  style = {},
  resolveDynamicText,
  maxLength,
}: TaggedInputProps) => {
  const { token } = useToken();
  const [isFocused, setIsFocused] = useState(false);
  const [shouldMoveCursorToEnd, setShouldMoveCursorToEnd] = useState(false);
  const [targetCursorPosition, setTargetCursorPosition] = useState<
    number | null
  >(null);
  const inputRef = useRef<any>(null);
  const tagViewRef = useRef<HTMLDivElement>(null);
  const isReplacingTag = useRef(false);

  // Auto-focus the input and set cursor position when switching modes
  useEffect(() => {
    if (isFocused && inputRef.current) {
      try {
        const input = inputRef.current.input || inputRef.current;
        if (input && typeof input.focus === "function") {
          setTimeout(() => {
            input.focus();

            if (input.setSelectionRange && typeof input.value === "string") {
              // If we have a specific target position, use it
              if (targetCursorPosition !== null) {
                const pos = Math.min(targetCursorPosition, input.value.length);
                input.setSelectionRange(pos, pos);
                setTargetCursorPosition(null);
              }
              // Otherwise, if moving cursor to end is requested
              else if (shouldMoveCursorToEnd) {
                const len = input.value.length;
                input.setSelectionRange(len, len);
                setShouldMoveCursorToEnd(false);
              }
            }
          }, 0);
        }
      } catch (error) {
        // Focus error - silently handled
      }
    }
  }, [isFocused, shouldMoveCursorToEnd, targetCursorPosition, value]);

  // Parse the value into text and tag parts
  const parseValue = (text: string): TextPart[] => {
    const parts: TextPart[] = [];

    // Create a regex pattern that matches only the specific dynamic variables
    const validVariables = DYNAMIC_TEXT_OPTIONS.map((opt) =>
      opt.value.replace(/\$/g, "\\$")
    );
    const regex = new RegExp(`(${validVariables.join("|")})`, "gi");

    let lastIndex = 0;
    let match;
    let index = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
          index: index++,
          position: lastIndex,
        });
      }

      // Add the tag (only if it's a valid dynamic variable)
      parts.push({
        type: "tag",
        content: match[0],
        index: index++,
        position: match.index,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
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

  const parts = parseValue(value);
  const hasTags = parts.some((part) => part.type === "tag");

  const handleRemoveTag = (
    tagContent: string,
    tagPosition?: number,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }
    if (readOnly) return;

    let newValue = value;
    if (tagPosition !== undefined) {
      // Use position for precise removal
      if (
        value.substring(tagPosition, tagPosition + tagContent.length) ===
        tagContent
      ) {
        newValue =
          value.substring(0, tagPosition) +
          value.substring(tagPosition + tagContent.length);
      } else {
        // Fallback: remove first occurrence
        newValue = value.replace(tagContent, "");
      }
    } else {
      // No position provided, remove first occurrence
      newValue = value.replace(tagContent, "");
    }

    // Create a synthetic event
    const syntheticEvent = {
      target: { value: newValue },
      currentTarget: { value: newValue },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
  };

  // Always resolve dynamic text to show actual values
  const getDisplayValue = (content: string) => {
    if (resolveDynamicText) {
      return resolveDynamicText(content);
    }
    return content;
  };

  const handleReplaceTag = (
    oldTag: string,
    newTag: string,
    tagPosition?: number
  ) => {
    // Set flag to prevent auto-focusing
    isReplacingTag.current = true;

    let newValue = value;

    if (tagPosition !== undefined) {
      // If we have a specific position, use it to do a more precise replacement
      if (
        value.substring(tagPosition, tagPosition + oldTag.length) === oldTag
      ) {
        newValue =
          value.substring(0, tagPosition) +
          newTag +
          value.substring(tagPosition + oldTag.length);
      } else {
        // Fallback: find the tag and replace it
        newValue = value.replace(oldTag, newTag);
      }
    } else {
      // No position provided, use indexOf and replace first occurrence
      newValue = value.replace(oldTag, newTag);
    }

    // Don't switch to focused/edit mode when replacing tags
    // This allows users to stay in the tag view with resolved values

    const syntheticEvent = {
      target: { value: newValue },
      currentTarget: { value: newValue },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);

    // Reset flag after a short delay
    setTimeout(() => {
      isReplacingTag.current = false;
    }, 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (maxLength && e.target.value.length > maxLength) {
      return; // Don't allow typing beyond maxLength
    }
    onChange(e);
  };

  // Calculate cursor position based on click location by measuring rendered elements
  const calculateCursorPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tagViewRef.current) return 0;

    const clickX = e.clientX;
    const containerRect = tagViewRef.current.getBoundingClientRect();
    const relativeClickX = clickX - containerRect.left;

    // Find all rendered text and tag elements
    const contentDiv = tagViewRef.current.querySelector(
      "[data-content-container]"
    );
    if (!contentDiv) {
      // Fallback to simple ratio calculation
      const clickRatio = Math.max(
        0,
        Math.min(1, relativeClickX / containerRect.width)
      );
      return Math.round(value.length * clickRatio);
    }

    let cumulativeTextPosition = 0;
    let cumulativeWidth = 0;
    const children = Array.from(contentDiv.children);

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childRect = child.getBoundingClientRect();
      const childWidth = childRect.width;
      const childRelativeLeft = childRect.left - containerRect.left;
      const childRelativeRight = childRelativeLeft + childWidth;

      // Get the text length for this element
      const partIndex = parseInt(child.getAttribute("data-part-index") || "0");
      const part = parts[partIndex];

      if (!part) continue;

      // Check if click is within this element
      if (
        relativeClickX >= childRelativeLeft &&
        relativeClickX <= childRelativeRight
      ) {
        // Click is within this element
        const clickWithinElement = relativeClickX - childRelativeLeft;
        const clickRatioInElement =
          childWidth > 0 ? clickWithinElement / childWidth : 0;

        // For text parts, calculate position within the text
        if (part.type === "text") {
          const positionInPart = Math.round(
            part.content.length * clickRatioInElement
          );
          return cumulativeTextPosition + positionInPart;
        } else {
          // For tag parts, if clicked on left half, place cursor before tag, else after
          return clickRatioInElement < 0.5
            ? cumulativeTextPosition
            : cumulativeTextPosition + part.content.length;
        }
      }

      // Add this part's length to cumulative position
      cumulativeTextPosition += part.content.length;
      cumulativeWidth = childRelativeRight;
    }

    // If we're past all elements, place cursor at the end
    if (relativeClickX > cumulativeWidth) {
      return value.length;
    }

    // Default to start if something went wrong
    return 0;
  };

  // Render custom view with tags only when NOT focused
  if (hasTags && !isFocused) {
    return (
      <div
        ref={tagViewRef}
        onClick={(e) => {
          // Don't focus if we're in the middle of replacing a tag
          if (isReplacingTag.current) {
            return;
          }

          if (!readOnly) {
            // Calculate where the user clicked and set cursor there
            const position = calculateCursorPosition(e);
            setTargetCursorPosition(position);
            setIsFocused(true);
          }
          if (onClick) {
            // When switching from readOnly mode, move cursor to the end
            if (readOnly) {
              setShouldMoveCursorToEnd(true);
            }
            onClick();
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 11px",
          border: `1px solid ${token.colorBorder}`,
          borderRadius: token.borderRadius,
          backgroundColor: readOnly
            ? token.colorBgContainerDisabled
            : token.colorBgContainer,
          cursor: readOnly ? "not-allowed" : "text",
          minHeight: 32,
          flexWrap: "wrap",
          transition: "all 0.2s",
          ...style,
        }}
      >
        {/* Render parts */}
        <div
          data-content-container
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 3,
            flex: 1,
            minHeight: 18,
          }}
        >
          {parts.map((part) => {
            if (part.type === "tag") {
              const displayValue = getDisplayValue(part.content);
              // const isResolved = displayValue !== part.content;

              // Create dropdown items for changing the dynamic variable
              const dropdownItems = DYNAMIC_TEXT_OPTIONS.map((option) => ({
                key: option.value,
                label: (
                  <div
                    style={{
                      padding: "4px 0",
                      minWidth: 250,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        marginBottom: 2,
                        color: token.colorText,
                      }}
                    >
                      {option.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: token.colorTextSecondary,
                      }}
                    >
                      {option.description}
                    </div>
                  </div>
                ),
                onClick: () =>
                  handleReplaceTag(part.content, option.value, part.position),
              }));

              // Add the original code at the top
              const menuItems = [
                {
                  key: "current",
                  label: (
                    <div
                      style={{
                        padding: "8px 0",
                        borderBottom: `1px solid ${token.colorBorder}`,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: token.colorTextSecondary,
                          marginBottom: 4,
                        }}
                      >
                        Current variable:
                      </div>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: 13,
                          color: token.colorPrimary,
                          fontWeight: 500,
                        }}
                      >
                        {part.content}
                      </div>
                    </div>
                  ),
                  disabled: true,
                },
                {
                  type: "divider" as const,
                },
                ...dropdownItems,
              ];

              return (
                <span key={part.index} data-part-index={part.index}>
                  <Dropdown
                    menu={{ items: menuItems }}
                    trigger={["click"]}
                    disabled={readOnly}
                  >
                    <Tag
                      color="green"
                      style={{
                        margin: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                        fontSize: 11,
                        padding: "0 4px",
                        maxHeight: 18,
                        lineHeight: "18px",
                        cursor: readOnly ? "default" : "pointer",
                      }}
                      closable={!readOnly}
                      onClose={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveTag(part.content, part.position, e as any);
                      }}
                      closeIcon={
                        <X
                          size={10}
                          style={{
                            marginLeft: 1,
                          }}
                        />
                      }
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip
                        title={`Variable: ${part.content}`}
                        placement="top"
                      >
                        <span>{displayValue}</span>
                      </Tooltip>
                      <ChevronDown size={10} style={{ opacity: 0.7 }} />
                    </Tag>
                  </Dropdown>
                </span>
              );
            } else {
              // For text parts, show them inline
              return (
                <span
                  key={part.index}
                  data-part-index={part.index}
                  style={{
                    color: token.colorText,
                    fontSize: style.fontSize || 14,
                    fontWeight: style.fontWeight,
                    lineHeight: "22px",
                    wordBreak: "break-word",
                  }}
                >
                  {part.content}
                </span>
              );
            }
          })}
        </div>

        {/* Suffix */}
        {suffix && (
          <div
            style={{ flexShrink: 0, display: "flex", alignItems: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            {suffix}
          </div>
        )}
      </div>
    );
  }

  // For inputs without tags or when focused, use regular Input
  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      onClick={onClick}
      onFocus={() => {
        try {
          setIsFocused(true);
        } catch (error) {
          // Focus state error - silently handled
        }
      }}
      onBlur={() => {
        try {
          setIsFocused(false);
          if (onBlur) onBlur();
        } catch (error) {
          // Blur handler error - silently handled
        }
      }}
      placeholder={placeholder}
      readOnly={readOnly}
      maxLength={maxLength}
      suffix={suffix}
      style={style}
      autoComplete="off"
      data-lpignore="true"
      data-form-type="other"
    />
  );
};

export default TaggedInput;
