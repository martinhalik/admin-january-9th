import jsforce from 'jsforce';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = new jsforce.Connection({ loginUrl: 'https://groupon-dev.my.salesforce.com' });

async function investigateStageMapping() {
  await conn.login('salesforce@groupon.com', 'gRoup0n!CYSCBNTRwp9ObHBAWOzLjWAT');
  
  console.log('='.repeat(70));
  console.log('INVESTIGATING HOW TO DIFFERENTIATE DEAL SUB-STAGES');
  console.log('='.repeat(70));
  
  // 1. Check for "Scheduled" deals (Go_Live_Date__c in future?)
  console.log('\n1. SCHEDULED - Deals with Go_Live_Date__c in the FUTURE:\n');
  const scheduledQuery = `
    SELECT StageName, Deal_Status__c, COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
      AND Go_Live_Date__c > TODAY
    GROUP BY StageName, Deal_Status__c
    ORDER BY COUNT(Id) DESC
  `;
  const scheduledResult = await conn.query(scheduledQuery);
  if (scheduledResult.records.length > 0) {
    scheduledResult.records.forEach((r: any) => {
      console.log(`  Stage: ${r.StageName}, Deal_Status__c: ${r.Deal_Status__c || '(null)'} = ${r.cnt.toLocaleString()} deals`);
    });
  } else {
    console.log('  No deals found with future Go_Live_Date__c');
  }
  
  // 2. Check for "Paused" deals
  console.log('\n2. PAUSED - Deals with Deal_Status__c = "Paused":\n');
  const pausedQuery = `
    SELECT StageName, COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND Deal_Status__c = 'Paused'
    GROUP BY StageName
    ORDER BY COUNT(Id) DESC
  `;
  const pausedResult = await conn.query(pausedQuery);
  pausedResult.records.forEach((r: any) => {
    console.log(`  ${String(r.StageName).padEnd(40)} = ${r.cnt.toLocaleString()} deals`);
  });
  
  // 3. Check for "Ended" deals (End_Date__c in past)
  console.log('\n3. ENDED - Deals with End_Date__c in the PAST:\n');
  const endedQuery = `
    SELECT COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
      AND End_Date__c < TODAY
  `;
  const endedResult = await conn.query(endedQuery);
  console.log(`  ${endedResult.records[0].cnt.toLocaleString()} deals with past End_Date__c`);
  
  // 4. Check for "Recently Closed" - maybe CloseDate recent?
  console.log('\n4. RECENTLY CLOSED - Deals closed in last 30 days:\n');
  const recentQuery = `
    SELECT StageName, COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND CloseDate = LAST_N_DAYS:30
    GROUP BY StageName
    ORDER BY COUNT(Id) DESC
    LIMIT 10
  `;
  const recentResult = await conn.query(recentQuery);
  recentResult.records.forEach((r: any) => {
    console.log(`  ${String(r.StageName).padEnd(40)} = ${r.cnt.toLocaleString()} deals`);
  });
  
  // 5. Look for custom fields that might indicate "IR request" or other states
  console.log('\n5. Checking for IR/Request related custom fields...\n');
  const describe = await conn.sobject('Opportunity').describe();
  const irFields = describe.fields.filter(f => 
    f.name.toLowerCase().includes('ir') || 
    f.name.toLowerCase().includes('request') ||
    f.name.toLowerCase().includes('revision') ||
    f.name.toLowerCase().includes('change')
  );
  
  if (irFields.length > 0) {
    console.log('  Found IR/Request related fields:');
    irFields.forEach(f => {
      console.log(`    ${f.name.padEnd(50)} (${f.type}) - ${f.label}`);
    });
  } else {
    console.log('  No IR/Request fields found');
  }
  
  // 6. Sample deals in different states
  console.log('\n6. SAMPLE DEALS from different scenarios:\n');
  
  console.log('  A) Closed Won with future Go_Live_Date (SCHEDULED?)');
  const sampleScheduled = await conn.query(`
    SELECT Id, Name, StageName, Deal_Status__c, CloseDate, Go_Live_Date__c, End_Date__c
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
      AND Go_Live_Date__c > TODAY
    LIMIT 3
  `);
  sampleScheduled.records.forEach((r: any) => {
    console.log(`     ${r.Name.substring(0, 60)}`);
    console.log(`       Close: ${r.CloseDate} | Go Live: ${r.Go_Live_Date__c} | Status: ${r.Deal_Status__c || '(null)'}`);
  });
  
  console.log('\n  B) Closed Won with Deal_Status__c = Live (LIVE)');
  const sampleLive = await conn.query(`
    SELECT Id, Name, StageName, Deal_Status__c, CloseDate, Go_Live_Date__c, End_Date__c
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND Deal_Status__c = 'Live'
    LIMIT 3
  `);
  sampleLive.records.forEach((r: any) => {
    console.log(`     ${r.Name.substring(0, 60)}`);
    console.log(`       Close: ${r.CloseDate} | Go Live: ${r.Go_Live_Date__c || 'N/A'} | End: ${r.End_Date__c || 'N/A'}`);
  });
  
  console.log('\n  C) Closed Won with Deal_Status__c = Paused (PAUSED)');
  const samplePaused = await conn.query(`
    SELECT Id, Name, StageName, Deal_Status__c, CloseDate, Go_Live_Date__c, End_Date__c
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND Deal_Status__c = 'Paused'
    LIMIT 3
  `);
  samplePaused.records.forEach((r: any) => {
    console.log(`     ${r.Name.substring(0, 60)}`);
    console.log(`       Close: ${r.CloseDate} | Go Live: ${r.Go_Live_Date__c || 'N/A'} | End: ${r.End_Date__c || 'N/A'}`);
  });
  
  console.log('\n  D) Closed Won with past End_Date__c (ENDED)');
  const sampleEnded = await conn.query(`
    SELECT Id, Name, StageName, Deal_Status__c, CloseDate, Go_Live_Date__c, End_Date__c
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND StageName = 'Closed Won'
      AND End_Date__c < TODAY
    LIMIT 3
  `);
  if (sampleEnded.records.length > 0) {
    sampleEnded.records.forEach((r: any) => {
      console.log(`     ${r.Name.substring(0, 60)}`);
      console.log(`       Close: ${r.CloseDate} | Go Live: ${r.Go_Live_Date__c || 'N/A'} | End: ${r.End_Date__c}`);
    });
  } else {
    console.log('     No deals found with past End_Date__c');
  }
  
  // 7. Distribution of all Salesforce stages
  console.log('\n' + '='.repeat(70));
  console.log('7. FULL STAGE DISTRIBUTION (US, 2023+):');
  console.log('='.repeat(70));
  const allStagesQuery = `
    SELECT StageName, COUNT(Id) cnt
    FROM Opportunity
    WHERE Account.BillingCountry IN ('US', 'USA', 'United States')
      AND CreatedDate >= 2023-01-01T00:00:00Z
    GROUP BY StageName
    ORDER BY COUNT(Id) DESC
  `;
  const allStagesResult = await conn.query(allStagesQuery);
  allStagesResult.records.forEach((r: any) => {
    console.log(`  ${String(r.StageName).padEnd(45)} = ${String(r.cnt).padStart(8)} deals`);
  });
  
  console.log('\n' + '='.repeat(70));
  console.log('RECOMMENDED MAPPING:');
  console.log('='.repeat(70));
  console.log('Scheduled:        Go_Live_Date__c > TODAY');
  console.log('Live:             Deal_Status__c = "Live"');
  console.log('Paused:           Deal_Status__c = "Paused"');
  console.log('Ended:            StageName = "Closed Won" AND Deal_Status__c = null');
  console.log('                  (or End_Date__c < TODAY if populated)');
  console.log('IR Request:       Need to check with business - might be a custom field');
  console.log('                  or a specific stage like "Re-Structure"?');
  console.log('');
}

investigateStageMapping().catch(console.error);




