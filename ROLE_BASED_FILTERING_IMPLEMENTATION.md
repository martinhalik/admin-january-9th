# Role-Based Account Filtering & Company Hierarchy

## Overview

This implementation adds role-based account filtering and a company hierarchy management system to the application. The system ensures that users only see merchant accounts they're authorized to view based on their role and position in the organizational hierarchy.

## Features Implemented

### 1. Company Hierarchy Data Structure (`frontend/src/data/companyHierarchy.ts`)

- **Hierarchical Organization Model**: Defines the complete company organizational structure from CEO down to individual contributors
- **Employee Data**: Stores employee information including:
  - Name, email, phone, avatar
  - Role (executive, DSM, MM, BD, MD, content-ops-manager, content-ops-staff)
  - Manager relationships
  - Direct reports
  - Division and department
  - Location and hire date

- **Utility Functions**:
  - `getAllEmployees()`: Get flat list of all employees
  - `getEmployeeById(id)`: Find specific employee
  - `getDirectReports(employeeId)`: Get direct reports
  - `getAllTeamMembers(employeeId)`: Get entire team hierarchy
  - `getManager(employeeId)`: Get employee's manager
  - `getManagementChain(employeeId)`: Get all managers up to CEO
  - `getEmployeesByRole(role)`: Filter employees by role

### 2. Role-Based Filtering Logic (`frontend/src/lib/accountFiltering.ts`)

Implements filtering rules based on user role:

- **BD/MD (Business Development/Merchant Development)**: 
  - Can only see accounts where they are the account owner
  - Most restrictive view

- **MM (Market Manager)**:
  - Can see accounts owned by themselves or their direct reports
  - Team-level visibility

- **DSM (Divisional Sales Manager)**:
  - Can see accounts owned by anyone in their team hierarchy
  - Division-wide visibility

- **Admin/Executives**:
  - Can see all accounts
  - Unrestricted access

- **Content Operations**:
  - Can see all accounts (need to work on content for any deal)

### 3. Account Owner Assignments (`frontend/src/data/accountOwnerAssignments.ts`)

- Links merchant accounts to employees from the hierarchy
- Simulates CRM/Salesforce data
- Provides account statistics per owner
- Round-robin assignment of accounts to BD/MD reps

### 4. Organization Hierarchy Page (`frontend/src/pages/OrganizationHierarchy.tsx`)

Read-only view of the company organizational structure:

- **Tree Visualization**: Expandable/collapsible tree view of the entire hierarchy
- **Search**: Find employees by name, email, or role
- **Employee Details Panel**: 
  - Shows selected employee's information
  - Contact details
  - Organization info
  - Direct reports
  - Manager
- **Color-coded Roles**: Visual distinction between different role types
- **Note**: Data is marked as "managed in Workday and pulled from Google Workspace" (read-only)

### 5. Updated Accounts Page (`frontend/src/pages/Accounts.tsx`)

- **Automatic Role-Based Filtering**: Accounts are filtered based on current user's role and hierarchy position
- **Filter Info Banner**: Shows active filter description for non-admin users
- **Account Owner Filter**: 
  - DSMs can filter by team members
  - MMs can filter by direct reports
  - BD/MD see only their accounts
- **Seamless Integration**: Works with existing filters (status, potential, business type, etc.)

### 6. Updated Account Selector (`frontend/src/components/AccountSelector.tsx`)

- Same role-based filtering as Accounts page
- Info banner showing active filters
- Used in deal creation and AI generation flows

### 7. Enhanced Role Context (`frontend/src/contexts/RoleViewContext.tsx`)

- **Extended Roles**: Added MD (Merchant Development) and Executive roles
- **User Simulation**: `SimulatedUser` interface with employee ID mapping
- **Persistent State**: User selection persists across sessions
- **Role Switching**: Automatically updates when user changes

### 8. User Simulator Component (`frontend/src/components/UserSimulator.tsx`)

Testing tool for the role-based filtering:
- Switch between different users in the hierarchy
- Filter users by role
- Visual feedback with avatars and role tags
- Helps demonstrate how filtering changes per role

## File Structure

