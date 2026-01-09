import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Carousel,
  Empty,
  Tag,
  Button,
  theme,
  Spin,
} from "antd";
import { RightOutlined } from "@ant-design/icons";
import { useRecentlyViewed } from "../contexts/RecentlyViewedContext";
import { Link } from "react-router-dom";
import { getDealCountsByDivision, DivisionCount } from "../lib/supabase";
import { dealsByCountry, categoryColorMap } from "../data/dealsByCountry";

const { Text, Title, Link: AntLink } = Typography;

// Category color mapping for real data
const realCategoryColors: Record<string, string> = {
  'Food & Drink': 'orange',
  'Health & Beauty': 'magenta',
  'Health & Fitness': 'green',
  'Activities & Entertainment': 'blue',
  'Travel & Lodging': 'purple',
  'Shopping': 'cyan',
  'Automotive': 'gold',
  'Education': 'pink',
  'Other': 'default',
};

const Dashboard = () => {
  const { recentlyViewed } = useRecentlyViewed();
  const { token } = theme.useToken();
  
  // State for real Supabase data
  const [divisionData, setDivisionData] = useState<DivisionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(false);
  
  useEffect(() => {
    async function fetchDealCounts() {
      try {
        const data = await getDealCountsByDivision();
        if (data.length > 0) {
          setDivisionData(data);
          setUseRealData(true);
        }
      } catch (error) {
        console.error('Error fetching deal counts:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDealCounts();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
      }}
    >
      {/* Recently Viewed Deals */}
      <Card
        title={
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            Recently Viewed Deals
          </Title>
        }
        style={{
          marginBottom: token.marginLG,
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadow,
        }}
        extra={
          <Button
            type="text"
            icon={<RightOutlined />}
            style={{ color: token.colorPrimary }}
          />
        }
        styles={{ body: { padding: token.padding } }}
      >
        {recentlyViewed.length > 0 ? (
          <Carousel
            dots={{ className: "custom-dots" }}
            arrows={false}
            slidesToShow={3}
            slidesToScroll={1}
            infinite={false}
            responsive={[
              { breakpoint: 1200, settings: { slidesToShow: 2 } },
              { breakpoint: 768, settings: { slidesToShow: 1 } },
            ]}
          >
            {recentlyViewed.map((deal) => (
              <div key={deal.id} style={{ padding: `0 ${token.paddingXS}px` }}>
                <Link to={`/deals/${deal.id}`}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: token.borderRadiusLG,
                      overflow: "hidden",
                      border: `1px solid ${token.colorBorder}`,
                    }}
                    cover={
                      <div style={{ height: "180px", overflow: "hidden" }}>
                        <img
                          alt={deal.title}
                          src={
                            deal.content.media?.find(
                              (media: any) => media.isFeatured
                            )?.url ||
                            deal.content.media?.[0]?.url ||
                            "/images/stock/breakfast-plate.jpg"
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    }
                    styles={{ body: { padding: token.paddingSM } }}
                  >
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: token.fontSize,
                          lineHeight: token.lineHeight,
                          display: "block",
                          marginBottom: token.marginXS,
                        }}
                      >
                        {deal.title}
                      </Text>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: token.fontSizeSM,
                          lineHeight: token.lineHeight,
                        }}
                      >
                        {deal.location}
                      </Text>
                    </div>
                  </Card>
                </Link>
              </div>
            ))}
          </Carousel>
        ) : (
          <Empty
            description="No recently viewed deals"
            style={{ padding: `${token.paddingXL}px 0` }}
          />
        )}
      </Card>

      {/* My Deals */}
      <Card
        title={
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            My Deals (0)
          </Title>
        }
        style={{
          marginBottom: token.marginLG,
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadow,
        }}
        styles={{ body: { padding: `${token.paddingXL}px ${token.padding}px` } }}
      >
        <Empty
          description={
            <Text type="secondary" style={{ fontSize: token.fontSize }}>
              No deals found
            </Text>
          }
          style={{ padding: 0 }}
        />
      </Card>

      {/* Deals by Division (Real Data) or Country (Fallback) */}
      <Card
        title={
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            {useRealData ? "Deals by Division" : "Deals by Country"}
            {useRealData && (
              <Text type="secondary" style={{ fontWeight: 'normal', fontSize: token.fontSizeSM, marginLeft: 8 }}>
                (Live from Salesforce)
              </Text>
            )}
          </Title>
        }
        style={{
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadow,
        }}
        styles={{ body: { padding: token.padding } }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: token.paddingXL }}>
            <Spin size="large" />
            <div style={{ marginTop: token.margin }}>
              <Text type="secondary">Loading deal counts...</Text>
            </div>
          </div>
        ) : useRealData ? (
          /* Real Supabase Data - Divisions */
          <Row gutter={[token.marginSM, token.marginSM]}>
            {divisionData.map((division, index) => {
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={index}>
                  <Card
                    size="small"
                    style={{
                      height: "100%",
                      borderRadius: token.borderRadius,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <Text strong>
                            <AntLink>{division.division}</AntLink>
                          </Text>
                        </div>
                        <div style={{ fontWeight: "bold" }}>
                          {division.total.toLocaleString()}
                        </div>
                      </div>
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: token.marginXS,
                      }}
                    >
                      {division.categories.slice(0, 5).map((category, catIndex) => {
                        const tagColor = realCategoryColors[category.name] || "default";

                        return (
                          <div
                            key={catIndex}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Tag color={tagColor}>
                              <AntLink style={{ fontSize: token.fontSizeSM }}>
                                {category.name}
                              </AntLink>
                            </Tag>
                            <Text>{category.count.toLocaleString()}</Text>
                          </div>
                        );
                      })}
                      {division.categories.length > 5 && (
                        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                          +{division.categories.length - 5} more categories
                        </Text>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          /* Fallback - Mock Data */
          <Row gutter={[token.marginSM, token.marginSM]}>
            {dealsByCountry.map((country, index) => {
              // Split country name and code
              const match = country.country.match(/^(.+?)\s*(\([^)]+\))$/);
              const countryName = match ? match[1] : country.country;
              const countryCode = match ? match[2] : "";

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={index}>
                  <Card
                    size="small"
                    style={{
                      height: "100%",
                      borderRadius: token.borderRadius,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <Text strong>
                            <AntLink>{countryName}</AntLink>
                          </Text>
                          <Text
                            type="secondary"
                            style={{ marginLeft: token.marginXS }}
                          >
                            {countryCode}
                          </Text>
                        </div>
                        <div style={{ fontWeight: "bold" }}>
                          {country.total.toLocaleString()}
                        </div>
                      </div>
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: token.marginXS,
                      }}
                    >
                      {country.categories.map((category, catIndex) => {
                        const tagColor =
                          categoryColorMap[category.name] || "default";

                        return (
                          <div
                            key={catIndex}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Tag color={tagColor}>
                              <AntLink style={{ fontSize: token.fontSizeSM }}>
                                {category.name}
                              </AntLink>
                            </Tag>
                            <Text>{category.count.toLocaleString()}</Text>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
