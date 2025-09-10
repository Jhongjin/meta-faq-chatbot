import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 환경 변수가 설정되지 않았습니다.'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 데이터베이스에서 임베딩 형식 확인
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('embedding, chunk_id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: `데이터베이스 조회 실패: ${error.message}`
      });
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        success: false,
        error: '저장된 청크가 없습니다.'
      });
    }

    const chunk = chunks[0];
    let embedding;
    let format = 'unknown';
    let dimension = 0;

    try {
      // JSON 문자열인 경우 파싱
      if (typeof chunk.embedding === 'string') {
        embedding = JSON.parse(chunk.embedding);
        format = 'JSON string';
      } else if (Array.isArray(chunk.embedding)) {
        embedding = chunk.embedding;
        format = 'Array';
      } else {
        embedding = chunk.embedding;
        format = 'Other';
      }
      
      dimension = Array.isArray(embedding) ? embedding.length : 0;
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: `임베딩 파싱 실패: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    return NextResponse.json({
      success: true,
      chunkId: chunk.chunk_id,
      format: format,
      dimension: dimension,
      type: typeof chunk.embedding,
      sample: Array.isArray(embedding) ? embedding.slice(0, 10) : embedding,
      rawSample: chunk.embedding.toString().substring(0, 100) + '...'
    });

  } catch (error) {
    console.error('❌ 임베딩 형식 확인 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
