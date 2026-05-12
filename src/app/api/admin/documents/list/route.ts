import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type');

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: { persistSession: false },
                db: { schema: 'public' }
            }
        );

        console.log(`🔍 [API/documents/list] Fetching documents: type=${type}`);
        
        let query = supabase
            .from('documents')
            .select('id, title, url, type, status, file_size, chunk_count, metadata, main_document_id, created_at, updated_at, source_vendor')
            .order('created_at', { ascending: false });

        if (type) {
            query = query.eq('type', type);
        }

        const { data: documents, error } = await query;

        if (error) {
            console.error('❌ [API/documents/list] Error fetching documents:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`✅ [API/documents/list] Successfully fetched ${documents?.length || 0} documents`);
        
        // URL 문서인 경우 첫 5개 샘플 로깅
        if (type === 'url' && documents && documents.length > 0) {
            console.log('📄 [API/documents/list] Sample URL documents:', documents.slice(0, 5).map(d => ({
                id: d.id,
                vendor: d.source_vendor,
                url: d.url
            })));
        }

        return NextResponse.json({ documents });
    } catch (error) {
        console.error('Error in documents list API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
