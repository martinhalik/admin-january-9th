/**
 * Generate realistic mock deals data for testing
 * Generates 300+ deals with varied attributes
 */

interface Deal {
  id: string;
  title: string;
  location: string;
  merchant: string;
  city: string;
  division: string;
  category: string;
  subcategory: string;
  campaignStage: "draft" | "won" | "lost";
  status: string;
  wonSubStage?: "scheduled" | "live" | "paused" | "sold_out" | "closed";
  draftSubStage?: "presentation" | "appointment" | "proposal" | "needs_assessment" | "contract_sent" | "negotiation" | "contract_signed";
  lostSubStage?: "closed_lost" | "archived";
  revenue: number;
  purchases: number;
  views: number;
  conversionRate: number;
  margin: number;
  dealStart: string;
  dealEnd: string;
  quality: "Ace" | "Good" | "Fair";
  imageUrl?: string;
}

// Data for variety
const divisions = [
  { name: "New York (USA)", weight: 30 },
  { name: "Chicago (USA)", weight: 20 },
  { name: "Los Angeles (USA)", weight: 20 },
  { name: "San Francisco (USA)", weight: 10 },
  { name: "Boston (USA)", weight: 5 },
  { name: "Miami (USA)", weight: 5 },
  { name: "Seattle (USA)", weight: 5 },
  { name: "Denver (USA)", weight: 5 },
];

const categories = [
  { name: "Food & Drink", subcategories: ["Restaurant", "Cafe", "Bar", "Food Tour", "Cooking Class"], weight: 40 },
  { name: "Activities & Entertainment", subcategories: ["Tour", "Show", "Adventure", "Museum", "Sports"], weight: 25 },
  { name: "Health & Beauty", subcategories: ["Spa", "Salon", "Massage", "Fitness", "Wellness"], weight: 15 },
  { name: "Travel & Tourism", subcategories: ["Hotel", "Resort", "Attractions", "Cruise", "Tours"], weight: 10 },
  { name: "Automotive", subcategories: ["Car Wash", "Detailing", "Oil Change", "Repair"], weight: 5 },
  { name: "Education", subcategories: ["Classes", "Workshops", "Training", "Courses"], weight: 3 },
  { name: "Pet Services", subcategories: ["Grooming", "Boarding", "Training", "Vet"], weight: 2 },
];

const dealTitleTemplates = [
  "{category} Experience - {descriptor}",
  "{descriptor} at {merchant}",
  "Premium {category} Package",
  "{descriptor} - {location}",
  "{category} Special Deal",
  "Exclusive {descriptor}",
  "{descriptor} + {bonus}",
];

const descriptors = {
  "Food & Drink": ["Gourmet Dinner", "Lunch Special", "Tasting Menu", "Brunch Package", "Happy Hour", "Wine Pairing", "Chef's Special", "Farm-to-Table", "Signature Dishes"],
  "Activities & Entertainment": ["City Tour", "Adventure Package", "VIP Experience", "Day Pass", "Evening Show", "Weekend Activity", "Guided Tour", "Interactive Experience"],
  "Health & Beauty": ["Spa Day", "Massage Package", "Facial Treatment", "Full Service", "Relaxation Package", "Beauty Treatment", "Wellness Session", "Rejuvenation"],
  "Travel & Tourism": ["Weekend Getaway", "2-Night Stay", "Vacation Package", "Sightseeing Tour", "City Pass", "Attraction Tickets", "Travel Deal"],
  "Automotive": ["Full Service", "Premium Detail", "Complete Package", "Express Service", "Professional Care"],
  "Education": ["Workshop", "Class Series", "Training Program", "Skills Course", "Masterclass"],
  "Pet Services": ["Grooming Package", "Full Service", "Premium Care", "Complete Treatment"],
};

const merchantNames = [
  "The Grand", "Urban", "Modern", "Classic", "Premier", "Elite", "Luxury", "Downtown",
  "Artisan", "Local", "Historic", "Boutique", "Signature", "Platinum", "Golden",
  "Central", "Park", "Harbor", "Riverside", "Summit", "Vista", "Royal", "Imperial"
];

