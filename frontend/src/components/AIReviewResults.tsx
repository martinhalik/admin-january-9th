import React from "react";
import { Card, Typography, Space, Tag, theme, Alert } from "antd";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { AIReviewResult } from "./AIPrequalificationModal";

const { Text, Title } = Typography;
const { useToken } = theme;

interface AIReviewResultsProps {
  result: AIReviewResult;
  compact?: boolean;
}

const AIReviewResults: React.FC<AIReviewResultsProps> = ({ result, compact = false }) => {
  const { token } = useToken();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle size={16} style={{ color: token.colorSuccess }} />;
      case "warning":
        return <AlertTriangle size={16} style={{ color: token.colorWarning }} />;
      case "fail":
        return <XCircle size={16} style={{ color: token.colorError }} />;
      default:
        return null;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return token.colorSuccess;
      case "pass_with_warnings":
        return token.colorWarning;
      case "fail":
        return token.colorError;
      default:
        return token.colorTextSecondary;
    }
  };

  if (compact) {
    return (
      <Card size="small">
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Text strong>AI Pre-qualification Score</Text>
            <div style={{ display: "flex", alignItems: "center", gap: token.marginXS }}>
              <Text
                strong
                style={{
                  fontSize: token.fontSizeHeading5,
                  color: getOverallStatusColor(result.status),
                }}
              >
                {result.score}
              </Text>
              <Tag
                color={
                  result.status === "pass"
                    ? "success"
                    : result.status === "pass_with_warnings"
                    ? "warning"
                    : "error"
                }
                style={{ margin: 0 }}
              >
                {result.status === "pass"
                  ? "Approved"
                  : result.status === "pass_with_warnings"
                  ? "Warning"
                  : "Failed"}
              </Tag>
            </div>
          </div>
          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            Reviewed {new Date(result.timestamp).toLocaleString()}
          </Text>
        </Space>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {/* Overall Score */}
      <Card>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: token.fontWeightStrong,
              color: getOverallStatusColor(result.status),
              lineHeight: 1,
            }}
          >
            {result.score}
          </div>
          <Text type="secondary">Overall Score</Text>
          <div style={{ marginTop: token.marginSM }}>
            <Tag
              color={
                result.status === "pass"
                  ? "success"
                  : result.status === "pass_with_warnings"
                  ? "warning"
                  : "error"
              }
              style={{ fontSize: token.fontSize }}
            >
              {result.status === "pass"
                ? "✓ Approved"
                : result.status === "pass_with_warnings"
                ? "⚠ Approved with Warnings"
                : "✗ Needs Improvement"}
            </Tag>
          </div>
          <Text type="secondary" style={{ fontSize: token.fontSizeSM, display: "block", marginTop: token.marginXS }}>
            Reviewed on {new Date(result.timestamp).toLocaleString()}
          </Text>
        </div>
      </Card>

      {/* Detailed Checks */}
      <Card title="Review Checklist" size="small">
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          {result.checks.map((check, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: token.marginSM,
                padding: token.paddingSM,
                background:
                  check.status === "fail"
                    ? `${token.colorErrorBg}`
                    : check.status === "warning"
                    ? `${token.colorWarningBg}`
                    : `${token.colorSuccessBg}`,
                borderRadius: token.borderRadius,
              }}
            >
              {getStatusIcon(check.status)}
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: token.fontSize }}>
                  {check.category}
                </Text>
                <div>
                  <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                    {check.message}
                  </Text>
                </div>
              </div>
            </div>
          ))}
        </Space>
      </Card>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <Alert
          type="info"
          message="AI Recommendations"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: token.paddingLG }}>
              {result.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          }
        />
      )}
    </Space>
  );
};

export default AIReviewResults;


