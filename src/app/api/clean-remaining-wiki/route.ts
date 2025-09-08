import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 남은 위키백과 데이터 정리 시작...');

    // 1. 모든 문서 조회
    const { data: allDocuments, error: docsError } = await supabase
      .from('documents')
      .select('id, title, type, status');

    if (docsError) {
      console.error('문서 조회 오류:', docsError);
      return NextResponse.json({ error: '문서 조회 실패' }, { status: 500 });
    }

    console.log(`📊 전체 문서 수: ${allDocuments?.length || 0}`);

    // 2. 위키백과 관련 문서 필터링 (더 정확한 필터링)
    const wikiDocuments = allDocuments?.filter(doc => {
      const title = doc.title?.toLowerCase() || '';
      return (
        title.includes('위키백과') ||
        title.includes('wikipedia') ||
        title.includes('wiki') ||
        (title.includes('인스타그램') && title.includes('위키')) ||
        (title.includes('페이스북') && title.includes('위키')) ||
        (title.includes('메타') && title.includes('위키'))
      );
    }) || [];

    console.log(`📋 위키백과 관련 문서: ${wikiDocuments.length}개`);
    wikiDocuments.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.id})`);
    });

    if (wikiDocuments.length === 0) {
      return NextResponse.json({ 
        message: '삭제할 위키백과 문서가 없습니다.',
        deletedCount: 0 
      });
    }

    // 3. 문서 ID 목록 추출
    const documentIds = wikiDocuments.map(doc => doc.id);

    // 4. document_chunks 테이블에서 관련 청크 삭제
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .in('document_id', documentIds);

    if (chunksError) {
      console.error('청크 삭제 오류:', chunksError);
      return NextResponse.json({ error: '청크 삭제 실패' }, { status: 500 });
    }

    // 5. documents 테이블에서 문서 삭제
    const { error: documentsError } = await supabase
      .from('documents')
      .delete()
      .in('id', documentIds);

    if (documentsError) {
      console.error('문서 삭제 오류:', documentsError);
      return NextResponse.json({ error: '문서 삭제 실패' }, { status: 500 });
    }

    console.log('✅ 남은 위키백과 데이터 정리 완료');

    return NextResponse.json({
      message: '남은 위키백과 데이터 정리 완료',
      deletedCount: wikiDocuments.length,
      deletedDocuments: wikiDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        status: doc.status
      }))
    });

  } catch (error) {
    console.error('위키백과 데이터 정리 실패:', error);
    return NextResponse.json({ 
      error: '위키백과 데이터 정리 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
