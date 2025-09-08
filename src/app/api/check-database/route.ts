import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 데이터베이스 상태 확인 시작...');

    // 1. documents 테이블 확인
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, title, type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (docsError) {
      console.error('문서 조회 오류:', docsError);
      return NextResponse.json({ error: '문서 조회 실패', details: docsError }, { status: 500 });
    }

    // 2. document_chunks 테이블 확인
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('document_id, content, metadata')
      .limit(5);

    if (chunksError) {
      console.error('청크 조회 오류:', chunksError);
      return NextResponse.json({ error: '청크 조회 실패', details: chunksError }, { status: 500 });
    }

    // 3. 위키백과 관련 문서 필터링
    const wikiDocs = documents?.filter(doc => 
      doc.title?.includes('위키') ||
      doc.title?.includes('페이스북') ||
      doc.title?.includes('메타') ||
      doc.title?.includes('Facebook') ||
      doc.title?.includes('Meta')
    ) || [];

    console.log('✅ 데이터베이스 상태 확인 완료');

    return NextResponse.json({
      message: '데이터베이스 상태 확인 완료',
      totalDocuments: documents?.length || 0,
      totalChunks: chunks?.length || 0,
      wikiRelatedDocuments: wikiDocs.length,
      recentDocuments: documents?.slice(0, 5) || [],
      wikiDocuments: wikiDocs,
      sampleChunks: chunks?.slice(0, 3) || []
    });

  } catch (error) {
    console.error('데이터베이스 상태 확인 실패:', error);
    return NextResponse.json({ 
      error: '데이터베이스 상태 확인 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
