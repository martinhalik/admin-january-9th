import jsforce from 'jsforce';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = new jsforce.Connection({ loginUrl: 'https://groupon-dev.my.salesforce.com' });

async function getComprehensiveStats() {
  await conn.login('salesforce@groupon.com', 'gRoup0n!CYSCBNTRwp9ObHBAWOzLjWAT');
  
  console.log('='.repeat(80));
  console.log('COMPREHENSIVE SALESFORCE CLOSED WON STATS');
  console.log('='.repeat(80));
  
  // 1. Total Closed Won deals by time period
  console.log('\n📊 TOTAL CLOSED WON DEALS BY PERIOD:\n');
  
  const allTimeQuery = `
    SELECT COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
  `;
  const allTime = await conn.query(allTimeQuery);
  console.log(`  All Time (US):              ${allTime.records[0].cnt.toLocaleString()} deals`);
  
  const since2020Query = `
    SELECT COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
      AND CreatedDate >= 2020-01-01T00:00:00Z
  `;
  const since2020 = await conn.query(since2020Query);
  console.log(`  Since 2020:                 ${since2020.records[0].cnt.toLocaleString()} deals`);
  
  const since2023Query = `
    SELECT COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
      AND CreatedDate >= 2023-01-01T00:00:00Z
  `;
  const since2023 = await conn.query(since2023Query);
  console.log(`  Since 2023:                 ${since2023.records[0].cnt.toLocaleString()} deals`);
  
  const year2024Query = `
    SELECT COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
      AND CreatedDate >= 2024-01-01T00:00:00Z
      AND CreatedDate < 2025-01-01T00:00:00Z
  `;
  const year2024 = await conn.query(year2024Query);
  console.log(`  2024 Only:                  ${year2024.records[0].cnt.toLocaleString()} deals`);
  
  const year2025Query = `
    SELECT COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
      AND CreatedDate >= 2025-01-01T00:00:00Z
  `;
  const year2025 = await conn.query(year2025Query);
  console.log(`  2025 (YTD):                 ${year2025.records[0].cnt.toLocaleString()} deals`);
  
  // 2. Breakdown by Deal_Status__c
  console.log('\n📊 CLOSED WON BY DEAL STATUS:\n');
  const statusQuery = `
    SELECT Deal_Status__c, COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
    GROUP BY Deal_Status__c
    ORDER BY COUNT(Id) DESC
  `;
  const statusResult = await conn.query(statusQuery);
  statusResult.records.forEach((r: any) => {
    const status = r.Deal_Status__c || '(null - Ended/Historical)';
    console.log(`  ${String(status).padEnd(40)} = ${String(r.cnt).padStart(10)} deals`);
  });
  
  // 3. Search for "Information Request" related fields
  console.log('\n🔍 SEARCHING FOR "INFORMATION REQUEST" FIELDS:\n');
  const describe = await conn.sobject('Opportunity').describe();
  const irFields = describe.fields.filter(f => {
    const name = f.name.toLowerCase();
    const label = f.label.toLowerCase();
    return name.includes('information') || 
           label.includes('information') ||
           name.includes('ir_') ||
           label.includes('ir ') ||
           name.includes('_ir') ||
           label.includes('request');
  });
  
  if (irFields.length > 0) {
    console.log('  Found fields related to Information Request:');
    irFields.forEach(f => {
      console.log(`    ${f.name.padEnd(50)} (${f.type.padEnd(10)}) - ${f.label}`);
      
      // If it's a picklist, show values
      if (f.type === 'picklist' && f.picklistValues && f.picklistValues.length > 0) {
        console.log(`      Values: ${f.picklistValues.map((v: any) => v.value).join(', ')}`);
      }
    });
    
    // For each field found, get counts
    console.log('\n  Checking counts for IR-related fields:\n');
    for (const field of irFields.slice(0, 5)) { // Check first 5 fields
      try {
        if (field.type === 'boolean') {
          const countQuery = `
            SELECT ${field.name}, COUNT(Id) cnt
            FROM Opportunity
            WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
              AND StageName = 'Closed Won'
              AND ${field.name} = true
            GROUP BY ${field.name}
          `;
          const result = await conn.query(countQuery);
          if (result.records.length > 0) {
            console.log(`    ${field.name}: ${result.records[0].cnt.toLocaleString()} deals with TRUE`);
          }
        } else if (field.type === 'picklist') {
          const countQuery = `
            SELECT ${field.name}, COUNT(Id) cnt
            FROM Opportunity
            WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
              AND StageName = 'Closed Won'
              AND ${field.name} != null
            GROUP BY ${field.name}
            ORDER BY COUNT(Id) DESC
          `;
          const result = await conn.query(countQuery);
          if (result.records.length > 0) {
            console.log(`    ${field.name}:`);
            result.records.forEach((r: any) => {
              console.log(`      ${String(r[field.name]).padEnd(30)} = ${r.cnt.toLocaleString()} deals`);
            });
          }
        }
      } catch (err) {
        // Skip if error
      }
    }
  } else {
    console.log('  No "Information Request" fields found by name search');
    console.log('  Checking for common IR-related fields manually...');
  }
  
  // 4. Check for common change/request fields
  console.log('\n🔍 CHECKING COMMON CHANGE/REQUEST FIELDS:\n');
  
  const fieldsToCheck = [
    'Structure_Change_post_CW__c',
    'Feature_Date_Change_Date__c',
    'Merchant_Editorial_Review_Required__c',
    'DSA_Info_Required__c',
  ];
  
  for (const fieldName of fieldsToCheck) {
    try {
      const fieldInfo = describe.fields.find(f => f.name === fieldName);
      if (!fieldInfo) continue;
      
      console.log(`  ${fieldName} (${fieldInfo.type}) - ${fieldInfo.label}`);
      
      if (fieldInfo.type === 'boolean') {
        const query = `
          SELECT COUNT(Id) cnt
          FROM Opportunity
          WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
            AND StageName = 'Closed Won'
            AND ${fieldName} = true
        `;
        const result = await conn.query(query);
        console.log(`    TRUE: ${result.records[0].cnt.toLocaleString()} deals`);
      } else if (fieldInfo.type === 'picklist') {
        const query = `
          SELECT ${fieldName}, COUNT(Id) cnt
          FROM Opportunity
          WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
            AND StageName = 'Closed Won'
            AND ${fieldName} != null
          GROUP BY ${fieldName}
          ORDER BY COUNT(Id) DESC
        `;
        const result = await conn.query(query);
        if (result.records.length > 0) {
          result.records.forEach((r: any) => {
            console.log(`    ${String(r[fieldName]).padEnd(30)} = ${r.cnt.toLocaleString()} deals`);
          });
        } else {
          console.log(`    No deals with this field populated`);
        }
      } else if (fieldInfo.type === 'date' || fieldInfo.type === 'datetime') {
        const query = `
          SELECT COUNT(Id) cnt
          FROM Opportunity
          WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
            AND StageName = 'Closed Won'
            AND ${fieldName} != null
        `;
        const result = await conn.query(query);
        console.log(`    Populated: ${result.records[0].cnt.toLocaleString()} deals`);
      }
      console.log('');
    } catch (err: any) {
      console.log(`    Error checking field: ${err.message}`);
    }
  }
  
  // 5. Summary
  console.log('='.repeat(80));
  console.log('SUMMARY:');
  console.log('='.repeat(80));
  console.log('Total Closed Won (US, All Time): ' + allTime.records[0].cnt.toLocaleString());
  console.log('  - Live:        729');
  console.log('  - Paused:      3,267');
  console.log('  - Scheduled:   406');
  console.log('  - Ended:       ~' + (allTime.records[0].cnt - 729 - 3267 - 406).toLocaleString());
  console.log('');
  console.log('Current sync: Only 729 Live + 50K 2025 deals = 50,729 total');
  console.log('Could sync:   All ' + allTime.records[0].cnt.toLocaleString() + ' Closed Won deals (if needed)');
  console.log('');
}

getComprehensiveStats().catch(console.error);




