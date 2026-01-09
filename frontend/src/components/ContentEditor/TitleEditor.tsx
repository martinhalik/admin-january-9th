import { useState, useEffect } from "react";
import { Typography, Button, Tag, theme, Badge, Tooltip } from "antd";
import { Settings, RotateCcw } from "lucide-react";
import { DYNAMIC_TEXT_OPTIONS, DynamicTextOption, MediaItem } from "./types";
import { computeDiff } from "./utils";
import DynamicTextMenu from "./DynamicTextMenu";
import TaggedInput from "./TaggedInput";

const { Text } = Typography;
const { useToken } = theme;

interface TitleEditorProps {
  title: string;
  galleryTitle: string;
  shortDescriptor: string;
  descriptor: string;
  originalTitle: string;
  originalGalleryTitle: string;
  originalShortDescriptor: string;
  originalDescriptor: string;
  isGalleryTitleAuto: boolean;
  isDescriptorAuto: boolean;
  changeCount?: number;
  onTitleChange: (title: string) => void;
  onGalleryTitleChange: (galleryTitle: string) => void;
  onShortDescriptorChange: (shortDescriptor: string) => void;
  onDescriptorChange: (descriptor: string) => void;
  onIsGalleryTitleAutoChange: (isAuto: boolean) => void;
  onIsDescriptorAutoChange: (isAuto: boolean) => void;
  onCancel: () => void;
  onPreview: () => void;
  onTitleSettingsOpen?: () => void;
  media?: MediaItem[];
}

