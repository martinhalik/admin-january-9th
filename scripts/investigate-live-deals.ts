import jsforce from 'jsforce';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = new jsforce.Connection({ loginUrl: 'https://groupon-dev.my.salesforce.com' });

async function investigateLiveDeals() {
  await conn.login('salesforce@groupon.com', 'gRoup0n!CYSCBNTRwp9ObHBAWOzLjWAT');
  
  console.log('='.repeat(60));
  console.log('INVESTIGATING WHAT "LIVE" MEANS IN SALESFORCE');
  console.log('='.repeat(60));
  
  // 1. Check what stages the 729 "Live" deals have
  console.log('\n1. Stages for deals where Deal_Status__c = "Live":\n');
  const liveDealsQuery = `
    SELECT StageName, COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND Deal_Status__c = 'Live'
    GROUP BY StageName
    ORDER BY COUNT(Id) DESC
  `;
  const liveDealsResult = await conn.query(liveDealsQuery);
  liveDealsResult.records.forEach((r: any) => {
    console.log(`  ${String(r.StageName).padEnd(40)} = ${r.cnt.toLocaleString()} deals`);
  });
  
  // 2. Check "Closed Won" deals that might be live but not marked
  console.log('\n2. All "Closed Won" deals by Deal_Status__c:\n');
  const closedWonQuery = `
    SELECT Deal_Status__c, COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
    GROUP BY Deal_Status__c
    ORDER BY COUNT(Id) DESC
  `;
  const closedWonResult = await conn.query(closedWonQuery);
  closedWonResult.records.forEach((r: any) => {
    const status = r.Deal_Status__c || '(null/empty)';
    console.log(`  ${String(status).padEnd(40)} = ${r.cnt.toLocaleString()} deals`);
  });
  
  // 3. Check if there are deals with future End_Date__c (might be "live")
  console.log('\n3. Closed Won deals with future End_Date__c (still active?):\n');
  const futureEndDateQuery = `
    SELECT COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
      AND End_Date__c >= TODAY
  `;
  const futureEndResult = await conn.query(futureEndDateQuery);
  console.log(`  ${futureEndResult.records[0].cnt.toLocaleString()} deals with End_Date__c >= TODAY`);
  
  // 4. Check deals with Go_Live_Date__c in past and no End_Date__c
  console.log('\n4. Closed Won deals that went live but have no end date:\n');
  const noEndDateQuery = `
    SELECT COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
      AND Go_Live_Date__c <= TODAY
      AND (End_Date__c = null OR End_Date__c >= TODAY)
  `;
  const noEndResult = await conn.query(noEndDateQuery);
  console.log(`  ${noEndResult.records[0].cnt.toLocaleString()} deals (Go Live Date <= today, no end date or future end date)`);
  
  // 5. Sample a few "Closed Won" deals without Deal_Status__c
  console.log('\n5. Sample "Closed Won" deals WITHOUT Deal_Status__c (might be live?):\n');
  const sampleQuery = `
    SELECT Id, Name, Deal_Status__c, CreatedDate, CloseDate, End_Date__c, Go_Live_Date__c, IsClosed, IsWon
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
      AND Deal_Status__c = null
      AND CreatedDate >= 2023-01-01T00:00:00Z
    ORDER BY CreatedDate DESC
    LIMIT 5
  `;
  const samples = await conn.query(sampleQuery);
  samples.records.forEach((r: any) => {
    console.log(`  ${r.Name}`);
    console.log(`    Created: ${r.CreatedDate?.split('T')[0]} | Close: ${r.CloseDate} | Go Live: ${r.Go_Live_Date__c || 'N/A'} | End: ${r.End_Date__c || 'N/A'}`);
    console.log(`    IsClosed: ${r.IsClosed} | IsWon: ${r.IsWon} | Deal_Status__c: ${r.Deal_Status__c || '(empty)'}`);
    console.log('');
  });
  
  // 6. Check for other stages that might be "live"
  console.log('\n6. Are there other stages (not Closed Won) with active deals?\n');
  const otherStagesQuery = `
    SELECT StageName, COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName NOT IN ('Closed Won', 'Closed Lost', 'Unqualified')
      AND CreatedDate >= 2023-01-01T00:00:00Z
    GROUP BY StageName
    ORDER BY COUNT(Id) DESC
    LIMIT 10
  `;
  const otherStagesResult = await conn.query(otherStagesQuery);
  console.log('  Top stages (2023+, excluding Closed Won/Lost/Unqualified):');
  otherStagesResult.records.forEach((r: any) => {
    console.log(`    ${String(r.StageName).padEnd(40)} = ${r.cnt.toLocaleString()} deals`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('KEY QUESTION: What should we consider "Live"?');
  console.log('='.repeat(60));
  console.log('Option 1: Only Deal_Status__c = "Live" (729 deals)');
  console.log('Option 2: All Closed Won with no end date or future end date');
  console.log('Option 3: All Closed Won + ongoing stages (Prospecting, etc.)');
  console.log('');
}

investigateLiveDeals().catch(console.error);




