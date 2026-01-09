/**
 * Company Hierarchy Data Structure
 * 
 * This represents the organizational hierarchy pulled from Google Workspace
 * and managed in Workday. Data is stored in and fetched from Supabase.
 * 
 * Hierarchy levels:
 * - Executive (CEO, VPs)
 * - Directors/DSM (Divisional Sales Managers)
 * - Market Managers (MM)
 * - Individual Contributors (BD - Business Development, MD - Merchant Development)
 */

import type { UserRole } from '../contexts/RoleViewContext';
import { fetchEmployees, fetchDirectReports, fetchEmployeeById, type Employee as SupabaseEmployee } from '../lib/supabaseData';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatar?: string;
  phone?: string;
  division?: string;
  department?: string;
  managerId?: string | null; // Reference to manager's employee ID
  directReports?: string[]; // Array of employee IDs reporting to this person
  location?: string;
  hireDate?: string;
  status: 'active' | 'inactive';
}

export interface HierarchyNode extends Employee {
  children?: HierarchyNode[];
  level: number; // 0 = CEO, 1 = VP/Director, 2 = Manager, 3 = IC
}

// Cache for employee data
let employeesCache: Employee[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Convert Supabase employee to our Employee interface
 */
function convertSupabaseEmployee(emp: SupabaseEmployee): Employee {
  return {
    id: emp.id,
    name: emp.name,
    email: emp.email,
    role: emp.role as UserRole,
    roleTitle: emp.role_title,
    avatar: emp.avatar,
    phone: emp.phone,
    division: emp.division,
    department: emp.department,
    managerId: emp.manager_id,
    location: emp.location,
    hireDate: emp.hire_date,
    status: emp.status,
  };
}

/**
 * Fetch and cache all employees from Supabase
 */
export async function loadEmployees(): Promise<Employee[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (employeesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return employeesCache;
  }

  try {
    const supabaseEmployees = await fetchEmployees();
    employeesCache = supabaseEmployees.map(convertSupabaseEmployee);
    
    // Build directReports arrays
    const directReportsMap = new Map<string, string[]>();
    employeesCache.forEach(emp => {
      if (emp.managerId) {
        const reports = directReportsMap.get(emp.managerId) || [];
        reports.push(emp.id);
        directReportsMap.set(emp.managerId, reports);
      }
    });
    
    // Add directReports to each employee
    employeesCache = employeesCache.map(emp => ({
      ...emp,
      directReports: directReportsMap.get(emp.id) || [],
    }));
    
    cacheTimestamp = now;
    return employeesCache;
  } catch (error) {
    console.error('Error loading employees from Supabase:', error);
    // Return cached data even if expired, or empty array
    return employeesCache || [];
  }
}

/**
 * Get all employees (uses cache)
 */
export function getAllEmployees(): Employee[] {
  if (!employeesCache) {
    console.warn('Employees not loaded yet. Call loadEmployees() first.');
    return [];
  }
  return employeesCache;
}

/**
 * Get employee by ID
 */
export function getEmployeeById(id: string): Employee | undefined {
  const employees = getAllEmployees();
  return employees.find(emp => emp.id === id);
}

/**
 * Get employees by role
 */
export function getEmployeesByRole(role: UserRole): Employee[] {
  const employees = getAllEmployees();
  return employees.filter(emp => emp.role === role && emp.status === 'active');
}

/**
 * Get direct reports for a manager
 */
export function getDirectReports(managerId: string): Employee[] {
  const employees = getAllEmployees();
  return employees.filter(emp => emp.managerId === managerId && emp.status === 'active');
}

/**
 * Get all team members (employee + all their direct and indirect reports)
 */
export function getAllTeamMembers(employeeId: string): Employee[] {
  const employees = getAllEmployees();
  const team: Employee[] = [];
  const visited = new Set<string>();

  function addTeamMembers(empId: string) {
    if (visited.has(empId)) return;
    visited.add(empId);

    const emp = employees.find(e => e.id === empId);
    if (emp) {
      team.push(emp);
      const reports = employees.filter(e => e.managerId === empId);
      reports.forEach(report => addTeamMembers(report.id));
    }
  }

  addTeamMembers(employeeId);
  return team;
}

/**
 * Build hierarchy tree from flat employee list
 */
export function buildHierarchyTree(employees: Employee[]): HierarchyNode[] {
  if (employees.length === 0) {
    return []; // Return empty if no data
  }

  const employeeMap = new Map<string, HierarchyNode>();
  
  // Create nodes
  employees.forEach(emp => {
    employeeMap.set(emp.id, { ...emp, children: [], level: 0 });
  });
  
  // Build tree structure
  const roots: HierarchyNode[] = [];
  
  employeeMap.forEach(node => {
    if (node.managerId && employeeMap.has(node.managerId)) {
      const parent = employeeMap.get(node.managerId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
      node.level = parent.level + 1;
    } else {
      roots.push(node);
    }
  });
  
  // Sort children alphabetically by name
  const sortChildren = (nodes: HierarchyNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };
  
  sortChildren(roots);
  
  return roots;
}

/**
 * Get company hierarchy tree (uses cached employees)
 */
export function getCompanyHierarchy(): HierarchyNode[] {
  const employees = getAllEmployees();
  return buildHierarchyTree(employees);
}

/**
 * Legacy export for backward compatibility
 * This will be populated after calling loadEmployees()
 */
export const companyHierarchyData: Employee[] = [];

/**
 * Update the companyHierarchyData array (called after loading)
 */
export function updateHierarchyData(employees: Employee[]) {
  companyHierarchyData.length = 0;
  companyHierarchyData.push(...employees);
}

/**
 * Mock company hierarchy data (fallback for when Supabase data isn't loaded)
 * In production, this would be synced from Google Workspace/Workday
 */
const mockCompanyHierarchy: HierarchyNode[] = [
  {
    id: 'emp-ceo-1',
    name: 'Robert Mitchell',
    email: 'robert.mitchell@groupon.com',
    role: 'executive',
    roleTitle: 'CEO',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    phone: '(555) 100-0001',
    department: 'Executive',
    managerId: null,
    directReports: ['emp-vp-1', 'emp-vp-2'],
    location: 'Chicago, IL',
    hireDate: '2018-01-15',
    status: 'active',
    level: 0,
    children: [
      // VP of Sales
      {
        id: 'emp-vp-1',
        name: 'Jennifer Adams',
        email: 'jennifer.adams@groupon.com',
        role: 'executive',
        roleTitle: 'VP of Sales',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
        phone: '(555) 100-0002',
        department: 'Sales',
        managerId: 'emp-ceo-1',
        directReports: ['emp-dsm-1', 'emp-dsm-2', 'emp-dsm-3'],
        location: 'Chicago, IL',
        hireDate: '2019-03-10',
        status: 'active',
        level: 1,
        children: [
          // DSM - Central Region
          {
            id: 'emp-dsm-1',
            name: 'Michael Thompson',
            email: 'michael.thompson@groupon.com',
            role: 'dsm',
            roleTitle: 'Divisional Sales Manager - Central',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            phone: '(555) 201-0001',
            department: 'Sales',
            division: 'Central',
            managerId: 'emp-vp-1',
            directReports: ['emp-mm-1', 'emp-mm-2'],
            location: 'Chicago, IL',
            hireDate: '2020-05-15',
            status: 'active',
            level: 2,
            children: [
              // Market Manager - Chicago
              {
                id: 'emp-mm-1',
                name: 'Sarah Johnson',
                email: 'sarah.johnson@groupon.com',
                role: 'mm',
                roleTitle: 'Market Manager - Chicago',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                phone: '(555) 301-0001',
                department: 'Sales',
                division: 'Central',
                managerId: 'emp-dsm-1',
                directReports: ['emp-bd-1', 'emp-bd-2', 'emp-md-1'],
                location: 'Chicago, IL',
                hireDate: '2021-02-20',
                status: 'active',
                level: 3,
                children: [
                  {
                    id: 'emp-bd-1',
                    name: 'David Martinez',
                    email: 'david.martinez@groupon.com',
                    role: 'bd',
                    roleTitle: 'Business Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0001',
                    department: 'Sales',
                    division: 'Central',
                    managerId: 'emp-mm-1',
                    directReports: [],
                    location: 'Chicago, IL',
                    hireDate: '2022-06-01',
                    status: 'active',
                    level: 4,
                  },
                  {
                    id: 'emp-bd-2',
                    name: 'Emily Chen',
                    email: 'emily.chen@groupon.com',
                    role: 'bd',
                    roleTitle: 'Business Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0002',
                    department: 'Sales',
                    division: 'Central',
                    managerId: 'emp-mm-1',
                    directReports: [],
                    location: 'Chicago, IL',
                    hireDate: '2022-08-15',
                    status: 'active',
                    level: 4,
                  },
                  {
                    id: 'emp-md-1',
                    name: 'Lisa Rodriguez',
                    email: 'lisa.rodriguez@groupon.com',
                    role: 'md',
                    roleTitle: 'Merchant Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0003',
                    department: 'Sales',
                    division: 'Central',
                    managerId: 'emp-mm-1',
                    directReports: [],
                    location: 'Chicago, IL',
                    hireDate: '2021-11-10',
                    status: 'active',
                    level: 4,
                  },
                ],
              },
              // Market Manager - Milwaukee
              {
                id: 'emp-mm-2',
                name: 'James Wilson',
                email: 'james.wilson@groupon.com',
                role: 'mm',
                roleTitle: 'Market Manager - Milwaukee',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
                phone: '(555) 301-0002',
                department: 'Sales',
                division: 'Central',
                managerId: 'emp-dsm-1',
                directReports: ['emp-bd-3', 'emp-md-2'],
                location: 'Milwaukee, WI',
                hireDate: '2021-04-12',
                status: 'active',
                level: 3,
                children: [
                  {
                    id: 'emp-bd-3',
                    name: 'Amanda Foster',
                    email: 'amanda.foster@groupon.com',
                    role: 'bd',
                    roleTitle: 'Business Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0004',
                    department: 'Sales',
                    division: 'Central',
                    managerId: 'emp-mm-2',
                    directReports: [],
                    location: 'Milwaukee, WI',
                    hireDate: '2022-09-01',
                    status: 'active',
                    level: 4,
                  },
                  {
                    id: 'emp-md-2',
                    name: 'Carlos Rivera',
                    email: 'carlos.rivera@groupon.com',
                    role: 'md',
                    roleTitle: 'Merchant Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0005',
                    department: 'Sales',
                    division: 'Central',
                    managerId: 'emp-mm-2',
                    directReports: [],
                    location: 'Milwaukee, WI',
                    hireDate: '2022-03-15',
                    status: 'active',
                    level: 4,
                  },
                ],
              },
            ],
          },
          // DSM - East Region
          {
            id: 'emp-dsm-2',
            name: 'Patricia Lee',
            email: 'patricia.lee@groupon.com',
            role: 'dsm',
            roleTitle: 'Divisional Sales Manager - East',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
            phone: '(555) 201-0002',
            department: 'Sales',
            division: 'East',
            managerId: 'emp-vp-1',
            directReports: ['emp-mm-3', 'emp-mm-4'],
            location: 'New York, NY',
            hireDate: '2020-07-01',
            status: 'active',
            level: 2,
            children: [
              // Market Manager - New York
              {
                id: 'emp-mm-3',
                name: 'Daniel Park',
                email: 'daniel.park@groupon.com',
                role: 'mm',
                roleTitle: 'Market Manager - New York',
                avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face',
                phone: '(555) 301-0003',
                department: 'Sales',
                division: 'East',
                managerId: 'emp-dsm-2',
                directReports: ['emp-bd-4', 'emp-bd-5', 'emp-md-3'],
                location: 'New York, NY',
                hireDate: '2021-01-15',
                status: 'active',
                level: 3,
                children: [
                  {
                    id: 'emp-bd-4',
                    name: 'Rachel Green',
                    email: 'rachel.green@groupon.com',
                    role: 'bd',
                    roleTitle: 'Business Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1489424731084-a5ab8e308d35?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0006',
                    department: 'Sales',
                    division: 'East',
                    managerId: 'emp-mm-3',
                    directReports: [],
                    location: 'New York, NY',
                    hireDate: '2022-04-10',
                    status: 'active',
                    level: 4,
                  },
                  {
                    id: 'emp-bd-5',
                    name: 'Thomas Anderson',
                    email: 'thomas.anderson@groupon.com',
                    role: 'bd',
                    roleTitle: 'Business Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0007',
                    department: 'Sales',
                    division: 'East',
                    managerId: 'emp-mm-3',
                    directReports: [],
                    location: 'New York, NY',
                    hireDate: '2022-05-20',
                    status: 'active',
                    level: 4,
                  },
                  {
                    id: 'emp-md-3',
                    name: 'Jennifer White',
                    email: 'jennifer.white@groupon.com',
                    role: 'md',
                    roleTitle: 'Merchant Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0008',
                    department: 'Sales',
                    division: 'East',
                    managerId: 'emp-mm-3',
                    directReports: [],
                    location: 'New York, NY',
                    hireDate: '2021-09-01',
                    status: 'active',
                    level: 4,
                  },
                ],
              },
              // Market Manager - Boston
              {
                id: 'emp-mm-4',
                name: 'Michelle Brown',
                email: 'michelle.brown@groupon.com',
                role: 'mm',
                roleTitle: 'Market Manager - Boston',
                avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop&crop=face',
                phone: '(555) 301-0004',
                department: 'Sales',
                division: 'East',
                managerId: 'emp-dsm-2',
                directReports: ['emp-bd-6', 'emp-md-4'],
                location: 'Boston, MA',
                hireDate: '2021-03-08',
                status: 'active',
                level: 3,
                children: [
                  {
                    id: 'emp-bd-6',
                    name: 'Kevin O\'Brien',
                    email: 'kevin.obrien@groupon.com',
                    role: 'bd',
                    roleTitle: 'Business Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0009',
                    department: 'Sales',
                    division: 'East',
                    managerId: 'emp-mm-4',
                    directReports: [],
                    location: 'Boston, MA',
                    hireDate: '2022-07-12',
                    status: 'active',
                    level: 4,
                  },
                  {
                    id: 'emp-md-4',
                    name: 'Samantha Taylor',
                    email: 'samantha.taylor@groupon.com',
                    role: 'md',
                    roleTitle: 'Merchant Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0010',
                    department: 'Sales',
                    division: 'East',
                    managerId: 'emp-mm-4',
                    directReports: [],
                    location: 'Boston, MA',
                    hireDate: '2022-02-01',
                    status: 'active',
                    level: 4,
                  },
                ],
              },
            ],
          },
          // DSM - West Region
          {
            id: 'emp-dsm-3',
            name: 'Alexander Kim',
            email: 'alexander.kim@groupon.com',
            role: 'dsm',
            roleTitle: 'Divisional Sales Manager - West',
            avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
            phone: '(555) 201-0003',
            department: 'Sales',
            division: 'West',
            managerId: 'emp-vp-1',
            directReports: ['emp-mm-5'],
            location: 'San Francisco, CA',
            hireDate: '2020-09-15',
            status: 'active',
            level: 2,
            children: [
              // Market Manager - San Francisco
              {
                id: 'emp-mm-5',
                name: 'Nicole Garcia',
                email: 'nicole.garcia@groupon.com',
                role: 'mm',
                roleTitle: 'Market Manager - San Francisco',
                avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&h=150&fit=crop&crop=face',
                phone: '(555) 301-0005',
                department: 'Sales',
                division: 'West',
                managerId: 'emp-dsm-3',
                directReports: ['emp-bd-7', 'emp-bd-8', 'emp-md-5'],
                location: 'San Francisco, CA',
                hireDate: '2021-06-01',
                status: 'active',
                level: 3,
                children: [
                  {
                    id: 'emp-bd-7',
                    name: 'Brandon Lee',
                    email: 'brandon.lee@groupon.com',
                    role: 'bd',
                    roleTitle: 'Business Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0011',
                    department: 'Sales',
                    division: 'West',
                    managerId: 'emp-mm-5',
                    directReports: [],
                    location: 'San Francisco, CA',
                    hireDate: '2022-10-05',
                    status: 'active',
                    level: 4,
                  },
                  {
                    id: 'emp-bd-8',
                    name: 'Jessica Moore',
                    email: 'jessica.moore@groupon.com',
                    role: 'bd',
                    roleTitle: 'Business Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0012',
                    department: 'Sales',
                    division: 'West',
                    managerId: 'emp-mm-5',
                    directReports: [],
                    location: 'San Francisco, CA',
                    hireDate: '2022-11-20',
                    status: 'active',
                    level: 4,
                  },
                  {
                    id: 'emp-md-5',
                    name: 'Steven Harris',
                    email: 'steven.harris@groupon.com',
                    role: 'md',
                    roleTitle: 'Merchant Development Representative',
                    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&h=150&fit=crop&crop=face',
                    phone: '(555) 401-0013',
                    department: 'Sales',
                    division: 'West',
                    managerId: 'emp-mm-5',
                    directReports: [],
                    location: 'San Francisco, CA',
                    hireDate: '2021-12-01',
                    status: 'active',
                    level: 4,
                  },
                ],
              },
            ],
          },
        ],
      },
      // VP of Operations
      {
        id: 'emp-vp-2',
        name: 'Christopher Davis',
        email: 'christopher.davis@groupon.com',
        role: 'executive',
        roleTitle: 'VP of Operations',
        avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop&crop=face',
        phone: '(555) 100-0003',
        department: 'Operations',
        managerId: 'emp-ceo-1',
        directReports: ['emp-content-mgr-1'],
        location: 'Chicago, IL',
        hireDate: '2019-06-20',
        status: 'active',
        level: 1,
        children: [
          {
            id: 'emp-content-mgr-1',
            name: 'Victoria Martinez',
            email: 'victoria.martinez@groupon.com',
            role: 'content-ops-manager',
            roleTitle: 'Content Operations Manager',
            avatar: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=150&h=150&fit=crop&crop=face',
            phone: '(555) 301-0006',
            department: 'Operations',
            managerId: 'emp-vp-2',
            directReports: ['emp-content-1', 'emp-content-2'],
            location: 'Chicago, IL',
            hireDate: '2020-11-01',
            status: 'active',
            level: 2,
            children: [
              {
                id: 'emp-content-1',
                name: 'Olivia Davis',
                email: 'olivia.davis@groupon.com',
                role: 'content-ops-staff',
                roleTitle: 'Content Operations Specialist',
                avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face',
                phone: '(555) 401-0014',
                department: 'Operations',
                managerId: 'emp-content-mgr-1',
                directReports: [],
                location: 'Chicago, IL',
                hireDate: '2022-01-10',
                status: 'active',
                level: 3,
              },
              {
                id: 'emp-content-2',
                name: 'Nathan Wright',
                email: 'nathan.wright@groupon.com',
                role: 'content-ops-staff',
                roleTitle: 'Content Operations Specialist',
                avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
                phone: '(555) 401-0015',
                department: 'Operations',
                managerId: 'emp-content-mgr-1',
                directReports: [],
                location: 'Chicago, IL',
                hireDate: '2022-03-15',
                status: 'active',
                level: 3,
              },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Backward-compatible export
 * Returns dynamic hierarchy from Supabase or mock data as fallback
 */
export const companyHierarchy = getCompanyHierarchy();

/**
 * Additional utility functions
 */

// Get manager for an employee
export function getManager(employeeId: string): Employee | null {
  const employee = getEmployeeById(employeeId);
  if (!employee || !employee.managerId) return null;
  return getEmployeeById(employee.managerId) || null;
}

// Get management chain (all managers up to CEO)
export function getManagementChain(employeeId: string): Employee[] {
  const chain: Employee[] = [];
  let currentId: string | null | undefined = employeeId;
  
  while (currentId) {
    const employee = getEmployeeById(currentId);
    if (!employee) break;
    
    if (employee.managerId) {
      const manager = getEmployeeById(employee.managerId);
      if (manager) {
        chain.push(manager);
        currentId = manager.id;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  
  return chain;
}

// Find hierarchy node by employee ID
export function findHierarchyNode(employeeId: string): HierarchyNode | null {
  const hierarchy = getCompanyHierarchy();
  
  function search(nodes: HierarchyNode[]): HierarchyNode | null {
    for (const node of nodes) {
      if (node.id === employeeId) {
        return node;
      }
      if (node.children) {
        const found = search(node.children);
        if (found) return found;
      }
    }
    return null;
  }
  
  return search(hierarchy);
}

