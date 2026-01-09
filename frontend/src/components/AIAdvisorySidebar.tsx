import React from "react";
import {
  Card,
  Typography,
  Space,
  theme,
  Collapse,
  Divider,
} from "antd";
import {
  ChevronRight,
} from "lucide-react";
import { MerchantAccount } from "../data/merchantAccounts";
import SimilarDealsMap from "./SimilarDealsMap";
import { deals } from "../data/mockDeals";
import MerchantInfoCard from "./MerchantInfoCard";
import MerchantSnapshotCard from "./MerchantSnapshotCard";
import { mockLocations } from "../data/locationData";

const { Text } = Typography;
const { useToken } = theme;

interface AIAdvisorySidebarProps {
  stage: "category" | "subcategory" | "options" | "review" | "draft" | "live";
  merchantAccount?: MerchantAccount | null;
  selectedCategory?: string | null;
  selectedSubcategory?: string | null;
  expectations?: {
    totalProjectedRevenue: number;
    totalProjectedOrders: number;
    marketDemand?: string;
    confidence?: number;
    seasonality?: string;
  } | null;
  // For showing similar deals on map (during draft stage)
  currentDealId?: string;
  showSimilarDealsMap?: boolean;
}

const AIAdvisorySidebar: React.FC<AIAdvisorySidebarProps> = ({
  stage,
  merchantAccount,
  selectedCategory,
  selectedSubcategory,
  expectations = null,
  currentDealId,
  showSimilarDealsMap = false,
}) => {
  const { token } = useToken();
  
  // Get location data for the merchant (if available)
  const merchantLocations = merchantAccount ? (mockLocations[merchantAccount.id] || []) : [];
  const primaryLocation = merchantLocations && merchantLocations.length > 0 ? merchantLocations[0] : undefined;

  return (
    <div style={{ width: "100%" }}>
      {/* Merchant Snapshot */}
      {merchantAccount && (
        <Collapse
          defaultActiveKey={['merchant-info']}
          ghost
          expandIconPosition="start"
          bordered={false}
          className="sidebar-collapse-no-radius"
          style={{ 
            background: 'transparent',
            borderBottom: `1px solid ${token.colorBorder}`,
          }}
          expandIcon={({ isActive }) => (
            <ChevronRight 
              size={16} 
              style={{ 
                transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }} 
            />
          )}
          items={[
            {
              key: 'merchant-info',
              label: (
                <Text strong style={{ fontSize: 16 }}>Merchant Info</Text>
              ),
              children: (
                <div style={{ padding: '16px 0 20px 0' }}>
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    <MerchantSnapshotCard
                      merchant={merchantAccount}
                      showCard={false}
                      compact={true}
                      showPotentialScore={true}
                    />

                    {/* Opening Hours and Popular Times */}
                    {primaryLocation ? (
                      <>
                        <Divider style={{ margin: "8px 0" }} />
                        <MerchantInfoCard 
                          merchant={merchantAccount}
                          location={primaryLocation}
                          showBusyTimes={true}
                          showCard={false}
                        />
                      </>
                    ) : (
                      <>
                        <Divider style={{ margin: "8px 0" }} />
                        <div style={{ 
                          padding: "12px", 
                          background: token.colorInfoBg,
                          borderRadius: token.borderRadius,
                          border: `1px solid ${token.colorInfoBorder}`,
                        }}>
                          <Text style={{ fontSize: 13 }}>
                            <strong>Contact Details</strong>
                          </Text>
                          <Space direction="vertical" size={4} style={{ width: "100%", marginTop: 8 }}>
                            {merchantAccount.phone && (
                              <Text style={{ fontSize: 12 }}>
                                📞 {merchantAccount.phone}
                              </Text>
                            )}
                            {merchantAccount.contactEmail && (
                              <Text style={{ fontSize: 12 }}>
                                ✉️ {merchantAccount.contactEmail}
                              </Text>
                            )}
                            {merchantAccount.location && (
                              <Text style={{ fontSize: 12 }}>
                                📍 {merchantAccount.location}
                              </Text>
                            )}
                          </Space>
                          <Divider style={{ margin: "8px 0" }} />
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            💡 No location data available yet. Add location details to see opening hours and popular times.
                          </Text>
                        </div>
                      </>
                    )}

                  </Space>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Similar Deals Map - Shows during draft/category selection */}
      {showSimilarDealsMap && merchantAccount && selectedCategory && (
        <SimilarDealsMap
          currentDeal={{
            id: currentDealId || 'new',
            category: selectedCategory,
            subcategory: selectedSubcategory || undefined,
            accountId: merchantAccount.id,
            title: `New ${selectedCategory} Deal`,
          }}
          allDeals={deals}
          defaultRadius={10}
        />
      )}

      {/* Performance Stats (for live stage) */}
      {stage === "live" && (
        <div style={{
          borderBottom: `1px solid ${token.colorBorder}`,
          padding: '0 16px 16px 16px',
        }}>
          <Card
            title={<span style={{ fontSize: 14 }}>Today's Performance</span>}
            size="small"
            style={{
              borderRadius: 0,
            }}
          >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                Views
              </Text>
              <Text strong>
                {Math.floor(Math.random() * 2000 + 1000).toLocaleString()}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                Orders
              </Text>
              <Text strong>{Math.floor(Math.random() * 100 + 30)}</Text>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                Revenue
              </Text>
              <Text strong style={{ color: token.colorSuccess }}>
                ${(Math.floor(Math.random() * 3000 + 1000)).toLocaleString()}
              </Text>
            </div>
          </Space>
        </Card>
        </div>
      )}

    </div>
  );
};

export default AIAdvisorySidebar;
