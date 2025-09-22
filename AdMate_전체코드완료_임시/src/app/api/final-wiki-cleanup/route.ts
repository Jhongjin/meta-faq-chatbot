import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 최종 위키백과 데이터 정리 시작...');

    // 1. document_chunks에서 위키백과 내용이 포함된 청크 찾기
    const { data: wikiChunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('document_id, content, metadata')
      .or('content.ilike.%위키백과%,content.ilike.%wikipedia%,content.ilike.%백과사전%');

    if (chunksError) {
      console.error('청크 검색 오류:', chunksError);
      return NextResponse.json({ error: '청크 검색 실패' }, { status: 500 });
    }

    console.log(`📊 위키백과 내용이 포함된 청크: ${wikiChunks?.length || 0}개`);

    if (!wikiChunks || wikiChunks.length === 0) {
      return NextResponse.json({ 
        message: '삭제할 위키백과 청크가 없습니다.',
        deletedCount: 0 
      });
    }

    // 2. 관련 문서 ID 추출
    const documentIds = [...new Set(wikiChunks.map(chunk => chunk.document_id))];
    console.log(`📋 관련 문서 ID: ${documentIds.length}개`);

    // 3. 관련 문서 정보 조회
    const { data: relatedDocuments, error: docsError } = await supabase
      .from('documents')
      .select('id, title, type, status')
      .in('id', documentIds);

    if (docsError) {
      console.error('문서 조회 오류:', docsError);
      return NextResponse.json({ error: '문서 조회 실패' }, { status: 500 });
    }

    console.log(`📋 삭제할 문서들:`);
    relatedDocuments?.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.id})`);
    });

    // 4. document_chunks 테이블에서 관련 청크 삭제
    const { error: deleteChunksError } = await supabase
      .from('document_chunks')
      .delete()
      .in('document_id', documentIds);

    if (deleteChunksError) {
      console.error('청크 삭제 오류:', deleteChunksError);
      return NextResponse.json({ error: '청크 삭제 실패' }, { status: 500 });
    }

    // 5. documents 테이블에서 문서 삭제
    const { error: deleteDocsError } = await supabase
      .from('documents')
      .delete()
      .in('id', documentIds);

    if (deleteDocsError) {
      console.error('문서 삭제 오류:', deleteDocsError);
      return NextResponse.json({ error: '문서 삭제 실패' }, { status: 500 });
    }

    console.log('✅ 최종 위키백과 데이터 정리 완료');

    return NextResponse.json({
      message: '최종 위키백과 데이터 정리 완료',
      deletedDocuments: relatedDocuments?.length || 0,
      deletedChunks: wikiChunks.length,
      deletedDocumentsList: relatedDocuments?.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        status: doc.status
      })) || []
    });

  } catch (error) {
    console.error('최종 위키백과 데이터 정리 실패:', error);
    return NextResponse.json({ 
      error: '최종 위키백과 데이터 정리 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
