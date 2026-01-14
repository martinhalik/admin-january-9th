import { MerchantAccount } from "../data/merchantAccounts";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface CategoryRecommendation {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0-1
  reasoning: string;
  examples: string[]; // Similar successful deals
  potentialRevenue: number;
  estimatedOrders: number;
  marketSize: "Small" | "Medium" | "Large" | "Very Large";
}

export interface SubcategoryOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
  recommended: boolean;
  confidence?: number;
  category?: string; // Parent category ID
  subcategory?: string; // Subcategory ID (for backwards compat)
  marketDemand?: "High" | "Medium" | "Low";
  seasonality?: string;
  priority?: "High" | "Medium" | "Low"; // Priority level
  shoppingListUntil?: string; // Date until which this is in shopping list
}

// L6/PDS - Specific Product/Deal/Service options
export interface PDSOption {
  id: string;
  name: string; // e.g., "Dinner for Two with Wine"
  description: string;
  category: string; // L1 category
  subcategory: string; // L2 subcategory
  recommended: boolean;
  confidence: number;
  typicalPrice: number;
  marketDemand: "High" | "Medium" | "Low";
  seasonality?: string;
}

export interface GeneratedOption {
  id: string;
  name: string;
  regularPrice: number;
  grouponPrice: number;
  discount: number;
  reasoning: string;
  targetAudience: string;
  projectedSales: number;
  confidence: number;
  margin: number;
  pricingSource: "merchant_scraped" | "similar_deals";
  merchantPricingUrl?: string; // Only if pricingSource is merchant_scraped
  similarDealsReference?: string; // Only if pricingSource is similar_deals
  grouponMargin?: number; // Groupon's margin percentage (0-100)
  merchantMargin?: number; // Merchant's margin percentage (0-100), calculated as 100 - grouponMargin
  merchantPayout?: number; // Amount merchant receives per voucher sold
}

export interface AIGuidance {
  step: "category" | "subcategory" | "options" | "review";
  suggestions: Suggestion[];
  warnings: Warning[];
  optimizations: Optimization[];
  nextSteps: string[];
}

