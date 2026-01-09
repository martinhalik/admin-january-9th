import { extendedMockAccounts } from "./extendedMockData";
import { generatedMockAccounts } from "./generateMockAccounts";

export type MerchantPotential = "low" | "mid" | "high";

export interface MerchantPotentialAnalysis {
  overall: MerchantPotential;
  score: number; // 0-100
  factors: {
    marketDemand: { score: number; notes: string };
    historicalPerformance: { score: number; notes: string };
    competitivePosition: { score: number; notes: string };
    growthTrend: { score: number; notes: string };
    customerSatisfaction: { score: number; notes: string };
  };
  recommendations: string[];
  insights: string;
}

export interface AccountPerson {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface MerchantAccount {
  id: string;
  name: string;
  permalink: string;
  businessType: string;
  location: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  website?: string;
  address?: string;
  businessHours?: string;
  description: string;
  status: "active" | "inactive" | "pending";
  dealsCount: number;
  createdDate: string;
  lastDealDate?: string; // Date of most recent deal
  lastContactDate?: string; // Date of last contact/interaction
  potential: MerchantPotential;
  potentialAnalysis: MerchantPotentialAnalysis;
  accountOwner?: AccountPerson;
  accountManager?: AccountPerson;
  logo?: string; // URL to merchant logo/profile pic
  bookingEngine?: {
    name: string;
    logo: string; // URL to booking engine logo
    url?: string; // Optional link to their booking page
  };
  googleMaps?: {
    stars: number;
    reviews: number;
    address: string;
    url: string;
  };
  facebook?: {
    likes: number;
    url: string;
  };
  instagram?: {
    followers: number;
    url: string;
  };
}

export const merchantAccounts: MerchantAccount[] = [
  {
    id: "merchant-1",
    name: "Chimi's Fresh-Mex",
    permalink: "chimis-fresh-mex",
    businessType: "Restaurant",
    location: "Chicago, IL",
    contactName: "Maria Rodriguez",
    contactEmail: "maria@chimisfreshmex.com",
    phone: "(555) 123-4567",
    website: "www.chimisfreshmex.com",
    description:
      "Authentic Mexican restaurant specializing in fresh ingredients and traditional recipes. The establishment has built a strong reputation for its vibrant atmosphere and commitment to quality. Customer feedback consistently highlights the generous portion sizes, friendly service, and authentic flavors that transport diners to Mexico. Their signature dishes include house-made salsas, street tacos, and fresh-pressed tortillas. The restaurant has successfully leveraged daily specials and family meal deals to drive consistent traffic throughout the week.",
    status: "active",
    dealsCount: 3,
    createdDate: "2023-01-15",
    lastDealDate: "2024-10-15", // Recent - currently live
    lastContactDate: "2024-11-05", // Very recent
    logo: "https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=200&h=200&fit=crop&auto=format",
    bookingEngine: {
      name: "OpenTable",
      logo: "/images/booking-engines/opentable.svg",
      url: "https://www.opentable.com/chimis-fresh-mex",
    },
    potential: "high",
    potentialAnalysis: {
      overall: "high",
      score: 85,
      factors: {
        marketDemand: {
          score: 88,
          notes:
            "Strong local demand for Mexican cuisine in the area. Limited competition within 5-mile radius.",
        },
        historicalPerformance: {
          score: 82,
          notes:
            "Average deal performance of 120% vs. category benchmark. Consistent redemption rates above 75%.",
        },
        competitivePosition: {
          score: 85,
          notes:
            "Unique positioning with fresh ingredients and authentic recipes. Strong brand recognition in local market.",
        },
        growthTrend: {
          score: 90,
          notes:
            "Year-over-year growth of 45% in deal revenue. Expanding customer base with strong repeat purchase rate.",
        },
        customerSatisfaction: {
          score: 80,
          notes:
            "4.5-star average rating with positive reviews highlighting food quality and service.",
        },
      },
      recommendations: [
        "Increase deal frequency during peak seasons (spring/summer)",
        "Create family-style meal deals to boost average order value",
        "Leverage customer testimonials in marketing materials",
        "Consider expanding to catering packages for corporate events",
      ],
      insights:
        "Chimi's Fresh-Mex shows exceptional growth potential with strong market position and customer loyalty. The authentic cuisine and focus on fresh ingredients differentiate them from competitors. Recommended for priority partnership expansion.",
    },
    accountOwner: {
      id: "owner-1",
      name: "Maria Rodriguez",
      email: "maria@chimisfreshmex.com",
      role: "Owner",
    },
    accountManager: {
      id: "manager-1",
      name: "Sarah Johnson",
      email: "sarah.johnson@groupon.com",
      role: "Account Manager",
    },
    googleMaps: {
      stars: 4.5,
      reviews: 324,
      address: "123 West Madison Street, Chicago, IL",
      url: "https://maps.google.com/?cid=12345",
    },
    facebook: {
      likes: 2847,
      url: "https://facebook.com/chimisfreshmex",
    },
    instagram: {
      followers: 5632,
      url: "https://instagram.com/chimisfreshmex",
    },
  },
  {
    id: "merchant-2",
    name: "Serenity Spa & Wellness",
    permalink: "serenity-spa-wellness",
    businessType: "Spa & Beauty",
    location: "Chicago, IL",
    contactName: "Jennifer Chen",
    contactEmail: "jen@serenityspa.com",
    phone: "(555) 234-5678",
    website: "www.serenityspa.com",
    description:
      "Luxury spa offering massage therapy, facials, and wellness treatments in a serene environment designed for ultimate relaxation. The spa features licensed therapists specializing in Swedish, deep tissue, and hot stone massage techniques. Their skincare line uses organic, locally-sourced ingredients, and the facility includes aromatherapy, hydrotherapy pools, and meditation rooms. Customer reviews praise the tranquil atmosphere and professional staff. The spa has successfully positioned itself as a premier wellness destination for both locals and tourists seeking rejuvenation.",
    status: "active",
    dealsCount: 5,
    createdDate: "2023-03-22",
    lastDealDate: "2022-08-15", // 2+ years ago - INACTIVE
    lastContactDate: "2023-06-10", // 1.5 years ago
    logo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&h=200&fit=crop&auto=format",
    bookingEngine: {
      name: "Vagaro",
      logo: "/images/booking-engines/vagaro.svg",
      url: "https://www.vagaro.com/serenityspa",
    },
    potential: "mid",
    potentialAnalysis: {
      overall: "mid",
      score: 68,
      factors: {
        marketDemand: {
          score: 75,
          notes:
            "Moderate demand in competitive Chicago spa market. Seasonal variations affect booking rates.",
        },
        historicalPerformance: {
          score: 65,
          notes:
            "Deal performance at 95% of category benchmark. Room for improvement in conversion rates.",
        },
        competitivePosition: {
          score: 70,
          notes:
            "Strong service quality but facing competition from larger spa chains in the area.",
        },
        growthTrend: {
          score: 60,
          notes:
            "Stable but modest growth of 12% YoY. Limited expansion potential in current location.",
        },
        customerSatisfaction: {
          score: 72,
          notes:
            "4.2-star rating with generally positive feedback. Some concerns about pricing and availability.",
        },
      },
      recommendations: [
        "Introduce off-peak hour deals to increase bookings during slower periods",
        "Develop loyalty program to encourage repeat visits",
        "Bundle services to increase average transaction value",
        "Enhance social media presence to reach younger demographics",
      ],
      insights:
        "Serenity Spa shows solid performance with room for optimization. The competitive market requires strategic positioning. Focus on differentiation and customer retention to unlock growth potential.",
    },
    accountOwner: {
      id: "owner-2",
      name: "Jennifer Chen",
      email: "jen@serenityspa.com",
      role: "Owner",
    },
    accountManager: {
      id: "manager-2",
      name: "Michael Chen",
      email: "michael.chen@groupon.com",
      role: "Account Manager",
    },
    googleMaps: {
      stars: 4.2,
      reviews: 589,
      address: "234 Wellness Ave, Chicago, IL",
      url: "https://maps.google.com/?cid=23456",
    },
    facebook: {
      likes: 4251,
      url: "https://facebook.com/serenityspa",
    },
    instagram: {
      followers: 8920,
      url: "https://instagram.com/serenityspa",
    },
  },
  {
    id: "merchant-3",
    name: "Bella Italia Ristorante",
    permalink: "bella-italia-ristorante",
    businessType: "Restaurant",
    location: "Chicago, IL",
    contactName: "Giovanni Rossi",
    contactEmail: "giovanni@bellaitalia.com",
    phone: "(555) 345-6789",
    website: "www.bellaitalia.com",
    description:
      "Fine Italian dining with homemade pasta and authentic regional cuisine crafted by chef-trained culinary experts. The restaurant imports select ingredients directly from Italy, including artisanal cheeses, cured meats, and specialty olive oils. Their pasta is made fresh daily using traditional techniques passed down through generations. The wine list features over 200 selections from Italian vineyards, curated to perfectly complement each dish. The elegant ambiance combines old-world charm with modern sophistication, making it ideal for romantic dinners and special celebrations.",
    status: "active",
    dealsCount: 7,
    createdDate: "2022-11-08",
    lastDealDate: "2024-11-01", // Very recent - currently live
    lastContactDate: "2024-11-08", // Last week
    logo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&auto=format",
    potential: "high",
    potentialAnalysis: {
      overall: "high",
      score: 92,
      factors: {
        marketDemand: {
          score: 95,
          notes:
            "Exceptional demand in NYC fine dining market. Premium location with high foot traffic.",
        },
        historicalPerformance: {
          score: 90,
          notes:
            "Outstanding deal performance at 145% vs. benchmark. High redemption and repeat purchase rates.",
        },
        competitivePosition: {
          score: 92,
          notes:
            "Premium brand with authentic Italian cuisine. Strong reputation and established customer base.",
        },
        growthTrend: {
          score: 88,
          notes:
            "Consistent growth of 35% YoY. Strong potential for special events and seasonal offerings.",
        },
        customerSatisfaction: {
          score: 95,
          notes:
            "4.8-star rating with exceptional reviews. Customers praise authenticity and ambiance.",
        },
      },
      recommendations: [
        "Launch exclusive wine pairing dinner deals",
        "Create seasonal tasting menu experiences",
        "Partner for corporate dining packages",
        "Expand to weekend brunch offerings with targeted deals",
      ],
      insights:
        "Bella Italia represents a top-tier partnership opportunity. Exceptional performance across all metrics with strong brand equity and customer loyalty. Prime candidate for featured campaigns and premium deal structures.",
    },
    googleMaps: {
      stars: 4.8,
      reviews: 1287,
      address: "350 West Hubbard Street, Chicago, IL",
      url: "https://maps.google.com/?cid=67890",
    },
    facebook: {
      likes: 8932,
      url: "https://facebook.com/bellaitalianyc",
    },
    instagram: {
      followers: 12450,
      url: "https://instagram.com/bellaitalianyc",
    },
  },
  {
    id: "merchant-4",
    name: "FitZone Performance Gym",
    permalink: "fitzone-performance-gym",
    businessType: "Fitness & Health",
    location: "Chicago, IL",
    contactName: "Marcus Johnson",
    contactEmail: "marcus@fitzone.com",
    phone: "(555) 456-7890",
    website: "www.fitzone.com",
    description:
      "State-of-the-art fitness facility with personal training and group classes designed to accommodate all fitness levels. The gym features cutting-edge equipment from leading manufacturers, including cardio machines with entertainment systems, free weights, and functional training zones. Certified personal trainers create customized workout plans focusing on individual goals, whether weight loss, muscle building, or athletic performance. Group classes range from high-intensity interval training to yoga and spin, with schedules accommodating early morning and evening members. The facility also offers nutritional counseling and body composition analysis.",
    status: "active",
    dealsCount: 12,
    createdDate: "2023-02-14",
    lastDealDate: "2022-12-10", // 2 years ago - INACTIVE
    lastContactDate: "2024-02-14", // 9 months ago
    logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop&auto=format",
    bookingEngine: {
      name: "Mindbody",
      logo: "/images/booking-engines/mindbody.svg",
      url: "https://www.mindbodyonline.com/fitzone",
    },
    potential: "high",
    potentialAnalysis: {
      overall: "high",
      score: 86,
      factors: {
        marketDemand: {
          score: 90,
          notes:
            "High demand for fitness services in LA market. Strong New Year and summer seasonality.",
        },
        historicalPerformance: {
          score: 85,
          notes:
            "Strong deal performance at 125% of benchmark. High volume with good margin contribution.",
        },
        competitivePosition: {
          score: 82,
          notes:
            "Well-equipped facility with experienced trainers. Competing with boutique studios and chain gyms.",
        },
        growthTrend: {
          score: 88,
          notes:
            "Impressive growth of 50% YoY. Expanding class offerings and personal training services.",
        },
        customerSatisfaction: {
          score: 85,
          notes:
            "4.6-star rating. Members appreciate modern equipment and variety of classes.",
        },
      },
      recommendations: [
        "Launch New Year resolution packages (January focus)",
        "Create couples and group training deals",
        "Develop summer body transformation programs",
        "Add virtual training options for broader reach",
      ],
      insights:
        "FitZone demonstrates strong growth trajectory with excellent market positioning. High deal volume and consistent performance make it a valuable long-term partner. Opportunity to test new fitness deal formats and seasonal campaigns.",
    },
    googleMaps: {
      stars: 4.6,
      reviews: 892,
      address: "2200 North Clybourn Avenue, Chicago, IL",
      url: "https://maps.google.com/?cid=11223",
    },
    facebook: {
      likes: 6543,
      url: "https://facebook.com/fitzoneperformance",
    },
    instagram: {
      followers: 15890,
      url: "https://instagram.com/fitzoneperformance",
    },
  },
  {
    id: "merchant-5",
    name: "Glam Studio Hair & Beauty",
    permalink: "glam-studio-hair-beauty",
    businessType: "Salon",
    location: "Chicago, IL",
    contactName: "Sofia Martinez",
    contactEmail: "sofia@glamstudio.com",
    phone: "(555) 567-8901",
    website: "www.glamstudio.com",
    description: "Full-service hair salon and beauty bar with expert stylists trained in the latest cutting, coloring, and styling techniques. The salon specializes in both classic and contemporary styles, offering consultations to ensure each client's vision is realized. Services include precision cuts, balayage and ombre coloring, keratin treatments, and special occasion styling. The beauty bar provides manicures, pedicures, waxing, and makeup application. The team stays current with industry trends through continuous education and uses premium product lines. The welcoming atmosphere and attention to detail have earned a loyal client base.",
    status: "active",
    dealsCount: 4,
    createdDate: "2023-04-05",
    lastDealDate: "2022-06-10", // 2+ years ago
    lastContactDate: "2024-01-15", // 10 months ago
    logo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop&auto=format",
    potential: "mid",
    potentialAnalysis: {
      overall: "mid",
      score: 62,
      factors: {
        marketDemand: {
          score: 70,
          notes:
            "Steady demand for salon services. Competitive Miami beauty market with many alternatives.",
        },
        historicalPerformance: {
          score: 58,
          notes:
            "Below-benchmark performance at 85%. Lower redemption rates indicate pricing or service concerns.",
        },
        competitivePosition: {
          score: 65,
          notes:
            "Good stylist talent but limited brand differentiation. Mid-range pricing in crowded market.",
        },
        growthTrend: {
          score: 55,
          notes:
            "Modest 8% YoY growth. Need to address customer acquisition and retention challenges.",
        },
        customerSatisfaction: {
          score: 62,
          notes:
            "4.0-star rating with mixed reviews. Inconsistent service quality reported by some customers.",
        },
      },
      recommendations: [
        "Focus on service consistency and staff training",
        "Implement quality control measures",
        "Create first-time customer incentives",
        "Offer package deals for multiple services",
        "Improve online presence and review management",
      ],
      insights:
        "Glam Studio has potential but needs operational improvements to compete effectively. Address service quality concerns and enhance customer experience to improve deal performance. Consider additional training and quality assurance programs.",
    },
    googleMaps: {
      stars: 4.0,
      reviews: 312,
      address: "900 North Michigan Avenue, Chicago, IL",
      url: "https://maps.google.com/?cid=34567",
    },
    facebook: {
      likes: 2845,
      url: "https://facebook.com/glamstudio",
    },
    instagram: {
      followers: 6234,
      url: "https://instagram.com/glamstudio",
    },
  },
  {
    id: "merchant-6",
    name: "Adventure Escapes",
    permalink: "adventure-escapes",
    businessType: "Activities & Entertainment",
    location: "Chicago, IL",
    contactName: "Ryan Thompson",
    contactEmail: "ryan@adventureescapes.com",
    phone: "(555) 678-9012",
    website: "www.adventureescapes.com",
    description:
      "Outdoor adventure experiences including zip-lining, rock climbing, and guided tours across pristine natural landscapes. The adventure park features multiple zip line courses ranging from beginner-friendly to advanced thrill-seeker levels, with the longest span reaching over 1,000 feet. Professional guides lead rock climbing excursions suitable for all skill levels, with top-rope and lead climbing options available. Nature tours explore local ecosystems with knowledgeable naturalists sharing insights about flora, fauna, and geological formations. All equipment is regularly inspected and meets industry safety standards. The facility has earned recognition for sustainable tourism practices.",
    status: "active",
    dealsCount: 8,
    createdDate: "2023-05-20",
    lastDealDate: "2021-11-10", // 3 years ago - INACTIVE
    lastContactDate: "2022-12-05", // 2 years ago
    logo: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&h=200&fit=crop&auto=format",
    potential: "high",
    potentialAnalysis: {
      overall: "high",
      score: 88,
      factors: {
        marketDemand: {
          score: 92,
          notes:
            "Strong demand for adventure activities in Denver area. Popular tourist and local destination.",
        },
        historicalPerformance: {
          score: 85,
          notes:
            "Excellent deal performance at 135% vs. benchmark. High conversion rates and customer engagement.",
        },
        competitivePosition: {
          score: 88,
          notes:
            "Unique experiences with professional guides. Limited direct competition for comprehensive offerings.",
        },
        growthTrend: {
          score: 90,
          notes:
            "Robust growth of 55% YoY. Expanding activity portfolio and seasonal offerings.",
        },
        customerSatisfaction: {
          score: 85,
          notes:
            "4.7-star rating with enthusiastic reviews. Customers highlight memorable experiences and safety.",
        },
      },
      recommendations: [
        "Create seasonal packages (summer hiking, winter snowshoeing)",
        "Develop team-building corporate packages",
        "Launch photography add-on services",
        "Offer multi-activity combo deals",
      ],
      insights:
        "Adventure Escapes shows exceptional potential in the high-demand activities category. Strong performance and unique offerings make it ideal for featured campaigns. Excellent opportunity for seasonal promotions and corporate partnerships.",
    },
    googleMaps: {
      stars: 4.7,
      reviews: 1245,
      address: "4800 West Fullerton Avenue, Chicago, IL",
      url: "https://maps.google.com/?cid=45678",
    },
    facebook: {
      likes: 7432,
      url: "https://facebook.com/adventureescapes",
    },
    instagram: {
      followers: 18950,
      url: "https://instagram.com/adventureescapes",
    },
  },
  {
    id: "merchant-7",
    name: "The Coffee House",
    permalink: "the-coffee-house",
    businessType: "Cafe",
    location: "Chicago, IL",
    contactName: "Emma Davis",
    contactEmail: "emma@thecoffeehouse.com",
    phone: "(555) 789-0123",
    website: "www.thecoffeehouse.com",
    description:
      "Artisan coffee shop with fresh pastries and light breakfast options, sourcing beans from sustainable, fair-trade farms around the world. The skilled baristas craft espresso-based drinks, pour-overs, and cold brews with precision and care. Fresh pastries are baked daily on-site, featuring croissants, muffins, scones, and seasonal specialties. The breakfast menu includes avocado toast, breakfast sandwiches, and acai bowls made with organic ingredients. The cozy interior features local artwork and comfortable seating, making it a popular spot for remote workers and casual meetings. Free Wi-Fi and multiple power outlets enhance the work-friendly atmosphere.",
    status: "active",
    dealsCount: 2,
    createdDate: "2023-06-10",
    lastDealDate: "2023-09-15", // Over a year ago
    lastContactDate: "2023-11-20", // Not contacted in over a year
    logo: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop&auto=format",
    potential: "low",
    potentialAnalysis: {
      overall: "low",
      score: 45,
      factors: {
        marketDemand: {
          score: 50,
          notes:
            "Saturated Seattle coffee market with intense competition from established brands.",
        },
        historicalPerformance: {
          score: 42,
          notes:
            "Underperforming at 65% of benchmark. Low deal volume and poor conversion rates.",
        },
        competitivePosition: {
          score: 48,
          notes:
            "Limited differentiation in highly competitive market. Struggling against major chains and local favorites.",
        },
        growthTrend: {
          score: 38,
          notes:
            "Minimal growth of 3% YoY. Challenges in customer acquisition and brand awareness.",
        },
        customerSatisfaction: {
          score: 47,
          notes:
            "3.6-star rating with inconsistent feedback. Quality and service issues reported.",
        },
      },
      recommendations: [
        "Reassess deal strategy and pricing structure",
        "Focus on unique product offerings to differentiate",
        "Improve service consistency and customer experience",
        "Consider pivoting to specialty items or catering services",
        "Evaluate market positioning and target audience",
      ],
      insights:
        "The Coffee House faces significant challenges in a saturated market. Current performance indicators suggest limited growth potential. Recommend close monitoring and strategic review. May benefit from operational improvements before scaling deal offerings.",
    },
    googleMaps: {
      stars: 3.6,
      reviews: 187,
      address: "1465 East 53rd Street, Chicago, IL",
      url: "https://maps.google.com/?cid=56789",
    },
    facebook: {
      likes: 1234,
      url: "https://facebook.com/thecoffeehouse",
    },
    instagram: {
      followers: 3456,
      url: "https://instagram.com/thecoffeehouse",
    },
  },
  {
    id: "merchant-8",
    name: "Ocean View Resort",
    permalink: "ocean-view-resort",
    businessType: "Hotel & Lodging",
    location: "Chicago, IL",
    contactName: "David Park",
    contactEmail: "david@oceanviewresort.com",
    phone: "(555) 890-1234",
    website: "www.oceanviewresort.com",
    description:
      "Beachfront resort with luxury accommodations and full-service amenities offering an unforgettable coastal experience. The property features spacious rooms and suites with private balconies overlooking pristine beaches and crystal-clear waters. Guests enjoy access to multiple dining venues, from casual beachside grills to upscale fine dining restaurants. The resort includes three swimming pools, a championship golf course, a full-service spa, and a state-of-the-art fitness center. Water sports equipment rentals, guided excursions, and children's programs ensure entertainment for all ages. The dedicated concierge team arranges everything from restaurant reservations to adventure activities, creating personalized experiences for each guest.",
    status: "active",
    dealsCount: 6,
    createdDate: "2022-12-01",
    lastDealDate: "2022-03-20", // 2.5+ years ago - INACTIVE
    lastContactDate: "2023-01-15", // Almost 2 years ago
    logo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop&auto=format",
    potential: "mid",
    potentialAnalysis: {
      overall: "mid",
      score: 72,
      factors: {
        marketDemand: {
          score: 78,
          notes:
            "Strong tourism demand in San Diego. Seasonal variations with peak summer and holiday periods.",
        },
        historicalPerformance: {
          score: 70,
          notes:
            "Solid performance at 105% of category benchmark. Good weekend package sales.",
        },
        competitivePosition: {
          score: 75,
          notes:
            "Premium location with beachfront access. Competing with larger hotel chains and boutique properties.",
        },
        growthTrend: {
          score: 68,
          notes:
            "Moderate growth of 18% YoY. Opportunity to expand spa and dining packages.",
        },
        customerSatisfaction: {
          score: 70,
          notes:
            "4.3-star rating with positive feedback on location. Some concerns about amenity updates needed.",
        },
      },
      recommendations: [
        "Bundle room packages with spa and dining experiences",
        "Create romantic getaway and anniversary packages",
        "Develop mid-week deals to fill occupancy gaps",
        "Partner with local attractions for exclusive experiences",
      ],
      insights:
        "Ocean View Resort shows steady performance with opportunity for enhancement. Strong location advantage provides foundation for growth. Focus on package bundling and facility updates to maximize potential and compete with premium properties.",
    },
    googleMaps: {
      stars: 4.3,
      reviews: 876,
      address: "1300 South Lake Shore Drive, Chicago, IL",
      url: "https://maps.google.com/?cid=67890",
    },
    facebook: {
      likes: 9876,
      url: "https://facebook.com/oceanviewresort",
    },
    instagram: {
      followers: 14320,
      url: "https://instagram.com/oceanviewresort",
    },
  },
  // NEW ACCOUNTS - Showcase all scenarios
  {
    id: "merchant-9",
    name: "TechHub Electronics",
    permalink: "techhub-electronics",
    businessType: "Electronics",
    location: "Chicago, IL",
    contactName: "Alex Kumar",
    contactEmail: "alex@techhub.com",
    phone: "(555) 901-2345",
    website: "www.techhub.com",
    description: "Premium electronics and gadgets retailer offering cutting-edge technology from leading global brands. The store features the latest smartphones, laptops, tablets, smart home devices, and gaming equipment with knowledgeable staff providing expert advice and demonstrations. Services include device setup, technical support, repairs, and trade-in programs. The showroom allows customers to test products hands-on before purchasing. Extended warranty options and flexible financing plans make high-tech purchases accessible. The store regularly hosts product launch events and tech workshops to keep customers informed about emerging technologies. Price matching and loyalty rewards program ensure competitive value.",
    status: "active",
    dealsCount: 15,
    createdDate: "2022-08-15",
    lastDealDate: "2024-11-10", // Currently live
    lastContactDate: "2024-11-10", // Very recent
    logo: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200&h=200&fit=crop&auto=format",
    potential: "high",
    potentialAnalysis: {
      overall: "high",
      score: 91,
      factors: {
        marketDemand: { score: 93, notes: "Electronics deals have massive demand online and in-person." },
        historicalPerformance: { score: 88, notes: "Consistently high sales volume across all deal types." },
        competitivePosition: { score: 90, notes: "Unique product selection and competitive pricing." },
        growthTrend: { score: 95, notes: "Explosive 60% YoY growth with expanding product lines." },
        customerSatisfaction: { score: 89, notes: "4.7-star rating with excellent customer service." },
      },
      recommendations: [
        "Launch Black Friday/Cyber Monday deals early",
        "Bundle complementary products for higher AOV",
        "Target tech enthusiasts with premium gadgets",
      ],
      insights: "TechHub is a powerhouse in the electronics category with exceptional growth and customer loyalty.",
    },
    googleMaps: {
      stars: 4.7,
      reviews: 2134,
      address: "500 West Madison Street, Chicago, IL",
      url: "https://maps.google.com/?cid=99001",
    },
    facebook: {
      likes: 15678,
      url: "https://facebook.com/techhubelectronics",
    },
    instagram: {
      followers: 34521,
      url: "https://instagram.com/techhubelectronics",
    },
  },
  {
    id: "merchant-10",
    name: "Yoga Haven Studio",
    permalink: "yoga-haven-studio",
    businessType: "Fitness & Health",
    location: "Chicago, IL",
    contactName: "Sarah Williams",
    contactEmail: "sarah@yogahaven.com",
    phone: "(555) 012-3456",
    website: "www.yogahaven.com",
    description: "Boutique yoga studio with mindfulness and meditation classes designed to nurture body, mind, and spirit in a peaceful sanctuary. Certified instructors lead various yoga styles including Vinyasa, Hatha, Yin, and Restorative, accommodating practitioners from beginners to advanced. The schedule includes early morning sunrise sessions, lunchtime flow classes, and evening relaxation practices. Meditation workshops teach breathing techniques, guided visualization, and stress management strategies. The studio features eco-friendly yoga mats, props, and a retail section offering sustainable activewear and wellness products. Small class sizes ensure personalized attention and proper alignment guidance for safe, effective practice.",
    status: "active",
    dealsCount: 6,
    createdDate: "2023-07-20",
    lastDealDate: "2023-01-15", // Almost 2 years ago - INACTIVE
    lastContactDate: "2023-08-22", // 1+ year ago
    potential: "mid",
    potentialAnalysis: {
      overall: "mid",
      score: 71,
      factors: {
        marketDemand: { score: 75, notes: "Growing wellness trend in Austin market." },
        historicalPerformance: { score: 68, notes: "Moderate deal performance with room for optimization." },
        competitivePosition: { score: 72, notes: "Quality instructors but facing boutique studio competition." },
        growthTrend: { score: 70, notes: "Steady 20% YoY growth with loyal member base." },
        customerSatisfaction: { score: 70, notes: "4.3-star rating with positive instructor feedback." },
      },
      recommendations: [
        "Offer intro packages for new students",
        "Create wellness retreat packages",
        "Partner with local wellness businesses",
      ],
      insights: "Yoga Haven has solid potential with the wellness trend. Focus on differentiation and community building.",
    },
    logo: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop&auto=format",
    googleMaps: {
      stars: 4.3,
      reviews: 423,
      address: "1800 North Halsted Street, Chicago, IL",
      url: "https://maps.google.com/?cid=78901",
    },
    facebook: {
      likes: 3654,
      url: "https://facebook.com/yogahaven",
    },
    instagram: {
      followers: 7890,
      url: "https://instagram.com/yogahaven",
    },
  },
  {
    id: "merchant-11",
    name: "Burger Palace",
    permalink: "burger-palace",
    businessType: "Restaurant",
    location: "Chicago, IL",
    contactName: "Mike Johnson",
    contactEmail: "mike@burgerpalace.com",
    phone: "(555) 123-4567",
    website: "www.burgerpalace.com",
    description: "Gourmet burgers and craft beers in a casual atmosphere that combines quality ingredients with creative flavor combinations. The menu features premium beef burgers made from locally-sourced, grass-fed cattle, along with turkey, veggie, and plant-based options. Each burger is customizable with artisanal toppings like caramelized onions, smoked bacon, aged cheddar, and house-made sauces. The rotating craft beer selection showcases regional breweries and seasonal offerings, with knowledgeable staff ready to recommend perfect pairings. Hand-cut fries, onion rings, and loaded nachos complement the burger selection. The laid-back environment features communal tables, sports on multiple screens, and a patio for outdoor dining.",
    status: "active",
    dealsCount: 8,
    createdDate: "2023-03-10",
    lastDealDate: "2022-10-05", // 2 years ago - INACTIVE
    lastContactDate: "2023-04-12", // 1.5+ years ago
    potential: "mid",
    potentialAnalysis: {
      overall: "mid",
      score: 66,
      factors: {
        marketDemand: { score: 72, notes: "Competitive burger market with strong demand." },
        historicalPerformance: { score: 64, notes: "Inconsistent deal performance quarter-to-quarter." },
        competitivePosition: { score: 68, notes: "Good quality but many similar options in area." },
        growthTrend: { score: 62, notes: "Modest 15% growth. Need to stand out more." },
        customerSatisfaction: { score: 64, notes: "4.1-star rating. Some consistency issues noted." },
      },
      recommendations: [
        "Create signature burger deals",
        "Add beer pairing options",
        "Focus on weekend traffic builders",
        "Improve service consistency",
      ],
      insights: "Burger Palace needs stronger differentiation in a crowded market. Quality is there, execution needs refinement.",
    },
    logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop&auto=format",
    googleMaps: {
      stars: 4.1,
      reviews: 534,
      address: "1250 South Michigan Avenue, Chicago, IL",
      url: "https://maps.google.com/?cid=89012",
    },
    facebook: {
      likes: 4321,
      url: "https://facebook.com/burgerpalace",
    },
    instagram: {
      followers: 6789,
      url: "https://instagram.com/burgerpalace",
    },
  },
  {
    id: "merchant-12",
    name: "Premium Auto Detailing",
    permalink: "premium-auto-detailing",
    businessType: "Auto Services",
    location: "Chicago, IL",
    contactName: "Carlos Martinez",
    contactEmail: "carlos@premiumauto.com",
    phone: "(555) 234-5678",
    website: "www.premiumautodetailing.com",
    description: "Professional auto detailing and ceramic coating services that restore and protect vehicles to showroom condition. The expert team provides comprehensive interior and exterior detailing using premium products and advanced techniques. Services include paint correction, scratch removal, headlight restoration, and engine bay cleaning. Their signature ceramic coating applications provide long-lasting protection against UV rays, environmental contaminants, and minor scratches while enhancing paint depth and shine. Mobile detailing services bring convenience to customers' homes or offices. The business uses eco-friendly, water-saving methods and maintains high standards that have earned recognition from automotive enthusiasts and luxury car owners.",
    status: "active",
    dealsCount: 4,
    createdDate: "2024-01-15",
    lastDealDate: "2022-05-18", // 2.5 years ago - INACTIVE
    lastContactDate: "2023-02-10", // 1.5+ years ago
    potential: "high",
    potentialAnalysis: {
      overall: "high",
      score: 83,
      factors: {
        marketDemand: { score: 85, notes: "Strong demand for premium car care in Phoenix market." },
        historicalPerformance: { score: 80, notes: "New but showing strong early traction." },
        competitivePosition: { score: 84, notes: "Premium positioning with certified technicians." },
        growthTrend: { score: 86, notes: "Rapid growth trajectory as new business." },
        customerSatisfaction: { score: 80, notes: "4.6-star rating with excellent reviews." },
      },
      recommendations: [
        "Launch seasonal protection packages",
        "Target luxury car owners",
        "Create membership programs",
      ],
      insights: "New merchant with excellent potential. Premium positioning is working well in the market.",
    },
    logo: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=200&h=200&fit=crop&auto=format",
    googleMaps: {
      stars: 4.6,
      reviews: 298,
      address: "3200 North Western Avenue, Chicago, IL",
      url: "https://maps.google.com/?cid=90123",
    },
    facebook: {
      likes: 2156,
      url: "https://facebook.com/premiumautodetailing",
    },
    instagram: {
      followers: 4567,
      url: "https://instagram.com/premiumautodetailing",
    },
  },
  {
    id: "merchant-13",
    name: "Cozy Cafe & Bakery",
    permalink: "cozy-cafe-bakery",
    businessType: "Cafe",
    location: "Chicago, IL",
    contactName: "Emily Chen",
    contactEmail: "emily@cozycafe.com",
    phone: "(555) 345-6789",
    website: "www.cozycafe.com",
    description: "Artisan coffee, fresh-baked pastries, and light breakfast in a charming neighborhood cafe that has become a community gathering spot. Expert baristas prepare specialty coffee drinks using single-origin beans roasted in small batches by local roasters. The bakery section features homemade croissants, Danish pastries, muffins, and seasonal treats prepared fresh each morning. Breakfast offerings include avocado toast, breakfast burritos, bagels with house-cured salmon, and Greek yogurt parfaits. The cozy interior showcases local artists' work on rotating displays. Free Wi-Fi, ample seating, and a welcoming atmosphere make it popular with students, freelancers, and neighbors seeking a quiet retreat.",
    status: "active",
    dealsCount: 3,
    createdDate: "2023-09-01",
    lastDealDate: "2023-11-15", // Over a year ago
    lastContactDate: "2024-03-20", // 8 months ago
    potential: "low",
    potentialAnalysis: {
      overall: "low",
      score: 52,
      factors: {
        marketDemand: { score: 58, notes: "Saturated Portland cafe market with intense competition." },
        historicalPerformance: { score: 48, notes: "Below-average deal performance. Low redemption rates." },
        competitivePosition: { score: 52, notes: "Struggles to differentiate from many similar cafes." },
        growthTrend: { score: 50, notes: "Flat growth. Need strategic pivot." },
        customerSatisfaction: { score: 52, notes: "3.8-star rating. Inconsistent quality noted." },
      },
      recommendations: [
        "Focus on unique specialty items",
        "Improve consistency and quality",
        "Reassess pricing strategy",
        "Consider catering or wholesale opportunities",
      ],
      insights: "Cozy Cafe faces significant challenges in a crowded market. Needs operational improvements and differentiation.",
    },
    logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop&auto=format",
    googleMaps: {
      stars: 3.8,
      reviews: 219,
      address: "1400 West Diversey Parkway, Chicago, IL",
      url: "https://maps.google.com/?cid=01234",
    },
    facebook: {
      likes: 1876,
      url: "https://facebook.com/cozycafe",
    },
    instagram: {
      followers: 3210,
      url: "https://instagram.com/cozycafe",
    },
  },
  {
    id: "merchant-14",
    name: "Elite Fitness Club",
    permalink: "elite-fitness-club",
    businessType: "Fitness & Health",
    location: "Chicago, IL",
    contactName: "Tom Bradford",
    contactEmail: "tom@elitefitness.com",
    phone: "(555) 456-7890",
    website: "www.elitefitness.com",
    description: "24/7 fitness center with state-of-the-art equipment and classes providing around-the-clock access to comprehensive fitness facilities. The gym features modern cardio equipment with individual entertainment screens, extensive free weight sections, resistance machines targeting all muscle groups, and dedicated functional training zones. Group fitness classes include spin, kickboxing, Zumba, yoga, and boot camp, with schedules accommodating various lifestyles. Certified personal trainers offer complimentary fitness assessments and create customized workout programs. Amenities include spacious locker rooms, showers, towel service, and member-exclusive app for class bookings and workout tracking. The clean, well-maintained facility creates a motivating environment for achieving fitness goals.",
    status: "active",
    dealsCount: 20,
    createdDate: "2021-06-10",
    lastDealDate: "2024-11-08", // Currently live
    lastContactDate: "2024-11-06", // Very recent
    logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop&auto=format",
    potential: "high",
    potentialAnalysis: {
      overall: "high",
      score: 89,
      factors: {
        marketDemand: { score: 91, notes: "High fitness market demand, especially January." },
        historicalPerformance: { score: 87, notes: "Consistently top performer with high volume." },
        competitivePosition: { score: 88, notes: "Premium facility with excellent amenities." },
        growthTrend: { score: 92, notes: "Strong 48% YoY growth with multiple locations planned." },
        customerSatisfaction: { score: 87, notes: "4.7-star rating. Members love facility and staff." },
      },
      recommendations: [
        "Launch New Year resolution packages in December",
        "Create family membership deals",
        "Add personal training bundles",
        "Expand group class offerings",
      ],
      insights: "Elite Fitness is a top-tier partner with exceptional performance. Prime candidate for featured campaigns.",
    },
    googleMaps: {
      stars: 4.7,
      reviews: 1543,
      address: "2400 North Ashland Avenue, Chicago, IL",
      url: "https://maps.google.com/?cid=44556",
    },
    facebook: {
      likes: 12389,
      url: "https://facebook.com/elitefitnessbos",
    },
    instagram: {
      followers: 28450,
      url: "https://instagram.com/elitefitnessbos",
    },
  },
  {
    id: "merchant-15",
    name: "Vintage Threads Boutique",
    permalink: "vintage-threads-boutique",
    businessType: "Fashion",
    location: "Chicago, IL",
    contactName: "Jessica Taylor",
    contactEmail: "jessica@vintagethreads.com",
    phone: "(555) 567-8901",
    website: "www.vintagethreads.com",
    description: "Curated vintage and sustainable fashion boutique offering unique clothing and accessories with a story behind each piece. The carefully selected inventory spans multiple decades, from 1960s mod styles to 1990s grunge, with sizes ranging from petite to plus. Each item is inspected, cleaned, and authenticated to ensure quality. The shop also features contemporary sustainable brands using organic fabrics, recycled materials, and ethical manufacturing practices. Knowledgeable staff provide styling advice and help customers create looks that express individual personalities while supporting environmental consciousness. Regular pop-up events, seasonal sales, and consignment opportunities create an engaged community of fashion-forward, eco-conscious shoppers.",
    status: "inactive",
    dealsCount: 2,
    createdDate: "2023-04-15",
    lastDealDate: "2023-07-20", // 16 months ago
    lastContactDate: "2023-09-10", // Over a year ago - not contacted
    potential: "low",
    potentialAnalysis: {
      overall: "low",
      score: 48,
      factors: {
        marketDemand: { score: 55, notes: "Niche market with limited mass appeal." },
        historicalPerformance: { score: 42, notes: "Poor deal performance. Very low sales volume." },
        competitivePosition: { score: 50, notes: "Unique offering but pricing too high for deals." },
        growthTrend: { score: 45, notes: "Declining interest. Limited marketing." },
        customerSatisfaction: { score: 48, notes: "3.7-star rating. Mixed reviews on value." },
      },
      recommendations: [
        "Reassess pricing strategy",
        "Consider liquidation or clearance deals",
        "Focus on online presence",
        "Evaluate business model fit for daily deals",
      ],
      insights: "Vintage Threads hasn't found product-market fit with daily deals. May not be suitable for platform.",
    },
    logo: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200&h=200&fit=crop&auto=format",
    googleMaps: {
      stars: 3.7,
      reviews: 156,
      address: "1700 North Milwaukee Avenue, Chicago, IL",
      url: "https://maps.google.com/?cid=12340",
    },
    facebook: {
      likes: 2543,
      url: "https://facebook.com/vintagethreads",
    },
    instagram: {
      followers: 8765,
      url: "https://instagram.com/vintagethreads",
    },
  },
  {
    id: "merchant-16",
    name: "Sushi Express",
    permalink: "sushi-express",
    businessType: "Restaurant",
    location: "Chicago, IL",
    contactName: "Kenji Tanaka",
    contactEmail: "kenji@sushiexpress.com",
    phone: "(555) 678-9012",
    website: "www.sushiexpress.com",
    description: "Fresh sushi and Japanese cuisine with quick service that doesn't compromise on quality or authenticity. The menu features traditional nigiri, sashimi, and specialty rolls crafted by experienced sushi chefs using daily-fresh fish sourced from trusted suppliers. Popular items include spicy tuna rolls, salmon avocado combinations, and creative specialty rolls with unique flavor profiles. Beyond sushi, the kitchen prepares teriyaki bowls, ramen, udon noodles, and tempura dishes. The fast-casual format allows customers to dine in or grab takeout during busy schedules. Modern decor combines Japanese aesthetics with contemporary design elements, creating an inviting space for lunch meetings or quick dinners.",
    status: "active",
    dealsCount: 11,
    createdDate: "2022-10-05",
    lastDealDate: "2021-12-20", // 3 years ago - INACTIVE
    lastContactDate: "2023-05-10", // 1.5+ years ago
    potential: "mid",
    potentialAnalysis: {
      overall: "mid",
      score: 74,
      factors: {
        marketDemand: { score: 78, notes: "Strong sushi demand in San Diego market." },
        historicalPerformance: { score: 72, notes: "Good performance with seasonal variations." },
        competitivePosition: { score: 75, notes: "Quality product at competitive prices." },
        growthTrend: { score: 73, notes: "Steady 25% growth with lunch crowd focus." },
        customerSatisfaction: { score: 72, notes: "4.4-star rating. Customers praise freshness." },
      },
      recommendations: [
        "Create lunch combo deals",
        "Offer family platter packages",
        "Launch sake pairing options",
        "Target corporate lunch orders",
      ],
      insights: "Sushi Express has good fundamentals. Focus on lunch market and corporate catering for growth.",
    },
    logo: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop&auto=format",
    googleMaps: {
      stars: 4.4,
      reviews: 678,
      address: "800 West Belmont Avenue, Chicago, IL",
      url: "https://maps.google.com/?cid=23401",
    },
    facebook: {
      likes: 5432,
      url: "https://facebook.com/sushiexpress",
    },
    instagram: {
      followers: 9876,
      url: "https://instagram.com/sushiexpress",
    },
  },
  {
    id: "merchant-17",
    name: "Kids Zone Play Center",
    permalink: "kids-zone-play-center",
    businessType: "Activities & Entertainment",
    location: "Chicago, IL",
    contactName: "Linda Martinez",
    contactEmail: "linda@kidszone.com",
    phone: "(555) 789-0123",
    website: "www.kidszone.com",
    description: "Indoor play center with activities for children ages 1-12 providing a safe, climate-controlled environment for active play year-round. The facility features bounce houses, climbing structures, slides, obstacle courses, and interactive games designed to promote physical activity and social development. Separate areas accommodate different age groups, ensuring age-appropriate challenges and safety. Birthday party packages include private party rooms, dedicated hosts, and customizable themes. Parents appreciate the comfortable seating areas with Wi-Fi where they can supervise while relaxing. The center maintains strict cleanliness protocols with regular sanitization. Special events like toddler times, parent's night out programs, and seasonal celebrations keep the experience fresh and engaging.",
    status: "active",
    dealsCount: 9,
    createdDate: "2023-01-20",
    lastDealDate: "2022-08-30", // 2+ years ago - INACTIVE
    lastContactDate: "2023-11-15", // 1 year ago
    potential: "high",
    potentialAnalysis: {
      overall: "high",
      score: 84,
      factors: {
        marketDemand: { score: 88, notes: "High demand for children's activities in Orlando." },
        historicalPerformance: { score: 81, notes: "Strong performance, especially on weekends." },
        competitivePosition: { score: 85, notes: "Unique facility with varied activities." },
        growthTrend: { score: 82, notes: "Growing 35% YoY with party bookings." },
        customerSatisfaction: { score: 84, notes: "4.6-star rating. Parents love safety and cleanliness." },
      },
      recommendations: [
        "Create birthday party packages",
        "Launch summer camp deals",
        "Offer family membership passes",
        "Add special events and themed days",
      ],
      insights: "Kids Zone has excellent potential with strong parent satisfaction. Birthday parties are major opportunity.",
    },
    logo: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=200&h=200&fit=crop&auto=format",
    googleMaps: {
      stars: 4.6,
      reviews: 892,
      address: "2800 North Sheffield Avenue, Chicago, IL",
      url: "https://maps.google.com/?cid=34012",
    },
    facebook: {
      likes: 8765,
      url: "https://facebook.com/kidszone",
    },
    instagram: {
      followers: 11234,
      url: "https://instagram.com/kidszone",
    },
  },
  {
    id: "merchant-18",
    name: "Green Thumb Garden Center",
    permalink: "green-thumb-garden",
    businessType: "Home & Garden",
    location: "Chicago, IL",
    contactName: "Robert Green",
    contactEmail: "robert@greenthumb.com",
    phone: "(555) 890-1234",
    website: "www.greenthumb.com",
    description: "Garden supplies, plants, and landscaping services for homeowners and professional gardeners seeking quality products and expert advice. The nursery stocks a wide variety of annuals, perennials, shrubs, trees, and seasonal plants, all carefully maintained to ensure healthy specimens. The retail section offers soil amendments, fertilizers, pest control solutions, gardening tools, pots, and decorative elements. Knowledgeable staff provide planting guidance, troubleshooting advice, and design consultations. Professional landscaping services handle everything from basic lawn maintenance to complete yard transformations, including hardscaping, irrigation installation, and sustainable xeriscape designs. Workshops on topics like organic gardening, native plants, and seasonal care build community among gardening enthusiasts.",
    status: "active",
    dealsCount: 5,
    createdDate: "2023-05-15",
    lastDealDate: "2022-07-10", // 2+ years ago - INACTIVE (seasonal business)
    lastContactDate: "2023-10-20", // 1+ year ago
    potential: "mid",
    potentialAnalysis: {
      overall: "mid",
      score: 69,
      factors: {
        marketDemand: { score: 75, notes: "Strong seasonal demand (spring/summer)." },
        historicalPerformance: { score: 66, notes: "Good during season, quiet off-season." },
        competitivePosition: { score: 70, notes: "Quality products but competing with big box stores." },
        growthTrend: { score: 68, notes: "Seasonal pattern, 18% growth overall." },
        customerSatisfaction: { score: 66, notes: "4.2-star rating. Good selection noted." },
      },
      recommendations: [
        "Launch early spring planting deals",
        "Create seasonal package bundles",
        "Offer landscaping service deals",
        "Add workshop and class experiences",
      ],
      insights: "Green Thumb is seasonal but has potential. Focus on spring launch and year-round services.",
    },
    logo: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=200&h=200&fit=crop&auto=format",
    googleMaps: {
      stars: 4.2,
      reviews: 445,
      address: "4500 North Ravenswood Avenue, Chicago, IL",
      url: "https://maps.google.com/?cid=45123",
    },
    facebook: {
      likes: 3456,
      url: "https://facebook.com/greenthumb",
    },
    instagram: {
      followers: 5678,
      url: "https://instagram.com/greenthumb",
    },
  },
  {
    id: "merchant-19",
    name: "Downtown Wine Bar",
    permalink: "downtown-wine-bar",
    businessType: "Bar",
    location: "Chicago, IL",
    contactName: "Victoria Romano",
    contactEmail: "victoria@downtownwine.com",
    phone: "(555) 901-2345",
    website: "www.downtownwine.com",
    description: "Upscale wine bar with small plates and live music creating an sophisticated yet welcoming atmosphere for wine enthusiasts and casual drinkers alike. The impressive wine list features over 150 selections from established vineyards and emerging winemakers worldwide, with knowledgeable sommeliers available for recommendations and pairings. Small plates menu includes artisanal cheeses, charcuterie boards, tapas, and seasonal chef specialties designed to complement the wines. Live music performances Thursday through Saturday showcase local jazz musicians, acoustic acts, and singer-songwriters. The elegant interior features exposed brick, soft lighting, and intimate seating arrangements perfect for date nights, celebrations, or after-work gatherings. Private tasting events and wine education classes deepen appreciation for fine wines.",
    status: "active",
    dealsCount: 7,
    createdDate: "2022-12-01",
    lastDealDate: "2024-11-05", // Very recent
    lastContactDate: "2024-11-09", // This week
    logo: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&h=200&fit=crop&auto=format",
    potential: "high",
    potentialAnalysis: {
      overall: "high",
      score: 87,
      factors: {
        marketDemand: { score: 90, notes: "Strong demand for upscale dining/drinking experiences." },
        historicalPerformance: { score: 85, notes: "Excellent performance, especially date night deals." },
        competitivePosition: { score: 88, notes: "Premium positioning with curated wine selection." },
        growthTrend: { score: 86, notes: "Growing 40% YoY with expanding wine offerings." },
        customerSatisfaction: { score: 86, notes: "4.7-star rating. Customers love ambiance." },
      },
      recommendations: [
        "Create wine tasting experience deals",
        "Offer pairing dinners with local chefs",
        "Launch happy hour packages",
        "Add private event deals",
      ],
      insights: "Downtown Wine Bar is a premium partner with strong brand and customer loyalty. Excellent for featured deals.",
    },
    googleMaps: {
      stars: 4.7,
      reviews: 687,
      address: "555 State St, Chicago, IL",
      url: "https://maps.google.com/?cid=77889",
    },
    facebook: {
      likes: 4532,
      url: "https://facebook.com/downtownwinebar",
    },
    instagram: {
      followers: 9876,
      url: "https://instagram.com/downtownwinebar",
    },
  },
  {
    id: "merchant-20",
    name: "Budget Motel Express",
    permalink: "budget-motel-express",
    businessType: "Hotel & Lodging",
    location: "Chicago, IL",
    contactName: "Frank Davidson",
    contactEmail: "frank@budgetmotel.com",
    phone: "(555) 012-3456",
    website: "www.budgetmotelexpress.com",
    description: "Affordable motel accommodations near the Strip offering budget-conscious travelers clean, comfortable rooms with convenient access to Las Vegas attractions. Rooms feature comfortable beds, flat-screen TVs, mini-fridges, microwaves, and complimentary Wi-Fi. The property includes an outdoor pool, free parking, and 24-hour front desk service. The location provides easy access to famous casinos, shows, and restaurants while offering significantly lower rates than resort properties. Continental breakfast is included in the room rate. While amenities are basic compared to luxury hotels, the motel delivers practical, value-oriented lodging for travelers prioritizing location and budget. Recent renovations have improved room conditions and updated furnishings.",
    status: "active",
    dealsCount: 14,
    createdDate: "2021-08-20",
    lastDealDate: "2021-10-25", // 3+ years ago - INACTIVE
    lastContactDate: "2022-06-10", // 2+ years ago
    potential: "low",
    potentialAnalysis: {
      overall: "low",
      score: 51,
      factors: {
        marketDemand: { score: 65, notes: "Budget segment has demand but margin pressures." },
        historicalPerformance: { score: 45, notes: "Declining performance with quality complaints." },
        competitivePosition: { score: 48, notes: "Struggling against newer budget chains." },
        growthTrend: { score: 50, notes: "Flat to declining. Facility needs updates." },
        customerSatisfaction: { score: 47, notes: "3.5-star rating. Cleanliness concerns raised." },
      },
      recommendations: [
        "Invest in facility improvements",
        "Focus on cleanliness and maintenance",
        "Reassess pricing and value proposition",
        "Consider reputation management strategy",
      ],
      insights: "Budget Motel needs significant operational improvements before scaling deal volume.",
    },
    logo: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=200&h=200&fit=crop&auto=format",
    googleMaps: {
      stars: 3.5,
      reviews: 534,
      address: "6300 North Western Avenue, Chicago, IL",
      url: "https://maps.google.com/?cid=56234",
    },
    facebook: {
      likes: 2987,
      url: "https://facebook.com/budgetmotel",
    },
    instagram: {
      followers: 1234,
      url: "https://instagram.com/budgetmotel",
    },
  },
  ...extendedMockAccounts,
  ...generatedMockAccounts, // 500 additional accounts (80%+ inactive)
];

export const getMerchantAccount = (id: string): MerchantAccount | undefined => {
  return merchantAccounts.find((account) => account.id === id);
};
