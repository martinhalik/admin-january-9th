import { extendedMockDeals } from "./extendedMockData";
import { getAccountLocationIds } from "./locationUtils";

export { getAccountLocationIds };

export interface Deal {
  id: string;
  title: string;
  galleryTitle: string;
  shortDescriptor: string;
  descriptor: string;
  isGalleryTitleAuto: boolean;
  isDescriptorAuto: boolean;
  location: string;
  accountId?: string; // Merchant account this deal belongs to
  locationIds?: string[]; // Location IDs from the account (automatically assigned to all account locations)
  redemptionMethod?: "at-location" | "online" | "at-customers-location"; // How customers redeem this deal
  redemptionInstructions?: string; // Instructions for redeeming the deal (with dynamic values)
  isRedemptionInstructionsAuto?: boolean; // Whether to use Groupon template for redemption instructions
  redemptionTemplateId?: string; // ID of the redemption template to use
  customBookingUrl?: string; // Custom booking/reservation URL
  customRedemptionUrl?: string; // Custom URL for redemption
  // Dynamic values for redemption instructions
  redemptionPhone?: string;
  redemptionEmail?: string;
  redemptionLocationAddress?: string;
  redemptionBusinessHours?: string;
  redemptionValidityDays?: number;
  logo?: string; // Merchant logo URL
  // Custom business details (overrides account-level settings)
  customWebsite?: string;
  customPhone?: string;
  customEmail?: string;
  customAddress?: string;
  customBusinessHours?: string;
  // Payment terms
  paymentTerm?: "on_redeem" | "on_view_voucher" | "on_click" | "via_api";
  category: string;
  subcategory: string;
  division: string;
  pos: string;
  web: string;
  dealStart: string;
  dealEnd: string;
  quality: string;
  status: string;
  // Timestamps
  createdAt?: string; // ISO timestamp when deal was created
  updatedAt?: string; // ISO timestamp when deal was last updated
  // Campaign Stages
  campaignStage?: "draft" | "won" | "lost";
  draftSubStage?: "prospecting" | "pre_qualification" | "presentation" | "appointment" | "proposal" | "needs_assessment" | "contract_sent" | "negotiation" | "contract_signed" | "approved";
  wonSubStage?: "scheduled" | "live" | "paused" | "sold_out" | "ended";
  lostSubStage?: "closed_lost";
  // AI Pre-qualification metadata
  aiReviewResult?: {
    status: "pass" | "pass_with_warnings" | "fail";
    score: number;
    checks: Array<{
      category: string;
      status: "pass" | "warning" | "fail";
      message: string;
    }>;
    recommendations: string[];
    timestamp: string;
  };
  escalationReason?: string; // Reason for escalation to manager (if AI failed)
  options: DealOption[];
  stats: DealStats;
  roles: DealRoles;
  recommendations: Recommendation[];
  content: DealContent;
}

export interface DealContent {
  description: string;
  media: MediaItem[];
  highlights: HighlightItem[] | string; // Now supports both array (legacy) and HTML string
  finePoints: FinePointItem[];
}

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
}

export interface CustomField {
  id: string;
  name: string;
  value: string;
  type: "text" | "dropdown" | "number";
  options?: string[];
}

export interface DealOption {
  id: string;
  name: string;
  subtitle?: string;
  details?: string;
  regularPrice: number;
  grouponPrice: number;
  discount: number;
  validity: string;
  enabled: boolean;
  customFields?: CustomField[];
  monthlyCapacity?: number;
  merchantMargin?: number;
  grouponMargin?: number;
  merchantPayout: number;
  status: string;
}

