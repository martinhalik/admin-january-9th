import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  theme,
  message,
  Tag,
  Input,
  Tooltip,
  Switch,
} from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Search, TrendingUp, Briefcase, Compass, FileText, Clock, Settings } from "lucide-react";
import { saveDeal } from "../lib/api";
import { getMockDeal, getAccountLocationIds } from "../data/mockDeals";
import { MerchantAccount } from "../data/merchantAccounts";
import { getMerchantAccountsWithOwners, getMerchantAccount } from "../data/accountOwnerAssignments";
import AICategorySelector from "./AICategorySelector";
import AIAdvisorySidebar from "./AIAdvisorySidebar";
import GoogleWorkspaceSidebar, { SIDEBAR_CONSTANTS } from "./GoogleWorkspaceSidebar";
import { DealOptionDetailsContent, DefaultSidebarContent } from "./DealDetail";
import { GeneratedOption } from "../lib/aiRecommendations";
import { 
  getActivityStatus, 
  getContactStatus, 
  getPotentialColor,
  getPotentialDescription 
} from "../lib/accountActivity";

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

// Sidebar layout constants
const AI_SIDEBAR_CONSTANTS = {
  WIDTH_DEFAULT: 420,
  WIDTH_MIN: 320,
  WIDTH_MAX: 700,
  TOP_OFFSET: 102, // Below AI generation header
} as const;

type FlowStep = "account" | "category" | "preview";
type FlowStage = "category" | "subcategory" | "options" | "review";

interface AIGenerationFlowProps {
  onComplete?: (dealId: string) => void;
  onCancel?: () => void;
  preSelectedAccount?: MerchantAccount | null;
  onSidebarWidthChange?: (width: number) => void;
}

