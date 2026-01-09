/**
 * Account Owner Helper Utilities
 * 
 * Provides consistent handling and display of account owners across the application.
 * "House Account" from Salesforce/database is displayed as "Unassigned" in the frontend for better UX.
 */

/**
 * Get the display name for an account owner
 * Returns "Unassigned" for House Account or null/undefined owners
 */
export const getAccountOwnerDisplayName = (accountOwner: any): string => {
  if (!accountOwner || !accountOwner.name) return 'Unassigned';
  if (accountOwner.name === 'House Account') return 'Unassigned';
  return accountOwner.name;
};

/**
 * Check if an account owner is unassigned (House Account or null)
 */
export const isUnassignedAccount = (accountOwner: any): boolean => {
  if (!accountOwner || !accountOwner.name) return true;
  return accountOwner.name === 'House Account';
};

/**
 * Display value for filter dropdowns and selects
 */
export const UNASSIGNED_LABEL = 'Unassigned';

/**
 * Filter value used internally for unassigned accounts
 */
export const UNASSIGNED_FILTER_VALUE = 'unassigned';

