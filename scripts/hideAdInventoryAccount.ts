/**
 * Script to set "ad-inventory services" employee to inactive
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function hideAdInventoryEmployee() {
  console.log('\n🔍 Searching for "ad-inventory services" employee...\n');
  
  // Find the employee
  const { data: employees, error: searchError } = await supabase
    .from('employees')
    .select('*')
    .eq('id', 'sf-0053c00000Bx01UAAR');
  
  if (searchError) {
    console.error('❌ Error searching:', searchError);
    return;
  }
  
  if (!employees || employees.length === 0) {
    console.log('ℹ️  Employee not found');
    return;
  }
  
  console.log(`✅ Found employee:\n`);
  employees.forEach((emp: any) => {
    console.log(`   - ${emp.id}: "${emp.name}"`);
    console.log(`     Status: ${emp.status}, Role: ${emp.role}`);
  });
  
  // Set status to 'inactive' to hide it
  console.log(`\n🔒 Setting employee to inactive...\n`);
  
  const { error: updateError } = await supabase
    .from('employees')
    .update({ status: 'inactive' })
    .eq('id', 'sf-0053c00000Bx01UAAR');
  
  if (updateError) {
    console.error(`❌ Error updating:`, updateError.message);
  } else {
    console.log(`✅ Hidden: ${employees[0].name}`);
  }
  
  console.log('\n✅ Done!\n');
}

hideAdInventoryEmployee();

