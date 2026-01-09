import { useState } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
  Input,
  theme,
  InputNumber,
  Button,
  Switch,
  Divider,
  Select,
  AutoComplete,
  Modal,
  Collapse,
} from "antd";
import {
  Settings,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
} from "lucide-react";
import { DealOption } from "./types";
import SettingsSidebar from "../SettingsSidebar";

const { Text, Link } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

interface DealOptionsTableProps {
  options: DealOption[];
  onOptionsChange: (options: DealOption[]) => void;
  showStatus?: boolean;
  showMerchantPayout?: boolean;
  onSettingsPanelChange?: (isOpen: boolean) => void;
  onOptionSelect?: (option: DealOption) => void;
  changeCount?: number;
  useDecimals?: boolean;
}

const DealOptionsTable = ({
  options,
  onOptionsChange,
  showStatus = false,
  showMerchantPayout = false,
  onSettingsPanelChange,
  onOptionSelect,
  changeCount = 0,
  useDecimals = false,
}: DealOptionsTableProps) => {
  const { token } = useToken();
  const [hoveredField, setHoveredField] = useState<{
    optionId: string;
    field: string;
  } | null>(null);
  const [editingField, setEditingField] = useState<{
    optionId: string;
    field: string;
  } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DealOption | null>(null);
  const [, setHoveredRow] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newOption, setNewOption] = useState<Partial<DealOption>>({
    name: "",
    regularPrice: 0,
    grouponPrice: 0,
    discount: 0,
  });
  
  // Precision and step based on decimal setting
  const precision = useDecimals ? 2 : 0;
  const step = useDecimals ? 0.01 : 1;
  const [autoSaving, setAutoSaving] = useState(false);

  // Calculate discount from prices
  const calculateDiscount = (
    regularPrice: number,
    grouponPrice: number
  ): number => {
    if (regularPrice === 0) return 0;
    return Math.round(((regularPrice - grouponPrice) / regularPrice) * 100);
  };

  // Calculate groupon price from discount
  const calculateGrouponPrice = (
    regularPrice: number,
    discount: number
  ): number => {
    return Math.round(regularPrice * (1 - discount / 100));
  };

  // Handle field changes
  const handleFieldChange = (
    optionId: string,
    field: keyof DealOption,
    value: string | number
  ) => {
    const newOptions = options.map((opt) => {
      if (opt.id === optionId) {
        const updated = { ...opt };

        if (field === "name") {
          updated.name = value as string;
        } else if (field === "regularPrice") {
          const newRegularPrice = Number(value);
          updated.regularPrice = newRegularPrice;
          // Recalculate discount based on current groupon price
          updated.discount = calculateDiscount(
            newRegularPrice,
            opt.grouponPrice
          );
        } else if (field === "grouponPrice") {
          const newGrouponPrice = Number(value);
          updated.grouponPrice = newGrouponPrice;
          // Recalculate discount based on current regular price
          updated.discount = calculateDiscount(
            opt.regularPrice,
            newGrouponPrice
          );
        } else if (field === "discount") {
          const newDiscount = Number(value);
          updated.discount = newDiscount;
          // Recalculate groupon price based on regular price and new discount
          updated.grouponPrice = calculateGrouponPrice(
            opt.regularPrice,
            newDiscount
          );
        }

        return updated;
      }
      return opt;
    });

    onOptionsChange(newOptions);
  };

  const handleFieldBlur = () => {
    setEditingField(null);
  };

  const handleOpenSettings = (option: DealOption) => {
    // If onOptionSelect is provided (universal sidebar mode), use that instead
    if (onOptionSelect) {
      console.log("🎯 Universal sidebar mode - calling onOptionSelect");
      onOptionSelect(option);
    } else {
      console.log("📋 Old drawer mode - opening SettingsSidebar");
      // Otherwise, use the old drawer mode
      setSelectedOption(option);
      setSettingsOpen(true);
      onSettingsPanelChange?.(true);
    }
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
    onSettingsPanelChange?.(false);
    setTimeout(() => setSelectedOption(null), 300); // Wait for drawer animation
  };

  const handleAddNewOption = () => {
    if (!newOption.name || !newOption.regularPrice) {
      return; // Basic validation
    }

    const option: DealOption = {
      id: `option-${Date.now()}`,
      name: newOption.name,
      subtitle: newOption.subtitle,
      details: newOption.details,
      regularPrice: newOption.regularPrice || 0,
      grouponPrice: newOption.grouponPrice || 0,
      discount: calculateDiscount(
        newOption.regularPrice || 0,
        newOption.grouponPrice || 0
      ),
      validity: "Valid for 90 days",
      enabled: true,
      customFields: [],
      monthlyCapacity: 100,
      merchantMargin: 50,
      grouponMargin: 50,
      merchantPayout: (newOption.grouponPrice || 0) * 0.8,
      status: "Live",
    };

    onOptionsChange([...options, option]);

    // Reset new option form
    setNewOption({
      name: "",
      regularPrice: 0,
      grouponPrice: 0,
      discount: 0,
    });
    setIsAddingNew(false);
  };

  const handleNewOptionChange = (field: string, value: any) => {
    const updated = { ...newOption, [field]: value };

    // Auto-calculate discount or price
    if (field === "regularPrice" || field === "grouponPrice") {
      const reg =
        field === "regularPrice" ? value : newOption.regularPrice || 0;
      const grp =
        field === "grouponPrice" ? value : newOption.grouponPrice || 0;
      updated.discount = calculateDiscount(reg, grp);
    } else if (field === "discount") {
      updated.grouponPrice = calculateGrouponPrice(
        newOption.regularPrice || 0,
        value
      );
    }

    setNewOption(updated);
  };

  const handleSettingsChange = (field: keyof DealOption, value: any) => {
    if (!selectedOption) return;

    const newOptions = options.map((opt) =>
      opt.id === selectedOption.id ? { ...opt, [field]: value } : opt
    );

    onOptionsChange(newOptions);
    setSelectedOption({ ...selectedOption, [field]: value });

    // Trigger auto-save indicator
    setAutoSaving(true);
    setTimeout(() => setAutoSaving(false), 1000);
  };

  const handleCustomFieldChange = (fieldId: string, newValue: string) => {
    if (!selectedOption) return;

    const updatedFields = (selectedOption.customFields || []).map(
      (field: any) =>
        field.id === fieldId ? { ...field, value: newValue } : field
    );

    handleSettingsChange("customFields", updatedFields);
  };

  const handleRemoveOption = () => {
    if (!selectedOption) return;

    Modal.confirm({
      title: "Remove Option",
      content: `Are you sure you want to remove "${selectedOption.name}"? This action cannot be undone.`,
      okText: "Remove",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        const updatedOptions = options.filter(
          (opt) => opt.id !== selectedOption.id
        );
        onOptionsChange(updatedOptions);
        handleCloseSettings();
      },
    });
  };

  const isFieldHovered = (optionId: string, field: string) => {
    return hoveredField?.optionId === optionId && hoveredField?.field === field;
  };

  const isFieldEditing = (optionId: string, field: string) => {
    return editingField?.optionId === optionId && editingField?.field === field;
  };

  const renderEditableField = (
    option: DealOption,
    field: keyof DealOption,
    display: React.ReactNode,
    type: "text" | "number" = "text"
  ) => {
    const fieldStr = String(field);
    const isHovered = isFieldHovered(option.id, fieldStr);
    const isEditing = isFieldEditing(option.id, fieldStr);

    if (isEditing) {
      if (type === "number") {
        return (
          <InputNumber
            value={option[field] as number}
            onChange={(value) =>
              handleFieldChange(option.id, field, value || 0)
            }
            onBlur={handleFieldBlur}
            onPressEnter={handleFieldBlur}
            autoFocus
            size="small"
            style={{ width: "100%" }}
            min={0}
            step={field === "discount" ? 1 : step}
            precision={field === "discount" ? 0 : precision}
            prefix={field !== "discount" ? "$" : undefined}
            suffix={field === "discount" ? "%" : undefined}
          />
        );
      } else {
        return (
          <Input
            value={option[field] as string}
            onChange={(e) =>
              handleFieldChange(option.id, field, e.target.value)
            }
            onBlur={handleFieldBlur}
            onPressEnter={handleFieldBlur}
            autoFocus
            size="small"
            style={{ width: "100%" }}
          />
        );
      }
    }

    return (
      <div
        style={{
          cursor: "pointer",
          padding: `${token.paddingXXS}px ${token.paddingXS}px`,
          borderRadius: token.borderRadiusSM,
          background: isHovered ? token.colorFillSecondary : "transparent",
          transition: "background 0.2s",
          minHeight: 24,
          display: "flex",
          alignItems: "center",
        }}
        onMouseEnter={() =>
          setHoveredField({ optionId: option.id, field: fieldStr })
        }
        onMouseLeave={() => setHoveredField(null)}
        onClick={(e) => {
          e.stopPropagation();
          setEditingField({ optionId: option.id, field: fieldStr });
        }}
      >
        {display}
      </div>
    );
  };

  const activeOptions = options.filter((o) => o.enabled);
  const inactiveOptions = options.filter((o) => !o.enabled);

  return (
    <>
      <div style={{ marginBottom: token.margin }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: token.marginSM 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text strong style={{ fontSize: 15 }}>
              Options
            </Text>
            {changeCount > 0 && (
              <Tag color="orange" style={{ fontSize: 11 }}>
                {changeCount} {changeCount === 1 ? "change" : "changes"}
              </Tag>
            )}
          </div>
          <Button
            type="link"
            icon={<Plus size={14} />}
            size="small"
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
          >
            Add
          </Button>
        </div>
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          {/* Active Options */}
          {activeOptions.map((option) => (
            <Card
              key={option.id}
              size="small"
              onMouseEnter={() => setHoveredRow(option.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => handleOpenSettings(option)}
              style={{
                background: option.enabled
                  ? token.colorBgContainer
                  : token.colorBgLayout,
                border: option.enabled
                  ? `2px solid ${token.colorSuccessBorder}`
                  : `1px solid ${token.colorBorder}`,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: showMerchantPayout
                    ? "2fr 1fr 1fr 0.6fr 1fr 80px"
                    : "2fr 1fr 1fr 0.6fr 80px",
                  gap: token.marginSM,
                  alignItems: "center",
                }}
              >
                {/* Option Name */}
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: token.fontSizeSM,
                      display: "block",
                      marginBottom: token.marginXXS,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Option Name
                  </Text>
                  {renderEditableField(
                    option,
                    "name",
                    <div>
                      <Text strong style={{ fontSize: 13 }}>
                        {option.name}
                      </Text>
                      {showStatus && option.enabled && (
                        <div style={{ marginTop: 2 }}>
                          <Tag
                            color="green"
                            style={{
                              fontSize: token.fontSizeSM,
                              padding: "0 4px",
                              lineHeight: "18px",
                            }}
                          >
                            Live
                          </Tag>
                        </div>
                      )}
                    </div>,
                    "text"
                  )}
                </div>

                {/* Original Price */}
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: token.fontSizeSM,
                      display: "block",
                      marginBottom: token.marginXXS,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Original
                  </Text>
                  {renderEditableField(
                    option,
                    "regularPrice",
                    <div>
                      <Text strong style={{ fontSize: 13 }}>
                        ${Math.round(option.regularPrice)}
                      </Text>
                    </div>,
                    "number"
                  )}
                </div>

                {/* Groupon Price */}
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: token.fontSizeSM,
                      display: "block",
                      marginBottom: token.marginXXS,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Groupon
                  </Text>
                  {renderEditableField(
                    option,
                    "grouponPrice",
                    <div>
                      <Text
                        strong
                        style={{ fontSize: 13, color: token.colorPrimary }}
                      >
                        ${Math.round(option.grouponPrice)}
                      </Text>
                    </div>,
                    "number"
                  )}
                </div>

                {/* Discount */}
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: token.fontSizeSM,
                      display: "block",
                      marginBottom: token.marginXXS,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Discount
                  </Text>
                  {renderEditableField(
                    option,
                    "discount",
                    <div>
                      <Tag
                        color="orange"
                        style={{
                          fontSize: 11,
                          padding: "0 6px",
                          lineHeight: "20px",
                          fontWeight: 600,
                        }}
                      >
                        {option.discount}% OFF
                      </Tag>
                    </div>,
                    "number"
                  )}
                </div>

                {/* Toggle and Settings */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: token.marginXXS,
                  }}
                >
                  <Switch
                    size="small"
                    checked={option.enabled}
                    onChange={(checked) => {
                      const newOptions = options.map((opt) =>
                        opt.id === option.id
                          ? { ...opt, enabled: checked }
                          : opt
                      );
                      onOptionsChange(newOptions);
                    }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<Settings size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenSettings(option);
                    }}
                  />
                </div>

                {/* Merchant Payout (if enabled) */}
                {showMerchantPayout && (
                  <div>
                    <Text
                      type="secondary"
                      style={{ fontSize: 11, display: "block" }}
                    >
                      MERCHANT PAYOUT
                    </Text>
                    <div style={{ padding: "4px 8px", minHeight: 32 }}>
                      <Text style={{ fontSize: 14 }}>
                        ${Math.round((option.grouponPrice || 0) * 0.8)}
                      </Text>
                      <div
                        style={{ fontSize: 11, color: token.colorTextDisabled }}
                      >
                        per voucher
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* New Option Row */}
          {isAddingNew && (
            <Card
              size="small"
              style={{
                background: token.colorFillQuaternary,
                border: `2px dashed ${token.colorBorder}`,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: showMerchantPayout
                    ? "2fr 1fr 1fr 0.6fr 1fr 80px"
                    : "2fr 1fr 1fr 0.6fr 80px",
                  gap: token.marginSM,
                  alignItems: "center",
                }}
              >
                {/* Option Name */}
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: token.fontSizeSM,
                      display: "block",
                      marginBottom: token.marginXXS,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Option Name
                  </Text>
                  <Input
                    size="small"
                    value={newOption.name}
                    onChange={(e) =>
                      handleNewOptionChange("name", e.target.value)
                    }
                    placeholder="Enter option name"
                  />
                </div>

                {/* Original Price */}
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: token.fontSizeSM,
                      display: "block",
                      marginBottom: token.marginXXS,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Original
                  </Text>
                  <InputNumber
                    size="small"
                    value={newOption.regularPrice}
                    onChange={(value) =>
                      handleNewOptionChange("regularPrice", value || 0)
                    }
                    prefix="$"
                    style={{ width: "100%" }}
                    min={0}
                    step={1}
                    precision={0}
                  />
                </div>

                {/* Groupon Price */}
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: token.fontSizeSM,
                      display: "block",
                      marginBottom: token.marginXXS,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Groupon
                  </Text>
                  <InputNumber
                    size="small"
                    value={newOption.grouponPrice}
                    onChange={(value) =>
                      handleNewOptionChange("grouponPrice", value || 0)
                    }
                    prefix="$"
                    style={{ width: "100%" }}
                    min={0}
                    step={1}
                    precision={0}
                  />
                </div>

                {/* Discount */}
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: token.fontSizeSM,
                      display: "block",
                      marginBottom: token.marginXXS,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Discount
                  </Text>
                  <InputNumber
                    size="small"
                    value={newOption.discount}
                    onChange={(value) =>
                      handleNewOptionChange("discount", value || 0)
                    }
                    suffix="%"
                    style={{ width: "100%" }}
                    min={0}
                    max={100}
                    step={1}
                    precision={0}
                  />
                </div>

                {/* Merchant Payout (if enabled) */}
                {showMerchantPayout && (
                  <div>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: token.fontSizeSM,
                        display: "block",
                        marginBottom: token.marginXXS,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Payout
                    </Text>
                    <div style={{ padding: "2px 6px" }}>
                      <Text
                        style={{ fontSize: 13, color: token.colorTextTertiary }}
                      >
                        ${Math.round((newOption.grouponPrice || 0) * 0.8)}
                      </Text>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: token.marginXXS,
                  }}
                >
                  <Button
                    type="primary"
                    size="small"
                    shape="circle"
                    icon={<Check size={14} />}
                    onClick={handleAddNewOption}
                    disabled={!newOption.name || !newOption.regularPrice}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Inactive Options Toggle */}
          {inactiveOptions.length > 0 && (
            <div style={{ marginTop: token.marginXS }}>
              <Link
                onClick={() => setShowInactive(!showInactive)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                }}
              >
                {showInactive ? (
                  <>
                    <ChevronUp size={14} />
                    Hide inactive options ({inactiveOptions.length})
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    Show inactive options ({inactiveOptions.length})
                  </>
                )}
              </Link>

              {showInactive && (
                <Space
                  direction="vertical"
                  style={{ width: "100%", marginTop: 8 }}
                  size="small"
                >
                  {inactiveOptions.map((option) => (
                    <Card
                      key={option.id}
                      size="small"
                      onMouseEnter={() => setHoveredRow(option.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => handleOpenSettings(option)}
                      style={{
                        background: token.colorBgLayout,
                        border: `1px solid ${token.colorBorder}`,
                        opacity: 0.7,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: showMerchantPayout
                            ? "2fr 1fr 1fr 0.6fr 1fr 80px"
                            : "2fr 1fr 1fr 0.6fr 80px",
                          gap: token.marginSM,
                          alignItems: "center",
                        }}
                      >
                        {/* Option Name */}
                        <div>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: token.fontSizeSM,
                              display: "block",
                              marginBottom: token.marginXXS,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Option Name
                          </Text>
                          {renderEditableField(
                            option,
                            "name",
                            <div>
                              <Text strong style={{ fontSize: 13 }}>
                                {option.name}
                              </Text>
                              {showStatus && (
                                <div style={{ marginTop: 2 }}>
                                  <Tag
                                    style={{
                                      fontSize: token.fontSizeSM,
                                      padding: "0 4px",
                                      lineHeight: "18px",
                                    }}
                                  >
                                    Inactive
                                  </Tag>
                                </div>
                              )}
                            </div>,
                            "text"
                          )}
                        </div>

                        {/* Original Price */}
                        <div>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: token.fontSizeSM,
                              display: "block",
                              marginBottom: token.marginXXS,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Original
                          </Text>
                          {renderEditableField(
                            option,
                            "regularPrice",
                            <div>
                              <Text strong style={{ fontSize: 13 }}>
                                ${Math.round(option.regularPrice)}
                              </Text>
                            </div>,
                            "number"
                          )}
                        </div>

                        {/* Groupon Price */}
                        <div>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: token.fontSizeSM,
                              display: "block",
                              marginBottom: token.marginXXS,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Groupon
                          </Text>
                          {renderEditableField(
                            option,
                            "grouponPrice",
                            <div>
                              <Text
                                strong
                                style={{
                                  fontSize: token.fontSize,
                                  color: token.colorPrimary,
                                }}
                              >
                                ${Math.round(option.grouponPrice)}
                              </Text>
                            </div>,
                            "number"
                          )}
                        </div>

                        {/* Discount */}
                        <div>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: token.fontSizeSM,
                              display: "block",
                              marginBottom: token.marginXXS,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Discount
                          </Text>
                          {renderEditableField(
                            option,
                            "discount",
                            <div>
                              <Tag
                                color="orange"
                                style={{
                                  fontSize: 11,
                                  padding: "0 6px",
                                  lineHeight: "20px",
                                  fontWeight: 600,
                                }}
                              >
                                {option.discount}% OFF
                              </Tag>
                            </div>,
                            "number"
                          )}
                        </div>

                        {/* Toggle and Settings */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: token.marginXXS,
                          }}
                        >
                          <Switch
                            size="small"
                            checked={option.enabled}
                            onChange={(checked) => {
                              const newOptions = options.map((opt) =>
                                opt.id === option.id
                                  ? { ...opt, enabled: checked }
                                  : opt
                              );
                              onOptionsChange(newOptions);
                            }}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<Settings size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSettings(option);
                            }}
                          />
                        </div>

                        {/* Merchant Payout (if enabled) */}
                        {showMerchantPayout && (
                          <div>
                            <Text
                              type="secondary"
                              style={{
                                fontSize: token.fontSizeSM,
                                display: "block",
                                marginBottom: token.marginXXS,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Payout
                            </Text>
                            <div style={{ padding: "2px 6px" }}>
                              <Text style={{ fontSize: 13 }}>
                                ${Math.round((option.grouponPrice || 0) * 0.8)}
                              </Text>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </div>
          )}
        </Space>
      </div>

      {/* Settings Sidebar - Only render when NOT using universal sidebar mode */}
      {!onOptionSelect && (
        <SettingsSidebar
          open={settingsOpen}
          onClose={handleCloseSettings}
          width={420}
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Settings size={18} />
                <Text strong>Option Settings</Text>
              </div>
              {autoSaving && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Auto-saving...
                </Text>
              )}
            </div>
          }
        >
          {selectedOption && (
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              {/* REQUIRED DETAILS */}
              <div>
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="middle"
                >
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
                    <Input
                      value={selectedOption.name}
                      onChange={(e) =>
                        handleSettingsChange("name", e.target.value)
                      }
                      size="large"
                    />
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
                        value={selectedOption.regularPrice}
                        onChange={(value) => {
                          const newRegularPrice = value || 0;
                          handleSettingsChange("regularPrice", newRegularPrice);
                          // Recalculate discount
                          const newDiscount = calculateDiscount(
                            newRegularPrice,
                            selectedOption.grouponPrice
                          );
                          handleSettingsChange("discount", newDiscount);
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
                        value={selectedOption.grouponPrice}
                        onChange={(value) => {
                          const newGrouponPrice = value || 0;
                          handleSettingsChange("grouponPrice", newGrouponPrice);
                          // Recalculate discount
                          const newDiscount = calculateDiscount(
                            selectedOption.regularPrice,
                            newGrouponPrice
                          );
                          handleSettingsChange("discount", newDiscount);
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
                        value={selectedOption.discount}
                        onChange={(value) => {
                          const newDiscount = value || 0;
                          handleSettingsChange("discount", newDiscount);
                          // Recalculate groupon price
                          const newGrouponPrice = calculateGrouponPrice(
                            selectedOption.regularPrice,
                            newDiscount
                          );
                          handleSettingsChange("grouponPrice", newGrouponPrice);
                        }}
                        suffix="%"
                        size="large"
                        style={{ width: "100%" }}
                        min={0}
                        max={100}
                        step={1}
                        precision={0}
                      />
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, marginTop: 4, display: "block" }}
                      >
                        Save $
                        {Math.round(
                          selectedOption.regularPrice -
                            selectedOption.grouponPrice
                        )}
                      </Text>
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
                        value={selectedOption.monthlyCapacity || 100}
                        onChange={(value) =>
                          handleSettingsChange("monthlyCapacity", value || 100)
                        }
                        size="large"
                        style={{ width: "100%" }}
                        min={1}
                        max={10000}
                        step={10}
                        precision={0}
                      />
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, marginTop: 4, display: "block" }}
                      >
                        Up to 10,000
                      </Text>
                    </div>
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
                      <Switch
                        checked={selectedOption.enabled}
                        onChange={(checked) =>
                          handleSettingsChange("enabled", checked)
                        }
                      />
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
                      <Space
                        direction="vertical"
                        style={{ width: "100%" }}
                        size="middle"
                      >
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
                            value={selectedOption.subtitle || ""}
                            onChange={(e) =>
                              handleSettingsChange("subtitle", e.target.value)
                            }
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
                            value={selectedOption.details || ""}
                            onChange={(e) =>
                              handleSettingsChange("details", e.target.value)
                            }
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
                            value={selectedOption.validity}
                            onChange={(value) =>
                              handleSettingsChange("validity", value)
                            }
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
                      <Space
                        direction="vertical"
                        style={{ width: "100%" }}
                        size="middle"
                      >
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
                              value={selectedOption.merchantMargin || 50}
                              onChange={(value) => {
                                const merchantMargin = value || 0;
                                handleSettingsChange(
                                  "merchantMargin",
                                  merchantMargin
                                );
                                // Auto-adjust Groupon margin to make 100%
                                handleSettingsChange(
                                  "grouponMargin",
                                  100 - merchantMargin
                                );
                              }}
                              suffix="%"
                              size="large"
                              style={{ width: "100%" }}
                              min={0}
                              max={100}
                              step={1}
                              precision={0}
                            />
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 11,
                                marginTop: 4,
                                display: "block",
                              }}
                            >
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
                              value={selectedOption.grouponMargin || 50}
                              onChange={(value) => {
                                const grouponMargin = value || 0;
                                handleSettingsChange(
                                  "grouponMargin",
                                  grouponMargin
                                );
                                // Auto-adjust Merchant margin to make 100%
                                handleSettingsChange(
                                  "merchantMargin",
                                  100 - grouponMargin
                                );
                              }}
                              suffix="%"
                              size="large"
                              style={{ width: "100%" }}
                              min={0}
                              max={100}
                              step={1}
                              precision={0}
                            />
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 11,
                                marginTop: 4,
                                display: "block",
                              }}
                            >
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
                          <Text
                            strong
                            style={{
                              display: "block",
                              marginBottom: 12,
                              fontSize: token.fontSize,
                            }}
                          >
                            Summary
                          </Text>
                          <Space
                            direction="vertical"
                            style={{ width: "100%" }}
                            size="small"
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 13 }}>
                                Customer pays
                              </Text>
                              <Text strong style={{ fontSize: 14 }}>
                                ${Math.round(selectedOption.grouponPrice)}
                              </Text>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 13 }}>
                                Merchant gets
                              </Text>
                              <Text strong style={{ fontSize: 14 }}>
                                $
                                {Math.round(
                                  (selectedOption.grouponPrice *
                                    (selectedOption.merchantMargin || 50)) /
                                    100
                                )}
                              </Text>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 13 }}>
                                Merchant margin
                              </Text>
                              <Text strong style={{ fontSize: 14 }}>
                                {selectedOption.merchantMargin || 50}%
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
                                $
                                {Math.round(
                                  (selectedOption.grouponPrice *
                                    (selectedOption.grouponMargin || 50)) /
                                    100
                                )}
                              </Text>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 13 }}>
                                Groupon margin
                              </Text>
                              <Text strong style={{ fontSize: 14 }}>
                                {selectedOption.grouponMargin || 50}%
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
              {(selectedOption.customFields || []).length > 0 && (
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
                          <Space
                            direction="vertical"
                            style={{ width: "100%" }}
                            size="middle"
                          >
                            {(selectedOption.customFields || []).map(
                              (field) => (
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
                                      onChange={(e) =>
                                        handleCustomFieldChange(
                                          field.id,
                                          e.target.value
                                        )
                                      }
                                      placeholder={`Enter ${field.name.toLowerCase()}`}
                                      size="large"
                                    />
                                  )}

                                  {field.type === "number" && (
                                    <InputNumber
                                      value={field.value}
                                      onChange={(value) =>
                                        handleCustomFieldChange(
                                          field.id,
                                          String(value || "")
                                        )
                                      }
                                      placeholder={`Enter ${field.name.toLowerCase()}`}
                                      style={{ width: "100%" }}
                                      size="large"
                                    />
                                  )}

                                  {field.type === "dropdown" && (
                                    <AutoComplete
                                      value={field.value}
                                      onChange={(value) =>
                                        handleCustomFieldChange(field.id, value)
                                      }
                                      size="large"
                                      style={{ width: "100%" }}
                                      options={
                                        field.name.toLowerCase().includes("oil")
                                          ? [
                                              { value: "Conventional" },
                                              { value: "Full Synthetic" },
                                              {
                                                value:
                                                  "Full Synthetic (European)",
                                              },
                                              { value: "Synthetic Blend" },
                                              { value: "High Mileage" },
                                            ]
                                          : field.name
                                              .toLowerCase()
                                              .includes("size")
                                          ? [
                                              { value: "Small" },
                                              { value: "Medium" },
                                              { value: "Large" },
                                              { value: "X-Large" },
                                            ]
                                          : field.name
                                              .toLowerCase()
                                              .includes("color")
                                          ? [
                                              { value: "Red" },
                                              { value: "Blue" },
                                              { value: "Green" },
                                              { value: "Black" },
                                              { value: "White" },
                                            ]
                                          : field.name
                                              .toLowerCase()
                                              .includes("length")
                                          ? [
                                              { value: "Short" },
                                              { value: "Regular" },
                                              { value: "Long" },
                                              { value: "Extra Long" },
                                            ]
                                          : [
                                              { value: "Option 1" },
                                              { value: "Option 2" },
                                              { value: "Option 3" },
                                            ]
                                      }
                                      placeholder={`Select or enter ${field.name.toLowerCase()}`}
                                      filterOption={(inputValue, option) =>
                                        option!.value
                                          .toUpperCase()
                                          .indexOf(inputValue.toUpperCase()) !==
                                        -1
                                      }
                                    />
                                  )}
                                </div>
                              )
                            )}
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
                <Button
                  danger
                  block
                  icon={<Trash2 size={16} />}
                  onClick={handleRemoveOption}
                >
                  Remove Option
                </Button>
              </div>
            </Space>
          )}
        </SettingsSidebar>
      )}
    </>
  );
};

export default DealOptionsTable;
