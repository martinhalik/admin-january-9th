import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  theme,
  Empty,
  Badge,
} from "antd";
import { Plus, Store, Phone, Clock, Settings } from "lucide-react";
import {
  Location,
  getLocationsByAccount,
} from "../data/locationData";
import { formatLocationHours, formatLocationAddress } from "../data/locationUtils";
import LocationModal from "./LocationModal";

const { Text, Title } = Typography;
const { useToken } = theme;

interface DealLocationSelectorProps {
  accountId: string;
  selectedLocationIds?: string[];
  onLocationChange?: (locationIds: string[]) => void;
  mode?: "single" | "multiple";
}

const DealLocationSelector: React.FC<DealLocationSelectorProps> = ({
  accountId,
  selectedLocationIds = [],
  onLocationChange,
  mode = "multiple",
}) => {
  const { token } = useToken();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadLocations = () => {
    setLoading(true);
    try {
      const data = getLocationsByAccount(accountId);
      setLocations(data);
      
      // Automatically assign all locations if not already set
      if (data.length > 0 && selectedLocationIds.length === 0) {
        const allLocationIds = data.map((loc) => loc.id);
        onLocationChange?.(allLocationIds);
      }
    } catch (error) {
      // Failed to load locations - silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      loadLocations();
    }
  }, [accountId]);

  const selectedLocations = locations.filter((loc) =>
    selectedLocationIds.includes(loc.id)
  );

  const handleOpenModal = () => {
    setIsLocationModalOpen(true);
  };

  const handleLocationModalSuccess = (newSelectedIds: string[]) => {
    onLocationChange?.(newSelectedIds);
    setIsLocationModalOpen(false);
    // Reload locations in case new ones were added
    loadLocations();
  };

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Header with Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
              Deal Locations
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {selectedLocations.length === 0
                ? "No locations selected"
                : `${selectedLocations.length} ${
                    selectedLocations.length === 1 ? "location" : "locations"
                  } selected`}
            </Text>
          </div>
          <Button
            type="link"
            icon={selectedLocations.length === 0 ? <Plus size={14} /> : <Settings size={14} />}
            onClick={handleOpenModal}
            loading={loading}
            style={{ padding: 0, height: "auto" }}
          >
            {selectedLocations.length === 0 ? "Add Locations" : "Manage Locations"}
          </Button>
        </div>

        {/* Selected Locations Display */}
        {selectedLocations.length === 0 ? (
          <Card
            style={{
              background: token.colorBgLayout,
              border: `1px dashed ${token.colorBorder}`,
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    No locations selected
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Click "Add Locations" to select where this deal is valid
                  </Text>
                </Space>
              }
            />
          </Card>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            {selectedLocations.map((location) => (
              <Card
                key={location.id}
                size="small"
                style={{
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorBorder}`,
                }}
                styles={{
                  body: {
                    padding: token.paddingSM,
                  },
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: token.marginSM,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: token.borderRadius,
                      background: token.colorBgTextHover,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: token.colorTextSecondary,
                      flexShrink: 0,
                    }}
                  >
                    <Store size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <Text strong style={{ fontSize: 14 }}>
                        {location.name}
                      </Text>
                      {location.isDraft && (
                        <Badge
                          count="Draft"
                          style={{
                            background: token.colorWarningBg,
                            color: token.colorWarningText,
                            border: `1px solid ${token.colorWarningBorder}`,
                            fontSize: 10,
                            height: "auto",
                            lineHeight: "1",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 500,
                            boxShadow: "none",
                          }}
                        />
                      )}
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        {formatLocationAddress(location.address)}
                      </Text>
                    </div>
                    {(location.phone || location.hours) && (
                      <Space size="small" wrap style={{ fontSize: 11 }}>
                        {location.phone && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Phone size={11} />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {location.phone}
                            </Text>
                          </div>
                        )}
                        {location.hours && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <Clock size={11} style={{ flexShrink: 0 }} />
                            <Text 
                              type="secondary" 
                              style={{ 
                                fontSize: 11,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatLocationHours(location.hours)}
                            </Text>
                          </div>
                        )}
                      </Space>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </Space>

      {/* Location Modal */}
      <LocationModal
        open={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        accountId={accountId}
        selectedLocationIds={selectedLocationIds}
        onLocationChange={handleLocationModalSuccess}
        mode={mode}
      />
    </>
  );
};

export default DealLocationSelector;

