import templatesData from './redemptionTemplates.json';
import { deals } from './mockDeals';
import { extendedMockDeals } from './extendedMockData';
import { replaceDicebearUrl } from '../lib/avatarGenerator';

// User information for creator/editor
export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
}

// History entry for timeline
export interface HistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'activated' | 'deactivated';
  user: UserInfo;
  timestamp: Date;
  changes?: string; // Description of what changed
}

// Rule conditions for automatic template selection
export interface TemplateRule {
  id: string;
  parameter: 'location_count' | 'booking_system' | 'redemption_method' | 'online_redemption_type';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: string | number | string[];
  secondValue?: number; // For 'between' operator
}

export interface RedemptionTemplate {
  id: string;
  name: string;
  type: 'built-in' | 'custom';
  content: string; // HTML from TipTap
  description?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserInfo;
  variables: string[]; // e.g., ['$phone', '$email']
  rules?: TemplateRule[]; // Conditions for automatic selection
  priority?: number; // Higher priority templates are suggested first when multiple match
  history: HistoryEntry[]; // Timeline of changes
}

// Export users from JSON with converted avatars
export const mockUsers: UserInfo[] = templatesData.users.map(user => ({
  ...user,
  avatar: user.avatar ? replaceDicebearUrl(user.avatar) : undefined,
}));

// Convert JSON data to proper types with avatar conversion
export const initialTemplates: RedemptionTemplate[] = templatesData.templates.map((t: any) => ({
  ...t,
  createdBy: {
    ...t.createdBy,
    avatar: t.createdBy.avatar ? replaceDicebearUrl(t.createdBy.avatar) : undefined,
  },
  createdAt: new Date(t.createdAt),
  updatedAt: new Date(t.updatedAt),
  history: t.history.map((h: any) => ({
    ...h,
    user: {
      ...h.user,
      avatar: h.user.avatar ? replaceDicebearUrl(h.user.avatar) : undefined,
    },
    timestamp: new Date(h.timestamp),
  })),
}));

// LocalStorage key
const STORAGE_KEY = 'redemption_templates';

// Helper functions
export const getTemplates = (): RedemptionTemplate[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        history: t.history?.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp),
        })) || [],
      }));
    }
    // Initialize with default templates
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTemplates));
    return initialTemplates;
  } catch (error) {
    console.error('Error loading templates:', error);
    return initialTemplates;
  }
};

