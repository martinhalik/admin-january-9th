import {
  Typography,
  Button,
  theme,
  Table,
  Input,
  Image,
  Space,
  Dropdown,
  Tooltip,
  MenuProps,
  Tabs,
  Badge,
  Checkbox,
  Tag,
  Avatar,
} from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, Edit, ChevronDown, Info, MapPin, Filter, Settings, Download, Archive } from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { getDeals, isSupabaseConfigured } from "../lib/dealAdapter";
import CreateDealModal from "../components/CreateDealModal";
import type { TableRowSelection } from "antd/es/table/interface";
import { merchantAccounts } from "../data/merchantAccounts";
import { getLocationsByAccount } from "../data/locationData";
import DealsFilterSidebar from "../components/DealsFilterSidebar";
import SidebarLayout from "../components/SidebarLayout";
import { CampaignStageTag } from "../utils/campaignStageHelpers";
import { useRoleView } from "../contexts/RoleViewContext";
import AccountOwnerFilter from "../components/AccountOwnerFilter";
import { 
  getAllTeamMembers, 
  getEmployeeById, 
  loadEmployees, 
  updateHierarchyData 
} from "../data/companyHierarchy";
import { ListPageHeader } from "../components/PageHeaders";

const { Text } = Typography;
const { useToken } = theme;

// Valid tab values for type safety
const validTabs = ["all", "live", "scheduled", "recently-closed", "paused", "pending", "draft", "all-won", "sold-out", "lost"] as const;
type TabType = typeof validTabs[number];

