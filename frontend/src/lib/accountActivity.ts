import { MerchantAccount } from "../data/merchantAccounts";

export interface ActivityStatus {
  label: string;
  color: string;
  type: "success" | "processing" | "warning" | "error" | "default";
  priority: number; // Lower is more important to show
}

export interface ContactStatus {
  label: string;
  color: string;
  type: "success" | "warning" | "error" | "default";
}

/**
 * Calculate how many months ago a date was
 */
const getMonthsAgo = (dateString?: string): number => {
  if (!dateString) return Infinity;
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  
  return diffMonths;
};

/**
 * Get activity status based on last deal date
 */
export const getActivityStatus = (account: MerchantAccount): ActivityStatus | null => {
  if (!account.lastDealDate) {
    // No deals yet
    if (account.dealsCount === 0) {
      return {
        label: "new",
        color: "default",
        type: "default",
        priority: 4,
      };
    }
    return null;
  }

  const monthsAgo = getMonthsAgo(account.lastDealDate);

  if (monthsAgo <= 3) {
    // Active (within 3 months)
    return {
      label: "active",
      color: "success",
      type: "success",
      priority: 1,
    };
  } else if (monthsAgo <= 12) {
    // Inactive less than a year
    const months = monthsAgo;
    return {
      label: `inactive for ${months} month${months > 1 ? 's' : ''}`,
      color: "orange",
      type: "warning",
      priority: 2,
    };
  } else {
    // Over a year - INACTIVE (neutral/grey)
    const years = Math.floor(monthsAgo / 12);
    const remainingMonths = monthsAgo % 12;
    
    let label: string;
    if (years === 1 && remainingMonths > 0) {
      label = `inactive for 1 year ${remainingMonths}mo`;
    } else {
      label = `inactive for ${years} year${years > 1 ? 's' : ''}`;
    }
    
    return {
      label,
      color: "default", // Neutral grey color
      type: "default",
      priority: 3,
    };
  }
};

/**
 * Get contact status based on last contact date
 */
export const getContactStatus = (account: MerchantAccount): ContactStatus | null => {
  if (!account.lastContactDate) {
    return {
      label: "Not Contacted",
      color: "default",
      type: "default",
    };
  }

  const monthsAgo = getMonthsAgo(account.lastContactDate);

  if (monthsAgo === 0 || monthsAgo === 1) {
    // This month or last month
    return {
      label: "Recently Contacted",
      color: "success",
      type: "success",
    };
  } else if (monthsAgo <= 3) {
    // Within 3 months
    return {
      label: `Contacted ${monthsAgo} months ago`,
      color: "processing",
      type: "success",
    };
  } else if (monthsAgo <= 12) {
    // Within a year
    return {
      label: `Contacted ${monthsAgo} months ago`,
      color: "warning",
      type: "warning",
    };
  } else {
    // Over a year
    const years = Math.floor(monthsAgo / 12);
    return {
      label: `Contacted ${years} year${years > 1 ? 's' : ''} ago`,
      color: "error",
      type: "error",
    };
  }
};

/**
 * Get potential badge color based on potential level
 */
export const getPotentialColor = (potential: string): string => {
  switch (potential) {
    case "high":
      return "green";
    case "mid":
      return "blue";
    case "low":
      return "orange";
    default:
      return "default";
  }
};

/**
 * Get potential description
 */
export const getPotentialDescription = (account: MerchantAccount): string => {
  const score = account.potentialAnalysis.score;
  
  if (score >= 85) {
    return "Excellent growth opportunity";
  } else if (score >= 70) {
    return "Strong potential";
  } else if (score >= 55) {
    return "Moderate potential";
  } else {
    return "Needs improvement";
  }
};