const TitleEditor = ({
  title,
  galleryTitle,
  shortDescriptor,
  descriptor,
  originalTitle,
  isGalleryTitleAuto,
  isDescriptorAuto,
  changeCount = 0,
  onTitleChange,
  onGalleryTitleChange,
  onShortDescriptorChange,
  onDescriptorChange,
  onTitleSettingsOpen,
}: TitleEditorProps) => {
  const { token } = useToken();

  // Dynamic text insertion
  const [showDynamicTextMenu, setShowDynamicTextMenu] = useState(false);
  const [currentFieldType, setCurrentFieldType] = useState<
    "title" | "gallery" | "descriptor" | "short"
  >("title");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [filteredOptions, setFilteredOptions] = useState(DYNAMIC_TEXT_OPTIONS);
  const [searchTerm, setSearchTerm] = useState("");

  // Function to resolve dynamic text variables to actual values
  const resolveDynamicText = (text: string): string => {
    let resolved = text;
    // Mock values for demonstration
    const mockValues: Record<string, string> = {
      $lowest_sell_price: "$99",
      $maximum_of_discount_amount: "$50",
      $maximum_of_discount_percentage: "75%",
      $price_1: "$149",
      $value_1: "$199",
    };

    Object.entries(mockValues).forEach(([key, value]) => {
      resolved = resolved.replace(
        new RegExp(key.replace(/\$/g, "\\$"), "g"),
        value
      );
    });

    return resolved;
  };

  // Helper to render diff with smart ordering
  const renderDiff = (
    diff: Array<{ text: string; type: "same" | "added" | "removed" }>
  ) => {
    // Detect if this is a complete replacement (no unchanged text)
    const hasUnchanged = diff.some(
      (part) => part.type === "same" && part.text.trim().length > 0
    );

    let reordered = diff;

    // If it's a complete replacement (no unchanged text), group all added before all removed
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

  // Handle dynamic text insertion
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void,
    fieldType: "title" | "gallery" | "descriptor" | "short"
  ) => {
    const value = e.target.value;
    const input = e.target;
    const cursorPos = input.selectionStart || 0;

    setter(value);
    setCurrentFieldType(fieldType);

    // Find the last "$" before the cursor
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastDollarIndex = textBeforeCursor.lastIndexOf("$");

    if (lastDollarIndex >= 0) {
      // Extract text after "$" up to cursor
      const searchText = textBeforeCursor.substring(lastDollarIndex + 1);

      // Check if there's a space or if we're still in the variable
      if (!searchText.includes(" ") && !searchText.includes("\n")) {
        setSearchTerm(searchText);

        // Filter options based on search text
        const filtered = DYNAMIC_TEXT_OPTIONS.filter(
          (option) =>
            option.value
              .toLowerCase()
              .includes(("$" + searchText).toLowerCase()) ||
            option.label.toLowerCase().includes(searchText.toLowerCase()) ||
            option.description.toLowerCase().includes(searchText.toLowerCase())
        );

        if (filtered.length > 0) {
          setFilteredOptions(filtered);
          setSelectedOptionIndex(0); // Reset to first filtered option
          setShowDynamicTextMenu(true);
        } else {
          setShowDynamicTextMenu(false);
        }
      } else {
        setShowDynamicTextMenu(false);
      }
    } else {
      setShowDynamicTextMenu(false);
      setSearchTerm("");
      setFilteredOptions(DYNAMIC_TEXT_OPTIONS);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDynamicTextMenu) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedOptionIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedOptionIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (filteredOptions.length > 0) {
        e.preventDefault();
        insertDynamicText(filteredOptions[selectedOptionIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowDynamicTextMenu(false);
    }
  };

  const insertDynamicText = (option: DynamicTextOption) => {
    // Get current value and update based on field type
    let currentValue = "";
    let setter: (value: string) => void;

    if (currentFieldType === "title") {
      currentValue = title;
      setter = onTitleChange;
    } else if (currentFieldType === "gallery") {
      currentValue = galleryTitle;
      setter = onGalleryTitleChange;
    } else if (currentFieldType === "descriptor") {
      currentValue = descriptor;
      setter = onDescriptorChange;
    } else {
      currentValue = shortDescriptor;
      setter = onShortDescriptorChange;
    }

    // Find the last "$" in the current value
    const dollarPos = currentValue.lastIndexOf("$");

    if (dollarPos >= 0) {
      // Find where the current variable ends (space, newline, or end of string)
      let endPos = dollarPos + 1;
      while (
        endPos < currentValue.length &&
        currentValue[endPos] !== " " &&
        currentValue[endPos] !== "\n"
      ) {
        endPos++;
      }

      // Replace from "$" to the end of the variable with the selected option
      const newValue =
        currentValue.substring(0, dollarPos) +
        option.value +
        currentValue.substring(endPos);

      setter(newValue);

      // Refocus the input
      setTimeout(() => {
        const input = document.querySelector(
          currentFieldType === "title"
            ? 'input[placeholder="Enter deal title..."]'
            : currentFieldType === "gallery"
            ? 'input[placeholder="Enter gallery title..."]'
            : currentFieldType === "descriptor"
            ? 'input[placeholder="Enter descriptor..."]'
            : 'input[placeholder="Enter short descriptor..."]'
        ) as HTMLInputElement;

        if (input) {
          input.focus();
          const newCursorPos = dollarPos + option.value.length;
          input.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }

    setShowDynamicTextMenu(false);
    setSearchTerm("");
    setFilteredOptions(DYNAMIC_TEXT_OPTIONS);
  };

  // Scroll selected option into view
  useEffect(() => {
    if (showDynamicTextMenu) {
      const selectedElement = document.querySelector(
        `[data-dynamic-option-index="${selectedOptionIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedOptionIndex, showDynamicTextMenu]);

  // Close menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDynamicTextMenu(false);
    };

    const handleScroll = () => {
      setShowDynamicTextMenu(false);
    };

    if (showDynamicTextMenu) {
      document.addEventListener("click", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true); // true for capture phase to catch all scrolls
      return () => {
        document.removeEventListener("click", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [showDynamicTextMenu]);

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Text strong style={{ fontSize: 14 }}>
          Title
        </Text>
        {changeCount > 0 && (
          <Tag color="orange" style={{ fontSize: 11 }}>
            {changeCount} {changeCount === 1 ? "change" : "changes"}
          </Tag>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <TaggedInput
            value={title}
            onChange={(e) => {
              handleInputChange(e, onTitleChange, "title");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter deal title..."
            resolveDynamicText={resolveDynamicText}
            style={{
              fontSize: 16,
              fontWeight: 500,
              width: "100%",
            }}
          />
          {/* Dynamic Text Menu for Title */}
          {showDynamicTextMenu && currentFieldType === "title" && (
            <DynamicTextMenu
              selectedIndex={selectedOptionIndex}
              onSelect={insertDynamicText}
              onHover={setSelectedOptionIndex}
              options={filteredOptions}
              searchTerm={searchTerm}
            />
          )}
        </div>
        <Badge
          dot={
            !isGalleryTitleAuto ||
            !isDescriptorAuto ||
            shortDescriptor.length > 0
          }
          color={token.colorPrimary}
          offset={[1, 1]}
        >
          <Button
            icon={<Settings size={16} />}
            style={{ flexShrink: 0 }}
            type="primary"
            onClick={() => onTitleSettingsOpen?.()}
          />
        </Badge>
      </div>

      {/* Show original title if it has been changed */}
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
  );
};

export default TitleEditor;
