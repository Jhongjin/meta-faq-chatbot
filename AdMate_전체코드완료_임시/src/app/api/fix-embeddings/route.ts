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

    // 1. 모든 청크 조회
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('id, embedding')
      .limit(100);

    if (chunksError) {
      return NextResponse.json({ error: '청크 조회 실패', details: chunksError }, { status: 500 });
    }

    console.log(`📊 총 ${chunks?.length || 0}개 청크 발견`);

    let fixedCount = 0;
    let errorCount = 0;

    // 2. 각 청크의 임베딩 형식 수정
    for (const chunk of chunks || []) {
      try {
        let embedding = chunk.embedding;
        
        // 문자열인 경우 배열로 변환
        if (typeof embedding === 'string') {
          try {
            embedding = JSON.parse(embedding);
            console.log(`✅ 청크 ${chunk.id}: 문자열 → 배열 변환 성공`);
          } catch (parseError) {
            console.error(`❌ 청크 ${chunk.id}: JSON 파싱 실패`, parseError);
            errorCount++;
            continue;
          }
        }

        // 배열인지 확인
        if (!Array.isArray(embedding)) {
          console.error(`❌ 청크 ${chunk.id}: 배열이 아님`, typeof embedding);
          errorCount++;
          continue;
        }

        // 배열 길이 확인 (1024차원이어야 함)
        if (embedding.length !== 1024) {
          console.error(`❌ 청크 ${chunk.id}: 차원 수 오류 (${embedding.length}/1024)`);
          errorCount++;
          continue;
        }

        // 데이터베이스 업데이트
        const { error: updateError } = await supabase
          .from('document_chunks')
          .update({ embedding: embedding })
          .eq('id', chunk.id);

        if (updateError) {
          console.error(`❌ 청크 ${chunk.id}: 업데이트 실패`, updateError);
          errorCount++;
        } else {
          console.log(`✅ 청크 ${chunk.id}: 업데이트 성공`);
          fixedCount++;
        }

      } catch (error) {
        console.error(`❌ 청크 ${chunk.id}: 처리 중 오류`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalChunks: chunks?.length || 0,
        fixedCount,
        errorCount
      },
      message: `임베딩 형식 수정 완료: ${fixedCount}개 성공, ${errorCount}개 실패`
    });

  } catch (error) {
    console.error('임베딩 수정 API 오류:', error);
    return NextResponse.json({ error: '서버 오류', details: error }, { status: 500 });
  }
}

