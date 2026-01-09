import React from "react";
import { Card, Button, Row, Col, Image, Tag, Typography, theme } from "antd";
import { SimilarDeal } from "../../data/similarDeals";

const { Text } = Typography;
const { useToken } = theme;

export interface SimilarDealsCardProps {
  currentDealId: string;
  getSimilarDeals: (dealId: string) => SimilarDeal[];
  onDealClick: (dealId: string, accountId?: string) => void;
  onViewAll: () => void;
  accountId?: string;
}

const SimilarDealsCard: React.FC<SimilarDealsCardProps> = ({
  currentDealId,
  getSimilarDeals,
  onDealClick,
  onViewAll,
  accountId,
}) => {
  const { token } = useToken();
  const similarDeals = getSimilarDeals(currentDealId);

  return (
    <Card
      title={`Similar Deals (${similarDeals.length})`}
      style={{ marginBottom: 24 }}
      extra={
        similarDeals.length > 0 && (
          <Button type="link" onClick={onViewAll} style={{ padding: 0 }}>
            View All
          </Button>
        )
      }
    >
      {similarDeals.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: token.colorTextSecondary,
          }}
        >
          <Text type="secondary" style={{ fontSize: 14 }}>
            No similar deals found for this offer.
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Check back later or explore other deals in our catalog.
          </Text>
        </div>
      ) : (
        <Row gutter={16}>
          {similarDeals.map((similarDeal) => {
            const featuredImage =
              similarDeal.content.media.find((media) => media.isFeatured) ||
              similarDeal.content.media[0];
            const imageUrl =
              featuredImage?.url || "/images/ai/chef-cooking.jpg";

            return (
              <Col xs={24} sm={12} lg={8} key={similarDeal.id}>
                <Card
                  size="small"
                  style={{ marginBottom: 8, cursor: "pointer" }}
                  hoverable
                  onClick={() => {
                    onDealClick(similarDeal.id, accountId);
                    // Scroll to top immediately for better UX
                    window.scrollTo({ top: 0, behavior: "smooth" });
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
                        {similarDeal.title.length > 80
                          ? `${similarDeal.title.substring(0, 80)}...`
                          : similarDeal.title}
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {similarDeal.location}
                        </Text>
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <Tag
                          color={
                            similarDeal.quality === "Ace"
                              ? "green"
                              : similarDeal.quality === "Good"
                              ? "blue"
                              : "orange"
                          }
                          style={{ fontSize: 10, margin: 0 }}
                        >
                          {similarDeal.quality}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          ${similarDeal.stats.revenue.toLocaleString()} revenue
                        </Text>
                      </div>
                      {similarDeal.options.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 10 }}>
                            From ${similarDeal.options[0].grouponPrice} ($
                            {similarDeal.options[0].discount}% off)
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Card>
  );
};

export default SimilarDealsCard;

