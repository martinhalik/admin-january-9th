import React, { useState, useMemo, useEffect } from 'react';
import { Card, Typography, Input, Tree, Avatar, Tag, Space, Empty, theme, Badge, Spin, Alert } from 'antd';
import { Search, Users, Building2, MapPin, Mail, Phone, Calendar } from 'lucide-react';
import type { DataNode } from 'antd/es/tree';
import { HierarchyNode, getAllEmployees, getCompanyHierarchy, loadEmployees, updateHierarchyData } from '../data/companyHierarchy';
import DynamicBreadcrumbs from '../components/Breadcrumbs';
import { SimplePageHeader } from '../components/PageHeaders';

const { Text, Paragraph, Title } = Typography;
const { useToken } = theme;

interface EmployeeNodeData {
  employee: HierarchyNode;
}

const OrganizationHierarchy: React.FC = () => {
  const { token } = useToken();
  const [searchText, setSearchText] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<HierarchyNode | null>(null);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [loading, setLoading] = useState(false);

  // Get dynamic hierarchy from Supabase
  const allEmployees = getAllEmployees();
  
  // Load employees if not already loaded
  useEffect(() => {
    async function ensureEmployeesLoaded() {
      if (allEmployees.length === 0) {
        setLoading(true);
        try {
          const employees = await loadEmployees();
          updateHierarchyData(employees);
          console.log(`[OrganizationHierarchy] Loaded ${employees.length} employees`);
        } catch (error) {
          console.error('[OrganizationHierarchy] Error loading employees:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    ensureEmployeesLoaded();
  }, []);

  const companyHierarchy = useMemo(() => getCompanyHierarchy(), [allEmployees]);

  // Check if data is loaded
  if (loading || allEmployees.length === 0) {
    return (
      <div style={{ padding: token.paddingLG, maxWidth: 1600, margin: '0 auto' }}>
        <div style={{ marginBottom: token.marginSM }}>
          <DynamicBreadcrumbs />
        </div>
        <SimplePageHeader
          title="Organization Hierarchy"
          subtitle="Loading organizational structure from Supabase..."
          level={2}
        />
        <Card>
          <div style={{ textAlign: 'center', padding: token.paddingXL }}>
            <Spin size="large" />
            <div style={{ marginTop: token.marginLG }}>
              <Text type="secondary">Loading employee data...</Text>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Convert hierarchy to Tree data format
  const convertToTreeData = (nodes: HierarchyNode[], searchValue: string): DataNode[] => {
    return nodes.map(node => {
      const isMatch = searchValue
        ? node.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          node.email.toLowerCase().includes(searchValue.toLowerCase()) ||
          node.roleTitle.toLowerCase().includes(searchValue.toLowerCase())
        : false;

      const treeNode: DataNode = {
        title: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: token.marginSM,
              padding: '8px 12px',
              borderRadius: token.borderRadiusSM,
              background: isMatch ? token.colorPrimaryBg : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <Avatar
              src={node.avatar}
              size={32}
              style={{
                flexShrink: 0,
                border: `2px solid ${getRoleColor(node.role)}`,
              }}
            >
              {node.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
                <Text strong style={{ fontSize: token.fontSizeLG }}>
                  {node.name}
                </Text>
                <Tag
                  color={getRoleColor(node.role)}
                  style={{ margin: 0, fontSize: 11 }}
                >
                  {getRoleLabel(node.role)}
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                {node.roleTitle}
              </Text>
              {node.directReports && node.directReports.length > 0 && (
                <div style={{ marginTop: 2 }}>
                  <Badge
                    count={node.directReports.length}
                    style={{
                      backgroundColor: token.colorBgLayout,
                      color: token.colorTextSecondary,
                      fontSize: 11,
                      height: 18,
                      lineHeight: '18px',
                    }}
                    overflowCount={99}
                  />
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, marginLeft: token.marginXS }}
                  >
                    Direct Report{node.directReports.length > 1 ? 's' : ''}
                  </Text>
                </div>
              )}
            </div>
          </div>
        ),
        key: node.id,
        children: node.children ? convertToTreeData(node.children, searchValue) : undefined,
      };

      return treeNode;
    });
  };

  const getRoleColor = (role: string): string => {
    const roleColors: Record<string, string> = {
      executive: '#722ed1',
      dsm: '#1890ff',
      mm: '#52c41a',
      bd: '#13c2c2',
      md: '#fa8c16',
      'content-ops-manager': '#eb2f96',
      'content-ops-staff': '#f759ab',
    };
    return roleColors[role] || token.colorPrimary;
  };

  const getRoleLabel = (role: string): string => {
    const roleLabels: Record<string, string> = {
      executive: 'EXEC',
      dsm: 'DSM',
      mm: 'MM',
      bd: 'BD',
      md: 'MD',
      'content-ops-manager': 'CONTENT MGR',
      'content-ops-staff': 'CONTENT',
    };
    return roleLabels[role] || role.toUpperCase();
  };

  // Search and filter
  const getExpandedKeysForSearch = (searchValue: string): string[] => {
    if (!searchValue) return [];

    const keys: string[] = [];

    allEmployees.forEach(emp => {
      const isMatch =
        emp.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchValue.toLowerCase()) ||
        emp.roleTitle.toLowerCase().includes(searchValue.toLowerCase());

      if (isMatch) {
        // Add this employee's key and all parent keys
        keys.push(emp.id);
        let currentManagerId = emp.managerId;
        while (currentManagerId) {
          keys.push(currentManagerId);
          const manager = allEmployees.find(e => e.id === currentManagerId);
          currentManagerId = manager?.managerId;
        }
      }
    });

    return Array.from(new Set(keys));
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value) {
      const keys = getExpandedKeysForSearch(value);
      setExpandedKeys(keys);
      setAutoExpandParent(true);
    } else {
      setExpandedKeys([]);
      setAutoExpandParent(false);
    }
  };

  const handleExpand = (keys: React.Key[]) => {
    setExpandedKeys(keys);
    setAutoExpandParent(false);
  };

  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0] as string;
      const employee = allEmployees.find(e => e.id === key);
      if (employee) {
        // Find the full hierarchy node
        const findNode = (nodes: HierarchyNode[]): HierarchyNode | null => {
          for (const node of nodes) {
            if (node.id === key) return node;
            if (node.children) {
              const found = findNode(node.children);
              if (found) return found;
            }
          }
          return null;
        };
        const node = findNode(companyHierarchy);
        setSelectedEmployee(node);
      }
    }
  };

  const treeData = convertToTreeData(companyHierarchy, searchText);

  return (
    <div style={{ padding: token.paddingLG, maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ marginBottom: token.marginSM }}>
        <DynamicBreadcrumbs />
      </div>

      <SimplePageHeader
        title="Organization Hierarchy"
        subtitle={`View the company organizational structure with ${allEmployees.length} employees. This data is managed in Workday and synced from Google Workspace.`}
        level={2}
      />

      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: token.marginMD,
        marginBottom: token.marginLG 
      }}>
        {[
          { label: 'Total Employees', value: allEmployees.length, color: token.colorPrimary },
          { label: 'Business Development', value: allEmployees.filter(e => e.role === 'bd').length, color: '#13c2c2' },
          { label: 'Merchant Development', value: allEmployees.filter(e => e.role === 'md').length, color: '#fa8c16' },
          { label: 'Market Managers', value: allEmployees.filter(e => e.role === 'mm').length, color: '#52c41a' },
          { label: 'DSM', value: allEmployees.filter(e => e.role === 'dsm').length, color: '#1890ff' },
          { label: 'Executives', value: allEmployees.filter(e => e.role === 'executive').length, color: '#722ed1' },
        ].map((stat, idx) => (
          <Card key={idx} size="small" style={{ textAlign: 'center', minHeight: 80 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: stat.color, marginBottom: 4 }}>{stat.value}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{stat.label}</Text>
          </Card>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedEmployee ? '1fr 400px' : '1fr',
          gap: token.marginLG,
          alignItems: 'start',
        }}
      >
        {/* Tree View */}
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ marginBottom: token.marginLG }}>
            <Input
              placeholder="Search by name, email, or role..."
              prefix={<Search size={16} />}
              value={searchText}
              onChange={e => handleSearch(e.target.value)}
              size="large"
              allowClear
            />
          </div>

          {treeData.length > 0 ? (
            <div style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
              <Tree
                treeData={treeData}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                onExpand={handleExpand}
                onSelect={handleSelect}
                showLine={{ showLeafIcon: false }}
                defaultExpandAll={false}
                style={{
                  background: 'transparent',
                  fontSize: token.fontSize,
                }}
              />
            </div>
          ) : (
            <Empty description="No employees found" />
          )}
        </Card>

        {/* Employee Detail Panel */}
        {selectedEmployee && (
          <Card
            title={
              <Space>
                <Users size={18} />
                <span>Employee Details</span>
              </Space>
            }
            style={{ height: 'fit-content', position: 'sticky', top: token.marginLG }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Profile */}
              <div style={{ textAlign: 'center' }}>
                <Avatar
                  src={selectedEmployee.avatar}
                  size={80}
                  style={{
                    marginBottom: token.marginSM,
                    border: `3px solid ${getRoleColor(selectedEmployee.role)}`,
                  }}
                >
                  {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Title level={4} style={{ marginBottom: token.marginXS }}>
                  {selectedEmployee.name}
                </Title>
                <Tag color={getRoleColor(selectedEmployee.role)} style={{ marginBottom: token.marginXS }}>
                  {getRoleLabel(selectedEmployee.role)}
                </Tag>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {selectedEmployee.roleTitle}
                </Paragraph>
              </div>

              {/* Contact Information */}
              <div>
                <Text type="secondary" strong style={{ display: 'block', marginBottom: token.marginXS }}>
                  Contact Information
                </Text>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space>
                    <Mail size={14} />
                    <Text copyable style={{ fontSize: token.fontSizeSM }}>
                      {selectedEmployee.email}
                    </Text>
                  </Space>
                  {selectedEmployee.phone && (
                    <Space>
                      <Phone size={14} />
                      <Text style={{ fontSize: token.fontSizeSM }}>{selectedEmployee.phone}</Text>
                    </Space>
                  )}
                  {selectedEmployee.location && (
                    <Space>
                      <MapPin size={14} />
                      <Text style={{ fontSize: token.fontSizeSM }}>{selectedEmployee.location}</Text>
                    </Space>
                  )}
                </Space>
              </div>

              {/* Organization Information */}
              <div>
                <Text type="secondary" strong style={{ display: 'block', marginBottom: token.marginXS }}>
                  Organization
                </Text>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {selectedEmployee.department && (
                    <Space>
                      <Building2 size={14} />
                      <Text style={{ fontSize: token.fontSizeSM }}>
                        {selectedEmployee.department}
                        {selectedEmployee.division && ` - ${selectedEmployee.division}`}
                      </Text>
                    </Space>
                  )}
                  {selectedEmployee.hireDate && (
                    <Space>
                      <Calendar size={14} />
                      <Text style={{ fontSize: token.fontSizeSM }}>
                        Joined {new Date(selectedEmployee.hireDate).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </Space>
                  )}
                </Space>
              </div>

              {/* Reports */}
              {selectedEmployee.directReports && selectedEmployee.directReports.length > 0 && (
                <div>
                  <Text type="secondary" strong style={{ display: 'block', marginBottom: token.marginXS }}>
                    Direct Reports ({selectedEmployee.directReports.length})
                  </Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: token.marginXS }}>
                    {selectedEmployee.children?.map(child => (
                      <Tag
                        key={child.id}
                        style={{
                          padding: token.paddingXXS,
                          display: 'flex',
                          alignItems: 'center',
                          gap: token.marginXXS,
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedEmployee(child)}
                      >
                        <Avatar size={20} src={child.avatar}>
                          {child.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        {child.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {/* Manager */}
              {selectedEmployee.managerId && (
                <div>
                  <Text type="secondary" strong style={{ display: 'block', marginBottom: token.marginXS }}>
                    Reports To
                  </Text>
                  {(() => {
                    const manager = allEmployees.find(e => e.id === selectedEmployee.managerId);
                    if (!manager) return null;
                    
                    const findManagerNode = (nodes: HierarchyNode[]): HierarchyNode | null => {
                      for (const node of nodes) {
                        if (node.id === manager.id) return node;
                        if (node.children) {
                          const found = findManagerNode(node.children);
                          if (found) return found;
                        }
                      }
                      return null;
                    };
                    const managerNode = findManagerNode(companyHierarchy);
                    
                    return (
                      <Tag
                        style={{
                          padding: token.paddingXXS,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: token.marginXXS,
                          cursor: 'pointer',
                        }}
                        onClick={() => managerNode && setSelectedEmployee(managerNode)}
                      >
                        <Avatar size={20} src={manager.avatar}>
                          {manager.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        {manager.name} - {manager.roleTitle}
                      </Tag>
                    );
                  })()}
                </div>
              )}
            </Space>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrganizationHierarchy;

