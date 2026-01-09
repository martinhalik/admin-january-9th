import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  Segmented,
  Space,
  message,
  theme,
  Typography,
  App,
} from "antd";
import { Search, Edit, MapPin, ArrowLeft } from "lucide-react";
import * as maptilerSdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { createLocation } from "../data/locationData";

const { Text, Title } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

interface AddLocationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountId: string;
}

const AddLocationModal: React.FC<AddLocationModalProps> = ({
  open,
  onClose,
  onSuccess,
  accountId,
}) => {
  const { token } = useToken();
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setMode("search");
      setSearchQuery("");
      setCoordinates(null);
      setHasUnsavedChanges(false);
      form.resetFields();
    }
  }, [open, form]);

  // Initialize map for manual entry
  useEffect(() => {
    if (mode === "manual" && open && mapContainer.current && !map.current) {
      const defaultCoords: [number, number] = coordinates
        ? [coordinates.longitude, coordinates.latitude]
        : [-118.2437, 34.0522]; // LA default

      // Get API key from environment or use demo key
      const apiKey = import.meta.env.VITE_MAPTILER_API_KEY || "";
      maptilerSdk.config.apiKey = apiKey;

      map.current = new maptilerSdk.Map({
        container: mapContainer.current,
        style: maptilerSdk.MapStyle.STREETS,
        center: defaultCoords,
        zoom: 14,
        navigationControl: false, // Disable default controls to avoid duplicates
      });

      // Disable scroll zoom but keep drag enabled
      map.current.scrollZoom.disable();
      
      // Add navigation controls (zoom buttons and compass)
      map.current.addControl(
        new maptilerSdk.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: false,
        }),
        "top-right"
      );

      // Create custom marker element with Groupon G logo and arrow (same as deal content page)
      const markerElement = document.createElement("div");
      markerElement.className = "custom-marker";
      markerElement.style.cursor = "pointer";

      // Add rectangle with Groupon G logo and arrow pointer
      markerElement.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background-color: #262626;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.9368 10.6142L23.933 10.5539H10.6V15.165H17.2823C16.1304 17.1796 14.1886 18.2831 12.0152 18.2831C8.78866 18.2831 5.89243 15.4583 5.89243 11.7884C5.89243 8.47681 8.59241 5.71692 12.0152 5.71692C13.8583 5.71692 15.3735 6.46459 16.8216 7.95753H23.3405C21.4634 3.02074 17.0861 0 12.0811 0C8.75697 0 5.85952 1.16839 3.55447 3.409C1.25065 5.65081 0 8.57297 0 11.756C0 15.1662 1.11778 18.0246 3.32531 20.3302C5.62913 22.7342 8.5595 24 12.0165 24C13.9787 23.9989 15.9114 23.5287 17.6488 22.6295C19.3863 21.7303 20.8768 20.429 21.9924 18.8372C23.3418 16.8887 24 14.6806 24 12.0817C24 11.6126 23.9685 11.1145 23.9368 10.6142Z" fill="white"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 12px solid #262626;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
        "></div>
      `;

      // Add hover effect
      const rectEl = markerElement.querySelector("div") as HTMLElement;
      markerElement.onmouseenter = () => {
        if (rectEl) rectEl.style.transform = "scale(1.1)";
      };
      markerElement.onmouseleave = () => {
        if (rectEl) rectEl.style.transform = "scale(1)";
      };

      // Add draggable marker with custom element
      marker.current = new maptilerSdk.Marker({
        element: markerElement,
        anchor: "bottom",
        draggable: true,
      })
        .setLngLat(defaultCoords)
        .addTo(map.current);

      // Update coordinates when marker is dragged
      marker.current.on("dragend", () => {
        const lngLat = marker.current.getLngLat();
        setCoordinates({
          longitude: lngLat.lng,
          latitude: lngLat.lat,
        });
        setHasUnsavedChanges(true); // Mark as unsaved when marker is moved
      });

      // Set initial coordinates if not already set
      if (!coordinates) {
        setCoordinates({
          longitude: defaultCoords[0],
          latitude: defaultCoords[1],
        });
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
    };
  }, [mode, open]);

  // Update map position when coordinates change (e.g., from search)
  useEffect(() => {
    if (map.current && marker.current && coordinates && mode === "manual") {
      const newCoords: [number, number] = [
        coordinates.longitude,
        coordinates.latitude,
      ];
      marker.current.setLngLat(newCoords);
      map.current.flyTo({ center: newCoords, zoom: 14 });
    }
  }, [coordinates, mode]);

  // Mock Google Places search (replace with actual API integration)
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning("Please enter an address to search");
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual Google Places API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock place data
      const mockPlace = {
        name: "Found Location",
        street: "123 Main St",
        city: "Mountain View",
        state: "CA",
        zipCode: "94043",
        country: "USA",
        phone: "(555) 123-4567",
        latitude: 37.4419,
        longitude: -122.143,
      };

      // Pre-fill form with search results
      form.setFieldsValue({
        name: mockPlace.name,
        street: mockPlace.street,
        city: mockPlace.city,
        state: mockPlace.state,
        zipCode: mockPlace.zipCode,
        country: mockPlace.country,
        phone: mockPlace.phone,
      });

      setCoordinates({
        latitude: mockPlace.latitude,
        longitude: mockPlace.longitude,
      });

      // Switch to manual mode to show the form
      setMode("manual");
      setHasUnsavedChanges(true); // Mark as unsaved when location is found from search

      message.success("Location found! Review and adjust details below.");
    } catch (error) {
      message.error("Failed to search location");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Validate that we have coordinates
      if (!coordinates) {
        message.warning("Please wait for the map to load or adjust the pin location");
        setLoading(false);
        return;
      }

      const locationData = {
        name: values.name || `${values.street}, ${values.city}`,
        address: {
          street: values.street,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          country: values.country || "USA",
        },
        phone: values.phone,
        email: values.email,
        website: values.website,
        coordinates: coordinates,
        isActive: true,
        description: values.note,
        createdBy: "user",
        updatedBy: "user",
      };

      const newLocation = createLocation(accountId, locationData);
      message.success("Location added successfully!");
      form.resetFields();
      setCoordinates(null);
      setSearchQuery("");
      setHasUnsavedChanges(false);
      onSuccess();
    } catch (error) {
      message.error("Failed to add location");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      modal.confirm({
        title: 'Discard unsaved changes?',
        content: 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
        okText: 'Discard',
        okType: 'danger',
        cancelText: 'Stay',
        zIndex: 1100,
        onOk: () => {
          setHasUnsavedChanges(false);
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={700}
      centered
      destroyOnClose
      maskClosable={true}
      zIndex={1001}
      maskStyle={{
        backgroundColor: "rgba(0, 0, 0, 0.25)",
        backdropFilter: "blur(2px)",
      }}
      styles={{
        body: {
          padding: 0,
          maxHeight: "calc(100vh - 200px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Fixed Header */}
      <div
        style={{
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: token.padding,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: token.marginXS,
            marginBottom: token.marginSM,
          }}
        >
          {/* Back Button */}
          <Button
            type="text"
            icon={<ArrowLeft size={16} />}
            onClick={handleClose}
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          />

          <Title level={5} style={{ margin: 0, flex: 1 }}>
            Add New Location
          </Title>
        </div>

        {/* Mode Selector */}
        <Segmented
          value={mode}
          onChange={(value) => setMode(value as "search" | "manual")}
          options={[
            {
              label: (
                <Space size={4}>
                  <Search size={14} />
                  <span>Search</span>
                </Space>
              ),
              value: "search",
            },
            {
              label: (
                <Space size={4}>
                  <Edit size={14} />
                  <span>Manual Entry</span>
                </Space>
              ),
              value: "manual",
            },
          ]}
          block
          size="small"
          style={{
            background: token.colorBgTextHover,
          }}
        />
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: token.paddingLG,
        }}
      >
        {/* Search Mode */}
        {mode === "search" && (
          <div>
            <div
              style={{
                textAlign: "center",
                marginBottom: token.marginLG,
                paddingTop: token.paddingSM,
              }}
            >
              <MapPin
                size={48}
                style={{ color: token.colorPrimary, marginBottom: token.marginSM }}
              />
              <Text
                strong
                style={{
                  display: "block",
                  fontSize: 16,
                  marginBottom: token.marginXXS,
                }}
              >
                Find a Location
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Start typing an address to get suggestions.
              </Text>
            </div>

            <Input
              placeholder="e.g., 1600 Amphitheatre Parkway, Mountain View, CA"
              prefix={<Search size={16} style={{ color: token.colorTextTertiary }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={handleSearch}
              style={{ marginBottom: token.marginLG }}
            />
          </div>
        )}

        {/* Manual Entry Mode */}
        {mode === "manual" && (
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleSubmit}
            onValuesChange={() => setHasUnsavedChanges(true)}
          >
          <Form.Item
            label="Location Name"
            name="name"
          >
            <Input placeholder="e.g., Main Street Store" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={24}>
              <Form.Item
                label="Street"
                name="street"
                rules={[
                  { required: true, message: "Please enter street address" },
                ]}
              >
                <Input placeholder="Street address" />
              </Form.Item>
            </Col>
          </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="City"
                  name="city"
                  rules={[{ required: true, message: "Please enter city" }]}
                >
                  <Input placeholder="City" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="State / Province"
                  name="state"
                  rules={[{ required: true, message: "Please enter state" }]}
                >
                  <Input placeholder="State" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="ZIP / Postal Code"
                  name="zipCode"
                  rules={[{ required: true, message: "Please enter ZIP code" }]}
                >
                  <Input placeholder="ZIP code" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Phone" name="phone">
                  <Input placeholder="Phone number" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Note" name="note">
              <TextArea
                rows={3}
                placeholder="Additional information about this location"
              />
            </Form.Item>

            {/* Map - Moved below Note */}
            <div style={{ marginBottom: token.marginLG }}>
              <Text
                strong
                style={{ display: "block", marginBottom: token.marginXS }}
              >
                Adjust location on map
              </Text>
              <div
                ref={mapContainer}
                style={{
                  height: 250,
                  borderRadius: token.borderRadius,
                  border: `1px solid ${token.colorBorder}`,
                  marginBottom: token.marginXS,
                }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Drag the map or pin to adjust coordinates.
              </Text>
            </div>
          </Form>
        )}
      </div>

      {/* Fixed Footer */}
      <div
        style={{
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          padding: token.padding,
          background: token.colorBgContainer,
          display: "flex",
          justifyContent: "flex-end",
          gap: token.marginSM,
        }}
      >
        <Button onClick={handleClose}>
          Cancel
        </Button>
        {mode === "search" ? (
          <Button
            type="primary"
            onClick={handleSearch}
            loading={loading}
          >
            Search
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={loading}
          >
            Save Location
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default AddLocationModal;

