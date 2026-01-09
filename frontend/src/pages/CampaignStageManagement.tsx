import React from "react";
import { Typography, Space, theme, App } from "antd";
import { Workflow } from "lucide-react";
import FlowDiagramView from "../components/CampaignStageManagement/FlowDiagramView";

const { Title, Text } = Typography;
const { useToken } = theme;

const CampaignStageManagement: React.FC = () => {
  const { token } = useToken();

  return (
    <App>
      {/* Page Header */}
      <div style={{ padding: `${token.paddingMD}px ${token.paddingLG}px` }}>
        <Space align="center" size="middle">
          <div
            style={{
              width: token.controlHeightLG,
              height: token.controlHeightLG,
              borderRadius: token.borderRadiusLG,
              background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorWhite,
              boxShadow: `0 ${token.paddingXS}px ${token.paddingLG}px ${token.colorPrimary}40`,
            }}
          >
            <Workflow size={24} />
          </div>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Campaign Stage Management
            </Title>
            <Text type="secondary">
              Manage campaign workflow with Draft, Won, and Lost phases
            </Text>
          </div>
        </Space>
      </div>

      {/* Flow Diagram - Full width with border only */}
      <div
        style={{
          borderTop: `1px solid ${token.colorBorder}`,
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        <FlowDiagramView />
      </div>
    </App>
  );
};

export default CampaignStageManagement;
