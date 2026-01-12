import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import ContentEditor from "../components/ContentEditor";
import OptionsListSidebar from "../components/ContentEditor/OptionsListSidebar";
import OptionEditSidebar from "../components/ContentEditor/OptionEditSidebar";
import BusinessTabContent from "../components/Settings/BusinessTabContent";
import DynamicBreadcrumbs from "../components/Breadcrumbs";
import { useRecentlyViewed } from "../contexts/RecentlyViewedContext";
import GoogleWorkspaceSidebar from "../components/GoogleWorkspaceSidebar";
import AIAssistantPanel from "../components/AIAssistantPanel";
import {
  Card,
  Segmented,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Typography,
  theme,
  Dropdown,
  message,
  Spin,
  Progress,
  Skeleton,
  Switch,
  Divider,
  Image,
} from "antd";
// LineChart imports removed - now in DealStatsCard component
import {
  Star,
  TrendingUp,
  Edit2,
  Building2,
  MoreVertical,
  Image as ImageIcon,
  Users,
  User,
  CircleCheck,
  Sparkles,
  FileText,
  Compass,
  Briefcase,
  Clock,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import {
  Deal,
  ChartDataPoint,
  // Recommendation,
} from "../data/mockDeals";
import { getSimilarDeals } from "../data/similarDeals";
import { getCompetitorDeals } from "../data/competitorDeals";
import { getDeal, updateDealFields } from "../lib/api";
import {
  getMerchantAccount,
  MerchantAccount,
  merchantAccounts,
} from "../data/merchantAccounts";
import { SalesforceIcon, GrouponIcon } from "../components/icons/";
import {
  DealOptionDetailsContent,
  TitleSettingsContent,
  DefaultSidebarContent,
  DefaultSidebarTabs,
  LibrarySidebarContent,
  AccountSelectorSidebarContent,
  PersonDetailContent,
  DealStatsCard,
  DealHeaderInfo,
  DealSummaryCard,
  DealRolesCard,
  SimilarDealsCard,
  NearbyCompetitorDealsCard,
  DealRecommendationsCard,
  DealHeaderActions,
} from "../components/DealDetail";
import {
  ACTION_MENU_ITEMS,
} from "../components/DealDetail/constants.tsx";
import CampaignStages from "../components/CampaignStages";
import ManagerReviewPanel from "../components/ManagerReviewPanel";
import DevicePreviewModal from "../components/DevicePreviewModal";
import { useRoleView } from "../contexts/RoleViewContext";
import { 
  getEmployeeById, 
  loadEmployees, 
  updateHierarchyData 
} from "../data/companyHierarchy";

const { Title, Text } = Typography;
const { useToken } = theme;

// Layout constants
const LAYOUT_CONSTANTS = {
  DESKTOP_BREAKPOINT: 1024,
  TABLET_BREAKPOINT: 1200,
  SIDEBAR_WIDTH_DEFAULT: 384,
  SIDEBAR_WIDTH_MIN: 300,
  SIDEBAR_WIDTH_MAX: 800,
  HEADER_TOP_OFFSET: 164, // 64px nav + 47px breadcrumb + 53px tabs
  TRANSITION_DURATION: '0.3s',
} as const;

// Device Preview Content Component
const DevicePreviewContent: React.FC<{
  deal: Deal | null;
  merchant?: MerchantAccount | null;
  token: any;
  windowWidth: number;
}> = ({ deal, merchant, token, windowWidth }) => {
  const [selectedDevice, setSelectedDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  if (!deal) {
    return <Text type="secondary">No deal data available</Text>;
  }

  const DEVICE_DIMENSIONS = {
    mobile: {
      width: 375,
      height: 667,
      scale: 0.8,
      label: 'Mobile',
    },
    tablet: {
      width: 768,
      height: 1024,
      scale: 0.6,
      label: 'Tablet',
    },
    desktop: {
      width: 1440,
      height: 900,
      scale: 0.5,
      label: 'Desktop',
    },
  };

  const device = DEVICE_DIMENSIONS[selectedDevice];
  const featuredImage = deal.content?.media?.[0]?.url || "";
  const dealOptions = deal.options || [];
  const scaledWidth = device.width * device.scale;
  const scaledHeight = device.height * device.scale;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Device Selector */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Segmented
          value={selectedDevice}
          onChange={(value) => setSelectedDevice(value as 'mobile' | 'tablet' | 'desktop')}
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
          minHeight: 600,
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
                  <img
                    src={featuredImage}
                    alt={deal.title}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
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
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {device.label} • {device.width}×{device.height}px
        </Text>
      </div>
    </Space>
  );
};

const DealDetail = () => {
  const params = useParams<{
    id?: string;
    dealId?: string;
    accountId?: string;
    view?: string;
  }>();
  // Support both /deals/:id and /accounts/:accountId/deals/:dealId
  const id = params.id || params.dealId;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useToken();
  const { currentRole, currentUser } = useRoleView();
  // const { toggleFavorite, isFavorite } = useFavorites();
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  // Ensure employees are loaded
  useEffect(() => {
    loadEmployees().then(employees => {
      if (employees.length > 0) {
        updateHierarchyData(employees);
      }
    }).catch(err => console.error('[DealDetail] Error loading employees:', err));
  }, []);
  
  // Get current employee data
  const currentEmployee = getEmployeeById(currentUser.employeeId);
  const accountOwnerInitials = currentUser.name.split(' ').map(n => n[0]).join('');
  // Check if deal is already generated (has content) - if so, skip AI generating mode
  const isDealAlreadyGenerated = (dealToCheck: Deal | null): boolean => {
    if (!dealToCheck) return false;
    // Check if deal has meaningful generated content
    return !!(
      dealToCheck.content?.description &&
      dealToCheck.content.description.length > 100 &&
      dealToCheck.content?.highlights &&
      dealToCheck.content.highlights.length > 0
    );
  };
  
  const [isAIGenerating, setIsAIGenerating] = useState(() => {
    const hasAIParam = searchParams.get("aiGenerating") === "true";
    return hasAIParam;
  });
  
  // Load deal immediately if AI is generating to avoid loading flash
  const [deal, setDeal] = useState<Deal | null>(null);
  
  // Initialize loading to false if AI is generating OR if deal is already complete
  const [loading, setLoading] = useState(() => {
    if (isAIGenerating) return false; // AI has its own progress UI
    return true; // Show loading skeleton for new/incomplete deals
  });
  const [loadingStep, setLoadingStep] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiGenerationPhase, setAiGenerationPhase] = useState<number>(0); // 0=none, 1=content, 2=images, 3=redemption, 4=fineprint

  // Check if this is a newly created deal
  const isNewDeal = Boolean(
    deal &&
      (deal.id.startsWith("deal-") || // AI generated or from scratch
        (deal.status === "Draft" &&
          (!deal.content.description ||
            deal.content.description.length === 0 ||
            deal.title === "Untitled Deal")))
  );

  // Check if this is a "from scratch" deal without account
  const isFromScratch = deal && deal.title === "Untitled Deal";
  
  // Use URL path parameter for active view (with fallback to query param for backward compatibility, then Overview)
  // Normalize view from URL to display format (lowercase to TitleCase)
  const normalizeViewFromUrl = (urlView: string | undefined): string => {
    if (!urlView) {
      // Default to Content for draft deals, Overview for others
      return deal?.campaignStage === "draft" ? 'Content' : 'Overview';
    }
    // Convert URL format (lowercase/kebab-case) to display format (TitleCase with spaces)
    // e.g., "business-details" or "business details" -> "Business Details"
    return urlView
      .split(/[\s-]+/) // Split by spaces or hyphens
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  const activeView = normalizeViewFromUrl(params.view) || searchParams.get('view') || (deal?.campaignStage === "draft" ? 'Content' : 'Overview');
  
  const setActiveView = (view: string | number) => {
    const viewStr = String(view);
    // Convert to lowercase and replace spaces with hyphens for URL
    const urlView = viewStr.toLowerCase().replace(/\s+/g, '-');
    const accountId = params.accountId || searchParams.get("accountId");
    
    // Construct the new URL path
    if (accountId) {
      navigate(`/accounts/${accountId}/deals/${id}/${urlView}`, { replace: true });
    } else {
      navigate(`/deals/${id}/${urlView}`, { replace: true });
    }
  };
  const [timePeriod, setTimePeriod] = useState<"30days" | "7days" | "total">(
    "30days"
  );
  const [selectedMetric, setSelectedMetric] = useState<string>("grossProfit");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Initialize sidebar state from URL params
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const widthParam = searchParams.get('sidebarWidth');
    const parsed = widthParam ? parseInt(widthParam, 10) : LAYOUT_CONSTANTS.SIDEBAR_WIDTH_DEFAULT;
    // Don't allow collapsed width (48) as expanded width - use default instead
    return parsed > 100 ? parsed : LAYOUT_CONSTANTS.SIDEBAR_WIDTH_DEFAULT;
  });
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);
  // Google Workspace-style: track which tab is active (null = closed)
  const [activeRightSidebarTab, setActiveRightSidebarTab] = useState<string | null>(() => {
    return searchParams.get('rightTab') || 'discovery';
  });

  // Device preview modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Universal sidebar state
  const [sidebarView, setSidebarView] = useState<
    | "default"
    | "option-details"
    | "library"
    | "account-selector"
    | "title-settings"
    | "ai-assistant"
    | "person-details"
    | "settings"
  >("default");
  const [selectedOption, setSelectedOption] = useState<any | null>(null);
  
  // Track settings panel state in options list sidebar
  const [optionsListSettingsOpen, setOptionsListSettingsOpen] = useState(false);
  const [useDecimals, setUseDecimals] = useState(false);
  
  // Derived: settings are open if either sidebar shows settings OR options list panel is open
  const settingsOpen = sidebarView === "settings" || optionsListSettingsOpen;
  
  // Track if we auto-opened the sidebar for option/settings view
  const wasAutoOpenedRef = React.useRef<boolean>(false);
  const [libraryData, setLibraryData] = useState<any | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [libraryTab, setLibraryTab] = useState("merchant");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryMediaType, setLibraryMediaType] = useState<"image" | "video">(
    "image"
  );
  const [defaultSidebarTab, setDefaultSidebarTab] = useState<string>(() => {
    return searchParams.get('sidebarTab') || 'discovery';
  });
  
  // Wrapper to auto-open sidebar when switching to interactive views
  const changeSidebarView = (view: typeof sidebarView) => {
    setSidebarView(view);
    // Auto-open sidebar for interactive views
    if (view !== "default" && !activeRightSidebarTab) {
      setActiveRightSidebarTab('discovery');
      wasAutoOpenedRef.current = true;
    } else if (view !== "default" && activeRightSidebarTab) {
      // Sidebar was already open, we didn't auto-open it
      wasAutoOpenedRef.current = false;
    }
  };

  // Check for AI Assistant URL parameter
  React.useEffect(() => {
    if (searchParams.get('aiAssistant') === 'true') {
      changeSidebarView('ai-assistant');
      // Remove the parameter so it doesn't persist on navigation
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('aiAssistant');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams]);

  // Redirect to Content tab if draft deal is on Overview or Reviews tab
  React.useEffect(() => {
    if (deal?.campaignStage === "draft" && (activeView === "Overview" || activeView === "Reviews")) {
      setActiveView("Content");
    }
  }, [deal?.campaignStage, activeView]);

  // Mock person data - use current user as account owner
  const mockPeople: Record<string, any> = {
    [currentUser.employeeId]: {
      id: currentUser.employeeId,
      name: currentUser.name,
      title: currentEmployee?.roleTitle || 'Account Manager',
      role: 'Account Owner',
      initials: accountOwnerInitials,
      color: '#4CAF50',
      email: currentEmployee?.email || '',
      phone: currentEmployee?.phone || '',
      location: currentEmployee?.location || 'Chicago (35 W. Wacker Dr.)',
      timezone: 'CST',
      localTime: '9:47 AM',
      managers: currentEmployee?.managerId ? [
        {
          id: currentEmployee.managerId,
          name: getEmployeeById(currentEmployee.managerId)?.name || '',
          title: getEmployeeById(currentEmployee.managerId)?.roleTitle || '',
          initials: getEmployeeById(currentEmployee.managerId)?.name.split(' ').map(n => n[0]).join('') || '',
          color: '#2196F3',
        },
      ] : [],
      reports: currentEmployee?.directReports?.map(reportId => {
        const report = getEmployeeById(reportId);
        return report ? {
          id: report.id,
          name: report.name,
          title: report.roleTitle,
          initials: report.name.split(' ').map(n => n[0]).join(''),
          color: '#2196F3',
        } : null;
      }).filter(Boolean) || [],
    },
    'kn-001': {
      id: 'kn-001',
      name: 'Kamila Novak',
      title: 'Deal Manager',
      role: 'Deal Owner',
      initials: 'KN',
      color: '#2196F3',
      email: 'knovak@groupon.com',
      phone: '+1 (312) 555-0456',
      location: 'Chicago (35 W. Wacker Dr.)',
      timezone: 'CST',
      localTime: '9:47 AM',
      managers: [
        {
          id: currentUser.employeeId,
          name: currentUser.name,
          title: currentEmployee?.roleTitle || 'Account Manager',
          initials: accountOwnerInitials,
          color: '#4CAF50',
        },
      ],
      reports: [],
    },
    'mr-001': {
      id: 'mr-001',
      name: 'Maria Rodriguez',
      title: 'Content Editor',
      role: 'Content Editor',
      initials: 'MR',
      color: '#FF9800',
      email: 'mrodriguez@groupon.com',
      location: 'Chicago (35 W. Wacker Dr.)',
      timezone: 'CST',
      localTime: '9:47 AM',
      managers: [
        {
          id: currentUser.employeeId,
          name: currentUser.name,
          title: currentEmployee?.roleTitle || 'Account Manager',
          initials: accountOwnerInitials,
          color: '#4CAF50',
        },
      ],
      reports: [],
    },
    'dl-001': {
      id: 'dl-001',
      name: 'David Lee',
      title: 'Image Editor',
      role: 'Image Editor',
      initials: 'DL',
      color: '#9C27B0',
      email: 'dlee@groupon.com',
      location: 'Chicago (35 W. Wacker Dr.)',
      timezone: 'CST',
      localTime: '9:47 AM',
      managers: [
        {
          id: currentUser.employeeId,
          name: currentUser.name,
          title: currentEmployee?.roleTitle || 'Account Manager',
          initials: accountOwnerInitials,
          color: '#4CAF50',
        },
      ],
      reports: [],
    },
  };

  // Handle person click
  const handlePersonClick = (personId: string) => {
    const person = mockPeople[personId];
    if (person) {
      setSelectedPerson(person);
      changeSidebarView('person-details');
    }
  };

  // Options sidebar state (parent/child pattern) - open by default
  const [optionsListOpen, setOptionsListOpen] = useState(true);
  const [optionEditOpen, setOptionEditOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any | null>(null);


  // Calculate total sidebar width including tab bar + right sidebar + options sidebars (only on Content tab)
  const optionsSidebarWidth = (activeView === "Content" && optionsListOpen) ? (optionEditOpen ? 840 : 420) : 0;
  const isMobile = windowWidth < LAYOUT_CONSTANTS.TABLET_BREAKPOINT;
  // Tab bar (56px on desktop only) + sidebar content when open
  // When collapsed (activeRightSidebarTab is null), only show tab bar (56px)
  // When open (activeRightSidebarTab has a value), show tab bar + sidebar width
  const rightSidebarTotalWidth = isMobile 
    ? (activeRightSidebarTab ? sidebarWidth : 0) 
    : (activeRightSidebarTab ? sidebarWidth + 56 : 56);
  const totalSidebarWidth = rightSidebarTotalWidth + optionsSidebarWidth;

  // Merchant account state - Initialize immediately from URL if available
  const [selectedMerchantAccount, setSelectedMerchantAccount] =
    useState<MerchantAccount | null>(() => {
      const accountIdFromUrl = params.accountId || searchParams.get("accountId");
      if (accountIdFromUrl) {
        const account = getMerchantAccount(accountIdFromUrl);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/eec779b3-74e7-4829-a8e6-818a27f11014',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DealDetail.tsx:710',message:'DealDetail merchant account from URL',data:{accountIdFromUrl,accountFound:!!account,accountName:account?.name,phone:account?.phone,contactEmail:account?.contactEmail,location:account?.location},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
        // #endregion
        return account || null;
      }
      return null;
    });

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
    if (activeRightSidebarTab && sidebarWidth !== LAYOUT_CONSTANTS.SIDEBAR_WIDTH_DEFAULT) {
      newParams.set('sidebarWidth', sidebarWidth.toString());
    } else {
      newParams.delete('sidebarWidth');
    }
    
    // Update content sidebar tab
    if (defaultSidebarTab !== 'discovery') {
      newParams.set('sidebarTab', defaultSidebarTab);
    } else {
      newParams.delete('sidebarTab');
    }
    
    // Only update if params actually changed
    const currentParams = new URLSearchParams(window.location.search);
    if (newParams.toString() !== currentParams.toString()) {
      setSearchParams(newParams, { replace: true });
    }
  }, [activeRightSidebarTab, sidebarWidth, defaultSidebarTab, setSearchParams]);

  // Summary editing state - Initialize immediately if deal is loaded
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [launchDate, setLaunchDate] = useState<dayjs.Dayjs | null>(() => {
    return deal?.dealStart ? dayjs(deal.dealStart, "DD. M. YYYY") : null;
  });
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(() => {
    return deal?.dealEnd ? dayjs(deal.dealEnd, "DD. M. YYYY") : null;
  });
  const [isContinuous, setIsContinuous] = useState(() => {
    return !deal?.dealEnd;
  });
  const [editableQuality, setEditableQuality] = useState(() => {
    return deal?.quality || "Ace";
  });
  const [editableDivision, setEditableDivision] = useState(() => {
    return deal?.division || "Chicago (USA)";
  });
  const [editableCategorySubcategoryPos, setEditableCategorySubcategoryPos] =
    useState(() => {
      return `${deal?.category || "Food & Drink"} - ${
        deal?.subcategory || "Restaurant"
      } - ${deal?.pos || "Mexican"}`.replace(/^ - | - $/g, "");
    });
  const [editableWeb, setEditableWeb] = useState(() => {
    return deal?.web || "example.com";
  });

  // Roles editing state - Initialize immediately if deal is loaded
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [editableAccountOwner, setEditableAccountOwner] = useState(() => {
    return deal?.roles?.accountOwner || "Unassigned";
  });
  const [editableWriter, setEditableWriter] = useState(() => {
    return deal?.roles?.writer || "John Peterson";
  });
  const [editableImageDesigner, setEditableImageDesigner] = useState(() => {
    return deal?.roles?.imageDesigner || "Aartiya Johrison";
  });
  const [editableOpportunityOwner, setEditableOpportunityOwner] = useState(() => {
    return deal?.roles?.opportunityOwner || currentUser.name;
  });

  // Overview autosave state
  const [overviewHasUnsavedChanges, setOverviewHasUnsavedChanges] =
    useState(false);
  const [overviewAutoSaveEnabled] = useState(true);
  const [overviewPublishedState, setOverviewPublishedState] =
    useState<any>(null);
  const overviewRenderCount = useRef(0);

  // Summary and Roles autosave state
  const [summaryHasUnsavedChanges, setSummaryHasUnsavedChanges] =
    useState(false);
  const [rolesHasUnsavedChanges, setRolesHasUnsavedChanges] = useState(false);
  const [summaryPublishedState, setSummaryPublishedState] = useState<any>(null);
  const [rolesPublishedState, setRolesPublishedState] = useState<any>(null);

  // Content autosave state
  const [contentHasUnsavedChanges, setContentHasUnsavedChanges] = useState(false);
  const [contentUnpublishedCount, setContentUnpublishedCount] = useState(0);
  const [contentIsSaving, setContentIsSaving] = useState(false);
  const [contentLastSaved, setContentLastSaved] = useState<Date | null>(null);
  const [contentPendingSave, setContentPendingSave] = useState(false);
  const contentEditorPublishRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchDeal();
  }, [id]);

  // Add to recently viewed if deal was loaded immediately (AI generation case)
  useEffect(() => {
    if (deal && isAIGenerating) {
      addToRecentlyViewed(deal);
    }
  }, []); // Run only once on mount

  // Scroll to top when component mounts (handles browser back/forward navigation)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Scroll to section if hash anchor is present
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove the # character
    if (hash && activeView === 'Content') {
      // Small delay to ensure the DOM is ready
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          // Calculate the proper offset based on sticky headers
          // Main nav (64px) + Breadcrumb (47px) + Tabs (53px) + Publishing header (60px) + padding (10px)
          const headerOffset = 234;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 300);
    }
  }, [activeView]);

  // Update state when deal changes
  useEffect(() => {
    if (deal) {
      // Update summary fields
      setEditableQuality(deal.quality || "Ace");
      setEditableDivision(deal.division || "Chicago (USA)");
      setEditableCategorySubcategoryPos(
        `${deal.category || "Food & Drink"} - ${
          deal.subcategory || "Restaurant"
        } - ${deal.pos || "Mexican"}`.replace(/^ - | - $/g, "")
      );
      setEditableWeb(deal.web || "example.com");

      // Update roles fields
      setEditableAccountOwner(deal.roles?.accountOwner || "Unassigned");
      setEditableWriter(deal.roles?.writer || "John Peterson");
      setEditableImageDesigner(deal.roles?.imageDesigner || "Aartiya Johrison");
      setEditableOpportunityOwner(
        deal.roles?.opportunityOwner || currentUser.name
      );

      // Update date fields
      if (deal.dealStart) {
        setLaunchDate(dayjs(deal.dealStart, "DD. M. YYYY"));
      }
      if (deal.dealEnd) {
        setEndDate(dayjs(deal.dealEnd, "DD. M. YYYY"));
        setIsContinuous(false);
      } else {
        setIsContinuous(true);
      }
    }
  }, [deal]);

  // Refetch deal data when switching to Overview tab to ensure featured image is up-to-date
  useEffect(() => {
    if (activeView === "Overview" && deal) {
      getDeal(id || "1").then((updatedDeal) => {
        setDeal(updatedDeal);
      }).catch((error) => {
        console.error("Error refetching deal:", error);
      });
    }
  }, [activeView, id]);

  // Show account selector for "from scratch" deals
  useEffect(() => {
    if (isFromScratch && !selectedMerchantAccount) {
      changeSidebarView("account-selector");
    }
  }, [isFromScratch]);

  // Auto-set merchant account when deal loads
  useEffect(() => {
    if (!deal || selectedMerchantAccount) return;

    // Try to get account from URL params first
    const accountIdFromUrl = params.accountId || searchParams.get("accountId");
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eec779b3-74e7-4829-a8e6-818a27f11014',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DealDetail.tsx:912',message:'Auto-set merchant account attempt',data:{dealId:deal?.id,dealAccountId:deal?.accountId,dealLocation:deal?.location,dealTitle:deal?.title,accountIdFromUrl,hasSelectedAccount:!!selectedMerchantAccount},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
    // #endregion
    if (accountIdFromUrl) {
      const account = getMerchantAccount(accountIdFromUrl);
      if (account) {
        setSelectedMerchantAccount(account);
        return;
      }
    }

    // Use the deal's accountId if it exists (most reliable)
    if (deal.accountId) {
      const account = getMerchantAccount(deal.accountId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/eec779b3-74e7-4829-a8e6-818a27f11014',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DealDetail.tsx:928',message:'Looking up account by deal.accountId',data:{dealAccountId:deal.accountId,accountFound:!!account,accountName:account?.name},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
      // #endregion
      if (account) {
        setSelectedMerchantAccount(account);
        return;
      }
    }

    // If no accountId, try to find account by matching deal location/name (fallback)
    const matchedAccount = merchantAccounts.find(
      (acc: any) =>
        deal.location
          ?.toLowerCase()
          .includes(acc.location.toLowerCase().split(",")[0]) ||
        deal.title
          ?.toLowerCase()
          .includes(acc.name.toLowerCase().split(" ")[0])
    );

    if (matchedAccount) {
      setSelectedMerchantAccount(matchedAccount);
    }
  }, [deal, params.accountId, searchParams, selectedMerchantAccount]);

  // Clean up aiGenerating parameter if deal is already complete
  useEffect(() => {
    const hasAIParam = searchParams.get("aiGenerating") === "true";
    
    if (hasAIParam && !isAIGenerating && deal && isDealAlreadyGenerated(deal)) {
      // Deal is already generated but URL still has aiGenerating param - clean it up
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("aiGenerating");
      newParams.delete("accountId");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, isAIGenerating, deal, setSearchParams]);

  // AI Generation Effect - Progressive content updates
  useEffect(() => {
    if (!isAIGenerating || !deal) return;

    const accountId = searchParams.get("accountId");
    if (!accountId) return;

    const account = getMerchantAccount(accountId);
    if (!account) return;

    // Update progress every second for 15 seconds with progressive content (faster!)
    let elapsed = 0;
    const TOTAL_DURATION = 15;
    const PHASE_1 = 3;    // 20% - Content ready
    const PHASE_2 = 7;    // 47% - Images ready
    const PHASE_3 = 11;   // 73% - Redemption ready
    const PHASE_4 = 15;   // 100% - Fine print ready

    const progressInterval = setInterval(() => {
      elapsed += 1;
      const progress = Math.min((elapsed / TOTAL_DURATION) * 100, 100);
      setAiProgress(progress);

      // Phase 1: Generate content (title, description, highlights)
      if (elapsed >= PHASE_1 && aiGenerationPhase < 1) {
        setAiGenerationPhase(1);
        generateContentPhase(account);
      }
      
      // Phase 2: Generate images
      if (elapsed >= PHASE_2 && aiGenerationPhase < 2) {
        setAiGenerationPhase(2);
        generateImagesPhase(account);
      }
      
      // Phase 3: Generate redemption & locations
      if (elapsed >= PHASE_3 && aiGenerationPhase < 3) {
        setAiGenerationPhase(3);
        generateRedemptionPhase();
      }
      
      // Phase 4: Generate fine print (complete)
      if (elapsed >= PHASE_4) {
        clearInterval(progressInterval);
        setAiGenerationPhase(4);
        generateFinePrintPhase();
      }
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [isAIGenerating, deal, aiGenerationPhase]);

  // Overview autosave effect
  useEffect(() => {
    if (!overviewAutoSaveEnabled || !overviewHasUnsavedChanges || !deal) return;

    const timer = setTimeout(() => {
      performOverviewSave(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    deal?.title,
    deal?.location,
    deal?.division,
    deal?.roles?.accountOwner,
    deal?.roles?.writer,
    deal?.roles?.imageDesigner,
    deal?.roles?.opportunityOwner,
    overviewAutoSaveEnabled,
    overviewHasUnsavedChanges,
  ]);

  // Mark overview content as changed
  useEffect(() => {
    if (!deal) return;

    // Increment render count
    overviewRenderCount.current += 1;

    // Skip the first few renders to allow initial setup
    if (overviewRenderCount.current <= 3) {
      return;
    }

    setOverviewHasUnsavedChanges(true);
  }, [
    deal?.title,
    deal?.location,
    deal?.division,
    deal?.roles?.accountOwner,
    deal?.roles?.writer,
    deal?.roles?.imageDesigner,
    deal?.roles?.opportunityOwner,
  ]);

  // Initialize published state when deal loads
  useEffect(() => {
    if (deal && !overviewPublishedState) {
      setOverviewPublishedState({
        title: deal.title,
        location: deal.location,
        division: deal.division,
        roles: deal.roles,
      });
    }
  }, [deal, overviewPublishedState]);

  // Initialize Summary and Roles published states
  useEffect(() => {
    if (deal && !summaryPublishedState) {
      setSummaryPublishedState({
        quality: deal.quality,
        division: deal.division,
        category: deal.category,
        subcategory: deal.subcategory,
        pos: deal.pos,
        web: deal.web,
        dealStart: deal.dealStart,
        dealEnd: deal.dealEnd,
      });
    }
  }, [deal, summaryPublishedState]);

  useEffect(() => {
    if (deal && !rolesPublishedState) {
      setRolesPublishedState({
        accountOwner: deal.roles.accountOwner,
        writer: deal.roles.writer,
        imageDesigner: deal.roles.imageDesigner,
        opportunityOwner: deal.roles.opportunityOwner,
      });
    }
  }, [deal, rolesPublishedState]);

  // Summary and Roles change counting functions
  const countSummaryChanges = () => {
    if (!deal || !summaryPublishedState) return 0;

    let count = 0;

    // Check summary fields
    if (deal.quality !== summaryPublishedState.quality) count++;
    if (deal.division !== summaryPublishedState.division) count++;
    if (deal.category !== summaryPublishedState.category) count++;
    if (deal.subcategory !== summaryPublishedState.subcategory) count++;
    if (deal.pos !== summaryPublishedState.pos) count++;
    if (deal.web !== summaryPublishedState.web) count++;
    if (deal.dealStart !== summaryPublishedState.dealStart) count++;
    if (deal.dealEnd !== summaryPublishedState.dealEnd) count++;

    return count;
  };

  const countRolesChanges = () => {
    if (!deal || !rolesPublishedState) return 0;

    let count = 0;

    // Check roles fields
    if (deal.roles.accountOwner !== rolesPublishedState.accountOwner) count++;
    if (deal.roles.writer !== rolesPublishedState.writer) count++;
    if (deal.roles.imageDesigner !== rolesPublishedState.imageDesigner) count++;
    if (deal.roles.opportunityOwner !== rolesPublishedState.opportunityOwner)
      count++;

    return count;
  };

  // Track Summary changes
  useEffect(() => {
    if (!deal || !summaryPublishedState) return;

    const changes = countSummaryChanges();
    setSummaryHasUnsavedChanges(changes > 0);
  }, [
    deal?.quality,
    deal?.division,
    deal?.category,
    deal?.subcategory,
    deal?.pos,
    deal?.web,
    deal?.dealStart,
    deal?.dealEnd,
    summaryPublishedState,
  ]);

  // Track Roles changes
  useEffect(() => {
    if (!deal || !rolesPublishedState) return;

    const changes = countRolesChanges();
    setRolesHasUnsavedChanges(changes > 0);
  }, [
    deal?.roles?.accountOwner,
    deal?.roles?.writer,
    deal?.roles?.imageDesigner,
    deal?.roles?.opportunityOwner,
    rolesPublishedState,
  ]);

  // Summary autosave effect
  useEffect(() => {
    if (!summaryHasUnsavedChanges || !deal) return;

    const timer = setTimeout(() => {
      // Auto-save summary changes
      updateDealFields(id || "1", {
        quality: deal.quality,
        division: deal.division,
        category: deal.category,
        subcategory: deal.subcategory,
        pos: deal.pos,
        web: deal.web,
        dealStart: deal.dealStart,
        dealEnd: deal.dealEnd,
      })
        .then(() => {
          message.success({
            content: "Summary auto-saved",
            duration: 1,
          });
        })
        .catch(() => {
          // Summary autosave error - silently fail
        });
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    deal?.quality,
    deal?.division,
    deal?.category,
    deal?.subcategory,
    deal?.pos,
    deal?.web,
    deal?.dealStart,
    deal?.dealEnd,
    summaryHasUnsavedChanges,
  ]);

  // Roles autosave effect
  useEffect(() => {
    if (!rolesHasUnsavedChanges || !deal) return;

    const timer = setTimeout(() => {
      // Auto-save roles changes
      updateDealFields(id || "1", {
        roles: deal.roles,
      })
        .then(() => {
          message.success({
            content: "Roles auto-saved",
            duration: 1,
          });
        })
        .catch(() => {
          // Roles autosave error - silently fail
        });
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    deal?.roles?.accountOwner,
    deal?.roles?.writer,
    deal?.roles?.imageDesigner,
    deal?.roles?.opportunityOwner,
    rolesHasUnsavedChanges,
  ]);

  const handleAccountSelection = async (account: MerchantAccount) => {
    if (!deal) return;

    setSelectedMerchantAccount(account);

    // Update deal with account information
    const updatedDeal = {
      ...deal,
      title: `New Deal at ${account.name}`,
      location: account.name,
      category: account.businessType,
    };

    try {
      await updateDealFields(deal.id, updatedDeal);
      setDeal(updatedDeal);
      changeSidebarView("default");
      message.success(`Account selected: ${account.name}`);
    } catch (error) {
      message.error("Failed to update deal");
    }
  };

  // Phase 1: Generate content (title, description, highlights)
  const generateContentPhase = async (account: any) => {
    if (!deal) return;

    const businessType = account.businessType?.toLowerCase() || 'business';
    const category = deal.category?.toLowerCase() || 'experience';
    
    // Generate category-specific descriptions
    const getCategoryDescription = () => {
      if (category.includes('food') || category.includes('restaurant')) {
        return `Experience culinary excellence at ${account.name}! ${account.description}

Indulge in expertly crafted dishes made with fresh, locally-sourced ingredients. Our talented chefs bring passion and creativity to every plate, ensuring an unforgettable dining experience.

Perfect for date nights, family celebrations, or treating yourself to something special. This exclusive deal offers exceptional value on our most popular menu items.

Don't miss this limited-time opportunity to savor the finest ${businessType} has to offer!`;
      } else if (category.includes('health') || category.includes('beauty') || category.includes('spa')) {
        return `Rejuvenate and refresh at ${account.name}! ${account.description}

Discover professional treatments delivered by our expert team of specialists. Using premium products and proven techniques, we're dedicated to helping you look and feel your absolute best.

Ideal for self-care, special occasions, or regular wellness routines. This exclusive offer provides outstanding value on our signature services.

Book now and experience the transformative power of professional ${businessType} care!`;
      } else if (category.includes('activity') || category.includes('entertainment')) {
        return `Create lasting memories at ${account.name}! ${account.description}

Enjoy thrilling experiences and top-notch facilities designed for maximum fun. Whether you're a beginner or expert, our professional staff ensures everyone has an amazing time.

Perfect for groups, families, date nights, or solo adventures. This special deal offers incredible value on our most popular experiences.

Grab this exclusive offer and discover why we're the area's favorite ${businessType} destination!`;
      }
      return `Welcome to ${account.name}! ${account.description}

Discover an exceptional experience at one of the area's premier ${businessType} destinations. Our expert team is dedicated to providing you with outstanding service and unforgettable moments.

Perfect for anyone looking for a premium experience. Whether you're celebrating a special occasion or simply treating yourself, this deal offers exceptional value.

Don't miss this opportunity to enjoy ${businessType} excellence at an unbeatable price!`;
    };

    const getCategoryHighlights = () => {
      if (category.includes('food') || category.includes('restaurant')) {
        return [
          { id: "1", text: "Fresh, locally-sourced ingredients" },
          { id: "2", text: "Award-winning culinary team" },
          { id: "3", text: "Extensive menu options for all tastes" },
          { id: "4", text: "Perfect for any occasion" },
        ];
      } else if (category.includes('health') || category.includes('beauty') || category.includes('spa')) {
        return [
          { id: "1", text: "Professional licensed specialists" },
          { id: "2", text: "Premium products and equipment" },
          { id: "3", text: "Customized treatment plans" },
          { id: "4", text: "Relaxing, modern facilities" },
        ];
      } else if (category.includes('activity') || category.includes('entertainment')) {
        return [
          { id: "1", text: "State-of-the-art facilities" },
          { id: "2", text: "Expert staff and instruction" },
          { id: "3", text: "Fun for all skill levels" },
          { id: "4", text: "Convenient online booking" },
        ];
      }
      return [
        { id: "1", text: `Premium ${businessType} experience` },
        { id: "2", text: "Perfect for all occasions" },
        { id: "3", text: "Exceptional value and quality" },
        { id: "4", text: "Easy booking and redemption" },
      ];
    };

    try {
      const updatedDeal = {
        ...deal,
        title: `Amazing Deal at ${account.name}`,
        galleryTitle: `Experience Excellence at ${account.name}`,
        content: {
          ...deal.content,
          description: getCategoryDescription(),
          highlights: getCategoryHighlights(),
        },
      };
      
      await updateDealFields(deal.id, updatedDeal);
      setDeal(updatedDeal);
      message.success({
        content: `✓ Generated compelling content for ${account.name}`,
        duration: 2,
      });
    } catch (error) {
      console.error("Phase 1 generation error:", error);
      message.error("Failed to generate content");
    }
  };

  // Phase 2: Generate and add images (scrape from merchant)
  const generateImagesPhase = async (account: any) => {
    if (!deal) return;

    try {
      const category = deal.category?.toLowerCase() || 'general';
      
      // Get category-specific images
      const getCategoryImages = () => {
        const timestamp = Date.now();
        
        if (category.includes('food') || category.includes('restaurant')) {
          return [
            {
              id: `img-${timestamp}-1`,
              url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
              type: "image" as const,
              isFeatured: true,
              alt: `${account.name} - Featured Restaurant Interior`,
              score: 96,
              metadata: { source: "merchant_website", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-2`,
              url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Signature Dish`,
              score: 94,
              metadata: { source: "instagram", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-3`,
              url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Dining Ambiance`,
              score: 91,
              metadata: { source: "facebook", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-4`,
              url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Gourmet Plating`,
              score: 93,
              metadata: { source: "merchant_website", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-5`,
              url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Chef's Special`,
              score: 89,
              metadata: { source: "instagram", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-6`,
              url: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Dining Experience`,
              score: 87,
              metadata: { source: "google_business", scrapedAt: new Date().toISOString() }
            },
          ];
        } else if (category.includes('health') || category.includes('beauty') || category.includes('spa')) {
          return [
            {
              id: `img-${timestamp}-1`,
              url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
              type: "image" as const,
              isFeatured: true,
              alt: `${account.name} - Spa Treatment Room`,
              score: 95,
              metadata: { source: "merchant_website", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-2`,
              url: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Relaxation Area`,
              score: 92,
              metadata: { source: "instagram", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-3`,
              url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Professional Treatment`,
              score: 93,
              metadata: { source: "facebook", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-4`,
              url: "https://images.unsplash.com/photo-1552693673-1bf958298229?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Wellness Space`,
              score: 90,
              metadata: { source: "merchant_website", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-5`,
              url: "https://images.unsplash.com/photo-1583416750470-965b2707b355?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Beauty Services`,
              score: 88,
              metadata: { source: "instagram", scrapedAt: new Date().toISOString() }
            },
          ];
        } else if (category.includes('activity') || category.includes('entertainment')) {
          return [
            {
              id: `img-${timestamp}-1`,
              url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
              type: "image" as const,
              isFeatured: true,
              alt: `${account.name} - Main Activity Area`,
              score: 94,
              metadata: { source: "merchant_website", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-2`,
              url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Group Activities`,
              score: 92,
              metadata: { source: "instagram", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-3`,
              url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Entertainment Venue`,
              score: 90,
              metadata: { source: "facebook", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-4`,
              url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Event Space`,
              score: 89,
              metadata: { source: "google_business", scrapedAt: new Date().toISOString() }
            },
            {
              id: `img-${timestamp}-5`,
              url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
              type: "image" as const,
              isFeatured: false,
              alt: `${account.name} - Fun Experience`,
              score: 91,
              metadata: { source: "instagram", scrapedAt: new Date().toISOString() }
            },
          ];
        }
        
        // Default/general images
        return [
          {
            id: `img-${timestamp}-1`,
            url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
            type: "image" as const,
            isFeatured: true,
            alt: `${account.name} - Featured Image`,
            score: 95,
            metadata: { source: "merchant_website", scrapedAt: new Date().toISOString() }
          },
          {
            id: `img-${timestamp}-2`,
            url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
            type: "image" as const,
            isFeatured: false,
            alt: `${account.name} - Gallery Image 1`,
            score: 92,
            metadata: { source: "instagram", scrapedAt: new Date().toISOString() }
          },
          {
            id: `img-${timestamp}-3`,
            url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
            type: "image" as const,
            isFeatured: false,
            alt: `${account.name} - Gallery Image 2`,
            score: 88,
            metadata: { source: "facebook", scrapedAt: new Date().toISOString() }
          },
          {
            id: `img-${timestamp}-4`,
            url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
            type: "image" as const,
            isFeatured: false,
            alt: `${account.name} - Gallery Image 3`,
            score: 90,
            metadata: { source: "merchant_website", scrapedAt: new Date().toISOString() }
          },
        ];
      };

      const scrapedImages = getCategoryImages();

      const updatedDeal = {
        ...deal,
        content: {
          ...deal.content,
          media: scrapedImages,
        },
      };
      
      await updateDealFields(deal.id, updatedDeal);
      setDeal(updatedDeal);
      message.success({
        content: `✓ Scraped and scored ${scrapedImages.length} high-quality images from multiple sources`,
        duration: 2,
      });
    } catch (error) {
      console.error("Phase 2 generation error:", error);
      message.error("Failed to scrape images");
    }
  };

  // Phase 3: Generate redemption & locations
  const generateRedemptionPhase = async () => {
    if (!deal) return;

    try {
      const category = deal.category?.toLowerCase() || 'general';
      
      // Generate category-specific redemption instructions
      const getRedemptionData = () => {
        if (category.includes('food') || category.includes('restaurant')) {
          return {
            method: "online" as const,
            instructions: "Simply show your voucher to your server when ordering. Reservations recommended for peak hours. Call ahead for large parties or special requests.",
            appointmentRequired: false,
            bookingUrl: "https://example.com/book",
            additionalInfo: "Walk-ins welcome. Present voucher before ordering."
          };
        } else if (category.includes('health') || category.includes('beauty') || category.includes('spa')) {
          return {
            method: "online" as const,
            instructions: "Book your appointment online or call us directly. Please mention your voucher when booking. Arrive 10 minutes early to complete intake forms.",
            appointmentRequired: true,
            bookingUrl: "https://example.com/book-spa",
            additionalInfo: "24-hour cancellation policy. Photo ID required at check-in."
          };
        } else if (category.includes('activity') || category.includes('entertainment')) {
          return {
            method: "online" as const,
            instructions: "Reserve your spot online or call to book. Show your digital or printed voucher at check-in. Arrive 15 minutes before your scheduled time.",
            appointmentRequired: true,
            bookingUrl: "https://example.com/book-activity",
            additionalInfo: "Waivers may be required. Please wear appropriate attire."
          };
        }
        
        return {
          method: "online" as const,
          instructions: "Book online or call to schedule your visit. Present your voucher upon arrival. Reservations recommended to ensure availability.",
          appointmentRequired: true,
          bookingUrl: "https://example.com/book",
          additionalInfo: "Valid photo ID required."
        };
      };

      const redemptionData = getRedemptionData();

      const updatedDeal = {
        ...deal,
        redemption: redemptionData,
      };
      
      await updateDealFields(deal.id, updatedDeal);
      setDeal(updatedDeal);
      message.success({
        content: `✓ Configured redemption instructions and booking details`,
        duration: 2,
      });
    } catch (error) {
      console.error("Phase 3 generation error:", error);
      message.error("Failed to setup redemption");
    }
  };

  // Phase 4: Generate fine print (final phase)
  const generateFinePrintPhase = async () => {
    if (!deal) return;

    try {
      const category = deal.category?.toLowerCase() || 'general';
      
      // Generate category-specific fine print
      const getCategoryFinePrint = () => {
        if (category.includes('food') || category.includes('restaurant')) {
          return [
            { id: "1", text: "Valid for dine-in only, unless otherwise specified" },
            { id: "2", text: "Gratuity not included - please tip on full pre-discount value" },
            { id: "3", text: "Cannot be combined with other offers, discounts, or promotions" },
            { id: "4", text: "Alcoholic beverages may be excluded or subject to additional charges" },
            { id: "5", text: "Reservation recommended during peak hours - subject to availability" },
            { id: "6", text: "Menu items subject to change based on seasonal availability" },
            { id: "7", text: "One voucher per table per visit" },
            { id: "8", text: "Merchant reserves the right to refuse service" },
          ];
        } else if (category.includes('health') || category.includes('beauty') || category.includes('spa')) {
          return [
            { id: "1", text: "Appointment required - must be scheduled in advance" },
            { id: "2", text: "24-hour cancellation policy applies - full value charged for no-shows" },
            { id: "3", text: "Valid for first-time customers only, unless otherwise specified" },
            { id: "4", text: "Gratuity not included - customary 15-20% gratuity appreciated" },
            { id: "5", text: "Cannot be combined with other offers or promotions" },
            { id: "6", text: "Must be 18 years or older, or accompanied by parent/guardian" },
            { id: "7", text: "Arrive 10-15 minutes early to complete necessary paperwork" },
            { id: "8", text: "Please inform staff of any allergies or medical conditions" },
            { id: "9", text: "Service providers may be assigned based on availability" },
          ];
        } else if (category.includes('activity') || category.includes('entertainment')) {
          return [
            { id: "1", text: "Advance reservation required - subject to availability" },
            { id: "2", text: "Waiver must be signed by all participants before activity" },
            { id: "3", text: "Age, height, or weight restrictions may apply" },
            { id: "4", text: "Appropriate attire and closed-toe shoes required" },
            { id: "5", text: "Cannot be combined with other discounts or group rates" },
            { id: "6", text: "24-hour cancellation notice required for refund or reschedule" },
            { id: "7", text: "Activities may be modified or cancelled due to weather or safety concerns" },
            { id: "8", text: "One voucher per person per visit" },
            { id: "9", text: "Photo ID required at check-in for age verification" },
          ];
        }
        
        return [
          { id: "1", text: "Valid for new customers only, unless otherwise specified" },
          { id: "2", text: "Reservation required - subject to availability" },
          { id: "3", text: "Cannot be combined with other offers, discounts, or promotions" },
          { id: "4", text: "Gratuity not included where applicable" },
          { id: "5", text: "Valid at participating locations only" },
          { id: "6", text: "No cash value - cannot be exchanged for cash" },
          { id: "7", text: "Merchant reserves the right to modify or cancel at any time" },
          { id: "8", text: "See merchant for full terms and conditions" },
        ];
      };

      const updatedDeal = {
        ...deal,
        content: {
          ...deal.content,
          finePoints: getCategoryFinePrint(),
        },
      };
      
      await updateDealFields(deal.id, updatedDeal);
      setDeal(updatedDeal);
      setIsAIGenerating(false);
      setAiGenerationPhase(0);

      // Remove query parameters
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("aiGenerating");
      newParams.delete("accountId");
      setSearchParams(newParams);

      message.success({
        content: "✨ AI generation complete! Your deal is ready for review.",
        duration: 3,
      });
    } catch (error) {
      console.error("Phase 4 generation error:", error);
      message.error("Failed to complete generation");
      setIsAIGenerating(false);
    }
  };

  // Sidebar view changes
  useEffect(() => {
    // Sidebar view and option tracking
  }, [sidebarView, selectedOption]);

  // Add CSS for library item hover effect, pulse animation, and custom Segmented styling
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .library-item-hover:hover .library-preview-icon {
        opacity: 1 !important;
      }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      /* Custom Segmented Tab Styling */
      .ant-segmented {
        background: transparent !important;
        padding: 0 !important;
        gap: ${token.marginXS}px !important;
      }
      .ant-segmented .ant-segmented-item {
        background: transparent !important;
        border-radius: ${token.borderRadius}px !important;
        transition: all ${token.motionDurationMid} !important;
        margin: 0 !important;
      }
      .ant-segmented .ant-segmented-item + .ant-segmented-item {
        margin-left: ${token.marginXS}px !important;
      }
      .ant-segmented .ant-segmented-item:not(.ant-segmented-item-selected):hover {
        background: ${token.colorBgTextHover} !important;
      }
      .ant-segmented .ant-segmented-item.ant-segmented-item-selected,
      .ant-segmented .ant-segmented-item-selected,
      .ant-segmented-item-selected {
        background: ${token.colorFillSecondary} !important;
        color: ${token.colorText} !important;
        font-weight: ${token.fontWeightStrong} !important;
      }
      .ant-segmented .ant-segmented-item-selected .ant-segmented-item-label {
        color: ${token.colorText} !important;
      }
      .ant-segmented .ant-segmented-thumb,
      .ant-segmented-thumb {
        display: none !important;
        opacity: 0 !important;
      }
      .ant-segmented .ant-segmented-group {
        gap: ${token.marginXS}px !important;
      }
      
      /* Custom Collapse Panel Styling for Sidebar */
      .ant-collapse-ghost > .ant-collapse-item {
        border-bottom: 1px solid ${token.colorBorder};
      }
      .ant-collapse-ghost > .ant-collapse-item:last-child {
        border-bottom: none;
      }
      .ant-collapse-ghost > .ant-collapse-item > .ant-collapse-header {
        padding: 16px 24px !important;
        align-items: center !important;
      }
      .ant-collapse-ghost > .ant-collapse-item > .ant-collapse-header:hover {
        background: ${token.colorBgTextHover} !important;
      }
      .ant-collapse-ghost .ant-collapse-content > .ant-collapse-content-box {
        padding: 0 24px 0 24px !important;
      }
      .ant-collapse-ghost > .ant-collapse-item > .ant-collapse-header .ant-collapse-expand-icon {
        padding-inline-end: 12px !important;
      }
      
      /* Remove border radius from right sidebar */
      #deal-details-sidebar.ant-card {
        border-radius: 0 !important;
      }
      #deal-details-sidebar .ant-card-head {
        border-radius: 0 !important;
      }
      #deal-details-sidebar .ant-card-body {
        border-radius: 0 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [token]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Helper function to initialize deal data
  const initializeDealData = (dealData: any) => {
    setDeal(dealData);

    // Add to recently viewed deals
    addToRecentlyViewed(dealData);
    
    // Initialize date values
    if (dealData.dealStart) {
      setLaunchDate(dayjs(dealData.dealStart, "DD. M. YYYY"));
    }
    if (dealData.dealEnd) {
      setEndDate(dayjs(dealData.dealEnd, "DD. M. YYYY"));
      setIsContinuous(false);
    } else {
      setIsContinuous(true);
    }

    // Initialize summary fields
    setEditableQuality(dealData.quality || "Ace");
    setEditableDivision(dealData.division || "Chicago (USA)");
    setEditableCategorySubcategoryPos(
      `${dealData.category || "Food & Drink"} - ${
        dealData.subcategory || "Restaurant"
      } - ${dealData.pos || "Mexican"}`.replace(/^ - | - $/g, "")
    );
    setEditableWeb(dealData.web || "example.com");

    // Initialize roles fields
    setEditableAccountOwner(dealData.roles?.accountOwner || "Unassigned");
    setEditableWriter(dealData.roles?.writer || "John Peterson");
    setEditableImageDesigner(
      dealData.roles?.imageDesigner || "Aartiya Johrison"
    );
    setEditableOpportunityOwner(
      dealData.roles?.opportunityOwner || currentUser.name
    );

  };

  const fetchDeal = async () => {
    // Skip loading steps if AI is generating, as AI generation has its own progress
    if (isAIGenerating) {
      try {
        // Just load the deal data without showing loading skeleton
        const dealData = await getDeal(id || "1");
        initializeDealData(dealData);
      } catch (error) {
        console.error("Error fetching deal:", error);
      }
      return;
    }
    
    // Check if deal is already complete in storage (skip loading animation for already-generated deals)
    try {
      const existingDeal = await getDeal(id || "1");
      
      if (isDealAlreadyGenerated(existingDeal)) {
        // Deal is complete - load instantly without loading skeleton
        initializeDealData(existingDeal);
        return;
      }
    } catch (error) {
      // If checking fails, continue with normal loading
      console.error("Error checking existing deal:", error);
    }
    
    setLoading(true);
    setLoadingStep(0);
    
    try {
      // Simulate loading steps for better UX (especially for draft deals)
      const isDraftDeal = id?.startsWith("deal-");
      const loadingSteps = isDraftDeal ? 3 : 1;
      
      for (let i = 0; i < loadingSteps; i++) {
        setLoadingStep(i);
        await new Promise(resolve => setTimeout(resolve, isDraftDeal ? 400 : 0));
      }
      
      // Get deal data from Supabase or localStorage
      const dealData = await getDeal(id || "1");
      initializeDealData(dealData);

      // Scroll to top when new deal is loaded
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Error fetching deal - silently fail
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data based on time period and metric
  const getChartData = (period: string, metric: string) => {
    // Check if deal has been launched - if not, return empty chart data
    // Draft deals and scheduled deals (not yet live) should show zero stats
    const isLaunched = deal && 
      deal.status !== "Draft" && 
      deal.campaignStage !== "draft" &&
      deal.wonSubStage !== "scheduled" &&
      (deal.campaignStage === "won" || deal.campaignStage === "lost");
    
    const data: ChartDataPoint[] = [];
    const dates: string[] = [];
    let numDays = 30;
    let baseDate = new Date("2024-09-01");

    if (period === "7days") {
      numDays = 7;
      baseDate = new Date("2024-09-24");
    } else if (period === "total") {
      numDays = 90;
      baseDate = new Date("2024-07-01");
    }

    for (let i = 0; i < numDays; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }

    // If not launched, return zero values for all dates
    if (!isLaunched) {
      dates.forEach((date) => {
        data.push({ date, value: 0 });
      });
      return data;
    }

    // Different values for different metrics and periods
    let values: number[] = [];

    if (metric === "grossProfit") {
      if (period === "30days") {
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 500) + 300
        );
      } else if (period === "7days") {
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 200) + 150
        );
      } else {
        // Total - largest values
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 1200) + 600
        );
      }
    } else if (metric === "orders") {
      if (period === "30days") {
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 20) + 5
        );
      } else if (period === "7days") {
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 10) + 3
        );
      } else {
        // Total - largest values
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 35) + 15
        );
      }
    } else if (metric === "gpPerVisit") {
      if (period === "30days") {
        values = Array.from({ length: numDays }, () => Math.random() * 3 + 1);
      } else if (period === "7days") {
        values = Array.from({ length: numDays }, () => Math.random() * 2 + 1);
      } else {
        // Total - highest range
        values = Array.from({ length: numDays }, () => Math.random() * 4 + 2);
      }
    } else if (metric === "conversionRate") {
      if (period === "30days") {
        values = Array.from({ length: numDays }, () => Math.random() * 4 + 2);
      } else if (period === "7days") {
        values = Array.from({ length: numDays }, () => Math.random() * 3 + 1.5);
      } else {
        // Total - highest conversion
        values = Array.from({ length: numDays }, () => Math.random() * 5 + 3);
      }
    } else if (metric === "visits") {
      if (period === "30days") {
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 10000) + 3000
        );
      } else if (period === "7days") {
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 5000) + 2000
        );
      } else {
        // Total - largest traffic
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 15000) + 5000
        );
      }
    } else if (metric === "refunds") {
      if (period === "30days") {
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 5) + 1
        );
      } else if (period === "7days") {
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 3) + 1
        );
      } else {
        // Total - more refunds accumulated
        values = Array.from(
          { length: numDays },
          () => Math.floor(Math.random() * 8) + 2
        );
      }
    }

    dates.forEach((date, i) => {
      data.push({ date, value: values[i] || 0 });
    });

    return data;
  };

  // Get stats based on time period
  const getStatsForPeriod = (period: string) => {
    // Check if deal has been launched - if not, return zeros
    // Draft deals and scheduled deals (not yet live) should show zero stats
    const isLaunched = deal && 
      deal.status !== "Draft" && 
      deal.campaignStage !== "draft" &&
      deal.wonSubStage !== "scheduled" &&
      (deal.campaignStage === "won" || deal.campaignStage === "lost");
    
    if (!isLaunched) {
      return {
        grossProfit: 0,
        orders: 0,
        gpPerVisit: 0,
        conversionRate: 0,
        visits: 0,
        refunds: 0,
        change: "+0%",
      };
    }
    
    if (period === "30days") {
      // Medium values for 30 days
      return {
        grossProfit: 12023,
        orders: 303,
        gpPerVisit: 2.34,
        conversionRate: 3.5,
        visits: 132200000,
        refunds: 32,
        change: "+35%",
      };
    } else if (period === "7days") {
      // Smallest values for 7 days (most recent week)
      return {
        grossProfit: 3456,
        orders: 87,
        gpPerVisit: 1.89,
        conversionRate: 2.8,
        visits: 45600000,
        refunds: 9,
        change: "+12%",
      };
    } else {
      // Largest values for Total (all-time)
      return {
        grossProfit: 78945,
        orders: 1897,
        gpPerVisit: 3.67,
        conversionRate: 4.8,
        visits: 489300000,
        refunds: 156,
        change: "+8%",
      };
    }
  };

  // Show loading skeleton only for initial loading (NOT during AI generation)
  // Skip loading skeleton entirely if AI is generating - show full layout immediately
  if ((loading || !deal) && !isAIGenerating) {
    // Enhanced loading skeleton for draft deals
    const isDraftDeal = id?.startsWith("deal-");
    
    const loadingSteps = [
      { label: "Loading deal data", icon: <FileText size={16} /> },
      { label: "Preparing content", icon: <Sparkles size={16} /> },
      { label: "Setting up editor", icon: <Edit2 size={16} /> },
    ];

    if (isDraftDeal) {
      return (
        <>
          <div style={{ 
            padding: token.paddingLG,
            // Account for tab bar (56px on desktop) always visible + sidebar width when open
            marginRight: isMobile 
              ? 0 
              : rightSidebarTotalWidth,
            transition: `margin-right ${LAYOUT_CONSTANTS.TRANSITION_DURATION} ease`,
          }}>
            {/* Header Skeleton */}
            <Card style={{ marginBottom: token.margin }}>
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: token.margin }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: token.borderRadiusLG,
                      background: `${token.colorPrimary}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: token.colorPrimary,
                    }}
                  >
                    <Spin />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                      Loading Deal
                    </Title>
                    <Text type="secondary">
                      Preparing deal content...
                    </Text>
                  </div>
                </div>
                
                {/* Loading Steps */}
                <div style={{ marginTop: token.marginLG }}>
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    {loadingSteps.map((step, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: token.marginSM,
                          padding: `${token.paddingSM}px ${token.padding}px`,
                          background:
                            index <= loadingStep
                              ? `${token.colorPrimary}08`
                              : token.colorBgContainer,
                          borderRadius: token.borderRadius,
                          border: `1px solid ${
                            index === loadingStep
                              ? token.colorPrimary
                              : token.colorBorder
                          }`,
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div
                          style={{
                            color:
                              index <= loadingStep
                                ? token.colorPrimary
                                : token.colorTextSecondary,
                          }}
                        >
                          {index < loadingStep ? (
                            <CircleCheck size={16} />
                          ) : index === loadingStep ? (
                            <Spin size="small" />
                          ) : (
                            step.icon
                          )}
                        </div>
                        <Text
                          type={index <= loadingStep ? undefined : "secondary"}
                          strong={index === loadingStep}
                          style={{ flex: 1 }}
                        >
                          {step.label}
                        </Text>
                        {index < loadingStep && (
                          <Tag color="success" style={{ margin: 0 }}>
                            Done
                          </Tag>
                        )}
                        {index === loadingStep && (
                          <Tag color="processing" style={{ margin: 0 }}>
                            In progress
                          </Tag>
                        )}
                      </div>
                    ))}
                  </Space>
                </div>
              </Space>
            </Card>

            {/* Content Skeleton */}
            <Row gutter={16}>
              <Col span={24}>
                <Card style={{ marginBottom: token.margin }}>
                  <Skeleton active paragraph={{ rows: 6 }} />
                </Card>
                <Card>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </Card>
              </Col>
            </Row>
          </div>

          {/* Sidebar Skeleton */}
          {windowWidth >= LAYOUT_CONSTANTS.TABLET_BREAKPOINT && (
            <GoogleWorkspaceSidebar
              tabs={[
                { icon: Compass, label: 'Scout', value: 'discovery', tooltip: 'Deal Research & Insights' },
                { icon: Briefcase, label: 'Work', value: 'work', tooltip: 'Work & Tasks' },
                { icon: FileText, label: 'Files', value: 'files', tooltip: 'Attachments & Contracts' },
              ]}
              activeTab="discovery"
              onTabChange={() => {}}
              title="Loading..."
              width={LAYOUT_CONSTANTS.SIDEBAR_WIDTH_DEFAULT}
              topOffset={64}
              resizable={false}
            >
              <div style={{ padding: token.paddingLG }}>
                <Skeleton active paragraph={{ rows: 12 }} />
              </div>
            </GoogleWorkspaceSidebar>
          )}
        </>
      );
    }

    // Simple loading for non-draft deals
    return <Card loading={loading} />;
  }


  // #region agent log - MOVED BEFORE EARLY RETURN TO FIX HOOKS ORDER
  React.useEffect(() => {
    if (deal) {
      fetch('http://127.0.0.1:7242/ingest/eec779b3-74e7-4829-a8e6-818a27f11014',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DealDetail.tsx:2283',message:'Deal loaded successfully',data:{dealId:deal.id,dealTitle:deal.title,dealLocation:deal.location,dealAccountId:deal.accountId,hasSelectedMerchant:!!selectedMerchantAccount,selectedMerchantName:selectedMerchantAccount?.name},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C'})}).catch(()=>{});
    }
  }, [deal?.id, selectedMerchantAccount]);
  // #endregion

  // Safety check - deal must exist beyond this point
  if (!deal) {
    return <Card loading={true} />;
  }

  // Map deal options to include discount and enabled status
  const mappedOptions = deal.options.map((opt) => ({
    id: opt.id,
    name: opt.name,
    regularPrice: opt.regularPrice,
    grouponPrice: opt.grouponPrice,
    merchantPayout: opt.merchantPayout,
    status: opt.status,
    discount:
      opt.discount ||
      Math.round(
        ((opt.regularPrice - opt.grouponPrice) / opt.regularPrice) * 100
      ),
    validity: "Valid for 90 days",
    enabled: opt.status === "Live",
  }));

  const handleOptionsChange = async (options: any[]) => {
    if (!deal) return;

    // Update the deal options
    const updatedOptions = options.map((opt) => ({
      id: opt.id,
      name: opt.name,
      regularPrice: opt.regularPrice,
      grouponPrice: opt.grouponPrice,
      merchantPayout: opt.grouponPrice * 0.8, // 80% of groupon price
      status: opt.enabled ? "Live" : "Paused",
      discount: opt.discount,
      validity: opt.validity || "Valid for 90 days",
      enabled: opt.enabled,
    }));

    try {
      // Save to localStorage
      const updatedDeal = await updateDealFields(id || "1", {
        options: updatedOptions,
      });

      setDeal(updatedDeal);
      message.success("Options saved successfully!");
    } catch (error) {
      message.error("Failed to save options");
    }
  };


  // Summary editing handlers
  const handleEditSummary = () => {
    setIsEditingSummary(true);
  };

  // Roles editing handlers
  const handleEditRoles = () => {
    setIsEditingRoles(true);
  };

  // Overview autosave functions
  /* Disabled for now - not being used
  const _countOverviewChanges = () => {
    if (!deal || !overviewPublishedState) return 0;

    let count = 0;

    // Check title changes
    if (deal.title !== overviewPublishedState.title) count++;

    // Check location changes
    if (deal.location !== overviewPublishedState.location) count++;

    // Check division changes
    if (deal.division !== overviewPublishedState.division) count++;

    // Check roles changes
    if (deal.roles.accountOwner !== overviewPublishedState.roles?.accountOwner)
      count++;
    if (deal.roles.writer !== overviewPublishedState.roles?.writer) count++;
    if (
      deal.roles.imageDesigner !== overviewPublishedState.roles?.imageDesigner
    )
      count++;
    if (
      deal.roles.opportunityOwner !==
      overviewPublishedState.roles?.opportunityOwner
    )
      count++;

    return count;
  };
  */

  const performOverviewSave = async (isAutoSave: boolean = false) => {
    if (!deal) return;

    try {
      // Save to localStorage
      const updatedDeal = await updateDealFields(id || "1", {
        title: deal.title,
        location: deal.location,
        division: deal.division,
        roles: deal.roles,
      });

      setDeal(updatedDeal);

      if (!isAutoSave) {
        message.success("Overview changes saved successfully!");
      } else {
        message.success({
          content: "Overview auto-saved",
          duration: 1,
        });
      }
    } catch (error) {
      message.error("Failed to save overview changes");
    }
  };

  /* Disabled for now - not being used
  const _performOverviewPublish = async () => {
    if (!deal) return;

    setOverviewIsSaving(true);
    try {
      // First ensure everything is saved
      await performOverviewSave(false);

      // Update published state to match current state
      setOverviewPublishedState({
        title: deal.title,
        location: deal.location,
        division: deal.division,
        roles: deal.roles,
      });

      setOverviewHasUnsavedChanges(false);
      message.success("Overview changes published successfully!");
    } catch (error) {
      message.error("Failed to publish overview changes");
    } finally {
      setOverviewIsSaving(false);
    }
  };
  */

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "#ff4d4f";
      case "MEDIUM":
        return "#faad14";
      case "LOW":
        return "#52c41a";
      default:
        return "#d9d9d9";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Clarity: "#1890ff",
      Pricing: "#722ed1",
      Other: "#13c2c2",
    };
    return colors[category] || "#d9d9d9";
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Breadcrumb & Status - Fixed/Not Scrolling - FULL WIDTH */}
      <div
        style={{
          position: "sticky",
          top: 64,
          zIndex: 51,
          background: token.colorBgContainer,
          padding: `${token.paddingXS}px ${token.paddingLG}px`,
          marginTop: -token.paddingLG,
          marginBottom: 0,
          marginLeft: -token.paddingLG,
          marginRight: -token.paddingLG,
          width: "100vw",
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          gap: token.marginSM,
          flexWrap: "wrap",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <DynamicBreadcrumbs />
      </div>

      {/* Scrollable Tabs Row - FULL WIDTH */}
      <div
        style={{
          position: "sticky",
          top: 111,
          zIndex: 50,
          background: token.colorBgContainer,
          marginTop: 0,
          marginBottom: 0,
          marginLeft: -token.paddingLG,
          marginRight: -token.paddingLG,
          width: "100vw",
          left: 0,
          right: 0,
          paddingLeft: token.paddingLG,
          paddingRight: token.paddingLG,
          paddingTop: token.paddingXS,
          paddingBottom: token.paddingXS,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: token.padding,
            flexWrap: windowWidth < 768 ? "wrap" : "nowrap",
          }}
        >
          {/* Scrollable Tabs Container */}
          <div
            style={{
              flex: "1 1 auto",
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
              msOverflowStyle: "-ms-autohiding-scrollbar",
            }}
          >
            <Segmented
              value={activeView}
              onChange={setActiveView}
              options={[
                // Overview tab - only show for non-draft deals
                ...(deal?.campaignStage !== "draft" ? [{
                  label: (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: token.marginXS,
                        whiteSpace: "nowrap",
                        padding: `${token.paddingXXS}px 0px`,
                        fontSize: token.fontSize,
                      }}
                    >
                      <TrendingUp size={16} />
                      <span
                        style={{
                          display: windowWidth < 768 ? "none" : "inline",
                        }}
                      >
                        Overview
                      </span>
                    </div>
                  ),
                  value: "Overview",
                }] : []),
                {
                  label: (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: token.marginXS,
                        whiteSpace: "nowrap",
                        padding: `${token.paddingXXS}px 0px`,
                        fontSize: token.fontSize,
                      }}
                    >
                      <Edit2 size={16} />
                      <span
                        style={{
                          display: windowWidth < 768 ? "none" : "inline",
                        }}
                      >
                        Content
                      </span>
                    </div>
                  ),
                  value: "Content",
                },
                {
                  label: (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: token.marginXS,
                        whiteSpace: "nowrap",
                        padding: `${token.paddingXXS}px 0px`,
                        fontSize: token.fontSize,
                      }}
                    >
                      <Building2 size={16} />
                      <span
                        style={{
                          display: windowWidth < 768 ? "none" : "inline",
                        }}
                      >
                        Business Details
                      </span>
                    </div>
                  ),
                  value: "Business Details",
                },
                // Preview tab - only show for draft deals
                ...(deal?.campaignStage === "draft" ? [{
                  label: (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: token.marginXS,
                        whiteSpace: "nowrap",
                        padding: `${token.paddingXXS}px 0px`,
                        fontSize: token.fontSize,
                      }}
                    >
                      <Monitor size={16} />
                      <span
                        style={{
                          display: windowWidth < 768 ? "none" : "inline",
                        }}
                      >
                        Preview
                      </span>
                    </div>
                  ),
                  value: "Preview",
                }] : []),
                // Reviews tab - only show for non-draft deals
                ...(deal?.campaignStage !== "draft" ? [{
                  label: (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: token.marginXS,
                        whiteSpace: "nowrap",
                        padding: `${token.paddingXXS}px 0px`,
                        fontSize: token.fontSize,
                      }}
                    >
                      <Star size={16} />
                      <span
                        style={{
                          display: windowWidth < 768 ? "none" : "inline",
                        }}
                      >
                        Reviews
                      </span>
                    </div>
                  ),
                  value: "Reviews",
                }] : []),
              ]}
              style={{
                background: "transparent",
                gap: token.marginXS,
              }}
            />
          </div>
          {/* Action Buttons */}
          <Space
            size={windowWidth < 768 ? 4 : "small"}
            style={{
            justifyContent: windowWidth < 768 ? "center" : "flex-start",
            flexWrap: "nowrap",
            flexShrink: 0,
          }}
        >
          {windowWidth >= LAYOUT_CONSTANTS.DESKTOP_BREAKPOINT ? (
              <>
                <Button icon={<SalesforceIcon />} iconPosition="start"></Button>
                {/* <Button icon={<SalesloftIcon />} iconPosition="start"></Button> */}
                
                <Button>
                  <strong>DE</strong>
                </Button>
                {/* <Button style={{ paddingLeft: token.paddingXS, paddingRight: token.paddingXS }}>
                  <strong>DCT</strong>
                </Button> */}
                {/* View deal and Voucher buttons - only show for non-draft deals */}
                {deal?.campaignStage !== "draft" && (
                  <>
                    <Button icon={<GrouponIcon />} iconPosition="start">View deal</Button>
                    <Button>Voucher</Button>
                  </>
                )}
                
                
              </>
            ) : (
              <Dropdown
                menu={{
                  items: ACTION_MENU_ITEMS.map((item) => ({
                    key: item.key,
                    label: (
                      <Space size={8}>
                        {item.icon}
                        <strong>{item.label}</strong>
                      </Space>
                    ),
                  })),
                }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button
                  type="text"
                  icon={<MoreVertical size={windowWidth < 768 ? 20 : 18} />}
                />
              </Dropdown>
            )}
          </Space>
        </div>
      </div>

      {/* Main Content and Sidebar Container */}
      <div
        style={{
          display: "flex",
          flexDirection: windowWidth < LAYOUT_CONSTANTS.TABLET_BREAKPOINT ? "column" : "row",
          gap: 0,
          marginRight: windowWidth < LAYOUT_CONSTANTS.TABLET_BREAKPOINT ? 0 : totalSidebarWidth,
          transition: isSidebarResizing ? 'none' : `margin-right ${LAYOUT_CONSTANTS.TRANSITION_DURATION} ease`,
        }}
      >
        {/* Main Content Area */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            paddingRight: 0,
            paddingTop: 0,
          }}
        >
          {/* Content based on active view */}
          {activeView === "Overview" && (
            <div style={{ paddingTop: 24 }}>
              {/* Overview Autosave Status - Removed as status is now shown in fixed header */}

              {/* Header */}
              <DealHeaderInfo
                deal={deal}
                onDealChange={(updates) => setDeal({ ...deal, ...updates })}
                selectedMerchantAccount={selectedMerchantAccount}
                searchParams={searchParams}
                onNavigateToView={setActiveView}
              />

              {/* Stats Card with Chart */}
              <DealStatsCard
                timePeriod={timePeriod}
                setTimePeriod={setTimePeriod}
                selectedMetric={selectedMetric}
                setSelectedMetric={setSelectedMetric}
                getStatsForPeriod={getStatsForPeriod}
                getChartData={getChartData}
                windowWidth={windowWidth}
              />

              {/* Summary and Roles */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                  <DealSummaryCard
                    deal={deal}
                    isEditing={isEditingSummary}
                    onToggleEdit={handleEditSummary}
                    hasUnsavedChanges={summaryHasUnsavedChanges}
                    countChanges={countSummaryChanges}
                    editableQuality={editableQuality}
                    setEditableQuality={setEditableQuality}
                    launchDate={launchDate}
                    setLaunchDate={setLaunchDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    isContinuous={isContinuous}
                    setIsContinuous={setIsContinuous}
                    editableDivision={editableDivision}
                    setEditableDivision={setEditableDivision}
                    editableCategorySubcategoryPos={editableCategorySubcategoryPos}
                    setEditableCategorySubcategoryPos={setEditableCategorySubcategoryPos}
                    editableWeb={editableWeb}
                    setEditableWeb={setEditableWeb}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <DealRolesCard
                    deal={deal}
                    isEditing={isEditingRoles}
                    onToggleEdit={handleEditRoles}
                    hasUnsavedChanges={rolesHasUnsavedChanges}
                    countChanges={countRolesChanges}
                    editableAccountOwner={editableAccountOwner}
                    setEditableAccountOwner={setEditableAccountOwner}
                    editableWriter={editableWriter}
                    setEditableWriter={setEditableWriter}
                    editableImageDesigner={editableImageDesigner}
                    setEditableImageDesigner={setEditableImageDesigner}
                    editableOpportunityOwner={editableOpportunityOwner}
                    setEditableOpportunityOwner={setEditableOpportunityOwner}
                  />
                </Col>
              </Row>

              {/* Similar Deals */}
              <SimilarDealsCard
                currentDealId={deal.id}
                getSimilarDeals={getSimilarDeals}
                onDealClick={(dealId, accountId) => {
                  // Preserve URL structure: if we're in account context, stay in account context
                  const targetPath = accountId
                    ? `/accounts/${accountId}/deals/${dealId}`
                    : `/deals/${dealId}`;
                  navigate(targetPath);
                }}
                onViewAll={() => navigate("/deals")}
                accountId={params.accountId}
              />

              {/* Nearby Competitor Deals */}
              <NearbyCompetitorDealsCard
                currentDeal={deal}
                competitorDeals={getCompetitorDeals(deal)}
                onViewAll={() => {
                  // Could navigate to a competitor analysis page
                  message.info("Competitor analysis feature coming soon!");
                }}
              />

              {/* Recommendations */}
              <DealRecommendationsCard
                recommendations={deal.recommendations}
                getPriorityColor={getPriorityColor}
                getCategoryColor={getCategoryColor}
                onFeedback={() => {
                  // Handle feedback
                }}
              />

              {/* Review Summary */}
              <Card
                title="Review Summary"
                extra={
                  <Button type="link" style={{ color: token.colorSuccess }}>
                    See All Reviews
                  </Button>
                }
                style={{ marginBottom: 24 }}
              >
                <Text type="secondary">Slot component</Text>
              </Card>

              {/* Customer Support Insights */}
              <Card
                title="Customer support insights"
                extra={
                  <Button type="link" style={{ color: token.colorSuccess }}>
                    Give Feedback
                  </Button>
                }
              >
                <Text type="secondary">Slot component</Text>
              </Card>
            </div>
          )}

          {activeView === "Content" && (
            <div style={{ paddingTop: 24 }}>
              {/* Deal Header Actions - Conditional based on stage */}
              {deal && (
                <DealHeaderActions
                  deal={deal}
                  currentRole={currentRole}
                  isNewDeal={isNewDeal}
                  isAIGenerating={isAIGenerating}
                  contentHasUnsavedChanges={contentHasUnsavedChanges}
                  contentIsSaving={contentIsSaving}
                  contentLastSaved={contentLastSaved}
                  contentPendingSave={contentPendingSave}
                  contentUnpublishedCount={contentUnpublishedCount}
                  onPublish={() => {
                    if (contentEditorPublishRef.current) {
                      contentEditorPublishRef.current();
                    }
                  }}
                  onPreview={() => {
                    setIsPreviewModalOpen(true);
                  }}
                  onRevert={() => {
                    window.location.reload();
                  }}
                  onDealUpdate={async (updates) => {
                    const updatedDeal = { ...deal, ...updates };
                    setDeal(updatedDeal);
                    try {
                      await updateDealFields(id || "1", updates);
                    } catch (error) {
                      console.error("Error updating deal:", error);
                      message.error("Failed to update deal");
                    }
                  }}
                  onManageOptions={() => setOptionsListOpen(true)}
                  optionsCount={mappedOptions.length}
                  showOptionsHeader={optionsListOpen}
                  optionsSidebarWidth={420}
                />
              )}

              {/* Campaign Stages */}
              {deal?.campaignStage && (
                <CampaignStages
                  mainStage={deal.campaignStage}
                  subStage={
                    deal.campaignStage === "draft"
                      ? deal.draftSubStage
                      : deal.campaignStage === "won"
                      ? deal.wonSubStage
                      : deal.lostSubStage
                  }
                  dealStart={deal.dealStart}
                  dealEnd={deal.dealEnd}
                  onStageChange={async (mainStage, subStage) => {
                    // Update the deal stage
                    const updatedDeal = { ...deal, campaignStage: mainStage };
                    
                    // Update substage based on main stage
                    if (mainStage === "draft") {
                      updatedDeal.draftSubStage = subStage as any;
                      updatedDeal.status = "Draft";
                    } else if (mainStage === "won") {
                      updatedDeal.wonSubStage = subStage as any;
                      // Update status based on won substage
                      if (subStage === "live") {
                        updatedDeal.status = "Live";
                      } else if (subStage === "paused") {
                        updatedDeal.status = "Paused";
                      } else if (subStage === "ended") {
                        updatedDeal.status = "Closed";
                      } else {
                        updatedDeal.status = "Live"; // Default for scheduled, sold_out
                      }
                    } else if (mainStage === "lost") {
                      updatedDeal.lostSubStage = subStage as any;
                      updatedDeal.status = "Closed Lost";
                    }
                    
                    try {
                      // Save the deal to persist the stage change
                      await updateDealFields(id || "1", {
                        campaignStage: updatedDeal.campaignStage,
                        draftSubStage: updatedDeal.draftSubStage,
                        wonSubStage: updatedDeal.wonSubStage,
                        lostSubStage: updatedDeal.lostSubStage,
                        status: updatedDeal.status,
                      });
                      setDeal(updatedDeal);
                      message.success("Campaign stage updated");
                    } catch (error) {
                      console.error("Error updating campaign stage:", error);
                      message.error("Failed to update campaign stage");
                    }
                  }}
                />
              )}

              {/* AI Generation Progress Card - Shows above Campaign Stages */}
              {isAIGenerating && (
                <Card style={{ marginBottom: token.margin }}>
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: token.margin }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: token.borderRadiusLG,
                          background: `${token.colorPrimary}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: token.colorPrimary,
                        }}
                      >
                        <Spin />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                          Generating Campaign with AI
                        </Title>
                        <Text type="secondary">
                          Our AI is creating compelling content for your deal...
                        </Text>
                      </div>
                    </div>
                    
                    {/* Loading Steps */}
                    <div style={{ marginTop: token.marginSM }}>
                      <Space direction="vertical" size="small" style={{ width: "100%" }}>
                        {[
                          { label: "Generating deal content", phase: 1, icon: <FileText size={16} /> },
                          { label: "Scraping and scoring images", phase: 2, icon: <ImageIcon size={16} /> },
                          { label: "Setting up redemption & locations", phase: 3, icon: <CircleCheck size={16} /> },
                          { label: "Creating fine print", phase: 4, icon: <Edit2 size={16} /> },
                        ].map((step, index) => {
                          const isComplete = aiGenerationPhase > step.phase;
                          const isCurrent = aiGenerationPhase === step.phase;
                          
                          return (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: token.marginSM,
                                padding: `${token.paddingSM}px ${token.padding}px`,
                                background:
                                  isComplete || isCurrent
                                    ? `${token.colorPrimary}08`
                                    : token.colorBgContainer,
                                borderRadius: token.borderRadius,
                                border: `1px solid ${
                                  isCurrent
                                    ? token.colorPrimary
                                    : token.colorBorder
                                }`,
                                transition: "all 0.3s ease",
                              }}
                            >
                              <div
                                style={{
                                  color:
                                    isComplete || isCurrent
                                      ? token.colorPrimary
                                      : token.colorTextSecondary,
                                }}
                              >
                                {isComplete ? (
                                  <CircleCheck size={16} />
                                ) : isCurrent ? (
                                  <Spin size="small" />
                                ) : (
                                  step.icon
                                )}
                              </div>
                              <Text
                                type={isComplete || isCurrent ? undefined : "secondary"}
                                strong={isCurrent}
                                style={{ flex: 1 }}
                              >
                                {step.label}
                              </Text>
                              {isComplete && (
                                <Tag color="success" style={{ margin: 0 }}>
                                  Done
                                </Tag>
                              )}
                              {isCurrent && (
                                <Tag color="processing" style={{ margin: 0 }}>
                                  In progress
                                </Tag>
                              )}
                            </div>
                          );
                        })}
                      </Space>
                      
                      {/* Progress Bar */}
                      <div style={{ marginTop: token.marginLG }}>
                        <Progress
                          percent={Math.round(aiProgress)}
                          status="active"
                          strokeColor={{
                            from: token.colorPrimary,
                            to: token.colorSuccess,
                          }}
                        />
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, marginTop: token.marginXS, display: "block", textAlign: "center" }}
                        >
                          {Math.round(aiProgress)}% complete • Estimated time: {Math.ceil((100 - aiProgress) / 100 * 15)}s
                        </Text>
                      </div>
                    </div>
                  </Space>
                </Card>
              )}

              <ContentEditor
                dealId={id || "1"}
                isNewDeal={isNewDeal}
                accountId={
                  params.accountId ||
                  searchParams.get("accountId") ||
                  selectedMerchantAccount?.id ||
                  deal?.accountId ||
                  undefined
                }
                onOptionSelect={(option) => {
                  setSelectedOption(option);
                  changeSidebarView("option-details");
                }}
                onOpenLibrary={(data) => {
                  setLibraryData(data);
                  setLibraryMediaType(data.mediaType);
                  changeSidebarView("library");
                }}
                onTitleSettingsOpen={() => {
                  changeSidebarView("title-settings");
                }}
                onContentChanges={(hasChanges, changeCount = 0) => {
                  setContentHasUnsavedChanges(hasChanges);
                  setContentUnpublishedCount(changeCount);
                  // Show pending state immediately when changes are detected
                  if (hasChanges) {
                    setContentPendingSave(true);
                  }
                }}
                onContentPublish={() => {
                  setContentHasUnsavedChanges(false);
                  setContentUnpublishedCount(0);
                  setContentPendingSave(false);
                }}
                onRegisterPublish={(publishFn) => {
                  contentEditorPublishRef.current = publishFn;
                }}
                onSavingStateChange={(isSaving) => {
                  setContentIsSaving(isSaving);
                  if (isSaving) {
                    setContentPendingSave(false); // Clear pending when save starts
                  }
                  if (!isSaving) {
                    setContentLastSaved(new Date());
                  }
                }}
              />

              {/* Options are managed via sidebar - no card in main content */}

              {/* Show Nearby Competitor Deals after AI generation completes */}
              {!isAIGenerating && deal.category && (
                <div style={{ marginTop: 24 }}>
                  <NearbyCompetitorDealsCard
                    currentDeal={deal}
                    competitorDeals={getCompetitorDeals(deal)}
                    onViewAll={() => {
                      // Could navigate to a competitor analysis page
                      message.info("Competitor analysis feature coming soon!");
                    }}
                  />
                </div>
              )}

              {/* Options Management Sidebars (Parent/Child Pattern) - Only on Content tab */}
              {optionsListOpen && (
                <OptionsListSidebar
                  open={optionsListOpen}
                  options={mappedOptions}
                  onClose={() => setOptionsListOpen(false)}
                  onOptionsChange={handleOptionsChange}
                  onOptionEdit={(option) => {
                    // Open option details in the right sidebar instead of edit sidebar
                    setSelectedOption(option);
                    changeSidebarView("option-details");
                  }}
                  rightOffset={rightSidebarTotalWidth + (optionEditOpen ? 420 : 0)}
                  settingsOpen={settingsOpen}
                  onSettingsToggle={(open) => {
                    if (open) {
                      // Opening settings
                      setOptionsListSettingsOpen(true);
                      changeSidebarView("settings");
                    } else {
                      // Closing settings
                      setOptionsListSettingsOpen(false);
                      changeSidebarView("default");
                      // If we auto-opened the sidebar, collapse it
                      if (wasAutoOpenedRef.current) {
                        setActiveRightSidebarTab(null);
                        wasAutoOpenedRef.current = false;
                      }
                    }
                  }}
                  useDecimals={useDecimals}
                  onUseDecimalsChange={setUseDecimals}
                />
              )}

              {optionEditOpen && (
                <OptionEditSidebar
                  open={optionEditOpen}
                  option={editingOption}
                  onClose={() => {
                    setOptionEditOpen(false);
                    setEditingOption(null);
                  }}
                  onUpdate={(field, value) => {
                    if (!editingOption) return;
                    const newOptions = mappedOptions.map((opt) =>
                      opt.id === editingOption.id ? { ...opt, [field]: value } : opt
                    );
                    handleOptionsChange(newOptions);
                    setEditingOption({ ...editingOption, [field]: value });
                  }}
                  onRemove={() => {
                    if (!editingOption) return;
                    const newOptions = mappedOptions.filter((opt) => opt.id !== editingOption.id);
                    handleOptionsChange(newOptions);
                    setOptionEditOpen(false);
                    setEditingOption(null);
                  }}
                  rightOffset={rightSidebarTotalWidth}
                />
              )}
            </div>
          )}

          {activeView === "Business Details" && deal && (
            <div style={{ paddingTop: 24 }}>
              <BusinessTabContent
              accountId={params.accountId || searchParams.get("accountId") || undefined}
              dealId={id || "1"}
              // Deal metadata
              dealCategory={deal.category}
              maxDiscount={Math.max(...deal.options.map(opt => opt.discount || 0))}
              // Proof of Pricing
              proofOfPricingFiles={[]}
              onProofOfPricingChange={(files) => {
                // Handle proof of pricing file uploads
              }}
              // Licenses
              licenseFiles={[]}
              onLicenseFilesChange={(files) => {
              }}
              licenseNotes={(deal as any).licenseNotes || ""}
              onLicenseNotesChange={async (value) => {
                const updatedDeal = { ...deal, licenseNotes: value } as any;
                setDeal(updatedDeal);
                await updateDealFields(id || "1", { licenseNotes: value } as any);
              }}
              // Payment Terms
              paymentTerm={(deal as any).paymentTerm || "on_redeem"}
              onPaymentTermChange={async (value) => {
                const updatedDeal = { ...deal, paymentTerm: value } as any;
                setDeal(updatedDeal);
                await updateDealFields(id || "1", { paymentTerm: value } as any);
                message.success(`Payment term updated to: ${value.replace(/_/g, ' ')}`);
              }}
              // Deal Schedule
              dealStartDate={deal.dealStart}
              dealEndDate={deal.dealEnd}
              voucherExpirationDays={(deal as any).voucherExpirationDays || 90}
              onDealStartDateChange={async (value) => {
                const updatedDeal = { ...deal, dealStart: value };
                setDeal(updatedDeal);
                await updateDealFields(id || "1", { dealStart: value });
              }}
              onDealEndDateChange={async (value) => {
                const updatedDeal = { ...deal, dealEnd: value };
                setDeal(updatedDeal);
                await updateDealFields(id || "1", { dealEnd: value });
              }}
              onVoucherExpirationDaysChange={async (value) => {
                const updatedDeal = { ...deal, voucherExpirationDays: value } as any;
                setDeal(updatedDeal);
                await updateDealFields(id || "1", { voucherExpirationDays: value } as any);
              }}
              // Locations
              locationCount={deal.locationIds?.length || 0}
              onManageLocations={() => {
                setActiveView("Content");
                // Scroll to locations section
                setTimeout(() => {
                  const locationsSection = document.getElementById("locations-section");
                  if (locationsSection) {
                    const headerOffset = 234;
                    const elementPosition = locationsSection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: "smooth"
                    });
                  }
                }, 300);
              }}
              // Pass account-level data
              accountWebsite={selectedMerchantAccount?.website}
              accountPhone={selectedMerchantAccount?.phone}
              accountEmail={selectedMerchantAccount?.contactEmail}
              accountAddress={selectedMerchantAccount?.address}
              accountBusinessHours={selectedMerchantAccount?.businessHours}
              accountBusinessName={selectedMerchantAccount?.name}
              // Pass deal-specific data (if customized)
              dealWebsite={deal?.customWebsite}
              dealPhone={deal?.customPhone}
              dealEmail={deal?.customEmail}
              dealAddress={deal?.customAddress}
              dealBusinessHours={deal?.customBusinessHours}
              // Callbacks for editing deal-specific details
              onDealWebsiteChange={async (value) => {
                if (deal) {
                  const updatedDeal = { ...deal, customWebsite: value };
                  setDeal(updatedDeal);
                  await updateDealFields(id || "1", { customWebsite: value });
                }
              }}
              onDealPhoneChange={async (value) => {
                if (deal) {
                  const updatedDeal = { ...deal, customPhone: value };
                  setDeal(updatedDeal);
                  await updateDealFields(id || "1", { customPhone: value });
                }
              }}
              onDealEmailChange={async (value) => {
                if (deal) {
                  const updatedDeal = { ...deal, customEmail: value };
                  setDeal(updatedDeal);
                  await updateDealFields(id || "1", { customEmail: value });
                }
              }}
              onDealAddressChange={async (value) => {
                if (deal) {
                  const updatedDeal = { ...deal, customAddress: value };
                  setDeal(updatedDeal);
                  await updateDealFields(id || "1", { customAddress: value });
                }
              }}
              onDealBusinessHoursChange={async (value) => {
                if (deal) {
                  const updatedDeal = { ...deal, customBusinessHours: value };
                  setDeal(updatedDeal);
                  await updateDealFields(id || "1", { customBusinessHours: value });
                }
              }}
            />
            </div>
          )}

          {activeView === "Preview" && (
            <div style={{ paddingTop: 24 }}>
              {/* Device Preview - Full Page View */}
              <Card>
                <DevicePreviewContent 
                  deal={deal} 
                  merchant={selectedMerchantAccount}
                  token={token}
                  windowWidth={windowWidth}
                />
              </Card>
            </div>
          )}

          {activeView === "Reviews" && (
            <div style={{ paddingTop: 24 }}>
              <Card>
                <Text type="secondary">Reviews tab - Coming soon...</Text>
              </Card>
            </div>
          )}
        </div>

        {/* Universal Right Sidebar - Google Workspace Style */}
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
            
            // When switching tabs (not collapsing), keep sidebar open but switch to default view
            if (tab && tab !== activeRightSidebarTab) {
              setDefaultSidebarTab(tab);
              // User explicitly switched tabs, so they want sidebar open - reset auto-open flag
              wasAutoOpenedRef.current = false;
              // Reset to default view when switching tabs (clear option details/settings)
              if (sidebarView !== "default") {
                changeSidebarView("default");
                setSelectedOption(null);
                setOptionsListSettingsOpen(false);
              }
            }
            
            // When collapsing sidebar (tab becomes null), reset to default view
            if (!tab && sidebarView !== "default") {
              changeSidebarView("default");
              setSelectedOption(null);
              setOptionsListSettingsOpen(false);
              wasAutoOpenedRef.current = false; // Reset flag when user explicitly collapses
            }
          }}
          showHeader={false}
          showBackButton={false}
          width={sidebarWidth}
          topOffset={LAYOUT_CONSTANTS.HEADER_TOP_OFFSET}
          resizable={true}
          minWidth={LAYOUT_CONSTANTS.SIDEBAR_WIDTH_MIN}
          maxWidth={LAYOUT_CONSTANTS.SIDEBAR_WIDTH_MAX}
          storageKey="deal-detail"
          onWidthChange={(totalWidth) => {
            // GoogleWorkspaceSidebar returns total width (content + tab bar)
            // Extract just the content width for our state
            const contentWidth = activeRightSidebarTab ? totalWidth - 56 : LAYOUT_CONSTANTS.SIDEBAR_WIDTH_DEFAULT;
            setSidebarWidth(contentWidth);
          }}
          onResizingChange={(resizing) => setIsSidebarResizing(resizing)}
          zIndex={10}
          extraIcon={
            sidebarView === "option-details" ? {
              icon: FileText,
              label: 'Option',
              tooltip: 'Back to main view',
              onClick: () => {
                changeSidebarView("default");
                setSelectedOption(null);
                // If we auto-opened the sidebar, collapse it
                if (wasAutoOpenedRef.current) {
                  setActiveRightSidebarTab(null);
                  wasAutoOpenedRef.current = false;
                }
              },
              active: true
            } : sidebarView === "library" ? {
              icon: ImageIcon,
              label: 'Media',
              tooltip: 'Back to main view',
              onClick: () => {
                changeSidebarView("default");
                setLibraryData(null);
                setLibraryTab("merchant");
                setLibrarySearch("");
                setLibraryMediaType("image");
              },
              active: true
            } : sidebarView === "account-selector" ? {
              icon: Users,
              label: 'Account',
              tooltip: 'Back to main view',
              onClick: () => {
                changeSidebarView("default");
              },
              active: true
            } : sidebarView === "title-settings" ? {
              icon: Edit2,
              label: 'Settings',
              tooltip: 'Back to main view',
              onClick: () => {
                changeSidebarView("default");
              },
              active: true
            } : sidebarView === "ai-assistant" ? {
              icon: Sparkles,
              label: 'AI',
              tooltip: 'Back to main view',
              onClick: () => {
                changeSidebarView("default");
              },
              active: true
            } : sidebarView === "person-details" ? {
              icon: User,
              label: 'Person',
              tooltip: 'Back to main view',
              onClick: () => {
                changeSidebarView("default");
                setSelectedPerson(null);
              },
              active: true
            } : sidebarView === "settings" ? {
              icon: Settings,
              label: 'Settings',
              tooltip: 'Back to main view',
              onClick: () => {
                changeSidebarView("default");
                setOptionsListSettingsOpen(false);
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
          <div style={{ overflowY: "auto", flex: 1 }}>
              {/* Show full sidebar content during AI generation */}
              {isAIGenerating && sidebarView === "default" && (
                <DefaultSidebarContent 
                  isNewDeal={isNewDeal} 
                  deal={deal}
                  selectedMerchantAccount={selectedMerchantAccount}
                  onPersonClick={handlePersonClick}
                />
              )}

              {/* Manager Review Panel - Show when in pre_qualification and user is MM or Admin */}
              {!isAIGenerating && sidebarView === "default" && deal?.campaignStage === "draft" && deal?.draftSubStage === "pre_qualification" && (currentRole === "mm" || currentRole === "admin") && deal?.aiReviewResult && (
                <div style={{ padding: token.paddingLG }}>
                  <ManagerReviewPanel
                    dealId={deal.id}
                    dealTitle={deal.title}
                    aiReviewResult={deal.aiReviewResult}
                    escalationReason={deal.escalationReason}
                    onApprove={async () => {
                      const updatedDeal = { ...deal, draftSubStage: "presentation" as const };
                      setDeal(updatedDeal);
                      try {
                        await updateDealFields(id || "1", { draftSubStage: "presentation" });
                        message.success("Deal approved! Moved to Presentation stage.");
                      } catch (error) {
                        console.error("Error approving deal:", error);
                        message.error("Failed to approve deal");
                      }
                    }}
                    onRequestChanges={async () => {
                      const updatedDeal = { ...deal, draftSubStage: "prospecting" as const };
                      setDeal(updatedDeal);
                      try {
                        await updateDealFields(id || "1", { draftSubStage: "prospecting" });
                        message.info("Deal sent back to Prospecting for changes.");
                      } catch (error) {
                        console.error("Error sending deal back:", error);
                        message.error("Failed to send deal back");
                      }
                    }}
                    onReject={async () => {
                      const updatedDeal = { 
                        ...deal, 
                        campaignStage: "lost" as const,
                        lostSubStage: "closed_lost" as const,
                      };
                      setDeal(updatedDeal);
                      try {
                        await updateDealFields(id || "1", { 
                          campaignStage: "lost",
                          lostSubStage: "closed_lost",
                        });
                        message.warning("Deal rejected and marked as lost.");
                      } catch (error) {
                        console.error("Error rejecting deal:", error);
                        message.error("Failed to reject deal");
                      }
                    }}
                  />
                </div>
              )}
              
              {!isAIGenerating && sidebarView === "default" && (
                <DefaultSidebarContent 
                  isNewDeal={isNewDeal} 
                  deal={deal}
                  selectedMerchantAccount={selectedMerchantAccount}
                  activeTab={defaultSidebarTab}
                  onPersonClick={handlePersonClick}
                />
              )}

              {sidebarView === "option-details" && selectedOption && (
                <div style={{ padding: `${token.paddingLG}px ${token.paddingLG}px ${token.paddingLG}px ${token.paddingLG}px` }}>
                  <DealOptionDetailsContent
                    option={selectedOption}
                    onUpdate={(field, value) => {
                      // Update the option in the main options array
                      const newOptions = mappedOptions.map((opt) =>
                        opt.id === selectedOption.id
                          ? { ...opt, [field]: value }
                          : opt
                      );
                      handleOptionsChange(newOptions);
                      setSelectedOption({ ...selectedOption, [field]: value });
                    }}
                    onRemove={() => {
                      const newOptions = mappedOptions.filter(
                        (opt) => opt.id !== selectedOption.id
                      );
                      handleOptionsChange(newOptions);
                      changeSidebarView("default");
                      setSelectedOption(null);
                    }}
                    onClose={() => {
                      // Close option details
                      changeSidebarView("default");
                      setSelectedOption(null);
                      // If we auto-opened the sidebar, collapse it
                      if (wasAutoOpenedRef.current) {
                        setActiveRightSidebarTab(null);
                        wasAutoOpenedRef.current = false;
                      }
                    }}
                  />
                </div>
              )}

              {sidebarView === "library" && libraryData && (
                <LibrarySidebarContent
                  libraryData={libraryData}
                  libraryTab={libraryTab}
                  setLibraryTab={setLibraryTab}
                  librarySearch={librarySearch}
                  setLibrarySearch={setLibrarySearch}
                  libraryMediaType={libraryMediaType}
                  onUpdateSelection={(selectedIds) => {
                    setLibraryData({ ...libraryData, selectedIds });
                  }}
                  onCancel={() => {
                    changeSidebarView("default");
                    setLibraryData(null);
                    setLibraryTab("merchant");
                    setLibrarySearch("");
                    setLibraryMediaType("image");
                  }}
                  onAddItems={() => {
                    libraryData.onSelectItems(libraryData.selectedIds);
                    changeSidebarView("default");
                    setLibraryData(null);
                    setLibraryTab("merchant");
                    setLibrarySearch("");
                    setLibraryMediaType("image");
                  }}
                />
              )}

              {sidebarView === "account-selector" && (
                <AccountSelectorSidebarContent
                  selectedAccountId={selectedMerchantAccount?.id}
                  onSelect={handleAccountSelection}
                />
              )}

              {sidebarView === "title-settings" && deal && (
                <div style={{ padding: `${token.paddingLG}px ${token.paddingLG}px ${token.paddingLG}px ${token.paddingLG}px` }}>
                  <TitleSettingsContent
                    title={deal.title}
                    galleryTitle={deal.galleryTitle}
                    shortDescriptor={deal.shortDescriptor}
                    descriptor={deal.descriptor}
                    originalTitle={deal.title}
                    originalGalleryTitle={deal.galleryTitle}
                    originalShortDescriptor={deal.shortDescriptor}
                    originalDescriptor={deal.descriptor}
                    isGalleryTitleAuto={deal.isGalleryTitleAuto}
                    isDescriptorAuto={deal.isDescriptorAuto}
                    onTitleChange={(title) => {
                      setDeal({ ...deal, title });
                    }}
                    onGalleryTitleChange={(galleryTitle) => {
                      setDeal({ ...deal, galleryTitle });
                    }}
                    onShortDescriptorChange={(shortDescriptor) => {
                      setDeal({ ...deal, shortDescriptor });
                    }}
                    onDescriptorChange={(descriptor) => {
                      setDeal({ ...deal, descriptor });
                    }}
                    onIsGalleryTitleAutoChange={(isGalleryTitleAuto) => {
                      setDeal({ ...deal, isGalleryTitleAuto });
                    }}
                    onIsDescriptorAutoChange={(isDescriptorAuto) => {
                      setDeal({ ...deal, isDescriptorAuto });
                    }}
                  />
                </div>
              )}

              {sidebarView === "ai-assistant" && (
                <AIAssistantPanel
                  context={{
                    dealId: deal?.id,
                    dealTitle: deal?.title,
                    merchant: selectedMerchantAccount?.name,
                    category: deal?.category,
                  }}
                />
              )}

              {sidebarView === "person-details" && selectedPerson && (
                <PersonDetailContent
                  person={selectedPerson}
                  onPersonClick={handlePersonClick}
                />
              )}
              
              {sidebarView === "settings" && (
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
              )}
          </div>
        </GoogleWorkspaceSidebar>
      </div>

      {/* Device Preview Modal */}
      {deal && (
        <DevicePreviewModal
          open={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          deal={deal}
          merchant={selectedMerchantAccount}
        />
      )}
    </div>
  );
};

export default DealDetail;
