import { useState, useMemo } from "react";
import {
  Card,
  Typography,
  Space,
  Button,
  Input,
  theme,
  Switch,
  Row,
  Col,
  Divider,
  Tag,
  Tooltip,
  Empty,
} from "antd";
import { Search, ChevronRight, X, RotateCcw } from "lucide-react";
import { FinePointItem } from "./types";

const { Text, Title } = Typography;
const { useToken } = theme;

// Define structured clause categories and templates
export interface ClauseParameter {
  key: string;
  defaultValue: string;
  type: "text" | "number" | "date";
  placeholder?: string;
}

export interface ClauseTemplate {
  id: string;
  category: string;
  text: string;
  parameters?: ClauseParameter[];
}

export interface StructuredFinePoint extends FinePointItem {
  templateId?: string;
  parameters?: Record<string, string>;
}

// Predefined clause templates organized by category
const CLAUSE_TEMPLATES: ClauseTemplate[] = [
  // Groupon+
  {
    id: "groupon_before_tip",
    category: "Groupon+",
    text: "Reward is calculated on total bill before tip.",
    parameters: [],
  },
  {
    id: "groupon_after_tip",
    category: "Groupon+",
    text: "Reward is calculated on total bill after tip.",
    parameters: [],
  },
  {
    id: "groupon_tiered_rewards",
    category: "Groupon+",
    text: "Offer valid for $firstPercent% rewards only after first purchase and $additionalPercent% rewards for additional purchases, including after the offer is re-claimed. Limited to 1 transaction per visit.",
    parameters: [
      { key: "firstPercent", defaultValue: "$", type: "text", placeholder: "%" },
      { key: "additionalPercent", defaultValue: "$", type: "text", placeholder: "%" },
    ],
  },
  {
    id: "groupon_expire_reclaimable",
    category: "Groupon+",
    text: "Offer expires $days days after claimed, but the offer may be re-claimed for you.",
    parameters: [
      { key: "days", defaultValue: "$", type: "text", placeholder: "days" },
    ],
  },
  {
    id: "groupon_eligible_cards",
    category: "Groupon+",
    text: "Most cards are eligible for rewards.",
    parameters: [],
  },
  {
    id: "groupon_debit_credit",
    category: "Groupon+",
    text: 'For debit cards, select "credit" when you pay. Not all debit purchases qualify for rewards.',
    parameters: [],
  },
  {
    id: "groupon_max_value",
    category: "Groupon+",
    text: "Maximum value of rewards is $$.",
    parameters: [
      { key: "maxValue", defaultValue: "$$", type: "text", placeholder: "amount" },
    ],
  },
  {
    id: "groupon_min_purchase",
    category: "Groupon+",
    text: "Minimum purchase of $$ is required to qualify.",
    parameters: [
      { key: "minAmount", defaultValue: "$$", type: "text", placeholder: "amount" },
    ],
  },
  {
    id: "groupon_terms_change",
    category: "Groupon+",
    text: "This offer, including cash back rewards percentage, may change or become unavailable at any time. You are responsible for confirming this offer is available on any particular date.",
    parameters: [],
  },

  // Redemption & Booking
  {
    id: "redemption_waiver",
    category: "Redemption & Booking",
    text: "Must sign waiver.",
    parameters: [],
  },
  {
    id: "redemption_appointment",
    category: "Redemption & Booking",
    text: "Appointment required. Must book in advance.",
    parameters: [],
  },
  {
    id: "redemption_consultation",
    category: "Redemption & Booking",
    text: "Consultation required before service. If you are ineligible, a refund will be provided.",
    parameters: [],
  },

  // Additional Info
  {
    id: "info_appointment_required",
    category: "Additional Info",
    text: "Appointment required. Must book in advance.",
    parameters: [],
  },

  // Terms & Conditions
  {
    id: "terms_consultation",
    category: "Terms & Conditions",
    text: "Consultation required before service. If you are ineligible, a refund will be provided.",
    parameters: [],
  },
  {
    id: "terms_repurchase",
    category: "Terms & Conditions",
    text: "May be repurchased every $days days.",
    parameters: [
      { key: "days", defaultValue: "30", type: "number", placeholder: "days" },
    ],
  },
  {
    id: "terms_limit_per_table",
    category: "Terms & Conditions",
    text: "Limit $quantity per $unit.",
    parameters: [
      { key: "quantity", defaultValue: "5", type: "number", placeholder: "quantity" },
      { key: "unit", defaultValue: "table", type: "text", placeholder: "unit" },
    ],
  },
  {
    id: "terms_limit_per_visit",
    category: "Terms & Conditions",
    text: "Limit $quantity per visit.",
    parameters: [
      { key: "quantity", defaultValue: "4", type: "number", placeholder: "quantity" },
    ],
  },
  {
    id: "terms_limit_per_person",
    category: "Terms & Conditions",
    text: "Limit $quantity per person.",
    parameters: [
      { key: "quantity", defaultValue: "3", type: "number", placeholder: "quantity" },
    ],
  },

  // Expiration
  {
    id: "expiration_valid_until",
    category: "Expiration",
    text: "Valid until $.",
    parameters: [
      { key: "date", defaultValue: "$", type: "date", placeholder: "date" },
    ],
  },
  {
    id: "expiration_date_only",
    category: "Expiration",
    text: "$",
    parameters: [
      { key: "date", defaultValue: "$", type: "date", placeholder: "date" },
    ],
  },
  {
    id: "expiration_dollar_only",
    category: "Expiration",
    text: "Valid $ only.",
    parameters: [
      { key: "when", defaultValue: "$", type: "text", placeholder: "when" },
    ],
  },
  {
    id: "expiration_specific_date",
    category: "Expiration",
    text: "Valid on date and time specified on Groupon only.",
    parameters: [],
  },
  {
    id: "expiration_days_after",
    category: "Expiration",
    text: "Expires $ days after purchase.",
    parameters: [
      { key: "days", defaultValue: "$", type: "number", placeholder: "days" },
    ],
  },
  {
    id: "expiration_date_short",
    category: "Expiration",
    text: "Expires $.",
    parameters: [
      { key: "date", defaultValue: "$", type: "date", placeholder: "date" },
    ],
  },
];

