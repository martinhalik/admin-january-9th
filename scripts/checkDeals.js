require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

supabase.from('deals')
  .select('id, title, account_id, account_owner_id')
  .order('id')
  .limit(20)
  .then(({data, error}) => {
    if (error) {
      console.error(error);
    } else {
      console.log('Sample deals:');
      data.forEach(d => {
        const title = (d.title || '(no title)').substring(0, 40).padEnd(40);
        const hasAccount = d.account_id ? 'Yes' : 'No ';
        const hasOwner = d.account_owner_id ? 'Yes' : 'No ';
        console.log(`  ${title} | Account: ${hasAccount} | Owner: ${hasOwner}`);
      });
    }
  });




