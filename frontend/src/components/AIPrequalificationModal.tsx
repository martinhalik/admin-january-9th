import React, { useState, useEffect } from "react";
import { Modal, Progress, Space, Typography, Card, Tag, Alert, Button, theme } from "antd";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

export interface AIReviewResult {
  status: "pass" | "pass_with_warnings" | "fail";
  score: number; // 0-100
  checks: {
    category: string;
    status: "pass" | "warning" | "fail";
    message: string;
  }[];
  recommendations: string[];
  timestamp: string;
}

interface AIPrequalificationModalProps {
  open: boolean;
  dealId: string;
  dealData: any;
  onClose: () => void;
  onSuccess: (result: AIReviewResult) => void;
  onFail: (result: AIReviewResult) => void;
}

const AIPrequalificationModal: React.FC<AIPrequalificationModalProps> = ({
  open,
  dealId,
  dealData,
  onClose,
  onSuccess,
  onFail,
}) => {
  const { token } = useToken();
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<AIReviewResult | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open && !reviewResult) {
      startReview();
    }
  }, [open]);

  const startReview = async () => {
    setIsReviewing(true);
    setProgress(0);
    setReviewResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 500);

    // Simulate AI review (10 seconds)
    await new Promise((resolve) => setTimeout(resolve, 10000));
    
    clearInterval(progressInterval);
    setProgress(100);

    // Mock AI review results
    const result = performMockReview(dealData);
    setReviewResult(result);
    setIsReviewing(false);
  };

  const performMockReview = (deal: any): AIReviewResult => {
    const checks = [];
    let totalScore = 0;
    let maxScore = 0;

    // Content Quality Check
    maxScore += 20;
    if (deal.content?.description && deal.content.description.length > 100) {
      checks.push({
        category: "Content Quality",
        status: "pass" as const,
        message: "Description is comprehensive and engaging",
      });
      totalScore += 20;
    } else if (deal.content?.description && deal.content.description.length > 50) {
      checks.push({
        category: "Content Quality",
        status: "warning" as const,
        message: "Description could be more detailed (recommend 150+ characters)",
      });
      totalScore += 12;
    } else {
      checks.push({
        category: "Content Quality",
        status: "fail" as const,
        message: "Description is too short or missing",
      });
    }

    // Media Check
    maxScore += 20;
    const mediaCount = deal.content?.media?.length || 0;
    if (mediaCount >= 5) {
      checks.push({
        category: "Visual Content",
        status: "pass" as const,
        message: `${mediaCount} images uploaded - excellent coverage`,
      });
      totalScore += 20;
    } else if (mediaCount >= 3) {
      checks.push({
        category: "Visual Content",
        status: "warning" as const,
        message: `Only ${mediaCount} images (recommend 5+ for better performance)`,
      });
      totalScore += 12;
    } else {
      checks.push({
        category: "Visual Content",
        status: "fail" as const,
        message: `Only ${mediaCount} images - need at least 3 images`,
      });
    }

    // Deal Economics
    maxScore += 20;
    const hasOptions = deal.options && deal.options.length > 0;
    if (hasOptions && deal.options.some((opt: any) => opt.discount >= 30)) {
      checks.push({
        category: "Deal Economics",
        status: "pass" as const,
        message: "Strong discount value (30%+ off)",
      });
      totalScore += 20;
    } else if (hasOptions) {
      checks.push({
        category: "Deal Economics",
        status: "warning" as const,
        message: "Consider increasing discount for better customer appeal",
      });
      totalScore += 15;
    } else {
      checks.push({
        category: "Deal Economics",
        status: "fail" as const,
        message: "No deal options configured",
      });
    }

    // Location Setup
    maxScore += 20;
    const hasLocations = deal.locationIds && deal.locationIds.length > 0;
    if (hasLocations) {
      checks.push({
        category: "Location Setup",
        status: "pass" as const,
        message: `${deal.locationIds.length} location(s) configured`,
      });
      totalScore += 20;
    } else {
      checks.push({
        category: "Location Setup",
        status: "fail" as const,
        message: "No locations assigned to this deal",
      });
    }

    // Compliance Check
    maxScore += 20;
    const hasFinePoints = deal.content?.finePoints && deal.content.finePoints.length > 0;
    if (hasFinePoints && deal.content.finePoints.length >= 3) {
      checks.push({
        category: "Compliance",
        status: "pass" as const,
        message: "Required terms and conditions present",
      });
      totalScore += 20;
    } else if (hasFinePoints) {
      checks.push({
        category: "Compliance",
        status: "warning" as const,
        message: "Add more fine print details (recommend 3+ terms)",
      });
      totalScore += 15;
    } else {
      checks.push({
        category: "Compliance",
        status: "fail" as const,
        message: "Missing required fine print and terms",
      });
    }

    const finalScore = Math.round((totalScore / maxScore) * 100);
    const failCount = checks.filter((c) => c.status === "fail").length;
    const warningCount = checks.filter((c) => c.status === "warning").length;

    let status: "pass" | "pass_with_warnings" | "fail";
    if (failCount > 0) {
      status = "fail";
    } else if (warningCount > 0) {
      status = "pass_with_warnings";
    } else {
      status = "pass";
    }

    const recommendations = [];
    if (mediaCount < 5) {
      recommendations.push("Add more high-quality images showing the product/service");
    }
    if (deal.content?.description && deal.content.description.length < 150) {
      recommendations.push("Expand description to include more details about the experience");
    }
    if (!hasFinePoints || deal.content.finePoints.length < 3) {
      recommendations.push("Add comprehensive terms and conditions");
    }
    if (!hasOptions || !deal.options.some((opt: any) => opt.discount >= 30)) {
      recommendations.push("Consider offering at least one option with 30%+ discount");
    }

    return {
      status,
      score: finalScore,
      checks,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  };

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

  const handleProceed = () => {
    if (reviewResult) {
      if (reviewResult.status === "fail") {
        onFail(reviewResult);
      } else {
        onSuccess(reviewResult);
      }
    }
    onClose();
  };

  const handleEscalate = () => {
    if (reviewResult) {
      onFail(reviewResult);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={700}
      footer={null}
      centered
      closable={!isReviewing}
      maskClosable={false}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div style={{ textAlign: "center" }}>
          <Title level={3} style={{ marginBottom: token.marginXS }}>
            AI Pre-qualification Review
          </Title>
          <Text type="secondary">
            Analyzing deal quality, compliance, and readiness
          </Text>
        </div>

        {isReviewing && (
          <Card>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div style={{ textAlign: "center" }}>
                <Loader2
                  size={48}
                  style={{
                    color: token.colorPrimary,
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
              <Progress
                percent={progress}
                strokeColor={token.colorPrimary}
                status="active"
              />
              <Text type="secondary" style={{ textAlign: "center", display: "block" }}>
                AI is reviewing your deal...
              </Text>
            </Space>
          </Card>
        )}

        {reviewResult && (
          <>
            {/* Overall Score */}
            <Card>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: token.fontWeightStrong,
                    color: getOverallStatusColor(reviewResult.status),
                    lineHeight: 1,
                  }}
                >
                  {reviewResult.score}
                </div>
                <Text type="secondary">Overall Score</Text>
                <div style={{ marginTop: token.marginSM }}>
                  <Tag
                    color={
                      reviewResult.status === "pass"
                        ? "success"
                        : reviewResult.status === "pass_with_warnings"
                        ? "warning"
                        : "error"
                    }
                    style={{ fontSize: token.fontSize }}
                  >
                    {reviewResult.status === "pass"
                      ? "✓ Approved"
                      : reviewResult.status === "pass_with_warnings"
                      ? "⚠ Approved with Warnings"
                      : "✗ Needs Improvement"}
                  </Tag>
                </div>
              </div>
            </Card>

            {/* Detailed Checks */}
            <Card title="Review Checklist" size="small">
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                {reviewResult.checks.map((check, index) => (
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
            {reviewResult.recommendations.length > 0 && (
              <Alert
                type="info"
                message="AI Recommendations"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: token.paddingLG }}>
                    {reviewResult.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                }
              />
            )}

            {/* Actions */}
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              {reviewResult.status === "fail" ? (
                <>
                  <Button onClick={onClose}>Fix Issues & Resubmit</Button>
                  <Button type="primary" danger onClick={handleEscalate}>
                    Escalate to Market Manager
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={onClose}>Cancel</Button>
                  <Button type="primary" onClick={handleProceed}>
                    {reviewResult.status === "pass"
                      ? "Proceed to Pre-qualification"
                      : "Proceed with Warnings"}
                  </Button>
                </>
              )}
            </Space>
          </>
        )}
      </Space>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Modal>
  );
};

export default AIPrequalificationModal;


