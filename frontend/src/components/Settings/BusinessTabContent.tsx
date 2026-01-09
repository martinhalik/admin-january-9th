import React, { useState } from "react";
import { Card, Typography, Space, Upload, Button, Input, Descriptions, Badge, Tooltip, theme, Tag, InputNumber, DatePicker, Alert, Radio } from "antd";
import { Upload as UploadIcon, FileText, AlertCircle, Building2, CheckCircle, Calendar, MapPin, Shield, DollarSign, Stamp } from "lucide-react";
import type { UploadFile, UploadProps, RadioChangeEvent } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

export type PaymentTerm = "on_redeem" | "on_view_voucher" | "on_click" | "via_api";

export interface BusinessTabContentProps {
  accountId?: string;
  dealId: string;
  
  // Deal metadata
  dealCategory?: string;
  maxDiscount?: number; // Maximum discount percentage across all options
  
  // Proof of Pricing
  proofOfPricingFiles?: UploadFile[];
  onProofOfPricingChange?: (files: UploadFile[]) => void;
  priceFromWebsite?: boolean; // Whether price was found on merchant website
  onPriceFromWebsiteChange?: (value: boolean) => void;
  
  // Licenses (for health/medical deals)
  licenseFiles?: UploadFile[];
  onLicenseFilesChange?: (files: UploadFile[]) => void;
  licenseNotes?: string;
  onLicenseNotesChange?: (value: string) => void;
  
  // Payment Terms
  paymentTerm?: PaymentTerm;
  onPaymentTermChange?: (value: PaymentTerm) => void;
  
  // Deal Schedule
  dealStartDate?: string;
  dealEndDate?: string;
  voucherExpirationDays?: number;
  onDealStartDateChange?: (value: string) => void;
  onDealEndDateChange?: (value: string) => void;
  onVoucherExpirationDaysChange?: (value: number) => void;
  
  // Locations
  locationCount?: number;
  onManageLocations?: () => void;
  
  // Deal-specific business details (optional overrides)
  dealWebsite?: string;
  dealPhone?: string;
  dealEmail?: string;
  dealAddress?: string;
  dealBusinessHours?: string;
  
  // Account-level business details (inherited)
  accountWebsite?: string;
  accountPhone?: string;
  accountEmail?: string;
  accountAddress?: string;
  accountBusinessHours?: string;
  accountBusinessName?: string;
  
  // Callbacks for editing deal-specific details
  onDealWebsiteChange?: (value: string) => void;
  onDealPhoneChange?: (value: string) => void;
  onDealEmailChange?: (value: string) => void;
  onDealAddressChange?: (value: string) => void;
  onDealBusinessHoursChange?: (value: string) => void;
}

