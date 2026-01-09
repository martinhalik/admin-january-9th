import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Avatar,
  Space,
  theme,
  Table,
  Tag,
  Tabs,
  Image,
  Tooltip,
} from "antd";
import { ExternalLink, Edit, ChevronDown, User } from "lucide-react";
import DynamicBreadcrumbs from "../components/Breadcrumbs";
import LocationManagement from "../components/LocationManagement/LocationManagement";
import { defaultAccountDetail } from "../data/accountDetails";
import { useRoleView } from "../contexts/RoleViewContext";
import { getEmployeeById } from "../data/companyHierarchy";

const { Title, Text } = Typography;
const { useToken } = theme;

const AccountDetail = () => {
  // Get account data from imported JSON
  const mockAccount = defaultAccountDetail.account;
  const mockAssignedDeals = defaultAccountDetail.assignedDeals;
  const mockAuditLog = defaultAccountDetail.auditLog;
  const mockSubAccounts = defaultAccountDetail.subAccounts;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useToken();
  const { currentUser } = useRoleView();
  const [locationSidebarContent, setLocationSidebarContent] =
    useState<React.ReactNode>(null);
  
  // Get current employee data for account owner
  const currentEmployee = getEmployeeById(currentUser.employeeId);
  const accountOwnerInitials = currentUser.name.split(' ').map(n => n[0]).join('');
  
  // Use URL parameter for active tab (with fallback to assigned-deals)
  const activeTab = searchParams.get('tab') || 'assigned-deals';
  const handleTabChange = (key: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', key);
    setSearchParams(newParams, { replace: true });
  };
  
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Toggle row expansion for audit log
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId]
    );
  };

  // Table columns for Assigned Deals
  const dealColumns = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 100,
      render: (image: string) => (
        <Image
          src={image}
          alt="Deal"
          width={80}
          height={60}
          style={{ objectFit: "cover", borderRadius: token.borderRadiusSM }}
        />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 400,
      render: (title: string) => (
        <Text style={{ fontSize: token.fontSize }}>{title}</Text>
      ),
    },
    {
      title: (
        <Tooltip title="30-day Orders">
          <span>30d Orders</span>
        </Tooltip>
      ),
      dataIndex: "orders30d",
      key: "orders30d",
      align: "center" as const,
      width: 100,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: (
        <Tooltip title="30-day Views">
          <span>30d Views</span>
        </Tooltip>
      ),
      dataIndex: "views30d",
      key: "views30d",
      align: "center" as const,
      width: 100,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "GP",
      dataIndex: "gp",
      key: "gp",
      align: "center" as const,
      width: 100,
    },
    {
      title: (
        <Tooltip title="30-day Gross Profit per View">
          <span>30d GP/Views</span>
        </Tooltip>
      ),
      dataIndex: "gpViews30d",
      key: "gpViews30d",
      align: "center" as const,
      width: 120,
    },
    {
      title: (
        <Tooltip title="30-day Conversion Rate">
          <span>30d CR</span>
        </Tooltip>
      ),
      dataIndex: "cr30d",
      key: "cr30d",
      align: "center" as const,
      width: 100,
    },
    {
      title: "Margin",
      dataIndex: "margin",
      key: "margin",
      align: "center" as const,
      width: 100,
    },
    {
      title: "Deal Start",
      dataIndex: "dealStart",
      key: "dealStart",
      align: "center" as const,
      width: 100,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center" as const,
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<ChevronDown size={14} />}
            style={{ marginRight: token.marginXS }}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement show dropdown
            }}
          >
            Show
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<Edit size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/accounts/${id}/deals/${record.id}`);
            }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  // Render tabs content
  const renderTabContent = () => {
    switch (activeTab) {
      case "assigned-deals":
        return (
          <Table
            columns={dealColumns}
            dataSource={mockAssignedDeals}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1400 }}
            onRow={(record) => ({
              onClick: () => navigate(`/accounts/${id}/deals/${record.id}`),
              style: { cursor: "pointer" },
              onMouseEnter: (e) => {
                e.currentTarget.style.backgroundColor = token.colorBgTextHover;
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.backgroundColor = "";
              },
            })}
          />
        );

      case "audit-log":
        return (
          <div style={{ padding: `${token.marginLG}px 0` }}>
            <Title level={4} style={{ marginBottom: token.marginLG }}>
              History
            </Title>
            {mockAuditLog.map((log) => {
              const isExpanded = expandedRows.includes(log.id);
              return (
                <Card
                  key={log.id}
                  style={{ marginBottom: token.margin }}
                  bodyStyle={{ padding: token.padding }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: token.marginSM,
                    }}
                  >
                    <Avatar
                      size={token.controlHeightLG}
                      style={{
                        backgroundColor: token.colorPrimary,
                        flexShrink: 0,
                      }}
                    >
                      ESA
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <div>
                        <Text strong>{log.user}</Text> <Text>{log.action}</Text>{" "}
                        <Text type="secondary">· {log.timestamp}</Text>
                      </div>
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: token.marginSM,
                            paddingTop: token.paddingSM,
                            borderTop: `1px solid ${token.colorBorder}`,
                          }}
                        >
                          {log.changes.map((change, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: `${token.paddingXS}px 0`,
                                borderBottom:
                                  idx < log.changes.length - 1
                                    ? `1px solid ${token.colorBorderSecondary}`
                                    : "none",
                              }}
                            >
                              <Text style={{ flex: 1 }}>{change.field}</Text>
                              <Text
                                type="secondary"
                                style={{
                                  flex: 1,
                                  textAlign: "right",
                                  fontFamily: "monospace",
                                  fontSize: token.fontSizeSM,
                                }}
                              >
                                {change.value}
                              </Text>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        type="link"
                        size="small"
                        onClick={() => toggleRowExpansion(log.id)}
                        style={{
                          padding: `${token.paddingXS}px 0`,
                          marginTop: token.marginXS,
                        }}
                      >
                        {isExpanded
                          ? `Hide (${log.changes.length})`
                          : `Show More (${log.changes.length})`}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        );

      case "sub-accounts":
        return (
          <div style={{ padding: `${token.marginLG}px 0` }}>
            <Title level={4} style={{ marginBottom: token.margin }}>
              Sub Accounts ({mockSubAccounts.length})
            </Title>
            {mockSubAccounts.map((subAccount) => (
              <Card
                key={subAccount.id}
                style={{
                  marginBottom: token.marginSM,
                  cursor: "pointer",
                  transition: `all ${token.motionDurationMid}`,
                }}
                bodyStyle={{ padding: token.padding }}
                hoverable
                onClick={() => navigate(`/accounts/${subAccount.id}`)}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: token.marginSM,
                  }}
                >
                  <Avatar
                    size={token.controlHeightLG}
                    icon={<User size={20} />}
                    style={{ backgroundColor: token.colorPrimary }}
                  />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: token.fontSize }}>
                      {subAccount.name}
                    </Text>
                    <br />
                    <Text
                      type="secondary"
                      style={{ fontSize: token.fontSizeSM }}
                    >
                      ID: {subAccount.id}
                    </Text>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case "locations":
        return (
          <div style={{ marginTop: token.margin }}>
            <LocationManagement
              accountId={id || ""}
              accountName={mockAccount.name}
              onSidebarContentChange={setLocationSidebarContent}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", gap: token.margin }}>
      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: token.margin }}>
          <DynamicBreadcrumbs />
        </div>

        {/* Account Header */}
        <Card style={{ marginBottom: token.margin }}>
          <div style={{ marginBottom: token.margin }}>
            <Title
              level={2}
              style={{ margin: 0, marginBottom: token.marginXS }}
            >
              {mockAccount.name}
            </Title>
            <Text type="secondary">
              Created: {mockAccount.created} ({mockAccount.lastModified} last
              modified by{" "}
              <Avatar
                size={token.fontSizeLG}
                style={{
                  backgroundColor: token.colorPrimary,
                  fontSize: token.fontSizeSM,
                  marginLeft: token.marginXXS,
                  marginRight: token.marginXXS,
                }}
              >
                {mockAccount.lastModifiedBy.charAt(0)}
              </Avatar>
              {mockAccount.lastModifiedBy})
            </Text>
          </div>

          {/* Account Info Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: `${token.marginSM}px ${token.marginLG}px`,
              marginBottom: token.margin,
            }}
          >
            <Text strong>Salesforce URL:</Text>
            <div>
              <Button
                type="link"
                size="small"
                icon={<ExternalLink size={14} />}
                href={`https://salesforce.com/${mockAccount.salesforceUrl}`}
                target="_blank"
                style={{ padding: 0, height: "auto" }}
              >
                {mockAccount.salesforceUrl}
              </Button>
            </div>

            <Text strong>Account owner:</Text>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: token.marginXS,
              }}
            >
              <Avatar
                size={token.controlHeight}
                src={currentEmployee?.avatar}
                style={{
                  backgroundColor: currentEmployee?.avatar ? 'transparent' : token.colorPrimary,
                }}
              >
                {!currentEmployee?.avatar && accountOwnerInitials}
              </Avatar>
              <Text>{currentUser.name}</Text>
            </div>

            <Text strong>Parent account:</Text>
            <div>
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: "auto" }}
              >
                {mockAccount.parentAccount}
              </Button>
            </div>

            <Text strong>Brand:</Text>
            <div>
              <Tag
                closable
                color="blue"
                style={{ marginRight: 0 }}
                onClose={(e) => {
                  e.preventDefault();
                  // Handle brand removal
                }}
              >
                {mockAccount.brand}
              </Tag>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card bodyStyle={{ padding: 0 }}>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            style={{ padding: `0 ${token.paddingLG}px` }}
            items={[
              {
                key: "assigned-deals",
                label: "Assigned Deals",
                children: (
                  <div style={{ padding: `0 0 ${token.paddingLG}px 0` }}>
                    {renderTabContent()}
                  </div>
                ),
              },
              {
                key: "audit-log",
                label: "Audit Log History",
                children: (
                  <div style={{ padding: `0 0 ${token.paddingLG}px 0` }}>
                    {renderTabContent()}
                  </div>
                ),
              },
              {
                key: "sub-accounts",
                label: "Sub Accounts",
                children: (
                  <div style={{ padding: `0 0 ${token.paddingLG}px 0` }}>
                    {renderTabContent()}
                  </div>
                ),
              },
              {
                key: "locations",
                label: "Locations",
                children: renderTabContent(),
              },
            ]}
          />
        </Card>
      </div>

      {/* Page-level Sticky Sidebar */}
      {locationSidebarContent}
    </div>
  );
};

export default AccountDetail;
