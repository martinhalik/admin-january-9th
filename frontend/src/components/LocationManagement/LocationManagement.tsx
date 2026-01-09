import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Table,
  Badge,
  message,
  Popconfirm,
  Tooltip,
  theme,
} from "antd";
import {
  Plus,
  MapPin,
  Edit,
  Trash2,
  Upload,
  Download,
  Eye,
  Building,
  Phone,
  Mail,
  Users,
  X,
} from "lucide-react";
import {
  Location,
  getLocationsByAccount,
  deleteLocation,
} from "../../data/locationData";
import LocationForm from "./LocationForm";
import LocationImport from "./LocationImport";
import LocationDetails from "./LocationDetails";

const { Title, Text } = Typography;
const { useToken } = theme;

interface LocationManagementProps {
  accountId: string;
  accountName: string;
  onSidebarContentChange?: (content: React.ReactNode) => void;
}

const LocationManagement: React.FC<LocationManagementProps> = ({
  accountId,
  accountName,
  onSidebarContentChange,
}) => {
  const { token } = useToken();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [sidebarView, setSidebarView] = useState<
    "none" | "form" | "import" | "details"
  >("none");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const data = getLocationsByAccount(accountId);
      setLocations(data);
    } catch (error) {
      message.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleAddLocation = () => {
    setEditingLocation(null);
    setSidebarView("form");
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setSidebarView("form");
  };

  const handleViewLocation = (location: Location) => {
    setSelectedLocation(location);
    setSidebarView("details");
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      const success = deleteLocation(accountId, locationId);
      if (success) {
        message.success("Location deleted successfully");
        loadLocations();
      } else {
        message.error("Failed to delete location");
      }
    } catch (error) {
      message.error("Failed to delete location");
    }
  };

  const handleFormSuccess = useCallback(() => {
    setSidebarView("none");
    setEditingLocation(null);
    loadLocations();
    message.success(
      editingLocation
        ? "Location updated successfully"
        : "Location added successfully"
    );
  }, [editingLocation, loadLocations]);

  const handleImportSuccess = useCallback(() => {
    setSidebarView("none");
    loadLocations();
  }, [loadLocations]);

  const closeSidebar = useCallback(() => {
    setSidebarView("none");
    setEditingLocation(null);
    setSelectedLocation(null);
  }, []);

  // Generate sidebar content and pass to parent when sidebar state changes
  useEffect(() => {
    // Generate sidebar content and pass to parent
    if (sidebarView !== "none") {
      const sidebarContent = (
        <div
          style={{
            width: sidebarView === "form" ? 420 : 480,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 72,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignSelf: "flex-start",
              maxHeight: "calc(100vh - 96px)",
            }}
          >
            <Card
              style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
                display: "flex",
                flexDirection: "column",
                maxHeight: "calc(100vh - 96px)",
                overflow: "hidden",
              }}
              styles={{
                header: {
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  background: token.colorBgContainer,
                  borderBottom: `1px solid ${token.colorBorder}`,
                  marginBottom: 0,
                },
                body: {
                  overflowY: "auto",
                  flex: 1,
                },
              }}
              title={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {sidebarView === "form"
                      ? editingLocation
                        ? "Edit Location"
                        : "Add New Location"
                      : sidebarView === "import"
                      ? "Import Locations"
                      : selectedLocation?.name || "Location Details"}
                  </span>
                  <Button
                    type="text"
                    icon={<X size={16} />}
                    onClick={closeSidebar}
                    style={{ border: "none", boxShadow: "none" }}
                  />
                </div>
              }
            >
              <div style={{ padding: "8px" }}>
                {sidebarView === "form" && (
                  <LocationForm
                    onCancel={closeSidebar}
                    onSuccess={handleFormSuccess}
                    accountId={accountId}
                    location={editingLocation}
                  />
                )}

                {sidebarView === "import" && (
                  <LocationImport
                    onCancel={closeSidebar}
                    onSuccess={handleImportSuccess}
                    accountId={accountId}
                  />
                )}

                {sidebarView === "details" && (
                  <LocationDetails
                    onCancel={closeSidebar}
                    location={selectedLocation}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      );
      onSidebarContentChange?.(sidebarContent);
    } else {
      onSidebarContentChange?.(null);
    }
  }, [
    sidebarView,
    onSidebarContentChange,
    editingLocation,
    selectedLocation,
    accountId,
    token,
    closeSidebar,
    handleFormSuccess,
    handleImportSuccess,
  ]);

  const columns = [
    {
      title: "Location Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Location) => (
        <Space size="small">
          <Text strong style={{ fontSize: 14 }}>
            {name}
          </Text>
          {record.isDraft && (
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
        </Space>
      ),
    },
    {
      title: "Address",
      key: "address",
      render: (record: Location) => (
        <div>
          <Text style={{ fontSize: 12 }}>{record.address.street}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.address.city}, {record.address.state}{" "}
            {record.address.zipCode}
          </Text>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (record: Location) => (
        <div>
          {record.phone && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 2,
              }}
            >
              <Phone size={12} />
              <Text style={{ fontSize: 11 }}>{record.phone}</Text>
            </div>
          )}
          {record.email && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Mail size={12} />
              <Text style={{ fontSize: 11 }}>{record.email}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      render: (isActive: boolean) => (
        <Badge
          status={isActive ? "success" : "default"}
          text={isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity: number) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Users size={12} />
          <Text style={{ fontSize: 12 }}>{capacity || "N/A"}</Text>
        </div>
      ),
    },
    {
      title: "Amenities",
      dataIndex: "amenities",
      key: "amenities",
      render: (amenities: string[]) => (
        <div>
          {amenities && amenities.length > 0 ? (
            <Tooltip title={amenities.join(", ")}>
              <Text style={{ fontSize: 11 }}>
                {amenities.slice(0, 2).join(", ")}
                {amenities.length > 2 && ` +${amenities.length - 2} more`}
              </Text>
            </Tooltip>
          ) : (
            <Text type="secondary" style={{ fontSize: 11 }}>
              None
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Location) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<Eye size={14} />}
              onClick={() => handleViewLocation(record)}
            />
          </Tooltip>
          <Tooltip title="Edit Location">
            <Button
              type="text"
              size="small"
              icon={<Edit size={14} />}
              onClick={() => handleEditLocation(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Location"
            description="Are you sure you want to delete this location?"
            onConfirm={() => handleDeleteLocation(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Location">
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={14} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ flex: 1 }}>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Title level={4} style={{ margin: 0 }}>
                <Building size={20} style={{ marginRight: 8 }} />
                Location Management
              </Title>
              <Text type="secondary">Manage locations for {accountName}</Text>
            </div>
            <Space>
              <Button
                icon={<Upload size={16} />}
                onClick={() => setSidebarView("import")}
              >
                Import
              </Button>
              <Button
                icon={<Download size={16} />}
                onClick={() => {
                  // TODO: Implement export functionality
                  message.info("Export functionality coming soon");
                }}
              >
                Export
              </Button>
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={handleAddLocation}
              >
                Add Location
              </Button>
            </Space>
          </div>
        </div>

        {locations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <MapPin size={48} style={{ color: "#d9d9d9", marginBottom: 16 }} />
            <Title level={4} type="secondary">
              No locations found
            </Title>
            <Text type="secondary">
              Add your first location or import multiple locations from a CSV
              file.
            </Text>
            <div style={{ marginTop: 16 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={handleAddLocation}
                >
                  Add Location
                </Button>
                <Button
                  icon={<Upload size={16} />}
                  onClick={() => setSidebarView("import")}
                >
                  Import Locations
                </Button>
              </Space>
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={locations}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} locations`,
            }}
            size="small"
          />
        )}
      </Card>
    </>
  );
};

export default LocationManagement;