const merchantTypes = [
  "Bistro", "Lounge", "Gallery", "Studio", "Center", "Club", "House", "Place",
  "Spa", "Grill", "Cafe", "Kitchen", "Bar", "Restaurant", "Tours", "Adventures"
];

// Helper functions
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomWeighted<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return items[0];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMerchantName(): string {
  return `${randomItem(merchantNames)} ${randomItem(merchantTypes)}`;
}

function generateDate(startYear: number = 2024, endYear: number = 2026): string {
  const year = randomNumber(startYear, endYear);
  const month = randomNumber(1, 12);
  const day = randomNumber(1, 28);
  return `${day}. ${month}. ${year}`;
}

function generateDealTitle(category: string, merchant: string, location: string): string {
  const template = randomItem(dealTitleTemplates);
  const categoryDescriptors = descriptors[category as keyof typeof descriptors] || ["Special Experience"];
  const descriptor = randomItem(categoryDescriptors);
  const bonus = randomItem(["Bonus Offer", "Free Upgrade", "Extended Hours", "Plus More"]);
  
  return template
    .replace("{category}", category.split(" & ")[0])
    .replace("{descriptor}", descriptor)
    .replace("{merchant}", merchant)
    .replace("{location}", location)
    .replace("{bonus}", bonus);
}

function generateCampaignStage(): { stage: Deal["campaignStage"]; subStage?: string; status: string } {
  const rand = Math.random();
  
  if (rand < 0.60) {
    // 60% Live deals
    return {
      stage: "won",
      subStage: "live",
      status: "Live"
    };
  } else if (rand < 0.85) {
    // 25% Draft deals
    const draftSubStages: Deal["draftSubStage"][] = [
      "presentation", "appointment", "proposal", "needs_assessment",
      "contract_sent", "negotiation", "contract_signed"
    ];
    return {
      stage: "draft",
      subStage: randomItem(draftSubStages),
      status: "Draft"
    };
  } else {
    // 15% Lost deals
    const lostSubStages: Deal["lostSubStage"][] = ["closed_lost", "archived"];
    return {
      stage: "lost",
      subStage: randomItem(lostSubStages),
      status: "Closed Lost"
    };
  }
}

function generatePerformanceData(stage: Deal["campaignStage"], quality: Deal["quality"]) {
  if (stage === "draft") {
    return {
      revenue: 0,
      purchases: 0,
      views: 0,
      conversionRate: 0,
      margin: randomNumber(15, 60)
    };
  }
  
  const qualityMultiplier = quality === "Ace" ? 1.5 : quality === "Good" ? 1.0 : 0.6;
  
  if (stage === "lost") {
    return {
      revenue: randomNumber(500, 5000),
      purchases: randomNumber(10, 100),
      views: randomNumber(5000, 50000),
      conversionRate: randomNumber(1, 3) / 10,
      margin: randomNumber(10, 40)
    };
  }
  
  // Live deals
  const basePurchases = randomNumber(50, 2000) * qualityMultiplier;
  const baseViews = basePurchases * randomNumber(50, 200);
  const conversionRate = (basePurchases / baseViews) * 100;
  const avgDealValue = randomNumber(20, 80);
  
  return {
    revenue: Math.round(basePurchases * avgDealValue),
    purchases: Math.round(basePurchases),
    views: Math.round(baseViews),
    conversionRate: Number(conversionRate.toFixed(2)),
    margin: randomNumber(20, 55)
  };
}

/**
 * High-quality, unique Unsplash image URLs organized by category/subcategory
 * Each array contains 50+ unique images to ensure variety across deals
 * Images are landscape orientation, optimized for deal cards (800x450)
 */
