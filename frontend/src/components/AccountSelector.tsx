import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Card,
  Typography,
  Space,
  theme,
  Tag,
  Input,
  Modal,
  Divider,
  Tooltip,
  Avatar,
  Empty,
  Spin,
} from "antd";
import { Search, Info, User } from "lucide-react";
import { List, type ListImperativeAPI } from 'react-window';
import {
  MerchantAccount,
  MerchantPotentialAnalysis,
} from "../data/merchantAccounts";
import { 
  loadMerchantAccountsIncremental,
  getTotalAccountsCount 
} from "../data/accountOwnerAssignments";
import { getAccountCountsPerEmployee } from "../lib/supabaseData";
import {
  getActivityStatus,
} from "../lib/accountActivity";
import {
  calculateAccountMetrics,
} from "../lib/accountMetrics";
import EntityAvatar from "./EntityAvatar";
import ScoreProgress from "./ScoreProgress";
import { PotentialTag } from "../utils/potentialHelpers";
import { useRoleView } from "../contexts/RoleViewContext";
import AccountOwnerFilter from "./AccountOwnerFilter";
import { getAllTeamMembers, loadEmployees } from "../data/companyHierarchy";
import { getAccountOwnerDisplayName } from "../utils/accountOwnerHelpers";

const { Text, Title, Paragraph } = Typography;
const { useToken } = theme;