export const saveTemplate = (template: RedemptionTemplate): void => {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === template.id);
  
  if (index >= 0) {
    // Update existing
    templates[index] = { ...template, updatedAt: new Date() };
  } else {
    // Add new
    templates.push(template);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

export const deleteTemplate = (id: string): void => {
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const duplicateTemplate = (id: string): RedemptionTemplate | null => {
  const templates = getTemplates();
  const template = templates.find(t => t.id === id);
  
  if (!template) return null;
  
  const newTemplate: RedemptionTemplate = {
    ...template,
    id: `custom-${Date.now()}`,
    name: `${template.name} (Copy)`,
    type: 'custom',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  saveTemplate(newTemplate);
  return newTemplate;
};

// Variable definitions for reference
export const availableVariables = [
  { key: '$phone', label: 'Phone Number', description: 'Merchant or booking phone number' },
  { key: '$email', label: 'Email Address', description: 'Merchant or booking email' },
  { key: '$booking_url', label: 'Booking URL', description: 'URL for online booking' },
  { key: '$merchant_name', label: 'Merchant Name', description: 'Name of the business' },
  { key: '$location_address', label: 'Location Address', description: 'Full address of location' },
  { key: '$business_hours', label: 'Business Hours', description: 'Operating hours' },
  { key: '$website', label: 'Website', description: 'Merchant website URL' },
  { key: '$custom_url', label: 'Custom URL', description: 'Unique redemption link' },
  { key: '$validity_days', label: 'Validity Period', description: 'Number of days voucher is valid' },
];

// Helper to extract variables from template content
export const extractVariables = (content: string): string[] => {
  const variableRegex = /\$[a-z_]+/g;
  const matches = content.match(variableRegex);
  return matches ? Array.from(new Set(matches)) : [];
};

// Helper to replace variables with sample data
export const replaceVariablesWithSample = (content: string): string => {
  const sampleData: Record<string, string> = {
    '$phone': '(555) 123-4567',
    '$email': 'info@merchant.com',
    '$booking_url': 'https://booking.merchant.com',
    '$merchant_name': 'Sample Merchant',
    '$location_address': '123 Main St, City, ST 12345',
    '$business_hours': 'Mon-Fri: 9am-6pm, Sat: 10am-4pm',
    '$website': 'https://www.merchant.com',
    '$custom_url': 'https://redeem.groupon.com/abc123',
    '$validity_days': '90',
  };
  
  let result = content;
  Object.entries(sampleData).forEach(([variable, value]) => {
    result = result.replace(new RegExp(variable.replace('$', '\\$'), 'g'), value);
  });
  
  return result;
};

// Deal parameters interface for rule evaluation
export interface DealParameters {
  locationCount: number;
  bookingSystem?: 'mindbody' | 'booker' | 'square' | 'custom' | null;
  redemptionMethod?: 'at-location' | 'online' | 'at-customer';
  onlineRedemptionType?: 'checkout' | 'direct-link' | 'custom-url';
}

// Rule evaluation function
export const evaluateRule = (rule: TemplateRule, params: DealParameters): boolean => {
  const { parameter, operator, value, secondValue } = rule;
  
  let paramValue: string | number | undefined;
  
  switch (parameter) {
    case 'location_count':
      paramValue = params.locationCount;
      break;
    case 'booking_system':
      paramValue = params.bookingSystem || '';
      break;
    case 'redemption_method':
      paramValue = params.redemptionMethod || '';
      break;
    case 'online_redemption_type':
      paramValue = params.onlineRedemptionType || '';
      break;
    default:
      return false;
  }
  
  switch (operator) {
    case 'equals':
      return paramValue === value;
    case 'greater_than':
      return typeof paramValue === 'number' && typeof value === 'number' && paramValue > value;
    case 'less_than':
      return typeof paramValue === 'number' && typeof value === 'number' && paramValue < value;
    case 'between':
      return typeof paramValue === 'number' && typeof value === 'number' && typeof secondValue === 'number' 
        && paramValue >= value && paramValue <= secondValue;
    case 'in':
      return Array.isArray(value) && value.includes(String(paramValue));
    case 'not_in':
      return Array.isArray(value) && !value.includes(String(paramValue));
    default:
      return false;
  }
};

// Get matching templates for deal parameters
export const getMatchingTemplates = (params: DealParameters): RedemptionTemplate[] => {
  const templates = getTemplates();
  
  const matching = templates.filter(template => {
    // Only consider active templates
    if (template.status !== 'active') return false;
    
    // If no rules, don't auto-match (manual selection only)
    if (!template.rules || template.rules.length === 0) return false;
    
    // All rules must match (AND logic)
    return template.rules.every(rule => evaluateRule(rule, params));
  });
  
  // Sort by priority (highest first)
  return matching.sort((a, b) => (b.priority || 0) - (a.priority || 0));
};

// Get suggested template (highest priority match)
export const getSuggestedTemplate = (params: DealParameters): RedemptionTemplate | null => {
  const matches = getMatchingTemplates(params);
  return matches.length > 0 ? matches[0] : null;
};

// Available rule parameters
export const ruleParameters = [
  {
    value: 'location_count',
    label: 'Location Count',
    type: 'number',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
  },
  {
    value: 'booking_system',
    label: 'Booking System',
    type: 'select',
    operators: ['equals', 'in', 'not_in'],
    options: [
      { value: 'mindbody', label: 'Mindbody' },
      { value: 'booker', label: 'Booker' },
      { value: 'square', label: 'Square Appointments' },
      { value: 'custom', label: 'Custom System' },
    ],
  },
  {
    value: 'redemption_method',
    label: 'Redemption Method',
    type: 'select',
    operators: ['equals', 'in', 'not_in'],
    options: [
      { value: 'at-location', label: 'At Location' },
      { value: 'online', label: 'Online' },
      { value: 'at-customer', label: "At Customer's Location" },
    ],
  },
  {
    value: 'online_redemption_type',
    label: 'Online Redemption Type',
    type: 'select',
    operators: ['equals', 'in', 'not_in'],
    options: [
      { value: 'checkout', label: 'Checkout Code' },
      { value: 'direct-link', label: 'Direct Link' },
      { value: 'custom-url', label: 'Custom URL' },
    ],
  },
] as const;

// Operator labels
export const operatorLabels: Record<string, string> = {
  equals: 'Equals',
  greater_than: 'Greater than',
  less_than: 'Less than',
  between: 'Between',
  in: 'Is one of',
  not_in: 'Is not one of',
};

// Helper function to get deals using a specific template
export const getDealsByTemplateId = (templateId: string) => {
  const allDeals = [...deals, ...extendedMockDeals];
  return allDeals.filter((deal: any) => deal.redemptionTemplateId === templateId && deal.status === 'Live');
};

// Get count of live deals using a template
export const getDealCountByTemplateId = (templateId: string): number => {
  return getDealsByTemplateId(templateId).length;
};

// Get deals that would match a template's rules
export const getDealsMatchingTemplateRules = (template: RedemptionTemplate) => {
  // If no rules, return empty array
  if (!template.rules || template.rules.length === 0) {
    return [];
  }
  
  const allDeals = [...deals, ...extendedMockDeals];
  
  return allDeals.filter((deal: any) => {
    // Only consider live deals
    if (deal.status !== 'Live') return false;
    
    // Get deal parameters
    const locationCount = deal.locationIds?.length || 1;
    const params: DealParameters = {
      locationCount,
      bookingSystem: null, // Could be extracted from deal data if available
      redemptionMethod: deal.redemptionMethod,
    };
    
    // Check if all rules match
    return template.rules!.every(rule => evaluateRule(rule, params));
  });
};
