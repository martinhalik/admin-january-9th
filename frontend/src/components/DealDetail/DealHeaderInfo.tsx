import React from "react";
import { Row, Col, Image, Input, Space, Typography, theme } from "antd";
import { Building2, MapPin, Users, Settings, Globe, Edit } from "lucide-react";
import { Deal } from "../../data/mockDeals";
import { MerchantAccount, getMerchantAccount, merchantAccounts } from "../../data/merchantAccounts";
import { useRoleView } from "../../contexts/RoleViewContext";

const { Text } = Typography;
const { useToken } = theme;

export interface DealHeaderInfoProps {
  deal: Deal;
  onDealChange: (updates: Partial<Deal>) => void;
  selectedMerchantAccount: MerchantAccount | null;
  searchParams: URLSearchParams;
  onNavigateToView: (view: string) => void;
}

const DealHeaderInfo: React.FC<DealHeaderInfoProps> = ({
  deal,
  onDealChange,
  selectedMerchantAccount,
  searchParams,
  onNavigateToView,
}) => {
  const { token } = useToken();
  const { currentUser } = useRoleView();
  
  // Helper function to get deal status info - returns label and color
  const getDealStatusInfo = (deal: Deal): { label: string; color: string } | null => {
    const campaignStage = deal.campaignStage;
    const draftSubStage = deal.draftSubStage;
    const wonSubStage = deal.wonSubStage;

    // Draft stage - show substage
    if (campaignStage === "draft") {
      const substageMap: Record<string, { label: string; color: string }> = {
        prospecting: { label: "PROSPECTING", color: token.colorTextSecondary },
        pre_qualification: { label: "PRE-QUALIFICATION", color: token.colorInfo },
        presentation: { label: "PRESENTATION", color: token.colorInfoText },
        appointment: { label: "APPOINTMENT", color: token.colorInfoText },
        proposal: { label: "PROPOSAL", color: token.colorPrimaryText },
        needs_assessment: { label: "NEEDS ASSESSMENT", color: token.colorInfo },
        contract_sent: { label: "CONTRACT SENT", color: token.colorWarning },
        negotiation: { label: "NEGOTIATION", color: token.colorWarning },
        contract_signed: { label: "CONTRACT SIGNED", color: token.colorSuccess },
        approved: { label: "APPROVED", color: token.colorSuccess },
      };
      return substageMap[draftSubStage || ""] || { label: "DRAFT", color: token.colorTextSecondary };
    }

    // Won stage - show substage
    if (campaignStage === "won") {
      if (wonSubStage === "live") {
        return { label: "LIVE", color: token.colorSuccess };
      } else if (wonSubStage === "scheduled") {
        return { label: "SCHEDULED", color: token.colorInfo };
      } else if (wonSubStage === "paused") {
        return { label: "PAUSED", color: token.colorWarning };
      } else if (wonSubStage === "sold_out") {
        return { label: "SOLD OUT", color: token.colorWarning };
      } else if (wonSubStage === "ended") {
        return { label: "ENDED", color: token.colorTextSecondary };
      }
      return { label: "WON", color: token.colorSuccess };
    }

    // Lost stage
    if (campaignStage === "lost") {
      return { label: "LOST", color: token.colorError };
    }

    return null;
  };
  
  // Helper function to get account from various sources
  const getAccount = (): MerchantAccount | null => {
    let account = selectedMerchantAccount;

    // If no selected account, try to find it from URL params
    if (!account) {
      const accountId = searchParams.get("accountId");
      if (accountId) {
        account = getMerchantAccount(accountId) || null;
      }
    }

    // If still no account, try to find it by matching deal location/name
    if (!account && deal) {
      account =
        merchantAccounts.find(
          (acc: any) =>
            deal.location
              ?.toLowerCase()
              .includes(acc.location.toLowerCase().split(",")[0]) ||
            deal.title
              ?.toLowerCase()
              .includes(acc.name.toLowerCase().split(" ")[0])
        ) || null;
    }

    return account;
  };

  const account = getAccount();
  const statusInfo = getDealStatusInfo(deal);

  return (
    <div style={{ marginBottom: 20 }}>
      <Row gutter={16}>
        <Col xs={24} sm={8} md={6} lg={4}>
          <div style={{ position: "relative" }}>
            <Image
              src={
                deal?.content?.media?.find((media: any) => media.isFeatured)
                  ?.url ||
                deal?.content?.media?.[0]?.url ||
                "/images/ai/chef-cooking.jpg"
              }
              alt={deal?.title || "Deal"}
              style={{
                borderRadius: 8,
                objectFit: "cover",
                width: "100%",
                height: "auto",
                aspectRatio: "16/9",
                minHeight: "150px",
              }}
              fallback="/images/ai/chef-cooking.jpg"
              preview={false}
            />
            {statusInfo && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  background: statusInfo.color,
                  color: "#fff",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 6px",
                }}
              >
                {statusInfo.label}
              </div>
            )}
          </div>
        </Col>
        <Col xs={24} sm={16} md={18} lg={20}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <Input
                  value={deal.title}
                  onChange={(e) => {
                    onDealChange({ title: e.target.value });
                  }}
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    marginBottom: 8,
                  }}
                  placeholder="Deal title"
                />
                <Space size="large" wrap>
                  {account && (
                    <Space>
                      <Building2 size={14} color="#666" />
                      <Text
                        type="secondary"
                        style={{
                          cursor: "pointer",
                          transition: "color 0.2s ease",
                        }}
                        onMouseEnter={(e) =>
                          ((e.target as HTMLElement).style.color = "#000")
                        }
                        onMouseLeave={(e) =>
                          ((e.target as HTMLElement).style.color = "#666")
                        }
                        onClick={() =>
                          (window.location.href = `/accounts/${account.id}`)
                        }
                      >
                        {account.name}
                      </Text>
                    </Space>
                  )}
                  <Space>
                    <MapPin size={14} color="#666" />
                    <div
                      style={{
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px dashed #d9d9d9",
                        backgroundColor: "#fafafa",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s ease",
                        maxWidth: "200px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#1890ff";
                        e.currentTarget.style.backgroundColor = "#f0f8ff";
                        e.currentTarget.style.color = "#1890ff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#d9d9d9";
                        e.currentTarget.style.backgroundColor = "#fafafa";
                        e.currentTarget.style.color = "#666";
                      }}
                      onClick={() => {
                        if (account) {
                          // Navigate to account page and scroll to locations section
                          window.location.href = `/accounts/${account.id}#locations`;
                        }
                      }}
                    >
                      <Input
                        value={deal.location}
                        onChange={(e) => {
                          onDealChange({ location: e.target.value });
                        }}
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontFamily: "monospace",
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          minWidth: 120,
                        }}
                        placeholder="Location"
                      />
                      <Edit size={12} color="#999" />
                    </div>
                  </Space>
                  <Space>
                    <Users size={14} color="#666" />
                    <div
                      style={{
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px dashed #d9d9d9",
                        backgroundColor: "#fafafa",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#1890ff";
                        e.currentTarget.style.backgroundColor = "#f0f8ff";
                        e.currentTarget.style.color = "#1890ff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#d9d9d9";
                        e.currentTarget.style.backgroundColor = "#fafafa";
                        e.currentTarget.style.color = "#666";
                      }}
                      onClick={() => onNavigateToView("Summary")}
                    >
                      <Text type="secondary" style={{ margin: 0, fontSize: 12 }}>
                        {deal.roles.accountOwner || currentUser.name}
                      </Text>
                      <Edit size={12} color="#999" />
                    </div>
                  </Space>
                  <Space>
                    <Settings size={14} color="#666" />
                    <div
                      style={{
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px dashed #d9d9d9",
                        backgroundColor: "#fafafa",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#1890ff";
                        e.currentTarget.style.backgroundColor = "#f0f8ff";
                        e.currentTarget.style.color = "#1890ff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#d9d9d9";
                        e.currentTarget.style.backgroundColor = "#fafafa";
                        e.currentTarget.style.color = "#666";
                      }}
                      onClick={() => onNavigateToView("Settings")}
                    >
                      <Text type="secondary" style={{ margin: 0, fontSize: 12 }}>
                        Redemption Method
                      </Text>
                      <Edit size={12} color="#999" />
                    </div>
                  </Space>
                  <Space>
                    <Globe size={14} color="#666" />
                    <div
                      style={{
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px dashed #d9d9d9",
                        backgroundColor: "#fafafa",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#1890ff";
                        e.currentTarget.style.backgroundColor = "#f0f8ff";
                        e.currentTarget.style.color = "#1890ff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#d9d9d9";
                        e.currentTarget.style.backgroundColor = "#fafafa";
                        e.currentTarget.style.color = "#666";
                      }}
                      onClick={() => onNavigateToView("Summary")}
                    >
                      <Input
                        value={deal.division}
                        onChange={(e) => {
                          onDealChange({ division: e.target.value });
                        }}
                        style={{
                          margin: 0,
                          fontSize: 12,
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          minWidth: 100,
                        }}
                        placeholder="Division"
                      />
                      <Edit size={12} color="#999" />
                    </div>
                  </Space>
                </Space>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default DealHeaderInfo;

