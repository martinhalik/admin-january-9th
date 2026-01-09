import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { theme } from "antd";
import AIGenerationFlow from "../components/AIGenerationFlow";
import DynamicBreadcrumbs from "../components/Breadcrumbs";
import { getMerchantAccount } from "../data/accountOwnerAssignments";

const { useToken } = theme;

const AIDealGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useToken();
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const accountId = searchParams.get("accountId");
  const preSelectedAccount = accountId 
    ? getMerchantAccount(accountId)
    : null;

  useEffect(() => {
    // If no account ID, redirect back to deals
    if (!accountId) {
      navigate("/deals");
    }
  }, [accountId, navigate]);

  return (
    <>
      {/* Breadcrumb Header - Fixed, Full Width */}
      <div
        style={{
          position: "fixed",
          top: 64,
          left: 0,
          right: 0,
          zIndex: 99,
          background: token.colorBgContainer,
          padding: `${token.paddingXXS}px ${token.paddingLG}px`,
          display: "flex",
          alignItems: "center",
          gap: token.marginSM,
          flexWrap: "wrap",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        }}
      >
        <DynamicBreadcrumbs />
      </div>

      {/* Main Content */}
      <div
        style={{
          minHeight: "calc(100vh - 102px)",
          marginTop: 38,
          padding: 24,
          paddingRight: sidebarWidth > 0 ? 0 : 24,
          background: '#fafafa',
          transition: "padding-right 0.3s ease",
        }}
      >
        <AIGenerationFlow
          preSelectedAccount={preSelectedAccount}
          onCancel={() => navigate("/deals")}
          onSidebarWidthChange={setSidebarWidth}
        />
      </div>
    </>
  );
};

export default AIDealGenerator;
