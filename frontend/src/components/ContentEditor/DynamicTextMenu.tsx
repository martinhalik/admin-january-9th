import { Typography, Tag, theme } from "antd";
import { DynamicTextOption } from "./types";

const { Text } = Typography;
const { useToken } = theme;

export interface DynamicTextMenuProps {
  selectedIndex: number;
  onSelect: (option: DynamicTextOption) => void;
  onHover: (index: number) => void;
  options: DynamicTextOption[];
  searchTerm?: string;
}

const DynamicTextMenu = ({
  selectedIndex,
  onSelect,
  onHover,
  options,
  searchTerm = "",
}: DynamicTextMenuProps) => {
  const { token } = useToken();

  // Highlight matching text
  const highlightText = (text: string, search: string) => {
    if (!search) return text;

    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark
              key={i}
              style={{
                backgroundColor: token.colorWarningBg,
                color: token.colorWarningText,
                padding: "1px 2px",
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 4px)", // 4px below the input
        left: 0,
        zIndex: 9999,
        background: token.colorBgElevated,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: 8,
        boxShadow: `0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)`,
        maxHeight: 320,
        overflowY: "auto",
        width: 320,
        // Custom scrollbar styling
        scrollbarWidth: "thin",
        scrollbarColor: `${token.colorBorderSecondary} transparent`,
      }}
      className="dynamic-text-menu"
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ padding: "4px" }}>
        {options.map((option, index) => (
          <div
            key={option.key}
            data-dynamic-option-index={index}
            onClick={() => onSelect(option)}
            onMouseEnter={() => onHover(index)}
            style={{
              padding: "10px 12px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background:
                index === selectedIndex
                  ? token.colorFillSecondary
                  : "transparent",
              borderRadius: 6,
              border:
                index === selectedIndex
                  ? `1px solid ${token.colorBorderSecondary}`
                  : "1px solid transparent",
              marginBottom: index === options.length - 1 ? 0 : 2,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
                gap: 8,
              }}
            >
              <Text
                strong
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
                  fontSize: 13,
                  color: token.colorText,
                  letterSpacing: "-0.01em",
                }}
              >
                {highlightText(option.label, searchTerm)}
              </Text>
              {option.tag && (
                <Tag
                  color="blue"
                  style={{
                    fontSize: 10,
                    margin: 0,
                    padding: "0 6px",
                    lineHeight: "18px",
                    fontWeight: 500,
                  }}
                >
                  {option.tag}
                </Tag>
              )}
            </div>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                display: "block",
                lineHeight: 1.5,
              }}
            >
              {highlightText(option.description, searchTerm)}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicTextMenu;
