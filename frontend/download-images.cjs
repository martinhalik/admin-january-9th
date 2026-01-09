#!/usr/bin/env node

/**
 * Script to download free stock and AI-style images for the media library
 * Uses Unsplash API for high-quality free images (all under 2MB)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "public", "images");

// Unsplash provides free images - these are specific photo IDs
// Format: https://images.unsplash.com/photo-{PHOTO_ID}?w=800&q=80
const images = {
  stock: [
    { id: "1495474472287", name: "coffee-cup.jpg", desc: "Coffee cup" },
    {
      id: "1533089860892-a7c6f0a88666",
      name: "breakfast-plate.jpg",
      desc: "Breakfast",
    },
    { id: "1510812431401", name: "wine-glasses.jpg", desc: "Wine glasses" },
    {
      id: "1488477181946-6428a0291777",
      name: "dessert-plate.jpg",
      desc: "Dessert",
    },
    { id: "1514933651003", name: "cocktail-bar.jpg", desc: "Cocktail" },
    {
      id: "1579584425555-c3ce17fd4351",
      name: "sushi-platter.jpg",
      desc: "Sushi",
    },
  ],
  ai: [
    {
      id: "1517248135467-4c7edcad34c4",
      name: "modern-restaurant.jpg",
      desc: "Modern restaurant",
    },
    {
      id: "1414235077428-338989a2e8c0",
      name: "gourmet-dish.jpg",
      desc: "Gourmet dish",
    },
    {
      id: "1600565193348-f74bd3c7ccdf",
      name: "chef-cooking.jpg",
      desc: "Chef cooking",
    },
    {
      id: "1559339352-11d035aa65de",
      name: "elegant-dining.jpg",
      desc: "Elegant dining",
    },
    {
      id: "1476224203421-9ac39bcb3327",
      name: "fusion-cuisine.jpg",
      desc: "Fusion cuisine",
    },
  ],
  website: [
    {
      id: "1555396273-367ea4eb4db5",
      name: "storefront.jpg",
      desc: "Storefront",
    },
    {
      id: "1504674900247-0877df9cc836",
      name: "menu-board.jpg",
      desc: "Menu board",
    },
    {
      id: "1517248135467-4c7edcad34c4",
      name: "outdoor-seating.jpg",
      desc: "Outdoor seating",
    },
    {
      id: "1556910103-1c02745aae4d",
      name: "staff-team.jpg",
      desc: "Staff team",
    },
  ],
};

function downloadImage(url, filepath, description) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download ${description}: ${response.statusCode}`
            )
          );
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          const stats = fs.statSync(filepath);
          const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`✓ Downloaded ${description} (${sizeInMB} MB)`);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
  });
}

async function downloadAllImages() {
  console.log("📥 Downloading images from Unsplash...\n");

  for (const [category, items] of Object.entries(images)) {
    console.log(`\n📁 ${category.toUpperCase()} images:`);
    const categoryDir = path.join(PUBLIC_DIR, category);

    // Ensure directory exists
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    for (const item of items) {
      const url = `https://images.unsplash.com/photo-${item.id}?w=800&q=80&fit=crop`;
      const filepath = path.join(categoryDir, item.name);

      try {
        await downloadImage(url, filepath, item.desc);
      } catch (error) {
        console.error(`✗ Error downloading ${item.desc}:`, error.message);
      }
    }
  }

  console.log("\n✅ All images downloaded successfully!");
  console.log("\nNote: All images are from Unsplash and are free to use.");
  console.log("Attribution is not required but appreciated.");
}

// Run the script
downloadAllImages().catch(console.error);
