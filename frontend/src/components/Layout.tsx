import React from "react";
import {
  Layout as AntLayout,
  Avatar,
  Input,
  Dropdown,
  Button,
  theme,
  Badge,
  Drawer,
  Menu,
  Modal,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Tag,
  ListTodo,
  Search,
  Bell,
  ChevronDown,
  Moon,
  Sun,
  Target,
  Hash,
  SlidersHorizontal,
  Zap,
  UserCog,
  Key,
  Bot,
  Workflow,
  Plus,
  BadgePercent,
  Building2,
  CheckSquare,
  User,
  Settings,
  LogOut,
  Eye,
  Check,
  Bug,
  Sparkles,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import type { MenuProps } from "antd";
import CreateDealModal from "./CreateDealModal";
import { useRoleView, AVAILABLE_ROLES, UserRole, SimulatedUser } from "../contexts/RoleViewContext";
import { useUserPreferences } from "../contexts/UserPreferencesContext";
import { getEmployeesByRole, getEmployeeById } from "../data/companyHierarchy";
import { useAuth } from "../contexts/AuthContext";

const { Header, Content } = AntLayout;
const { useToken } = theme;

// Constants
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;
const HEADER_HEIGHT = 64;
const HEADER_ZINDEX = 1010; // Higher than sidebar (1000) to show shadow above it
const SEARCH_BAR_WIDTH = 400;
const ICON_SIZE_SM = 12;
const ICON_SIZE_MD = 14;
const ICON_SIZE_DEFAULT = 16;
const ICON_SIZE_LG = 16;
const ICON_SIZE_XL = 24; // For tablet/desktop buttons

interface LayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const AppLayout: React.FC<LayoutProps> = ({
  children,
  isDarkMode,
  toggleTheme,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useToken();
  const { signOut, user } = useAuth();
  const [isMobile, setIsMobile] = React.useState(
    window.innerWidth < MOBILE_BREAKPOINT
  );
  const [isTablet, setIsTablet] = React.useState(
    window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT
  );
  const [createModalVisible, setCreateModalVisible] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const { currentRole, setRole, getRoleInfo, setCurrentUser, currentUser } = useRoleView();
  const { debugMode, toggleDebugMode, hasDebugControls } = useUserPreferences();
  const currentRoleInfo = getRoleInfo(currentRole);
  
  // Get current employee data for avatar and name
  const currentEmployee = getEmployeeById(currentUser.employeeId);

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < MOBILE_BREAKPOINT);
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMenuClick = ({ key }: { key: string }) => {
    // Close mobile menu if open
    setMobileMenuOpen(false);
    
    // Check if it's logout
    if (key === "logout") {
      signOut();
      return;
    }
    // Check if it's a debug toggle
    if (key === "toggle-debug") {
      toggleDebugMode();
      return;
    }
    // Check if it's a role change
    if (key.startsWith("role-")) {
      const roleId = key.replace("role-", "") as UserRole;
      
      // Get a representative employee for this role
      const employeesWithRole = getEmployeesByRole(roleId);
      
      if (employeesWithRole.length > 0) {
        // Switch to the first employee with this role
        const employee = employeesWithRole[0];
        const newUser: SimulatedUser = {
          employeeId: employee.id,
          name: employee.name,
          role: employee.role,
        };
        setCurrentUser(newUser);
      } else {
        // Fallback to just setting the role if no employees found
        setRole(roleId);
      }
      return;
    }
    navigate(key);
  };

  // Group roles by category
  const rolesByCategory = AVAILABLE_ROLES.reduce((acc, role) => {
    if (!acc[role.category]) {
      acc[role.category] = [];
    }
    acc[role.category].push(role);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_ROLES>);

  // Build View As submenu items
  const viewAsItems: MenuProps["items"] = [];
  Object.entries(rolesByCategory).forEach(([category, roles], categoryIndex) => {
    // Add category label
    viewAsItems.push({
      key: `category-${category}`,
      label: category,
      type: "group",
    });

    // Add roles in this category
    roles.forEach((role) => {
      viewAsItems.push({
        key: `role-${role.id}`,
        label: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{role.name}</span>
            {currentRole === role.id && (
              <Check
                size={ICON_SIZE_DEFAULT}
                style={{ marginLeft: token.marginXS, color: token.colorPrimary }}
              />
            )}
          </div>
        ),
        style: {
          paddingLeft: token.paddingLG,
        },
      });
    });

    // Add divider after each category except the last one
    if (categoryIndex < Object.keys(rolesByCategory).length - 1) {
      viewAsItems.push({
        type: "divider",
      });
    }
  });

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: "My Profile Settings",
      icon: <User size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings size={ICON_SIZE_DEFAULT} />,
    },
    {
      type: "divider",
    },
    {
      key: "toggle-debug",
      label: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span>Debug Mode</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {hasDebugControls && (
              <Badge 
                dot 
                status="processing"
                style={{ marginRight: 4 }}
              />
            )}
            {debugMode && <Check size={ICON_SIZE_SM} />}
          </div>
        </div>
      ),
      icon: <Bug size={ICON_SIZE_DEFAULT} />,
    },
    {
      type: "divider",
    },
    {
      key: "view-as",
      label: "View as",
      icon: <Eye size={ICON_SIZE_DEFAULT} />,
      children: viewAsItems,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Log out",
      icon: <LogOut size={ICON_SIZE_DEFAULT} />,
    },
  ];

  // Navigation menu items for header
  const headerMenuItems = [
    {
      key: "/",
      label: "Dashboard",
      isActive: location.pathname === "/",
    },
    {
      key: "/deals",
      label: "Deals",
      isActive: location.pathname === "/deals",
    },
    {
      key: "/brands",
      label: "Brands",
      isActive: location.pathname === "/brands",
    },
    {
      key: "/accounts",
      label: "Accounts",
      isActive: location.pathname === "/accounts",
    },
    {
      key: "/templates",
      label: "Templates",
      isActive: location.pathname === "/templates",
    },
  ];

  const moreMenuItems: MenuProps["items"] = [
    {
      key: "/tasks",
      label: "My Tasks",
      icon: <ListTodo size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/leads",
      label: "Leads",
      icon: <Target size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/tags",
      label: "Tags",
      icon: <Hash size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/custom-fields",
      label: "Custom Fields",
      icon: <SlidersHorizontal size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/tag-jobs",
      label: "Tag Jobs",
      icon: <Zap size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/videos",
      label: "Videos",
      icon: <Tag size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/users",
      label: "Users",
      icon: <UserCog size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/api-tokens",
      label: "API Tokens",
      icon: <Key size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/ai-agents",
      label: "AI Agents",
      icon: <Bot size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/workflows",
      label: "Workflows",
      icon: <Workflow size={ICON_SIZE_DEFAULT} />,
    },
    { type: "divider" },
    {
      key: "admin-group",
      label: "Admin",
      type: "group",
    },
    {
      key: "/admin/campaign-stages",
      label: "Campaign Stages",
      icon: <Workflow size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/admin/taxonomy",
      label: "Category Management",
      icon: <SlidersHorizontal size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/admin/salesforce-mapping",
      label: "Salesforce Stage Mapping",
      icon: <SlidersHorizontal size={ICON_SIZE_DEFAULT} />,
    },
    {
      key: "/admin/organization",
      label: "Organization Hierarchy",
      icon: <Building2 size={ICON_SIZE_DEFAULT} />,
    },
  ];

  const createMenuItems: MenuProps["items"] = [
    {
      key: "create-deal",
      label: "Deal",
      icon: <BadgePercent size={ICON_SIZE_DEFAULT} />,
      onClick: () => setCreateModalVisible(true),
    },
    {
      key: "create-account",
      label: "Account",
      icon: <Building2 size={ICON_SIZE_DEFAULT} />,
      disabled: true,
    },
    {
      key: "create-task",
      label: "Task",
      icon: <CheckSquare size={ICON_SIZE_DEFAULT} />,
      disabled: true,
    },
  ];

  return (
    <AntLayout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      {/* Global styles for mobile, tablet, and desktop icon sizes */}
      <style>{`
        /* Mobile, Tablet, and Desktop: Force 20px icons with higher specificity */
        header .ant-btn .ant-btn-icon svg,
        header .ant-btn .ant-btn-icon span svg,
        header button svg {
          width: ${ICON_SIZE_LG}px !important;
          height: ${ICON_SIZE_LG}px !important;
          min-width: ${ICON_SIZE_LG}px !important;
          min-height: ${ICON_SIZE_LG}px !important;
        }
      `}</style>
      <Header
        style={{
          position: "sticky",
          top: 0,
          background: token.colorBgBase,
          padding: isMobile ? `0 ${token.padding}px` : `0 ${token.paddingLG}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: HEADER_HEIGHT,
          lineHeight: `${HEADER_HEIGHT}px`,
          boxShadow: token.boxShadowTertiary,
          zIndex: HEADER_ZINDEX,
        }}
      >
        {/* Left side - Logo, Search, and Navigation */}
        <div
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: isMobile ? token.marginSM : isTablet ? token.marginMD : token.marginLG,
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Mobile & Tablet Menu Button */}
          {(isMobile || isTablet) && (
            <Button
              type="text"
              icon={
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: ICON_SIZE_LG, height: ICON_SIZE_LG }}>
                  <MenuIcon size={ICON_SIZE_LG} style={{ width: `${ICON_SIZE_LG}px`, height: `${ICON_SIZE_LG}px` }} />
                </span>
              }
              onClick={() => setMobileMenuOpen(true)}
              size={isMobile ? "middle" : "large"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: isMobile ? 32 : 40,
                minHeight: isMobile ? 32 : 40,
              }}
            />
          )}

          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: token.marginXS,
              cursor: "pointer",
              flexShrink: 0,
            }}
            onClick={() => navigate("/")}
          >
            <div
              style={{
                width: token.controlHeight,
                height: token.controlHeight,
                background: token.colorPrimary,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: token.colorWhite,
                fontWeight: token.fontWeightStrong,
                fontSize: token.fontSizeLG,
              }}
            >
              G
            </div>
          </div>

          {/* Search Bar - Desktop only */}
          {!isMobile && !isTablet && (
            <div style={{ width: SEARCH_BAR_WIDTH }}>
              <Input
                placeholder="Search deals, merchants, videos..."
                prefix={
                  <Search
                    size={ICON_SIZE_DEFAULT}
                    color={token.colorTextPlaceholder}
                  />
                }
                style={{
                  borderRadius: token.borderRadiusLG,
                  background: token.colorFillSecondary,
                  border: "none",
                }}
                size="large"
              />
            </div>
          )}

          {/* Navigation Links - Desktop only */}
          {!isMobile && !isTablet && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: token.marginLG,
              }}
            >
              {headerMenuItems.map((item) => (
                <div
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  style={{
                    cursor: "pointer",
                    padding: `${token.paddingXS}px 0`,
                    color: item.isActive
                      ? token.colorText
                      : token.colorTextSecondary,
                    fontWeight: item.isActive ? token.fontWeightStrong : "normal",
                    fontSize: token.fontSize,
                    transition: `color ${token.motionDurationMid}`,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!item.isActive) {
                      e.currentTarget.style.color = token.colorText;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.isActive) {
                      e.currentTarget.style.color = token.colorTextSecondary;
                    }
                  }}
                >
                  {item.label}
                </div>
              ))}

              {/* More Dropdown */}
              <Dropdown
                menu={{
                  items: moreMenuItems,
                  onClick: handleMenuClick,
                }}
                placement="bottomLeft"
                trigger={["click"]}
                align={{ offset: [0, 0] }}
              >
                <div
                  style={{
                    cursor: "pointer",
                    padding: `${token.paddingXS}px 0`,
                    color: token.colorTextSecondary,
                    fontSize: token.fontSize,
                    display: "flex",
                    alignItems: "center",
                    gap: token.marginXXS,
                    transition: `color ${token.motionDurationMid}`,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = token.colorText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = token.colorTextSecondary;
                  }}
                >
                  More
                  <ChevronDown size={ICON_SIZE_MD} />
                </div>
              </Dropdown>
            </div>
          )}
        </div>

        {/* Right side - User Actions */}
        <div
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: isMobile ? token.marginXXS : token.marginMD,
            flexShrink: 0,
            marginLeft: token.marginMD,
          }}
        >
          {/* Mobile Search Button */}
          {isMobile && (
            <Button
              type="text"
              icon={
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: ICON_SIZE_LG, height: ICON_SIZE_LG }}>
                  <Search size={ICON_SIZE_LG} style={{ width: `${ICON_SIZE_LG}px`, height: `${ICON_SIZE_LG}px` }} />
                </span>
              }
              onClick={() => setMobileSearchOpen(true)}
              size="middle"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          )}

          {/* Tablet Search Button */}
          {isTablet && (
            <Button
              type="text"
              icon={
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: ICON_SIZE_LG, height: ICON_SIZE_LG }}>
                  <Search 
                    size={ICON_SIZE_LG} 
                    strokeWidth={2.5} 
                    style={{ 
                      width: `${ICON_SIZE_LG}px`, 
                      height: `${ICON_SIZE_LG}px`,
                      minWidth: ICON_SIZE_LG,
                      minHeight: ICON_SIZE_LG
                    }} 
                  />
                </span>
              }
              onClick={() => setMobileSearchOpen(true)}
              size="large"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 40,
                minHeight: 40,
              }}
            />
          )}

          {/* Create Button */}
          <Dropdown
            menu={{ items: createMenuItems }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Button
              type="primary"
              icon={
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: ICON_SIZE_LG, height: ICON_SIZE_LG }}>
                  <Plus 
                    size={ICON_SIZE_LG} 
                    strokeWidth={2.5} 
                    style={{ 
                      width: `${ICON_SIZE_LG}px`, 
                      height: `${ICON_SIZE_LG}px`,
                      minWidth: ICON_SIZE_LG,
                      minHeight: ICON_SIZE_LG
                    }} 
                  />
                </span>
              }
              shape="circle"
              size={isMobile ? "middle" : "large"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: isMobile ? 32 : 40,
                minHeight: isMobile ? 32 : 40,
              }}
            />
          </Dropdown>
          
          {!isMobile && (
            <>
              {/* AI Assistant button - only show on deal detail pages */}
              {(location.pathname.match(/^\/deals\/[^/]+$/) || location.pathname.match(/^\/accounts\/[^/]+\/deals\/[^/]+$/)) && (
                <Button
                  type="text"
                  icon={
                    <Sparkles size={ICON_SIZE_LG} color={token.colorPrimary} />
                  }
                  onClick={() => {
                    // Add aiAssistant query param to current URL
                    const currentUrl = new URL(window.location.href);
                    currentUrl.searchParams.set('aiAssistant', 'true');
                    navigate(currentUrl.pathname + currentUrl.search);
                  }}
                  title="AI Assistant"
                />
              )}
              <Button
                type="text"
                icon={
                  <Bell size={ICON_SIZE_LG} color={token.colorTextSecondary} />
                }
              />
            </>
          )}
          
          <Button
            type="text"
            icon={
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: ICON_SIZE_LG, height: ICON_SIZE_LG }}>
                {isDarkMode ? (
                  <Sun 
                    size={ICON_SIZE_LG} 
                    strokeWidth={2.5} 
                    color={token.colorWarning} 
                    style={{ 
                      width: `${ICON_SIZE_LG}px`, 
                      height: `${ICON_SIZE_LG}px`,
                      minWidth: ICON_SIZE_LG,
                      minHeight: ICON_SIZE_LG
                    }} 
                  />
                ) : (
                  <Moon 
                    size={ICON_SIZE_LG} 
                    strokeWidth={2.5} 
                    color={token.colorText} 
                    style={{ 
                      width: `${ICON_SIZE_LG}px`, 
                      height: `${ICON_SIZE_LG}px`,
                      minWidth: ICON_SIZE_LG,
                      minHeight: ICON_SIZE_LG
                    }} 
                  />
                )}
              </span>
            }
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            size={isMobile ? "middle" : "large"}
            style={{
              background: isDarkMode
                ? token.colorWarningBg
                : token.colorFillSecondary,
              borderRadius: token.borderRadius,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: isMobile ? 32 : 40,
              minHeight: isMobile ? 32 : 40,
            }}
          />
          
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleMenuClick,
            }}
            placement="bottomRight"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: token.marginXS,
                cursor: "pointer",
                padding: isMobile ? `${token.paddingXXS}px` : `${token.paddingXXS}px ${token.paddingXS}px`,
                borderRadius: token.borderRadius,
                transition: `background ${token.motionDurationMid}`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = token.colorBgTextHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {currentRole !== "admin" && !isMobile ? (
                <Badge
                  count={
                    <div
                      style={{
                        background: token.colorWarningBg,
                        border: `1px solid ${token.colorWarningBorder}`,
                        color: token.colorWarningText,
                        padding: `0 ${token.paddingXS}px`,
                        borderRadius: token.borderRadiusSM,
                        fontSize: token.fontSizeSM,
                        fontWeight: token.fontWeightStrong,
                        display: "flex",
                        alignItems: "center",
                        gap: token.marginXXS,
                      }}
                    >
                      <Eye size={ICON_SIZE_SM} />
                      {currentRoleInfo?.name.split("(")[1]?.replace(")", "") ||
                        currentRoleInfo?.name}
                    </div>
                  }
                  offset={[-token.marginXS, 0]}
                >
                  <Avatar
                    style={{ background: token.colorPrimary }}
                    src={currentEmployee?.avatar}
                    size="small"
                  >
                    {!currentEmployee?.avatar && currentUser.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                </Badge>
              ) : (
                <Avatar
                  style={{ background: token.colorPrimary }}
                  src={currentEmployee?.avatar}
                  size="small"
                >
                  {!currentEmployee?.avatar && currentUser.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
              )}
              {!isMobile && (
                <ChevronDown
                  size={ICON_SIZE_DEFAULT}
                  color={token.colorTextSecondary}
                />
              )}
            </div>
          </Dropdown>
        </div>
      </Header>

      {/* Mobile Navigation Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: token.marginSM }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: token.colorPrimary,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: token.colorWhite,
                fontWeight: token.fontWeightStrong,
              }}
            >
              G
            </div>
            <span>Menu</span>
          </div>
        }
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        styles={{
          body: { padding: 0 },
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => {
            navigate(key);
            setMobileMenuOpen(false);
          }}
          items={[
            ...headerMenuItems.map(item => ({
              key: item.key,
              label: item.label,
            })),
            {
              type: "divider",
            },
            ...moreMenuItems.map(item => ({
              ...item,
              onClick: undefined, // Remove inline onClick to use menu onClick
            })),
          ]}
        />
      </Drawer>

      {/* Mobile/Tablet Search Modal */}
      <Modal
        title="Search"
        open={mobileSearchOpen}
        onCancel={() => setMobileSearchOpen(false)}
        footer={null}
        width={isMobile ? "90%" : 600}
        style={{ top: 20 }}
      >
        <Input
          autoFocus
          placeholder="Search deals, merchants, videos..."
          prefix={
            <Search
              size={ICON_SIZE_DEFAULT}
              color={token.colorTextPlaceholder}
            />
          }
          style={{
            borderRadius: token.borderRadiusLG,
          }}
          size="large"
          onPressEnter={(e) => {
            // Handle search
            console.log("Search:", e.currentTarget.value);
            setMobileSearchOpen(false);
          }}
        />
        <div style={{ marginTop: token.marginLG, color: token.colorTextSecondary }}>
          Start typing to search...
        </div>
      </Modal>
      <Content
        style={{
          padding:
            location.pathname === "/deals/ai-generator"
              ? 0
              : isMobile
              ? token.paddingSM
              : token.paddingLG,
          minHeight: token.controlHeightLG * 4,
          background: token.colorBgLayout,
          overflow:
            location.pathname === "/deals/ai-generator" ? "hidden" : "visible",
        }}
      >
        {children}
      </Content>

      {/* Create Deal Modal */}
      <CreateDealModal
        open={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </AntLayout>
  );
};

export default AppLayout;
