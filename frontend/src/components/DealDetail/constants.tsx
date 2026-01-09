import { SalesforceIcon, SalesloftIcon } from '../icons';

export const VALIDITY_PERIOD_OPTIONS = [
  { label: "30 days", value: "30 days" },
  { label: "60 days", value: "60 days" },
  { label: "90 days", value: "90 days" },
  { label: "120 days", value: "120 days" },
  { label: "180 days", value: "180 days" },
  { label: "1 year", value: "1 year" },
];

export const QUALITY_OPTIONS = [
  { value: "Ace", label: "Ace" },
  { value: "Good", label: "Good" },
  { value: "Fair", label: "Fair" },
  { value: "Poor", label: "Poor" },
];

export const DIVISION_OPTIONS = [
  { value: "Chicago (USA)", label: "Chicago (USA)" },
  { value: "New York (USA)", label: "New York (USA)" },
  { value: "Los Angeles (USA)", label: "Los Angeles (USA)" },
  { value: "San Francisco (USA)", label: "San Francisco (USA)" },
  { value: "London (UK)", label: "London (UK)" },
  { value: "Paris (France)", label: "Paris (France)" },
  { value: "Berlin (Germany)", label: "Berlin (Germany)" },
  { value: "Dubai (UAE)", label: "Dubai (UAE)" },
];

export const CATEGORY_OPTIONS = [
  { value: "Food & Drink - Restaurant - Mexican", label: "Food & Drink / Mexican" },
  { value: "Food & Drink - Restaurant - Italian", label: "Food & Drink / Italian" },
  { value: "Food & Drink - Restaurant - American", label: "Food & Drink / American" },
  { value: "Beauty & Spa - Spa - Day Spa", label: "Beauty & Spa / Day Spa" },
  { value: "Things to Do - Adventure - Outdoor", label: "Things to Do / Adventure" },
];

export const PERSONNEL_OPTIONS = [
  { value: "Unassigned", label: "Unassigned" },
  { value: "Sarah Johnson", label: "Sarah Johnson" },
  { value: "Michael Chen", label: "Michael Chen" },
  { value: "Emily Rodriguez", label: "Emily Rodriguez" },
  { value: "John Peterson", label: "John Peterson" },
  { value: "Emma Davis", label: "Emma Davis" },
];

export const ACTION_MENU_ITEMS = [
  { key: "de", label: "DE", icon: null },
  { key: "dct", label: "DCT", icon: null },
  { key: "salesforce", label: "Salesforce", icon: <SalesforceIcon /> },
  { key: "salesloft", label: "Salesloft", icon: <SalesloftIcon /> },
];

// Unified filter function for Select with search
export const filterSelectOption = (input: string, option?: { label: string }) =>
  (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

