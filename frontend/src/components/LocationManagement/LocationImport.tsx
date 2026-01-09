import React, { useState } from "react";
import {
  Upload,
  Button,
  Typography,
  Steps,
  Card,
  Table,
  Tag,
  Alert,
  Space,
  message,
  Row,
  Col,
} from "antd";
import {
  Upload as UploadIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { LocationImportData, importLocations } from "../../data/locationData";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface LocationImportProps {
  onCancel: () => void;
  onSuccess: () => void;
  accountId: string;
}

const LocationImport: React.FC<LocationImportProps> = ({
  onCancel,
  onSuccess,
  accountId,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileData, setFileData] = useState<LocationImportData[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split("\n").filter((line) => line.trim());

        const data: LocationImportData[] = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
          return {
            name: values[0] || "",
            street: values[1] || "",
            city: values[2] || "",
            state: values[3] || "",
            zipCode: values[4] || "",
            country: values[5] || "USA",
            phone: values[6] || "",
            email: values[7] || "",
            website: values[8] || "",
            businessType: values[9] || "",
            description: values[10] || "",
            capacity: values[11] ? parseInt(values[11]) : undefined,
            amenities: values[12] || "",
            parkingInfo: values[13] || "",
            accessibility: values[14] || "",
          };
        });

        setFileData(data);
        setCurrentStep(1);
        message.success(
          `Successfully parsed ${data.length} locations from CSV`
        );
      } catch (error) {
        message.error("Failed to parse CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
    return false; // Prevent default upload
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const result = importLocations(accountId, fileData);
      setImportResult(result);
      setCurrentStep(2);

      if (result.success > 0) {
        message.success(`Successfully imported ${result.success} locations`);
      }
      if (result.failed > 0) {
        message.warning(`${result.failed} locations failed to import`);
      }
    } catch (error) {
      message.error("Failed to import locations");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    setCurrentStep(0);
    setFileData([]);
    setImportResult(null);
  };

  const handleCancel = () => {
    onCancel();
    setCurrentStep(0);
    setFileData([]);
    setImportResult(null);
  };

  const downloadTemplate = () => {
    const template = [
      "name,street,city,state,zipCode,country,phone,email,website,businessType,description,capacity,amenities,parkingInfo,accessibility",
      "Main Store,123 Main St,Anytown,CA,12345,USA,(555) 123-4567,store@business.com,www.business.com,Retail,Main retail location,50,WiFi Parking,Free parking available,Wheelchair Accessible",
      "Downtown Location,456 Oak Ave,Anytown,CA,12345,USA,(555) 123-4568,downtown@business.com,www.business.com,Retail,Downtown branch,30,WiFi,Street parking,Wheelchair Accessible",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "location_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const previewColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "Address",
      key: "address",
      render: (record: LocationImportData) => (
        <div>
          <div style={{ fontSize: 12 }}>{record.street}</div>
          <div style={{ fontSize: 11, color: "#666" }}>
            {record.city}, {record.state} {record.zipCode}
          </div>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (record: LocationImportData) => (
        <div>
          {record.phone && <div style={{ fontSize: 11 }}>{record.phone}</div>}
          {record.email && <div style={{ fontSize: 11 }}>{record.email}</div>}
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "businessType",
      key: "businessType",
      render: (type: string) => (type ? <Tag>{type}</Tag> : "-"),
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity: number) => capacity || "-",
    },
  ];

  const resultColumns = [
    {
      title: "Status",
      key: "status",
      render: (record: any) => (
        <Tag color={record.status === "success" ? "green" : "red"}>
          {record.status === "success" ? "Success" : "Failed"}
        </Tag>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Address",
      key: "address",
      render: (record: any) => (
        <div>
          <div style={{ fontSize: 12 }}>{record.street}</div>
          <div style={{ fontSize: 11, color: "#666" }}>
            {record.city}, {record.state} {record.zipCode}
          </div>
        </div>
      ),
    },
    {
      title: "Error",
      dataIndex: "error",
      key: "error",
      render: (error: string) =>
        error ? (
          <Text type="danger" style={{ fontSize: 11 }}>
            {error}
          </Text>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Steps current={currentStep} size="small">
          <Step title="Upload File" />
          <Step title="Preview Data" />
          <Step title="Import Results" />
        </Steps>
      </div>

      {currentStep === 0 && (
        <div>
          <Card>
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <UploadIcon
                size={48}
                style={{ color: "#1890ff", marginBottom: 16 }}
              />
              <Title level={4}>Upload CSV File</Title>
              <Paragraph type="secondary">
                Upload a CSV file with your location data. Download the template
                to see the required format.
              </Paragraph>
              <Space>
                <Button
                  icon={<Download size={16} />}
                  onClick={downloadTemplate}
                >
                  Download Template
                </Button>
                <Upload
                  accept=".csv"
                  beforeUpload={handleFileUpload}
                  showUploadList={false}
                >
                  <Button type="primary" icon={<UploadIcon size={16} />}>
                    Choose File
                  </Button>
                </Upload>
              </Space>
            </div>
          </Card>

          <Card
            title="CSV Format Requirements"
            size="small"
            style={{ marginTop: 16 }}
          >
            <div style={{ fontSize: 12 }}>
              <Paragraph>
                <strong>Required columns:</strong> name, street, city, state,
                zipCode, country
              </Paragraph>
              <Paragraph>
                <strong>Optional columns:</strong> phone, email, website,
                businessType, description, capacity, amenities, parkingInfo,
                accessibility
              </Paragraph>
              <Paragraph>
                <strong>Note:</strong> Use commas to separate multiple amenities
                or accessibility features.
              </Paragraph>
            </div>
          </Card>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>Preview Data ({fileData.length} locations)</Title>
            <Text type="secondary">
              Review the data before importing. Make sure all required fields
              are filled.
            </Text>
          </div>

          <Table
            columns={previewColumns}
            dataSource={fileData}
            rowKey={(_, index) => index?.toString() || "0"}
            pagination={{ pageSize: 5 }}
            size="small"
            scroll={{ x: 600 }}
          />

          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button onClick={() => setCurrentStep(0)}>Back</Button>
              <Button type="primary" onClick={handleImport} loading={loading}>
                Import Locations
              </Button>
            </Space>
          </div>
        </div>
      )}

      {currentStep === 2 && importResult && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>Import Results</Title>
          </div>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card size="small">
                <div style={{ textAlign: "center" }}>
                  <CheckCircle
                    size={24}
                    style={{ color: "#52c41a", marginBottom: 8 }}
                  />
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: "#52c41a",
                    }}
                  >
                    {importResult.success}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>Successful</div>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <div style={{ textAlign: "center" }}>
                  <AlertCircle
                    size={24}
                    style={{ color: "#ff4d4f", marginBottom: 8 }}
                  />
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: "#ff4d4f",
                    }}
                  >
                    {importResult.failed}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>Failed</div>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <div style={{ textAlign: "center" }}>
                  <FileText
                    size={24}
                    style={{ color: "#1890ff", marginBottom: 8 }}
                  />
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: "#1890ff",
                    }}
                  >
                    {importResult.success + importResult.failed}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>Total</div>
                </div>
              </Card>
            </Col>
          </Row>

          {importResult.errors.length > 0 && (
            <Alert
              message="Import Errors"
              description={`${importResult.errors.length} locations failed to import. Check the details below.`}
              type="warning"
              style={{ marginBottom: 16 }}
            />
          )}

          {importResult.errors.length > 0 && (
            <Table
              columns={resultColumns}
              dataSource={importResult.errors.map(
                (error: any, index: number) => ({
                  key: index,
                  status: "failed",
                  name: fileData[error.row - 1]?.name || "Unknown",
                  street: fileData[error.row - 1]?.street || "",
                  city: fileData[error.row - 1]?.city || "",
                  state: fileData[error.row - 1]?.state || "",
                  zipCode: fileData[error.row - 1]?.zipCode || "",
                  error: error.message,
                })
              )}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          )}

          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button onClick={handleCancel}>Close</Button>
              <Button type="primary" onClick={handleFinish}>
                Done
              </Button>
            </Space>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationImport;