interface AccountSelectorProps {
  onSelect: (account: MerchantAccount) => void;
  selectedAccountId?: string | null;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  onSelect,
  selectedAccountId,
}) => {
  const { token } = useToken();
  const { currentRole, currentUser } = useRoleView();
  const [searchQuery, setSearchQuery] = useState("");
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] =
    useState<MerchantPotentialAnalysis | null>(null);
  const [selectedMerchantName, setSelectedMerchantName] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUnassignedAccounts, setShowUnassignedAccounts] = useState(false);
  // Track initial filter to prevent double-loading
  const initialFilterRef = useRef<string | null>(null);
  
  const [accountOwnerFilter, setAccountOwnerFilter] = useState<string | null>(() => {
    // Initialize with current user's ID for BD/MD roles, 'team' for DSM
    let initialFilter = null;
    if (currentRole === 'bd' || currentRole === 'md') {
      initialFilter = currentUser.employeeId;
    } else if (currentRole === 'dsm') {
      initialFilter = 'team';
    }
    initialFilterRef.current = initialFilter;
    return initialFilter;
  });
  
  // Loading state for merchant accounts
  const [merchantAccounts, setMerchantAccounts] = useState<MerchantAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [totalAccountsCount, setTotalAccountsCount] = useState(0);
  const [accountCountsPerEmployee, setAccountCountsPerEmployee] = useState<Record<string, number>>({});
  const hasLoadedRef = useRef(false);

  // Load ONLY what we need on mount
  useEffect(() => {
    // Prevent multiple loads
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
    const loadInitialData = async () => {
      setIsLoadingAccounts(true);
      
      try {
        // Ensure employees are loaded first (needed for AccountOwnerFilter)
        await loadEmployees();
        
        // Use the initial filter that was set during state initialization
        const initialFilter = initialFilterRef.current;
        const shouldFilterByOwner = (currentRole === 'bd' || currentRole === 'md');
        const filterOwnerId = shouldFilterByOwner ? currentUser.employeeId : null;
        
        // First, load counts to determine batch size
        const [totalCount, employeeCounts] = await Promise.all([
          getTotalAccountsCount(filterOwnerId),
          getAccountCountsPerEmployee(), // Get counts for ALL employees (fast aggregation)
        ]);
        
        // Determine batch size based on role and counts
        let batchSize = 30; // Default: load first 30
        if (shouldFilterByOwner) {
          // BD/MD: load all their accounts (up to 200 max)
          const ownerCount = employeeCounts[currentUser.employeeId] || 0;
          batchSize = Math.min(ownerCount, 200);
        } else if (initialFilter === 'team') {
          // DSM: load batch for team filtering
          batchSize = 200;
        }
        
        // Now load accounts with the right batch size
        const firstBatch = await loadMerchantAccountsIncremental(
          batchSize,
          0, 
          shouldFilterByOwner ? filterOwnerId : null
        );
        
        setTotalAccountsCount(totalCount);
        setAccountCountsPerEmployee(employeeCounts);
        setMerchantAccounts(firstBatch.accounts);
        
        console.log(
          `[AccountSelector] Loaded ${firstBatch.accounts.length} initial accounts${initialFilter ? ` (filter: ${initialFilter})` : ''}. ` +
          `Total: ${totalCount}, Counts ready for ${Object.keys(employeeCounts).length} employees`
        );
      } catch (error) {
        console.error('[AccountSelector] Error loading data:', error);
        setMerchantAccounts([]);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    
    loadInitialData();
  }, []); // Empty deps - load only once on mount

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

  // Load accounts when owner filter changes (after initial load)
  useEffect(() => {
    // Skip if initial load hasn't completed yet
    if (!hasLoadedRef.current) return;
    
    // Skip if this is the initial filter (already loaded)
    if (accountOwnerFilter === initialFilterRef.current) return;
    
    const loadFilteredAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        if (!accountOwnerFilter) {
          // No filter - reload first 30 accounts
          const result = await loadMerchantAccountsIncremental(30, 0, null);
          setMerchantAccounts(result.accounts);
          console.log(`[AccountSelector] Reloaded first ${result.accounts.length} accounts (filter cleared)`);
        } else if (accountOwnerFilter === 'team' || accountOwnerFilter === 'unassigned') {
          // Team/Unassigned - load more to ensure we have enough to filter from
          // This is a compromise - we load a larger batch and filter client-side
          const result = await loadMerchantAccountsIncremental(200, 0, null);
          setMerchantAccounts(result.accounts);
          console.log(`[AccountSelector] Loaded ${result.accounts.length} accounts for ${accountOwnerFilter} filtering`);
        } else {
          // Specific owner selected - load their accounts from database
          const count = accountCountsPerEmployee[accountOwnerFilter] || 0;
          const batchSize = Math.min(count, 200); // Load up to 200 accounts for the owner
          
          const result = await loadMerchantAccountsIncremental(batchSize, 0, accountOwnerFilter);
          setMerchantAccounts(result.accounts);
          
          console.log(`[AccountSelector] Loaded ${result.accounts.length} accounts for owner ${accountOwnerFilter}`);
        }
      } catch (error) {
        console.error('[AccountSelector] Error loading filtered accounts:', error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadFilteredAccounts();
  }, [accountOwnerFilter, accountCountsPerEmployee]);

  // Apply account owner filtering based on role (memoized for performance)
  const baseAccounts = useMemo(() => {
    // Helper to check if account is unassigned (includes House Account)
    const isUnassigned = (acc: any) => !acc.accountOwner || acc.accountOwner.name === 'House Account';
    
    if (accountOwnerFilter === 'unassigned') {
      // Show only unassigned accounts
      return merchantAccounts.filter(isUnassigned);
    } else if (accountOwnerFilter === 'team') {
      // DSM: Show accounts owned by anyone on their team
      const teamMembers = getAllTeamMembers(currentUser.employeeId);
      const teamMemberIds = teamMembers.map(m => m.id);
      const filteredAccounts = merchantAccounts.filter(acc => 
        acc.accountOwner && acc.accountOwner.name !== 'House Account' && teamMemberIds.includes(acc.accountOwner.id)
      );
      // Add unassigned accounts if the toggle is on
      if (showUnassignedAccounts) {
        const unassignedAccounts = merchantAccounts.filter(isUnassigned);
        return [...filteredAccounts, ...unassignedAccounts];
      }
      return filteredAccounts;
    } else if (accountOwnerFilter) {
      // BD/MD or specific owner selected
      const filteredAccounts = merchantAccounts.filter(acc => 
        acc.accountOwner && acc.accountOwner.name !== 'House Account' && acc.accountOwner.id === accountOwnerFilter
      );
      // Add unassigned accounts if the toggle is on
      if (showUnassignedAccounts) {
        const unassignedAccounts = merchantAccounts.filter(isUnassigned);
        return [...filteredAccounts, ...unassignedAccounts];
      }
      return filteredAccounts;
    } else {
      // MM, Admin, Executive: Show all accounts
      return merchantAccounts;
    }
  }, [accountOwnerFilter, currentUser.employeeId, showUnassignedAccounts, merchantAccounts]);

  const filteredAccounts = useMemo(() => {
    return baseAccounts.filter(
      (account) => {
        const locationStr = typeof account.location === 'string' ? account.location : '';
        return (
          account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.businessType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          locationStr.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    );
  }, [baseAccounts, searchQuery]);


  const handlePotentialClick = (
    e: React.MouseEvent,
    account: MerchantAccount
  ) => {
    e.stopPropagation();
    setSelectedAnalysis(account.potentialAnalysis);
    setSelectedMerchantName(account.name);
    setAnalysisModalVisible(true);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 0);
  };

  const listRef = useRef<ListImperativeAPI | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when filter/search changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToRow({ index: 0, align: 'start' });
    }
  }, [searchQuery, accountOwnerFilter]);

  // Calculate container height
  const [containerHeight, setContainerHeight] = useState(450);
  
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        setContainerHeight(height);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Render a single account row (for virtualization) - memoized for performance
  const renderAccountRow = useCallback(({ index }: { index: number }) => {
    const account = filteredAccounts[index];
    
    return (
      <div style={{ padding: '4px 0' }}>
        <Card
          hoverable
          onClick={() => onSelect(account)}
          size="small"
          style={{
            cursor: "pointer",
            border:
              selectedAccountId === account.id
                ? `2px solid ${token.colorPrimary}`
                : undefined,
            transition: "all 0.2s ease",
            margin: '0 4px',
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
              alignItems: "flex-start",
              gap: token.marginSM,
            }}
          >
            {/* Merchant Avatar */}
            <EntityAvatar
              name={account.name}
              logo={account.logo}
              size={40}
              shape="square"
            />
            
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Account Name & Badges */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: token.marginXS,
                  marginBottom: 2,
                }}
              >
                <Text strong style={{ fontSize: token.fontSize }}>
                  {account.name}
                </Text>
                
                {/* Status Badges (right side) */}
                <Space size={4} wrap style={{ justifyContent: "flex-end" }}>
                  {(() => {
                    const activityStatus = getActivityStatus(account);
                    return activityStatus && (
                      <Tag
                        color={activityStatus.color}
                        style={{ 
                          fontSize: 10, 
                          margin: 0, 
                          padding: "1px 6px", 
                          fontWeight: 500,
                        }}
                      >
                        {activityStatus.label}
                      </Tag>
                    );
                  })()}
                  
                  <Tooltip title="Click to view full analysis">
                    <div
                      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      <PotentialTag
                        potential={account.potential}
                        showIcon={true}
                        onClick={(e) => handlePotentialClick(e, account)}
                        style={{ fontSize: token.fontSizeSM }}
                      />
                      <Info size={12} style={{ opacity: 0.7, color: token.colorTextSecondary }} />
                    </div>
                  </Tooltip>
                </Space>
              </div>
              
              {/* Business Type & Location */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 4,
                flexWrap: "wrap",
                marginBottom: 4,
              }}>
                <Text
                  type="secondary"
                  style={{ fontSize: token.fontSizeSM }}
                >
                  {account.businessType} • {typeof account.location === 'string' ? account.location : ''}
                  {account.bookingEngine && (
                    <span style={{ margin: "0 0 0 0" }}> • </span>
                  )}
                </Text>
                
                {/* Booking System Info */}
                {account.bookingEngine && (
                  <>
                    <img 
                      src={account.bookingEngine.logo} 
                      alt={account.bookingEngine.name}
                      style={{ 
                        width: 14, 
                        height: 14, 
                        objectFit: "contain",
                        borderRadius: 2
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Text 
                      type="secondary" 
                      style={{ 
                        fontSize: token.fontSizeSM,
                        fontWeight: 500
                      }}
                    >
                      {account.bookingEngine.name}
                    </Text>
                  </>
                )}
              </div>
              
              {/* Account Owner & Metrics Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: token.marginSM,
                }}
              >
                {/* Account Owner */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {account.accountOwner ? (
                    <>
                      {account.accountOwner.avatar ? (
                        <Avatar
                          size={20}
                          src={account.accountOwner.avatar}
                          style={{ flexShrink: 0 }}
                        />
                      ) : (
                        <Avatar
                          size={20}
                          icon={<User size={12} />}
                          style={{ 
                            flexShrink: 0,
                            background: token.colorBgTextHover,
                          }}
                        />
                      )}
                      <Text
                        type="secondary"
                        style={{ 
                          fontSize: token.fontSizeSM - 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {account.accountOwner.name}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Avatar
                        size={20}
                        icon={<User size={12} />}
                        style={{ 
                          flexShrink: 0,
                          background: token.colorBgTextHover,
                          opacity: 0.5,
                        }}
                      />
                      <Text
                        type="secondary"
                        style={{ 
                          fontSize: token.fontSizeSM - 1,
                          fontStyle: "italic",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {account.accountOwner.name === 'House Account' ? 'Unassigned' : account.accountOwner.name}
                      </Text>
                    </>
                  )}
                </div>
                
                {/* Metrics */}
                {(() => {
                  const metrics = calculateAccountMetrics(account.id);
                  if (metrics.totalRevenue === 0 && metrics.liveDealsCount === 0) {
                    return (
                      <Text
                        type="secondary"
                        style={{ 
                          fontSize: token.fontSizeSM - 1,
                          fontStyle: "italic",
                        }}
                      >
                        No deals yet
                      </Text>
                    );
                  }
                  
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      {metrics.liveDealsCount > 0 && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: "#52c41a",
                              flexShrink: 0,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: token.fontSizeSM - 1,
                              color: token.colorTextSecondary,
                            }}
                          >
                            {metrics.liveDealsCount} live
                          </Text>
                        </div>
                      )}
                      {metrics.totalRevenue > 0 && (
                        <Text
                          strong
                          style={{
                            fontSize: token.fontSizeSM,
                            color: token.colorTextSecondary,
                          }}
                        >
                          {metrics.formattedRevenue}
                        </Text>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }, [filteredAccounts, selectedAccountId, token, onSelect]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minHeight: 0,
      }}
    >
      {/* Search - Sticky with background */}
      <div
        style={{
          background: token.colorBgContainer,
          borderBottom: isScrolled
            ? `1px solid ${token.colorBorderSecondary}`
            : "1px solid transparent",
          flexShrink: 0,
          zIndex: 1,
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            padding: `${token.paddingLG}px ${token.paddingLG}px ${
              isScrolled ? token.padding : token.marginSM
            }px`,
            display: 'flex',
            gap: token.marginSM,
            alignItems: 'center',
          }}
        >
          <Input
            placeholder="Search accounts..."
            prefix={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="large"
            allowClear
            style={{ flex: 1 }}
          />
          <AccountOwnerFilter
            selectedOwnerId={accountOwnerFilter}
            onFilterChange={setAccountOwnerFilter}
            showUnassigned={showUnassignedAccounts}
            onShowUnassignedChange={setShowUnassignedAccounts}
            accountCounts={accountCountsPerEmployee}
            context="accounts"
            isLoadingData={isLoadingAccounts}
          />
        </div>
      </div>

      {/* Account List - Scrollable with Virtual Scrolling */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          padding: `${isScrolled ? token.paddingLG : token.paddingXS}px ${
            token.paddingLG
          }px 0`,
          transition: "padding-top 0.2s ease",
        }}
      >
        {isLoadingAccounts ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minHeight: "300px",
              padding: "40px 20px",
              gap: 16,
            }}
          >
            <Spin size="large" />
            <Text type="secondary" style={{ fontSize: token.fontSize }}>
              Loading accounts...
            </Text>
          </div>
        ) : filteredAccounts.length > 0 ? (
          <List<{}>
            listRef={listRef}
            rowCount={filteredAccounts.length}
            rowHeight={120}
            rowComponent={renderAccountRow}
            rowProps={{}}
            defaultHeight={containerHeight - (isScrolled ? token.paddingLG : token.paddingXS) - token.paddingLG}
            onResize={({ height }) => {
              setContainerHeight(height);
            }}
            onRowsRendered={({ startIndex }) => {
              setIsScrolled(startIndex > 0);
            }}
            style={{
              overflowX: 'hidden',
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minHeight: "300px",
              padding: "40px 20px",
            }}
          >
            <Empty
              image={
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ margin: '0 auto' }}
                >
                  {/* Store/Building icon */}
                  <rect x="12" y="24" width="40" height="28" rx="2" fill="#F0F0F0" />
                  <rect x="12" y="24" width="40" height="4" fill="#D9D9D9" />
                  <rect x="20" y="32" width="8" height="12" rx="1" fill="#BFBFBF" />
                  <rect x="36" y="32" width="8" height="12" rx="1" fill="#BFBFBF" />
                  <path
                    d="M8 24L32 12L56 24"
                    stroke="#D9D9D9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <circle cx="32" cy="48" r="2" fill="#8C8C8C" />
                </svg>
              }
              description={
                <Space direction="vertical" size={4}>
                  <Text type="secondary" style={{ fontSize: token.fontSize }}>
                    {searchQuery ? 'No accounts match your search' : 'No accounts found'}
                  </Text>
                  {searchQuery && (
                    <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      Try adjusting your search or filter
                    </Text>
                  )}
                </Space>
              }
            />
          </div>
        )}
      </div>

      {/* Potential Analysis Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>Merchant Potential Analysis</span>
            {selectedAnalysis && (
              <PotentialTag
                potential={selectedAnalysis.overall}
                showIcon={true}
                style={{ margin: 0 }}
              />
            )}
          </div>
        }
        open={analysisModalVisible}
        onCancel={() => setAnalysisModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedAnalysis && (
          <div>
            {/* Merchant Name */}
            <Title level={4} style={{ marginTop: 0 }}>
              {selectedMerchantName}
            </Title>

            {/* Overall Score */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text strong>Overall Score</Text>
                <Text
                  strong
                  style={{
                    fontSize: 20,
                    color: selectedAnalysis.score >= 80 
                      ? token.colorSuccess 
                      : selectedAnalysis.score >= 60 
                        ? token.colorWarning 
                        : token.colorError,
                  }}
                >
                  {selectedAnalysis.score}/100
                </Text>
              </div>
              <ScoreProgress
                score={selectedAnalysis.score}
                colorType="score-based"
                showInfo={false}
              />
            </Card>

            {/* Performance Factors */}
            <Title level={5}>Performance Factors</Title>
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              {Object.entries(selectedAnalysis.factors).map(([key, factor]) => (
                <Card key={key} size="small">
                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text strong style={{ textTransform: "capitalize" }}>
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .trim()
                          .split(" ")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </Text>
                      <Text
                        style={{
                          color: factor.score >= 80 
                            ? token.colorSuccess 
                            : factor.score >= 60 
                              ? token.colorWarning 
                              : token.colorError,
                          fontWeight: 500,
                        }}
                      >
                        {factor.score}
                      </Text>
                    </div>
                    <ScoreProgress
                      score={factor.score}
                      colorType="score-based"
                      size="small"
                      showInfo={false}
                    />
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {factor.notes}
                  </Text>
                </Card>
              ))}
            </Space>

            <Divider />

            {/* Insights */}
            <Title level={5}>Key Insights</Title>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Paragraph style={{ margin: 0, fontSize: 13 }}>
                {selectedAnalysis.insights}
              </Paragraph>
            </Card>

            {/* Recommendations */}
            <Title level={5}>Recommendations</Title>
            <Card size="small">
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 13,
                  lineHeight: 1.8,
                }}
              >
                {selectedAnalysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AccountSelector;
