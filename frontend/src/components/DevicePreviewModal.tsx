import React, { useState } from 'react';
import { Modal, Segmented, Space, Typography, theme, Card, Image, Tag, Divider } from 'antd';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { Deal } from '../data/mockDeals';
import { MerchantAccount } from '../data/merchantAccounts';

const { Text, Title } = Typography;
const { useToken } = theme;

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DevicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  deal: Deal;
  merchant?: MerchantAccount;
}

const DEVICE_DIMENSIONS = {
  mobile: {
    width: 375,
    height: 667,
    scale: 0.7,
    label: 'Mobile',
    icon: Smartphone,
  },
  tablet: {
    width: 768,
    height: 1024,
    scale: 0.5,
    label: 'Tablet',
    icon: Tablet,
  },
  desktop: {
    width: 1440,
    height: 900,
    scale: 0.4,
    label: 'Desktop',
    icon: Monitor,
  },
};

const DevicePreviewModal: React.FC<DevicePreviewModalProps> = ({
  open,
  onClose,
  deal,
  merchant,
}) => {
  const { token } = useToken();
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('mobile');
  const device = DEVICE_DIMENSIONS[selectedDevice];

  // Get the first image or fallback
  const featuredImage = deal.content?.media?.[0]?.url || "";
  
  // Calculate scaled dimensions
  const scaledWidth = device.width * device.scale;
  const scaledHeight = device.height * device.scale;

  // Get deal options
  const dealOptions = deal.options || [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width="90vw"
      style={{ top: 20 }}
      footer={null}
      title={
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <Text strong style={{ fontSize: 16 }}>Device Preview</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            See how your deal will look on different devices
          </Text>
        </Space>
      }
    >
      {/* Device Selector */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <Segmented
          value={selectedDevice}
          onChange={(value) => setSelectedDevice(value as DeviceType)}
          options={[
            {
              label: (
                <Space>
                  <Smartphone size={16} />
                  <span>Mobile</span>
                </Space>
              ),
              value: 'mobile',
            },
            {
              label: (
                <Space>
                  <Tablet size={16} />
                  <span>Tablet</span>
                </Space>
              ),
              value: 'tablet',
            },
            {
              label: (
                <Space>
                  <Monitor size={16} />
                  <span>Desktop</span>
                </Space>
              ),
              value: 'desktop',
            },
          ]}
          size="large"
        />
      </div>

      {/* Device Frame */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 500,
          background: `linear-gradient(135deg, ${token.colorBgLayout} 0%, ${token.colorBgContainer} 100%)`,
          borderRadius: token.borderRadiusLG,
          padding: 40,
        }}
      >
        <div
          style={{
            width: scaledWidth,
            height: scaledHeight,
            background: '#fff',
            borderRadius: selectedDevice === 'mobile' ? 24 : selectedDevice === 'tablet' ? 16 : 8,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: `8px solid ${selectedDevice === 'desktop' ? '#2c2c2c' : '#1a1a1a'}`,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Device Notch (for mobile) */}
          {selectedDevice === 'mobile' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 120,
                height: 20,
                background: '#1a1a1a',
                borderRadius: '0 0 16px 16px',
                zIndex: 10,
              }}
            />
          )}

          {/* Device Screen Content */}
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              background: '#fff',
              fontSize: selectedDevice === 'mobile' ? 12 : selectedDevice === 'tablet' ? 13 : 14,
            }}
          >
            {/* Groupon Header Mockup */}
            <div
              style={{
                background: token.colorPrimary,
                padding: selectedDevice === 'mobile' ? '24px 12px 12px' : '16px 20px',
                color: '#fff',
              }}
            >
              <Text strong style={{ color: '#fff', fontSize: selectedDevice === 'mobile' ? 16 : 20 }}>
                GROUPON
              </Text>
            </div>

            {/* Deal Content */}
            <div style={{ padding: selectedDevice === 'mobile' ? 12 : 20 }}>
              {/* Featured Image */}
              {featuredImage && (
                <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }}>
                  <Image
                    src={featuredImage}
                    alt={deal.title}
                    style={{ width: '100%', height: 'auto' }}
                    preview={false}
                  />
                </div>
              )}

              {/* Deal Title */}
              <Title
                level={selectedDevice === 'mobile' ? 5 : 4}
                style={{ marginTop: 0, marginBottom: 8 }}
              >
                {deal.title}
              </Title>

              {/* Merchant Name */}
              {merchant && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  {merchant.name} • {merchant.location}
                </Text>
              )}

              {/* Category */}
              {deal.category && (
                <div style={{ marginBottom: 12 }}>
                  <Tag color="blue">{deal.category}</Tag>
                  {deal.subcategory && <Tag>{deal.subcategory}</Tag>}
                </div>
              )}

              <Divider style={{ margin: '12px 0' }} />

              {/* Short Descriptor */}
              {deal.shortDescriptor && (
                <Text strong style={{ display: 'block', marginBottom: 12, fontSize: '110%' }}>
                  {deal.shortDescriptor}
                </Text>
              )}

              {/* Descriptor */}
              {deal.descriptor && (
                <Text style={{ display: 'block', marginBottom: 16 }}>
                  {deal.descriptor}
                </Text>
              )}

              {/* Deal Options */}
              {dealOptions.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 12 }}>
                    Choose Your Deal
                  </Text>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {dealOptions.map((option, index) => (
                      <Card
                        key={option.id || index}
                        size="small"
                        style={{
                          cursor: 'pointer',
                          border: `2px solid ${index === 0 ? token.colorPrimary : token.colorBorder}`,
                          background: index === 0 ? `${token.colorPrimary}08` : undefined,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ display: 'block' }}>
                              {option.name}
                            </Text>
                            <Space size="small" style={{ marginTop: 4 }}>
                              <Text
                                strong
                                style={{ fontSize: '120%', color: token.colorPrimary }}
                              >
                                ${option.grouponPrice}
                              </Text>
                              <Text delete type="secondary">
                                ${option.regularPrice}
                              </Text>
                              <Tag color="success" style={{ margin: 0 }}>
                                {Math.round(((option.regularPrice - option.grouponPrice) / option.regularPrice) * 100)}% off
                              </Tag>
                            </Space>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Space>
                </div>
              )}

              {/* Buy Button */}
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    background: token.colorPrimary,
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: token.borderRadius,
                    textAlign: 'center',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: selectedDevice === 'mobile' ? 14 : 16,
                  }}
                >
                  Buy Now
                </div>
              </div>

              {/* Fine Print / Additional Info */}
              <div style={{ marginTop: 20, padding: 12, background: token.colorBgLayout, borderRadius: token.borderRadius }}>
                <Text type="secondary" style={{ fontSize: '90%' }}>
                  <strong>The Fine Print:</strong> Promotional value expires 120 days after purchase.
                  Amount paid never expires. Limit 1 per person, may buy 1 additional as gift.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Info */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {device.label} • {device.width}×{device.height}px
        </Text>
      </div>
    </Modal>
  );
};

export default DevicePreviewModal;
