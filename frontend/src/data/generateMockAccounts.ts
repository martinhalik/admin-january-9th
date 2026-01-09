import { MerchantAccount, MerchantPotential } from "./merchantAccounts";

/**
 * Generate 500 realistic mock merchant accounts
 * - 80%+ inactive (1+ years since last deal)
 * - Variety of business types, locations, and potential levels
 * - Realistic date ranges and activity patterns
 */

const businessTypes = [
  "Restaurant",
  "Cafe",
  "Bar",
  "Fine Dining",
  "Mexican Restaurant",
  "Italian Restaurant",
  "Sushi Restaurant",
  "Thai Restaurant",
  "Pizza Restaurant",
  "Burger Restaurant",
  "Spa & Beauty",
  "Spa",
  "Hair Salon",
  "Nail Salon",
  "Massage",
  "Barbershop",
  "Beauty Studio",
  "Fitness & Health",
  "Gym",
  "Yoga Studio",
  "Pilates Studio",
  "CrossFit",
  "Boxing Gym",
  "Activities & Entertainment",
  "Adventure",
  "Tours",
  "Hotel & Lodging",
  "Bowling Alley",
  "Mini Golf",
  "Escape Room",
  "Karaoke",
  "Comedy Club",
  "Movie Theater",
  "Electronics",
  "Fashion",
  "Home Goods",
  "Pet Services",
  "Car Wash",
  "Auto Detailing",
];

const cities = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
  "Austin, TX",
  "Jacksonville, FL",
  "Fort Worth, TX",
  "Columbus, OH",
  "Charlotte, NC",
  "San Francisco, CA",
  "Indianapolis, IN",
  "Seattle, WA",
  "Denver, CO",
  "Washington, DC",
  "Boston, MA",
  "El Paso, TX",
  "Nashville, TN",
  "Detroit, MI",
  "Portland, OR",
  "Las Vegas, NV",
  "Memphis, TN",
  "Louisville, KY",
  "Baltimore, MD",
  "Milwaukee, WI",
  "Albuquerque, NM",
  "Tucson, AZ",
  "Fresno, CA",
  "Mesa, AZ",
  "Sacramento, CA",
  "Atlanta, GA",
  "Kansas City, MO",
  "Colorado Springs, CO",
  "Omaha, NE",
  "Raleigh, NC",
  "Miami, FL",
  "Oakland, CA",
  "Minneapolis, MN",
  "Tulsa, OK",
  "Wichita, KS",
  "New Orleans, LA",
];

const firstNames = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "David", "Barbara", "William", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Lisa", "Daniel", "Nancy",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Kimberly", "Andrew", "Emily", "Paul", "Donna", "Joshua", "Michelle",
  "Carlos", "Maria", "Jose", "Sofia", "Luis", "Isabella", "Antonio", "Olivia",
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
  "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
];

const businessNamePrefixes = [
  "The", "Golden", "Silver", "Blue", "Green", "Red", "Urban", "Downtown", "Elite",
  "Premium", "Royal", "Classic", "Modern", "Luxury", "Fresh", "Sunny", "Happy",
  "Cozy", "Rustic", "Vintage", "New", "Old", "Grand", "Little", "Big",
];

