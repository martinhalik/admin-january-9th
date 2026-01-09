import React from "react";
import { Card, Button, Row, Col, Image, Tag, Typography, theme, Badge } from "antd";
import { MapPin } from "lucide-react";
import { Deal } from "../../data/mockDeals";

const { Text } = Typography;
const { useToken } = theme;

export interface NearbyCompetitorDealsCardProps {
  currentDeal: Deal;
  competitorDeals: Deal[];
  onViewAll?: () => void;
}

const NearbyCompetitorDealsCard: React.FC<NearbyCompetitorDealsCardProps> = ({
  currentDeal,
  competitorDeals,
  onViewAll,
}) => {
  const { token } = useToken();

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={16} />
          <span>Nearby Competitor Deals ({competitorDeals.length})</span>
        </div>
      }
      style={{ marginBottom: 24 }}
      extra={
        competitorDeals.length > 0 && onViewAll && (
          <Button type="link" onClick={onViewAll} style={{ padding: 0 }}>
            View All
          </Button>
        )
      }
    >
      {competitorDeals.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: token.colorTextSecondary,
          }}
        >
          <Text type="secondary" style={{ fontSize: 14 }}>
            No nearby competitor deals found.
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            We'll notify you when competitors launch deals in this area.
          </Text>
        </div>
      ) : (
        <Row gutter={16}>
          {competitorDeals.map((competitorDeal) => {
            const featuredImage =
              competitorDeal.content.media.find((media) => media.isFeatured) ||
              competitorDeal.content.media[0];
            const imageUrl =
              featuredImage?.url || "/images/ai/chef-cooking.jpg";

            // Calculate distance (mock - in real app would use geolocation)
            const distance = (Math.random() * 3 + 0.5).toFixed(1);

            // Determine if competitor price is better
            const currentBestPrice = currentDeal.options.length > 0 
              ? Math.min(...currentDeal.options.map(o => o.grouponPrice))
              : 0;
            const competitorBestPrice = competitorDeal.options.length > 0
              ? Math.min(...competitorDeal.options.map(o => o.grouponPrice))
              : 0;
            const isPriceLower = competitorBestPrice < currentBestPrice && currentBestPrice > 0;

            return (
              <Col xs={24} sm={12} lg={8} key={competitorDeal.id}>
                <Badge.Ribbon 
                  text={isPriceLower ? "Lower Price" : "Competitor"}
                  color={isPriceLower ? "red" : "orange"}
                >
                  <Card
                    size="small"
                    style={{ 
                      marginBottom: 8, 
                      cursor: "pointer",
                      border: `1px solid ${isPriceLower ? token.colorError : token.colorBorder}`,
                    }}
                    hoverable
                    onClick={() => {
                      // In a real app, this would navigate to competitor analysis
                      window.open(`/deals/${competitorDeal.id}`, '_blank');
                    }}
                  >
                    <div style={{ display: "flex", gap: 12 }}>
                      <Image
                        src={imageUrl}
                        width={80}
                        height={60}
                        style={{
                          borderRadius: 4,
                          objectFit: "cover",
                        }}
                        fallback="/images/ai/chef-cooking.jpg"
                        preview={false}
                      />
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ fontSize: 12, lineHeight: 1.3 }}>
                          {competitorDeal.title.length > 80
                            ? `${competitorDeal.title.substring(0, 80)}...`
                            : competitorDeal.title}
                        </Text>
                        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={10} color={token.colorTextSecondary} />
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {distance} mi • {competitorDeal.location.split(',')[0]}
                          </Text>
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <Tag
                            color={
                              competitorDeal.status === "Live" || competitorDeal.status === "Active"
                                ? "green"
                                : competitorDeal.status === "Draft"
                                ? "orange"
                                : "default"
                            }
                            style={{ fontSize: 10, margin: 0 }}
                          >
                            {competitorDeal.status}
                          </Tag>
                          {competitorDeal.stats && competitorDeal.stats.purchases > 0 && (
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {competitorDeal.stats.purchases} sold
                            </Text>
                          )}
                        </div>
                        {competitorDeal.options.length > 0 && (
                          <div style={{ marginTop: 4 }}>
                            <Text 
                              strong
                              style={{ 
                                fontSize: 11,
                                color: isPriceLower ? token.colorError : token.colorText,
                              }}
                            >
                              From ${competitorDeal.options[0].grouponPrice}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>
                              ({competitorDeal.options[0].discount}% off)
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>
      )}
      {competitorDeals.length > 0 && (
        <div 
          style={{ 
            marginTop: 16, 
            padding: `${token.paddingSM}px ${token.padding}px`,
            background: token.colorInfoBg,
            borderRadius: token.borderRadius,
            border: `1px solid ${token.colorInfoBorder}`,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 <strong>Competitive Insight:</strong> These are similar deals from nearby competitors. 
            Monitor their pricing and performance to stay competitive.
          </Text>
        </div>
      )}
    </Card>
  );
};

export default NearbyCompetitorDealsCard;
















