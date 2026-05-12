const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

async function checkVendors() {
    const supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
        .from('documents')
        .select('source_vendor, title, url')
        .limit(1000);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const vendors = [...new Set(data.map(d => d.source_vendor))];
    console.log('Unique vendors in DB:', vendors);
    
    const twitterDocs = data.filter(d => d.source_vendor && (d.source_vendor.toUpperCase().includes('X') || d.source_vendor.toUpperCase().includes('TWITTER') || d.source_vendor.toUpperCase() === 'OTHER'));
    console.log('Twitter-related docs:', twitterDocs.length);
    twitterDocs.forEach(d => console.log(`- [${d.source_vendor}] ${d.title} (${d.url})`));
}

checkVendors();
