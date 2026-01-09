export interface SimilarDeal {
  id: string;
  title: string;
  location: string;
  category: string;
  status: string;
  quality: string;
  stats: {
    revenue: number;
    purchases: number;
    views: number;
  };
  content: {
    media: Array<{
      id: string;
      url: string;
      isFeatured?: boolean;
      type: "image" | "video";
    }>;
  };
  options: Array<{
    id: string;
    name: string;
    regularPrice: number;
    grouponPrice: number;
    discount: number;
    status: string;
  }>;
}

// Mock similar deals data with different scenarios
export const similarDealsData: Record<string, SimilarDeal[]> = {
  // Deal 1 - Mexican restaurant (4 similar deals)
  "1": [
    {
      id: "2", // Spa deal
      title: "Luxury Spa Day Package - 60-Minute Massage & Facial Treatment",
      location: "Serenity Spa, Chicago",
      category: "Health & Beauty",
      status: "Live",
      quality: "Good",
      stats: {
        revenue: 8500,
        purchases: 180,
        views: 45000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/spa/spa-treatment.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "60-Minute Swedish Massage",
          regularPrice: 120,
          grouponPrice: 75,
          discount: 37,
          status: "Live",
        },
      ],
    },
    {
      id: "3", // Italian restaurant
      title:
        "Italian Fine Dining Experience - 3-Course Dinner for Two with Wine",
      location: "Bella Italia, New York",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 12000,
        purchases: 200,
        views: 75000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/pasta-dish.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "3-Course Dinner for Two",
          regularPrice: 180,
          grouponPrice: 120,
          discount: 33,
          status: "Live",
        },
      ],
    },
    {
      id: "9", // Cooking class
      title: "Sushi Master Class - Learn Traditional Japanese Cuisine",
      location: "Tokyo Kitchen, San Francisco",
      category: "Activities & Entertainment",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 15000,
        purchases: 100,
        views: 60000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/ai/sushi-making.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "Sushi Master Class",
          regularPrice: 120,
          grouponPrice: 80,
          discount: 33,
          status: "Live",
        },
      ],
    },
    {
      id: "10", // Wine tasting
      title: "Wine Tasting Experience - Premium Vintages and Food Pairings",
      location: "Napa Valley Cellars, Napa",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 18000,
        purchases: 150,
        views: 75000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/ai/wine-tasting.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "Premium Wine Tasting",
          regularPrice: 80,
          grouponPrice: 55,
          discount: 31,
          status: "Live",
        },
      ],
    },
  ],

  // Deal 2 - Spa (1 similar deal)
  "2": [
    {
      id: "1", // Mexican restaurant
      title:
        "Save Up to 36% $45 towards Dinner at Chimi's Fresh-Mex – Authentic Mexican Food & Margaritas",
      location: "Chimi's Fresh-Mex, Wentzville",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 12023,
        purchases: 303,
        views: 132200000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/burger-fries.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "$10 Toward Dinner - Wentzville Location",
          regularPrice: 40,
          grouponPrice: 7,
          discount: 82,
          status: "Live",
        },
      ],
    },
  ],

  // Deal 3 - Italian restaurant (4 similar deals)
  "3": [
    {
      id: "1", // Mexican restaurant
      title:
        "Save Up to 36% $45 towards Dinner at Chimi's Fresh-Mex – Authentic Mexican Food & Margaritas",
      location: "Chimi's Fresh-Mex, Wentzville",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 12023,
        purchases: 303,
        views: 132200000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/burger-fries.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "$10 Toward Dinner - Wentzville Location",
          regularPrice: 40,
          grouponPrice: 7,
          discount: 82,
          status: "Live",
        },
      ],
    },
    {
      id: "8", // Resort
      title: "Beachfront Resort Getaway - 2-Night Luxury Stay with Ocean View",
      location: "Ocean View Resort, San Diego",
      category: "Travel & Lodging",
      status: "Live",
      quality: "Good",
      stats: {
        revenue: 25000,
        purchases: 120,
        views: 100000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/website/outdoor-seating.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "2-Night Ocean View Suite",
          regularPrice: 400,
          grouponPrice: 280,
          discount: 30,
          status: "Live",
        },
      ],
    },
    {
      id: "9", // Cooking class
      title: "Sushi Master Class - Learn Traditional Japanese Cuisine",
      location: "Tokyo Kitchen, San Francisco",
      category: "Activities & Entertainment",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 15000,
        purchases: 100,
        views: 60000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/ai/sushi-making.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "Sushi Master Class",
          regularPrice: 120,
          grouponPrice: 80,
          discount: 33,
          status: "Live",
        },
      ],
    },
    {
      id: "10", // Wine tasting
      title: "Wine Tasting Experience - Premium Vintages and Food Pairings",
      location: "Napa Valley Cellars, Napa",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 18000,
        purchases: 150,
        views: 75000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/ai/wine-tasting.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "Premium Wine Tasting",
          regularPrice: 80,
          grouponPrice: 55,
          discount: 31,
          status: "Live",
        },
      ],
    },
  ],

  // Deal 4 - Fitness (0 similar deals)
  "4": [],

  // Deal 5 - Hair salon (1 similar deal)
  "5": [
    {
      id: "2", // Spa
      title: "Luxury Spa Day Package - 60-Minute Massage & Facial Treatment",
      location: "Serenity Spa, Chicago",
      category: "Health & Beauty",
      status: "Live",
      quality: "Good",
      stats: {
        revenue: 8500,
        purchases: 180,
        views: 45000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/spa/spa-treatment.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "60-Minute Swedish Massage",
          regularPrice: 120,
          grouponPrice: 75,
          discount: 37,
          status: "Live",
        },
      ],
    },
  ],

  // Deal 6 - Adventure (4 similar deals)
  "6": [
    {
      id: "1", // Mexican restaurant
      title:
        "Save Up to 36% $45 towards Dinner at Chimi's Fresh-Mex – Authentic Mexican Food & Margaritas",
      location: "Chimi's Fresh-Mex, Wentzville",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 12023,
        purchases: 303,
        views: 132200000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/burger-fries.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "$10 Toward Dinner - Wentzville Location",
          regularPrice: 40,
          grouponPrice: 7,
          discount: 82,
          status: "Live",
        },
      ],
    },
    {
      id: "3", // Italian restaurant
      title:
        "Italian Fine Dining Experience - 3-Course Dinner for Two with Wine",
      location: "Bella Italia, New York",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 12000,
        purchases: 200,
        views: 75000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/pasta-dish.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "3-Course Dinner for Two",
          regularPrice: 180,
          grouponPrice: 120,
          discount: 33,
          status: "Live",
        },
      ],
    },
    {
      id: "8", // Resort
      title: "Beachfront Resort Getaway - 2-Night Luxury Stay with Ocean View",
      location: "Ocean View Resort, San Diego",
      category: "Travel & Lodging",
      status: "Live",
      quality: "Good",
      stats: {
        revenue: 25000,
        purchases: 120,
        views: 100000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/website/outdoor-seating.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "2-Night Ocean View Suite",
          regularPrice: 400,
          grouponPrice: 280,
          discount: 30,
          status: "Live",
        },
      ],
    },
    {
      id: "9", // Cooking class
      title: "Sushi Master Class - Learn Traditional Japanese Cuisine",
      location: "Tokyo Kitchen, San Francisco",
      category: "Activities & Entertainment",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 15000,
        purchases: 100,
        views: 60000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/ai/sushi-making.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "Sushi Master Class",
          regularPrice: 120,
          grouponPrice: 80,
          discount: 33,
          status: "Live",
        },
      ],
    },
  ],

  // Deal 7 - Coffee (0 similar deals)
  "7": [],

  // Deal 8 - Resort (1 similar deal)
  "8": [
    {
      id: "3", // Italian restaurant
      title:
        "Italian Fine Dining Experience - 3-Course Dinner for Two with Wine",
      location: "Bella Italia, New York",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 12000,
        purchases: 200,
        views: 75000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/pasta-dish.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "3-Course Dinner for Two",
          regularPrice: 180,
          grouponPrice: 120,
          discount: 33,
          status: "Live",
        },
      ],
    },
  ],

  // Deal 9 - Cooking class (4 similar deals)
  "9": [
    {
      id: "1", // Mexican restaurant
      title:
        "Save Up to 36% $45 towards Dinner at Chimi's Fresh-Mex – Authentic Mexican Food & Margaritas",
      location: "Chimi's Fresh-Mex, Wentzville",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 12023,
        purchases: 303,
        views: 132200000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/burger-fries.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "$10 Toward Dinner - Wentzville Location",
          regularPrice: 40,
          grouponPrice: 7,
          discount: 82,
          status: "Live",
        },
      ],
    },
    {
      id: "3", // Italian restaurant
      title:
        "Italian Fine Dining Experience - 3-Course Dinner for Two with Wine",
      location: "Bella Italia, New York",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 12000,
        purchases: 200,
        views: 75000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/pasta-dish.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "3-Course Dinner for Two",
          regularPrice: 180,
          grouponPrice: 120,
          discount: 33,
          status: "Live",
        },
      ],
    },
    {
      id: "6", // Adventure
      title: "Adventure Day Package - Zip-lining and Rock Climbing Experience",
      location: "Adventure Escapes, Denver",
      category: "Activities & Entertainment",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 8500,
        purchases: 110,
        views: 35000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/adventure/outdoor-activity.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "Full Day Adventure Package",
          regularPrice: 150,
          grouponPrice: 95,
          discount: 36,
          status: "Live",
        },
      ],
    },
    {
      id: "10", // Wine tasting
      title: "Wine Tasting Experience - Premium Vintages and Food Pairings",
      location: "Napa Valley Cellars, Napa",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 18000,
        purchases: 150,
        views: 75000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/ai/wine-tasting.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "Premium Wine Tasting",
          regularPrice: 80,
          grouponPrice: 55,
          discount: 31,
          status: "Live",
        },
      ],
    },
  ],

  // Deal 10 - Wine tasting (1 similar deal)
  "10": [
    {
      id: "1", // Mexican restaurant
      title:
        "Save Up to 36% $45 towards Dinner at Chimi's Fresh-Mex – Authentic Mexican Food & Margaritas",
      location: "Chimi's Fresh-Mex, Wentzville",
      category: "Food & Drink",
      status: "Live",
      quality: "Ace",
      stats: {
        revenue: 12023,
        purchases: 303,
        views: 132200000,
      },
      content: {
        media: [
          {
            id: "1",
            url: "/images/burger-fries.jpg",
            isFeatured: true,
            type: "image",
          },
        ],
      },
      options: [
        {
          id: "1",
          name: "$10 Toward Dinner - Wentzville Location",
          regularPrice: 40,
          grouponPrice: 7,
          discount: 82,
          status: "Live",
        },
      ],
    },
  ],
};

// Function to get similar deals for a specific deal
export const getSimilarDeals = (dealId: string): SimilarDeal[] => {
  return similarDealsData[dealId] || [];
};

// Function to get all similar deals for display in the deals list
export const getAllSimilarDeals = (): SimilarDeal[] => {
  const allSimilarDeals: SimilarDeal[] = [];
  Object.values(similarDealsData).forEach((deals) => {
    allSimilarDeals.push(...deals);
  });
  return allSimilarDeals;
};