export interface Suggestion {
  id: string;
  type: "success" | "info" | "tip";
  title: string;
  description: string;
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface Warning {
  id: string;
  message: string;
  severity: "low" | "medium" | "high";
}

export interface Optimization {
  id: string;
  title: string;
  description: string;
  expectedImpact: number; // percentage improvement
  apply: () => void;
}

// ============================================================================
// Category Mapping & Logic
// ============================================================================

const businessTypeToCategoryMap: Record<string, string> = {
  Restaurant: "food-drink",
  Cafe: "food-drink",
  Bar: "food-drink",
  "Fine Dining": "food-drink",
  "Mexican Restaurant": "food-drink",
  "Italian Restaurant": "food-drink",
  Spa: "health-beauty",
  "Spa & Beauty": "health-beauty",
  Salon: "health-beauty",
  "Hair Salon": "health-beauty",
  Massage: "health-beauty",
  "Fitness & Health": "activities",
  Gym: "activities",
  "Activities & Entertainment": "activities",
  Adventure: "activities",
  Tours: "activities",
  "Hotel & Lodging": "activities",
  Electronics: "goods",
  Fashion: "goods",
  Home: "goods",
};

const categoryData = {
  "food-drink": {
    name: "Food & Drink",
    basePrice: 30,
    avgRevenue: 45000,
    avgOrders: 850,
    marketSize: "Large" as const,
    successExamples: [
      "Chipotle Deal - $45k revenue",
      "Olive Garden - $38k revenue",
      "Local Bistro - $32k revenue",
    ],
  },
  "health-beauty": {
    name: "Health & Beauty",
    basePrice: 60,
    avgRevenue: 38000,
    avgOrders: 620,
    marketSize: "Medium" as const,
    successExamples: [
      "Luxury Spa - $42k revenue",
      "Beauty Studio - $35k revenue",
      "Wellness Center - $29k revenue",
    ],
  },
  activities: {
    name: "Activities & Entertainment",
    basePrice: 50,
    avgRevenue: 52000,
    avgOrders: 920,
    marketSize: "Large" as const,
    successExamples: [
      "Adventure Park - $58k revenue",
      "Museum Pass - $48k revenue",
      "City Tour - $41k revenue",
    ],
  },
  goods: {
    name: "Goods & Products",
    basePrice: 75,
    avgRevenue: 65000,
    avgOrders: 1200,
    marketSize: "Very Large" as const,
    successExamples: [
      "Electronics Bundle - $72k revenue",
      "Fashion Collection - $61k revenue",
      "Home Essentials - $55k revenue",
    ],
  },
};

// ============================================================================
// Main Recommendation Functions
// ============================================================================

export const getRecommendedCategory = (
  account: MerchantAccount
): CategoryRecommendation => {
  // Find category based on business type
  const categoryId =
    businessTypeToCategoryMap[account.businessType] || "food-drink";
  const category = categoryData[categoryId as keyof typeof categoryData];

  // Calculate confidence based on:
  // 1. Business type match quality
  // 2. Merchant potential score
  // 3. Historical performance factors
  const hasDirectMatch = account.businessType in businessTypeToCategoryMap;
  const potentialScore = account.potentialAnalysis.score / 100;
  const historicalScore =
    account.potentialAnalysis.factors.historicalPerformance.score / 100;

  const matchQuality = hasDirectMatch ? 1.0 : 0.6;
  const confidence =
    matchQuality * 0.5 + potentialScore * 0.3 + historicalScore * 0.2;

  // Adjust revenue estimates based on merchant potential
  const revenueMultiplier = account.potentialAnalysis.score / 70; // 70 is baseline
  const estimatedRevenue = Math.round(category.avgRevenue * revenueMultiplier);
  const estimatedOrders = Math.round(category.avgOrders * revenueMultiplier);

  return {
    categoryId,
    categoryName: category.name,
    confidence: Math.min(confidence, 0.98), // Cap at 98%
    reasoning: `Based on your business type (${account.businessType}) and ${account.potential} growth potential, ${category.name} deals have shown ${Math.round(confidence * 100)}% success rate in similar markets.`,
    examples: category.successExamples,
    potentialRevenue: estimatedRevenue,
    estimatedOrders,
    marketSize: category.marketSize,
  };
};

// ============================================================================
// L6/PDS Generation - Direct Product/Deal/Service Recommendations
// ============================================================================

export const getRecommendedPDS = (
  account: MerchantAccount
): PDSOption[] => {
  const businessType = account.businessType;
  
  // Food & Drink PDS options
  if (["Restaurant", "Cafe", "Bar", "Fine Dining", "Mexican Restaurant", "Italian Restaurant"].includes(businessType)) {
    return [
      {
        id: "pds-dinner-for-two",
        name: "Dinner for Two with Wine",
        description: "Complete dinner experience for 2 people including appetizers, entrees, and a bottle of house wine",
        category: "food-drink",
        subcategory: "casual-dining",
        recommended: true,
        confidence: 0.94,
        typicalPrice: 60,
        marketDemand: "High",
      },
      {
        id: "pds-lunch-voucher",
        name: "$30 Toward Lunch",
        description: "Voucher valid for lunch menu items, excluding alcohol",
        category: "food-drink",
        subcategory: "casual-dining",
        recommended: true,
        confidence: 0.89,
        typicalPrice: 30,
        marketDemand: "High",
      },
      {
        id: "pds-family-meal",
        name: "Family Meal for Four",
        description: "Complete meal for 4 including appetizers, entrees, desserts, and drinks",
        category: "food-drink",
        subcategory: "casual-dining",
        recommended: true,
        confidence: 0.91,
        typicalPrice: 90,
        marketDemand: "Medium",
      },
      {
        id: "pds-tasting-menu",
        name: "Chef's Tasting Menu for Two",
        description: "Multi-course tasting experience with wine pairings",
        category: "food-drink",
        subcategory: "fine-dining",
        recommended: businessType === "Fine Dining",
        confidence: 0.88,
        typicalPrice: 120,
        marketDemand: "Medium",
      },
      {
        id: "pds-happy-hour",
        name: "Happy Hour Package",
        description: "Appetizers and drinks for two during happy hour",
        category: "food-drink",
        subcategory: "bar-nightlife",
        recommended: businessType === "Bar",
        confidence: 0.87,
        typicalPrice: 40,
        marketDemand: "High",
      },
    ];
  }
  
  // Spa & Beauty PDS options
  if (["Spa", "Spa & Beauty", "Salon", "Hair Salon", "Massage"].includes(businessType)) {
    return [
      {
        id: "pds-massage-60min",
        name: "60-Minute Swedish Massage",
        description: "Full-body relaxation massage with aromatherapy",
        category: "health-beauty",
        subcategory: "spa-wellness",
        recommended: true,
        confidence: 0.96,
        typicalPrice: 80,
        marketDemand: "High",
      },
      {
        id: "pds-spa-day",
        name: "Spa Day Package",
        description: "Massage, facial, and body treatment with champagne",
        category: "health-beauty",
        subcategory: "spa-wellness",
        recommended: true,
        confidence: 0.92,
        typicalPrice: 150,
        marketDemand: "High",
      },
      {
        id: "pds-facial",
        name: "Signature Facial Treatment",
        description: "Deep-cleansing facial with customized skincare products",
        category: "health-beauty",
        subcategory: "spa-wellness",
        recommended: businessType.includes("Spa"),
        confidence: 0.90,
        typicalPrice: 70,
        marketDemand: "High",
      },
      {
        id: "pds-haircut-color",
        name: "Haircut & Color Package",
        description: "Professional haircut with full color treatment",
        category: "health-beauty",
        subcategory: "hair-salon",
        recommended: businessType.includes("Salon"),
        confidence: 0.93,
        typicalPrice: 120,
        marketDemand: "High",
      },
      {
        id: "pds-couples-massage",
        name: "Couples Massage (90 Min)",
        description: "Side-by-side massage experience for two",
        category: "health-beauty",
        subcategory: "spa-wellness",
        recommended: true,
        confidence: 0.89,
        typicalPrice: 180,
        marketDemand: "Medium",
      },
    ];
  }
  
  // Fitness & Activities PDS options
  if (["Fitness & Health", "Gym", "Activities & Entertainment", "Adventure", "Tours"].includes(businessType)) {
    return [
      {
        id: "pds-gym-membership",
        name: "One-Month Gym Membership",
        description: "Full access to all equipment and group classes for 30 days",
        category: "activities",
        subcategory: "fitness-gym",
        recommended: businessType === "Gym",
        confidence: 0.95,
        typicalPrice: 50,
        marketDemand: "High",
        seasonality: "High in January, June",
      },
      {
        id: "pds-fitness-classes",
        name: "10 Fitness Class Pass",
        description: "Attend any 10 group fitness classes within 60 days",
        category: "activities",
        subcategory: "fitness-gym",
        recommended: businessType.includes("Fitness"),
        confidence: 0.91,
        typicalPrice: 80,
        marketDemand: "High",
      },
      {
        id: "pds-personal-training",
        name: "5 Personal Training Sessions",
        description: "One-on-one training with certified personal trainer",
        category: "activities",
        subcategory: "fitness-gym",
        recommended: businessType.includes("Fitness"),
        confidence: 0.87,
        typicalPrice: 150,
        marketDemand: "Medium",
      },
      {
        id: "pds-adventure-experience",
        name: "Adventure Experience for Two",
        description: "Outdoor activity package including equipment and guide",
        category: "activities",
        subcategory: "adventure-sports",
        recommended: businessType.includes("Adventure"),
        confidence: 0.90,
        typicalPrice: 120,
        marketDemand: "Medium",
        seasonality: "Summer peak",
      },
    ];
  }
  
  // Default/fallback PDS options
  return [
    {
      id: "pds-voucher-50",
      name: "$50 Toward Services",
      description: "General voucher applicable to any services or products",
      category: "food-drink",
      subcategory: "casual-dining",
      recommended: true,
      confidence: 0.75,
      typicalPrice: 50,
      marketDemand: "Medium",
    },
    {
      id: "pds-voucher-100",
      name: "$100 Toward Services",
      description: "Premium voucher for higher-value experiences",
      category: "food-drink",
      subcategory: "casual-dining",
      recommended: true,
      confidence: 0.72,
      typicalPrice: 100,
      marketDemand: "Medium",
    },
  ];
};

export const getSubcategories = (
  categoryId: string,
  account: MerchantAccount
): SubcategoryOption[] => {
  const subcategoryMap: Record<string, SubcategoryOption[]> = {
    "food-drink": [
      {
        id: "casual-dining",
        name: "Casual Dining",
        description: "Family-friendly restaurants with broad appeal",
        recommended: account.businessType === "Restaurant",
        confidence: 0.89,
        category: "food-drink",
        subcategory: "casual-dining",
        marketDemand: "High",
        priority: "High",
        shoppingListUntil: "31. 12. 2025",
      },
      {
        id: "fine-dining",
        name: "Fine Dining",
        description: "Upscale restaurants with premium experiences",
        recommended: account.businessType === "Fine Dining",
        confidence: 0.92,
        category: "food-drink",
        subcategory: "fine-dining",
        marketDemand: "Medium",
        priority: "Medium",
      },
      {
        id: "cafe-coffee",
        name: "Café & Coffee",
        description: "Coffee shops and light meals",
        recommended: account.businessType === "Cafe",
        confidence: 0.88,
        category: "food-drink",
        subcategory: "cafe-coffee",
        marketDemand: "High",
        priority: "Low",
        shoppingListUntil: "15. 3. 2026",
      },
      {
        id: "bar-nightlife",
        name: "Bar & Nightlife",
        description: "Bars, pubs, and entertainment venues",
        recommended: account.businessType === "Bar",
        confidence: 0.85,
        category: "food-drink",
        subcategory: "bar-nightlife",
        marketDemand: "Medium",
        priority: "Low",
      },
      {
        id: "ethnic-cuisine",
        name: "Ethnic Cuisine",
        description: "Specialty ethnic restaurants",
        recommended:
          account.name.includes("Mexican") ||
          account.name.includes("Italian") ||
          account.name.includes("Thai") ||
          account.name.includes("Chinese"),
        confidence: 0.91,
        category: "food-drink",
        subcategory: "ethnic-cuisine",
        marketDemand: "High",
        priority: "High",
        shoppingListUntil: "20. 2. 2026",
      },
    ],
    "health-beauty": [
      {
        id: "spa-wellness",
        name: "Spa & Wellness",
        description: "Massage, facials, and relaxation treatments",
        recommended: account.businessType.includes("Spa"),
        confidence: 0.93,
        category: "health-beauty",
        subcategory: "spa-wellness",
        marketDemand: "High",
        seasonality: "Year-round with peaks in winter holidays",
        priority: "High",
        shoppingListUntil: "14. 1. 2026",
      },
      {
        id: "hair-salon",
        name: "Hair Salon",
        description: "Haircuts, coloring, and styling services",
        recommended: account.businessType.includes("Salon"),
        confidence: 0.90,
        category: "health-beauty",
        subcategory: "hair-salon",
        marketDemand: "High",
        priority: "Medium",
        shoppingListUntil: "28. 2. 2026",
      },
      {
        id: "beauty-services",
        name: "Beauty Services",
        description: "Makeup, nails, and cosmetic treatments",
        recommended: account.businessType.includes("Beauty"),
        confidence: 0.87,
        category: "health-beauty",
        subcategory: "beauty-services",
        marketDemand: "Medium",
        priority: "High",
        shoppingListUntil: "14. 1. 2026",
      },
      {
        id: "wellness-therapy",
        name: "Wellness & Therapy",
        description: "Alternative therapies and wellness programs",
        recommended: account.businessType.includes("Wellness"),
        confidence: 0.85,
        category: "health-beauty",
        subcategory: "wellness-therapy",
        marketDemand: "Medium",
        priority: "Low",
      },
    ],
    activities: [
      {
        id: "adventure-sports",
        name: "Adventure & Sports",
        description: "Outdoor activities and adventure experiences",
        recommended:
          account.businessType.includes("Adventure") ||
          account.businessType.includes("Fitness"),
        confidence: 0.91,
        category: "activities",
        subcategory: "adventure-sports",
        marketDemand: "High",
        seasonality: "Peak in summer months",
        priority: "Medium",
        shoppingListUntil: "30. 6. 2026",
      },
      {
        id: "fitness-gym",
        name: "Fitness & Gym",
        description: "Gym memberships and fitness classes",
        recommended: account.businessType.includes("Gym"),
        confidence: 0.94,
        category: "activities",
        subcategory: "fitness-gym",
        marketDemand: "High",
        seasonality: "Peak in January (New Year resolutions)",
        priority: "High",
        shoppingListUntil: "31. 1. 2026",
      },
      {
        id: "entertainment",
        name: "Entertainment",
        description: "Shows, events, and entertainment venues",
        recommended: account.businessType.includes("Entertainment"),
        confidence: 0.86,
        category: "activities",
        subcategory: "entertainment",
        marketDemand: "Medium",
        priority: "Low",
      },
      {
        id: "travel-lodging",
        name: "Travel & Lodging",
        description: "Hotels, resorts, and vacation packages",
        recommended: account.businessType.includes("Hotel"),
        confidence: 0.88,
        category: "activities",
        subcategory: "travel-lodging",
        marketDemand: "High",
        seasonality: "Peak in summer and holidays",
        priority: "Medium",
        shoppingListUntil: "15. 7. 2026",
      },
      {
        id: "classes-workshops",
        name: "Classes & Workshops",
        description: "Educational classes and skill-building workshops",
        recommended: false,
        confidence: 0.82,
        category: "activities",
        subcategory: "classes-workshops",
        marketDemand: "Low",
        priority: "Low",
      },
    ],
    goods: [
      {
        id: "electronics",
        name: "Electronics",
        description: "Tech products and gadgets",
        recommended: account.businessType.includes("Electronics"),
        confidence: 0.90,
        category: "goods",
        subcategory: "electronics",
        marketDemand: "High",
        priority: "Low",
      },
      {
        id: "fashion",
        name: "Fashion & Apparel",
        description: "Clothing, accessories, and footwear",
        recommended: account.businessType.includes("Fashion"),
        confidence: 0.89,
        category: "goods",
        subcategory: "fashion",
        marketDemand: "High",
        seasonality: "Peak in spring/fall seasons",
        priority: "Low",
      },
      {
        id: "home-goods",
        name: "Home & Living",
        description: "Furniture, décor, and home essentials",
        recommended: account.businessType.includes("Home"),
        confidence: 0.87,
        category: "goods",
        subcategory: "home-goods",
        marketDemand: "Medium",
        priority: "Low",
      },
      {
        id: "health-products",
        name: "Health & Beauty Products",
        description: "Cosmetics, skincare, and wellness products",
        recommended: account.businessType.includes("Beauty"),
        confidence: 0.88,
        category: "goods",
        subcategory: "health-products",
        marketDemand: "High",
        priority: "Low",
      },
    ],
  };

  return subcategoryMap[categoryId] || [];
};

export const generatePricingOptions = (
  merchant: MerchantAccount,
  categoryId: string,
  subcategoryId?: string
): GeneratedOption[] => {
  const category = categoryData[categoryId as keyof typeof categoryData];
  if (!category) return [];

  let basePrice = category.basePrice;
  
  // Adjust base price based on subcategory (PDS-specific pricing)
  const subcategoryPriceModifiers: Record<string, number> = {
    // Food & Drink
    "casual-dining": 1.0,
    "fine-dining": 1.6,
    "cafe-coffee": 0.6,
    "bar-nightlife": 0.9,
    "ethnic-cuisine": 1.1,
    // Health & Beauty
    "spa-wellness": 1.3,
    "hair-salon": 0.9,
    "beauty-services": 1.0,
    "wellness-therapy": 1.2,
    // Activities
    "adventure-sports": 1.4,
    "fitness-gym": 0.8,
    "entertainment": 1.2,
    "travel-lodging": 2.0,
    "classes-workshops": 0.7,
    // Goods
    "electronics": 1.5,
    "fashion": 1.0,
    "home-goods": 1.3,
    "health-products": 0.8,
  };
  
  if (subcategoryId && subcategoryPriceModifiers[subcategoryId]) {
    basePrice = Math.round(basePrice * subcategoryPriceModifiers[subcategoryId]);
  }
  
  // Adjust pricing based on merchant potential and location
  const potentialMultiplier = merchant.potentialAnalysis.score / 70;
  const adjustedBase = Math.round(basePrice * potentialMultiplier);

  // Standard discount is 33-40%
  const standardDiscount = 35;
  
  // Unique ID based on subcategory
  const optionIdPrefix = subcategoryId || categoryId;

  // Determine if we can scrape from merchant (randomized for realism)
  const canScrapeMerchant = Math.random() > 0.4; // 60% success rate
  const merchantUrl = merchant.website || `https://${merchant.name.toLowerCase().replace(/\s+/g, '')}.com`;
  
  // Generate 3 tiers: Entry, Popular, Premium
  const options: GeneratedOption[] = [
    // Entry Tier
    {
      id: `${optionIdPrefix}-entry`,
      name: `${category.name} Experience`,
      regularPrice: Math.round(adjustedBase * 1.54), // ~35% discount
      grouponPrice: adjustedBase,
      discount: standardDiscount,
      confidence: 0.88,
      reasoning: canScrapeMerchant 
        ? "Verified from merchant website"
        : "Expected price for this service",
      targetAudience: "Solo customers, lunch crowd, first-timers",
      projectedSales: Math.round(300 * potentialMultiplier),
      margin: Math.round(adjustedBase * 0.45), // 45% margin
      pricingSource: canScrapeMerchant ? "merchant_scraped" : "similar_deals",
      merchantPricingUrl: canScrapeMerchant ? `${merchantUrl}/menu` : undefined,
      similarDealsReference: !canScrapeMerchant ? "Based on 247 similar deals in your category" : undefined,
    },
    // Popular Tier (Most Popular)
    {
      id: `${optionIdPrefix}-popular`,
      name: `Premium ${category.name} Package`,
      regularPrice: Math.round(adjustedBase * 2 * 1.54),
      grouponPrice: adjustedBase * 2,
      discount: standardDiscount,
      confidence: 0.95,
      reasoning: canScrapeMerchant
        ? "Verified from merchant website"
        : "Expected price for this service",
      targetAudience: "Couples, date nights, special occasions",
      projectedSales: Math.round(550 * potentialMultiplier),
      margin: Math.round(adjustedBase * 2 * 0.48), // 48% margin
      pricingSource: canScrapeMerchant ? "merchant_scraped" : "similar_deals",
      merchantPricingUrl: canScrapeMerchant ? `${merchantUrl}/packages` : undefined,
      similarDealsReference: !canScrapeMerchant ? "Based on 182 similar deals in your category" : undefined,
    },
    // Premium Tier
    {
      id: `${optionIdPrefix}-premium`,
      name: `Deluxe Group Experience`,
      regularPrice: Math.round(adjustedBase * 3 * 1.43), // 30% discount
      grouponPrice: adjustedBase * 3,
      discount: 30,
      confidence: 0.82,
      reasoning: (canScrapeMerchant && Math.random() > 0.3)
        ? "Verified from merchant website"
        : "Expected price for this service",
      targetAudience: "Groups, families, celebrations, corporate events",
      projectedSales: Math.round(200 * potentialMultiplier),
      margin: Math.round(adjustedBase * 3 * 0.52), // 52% margin
      pricingSource: canScrapeMerchant && Math.random() > 0.3 ? "merchant_scraped" : "similar_deals",
      merchantPricingUrl: canScrapeMerchant && Math.random() > 0.3 ? `${merchantUrl}/pricing` : undefined,
      similarDealsReference: !(canScrapeMerchant && Math.random() > 0.3) ? "Based on 156 similar deals in your category" : undefined,
    },
  ];

  // PDS-specific pricing structures with realistic multipliers
  // Each array: [name, priceMultiplier, confidenceAdjust, salesMultiplier, discountOverride?]
  const pdsStructures: Record<string, Array<{name: string, priceMultiplier: number, confidence?: number, salesMultiplier?: number, discount?: number}>> = {
    // Food & Drink
    "casual-dining": [
      {name: "Dining Credit", priceMultiplier: 1, confidence: 0.90, salesMultiplier: 1.2},
      {name: "Dinner for Two with Drinks", priceMultiplier: 2, confidence: 0.95, salesMultiplier: 1.5},
      {name: "Family Meal for Four", priceMultiplier: 3.5, confidence: 0.85, salesMultiplier: 0.9},
    ],
    "fine-dining": [
      {name: "3-Course Meal", priceMultiplier: 1, confidence: 0.88},
      {name: "5-Course Dinner for Two", priceMultiplier: 2.5, confidence: 0.93, discount: 30},
      {name: "Chef's Table Experience", priceMultiplier: 4, confidence: 0.82, discount: 25, salesMultiplier: 0.7},
    ],
    "cafe-coffee": [
      {name: "Coffee & Pastry", priceMultiplier: 1, confidence: 0.92, salesMultiplier: 1.5},
      {name: "Breakfast for Two", priceMultiplier: 2.5, confidence: 0.94, salesMultiplier: 1.3},
      {name: "All-Day Cafe Package", priceMultiplier: 4, confidence: 0.86, salesMultiplier: 1.0},
    ],
    "bar-nightlife": [
      {name: "2 Cocktails", priceMultiplier: 1, confidence: 0.91, salesMultiplier: 1.4},
      {name: "Premium Bar Tab", priceMultiplier: 2, confidence: 0.94, salesMultiplier: 1.3},
      {name: "VIP Table for 6", priceMultiplier: 5, confidence: 0.80, salesMultiplier: 0.6, discount: 30},
    ],
    "ethnic-cuisine": [
      {name: "Lunch Special", priceMultiplier: 0.8, confidence: 0.90, salesMultiplier: 1.3},
      {name: "Dinner for Two", priceMultiplier: 2, confidence: 0.95, salesMultiplier: 1.5},
      {name: "Family Feast Package", priceMultiplier: 3.5, confidence: 0.87, salesMultiplier: 1.0},
    ],
    
    // Health & Beauty
    "spa-wellness": [
      {name: "60-Minute Massage", priceMultiplier: 1, confidence: 0.93, salesMultiplier: 1.3},
      {name: "Half-Day Spa Package", priceMultiplier: 2.5, confidence: 0.96, salesMultiplier: 1.4},
      {name: "Full-Day Wellness Retreat", priceMultiplier: 4.5, confidence: 0.85, salesMultiplier: 0.8, discount: 30},
    ],
    "hair-salon": [
      {name: "Haircut & Blowout", priceMultiplier: 1, confidence: 0.91, salesMultiplier: 1.4},
      {name: "Color & Style Package", priceMultiplier: 2.5, confidence: 0.94, salesMultiplier: 1.3},
      {name: "Complete Makeover", priceMultiplier: 4, confidence: 0.86, salesMultiplier: 0.9},
    ],
    "beauty-services": [
      {name: "Express Facial", priceMultiplier: 1, confidence: 0.90, salesMultiplier: 1.3},
      {name: "Mani-Pedi Package", priceMultiplier: 1.8, confidence: 0.95, salesMultiplier: 1.5},
      {name: "Full Beauty Day", priceMultiplier: 3.5, confidence: 0.87, salesMultiplier: 1.0},
    ],
    "wellness-therapy": [
      {name: "Single Session", priceMultiplier: 1, confidence: 0.88, salesMultiplier: 1.2},
      {name: "3-Session Package", priceMultiplier: 2.7, confidence: 0.92, salesMultiplier: 1.4},
      {name: "10-Session Program", priceMultiplier: 8, confidence: 0.85, salesMultiplier: 0.7, discount: 40},
    ],
    
    // Activities
    "adventure-sports": [
      {name: "Single Adventure", priceMultiplier: 1, confidence: 0.89, salesMultiplier: 1.2},
      {name: "Adventure for Two", priceMultiplier: 1.8, confidence: 0.94, salesMultiplier: 1.4},
      {name: "Full-Day Group Experience", priceMultiplier: 4, confidence: 0.84, salesMultiplier: 0.8},
    ],
    "fitness-gym": [
      {name: "1-Month Membership", priceMultiplier: 1, confidence: 0.92, salesMultiplier: 1.5},
      {name: "3-Month Membership", priceMultiplier: 2.5, confidence: 0.96, salesMultiplier: 1.6, discount: 40},
      {name: "Annual Pass", priceMultiplier: 8, confidence: 0.88, salesMultiplier: 0.9, discount: 50},
    ],
    "entertainment": [
      {name: "Single Admission", priceMultiplier: 1, confidence: 0.90, salesMultiplier: 1.3},
      {name: "Two Tickets", priceMultiplier: 1.8, confidence: 0.95, salesMultiplier: 1.5},
      {name: "Group Package (6 people)", priceMultiplier: 4.5, confidence: 0.86, salesMultiplier: 0.9},
    ],
    "travel-lodging": [
      {name: "One Night Stay", priceMultiplier: 1, confidence: 0.91, salesMultiplier: 1.2},
      {name: "Weekend Getaway (2 nights)", priceMultiplier: 1.8, confidence: 0.95, salesMultiplier: 1.4},
      {name: "Week-Long Package", priceMultiplier: 5, confidence: 0.83, salesMultiplier: 0.7, discount: 30},
    ],
    "classes-workshops": [
      {name: "Single Class", priceMultiplier: 1, confidence: 0.89, salesMultiplier: 1.3},
      {name: "4-Class Series", priceMultiplier: 3.5, confidence: 0.93, salesMultiplier: 1.4, discount: 40},
      {name: "8-Week Course", priceMultiplier: 7, confidence: 0.87, salesMultiplier: 1.0, discount: 45},
    ],
    
    // Goods
    "electronics": [
      {name: "Accessory Bundle", priceMultiplier: 1, confidence: 0.90, salesMultiplier: 1.4},
      {name: "Premium Device", priceMultiplier: 3, confidence: 0.93, salesMultiplier: 1.2},
      {name: "Complete Tech Package", priceMultiplier: 5, confidence: 0.85, salesMultiplier: 0.8},
    ],
    "fashion": [
      {name: "Store Credit", priceMultiplier: 1, confidence: 0.94, salesMultiplier: 1.6},
      {name: "Wardrobe Essentials", priceMultiplier: 2.5, confidence: 0.96, salesMultiplier: 1.4},
      {name: "Complete Outfit Package", priceMultiplier: 4, confidence: 0.88, salesMultiplier: 1.0},
    ],
    "home-goods": [
      {name: "Décor Piece", priceMultiplier: 1, confidence: 0.88, salesMultiplier: 1.2},
      {name: "Room Refresh Set", priceMultiplier: 2.5, confidence: 0.92, salesMultiplier: 1.3},
      {name: "Complete Collection", priceMultiplier: 5, confidence: 0.84, salesMultiplier: 0.8},
    ],
    "health-products": [
      {name: "Starter Kit", priceMultiplier: 1, confidence: 0.91, salesMultiplier: 1.4},
      {name: "30-Day Supply", priceMultiplier: 2, confidence: 0.95, salesMultiplier: 1.5},
      {name: "Premium Collection", priceMultiplier: 4, confidence: 0.87, salesMultiplier: 1.0},
    ],
  };
  
  // Apply PDS-specific structure if available
  if (subcategoryId && pdsStructures[subcategoryId]) {
    const structure = pdsStructures[subcategoryId];
    structure.forEach((tier, index) => {
      const tierPrice = Math.round(adjustedBase * tier.priceMultiplier);
      const discount = tier.discount || standardDiscount;
      
      options[index].id = `${optionIdPrefix}-tier${index + 1}`;
      options[index].name = tier.name; // Remove price from name
      options[index].grouponPrice = tierPrice;
      options[index].regularPrice = Math.round(tierPrice / (1 - discount / 100));
      options[index].discount = discount;
      options[index].confidence = tier.confidence || options[index].confidence;
      options[index].projectedSales = Math.round(options[index].projectedSales * (tier.salesMultiplier || 1));
      options[index].margin = Math.round(tierPrice * 0.48);
    });
  } else if (categoryId === "food-drink") {
    // Fallback to category-level names - no price in name
    options[0].name = `Dining Voucher`;
    options[1].name = `Dinner for Two`;
    options[2].name = `Family Feast Package`;
  } else if (categoryId === "health-beauty") {
    options[0].name = `Signature Treatment`;
    options[1].name = `Spa Day Package`;
    options[2].name = `Ultimate Relaxation Experience`;
  } else if (categoryId === "activities") {
    options[0].name = `Individual Pass`;
    options[1].name = `Couple's Adventure`;
    options[2].name = `Group Experience Package`;
  }

  return options;
};

// ============================================================================
// Quality Scoring
// ============================================================================

export const calculateDealQualityScore = (dealData: {
  hasTitle?: boolean;
  hasDescription?: boolean;
  mediaCount?: number;
  highlightsCount?: number;
  finePointsCount?: number;
  optionsCount?: number;
  hasCategory?: boolean;
  hasSubcategory?: boolean;
}): number => {
  let score = 0;

  // Title (15 points)
  if (dealData.hasTitle) score += 15;

  // Description (20 points)
  if (dealData.hasDescription) score += 20;

  // Media (20 points - max at 5+ images)
  const mediaScore = Math.min((dealData.mediaCount || 0) * 4, 20);
  score += mediaScore;

  // Highlights (15 points - max at 5+)
  const highlightsScore = Math.min((dealData.highlightsCount || 0) * 3, 15);
  score += highlightsScore;

  // Fine points (10 points - max at 5+)
  const finePointsScore = Math.min((dealData.finePointsCount || 0) * 2, 10);
  score += finePointsScore;

  // Options (15 points - max at 3+)
  const optionsScore = Math.min((dealData.optionsCount || 0) * 5, 15);
  score += optionsScore;

  // Category (5 points)
  if (dealData.hasCategory) score += 5;

  return Math.min(Math.round(score), 100);
};

export const getDealQualityRecommendations = (
  score: number,
  dealData: any
): string[] => {
  const recommendations: string[] = [];

  if (score >= 90) {
    recommendations.push("Excellent! Your deal is ready to launch.");
    recommendations.push("Consider A/B testing different titles for optimization.");
  } else if (score >= 75) {
    recommendations.push("Great job! Your deal looks solid.");
    if (!dealData.mediaCount || dealData.mediaCount < 5) {
      recommendations.push("Add more images to showcase your offering.");
    }
    if (!dealData.highlightsCount || dealData.highlightsCount < 4) {
      recommendations.push("Include more highlights to emphasize key benefits.");
    }
  } else if (score >= 60) {
    recommendations.push("Good start, but there's room for improvement.");
    if (!dealData.hasDescription) {
      recommendations.push("Add a compelling description to convert browsers to buyers.");
    }
    if (!dealData.mediaCount || dealData.mediaCount < 3) {
      recommendations.push("Upload at least 3-5 high-quality images.");
    }
    if (!dealData.finePointsCount || dealData.finePointsCount < 3) {
      recommendations.push("Include fine print to set clear customer expectations.");
    }
  } else {
    recommendations.push("Let's complete the essential elements first.");
    if (!dealData.hasTitle) {
      recommendations.push("Create an attention-grabbing title.");
    }
    if (!dealData.hasDescription) {
      recommendations.push("Write a detailed description of your offering.");
    }
    if (!dealData.optionsCount || dealData.optionsCount < 2) {
      recommendations.push("Add at least 2-3 pricing options.");
    }
  }

  return recommendations;
};

// ============================================================================
// Confidence Calculation
// ============================================================================

export const calculateConfidence = (factors: {
  dataQuality: number; // 0-1: How complete is merchant data
  historicalMatch: number; // 0-1: How similar to successful deals
  marketConditions: number; // 0-1: Current market favorability
  competition: number; // 0-1: Competition level (inverse - higher is better)
}): number => {
  const weights = {
    dataQuality: 0.3,
    historicalMatch: 0.4,
    marketConditions: 0.2,
    competition: 0.1,
  };

  return Object.entries(factors).reduce(
    (score, [key, value]) =>
      score + value * weights[key as keyof typeof weights],
    0
  );
};

// ============================================================================
// Custom Option Generation (for user-created options)
// ============================================================================

export const generateCustomOption = (
  prompt: string,
  merchant: MerchantAccount,
  _categoryId: string
): GeneratedOption | null => {
  // Simple NLP-like logic to parse user intent
  const lowerPrompt = prompt.toLowerCase();

  // Extract numbers from prompt
  const numbers = prompt.match(/\d+/g)?.map(Number) || [];
  const suggestedPrice = numbers.length > 0 ? numbers[0] : 50;

  // Determine target audience from keywords
  let targetAudience = "General customers";
  let confidence = 0.75;

  if (
    lowerPrompt.includes("family") ||
    lowerPrompt.includes("group") ||
    lowerPrompt.includes("4") ||
    lowerPrompt.includes("four")
  ) {
    targetAudience = "Families and groups of 4+";
    confidence = 0.82;
  } else if (
    lowerPrompt.includes("couple") ||
    lowerPrompt.includes("two") ||
    lowerPrompt.includes("2") ||
    lowerPrompt.includes("date")
  ) {
    targetAudience = "Couples and pairs";
    confidence = 0.88;
  } else if (
    lowerPrompt.includes("solo") ||
    lowerPrompt.includes("single") ||
    lowerPrompt.includes("individual")
  ) {
    targetAudience = "Individual customers";
    confidence = 0.85;
  }

  // Generate name from prompt
  let name = `$${suggestedPrice} Custom Experience`;
  if (lowerPrompt.includes("dinner")) {
    name = `$${suggestedPrice} Dinner Experience`;
  } else if (lowerPrompt.includes("lunch")) {
    name = `$${suggestedPrice} Lunch Special`;
  } else if (lowerPrompt.includes("massage") || lowerPrompt.includes("spa")) {
    name = `$${suggestedPrice} Spa Treatment`;
  } else if (
    lowerPrompt.includes("workout") ||
    lowerPrompt.includes("fitness")
  ) {
    name = `$${suggestedPrice} Fitness Package`;
  }

  const discount = 35;
  const regularPrice = Math.round(suggestedPrice * 1.54);

  return {
    id: `option-custom-${Date.now()}`,
    name,
    regularPrice,
    grouponPrice: suggestedPrice,
    discount,
    confidence,
    reasoning: `Based on your description: "${prompt}". This price point aligns with market standards for similar offerings.`,
    targetAudience,
    projectedSales: Math.round(
      400 * (merchant.potentialAnalysis.score / 70)
    ),
    margin: Math.round(suggestedPrice * 0.46),
    pricingSource: "similar_deals",
    similarDealsReference: "Based on custom input and market standards",
  };
};

