// Re-export types from mockDeals to avoid duplication
export type { DealOption, CustomField } from "../../data/mockDeals";

export interface MediaItem {
  id: string;
  url: string;
  caption?: string;
  isFeatured?: boolean;
  source?:
    | "upload"
    | "library"
    | "stock"
    | "previous"
    | "ai"
    | "website"
    | "spa"
    | "fitness"
    | "adventure";
  uploadProgress?: number;
  type: "image" | "video";
  score?: number; // Image quality score (0-100)
  scoreReason?: string; // Explanation for the score
}

export interface HighlightItem {
  id: string;
  text: string;
  icon?: string;
}

export interface FinePointItem {
  id: string;
  text: string;
  templateId?: string;
  parameters?: Record<string, string>;
}

export type Locale = "en-US" | "en-CA" | "fr-CA" | "nl-NL" | "nl-BE" | "fr-BE";

export interface LocaleOption {
  value: Locale;
  label: string;
  flag: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: "en-US", label: "English (US)", flag: "🇺🇸" },
  { value: "en-CA", label: "English (Canada)", flag: "🇨🇦" },
  { value: "fr-CA", label: "Français (Canada)", flag: "🇨🇦" },
  { value: "nl-NL", label: "Nederlands (NL)", flag: "🇳🇱" },
  { value: "nl-BE", label: "Nederlands (BE)", flag: "🇧🇪" },
  { value: "fr-BE", label: "Français (BE)", flag: "🇧🇪" },
];

export interface DynamicTextOption {
  key: string;
  label: string;
  description: string;
  tag: string | null;
  value: string;
}

export const DYNAMIC_TEXT_OPTIONS: DynamicTextOption[] = [
  {
    key: "lowest_sell_price",
    label: "$lowest_sell_price",
    description: "Lowest Sell Price Among All Options",
    tag: "Global",
    value: "$lowest_sell_price",
  },
  {
    key: "maximum_of_discount_amount",
    label: "$maximum_of_discount_amount",
    description: "Maximum Discount Amount Among All Options",
    tag: "Global",
    value: "$maximum_of_discount_amount",
  },
  {
    key: "maximum_of_discount_percentage",
    label: "$maximum_of_discount_percentage",
    description: "Maximum Discount Percentage Among All Options",
    tag: "Global",
    value: "$maximum_of_discount_percentage",
  },
  {
    key: "price_1",
    label: "$price_1",
    description:
      "Las Vegas Dunes Off-Road ATV Adventure Tour for One - Sell Price",
    tag: null,
    value: "$price_1",
  },
  {
    key: "value_1",
    label: "$value_1",
    description: "Las Vegas Dunes Off-Road ATV Adventure Tour for One - Value",
    tag: null,
    value: "$value_1",
  },
];

// Redemption instructions dynamic text options
export const REDEMPTION_DYNAMIC_TEXT_OPTIONS: DynamicTextOption[] = [
  {
    key: "phone",
    label: "$phone",
    description: "Merchant phone number",
    tag: "Contact",
    value: "$phone",
  },
  {
    key: "email",
    label: "$email",
    description: "Merchant email address",
    tag: "Contact",
    value: "$email",
  },
  {
    key: "booking_url",
    label: "$booking_url",
    description: "Online booking URL",
    tag: "Contact",
    value: "$booking_url",
  },
  {
    key: "location_address",
    label: "$location_address",
    description: "Location address",
    tag: "Location",
    value: "$location_address",
  },
  {
    key: "business_hours",
    label: "$business_hours",
    description: "Business operating hours",
    tag: "Location",
    value: "$business_hours",
  },
  {
    key: "validity_days",
    label: "$validity_days",
    description: "Voucher validity period in days",
    tag: "Global",
    value: "$validity_days",
  },
  {
    key: "website",
    label: "$website",
    description: "Merchant website URL",
    tag: "Contact",
    value: "$website",
  },
  {
    key: "custom_url",
    label: "$custom_url",
    description: "Custom redemption URL",
    tag: "Contact",
    value: "$custom_url",
  },
];

export interface DescriptionVersion {
  id: string;
  content: string;
  timestamp: Date;
  author: string;
  label?: string;
}

export interface HighlightVersion {
  id: string;
  content: string;
  timestamp: Date;
  author: string;
  label?: string;
}
