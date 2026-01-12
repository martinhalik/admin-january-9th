import {
  Card,
  Typography,
  Button,
  Table,
  Tag,
  Badge,
  Avatar,
  Input,
  Select,
  Space,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { merchantAccounts } from "../data/merchantAccounts";
import { 
  loadMerchantAccountsIncremental,
  getTotalAccountsCount 
} from "../data/accountOwnerAssignments";
import { deals } from "../data/mockDeals";
import { theme } from "antd";
import { useRoleView } from "../contexts/RoleViewContext";
import { getFilteredAccounts } from "../lib/accountFiltering";
import AccountOwnerFilter from "../components/AccountOwnerFilter";
import { 
  getAllTeamMembers, 
  getEmployeeById, 
  loadEmployees, 
  updateHierarchyData 
} from "../data/companyHierarchy";
import { ListPageHeader } from "../components/PageHeaders";
import { getAccountOwnerDisplayName } from "../utils/accountOwnerHelpers";

const { Text } = Typography;
const { useToken } = theme;

const Accounts = () => {
  const navigate = useNavigate();
  const { token } = useToken();
  const { currentRole, currentUser } = useRoleView();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [potentialFilter, setPotentialFilter] = useState("all");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dealsCountFilter, setDealsCountFilter] = useState("all");
  const [dataLoading, setDataLoading] = useState(false);
  
  // Initialize account owner filter based on role
  // BD/MD: Show their own accounts
  // DSM: Show their team's accounts  
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
  const [showUnassignedAccounts, setShowUnassignedAccounts] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isScrolled, setIsScrolled] = useState(false);

  // State for merchant accounts
  const [merchantAccountsList, setMerchantAccountsList] = useState<typeof merchantAccounts>([]);
  const [totalAccountsCount, setTotalAccountsCount] = useState(0);
  const hasLoadedDataRef = useRef(false);

  // Load data ONCE on mount
  useEffect(() => {
    // Prevent multiple loads
    if (hasLoadedDataRef.current) return;
    hasLoadedDataRef.current = true;
    
    async function loadData() {
      setDataLoading(true);
      try {
        // Load employees first (needed for filtering)
        const employees = await loadEmployees();
        updateHierarchyData(employees);
        
        // Determine if we should filter by owner (BD/MD roles)
        const shouldFilterByOwner = (currentRole === 'bd' || currentRole === 'md');
        const filterOwnerId = shouldFilterByOwner ? currentUser.employeeId : null;
        
        // Get total count
        const totalCount = await getTotalAccountsCount(filterOwnerId);
        setTotalAccountsCount(totalCount);
        
        // Smart batch sizing for large datasets
        // For BD/MD: Load all their accounts (manageable set)
        // For others: Load initial working set
        let BATCH_SIZE: number;
        if (shouldFilterByOwner) {
          // Load all for filtered users
          BATCH_SIZE = Math.min(totalCount, 1000);
        } else if (totalCount > 10000) {
          // Large dataset: Load first 1000, use pagination/search
          BATCH_SIZE = 1000;
        } else {
          // Smaller dataset: Load more
          BATCH_SIZE = Math.min(totalCount, 5000);
        }
        
        const result = await loadMerchantAccountsIncremental(BATCH_SIZE, 0, filterOwnerId);
        
        setMerchantAccountsList(result.accounts);
        
        if (totalCount > BATCH_SIZE) {
          console.log(
            `[Accounts] Loaded ${employees.length} employees and ${result.accounts.length} of ${totalCount} accounts. ` +
            `Use search/filters to narrow results.`
          );
        } else {
          console.log(`[Accounts] Loaded ${employees.length} employees and all ${result.accounts.length} accounts`);
        }
      } catch (error) {
        console.error('[Accounts] Error loading data:', error);
        setMerchantAccountsList([]);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []); // Empty deps - load only once

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleAccountClick = (accountId: string) => {
    // Set navigation context for breadcrumbs
    sessionStorage.setItem(
      "navigationReferrer",
      JSON.stringify({
        type: "account",
        accountId,
        timestamp: Date.now(),
      })
    );
    navigate(`/accounts/${accountId}`);
  };

  // Apply account owner filtering based on role
  const baseAccounts = (() => {
    // Helper to check if account is unassigned (includes House Account)
    const isUnassigned = (acc: any) => !acc.accountOwner || acc.accountOwner.name === 'House Account';
    
    if (accountOwnerFilter === 'unassigned') {
      // Show only unassigned accounts (House Account or null)
      const unassigned = merchantAccountsList.filter(isUnassigned);
      console.log('[Accounts] Unassigned filter - Total accounts:', merchantAccountsList.length, 'Unassigned:', unassigned.length);
      return unassigned;
    } else if (accountOwnerFilter === 'team') {
      // DSM: Show accounts owned by anyone on their team
      const teamMembers = getAllTeamMembers(currentUser.employeeId);
      const teamMemberIds = teamMembers.map(m => m.id);
      const filteredAccounts = merchantAccountsList.filter(acc => 
        acc.accountOwner && acc.accountOwner.name !== 'House Account' && teamMemberIds.includes(acc.accountOwner.id)
      );
      // Add unassigned accounts if the toggle is on
      if (showUnassignedAccounts) {
        const unassignedAccounts = merchantAccountsList.filter(isUnassigned);
        return [...filteredAccounts, ...unassignedAccounts];
      }
      return filteredAccounts;
    } else if (accountOwnerFilter) {
      // BD/MD or specific owner selected: Show accounts for that owner
      const filteredAccounts = merchantAccountsList.filter(acc => 
        acc.accountOwner && acc.accountOwner.name !== 'House Account' && acc.accountOwner.id === accountOwnerFilter
      );
      // Add unassigned accounts if the toggle is on
      if (showUnassignedAccounts) {
        const unassignedAccounts = merchantAccountsList.filter(isUnassigned);
        return [...filteredAccounts, ...unassignedAccounts];
      }
      return filteredAccounts;
    } else {
      // MM, Admin, Executive: Show all accounts
      console.log('[Accounts] Showing all accounts:', merchantAccountsList.length);
      return merchantAccountsList;
    }
  })();

  // Filter accounts based on search and filters
  const filteredAccounts = baseAccounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchText.toLowerCase()) ||
      account.location.toLowerCase().includes(searchText.toLowerCase()) ||
      account.businessType.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || account.status === statusFilter;
    const matchesPotential =
      potentialFilter === "all" || account.potential === potentialFilter;
    const matchesBusinessType =
      businessTypeFilter === "all" ||
      account.businessType === businessTypeFilter;
    const matchesLocation =
      locationFilter === "all" || account.location === locationFilter;
    const matchesDealsCount =
      dealsCountFilter === "all" ||
      (dealsCountFilter === "high" && account.dealsCount >= 10) ||
      (dealsCountFilter === "medium" &&
        account.dealsCount >= 5 &&
        account.dealsCount < 10) ||
      (dealsCountFilter === "low" && account.dealsCount < 5);
    // Account owner filter is already applied in baseAccounts

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPotential &&
      matchesBusinessType &&
      matchesLocation &&
      matchesDealsCount
    );
  });

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case "high":
        return "green";
      case "mid":
        return "blue";
      case "low":
        return "red";
      default:
        return "default";
    }
  };

  const getPotentialIcon = (potential: string) => {
    switch (potential) {
      case "high":
        return <TrendingUp size={12} />;
      case "mid":
        return <Minus size={12} />;
      case "low":
        return <TrendingDown size={12} />;
      default:
        return null;
    }
  };

  const columns = [
    {
      title: "Account",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => (
        <div
          style={{ display: "flex", alignItems: "center", gap: token.marginSM }}
        >
          <Avatar
            size={token.controlHeightLG}
            style={{
              backgroundColor: token.colorPrimary,
              flexShrink: 0,
            }}
          >
            {name.charAt(0)}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ fontSize: token.fontSize, display: "block" }}>
              {name}
            </Text>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {record.businessType} • {record.location}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Badge
          status={
            status === "active"
              ? "success"
              : status === "pending"
              ? "processing"
              : "default"
          }
          text={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      ),
    },
    {
      title: "Potential",
      dataIndex: "potential",
      key: "potential",
      render: (potential: string, record: any) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: token.marginXXS,
          }}
        >
          {getPotentialIcon(potential)}
          <Tag color={getPotentialColor(potential)}>
            {potential.toUpperCase()}
          </Tag>
          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            ({record.potentialAnalysis.score}/100)
          </Text>
        </div>
      ),
    },
    {
      title: "Account Owner",
      dataIndex: "accountOwner",
      key: "accountOwner",
      width: 200,
      render: (accountOwner: any) => {
        if (!accountOwner || accountOwner.name === 'House Account') {
          return <Text type="secondary">Unassigned</Text>;
        }
        return (
          <div style={{ display: "flex", alignItems: "center", gap: token.marginXS }}>
            <Avatar 
              size="small"
              src={accountOwner.avatar}
              style={{ flexShrink: 0 }}
            >
              {accountOwner.name.split(' ').map((n: string) => n[0]).join('')}
            </Avatar>
            <Text style={{ fontSize: token.fontSizeSM }}>{accountOwner.name}</Text>
          </div>
        );
      },
    },
    {
      title: "Deals",
      dataIndex: "dealsCount",
      key: "dealsCount",
      render: (count: number, record: any) => {
        // Calculate live deals count for this account
        const liveDealsCount = deals.filter(
          (deal) =>
            deal.status === "Live" &&
            (deal.location
              .toLowerCase()
              .includes(record.location.toLowerCase().split(",")[0]) ||
              deal.title
                .toLowerCase()
                .includes(record.name.toLowerCase().split(" ")[0]))
        ).length;

        return (
          <div>
            <Text strong style={{ color: token.colorPrimary }}>
              {liveDealsCount} live
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {count} total
            </Text>
          </div>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          type="text"
          icon={<Edit size={14} />}
          onClick={() => navigate(`/accounts/${record.id}?edit=true`)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: token.margin,
        minHeight: "calc(100vh - 96px)",
      }}
    >
      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <ListPageHeader
          title="Accounts"
          actions={[
            <Button
              key="create"
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              disabled
            >
              Create Account
            </Button>,
          ]}
          searchBar={
            <Input
              placeholder="Search accounts..."
              prefix={<Search size={16} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ flex: 1 }}
              allowClear
            />
          }
          filters={
            <>
              <Button
                icon={<Filter size={16} />}
                onClick={() => setSidebarVisible(!sidebarVisible)}
                type={sidebarVisible ? "primary" : "default"}
              >
                Filters
              </Button>
              <AccountOwnerFilter
                selectedOwnerId={accountOwnerFilter}
                onFilterChange={setAccountOwnerFilter}
                showUnassigned={showUnassignedAccounts}
                onShowUnassignedChange={setShowUnassignedAccounts}
                items={merchantAccountsList.map(acc => ({ 
                  accountOwnerId: acc.accountOwner && acc.accountOwner.name !== 'House Account' 
                    ? acc.accountOwner.id 
                    : null 
                }))}
                context="accounts"
                isLoadingData={dataLoading}
              />
            </>
          }
        />

        {/* Info banner for large datasets */}
        {totalAccountsCount > merchantAccountsList.length && !searchText && (
          <Card
            style={{
              marginBottom: token.marginMD,
              background: token.colorInfoBg,
              borderColor: token.colorInfoBorder,
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text>
                <strong>Note:</strong> Showing first {merchantAccountsList.length.toLocaleString()} of{' '}
                {totalAccountsCount.toLocaleString()} total accounts.
              </Text>
              <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                Use search and filters above to find specific accounts. The system loads a working set for better performance.
              </Text>
            </Space>
          </Card>
        )}

        {/* Accounts Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredAccounts}
            rowKey="id"
            pagination={{
              pageSize: 100,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} accounts`,
            }}
            onRow={(record) => ({
              onClick: () => handleAccountClick(record.id),
              style: { cursor: "pointer" },
            })}
          />
        </Card>
      </div>

      {/* Filters Sidebar */}
      {sidebarVisible && (
        <div
          style={{
            width: isMobile ? "100%" : 360,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 72,
              display: "flex",
              flexDirection: "column",
              gap: token.margin,
              alignSelf: "flex-start",
              maxHeight: "calc(100vh - 96px)",
            }}
          >
            <Card
              style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
                display: "flex",
                flexDirection: "column",
                maxHeight: "calc(100vh - 96px)",
                overflow: "hidden",
              }}
              styles={{
                header: {
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  background: token.colorBgContainer,
                  borderBottom: `1px solid ${token.colorBorder}`,
                  marginBottom: 0,
                },
                body: {
                  overflowY: "auto",
                  flex: 1,
                },
              }}
              title={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Filters</span>
                  <Button
                    type="text"
                    icon={<X size={16} />}
                    onClick={() => setSidebarVisible(false)}
                    style={{ border: "none", boxShadow: "none" }}
                  />
                </div>
              }
            >
              <div style={{ padding: token.paddingXS }}>
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  {/* Status */}
                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        marginBottom: token.marginXXS,
                        fontSize: token.fontSizeSM,
                      }}
                    >
                      Status
                    </Text>
                    <Select
                      placeholder="All Status"
                      value={statusFilter}
                      onChange={setStatusFilter}
                      style={{ width: "100%" }}
                      size="small"
                    >
                      <Select.Option value="all">All Status</Select.Option>
                      <Select.Option value="active">Active</Select.Option>
                      <Select.Option value="inactive">Inactive</Select.Option>
                      <Select.Option value="pending">Pending</Select.Option>
                    </Select>
                  </div>

                  {/* Potential */}
                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        marginBottom: token.marginXXS,
                        fontSize: token.fontSizeSM,
                      }}
                    >
                      Potential
                    </Text>
                    <Select
                      placeholder="All Potential"
                      value={potentialFilter}
                      onChange={setPotentialFilter}
                      style={{ width: "100%" }}
                      size="small"
                    >
                      <Select.Option value="all">All Potential</Select.Option>
                      <Select.Option value="high">High</Select.Option>
                      <Select.Option value="mid">Mid</Select.Option>
                      <Select.Option value="low">Low</Select.Option>
                    </Select>
                  </div>

                  {/* Business Type */}
                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        marginBottom: token.marginXXS,
                        fontSize: token.fontSizeSM,
                      }}
                    >
                      Business Type
                    </Text>
                    <Select
                      placeholder="All Business Types"
                      value={businessTypeFilter}
                      onChange={setBusinessTypeFilter}
                      style={{ width: "100%" }}
                      size="small"
                    >
                      <Select.Option value="all">
                        All Business Types
                      </Select.Option>
                      <Select.Option value="Restaurant">
                        Restaurant
                      </Select.Option>
                      <Select.Option value="Retail">Retail</Select.Option>
                      <Select.Option value="Service">Service</Select.Option>
                      <Select.Option value="Entertainment">
                        Entertainment
                      </Select.Option>
                    </Select>
                  </div>

                  {/* Location */}
                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        marginBottom: token.marginXXS,
                        fontSize: token.fontSizeSM,
                      }}
                    >
                      Location
                    </Text>
                    <Select
                      placeholder="All Locations"
                      value={locationFilter}
                      onChange={setLocationFilter}
                      style={{ width: "100%" }}
                      size="small"
                    >
                      <Select.Option value="all">All Locations</Select.Option>
                      <Select.Option value="New York">New York</Select.Option>
                      <Select.Option value="Los Angeles">
                        Los Angeles
                      </Select.Option>
                      <Select.Option value="Chicago">Chicago</Select.Option>
                      <Select.Option value="San Francisco">
                        San Francisco
                      </Select.Option>
                    </Select>
                  </div>

                  {/* Deals Count */}
                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        marginBottom: token.marginXXS,
                        fontSize: token.fontSizeSM,
                      }}
                    >
                      Deals Count
                    </Text>
                    <Select
                      placeholder="All Deals Count"
                      value={dealsCountFilter}
                      onChange={setDealsCountFilter}
                      style={{ width: "100%" }}
                      size="small"
                    >
                      <Select.Option value="all">All Deals Count</Select.Option>
                      <Select.Option value="high">10+ Deals</Select.Option>
                      <Select.Option value="medium">5-9 Deals</Select.Option>
                      <Select.Option value="low">Under 5 Deals</Select.Option>
                    </Select>
                  </div>
                </Space>

                {/* Action Buttons */}
                <div
                  style={{
                    position: "sticky",
                    bottom: 0,
                    background: token.colorBgBase,
                    padding: `${token.padding}px 0 0 0`,
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                    marginTop: token.marginLG,
                  }}
                >
                  <Button
                    style={{ width: "100%" }}
                    onClick={() => {
                      setStatusFilter("all");
                      setPotentialFilter("all");
                      setBusinessTypeFilter("all");
                      setLocationFilter("all");
                      setDealsCountFilter("all");
                      setSearchText("");
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
