import React from "react";
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  Tag,
  Typography,
  theme,
} from "antd";
import { ThumbsUp, ThumbsDown } from "lucide-react";

const { Title, Paragraph } = Typography;
const { useToken } = theme;

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  details: string;
  priority: string;
  category: string;
}

export interface DealRecommendationsCardProps {
  recommendations: Recommendation[];
  getPriorityColor: (priority: string) => string;
  getCategoryColor: (category: string) => string;
  onFeedback?: () => void;
}

const DealRecommendationsCard: React.FC<DealRecommendationsCardProps> = ({
  recommendations,
  getPriorityColor,
  getCategoryColor,
  onFeedback,
}) => {
  const { token } = useToken();
  
  return (
    <Card
      title="Recommendations"
      extra={
        <Button
          type="link"
          style={{ color: token.colorSuccess }}
          onClick={onFeedback}
        >
          Give Feedback
        </Button>
      }
      style={{ marginBottom: 24 }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {recommendations.map((rec) => (
          <Card
            key={rec.id}
            size="small"
            style={{
              borderLeft: `4px solid ${getPriorityColor(rec.priority)}`,
            }}
          >
            <Row gutter={16}>
              <Col span={2}>
                <Tag
                  color={getPriorityColor(rec.priority)}
                  style={{ marginRight: 0 }}
                >
                  {rec.priority}
                </Tag>
                <Tag
                  color={getCategoryColor(rec.category)}
                  style={{ marginTop: 8 }}
                >
                  {rec.category}
                </Tag>
              </Col>
              <Col span={20}>
                <Title level={5} style={{ marginBottom: 8, fontSize: 14 }}>
                  {rec.title}
                </Title>
                <Paragraph style={{ marginBottom: 8, fontSize: 13 }}>
                  {rec.description}
                </Paragraph>
                <Paragraph
                  type="secondary"
                  style={{ fontSize: 12, marginBottom: 16 }}
                >
                  {rec.details}
                </Paragraph>
                <Space>
                  <Button size="small" icon={<ThumbsUp size={12} />} />
                  <Button size="small" icon={<ThumbsDown size={12} />} />
                  <Button size="small">Mark as resolved</Button>
                </Space>
              </Col>
            </Row>
          </Card>
        ))}
      </Space>
    </Card>
  );
};

export default DealRecommendationsCard;

