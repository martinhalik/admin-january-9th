/**
 * Seed employees and merchant accounts to Supabase
 * Standalone version that doesn't depend on frontend code
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials.');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('   SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

console.log('✓ Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Employee data extracted from hierarchy
const employees = [
  { id: 'emp-ceo-1', name: 'Robert Mitchell', email: 'robert.mitchell@groupon.com', role: 'admin', role_title: 'CEO', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face', phone: '(555) 100-0001', division: null, department: 'Executive', manager_id: null, location: 'Chicago, IL', hire_date: '2018-01-15', status: 'active' },
  { id: 'emp-vp-1', name: 'Jennifer Brown', email: 'jennifer.brown@groupon.com', role: 'executive', role_title: 'VP of Sales', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face', phone: '(555) 100-0002', division: null, department: 'Sales', manager_id: 'emp-ceo-1', location: 'Chicago, IL', hire_date: '2018-03-01', status: 'active' },
  { id: 'emp-dsm-1', name: 'Rachel Cooper', email: 'rachel.cooper@groupon.com', role: 'dsm', role_title: 'Divisional Sales Manager - East', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face', phone: '(555) 200-0001', division: 'East', department: 'Sales', manager_id: 'emp-vp-1', location: 'New York, NY', hire_date: '2019-02-15', status: 'active' },
  { id: 'emp-dsm-2', name: 'Thomas Anderson', email: 'thomas.anderson@groupon.com', role: 'dsm', role_title: 'Divisional Sales Manager - Central', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', phone: '(555) 200-0002', division: 'Central', department: 'Sales', manager_id: 'emp-vp-1', location: 'Chicago, IL', hire_date: '2019-04-10', status: 'active' },
  { id: 'emp-dsm-3', name: 'Patricia Wilson', email: 'patricia.wilson@groupon.com', role: 'dsm', role_title: 'Divisional Sales Manager - West', avatar: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=150&h=150&fit=crop&crop=face', phone: '(555) 200-0003', division: 'West', department: 'Sales', manager_id: 'emp-vp-1', location: 'Los Angeles, CA', hire_date: '2019-06-01', status: 'active' },
  
  // DSM 1 (East) - 2 MDs + 5 BDs
  { id: 'emp-md-1', name: 'Michael Brown', email: 'michael.brown@groupon.com', role: 'md', role_title: 'Merchant Development Representative', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0009', division: 'East', department: 'Sales', manager_id: 'emp-dsm-1', location: 'Boston, MA', hire_date: '2020-09-15', status: 'active' },
  { id: 'emp-md-2', name: 'Emily Rodriguez', email: 'emily.rodriguez@groupon.com', role: 'md', role_title: 'Merchant Development Representative', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0010', division: 'East', department: 'Sales', manager_id: 'emp-dsm-1', location: 'Miami, FL', hire_date: '2020-10-20', status: 'active' },
  { id: 'emp-bd-1', name: 'Alex Thompson', email: 'alex.thompson@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0001', division: 'East', department: 'Sales', manager_id: 'emp-dsm-1', location: 'Boston, MA', hire_date: '2021-01-10', status: 'active' },
  { id: 'emp-bd-2', name: 'Sarah Chen', email: 'sarah.chen@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0002', division: 'East', department: 'Sales', manager_id: 'emp-dsm-1', location: 'Boston, MA', hire_date: '2021-02-15', status: 'active' },
  { id: 'emp-bd-3', name: 'Brian Wilson', email: 'brian.wilson@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0003', division: 'East', department: 'Sales', manager_id: 'emp-dsm-1', location: 'New York, NY', hire_date: '2021-03-20', status: 'active' },
  { id: 'emp-bd-4', name: 'Angela Rodriguez', email: 'angela.rodriguez@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0004', division: 'East', department: 'Sales', manager_id: 'emp-dsm-1', location: 'Philadelphia, PA', hire_date: '2021-04-10', status: 'active' },
  { id: 'emp-bd-5', name: 'Kevin Martinez', email: 'kevin.martinez@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0005', division: 'East', department: 'Sales', manager_id: 'emp-dsm-1', location: 'Miami, FL', hire_date: '2021-05-15', status: 'active' },

  // DSM 2 (Central) - 2 MDs + 5 BDs
  { id: 'emp-md-3', name: 'Christopher Lee', email: 'christopher.lee@groupon.com', role: 'md', role_title: 'Merchant Development Representative', avatar: 'https://images.unsplash.com/photo-1558203728-00f45181dd84?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0011', division: 'Central', department: 'Sales', manager_id: 'emp-dsm-2', location: 'Chicago, IL', hire_date: '2020-11-10', status: 'active' },
  { id: 'emp-md-4', name: 'Amanda White', email: 'amanda.white@groupon.com', role: 'md', role_title: 'Merchant Development Representative', avatar: 'https://images.unsplash.com/photo-1589156288859-f0cb0d82b065?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0012', division: 'Central', department: 'Sales', manager_id: 'emp-dsm-2', location: 'Dallas, TX', hire_date: '2021-09-15', status: 'active' },
  { id: 'emp-bd-6', name: 'Daniel Garcia', email: 'daniel.garcia@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0006', division: 'Central', department: 'Sales', manager_id: 'emp-dsm-2', location: 'Chicago, IL', hire_date: '2021-06-20', status: 'active' },
  { id: 'emp-bd-7', name: 'Michelle Davis', email: 'michelle.davis@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0007', division: 'Central', department: 'Sales', manager_id: 'emp-dsm-2', location: 'Detroit, MI', hire_date: '2021-07-15', status: 'active' },
  { id: 'emp-bd-8', name: 'James Wilson', email: 'james.wilson@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0008', division: 'Central', department: 'Sales', manager_id: 'emp-dsm-2', location: 'Minneapolis, MN', hire_date: '2021-08-10', status: 'active' },
  { id: 'emp-bd-9', name: 'Jennifer Taylor', email: 'jennifer.taylor@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0009', division: 'Central', department: 'Sales', manager_id: 'emp-dsm-2', location: 'Dallas, TX', hire_date: '2021-09-20', status: 'active' },
  { id: 'emp-bd-10', name: 'Robert Anderson', email: 'robert.anderson@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0010', division: 'Central', department: 'Sales', manager_id: 'emp-dsm-2', location: 'St. Louis, MO', hire_date: '2021-10-05', status: 'active' },

  // DSM 3 (West) - 2 MDs + 5 BDs
  { id: 'emp-md-5', name: 'Steven Harris', email: 'steven.harris@groupon.com', role: 'md', role_title: 'Merchant Development Representative', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0013', division: 'West', department: 'Sales', manager_id: 'emp-dsm-3', location: 'San Francisco, CA', hire_date: '2021-12-01', status: 'active' },
  { id: 'emp-md-6', name: 'Jessica Moore', email: 'jessica.moore@groupon.com', role: 'md', role_title: 'Merchant Development Representative', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0014', division: 'West', department: 'Sales', manager_id: 'emp-dsm-3', location: 'Los Angeles, CA', hire_date: '2021-11-15', status: 'active' },
  { id: 'emp-bd-11', name: 'Ryan Moore', email: 'ryan.moore@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0011', division: 'West', department: 'Sales', manager_id: 'emp-dsm-3', location: 'San Francisco, CA', hire_date: '2021-07-15', status: 'active' },
  { id: 'emp-bd-12', name: 'Nicole Anderson', email: 'nicole.anderson@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0012', division: 'West', department: 'Sales', manager_id: 'emp-dsm-3', location: 'Los Angeles, CA', hire_date: '2021-08-10', status: 'active' },
  { id: 'emp-bd-13', name: 'David Martinez', email: 'david.martinez@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0013', division: 'West', department: 'Sales', manager_id: 'emp-dsm-3', location: 'San Diego, CA', hire_date: '2021-09-05', status: 'active' },
  { id: 'emp-bd-14', name: 'Laura Johnson', email: 'laura.johnson@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0014', division: 'West', department: 'Sales', manager_id: 'emp-dsm-3', location: 'Seattle, WA', hire_date: '2021-10-15', status: 'active' },
  { id: 'emp-bd-15', name: 'Thomas White', email: 'thomas.white@groupon.com', role: 'bd', role_title: 'Business Development Representative', avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0015', division: 'West', department: 'Sales', manager_id: 'emp-dsm-3', location: 'Portland, OR', hire_date: '2021-11-20', status: 'active' },
  
  // Market Managers (for other organizational needs)
  { id: 'emp-mm-1', name: 'David Kim', email: 'david.kim@groupon.com', role: 'mm', role_title: 'Market Manager - Northeast', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face', phone: '(555) 301-0001', division: 'East', department: 'Sales', manager_id: 'emp-dsm-1', location: 'Boston, MA', hire_date: '2020-01-15', status: 'active' },
  { id: 'emp-mm-2', name: 'Linda Robinson', email: 'linda.robinson@groupon.com', role: 'mm', role_title: 'Market Manager - Midwest', avatar: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=150&h=150&fit=crop&crop=face', phone: '(555) 301-0002', division: 'Central', department: 'Sales', manager_id: 'emp-dsm-2', location: 'Chicago, IL', hire_date: '2020-02-10', status: 'active' },
  { id: 'emp-mm-3', name: 'Patricia Davis', email: 'patricia.davis@groupon.com', role: 'mm', role_title: 'Market Manager - Pacific', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face', phone: '(555) 301-0003', division: 'West', department: 'Sales', manager_id: 'emp-dsm-3', location: 'San Francisco, CA', hire_date: '2020-05-01', status: 'active' },
  
  // Content Team
  { id: 'emp-vp-2', name: 'Christopher Davis', email: 'christopher.davis@groupon.com', role: 'executive', role_title: 'VP of Operations', avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop&crop=face', phone: '(555) 100-0003', division: null, department: 'Operations', manager_id: 'emp-ceo-1', location: 'Chicago, IL', hire_date: '2019-06-20', status: 'active' },
  { id: 'emp-content-mgr-1', name: 'Victoria Martinez', email: 'victoria.martinez@groupon.com', role: 'content-ops-manager', role_title: 'Content Operations Manager', avatar: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=150&h=150&fit=crop&crop=face', phone: '(555) 301-0006', division: null, department: 'Operations', manager_id: 'emp-vp-2', location: 'Chicago, IL', hire_date: '2020-11-01', status: 'active' },
  { id: 'emp-content-1', name: 'Olivia Davis', email: 'olivia.davis@groupon.com', role: 'content-ops-staff', role_title: 'Content Operations Specialist', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0014', division: null, department: 'Operations', manager_id: 'emp-content-mgr-1', location: 'Chicago, IL', hire_date: '2022-01-10', status: 'active' },
  { id: 'emp-content-2', name: 'Nathan Wright', email: 'nathan.wright@groupon.com', role: 'content-ops-staff', role_title: 'Content Operations Specialist', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face', phone: '(555) 401-0015', division: null, department: 'Operations', manager_id: 'emp-content-mgr-1', location: 'Chicago, IL', hire_date: '2022-03-15', status: 'active' },
];

async function seedEmployees() {
  console.log('📊 Seeding employees...');
  
  const { data, error } = await supabase
    .from('employees')
    .upsert(employees, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding employees:', error);
    throw error;
  }

  console.log(`✅ Seeded ${employees.length} employees`);
  return employees;
}

async function seedMerchantAccounts() {
  console.log('📊 Seeding merchant accounts...');
  
  // Get BD and MD employees
  const { data: accountOwners, error: ownersError} = await supabase
    .from('employees')
    .select('id, name, role')
    .in('role', ['bd', 'md'])
    .eq('status', 'active');

  if (ownersError) {
    console.error('❌ Error fetching account owners:', ownersError);
    throw ownersError;
  }

  console.log(`Found ${accountOwners.length} potential account owners (BD/MD)`);

  // Generate 60 merchant accounts with varied data
  const businessTypes = ['Restaurant', 'Cafe', 'Salon', 'Spa', 'Gym', 'Yoga Studio', 'Retail', 'Electronics', 'Boutique', 'Bar'];
  const statuses = ['active', 'active', 'active', 'active', 'pending']; // 80% active
  const potentials = ['high', 'mid', 'low'];
  const cities = ['New York', 'Boston', 'Miami', 'Chicago', 'Dallas', 'Los Angeles', 'San Francisco', 'Seattle'];
  
  const businessNames = [
    'Sunrise Cafe', 'Urban Grill', 'Ocean View Restaurant', 'The Green Leaf',
    'Metro Bistro', 'Golden Fork', 'Blue Plate Diner', 'Rustic Kitchen',
    'Bella Trattoria', 'Spice Market', 'The Corner Pub', 'Rooftop Lounge',
    'Fresh & Co', 'Healthy Bites', 'Power Gym', 'Zen Yoga', 
    'Beauty Bar Salon', 'Luxe Spa', 'Serenity Day Spa', 'Hair Studio Pro',
    'Tech Haven', 'Gadget World', 'Smart Electronics', 'Digital Hub',
    'Fashion Forward', 'Style Boutique', 'Trendy Threads', 'Vintage Finds',
    'Artisan Coffee', 'Brew House', 'The Daily Grind', 'Espresso Bar',
    'Pizza Palace', 'Sushi Express', 'Burger Shack', 'Taco Fiesta',
    'Mediterranean Grill', 'Thai Spice', 'India Palace', 'Dragon Wok',
    'Steakhouse Prime', 'Seafood Harbor', 'The Veggie Garden', 'Farm Table',
    'Crossfit Box', 'Pilates Plus', 'Dance Studio Elite', 'Martial Arts Academy',
    'Pet Grooming Pro', 'Vet Care Center', 'Auto Repair Shop', 'Car Wash Express',
    'Dental Smile', 'Family Medical', 'Kids Play Zone', 'Learning Center',
    'Music School', 'Art Gallery', 'Photography Studio', 'Event Space',
    'Flower Shop', 'Garden Center', 'Hardware Store', 'Home Decor'
  ];

  const accounts = [];
  
  for (let i = 0; i < 60; i++) {
    // Assign owners in round-robin fashion, with some unassigned
    let accountOwnerId = null;
    // Assign owners for most accounts (skip i=5-9 and i=55-59 to leave 10 unassigned)
    if (i < 5 || (i >= 10 && i < 55)) {
      const ownerIndex = i % accountOwners.length;
      accountOwnerId = accountOwners[ownerIndex].id;
    }
    // Unassigned: i=5,6,7,8,9 (5 accounts) and i=55,56,57,58,59 (5 accounts) = 10 total
    
    const businessType = businessTypes[i % businessTypes.length];
    const name = businessNames[i % businessNames.length] + (i >= businessNames.length ? ` ${Math.floor(i / businessNames.length) + 1}` : '');
    
    accounts.push({
      id: `merchant-${String(i + 1).padStart(3, '0')}`,
      name,
      business_type: businessType,
      location: `${cities[i % cities.length]}, ${['NY', 'MA', 'FL', 'IL', 'TX', 'CA', 'CA', 'WA'][i % cities.length]}`,
      status: statuses[i % statuses.length],
      potential: potentials[i % potentials.length],
      deals_count: Math.floor(Math.random() * 5),
      account_owner_id: accountOwnerId,
    });
  }

  const { data, error } = await supabase
    .from('merchant_accounts')
    .upsert(accounts, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding merchant accounts:', error);
    throw error;
  }

  const assignedCount = accounts.filter(a => a.account_owner_id).length;
  const unassignedCount = accounts.length - assignedCount;

  console.log(`✅ Seeded ${accounts.length} merchant accounts`);
  console.log(`   - ${assignedCount} assigned to account owners`);
  console.log(`   - ${unassignedCount} unassigned`);

  // Show distribution
  const distribution: Record<string, number> = {};
  accounts.forEach(account => {
    if (account.account_owner_id) {
      const owner = accountOwners.find(o => o.id === account.account_owner_id);
      if (owner) {
        distribution[owner.name] = (distribution[owner.name] || 0) + 1;
      }
    }
  });

  console.log('\n📈 Account distribution:');
  Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .forEach(([name, count]) => {
      console.log(`   ${name}: ${count} accounts`);
    });

  return accounts;
}

async function main() {
  try {
    console.log('🚀 Starting seed process...\n');

    // Delete existing data
    console.log('🗑️  Clearing existing data...');
    await supabase.from('merchant_accounts').delete().neq('id', '');
    await supabase.from('employees').delete().neq('id', '');
    console.log('✅ Cleared existing data\n');

    // Seed employees first
    await seedEmployees();
    console.log('');

    // Seed merchant accounts
    await seedMerchantAccounts();
    console.log('');

    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

main();

