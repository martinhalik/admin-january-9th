/**
 * Update generated deals with image URLs
 * Maps deals to appropriate stock images based on category
 */

interface Deal {
  id: string;
  title: string;
  category: string;
  subcategory: string;
}

// Image mappings by category
const imageMap: Record<string, string[]> = {
  "Food & Drink": [
    "/images/burger-fries.jpg",
    "/images/fresh-salad.jpg",
    "/images/pasta-dish.jpg",
    "/images/pizza.jpg",
    "/images/steak-dinner.jpg",
    "/images/restaurant-interior.jpg",
    "/images/restaurant-kitchen.jpg",
    "/images/ai/chef-cooking.jpg",
    "/images/ai/elegant-dining.jpg",
    "/images/ai/fusion-cuisine.jpg",
    "/images/ai/gourmet-dish.jpg",
    "/images/ai/wine-tasting.jpg",
    "/images/stock/coffee-cup.jpg",
    "/images/stock/breakfast-plate.jpg",
    "/images/stock/cocktail-bar.jpg",
  ],
  "Activities & Entertainment": [
    "/images/adventure/outdoor-activity.jpg",
    "/images/ai/sushi-making.jpg",
    "/images/website/outdoor-seating.jpg",
  ],
  "Health & Beauty": [
    "/images/spa/spa-treatment.jpg",
    "/images/fitness/gym-workout.jpg",
  ],
  "Travel & Tourism": [
    "/images/website/modern-interior.jpg",
    "/images/website/outdoor-seating.jpg",
  ],
  "Automotive": [
    "/images/stock/coffee-cup.jpg", // Placeholder
  ],
  "Education": [
    "/images/ai/chef-cooking.jpg", // Classroom/workshop feel
  ],
  "Pet Services": [
    "/images/stock/breakfast-plate.jpg", // Placeholder
  ],
};

function getImageForDeal(deal: Deal): string {
  const categoryImages = imageMap[deal.category] || imageMap["Food & Drink"];
  
  // Use deal ID to consistently assign same image to same deal
  const index = parseInt(deal.id.replace(/\D/g, '')) % categoryImages.length;
  return categoryImages[index];
}

export function addImagesToDeals<T extends Deal>(deals: T[]): (T & { imageUrl: string })[] {
  return deals.map(deal => ({
    ...deal,
    imageUrl: getImageForDeal(deal),
  }));
}

// For use in generate script
export function getImageMapping(category: string, index: number): string {
  const categoryImages = imageMap[category] || imageMap["Food & Drink"];
  return categoryImages[index % categoryImages.length];
}








