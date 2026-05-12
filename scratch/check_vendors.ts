import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function checkVendors() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase env vars missing');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: allDocs, error } = await supabase
    .from('documents')
    .select('source_vendor');

  if (error) {
    console.error('Error fetching vendors:', error);
    return;
  }

  const counts: Record<string, number> = {};
  allDocs.forEach(doc => {
    const vendor = doc.source_vendor || 'UNKNOWN';
    counts[vendor] = (counts[vendor] || 0) + 1;
  });

  const data = Object.entries(counts).map(([vendor, count]) => ({
    source_vendor: vendor,
    count
  }));

  console.log('Documents per vendor:');
  console.table(data);
}

checkVendors();
