import React, { useState } from "react";
import { Modal, Input, Typography } from "antd";
import * as LucideIcons from "lucide-react";
import { Search } from "lucide-react";
import { STAGE_ICONS } from "../constants";

const { Text } = Typography;

interface IconPickerModalProps {
  open: boolean;
  currentIcon: string;
  color?: string;
  onSelect: (icon: string) => void;
  onCancel: () => void;
}

const IconPickerModal: React.FC<IconPickerModalProps> = ({
  open,
  currentIcon,
  color = "#1890ff",
  onSelect,
  onCancel,
}) => {
  const [search, setSearch] = useState("");

  const filteredIcons = STAGE_ICONS.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (icon: string) => {
    onSelect(icon);
    setSearch("");
  };

  const handleCancel = () => {
    onCancel();
    setSearch("");
  };

  return (
    <Modal
      title="Select Icon"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
    >
      <Input
        placeholder="Search icons..."
        prefix={<Search size={14} style={{ color: "#999" }} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
        allowClear
        autoFocus
      />
      
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 8,
          maxHeight: 300,
          overflowY: "auto",
        }}
      >
        {filteredIcons.map((iconName) => {
          const IconComp = (LucideIcons as any)[iconName];
          const isSelected = iconName === currentIcon;
          
          return (
            <div
              key={iconName}
              onClick={() => handleSelect(iconName)}
              style={{
                width: 48,
                height: 48,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                cursor: "pointer",
                background: isSelected ? `${color}15` : "#fafafa",
                border: isSelected ? `2px solid ${color}` : "2px solid transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = `${color}08`;
                  e.currentTarget.style.borderColor = `${color}40`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "#fafafa";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
              title={iconName}
            >
              {IconComp && (
                <IconComp 
                  size={20} 
                  style={{ color: isSelected ? color : "#666" }} 
                />
              )}
            </div>
          );
        })}
      </div>

      {filteredIcons.length === 0 && (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Text type="secondary">No icons found</Text>
        </div>
      )}
    </Modal>
  );
};

export default IconPickerModal;














