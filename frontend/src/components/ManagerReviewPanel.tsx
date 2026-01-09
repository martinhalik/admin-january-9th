import React from "react";
import { Card, Button, Space, Typography, theme, Alert, Divider } from "antd";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import AIReviewResults from "./AIReviewResults";
import { AIReviewResult } from "./AIPrequalificationModal";

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

interface ManagerReviewPanelProps {
  dealId: string;
  dealTitle: string;
  aiReviewResult: AIReviewResult;
  escalationReason?: string;
  onApprove: () => void;
  onRequestChanges: () => void;
  onReject: () => void;
}

const ManagerReviewPanel: React.FC<ManagerReviewPanelProps> = ({
  dealId,
  dealTitle,
  aiReviewResult,
  escalationReason,
  onApprove,
  onRequestChanges,
  onReject,
}) => {
  const { token } = useToken();

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={4} style={{ marginBottom: token.marginXS }}>
            Manager Review Required
          </Title>
          <Text type="secondary">
            This deal needs your approval before it can proceed to the Presentation stage
          </Text>
        </div>

        {/* Escalation Notice */}
        {aiReviewResult.status === "fail" && escalationReason && (
          <Alert
            type="warning"
            icon={<AlertTriangle size={20} />}
            message="Deal Escalated by Sales Rep"
            description={
              <div>
                <Paragraph style={{ marginBottom: 0 }}>
                  This deal failed AI pre-qualification but was escalated for manual review.
                </Paragraph>
                {escalationReason && (
                  <Paragraph style={{ marginTop: token.marginXS, marginBottom: 0 }}>
                    <Text strong>Reason: </Text>
                    {escalationReason}
                  </Paragraph>
                )}
              </div>
            }
          />
        )}

        {/* AI Review Results */}
        <div>
          <Title level={5} style={{ marginBottom: token.marginSM }}>
            AI Pre-qualification Results
          </Title>
          <AIReviewResults result={aiReviewResult} />
        </div>

        <Divider />

        {/* Manager Actions */}
        <div>
          <Title level={5} style={{ marginBottom: token.marginSM }}>
            Your Decision
          </Title>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Button
              type="primary"
              icon={<CheckCircle size={16} />}
              onClick={onApprove}
              block
              size="large"
            >
              Approve & Move to Presentation
            </Button>
            <Button
              icon={<AlertTriangle size={16} />}
              onClick={onRequestChanges}
              block
            >
              Request Changes (Send back to Prospecting)
            </Button>
            <Button
              danger
              icon={<XCircle size={16} />}
              onClick={onReject}
              block
            >
              Reject & Mark as Lost
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default ManagerReviewPanel;