```
frontend/src/
├── data/
│   ├── companyHierarchy.ts          # Organizational structure
│   └── accountOwnerAssignments.ts   # Account-employee links
├── lib/
│   └── accountFiltering.ts          # Filtering logic
├── pages/
│   ├── OrganizationHierarchy.tsx    # Hierarchy viewer
│   └── Accounts.tsx                 # Updated with filtering
├── components/
│   ├── AccountSelector.tsx          # Updated with filtering
│   └── UserSimulator.tsx            # Testing component
├── contexts/
│   └── RoleViewContext.tsx          # Enhanced with user simulation
└── App.tsx                          # Added hierarchy route
```

## How It Works

### Filtering Flow

1. **User Authentication**: User logs in (simulated via UserSimulator)
2. **Role Identification**: System identifies user's role and employee ID
3. **Team Discovery**: System determines who reports to this user (if applicable)
4. **Account Filtering**: 
   - Get all merchant accounts
   - Apply role-based rules
   - Filter to only accounts where user or team members are owners
5. **Display**: Show filtered accounts in UI

### Example Scenarios

**Scenario 1: BD Rep (David Martinez)**
- Can only see accounts where he is the account owner
- Cannot see accounts owned by colleagues
- Result: ~6-8 accounts

**Scenario 2: Market Manager (Sarah Johnson)**
- Can see her own accounts
- Can see accounts owned by David Martinez (reports to her)
- Can see accounts owned by Emily Chen (reports to her)
- Can see accounts owned by Lisa Rodriguez (reports to her)
- Result: ~20-25 accounts

**Scenario 3: DSM (Michael Thompson)**
- Can see all accounts in Central division
- Includes accounts from Chicago market (Sarah's team)
- Includes accounts from Milwaukee market (James's team)
- Result: ~40-50 accounts

**Scenario 4: Executive/Admin**
- Sees all accounts across all divisions
- No filtering applied
- Result: All 500+ accounts

## Integration with Existing Features

### Compatible With:
- ✅ Existing search functionality
- ✅ Status filters (active, inactive, pending)
- ✅ Potential filters (high, mid, low)
- ✅ Business type filters
- ✅ Location filters
- ✅ Deal count filters
- ✅ Account detail views
- ✅ AI deal generation
- ✅ Deal assignment flows

### Navigation:
- Access hierarchy via: **Admin → Organization Hierarchy**
- Or directly: `/admin/organization`

## Testing the Feature

1. **Open Accounts Page**: Navigate to `/accounts`
2. **Switch Users**: Use the role switcher in header or add UserSimulator component
3. **Observe Filtering**: 
   - As BD: See only your accounts
   - As MM: See your team's accounts
   - As DSM: See your division's accounts
   - As Admin: See all accounts
4. **Check Hierarchy**: Visit `/admin/organization` to view org structure
5. **Test Filters**: Use the additional "Account Owner" filter for managers

## Future Enhancements

### Potential Additions:
- Real-time sync with Google Workspace API
- Workday integration for HR data
- Account reassignment workflows
- Team performance dashboards
- Hierarchical reporting
- Permission management UI
- Audit logs for account access

### Production Considerations:
1. **API Integration**: Replace mock data with real API calls
2. **Caching**: Implement caching for hierarchy data
3. **Performance**: Optimize for large teams (100+ employees)
4. **Security**: Add server-side filtering validation
5. **Permissions**: Fine-grained permission system
6. **Error Handling**: Robust error handling for missing data
7. **Loading States**: Better loading indicators for large datasets

## Technical Notes

### TypeScript Types:
- `Employee`: Base employee data
- `HierarchyNode`: Employee with children for tree display
- `SimulatedUser`: Current user context
- `AccountFilterConfig`: Filtering configuration
- `UserRole`: Union type of all possible roles

### Dependencies:
- Ant Design Tree component
- React Router for navigation
- Existing context providers
- No external APIs required (mock data)

## Summary

This implementation provides a complete role-based access control system for merchant accounts, ensuring that sales representatives, managers, and executives see only the accounts they're authorized to access. The hierarchical organization view provides transparency into the company structure, and the filtering logic automatically adapts based on the logged-in user's position in the hierarchy.

The system is designed to be flexible and extensible, with clear separation of concerns between data (hierarchy), logic (filtering), and presentation (UI components).




