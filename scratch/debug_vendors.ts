import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkVendors() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('documents')
        .select('source_vendor, title, url')
        .limit(100);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const vendors = [...new Set(data.map(d => d.source_vendor))];
    console.log('Unique vendors in DB:', vendors);
    
    const twitterDocs = data.filter(d => d.source_vendor?.toUpperCase().includes('X') || d.source_vendor?.toUpperCase().includes('TWITTER'));
    console.log('Twitter-related docs:', twitterDocs.length);
    twitterDocs.forEach(d => console.log(`- [${d.source_vendor}] ${d.title} (${d.url})`));
}

checkVendors();
