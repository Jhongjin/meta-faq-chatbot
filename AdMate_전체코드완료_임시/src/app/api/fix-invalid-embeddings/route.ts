import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 유효하지 않은 임베딩 수정 시작...');

    // 1. 모든 document_chunks 조회
    const { data: allChunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('id, document_id, content, embedding, metadata');

    if (chunksError) {
      console.error('청크 조회 오류:', chunksError);
      return NextResponse.json({ error: '청크 조회 실패' }, { status: 500 });
    }

    console.log(`📊 전체 청크 수: ${allChunks?.length || 0}`);

    // 2. 유효하지 않은 임베딩 식별
    const invalidChunks = allChunks?.filter(chunk => {
      const embedding = chunk.embedding;
      
      // 임베딩이 null이거나 undefined인 경우
      if (!embedding) return true;
      
      // 임베딩이 문자열인 경우 (JSON 파싱 시도)
      if (typeof embedding === 'string') {
        try {
          const parsed = JSON.parse(embedding);
          if (!Array.isArray(parsed) || parsed.length !== 1024) return true;
        } catch {
          return true;
        }
      }
      
      // 임베딩이 배열이 아닌 경우
      if (!Array.isArray(embedding)) return true;
      
      // 임베딩 길이가 1024가 아닌 경우
      if (embedding.length !== 1024) return true;
      
      // 임베딩에 유효하지 않은 숫자가 포함된 경우
      if (!embedding.every(item => typeof item === 'number' && !isNaN(item))) return true;
      
      return false;
    }) || [];

    console.log(`❌ 유효하지 않은 임베딩 청크: ${invalidChunks.length}개`);

    if (invalidChunks.length === 0) {
      return NextResponse.json({ 
        message: '유효하지 않은 임베딩이 없습니다.',
        fixedCount: 0 
      });
    }

    // 3. 유효하지 않은 청크 삭제
    const invalidChunkIds = invalidChunks.map(chunk => chunk.id);
    
    const { error: deleteError } = await supabase
      .from('document_chunks')
      .delete()
      .in('id', invalidChunkIds);

    if (deleteError) {
      console.error('유효하지 않은 청크 삭제 오류:', deleteError);
      return NextResponse.json({ error: '청크 삭제 실패' }, { status: 500 });
    }

    console.log('✅ 유효하지 않은 임베딩 청크 삭제 완료');

    // 4. 삭제된 청크의 문서 ID 확인
    const deletedDocumentIds = [...new Set(invalidChunks.map(chunk => chunk.document_id))];
    
    // 5. 청크가 없는 문서들 확인 및 삭제
    for (const docId of deletedDocumentIds) {
      const { data: remainingChunks, error: checkError } = await supabase
        .from('document_chunks')
        .select('id')
        .eq('document_id', docId)
        .limit(1);

      if (checkError) {
        console.error(`문서 ${docId} 청크 확인 오류:`, checkError);
        continue;
      }

      // 청크가 없는 문서 삭제
      if (!remainingChunks || remainingChunks.length === 0) {
        const { error: deleteDocError } = await supabase
          .from('documents')
          .delete()
          .eq('id', docId);

        if (deleteDocError) {
          console.error(`문서 ${docId} 삭제 오류:`, deleteDocError);
        } else {
          console.log(`🗑️ 청크가 없는 문서 삭제: ${docId}`);
        }
      }
    }

    console.log('✅ 유효하지 않은 임베딩 수정 완료');

    return NextResponse.json({
      message: '유효하지 않은 임베딩 수정 완료',
      fixedCount: invalidChunks.length,
      deletedDocuments: deletedDocumentIds.length,
      invalidChunks: invalidChunks.map(chunk => ({
        id: chunk.id,
        document_id: chunk.document_id,
        content_preview: chunk.content?.substring(0, 100) + '...'
      }))
    });

  } catch (error) {
    console.error('유효하지 않은 임베딩 수정 실패:', error);
    return NextResponse.json({ 
      error: '유효하지 않은 임베딩 수정 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
