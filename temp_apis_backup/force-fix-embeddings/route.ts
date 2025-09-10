import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase 환경변수가 설정되지 않았습니다.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 모든 청크의 임베딩을 가져오기
    const { data: chunks, error: fetchError } = await supabase
      .from('document_chunks')
      .select('id, embedding')
      .not('embedding', 'is', null);

    if (fetchError) {
      return NextResponse.json({ error: '청크 조회 실패', details: fetchError }, { status: 500 });
    }

    let fixedCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    console.log(`🔧 총 ${chunks?.length || 0}개 청크의 임베딩을 수정합니다...`);

    for (const chunk of chunks || []) {
      try {
        const embedding = chunk.embedding;
        
        if (typeof embedding === 'string') {
          console.log(`📝 청크 ${chunk.id}: 문자열 임베딩을 배열로 변환 중...`);
          
          // JSON 파싱 시도
          let parsedEmbedding;
          try {
            parsedEmbedding = JSON.parse(embedding);
          } catch (parseError) {
            console.error(`❌ 청크 ${chunk.id}: JSON 파싱 실패`, parseError);
            errors.push({ chunkId: chunk.id, error: 'JSON 파싱 실패' });
            errorCount++;
            continue;
          }

          // 배열인지 확인
          if (!Array.isArray(parsedEmbedding)) {
            console.error(`❌ 청크 ${chunk.id}: 파싱된 데이터가 배열이 아님`);
            errors.push({ chunkId: chunk.id, error: '파싱된 데이터가 배열이 아님' });
            errorCount++;
            continue;
          }

          // 숫자 배열인지 확인
          if (!parsedEmbedding.every(item => typeof item === 'number')) {
            console.error(`❌ 청크 ${chunk.id}: 배열 요소가 모두 숫자가 아님`);
            errors.push({ chunkId: chunk.id, error: '배열 요소가 모두 숫자가 아님' });
            errorCount++;
            continue;
          }

          // 데이터베이스 업데이트
          const { error: updateError } = await supabase
            .from('document_chunks')
            .update({ embedding: parsedEmbedding })
            .eq('id', chunk.id);

          if (updateError) {
            console.error(`❌ 청크 ${chunk.id}: 데이터베이스 업데이트 실패`, updateError);
            errors.push({ chunkId: chunk.id, error: updateError.message });
            errorCount++;
          } else {
            console.log(`✅ 청크 ${chunk.id}: 임베딩 수정 완료 (${parsedEmbedding.length}차원)`);
            fixedCount++;
          }

        } else if (Array.isArray(embedding)) {
          console.log(`✅ 청크 ${chunk.id}: 이미 배열 형태임 (${embedding.length}차원)`);
          // 이미 배열이면 수정할 필요 없음
        } else {
          console.error(`❌ 청크 ${chunk.id}: 예상치 못한 임베딩 타입: ${typeof embedding}`);
          errors.push({ chunkId: chunk.id, error: `예상치 못한 타입: ${typeof embedding}` });
          errorCount++;
        }

      } catch (chunkError: any) {
        console.error(`❌ 청크 ${chunk.id}: 처리 중 오류`, chunkError);
        errors.push({ chunkId: chunk.id, error: chunkError.message });
        errorCount++;
      }
    }

    console.log(`🎯 임베딩 수정 완료: ${fixedCount}개 성공, ${errorCount}개 실패`);

    return NextResponse.json({
      success: true,
      summary: {
        totalChunks: chunks?.length || 0,
        fixedCount,
        errorCount,
      },
      message: `강제 임베딩 수정 완료: ${fixedCount}개 성공, ${errorCount}개 실패`,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // 처음 10개 오류만 표시
    });

  } catch (error: any) {
    console.error('강제 임베딩 수정 API 오류:', error);
    return NextResponse.json({ error: '서버 오류', details: error.message }, { status: 500 });
  }
}