const BusinessTabContent: React.FC<BusinessTabContentProps> = ({
  dealCategory,
  maxDiscount = 0,
  proofOfPricingFiles = [],
  onProofOfPricingChange,
  priceFromWebsite = false,
  onPriceFromWebsiteChange,
  licenseFiles = [],
  onLicenseFilesChange,
  licenseNotes,
  onLicenseNotesChange,
  paymentTerm = "on_redeem",
  onPaymentTermChange,
  dealStartDate,
  dealEndDate,
  voucherExpirationDays = 90,
  onDealStartDateChange,
  onDealEndDateChange,
  onVoucherExpirationDaysChange,
  locationCount = 0,
  onManageLocations,
  dealWebsite,
  dealPhone,
  dealEmail,
  dealAddress,
  dealBusinessHours,
  accountWebsite,
  accountPhone,
  accountEmail,
  accountAddress,
  accountBusinessHours,
  accountBusinessName,
  onDealWebsiteChange,
  onDealPhoneChange,
  onDealEmailChange,
  onDealAddressChange,
  onDealBusinessHoursChange,
}) => {
  const { token } = useToken();
  const [fileList, setFileList] = useState<UploadFile[]>(proofOfPricingFiles);
  const [licenseFileList, setLicenseFileList] = useState<UploadFile[]>(licenseFiles);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Check if licenses are required based on category
  const isLicenseRequired = dealCategory?.toLowerCase().includes('health') || 
                            dealCategory?.toLowerCase().includes('medical') ||
                            dealCategory?.toLowerCase().includes('spa') ||
                            dealCategory?.toLowerCase().includes('wellness');
  
  // Check if proof of pricing is required (discount >= 20%)
  const isProofOfPricingRequired = maxDiscount >= 20;

  const handleUploadChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    onProofOfPricingChange?.(newFileList);
  };

  const handleLicenseUploadChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setLicenseFileList(newFileList);
    onLicenseFilesChange?.(newFileList);
  };

  // Helper to check if a field is customized (different from account-level)
  const isFieldCustomized = (dealValue?: string, accountValue?: string) => {
    return dealValue !== undefined && dealValue !== accountValue;
  };

  // Helper to get display value (deal-specific or inherited)
  const getDisplayValue = (dealValue?: string, accountValue?: string) => {
    return dealValue || accountValue || "Not set";
  };

  // Helper to render field with inheritance indicator
  const renderBusinessField = (
    label: string,
    dealValue: string | undefined,
    accountValue: string | undefined,
    fieldKey: string,
    onChange?: (value: string) => void
  ) => {
    const isCustomized = isFieldCustomized(dealValue, accountValue);
    const isEditing = editingField === fieldKey;
    const displayValue = getDisplayValue(dealValue, accountValue);

    return (
      <Descriptions.Item
        label={
          <Space>
            <Text>{label}</Text>
            {isCustomized && (
              <Tooltip title="This field is customized for this deal">
                <Tag color="blue" style={{ margin: 0, fontSize: 11, padding: "0 4px" }}>
                  Custom
                </Tag>
              </Tooltip>
            )}
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          {!isEditing ? (
            <Space style={{ width: "100%" }}>
              <Text>{displayValue}</Text>
              {onChange && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setEditingField(fieldKey)}
                  style={{ padding: 0 }}
                >
                  {isCustomized ? "Edit" : "Customize"}
                </Button>
              )}
            </Space>
          ) : (
            <Space.Compact style={{ width: "100%" }}>
              <Input
                defaultValue={dealValue || accountValue || ""}
                placeholder={accountValue ? `Inherited: ${accountValue}` : "Enter value"}
                onPressEnter={(e) => {
                  onChange?.(e.currentTarget.value);
                  setEditingField(null);
                }}
                autoFocus
              />
              <Button
                type="primary"
                onClick={() => {
                  setEditingField(null);
                }}
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  if (isCustomized && onChange) {
                    onChange(accountValue || "");
                  }
                  setEditingField(null);
                }}
              >
                {isCustomized ? "Reset" : "Cancel"}
              </Button>
            </Space.Compact>
          )}
          {!isCustomized && accountValue && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <Space size={4}>
                <CheckCircle size={12} />
                Inherited from account
              </Space>
            </Text>
          )}
        </Space>
      </Descriptions.Item>
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Proof of Pricing Section - Only show if required */}
      {isProofOfPricingRequired && (
        <Card
          title={
            <Space>
              <FileText size={18} />
              <span>Proof of Pricing</span>
              <Tag color="red" style={{ margin: 0 }}>
                Required
              </Tag>
            </Space>
          }
          extra={
            <Tooltip title="Upload documentation to verify pricing claims">
              <AlertCircle size={16} color={token.colorTextSecondary} />
            </Tooltip>
          }
        >
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Text type="secondary">
              Upload screenshots, PDFs, or other documentation that proves the regular pricing
              for this deal. This is <Text strong>required</Text> for deals with discounts of 20% or more.
            </Text>

            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Space>
                <Button
                  type={priceFromWebsite ? "primary" : "default"}
                  icon={<Stamp size={16} />}
                  onClick={() => onPriceFromWebsiteChange?.(!priceFromWebsite)}
                >
                  Price Found on Merchant Website
                </Button>
                {priceFromWebsite && (
                  <Tag icon={<Stamp size={12} />} color="blue">
                    Verified from website
                  </Tag>
                )}
              </Space>
              
              <Upload
                fileList={fileList}
                onChange={handleUploadChange}
                beforeUpload={() => false} // Prevent auto-upload
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                listType="text"
              >
                <Button icon={<UploadIcon size={16} />}>
                  Upload Proof of Pricing
                </Button>
              </Upload>
            </Space>

            {fileList.length > 0 || priceFromWebsite ? (
              <Space>
                <CheckCircle size={16} color={token.colorSuccess} />
                <Text type="success">
                  {fileList.length > 0 && `${fileList.length} file${fileList.length !== 1 ? "s" : ""} uploaded`}
                  {fileList.length > 0 && priceFromWebsite && " • "}
                  {priceFromWebsite && "Price verified from merchant website"}
                </Text>
              </Space>
            ) : (
              <Space>
                <AlertCircle size={16} color={token.colorError} />
                <Text type="danger">
                  Proof of pricing is required before this deal can go live
                </Text>
              </Space>
            )}
          </Space>
        </Card>
      )}

      {/* Licenses Section - Only show if required, otherwise just notification */}
      {isLicenseRequired ? (
        <Card
          title={
            <Space>
              <Shield size={18} />
              <span>Licenses & Certifications</span>
              <Tag color="red" style={{ margin: 0 }}>
                Required
              </Tag>
            </Space>
          }
          extra={
            <Tooltip title="Required for health/medical/spa/wellness deals">
              <AlertCircle size={16} color={token.colorTextSecondary} />
            </Tooltip>
          }
        >
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Alert
              message="Licenses are required for this deal"
              description={`This is a ${dealCategory} deal. Please upload relevant business licenses, medical licenses, certifications, or permits.`}
              type="warning"
              showIcon
            />

            <Upload
              fileList={licenseFileList}
              onChange={handleLicenseUploadChange}
              beforeUpload={() => false}
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              listType="text"
            >
              <Button icon={<UploadIcon size={16} />}>
                Upload Licenses
              </Button>
            </Upload>

            {licenseFileList.length > 0 ? (
              <Space>
                <CheckCircle size={16} color={token.colorSuccess} />
                <Text type="success">
                  {licenseFileList.length} file{licenseFileList.length !== 1 ? "s" : ""} uploaded
                </Text>
              </Space>
            ) : (
              <Space>
                <AlertCircle size={16} color={token.colorError} />
                <Text type="danger">
                  License documentation is required before this deal can go live
                </Text>
              </Space>
            )}

            <div>
              <Text strong style={{ display: "block", marginBottom: token.marginXS }}>
                Notes
              </Text>
              <TextArea
                placeholder="Add notes about licenses, certifications, or compliance requirements..."
                rows={3}
                value={licenseNotes}
                onChange={(e) => onLicenseNotesChange?.(e.target.value)}
              />
            </div>
          </Space>
        </Card>
      ) : (
        <Alert
          message="No licenses required"
          description="This deal category does not require special licenses or certifications."
          type="success"
          showIcon
          closable
          style={{ marginBottom: token.marginLG }}
        />
      )}

      {/* Payment Terms */}
      <Card
        title={
          <Space>
            <DollarSign size={18} />
            <span>Payment Terms</span>
          </Space>
        }
      >
        <Radio.Group
          value={paymentTerm}
          onChange={(e: RadioChangeEvent) => onPaymentTermChange?.(e.target.value as PaymentTerm)}
          style={{ width: "100%" }}
        >
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Radio value="on_redeem">
              <Text strong>Pay on Redeem</Text>
              <Text type="secondary" style={{ fontSize: 12 }}> (Default)</Text>
            </Radio>
            
            <Radio value="on_view_voucher">
              <Text strong>Pay on Viewing Voucher</Text>
            </Radio>
            
            <Radio value="on_click">
              <Text strong>Pay on Click</Text>
            </Radio>
            
            <Radio value="via_api">
              <Text strong>Via API</Text>
            </Radio>
          </Space>
        </Radio.Group>
      </Card>

      {/* Deal Schedule & Voucher Expiration */}
      <Card
        title={
          <Space>
            <Calendar size={18} />
            <span>Deal Schedule & Voucher Expiration</span>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text type="secondary">
            Configure when this deal will be available for purchase and how long vouchers remain valid after purchase.
          </Text>

          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Deal Start Date">
              <Space>
                <DatePicker
                  value={dealStartDate ? dayjs(dealStartDate, "DD. M. YYYY") : null}
                  format="DD. M. YYYY"
                  onChange={(date) => onDealStartDateChange?.(date?.format("DD. M. YYYY") || "")}
                  placeholder="Select start date"
                />
                {dealStartDate && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => onDealStartDateChange?.("")}
                    style={{ padding: 0 }}
                  >
                    Clear
                  </Button>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Deal End Date">
              <Space>
                <DatePicker
                  value={dealEndDate ? dayjs(dealEndDate, "DD. M. YYYY") : null}
                  format="DD. M. YYYY"
                  onChange={(date) => onDealEndDateChange?.(date?.format("DD. M. YYYY") || "")}
                  placeholder="Select end date (optional)"
                />
                {dealEndDate && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => onDealEndDateChange?.("")}
                    style={{ padding: 0 }}
                  >
                    Clear
                  </Button>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Voucher Expiration">
              <Space>
                <InputNumber
                  value={voucherExpirationDays}
                  onChange={(value) => onVoucherExpirationDaysChange?.(value || 90)}
                  min={1}
                  max={365}
                  style={{ width: 100 }}
                />
                <Text>days after purchase</Text>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>

      {/* Locations Summary */}
      <Card
        title={
          <Space>
            <MapPin size={18} />
            <span>Locations</span>
            <Badge count={locationCount} style={{ backgroundColor: token.colorPrimary }} />
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text type="secondary">
            This deal is available at {locationCount} location{locationCount !== 1 ? 's' : ''}. 
            Manage locations in the Content tab.
          </Text>

          <Button type="default" onClick={onManageLocations}>
            Manage Locations
          </Button>
        </Space>
      </Card>

      {/* Business Details Section */}
      <Card
        title={
          <Space>
            <Building2 size={18} />
            <span>Business Details</span>
          </Space>
        }
        extra={
          accountBusinessName && (
            <Space size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Account:
              </Text>
              <Text strong style={{ fontSize: 12 }}>
                {accountBusinessName}
              </Text>
            </Space>
          )
        }
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text type="secondary">
            Business information for this deal. Fields marked as "Custom" override the account-level settings.
          </Text>

          <Descriptions bordered column={1} size="small">
            {renderBusinessField(
              "Website",
              dealWebsite,
              accountWebsite,
              "website",
              onDealWebsiteChange
            )}
            {renderBusinessField(
              "Phone",
              dealPhone,
              accountPhone,
              "phone",
              onDealPhoneChange
            )}
            {renderBusinessField(
              "Email",
              dealEmail,
              accountEmail,
              "email",
              onDealEmailChange
            )}
            {renderBusinessField(
              "Address",
              dealAddress,
              accountAddress,
              "address",
              onDealAddressChange
            )}
            {renderBusinessField(
              "Business Hours",
              dealBusinessHours,
              accountBusinessHours,
              "hours",
              onDealBusinessHoursChange
            )}
          </Descriptions>
        </Space>
      </Card>

      {/* Deal Configuration Section */}
      <Card
        title={
          <Space>
            <FileText size={18} />
            <span>Deal Configuration</span>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text type="secondary">
            Additional configuration and settings for this deal.
          </Text>

          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Purchase Limits">
              <Space>
                <Text>No limits set</Text>
                <Button type="link" size="small" style={{ padding: 0 }}>
                  Configure
                </Button>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Inventory Management">
              <Space>
                <Text>Unlimited</Text>
                <Button type="link" size="small" style={{ padding: 0 }}>
                  Configure
                </Button>
              </Space>
            </Descriptions.Item>
          </Descriptions>

          <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
            More configuration options coming soon...
          </Text>
        </Space>
      </Card>
    </Space>
  );
};

export default BusinessTabContent;

