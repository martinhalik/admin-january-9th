import React from "react";
import { Card, Tag, Space, Typography, Divider } from "antd";
import { useRoleView } from "../contexts/RoleViewContext";
import { Shield, Users, FileText } from "lucide-react";

const { Title, Text } = Typography;

/**
 * Example component demonstrating role-based UI changes
 * This is a reference implementation showing how to use the useRoleView hook
 */
const RoleViewExample: React.FC = () => {
  const { currentRole, getRoleInfo, isAdmin } = useRoleView();
  const roleInfo = getRoleInfo(currentRole);

  // Example: Different features available per role
  const getAvailableFeatures = () => {
    switch (currentRole) {
      case "admin":
        return [
          "Create/Edit/Delete Deals",
          "Manage Users",
          "View All Reports",
          "System Settings",
          "API Access",
        ];
      case "bd":
        return ["View Deals", "Create Leads", "Basic Reports"];
      case "dsm":
        return [
          "View/Edit Deals",
          "Manage BD Team",
          "Sales Reports",
          "Approve Deals",
        ];
      case "mm":
        return [
          "View All Deals",
          "Market Analytics",
          "Team Performance",
          "Strategic Planning",
        ];
      case "content-ops-staff":
        return ["Edit Deal Content", "Upload Media", "Basic Analytics"];
      case "content-ops-manager":
        return [
          "Manage Content Team",
          "Approve Content",
          "Content Analytics",
          "Template Management",
        ];
      default:
        return [];
    }
  };

  // Example: Role-specific styling
  const getRoleColor = () => {
    if (isAdmin) return "purple";
    if (["bd", "dsm", "mm"].includes(currentRole)) return "blue";
    if (["content-ops-staff", "content-ops-manager"].includes(currentRole))
      return "green";
    return "default";
  };

  // Example: Role-specific icon
  const getRoleIcon = () => {
    if (isAdmin) return <Shield size={20} />;
    if (["bd", "dsm", "mm"].includes(currentRole)) return <Users size={20} />;
    return <FileText size={20} />;
  };

  return (
    <Card
      style={{ maxWidth: 600, margin: "0 auto" }}
      title={
        <Space>
          {getRoleIcon()}
          <span>Current Role View</span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Current Role Info */}
        <div>
          <Text strong>You are viewing as:</Text>
          <div style={{ marginTop: 8 }}>
            <Tag color={getRoleColor()} style={{ fontSize: 14, padding: "4px 12px" }}>
              {roleInfo?.name}
            </Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
            Category: {roleInfo?.category}
          </Text>
        </div>

        <Divider style={{ margin: "8px 0" }} />

        {/* Available Features */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            Available Features:
          </Title>
          <Space direction="vertical" size="small">
            {getAvailableFeatures().map((feature) => (
              <div key={feature}>
                <Text>• {feature}</Text>
              </div>
            ))}
          </Space>
        </div>

        <Divider style={{ margin: "8px 0" }} />

        {/* Role-specific Message */}
        <div>
          <Title level={5} style={{ marginBottom: 8 }}>
            Role-specific Message:
          </Title>
          {isAdmin && (
            <Text type="success">
              ✓ You have full administrative access to all features.
            </Text>
          )}
          {currentRole === "bd" && (
            <Text>
              As a BD Representative, focus on creating new leads and building
              relationships with potential merchants.
            </Text>
          )}
          {currentRole === "dsm" && (
            <Text>
              As a Direct Sales Manager, you can approve deals and manage your
              BD team's performance.
            </Text>
          )}
          {currentRole === "mm" && (
            <Text>
              As a Market Manager, you have strategic oversight of your entire
              market's performance.
            </Text>
          )}
          {currentRole === "content-ops-staff" && (
            <Text>
              As Content Operations Staff, you can create and edit deal content
              including descriptions and media.
            </Text>
          )}
          {currentRole === "content-ops-manager" && (
            <Text>
              As Content Operations Manager, you can approve content changes
              and manage your team's workflow.
            </Text>
          )}
        </div>

        <Divider style={{ margin: "8px 0" }} />

        {/* Usage Instructions */}
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 <strong>Tip:</strong> Click on your profile avatar in the top-right corner
            and select "View as" to switch between different roles and see how the UI
            changes for each user type.
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default RoleViewExample;

