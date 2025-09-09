import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmbeddingService } from '@/lib/services/EmbeddingService';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 환경변수가 설정되지 않았습니다.'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const embeddingService = new EmbeddingService();

    // 잘못된 임베딩 데이터 조회
    const { data: chunks, error: fetchError } = await supabase
      .from('document_chunks')
      .select('id, document_id, content, embedding')
      .not('embedding', 'is', null)
      .limit(10);

    if (fetchError) {
      throw new Error(`청크 조회 실패: ${fetchError.message}`);
    }

    console.log(`🔍 수정할 청크 수: ${chunks?.length || 0}`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const chunk of chunks || []) {
      try {
        // 임베딩이 배열이 아닌 경우 재생성
        if (!Array.isArray(chunk.embedding)) {
          console.log(`🔄 임베딩 재생성: ${chunk.document_id}`);
          
          const embeddingResult = await embeddingService.generateEmbedding(chunk.content);
          
          const { error: updateError } = await supabase
            .from('document_chunks')
            .update({ 
              embedding: embeddingResult.embedding,
              updated_at: new Date().toISOString()
            })
            .eq('id', chunk.id);

          if (updateError) {
            console.error(`❌ 임베딩 업데이트 실패: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`✅ 임베딩 수정 완료: ${chunk.document_id}`);
            fixedCount++;
          }
        }
      } catch (chunkError) {
        console.error(`❌ 청크 처리 오류: ${chunkError}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: '임베딩 데이터 수정 완료',
      data: {
        totalChunks: chunks?.length || 0,
        fixedCount,
        errorCount
      }
    });

  } catch (error) {
    console.error('임베딩 수정 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
