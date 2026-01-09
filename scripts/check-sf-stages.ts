import jsforce from 'jsforce';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = new jsforce.Connection({
  loginUrl: 'https://groupon-dev.my.salesforce.com'
});

async function checkStages() {
  await conn.login('salesforce@groupon.com', 'gRoup0n!CYSCBNTRwp9ObHBAWOzLjWAT');
  
  console.log('Fetching all unique Opportunity stages in US market...\n');
  
  const query = `
    SELECT StageName, COUNT(Id) cnt 
    FROM Opportunity 
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND CreatedDate >= 2020-01-01T00:00:00Z
    GROUP BY StageName 
    ORDER BY COUNT(Id) DESC
  `;
  
  const result = await conn.query(query);
  
  console.log('Top Opportunity Stages:\n');
  result.records.forEach((r: any) => {
    console.log(`  ${String(r.StageName).padEnd(40)} = ${r.cnt.toLocaleString()} deals`);
  });
  
  console.log('\n---\n');
  console.log('Looking for deals that might be "Live" (IsClosed=false, IsWon=true)...\n');
  
  const liveQuery = `
    SELECT StageName, COUNT(Id) cnt 
    FROM Opportunity 
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND IsClosed = false
      AND IsWon = true
    GROUP BY StageName 
    ORDER BY COUNT(Id) DESC
  `;
  
  const liveResult = await conn.query(liveQuery);
  
  if (liveResult.records.length > 0) {
    console.log('Stages where IsClosed=false AND IsWon=true:');
    liveResult.records.forEach((r: any) => {
      console.log(`  ${String(r.StageName).padEnd(40)} = ${r.cnt.toLocaleString()} deals`);
    });
  } else {
    console.log('No deals found with IsClosed=false AND IsWon=true');
  }
}

checkStages().catch(console.error);

