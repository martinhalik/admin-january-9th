/**
 * Supabase functions for employees and merchant accounts
 */

import { supabase } from './supabase';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  role_title: string;
  avatar?: string;
  phone?: string;
  division?: string;
  department?: string;
  manager_id?: string | null;
  location?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface MerchantAccount {
  id: string;
  name: string;
  business_type: string;
  location: string;
  status: 'active' | 'pending' | 'inactive';
  potential: 'high' | 'mid' | 'low';
  deals_count: number;
  account_owner_id?: string | null;
  salesforce_url?: string;
  parent_account?: string;
  brand?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data from view
  owner_name?: string;
  owner_email?: string;
  owner_role?: string;
  owner_avatar?: string;
}

export interface EmployeeWithCounts extends Employee {
  accounts_count?: number;
  deals_count?: number;
}

/**
 * Fetch all employees
 */
export async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch employees by role with pagination and search
 * Simplified to avoid complex joins
 */
export async function fetchEmployeesByRolePaginated(
  roles: string[],
  searchQuery?: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ employees: EmployeeWithCounts[], total: number }> {
  if (!supabase) {
    return { employees: [], total: 0 };
  }

  // Build query for employees
  let query = supabase
    .from('employees')
    .select('*', { count: 'exact' })
    .in('role', roles)
    .eq('status', 'active')
    .order('name');

  // Add search filter if provided
  if (searchQuery && searchQuery.trim()) {
    query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,role_title.ilike.%${searchQuery}%`);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }

  // Return employees - counts will be computed client-side from the items prop
  const employees: EmployeeWithCounts[] = (data || []).map((emp: any) => ({
    ...emp,
    // Don't include counts here - they will be computed client-side by AccountOwnerFilter
  }));

  return {
    employees,
    total: count || 0,
  };
}

/**
 * Get count of account owners by role
 */
export async function getAccountOwnersCount(roles: string[]): Promise<number> {
  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .in('role', roles)
    .eq('status', 'active');

  if (error) {
    console.error('Error counting account owners:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Fetch employees by role
 */
export async function fetchEmployeesByRole(role: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('role', role)
    .eq('status', 'active')
    .order('name');

  if (error) {
    console.error('Error fetching employees by role:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch employee by ID
 */
export async function fetchEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching employee:', error);
    return null;
  }

  return data;
}

/**
 * Fetch direct reports for a manager
 */
export async function fetchDirectReports(managerId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('manager_id', managerId)
    .eq('status', 'active')
    .order('name');

  if (error) {
    console.error('Error fetching direct reports:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch merchant accounts with owner details
 */
export async function fetchMerchantAccounts(): Promise<MerchantAccount[]> {
  // Fetch in batches due to Supabase default 1000 row limit
  // Loading first 5000 accounts for now
  const BATCH_SIZE = 1000;
  const TOTAL_ACCOUNTS = 5000;
  const allAccounts: any[] = [];
  
  for (let offset = 0; offset < TOTAL_ACCOUNTS; offset += BATCH_SIZE) {
    const { data, error } = await supabase
      .from('merchant_accounts')
      .select(`
        *,
        owner:employees!account_owner_id (
          id,
          name,
          email,
          role,
          avatar
        )
      `)
      .order('name')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error(`Error fetching merchant accounts at offset ${offset}:`, error);
      throw error;
    }

    if (!data || data.length === 0) {
      break; // No more data
    }

    allAccounts.push(...data);
    
    // If we got less than BATCH_SIZE, we've reached the end
    if (data.length < BATCH_SIZE) {
      break;
    }
  }

  console.log(`[fetchMerchantAccounts] Loaded ${allAccounts.length} accounts`);

  // Transform to include owner details at the top level
  return allAccounts.map((acc: any) => ({
    ...acc,
    owner_name: acc.owner?.name,
    owner_email: acc.owner?.email,
    owner_role: acc.owner?.role,
    owner_avatar: acc.owner?.avatar,
  }));
}

/**
 * Fetch accounts for a specific owner
 */
export async function fetchAccountsForOwner(ownerId: string): Promise<MerchantAccount[]> {
  const { data, error } = await supabase
    .from('merchant_accounts')
    .select(`
      *,
      owner:employees!account_owner_id (
        id,
        name,
        email,
        role,
        avatar
      )
    `)
    .eq('account_owner_id', ownerId)
    .order('name');

  if (error) {
    console.error('Error fetching accounts for owner:', error);
    throw error;
  }

  // Transform to include owner details at the top level
  return (data || []).map((acc: any) => ({
    ...acc,
    owner_name: acc.owner?.name,
    owner_email: acc.owner?.email,
    owner_role: acc.owner?.role,
    owner_avatar: acc.owner?.avatar,
  }));
}

/**
 * Update account owner
 */
export async function updateAccountOwner(accountId: string, ownerId: string | null): Promise<void> {
  const { error } = await supabase
    .from('merchant_accounts')
    .update({ account_owner_id: ownerId })
    .eq('id', accountId);

  if (error) {
    console.error('Error updating account owner:', error);
    throw error;
  }
}

/**
 * Get account owner statistics
 */
export async function fetchOwnerAccountStats(ownerId: string) {
  const { data, error } = await supabase
    .from('merchant_accounts')
    .select('status, potential, deals_count')
    .eq('account_owner_id', ownerId);

  if (error) {
    console.error('Error fetching owner stats:', error);
    throw error;
  }

  const accounts = data || [];

  return {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(a => a.status === 'active').length,
    totalDeals: accounts.reduce((sum, a) => sum + (a.deals_count || 0), 0),
    highPotential: accounts.filter(a => a.potential === 'high').length,
    midPotential: accounts.filter(a => a.potential === 'mid').length,
    lowPotential: accounts.filter(a => a.potential === 'low').length,
  };
}
