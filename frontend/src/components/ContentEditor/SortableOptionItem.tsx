import React from "react";
import {
  Card,
  Typography,
  Space,
  InputNumber,
  Button,
  theme,
  Input,
  Spin,
  Tag,
} from "antd";
import { GripVertical, Trash2, AlertCircle, CheckCircle2, Lightbulb, Pencil } from "lucide-react";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const { Text } = Typography;
const { useToken } = theme;

export interface OptionItemData {
  id: string;
  name: string;
  regularPrice: number;
  grouponPrice: number;
  discount: number;
  enabled?: boolean;
  merchantPayout?: number;
  pricingSource?: "merchant_scraped" | "similar_deals";
  merchantPricingUrl?: string;
  similarDealsReference?: string;
  validity?: string;
  status?: string;
  [key: string]: any; // Allow additional properties
}

interface SortableOptionItemProps {
  option: OptionItemData;
  isEstimated: boolean;
  isLoadingPricing: boolean;
  editingField: { optionId: string; field: string } | null;
  onEdit: (optionId: string, field: string, value: any) => void;
  onRemove: (optionId: string) => void;
  setEditingField: (field: { optionId: string; field: string } | null) => void;
  onNameComplete?: (optionId: string, name: string) => void;
  onEditDetails: (option: OptionItemData) => void;
  useDecimals?: boolean;
  defaultMerchantMargin?: number;
}

