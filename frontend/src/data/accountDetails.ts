import accountDetailsData from "./accountDetails.json";

export interface AccountOwner {
  name: string;
  initial: string;
  color: string;
}

export interface AccountInfo {
  id: string;
  name: string;
  created: string;
  lastModified: string;
  lastModifiedBy: string;
  salesforceUrl: string;
  accountOwner: AccountOwner;
  parentAccount: string;
  brand: string;
}

export interface AssignedDeal {
  id: string;
  image: string;
  title: string;
  orders30d: number;
  views30d: number;
  gp: string;
  gpViews30d: string;
  cr30d: string;
  margin: string;
  dealStart: string;
}

export interface AuditLogChange {
  field: string;
  value: string;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  changes: AuditLogChange[];
}

export interface SubAccount {
  id: string;
  name: string;
}

export interface AccountDetail {
  account: AccountInfo;
  assignedDeals: AssignedDeal[];
  auditLog: AuditLogEntry[];
  subAccounts: SubAccount[];
}

// Type the imported JSON data
const typedAccountDetailsData = accountDetailsData as Record<
  string,
  AccountDetail
>;

export const getAccountDetail = (
  accountKey: string
): AccountDetail | undefined => {
  return typedAccountDetailsData[accountKey];
};

// Export the default account data (Sam's Club)
export const defaultAccountDetail: AccountDetail =
  typedAccountDetailsData.samsclub;
