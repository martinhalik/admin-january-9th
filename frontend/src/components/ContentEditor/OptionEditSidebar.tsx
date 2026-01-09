import React from "react";
import {
  Space,
  Input,
  InputNumber,
  Switch,
  Typography,
  Divider,
  Button,
  theme,
  Select,
  AutoComplete,
  Collapse,
  Modal,
} from "antd";
import { Trash2 } from "lucide-react";
import RightSidebar from "../RightSidebar";
import { DealOption } from "./types";

const { Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

interface OptionEditSidebarProps {
  open: boolean;
  option: DealOption | null;
  onClose: () => void;
  onUpdate: (field: keyof DealOption, value: any) => void;
  onRemove: () => void;
  width?: number;
  rightOffset?: number;
}

const OptionEditSidebar: React.FC<OptionEditSidebarProps> = ({
  open,
  option,
  onClose,
  onUpdate,
  onRemove,
  width = 420,
  rightOffset = 0,
}) => {
  const { token } = useToken();

  if (!option) return null;

  const calculateDiscount = (regularPrice: number, grouponPrice: number): number => {
    if (regularPrice === 0) return 0;
    return Math.round(((regularPrice - grouponPrice) / regularPrice) * 100);
  };

  const calculateGrouponPrice = (regularPrice: number, discount: number): number => {
    return Math.round(regularPrice * (1 - discount / 100));
  };

  const handleRemoveOption = () => {
    Modal.confirm({
      title: "Remove Option",
      content: `Are you sure you want to remove "${option.name}"? This action cannot be undone.`,
      okText: "Remove",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        onRemove();
        onClose();
      },
    });
  };

  const handleCustomFieldChange = (fieldId: string, newValue: string) => {
    const updatedFields = (option.customFields || []).map((field: any) =>
      field.id === fieldId ? { ...field, value: newValue } : field
    );
    onUpdate("customFields", updatedFields);
  };

  return (
    <RightSidebar open={open} title="Option Settings" showBackButton onBack={onClose} width={width} topOffset={164} zIndex={9}>
      <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <Space direction="vertical" style={{ width: "100%", flex: 1 }} size="large">
          {/* REQUIRED DETAILS */}
          <div>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {/* Option Name - Full Width */}
              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Option Name *
                </Text>
                <Input value={option.name} onChange={(e) => onUpdate("name", e.target.value)} size="large" />
              </div>

              {/* Pricing - 2 Column Layout */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: token.marginSM,
                }}
              >
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Original Price *
                  </Text>
                  <InputNumber
                    value={option.regularPrice}
                    onChange={(value) => {
                      const newRegularPrice = value || 0;
                      onUpdate("regularPrice", newRegularPrice);
                      // Recalculate discount
                      const newDiscount = calculateDiscount(newRegularPrice, option.grouponPrice);
                      onUpdate("discount", newDiscount);
                    }}
                    prefix="$"
                    size="large"
                    style={{ width: "100%" }}
                    min={0}
                    step={1}
                    precision={0}
                  />
                </div>

                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Groupon Price *
                  </Text>
                  <InputNumber
                    value={option.grouponPrice}
                    onChange={(value) => {
                      const newGrouponPrice = value || 0;
                      onUpdate("grouponPrice", newGrouponPrice);
                      // Recalculate discount
                      const newDiscount = calculateDiscount(option.regularPrice, newGrouponPrice);
                      onUpdate("discount", newDiscount);
                      // Recalculate merchant payout (assuming 50% of groupon price)
                      onUpdate("merchantPayout", Math.round(newGrouponPrice * 0.5));
                    }}
                    prefix="$"
                    size="large"
                    style={{ width: "100%" }}
                    min={0}
                    step={1}
                    precision={0}
                  />
                </div>
              </div>

              {/* Discount and Monthly Capacity - 2 Column Layout */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: token.marginSM,
                }}
              >
                {/* Discount */}
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Discount *
                  </Text>
                  <InputNumber
                    value={option.discount}
                    onChange={(value) => {
                      const newDiscount = value || 0;
                      onUpdate("discount", newDiscount);
                      // Recalculate groupon price
                      const newGrouponPrice = calculateGrouponPrice(option.regularPrice, newDiscount);
                      onUpdate("grouponPrice", newGrouponPrice);
                      // Recalculate merchant payout (assuming 50% of groupon price)
                      onUpdate("merchantPayout", Math.round(newGrouponPrice * 0.5));
                    }}
                    suffix="%"
                    size="large"
                    style={{ width: "100%" }}
                    min={0}
                    max={100}
                    step={1}
                    precision={0}
                  />
                  <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                    Save ${Math.round(option.regularPrice - option.grouponPrice)}
                  </Text>
                </div>

                {/* Merchant Payout - Display Only */}
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Merchant Payout
                  </Text>
                  <div
                    style={{
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: token.colorSuccessBg,
                      border: `1px solid ${token.colorSuccessBorder}`,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      strong
                      style={{
                        fontSize: 20,
                        color: token.colorSuccess,
                      }}
                    >
                      ${option.merchantPayout || Math.round(option.grouponPrice * 0.5)}
                    </Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                    50% of Groupon price
                  </Text>
                </div>
              </div>

              {/* Monthly Capacity */}
              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Monthly Capacity *
                </Text>
                <InputNumber
                  value={option.monthlyCapacity || 100}
                  onChange={(value) => onUpdate("monthlyCapacity", value || 100)}
                  size="large"
                  style={{ width: "100%" }}
                  min={1}
                  max={10000}
                  step={10}
                  precision={0}
                />
                <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                  Up to 10,000
                </Text>
              </div>

              {/* Status */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Text strong style={{ display: "block" }}>
                      Active Status
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Make this option available for purchase
                    </Text>
                  </div>
                  <Switch checked={option.enabled} onChange={(checked) => onUpdate("enabled", checked)} />
                </div>
              </div>
            </Space>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* OPTIONAL DETAILS */}
          <Collapse
            ghost
            defaultActiveKey={[]}
            items={[
              {
                key: "optional-details",
                label: (
                  <Text
                    strong
                    style={{
                      fontSize: token.fontSize,
                      textTransform: "uppercase",
                      color: token.colorTextSecondary,
                    }}
                  >
                    Optional Details
                  </Text>
                ),
                children: (
                  <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    {/* Subtitle */}
                    <div>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        Subtitle
                      </Text>
                      <Input
                        value={option.subtitle || ""}
                        onChange={(e) => onUpdate("subtitle", e.target.value)}
                        size="large"
                        placeholder="e.g., Most Popular, Best Value"
                      />
                    </div>

                    {/* Details */}
                    <div>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        Details
                      </Text>
                      <TextArea
                        value={option.details || ""}
                        onChange={(e) => onUpdate("details", e.target.value)}
                        rows={4}
                        placeholder="Enter additional details about this option..."
                      />
                    </div>
                    {/* Validity Period */}
                    <div>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        Validity Period
                      </Text>
                      <Select
                        value={option.validity}
                        onChange={(value) => onUpdate("validity", value)}
                        size="large"
                        style={{ width: "100%" }}
                        options={[
                          { label: "30 days", value: "30 days" },
                          { label: "60 days", value: "60 days" },
                          { label: "90 days", value: "90 days" },
                          { label: "120 days", value: "120 days" },
                          { label: "180 days", value: "180 days" },
                          { label: "1 year", value: "1 year" },
                        ]}
                      />
                    </div>
                  </Space>
                ),
              },
            ]}
          />

          <Divider style={{ margin: 0 }} />

          {/* Revenue Split */}
          <Collapse
            ghost
            defaultActiveKey={[]}
            items={[
              {
                key: "revenue-split",
                label: (
                  <Text
                    strong
                    style={{
                      fontSize: token.fontSize,
                      textTransform: "uppercase",
                      color: token.colorTextSecondary,
                    }}
                  >
                    Revenue Split
                  </Text>
                ),
                children: (
                  <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    {/* Merchant and Groupon Margin - 2 Column Layout */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: token.marginSM,
                      }}
                    >
                      <div>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                            display: "block",
                            marginBottom: 8,
                          }}
                        >
                          Merchant Margin %
                        </Text>
                        <InputNumber
                          value={option.merchantMargin || 50}
                          onChange={(value) => {
                            const merchantMargin = value || 0;
                            onUpdate("merchantMargin", merchantMargin);
                            // Auto-adjust Groupon margin to make 100%
                            onUpdate("grouponMargin", 100 - merchantMargin);
                          }}
                          suffix="%"
                          size="large"
                          style={{ width: "100%" }}
                          min={0}
                          max={100}
                          step={1}
                          precision={0}
                        />
                        <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                          40-70% ideal
                        </Text>
                      </div>

                      <div>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                            display: "block",
                            marginBottom: 8,
                          }}
                        >
                          Groupon Margin %
                        </Text>
                        <InputNumber
                          value={option.grouponMargin || 50}
                          onChange={(value) => {
                            const grouponMargin = value || 0;
                            onUpdate("grouponMargin", grouponMargin);
                            // Auto-adjust Merchant margin to make 100%
                            onUpdate("merchantMargin", 100 - grouponMargin);
                          }}
                          suffix="%"
                          size="large"
                          style={{ width: "100%" }}
                          min={0}
                          max={100}
                          step={1}
                          precision={0}
                        />
                        <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                          Auto-balanced
                        </Text>
                      </div>
                    </div>

                    {/* Revenue Summary */}
                    <div
                      style={{
                        marginTop: 20,
                        padding: 16,
                        background: token.colorFillSecondary,
                        borderRadius: 8,
                        border: `1px solid ${token.colorBorder}`,
                      }}
                    >
                      <Text strong style={{ display: "block", marginBottom: 12, fontSize: token.fontSize }}>
                        Summary
                      </Text>
                      <Space direction="vertical" style={{ width: "100%" }} size="small">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 13 }}>Customer pays</Text>
                          <Text strong style={{ fontSize: 14 }}>
                            ${Math.round(option.grouponPrice)}
                          </Text>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 13 }}>Merchant gets</Text>
                          <Text strong style={{ fontSize: 14 }}>
                            ${Math.round((option.grouponPrice * (option.merchantMargin || 50)) / 100)}
                          </Text>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 13 }}>Merchant margin</Text>
                          <Text strong style={{ fontSize: 14 }}>
                            {option.merchantMargin || 50}%
                          </Text>
                        </div>
                        <Divider style={{ margin: "8px 0" }} />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 13 }}>Groupon gets</Text>
                          <Text strong style={{ fontSize: 14 }}>
                            ${Math.round((option.grouponPrice * (option.grouponMargin || 50)) / 100)}
                          </Text>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 13 }}>Groupon margin</Text>
                          <Text strong style={{ fontSize: 14 }}>
                            {option.grouponMargin || 50}%
                          </Text>
                        </div>
                      </Space>
                    </div>
                  </Space>
                ),
              },
            ]}
          />

          {/* Custom Fields */}
          {(option.customFields || []).length > 0 && (
            <>
              <Divider style={{ margin: 0 }} />
              <Collapse
                ghost
                defaultActiveKey={[]}
                items={[
                  {
                    key: "custom-fields",
                    label: (
                      <Text
                        strong
                        style={{
                          fontSize: token.fontSize,
                          textTransform: "uppercase",
                          color: token.colorTextSecondary,
                        }}
                      >
                        Custom Fields
                      </Text>
                    ),
                    children: (
                      <Space direction="vertical" style={{ width: "100%" }} size="middle">
                        {(option.customFields || []).map((field) => (
                          <div key={field.id}>
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 12,
                                display: "block",
                                marginBottom: 8,
                              }}
                            >
                              {field.name}
                            </Text>

                            {field.type === "text" && (
                              <Input
                                value={field.value}
                                onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                                placeholder={`Enter ${field.name.toLowerCase()}`}
                                size="large"
                              />
                            )}

                            {field.type === "number" && (
                              <InputNumber
                                value={field.value}
                                onChange={(value) => handleCustomFieldChange(field.id, String(value || ""))}
                                placeholder={`Enter ${field.name.toLowerCase()}`}
                                style={{ width: "100%" }}
                                size="large"
                              />
                            )}

                            {field.type === "dropdown" && (
                              <AutoComplete
                                value={field.value}
                                onChange={(value) => handleCustomFieldChange(field.id, value)}
                                size="large"
                                style={{ width: "100%" }}
                                options={
                                  field.name.toLowerCase().includes("oil")
                                    ? [
                                        { value: "Conventional" },
                                        { value: "Full Synthetic" },
                                        { value: "Full Synthetic (European)" },
                                        { value: "Synthetic Blend" },
                                        { value: "High Mileage" },
                                      ]
                                    : field.name.toLowerCase().includes("size")
                                    ? [
                                        { value: "Small" },
                                        { value: "Medium" },
                                        { value: "Large" },
                                        { value: "X-Large" },
                                      ]
                                    : field.name.toLowerCase().includes("color")
                                    ? [
                                        { value: "Red" },
                                        { value: "Blue" },
                                        { value: "Green" },
                                        { value: "Black" },
                                        { value: "White" },
                                      ]
                                    : field.name.toLowerCase().includes("length")
                                    ? [
                                        { value: "Short" },
                                        { value: "Regular" },
                                        { value: "Long" },
                                        { value: "Extra Long" },
                                      ]
                                    : [{ value: "Option 1" }, { value: "Option 2" }, { value: "Option 3" }]
                                }
                                placeholder={`Select or enter ${field.name.toLowerCase()}`}
                                filterOption={(inputValue, option) =>
                                  option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                }
                              />
                            )}
                          </div>
                        ))}
                      </Space>
                    ),
                  },
                ]}
              />
            </>
          )}

          {/* Remove Option Button */}
          <div style={{ marginTop: "auto", paddingTop: 24 }}>
            <Divider style={{ margin: "0 0 16px 0" }} />
            <Button danger block icon={<Trash2 size={16} />} onClick={handleRemoveOption}>
              Remove Option
            </Button>
          </div>
        </Space>
      </div>
    </RightSidebar>
  );
};

export default OptionEditSidebar;

