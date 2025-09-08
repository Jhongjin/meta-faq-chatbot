import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 위키백과 데이터 삭제 시작...');

    // 위키백과 관련 문서 검색 (제목 기준)
    const { data: wikiDocuments, error: searchError } = await supabase
      .from('documents')
      .select('id, title, type, status')
      .or('title.ilike.%위키%,title.ilike.%페이스북%,title.ilike.%메타%,title.ilike.%Facebook%,title.ilike.%Meta%');

    if (searchError) {
      console.error('위키 문서 검색 오류:', searchError);
      return NextResponse.json({ error: '위키 문서 검색 실패' }, { status: 500 });
    }

    console.log(`📊 발견된 위키 문서 수: ${wikiDocuments?.length || 0}`);

    if (!wikiDocuments || wikiDocuments.length === 0) {
      return NextResponse.json({ 
        message: '삭제할 위키 문서가 없습니다.',
        deletedCount: 0 
      });
    }

    // 문서 ID 목록 추출
    const documentIds = wikiDocuments.map(doc => doc.id);
    console.log('📋 삭제할 문서 ID 목록:', documentIds);

    // 1. document_chunks 테이블에서 관련 청크 삭제
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .in('document_id', documentIds);

    if (chunksError) {
      console.error('청크 삭제 오류:', chunksError);
      return NextResponse.json({ error: '청크 삭제 실패' }, { status: 500 });
    }

    // 2. documents 테이블에서 문서 삭제
    const { error: documentsError } = await supabase
      .from('documents')
      .delete()
      .in('id', documentIds);

    if (documentsError) {
      console.error('문서 삭제 오류:', documentsError);
      return NextResponse.json({ error: '문서 삭제 실패' }, { status: 500 });
    }

    console.log('✅ 위키백과 데이터 삭제 완료');

    return NextResponse.json({
      message: '위키백과 데이터 삭제 완료',
      deletedCount: wikiDocuments.length,
      deletedDocuments: wikiDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        status: doc.status
      }))
    });

  } catch (error) {
    console.error('위키백과 데이터 삭제 실패:', error);
    return NextResponse.json({ 
      error: '위키백과 데이터 삭제 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
