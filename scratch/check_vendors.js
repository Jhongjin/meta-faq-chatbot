const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkVendors() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Checking vendors in documents table...');

  const { data, error } = await supabase
    .from('documents')
    .select('source_vendor');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const counts = {};
  data.forEach(doc => {
    const v = doc.source_vendor || 'NULL';
    counts[v] = (counts[v] || 0) + 1;
  });

  console.log('Vendor Counts:', counts);

  const { data: twitterDocs, error: tError } = await supabase
    .from('documents')
    .select('id, title, url, source_vendor, type')
    .or('source_vendor.eq.OTHER,source_vendor.eq.X(TWITTER)')
    .limit(5);

  if (tError) {
      console.error('Twitter Query Error:', tError);
  } else {
      console.log('Sample Twitter/Other Docs:', twitterDocs);
  }
}

checkVendors();
