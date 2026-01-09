/**
 * User Simulator Component
 * 
 * Allows switching between different users in the hierarchy to test role-based filtering
 */

import React, { useState } from 'react';
import { Card, Select, Avatar, Space, Typography, Divider, theme, Tag } from 'antd';
import { User, Building2 } from 'lucide-react';
import { useRoleView, UserRole, SimulatedUser } from '../contexts/RoleViewContext';
import { getEmployeesByRole } from '../data/companyHierarchy';

const { Text } = Typography;
const { useToken } = theme;

export const UserSimulator: React.FC = () => {
  const { token } = useToken();
  const { currentUser, setCurrentUser } = useRoleView();
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');

  // Get all employees grouped by role
  const allEmployees = [
    ...getEmployeesByRole('bd'),
    ...getEmployeesByRole('md'),
    ...getEmployeesByRole('mm'),
    ...getEmployeesByRole('dsm'),
    ...getEmployeesByRole('executive'),
    ...getEmployeesByRole('content-ops-staff'),
    ...getEmployeesByRole('content-ops-manager'),
  ];

  // Filter employees by selected role
  const filteredEmployees = selectedRole === 'all' 
    ? allEmployees 
    : allEmployees.filter(emp => emp.role === selectedRole);

  const handleUserChange = (employeeId: string) => {
    const employee = allEmployees.find(emp => emp.id === employeeId);
    if (employee) {
      const newUser: SimulatedUser = {
        employeeId: employee.id,
        name: employee.name,
        role: employee.role,
      };
      setCurrentUser(newUser);
    }
  };

  const getRoleColor = (role: UserRole): string => {
    const roleColors: Record<UserRole, string> = {
      executive: '#722ed1',
      dsm: '#1890ff',
      mm: '#52c41a',
      bd: '#13c2c2',
      md: '#fa8c16',
      'content-ops-manager': '#eb2f96',
      'content-ops-staff': '#f759ab',
      admin: '#000000',
    };
    return roleColors[role] || token.colorPrimary;
  };

  const getRoleLabel = (role: UserRole): string => {
    const roleLabels: Record<UserRole, string> = {
      executive: 'EXEC',
      dsm: 'DSM',
      mm: 'MM',
      bd: 'BD',
      md: 'MD',
      'content-ops-manager': 'CONTENT MGR',
      'content-ops-staff': 'CONTENT',
      admin: 'ADMIN',
    };
    return roleLabels[role] || role.toUpperCase();
  };

  return (
    <Card 
      title={
        <Space>
          <User size={18} />
          <span>Simulate User</span>
        </Space>
      }
      style={{ marginBottom: token.marginLG }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Current User Display */}
        <div>
          <Text type="secondary" strong style={{ display: 'block', marginBottom: token.marginXS }}>
            Current User
          </Text>
          <Space>
            <Avatar style={{ background: getRoleColor(currentUser.role) }}>
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <div>
              <Text strong>{currentUser.name}</Text>
              <br />
              <Tag color={getRoleColor(currentUser.role)} style={{ marginTop: 4 }}>
                {getRoleLabel(currentUser.role)}
              </Tag>
            </div>
          </Space>
        </div>

        <Divider style={{ margin: `${token.marginXS}px 0` }} />

        {/* Role Filter */}
        <div>
          <Text type="secondary" strong style={{ display: 'block', marginBottom: token.marginXS }}>
            Filter by Role
          </Text>
          <Select
            value={selectedRole}
            onChange={setSelectedRole}
            style={{ width: '100%' }}
            size="large"
          >
            <Select.Option value="all">All Roles</Select.Option>
            <Select.Option value="executive">Executive</Select.Option>
            <Select.Option value="dsm">DSM</Select.Option>
            <Select.Option value="mm">Market Manager</Select.Option>
            <Select.Option value="bd">BD Rep</Select.Option>
            <Select.Option value="md">MD Rep</Select.Option>
            <Select.Option value="content-ops-manager">Content Ops Manager</Select.Option>
            <Select.Option value="content-ops-staff">Content Ops Staff</Select.Option>
          </Select>
        </div>

        {/* User Selection */}
        <div>
          <Text type="secondary" strong style={{ display: 'block', marginBottom: token.marginXS }}>
            Switch to User
          </Text>
          <Select
            value={currentUser.employeeId}
            onChange={handleUserChange}
            style={{ width: '100%' }}
            size="large"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={filteredEmployees.map(emp => ({
              value: emp.id,
              label: `${emp.name} (${getRoleLabel(emp.role)})`,
              searchLabel: `${emp.name} ${emp.email} ${emp.roleTitle}`,
            }))}
            optionRender={(option) => {
              const employee = allEmployees.find(emp => emp.id === option.value);
              if (!employee) return null;
              
              return (
                <Space>
                  <Avatar 
                    src={employee.avatar} 
                    size="small"
                    style={{ border: `2px solid ${getRoleColor(employee.role)}` }}
                  >
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <div>
                      <Text strong>{employee.name}</Text>
                      <Tag 
                        color={getRoleColor(employee.role)} 
                        style={{ marginLeft: 8, fontSize: 10 }}
                      >
                        {getRoleLabel(employee.role)}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {employee.roleTitle}
                    </Text>
                  </div>
                </Space>
              );
            }}
          />
        </div>

        {/* Info */}
        <div style={{ 
          background: token.colorInfoBg, 
          padding: token.paddingSM, 
          borderRadius: token.borderRadiusSM,
          border: `1px solid ${token.colorInfoBorder}`,
        }}>
          <Space size="small">
            <Building2 size={14} style={{ color: token.colorInfo }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Switch users to see how account filtering changes based on role and team hierarchy
            </Text>
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default UserSimulator;