const AIGenerationFlow: React.FC<AIGenerationFlowProps> = ({
  onCancel,
  preSelectedAccount,
  onSidebarWidthChange,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useToken();
  const [currentStep, setCurrentStep] = useState<FlowStep>(
    preSelectedAccount ? "category" : "account" // Skip account step if pre-selected
  );
  const [selectedAccount, setSelectedAccount] =
    useState<MerchantAccount | null>(preSelectedAccount || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expectations, setExpectations] = useState<{
    totalProjectedRevenue: number;
    totalProjectedOrders: number;
    marketDemand?: string;
    confidence?: number;
    seasonality?: string;
  } | null>(null);
  
  // Track category selector stage for sidebar and map
  const [categorySelectorStage, setCategorySelectorStage] = useState<FlowStage>("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  
  // Initialize sidebar state from URL params
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const widthParam = searchParams.get('sidebarWidth');
    const parsed = widthParam ? parseInt(widthParam, 10) : AI_SIDEBAR_CONSTANTS.WIDTH_DEFAULT;
    // Don't allow collapsed width (48) as expanded width - use default instead
    return parsed > 100 ? parsed : AI_SIDEBAR_CONSTANTS.WIDTH_DEFAULT;
  });
  
  // Google Workspace-style: track which tab is active (null = closed)
  const [activeRightSidebarTab, setActiveRightSidebarTab] = useState<string | null>(() => {
    return searchParams.get('rightTab') || 'discovery';
  });
  
  // Notify parent of sidebar width changes
  React.useEffect(() => {
    const rightSidebarTotalWidth = activeRightSidebarTab ? sidebarWidth + 56 : 56;
    onSidebarWidthChange?.(rightSidebarTotalWidth);
  }, [activeRightSidebarTab, sidebarWidth, onSidebarWidthChange]);
  
  // Track which view is shown in the right sidebar
  const [sidebarView, setSidebarView] = useState<"insights" | "option-details" | "settings">("insights");
  const [selectedOption, setSelectedOption] = useState<any | null>(null);
  const [useDecimals, setUseDecimals] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>(() => {
    return searchParams.get('sidebarTab') || 'discovery';
  });
  
  // Track settings panel state in content area
  const [contentSettingsOpen, setContentSettingsOpen] = useState(false);
  
  // Derived: settings are open if either sidebar shows settings OR content panel is open
  const settingsOpen = sidebarView === "settings" || contentSettingsOpen;
  
  // Ref to hold the option edit handler from AICategorySelector
  const optionEditHandlerRef = React.useRef<((optionId: string, field: string, value: any) => void) | null>(null);
  
  // Track if we auto-opened the sidebar for option/settings view
  const wasAutoOpenedRef = React.useRef<boolean>(false);

  // Ensure accountId is in URL if account is selected
  useEffect(() => {
    if (selectedAccount) {
      const currentAccountId = searchParams.get('accountId');
      if (currentAccountId !== selectedAccount.id) {
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('accountId', selectedAccount.id);
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [selectedAccount, searchParams, setSearchParams]);

  // Sync sidebar state to URL params
  useEffect(() => {
    const newParams = new URLSearchParams(window.location.search);
    
    // Update right sidebar tab (which tab is active/open)
    if (activeRightSidebarTab && activeRightSidebarTab !== 'discovery') {
      newParams.set('rightTab', activeRightSidebarTab);
    } else {
      newParams.delete('rightTab');
    }
    
    // Update sidebar width (only if not default and sidebar is open)
    if (activeRightSidebarTab && sidebarWidth !== AI_SIDEBAR_CONSTANTS.WIDTH_DEFAULT) {
      newParams.set('sidebarWidth', sidebarWidth.toString());
    } else {
      newParams.delete('sidebarWidth');
    }
    
    // Update content sidebar tab
    if (activeSidebarTab !== 'discovery') {
      newParams.set('sidebarTab', activeSidebarTab);
    } else {
      newParams.delete('sidebarTab');
    }
    
    // Only update if params actually changed
    const currentParams = new URLSearchParams(window.location.search);
    if (newParams.toString() !== currentParams.toString()) {
      setSearchParams(newParams, { replace: true });
    }
  }, [activeRightSidebarTab, sidebarWidth, activeSidebarTab, setSearchParams]);

  // Handle category selection stage changes
  const handleStageChange = React.useCallback((
    stage: 'category' | 'subcategory' | 'options',
    categoryId?: string,
    subcategoryId?: string
  ) => {
    setCategorySelectorStage(stage);
    if (categoryId) setSelectedCategory(categoryId);
    if (subcategoryId) setSelectedSubcategory(subcategoryId);
  }, []);

  const handleAccountSelect = React.useCallback(
    (accountId: string) => {
      const account = getMerchantAccount(accountId);
      if (!account) return;

      setSelectedAccount(account);
      setCurrentStep("category");
      
      // Update URL with accountId so it persists on refresh
      const newParams = new URLSearchParams(window.location.search);
      newParams.set('accountId', accountId);
      setSearchParams(newParams, { replace: true });
    },
    [setSearchParams]
  );

  const handleCategorySelect = React.useCallback(
    async (
      categoryId: string,
      subcategoryId: string | undefined,
      options: GeneratedOption[]
    ) => {
      if (!selectedAccount) return;

      // Create a new deal ID
      const newDealId = `deal-${Date.now()}`;

      // Create initial placeholder deal
      const baseDeal = getMockDeal(newDealId);
      const placeholderDeal = {
        ...baseDeal,
        id: newDealId,
        title: `New ${categoryId.replace("-", " ")} Deal for ${selectedAccount.name}`,
        galleryTitle: "",
        status: "Draft",
        campaignStage: "draft" as const,
        draftSubStage: "prospecting" as const,
        location: selectedAccount.name,
        accountId: selectedAccount.id,
        locationIds: getAccountLocationIds(selectedAccount.id),
        category: categoryId,
        subcategory: subcategoryId || categoryId,
        content: {
          ...baseDeal.content,
          description: `Experience the best that ${selectedAccount.name} has to offer with this exclusive deal.`,
          highlights: [
            {
              id: "h1",
              text: `Perfect for ${options[0]?.targetAudience || "all customers"}`,
            },
            {
              id: "h2",
              text: `Save up to ${Math.max(...options.map((o) => o.discount))}% off regular prices`,
            },
            {
              id: "h3",
              text: "Valid at all participating locations",
            },
          ],
          finePoints: [
            { id: "f1", text: "Valid for new and existing customers" },
            { id: "f2", text: "Appointment required" },
            { id: "f3", text: "Not valid with other offers" },
          ],
          media: [],
        },
        // Convert GeneratedOptions to DealOptions
        options: options.map((opt, index) => ({
          id: opt.id,
          name: opt.name,
          subtitle: "",
          details: opt.reasoning,
          regularPrice: opt.regularPrice,
          grouponPrice: opt.grouponPrice,
          discount: opt.discount,
          soldCount: 0,
          totalInventory: opt.projectedSales * 2, // 2x projected for inventory buffer
          availability: "available" as const,
          validity: "30 days from purchase",
          enabled: true,
          merchantPayout: Math.round(opt.grouponPrice * 0.7), // 70% payout
          status: "active" as const,
          sortOrder: index,
        })),
      };

      try {
        // Save placeholder deal
        await saveDeal(newDealId, placeholderDeal);

        message.success("Deal draft created successfully!");

        // Navigate to deal detail with AI generation flag and Content tab open
        navigate(
          `/deals/${newDealId}/content?aiGenerating=true&accountId=${selectedAccount.id}&category=${categoryId}`
        );
      } catch (error) {
        console.error("Error creating placeholder deal:", error);
        message.error("Error starting AI generation");
      }
    },
    [navigate, selectedAccount]
  );

  // Pre-selected account is handled by initializing currentStep to "category" above
  // No need for this effect anymore

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate("/deals");
    }
  };

  // If pre-selected account exists but hasn't been processed yet, show loading/blank
  // This prevents flash of account selection screen
  if (preSelectedAccount && !selectedAccount) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        minHeight: "400px" 
      }}>
        <Space direction="vertical" align="center" size="large">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: `${token.colorPrimary}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorPrimary,
            }}
          >
            <Sparkles size={32} />
          </div>
          <Text type="secondary">Loading AI Flow...</Text>
        </Space>
      </div>
    );
  }

  // Show category selector if account is selected (including pre-selected accounts after processing)
  if (currentStep === "category" && selectedAccount) {
    // Calculate total right sidebar width: tab bar (56px) + sidebar content when open
    const rightSidebarTotalWidth = activeRightSidebarTab ? sidebarWidth + 56 : 56;
    
    return (
      <>
        <AICategorySelector
          accountName={selectedAccount.name}
          account={selectedAccount}
          onCategorySelect={handleCategorySelect}
          onExpectationsChange={setExpectations}
          onStageChange={handleStageChange}
          onBack={() => {
            setCurrentStep("account");
            setSelectedAccount(null);
          }}
          sidebarWidth={rightSidebarTotalWidth}
          onOptionSelect={(option) => {
            setSelectedOption(option);
            setSidebarView("option-details");
            // Auto-open sidebar if closed and track that we did
            if (!activeRightSidebarTab) {
              setActiveRightSidebarTab('discovery');
              wasAutoOpenedRef.current = true;
            } else {
              wasAutoOpenedRef.current = false;
            }
          }}
          onOptionUpdate={(optionId, updatedOption) => {
            // Update the selectedOption if it's the one being edited
            if (selectedOption && selectedOption.id === optionId) {
              setSelectedOption(updatedOption);
            }
          }}
          onRegisterOptionEditHandler={(handler) => {
            optionEditHandlerRef.current = handler;
          }}
          useDecimals={useDecimals}
          onUseDecimalsChange={setUseDecimals}
          settingsOpen={settingsOpen}
          onSettingsToggle={(open) => {
            if (open) {
              // Opening settings
              setContentSettingsOpen(true);
              setSidebarView("settings");
              // Auto-open sidebar if closed and track that we did
              if (!activeRightSidebarTab) {
                setActiveRightSidebarTab('discovery');
                wasAutoOpenedRef.current = true;
              } else {
                wasAutoOpenedRef.current = false;
              }
            } else {
              // Closing settings
              setContentSettingsOpen(false);
              setSidebarView("insights");
              // If we auto-opened the sidebar, collapse it
              if (wasAutoOpenedRef.current) {
                setActiveRightSidebarTab(null);
                wasAutoOpenedRef.current = false;
              }
            }
          }}
        />
        <GoogleWorkspaceSidebar
          tabs={[
            { icon: Compass, label: 'Scout', value: 'discovery', tooltip: 'Deal Research & Insights' },
            { icon: Briefcase, label: 'Work', value: 'work', tooltip: 'Work & Tasks' },
            { icon: FileText, label: 'Files', value: 'files', tooltip: 'Attachments & Contracts' },
            { icon: Clock, label: 'History', value: 'history', tooltip: 'Changes & Activity' },
          ]}
          activeTab={activeRightSidebarTab}
          onTabChange={(tab) => {
            setActiveRightSidebarTab(tab);
            
            // When switching tabs (not collapsing), keep sidebar open but switch to insights view
            if (tab && tab !== activeRightSidebarTab) {
              setActiveSidebarTab(tab);
              // User explicitly switched tabs, so they want sidebar open - reset auto-open flag
              wasAutoOpenedRef.current = false;
              // Reset to insights view when switching tabs (clear option details/settings)
              if (sidebarView !== "insights") {
                setSidebarView("insights");
                setSelectedOption(null);
                setContentSettingsOpen(false);
              }
            }
            
            // When collapsing sidebar (tab becomes null), reset to insights view
            if (!tab && sidebarView !== "insights") {
              setSidebarView("insights");
              setSelectedOption(null);
              setContentSettingsOpen(false);
              wasAutoOpenedRef.current = false; // Reset flag when user explicitly collapses
            }
          }}
          showHeader={false}
          showBackButton={false}
          width={sidebarWidth}
          topOffset={AI_SIDEBAR_CONSTANTS.TOP_OFFSET}
          resizable={true}
          minWidth={AI_SIDEBAR_CONSTANTS.WIDTH_MIN}
          maxWidth={AI_SIDEBAR_CONSTANTS.WIDTH_MAX}
          storageKey="ai-generation"
          onWidthChange={(totalWidth) => {
            // GoogleWorkspaceSidebar returns total width (content + tab bar)
            // Extract just the content width for our state
            const contentWidth = activeRightSidebarTab ? totalWidth - 56 : AI_SIDEBAR_CONSTANTS.WIDTH_DEFAULT;
            setSidebarWidth(contentWidth);
          }}
          zIndex={SIDEBAR_CONSTANTS.Z_INDEX_HEADER}
          extraIcon={
            sidebarView === "option-details" && selectedOption ? {
              icon: FileText,
              label: 'Option',
              tooltip: 'Back to insights',
              onClick: () => {
                setSidebarView("insights");
                setSelectedOption(null);
                // If we auto-opened the sidebar, collapse it
                if (wasAutoOpenedRef.current) {
                  setActiveRightSidebarTab(null);
                  wasAutoOpenedRef.current = false;
                }
              },
              active: true
            } : sidebarView === "settings" ? {
              icon: Settings,
              label: 'Settings',
              tooltip: 'Back to insights',
              onClick: () => {
                setSidebarView("insights");
                setContentSettingsOpen(false);
                // If we auto-opened the sidebar, collapse it
                if (wasAutoOpenedRef.current) {
                  setActiveRightSidebarTab(null);
                  wasAutoOpenedRef.current = false;
                }
              },
              active: true
            } : undefined
          }
        >
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
          }}>
            {/* Scrollable Content */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
            }}>
              {sidebarView === "insights" ? (
                activeSidebarTab === "discovery" ? (
                  <AIAdvisorySidebar
                    stage={categorySelectorStage}
                    merchantAccount={selectedAccount}
                    selectedCategory={selectedCategory}
                    selectedSubcategory={selectedSubcategory}
                    expectations={expectations}
                    showSimilarDealsMap={selectedCategory !== null}
                  />
                ) : (
                  <DefaultSidebarContent
                    isNewDeal={true}
                    deal={null}
                    selectedMerchantAccount={selectedAccount}
                    activeTab={activeSidebarTab}
                  />
                )
              ) : sidebarView === "option-details" && selectedOption ? (
                <div style={{ padding: `${token.paddingLG}px` }}>
                  <DealOptionDetailsContent
                    option={selectedOption}
                    onUpdate={(field, value) => {
                      // Update through AICategorySelector's handler
                      if (optionEditHandlerRef.current && selectedOption) {
                        optionEditHandlerRef.current(selectedOption.id, field, value);
                      }
                    }}
                    onRemove={() => {
                      // Remove handled by AICategorySelector  
                      setSidebarView("insights");
                      setSelectedOption(null);
                    }}
                    onClose={() => {
                      // Close option details
                      setSidebarView("insights");
                      setSelectedOption(null);
                      // If we auto-opened the sidebar, collapse it
                      if (wasAutoOpenedRef.current) {
                        setActiveRightSidebarTab(null);
                        wasAutoOpenedRef.current = false;
                      }
                    }}
                    useDecimals={useDecimals}
                  />
                </div>
              ) : sidebarView === "settings" ? (
                <div style={{ padding: `${token.paddingLG}px` }}>
                  <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <div>
                      <Title level={5} style={{ marginBottom: 4 }}>Options Settings</Title>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Configure how deal options are displayed and calculated
                      </Text>
                    </div>
                    
                    <div style={{ 
                      padding: "16px", 
                      background: token.colorBgContainer, 
                      borderRadius: 8,
                      border: `1px solid ${token.colorBorder}`
                    }}>
                      <div style={{ 
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8
                      }}>
                        <div>
                          <Text strong style={{ display: "block", fontSize: 14 }}>Use Decimals</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Enable to use cents in pricing
                          </Text>
                        </div>
                        <Switch 
                          checked={useDecimals} 
                          onChange={setUseDecimals}
                        />
                      </div>
                      <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 12 }}>
                        When enabled, prices will be displayed with cents (e.g., $19.99 instead of $20)
                      </Text>
                    </div>
                  </Space>
                </div>
              ) : null}
            </div>
          </div>
        </GoogleWorkspaceSidebar>
      </>
    );
  }

  // Account selection screen
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: `${token.colorPrimary}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorPrimary,
            }}
          >
            <Sparkles size={24} />
          </div>
          <Title level={2} style={{ margin: 0 }}>
            AI Deal Generator
          </Title>
        </div>
        <Paragraph type="secondary" style={{ fontSize: 16, margin: 0 }}>
          Select a merchant account to generate a deal with AI
        </Paragraph>
      </div>

      {/* Account Selection */}
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          Select Merchant Account
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Choose the merchant account for this deal
        </Paragraph>

        {/* Search */}
        <Input
          placeholder="Search accounts..."
          prefix={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: 16 }}
          size="large"
        />

        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          {getMerchantAccountsWithOwners()
            .filter(
              (account) =>
                account.name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                account.businessType
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                account.location
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
            )
            .map((account) => (
              <Card
                key={account.id}
                hoverable
                onClick={() => handleAccountSelect(account.id)}
                size="small"
                style={{
                  cursor: "pointer",
                  border:
                    selectedAccount?.id === account.id
                      ? `2px solid ${token.colorPrimary}`
                      : undefined,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: `${token.colorPrimary}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: token.colorPrimary,
                      fontSize: 16,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {account.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <Text strong style={{ fontSize: 14 }}>
                        {account.name}
                      </Text>
                      <Tooltip title={getPotentialDescription(account)}>
                        <Tag
                          color={getPotentialColor(account.potential)}
                          icon={<TrendingUp size={11} />}
                          style={{ margin: 0, fontSize: 11 }}
                        >
                          {account.potential.toUpperCase()} ({account.potentialAnalysis.score}%)
                        </Tag>
                      </Tooltip>
                    </div>
                    <Text
                      type="secondary"
                      style={{ fontSize: 12, display: "block", marginBottom: 6 }}
                    >
                      {account.businessType} • {account.location}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Space size={[6, 6]} wrap>
                        {(() => {
                          const activityStatus = getActivityStatus(account);
                          const contactStatus = getContactStatus(account);
                          
                          return (
                            <>
                              {activityStatus && (
                                <Tag
                                  color={activityStatus.color}
                                  style={{ 
                                    fontSize: 11, 
                                    margin: 0, 
                                    padding: "2px 8px", 
                                    fontWeight: 500,
                                    border: `1px solid ${activityStatus.color === 'red' ? '#ff4d4f' : 'transparent'}`,
                                  }}
                                >
                                  {activityStatus.label}
                                </Tag>
                              )}
                              {contactStatus && (
                                <Tag
                                  color={contactStatus.color}
                                  style={{ fontSize: 10, margin: 0, padding: "2px 6px" }}
                                >
                                  {contactStatus.label}
                                </Tag>
                              )}
                              <Tag 
                                color="default"
                                style={{ fontSize: 10, margin: 0, padding: "2px 6px" }}
                              >
                                {account.dealsCount} deal{account.dealsCount !== 1 ? 's' : ''}
                              </Tag>
                            </>
                          );
                        })()}
                      </Space>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </Space>

        <Space
          style={{
            width: "100%",
            justifyContent: "flex-end",
            marginTop: 24,
          }}
        >
          <Button size="large" onClick={handleCancel}>
            Cancel
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default AIGenerationFlow;
