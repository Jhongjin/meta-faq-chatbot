const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

async function checkUrlCount() {
    const supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'url');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Total URL documents in DB:', count);
    
    const { data: latest, error: err2 } = await supabase
        .from('documents')
        .select('source_vendor, title, url, created_at')
        .eq('type', 'url')
        .order('created_at', { ascending: false })
        .limit(10);
        
    console.log('Latest 10 URL documents:');
    latest.forEach(d => console.log(`- [${d.source_vendor}] ${d.title} (${d.url}) created at ${d.created_at}`));
}

checkUrlCount();
