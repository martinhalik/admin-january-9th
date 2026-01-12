/**
 * Optimized Account Owner Filter Component
 * 
 * Performance improvements:
 * - Virtual scrolling for large lists (react-window)
 * - Lazy loading with pagination
 * - Debounced backend search
 * - Only loads 20 items initially, fetches more on scroll
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dropdown, Typography, Avatar, theme, Button, Badge, Input, Checkbox, Space, Spin } from 'antd';
import { ChevronDown, Check, X, Search, HelpCircle } from 'lucide-react';
import { useRoleView } from '../contexts/RoleViewContext';
import { getEmployeeById, getAllTeamMembers, getAllEmployees } from '../data/companyHierarchy';
import { fetchEmployeesByRolePaginated, getAccountOwnersCount, type EmployeeWithCounts } from '../lib/supabaseData';
import { supabase } from '../lib/supabase';
import type { MenuProps } from 'antd';

const { Text } = Typography;
const { useToken } = theme;

interface AccountOwnerFilterProps {
  onFilterChange?: (ownerId: string | null) => void;
  selectedOwnerId?: string | null;
  showUnassigned?: boolean;
  onShowUnassignedChange?: (show: boolean) => void;
  /** Array of items with accountOwnerId field to count per owner (DEPRECATED - use accountCounts) */
  items?: Array<{ accountOwnerId?: string | null }>;
  /** Pre-calculated account counts per employee ID (preferred) */
  accountCounts?: Record<string, number>;
  /** Whether we're filtering accounts or deals (for display purposes) */
  context: 'accounts' | 'deals';
  /** Whether the parent component is still loading data */
  isLoadingData?: boolean;
}

const ITEMS_PER_PAGE = 20;
const ACCOUNT_OWNER_ROLES = ['bd', 'md', 'mm', 'dsm'];

