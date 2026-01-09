/**
 * Update existing deals with unique Unsplash images
 * Uses pre-defined image URLs - NO API key required
 * 
 * Usage:
 *   npx ts-node scripts/updateDealImages.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Pre-defined unique Unsplash images by category
const imagesByCategory: Record<string, string[]> = {
  "Food & Drink": [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80",
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80",
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&q=80",
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80",
    "https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?w=800&q=80",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80",
    "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
    "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80",
    "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=800&q=80",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800&q=80",
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&q=80",
    "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80",
    "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80",
    "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&q=80",
    "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80",
    "https://images.unsplash.com/photo-1485963631004-f2f00b1d6571?w=800&q=80",
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
    "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80",
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80",
    "https://images.unsplash.com/photo-1496412705862-e0088f16f791?w=800&q=80",
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80",
    "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
  ],
  "Activities & Entertainment": [
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80",
    "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80",
    "https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=800&q=80",
    "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80",
    "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80",
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    "https://images.unsplash.com/photo-1560252829-804f1aedf1be?w=800&q=80",
    "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&q=80",
    "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80",
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80",
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
    "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
    "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=800&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=800&q=80",
    "https://images.unsplash.com/photo-1504194104404-433180773017?w=800&q=80",
  ],
  "Health & Beauty": [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
    "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80",
    "https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=80",
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80",
    "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80",
    "https://images.unsplash.com/photo-1532926381893-7542290edf1d?w=800&q=80",
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
    "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=800&q=80",
    "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800&q=80",
    "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=800&q=80",
    "https://images.unsplash.com/photo-1583416750470-965b2707b355?w=800&q=80",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80",
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&q=80",
    "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=800&q=80",
  ],
  "Travel & Tourism": [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    "https://images.unsplash.com/photo-1559599238-308793637427?w=800&q=80",
    "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&q=80",
    "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80",
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&q=80",
    "https://images.unsplash.com/photo-1580977276076-ae4b8c219b8e?w=800&q=80",
    "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=800&q=80",
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
    "https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=800&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80",
  ],
  "Automotive": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80",
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80",
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80",
    "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&q=80",
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
    "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80",
    "https://images.unsplash.com/photo-1580827140897-a61aa3df32f7?w=800&q=80",
    "https://images.unsplash.com/photo-1486673748761-a8d18475c757?w=800&q=80",
  ],
  "Education": [
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
    "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=800&q=80",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
    "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    "https://images.unsplash.com/photo-1558008258-3256797b43f3?w=800&q=80",
    "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80",
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=800&q=80",
    "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80",
  ],
  "Pet Services": [
    "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80",
    "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80",
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
    "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=800&q=80",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
    "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=800&q=80",
    "https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=800&q=80",
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80",
    "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800&q=80",
    "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&q=80",
    "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=80",
    "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&q=80",
    "https://images.unsplash.com/photo-1494947665470-20322015e3a8?w=800&q=80",
    "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&q=80",
    "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=800&q=80",
  ]
};

// Track used indices per category to avoid duplicates
const usedIndices: Record<string, Set<number>> = {};

function getUniqueImage(category: string, dealIndex: number): string {
  const images = imagesByCategory[category] || imagesByCategory["Food & Drink"];
  
  if (!usedIndices[category]) {
    usedIndices[category] = new Set();
  }
  
  const usedSet = usedIndices[category];
  let index = dealIndex % images.length;
  
  // Find unused index
  let attempts = 0;
  while (usedSet.has(index) && attempts < images.length) {
    index = (index + 1) % images.length;
    attempts++;
  }
  
  // Reset if all used
  if (attempts >= images.length) {
    usedSet.clear();
    index = dealIndex % images.length;
  }
  
  usedSet.add(index);
  return images[index];
}

async function main() {
  console.log('🖼️  Updating Deal Images\n');
  
  // Fetch all deals
  console.log('📦 Fetching deals from Supabase...');
  const { data: deals, error } = await supabase
    .from('deals')
    .select('id, category')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Error fetching deals:', error);
    process.exit(1);
  }
  
  if (!deals || deals.length === 0) {
    console.log('⚠️  No deals found');
    process.exit(0);
  }
  
  console.log(`   Found ${deals.length} deals\n`);
  
  // Group by category for logging
  const categoryCount: Record<string, number> = {};
  deals.forEach(d => {
    categoryCount[d.category] = (categoryCount[d.category] || 0) + 1;
  });
  
  console.log('📊 Category distribution:');
  Object.entries(categoryCount).forEach(([cat, count]) => {
    const available = (imagesByCategory[cat] || imagesByCategory["Food & Drink"]).length;
    console.log(`   ${cat}: ${count} deals, ${available} unique images`);
  });
  console.log('');
  
  // Update each deal
  console.log('🔄 Updating images...');
  let updated = 0;
  let failed = 0;
  
  for (let i = 0; i < deals.length; i++) {
    const deal = deals[i];
    const imageUrl = getUniqueImage(deal.category, i);
    
    const { error: updateError } = await supabase
      .from('deals')
      .update({ image_url: imageUrl })
      .eq('id', deal.id);
    
    if (updateError) {
      console.error(`   ✗ ${deal.id}: ${updateError.message}`);
      failed++;
    } else {
      updated++;
    }
    
    // Progress every 50
    if ((i + 1) % 50 === 0) {
      console.log(`   Progress: ${i + 1}/${deals.length}`);
    }
  }
  
  console.log(`\n✅ Done!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
}

main().catch(console.error);