const businessNameSuffixes = [
  "Spot", "Place", "Corner", "Hub", "Zone", "Center", "Studio", "Palace", "House",
  "Kitchen", "Bar", "Grill", "Bistro", "Cafe", "Shop", "Store", "Club", "Lounge",
  "Spa", "Salon", "Gym", "Fitness", "Express", "Plus", "Pro", "World",
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBusinessName(businessType: string): string {
  const type = businessType.split(' ')[0]; // Get first word (Restaurant, Spa, Gym, etc.)
  
  if (Math.random() > 0.5) {
    return `${randomElement(businessNamePrefixes)} ${randomElement(businessNameSuffixes)}`;
  } else {
    return `${randomElement(firstNames)}'s ${type}`;
  }
}

function generatePotential(
  lastDealMonthsAgo: number,
  dealsCount: number
): { potential: MerchantPotential; score: number } {
  let baseScore = randomInt(45, 95);
  
  // Inactive accounts tend to have lower scores
  if (lastDealMonthsAgo > 24) {
    baseScore = randomInt(40, 70);
  } else if (lastDealMonthsAgo > 12) {
    baseScore = randomInt(50, 80);
  }
  
  // More deals = potentially higher score
  if (dealsCount > 10) {
    baseScore = Math.min(95, baseScore + 10);
  }
  
  let potential: MerchantPotential;
  if (baseScore >= 75) {
    potential = "high";
  } else if (baseScore >= 60) {
    potential = "mid";
  } else {
    potential = "low";
  }
  
  return { potential, score: baseScore };
}

function monthsAgoToDate(monthsAgo: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date.toISOString().split('T')[0];
}

// Logo mappings by business type - using Unsplash images
const businessTypeLogos: Record<string, string[]> = {
  "Restaurant": [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200&h=200&fit=crop&auto=format",
  ],
  "Mexican Restaurant": [
    "https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=200&h=200&fit=crop&auto=format",
  ],
  "Italian Restaurant": [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&auto=format",
  ],
  "Sushi Restaurant": [
    "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop&auto=format",
  ],
  "Thai Restaurant": [
    "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=200&h=200&fit=crop&auto=format",
  ],
  "Pizza Restaurant": [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop&auto=format",
  ],
  "Burger Restaurant": [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop&auto=format",
  ],
  "Cafe": [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop&auto=format",
  ],
  "Bar": [
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&h=200&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=200&h=200&fit=crop&auto=format",
  ],
  "Fine Dining": [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&auto=format",
  ],
  "Spa & Beauty": [
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&h=200&fit=crop&auto=format",
  ],
  "Spa": [
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&h=200&fit=crop&auto=format",
  ],
  "Hair Salon": [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop&auto=format",
  ],
  "Nail Salon": [
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&h=200&fit=crop&auto=format",
  ],
  "Massage": [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&h=200&fit=crop&auto=format",
  ],
  "Barbershop": [
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop&auto=format",
  ],
  "Beauty Studio": [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop&auto=format",
  ],
  "Fitness & Health": [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop&auto=format",
  ],
  "Gym": [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop&auto=format",
  ],
  "Yoga Studio": [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop&auto=format",
  ],
  "Pilates Studio": [
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop&auto=format",
  ],
  "CrossFit": [
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop&auto=format",
  ],
  "Boxing Gym": [
    "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&h=200&fit=crop&auto=format",
  ],
  "Activities & Entertainment": [
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&h=200&fit=crop&auto=format",
  ],
  "Adventure": [
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&h=200&fit=crop&auto=format",
  ],
  "Tours": [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&h=200&fit=crop&auto=format",
  ],
  "Hotel & Lodging": [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=200&h=200&fit=crop&auto=format",
  ],
  "Bowling Alley": [
    "https://images.unsplash.com/photo-1564279433317-ed5e2b3b8c32?w=200&h=200&fit=crop&auto=format",
  ],
  "Mini Golf": [
    "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=200&h=200&fit=crop&auto=format",
  ],
  "Escape Room": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&auto=format",
  ],
  "Karaoke": [
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200&h=200&fit=crop&auto=format",
  ],
  "Comedy Club": [
    "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=200&h=200&fit=crop&auto=format",
  ],
  "Movie Theater": [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=200&fit=crop&auto=format",
  ],
  "Electronics": [
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200&h=200&fit=crop&auto=format",
  ],
  "Fashion": [
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200&h=200&fit=crop&auto=format",
  ],
  "Home Goods": [
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&h=200&fit=crop&auto=format",
  ],
  "Pet Services": [
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop&auto=format",
  ],
  "Car Wash": [
    "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=200&h=200&fit=crop&auto=format",
  ],
  "Auto Detailing": [
    "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=200&h=200&fit=crop&auto=format",
  ],
};

function getLogoForBusinessType(businessType: string): string {
  const logos = businessTypeLogos[businessType] || businessTypeLogos["Restaurant"];
  return randomElement(logos);
}