const SortableOptionItem: React.FC<SortableOptionItemProps> = ({
  option,
  isEstimated,
  isLoadingPricing,
  editingField,
  onEdit,
  onRemove,
  setEditingField,
  onNameComplete,
  onEditDetails,
  useDecimals = false,
  defaultMerchantMargin = 30,
}) => {
  const { token } = useToken();
  
  // Check if this option has a custom margin (explicitly set and different from default)
  const hasCustomMargin = option.merchantMargin !== undefined && option.merchantMargin !== defaultMerchantMargin;
  // Use option's margin if set, otherwise use default
  const effectiveMargin = option.merchantMargin !== undefined ? option.merchantMargin : defaultMerchantMargin;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const precision = useDecimals ? 2 : 0;
  const step = useDecimals ? 0.01 : 1;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="small"
        style={{
          borderRadius: 8,
          border: `1px solid ${isDragging ? token.colorPrimary : hasCustomMargin ? token.colorWarningBorder : token.colorBorder}`,
          background: hasCustomMargin ? token.colorWarningBg : token.colorBgContainer,
          boxShadow: isDragging
            ? "0 8px 16px rgba(0, 0, 0, 0.15)"
            : hasCustomMargin
            ? `0 1px 2px 0 ${token.colorWarningBorder}40`
            : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          position: "relative",
        }}
      >
        {/* Drag Handle - left side */}
        <div
          {...attributes}
          {...listeners}
          style={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            cursor: isDragging ? "grabbing" : "grab",
            color: token.colorTextDisabled,
            padding: "8px 4px",
            display: "flex",
            alignItems: "center",
            zIndex: 10,
            touchAction: "none",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = token.colorTextSecondary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = token.colorTextDisabled)}
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </div>

        {/* Edit button - top right corner */}
        <div style={{ position: "absolute", top: 12, right: 48, zIndex: 10 }}>
          <Button
            type="text"
            size="small"
            icon={<Pencil size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onEditDetails(option);
            }}
            style={{
              color: token.colorPrimary,
              opacity: 0.8,
            }}
          />
        </div>

        {/* Delete button - top right corner */}
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => onRemove(option.id)}
            style={{
              color: token.colorTextSecondary,
              opacity: 0.6,
            }}
          />
        </div>

        <div style={{ padding: "12px 16px", paddingLeft: "36px", paddingRight: "80px" }}>
          {/* Option Name */}
          <div style={{ marginBottom: 16 }}>
            {editingField?.optionId === option.id && editingField?.field === "name" ? (
              <Input
                autoFocus
                value={option.name}
                onChange={(e) => onEdit(option.id, "name", e.target.value)}
                onBlur={() => {
                  setEditingField(null);
                  if (onNameComplete) {
                    onNameComplete(option.id, option.name);
                  }
                }}
                variant="borderless"
                style={{
                  width: "100%",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: 0,
                  color: token.colorText,
                  borderBottom: `2px solid ${token.colorPrimary}`,
                  borderRadius: 0,
                }}
                onPressEnter={() => {
                  setEditingField(null);
                  if (onNameComplete) {
                    onNameComplete(option.id, option.name);
                  }
                }}
              />
            ) : (
              <div
                onClick={() => setEditingField({ optionId: option.id, field: "name" })}
                style={{
                  cursor: "text",
                  padding: 0,
                  borderBottom: "2px solid transparent",
                }}
              >
                <Text strong style={{ fontSize: 14, display: "block", lineHeight: "1.4", color: token.colorText }}>
                  {option.name}
                </Text>
                {option.enabled === false && (
                  <Tag
                    style={{
                      fontSize: 11,
                      padding: "0 4px",
                      lineHeight: "18px",
                      marginTop: 4,
                    }}
                  >
                    Inactive
                  </Tag>
                )}
              </div>
            )}
          </div>

          {/* Pricing Grid - 2x2 responsive layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              marginBottom: 12,
            }}
          >
            {/* Original Price */}
            <div>
              <label
                htmlFor={`original-price-${option.id}`}
                style={{
                  fontSize: 11,
                  color: token.colorTextSecondary,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Original
              </label>
              <Space.Compact style={{ display: "flex", width: "100%" }}>
                <div
                  style={{
                    background: token.colorBgTextHover,
                    border: `1px solid ${token.colorBorder}`,
                    borderRight: "none",
                    borderRadius: "6px 0 0 6px",
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    color: token.colorText,
                    fontSize: 14,
                    fontWeight: 500,
                    minWidth: 28,
                    justifyContent: "center",
                  }}
                >
                  $
                </div>
                <InputNumber
                  id={`original-price-${option.id}`}
                  value={option.regularPrice}
                  onChange={(value) => onEdit(option.id, "regularPrice", value || 0)}
                  onClick={() => setEditingField({ optionId: option.id, field: "regularPrice" })}
                  onFocus={() => setEditingField({ optionId: option.id, field: "regularPrice" })}
                  onBlur={() => setEditingField(null)}
                  controls={false}
                  min={0}
                  precision={precision}
                  step={step}
                  style={{
                    flex: 1,
                    borderRadius: "0 6px 6px 0",
                  }}
                  onPressEnter={() => setEditingField(null)}
                />
              </Space.Compact>
            </div>

            {/* Groupon Price */}
            <div>
              <label
                htmlFor={`groupon-price-${option.id}`}
                style={{
                  fontSize: 11,
                  color: token.colorTextSecondary,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Groupon
              </label>
              <Space.Compact style={{ display: "flex", width: "100%" }}>
                <div
                  style={{
                    background: token.colorBgTextHover,
                    border: `1px solid ${token.colorBorder}`,
                    borderRight: "none",
                    borderRadius: "6px 0 0 6px",
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    color: token.colorText,
                    fontSize: 14,
                    fontWeight: 500,
                    minWidth: 28,
                    justifyContent: "center",
                  }}
                >
                  $
                </div>
                <InputNumber
                  id={`groupon-price-${option.id}`}
                  value={option.grouponPrice}
                  onChange={(value) => onEdit(option.id, "grouponPrice", value || 0)}
                  onClick={() => setEditingField({ optionId: option.id, field: "grouponPrice" })}
                  onFocus={() => setEditingField({ optionId: option.id, field: "grouponPrice" })}
                  onBlur={() => setEditingField(null)}
                  controls={false}
                  min={0}
                  precision={precision}
                  step={step}
                  style={{
                    flex: 1,
                    borderRadius: "0 6px 6px 0",
                  }}
                  onPressEnter={() => setEditingField(null)}
                />
              </Space.Compact>
            </div>

            {/* Discount - Editable */}
            <div>
              <label
                htmlFor={`discount-${option.id}`}
                style={{
                  fontSize: 11,
                  color: token.colorTextSecondary,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Discount
              </label>
              <Space.Compact style={{ display: "flex", width: "100%" }}>
                <InputNumber
                  id={`discount-${option.id}`}
                  value={option.discount}
                  onChange={(value) => onEdit(option.id, "discount", value || 0)}
                  onClick={() => setEditingField({ optionId: option.id, field: "discount" })}
                  onFocus={() => setEditingField({ optionId: option.id, field: "discount" })}
                  onBlur={() => setEditingField(null)}
                  controls={false}
                  min={0}
                  max={100}
                  precision={0}
                  style={{
                    flex: 1,
                    borderRadius: "6px 0 0 6px",
                  }}
                  onPressEnter={() => setEditingField(null)}
                />
                <div
                  style={{
                    background: token.colorBgTextHover,
                    border: `1px solid ${token.colorBorder}`,
                    borderLeft: "none",
                    borderRadius: "0 6px 6px 0",
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    color: token.colorText,
                    fontSize: 14,
                    fontWeight: 500,
                    minWidth: 28,
                    justifyContent: "center",
                  }}
                >
                  %
                </div>
              </Space.Compact>
            </div>

            {/* Merchant Payout - Display Only */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: token.colorTextSecondary,
                    fontWeight: 500,
                    display: "block",
                  }}
                >
                  Merchant Payout
                </span>
                {hasCustomMargin && (
                  <Tag color="warning" style={{ fontSize: 9, margin: 0, padding: "0 4px", lineHeight: "16px" }}>
                    Custom
                  </Tag>
                )}
              </div>
              <div
                style={{
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 8,
                }}
              >
                <span
                  style={{
                    color: token.colorTextSecondary,
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  ${option.merchantPayout || Math.round((option.grouponPrice * effectiveMargin) / 100)}
                </span>
              </div>
            </div>
          </div>

          {/* Website Pricing Status Badge */}
          {(option.name !== "New Option" || isLoadingPricing || !isEstimated) && (
            <div style={{ marginBottom: 8 }}>
              {isLoadingPricing ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    background: token.colorPrimaryBg,
                    border: `1px solid ${token.colorPrimaryBorder}`,
                    borderRadius: 4,
                  }}
                >
                  <Spin size="small" style={{ fontSize: 12 }} />
                  <Text style={{ fontSize: 11, color: token.colorPrimary, fontWeight: 500 }}>
                    Looking for "{option.name}" on merchant website...
                  </Text>
                </div>
              ) : !isEstimated ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    background: token.colorSuccessBg,
                    border: `1px solid ${token.colorSuccessBorder}`,
                    borderRadius: 4,
                  }}
                  title="This price was found on the merchant's public website."
                >
                  <CheckCircle2 size={14} style={{ color: token.colorSuccess, flexShrink: 0 }} />
                  <Text style={{ fontSize: 11, color: token.colorSuccessText, fontWeight: 500 }}>
                    Price found on merchant website
                  </Text>
                </div>
              ) : (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    background: token.colorWarningBg,
                    border: `1px solid ${token.colorWarningBorder}`,
                    borderRadius: 4,
                  }}
                  title="We could not find the price on the merchant's public website."
                >
                  <AlertCircle size={14} style={{ color: token.colorWarningText, flexShrink: 0 }} />
                  <Text style={{ fontSize: 11, color: token.colorWarningText, fontWeight: 500 }}>
                    Unable to verify price on website
                  </Text>
                </div>
              )}
            </div>
          )}

          {/* Recommendation Row (optional) */}
          {!isLoadingPricing && isEstimated && option.grouponPrice && option.name !== "New Option" && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "6px 10px",
                background: token.colorBgTextHover,
                borderRadius: 4,
                border: `1px solid ${token.colorBorder}`,
              }}
            >
              <Lightbulb size={13} style={{ color: token.colorWarningText, flexShrink: 0, marginTop: 1 }} />
              <Text style={{ fontSize: 11, color: token.colorTextSecondary, lineHeight: 1.5 }}>
                <Text strong style={{ fontSize: 11, color: token.colorText }}>
                  Recommendation:
                </Text>{" "}
                Similar Groupon offers are usually priced at ${Math.round(option.grouponPrice * 0.85)}–$
                {Math.round(option.grouponPrice * 1.15)}. And original price is around ${Math.round(option.regularPrice * 0.9)}.
              </Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SortableOptionItem;

