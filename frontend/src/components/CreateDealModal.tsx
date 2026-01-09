import React, { useState } from "react";
import {
  Modal,
  Card,
  Space,
  Typography,
  Button,
  theme,
  message,
  Input,
  Tag,
  Image,
  App,
} from "antd";
import {
  Sparkles,
  FileText,
  ArrowRight,
  ArrowLeft,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AccountSelector from "./AccountSelector";
import { MerchantAccount } from "../data/merchantAccounts";
import { deals } from "../data/mockDeals";
import { saveDeal } from "../lib/api";

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

interface CreateDealModalProps {
  open: boolean;
  onClose: () => void;
}

type CreateMode = "ai" | "scratch" | "duplicate";
type ModalStep = "select-mode" | "select-account" | "select-deal";

const CreateDealModal: React.FC<CreateDealModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { token } = useToken();
  const { modal } = App.useApp();
  const [currentStep, setCurrentStep] = useState<ModalStep>("select-mode");
  const [selectedMode, setSelectedMode] = useState<CreateMode | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<MerchantAccount | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dealSearchQuery, setDealSearchQuery] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      modal.confirm({
        title: 'Discard progress?',
        content: 'Are you sure you want to leave? Your selection will be lost.',
        okText: 'Discard',
        okType: 'danger',
        cancelText: 'Stay',
        zIndex: 1100,
        onOk: () => {
          // Reset state when closing
          setCurrentStep("select-mode");
          setSelectedMode(null);
          setSelectedAccount(null);
          setSelectedDealId(null);
          setIsProcessing(false);
          setDealSearchQuery("");
          setHasUnsavedChanges(false);
          onClose();
        },
      });
    } else {
      // Reset state when closing
      setCurrentStep("select-mode");
      setSelectedMode(null);
      setSelectedAccount(null);
      setSelectedDealId(null);
      setIsProcessing(false);
      setDealSearchQuery("");
      onClose();
    }
  };

  const handleModeSelect = (mode: CreateMode) => {
    setSelectedMode(mode);
    // Don't set hasUnsavedChanges here - user hasn't made a real selection yet
    // Just navigating to view options isn't a "change"

    if (mode === "duplicate") {
      setCurrentStep("select-deal");
    } else {
      setCurrentStep("select-account");
    }
  };

  const handleAccountSelect = async (account: MerchantAccount) => {
    setSelectedAccount(account);
    setIsProcessing(true);

    try {
      if (selectedMode === "ai") {
        // Use integrated AI generation flow
        // Clear unsaved changes flag before navigating to prevent discard modal
        setHasUnsavedChanges(false);
        
        // Reset state
        setCurrentStep("select-mode");
        setSelectedMode(null);
        setSelectedAccount(null);
        setIsProcessing(false);
        
        // Close modal and navigate
        onClose();
        navigate(`/deals/ai-generator?accountId=${account.id}`);
      } else if (selectedMode === "scratch") {
        // Open DCT (Deal Creation Tool) in a new tab
        const dctUrl = `https://www.groupon.com/merchant/center/draft/campaign-selection?mid=${account.permalink}&internal=true`;
        window.open(dctUrl, "_blank", "noopener,noreferrer");
        message.success("Deal Creation Tool opened in a new tab");
        handleClose();
      }
    } catch (error) {
      console.error("Error opening external tool:", error);
      message.error("Error opening external tool");
      setIsProcessing(false);
    }
  };

  const handleDealSelect = async (dealId: string) => {
    setSelectedDealId(dealId);
    setIsProcessing(true);

    try {
      const newDealId = `deal-${Date.now()}`;
      const sourceDeal = deals.find((d) => d.id === dealId);

      if (sourceDeal) {
        const duplicatedDeal = {
          ...sourceDeal,
          id: newDealId,
          title: `Copy of ${sourceDeal.title}`,
          status: "Draft",
          campaignStage: "draft" as const,
          draftSubStage: "prospecting" as const,
        };

        await saveDeal(newDealId, duplicatedDeal);
        handleClose();
        navigate(`/deals/${newDealId}`);
      }
    } catch (error) {
      console.error("Error duplicating deal:", error);
      message.error("Error duplicating deal");
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep === "select-account" || currentStep === "select-deal") {
      setCurrentStep("select-mode");
      setSelectedMode(null);
      setDealSearchQuery("");
      setHasUnsavedChanges(false);
    }
  };

  const createOptions = [
    {
      key: "ai" as CreateMode,
      icon: <Sparkles size={24} />,
      title: "Generate with AI",
      badge: "AI DG powered",
      badgeColor: token.colorPrimary,
      description: (
        <>
          Let AI create compelling content automatically. Only available for{" "}
          <strong>US local</strong> accounts.
        </>
      ),
      featured: true,
      disabled: false,
    },
    {
      key: "scratch" as CreateMode,
      icon: <FileText size={24} />,
      title: "Create from Scratch",
      badge: "DCT powered",
      badgeColor: token.colorWarning,
      description: "Start with a blank canvas",
      featured: false,
      disabled: false,
    },
  ];

  const getModalTitle = () => {
    switch (currentStep) {
      case "select-mode":
        return "Create New Deal";
      case "select-account":
        return selectedMode === "ai"
          ? "Generate Deal with AI"
          : "Create Deal from Scratch";
      case "select-deal":
        return "Select Deal to Duplicate";
      default:
        return "Create New Deal";
    }
  };

  const getModalWidth = () => {
    // Keep consistent width across all steps
    return 800;
  };

  const renderFooter = () => {
    // No footer needed - actions happen automatically
    return null;
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={renderFooter()}
      width={getModalWidth()}
      centered
      destroyOnHidden
      maskClosable={true}
      styles={{
        body: {
          padding: 0,
          height:
            currentStep === "select-account" || currentStep === "select-deal"
              ? "550px"
              : "auto",
          minHeight:
            currentStep === "select-account" || currentStep === "select-deal"
              ? "550px"
              : "auto",
          maxHeight: "calc(100vh - 200px)",
          display: "flex",
          flexDirection: "column",
          borderRadius: token.borderRadiusLG,
          overflow: "hidden",
        },
        content: {
          padding: 0,
        },
      }}
    >
      {/* Fixed Header */}
      <div
        style={{
          background: token.colorBgContainer,
          position: "sticky",
          top: 0,
          zIndex: 1,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          borderTopLeftRadius: token.borderRadiusLG,
          borderTopRightRadius: token.borderRadiusLG,
        }}
      >
        <div
          style={{
            padding: `${token.paddingLG}px ${token.paddingLG}px ${token.paddingSM}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: token.marginSM,
              marginBottom: token.marginXS,
            }}
          >
            {currentStep !== "select-mode" && (
              <Button
                type="text"
                icon={<ArrowLeft size={18} />}
                onClick={handleBack}
                disabled={isProcessing}
                style={{
                  padding: token.paddingXS,
                  height: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            )}
            <Title level={3} style={{ margin: 0, flex: 1 }}>
              {getModalTitle()}
            </Title>
          </div>

          {currentStep === "select-mode" && (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Choose how you'd like to create your deal
            </Paragraph>
          )}

          {currentStep === "select-account" && (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {selectedMode === "ai"
                ? "Select a merchant account to generate AI-powered deal content"
                : "Select a merchant account to start building your deal"}
            </Paragraph>
          )}

          {currentStep === "select-deal" && (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Select a deal to duplicate. All content will be copied to your new
              deal.
            </Paragraph>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflow: currentStep === "select-account" ? "hidden" : "auto",
          padding: currentStep === "select-account" ? 0 : token.paddingLG,
          paddingBottom: currentStep === "select-account" ? 0 : token.paddingXL, // Extra padding at bottom to prevent cropping
          display: "flex",
          flexDirection: "column",
          minHeight: 0, // Critical for flex scrolling
        }}
      >
        {/* Step 1: Select Creation Mode */}
        {currentStep === "select-mode" && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {createOptions.map((option) => (
              <Card
                key={option.key}
                hoverable={!option.disabled}
                onClick={() => !option.disabled && handleModeSelect(option.key)}
                style={{
                  cursor: option.disabled ? "not-allowed" : "pointer",
                  border: option.featured
                    ? `2px solid ${token.colorPrimary}`
                    : undefined,
                  position: "relative",
                  transition: "all 0.3s ease",
                  opacity: option.disabled ? 0.5 : 1,
                }}
                styles={{
                  body: {
                    padding: token.padding,
                  },
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: token.margin,
                  }}
                >
                  <div
                    style={{
                      width: token.controlHeightLG,
                      height: token.controlHeightLG,
                      borderRadius: token.borderRadiusLG,
                      background: option.featured
                        ? `${token.colorPrimary}15`
                        : token.colorBgTextHover,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: option.featured
                        ? token.colorPrimary
                        : token.colorText,
                      flexShrink: 0,
                    }}
                  >
                    {option.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: token.marginXS,
                        marginBottom: token.marginXXS,
                      }}
                    >
                      <Title
                        level={5}
                        style={{
                          margin: 0,
                          fontSize: token.fontSizeLG,
                        }}
                      >
                        {option.title}
                      </Title>
                      {option.badge && (
                        <Tag
                          color={option.badgeColor}
                          style={{
                            margin: 0,
                            fontSize: token.fontSizeSM,
                            fontWeight: token.fontWeightStrong,
                          }}
                        >
                          {option.badge}
                        </Tag>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: token.fontSize }}>
                      {option.description}
                    </Text>
                  </div>
                  {!option.disabled && (
                    <ArrowRight
                      size={20}
                      style={{ color: token.colorTextSecondary, flexShrink: 0 }}
                    />
                  )}
                </div>
              </Card>
            ))}
          </Space>
        )}

        {/* Step 2: Select Account (for AI or Scratch) */}
        {currentStep === "select-account" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <AccountSelector
              onSelect={handleAccountSelect}
              selectedAccountId={selectedAccount?.id}
            />
          </div>
        )}

        {/* Step 3: Select Deal to Duplicate */}
        {currentStep === "select-deal" && (
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            {/* Search - Always visible */}
            <div style={{ marginBottom: token.marginSM }}>
              <Input
                placeholder="Search deals..."
                prefix={<Search size={16} />}
                value={dealSearchQuery}
                onChange={(e) => setDealSearchQuery(e.target.value)}
                size="large"
                allowClear
              />
            </div>

            {/* Deal List - Scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "visible",
                height: "400px",
                minHeight: "400px",
                maxHeight: "400px",
                paddingRight: token.paddingXS,
                paddingBottom: token.paddingSM, // Extra padding to prevent shadow cropping
              }}
            >
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                {deals
                  .filter(
                    (deal) =>
                      deal.title
                        .toLowerCase()
                        .includes(dealSearchQuery.toLowerCase()) ||
                      deal.location
                        .toLowerCase()
                        .includes(dealSearchQuery.toLowerCase()) ||
                      deal.category
                        .toLowerCase()
                        .includes(dealSearchQuery.toLowerCase())
                  )
                  .map((deal) => {
                    const featuredImage =
                      deal.content?.media?.find(
                        (media: any) => media.isFeatured
                      ) || deal.content?.media?.[0];
                    const imageUrl =
                      featuredImage?.url || "/images/ai/chef-cooking.jpg";

                    return (
                      <Card
                        key={deal.id}
                        hoverable
                        onClick={() => handleDealSelect(deal.id)}
                        size="small"
                        style={{
                          cursor: "pointer",
                          border:
                            selectedDealId === deal.id
                              ? `2px solid ${token.colorPrimary}`
                              : undefined,
                          transition: "all 0.2s ease",
                          opacity:
                            isProcessing && selectedDealId === deal.id
                              ? 0.6
                              : 1,
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
                            alignItems: "center",
                            gap: token.marginSM,
                          }}
                        >
                          <Image
                            width={56}
                            height={56}
                            src={imageUrl}
                            alt={deal.title}
                            style={{
                              borderRadius: token.borderRadius,
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                            fallback="/images/ai/chef-cooking.jpg"
                            preview={false}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                marginBottom: token.marginXXS,
                              }}
                            >
                              <Text
                                strong
                                style={{
                                  fontSize: token.fontSize,
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {deal.title}
                              </Text>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: token.marginXS,
                                flexWrap: "wrap",
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{ fontSize: token.fontSizeSM }}
                              >
                                {deal.location}
                              </Text>
                              <Tag
                                color="blue"
                                style={{
                                  margin: 0,
                                  fontSize: token.fontSizeSM,
                                }}
                              >
                                {deal.category}
                              </Tag>
                              <Tag
                                color={
                                  deal.status === "Live" ? "green" : "default"
                                }
                                style={{
                                  margin: 0,
                                  fontSize: token.fontSizeSM,
                                }}
                              >
                                {deal.status}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </Space>

              {deals.filter(
                (deal) =>
                  deal.title
                    .toLowerCase()
                    .includes(dealSearchQuery.toLowerCase()) ||
                  deal.location
                    .toLowerCase()
                    .includes(dealSearchQuery.toLowerCase()) ||
                  deal.category
                    .toLowerCase()
                    .includes(dealSearchQuery.toLowerCase())
              ).length === 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    textAlign: "center",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: token.fontSize }}>
                    No deals found
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CreateDealModal;
