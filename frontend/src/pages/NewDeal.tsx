import React, { useState, useEffect } from "react";
import { Card, Typography, Button, Space, Modal, Select, theme } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, FileText, Copy, ArrowRight } from "lucide-react";
import { deals, getMockDeal, getAccountLocationIds } from "../data/mockDeals";
import { saveDeal } from "../lib/api";
import AIGenerationFlow from "../components/AIGenerationFlow";
import AccountSelector from "../components/AccountSelector";
import { MerchantAccount } from "../data/merchantAccounts";

const { Title, Paragraph } = Typography;
const { useToken } = theme;

interface CreateOption {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action: () => void;
  featured?: boolean;
}

const NewDeal: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useToken();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showAIFlow, setShowAIFlow] = useState(false);
  const [accountSelectorVisible, setAccountSelectorVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] =
    useState<MerchantAccount | null>(null);

  useEffect(() => {
    if (mode === "ai") {
      setSelectedOption("ai");
      setAccountSelectorVisible(true);
    } else if (mode === "scratch") {
      setSelectedOption("scratch");
      setAccountSelectorVisible(true);
    } else if (mode === "duplicate") {
      const sourceId = searchParams.get("sourceId");
      if (sourceId) {
        // Navigate to deal detail with duplicate data
        navigate(`/deals/${sourceId}?duplicate=true`);
      } else {
        setDuplicateModalVisible(true);
      }
    }
  }, [mode, searchParams, navigate]);

  const handleCreateWithAI = () => {
    setSelectedOption("ai");
    setAccountSelectorVisible(true);
  };

  const handleCreateFromScratch = () => {
    setSelectedOption("scratch");
    setAccountSelectorVisible(true);
  };

  const handleAccountSelect = async (account: MerchantAccount) => {
    setSelectedAccount(account);
    setAccountSelectorVisible(false);

    if (selectedOption === "ai") {
      // Proceed to AI flow
      setShowAIFlow(true);
    } else if (selectedOption === "scratch") {
      // Create an empty deal and navigate to it
      const newDealId = `deal-${Date.now()}`;
      const baseDeal = getMockDeal(newDealId);

      const emptyDeal = {
        ...baseDeal,
        id: newDealId,
        title: "Untitled Deal",
        galleryTitle: "",
        status: "Draft",
        campaignStage: "draft" as const,
        draftSubStage: "prospecting" as const,
        location: account.name,
        accountId: account.id,
        locationIds: getAccountLocationIds(account.id),
        category: account.businessType,
        options: [], // Reset options for scratch deal
        content: {
          ...baseDeal.content,
          description: "",
          highlights: [],
          finePoints: [],
          media: [],
        },
      };

      try {
        await saveDeal(newDealId, emptyDeal);
        navigate(`/deals/${newDealId}?accountId=${account.id}`);
      } catch (error) {
        console.error("Error creating empty deal:", error);
      }
    }
  };

  const handleDuplicate = () => {
    setSelectedOption("duplicate");
    setDuplicateModalVisible(true);
  };

  const handleDuplicateConfirm = async () => {
    if (selectedDealId) {
      // Create a copy of the selected deal
      const newDealId = `deal-${Date.now()}`;
      const sourceDeal = deals.find((d) => d.id === selectedDealId);

      if (sourceDeal) {
        const duplicatedDeal = {
          ...sourceDeal,
          id: newDealId,
          title: `Copy of ${sourceDeal.title}`,
          status: "Draft",
          campaignStage: "draft" as const,
          draftSubStage: "prospecting" as const,
        };

        try {
          await saveDeal(newDealId, duplicatedDeal);
          navigate(`/deals/${newDealId}`);
        } catch (error) {
          console.error("Error duplicating deal:", error);
        }
      }
    }
    setDuplicateModalVisible(false);
  };

  const options: CreateOption[] = [
    {
      key: "ai",
      icon: <Sparkles size={32} />,
      title: "Generate with AI",
      description:
        "Let AI help you create a deal with compelling content and suggestions",
      action: handleCreateWithAI,
      featured: true,
    },
    {
      key: "scratch",
      icon: <FileText size={32} />,
      title: "Create from Scratch",
      description: "Start with a blank canvas and create your deal manually",
      action: handleCreateFromScratch,
    },
    {
      key: "duplicate",
      icon: <Copy size={32} />,
      title: "Duplicate Existing Deal",
      description: "Copy an existing deal and modify it to create a new one",
      action: handleDuplicate,
    },
  ];

  // If AI mode is active, show the AI generation flow
  if (showAIFlow) {
    return (
      <AIGenerationFlow
        preSelectedAccount={selectedAccount}
        onComplete={(dealId) => {
          navigate(`/deals/${dealId}`);
        }}
        onCancel={() => {
          setShowAIFlow(false);
          setSelectedAccount(null);
          navigate("/deals/new");
        }}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
          Create New Deal
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 16, margin: 0 }}>
          Choose how you'd like to create your new deal
        </Paragraph>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}
      >
        {options.map((option) => (
          <Card
            key={option.key}
            hoverable
            onClick={option.action}
            style={{
              height: "100%",
              border: option.featured
                ? `2px solid ${token.colorPrimary}`
                : undefined,
              position: "relative",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {option.featured && (
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  right: 16,
                  background: token.colorPrimary,
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                RECOMMENDED
              </div>
            )}

            <Space
              direction="vertical"
              size="large"
              style={{ width: "100%", flex: 1 }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  background: option.featured
                    ? `${token.colorPrimary}15`
                    : token.colorBgTextHover,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: option.featured
                    ? token.colorPrimary
                    : token.colorTextSecondary,
                }}
              >
                {option.icon}
              </div>

              <div>
                <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                  {option.title}
                </Title>
                <Paragraph type="secondary" style={{ margin: 0, fontSize: 14 }}>
                  {option.description}
                </Paragraph>
              </div>

              <Button
                type={option.featured ? "primary" : "default"}
                icon={<ArrowRight size={16} />}
                iconPosition="end"
                style={{ marginTop: "auto" }}
                block
              >
                {option.key === "ai"
                  ? "Start Generating"
                  : option.key === "scratch"
                  ? "Start Creating"
                  : "Choose Deal"}
              </Button>
            </Space>
          </Card>
        ))}
      </div>

      {/* Tips Section */}
      <Card
        style={{
          marginTop: 32,
          background: token.colorInfoBg,
          borderColor: token.colorInfoBorder,
        }}
      >
        <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
          💡 Tips for Creating Great Deals
        </Title>
        <Space direction="vertical" size="small">
          <Paragraph style={{ margin: 0, fontSize: 14 }}>
            <strong>Generate with AI:</strong> Best for quickly creating
            multiple deals with consistent quality
          </Paragraph>
          <Paragraph style={{ margin: 0, fontSize: 14 }}>
            <strong>Create from Scratch:</strong> Perfect when you have specific
            content ready and want full control
          </Paragraph>
          <Paragraph style={{ margin: 0, fontSize: 14 }}>
            <strong>Duplicate:</strong> Ideal for creating variations or running
            similar promotions
          </Paragraph>
        </Space>
      </Card>

      {/* Duplicate Modal */}
      <Modal
        title="Select Campaign"
        open={duplicateModalVisible}
        onOk={handleDuplicateConfirm}
        onCancel={() => setDuplicateModalVisible(false)}
        okText="Duplicate Campaign"
        okButtonProps={{ disabled: !selectedDealId }}
      >
        <div style={{ marginBottom: 16 }}>
          <Paragraph>
            Select a campaign to duplicate. All content will be copied to your
            new deal.
          </Paragraph>
          <Select
            style={{ width: "100%" }}
            placeholder="Select a campaign to duplicate"
            size="large"
            value={selectedDealId}
            onChange={(value) => setSelectedDealId(value)}
            options={deals.map((deal) => ({
              label: deal.title,
              value: deal.id,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
      </Modal>

      {/* Account Selector Modal for Scratch Mode */}
      <Modal
        title="Select Account"
        open={accountSelectorVisible}
        onCancel={() => setAccountSelectorVisible(false)}
        footer={null}
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Paragraph>
            Select a merchant account to create the deal for.
          </Paragraph>
          <AccountSelector
            onSelect={handleAccountSelect}
            selectedAccountId={selectedAccount?.id}
          />
        </div>
      </Modal>
    </div>
  );
};

export default NewDeal;