const Deals = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useToken();
  const { currentRole, currentUser } = useRoleView();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  
  // Ensure employees are loaded in background for account owner filtering
  useEffect(() => {
    loadEmployees().then(employees => {
      if (employees.length > 0) {
        updateHierarchyData(employees);
      }
    }).catch(err => console.error('[Deals] Error loading employees:', err));
  }, []);
  
  // Initialize state from URL params
  const [searchText, setSearchText] = useState(() => searchParams.get("search") || "");
  const [debouncedSearchText, setDebouncedSearchText] = useState(() => searchParams.get("search") || "");
  const [merchantFilter, setMerchantFilter] = useState(() => searchParams.get("merchant") || "all");
  const [minPrice, setMinPrice] = useState(() => searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get("maxPrice") || "");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Initialize account owner filter based on role
  // BD/MD: Show their own deals
  // DSM: Show their team's deals
  // MM: Show all (will use category/division filters instead)
  // Admin/Executive: Show all
  const getInitialOwnerFilter = () => {
    if (currentRole === 'bd' || currentRole === 'md') {
      return currentUser.employeeId;
    }
    if (currentRole === 'dsm') {
      return 'team'; // Special marker for team filtering
    }
    return null; // MM, Admin, Executive see all
  };
  
  const [accountOwnerFilter, setAccountOwnerFilter] = useState<string | null>(getInitialOwnerFilter);
  const [showUnassignedDeals, setShowUnassignedDeals] = useState(false);
  
  // Sidebar state
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  
  // Campaign stage filter - read from URL
  const [campaignStageFilter, setCampaignStageFilter] = useState<TabType>(() => {
    const tabParam = searchParams.get("tab");
    return tabParam && validTabs.includes(tabParam as TabType) ? tabParam as TabType : "all";
  });

  // Additional filter states - read from URL
  const [trendingFilter, setTrendingFilter] = useState(() => searchParams.get("trending") || "");
  const [tagFilter, setTagFilter] = useState(() => searchParams.get("tag") || "");
  const [merchandisingTagFilter, setMerchandisingTagFilter] = useState(() => searchParams.get("merchTag") || "");
  const [taxonomyCategoriesFilter, setTaxonomyCategoriesFilter] = useState(() => searchParams.get("category") || "");
  const [countryFilter, setCountryFilter] = useState(() => searchParams.get("country") || "United States");
  const [divisionsFilter, setDivisionsFilter] = useState(() => searchParams.get("division") || "");
  const [channelsFilter, setChannelsFilter] = useState(() => searchParams.get("channel") || "");
  const [subchannelFilter, setSubchannelFilter] = useState(() => searchParams.get("subchannel") || "");
  const [marginsFilter, setMarginsFilter] = useState(() => searchParams.get("margins") || "");
  const [minPurchases, setMinPurchases] = useState(() => searchParams.get("minPurchases") || "");
  const [maxPurchases, setMaxPurchases] = useState(() => searchParams.get("maxPurchases") || "");
  const [minActivations, setMinActivations] = useState(() => searchParams.get("minActivations") || "");
  const [maxActivations, setMaxActivations] = useState(() => searchParams.get("maxActivations") || "");
  const [brandsFilter, setBrandsFilter] = useState(() => searchParams.get("brand") || "");

  // Data loading state
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Column visibility state - read from URL or localStorage
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const urlColumns = searchParams.get("columns");
    if (urlColumns) {
      try {
        return JSON.parse(decodeURIComponent(urlColumns));
      } catch {
        // Fall through to localStorage
      }
    }
    const saved = localStorage.getItem('dealsColumnVisibility');
    return saved ? JSON.parse(saved) : {
      image: true,
      title: true,
      orders: true,
      views: true,
      gp: true,
      gpPerView: true,
      cr: true,
      margin: true,
      dealStart: true,
      stage: true,
      accountOwner: true,
      actions: true,
    };
  });

  // Update filter when role changes
  useEffect(() => {
    if (currentRole === 'bd' || currentRole === 'md') {
      setAccountOwnerFilter(currentUser.employeeId);
    } else if (currentRole === 'dsm') {
      setAccountOwnerFilter('team');
    } else {
      setAccountOwnerFilter(null);
    }
  }, [currentRole, currentUser.employeeId]);

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    
    // Tab
    if (campaignStageFilter !== "all") params.set("tab", campaignStageFilter);
    
    // Search
    if (debouncedSearchText) params.set("search", debouncedSearchText);
    
    // Filters
    if (merchantFilter !== "all") params.set("merchant", merchantFilter);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (trendingFilter) params.set("trending", trendingFilter);
    if (tagFilter) params.set("tag", tagFilter);
    if (merchandisingTagFilter) params.set("merchTag", merchandisingTagFilter);
    if (taxonomyCategoriesFilter) params.set("category", taxonomyCategoriesFilter);
    if (countryFilter && countryFilter !== "United States") params.set("country", countryFilter);
    if (divisionsFilter) params.set("division", divisionsFilter);
    if (channelsFilter) params.set("channel", channelsFilter);
    if (subchannelFilter) params.set("subchannel", subchannelFilter);
    if (marginsFilter) params.set("margins", marginsFilter);
    if (minPurchases) params.set("minPurchases", minPurchases);
    if (maxPurchases) params.set("maxPurchases", maxPurchases);
    if (minActivations) params.set("minActivations", minActivations);
    if (maxActivations) params.set("maxActivations", maxActivations);
    if (brandsFilter) params.set("brand", brandsFilter);
    
    // Column visibility - only include if different from default
    const defaultColumns = {
      image: true, title: true, orders: true, views: true, gp: true,
      gpPerView: true, cr: true, margin: true, dealStart: true, stage: true, actions: true,
    };
    const columnsChanged = JSON.stringify(visibleColumns) !== JSON.stringify(defaultColumns);
    if (columnsChanged) {
      params.set("columns", encodeURIComponent(JSON.stringify(visibleColumns)));
    }
    
    // Update URL without navigation
    setSearchParams(params, { replace: true });
  }, [
    campaignStageFilter, debouncedSearchText, merchantFilter, minPrice, maxPrice,
    trendingFilter, tagFilter, merchandisingTagFilter, taxonomyCategoriesFilter,
    countryFilter, divisionsFilter, channelsFilter, subchannelFilter, marginsFilter,
    minPurchases, maxPurchases, minActivations, maxActivations, brandsFilter,
    visibleColumns, setSearchParams
  ]);

  // Debounce search text
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  // Save column visibility to localStorage
  useEffect(() => {
    localStorage.setItem('dealsColumnVisibility', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  }, []);

  // Load deals from Supabase or mock data
  useEffect(() => {
    async function loadDeals() {
      setLoading(true);
      try {
        const deals = await getDeals({
          campaignStage: campaignStageFilter,
          searchText: debouncedSearchText,
        });
        
        setAllDeals(deals);
      } catch (error) {
        console.error('Error loading deals:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadDeals();
  }, [campaignStageFilter, debouncedSearchText]);

  // Show indicator if using Supabase (only once on mount)
  useEffect(() => {
    if (isSupabaseConfigured) {
    } else {
    }
  }, []);

  const handleDealClick = (dealId: string) => {
    const isSimilarDeal = dealId.startsWith("similar-");
    sessionStorage.setItem(
      "navigationReferrer",
      JSON.stringify({
        type: isSimilarDeal ? "similar-deal" : "deals",
        timestamp: Date.now(),
      })
    );
    navigate(`/deals/${dealId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getLocationCount = (merchantName: string): number => {
    const merchant = merchantAccounts.find((account) =>
      account.name.toLowerCase().includes(merchantName.toLowerCase()) ||
      merchantName.toLowerCase().includes(account.name.toLowerCase())
    );
    
    if (merchant) {
      const locations = getLocationsByAccount(merchant.id);
      return locations.length;
    }
    
    return 0;
  };

  // Apply role-based filtering to deals
  const roleFilteredDeals = useMemo(() => {
    if (accountOwnerFilter === 'unassigned') {
      // Show only unassigned deals
      return allDeals.filter(deal => !deal.accountOwnerId);
    } else if (accountOwnerFilter === 'team') {
      // DSM: Show deals owned by anyone on their team
      const teamMembers = getAllTeamMembers(currentUser.employeeId);
      const teamMemberIds = teamMembers.map(m => m.id);
      
      const filtered = allDeals.filter(deal => 
        deal.accountOwnerId && teamMemberIds.includes(deal.accountOwnerId)
      );
      
      // Add unassigned deals if the toggle is on
      if (showUnassignedDeals) {
        const unassignedDeals = allDeals.filter(deal => !deal.accountOwnerId);
        return [...filtered, ...unassignedDeals];
      }
      return filtered;
    } else if (accountOwnerFilter) {
      // BD/MD or specific owner selected: Show deals for that owner
      const filtered = allDeals.filter(deal => 
        deal.accountOwnerId === accountOwnerFilter
      );
      
      // Add unassigned deals if the toggle is on
      if (showUnassignedDeals) {
        const unassignedDeals = allDeals.filter(deal => !deal.accountOwnerId);
        return [...filtered, ...unassignedDeals];
      }
      return filtered;
    }
    
    // MM, Admin, Executive: Show all deals
    return allDeals;
  }, [allDeals, accountOwnerFilter, currentUser.employeeId, showUnassignedDeals]);

  // Memoize deals for performance
  const dealsToDisplay = useMemo(() => roleFilteredDeals, [roleFilteredDeals]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (trendingFilter) count++;
    if (tagFilter) count++;
    if (merchandisingTagFilter) count++;
    if (taxonomyCategoriesFilter) count++;
    if (countryFilter && countryFilter !== "United States") count++;
    if (divisionsFilter) count++;
    if (channelsFilter) count++;
    if (subchannelFilter) count++;
    if (marginsFilter) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (minPurchases) count++;
    if (maxPurchases) count++;
    if (minActivations) count++;
    if (maxActivations) count++;
    if (merchantFilter !== "all") count++;
    if (brandsFilter) count++;
    return count;
  }, [
    trendingFilter,
    tagFilter,
    merchandisingTagFilter,
    taxonomyCategoriesFilter,
    countryFilter,
    divisionsFilter,
    channelsFilter,
    subchannelFilter,
    marginsFilter,
    minPrice,
    maxPrice,
    minPurchases,
    maxPurchases,
    minActivations,
    maxActivations,
    merchantFilter,
    brandsFilter,
  ]);

  // Get active filters for pills
  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; value: string }> = [];
    if (trendingFilter) filters.push({ key: "trending", label: "Trending", value: trendingFilter });
    if (tagFilter) filters.push({ key: "tag", label: "Tag", value: tagFilter });
    if (merchandisingTagFilter) filters.push({ key: "merchandising", label: "Merchandising", value: merchandisingTagFilter });
    if (taxonomyCategoriesFilter) filters.push({ key: "taxonomy", label: "Category", value: taxonomyCategoriesFilter });
    if (countryFilter && countryFilter !== "United States") filters.push({ key: "country", label: "Country", value: countryFilter });
    if (divisionsFilter) filters.push({ key: "division", label: "Division", value: divisionsFilter });
    if (channelsFilter) filters.push({ key: "channel", label: "Channel", value: channelsFilter });
    if (subchannelFilter) filters.push({ key: "subchannel", label: "Subchannel", value: subchannelFilter });
    if (marginsFilter) filters.push({ key: "margin", label: "Margin", value: marginsFilter });
    if (minPrice || maxPrice) {
      const priceRange = `${minPrice || "0"} - ${maxPrice || "∞"}`;
      filters.push({ key: "price", label: "Price", value: priceRange });
    }
    if (minPurchases || maxPurchases) {
      const purchaseRange = `${minPurchases || "0"} - ${maxPurchases || "∞"}`;
      filters.push({ key: "purchases", label: "Purchases", value: purchaseRange });
    }
    if (minActivations || maxActivations) {
      const activationRange = `${minActivations || "0"} - ${maxActivations || "∞"}`;
      filters.push({ key: "activations", label: "Activations", value: activationRange });
    }
    if (merchantFilter !== "all") filters.push({ key: "merchant", label: "Merchant", value: merchantFilter });
    if (brandsFilter) filters.push({ key: "brand", label: "Brand", value: brandsFilter });
    return filters;
  }, [
    trendingFilter,
    tagFilter,
    merchandisingTagFilter,
    taxonomyCategoriesFilter,
    countryFilter,
    divisionsFilter,
    channelsFilter,
    subchannelFilter,
    marginsFilter,
    minPrice,
    maxPrice,
    minPurchases,
    maxPurchases,
    minActivations,
    maxActivations,
    merchantFilter,
    brandsFilter,
  ]);

  // Clear individual filter
  const clearFilter = useCallback((key: string) => {
    switch (key) {
      case "trending": setTrendingFilter(""); break;
      case "tag": setTagFilter(""); break;
      case "merchandising": setMerchandisingTagFilter(""); break;
      case "taxonomy": setTaxonomyCategoriesFilter(""); break;
      case "country": setCountryFilter("United States"); break;
      case "division": setDivisionsFilter(""); break;
      case "channel": setChannelsFilter(""); break;
      case "subchannel": setSubchannelFilter(""); break;
      case "margin": setMarginsFilter(""); break;
      case "price": setMinPrice(""); setMaxPrice(""); break;
      case "purchases": setMinPurchases(""); setMaxPurchases(""); break;
      case "activations": setMinActivations(""); setMaxActivations(""); break;
      case "merchant": setMerchantFilter("all"); break;
      case "brand": setBrandsFilter(""); break;
    }
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setTrendingFilter("");
    setTagFilter("");
    setMerchandisingTagFilter("");
    setTaxonomyCategoriesFilter("");
    setCountryFilter("United States");
    setDivisionsFilter("");
    setChannelsFilter("");
    setSubchannelFilter("");
    setMarginsFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMinPurchases("");
    setMaxPurchases("");
    setMinActivations("");
    setMaxActivations("");
    setMerchantFilter("all");
    setBrandsFilter("");
  }, []);

  // Filter deals based on additional filters (search is already applied)
  const filteredDeals = useMemo(() => {
    return dealsToDisplay.filter((deal) => {
      const matchesMerchant =
        merchantFilter === "all" || deal.location.includes(merchantFilter);
      const matchesPrice =
        (minPrice === "" || (deal.stats?.revenue || 0) >= parseFloat(minPrice)) &&
        (maxPrice === "" || (deal.stats?.revenue || 0) <= parseFloat(maxPrice));

      return matchesMerchant && matchesPrice;
    });
  }, [dealsToDisplay, merchantFilter, minPrice, maxPrice]);

  // Calculate counts for each tab when account owner filter is active
  const tabCounts = useMemo(() => {
    if (!accountOwnerFilter) return null;

    const counts: Record<TabType, number> = {
      "all": 0,
      "live": 0,
      "scheduled": 0,
      "recently-closed": 0,
      "paused": 0,
      "pending": 0,
      "draft": 0,
      "all-won": 0,
      "sold-out": 0,
      "lost": 0,
    };

    // Count deals by stage based on role-filtered deals
    roleFilteredDeals.forEach((deal) => {
      // Count for "all"
      counts["all"]++;

      // Count based on campaign stage
      if (deal.campaignStage === "live") {
        counts["live"]++;
      } else if (deal.campaignStage === "scheduled") {
        counts["scheduled"]++;
      } else if (deal.campaignStage === "closed") {
        counts["recently-closed"]++;
      } else if (deal.campaignStage === "paused") {
        counts["paused"]++;
      } else if (deal.campaignStage === "pending") {
        counts["pending"]++;
      } else if (deal.campaignStage === "draft") {
        counts["draft"]++;
      } else if (deal.campaignStage === "lost") {
        counts["lost"]++;
      }

      // Check for won substages
      if (deal.campaignStage === "won") {
        counts["all-won"]++;
        if (deal.wonSubStage === "sold-out") {
          counts["sold-out"]++;
        }
      }
    });

    return counts;
  }, [accountOwnerFilter, roleFilteredDeals]);

  // Row selection configuration
  const rowSelection: TableRowSelection<any> = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
    columnWidth: 48, // Fixed narrow width for checkbox column
  };

  // Generate dropdown menu items from deal options
  const getShowMenuItems = (record: any): MenuProps["items"] => {
    if (!record.options || record.options.length === 0) {
      return [
        {
          key: "no-options",
          label: "No options available",
          disabled: true,
        },
      ];
    }

    return record.options.map((option: any, index: number) => ({
      key: `${record.id}-option-${option.id || index}`,
      label: (
        <div>
          <div>{option.name}</div>
          {option.subtitle && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {option.subtitle}
            </Text>
          )}
        </div>
      ),
    }));
  };

  // Helper to parse date from various formats
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Try European format: "DD. M. YYYY" or "DD.M.YYYY"
    const euroMatch = dateStr.match(/^(\d{1,2})[.\s]+(\d{1,2})[.\s]+(\d{4})$/);
    if (euroMatch) {
      const [, day, month, year] = euroMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Try ISO format: "YYYY-MM-DD"
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Try US format: "MM/DD/YYYY"
    const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Fallback: try native Date parsing
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  // Helper function to calculate days between dates
  const calculateDays = (startDate: string, endDate?: string): number => {
    try {
      const start = parseDate(startDate);
      if (!start) return 0;
      
      const end = endDate ? parseDate(endDate) : new Date();
      if (!end) return 0;
      
      return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // Helper to format date in US-friendly format (Jan 15, 2025)
  const formatDate = (date: string) => {
    try {
      const dateObj = parseDate(date);
      if (!dateObj || isNaN(dateObj.getTime())) return "—";
      
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
    } catch {
      return "—";
    }
  };

  // ========== BASE COLUMNS (always shown) ==========
  // Helper to get category-appropriate placeholder image
  const getCategoryImage = (category: string, subcategory?: string, dealId?: string): string => {
    // Use deal ID to generate a consistent but varied placeholder
    const seed = dealId ? parseInt(dealId.replace(/\D/g, '').slice(-4) || '1000') : Math.floor(Math.random() * 10000);
    
    // Map categories to Unsplash collections
    const categoryMap: Record<string, string[]> = {
      'Restaurants & Food': ['food', 'restaurant', 'cuisine', 'dining', 'meal'],
      'Health & Beauty': ['spa', 'beauty', 'wellness', 'massage', 'salon'],
      'Things to Do': ['activities', 'entertainment', 'fun', 'adventure', 'experience'],
      'Retail': ['shopping', 'store', 'boutique', 'retail', 'products'],
      'Health & Wellness': ['fitness', 'gym', 'yoga', 'health', 'workout'],
      'Home & Garden': ['home', 'garden', 'interior', 'furniture', 'decor'],
      'Automotive': ['car', 'automotive', 'vehicle', 'auto', 'mechanic'],
      'Services': ['service', 'professional', 'business', 'office', 'work'],
    };
    
    const keywords = categoryMap[category] || ['business', 'deal', 'offer'];
    const keyword = keywords[seed % keywords.length];
    
    // Use Lorem Picsum with seed for consistent images per deal
    return `https://picsum.photos/seed/${dealId || seed}/400/225`;
  };

  const imageColumn = {
    title: () => <Text type="secondary">Image</Text>,
    dataIndex: "image",
    key: "image",
    width: 144,
    render: (_: any, record: any) => {
      const featuredImage = record.content?.media?.find((media: any) => media.isFeatured) || record.content?.media?.[0];
      const imageUrl = featuredImage?.url || getCategoryImage(record.category, record.subcategory, record.id);
      return (
        <Image
          width={128}
          height={72}
          src={imageUrl}
          alt={record.title}
          style={{ borderRadius: token.borderRadius, objectFit: "cover" }}
          fallback="/images/ai/chef-cooking.jpg"
          preview={false}
        />
      );
    },
  };

  const titleColumn = {
    title: () => <Text type="secondary">Title</Text>,
    dataIndex: "title",
    key: "title",
    width: 320,
    render: (title: string, record: any) => {
      const merchantName = record.location.split(",")[0];
      const locationCount = getLocationCount(merchantName);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Text strong style={{ fontSize: token.fontSizeLG }}>{title}</Text>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text type="secondary">{merchantName}</Text>
            {locationCount > 0 && (
              <Badge
                count={
                  <div style={{ display: "flex", alignItems: "center", gap: 4, backgroundColor: token.colorBgTextHover, padding: "2px 8px", borderRadius: token.borderRadiusSM, fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>
                    <MapPin size={12} />
                    <span>{locationCount}</span>
                  </div>
                }
                style={{ backgroundColor: "transparent" }}
              />
            )}
          </div>
        </div>
      );
    },
  };

  const actionsColumn = {
    title: () => <Text type="secondary">Actions</Text>,
    key: "actions",
    fixed: "right" as const,
    width: 180,
    render: (_: any, record: any) => (
      <Space size="small">
        <Dropdown menu={{ items: getShowMenuItems(record), onClick: ({ key }) => console.log("Selected option:", key) }} trigger={["click"]}>
          <Button size="middle" icon={<ChevronDown size={14} />} iconPosition="end" onClick={(e) => e.stopPropagation()}>Show</Button>
        </Dropdown>
        <Button type="primary" size="middle" icon={<Edit size={14} />} onClick={(e) => { e.stopPropagation(); navigate(`/deals/${record.id}?edit=true&section=content`); }} style={{ marginRight: 8 }}>Edit</Button>
      </Space>
    ),
  };

  // ========== PERFORMANCE COLUMNS (Live, All Won) ==========
  const ordersColumn = {
    title: () => <Space size={4}><Text type="secondary">30d Orders</Text><Tooltip title="Total orders in the last 30 days"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "stats",
    key: "orders",
    width: 110,
    render: (stats: any) => <Text>{stats?.purchases?.toLocaleString() || "0"}</Text>,
  };

  const viewsColumn = {
    title: () => <Space size={4}><Text type="secondary">30d Views</Text><Tooltip title="Total views in the last 30 days"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "stats",
    key: "views",
    width: 110,
    render: (stats: any) => <Text>{stats?.views?.toLocaleString() || "0"}</Text>,
  };

  const gpColumn = {
    title: () => <Space size={4}><Text type="secondary">30d GP</Text><Tooltip title="Gross Profit in the last 30 days"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "stats",
    key: "gp",
    width: 120,
    render: (stats: any) => <Text style={{ color: token.colorSuccessText }}>US${stats?.revenue?.toLocaleString() || "0"}</Text>,
  };

  const gpPerViewColumn = {
    title: () => <Space size={4}><Text type="secondary">GP/View</Text><Tooltip title="Gross Profit per View"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "stats",
    key: "gpPerView",
    width: 100,
    render: (stats: any) => <Text>US${stats?.revenuePerView?.toFixed(2) || "0.00"}</Text>,
  };

  const crColumn = {
    title: () => <Space size={4}><Text type="secondary">CR</Text><Tooltip title="Conversion Rate"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "stats",
    key: "cr",
    width: 80,
    render: (stats: any) => <Text>{stats?.conversionRate?.toFixed(2) || "0"}%</Text>,
  };

  const daysLiveColumn = {
    title: () => <Space size={4}><Text type="secondary">Days Live</Text><Tooltip title="Number of days the deal has been live"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "daysLive",
    width: 100,
    render: (_: any, record: any) => {
      const days = calculateDays(record.dealStart);
      const displayDays = days > 0 ? days : 0;
      return <Text>{displayDays} {displayDays === 1 ? "day" : "days"}</Text>;
    },
  };

  // ========== SCHEDULED COLUMNS ==========
  const launchDateColumn = {
    title: () => <Space size={4}><Text type="secondary">Launch Date</Text><Tooltip title="When the deal goes live"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "dealStart",
    key: "launchDate",
    width: 120,
    render: (date: string) => <Text>{formatDate(date)}</Text>,
  };

  const daysUntilLaunchColumn = {
    title: () => <Space size={4}><Text type="secondary">Days to Launch</Text><Tooltip title="Days until the deal goes live"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "daysUntilLaunch",
    width: 120,
    render: (_: any, record: any) => {
      const days = -calculateDays(record.dealStart); // Negative because it's in the future
      const color = days <= 3 ? token.colorError : days <= 7 ? token.colorWarning : token.colorText;
      if (days <= 0) {
        return <Text style={{ color: token.colorSuccess }}>Today!</Text>;
      }
      return <Text style={{ color }}>{days} {days === 1 ? "day" : "days"}</Text>;
    },
  };

  // Unused column - kept for future use
  // const targetGpColumn = {
  //   title: () => <Space size={4}><Text type="secondary">Target GP</Text><Tooltip title="Expected Gross Profit"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
  //   key: "targetGp",
  //   width: 120,
  //   render: () => <Text type="secondary">US${Math.floor(Math.random() * 50000 + 10000).toLocaleString()}</Text>,
  // };

  const opportunityOwnerColumn = {
    title: () => <Space size={4}><Text type="secondary">Opportunity Owner</Text><Tooltip title="Person responsible for this opportunity"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "opportunityOwner",
    width: 150,
    render: (_: any, record: any) => {
      const owner = record.roles?.opportunityOwner || currentUser.name;
      return <Text>{owner}</Text>;
    },
  };

  const accountOwnerColumn = {
    title: () => <Space size={4}><Text type="secondary">Account Owner</Text><Tooltip title="Owner of the merchant account"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "accountOwner",
    width: 180,
    render: (_: any, record: any) => {
      // Use direct account_owner_id from deal
      if (!record.accountOwnerId) {
        return <Text type="secondary">Unassigned</Text>;
      }
      
      // Look up employee details from hierarchy
      const accountOwner = getEmployeeById(record.accountOwnerId);
      
      if (!accountOwner) {
        return <Text type="secondary">Unassigned</Text>;
      }
      
      return (
        <div style={{ display: "flex", alignItems: "center", gap: token.marginXS }}>
          <Avatar 
            size="small"
            src={accountOwner.avatar}
            style={{ flexShrink: 0 }}
          >
            {accountOwner.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <Text style={{ fontSize: token.fontSizeSM }}>{accountOwner.name}</Text>
        </div>
      );
    },
  };

  const dealStrengthColumn = {
    title: () => <Space size={4}><Text type="secondary">Deal Strength</Text><Tooltip title="Likelihood of deal success"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "dealStrength",
    width: 120,
    render: (_: any, record: any) => {
      const strengths = ["High", "Med", "Low"];
      const colors = { High: token.colorSuccess, Med: token.colorWarning, Low: token.colorError };
      
      // Convert numeric values or use random if not set
      let strength: string;
      const rawStrength = record.dealStrength;
      
      if (typeof rawStrength === "number") {
        // Map numeric values: high numbers = High, low = Low
        strength = rawStrength >= 70 ? "High" : rawStrength >= 40 ? "Med" : "Low";
      } else if (typeof rawStrength === "string" && ["High", "Med", "Low"].includes(rawStrength)) {
        strength = rawStrength;
      } else {
        strength = strengths[Math.floor(Math.random() * 3)];
      }
      
      return <Text style={{ color: colors[strength as keyof typeof colors] || token.colorText }}>{strength}</Text>;
    },
  };

  const potentialColumn = {
    title: () => <Space size={4}><Text type="secondary">Potential</Text><Tooltip title="Estimated deal potential value"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "potential",
    width: 120,
    render: () => <Text type="secondary">US${Math.floor(Math.random() * 100000 + 20000).toLocaleString()}</Text>,
  };

  // ========== PAUSED COLUMNS ==========
  const daysPausedColumn = {
    title: () => <Space size={4}><Text type="secondary">Days Paused</Text><Tooltip title="Number of days since paused"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "daysPaused",
    width: 110,
    render: () => {
      const days = Math.floor(Math.random() * 30) + 1;
      const color = days > 14 ? token.colorError : days > 7 ? token.colorWarning : token.colorText;
      return <Text style={{ color }}>{days} {days === 1 ? "day" : "days"}</Text>;
    },
  };

  const pauseReasonColumn = {
    title: () => <Space size={4}><Text type="secondary">Pause Reason</Text><Tooltip title="Why the deal was paused"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "pauseReason",
    width: 150,
    render: () => {
      const reasons = ["Inventory issues", "Merchant request", "Quality review", "Seasonal", "Price adjustment"];
      return <Text type="secondary">{reasons[Math.floor(Math.random() * reasons.length)]}</Text>;
    },
  };

  const gpBeforePauseColumn = {
    title: () => <Space size={4}><Text type="secondary">GP (pre-pause)</Text><Tooltip title="Gross Profit before pausing"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "stats",
    key: "gpBeforePause",
    width: 120,
    render: (stats: any) => <Text>US${stats?.revenue?.toLocaleString() || "0"}</Text>,
  };

  // ========== RECENTLY CLOSED COLUMNS ==========
  const totalOrdersColumn = {
    title: () => <Space size={4}><Text type="secondary">Total Orders</Text><Tooltip title="Lifetime orders"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "stats",
    key: "totalOrders",
    width: 110,
    render: (stats: any) => <Text strong>{(stats?.purchases * 3 || 0).toLocaleString()}</Text>,
  };

  const totalGpColumn = {
    title: () => <Space size={4}><Text type="secondary">Total GP</Text><Tooltip title="Lifetime Gross Profit"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "stats",
    key: "totalGp",
    width: 130,
    render: (stats: any) => <Text style={{ color: token.colorSuccessText }} strong>US${((stats?.revenue || 0) * 3).toLocaleString()}</Text>,
  };

  // Unused column - kept for future use
  // const totalDaysLiveColumn = {
  //   title: () => <Space size={4}><Text type="secondary">Days Live</Text><Tooltip title="Total days the deal was live"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
  //   key: "totalDaysLive",
  //   width: 100,
  //   render: (_: any, record: any) => {
  //     const days = calculateDays(record.dealStart, record.dealEnd);
  //     const displayDays = days > 0 ? days : Math.floor(Math.random() * 90) + 30;
  //     return <Text>{displayDays} {displayDays === 1 ? "day" : "days"}</Text>;
  //   },
  // };

  // Unused column - kept for future use
  // const redemptionRateColumn = {
  //   title: () => <Space size={4}><Text type="secondary">Redemption</Text><Tooltip title="Percentage of vouchers redeemed"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
  //   key: "redemption",
  //   width: 110,
  //   render: () => {
  //     const rate = Math.floor(Math.random() * 40) + 50;
  //     const color = rate >= 70 ? token.colorSuccess : rate >= 50 ? token.colorWarning : token.colorError;
  //     return <Text style={{ color }}>{rate}%</Text>;
  //   },
  // };

  // Unused column - kept for future use
  // const refundRateColumn = {
  //   title: () => <Space size={4}><Text type="secondary">Refunds</Text><Tooltip title="Refund rate"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
  //   key: "refunds",
  //   width: 90,
  //   render: () => {
  //     const rate = Math.floor(Math.random() * 15);
  //     const color = rate <= 5 ? token.colorSuccess : rate <= 10 ? token.colorWarning : token.colorError;
  //     return <Text style={{ color }}>{rate}%</Text>;
  //   },
  // };

  const dealEndColumn = {
    title: () => <Space size={4}><Text type="secondary">Closed Date</Text><Tooltip title="When the deal ended"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "dealEnd",
    key: "dealEnd",
    width: 120,
    render: (date: string) => <Text>{formatDate(date)}</Text>,
  };

  const launchedDateColumn = {
    title: () => <Space size={4}><Text type="secondary">Launched</Text><Tooltip title="When the deal went live"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "dealStart",
    key: "launched",
    width: 120,
    render: (date: string) => <Text>{formatDate(date)}</Text>,
  };

  const voucherExpirationColumn = {
    title: () => <Space size={4}><Text type="secondary">Vouchers Expire</Text><Tooltip title="When vouchers expire (1-12 months after deal closes)"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "voucherExpiration",
    width: 130,
    render: (_: any, record: any) => {
      const closedDate = parseDate(record.dealEnd || record.dealStart);
      if (!closedDate) return <Text>—</Text>;
      
      // Random expiration between 1-12 months after close
      const monthsToExpire = Math.floor(Math.random() * 12) + 1;
      const expirationDate = new Date(closedDate);
      expirationDate.setMonth(expirationDate.getMonth() + monthsToExpire);
      
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${monthNames[expirationDate.getMonth()]} ${expirationDate.getDate()}, ${expirationDate.getFullYear()}`;
      
      // Check if expired
      const now = new Date();
      const isExpired = expirationDate < now;
      const daysUntil = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (isExpired) {
        return <Text type="secondary">{formattedDate} (expired)</Text>;
      } else if (daysUntil <= 30) {
        return <Text style={{ color: token.colorWarningText }}>{formattedDate}</Text>;
      }
      return <Text>{formattedDate}</Text>;
    },
  };

  const unredeemedVouchersColumn = {
    title: () => <Space size={4}><Text type="secondary">Unredeemed</Text><Tooltip title="Vouchers not yet redeemed"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "unredeemed",
    width: 140,
    render: (_: any, record: any) => {
      const totalVouchers = (record.stats?.purchases || Math.floor(Math.random() * 500) + 100) * 3;
      const unredeemedPct = Math.floor(Math.random() * 40) + 5; // 5-45% unredeemed
      const unredeemedCount = Math.floor(totalVouchers * unredeemedPct / 100);
      
      const color = unredeemedPct <= 15 ? token.colorSuccess : unredeemedPct <= 30 ? token.colorWarning : token.colorError;
      
      return (
        <div>
          <Text strong>{unredeemedCount.toLocaleString()}</Text>
          <Text style={{ color, marginLeft: 4 }}>({unredeemedPct}%)</Text>
        </div>
      );
    },
  };

  // ========== DRAFT COLUMNS ==========
  const draftStageColumn = {
    title: () => <Space size={4}><Text type="secondary">Draft Stage</Text><Tooltip title="Current stage in the draft process"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "draftStage",
    width: 140,
    render: (_: any, record: any) => (
      <CampaignStageTag stage={record.campaignStage} subStage={record.draftSubStage} style={{ margin: 0 }} />
    ),
  };

  const createdDateColumn = {
    title: () => <Space size={4}><Text type="secondary">Created</Text><Tooltip title="When the draft was created"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "created",
    width: 110,
    render: (_: any, record: any) => {
      if (record.createdAt) {
        return <Text>{formatDate(record.createdAt)}</Text>;
      }
      // Fallback to dealStart for legacy deals
      return <Text type="secondary">{formatDate(record.dealStart)}</Text>;
    },
  };

  const lastUpdatedColumn = {
    title: () => <Space size={4}><Text type="secondary">Last Updated</Text><Tooltip title="Last modification date"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "lastUpdated",
    width: 120,
    render: (_: any, record: any) => {
      if (record.updatedAt) {
        const updateDate = new Date(record.updatedAt);
        const now = new Date();
        const diffMs = now.getTime() - updateDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          if (diffHours === 0) {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            return <Text type="secondary">{diffMinutes === 0 ? "Just now" : `${diffMinutes}m ago`}</Text>;
          }
          return <Text type="secondary">{diffHours === 1 ? "1h ago" : `${diffHours}h ago`}</Text>;
        }
        return <Text type="secondary">{diffDays === 1 ? "Yesterday" : `${diffDays}d ago`}</Text>;
      }
      // Fallback for legacy deals
      return <Text type="secondary">—</Text>;
    },
  };

  const completionColumn = {
    title: () => <Space size={4}><Text type="secondary">Completion</Text><Tooltip title="Draft completion percentage"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "completion",
    width: 110,
    render: () => {
      const pct = Math.floor(Math.random() * 60) + 40;
      const color = pct >= 80 ? token.colorSuccess : pct >= 50 ? token.colorWarning : token.colorError;
      return <Text style={{ color }}>{pct}%</Text>;
    },
  };

  // ========== SOLD OUT COLUMNS ==========
  const daysToSellOutColumn = {
    title: () => <Space size={4}><Text type="secondary">Days to Sell Out</Text><Tooltip title="How quickly the deal sold out"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "daysToSellOut",
    width: 130,
    render: () => {
      const days = Math.floor(Math.random() * 30) + 1;
      const color = days <= 7 ? token.colorSuccess : days <= 14 ? token.colorWarning : token.colorText;
      return <Text style={{ color }}>{days} {days === 1 ? "day" : "days"}</Text>;
    },
  };

  const soldOutDateColumn = {
    title: () => <Space size={4}><Text type="secondary">Sold Out Date</Text><Tooltip title="When the deal sold out"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "soldOutDate",
    width: 120,
    render: (_: any, record: any) => <Text>{formatDate(record.dealEnd || record.dealStart)}</Text>,
  };

  const waitlistColumn = {
    title: () => <Space size={4}><Text type="secondary">Waitlist</Text><Tooltip title="Customers on waitlist"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "waitlist",
    width: 100,
    render: () => {
      const count = Math.floor(Math.random() * 200);
      return <Text style={{ color: count > 50 ? token.colorSuccess : token.colorText }}>{count}</Text>;
    },
  };

  // ========== LOST COLUMNS ==========
  const lostDateColumn = {
    title: () => <Space size={4}><Text type="secondary">Lost Date</Text><Tooltip title="When the deal was marked as lost"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "lostDate",
    width: 110,
    render: (_: any, record: any) => <Text>{formatDate(record.dealEnd || record.dealStart)}</Text>,
  };

  const lostReasonColumn = {
    title: () => <Space size={4}><Text type="secondary">Lost Reason</Text><Tooltip title="Why the deal was lost"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "lostReason",
    width: 150,
    render: () => {
      const reasons = ["Competitor won", "Budget constraints", "Timing", "No response", "Quality issues", "Terms rejected"];
      return <Text type="secondary">{reasons[Math.floor(Math.random() * reasons.length)]}</Text>;
    },
  };

  const lostStageColumn = {
    title: () => <Space size={4}><Text type="secondary">Lost At Stage</Text><Tooltip title="Which stage the deal was lost at"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "lostStage",
    width: 130,
    render: () => {
      const stages = ["Prospecting", "Qualification", "Presentation", "Negotiation", "Contract"];
      return <Text type="secondary">{stages[Math.floor(Math.random() * stages.length)]}</Text>;
    },
  };

  const potentialValueColumn = {
    title: () => <Space size={4}><Text type="secondary">Potential Value</Text><Tooltip title="Estimated value if won"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "potentialValue",
    width: 130,
    render: () => <Text type="secondary">US${Math.floor(Math.random() * 50000 + 5000).toLocaleString()}</Text>,
  };

  // ========== STAGE COLUMN (for All tab) ==========
  const stageColumn = {
    title: () => <Space size={4}><Text type="secondary">Stage</Text><Tooltip title="Campaign Stage"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "stage",
    width: 140,
    render: (_: any, record: any) => {
      const { campaignStage, draftSubStage, wonSubStage, lostSubStage } = record;
      const subStage = campaignStage === "draft" ? draftSubStage : campaignStage === "won" ? wonSubStage : lostSubStage;
      return <CampaignStageTag stage={campaignStage} subStage={subStage} style={{ margin: 0 }} />;
    },
  };

  const marginColumn = {
    title: () => <Space size={4}><Text type="secondary">Margin</Text><Tooltip title="Profit Margin"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    key: "margin",
    width: 90,
    render: (record: any) => {
      const avgMargin = record.options?.reduce((acc: number, opt: any) => acc + (opt.merchantMargin || 0), 0) / (record.options?.length || 1);
      return <Text>{avgMargin?.toFixed(0) || Math.floor(Math.random() * 20 + 20)}%</Text>;
    },
  };

  const dealStartColumn = {
    title: () => <Space size={4}><Text type="secondary">Deal Start</Text><Tooltip title="Deal start date"><Info size={14} style={{ color: token.colorTextSecondary }} /></Tooltip></Space>,
    dataIndex: "dealStart",
    key: "dealStart",
    width: 110,
    render: (date: string) => <Text>{formatDate(date)}</Text>,
  };

  // ========== PHASE-SPECIFIC COLUMN SETS ==========
  const columnsByPhase: Record<string, any[]> = {
    "all": [imageColumn, titleColumn, ordersColumn, viewsColumn, gpColumn, crColumn, accountOwnerColumn, stageColumn, dealStartColumn, actionsColumn],
    "live": [imageColumn, titleColumn, ordersColumn, viewsColumn, gpColumn, gpPerViewColumn, crColumn, daysLiveColumn, marginColumn, accountOwnerColumn, stageColumn, actionsColumn],
    "scheduled": [imageColumn, titleColumn, launchDateColumn, daysUntilLaunchColumn, opportunityOwnerColumn, accountOwnerColumn, dealStrengthColumn, potentialColumn, stageColumn, actionsColumn],
    "paused": [imageColumn, titleColumn, daysPausedColumn, pauseReasonColumn, gpBeforePauseColumn, ordersColumn, accountOwnerColumn, stageColumn, actionsColumn],
    "recently-closed": [imageColumn, titleColumn, launchedDateColumn, dealEndColumn, voucherExpirationColumn, unredeemedVouchersColumn, totalOrdersColumn, totalGpColumn, accountOwnerColumn, stageColumn, actionsColumn],
    "draft": [imageColumn, titleColumn, draftStageColumn, createdDateColumn, lastUpdatedColumn, completionColumn, accountOwnerColumn, stageColumn, actionsColumn],
    "all-won": [imageColumn, titleColumn, ordersColumn, viewsColumn, gpColumn, crColumn, daysLiveColumn, accountOwnerColumn, stageColumn, actionsColumn],
    "sold-out": [imageColumn, titleColumn, totalOrdersColumn, totalGpColumn, daysToSellOutColumn, soldOutDateColumn, waitlistColumn, accountOwnerColumn, stageColumn, actionsColumn],
    "lost": [imageColumn, titleColumn, lostDateColumn, lostReasonColumn, lostStageColumn, potentialValueColumn, accountOwnerColumn, stageColumn, actionsColumn],
  };

  // Legacy columns for backward compatibility
  const allColumns = columnsByPhase["all"];

  // Get columns for current phase
  const phaseColumns = useMemo(() => {
    return columnsByPhase[campaignStageFilter] || columnsByPhase["all"];
  }, [campaignStageFilter]);


  // Get columns based on current phase (visibility filtering removed for phase-specific columns)
  const columns = useMemo(() => {
    return phaseColumns;
  }, [phaseColumns]);

  // Bulk action handlers
  const handleBulkExport = useCallback(() => {
    // TODO: Implement export functionality
  }, [selectedRowKeys]);

  const handleBulkChangeStage = useCallback(() => {
    // TODO: Implement stage change functionality
  }, [selectedRowKeys]);

  const handleBulkArchive = useCallback(() => {
    // TODO: Implement archive functionality
  }, [selectedRowKeys]);

  return (
    <div style={{ position: "relative" }}>
      <SidebarLayout sidebarOpen={filterSidebarOpen} sidebarWidth={360}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "calc(100vh - 64px)",
            paddingTop: token.paddingLG,
            paddingBottom: token.paddingLG,
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          <ListPageHeader
            title="Deals"
            actions={[
              <Button
                key="process"
                icon={<Plus size={16} />}
                onClick={() => {
                }}
              >
                Process All Deals
              </Button>,
              <Button
                key="changes"
                onClick={() => {
                }}
              >
                View All Changes
              </Button>,
              <Button
                key="create"
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => setCreateModalVisible(true)}
              >
                Create Deal
              </Button>,
            ]}
            tabs={
              <div style={{ display: "flex", alignItems: "center", gap: token.marginXS }}>
                <Tabs
                  activeKey={campaignStageFilter}
                  onChange={(key) => setCampaignStageFilter(key as any)}
                  size="middle"
                  style={{ marginBottom: 0 }}
                  items={[
                    {
                      key: "all",
                      label: tabCounts ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>All</span>
                          {tabCounts.all > 0 && (
                            <Badge count={tabCounts.all} overflowCount={999} color={token.colorTextDescription} style={{ marginTop: 0 }} />
                          )}
                        </span>
                      ) : "All",
                      children: null,
                    },
                    {
                      key: "live",
                      label: tabCounts ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Live</span>
                          {tabCounts.live > 0 && (
                            <Badge count={tabCounts.live} overflowCount={999} color={token.colorPrimary} style={{ marginTop: 0 }} />
                          )}
                        </span>
                      ) : "Live",
                      children: null,
                    },
                    {
                      key: "sold-out",
                      label: tabCounts ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Sold Out</span>
                          {tabCounts["sold-out"] > 0 && (
                            <Badge count={tabCounts["sold-out"]} overflowCount={999} color={token.colorTextDescription} style={{ marginTop: 0 }} />
                          )}
                        </span>
                      ) : "Sold Out",
                      children: null,
                    },
                    {
                      key: "scheduled",
                      label: tabCounts ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Scheduled</span>
                          {tabCounts.scheduled > 0 && (
                            <Badge count={tabCounts.scheduled} overflowCount={999} color={token.colorTextDescription} style={{ marginTop: 0 }} />
                          )}
                        </span>
                      ) : "Scheduled",
                      children: null,
                    },
                    {
                      key: "paused",
                      label: tabCounts ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Paused</span>
                          {tabCounts.paused > 0 && (
                            <Badge count={tabCounts.paused} overflowCount={999} color={token.colorTextDescription} style={{ marginTop: 0 }} />
                          )}
                        </span>
                      ) : "Paused",
                      children: null,
                    },
                    {
                      key: "pending",
                      label: tabCounts ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Pending</span>
                          {tabCounts.pending > 0 && (
                            <Badge count={tabCounts.pending} overflowCount={999} color={token.colorTextDescription} style={{ marginTop: 0 }} />
                          )}
                        </span>
                      ) : "Pending",
                      children: null,
                    },
                    {
                      key: "recently-closed",
                      label: tabCounts ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Recently closed</span>
                          {tabCounts["recently-closed"] > 0 && (
                            <Badge count={tabCounts["recently-closed"]} overflowCount={999} color={token.colorTextDescription} style={{ marginTop: 0 }} />
                          )}
                        </span>
                      ) : "Recently closed",
                      children: null,
                    },
                    {
                      key: "draft",
                      label: tabCounts ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Drafts</span>
                          {tabCounts.draft > 0 && (
                            <Badge count={tabCounts.draft} overflowCount={999} color={token.colorTextDescription} style={{ marginTop: 0 }} />
                          )}
                        </span>
                      ) : "Drafts",
                      children: null,
                    },
                    {
                      key: "all-won",
                      label: tabCounts ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>All Won</span>
                          {tabCounts["all-won"] > 0 && (
                            <Badge count={tabCounts["all-won"]} overflowCount={999} color={token.colorTextDescription} style={{ marginTop: 0 }} />
                          )}
                        </span>
                      ) : "All Won",
                      children: null,
                    },
                    {
                      key: "lost",
                      label: <span style={{ color: token.colorTextSecondary }}>Lost</span>,
                      children: null,
                    },
                  ]}
                />
                <Button
                  icon={<Plus size={12} />}
                  size="small"
                  onClick={() => {
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: token.marginSM,
                    marginBottom: token.marginSM,
                  }}
                  title="Create custom view"
                />
              </div>
            }
            searchBar={
              <Input
                placeholder="Search deals..."
                prefix={<Search size={16} style={{ color: token.colorTextSecondary }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ flex: 1 }}
                allowClear
              />
            }
            filters={
              <>
                <Dropdown
                  menu={{
                    items: allColumns.map((col, index) => ({
                      key: `column-${col.key || index}`,
                      label: (
                        <Checkbox 
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumnVisibility(col.key)}
                        >
                          {typeof col.title === 'function' ? col.key : col.title}
                        </Checkbox>
                      ),
                    })),
                    onClick: (e) => {
                      e.domEvent.stopPropagation();
                    },
                  }}
                  trigger={["click"]}
                >
                  <Button 
                    icon={<Settings size={16} />}
                    title="Columns"
                  />
                </Dropdown>
                <Button
                  icon={<Filter size={16} />}
                  onClick={() => setFilterSidebarOpen(!filterSidebarOpen)}
                  type={filterSidebarOpen ? "primary" : "default"}
                >
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
                <AccountOwnerFilter
                  selectedOwnerId={accountOwnerFilter}
                  onFilterChange={setAccountOwnerFilter}
                  showUnassigned={showUnassignedDeals}
                  onShowUnassignedChange={setShowUnassignedDeals}
                  items={allDeals.map(deal => ({
                    accountOwnerId: deal.accountOwnerId, // Use direct field from Supabase
                  }))}
                  context="deals"
                />
              </>
            }
          />

          {/* Active Filter Pills */}
          {activeFilters.length > 0 && (
            <div style={{ marginBottom: token.margin }}>
              <Space size="small" wrap>
                {activeFilters.map((filter, index) => (
                  <Tag
                    key={`filter-${filter.key}-${index}`}
                    closable
                    onClose={() => clearFilter(filter.key)}
                    color="blue"
                    style={{
                      fontSize: token.fontSize,
                      padding: `${token.paddingXXS}px ${token.paddingSM}px`,
                    }}
                  >
                    <strong>{filter.label}:</strong> {filter.value}
                  </Tag>
                ))}
                <Button 
                  type="link" 
                  size="small" 
                  onClick={clearAllFilters}
                  style={{ padding: `${token.paddingXXS}px ${token.paddingSM}px` }}
                >
                  Clear all
                </Button>
              </Space>
            </div>
          )}

          {/* Deals Table */}
          <div style={{ flex: 1 }}>
            <style>
              {`
                .ant-table-thead > tr > th {
                  padding: ${token.paddingXS}px ${token.padding}px !important;
                }
                .ant-table-tbody > tr > td {
                  padding: ${token.paddingXS}px ${token.paddingXS}px !important;
                }
                .ant-table-tbody > tr {
                  cursor: pointer;
                }
                .ant-table-tbody > tr:hover {
                  background-color: ${token.colorBgTextHover};
                }
                @keyframes slideUp {
                  from {
                    transform: translateY(100%);
                    opacity: 0;
                  }
                  to {
                    transform: translateY(0);
                    opacity: 1;
                  }
                }
                /* Badge styling for tabs */
                .ant-tabs-tab .ant-badge {
                  line-height: 1;
                }
                .ant-tabs-tab .ant-badge-count {
                  box-shadow: none;
                  font-size: 11px;
                  height: 18px;
                  line-height: 18px;
                  min-width: 18px;
                  padding: 0 4px;
                }
                .ant-tabs-tab-active .ant-badge-count {
                  font-weight: 600;
                }
              `}
            </style>
            <Table
              columns={columns}
              dataSource={filteredDeals}
              rowKey="id"
              rowSelection={rowSelection}
              scroll={{ x: 1400 }}
              virtual
              loading={loading}
              style={{
                boxShadow: token.boxShadow,
                borderRadius: token.borderRadius,
                overflow: 'hidden',
              }}
              onRow={(record) => ({
                onClick: (e) => {
                  const target = e.target as HTMLElement;
                  if (
                    !target.closest("button") &&
                    !target.closest(".ant-checkbox-wrapper") &&
                    !target.closest(".ant-dropdown")
                  ) {
                    handleDealClick(record.id);
                  }
                },
              })}
              pagination={{
                pageSize: 100,
                showSizeChanger: true,
                pageSizeOptions: ['50', '100', '200', '500'],
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} deals`,
              }}
            />
          </div>
        </div>
      </SidebarLayout>

      {/* Bulk Actions Bar */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: token.colorBgContainer,
            borderTop: `1px solid ${token.colorBorder}`,
            padding: token.paddingLG,
            zIndex: 1000,
            boxShadow: token.boxShadowSecondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "slideUp 0.3s ease",
          }}
        >
          <Text strong style={{ fontSize: token.fontSizeLG }}>
            {selectedRowKeys.length} deal{selectedRowKeys.length !== 1 ? 's' : ''} selected
          </Text>
          <Space>
            <Button 
              icon={<Download size={16} />}
              onClick={handleBulkExport}
            >
              Export
            </Button>
            <Button
              onClick={handleBulkChangeStage}
            >
              Change Stage
            </Button>
            <Button 
              icon={<Archive size={16} />}
              onClick={handleBulkArchive}
            >
              Archive
            </Button>
            <Button 
              type="text"
              onClick={() => setSelectedRowKeys([])}
            >
              Cancel
            </Button>
          </Space>
        </div>
      )}

      {/* Filter Sidebar */}
      {filterSidebarOpen && (
        <div
          style={{
            position: "fixed",
            top: 64,
            right: 0,
            width: 360,
            height: "calc(100vh - 64px)",
            zIndex: 1000,
            boxShadow: token.boxShadowTertiary,
          }}
        >
          <DealsFilterSidebar
            trendingFilter={trendingFilter}
            tagFilter={tagFilter}
            merchandisingTagFilter={merchandisingTagFilter}
            taxonomyCategoriesFilter={taxonomyCategoriesFilter}
            countryFilter={countryFilter}
            divisionsFilter={divisionsFilter}
            channelsFilter={channelsFilter}
            subchannelFilter={subchannelFilter}
            marginsFilter={marginsFilter}
            minPrice={minPrice}
            maxPrice={maxPrice}
            minPurchases={minPurchases}
            maxPurchases={maxPurchases}
            minActivations={minActivations}
            maxActivations={maxActivations}
            merchantFilter={merchantFilter}
            brandsFilter={brandsFilter}
            setTrendingFilter={setTrendingFilter}
            setTagFilter={setTagFilter}
            setMerchandisingTagFilter={setMerchandisingTagFilter}
            setTaxonomyCategoriesFilter={setTaxonomyCategoriesFilter}
            setCountryFilter={setCountryFilter}
            setDivisionsFilter={setDivisionsFilter}
            setChannelsFilter={setChannelsFilter}
            setSubchannelFilter={setSubchannelFilter}
            setMarginsFilter={setMarginsFilter}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
            setMinPurchases={setMinPurchases}
            setMaxPurchases={setMaxPurchases}
            setMinActivations={setMinActivations}
            setMaxActivations={setMaxActivations}
            setMerchantFilter={setMerchantFilter}
            setBrandsFilter={setBrandsFilter}
            onClose={() => setFilterSidebarOpen(false)}
          />
        </div>
      )}

      {/* Create Deal Modal */}
      <CreateDealModal
        open={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </div>
  );
};

export default Deals;
