import React from "react";
import { Card, Segmented, Row, Col, Typography, theme, Button } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

const { Text } = Typography;
const { useToken } = theme;

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface StatsData {
  grossProfit: number;
  orders: number;
  gpPerVisit: number;
  conversionRate: number;
  visits: number;
  refunds: number;
  change: string;
}

export interface DealStatsCardProps {
  timePeriod: "30days" | "7days" | "total";
  setTimePeriod: (period: "30days" | "7days" | "total") => void;
  selectedMetric: string;
  setSelectedMetric: (metric: string) => void;
  getStatsForPeriod: (period: "30days" | "7days" | "total") => StatsData;
  getChartData: (period: "30days" | "7days" | "total", metric: string) => ChartDataPoint[];
  windowWidth: number;
}

const DealStatsCard: React.FC<DealStatsCardProps> = ({
  timePeriod,
  setTimePeriod,
  selectedMetric,
  setSelectedMetric,
  getStatsForPeriod,
  getChartData,
  windowWidth,
}) => {
  const { token } = useToken();

  return (
    <Card style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Segmented
          value={timePeriod}
          onChange={(value) => setTimePeriod(value as any)}
          options={[
            { label: "30 days", value: "30days" },
            { label: "7 days", value: "7days" },
            { label: "Total", value: "total" },
          ]}
        />
        <Button type="link" style={{ color: token.colorSuccessText }}>
          See All Stats
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={6} lg={4}>
          <div
            onClick={() => setSelectedMetric("grossProfit")}
            style={{
              cursor: "pointer",
              padding: "8px",
              borderRadius: 4,
              background:
                selectedMetric === "grossProfit"
                  ? token.colorFillSecondary
                  : "transparent",
              transition: "background 0.2s",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Gross Profit
            </Text>
            <div
              style={{
                fontSize: windowWidth < 768 ? 20 : 28,
                fontWeight: 600,
                marginTop: 4,
                marginBottom: 4,
              }}
            >
              ${getStatsForPeriod(timePeriod).grossProfit.toLocaleString()}
            </div>
            <Text style={{ fontSize: 11, color: token.colorSuccessText }}>
              {getStatsForPeriod(timePeriod).change}
            </Text>
          </div>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <div
            onClick={() => setSelectedMetric("orders")}
            style={{
              cursor: "pointer",
              padding: "8px",
              borderRadius: 4,
              background:
                selectedMetric === "orders"
                  ? token.colorFillSecondary
                  : "transparent",
              transition: "background 0.2s",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Orders
            </Text>
            <div
              style={{
                fontSize: windowWidth < 768 ? 20 : 28,
                fontWeight: 600,
                marginTop: 4,
                marginBottom: 4,
              }}
            >
              {getStatsForPeriod(timePeriod).orders}
            </div>
            <Text style={{ fontSize: 11, color: token.colorSuccessText }}>
              {getStatsForPeriod(timePeriod).change}
            </Text>
          </div>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <div
            onClick={() => setSelectedMetric("gpPerVisit")}
            style={{
              cursor: "pointer",
              padding: "8px",
              borderRadius: 4,
              background:
                selectedMetric === "gpPerVisit"
                  ? token.colorFillSecondary
                  : "transparent",
              transition: "background 0.2s",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              GP per visit
            </Text>
            <div
              style={{
                fontSize: windowWidth < 768 ? 20 : 28,
                fontWeight: 600,
                marginTop: 4,
                marginBottom: 4,
              }}
            >
              ${getStatsForPeriod(timePeriod).gpPerVisit.toFixed(2)}
            </div>
            <Text style={{ fontSize: 11, color: token.colorSuccessText }}>
              {getStatsForPeriod(timePeriod).change}
            </Text>
          </div>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <div
            onClick={() => setSelectedMetric("conversionRate")}
            style={{
              cursor: "pointer",
              padding: "8px",
              borderRadius: 4,
              background:
                selectedMetric === "conversionRate"
                  ? token.colorFillSecondary
                  : "transparent",
              transition: "background 0.2s",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Conversion rate
            </Text>
            <div
              style={{
                fontSize: windowWidth < 768 ? 20 : 28,
                fontWeight: 600,
                marginTop: 4,
                marginBottom: 4,
              }}
            >
              {getStatsForPeriod(timePeriod).conversionRate}%
            </div>
            <Text style={{ fontSize: 11, color: token.colorSuccessText }}>
              {getStatsForPeriod(timePeriod).change}
            </Text>
          </div>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <div
            onClick={() => setSelectedMetric("visits")}
            style={{
              cursor: "pointer",
              padding: "8px",
              borderRadius: 4,
              background:
                selectedMetric === "visits"
                  ? token.colorFillSecondary
                  : "transparent",
              transition: "background 0.2s",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Visits
            </Text>
            <div
              style={{
                fontSize: windowWidth < 768 ? 20 : 28,
                fontWeight: 600,
                marginTop: 4,
                marginBottom: 4,
              }}
            >
              {(getStatsForPeriod(timePeriod).visits / 1000000).toFixed(1)}M
            </div>
            <Text style={{ fontSize: 11, color: token.colorSuccessText }}>
              {getStatsForPeriod(timePeriod).change}
            </Text>
          </div>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <div
            onClick={() => setSelectedMetric("refunds")}
            style={{
              cursor: "pointer",
              padding: "8px",
              borderRadius: 4,
              background:
                selectedMetric === "refunds"
                  ? token.colorFillSecondary
                  : "transparent",
              transition: "background 0.2s",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Refunds
            </Text>
            <div
              style={{
                fontSize: windowWidth < 768 ? 20 : 28,
                fontWeight: 600,
                marginTop: 4,
                marginBottom: 4,
              }}
            >
              {getStatsForPeriod(timePeriod).refunds}
            </div>
            <Text style={{ fontSize: 11, color: token.colorSuccessText }}>
              {getStatsForPeriod(timePeriod).change}
            </Text>
          </div>
        </Col>
      </Row>

      {/* Chart inside the same card */}
      <div style={{ marginTop: 24 }}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={getChartData(timePeriod, selectedMetric)}>
            <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorder} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: token.colorTextSecondary }}
              stroke={token.colorBorder}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis
              tick={{ fontSize: 10, fill: token.colorTextSecondary }}
              stroke={token.colorBorder}
            />
            <RechartsTooltip
              contentStyle={{
                background: token.colorBgElevated,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 6,
                color: token.colorText,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#007C1F"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default DealStatsCard;

