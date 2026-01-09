export interface Division {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface AccountManager {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  division: string;
  divisionName: string;
  avatar: string;
  hireDate: string;
  specialties: string[];
  accountsManaged: number;
  performanceRating: number;
}

export interface AccountOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  businessName: string;
  businessType: string;
  location: string;
  avatar: string;
  joinDate: string;
  yearsInBusiness: number;
  specialties: string[];
}

export interface AccountPersonnelData {
  divisions: Division[];
  accountManagers: AccountManager[];
  accountOwners: AccountOwner[];
}

// Import the JSON data
import personnelData from "./accountPersonnel.json";

export const accountPersonnel: AccountPersonnelData = personnelData;

// Helper functions
export const getAccountManagerById = (
  id: string
): AccountManager | undefined => {
  return accountPersonnel.accountManagers.find((manager) => manager.id === id);
};

export const getAccountOwnerById = (id: string): AccountOwner | undefined => {
  return accountPersonnel.accountOwners.find((owner) => owner.id === id);
};

export const getDivisionById = (id: string): Division | undefined => {
  return accountPersonnel.divisions.find((division) => division.id === id);
};

export const getManagersByDivision = (divisionId: string): AccountManager[] => {
  return accountPersonnel.accountManagers.filter(
    (manager) => manager.division === divisionId
  );
};

export const getOwnersByBusinessType = (
  businessType: string
): AccountOwner[] => {
  return accountPersonnel.accountOwners.filter(
    (owner) => owner.businessType === businessType
  );
};