const unsplashImagesByCategory: Record<string, string[]> = {
  "Food & Drink": [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80", // restaurant interior
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", // fine dining
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80", // food plating
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80", // gourmet dish
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80", // pasta
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80", // pizza
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80", // healthy bowl
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80", // pancakes
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80", // salad
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80", // dessert
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80", // chef cooking
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80", // steak
    "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&q=80", // sushi
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80", // pastry
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80", // burger
    "https://images.unsplash.com/photo-1482049016gy00ea3bw6?w=800&q=80", // wine
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80", // cocktails
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80", // coffee
    "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80", // cafe
    "https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?w=800&q=80", // bakery
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80", // brunch
    "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80", // food truck
    "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80", // dinner table
    "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80", // restaurant bar
    "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=800&q=80", // asian cuisine
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800&q=80", // tapas
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&q=80", // restaurant ambiance
    "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80", // indian food
    "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80", // thai food
    "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&q=80", // food presentation
    "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80", // bbq
    "https://images.unsplash.com/photo-1485963631004-f2f00b1d6571?w=800&q=80", // oysters
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80", // pasta dish
    "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80", // seafood
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80", // steak dinner
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80", // eggs benedict
    "https://images.unsplash.com/photo-1496412705862-e0088f16f791?w=800&q=80", // colorful food
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80", // breakfast
    "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80", // italian restaurant
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80", // food spread
  ],
  "Activities & Entertainment": [
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80", // concert
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80", // live music
    "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80", // cinema
    "https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=800&q=80", // bowling
    "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80", // arcade
    "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80", // escape room
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80", // theater
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80", // event venue
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80", // festival
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80", // party
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80", // mini golf
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80", // gaming
    "https://images.unsplash.com/photo-1560252829-804f1aedf1be?w=800&q=80", // museum
    "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&q=80", // art gallery
    "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80", // comedy show
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80", // karaoke
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80", // adventure park
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80", // outdoor activity
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80", // hiking
    "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80", // party lights
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80", // celebration
    "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=800&q=80", // water park
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80", // theme park
    "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=800&q=80", // laser tag
    "https://images.unsplash.com/photo-1504194104404-433180773017?w=800&q=80", // dance
  ],
  "Health & Beauty": [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80", // spa
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80", // massage
    "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80", // facial
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80", // salon
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80", // nails
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80", // yoga
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80", // gym
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80", // fitness
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80", // hair salon
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80", // skincare
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", // wellness
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80", // meditation
    "https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=80", // pilates
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80", // spa treatment
    "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80", // beauty
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80", // makeup
    "https://images.unsplash.com/photo-1532926381893-7542290edf1d?w=800&q=80", // hot stones
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80", // sauna
    "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=800&q=80", // haircut
    "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800&q=80", // body treatment
    "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=800&q=80", // aromatherapy
    "https://images.unsplash.com/photo-1583416750470-965b2707b355?w=800&q=80", // personal training
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80", // brow treatment
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&q=80", // spa pool
    "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=800&q=80", // lash extensions
  ],
  "Travel & Tourism": [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", // resort
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", // hotel
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", // beach
    "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&q=80", // travel
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80", // nature
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80", // lake
    "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80", // adventure travel
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80", // luxury hotel
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80", // hotel bed
    "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80", // vacation
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80", // pool resort
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80", // beach house
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80", // hotel room
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80", // hotel lobby
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80", // hotel pool
    "https://images.unsplash.com/photo-1559599238-308793637427?w=800&q=80", // cruise
    "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&q=80", // amusement park
    "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80", // maldives
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80", // bali temple
    "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&q=80", // city tour
    "https://images.unsplash.com/photo-1580977276076-ae4b8c219b8e?w=800&q=80", // cabin
    "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=800&q=80", // glamping
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80", // camping
    "https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=800&q=80", // mountain view
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80", // beach resort
  ],
  "Automotive": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", // car wash
    "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80", // car detail
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80", // car interior
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80", // auto service
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80", // bmw
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80", // porsche
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80", // classic car
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80", // car on road
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80", // luxury car
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80", // car showroom
    "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&q=80", // mechanic
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80", // tire service
    "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80", // car cleaning
    "https://images.unsplash.com/photo-1580827140897-a61aa3df32f7?w=800&q=80", // oil change
    "https://images.unsplash.com/photo-1486673748761-a8d18475c757?w=800&q=80", // garage
  ],
  "Education": [
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80", // classroom
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80", // learning
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80", // workshop
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80", // team training
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80", // collaboration
    "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=800&q=80", // art class
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80", // meeting
    "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80", // studying
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80", // online learning
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80", // education
    "https://images.unsplash.com/photo-1558008258-3256797b43f3?w=800&q=80", // presentation
    "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80", // office building
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80", // cooking class
    "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=800&q=80", // pottery
    "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80", // language class
  ],
  "Pet Services": [
    "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80", // dog grooming
    "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80", // pet spa
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80", // happy dog
    "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=800&q=80", // cat
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80", // dogs playing
    "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=800&q=80", // pet boarding
    "https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=800&q=80", // dog training
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80", // bulldog
    "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800&q=80", // cat portrait
    "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&q=80", // golden retriever
    "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=80", // puppy
    "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&q=80", // dog portrait
    "https://images.unsplash.com/photo-1494947665470-20322015e3a8?w=800&q=80", // vet
    "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&q=80", // pug
    "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=800&q=80", // pet care
  ]
};

