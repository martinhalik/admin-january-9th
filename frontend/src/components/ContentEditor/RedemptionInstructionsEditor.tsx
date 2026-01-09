import { useEffect } from "react";
import { Typography, Button, theme, Badge, Tooltip, Tag, Alert, Divider, Checkbox } from "antd";
import { RotateCcw, AlertCircle, Bold, Italic, Underline as UnderlineIcon, List as ListIcon, ListOrdered, Link as LinkIcon } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { computeDiff } from "./utils";

const { Text } = Typography;
const { useToken } = theme;

interface RedemptionInstructionsEditorProps {
  instructions: string;
  originalInstructions?: string;
  changeCount?: number;
  onInstructionsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isAuto?: boolean;
  onIsAutoChange?: (isAuto: boolean) => void;
  onUseAuto?: () => void;
  // Dynamic values for preview
  dynamicValues?: {
    phone?: string;
    email?: string;
    locationAddress?: string;
    businessHours?: string;
    validityDays?: number;
    website?: string;
    bookingUrl?: string;
    customUrl?: string;
  };
}

const RedemptionInstructionsEditor = ({
  instructions,
  originalInstructions = "",
  changeCount = 0,
  onInstructionsChange,
  isAuto = true,
  onIsAutoChange,
  onUseAuto,
  dynamicValues = {},
}: RedemptionInstructionsEditorProps) => {
  const { token } = useToken();

  // Check if required fields are filled based on redemption method
  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    
    // Check if instructions contain certain placeholders
    const hasPhonePlaceholder = instructions.includes('$phone');
    const hasEmailPlaceholder = instructions.includes('$email');
    const hasBookingUrlPlaceholder = instructions.includes('$booking_url');
    
    if (hasPhonePlaceholder && !dynamicValues.phone) {
      missing.push('Phone number');
    }
    if (hasEmailPlaceholder && !dynamicValues.email) {
      missing.push('Email address');
    }
    if (hasBookingUrlPlaceholder && !dynamicValues.bookingUrl) {
      missing.push('Booking URL');
    }
    
    return missing;
  };
  
  const missingFields = isAuto ? getMissingFields() : [];

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for redemption instructions
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "editor-link",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: "Enter redemption instructions...",
      }),
    ],
    content: instructions,
    editable: !isAuto,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Create synthetic event for compatibility
      const syntheticEvent = {
        target: { value: html },
        currentTarget: { value: html },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onInstructionsChange(syntheticEvent);
    },
  });

  // Update editor content when instructions prop changes (for auto-mode updates)
  useEffect(() => {
    if (editor && instructions && instructions !== editor.getHTML()) {
      // Set content without triggering onUpdate to avoid switching to custom mode
      editor.commands.setContent(instructions, { emitUpdate: false });
    }
  }, [instructions, editor, isAuto]);

  // Update editor editable state when isAuto changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isAuto);
    }
  }, [isAuto, editor]);


  // Helper to render diff with smart ordering
  const renderDiff = (
    diff: Array<{ text: string; type: "same" | "added" | "removed" }>
  ) => {
    const hasUnchanged = diff.some(
      (part) => part.type === "same" && part.text.trim().length > 0
    );

    let reordered = diff;

    if (!hasUnchanged) {
      const same = diff.filter((p) => p.type === "same");
      const added = diff.filter((p) => p.type === "added");
      const removed = diff.filter((p) => p.type === "removed");
      reordered = [...same, ...added, ...removed];
    }

    return reordered.map((part, idx) => {
      if (part.type === "same") {
        return (
          <span
            key={`same-${idx}`}
            style={{ color: token.colorTextDescription }}
          >
            {part.text}
          </span>
        );
      } else if (part.type === "removed") {
        return (
          <span
            key={`removed-${idx}`}
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
            key={`added-${idx}`}
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
    });
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text strong style={{ fontSize: 14 }}>
            Redemption Instructions
          </Text>
          {!isAuto && (
            <Tag
              color="blue"
              style={{
                fontSize: 11,
                padding: "0 8px",
                lineHeight: "20px",
              }}
            >
              Custom
            </Tag>
          )}
          {!isAuto && changeCount > 0 && (
            <Badge
              count={changeCount}
              style={{
                background: token.colorWarning,
                boxShadow: "none",
              }}
            />
          )}
        </div>
        <Checkbox
          checked={isAuto}
          onChange={(e) => {
            if (e.target.checked && onUseAuto) {
              onUseAuto();
            } else if (!e.target.checked && onIsAutoChange) {
              onIsAutoChange(e.target.checked);
            }
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            Use Groupon Template
          </Text>
        </Checkbox>
      </div>

      {/* Instructions TextArea */}
      {missingFields.length > 0 ? (
        <Alert
          message="Missing Required Information"
          description={
            <div>
              <Text>
                Please fill in the following fields in the Booking Details section above to generate redemption instructions:
              </Text>
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                {missingFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          }
          type="warning"
          icon={<AlertCircle size={16} />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : (
        <div>
          {/* Formatting Toolbar */}
          {editor && !isAuto && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                padding: "8px",
                background: token.colorBgLayout,
                border: `1px solid ${token.colorBorder}`,
                borderBottom: "none",
                borderRadius: "8px 8px 0 0",
              }}
            >
              <Tooltip title="Bold">
                <Button
                  size="small"
                  type={editor.isActive("bold") ? "primary" : "text"}
                  icon={<Bold size={16} />}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                />
              </Tooltip>

              <Tooltip title="Italic">
                <Button
                  size="small"
                  type={editor.isActive("italic") ? "primary" : "text"}
                  icon={<Italic size={16} />}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                />
              </Tooltip>

              <Tooltip title="Underline">
                <Button
                  size="small"
                  type={editor.isActive("underline") ? "primary" : "text"}
                  icon={<UnderlineIcon size={16} />}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                />
              </Tooltip>

              <Divider type="vertical" style={{ margin: "0 4px" }} />

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

              <Divider type="vertical" style={{ margin: "0 4px" }} />

              <Tooltip title="Add Link">
                <Button
                  size="small"
                  type={editor.isActive("link") ? "primary" : "text"}
                  icon={<LinkIcon size={16} />}
                  onClick={() => {
                    const url = window.prompt("Enter URL:");
                    if (url) {
                      editor.chain().focus().setLink({ href: url }).run();
                    }
                  }}
                />
              </Tooltip>

              {editor.isActive("link") && (
                <Tooltip title="Remove Link">
                  <Button
                    size="small"
                    type="text"
                    onClick={() => editor.chain().focus().unsetLink().run()}
                  >
                    <LinkIcon size={16} style={{ textDecoration: "line-through" }} />
                  </Button>
                </Tooltip>
              )}
            </div>
          )}

          {/* TipTap Editor */}
          <div
            style={{
              border: `1px solid ${token.colorBorder}`,
              borderRadius: (editor && !isAuto) ? "0 0 8px 8px" : "8px",
              minHeight: 300,
              maxHeight: 600,
              overflow: "auto",
              padding: "12px 16px",
              backgroundColor: isAuto ? token.colorBgContainerDisabled : undefined,
              cursor: isAuto ? "not-allowed" : "text",
            }}
            className="tiptap-redemption-editor"
            onClick={() => {
              if (isAuto && onIsAutoChange) {
                onIsAutoChange(false);
              }
            }}
          >
            <style>{`
              .tiptap-redemption-editor .ProseMirror {
                outline: none;
                min-height: 270px;
                ${isAuto ? `color: ${token.colorTextDisabled};` : ''}
                ${isAuto ? 'pointer-events: none;' : ''}
              }
              
              .tiptap-redemption-editor .ProseMirror p {
                margin: 0.5em 0;
              }
              
              .tiptap-redemption-editor .ProseMirror p:first-child {
                margin-top: 0;
              }
              
              .tiptap-redemption-editor .ProseMirror p:last-child {
                margin-bottom: 0;
              }
              
              .tiptap-redemption-editor .ProseMirror ol,
              .tiptap-redemption-editor .ProseMirror ul {
                padding-left: 1.5em;
                margin: 0.5em 0;
              }
              
              .tiptap-redemption-editor .ProseMirror li {
                margin: 0.25em 0;
              }
              
              .tiptap-redemption-editor .ProseMirror strong {
                font-weight: 600;
              }
              
              .tiptap-redemption-editor .ProseMirror em {
                font-style: italic;
              }
              
              .tiptap-redemption-editor .ProseMirror u {
                text-decoration: underline;
              }
              
              .tiptap-redemption-editor .ProseMirror a {
                color: ${isAuto ? token.colorTextDisabled : token.colorPrimary};
                text-decoration: underline;
                cursor: ${isAuto ? 'not-allowed' : 'pointer'};
              }
              
              .tiptap-redemption-editor .ProseMirror a:hover {
                color: ${isAuto ? token.colorTextDisabled : token.colorPrimaryHover};
              }
              
              .tiptap-redemption-editor .ProseMirror p.is-editor-empty:first-child::before {
                color: ${token.colorTextPlaceholder};
                content: attr(data-placeholder);
                float: left;
                height: 0;
                pointer-events: none;
              }
            `}</style>
            <EditorContent editor={editor} />
          </div>
        </div>
      )}

      {/* Show original if changed - Hidden for now */}
      {false && !isAuto && originalInstructions && instructions !== originalInstructions && (
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
              fontSize: 12,
              flexShrink: 0,
              lineHeight: 1.5,
              padding: "2px 0",
            }}
          >
            Original:
          </Text>
          <div
            style={{ flex: 1, fontSize: 13, lineHeight: 1.5, padding: "2px 0" }}
          >
            {renderDiff(computeDiff(originalInstructions, instructions))}
          </div>
          <Tooltip title="Revert to original">
            <Button
              size="small"
              icon={<RotateCcw size={14} />}
              onClick={() => {
                const syntheticEvent = {
                  target: { value: originalInstructions },
                  currentTarget: { value: originalInstructions },
                } as React.ChangeEvent<HTMLTextAreaElement>;
                onInstructionsChange(syntheticEvent);
              }}
              style={{ flexShrink: 0, marginTop: -2 }}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default RedemptionInstructionsEditor;