export interface DealStats {
  revenue: number;
  purchases: number;
  revenuePerView: number;
  conversionRate: number;
  views: number;
  likes: number;
  chartData: ChartDataPoint[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface DealRoles {
  accountOwner: string;
  writer: string;
  imageDesigner: string;
  opportunityOwner: string;
}

export interface Recommendation {
  id: string;
  priority: string;
  category: string;
  title: string;
  description: string;
  details: string;
  status: string;
}

export const generateMockChartData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const dates = [];
  const baseDate = new Date("2024-09-01");

  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  const values = [
    45, 52, 48, 55, 60, 58, 62, 65, 70, 68, 72, 75, 73, 78, 80, 85, 82, 88, 90,
    87, 92, 95, 93, 88, 85, 90, 95, 98, 96, 100,
  ];

  dates.forEach((date, i) => {
    data.push({ date, value: values[i] || 50 });
  });

  return data;
};

export const mockDeal: Deal = {
  id: "1",
  title:
    "Save Up to 36% $45 towards Dinner at Chimi's Fresh-Mex – Authentic Mexican Food & Margaritas",
  galleryTitle:
    "Save Up to 36% $45 towards Dinner at Chimi's Fresh-Mex – Authentic Mexican Food & Margaritas",
  shortDescriptor: "",
  descriptor:
    "Save Up to 36% $45 towards Dinner at Chimi's Fresh-Mex – Authentic Mexican Food & Margaritas",
  isGalleryTitleAuto: true,
  isDescriptorAuto: true,
  location: "Chimi's Fresh-Mex, Chicago",
  accountId: "merchant-001",
  locationIds: getAccountLocationIds("merchant-1"),
  category: "Food & Drink",
  subcategory: "Restaurant",
  division: "Chicago (USA)",
  pos: "Mexican",
  web: "blogaze2go.com",
  dealStart: "26. 7. 2024",
  dealEnd: "28. 4. 2026",
  quality: "Ace",
  status: "Live",
  campaignStage: "won",
  wonSubStage: "live",
  options: [
    {
      id: "1",
      name: "$10 Toward Dinner - Wentzville Location",
      regularPrice: 40,
      grouponPrice: 7,
      merchantPayout: 5.6,
      status: "Live",
      subtitle: "Perfect for lunch",
      details: "Great for a quick lunch or light dinner. Valid Monday-Friday.",
      discount: 82,
      enabled: true,
      validity: "Valid for 90 days",
      monthlyCapacity: 100,
      merchantMargin: 50,
      grouponMargin: 50,
      customFields: [
        {
          id: "cf1",
          name: "Oil type",
          value: "Full Synthetic",
          type: "dropdown",
        },
        {
          id: "cf2",
          name: "Size",
          value: "Medium",
          type: "dropdown",
        },
      ],
    },
    {
      id: "2",
      name: "$45 Toward Dinner - Wentzville Location",
      regularPrice: 45,
      grouponPrice: 30,
      merchantPayout: 5.6,
      status: "Paused",
      subtitle: "Most Popular",
      details: "Our most popular option. Perfect for dinner for two.",
      discount: 33,
      enabled: false,
      validity: "Valid for 90 days",
      monthlyCapacity: 200,
      merchantMargin: 45,
      grouponMargin: 55,
    },
    {
      id: "3",
      name: "$100 Toward Dinner - Wentzville Location",
      regularPrice: 100,
      grouponPrice: 60,
      merchantPayout: 5.6,
      status: "Paused",
      subtitle: "Best Value",
      details:
        "Best value for large groups. Perfect for celebrations and special occasions.",
      discount: 40,
      enabled: false,
      validity: "Valid for 90 days",
      monthlyCapacity: 150,
      merchantMargin: 60,
      grouponMargin: 40,
    },
  ],
  stats: {
      revenue: 14400,
      purchases: 320,
      views: 119680,
      conversionRate: 0.27,
      revenuePerView: 0.12,
      likes: 96,
      chartData: [],
    },
  roles: {
    accountOwner: "Unassigned",
    writer: "John Peterson",
    imageDesigner: "Aartiya Johrison",
    opportunityOwner: "Aanya Kublikova",
  },
  recommendations: [
    {
      id: "1",
      priority: "HIGH",
      category: "Clarity",
      title: "Clarify and broaden the food variety in the description",
      description:
        "highlighting popular menu items and options for different dietary preferences (e.g., vegan, gluten-free).",
      details:
        "Current description only mentions slow-cooked pork and beef. It might be an exaggeration or one-sided. Vegetarians or people lacking for variety: Customers want to understand the full range of the menu, which is essential to its appeal.",
      status: "pending",
    },
    {
      id: "2",
      priority: "MEDIUM",
      category: "Pricing",
      title: "Reframe the value proposition in the description",
      description:
        "emphasize savings (e.g., 'Save up to 40% on your meal'), and mention both voucher denominations for flexibility and choice.",
      details:
        "The description references 'up to $6-20% off' but does not specify explicit savings in a meaningful way that. Explicit value statements and direct comparison help customers quickly recognize the value and act.",
      status: "pending",
    },
    {
      id: "3",
      priority: "LOW",
      category: "Other",
      title:
        "Specify more about the restaurant setting, ambiance, or signature aspects",
      description:
        "(e.g., 'Family-friendly atmosphere, quick service, and fresh ingredients that make this experience is special.'",
      details:
        "Current description only vaguely (lights, It lacks unique selling points about atmosphere or setting, which could build excitement and trust.",
      status: "pending",
    },
    {
      id: "4",
      priority: "LOW",
      category: "Other",
      title: "Add restrictions or usage details directly in the description",
      description:
        "(e.g., 'valid any day for dine-in or carryout; not valid with other offers.'). Mention voucher expiry upfront.",
      details:
        "Crucial usage details are buried in fine print. Customers often skip this and only reflect discounts first, causing frustration, building trust and reducing abandonment.",
      status: "pending",
    },
    {
      id: "5",
      priority: "LOW",
      category: "Pricing",
      title: "For each option, briefly state the deal's value",
      description:
        "(e.g., '$15 value for just $10—33% off!' and '$30 value for $24—20% off!').",
      details:
        "Options list price and discount, but lack an at-a-glance reinforcement of savings in the title or subcopy helps users appreciate the bargain without doing math.",
      status: "pending",
    },
  ],
  content: {
    description:
      "<p>Experience the vibrant flavors of authentic Mexican cuisine at Chimi's Fresh-Mex in Wentzville. This exclusive deal gets you up to $45 towards a delicious dinner featuring slow-cooked meats, fresh ingredients, and our famous margaritas.</p><p><strong>What Makes Us Special:</strong></p><ul><li>Authentic recipes passed down through generations</li><li>Fresh ingredients prepared daily</li><li>Award-winning margaritas and extensive tequila selection</li><li>Family-friendly atmosphere perfect for any occasion</li></ul>",
    media: [
      {
        id: "1",
        url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
        isFeatured: true,
        caption: "Delicious Mexican cuisine",
        source: "upload",
        type: "image",
        score: 94,
        scoreReason: "Outstanding image quality with perfect focus and vibrant colors",
      },
      {
        id: "2",
        url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80",
        caption: "Fresh ingredients daily",
        source: "upload",
        type: "image",
        score: 88,
        scoreReason: "Good resolution and composition, clear subject matter",
      },
      {
        id: "3",
        url: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80",
        caption: "Premium grilled meats",
        source: "upload",
        type: "image",
        score: 91,
        scoreReason: "High resolution, professional composition, excellent lighting",
      },
    ],
    highlights: [
      {
        id: "1",
        text: "Up to $45 towards authentic Mexican dinner",
        icon: "✓",
      },
      {
        id: "2",
        text: "Choose from tacos, burritos, enchiladas, and more",
        icon: "✓",
      },
      {
        id: "3",
        text: "Famous margaritas and full bar available",
        icon: "✓",
      },
      {
        id: "4",
        text: "Fresh ingredients and traditional recipes",
        icon: "✓",
      },
      {
        id: "5",
        text: "Family-friendly atmosphere",
        icon: "✓",
      },
    ],
    finePoints: [
      {
        id: "1",
        text: "Valid for dine-in only at Wentzville location",
      },
      {
        id: "2",
        text: "Promotional value expires 90 days after purchase",
      },
      {
        id: "3",
        text: "Amount paid never expires",
      },
      {
        id: "4",
        text: "Limit 1 per person, may buy 2 additional as gifts",
      },
      {
        id: "5",
        text: "Not valid with other offers or on alcohol",
      },
      {
        id: "6",
        text: "Reservation recommended for parties of 6 or more",
      },
    ],
  },
};

export const getMockDeal = (id: string): Deal => {
  // Find the deal by ID from the deals array
  const deal = deals.find((d) => d.id === id);
  if (deal) {
    return deal;
  }

  // Fallback to the first deal if ID not found
  return { ...mockDeal, id };
};

// Export a list of sample deals for selection (e.g., in duplicate modal)
export const deals: Deal[] = [
  mockDeal,
  {
    ...mockDeal,
    id: "2",
    title: "Luxury Spa Day Package - 60-Minute Massage & Facial Treatment",
    galleryTitle:
      "Luxury Spa Day Package - 60-Minute Massage & Facial Treatment",
    shortDescriptor: "Relax and rejuvenate with our premium spa services",
    descriptor:
      "Luxury Spa Day Package - 60-Minute Massage & Facial Treatment at Serenity Spa",
    location: "Serenity Spa, Chicago",
    accountId: "merchant-002",
    locationIds: getAccountLocationIds("merchant-2"),
    category: "Health & Beauty",
    subcategory: "Spa",
    division: "Chicago (USA)",
    pos: "Spa Services",
    web: "serenityspa.com",
    dealStart: "15. 8. 2024",
    dealEnd: "15. 12. 2024",
    quality: "Good",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 7120,
      purchases: 178,
      views: 63724,
      conversionRate: 0.28,
      revenuePerView: 0.11,
      likes: 68,
      chartData: [],
    },
    options: [
      {
        id: "1",
        name: "60-Minute Swedish Massage",
        regularPrice: 120,
        grouponPrice: 75,
        merchantPayout: 60,
        status: "Live",
        subtitle: "Most Popular",
        details: "Relaxing full-body massage to relieve stress and tension.",
        discount: 37,
        enabled: true,
        validity: "Valid for 6 months",
        monthlyCapacity: 50,
        merchantMargin: 50,
        grouponMargin: 50,
      },
      {
        id: "2",
        name: "Facial Treatment Package",
        regularPrice: 100,
        grouponPrice: 65,
        merchantPayout: 52,
        status: "Live",
        subtitle: "Rejuvenating",
        details: "Deep cleansing facial with premium skincare products.",
        discount: 35,
        enabled: true,
        validity: "Valid for 6 months",
        monthlyCapacity: 40,
        merchantMargin: 52,
        grouponMargin: 48,
      },
    ],
    content: {
      description:
        "<p>Indulge in a luxurious spa experience at Serenity Spa & Wellness. Our expert therapists provide personalized treatments using premium products to help you relax, rejuvenate, and restore your natural glow.</p><p><strong>What's Included:</strong></p><ul><li>Professional massage therapy by certified therapists</li><li>Customized facial treatments for your skin type</li><li>Relaxing ambiance with aromatherapy</li><li>Complimentary herbal tea and light refreshments</li></ul>",
      media: [
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
          isFeatured: true,
          caption: "Luxury spa treatment room",
          source: "spa",
          type: "image",
        },
        {
          id: "2",
          url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
          caption: "Relaxing spa ambiance",
          source: "ai",
          type: "image",
        },
      ],
      highlights: [
        {
          id: "1",
          text: "60-minute professional massage therapy",
          icon: "✓",
        },
        {
          id: "2",
          text: "Customized facial treatment",
          icon: "✓",
        },
        {
          id: "3",
          text: "Premium skincare products",
          icon: "✓",
        },
        {
          id: "4",
          text: "Relaxing aromatherapy environment",
          icon: "✓",
        },
      ],
      finePoints: [
        {
          id: "1",
          text: "Valid for 6 months from purchase date",
        },
        {
          id: "2",
          text: "Advance booking required",
        },
        {
          id: "3",
          text: "Not valid with other offers",
        },
        {
          id: "4",
          text: "Gratuity not included",
        },
      ],
    },
  },
  {
    ...mockDeal,
    id: "3",
    title: "Italian Fine Dining Experience - 3-Course Dinner for Two with Wine",
    galleryTitle:
      "Italian Fine Dining Experience - 3-Course Dinner for Two with Wine",
    shortDescriptor: "Authentic Italian cuisine in romantic setting",
    descriptor:
      "Italian Fine Dining Experience - 3-Course Dinner for Two with Wine at Bella Italia",
    location: "Bella Italia, Chicago",
    accountId: "merchant-003",
    locationIds: getAccountLocationIds("merchant-3"),
    category: "Food & Drink",
    subcategory: "Restaurant",
    division: "Chicago (USA)",
    pos: "Italian",
    web: "bellaitalia.com",
    dealStart: "1. 9. 2024",
    dealEnd: "31. 12. 2024",
    quality: "Ace",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 85560,
      purchases: 713,
      views: 163990,
      conversionRate: 0.43,
      revenuePerView: 0.52,
      likes: 98,
      chartData: [],
    },
    options: [
      {
        id: "1",
        name: "3-Course Dinner for Two",
        regularPrice: 180,
        grouponPrice: 120,
        merchantPayout: 90,
        status: "Live",
        subtitle: "Romantic Dinner",
        details:
          "Appetizer, main course, and dessert for two with wine selection.",
        discount: 33,
        enabled: true,
        validity: "Valid for 3 months",
        monthlyCapacity: 30,
        merchantMargin: 50,
        grouponMargin: 50,
      },
    ],
    content: {
      description:
        "<p>Experience the romance of authentic Italian cuisine at Bella Italia Ristorante. Our chef creates traditional dishes using imported ingredients and time-honored recipes passed down through generations.</p><p><strong>Menu Highlights:</strong></p><ul><li>Fresh handmade pasta and risotto</li><li>Premium Italian wines and cocktails</li><li>Seasonal ingredients from local and Italian suppliers</li><li>Intimate dining atmosphere perfect for special occasions</li></ul>",
      media: [
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80",
          isFeatured: true,
          caption: "Authentic Italian pasta",
          source: "upload",
          type: "image",
        },
        {
          id: "2",
          url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
          caption: "Elegant dining room",
          source: "upload",
          type: "image",
        },
      ],
      highlights: [
        {
          id: "1",
          text: "3-course dinner for two people",
          icon: "✓",
        },
        {
          id: "2",
          text: "Wine pairing included",
          icon: "✓",
        },
        {
          id: "3",
          text: "Handmade pasta and authentic recipes",
          icon: "✓",
        },
        {
          id: "4",
          text: "Romantic atmosphere",
          icon: "✓",
        },
      ],
      finePoints: [
        {
          id: "1",
          text: "Valid for 3 months from purchase date",
        },
        {
          id: "2",
          text: "Reservation required",
        },
        {
          id: "3",
          text: "Not valid on holidays or special events",
        },
        {
          id: "4",
          text: "Gratuity not included",
        },
      ],
    },
  },
  {
    ...mockDeal,
    id: "4",
    title: "Fitness Bootcamp Package - 10 Personal Training Sessions",
    galleryTitle: "Fitness Bootcamp Package - 10 Personal Training Sessions",
    shortDescriptor: "Transform your fitness with professional training",
    descriptor:
      "Fitness Bootcamp Package - 10 Personal Training Sessions at FitZone Performance Gym",
    location: "FitZone Gym, Chicago",
    accountId: "merchant-004",
    locationIds: getAccountLocationIds("merchant-4"),
    category: "Health & Fitness",
    subcategory: "Gym",
    division: "Chicago (USA)",
    pos: "Fitness",
    web: "fitzone.com",
    dealStart: "10. 9. 2024",
    dealEnd: "10. 3. 2025",
    quality: "Good",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 85560,
      purchases: 713,
      views: 163990,
      conversionRate: 0.43,
      revenuePerView: 0.52,
      likes: 98,
      chartData: [],
    },
    options: [
      {
        id: "1",
        name: "10 Personal Training Sessions",
        regularPrice: 800,
        grouponPrice: 500,
        merchantPayout: 400,
        status: "Live",
        subtitle: "Complete Transformation",
        details:
          "One-on-one training sessions with certified personal trainers.",
        discount: 37,
        enabled: true,
        validity: "Valid for 6 months",
        monthlyCapacity: 20,
        merchantMargin: 50,
        grouponMargin: 50,
      },
    ],
    content: {
      description:
        "<p>Transform your fitness journey with professional personal training at FitZone Performance Gym. Our certified trainers will create a customized workout plan to help you achieve your health and fitness goals.</p><p><strong>Training Includes:</strong></p><ul><li>Personalized fitness assessment and goal setting</li><li>Custom workout plans tailored to your needs</li><li>Nutrition guidance and meal planning</li><li>Progress tracking and motivation</li></ul>",
      media: [
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
          isFeatured: true,
          caption: "State-of-the-art gym equipment",
          source: "fitness",
          type: "image",
        },
        {
          id: "2",
          url: "/videos/cooking-process.mp4",
          caption: "Personal training in action",
          source: "upload",
          type: "video",
        },
      ],
      highlights: [
        {
          id: "1",
          text: "10 one-on-one training sessions",
          icon: "✓",
        },
        {
          id: "2",
          text: "Certified personal trainers",
          icon: "✓",
        },
        {
          id: "3",
          text: "Customized workout plans",
          icon: "✓",
        },
        {
          id: "4",
          text: "Nutrition guidance included",
          icon: "✓",
        },
      ],
      finePoints: [
        {
          id: "1",
          text: "Valid for 6 months from purchase date",
        },
        {
          id: "2",
          text: "Sessions must be scheduled in advance",
        },
        {
          id: "3",
          text: "24-hour cancellation policy",
        },
        {
          id: "4",
          text: "Not transferable to other individuals",
        },
      ],
    },
  },
  {
    ...mockDeal,
    id: "5",
    title: "Complete Hair Makeover - Cut, Color, and Style Package",
    galleryTitle: "Complete Hair Makeover - Cut, Color, and Style Package",
    shortDescriptor: "Professional hair services for a new look",
    descriptor:
      "Complete Hair Makeover - Cut, Color, and Style Package at Glam Studio",
    location: "Glam Studio, Chicago",
    accountId: "merchant-005",
    locationIds: getAccountLocationIds("merchant-5"),
    category: "Health & Beauty",
    subcategory: "Salon",
    division: "Chicago (USA)",
    pos: "Hair Services",
    web: "glamstudio.com",
    dealStart: "20. 8. 2024",
    dealEnd: "20. 2. 2025",
    quality: "Good",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 39168,
      purchases: 288,
      views: 87264,
      conversionRate: 0.33,
      revenuePerView: 0.45,
      likes: 101,
      chartData: [],
    },
    options: [
      {
        id: "1",
        name: "Complete Hair Makeover",
        regularPrice: 200,
        grouponPrice: 130,
        merchantPayout: 104,
        status: "Live",
        subtitle: "Full Service",
        details: "Cut, color, and style by professional stylists.",
        discount: 35,
        enabled: true,
        validity: "Valid for 4 months",
        monthlyCapacity: 25,
        merchantMargin: 52,
        grouponMargin: 48,
      },
    ],
    content: {
      description:
        "<p>Transform your look with our complete hair makeover package at Glam Studio. Our expert stylists will give you a fresh, modern look that enhances your natural beauty and boosts your confidence.</p><p><strong>Services Include:</strong></p><ul><li>Professional hair consultation and color analysis</li><li>Precision cut and styling</li><li>Premium hair coloring and treatments</li><li>Styling tips and maintenance advice</li></ul>",
      media: [
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80",
          isFeatured: true,
          caption: "Professional hair styling",
          source: "ai",
          type: "image",
        },
        {
          id: "2",
          url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
          caption: "Hair color transformation",
          source: "ai",
          type: "image",
        },
      ],
      highlights: [
        {
          id: "1",
          text: "Professional hair consultation",
          icon: "✓",
        },
        {
          id: "2",
          text: "Cut, color, and style included",
          icon: "✓",
        },
        {
          id: "3",
          text: "Premium hair products used",
          icon: "✓",
        },
        {
          id: "4",
          text: "Styling tips and maintenance advice",
          icon: "✓",
        },
      ],
      finePoints: [
        {
          id: "1",
          text: "Valid for 4 months from purchase date",
        },
        {
          id: "2",
          text: "Appointment required",
        },
        {
          id: "3",
          text: "Not valid with other offers",
        },
        {
          id: "4",
          text: "Gratuity not included",
        },
      ],
    },
  },
  {
    ...mockDeal,
    id: "6",
    title: "Adventure Day Package - Zip-lining and Rock Climbing Experience",
    galleryTitle:
      "Adventure Day Package - Zip-lining and Rock Climbing Experience",
    shortDescriptor: "Thrilling outdoor adventure activities",
    descriptor:
      "Adventure Day Package - Zip-lining and Rock Climbing Experience at Adventure Escapes",
    location: "Adventure Escapes, Chicago",
    accountId: "merchant-006",
    locationIds: getAccountLocationIds("merchant-6"),
    category: "Activities & Entertainment",
    subcategory: "Adventure",
    division: "Chicago (USA)",
    pos: "Adventure",
    web: "adventureescapes.com",
    dealStart: "5. 9. 2024",
    dealEnd: "5. 11. 2024",
    quality: "Ace",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 7120,
      purchases: 178,
      views: 63724,
      conversionRate: 0.28,
      revenuePerView: 0.11,
      likes: 68,
      chartData: [],
    },
    options: [
      {
        id: "1",
        name: "Full Day Adventure Package",
        regularPrice: 150,
        grouponPrice: 95,
        merchantPayout: 76,
        status: "Live",
        subtitle: "Ultimate Adventure",
        details:
          "Zip-lining course and rock climbing session with professional guides.",
        discount: 36,
        enabled: true,
        validity: "Valid for 2 months",
        monthlyCapacity: 40,
        merchantMargin: 50,
        grouponMargin: 50,
      },
    ],
    content: {
      description:
        "<p>Experience the thrill of outdoor adventure with our comprehensive adventure package. Professional guides will lead you through exciting zip-lining courses and rock climbing challenges in the beautiful Colorado landscape.</p><p><strong>Adventure Activities:</strong></p><ul><li>Multi-line zip-lining course through forest canopy</li><li>Rock climbing with safety equipment and instruction</li><li>Professional guides and safety briefings</li><li>Scenic views and photo opportunities</li></ul>",
      media: [
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
          isFeatured: true,
          caption: "Zip-lining adventure",
          source: "adventure",
          type: "image",
        },
        {
          id: "2",
          url: "/videos/food-preparation.mp4",
          caption: "Rock climbing challenge",
          source: "upload",
          type: "video",
        },
      ],
      highlights: [
        {
          id: "1",
          text: "Multi-line zip-lining course",
          icon: "✓",
        },
        {
          id: "2",
          text: "Rock climbing with instruction",
          icon: "✓",
        },
        {
          id: "3",
          text: "Professional safety equipment",
          icon: "✓",
        },
        {
          id: "4",
          text: "Scenic mountain views",
          icon: "✓",
        },
      ],
      finePoints: [
        {
          id: "1",
          text: "Valid for 2 months from purchase date",
        },
        {
          id: "2",
          text: "Weather dependent - rescheduling available",
        },
        {
          id: "3",
          text: "Minimum age 12 years",
        },
        {
          id: "4",
          text: "Safety waiver required",
        },
      ],
    },
  },
  {
    ...mockDeal,
    id: "7",
    title: "Artisan Coffee & Pastry Experience - Morning Delight Package",
    galleryTitle:
      "Artisan Coffee & Pastry Experience - Morning Delight Package",
    shortDescriptor: "Premium coffee and fresh pastries",
    descriptor:
      "Artisan Coffee & Pastry Experience - Morning Delight Package at The Coffee House",
    location: "The Coffee House, Chicago",
    accountId: "merchant-007",
    locationIds: getAccountLocationIds("merchant-7"),
    category: "Food & Drink",
    subcategory: "Cafe",
    division: "Chicago (USA)",
    pos: "Coffee",
    web: "thecoffeehouse.com",
    dealStart: "12. 8. 2024",
    dealEnd: "12. 12. 2024",
    quality: "Fair",
    status: "Paused",
    campaignStage: "won",
    wonSubStage: "paused",
    options: [
      {
        id: "1",
        name: "Morning Coffee & Pastry Combo",
        regularPrice: 15,
        grouponPrice: 10,
        merchantPayout: 8,
        status: "Paused",
        subtitle: "Perfect Start",
        details: "Premium coffee with fresh baked pastries.",
        discount: 33,
        enabled: false,
        validity: "Valid for 3 months",
        monthlyCapacity: 30,
        merchantMargin: 53,
        grouponMargin: 47,
      },
    ],
    content: {
      description:
        "<p>Start your day right with our artisan coffee and fresh pastry experience at The Coffee House. Our skilled baristas craft the perfect cup using premium beans, paired with freshly baked pastries made daily.</p><p><strong>What's Included:</strong></p><ul><li>Premium artisan coffee of your choice</li><li>Fresh baked pastry selection</li><li>Cozy atmosphere perfect for morning meetings</li><li>Expert barista service</li></ul>",
      media: [
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
          isFeatured: true,
          caption: "Artisan coffee preparation",
          source: "stock",
          type: "image",
        },
        {
          id: "2",
          url: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80",
          caption: "Fresh pastries",
          source: "stock",
          type: "image",
        },
      ],
      highlights: [
        {
          id: "1",
          text: "Premium artisan coffee",
          icon: "✓",
        },
        {
          id: "2",
          text: "Fresh baked pastries",
          icon: "✓",
        },
        {
          id: "3",
          text: "Expert barista service",
          icon: "✓",
        },
        {
          id: "4",
          text: "Cozy morning atmosphere",
          icon: "✓",
        },
      ],
      finePoints: [
        {
          id: "1",
          text: "Valid for 3 months from purchase date",
        },
        {
          id: "2",
          text: "Valid Monday-Friday only",
        },
        {
          id: "3",
          text: "Not valid on holidays",
        },
        {
          id: "4",
          text: "One per person per visit",
        },
      ],
    },
  },
  {
    ...mockDeal,
    id: "8",
    title: "Beachfront Resort Getaway - 2-Night Luxury Stay with Ocean View",
    galleryTitle:
      "Beachfront Resort Getaway - 2-Night Luxury Stay with Ocean View",
    shortDescriptor: "Luxury beachfront accommodation with premium amenities",
    descriptor:
      "Beachfront Resort Getaway - 2-Night Luxury Stay with Ocean View at Ocean View Resort",
    location: "Ocean View Resort, Chicago",
    accountId: "merchant-008",
    locationIds: getAccountLocationIds("merchant-8"),
    category: "Travel & Lodging",
    subcategory: "Hotel",
    division: "Chicago (USA)",
    pos: "Resort",
    web: "oceanviewresort.com",
    dealStart: "1. 10. 2024",
    dealEnd: "31. 3. 2025",
    quality: "Good",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 85455,
      purchases: 633,
      views: 144957,
      conversionRate: 0.44,
      revenuePerView: 0.59,
      likes: 181,
      chartData: [],
    },
    options: [
      {
        id: "1",
        name: "2-Night Ocean View Suite",
        regularPrice: 400,
        grouponPrice: 280,
        merchantPayout: 224,
        status: "Live",
        subtitle: "Luxury Experience",
        details: "2-night stay in ocean view suite with premium amenities.",
        discount: 30,
        enabled: true,
        validity: "Valid for 6 months",
        monthlyCapacity: 20,
        merchantMargin: 56,
        grouponMargin: 44,
      },
    ],
    content: {
      description:
        "<p>Escape to paradise with our beachfront resort getaway at Ocean View Resort. Experience luxury accommodations with stunning ocean views, world-class amenities, and exceptional service in beautiful San Diego.</p><p><strong>Resort Features:</strong></p><ul><li>Luxury ocean view suites with private balconies</li><li>Full-service spa and wellness center</li><li>Multiple dining options with ocean views</li><li>Private beach access and water activities</li></ul>",
      media: [
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
          isFeatured: true,
          caption: "Ocean view suite",
          source: "website",
          type: "image",
        },
        {
          id: "2",
          url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
          caption: "Resort amenities",
          source: "stock",
          type: "image",
        },
      ],
      highlights: [
        {
          id: "1",
          text: "2-night luxury stay",
          icon: "✓",
        },
        {
          id: "2",
          text: "Ocean view suite",
          icon: "✓",
        },
        {
          id: "3",
          text: "Full-service spa access",
          icon: "✓",
        },
        {
          id: "4",
          text: "Private beach access",
          icon: "✓",
        },
      ],
      finePoints: [
        {
          id: "1",
          text: "Valid for 6 months from purchase date",
        },
        {
          id: "2",
          text: "Advance booking required",
        },
        {
          id: "3",
          text: "Subject to availability",
        },
        {
          id: "4",
          text: "Not valid during peak season",
        },
      ],
    },
  },
  {
    ...mockDeal,
    id: "9",
    title: "Sushi Master Class - Learn Traditional Japanese Cuisine",
    galleryTitle: "Sushi Master Class - Learn Traditional Japanese Cuisine",
    shortDescriptor: "Hands-on sushi making experience with expert chef",
    descriptor:
      "Sushi Master Class - Learn Traditional Japanese Cuisine at Tokyo Kitchen",
    location: "Tokyo Kitchen, Chicago",
    accountId: "merchant-009",
    locationIds: getAccountLocationIds("merchant-9"),
    category: "Activities & Entertainment",
    subcategory: "Cooking Class",
    division: "Chicago (USA)",
    pos: "Cooking",
    web: "tokyokitchen.com",
    dealStart: "18. 9. 2024",
    dealEnd: "18. 1. 2025",
    quality: "Ace",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "scheduled",
    options: [
      {
        id: "1",
        name: "Sushi Master Class",
        regularPrice: 120,
        grouponPrice: 80,
        merchantPayout: 64,
        status: "Live",
        subtitle: "Learn from Expert",
        details: "3-hour hands-on sushi making class with professional chef.",
        discount: 33,
        enabled: true,
        validity: "Valid for 4 months",
        monthlyCapacity: 15,
        merchantMargin: 53,
        grouponMargin: 47,
      },
    ],
    content: {
      description:
        "<p>Master the art of sushi making with our hands-on cooking class at Tokyo Kitchen. Learn traditional Japanese techniques from our expert chef and create beautiful, delicious sushi rolls.</p><p><strong>Class Includes:</strong></p><ul><li>3-hour hands-on instruction with professional chef</li><li>All ingredients and tools provided</li><li>Learn to make 3 different sushi types</li><li>Take home your creations</li></ul>",
      media: [
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&q=80",
          isFeatured: true,
          caption: "Sushi making class",
          source: "ai",
          type: "image",
        },
        {
          id: "2",
          url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
          caption: "Fresh ingredients",
          source: "ai",
          type: "image",
        },
      ],
      highlights: [
        {
          id: "1",
          text: "3-hour hands-on class",
          icon: "✓",
        },
        {
          id: "2",
          text: "Expert chef instruction",
          icon: "✓",
        },
        {
          id: "3",
          text: "All ingredients included",
          icon: "✓",
        },
        {
          id: "4",
          text: "Take home your creations",
          icon: "✓",
        },
      ],
      finePoints: [
        {
          id: "1",
          text: "Valid for 4 months from purchase date",
        },
        {
          id: "2",
          text: "Class size limited to 12 people",
        },
        {
          id: "3",
          text: "Advance booking required",
        },
        {
          id: "4",
          text: "Allergen information available upon request",
        },
      ],
    },
  },
  {
    ...mockDeal,
    id: "10",
    title: "Wine Tasting Experience - Premium Vintages and Food Pairings",
    galleryTitle:
      "Wine Tasting Experience - Premium Vintages and Food Pairings",
    shortDescriptor: "Expert-led wine tasting with gourmet food pairings",
    descriptor:
      "Wine Tasting Experience - Premium Vintages and Food Pairings at Napa Valley Cellars",
    location: "Napa Valley Cellars, Chicago",
    accountId: "merchant-10",
    locationIds: getAccountLocationIds("merchant-10"),
    category: "Food & Drink",
    subcategory: "Wine Tasting",
    division: "Chicago (USA)",
    pos: "Wine",
    web: "napavalleycellars.com",
    dealStart: "25. 9. 2024",
    dealEnd: "25. 2. 2025",
    quality: "Ace",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 50850,
      purchases: 450,
      views: 58950,
      conversionRate: 0.76,
      revenuePerView: 0.86,
      likes: 156,
      chartData: [],
    },
    options: [
      {
        id: "1",
        name: "Premium Wine Tasting",
        regularPrice: 80,
        grouponPrice: 55,
        merchantPayout: 44,
        status: "Live",
        subtitle: "Expert Guided",
        details: "2-hour wine tasting with food pairings and expert sommelier.",
        discount: 31,
        enabled: true,
        validity: "Valid for 5 months",
        monthlyCapacity: 25,
        merchantMargin: 55,
        grouponMargin: 45,
      },
    ],
    content: {
      description:
        "<p>Discover the finest wines of Napa Valley with our premium tasting experience at Napa Valley Cellars. Our expert sommelier will guide you through exceptional vintages paired with gourmet food selections.</p><p><strong>Tasting Experience:</strong></p><ul><li>2-hour guided tasting with expert sommelier</li><li>5 premium wine selections</li><li>Gourmet food pairings</li><li>Educational wine knowledge session</li></ul>",
      media: [
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
          isFeatured: true,
          caption: "Wine tasting experience",
          source: "ai",
          type: "image",
        },
        {
          id: "2",
          url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
          caption: "Food pairings",
          source: "ai",
          type: "image",
        },
      ],
      highlights: [
        {
          id: "1",
          text: "2-hour expert-led tasting",
          icon: "✓",
        },
        {
          id: "2",
          text: "5 premium wine selections",
          icon: "✓",
        },
        {
          id: "3",
          text: "Gourmet food pairings",
          icon: "✓",
        },
        {
          id: "4",
          text: "Educational wine knowledge",
          icon: "✓",
        },
      ],
      finePoints: [
        {
          id: "1",
          text: "Valid for 5 months from purchase date",
        },
        {
          id: "2",
          text: "Reservation required",
        },
        {
          id: "3",
          text: "Must be 21+ with valid ID",
        },
        {
          id: "4",
          text: "Not valid on holidays",
        },
      ],
    },
  },
  // Draft deals
  {
    ...mockDeal,
    id: "draft-1",
    title: "Premium Yoga Class Package - 10 Sessions",
    galleryTitle: "Premium Yoga Class Package - 10 Sessions",
    shortDescriptor: "Transform your wellness journey",
    descriptor:
      "Premium Yoga Class Package - 10 Sessions at Zen Wellness Studio",
    location: "Zen Wellness Studio, Chicago",
    accountId: "merchant-11",
    locationIds: getAccountLocationIds("merchant-11"),
    category: "Health & Beauty",
    subcategory: "Yoga",
    division: "Chicago (USA)",
    pos: "Wellness",
    web: "zenwellness.com",
    dealStart: "1. 12. 2024",
    dealEnd: "1. 6. 2025",
    quality: "Good",
    status: "Draft",
    campaignStage: "draft",
    draftSubStage: "presentation",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: {
      revenue: 85560,
      purchases: 713,
      views: 163990,
      conversionRate: 0.43,
      revenuePerView: 0.52,
      likes: 98,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80", isFeatured: true, type: "image" as const, score: 90, scoreReason: "Professional photography with ideal framing and composition" }] },
  },
  {
    ...mockDeal,
    id: "draft-2",
    title: "Car Detailing Service - Interior & Exterior",
    galleryTitle: "Car Detailing Service - Interior & Exterior",
    shortDescriptor: "Professional car care",
    descriptor:
      "Car Detailing Service - Interior & Exterior at AutoShine Pro",
    location: "AutoShine Pro, Chicago",
    accountId: "merchant-12",
    locationIds: getAccountLocationIds("merchant-12"),
    category: "Automotive",
    subcategory: "Detailing",
    division: "Portland (USA)",
    pos: "Auto Care",
    web: "autoshinepro.com",
    dealStart: "15. 12. 2024",
    dealEnd: "15. 6. 2025",
    quality: "Fair",
    status: "Draft",
    campaignStage: "draft",
    draftSubStage: "negotiation",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: {
      revenue: 0,
      purchases: 0,
      revenuePerView: 0,
      conversionRate: 0,
      views: 0,
      likes: 0,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", isFeatured: true, type: "image" as const, score: 85, scoreReason: "Well-lit image with good color balance and sharpness" }] },
  },
  {
    ...mockDeal,
    id: "lost-1",
    title: "Closed Lost Deal - Pet Grooming Package",
    galleryTitle: "Closed Lost Deal - Pet Grooming Package",
    shortDescriptor: "This deal was not closed",
    descriptor: "Pet Grooming Package at Happy Paws Salon",
    location: "Happy Paws Salon, Chicago",
    accountId: "merchant-13",
    locationIds: getAccountLocationIds("merchant-13"),
    category: "Pet Services",
    subcategory: "Grooming",
    division: "Chicago (USA)",
    pos: "Pet Care",
    web: "happypaws.com",
    dealStart: "1. 11. 2024",
    dealEnd: "1. 5. 2025",
    quality: "Fair",
    status: "Closed Lost",
    campaignStage: "lost",
    lostSubStage: "closed_lost",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: {
      revenue: 1200,
      purchases: 28,
      revenuePerView: 0.1,
      conversionRate: 0.23,
      views: 12000,
      likes: 5,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80", isFeatured: true, type: "image" as const, score: 93, scoreReason: "Outstanding image quality with perfect focus and vibrant colors" }] },
  },
  // Additional New York Division Deals
  {
    ...mockDeal,
    id: "11",
    title: "Broadway Show Tickets - Premium Orchestra Seats",
    galleryTitle: "Broadway Show Tickets - Premium Orchestra Seats",
    location: "Chicago Theatre District, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 38520,
      purchases: 428,
      views: 164352,
      conversionRate: 0.26,
      revenuePerView: 0.23,
      likes: 40,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80", isFeatured: true, type: "image" as const, score: 87, scoreReason: "Quality photography with appropriate framing" }] },
  },
  {
    ...mockDeal,
    id: "12",
    title: "NYC Pizza Tour - 5 Famous Pizzerias",
    galleryTitle: "NYC Pizza Tour - 5 Famous Pizzerias",
    location: "Chicago Pizza Tours, Chicago",
    division: "Chicago (USA)",
    category: "Food & Drink",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 41208,
      purchases: 408,
      views: 160344,
      conversionRate: 0.25,
      revenuePerView: 0.26,
      likes: 140,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80", isFeatured: true, type: "image" as const, score: 95, scoreReason: "Exceptional clarity with premium quality and engaging subject" }] },
  },
  {
    ...mockDeal,
    id: "13",
    title: "Central Park Bike Rental - Full Day Pass",
    galleryTitle: "Central Park Bike Rental - Full Day Pass",
    location: "Millennium Park Bikes, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 73680,
      purchases: 921,
      views: 178674,
      conversionRate: 0.52,
      revenuePerView: 0.41,
      likes: 215,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80", isFeatured: true, type: "image" as const, score: 89, scoreReason: "Clear focus with appealing presentation and good lighting" }] },
  },
  {
    ...mockDeal,
    id: "14",
    title: "Manhattan Rooftop Bar Experience",
    galleryTitle: "Manhattan Rooftop Bar Experience",
    location: "SkyBar Chicago, Chicago",
    division: "Chicago (USA)",
    category: "Food & Drink",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 9204,
      purchases: 177,
      views: 35577,
      conversionRate: 0.5,
      revenuePerView: 0.26,
      likes: 108,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80", isFeatured: true, type: "image" as const, score: 92, scoreReason: "High resolution, professional composition, excellent lighting" }] },
  },
  {
    ...mockDeal,
    id: "15",
    title: "Brooklyn Art Gallery Admission & Workshop",
    galleryTitle: "Brooklyn Art Gallery Admission & Workshop",
    location: "Chicago Modern Art, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Draft",
    campaignStage: "draft",
    draftSubStage: "contract_sent",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: {
      revenue: 30348,
      purchases: 562,
      views: 187708,
      conversionRate: 0.3,
      revenuePerView: 0.16,
      likes: 29,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&q=80", isFeatured: true, type: "image" as const, score: 86, scoreReason: "Well-lit image with good color balance and sharpness" }] },
  },
  {
    ...mockDeal,
    id: "16",
    title: "Statue of Liberty & Ellis Island Tour",
    galleryTitle: "Statue of Liberty & Ellis Island Tour",
    location: "Chicago Architecture Tours, Chicago",
    division: "Chicago (USA)",
    category: "Travel & Tourism",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 116688,
      purchases: 884,
      views: 327080,
      conversionRate: 0.27,
      revenuePerView: 0.36,
      likes: 189,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&q=80", isFeatured: true, type: "image" as const, score: 94, scoreReason: "Outstanding image quality with perfect focus and vibrant colors" }] },
  },
  {
    ...mockDeal,
    id: "17",
    title: "NYC Food Market Tour - Chelsea & Union Square",
    galleryTitle: "NYC Food Market Tour - Chelsea & Union Square",
    location: "Chicago Market Tours, Chicago",
    division: "Chicago (USA)",
    category: "Food & Drink",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 114046,
      purchases: 898,
      views: 237970,
      conversionRate: 0.38,
      revenuePerView: 0.48,
      likes: 187,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80", isFeatured: true, type: "image" as const, score: 91, scoreReason: "High resolution, professional composition, excellent lighting" }] },
  },
  {
    ...mockDeal,
    id: "18",
    title: "Times Square Comedy Club Show",
    galleryTitle: "Times Square Comedy Club Show",
    location: "Second City Comedy, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Draft",
    campaignStage: "draft",
    draftSubStage: "negotiation",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: {
      revenue: 15642,
      purchases: 158,
      views: 67624,
      conversionRate: 0.23,
      revenuePerView: 0.23,
      likes: 84,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80", isFeatured: true, type: "image" as const, score: 88, scoreReason: "Good resolution and composition, clear subject matter" }] },
  },
  {
    ...mockDeal,
    id: "19",
    title: "Hudson River Sunset Cruise",
    galleryTitle: "Hudson River Sunset Cruise",
    location: "Chicago River Cruises, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 18680,
      purchases: 467,
      views: 166719,
      conversionRate: 0.28,
      revenuePerView: 0.11,
      likes: 203,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1559599238-308793637427?w=800&q=80", isFeatured: true, type: "image" as const, score: 90, scoreReason: "Professional photography with ideal framing and composition" }] },
  },
  {
    ...mockDeal,
    id: "20",
    title: "Luxury Spa Day - Midtown Manhattan",
    galleryTitle: "Luxury Spa Day - Midtown Manhattan",
    location: "Chicago Wellness Spa, Chicago",
    division: "Chicago (USA)",
    category: "Health & Beauty",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 20808,
      purchases: 289,
      views: 42483,
      conversionRate: 0.68,
      revenuePerView: 0.49,
      likes: 229,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80", isFeatured: true, type: "image" as const, score: 92, scoreReason: "Exceptional clarity with premium quality and engaging subject" }] },
  },
  // Chicago Division
  {
    ...mockDeal,
    id: "21",
    title: "Chicago Deep Dish Pizza Tour",
    galleryTitle: "Chicago Deep Dish Pizza Tour",
    location: "Chicago Food Tours, Chicago",
    division: "Chicago (USA)",
    category: "Food & Drink",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 55200,
      purchases: 460,
      views: 143060,
      conversionRate: 0.32,
      revenuePerView: 0.39,
      likes: 123,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80", isFeatured: true, type: "image" as const, score: 94, scoreReason: "Outstanding image quality with perfect focus and vibrant colors" }] },
  },
  {
    ...mockDeal,
    id: "22",
    title: "Willis Tower Skydeck Experience",
    galleryTitle: "Willis Tower Skydeck Experience",
    location: "Willis Tower, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 23400,
      purchases: 600,
      views: 184200,
      conversionRate: 0.33,
      revenuePerView: 0.13,
      likes: 28,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&q=80", isFeatured: true, type: "image" as const, score: 91, scoreReason: "High resolution, professional composition, excellent lighting" }] },
  },
  {
    ...mockDeal,
    id: "23",
    title: "Chicago Blues Bar Evening",
    galleryTitle: "Chicago Blues Bar Evening",
    location: "Blues Heaven, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Draft",
    campaignStage: "draft",
    draftSubStage: "proposal",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: {
      revenue: 54948,
      purchases: 723,
      views: 88929,
      conversionRate: 0.81,
      revenuePerView: 0.62,
      likes: 173,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80", isFeatured: true, type: "image" as const, score: 87, scoreReason: "Quality photography with appropriate framing" }] },
  },
  {
    ...mockDeal,
    id: "24",
    title: "Lake Michigan Boat Tour",
    galleryTitle: "Lake Michigan Boat Tour",
    location: "Chicago Cruises, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 66880,
      purchases: 608,
      views: 259008,
      conversionRate: 0.23,
      revenuePerView: 0.26,
      likes: 164,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80", isFeatured: true, type: "image" as const, score: 95, scoreReason: "Exceptional clarity with premium quality and engaging subject" }] },
  },
  // LA Division
  {
    ...mockDeal,
    id: "25",
    title: "Hollywood Studio Tour - Behind the Scenes",
    galleryTitle: "Hollywood Studio Tour - Behind the Scenes",
    location: "Chicago Studios, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 13184,
      purchases: 206,
      views: 30900,
      conversionRate: 0.67,
      revenuePerView: 0.43,
      likes: 247,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80", isFeatured: true, type: "image" as const, score: 89, scoreReason: "Clear focus with appealing presentation and good lighting" }] },
  },
  {
    ...mockDeal,
    id: "26",
    title: "Santa Monica Pier & Beach Day Package",
    galleryTitle: "Santa Monica Pier & Beach Day Package",
    location: "Chicago Beach Services, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 18620,
      purchases: 266,
      views: 66500,
      conversionRate: 0.4,
      revenuePerView: 0.28,
      likes: 59,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", isFeatured: true, type: "image" as const, score: 93, scoreReason: "Professional photography with ideal framing and composition" }] },
  },
  {
    ...mockDeal,
    id: "27",
    title: "Beverly Hills Shopping Tour with Lunch",
    galleryTitle: "Beverly Hills Shopping Tour with Lunch",
    location: "Magnificent Mile Tours, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Draft",
    campaignStage: "draft",
    draftSubStage: "presentation",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: {
      revenue: 36895,
      purchases: 785,
      views: 238640,
      conversionRate: 0.33,
      revenuePerView: 0.15,
      likes: 20,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80", isFeatured: true, type: "image" as const, score: 86, scoreReason: "Well-lit image with good color balance and sharpness" }] },
  },
  {
    ...mockDeal,
    id: "28",
    title: "Griffith Observatory & Planetarium Show",
    galleryTitle: "Griffith Observatory & Planetarium Show",
    location: "Adler Planetarium, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Live",
    campaignStage: "won",
    wonSubStage: "live",
    stats: {
      revenue: 27225,
      purchases: 495,
      views: 171765,
      conversionRate: 0.29,
      revenuePerView: 0.16,
      likes: 221,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1560252829-804f1aedf1be?w=800&q=80", isFeatured: true, type: "image" as const, score: 90, scoreReason: "Good resolution and composition, clear subject matter" }] },
  },
  // More Draft Deals
  {
    ...mockDeal,
    id: "draft-3",
    title: "Premium Car Wash & Detailing Service",
    galleryTitle: "Premium Car Wash & Detailing Service",
    location: "AutoShine Pro, Chicago",
    division: "Chicago (USA)",
    category: "Automotive",
    status: "Draft",
    campaignStage: "draft",
    draftSubStage: "needs_assessment",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: { 
      revenue: 0, 
      purchases: 0, 
      views: 0,
      revenuePerView: 0,
      conversionRate: 0,
      likes: 0,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80", isFeatured: true, type: "image" as const, score: 85, scoreReason: "Quality photography with appropriate framing" }] },
  },
  {
    ...mockDeal,
    id: "draft-4",
    title: "Italian Cooking Class - Homemade Pasta",
    galleryTitle: "Italian Cooking Class - Homemade Pasta",
    location: "Cucina Italiana, Chicago",
    division: "Chicago (USA)",
    category: "Food & Drink",
    status: "Draft",
    campaignStage: "draft",
    draftSubStage: "appointment",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: { 
      revenue: 0, 
      purchases: 0, 
      views: 0,
      revenuePerView: 0,
      conversionRate: 0,
      likes: 0,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80", isFeatured: true, type: "image" as const, score: 92, scoreReason: "High resolution, professional composition, excellent lighting" }] },
  },
  {
    ...mockDeal,
    id: "draft-5",
    title: "Personal Training Package - 20 Sessions",
    galleryTitle: "Personal Training Package - 20 Sessions",
    location: "Elite Fitness, Chicago",
    division: "Chicago (USA)",
    category: "Health & Beauty",
    status: "Draft",
    campaignStage: "draft",
    draftSubStage: "contract_signed",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: { 
      revenue: 0, 
      purchases: 0, 
      views: 0,
      revenuePerView: 0,
      conversionRate: 0,
      likes: 0,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80", isFeatured: true, type: "image" as const, score: 92, scoreReason: "Exceptional clarity with premium quality and engaging subject" }] },
  },
  // More Lost Deals
  {
    ...mockDeal,
    id: "lost-2",
    title: "Indoor Climbing Wall Access - Monthly Pass",
    galleryTitle: "Indoor Climbing Wall Access - Monthly Pass",
    location: "Vertical Adventures, Chicago",
    division: "Chicago (USA)",
    category: "Activities & Entertainment",
    status: "Closed Lost",
    campaignStage: "lost",
    lostSubStage: "closed_lost",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: { 
      revenue: 2500, 
      purchases: 45, 
      views: 18000,
      revenuePerView: 0.14,
      conversionRate: 0.25,
      likes: 3,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80", isFeatured: true, type: "image" as const, score: 88, scoreReason: "Clear focus with appealing presentation and good lighting" }] },
  },
  {
    ...mockDeal,
    id: "lost-3",
    title: "Photography Workshop - DSLR Basics",
    galleryTitle: "Photography Workshop - DSLR Basics",
    location: "Chicago Photo School, Chicago",
    division: "Chicago (USA)",
    category: "Education",
    status: "Closed Lost",
    campaignStage: "lost",
    lostSubStage: "closed_lost",
    wonSubStage: undefined, // Clear inherited value from mockDeal
    stats: { 
      revenue: 1200, 
      purchases: 28, 
      views: 12000,
      revenuePerView: 0.1,
      conversionRate: 0.23,
      likes: 2,
      chartData: [],
    },
    content: { ...mockDeal.content, media: [{ id: "1", url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80", isFeatured: true, type: "image" as const, score: 84, scoreReason: "Good resolution and composition, clear subject matter" }] },
  },
  ...extendedMockDeals,
];
