/**
 * Account Filtering Logic Based on Role and Hierarchy
 * 
 * This module provides filtering logic for merchant accounts based on:
 * - User's role (BD, MD, DSM, MM, etc.)
 * - Company hierarchy (who reports to whom)
 * - Account ownership
 */

import { MerchantAccount, AccountPerson } from '../data/merchantAccounts';
import { Employee, getAllTeamMembers, getEmployeeById, getAllEmployees } from '../data/companyHierarchy';
import { UserRole } from '../contexts/RoleViewContext';

export interface AccountFilterConfig {
  userId: string; // Current user's employee ID
  userRole: UserRole; // Current user's role
}

/**
 * Get filtered accounts based on user role and hierarchy
 * 
 * Rules:
 * - BD/MD: Can only see accounts where they are the account owner
 * - MM: Can see accounts where they or their direct reports are account owners
 * - DSM: Can see accounts where anyone in their team is an account owner
 * - Admin/Executives: Can see all accounts
 */
export function getFilteredAccounts(
  accounts: MerchantAccount[],
  config: AccountFilterConfig
): MerchantAccount[] {
  const { userId, userRole } = config;
  
  // Admin and executives see everything
  if (userRole === 'admin' || userRole === 'executive') {
    return accounts;
  }
  
  // Get current user's employee info
  const currentEmployee = getEmployeeById(userId);
  if (!currentEmployee) {
    console.warn('Employee not found:', userId);
    return [];
  }
  
  // Get team member IDs based on role
  const allowedOwnerIds = getAllowedAccountOwnerIds(currentEmployee);
  
  // Filter accounts
  return accounts.filter(account => {
    if (!account.accountOwner) return false;
    
    // Check if account owner is in the allowed list
    return allowedOwnerIds.includes(account.accountOwner.id);
  });
}

/**
 * Get list of employee IDs who can be account owners for this user's view
 */
export function getAllowedAccountOwnerIds(employee: Employee): string[] {
  const role = employee.role;
  
  switch (role) {
    case 'bd':
    case 'md':
      // BD and MD can only see their own accounts
      return [employee.id];
      
    case 'mm':
      // MM can see accounts owned by themselves or their direct reports
      const mmTeam = getAllTeamMembers(employee.id);
      return [employee.id, ...mmTeam.map(e => e.id)];
      
    case 'dsm':
      // DSM can see accounts owned by anyone in their team (including sub-teams)
      const dsmTeam = getAllTeamMembers(employee.id);
      return [employee.id, ...dsmTeam.map(e => e.id)];
      
    case 'content-ops-staff':
    case 'content-ops-manager':
      // Content ops can see all accounts (they need to work on content for all)
      return getAllEmployees().map(e => e.id);
      
    case 'admin':
    case 'executive':
      // Admins and executives see everything
      return getAllEmployees().map(e => e.id);
      
    default:
      console.warn('Unknown role:', role);
      return [employee.id];
  }
}

/**
 * Check if a user can view a specific account
 */
export function canViewAccount(
  account: MerchantAccount,
  config: AccountFilterConfig
): boolean {
  const { userId, userRole } = config;
  
  // Admin and executives can view everything
  if (userRole === 'admin' || userRole === 'executive') {
    return true;
  }
  
  if (!account.accountOwner) return false;
  
  const currentEmployee = getEmployeeById(userId);
  if (!currentEmployee) return false;
  
  const allowedOwnerIds = getAllowedAccountOwnerIds(currentEmployee);
  return allowedOwnerIds.includes(account.accountOwner.id);
}

/**
 * Get account owner filter options for a user
 * Returns list of employees who can be selected as account owners for filtering
 */
export function getAccountOwnerFilterOptions(userId: string): Employee[] {
  const currentEmployee = getEmployeeById(userId);
  if (!currentEmployee) return [];
  
  const allowedOwnerIds = getAllowedAccountOwnerIds(currentEmployee);
  const allEmployees = getAllEmployees();
  
  return allEmployees
    .filter(emp => allowedOwnerIds.includes(emp.id))
    .filter(emp => emp.role === 'bd' || emp.role === 'md'); // Only BD and MD can be account owners
}

// Note: getAllEmployees is now imported from companyHierarchy

/**
 * Get filter description text based on role
 */
export function getFilterDescriptionForRole(userRole: UserRole): string {
  switch (userRole) {
    case 'bd':
    case 'md':
      return 'Showing accounts where you are the account owner';
      
    case 'mm':
      return 'Showing accounts owned by you or your direct reports';
      
    case 'dsm':
      return 'Showing accounts owned by anyone in your team';
      
    case 'content-ops-staff':
    case 'content-ops-manager':
      return 'Showing all accounts';
      
    case 'admin':
    case 'executive':
      return 'Showing all accounts';
      
    default:
      return 'Filtered view';
  }
}

/**
 * Get filter description for deals
 */
export function getDealFilterDescriptionForRole(userRole: UserRole): string {
  switch (userRole) {
    case 'bd':
    case 'md':
      return 'Showing deals from accounts where you are the account owner';
      
    case 'mm':
      return 'Showing deals from accounts owned by you or your direct reports';
      
    case 'dsm':
      return 'Showing deals from accounts owned by anyone in your team';
      
    case 'content-ops-staff':
    case 'content-ops-manager':
      return 'Showing all deals';
      
    case 'admin':
    case 'executive':
      return 'Showing all deals';
      
    default:
      return 'Filtered view';
  }
}

/**
 * Filter deals based on account ownership
 * Only shows deals from accounts the user has access to
 */
export function getFilteredDeals<T extends { accountId?: string }>(
  deals: T[],
  config: AccountFilterConfig,
  accountsWithOwners: MerchantAccount[]
): T[] {
  const { userId, userRole } = config;
  
  // Admin and executives see everything
  if (userRole === 'admin' || userRole === 'executive') {
    return deals;
  }
  
  // Get filtered accounts for this user
  const allowedAccounts = getFilteredAccounts(accountsWithOwners, config);
  const allowedAccountIds = new Set(allowedAccounts.map(acc => acc.id));
  
  // Filter deals to only those from allowed accounts
  return deals.filter(deal => {
    // If deal has no account ID, show it (system deals, etc.)
    if (!deal.accountId) return true;
    
    // Check if deal's account is in the allowed list
    return allowedAccountIds.has(deal.accountId);
  });
}