interface FinePrintEditorProps {
  finePoints: FinePointItem[];
  originalFinePoints: FinePointItem[];
  onFinePointsChange: (finePoints: FinePointItem[]) => void;
}

const FinePrintEditor = ({
  finePoints,
  originalFinePoints,
  onFinePointsChange,
}: FinePrintEditorProps) => {
  const { token } = useToken();
  const [useStructured, setUseStructured] = useState(true);
  const [suggestedSearch, setSuggestedSearch] = useState("");
  const [selectedSearch, setSelectedSearch] = useState("");
  const [editingParamId, setEditingParamId] = useState<string | null>(null);

  // Convert fine points to structured format
  const structuredFinePoints = finePoints as StructuredFinePoint[];

  // Check if there are any changes
  const hasAnyChanges =
    finePoints.length !== originalFinePoints.length ||
    finePoints.some(
      (p, i) =>
        !originalFinePoints[i] || p.text !== originalFinePoints[i].text
    );

  // Get categories from templates
  const categories = useMemo(() => {
    const cats = new Set(CLAUSE_TEMPLATES.map((t) => t.category));
    return Array.from(cats);
  }, []);

  // Filter suggested clauses
  const filteredSuggested = useMemo(() => {
    if (!suggestedSearch.trim()) return CLAUSE_TEMPLATES;
    const search = suggestedSearch.toLowerCase();
    return CLAUSE_TEMPLATES.filter(
      (template) =>
        template.text.toLowerCase().includes(search) ||
        template.category.toLowerCase().includes(search)
    );
  }, [suggestedSearch]);

  // Filter selected clauses
  const filteredSelected = useMemo(() => {
    if (!selectedSearch.trim()) return structuredFinePoints;
    const search = selectedSearch.toLowerCase();
    return structuredFinePoints.filter((point) =>
      point.text.toLowerCase().includes(search)
    );
  }, [selectedSearch, structuredFinePoints]);

  // Group suggested clauses by category
  const groupedSuggested = useMemo(() => {
    const groups: Record<string, ClauseTemplate[]> = {};
    filteredSuggested.forEach((template) => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, [filteredSuggested]);

  // Check if a template is already selected
  const isTemplateSelected = (templateId: string) => {
    return structuredFinePoints.some((p) => p.templateId === templateId);
  };

  // Add a clause from template
  const handleAddClause = (template: ClauseTemplate) => {
    const parameters: Record<string, string> = {};
    template.parameters?.forEach((param) => {
      parameters[param.key] = param.defaultValue;
    });

    const newClause: StructuredFinePoint = {
      id: Date.now().toString(),
      text: template.text,
      templateId: template.id,
      parameters: template.parameters ? parameters : undefined,
    };

    onFinePointsChange([...finePoints, newClause]);
  };

  // Remove a selected clause
  const handleRemoveClause = (id: string) => {
    onFinePointsChange(finePoints.filter((p) => p.id !== id));
  };

  // Update parameter value
  const handleUpdateParameter = (
    pointId: string,
    paramKey: string,
    value: string
  ) => {
    const updatedPoints = structuredFinePoints.map((point) => {
      if (point.id === pointId && point.parameters) {
        return {
          ...point,
          parameters: {
            ...point.parameters,
            [paramKey]: value,
          },
        };
      }
      return point;
    });
    onFinePointsChange(updatedPoints);
  };

  // Render text with editable parameters
  const renderClauseText = (point: StructuredFinePoint) => {
    if (!point.parameters || Object.keys(point.parameters).length === 0) {
      return <Text style={{ fontSize: 13 }}>{point.text}</Text>;
    }

    const template = CLAUSE_TEMPLATES.find((t) => t.id === point.templateId);
    if (!template) {
      return <Text style={{ fontSize: 13 }}>{point.text}</Text>;
    }

    let text = template.text;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Find all parameters in the text
    template.parameters?.forEach((param, idx) => {
      const paramPlaceholder = `$${param.key}`;
      const index = text.indexOf(paramPlaceholder, lastIndex);

      if (index !== -1) {
        // Add text before parameter
        if (index > lastIndex) {
          parts.push(
            <span key={`text-${idx}`}>{text.substring(lastIndex, index)}</span>
          );
        }

        // Add editable parameter
        const value = point.parameters?.[param.key] || param.defaultValue;
        const isEditing = editingParamId === `${point.id}-${param.key}`;

        parts.push(
          <span key={`param-${idx}`} style={{ display: "inline-block" }}>
            {isEditing ? (
              <Input
                size="small"
                value={value}
                onChange={(e) =>
                  handleUpdateParameter(point.id, param.key, e.target.value)
                }
                onBlur={() => setEditingParamId(null)}
                onPressEnter={() => setEditingParamId(null)}
                autoFocus
                style={{
                  width: Math.max(60, value.length * 10),
                  fontSize: 13,
                  padding: "0 4px",
                }}
              />
            ) : (
              <span
                onClick={() => setEditingParamId(`${point.id}-${param.key}`)}
                style={{
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationColor: token.colorPrimary,
                  cursor: "pointer",
                  color: token.colorPrimary,
                  fontWeight: 500,
                  padding: "0 2px",
                }}
              >
                {value}
              </span>
            )}
          </span>
        );

        lastIndex = index + paramPlaceholder.length;
      }
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.substring(lastIndex)}</span>);
    }

    return <div style={{ fontSize: 13, lineHeight: "20px" }}>{parts}</div>;
  };

  const handleRevertAll = () => {
    onFinePointsChange([...originalFinePoints]);
  };

  // Render unstructured mode (original simple editor)
  if (!useStructured) {
    return (
      <Card
        title={
          <Space>
            <Text strong>Fine Print</Text>
            <Tag>{finePoints.length} items</Tag>
          </Space>
        }
        extra={
          <Switch
            checked={useStructured}
            onChange={setUseStructured}
            checkedChildren="Structured"
            unCheckedChildren="Simple"
          />
        }
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {finePoints.map((point) => (
            <div
              key={point.id}
              style={{
                display: "flex",
                gap: 8,
                padding: "8px 12px",
                background: token.colorBgLayout,
                borderRadius: 6,
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                •
              </Text>
              <Input
                value={point.text}
                onChange={(e) => {
                  const updated = finePoints.map((p) =>
                    p.id === point.id ? { ...p, text: e.target.value } : p
                  );
                  onFinePointsChange(updated);
                }}
                variant="borderless"
                style={{ flex: 1, fontSize: 13 }}
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<X size={14} />}
                onClick={() => handleRemoveClause(point.id)}
              />
            </div>
          ))}
          <Button
            block
            type="dashed"
            onClick={() => {
              onFinePointsChange([
                ...finePoints,
                { id: Date.now().toString(), text: "" },
              ]);
            }}
          >
            Add Item
          </Button>
        </Space>
      </Card>
    );
  }

  // Render structured mode
  return (
    <Card
      style={{ marginBottom: 16 }}
      styles={{
        body: { padding: 0 },
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Space size="large">
            <Title level={5} style={{ margin: 0 }}>
              Fine Print
            </Title>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Switch
                checked={useStructured}
                onChange={setUseStructured}
                size="small"
              />
              <Text type="secondary" style={{ fontSize: 13 }}>
                Use structured fine print
              </Text>
              {useStructured && (
                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                    fontStyle: "italic",
                    marginLeft: 4,
                  }}
                >
                  (locked - deal has existing structured data)
                </Text>
              )}
            </div>
          </Space>
          {hasAnyChanges && (
            <Tooltip title="Revert all changes">
              <Button
                size="small"
                icon={<RotateCcw size={14} />}
                onClick={handleRevertAll}
              >
                Revert All
              </Button>
            </Tooltip>
          )}
        </div>

        {useStructured && (
          <Text
            type="secondary"
            style={{ fontSize: 13, display: "block", marginTop: 8 }}
          >
            Select clauses and fill parameters
          </Text>
        )}
      </div>

      {/* Structured Fine Print Editor */}
      {useStructured && (
        <Row>
          {/* Suggested Clauses Column */}
          <Col
            span={12}
            style={{
              borderRight: `1px solid ${token.colorBorderSecondary}`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "16px 20px 12px",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Text strong style={{ fontSize: 14, display: "block", marginBottom: 12 }}>
                Suggested Clauses
              </Text>
              <Input
                placeholder="Search clauses..."
                prefix={<Search size={16} style={{ color: token.colorTextPlaceholder }} />}
                value={suggestedSearch}
                onChange={(e) => setSuggestedSearch(e.target.value)}
                allowClear
              />
            </div>

            <div style={{ maxHeight: "400px", overflow: "auto", padding: "12px 20px" }}>
              <Space direction="vertical" style={{ width: "100%" }} size="small">
                {Object.entries(groupedSuggested).map(
                  ([category, templates]) => (
                    <div key={category} style={{ marginBottom: 16 }}>
                      <Text
                        strong
                        style={{
                          fontSize: 13,
                          color: token.colorTextSecondary,
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        {category}
                      </Text>
                      <Space direction="vertical" style={{ width: "100%" }} size={4}>
                        {templates.map((template) => {
                          const isSelected = isTemplateSelected(template.id);
                          return (
                            <div
                              key={template.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 12px",
                                background: isSelected
                                  ? token.colorFillQuaternary
                                  : "transparent",
                                borderRadius: 6,
                                cursor: isSelected ? "not-allowed" : "pointer",
                                opacity: isSelected ? 0.5 : 1,
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background =
                                    token.colorFillTertiary;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background =
                                    "transparent";
                                }
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{ fontSize: 11, minWidth: 12 }}
                              >
                                •
                              </Text>
                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: 13,
                                  lineHeight: "20px",
                                }}
                              >
                                {template.text}
                              </Text>
                              <Tooltip 
                                title={isSelected ? "Already selected" : "Add to selected"}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={
                                    <ChevronRight
                                      size={16}
                                      color={token.colorPrimary}
                                    />
                                  }
                                  disabled={isSelected}
                                  onClick={() => handleAddClause(template)}
                                  style={{
                                    minWidth: 24,
                                    height: 24,
                                    padding: 0,
                                  }}
                                />
                              </Tooltip>
                            </div>
                          );
                        })}
                      </Space>
                    </div>
                  )
                )}
                {Object.keys(groupedSuggested).length === 0 && (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No clauses found"
                    style={{ marginTop: 40 }}
                  />
                )}
              </Space>
            </div>
          </Col>

          {/* Selected Clauses Column */}
          <Col span={12} style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                padding: "16px 20px 12px",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Text strong style={{ fontSize: 14, display: "block", marginBottom: 12 }}>
                Selected ({structuredFinePoints.length})
              </Text>
              <Input
                placeholder="Search selected..."
                prefix={<Search size={16} style={{ color: token.colorTextPlaceholder }} />}
                value={selectedSearch}
                onChange={(e) => setSelectedSearch(e.target.value)}
                allowClear
              />
            </div>

            <div style={{ maxHeight: "400px", overflow: "auto", padding: "12px 20px" }}>
              {filteredSelected.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    selectedSearch.trim()
                      ? "No matching selected clauses"
                      : "No clauses selected"
                  }
                  style={{ marginTop: 40 }}
                />
              ) : (
                <Space direction="vertical" style={{ width: "100%" }} size="small">
                  {/* Group selected by category */}
                  {categories.map((category) => {
                    const categoryPoints = filteredSelected.filter((point) => {
                      const template = CLAUSE_TEMPLATES.find(
                        (t) => t.id === point.templateId
                      );
                      return template?.category === category;
                    });

                    if (categoryPoints.length === 0) return null;

                    return (
                      <div key={category} style={{ marginBottom: 16 }}>
                        <Text
                          strong
                          style={{
                            fontSize: 13,
                            color: token.colorTextSecondary,
                            display: "block",
                            marginBottom: 8,
                          }}
                        >
                          {category}
                        </Text>
                        <Space
                          direction="vertical"
                          style={{ width: "100%" }}
                          size={4}
                        >
                          {categoryPoints.map((point) => (
                            <div
                              key={point.id}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 8,
                                padding: "8px 12px",
                                background: token.colorBgLayout,
                                borderRadius: 6,
                                transition: "all 0.2s",
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{ fontSize: 11, minWidth: 12, marginTop: 4 }}
                              >
                                •
                              </Text>
                              <div style={{ flex: 1 }}>
                                {renderClauseText(point)}
                              </div>
                              <Tooltip title="Remove (returns to suggested)">
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<X size={14} />}
                                  onClick={() => handleRemoveClause(point.id)}
                                  style={{
                                    minWidth: 24,
                                    height: 24,
                                    padding: 0,
                                    marginTop: 2,
                                  }}
                                />
                              </Tooltip>
                            </div>
                          ))}
                        </Space>
                      </div>
                    );
                  })}

                  {/* Uncategorized items */}
                  {filteredSelected
                    .filter((point) => {
                      const template = CLAUSE_TEMPLATES.find(
                        (t) => t.id === point.templateId
                      );
                      return !template;
                    })
                    .map((point) => (
                      <div
                        key={point.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: "8px 12px",
                          background: token.colorBgLayout,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          type="secondary"
                          style={{ fontSize: 11, minWidth: 12, marginTop: 4 }}
                        >
                          •
                        </Text>
                        <Text style={{ flex: 1, fontSize: 13 }}>
                          {point.text}
                        </Text>
                        <Tooltip title="Remove (returns to suggested)">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<X size={14} />}
                            onClick={() => handleRemoveClause(point.id)}
                            style={{
                              minWidth: 24,
                              height: 24,
                              padding: 0,
                              marginTop: 2,
                            }}
                          />
                        </Tooltip>
                      </div>
                    ))}
                </Space>
              )}
            </div>
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default FinePrintEditor;