// Track used image indices per category to ensure uniqueness
const usedImageIndices: Record<string, Set<number>> = {};

function getImageUrl(category: string, dealId: string): string {
  const images = unsplashImagesByCategory[category] || unsplashImagesByCategory["Food & Drink"];
  
  // Initialize tracking set for this category
  if (!usedImageIndices[category]) {
    usedImageIndices[category] = new Set();
  }
  
  // Get a unique index that hasn't been used yet
  const dealNumber = parseInt(dealId.replace(/\D/g, ''));
  let index = dealNumber % images.length;
  
  // If this index was already used, find the next available one
  const usedSet = usedImageIndices[category];
  let attempts = 0;
  while (usedSet.has(index) && attempts < images.length) {
    index = (index + 1) % images.length;
    attempts++;
  }
  
  // If all images in category are used, reset and start over (for large datasets)
  if (attempts >= images.length) {
    usedSet.clear();
  }
  
  usedSet.add(index);
  return images[index];
}

export function generateDeals(count: number = 300): Deal[] {
  const deals: Deal[] = [];
  
  for (let i = 0; i < count; i++) {
    const division = randomWeighted(divisions);
    const cityName = division.name.split(" ")[0];
    
    const category = randomWeighted(categories);
    const subcategory = randomItem(category.subcategories);
    
    const merchant = generateMerchantName();
    const title = generateDealTitle(category.name, merchant, cityName);
    
    const quality = randomItem<Deal["quality"]>(["Ace", "Good", "Fair"]);
    const campaignData = generateCampaignStage();
    const performance = generatePerformanceData(campaignData.stage, quality);
    
    const dealId = `deal-${i + 1000}`;
    const deal: Deal = {
      id: dealId,
      title,
      location: `${merchant}, ${cityName}`,
      merchant,
      city: cityName,
      division: division.name,
      category: category.name,
      subcategory,
      campaignStage: campaignData.stage,
      status: campaignData.status,
      quality,
      dealStart: generateDate(2024, 2025),
      dealEnd: generateDate(2025, 2026),
      imageUrl: getImageUrl(category.name, dealId),
      ...performance,
    };
    
    // Add substage
    if (campaignData.stage === "won" && campaignData.subStage) {
      deal.wonSubStage = campaignData.subStage as Deal["wonSubStage"];
    } else if (campaignData.stage === "draft" && campaignData.subStage) {
      deal.draftSubStage = campaignData.subStage as Deal["draftSubStage"];
    } else if (campaignData.stage === "lost" && campaignData.subStage) {
      deal.lostSubStage = campaignData.subStage as Deal["lostSubStage"];
    }
    
    deals.push(deal);
  }
  
  return deals;
}

// CLI usage
if (require.main === module) {
  const count = parseInt(process.argv[2]) || 300;
  const deals = generateDeals(count);
  
  console.log(JSON.stringify(deals, null, 2));
  console.log(`\n✅ Generated ${deals.length} deals`);
  console.log(`   Live: ${deals.filter(d => d.campaignStage === "won").length}`);
  console.log(`   Draft: ${deals.filter(d => d.campaignStage === "draft").length}`);
  console.log(`   Lost: ${deals.filter(d => d.campaignStage === "lost").length}`);
}

