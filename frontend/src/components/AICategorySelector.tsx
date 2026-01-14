import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  theme,
  Row,
  Col,
  Tag,
  Skeleton,
  Spin,
  Modal,
  Alert,
  Select,
  Switch,
  InputNumber,
  Badge,
} from "antd";

const { Link } = Typography;
import {
  Sparkles,
  Utensils,
  Users,
  Package,
  ExternalLink,
  Plus,
  Settings,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { MerchantAccount } from "../data/merchantAccounts";
import {
  getRecommendedCategory,
  getSubcategories,
  generatePricingOptions,
  CategoryRecommendation,
  GeneratedOption,
  SubcategoryOption,
} from "../lib/aiRecommendations";
import SortableOptionItem, { OptionItemData } from "./ContentEditor/SortableOptionItem";
import { SearchableServiceSelector } from "./SearchableServiceSelector";
import { useUserPreferences } from "../contexts/UserPreferencesContext";

const { Title, Text } = Typography;
const { useToken } = theme;

// Category definitions
interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const allCategories: Category[] = [
  {
    id: "food-drink",
    name: "Food & Drink",
    icon: <Utensils size={20} />,
    description: "Restaurants, cafes, bars",
  },
  {
    id: "health-beauty",
    name: "Health & Beauty",
    icon: <Sparkles size={20} />,
    description: "Spas, salons, wellness",
  },
  {
    id: "activities",
    name: "Activities",
    icon: <Users size={20} />,
    description: "Adventures, fitness, entertainment",
  },
  {
    id: "goods",
    name: "Goods & Products",
    icon: <Package size={20} />,
    description: "Products, retail items",
  },
];

interface AICategorySelectorProps {
  accountName: string;
  account: MerchantAccount;
  onCategorySelect: (
    categoryId: string,
    subcategoryId: string | undefined,
    options: GeneratedOption[]
  ) => void;
  onExpectationsChange?: (expectations: {
    totalProjectedRevenue: number;
    totalProjectedOrders: number;
    marketDemand?: string;
    confidence?: number;
    seasonality?: string;
  } | null) => void;
  onBack: () => void;
  sidebarWidth?: number;
  // Callback when category selection changes (for sidebar updates)
  onStageChange?: (stage: 'category' | 'subcategory' | 'options', categoryId?: string, subcategoryId?: string) => void;
  // Callback when option is selected for editing
  onOptionSelect?: (option: any) => void;
  // Callback when option is updated (bidirectional sync)
  onOptionUpdate?: (optionId: string, updatedOption: any) => void;
  // Callback to register the option edit handler (for sidebar updates)
  onRegisterOptionEditHandler?: (handler: (optionId: string, field: string, value: any) => void) => void;
  // Controlled decimal toggle state
  useDecimals?: boolean;
  onUseDecimalsChange?: (value: boolean) => void;
  // Controlled settings panel state
  settingsOpen?: boolean;
  onSettingsToggle?: (open: boolean) => void;
}

const AICategorySelector: React.FC<AICategorySelectorProps> = ({
  accountName: _accountName,
  account,
  onCategorySelect,
  onExpectationsChange,
  onBack,
  onStageChange,
  sidebarWidth = 0,
  onOptionSelect,
  onOptionUpdate,
  onRegisterOptionEditHandler,
  useDecimals: controlledUseDecimals,
  onUseDecimalsChange,
  settingsOpen: controlledSettingsOpen,
  onSettingsToggle,
}) => {
  const { token } = useToken();
  const { debugMode, setHasDebugControls } = useUserPreferences();
  
  // Register that this page has debug controls
  useEffect(() => {
    setHasDebugControls(true);
    return () => {
      setHasDebugControls(false);
    };
  }, [setHasDebugControls]);
  
  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisStep, setAnalysisStep] = useState(0);
  
  // State - Category → PDS/Subcategory flow
  const [recommendation, setRecommendation] = useState<CategoryRecommendation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [availablePDS, setAvailablePDS] = useState<SubcategoryOption[]>([]);
  const [selectedPDS, setSelectedPDS] = useState<SubcategoryOption | null>(null);
  const [generatedOptions, setGeneratedOptions] = useState<GeneratedOption[]>([]);
  
  // Modal states
  const [creating, setCreating] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  
  // Editing state - track which specific field is being edited
  const [editingField, setEditingField] = useState<{
    optionId: string;
    field: string;
  } | null>(null);
  
  // Decimal precision toggle - can be controlled or uncontrolled
  const [internalUseDecimals, setInternalUseDecimals] = useState(false);
  const useDecimals = controlledUseDecimals !== undefined ? controlledUseDecimals : internalUseDecimals;
  const setUseDecimals = (value: boolean) => {
    if (onUseDecimalsChange) {
      onUseDecimalsChange(value);
    } else {
      setInternalUseDecimals(value);
    }
  };
  
  // Settings panel toggle - can be controlled or uncontrolled
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);
  const settingsOpen = controlledSettingsOpen !== undefined ? controlledSettingsOpen : internalSettingsOpen;
  const setSettingsOpen = (value: boolean) => {
    if (onSettingsToggle) {
      onSettingsToggle(value);
    } else {
      setInternalSettingsOpen(value);
    }
  };
  
  // Merchant margin state (default 30%)
  const [defaultMerchantMargin, setDefaultMerchantMargin] = useState(30);
  
  // Track options that are currently checking for pricing
  const [loadingPricing, setLoadingPricing] = useState<Set<string>>(new Set());
  
  // Loading state for options generation
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  
  // Cache for loaded options per PDS
  const [optionsCache, setOptionsCache] = useState<Record<string, {
    options: GeneratedOption[];
  }>>({});
  
  // Debug mode - toggle scraping success scenarios
  const [debugScrapingMode, setDebugScrapingMode] = useState<"all" | "partial" | "none">("partial");
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setGeneratedOptions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  // Re-generate options when debug mode changes
  useEffect(() => {
    if (selectedPDS && selectedCategory && generatedOptions.length > 0) {
      // Apply debug mode to existing options
      const updatedOptions = generatedOptions.map((opt, index) => {
        if (debugScrapingMode === "all") {
          return { ...opt, pricingSource: "merchant_scraped" as const };
        } else if (debugScrapingMode === "none") {
          return { ...opt, pricingSource: "similar_deals" as const };
        } else {
          // Partial - alternate
          return { ...opt, pricingSource: index % 2 === 0 ? "merchant_scraped" as const : "similar_deals" as const };
        }
      });
      setGeneratedOptions(updatedOptions);
    }
  }, [debugScrapingMode]);
  
  // Display limit for categories
  const [displayLimit, setDisplayLimit] = useState(10);

  // Analysis steps - simplified
  const analysisSteps = [
    { label: "Scraping website" },
    { label: "Analyzing data" },
    { label: "Generating recommendations" },
  ];

  // Simulate AI analysis on mount
  useEffect(() => {
    const runAnalysis = async () => {
      // Step through quickly
      for (let i = 0; i < analysisSteps.length; i++) {
        setAnalysisStep(i);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s per step = 3s total
      }
      
      // Analysis complete - load category recommendation
      const rec = getRecommendedCategory(account);
      setRecommendation(rec);
      
      // Auto-select recommended category
      const recCat = allCategories.find((c) => c.id === rec.categoryId);
      if (recCat) {
        handleCategorySelect(recCat);
      }
      
      setIsAnalyzing(false);
    };
    
    runAnalysis();
  }, [account]);

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    
    // Notify parent of category selection
    if (onStageChange) {
      onStageChange('subcategory', category.id);
    }
    
    // Load PDS/subcategories for this category
    const subcats = getSubcategories(category.id, account);
    setAvailablePDS(subcats);
    
    // Reset display limit when changing category
    setDisplayLimit(10);
    
    // Auto-select the first recommended PDS
    const recommended = subcats.find((sub) => sub.recommended) || subcats[0];
    if (recommended) {
      handlePDSSelect(recommended, category);
    }
  };

  const handlePDSSelect = async (pds: SubcategoryOption, category?: Category) => {
    setSelectedPDS(pds);
    
    // Use passed category or fall back to state
    const categoryToUse = category || selectedCategory;
    if (!categoryToUse) return;
    
    // Notify parent of subcategory selection
    if (onStageChange) {
      onStageChange('options', categoryToUse.id, pds.id);
    }
    
    // Check if options are already cached for this PDS
    if (optionsCache[pds.id]) {
      // Load instantly from cache
      const cached = optionsCache[pds.id];
      // Ensure all cached options have enabled: true by default
      // merchantMargin stays as-is (undefined = uses default, defined = custom)
      const optionsWithEnabled = cached.options.map((opt: any) => ({
        ...opt,
        enabled: opt.enabled !== undefined ? opt.enabled : true,
      }));
      setGeneratedOptions(optionsWithEnabled);
      return;
    }
    
    // Show loading state for new category
    setIsLoadingOptions(true);
    setGeneratedOptions([]);
    
    // Simulate 10-second AI generation delay
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Generate pricing options based on category and PDS
    let options = generatePricingOptions(account, categoryToUse.id, pds.id);
    
    // Apply debug scraping mode and set enabled: true for all options
    options = options.map((opt, index) => {
      const updatedOpt: any = { 
        ...opt, 
        enabled: true, // All generated options are active by default
        // Don't set merchantMargin - leave undefined so it uses defaultMerchantMargin
        // merchantMargin will only be set when user explicitly customizes it
        // Set grouponMargin to match defaultMerchantMargin initially
        grouponMargin: defaultMerchantMargin,
      };
      
      if (debugScrapingMode === "all") {
        // All merchant scraped
        updatedOpt.pricingSource = "merchant_scraped" as const;
      } else if (debugScrapingMode === "none") {
        // None scraped
        updatedOpt.pricingSource = "similar_deals" as const;
      } else {
        // Partial - alternate between scraped and estimated
        updatedOpt.pricingSource = index % 2 === 0 ? "merchant_scraped" as const : "similar_deals" as const;
      }
      
      return updatedOpt;
    });
    
    setGeneratedOptions(options);
    
    // Cache the results
    setOptionsCache(prev => ({
      ...prev,
      [pds.id]: {
        options,
      },
    }));
    
    setIsLoadingOptions(false);
  };

  const handleOptionEdit = React.useCallback((optionId: string, field: string, value: any) => {
    setGeneratedOptions((prev) =>
      prev.map((opt) => {
        if (opt.id === optionId) {
          const updated: GeneratedOption = { ...opt, [field]: value };
          
          // Helper to round based on decimal setting
          const roundValue = (val: number) => {
            return useDecimals ? Math.round(val * 100) / 100 : Math.round(val);
          };
          
          // Recalculate related fields based on what was changed
          if (field === 'regularPrice') {
            const regularPrice = value;
            const grouponPrice = opt.grouponPrice;
            updated.discount = Math.round(((regularPrice - grouponPrice) / regularPrice) * 100);
            // Use grouponMargin to calculate merchantMargin and merchantPayout
            const grouponMargin = opt.grouponMargin !== undefined ? opt.grouponMargin : (100 - defaultMerchantMargin);
            const merchantMargin = 100 - grouponMargin;
            updated.merchantMargin = merchantMargin;
            updated.grouponMargin = grouponMargin;
            updated.merchantPayout = Math.round((grouponPrice * merchantMargin) / 100);
            updated.margin = roundValue(grouponPrice * 0.5);
          } else if (field === 'grouponPrice') {
            const regularPrice = opt.regularPrice;
            const grouponPrice = value;
            updated.discount = Math.round(((regularPrice - grouponPrice) / regularPrice) * 100);
            // Use grouponMargin to calculate merchantMargin and merchantPayout
            const grouponMargin = opt.grouponMargin !== undefined ? opt.grouponMargin : (100 - defaultMerchantMargin);
            const merchantMargin = 100 - grouponMargin;
            updated.merchantMargin = merchantMargin;
            updated.grouponMargin = grouponMargin;
            updated.merchantPayout = Math.round((grouponPrice * merchantMargin) / 100);
            updated.margin = roundValue(grouponPrice * 0.5);
          } else if (field === 'discount') {
            const newDiscount = value;
            const regularPrice = opt.regularPrice;
            updated.grouponPrice = roundValue(regularPrice * (1 - newDiscount / 100));
            // Use grouponMargin to calculate merchantMargin and merchantPayout
            const grouponMargin = opt.grouponMargin !== undefined ? opt.grouponMargin : (100 - defaultMerchantMargin);
            const merchantMargin = 100 - grouponMargin;
            updated.merchantMargin = merchantMargin;
            updated.grouponMargin = grouponMargin;
            updated.merchantPayout = Math.round((updated.grouponPrice * merchantMargin) / 100);
            updated.margin = roundValue(updated.grouponPrice * 0.5);
          } else if (field === 'merchantMargin') {
            const merchantMargin = value !== null && value !== undefined ? value : defaultMerchantMargin;
            updated.merchantMargin = merchantMargin;
            // Calculate grouponMargin: if merchant gets X%, groupon gets (100-X)%
            const grouponMargin = 100 - merchantMargin;
            updated.grouponMargin = grouponMargin;
            updated.merchantPayout = Math.round((opt.grouponPrice * merchantMargin) / 100);
          } else if (field === 'grouponMargin') {
            const grouponMargin = value !== null && value !== undefined ? value : (100 - defaultMerchantMargin);
            updated.grouponMargin = grouponMargin;
            // Calculate merchantMargin: if groupon gets X%, merchant gets (100-X)%
            const merchantMargin = 100 - grouponMargin;
            updated.merchantMargin = merchantMargin;
            updated.merchantPayout = Math.round((opt.grouponPrice * merchantMargin) / 100);
          } else if (field === 'merchantPayout') {
            // If merchantPayout is set directly, calculate merchantMargin
            const merchantPayout = value;
            if (opt.grouponPrice > 0) {
              const calculatedMargin = Math.round((merchantPayout / opt.grouponPrice) * 100);
              updated.merchantMargin = calculatedMargin;
              // Calculate grouponMargin from merchantMargin
              const grouponMargin = 100 - calculatedMargin;
              updated.grouponMargin = grouponMargin;
            }
          }
          
          // Notify parent of the complete updated option so it can sync the sidebar
          if (onOptionUpdate) {
            onOptionUpdate(optionId, updated);
          }
          
          return updated;
        }
        return opt;
      })
    );
  }, [onOptionUpdate, useDecimals, defaultMerchantMargin]);
  
  // Register the option edit handler with parent
  useEffect(() => {
    if (onRegisterOptionEditHandler) {
      onRegisterOptionEditHandler(handleOptionEdit);
    }
  }, [onRegisterOptionEditHandler, handleOptionEdit]);
  
  // Convert all option values when decimal setting changes
  useEffect(() => {
    if (generatedOptions.length === 0) return;
    
    setGeneratedOptions((prev) =>
      prev.map((opt) => {
        // Helper to round based on decimal setting
        const roundValue = (val: number) => {
          return useDecimals ? Math.round(val * 100) / 100 : Math.round(val);
        };
        
        return {
          ...opt,
          regularPrice: roundValue(opt.regularPrice),
          grouponPrice: roundValue(opt.grouponPrice),
          margin: opt.margin ? roundValue(opt.margin) : opt.margin,
        };
      })
    );
  }, [useDecimals]);

  // Check for pricing when option name is finalized
  const handleNameComplete = async (optionId: string, optionName: string) => {
    if (!optionName || optionName === "New Option" || optionName.trim().length < 3) {
      return;
    }

    setLoadingPricing((prev) => new Set(prev).add(optionId));
    await new Promise(resolve => setTimeout(resolve, 4000));
    setLoadingPricing((prev) => {
      const newSet = new Set(prev);
      newSet.delete(optionId);
      return newSet;
    });
  };

  const handleAddOption = () => {
    const newOption: any = {
      id: `option-${Date.now()}`,
      name: "New Option",
      regularPrice: 100,
      grouponPrice: 50,
      discount: 50,
      margin: 25,
      // Set grouponMargin (default 50% if defaultMerchantMargin is 50%)
      // merchantMargin will be calculated as 100 - grouponMargin
      grouponMargin: 100 - defaultMerchantMargin,
      merchantMargin: defaultMerchantMargin,
      merchantPayout: Math.round((50 * defaultMerchantMargin) / 100),
      projectedSales: 100,
      confidence: 0.7,
      reasoning: "Custom option",
      targetAudience: "General",
      pricingSource: "similar_deals",
      similarDealsReference: "Manual entry based on merchant input",
      enabled: true, // All new options are active by default
    };
    
    setGeneratedOptions((prev) => [...prev, newOption]);
    setTimeout(() => {
      setEditingField({ optionId: newOption.id, field: 'name' });
    }, 100);
  };

  const handleRemoveOption = (optionId: string) => {
    setGeneratedOptions((prev) => prev.filter((opt) => opt.id !== optionId));
  };

  const handleCreateDeal = async () => {
    setCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    onCategorySelect(
      selectedPDS?.category || "food-drink",
      selectedPDS?.subcategory,
      generatedOptions
    );
  };

  // Calculate metrics
  const totalProjectedRevenue = generatedOptions.reduce(
    (sum, opt) => sum + opt.projectedSales * opt.grouponPrice,
    0
  );
  const totalProjectedOrders = generatedOptions.reduce(
    (sum, opt) => sum + opt.projectedSales,
    0
  );

  // Update expectations when selectedPDS or generatedOptions change
  useEffect(() => {
    if (onExpectationsChange) {
      if (selectedPDS && generatedOptions.length > 0) {
        onExpectationsChange({
          totalProjectedRevenue,
          totalProjectedOrders,
          marketDemand: selectedPDS.marketDemand,
          confidence: selectedPDS.confidence,
          seasonality: selectedPDS.seasonality,
        });
      } else {
        onExpectationsChange(null);
      }
    }
  }, [selectedPDS, generatedOptions, totalProjectedRevenue, totalProjectedOrders, onExpectationsChange]);

  // Show compact loading state during analysis
  if (isAnalyzing) {
    return (
      <div style={{ 
        marginRight: sidebarWidth > 0 ? `${sidebarWidth + 24}px` : 0,
        transition: "margin-right 0.3s ease",
      }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: "0 auto",
          padding: "0 clamp(8px, 2vw, 0px) clamp(80px, 12vh, 100px) clamp(8px, 2vw, 0px)",
        }}>
          {/* Compact Loading */}
          <Alert
           message={
             <Space>
               <Spin size="small" />
               <Text strong style={{ fontSize: 14 }}>AI Analysis</Text>
               <Text type="secondary" style={{ fontSize: 13 }}>{analysisSteps[analysisStep].label}...</Text>
             </Space>
           }
           description={
             <Space size={20} style={{ marginTop: 16 }}>
               {analysisSteps.map((step, index) => (
                 <div
                   key={index}
                   style={{
                     display: "flex",
                     alignItems: "center",
                     gap: 8,
                     opacity: index <= analysisStep ? 1 : 0.35,
                     transition: "opacity 0.3s",
                   }}
                 >
                   <div
                     style={{
                       width: 24,
                       height: 24,
                       borderRadius: 6,
                       background:
                         index < analysisStep
                           ? '#52c41a'
                           : index === analysisStep
                           ? '#1890ff'
                           : '#f5f5f5',
                       display: "flex",
                       alignItems: "center",
                       justifyContent: "center",
                       color: index <= analysisStep ? "white" : '#8c8c8c',
                       fontSize: 11,
                       fontWeight: 600,
                     }}
                   >
                     {index < analysisStep ? "✓" : index + 1}
                   </div>
                   <Text style={{ fontSize: 13, color: '#595959' }}>{step.label}</Text>
                 </div>
               ))}
             </Space>
           }
           showIcon={false}
           style={{ 
             marginBottom: 24,
             background: '#ffffff',
             border: `1px solid #e8e8e8`,
             borderRadius: 8,
           }}
         />

        {/* Skeleton Loaders */}
        <Row gutter={[{ xs: 12, sm: 16, md: 20 }, { xs: 12, sm: 16, md: 20 }]}>
          <Col xs={24} sm={24} md={24} lg={10} xl={10}>
            <Card 
              size="small" 
              title="Category Recommendations"
              style={{
                borderRadius: 8,
                border: '1px solid #e8e8e8',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
              }}
            >
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          </Col>
          
          <Col xs={24} sm={24} md={24} lg={14} xl={14}>
            <Card 
              size="small" 
              title="Deal Options"
              style={{
                borderRadius: 8,
                border: '1px solid #e8e8e8',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
              }}
            >
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          </Col>
        </Row>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        marginRight: sidebarWidth > 0 ? `${sidebarWidth + 24}px` : 0,
        transition: "margin-right 0.3s ease",
      }}>
      <div 
        style={{ 
          maxWidth: 1200, 
          margin: "0 auto",
          padding: "0 clamp(8px, 2vw, 0px) clamp(80px, 12vh, 100px) clamp(8px, 2vw, 0px)",
        }}>
        {/* Header with Debug Controller */}
        <div style={{ 
          marginBottom: "clamp(16px, 3vh, 24px)", 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <Title level={3} style={{ 
              margin: 0, 
              fontSize: "clamp(18px, 3vw, 20px)", 
              fontWeight: 600,
              wordBreak: 'break-word',
            }}>
              Generate Deal
            </Title>
            <Text type="secondary" style={{ 
              fontSize: "clamp(12px, 1.8vw, 13px)", 
              marginTop: 4, 
              display: 'block',
            }}>
              Select category, review options, and create
            </Text>
          </div>
          
          {/* Debug Controller - Only visible when debug mode is enabled */}
          {debugMode && (
            <div style={{ 
              background: '#fafafa',
              padding: '6px 10px', 
              borderRadius: 6,
              border: '1px dashed #d9d9d9',
            }}>
              <Space size="small">
                <Text style={{ color: '#8c8c8c', fontSize: 11, fontWeight: 500 }}>
                  DEBUG
                </Text>
                <Select
                  size="small"
                  value={debugScrapingMode}
                  onChange={setDebugScrapingMode}
                  style={{ width: 120, fontSize: 11 }}
                  options={[
                    { value: "all", label: "✓ All Success" },
                    { value: "partial", label: "⚠ Partial" },
                    { value: "none", label: "✗ None" },
                  ]}
                />
              </Space>
            </div>
          )}
        </div>

      {/* Main Layout - 2 Columns */}
      <Row gutter={[{ xs: 12, sm: 16, md: 20 }, { xs: 12, sm: 16, md: 20 }]}>
        {/* COLUMN 1: Category Recommendations */}
        <Col xs={24} sm={24} md={24} lg={10} xl={10}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: selectedPDS ? '#52c41a' : '#1890ff',
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {selectedPDS ? '✓' : '1'}
                </div>
                <div>
                  <Text strong style={{ fontSize: "clamp(14px, 2.5vw, 16px)", display: 'block', lineHeight: 1.3 }}>
                    Select Category
                  </Text>
                  <Text type="secondary" style={{ fontSize: "clamp(11px, 1.8vw, 12px)" }}>
                    Choose a deal type
                  </Text>
                </div>
              </div>
            }
            size="small"
            style={{
              borderRadius: 8,
              border: '1px solid #e8e8e8',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
            }}
            styles={{
              header: { 
                padding: "clamp(12px, 2vh, 16px) clamp(12px, 3vw, 20px)",
                borderBottom: '1px solid #f0f0f0',
              },
              body: { padding: "clamp(12px, 2vw, 16px)" },
            }}
          >
            {availablePDS.length === 0 ? (
              <div style={{ 
                textAlign: "center", 
                padding: "48px 24px",
                background: '#fafafa',
                borderRadius: 6,
              }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Select a category to see recommendations
                </Text>
              </div>
            ) : (
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                {availablePDS
                  .slice()
                  .sort((a, b) => {
                    // Sort by priority: High -> Medium -> Low -> undefined
                    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
                    const aPriority = a.priority ? priorityOrder[a.priority] : 3;
                    const bPriority = b.priority ? priorityOrder[b.priority] : 3;
                    return aPriority - bPriority;
                  })
                  .slice(0, displayLimit)
                  .map((pds) => {
                  const isSelected = selectedPDS?.id === pds.id;
                  const isRecommended = pds.recommended;
                  
                  return (
                    <Card
                      key={pds.id}
                      size="small"
                      hoverable
                      onClick={() => handlePDSSelect(pds)}
                      style={{
                        cursor: "pointer",
                        borderRadius: 6,
                        border: isSelected
                          ? `2px solid #1890ff`
                          : `1px solid #e8e8e8`,
                        background: isSelected ? '#f0f5ff' : '#ffffff',
                        transition: 'all 0.2s ease',
                      }}
                      styles={{
                        body: { padding: "12px 16px" },
                      }}
                    >
                      <div>
                        {/* Category Name + Priority Tag */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 14, lineHeight: "1.4", color: '#262626' }}>
                            {pds.name}
                          </Text>
                          {pds.priority && (
                            <Tag 
                              color={
                                pds.priority === "High" ? "error" : 
                                pds.priority === "Medium" ? "warning" : 
                                "default"
                              }
                              style={{ 
                                fontSize: 10, 
                                margin: 0, 
                                padding: "0px 6px",
                                fontWeight: 500,
                                borderRadius: 3,
                                lineHeight: "18px",
                              }}
                            >
                              {pds.priority}
                            </Tag>
                          )}
                        </div>
                        
                        {/* Shopping List - De-emphasized */}
                        {pds.shoppingListUntil && (
                          <Text 
                            style={{ 
                              fontSize: 11, 
                              color: '#8c8c8c',
                              display: "block",
                              lineHeight: "1.4",
                            }}
                          >
                            Shopping List until {pds.shoppingListUntil}
                          </Text>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </Space>
            )}
            
            {/* Load More Button - Only show if there are more categories */}
            {availablePDS.length > 10 && displayLimit < availablePDS.length && (
              <Button
                type="default"
                onClick={() => setDisplayLimit(prev => prev + 10)}
                block
                style={{ 
                  marginTop: "clamp(8px, 1.5vh, 12px)", 
                  fontSize: "clamp(12px, 1.8vw, 13px)",
                  height: "clamp(32px, 5vh, 36px)",
                  borderRadius: 6,
                  fontWeight: 500,
                }}
              >
                Load more
              </Button>
            )}
            
            {/* Manually Select Category Button - Opens Searchable Selector */}
            <Button
              type="default"
              onClick={() => setShowServiceSelector(true)}
              block
              style={{ 
                marginTop: "clamp(8px, 1.5vh, 12px)", 
                fontSize: "clamp(12px, 1.8vw, 13px)",
                height: "clamp(32px, 5vh, 36px)",
                borderRadius: 6,
                fontWeight: 500,
              }}
            >
              🔍 Search all categories...
            </Button>
          </Card>
        </Col>

        {/* COLUMN 2: Deal Options */}
        <Col xs={24} sm={24} md={24} lg={14} xl={14}>
          <Card
              title={
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: generatedOptions.length > 0 ? '#52c41a' : selectedPDS ? '#1890ff' : '#d9d9d9',
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {generatedOptions.length > 0 ? '✓' : '2'}
                    </div>
                    <div>
                      <Text strong style={{ fontSize: "clamp(14px, 2.5vw, 16px)", display: 'block', lineHeight: 1.3 }}>
                        Review Options
                      </Text>
                      <Text type="secondary" style={{ fontSize: "clamp(11px, 1.8vw, 12px)" }}>
                        Verify pricing and edit as needed
                      </Text>
                    </div>
                  </div>
                  <Badge
                    dot={(() => {
                      // Check if any option has a custom merchant margin different from default
                      return generatedOptions.some(opt => 
                        opt.merchantMargin !== undefined && opt.merchantMargin !== defaultMerchantMargin
                      );
                    })()}
                    color={token.colorPrimary}
                    offset={[1, 1]}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<Settings size={16} />}
                      onClick={() => {
                        setSettingsOpen(!settingsOpen);
                      }}
                      style={{ 
                        color: settingsOpen ? token.colorPrimary : token.colorTextSecondary,
                      }}
                    />
                  </Badge>
                </div>
              }
              size="small"
              style={{
                borderRadius: 8,
                border: '1px solid #e8e8e8',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
              }}
              styles={{
                header: { 
                  padding: "clamp(12px, 2vh, 16px) clamp(12px, 3vw, 20px)",
                  borderBottom: '1px solid #f0f0f0',
                },
                body: { padding: "clamp(12px, 2vw, 16px)" },
              }}
            >
              {isLoadingOptions ? (
                <div style={{ padding: "16px" }}>
                  <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <Alert
                      message={
                        <Space>
                          <Spin size="small" />
                          <Text strong style={{ fontSize: 14 }}>Generating deal options...</Text>
                        </Space>
                      }
                      description={
                        <Text style={{ fontSize: 13, color: '#595959' }}>
                          Analyzing pricing strategies, market demand, and optimal discounts
                        </Text>
                      }
                      showIcon={false}
                      style={{ 
                        background: '#f0f5ff',
                        border: `1px solid #adc6ff`,
                        borderRadius: 6,
                      }}
                    />
                    <Skeleton active paragraph={{ rows: 2 }} />
                    <Skeleton active paragraph={{ rows: 2 }} />
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </Space>
                </div>
              ) : generatedOptions.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "48px 24px",
                  background: '#fafafa',
                  borderRadius: 6,
                  margin: 16,
                }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Select a category above to generate deal options
                  </Text>
                </div>
              ) : (
                <>
                  {/* Merchant Margin - Above all options */}
                  <div style={{ 
                    marginBottom: 16, 
                    padding: "12px 16px", 
                    background: token.colorBgContainer, 
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorder}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Groupon Margin</Text>
                      </div>
                      <InputNumber
                        value={100 - defaultMerchantMargin}
                        onChange={(value) => {
                          // Handle null/undefined properly - treat as Groupon margin input
                          const newGrouponMargin = value !== null && value !== undefined ? value : 50;
                          // Calculate merchant margin from groupon margin
                          const newMerchantMargin = 100 - newGrouponMargin;
                          // Store the old default groupon margin to check which options are using the default
                          const oldDefaultGrouponMargin = 100 - defaultMerchantMargin;
                          setDefaultMerchantMargin(newMerchantMargin);
                          // Update all options that are using the default (not custom)
                          setGeneratedOptions((prev) =>
                            prev.map((opt: any) => {
                              // Check if option is using the default margin (matches old default or is undefined)
                              const currentGrouponMargin = opt.grouponMargin !== undefined ? opt.grouponMargin : oldDefaultGrouponMargin;
                              const isUsingDefault = opt.grouponMargin === undefined || currentGrouponMargin === oldDefaultGrouponMargin;
                              
                              if (isUsingDefault) {
                                // Option is using default, update it to new default
                                const updated = { ...opt };
                                updated.grouponMargin = newGrouponMargin;
                                updated.merchantMargin = newMerchantMargin;
                                // Recalculate merchant payout: merchant gets (100 - grouponMargin)% of groupon price
                                updated.merchantPayout = Math.round((opt.grouponPrice * newMerchantMargin) / 100);
                                return updated;
                              } else {
                                // Option has custom margin, keep it but recalculate merchantMargin and payout from its custom grouponMargin
                                const updated = { ...opt };
                                updated.merchantMargin = 100 - opt.grouponMargin;
                                updated.merchantPayout = Math.round((opt.grouponPrice * updated.merchantMargin) / 100);
                                return updated;
                              }
                            })
                          );
                        }}
                        suffix="%"
                        min={0}
                        max={100}
                        step={1}
                        precision={0}
                        controls={true}
                        style={{ width: 120 }}
                      />
                    </div>
                  </div>
                  
                  {/* Deal Options Cards - Draggable */}
                  {(() => {
                    // Split options into active and inactive
                    const activeOptions = generatedOptions.filter((o: any) => o.enabled !== false);
                    const inactiveOptions = generatedOptions.filter((o: any) => o.enabled === false);
                    
                    return (
                      <>
                        {/* Active Options */}
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={activeOptions.map(opt => opt.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <Space direction="vertical" size={8} style={{ width: "100%" }}>
                              {activeOptions.map((option) => {
                                const isEstimated = option.pricingSource !== "merchant_scraped";
                                const isLoadingPricing = loadingPricing.has(option.id);
                                
                                return (
                                  <SortableOptionItem
                                    key={option.id}
                                    option={option as unknown as OptionItemData}
                                    isEstimated={isEstimated}
                                    isLoadingPricing={isLoadingPricing}
                                    editingField={editingField}
                                    onEdit={handleOptionEdit}
                                    onRemove={handleRemoveOption}
                                    setEditingField={setEditingField}
                                    onNameComplete={handleNameComplete}
                                    onEditDetails={(opt) => {
                                      // Open edit in the main right sidebar
                                      if (onOptionSelect) {
                                        onOptionSelect(option);
                                      }
                                    }}
                                    useDecimals={useDecimals}
                                    defaultMerchantMargin={defaultMerchantMargin}
                                  />
                                );
                              })}
                            </Space>
                          </SortableContext>
                        </DndContext>
                        
                        {/* Inactive Options Toggle */}
                        {inactiveOptions.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <Link
                              onClick={() => setShowInactive(!showInactive)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12,
                              }}
                            >
                              {showInactive ? (
                                <>
                                  <ChevronUp size={14} />
                                  Hide inactive options ({inactiveOptions.length})
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={14} />
                                  Show inactive options ({inactiveOptions.length})
                                </>
                              )}
                            </Link>

                            {showInactive && (
                              <Space
                                direction="vertical"
                                style={{ width: "100%", marginTop: 8 }}
                                size={8}
                              >
                                {inactiveOptions.map((option) => {
                                  const isEstimated = option.pricingSource !== "merchant_scraped";
                                  const isLoadingPricing = loadingPricing.has(option.id);
                                  
                                  return (
                                    <div 
                                      key={option.id}
                                      style={{
                                        opacity: 0.7,
                                      }}
                                    >
                                      <SortableOptionItem
                                        option={option as unknown as OptionItemData}
                                        isEstimated={isEstimated}
                                        isLoadingPricing={isLoadingPricing}
                                        editingField={editingField}
                                        onEdit={handleOptionEdit}
                                        onRemove={handleRemoveOption}
                                        setEditingField={setEditingField}
                                        onNameComplete={handleNameComplete}
                                        onEditDetails={(opt) => {
                                          // Open edit in the main right sidebar
                                          if (onOptionSelect) {
                                            onOptionSelect(option);
                                          }
                                        }}
                                        useDecimals={useDecimals}
                                        defaultMerchantMargin={defaultMerchantMargin}
                                      />
                                    </div>
                                  );
                                })}
                              </Space>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  
                  {/* Settings Panel */}
                  {settingsOpen && (
                    <div style={{ 
                      marginBottom: 16, 
                      padding: "12px 16px", 
                      background: '#ffffff', 
                      borderRadius: 8,
                      border: '1px solid #f0f0f0',
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <Text strong style={{ display: "block", fontSize: 13 }}>Use Decimals</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Enable to use cents in pricing
                        </Text>
                      </div>
                      <Switch 
                        checked={useDecimals} 
                        onChange={setUseDecimals}
                      />
                    </div>
                  )}

                  {/* Add Option Button */}
                  <Button
                    type="dashed"
                    block
                    icon={<Plus size={16} />}
                    onClick={handleAddOption}
                    style={{ 
                      marginTop: "clamp(8px, 1.5vh, 12px)",
                      borderRadius: 6,
                      height: "clamp(36px, 5vh, 40px)",
                      fontSize: "clamp(12px, 1.8vw, 13px)",
                      fontWeight: 500,
                      color: '#595959',
                      borderColor: '#d9d9d9',
                    }}
                  >
                    Add Another Option
                  </Button>
                </>
              )}
            </Card>
        </Col>
      </Row>

      {/* Bottom Actions - Fixed Footer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: '#ffffff',
          borderTop: `1px solid #e8e8e8`,
          boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.06)",
          paddingLeft: "clamp(12px, 3vw, 24px)",
          paddingRight: sidebarWidth > 0 ? `${sidebarWidth + 24}px` : "clamp(12px, 3vw, 24px)",
          transition: "padding-right 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "clamp(12px, 2vh, 20px) clamp(12px, 2vw, 24px)",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: "clamp(8px, 2vw, 16px)",
          minWidth: "min-content",
          flex: "1 1 auto",
        }}>
          <div
            style={{
              width: "clamp(32px, 5vw, 40px)",
              height: "clamp(32px, 5vw, 40px)",
              borderRadius: 6,
              background: (!selectedPDS || generatedOptions.length === 0) ? '#f5f5f5' : '#52c41a',
              color: (!selectedPDS || generatedOptions.length === 0) ? '#8c8c8c' : "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "clamp(14px, 2vw, 16px)",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {(!selectedPDS || generatedOptions.length === 0) ? '3' : '✓'}
          </div>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ 
              fontSize: "clamp(13px, 2vw, 15px)", 
              display: 'block', 
              color: '#262626',
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {(!selectedPDS || generatedOptions.length === 0) ? 'Complete steps above' : 'Ready to create'}
            </Text>
            <Text type="secondary" style={{ 
              fontSize: "clamp(11px, 1.8vw, 13px)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
            }}>
              {generatedOptions.length} option{generatedOptions.length !== 1 ? 's' : ''} 
              {selectedPDS ? ` • ${selectedPDS.name}` : ' • Select a category'}
            </Text>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 'clamp(8px, 1.5vw, 12px)', 
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          <Button 
            size="large" 
            onClick={onBack}
            style={{
              height: "clamp(36px, 5vh, 40px)",
              fontSize: "clamp(12px, 1.8vw, 14px)",
              fontWeight: 500,
              borderRadius: 6,
              padding: "0 clamp(12px, 2vw, 16px)",
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<Sparkles size={18} />}
            onClick={handleCreateDeal}
            disabled={!selectedPDS || generatedOptions.length === 0}
            loading={creating}
            style={{
              height: "clamp(36px, 5vh, 40px)",
              fontSize: "clamp(12px, 1.8vw, 14px)",
              fontWeight: 500,
              borderRadius: 6,
              paddingLeft: "clamp(16px, 3vw, 24px)",
              paddingRight: "clamp(16px, 3vw, 24px)",
            }}
          >
            Create Deal
          </Button>
        </div>
        </div>
      </div>

      {/* Category Selection Modal */}
      <Modal
        title={
          <Text strong style={{ fontSize: 16 }}>
            Select Category
          </Text>
        }
        open={showCategoryModal}
        onCancel={() => setShowCategoryModal(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {allCategories.map((cat) => {
            const isSelected = selectedCategory?.id === cat.id;
            const isRecommended = recommendation?.categoryId === cat.id;
            
            return (
              <Card
                key={cat.id}
                size="small"
                hoverable
                onClick={() => {
                  handleCategorySelect(cat);
                  setShowCategoryModal(false);
                }}
                style={{
                  cursor: "pointer",
                  borderRadius: 6,
                  border: isSelected
                    ? `2px solid #1890ff`
                    : `1px solid #e8e8e8`,
                  background: isSelected ? `#f0f5ff` : '#ffffff',
                  transition: 'all 0.2s ease',
                }}
                styles={{
                  body: { padding: 16 },
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: isSelected ? '#1890ff' : '#f5f5f5',
                      color: isSelected ? "white" : '#595959',
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 14, display: "block", color: '#262626' }}>
                      {cat.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {cat.description}
                    </Text>
                  </div>
                  {isRecommended && (
                    <Tag 
                      color="blue" 
                      style={{ 
                        fontSize: 11, 
                        margin: 0,
                        padding: '2px 8px',
                        fontWeight: 500,
                        borderRadius: 4,
                      }}
                    >
                      Recommended
                    </Tag>
                  )}
                </div>
              </Card>
            );
          })}
        </Space>
      </Modal>

      {/* Searchable Service Selector Modal */}
      <SearchableServiceSelector
        open={showServiceSelector}
        onClose={() => setShowServiceSelector(false)}
        onSelect={(service) => {
          // Map the selected service to a category selection
          // The service path includes category info
          const categoryId = service.category_slug || 'food-drink';
          const category = allCategories.find(c => c.id === categoryId) || allCategories[0];
          
          handleCategorySelect(category);
          setShowServiceSelector(false);
        }}
        currentValue={selectedPDS?.name}
      />
      </div>
    </div>
  );
};

export default AICategorySelector;