export function generateMockAccounts(count: number = 500): MerchantAccount[] {
  const accounts: MerchantAccount[] = [];
  
  for (let i = 0; i < count; i++) {
    const accountNum = i + 100; // Start from merchant-100
    const businessType = randomElement(businessTypes);
    const businessName = generateBusinessName(businessType);
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const city = randomElement(cities);
    
    // Determine activity status
    // 10% active (0-3 months), 10% recent (3-12 months), 80% inactive (12+ months)
    const rand = Math.random();
    let lastDealMonthsAgo: number;
    let lastContactMonthsAgo: number;
    
    if (rand < 0.10) {
      // Active - within 3 months
      lastDealMonthsAgo = randomInt(0, 3);
      lastContactMonthsAgo = randomInt(0, 2);
    } else if (rand < 0.20) {
      // Recent - 3-12 months
      lastDealMonthsAgo = randomInt(3, 12);
      lastContactMonthsAgo = randomInt(2, 9);
    } else {
      // Inactive - 12+ months (most common)
      lastDealMonthsAgo = randomInt(12, 48); // 1-4 years ago
      lastContactMonthsAgo = randomInt(6, 36); // 6 months to 3 years ago
    }
    
    const dealsCount = lastDealMonthsAgo > 24 ? randomInt(1, 5) : randomInt(3, 15);
    const { potential, score } = generatePotential(lastDealMonthsAgo, dealsCount);
    
    // Created date should be before last deal date
    const createdMonthsAgo = lastDealMonthsAgo + randomInt(6, 36);
    
    // Generate social network data (90% of businesses have social media presence)
    const hasSocialMedia = Math.random() > 0.1;
    const socialData = hasSocialMedia ? {
      googleMaps: {
        stars: Number((3.2 + Math.random() * 1.6).toFixed(1)), // 3.2 to 4.8 stars
        reviews: randomInt(50, 2500),
        address: `${randomInt(100, 9999)} ${randomElement(['Main', 'Broadway', 'Market', 'Center', 'Park', 'Oak', 'Elm', 'State'])} ${randomElement(['St', 'Ave', 'Blvd', 'Dr', 'Way'])}, ${city}`,
        url: `https://maps.google.com/?cid=${randomInt(10000, 99999)}`,
      },
      facebook: {
        likes: randomInt(500, 25000),
        url: `https://facebook.com/${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
      },
      instagram: {
        followers: randomInt(800, 35000),
        url: `https://instagram.com/${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
      },
    } : {};

    const account: MerchantAccount = {
      id: `merchant-${accountNum}`,
      name: businessName,
      permalink: businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      businessType,
      location: city,
      contactName: `${firstName} ${lastName}`,
      contactEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
      phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
      website: Math.random() > 0.3 ? `www.${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com` : undefined,
      description: `${businessType} offering quality services in ${city.split(',')[0]}`,
      status: "active", // Account is enabled (separate from deal activity)
      dealsCount,
      createdDate: monthsAgoToDate(createdMonthsAgo),
      lastDealDate: monthsAgoToDate(lastDealMonthsAgo),
      lastContactDate: monthsAgoToDate(lastContactMonthsAgo),
      logo: getLogoForBusinessType(businessType),
      potential,
      potentialAnalysis: {
        overall: potential,
        score,
        factors: {
          marketDemand: {
            score: randomInt(60, 95),
            notes: "Market analysis based on local demand and competition.",
          },
          historicalPerformance: {
            score: lastDealMonthsAgo > 12 ? randomInt(40, 70) : randomInt(70, 95),
            notes: lastDealMonthsAgo > 12 
              ? "Historical performance has declined due to inactivity."
              : "Strong historical performance with consistent results.",
          },
          competitivePosition: {
            score: randomInt(60, 90),
            notes: "Competitive positioning in local market.",
          },
          growthTrend: {
            score: lastDealMonthsAgo > 12 ? randomInt(40, 65) : randomInt(70, 95),
            notes: lastDealMonthsAgo > 12
              ? "Growth has stalled. Requires re-engagement."
              : "Positive growth trend with strong momentum.",
          },
          customerSatisfaction: {
            score: randomInt(65, 95),
            notes: "Customer feedback and satisfaction ratings.",
          },
        },
        recommendations: [
          lastDealMonthsAgo > 12 
            ? "Re-engage dormant account with targeted outreach"
            : "Continue current partnership strategy",
          "Optimize deal pricing based on market conditions",
          "Leverage seasonal opportunities for increased volume",
        ],
        insights: lastDealMonthsAgo > 12
          ? `${businessName} has been inactive for ${Math.floor(lastDealMonthsAgo / 12)}+ year(s). ${potential === "high" ? "High potential for re-engagement with refreshed deal strategy." : "Consider account review and strategic repositioning."}`
          : `${businessName} shows ${potential} potential with consistent performance. ${potential === "high" ? "Priority partnership for expansion." : "Solid partner for continued growth."}`,
      },
      ...socialData,
    };
    
    accounts.push(account);
  }
  
  return accounts;
}

// Generate the accounts
export const generatedMockAccounts = generateMockAccounts(500);

