import React from "react";
import {
  Modal,
  Row,
  Col,
  Card,
  Space,
  Typography,
  Button,
  Divider,
  Tag,
  Statistic,
  Progress,
  List,
  theme,
} from "antd";
import { Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import { MerchantAccount } from "../data/merchantAccounts";
import {
  GeneratedOption,
  calculateDealQualityScore,
  getDealQualityRecommendations,
} from "../lib/aiRecommendations";
import EntityAvatar from "./EntityAvatar";
import { PotentialTag } from "../utils/potentialHelpers";

const { Text, Title } = Typography;
const { useToken } = theme;

interface DealPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
  loading?: boolean;
  merchant: MerchantAccount;
  categoryName: string;
  subcategoryName?: string;
  selectedOptions: GeneratedOption[];
}

const DealPreviewModal: React.FC<DealPreviewModalProps> = ({
  open,
  onClose,
  onCreate,
  loading = false,
  merchant,
  categoryName,
  subcategoryName,
  selectedOptions,
}) => {
  const { token } = useToken();

  // Calculate metrics
  const totalProjectedRevenue = selectedOptions.reduce(
    (sum, opt) => sum + opt.projectedSales * opt.grouponPrice,
    0
  );

  const totalProjectedOrders = selectedOptions.reduce(
    (sum, opt) => sum + opt.projectedSales,
    0
  );

  const avgConfidence =
    selectedOptions.reduce((sum, opt) => sum + opt.confidence, 0) /
    (selectedOptions.length || 1);

  // Estimate conversion rate based on merchant potential and confidence
  const baseConversionRate = 3.5;
  const potentialMultiplier = merchant.potentialAnalysis.score / 70;
  const conversionRate = Number(
    (baseConversionRate * potentialMultiplier * avgConfidence).toFixed(1)
  );

  // Calculate quality score
  const qualityScore = calculateDealQualityScore({
    hasCategory: true,
    hasSubcategory: !!subcategoryName,
    optionsCount: selectedOptions.length,
    hasTitle: false, // Will be created later
    hasDescription: false,
    mediaCount: 0,
    highlightsCount: 0,
    finePointsCount: 0,
  });

  // Get recommendations
  const recommendations = getDealQualityRecommendations(qualityScore, {
    hasCategory: true,
    hasSubcategory: !!subcategoryName,
    optionsCount: selectedOptions.length,
  });

  // Final check items
  const checkItems = [
    {
      key: "category",
      label: "Category selected",
      complete: true,
    },
    {
      key: "options",
      label: `${selectedOptions.length} pricing option(s) configured`,
      complete: selectedOptions.length > 0,
    },
    {
      key: "merchant",
      label: "Merchant verified",
      complete: true,
    },
    {
      key: "potential",
      label: `${merchant.potential.charAt(0).toUpperCase() + merchant.potential.slice(1)} growth potential`,
      complete: true,
    },
  ];

  const allComplete = checkItems.every((item) => item.complete);

  return (
    <Modal
      title={
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: `${token.colorPrimary}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorPrimary,
            }}
          >
            <Sparkles size={18} />
          </div>
          <span>Review Your Deal Setup</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="back" onClick={onClose} size="large">
          Go Back
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={loading}
          onClick={onCreate}
          icon={<Sparkles size={16} />}
          size="large"
          disabled={!allComplete}
        >
          Create Deal Draft
        </Button>,
      ]}
    >
      <Row gutter={24}>
        {/* Left: Preview Details */}
        <Col span={16}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Merchant Info */}
            <Card size="small">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <EntityAvatar
                  name={merchant.name}
                  logo={merchant.logo}
                  size={48}
                />
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 16, display: "block" }}>
                    {merchant.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {merchant.businessType} • {merchant.location}
                  </Text>
                </div>
                <PotentialTag
                  potential={merchant.potential}
                  showLabel={true}
                  style={{ fontSize: 12 }}
                />
              </div>
            </Card>

            {/* Category & Options */}
            <Card title="Deal Configuration">
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                    CATEGORY
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong style={{ fontSize: 15 }}>
                      {categoryName}
                    </Text>
                    {subcategoryName && (
                      <>
                        <ArrowRight
                          size={14}
                          style={{
                            margin: "0 8px",
                            verticalAlign: "middle",
                            color: token.colorTextSecondary,
                          }}
                        />
                        <Text style={{ fontSize: 15 }}>{subcategoryName}</Text>
                      </>
                    )}
                  </div>
                </div>

                <Divider style={{ margin: "8px 0" }} />

                <div>
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, display: "block", marginBottom: 8 }}
                  >
                    PRICING OPTIONS ({selectedOptions.length})
                  </Text>
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    {selectedOptions.map((opt, index) => (
                      <Card
                        key={opt.id}
                        size="small"
                        style={{
                          border:
                            opt.confidence > 0.9
                              ? `2px solid ${token.colorPrimary}`
                              : `1px solid ${token.colorBorder}`,
                          background:
                            opt.confidence > 0.9
                              ? `${token.colorPrimary}05`
                              : undefined,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 4,
                              }}
                            >
                              <Text strong>{opt.name}</Text>
                              {opt.confidence > 0.9 && (
                                <Tag
                                  color="blue"
                                  icon={<Sparkles size={12} />}
                                  style={{ fontSize: 11 }}
                                >
                                  AI Pick
                                </Tag>
                              )}
                              {index === 1 && (
                                <Tag color="gold" style={{ fontSize: 11 }}>
                                  Most Popular
                                </Tag>
                              )}
                            </div>
                            <Space size="large">
                              <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  Price:{" "}
                                </Text>
                                <Text strong style={{ fontSize: 13 }}>
                                  ${opt.grouponPrice}
                                </Text>
                                <Text
                                  delete
                                  type="secondary"
                                  style={{ fontSize: 12, marginLeft: 4 }}
                                >
                                  ${opt.regularPrice}
                                </Text>
                              </div>
                              <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  Discount:{" "}
                                </Text>
                                <Tag color="success" style={{ fontSize: 11 }}>
                                  {opt.discount}% off
                                </Tag>
                              </div>
                              <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  Merchant Payout:{" "}
                                </Text>
                                <Text strong style={{ fontSize: 13, color: token.colorSuccess }}>
                                  ${Math.round(opt.grouponPrice * 0.5)}
                                </Text>
                              </div>
                              <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  Est. Sales:{" "}
                                </Text>
                                <Text strong style={{ fontSize: 13 }}>
                                  {opt.projectedSales}
                                </Text>
                              </div>
                            </Space>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Space>
                </div>

                <Divider style={{ margin: "8px 0" }} />

                {/* Performance Projections */}
                <div>
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, display: "block", marginBottom: 12 }}
                  >
                    EXPECTED PERFORMANCE (First 30 Days)
                  </Text>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Statistic
                        title="Est. Revenue"
                        value={totalProjectedRevenue}
                        prefix="$"
                        valueStyle={{ fontSize: 20 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Est. Orders"
                        value={totalProjectedOrders}
                        valueStyle={{ fontSize: 20 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Conv. Rate"
                        value={conversionRate}
                        suffix="%"
                        valueStyle={{ fontSize: 20 }}
                      />
                    </Col>
                  </Row>
                </div>
              </Space>
            </Card>
          </Space>
        </Col>

        {/* Right: AI Final Check */}
        <Col span={8}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {/* Status Card */}
            <Card
              style={{
                background: allComplete
                  ? `${token.colorSuccess}08`
                  : `${token.colorWarning}08`,
                border: `1px solid ${
                  allComplete ? token.colorSuccess : token.colorWarning
                }30`,
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div style={{ textAlign: "center" }}>
                  <CheckCircle
                    size={48}
                    style={{
                      color: allComplete ? token.colorSuccess : token.colorWarning,
                    }}
                  />
                  <Title
                    level={5}
                    style={{
                      margin: "12px 0 4px 0",
                      color: allComplete ? token.colorSuccess : token.colorWarning,
                    }}
                  >
                    {allComplete ? "Ready to Launch" : "Almost Ready"}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {allComplete
                      ? "Your deal setup looks great!"
                      : "Complete remaining items below"}
                  </Text>
                </div>

                <Divider style={{ margin: "4px 0" }} />

                {/* Checklist */}
                <div>
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    {checkItems.map((item) => (
                      <div
                        key={item.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <CheckCircle
                          size={14}
                          style={{
                            color: item.complete
                              ? token.colorSuccess
                              : token.colorTextDisabled,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            color: item.complete
                              ? token.colorText
                              : token.colorTextSecondary,
                          }}
                        >
                          {item.label}
                        </Text>
                      </div>
                    ))}
                  </Space>
                </div>
              </Space>
            </Card>

            {/* Quality Score */}
            <Card title="Setup Quality Score">
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div style={{ textAlign: "center" }}>
                  <Progress
                    type="circle"
                    percent={qualityScore}
                    strokeColor={{
                      "0%": token.colorWarning,
                      "100%": token.colorSuccess,
                    }}
                    width={100}
                    format={(percent) => (
                      <span style={{ fontSize: 24, fontWeight: 600 }}>
                        {percent}
                      </span>
                    )}
                  />
                </div>
                <Text
                  type="secondary"
                  style={{ fontSize: 11, textAlign: "center", display: "block" }}
                >
                  This score will improve as you add content, images, and details in
                  the next step
                </Text>
              </Space>
            </Card>

            {/* AI Recommendations */}
            <Card
              title={
                <Space size="small">
                  <Sparkles size={16} />
                  <span>Next Steps</span>
                </Space>
              }
              size="small"
            >
              <List
                size="small"
                dataSource={recommendations}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: "8px 0",
                      borderBottom: "none",
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>• {item}</Text>
                  </List.Item>
                )}
              />
            </Card>

            {/* Confidence Indicator */}
            <Card size="small">
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    AI Confidence
                  </Text>
                  <Text strong style={{ fontSize: 16 }}>
                    {Math.round(avgConfidence * 100)}%
                  </Text>
                </div>
                <Progress
                  percent={Math.round(avgConfidence * 100)}
                  strokeColor={token.colorSuccess}
                  showInfo={false}
                  size="small"
                />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Based on market analysis and merchant performance data
                </Text>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </Modal>
  );
};

export default DealPreviewModal;

