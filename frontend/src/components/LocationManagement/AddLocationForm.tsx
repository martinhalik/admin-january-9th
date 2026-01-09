import React, { useState, useRef, useEffect } from "react";
import {
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
} from "antd";
import { Search, Edit, MapPin } from "lucide-react";
import * as maptilerSdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { createLocation } from "../../data/locationData";

const { Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

interface AddLocationFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  accountId: string;
}

const AddLocationForm: React.FC<AddLocationFormProps> = ({
  onCancel,
  onSuccess,
  accountId,
}) => {
  const { token } = useToken();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);

  // Initialize map for manual entry
  useEffect(() => {
    if (mode === "manual" && mapContainer.current && !map.current) {
      const defaultCoords: [number, number] = [-118.2437, 34.0522]; // LA default
      
      const apiKey = import.meta.env.VITE_MAPTILER_API_KEY || "";
      maptilerSdk.config.apiKey = apiKey;
      
      map.current = new maptilerSdk.Map({
        container: mapContainer.current,
        style: maptilerSdk.MapStyle.STREETS,
        center: defaultCoords,
        zoom: 12,
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

      // Add draggable marker
      marker.current = new maptilerSdk.Marker({
        color: "#FF4D4F",
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
      });

      // Set initial coordinates
      setCoordinates({
        longitude: defaultCoords[0],
        latitude: defaultCoords[1],
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
    };
  }, [mode]);

  // Mock Google Places search (replace with actual API integration)
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning("Please enter an address to search");
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual Google Places API call
      // For now, using mock data
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
        longitude: -122.1430,
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

      message.success("Location found! Review and adjust details below.");
    } catch (error) {
      message.error("Failed to search location");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const locationData = {
        name: values.name,
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
        coordinates: coordinates || undefined,
        isActive: true,
        description: values.note,
        createdBy: "user",
        updatedBy: "user",
      };

      createLocation(accountId, locationData);
      message.success("Location added successfully!");
      form.resetFields();
      onSuccess();
    } catch (error) {
      message.error("Failed to add location");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Mode Selector */}
      <div style={{ marginBottom: token.marginLG }}>
        <Segmented
          value={mode}
          onChange={(value) => setMode(value as "search" | "manual")}
          options={[
            {
              label: (
                <Space>
                  <Search size={16} />
                  <span>Search</span>
                </Space>
              ),
              value: "search",
            },
            {
              label: (
                <Space>
                  <Edit size={16} />
                  <span>Manual Entry</span>
                </Space>
              ),
              value: "manual",
            },
          ]}
          block
          style={{
            background: token.colorBgTextHover,
            padding: 4,
          }}
        />
      </div>

      {/* Search Mode */}
      {mode === "search" && (
        <div>
          <div style={{ textAlign: "center", marginBottom: token.marginLG }}>
            <MapPin
              size={48}
              style={{ color: token.colorPrimary, marginBottom: token.marginSM }}
            />
            <Text
              strong
              style={{
                display: "block",
                fontSize: 16,
                marginBottom: token.marginXS,
              }}
            >
              Find a Location
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Start typing an address to get suggestions.
            </Text>
          </div>

          <Input
            size="large"
            placeholder="e.g., 1600 Amphitheatre Parkway, Mountain View, CA"
            prefix={<Search size={16} style={{ color: token.colorTextTertiary }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={handleSearch}
            style={{ marginBottom: token.marginLG }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: token.marginSM,
            }}
          >
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSearch} loading={loading}>
              Search
            </Button>
          </div>
        </div>
      )}

      {/* Manual Entry Mode */}
      {mode === "manual" && (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Location Name"
            name="name"
            rules={[{ required: true, message: "Please enter location name" }]}
          >
            <Input placeholder="e.g., Main Street Store" />
          </Form.Item>

          {/* Map */}
          <div style={{ marginBottom: token.marginLG }}>
            <Text strong style={{ display: "block", marginBottom: token.marginXS }}>
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

          <Row gutter={12}>
            <Col span={24}>
              <Form.Item
                label="Street"
                name="street"
                rules={[{ required: true, message: "Please enter street address" }]}
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

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: token.marginSM,
              marginTop: token.marginLG,
            }}
          >
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save Location
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default AddLocationForm;

