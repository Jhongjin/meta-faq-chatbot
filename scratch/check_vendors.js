const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://renjseslaqgfoxslxlyu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlbmpzZXNsYXFnZm94c2x4bHl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc4ODQ0MCwiZXhwIjoyMDcyMzY0NDQwfQ.ZP-psPigdwWdWQxUbiCeJo9C2Gb5j9fALtQOcIrmaWI';

async function checkVendors() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('documents')
    .select('source_vendor');

  if (error) {
    console.error('Error fetching documents:', error);
    return;
  }

  const counts = data.reduce((acc, doc) => {
    const v = doc.source_vendor || 'NULL';
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  console.log('Documents per vendor:');
  console.table(counts);

  // X/Twitter 관련 샘플 확인
  const xDocs = data.filter(doc => 
    String(doc.source_vendor).toUpperCase() === 'OTHER' || 
    String(doc.source_vendor).includes('X') || 
    String(doc.source_vendor).includes('Twitter')
  );
  
  if (xDocs.length > 0) {
    console.log('Sample X(Twitter) docs:', xDocs.slice(0, 5));
  } else {
    console.log('No X(Twitter) related docs found.');
  }
}

checkVendors();
