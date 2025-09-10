import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase 환경변수가 설정되지 않았습니다.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 최근 5개 청크의 임베딩 상태 확인
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('id, document_id, content, embedding, metadata')
      .limit(5);

    if (error) {
      return NextResponse.json({ error: '청크 조회 실패', details: error }, { status: 500 });
    }

    // 2. 임베딩 데이터 상세 분석
    const embeddingAnalysis = chunks?.map(chunk => {
      const embedding = chunk.embedding;
      const isArray = Array.isArray(embedding);
      const length = isArray ? embedding.length : 0;
      const sample = isArray ? embedding.slice(0, 3) : embedding;
      
      // 실제 값이 있는지 확인 (0이 아닌 값이 있는지)
      const hasNonZeroValues = isArray ? embedding.some(val => val !== 0) : false;
      const firstNonZeroIndex = isArray ? embedding.findIndex(val => val !== 0) : -1;
      
      return {
        id: chunk.id,
        document_id: chunk.document_id,
        content_preview: chunk.content?.substring(0, 100),
        embedding_type: typeof embedding,
        is_array: isArray,
        length: length,
        sample_values: sample,
        has_non_zero_values: hasNonZeroValues,
        first_non_zero_index: firstNonZeroIndex,
        metadata: chunk.metadata
      };
    }) || [];

    // 3. 전체 통계
    const totalChunks = chunks?.length || 0;
    const arrayEmbeddings = embeddingAnalysis.filter(e => e.is_array).length;
    const nonZeroEmbeddings = embeddingAnalysis.filter(e => e.has_non_zero_values).length;

    return NextResponse.json({
      success: true,
      summary: {
        totalChunks,
        arrayEmbeddings,
        nonZeroEmbeddings,
        problematicEmbeddings: totalChunks - nonZeroEmbeddings
      },
      embeddingAnalysis
    });

  } catch (error) {
    console.error('임베딩 검증 API 오류:', error);
    return NextResponse.json({ error: '서버 오류', details: error }, { status: 500 });
  }
}

