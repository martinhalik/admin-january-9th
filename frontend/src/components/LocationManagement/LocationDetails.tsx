import React from "react";
import { Card, Row, Col, Typography, Tag, Badge } from "antd";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Users,
  Car,
  Accessibility,
  Building,
  CheckCircle,
} from "lucide-react";
import { Location } from "../../data/locationData";

const { Text, Paragraph } = Typography;

interface LocationDetailsProps {
  onCancel: () => void;
  location: Location | null;
}

const LocationDetails: React.FC<LocationDetailsProps> = ({ location }) => {
  if (!location) return null;

  const formatHours = (hours: any) => {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayLabels = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    return days.map((day, index) => {
      const dayHours = hours[day];
      return (
        <div
          key={day}
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span style={{ width: 80, fontSize: 12 }}>{dayLabels[index]}</span>
          <span style={{ fontSize: 12 }}>
            {dayHours.isClosed ? (
              <Text type="secondary">Closed</Text>
            ) : (
              `${dayHours.open} - ${dayHours.close}`
            )}
          </span>
        </div>
      );
    });
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={16}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <MapPin size={16} />
              <Text strong>Address</Text>
            </div>
            <div>
              <Text>{location.address.street}</Text>
              <br />
              <Text type="secondary">
                {location.address.city}, {location.address.state}{" "}
                {location.address.zipCode}
              </Text>
              <br />
              <Text type="secondary">{location.address.country}</Text>
            </div>
          </Card>

          <Card size="small" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Clock size={16} />
              <Text strong>Business Hours</Text>
            </div>
            <div style={{ fontSize: 12 }}>{formatHours(location.hours)}</div>
          </Card>

          {location.description && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Building size={16} />
                <Text strong>Description</Text>
              </div>
              <Paragraph style={{ margin: 0, fontSize: 12 }}>
                {location.description}
              </Paragraph>
            </Card>
          )}

          {location.amenities && location.amenities.length > 0 && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <CheckCircle size={16} />
                <Text strong>Amenities</Text>
              </div>
              <div>
                {location.amenities.map((amenity, index) => (
                  <Tag key={index} style={{ marginBottom: 4 }}>
                    {amenity}
                  </Tag>
                ))}
              </div>
            </Card>
          )}

          {location.accessibility && location.accessibility.length > 0 && (
            <Card size="small">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Accessibility size={16} />
                <Text strong>Accessibility Features</Text>
              </div>
              <div>
                {location.accessibility.map((feature, index) => (
                  <Tag key={index} color="green" style={{ marginBottom: 4 }}>
                    {feature}
                  </Tag>
                ))}
              </div>
            </Card>
          )}
        </Col>

        <Col span={8}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <CheckCircle size={16} />
              <Text strong>Status</Text>
            </div>
            <div>
              <Badge
                status={location.isActive ? "success" : "default"}
                text={location.isActive ? "Active" : "Inactive"}
              />
            </div>
          </Card>

          {location.phone && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Phone size={16} />
                <Text strong>Phone</Text>
              </div>
              <Text style={{ fontSize: 12 }}>{location.phone}</Text>
            </Card>
          )}

          {location.email && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Mail size={16} />
                <Text strong>Email</Text>
              </div>
              <Text style={{ fontSize: 12 }}>{location.email}</Text>
            </Card>
          )}

          {location.website && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Globe size={16} />
                <Text strong>Website</Text>
              </div>
              <Text style={{ fontSize: 12 }}>{location.website}</Text>
            </Card>
          )}

          {location.capacity && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Users size={16} />
                <Text strong>Capacity</Text>
              </div>
              <Text style={{ fontSize: 12 }}>{location.capacity} people</Text>
            </Card>
          )}

          {location.parkingInfo && (
            <Card size="small">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Car size={16} />
                <Text strong>Parking</Text>
              </div>
              <Text style={{ fontSize: 12 }}>{location.parkingInfo}</Text>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default LocationDetails;
