import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Switch,
  Select,
  InputNumber,
  Space,
  message,
  Divider,
} from "antd";
import {
  Location,
  createLocation,
  updateLocation,
} from "../../data/locationData";

const { TextArea } = Input;
const { Option } = Select;

interface LocationFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  accountId: string;
  location?: Location | null;
}

const LocationForm: React.FC<LocationFormProps> = ({
  onCancel,
  onSuccess,
  accountId,
  location,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location) {
      form.setFieldsValue({
        name: location.name,
        street: location.address.street,
        city: location.address.city,
        state: location.address.state,
        zipCode: location.address.zipCode,
        country: location.address.country,
        phone: location.phone,
        email: location.email,
        website: location.website,
        isActive: location.isActive,
        businessType: location.businessType,
        description: location.description,
        capacity: location.capacity,
        amenities: location.amenities?.join(", "),
        parkingInfo: location.parkingInfo,
        accessibility: location.accessibility?.join(", "),
        // Hours
        mondayOpen: location.hours?.monday?.open,
        mondayClose: location.hours?.monday?.close,
        mondayClosed: location.hours?.monday?.isClosed,
        tuesdayOpen: location.hours?.tuesday?.open,
        tuesdayClose: location.hours?.tuesday?.close,
        tuesdayClosed: location.hours?.tuesday?.isClosed,
        wednesdayOpen: location.hours?.wednesday?.open,
        wednesdayClose: location.hours?.wednesday?.close,
        wednesdayClosed: location.hours?.wednesday?.isClosed,
        thursdayOpen: location.hours?.thursday?.open,
        thursdayClose: location.hours?.thursday?.close,
        thursdayClosed: location.hours?.thursday?.isClosed,
        fridayOpen: location.hours?.friday?.open,
        fridayClose: location.hours?.friday?.close,
        fridayClosed: location.hours?.friday?.isClosed,
        saturdayOpen: location.hours?.saturday?.open,
        saturdayClose: location.hours?.saturday?.close,
        saturdayClosed: location.hours?.saturday?.isClosed,
        sundayOpen: location.hours?.sunday?.open,
        sundayClose: location.hours?.sunday?.close,
        sundayClosed: location.hours?.sunday?.isClosed,
      });
    } else {
      form.resetFields();
    }
  }, [location, form]);

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
          country: values.country,
        },
        phone: values.phone,
        email: values.email,
        website: values.website,
        isActive: values.isActive ?? true,
        businessType: values.businessType,
        description: values.description,
        capacity: values.capacity,
        amenities: values.amenities
          ? values.amenities.split(",").map((a: string) => a.trim())
          : [],
        parkingInfo: values.parkingInfo,
        accessibility: values.accessibility
          ? values.accessibility.split(",").map((a: string) => a.trim())
          : [],
        hours: {
          monday: {
            open: values.mondayOpen || "09:00",
            close: values.mondayClose || "17:00",
            isClosed: values.mondayClosed || false,
          },
          tuesday: {
            open: values.tuesdayOpen || "09:00",
            close: values.tuesdayClose || "17:00",
            isClosed: values.tuesdayClosed || false,
          },
          wednesday: {
            open: values.wednesdayOpen || "09:00",
            close: values.wednesdayClose || "17:00",
            isClosed: values.wednesdayClosed || false,
          },
          thursday: {
            open: values.thursdayOpen || "09:00",
            close: values.thursdayClose || "17:00",
            isClosed: values.thursdayClosed || false,
          },
          friday: {
            open: values.fridayOpen || "09:00",
            close: values.fridayClose || "17:00",
            isClosed: values.fridayClosed || false,
          },
          saturday: {
            open: values.saturdayOpen || "09:00",
            close: values.saturdayClose || "17:00",
            isClosed: values.saturdayClosed || false,
          },
          sunday: {
            open: values.sundayOpen || "09:00",
            close: values.sundayClose || "17:00",
            isClosed: values.sundayClosed || false,
          },
        },
        createdBy: "user",
        updatedBy: "user",
      };

      if (location) {
        updateLocation(accountId, location.id, locationData);
      } else {
        createLocation(accountId, locationData);
      }

      onSuccess();
    } catch (error) {
      message.error("Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  const renderHoursForm = (day: string, dayLabel: string) => {
    const dayKey = day.toLowerCase();
    return (
      <Row gutter={8} align="middle">
        <Col span={4}>
          <span style={{ fontWeight: 500 }}>{dayLabel}</span>
        </Col>
        <Col span={4}>
          <Form.Item
            name={`${dayKey}Closed`}
            valuePropName="checked"
            style={{ margin: 0 }}
          >
            <Switch size="small" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={`${dayKey}Open`} style={{ margin: 0 }}>
            <Input
              placeholder="09:00"
              disabled={form.getFieldValue(`${dayKey}Closed`)}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={`${dayKey}Close`} style={{ margin: 0 }}>
            <Input
              placeholder="17:00"
              disabled={form.getFieldValue(`${dayKey}Closed`)}
            />
          </Form.Item>
        </Col>
      </Row>
    );
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        isActive: true,
        country: "USA",
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="Location Name"
            rules={[{ required: true, message: "Please enter location name" }]}
          >
            <Input placeholder="e.g., Main Store, Downtown Location" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="businessType" label="Business Type">
            <Select placeholder="Select business type">
              <Option value="Restaurant">Restaurant</Option>
              <Option value="Retail">Retail</Option>
              <Option value="Spa & Beauty">Spa & Beauty</Option>
              <Option value="Fitness & Health">Fitness & Health</Option>
              <Option value="Hotel & Lodging">Hotel & Lodging</Option>
              <Option value="Activities & Entertainment">
                Activities & Entertainment
              </Option>
              <Option value="Cafe">Cafe</Option>
              <Option value="Salon">Salon</Option>
              <Option value="Winery">Winery</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">Address Information</Divider>

      <Form.Item
        name="street"
        label="Street Address"
        rules={[{ required: true, message: "Please enter street address" }]}
      >
        <Input placeholder="123 Main Street" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="city"
            label="City"
            rules={[{ required: true, message: "Please enter city" }]}
          >
            <Input placeholder="City" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="state"
            label="State"
            rules={[{ required: true, message: "Please enter state" }]}
          >
            <Input placeholder="State" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="zipCode"
            label="ZIP Code"
            rules={[{ required: true, message: "Please enter ZIP code" }]}
          >
            <Input placeholder="12345" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            name="country"
            label="Country"
            rules={[{ required: true, message: "Please enter country" }]}
          >
            <Input placeholder="USA" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">Contact Information</Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="(555) 123-4567" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="email" label="Email">
            <Input placeholder="location@business.com" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="website" label="Website">
            <Input placeholder="www.business.com" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">Location Details</Divider>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="capacity" label="Capacity">
            <InputNumber
              placeholder="Maximum capacity"
              style={{ width: "100%" }}
              min={1}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="amenities" label="Amenities">
            <Input placeholder="WiFi, Parking, Outdoor Seating (comma separated)" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label="Description">
        <TextArea
          rows={3}
          placeholder="Brief description of this location..."
        />
      </Form.Item>

      <Form.Item name="parkingInfo" label="Parking Information">
        <Input placeholder="Free parking, Valet available, Street parking only" />
      </Form.Item>

      <Form.Item name="accessibility" label="Accessibility Features">
        <Input placeholder="Wheelchair Accessible, Elevator Access (comma separated)" />
      </Form.Item>

      <Divider orientation="left">Business Hours</Divider>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          <span style={{ width: 60 }}>Day</span>
          <span style={{ width: 60 }}>Closed</span>
          <span style={{ width: 80 }}>Open</span>
          <span style={{ width: 80 }}>Close</span>
        </div>
        {renderHoursForm("Monday", "Mon")}
        {renderHoursForm("Tuesday", "Tue")}
        {renderHoursForm("Wednesday", "Wed")}
        {renderHoursForm("Thursday", "Thu")}
        {renderHoursForm("Friday", "Fri")}
        {renderHoursForm("Saturday", "Sat")}
        {renderHoursForm("Sunday", "Sun")}
      </div>

      <Divider orientation="left">Settings</Divider>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="isActive" valuePropName="checked">
            <Switch /> Active Location
          </Form.Item>
        </Col>
      </Row>

      <div style={{ textAlign: "right", marginTop: 24 }}>
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {location ? "Update Location" : "Add Location"}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default LocationForm;
