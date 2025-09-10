import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경 변수 확인 및 조건부 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
    // Supabase 클라이언트 확인
    if (!supabase) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
  try {
    console.log('🔄 문서 상태 동기화 시작...');

    // 1. 모든 문서 조회
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, title, status, chunk_count');

    if (docsError) {
      console.error('문서 조회 오류:', docsError);
      return NextResponse.json({ error: '문서 조회 실패' }, { status: 500 });
    }

    console.log(`📊 전체 문서 수: ${documents?.length || 0}`);

    let updatedCount = 0;
    const updateResults = [];

    // 2. 각 문서별로 실제 청크 수 확인 및 상태 업데이트
    for (const doc of documents || []) {
      try {
        // 실제 청크 수 조회
        const { data: chunks, error: chunksError } = await supabase
          .from('document_chunks')
          .select('id')
          .eq('document_id', doc.id);

        if (chunksError) {
          console.error(`문서 ${doc.id} 청크 조회 오류:`, chunksError);
          continue;
        }

        const actualChunkCount = chunks?.length || 0;
        const currentStatus = doc.status;
        let newStatus = currentStatus;

        // 상태 결정 로직
        if (actualChunkCount > 0) {
          newStatus = 'indexed';
        } else if (currentStatus === 'pending') {
          newStatus = 'failed';
        }

        // 상태나 청크 수가 변경된 경우에만 업데이트
        if (newStatus !== currentStatus || actualChunkCount !== doc.chunk_count) {
          const { error: updateError } = await supabase
            .from('documents')
            .update({
              status: newStatus,
              chunk_count: actualChunkCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id);

          if (updateError) {
            console.error(`문서 ${doc.id} 업데이트 오류:`, updateError);
            updateResults.push({
              id: doc.id,
              title: doc.title,
              status: 'error',
              error: updateError.message
            });
          } else {
            console.log(`✅ 문서 상태 업데이트: ${doc.title} (${currentStatus} → ${newStatus}, 청크: ${actualChunkCount})`);
            updateResults.push({
              id: doc.id,
              title: doc.title,
              oldStatus: currentStatus,
              newStatus: newStatus,
              chunkCount: actualChunkCount,
              status: 'updated'
            });
            updatedCount++;
          }
        } else {
          console.log(`⏭️ 변경 없음: ${doc.title} (${currentStatus}, 청크: ${actualChunkCount})`);
          updateResults.push({
            id: doc.id,
            title: doc.title,
            status: 'no_change',
            chunkCount: actualChunkCount
          });
        }

      } catch (error) {
        console.error(`문서 ${doc.id} 처리 오류:`, error);
        updateResults.push({
          id: doc.id,
          title: doc.title,
          status: 'error',
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    }

    console.log(`✅ 문서 상태 동기화 완료: ${updatedCount}개 업데이트`);

    return NextResponse.json({
      message: '문서 상태 동기화 완료',
      totalDocuments: documents?.length || 0,
      updatedCount: updatedCount,
      results: updateResults
    });

  } catch (error) {
    console.error('문서 상태 동기화 실패:', error);
    return NextResponse.json({ 
      error: '문서 상태 동기화 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