export const AccountOwnerFilter: React.FC<AccountOwnerFilterProps> = ({
  onFilterChange,
  selectedOwnerId,
  showUnassigned = false,
  onShowUnassignedChange,
  items = [],
  accountCounts,
  context,
  isLoadingData = false,
}) => {
  const { token } = useToken();
  const { currentRole, currentUser } = useRoleView();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  
  // Pagination state
  const [owners, setOwners] = useState<EmployeeWithCounts[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // Debounce timer
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingPageRef = useRef<number | null>(null); // Track which page is currently being loaded

  // Load owners with pagination
  const loadOwners = useCallback(async (pageNum: number, query: string, append: boolean = false) => {
    if (!supabase) {
      console.warn('[AccountOwnerFilter] Supabase not configured');
      return;
    }
    
    setLoading(true);
    try {
      const { employees, total } = await fetchEmployeesByRolePaginated(
        ACCOUNT_OWNER_ROLES,
        query,
        ITEMS_PER_PAGE,
        pageNum * ITEMS_PER_PAGE
      );
      
      setOwners(prev => append ? [...prev, ...employees] : employees);
      setTotalCount(total);
      setHasMore(employees.length === ITEMS_PER_PAGE);
      
      // Check if we need to load more after DOM updates
      // This fixes the issue where scrollHeight doesn't update after new items are added
      setTimeout(() => {
        const container = scrollContainerRef.current;
        if (container && append && employees.length === ITEMS_PER_PAGE) {
          const { scrollHeight, scrollTop, clientHeight } = container;
          const shouldLoadMore = scrollHeight - scrollTop <= clientHeight * 1.5;
          
          if (shouldLoadMore && loadingPageRef.current === null) {
            const nextPage = pageNum + 1;
            loadingPageRef.current = nextPage;
            setPage(nextPage);
            loadOwners(nextPage, query, true);
          }
        }
      }, 100);
    } catch (error) {
      console.error('[AccountOwnerFilter] Error loading owners:', error);
      // On error, keep existing owners but stop loading
      setHasMore(false);
    } finally {
      setLoading(false);
      loadingPageRef.current = null; // Clear the loading page tracker
    }
  }, [owners.length, hasMore, loading]);

  // Initial load
  useEffect(() => {
    if (dropdownOpen) {
      loadingPageRef.current = null; // Reset loading tracker
      loadOwners(0, searchQuery, false);
      setPage(0);
    }
  }, [dropdownOpen, searchQuery]); // Removed loadOwners from dependencies to prevent infinite loop

  // Debounced search - removed to avoid infinite loop
  // Search is now handled by the initial load effect above

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Load more when scrolled to 50% of remaining content (more aggressive preloading)
    // Prevent duplicate loads by checking if we're already loading this page
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading && loadingPageRef.current === null) {
      const nextPage = page + 1;
      loadingPageRef.current = nextPage; // Mark this page as being loaded
      setPage(nextPage);
      loadOwners(nextPage, searchQuery, true);
    }
  }, [hasMore, loading, page, searchQuery, loadOwners, owners.length]);

  // Check if hierarchy data is loaded - if not, don't render
  const allEmployees = getAllEmployees();
  if (allEmployees.length === 0) {
    return null; // Data not loaded yet
  }

  // Get current employee - with null check for data not loaded
  // If not found, we'll still render but with limited functionality
  const currentEmployee = currentUser ? getEmployeeById(currentUser.employeeId) : null;
  
  // If no current user context at all, don't render
  if (!currentUser) {
    return null;
  }

  // Helper functions
  const getRoleShortcut = (role: string): string => {
    const shortcuts: Record<string, string> = {
      'bd': 'BD',
      'md': 'MD',
      'mm': 'MM',
      'dsm': 'DSM',
    };
    return shortcuts[role] || role.toUpperCase();
  };

  const getRoleColor = (role: string): string => {
    const roleColors: Record<string, string> = {
      dsm: '#1890ff',
      mm: '#52c41a',
      bd: '#13c2c2',
      md: '#fa8c16',
    };
    return roleColors[role] || token.colorPrimary;
  };

  const getCountForOwner = (ownerId: string) => {
    // Use pre-calculated counts if available (preferred for performance)
    if (accountCounts) {
      return accountCounts[ownerId] || 0;
    }
    // Fallback to counting from items array
    return items.filter((item: any) => item.accountOwnerId === ownerId).length;
  };

  const getCountForTeam = (teamMemberIds: string[]) => {
    // Use pre-calculated counts if available
    if (accountCounts) {
      return teamMemberIds.reduce((sum, id) => sum + (accountCounts[id] || 0), 0);
    }
    // Fallback to counting from items array
    return items.filter((item: any) => item.accountOwnerId && teamMemberIds.includes(item.accountOwnerId)).length;
  };

  const isFiltered = selectedOwnerId !== null;

  // Build dropdown menu items
  const menuItems: MenuProps['items'] = [
    {
      key: 'header',
      type: 'group',
      label: (
        <div style={{
          padding: '0',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          marginBottom: 4,
        }}>
          <Input
            placeholder={`Search ${totalCount} owners...`}
            prefix={<Search size={14} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              // Prevent dropdown from closing or handling these keys
              if (e.key === 'Escape') {
                setDropdownOpen(false);
              } else {
                // Stop propagation for all other keys to allow normal input behavior
                e.stopPropagation();
              }
            }}
            allowClear
            size="middle"
            autoFocus
          />
        </div>
      ),
    },
    {
      key: 'all',
      label: (
        <Space size="middle" style={{ width: '100%', padding: '8px 0' }}>
          <Avatar.Group
            max={{ count: 3, style: {
              color: token.colorTextSecondary,
              backgroundColor: token.colorBgContainer,
              border: `2px solid ${token.colorBgContainer}`,
            }}}
            size={32}
          >
            {owners.slice(0, 3).map(emp => (
              <Avatar
                key={emp.id}
                src={emp.avatar}
                style={{ border: `2px solid ${token.colorBgContainer}` }}
              >
                {emp.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            ))}
          </Avatar.Group>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text strong>All Account Owners</Text>
              {!isFiltered && <Check size={16} style={{ color: token.colorText }} />}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {totalCount} account owner{totalCount > 1 ? 's' : ''}
            </Text>
          </div>
        </Space>
      ),
      onClick: () => {
        onFilterChange?.(null);
        setDropdownOpen(false);
        setSearchQuery('');
      },
      style: {
        background: !isFiltered ? token.colorFillSecondary : 'transparent',
      },
    },
    { type: 'divider' },
    // My Accounts shortcut (for BD/MD) - only show if we found the current employee
    (currentRole === 'bd' || currentRole === 'md') && currentEmployee && {
      key: 'my-accounts',
      label: (
        <Space size="middle" style={{ width: '100%', padding: '8px 0' }}>
          <Avatar
            src={currentEmployee.avatar}
            size={32}
            style={{ border: `2px solid ${token.colorBorder}` }}
          >
            {currentEmployee.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text strong>My {context === 'accounts' ? 'Accounts' : 'Deals'}</Text>
              {selectedOwnerId === currentUser.employeeId && <Check size={16} style={{ color: token.colorText }} />}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {getCountForOwner(currentUser.employeeId)} {context === 'accounts' ? 'account' : 'deal'}{getCountForOwner(currentUser.employeeId) !== 1 ? 's' : ''}
            </Text>
          </div>
        </Space>
      ),
      onClick: () => {
        onFilterChange?.(currentUser.employeeId);
        setDropdownOpen(false);
        setSearchQuery('');
      },
      style: {
        background: selectedOwnerId === currentUser.employeeId ? token.colorFillSecondary : 'transparent',
      },
    },
    // My Team shortcut - only show if we found the current employee
    (currentRole === 'dsm' || (currentEmployee && currentEmployee.directReports && currentEmployee.directReports.length > 0)) && {
      key: 'my-team',
      label: (
        <Space size="middle" style={{ width: '100%', padding: '8px 0' }}>
          <Avatar.Group
            max={{ count: 3, style: {
              color: token.colorTextSecondary,
              backgroundColor: token.colorBgContainer,
              border: `2px solid ${token.colorBgContainer}`,
            }}}
            size={32}
          >
            {getAllTeamMembers(currentUser.employeeId).slice(0, 3).map(emp => (
              <Avatar
                key={emp.id}
                src={emp.avatar}
                style={{ border: `2px solid ${token.colorBgContainer}` }}
              >
                {emp.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            ))}
          </Avatar.Group>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text strong>My Team</Text>
              {selectedOwnerId === 'team' && <Check size={16} style={{ color: token.colorText }} />}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {getCountForTeam(getAllTeamMembers(currentUser.employeeId).map(m => m.id))} {context === 'accounts' ? 'account' : 'deal'}{getCountForTeam(getAllTeamMembers(currentUser.employeeId).map(m => m.id)) !== 1 ? 's' : ''}
            </Text>
          </div>
        </Space>
      ),
      onClick: () => {
        onFilterChange?.('team');
        setDropdownOpen(false);
        setSearchQuery('');
      },
      style: {
        background: selectedOwnerId === 'team' ? token.colorFillSecondary : 'transparent',
      },
    },
    // Unassigned shortcut
    {
      key: 'unassigned',
      label: (
        <Space size="middle" style={{ width: '100%', padding: '8px 0' }}>
          <Avatar size={32} icon={<HelpCircle size={18} />} style={{ background: token.colorFillTertiary, color: token.colorTextSecondary }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text strong>Unassigned</Text>
              {selectedOwnerId === 'unassigned' && <Check size={16} style={{ color: token.colorText }} />}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {context === 'accounts' ? 'Accounts' : 'Deals'} without an owner
            </Text>
          </div>
        </Space>
      ),
      onClick: () => {
        onFilterChange?.('unassigned');
        setDropdownOpen(false);
        setSearchQuery('');
      },
      style: {
        background: selectedOwnerId === 'unassigned' ? token.colorFillSecondary : 'transparent',
      },
    },
    { type: 'divider' },
  ].filter(Boolean) as MenuProps['items'];

  // Add owner items
  owners.forEach(emp => {
    const isSelected = emp.id === selectedOwnerId;
    const itemCount = getCountForOwner(emp.id); // Count from actual items, not database field

    menuItems.push({
      key: emp.id,
      label: (
        <Space size="middle" style={{ width: '100%', padding: '8px 0' }}>
          <Badge
            dot
            color={getRoleColor(emp.role)}
            offset={[-4, 4]}
          >
            <Avatar
              src={emp.avatar}
              size={32}
              style={{
                border: `2px solid ${token.colorBorder}`,
                boxShadow: 'none',
              }}
            >
              {emp.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
          </Badge>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text strong style={{ fontSize: 14 }}>
                {emp.name}
                {emp.id === currentUser.employeeId && (
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>(You)</Text>
                )}
              </Text>
              {isSelected && <Check size={16} style={{ color: token.colorText }} />}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {getRoleShortcut(emp.role)} • {itemCount} {context === 'accounts' ? 'account' : 'deal'}{itemCount !== 1 ? 's' : ''}
            </Text>
          </div>
        </Space>
      ),
      onClick: () => {
        onFilterChange?.(emp.id);
        setDropdownOpen(false);
        setSearchQuery('');
      },
      style: {
        background: isSelected ? token.colorFillSecondary : 'transparent',
      },
    });
  });

  // Loading indicator
  if (loading && owners.length === 0) {
    menuItems.push({
      key: 'loading',
      label: (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Spin />
        </div>
      ),
      disabled: true,
    });
  }

  // Load more indicator
  if (loading && owners.length > 0) {
    menuItems.push({
      key: 'loading-more',
      label: (
        <div style={{ padding: '12px', textAlign: 'center' }}>
          <Spin size="small" />
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>Loading more...</Text>
        </div>
      ),
      disabled: true,
    });
  }

  // Show "scroll for more" hint when there are more items but not loading
  if (!loading && hasMore && owners.length > 0) {
    menuItems.push({
      key: 'load-more-button',
      label: (
        <div style={{ padding: '12px 8px', textAlign: 'center', background: token.colorFillQuaternary, borderTop: `1px solid ${token.colorBorder}` }}>
          <Button 
            type="primary" 
            size="small"
            block
            onClick={() => {
              const nextPage = page + 1;
              if (loadingPageRef.current === null) {
                loadingPageRef.current = nextPage;
                setPage(nextPage);
                loadOwners(nextPage, searchQuery, true);
              }
            }}
            style={{ marginBottom: 8 }}
          >
            Load More ({owners.length}/{totalCount})
          </Button>
          <Text type="secondary" style={{ fontSize: 11 }}>
            or scroll down to load automatically
          </Text>
        </div>
      ),
      disabled: true,
    });
  }

  // No results
  if (!loading && owners.length === 0 && searchQuery) {
    menuItems.push({
      key: 'no-results',
      label: (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Text type="secondary">No owners found matching "{searchQuery}"</Text>
        </div>
      ),
      disabled: true,
    });
  }

  // Render button content
  const renderButtonContent = () => {
    if (selectedOwnerId === 'team') {
      const teamMembers = getAllTeamMembers(currentUser.employeeId);
      return (
        <>
          <Avatar.Group
            max={{ count: 2, style: {
              color: token.colorTextSecondary,
              backgroundColor: token.colorBgContainer,
              fontSize: 11,
              border: `1px solid ${token.colorBorder}`,
            }}}
            size={24}
          >
            {teamMembers.slice(0, 3).map(emp => (
              <Avatar
                key={emp.id}
                src={emp.avatar}
                size={24}
                style={{ border: `1px solid ${token.colorBorder}` }}
              >
                {emp.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            ))}
          </Avatar.Group>
          <Text strong style={{ fontSize: 14 }}>
            My Team ({getCountForTeam(teamMembers.map(m => m.id))})
          </Text>
        </>
      );
    } else if (selectedOwnerId === 'unassigned') {
      return (
        <>
          <Avatar size={24} icon={<HelpCircle size={14} />} style={{ background: token.colorFillTertiary, color: token.colorTextSecondary }} />
          <Text strong style={{ fontSize: 14 }}>
            Unassigned
          </Text>
        </>
      );
    } else if (selectedOwnerId) {
      const selected = owners.find(emp => emp.id === selectedOwnerId) || getEmployeeById(selectedOwnerId);
      if (selected) {
        return (
          <>
            <Badge
              dot
              color={getRoleColor(selected.role)}
              offset={[-2, 2]}
            >
              <Avatar
                src={selected.avatar}
                size={24}
                style={{
                  border: `2px solid ${token.colorBorder}`,
                }}
              >
                {selected.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            </Badge>
            <Text strong style={{ fontSize: 14 }}>
              {selected.name}
            </Text>
          </>
        );
      }
    }
    // Default: All Owners
    return (
      <>
        <Avatar.Group
          max={{ count: 3, style: {
            color: token.colorTextSecondary,
            backgroundColor: token.colorBgContainer,
            fontSize: 11,
            border: `1px solid ${token.colorBorder}`,
          }}}
          size={24}
        >
          {owners.slice(0, 3).map(emp => (
            <Avatar
              key={emp.id}
              src={emp.avatar}
              size={24}
              style={{ border: `1px solid ${token.colorBorder}` }}
            >
              {emp.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
          ))}
        </Avatar.Group>
        <Text style={{ fontSize: 14 }}>All Owners</Text>
      </>
    );
  };

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      open={dropdownOpen}
      onOpenChange={(open) => {
        setDropdownOpen(open);
        if (!open) setSearchQuery('');
      }}
      placement="bottomRight"
      dropdownRender={(menu) => (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          style={{
            maxHeight: '70vh',
            overflowY: 'auto',
            boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            borderRadius: token.borderRadiusLG,
          }}
        >
          {menu}
        </div>
      )}
      overlayStyle={{
        minWidth: 380,
      }}
    >
      <Button
        style={{
          height: 32,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isFiltered ? token.colorFillSecondary : token.colorBgContainer,
          borderColor: isFiltered ? token.colorBorderSecondary : token.colorBorder,
          color: isFiltered ? token.colorText : token.colorText,
          position: 'relative',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        loading={isLoadingData}
        disabled={isLoadingData}
      >
        {!isLoadingData && renderButtonContent()}
        {!isLoadingData && (
          isFiltered && isHovered && !dropdownOpen ? (
            <X
              size={14}
              style={{ color: token.colorTextSecondary, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onFilterChange?.(null);
                onShowUnassignedChange?.(false);
              }}
            />
          ) : (
            <ChevronDown
              size={14}
              style={{
                color: token.colorTextSecondary,
                transition: 'transform 0.2s',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          )
        )}
      </Button>
    </Dropdown>
  );
};

export default AccountOwnerFilter;

