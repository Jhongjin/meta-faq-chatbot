const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: '.env.local' });

async function checkX() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase env vars missing');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('documents')
    .select('id, title, url, source_vendor, type')
    .eq('source_vendor', 'X(TWITTER)')
    .limit(10);

  if (error) {
    console.error('Error fetching X docs:', error);
    return;
  }

  console.log('X(TWITTER) documents:');
  console.table(data);
}

checkX();
