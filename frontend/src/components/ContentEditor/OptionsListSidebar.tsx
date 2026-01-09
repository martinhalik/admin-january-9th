import React, { useState } from "react";
import {
  Typography,
  Space,
  Button,
  theme,
  Switch,
} from "antd";
import { Plus, Settings } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import RightSidebar from "../RightSidebar";
import { DealOption } from "./types";
import SortableOptionItem, { OptionItemData } from "./SortableOptionItem";

const { Text } = Typography;
const { useToken } = theme;

interface OptionsListSidebarProps {
  open: boolean;
  options: DealOption[];
  onClose: () => void;
  onOptionsChange: (options: DealOption[]) => void;
  onOptionEdit: (option: DealOption) => void;
  width?: number;
  rightOffset?: number;
  zIndex?: number;
  // Controlled settings state
  settingsOpen?: boolean;
  onSettingsToggle?: (open: boolean) => void;
  // Controlled decimals state
  useDecimals?: boolean;
  onUseDecimalsChange?: (value: boolean) => void;
}

const OptionsListSidebar: React.FC<OptionsListSidebarProps> = ({
  open,
  options,
  onClose,
  onOptionsChange,
  onOptionEdit,
  width = 420,
  rightOffset = 0,
  zIndex = 9,
  settingsOpen: controlledSettingsOpen,
  onSettingsToggle,
  useDecimals: controlledUseDecimals,
  onUseDecimalsChange,
}) => {
  const { token } = useToken();
  const [editingField, setEditingField] = useState<{
    optionId: string;
    field: string;
  } | null>(null);
  const [loadingPricing] = useState<Set<string>>(new Set());
  
  // Controlled or uncontrolled decimals state
  const [internalUseDecimals, setInternalUseDecimals] = useState(false);
  const useDecimals = controlledUseDecimals !== undefined ? controlledUseDecimals : internalUseDecimals;
  const setUseDecimals = (value: boolean) => {
    if (onUseDecimalsChange) {
      onUseDecimalsChange(value);
    } else {
      setInternalUseDecimals(value);
    }
  };
  
  // Controlled or uncontrolled settings open state
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);
  const settingsOpen = controlledSettingsOpen !== undefined ? controlledSettingsOpen : internalSettingsOpen;
  const setSettingsOpen = (value: boolean) => {
    if (onSettingsToggle) {
      onSettingsToggle(value);
    } else {
      setInternalSettingsOpen(value);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex((opt) => opt.id === active.id);
      const newIndex = options.findIndex((opt) => opt.id === over.id);
      onOptionsChange(arrayMove(options, oldIndex, newIndex));
    }
  };

  const handleOptionEdit = (optionId: string, field: string, value: any) => {
    const newOptions = options.map((opt) => {
      if (opt.id === optionId) {
        const updated = { ...opt };

        if (field === "name") {
          updated.name = value as string;
        } else if (field === "regularPrice") {
          const newRegularPrice = Number(value);
          updated.regularPrice = newRegularPrice;
          // Recalculate discount
          updated.discount = calculateDiscount(newRegularPrice, opt.grouponPrice);
          // Recalculate merchant payout (assuming 50% of groupon price)
          updated.merchantPayout = Math.round(opt.grouponPrice * 0.5);
        } else if (field === "grouponPrice") {
          const newGrouponPrice = Number(value);
          updated.grouponPrice = newGrouponPrice;
          // Recalculate discount
          updated.discount = calculateDiscount(opt.regularPrice, newGrouponPrice);
          // Recalculate merchant payout (assuming 50% of groupon price)
          updated.merchantPayout = Math.round(newGrouponPrice * 0.5);
        } else if (field === "discount") {
          const newDiscount = Number(value);
          updated.discount = newDiscount;
          // Recalculate groupon price based on discount
          updated.grouponPrice = calculateGrouponPrice(opt.regularPrice, newDiscount);
          // Recalculate merchant payout (assuming 50% of groupon price)
          updated.merchantPayout = Math.round(updated.grouponPrice * 0.5);
        }

        return updated;
      }
      return opt;
    });

    onOptionsChange(newOptions);
  };

  const calculateGrouponPrice = (regularPrice: number, discount: number): number => {
    if (regularPrice === 0) return 0;
    return Math.round(regularPrice * (1 - discount / 100));
  };

  const calculateDiscount = (regularPrice: number, grouponPrice: number): number => {
    if (regularPrice === 0) return 0;
    return Math.round(((regularPrice - grouponPrice) / regularPrice) * 100);
  };

  const handleRemoveOption = (optionId: string) => {
    const newOptions = options.filter((opt) => opt.id !== optionId);
    onOptionsChange(newOptions);
  };

  const handleAddOption = () => {
    const newOption: DealOption = {
      id: `option-${Date.now()}`,
      name: "New Option",
      subtitle: "",
      details: "",
      regularPrice: 100,
      grouponPrice: 50,
      discount: 50,
      validity: "90 days",
      enabled: true,
      monthlyCapacity: 100,
      merchantMargin: 50,
      grouponMargin: 50,
      merchantPayout: 25,
      status: "active",
    };
    onOptionsChange([...options, newOption]);
  };

  const customTitle = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Text type="secondary" style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Options</Text>
      <Button
        type="text"
        size="small"
        icon={<Settings size={16} />}
        onClick={() => setSettingsOpen(!settingsOpen)}
        style={{ 
          color: settingsOpen ? token.colorPrimary : token.colorTextSecondary,
          width: 32,
          height: 32
        }}
      />
    </div>
  );

  return (
    <RightSidebar
      open={open}
      title={customTitle}
      width="fit-content"
      rightOffset={rightOffset}
      topOffset={164}
      zIndex={zIndex}
      showHeader={true}
      noBorder={true}
    >
      <div style={{ padding: "0 20px 20px 20px", paddingTop: 8, height: "100%", display: "flex", flexDirection: "column", overflowY: "auto", background: token.colorBgLayout }}>
        {/* Settings Panel */}
        {settingsOpen && (
          <div style={{ 
            marginBottom: 16, 
            padding: "12px 16px", 
            background: token.colorBgContainer, 
            borderRadius: 8,
            border: `1px solid ${token.colorBorder}`
          }}>
            <div style={{ 
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <Text strong style={{ display: "block", fontSize: 13 }}>Use Decimals</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Enable to use cents in pricing
                </Text>
              </div>
              <Switch 
                checked={useDecimals} 
                onChange={setUseDecimals}
              />
            </div>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={options.map((opt) => opt.id)} strategy={verticalListSortingStrategy}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {options.map((option) => (
                <SortableOptionItem
                  key={option.id}
                  option={option as unknown as OptionItemData}
                  isEstimated={false}
                  isLoadingPricing={loadingPricing.has(option.id)}
                  editingField={editingField}
                  onEdit={handleOptionEdit}
                  onRemove={handleRemoveOption}
                  setEditingField={setEditingField}
                  onEditDetails={(opt) => onOptionEdit(opt as unknown as DealOption)}
                  useDecimals={useDecimals}
                />
              ))}
            </Space>
          </SortableContext>
        </DndContext>

        {/* Add Option Button */}
        <Button
          type="dashed"
          block
          size="large"
          icon={<Plus size={16} />}
          onClick={handleAddOption}
          style={{ marginTop: 16 }}
        >
          Add Option
        </Button>
      </div>
    </RightSidebar>
  );
};

export default OptionsListSidebar;

