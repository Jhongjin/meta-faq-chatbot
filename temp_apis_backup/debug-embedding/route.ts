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

    // 임베딩 데이터 샘플 조회
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('id, document_id, content, embedding, metadata')
      .limit(3);

    if (error) {
      return NextResponse.json({ error: '청크 조회 실패', details: error }, { status: 500 });
    }

    // 임베딩 데이터 분석
    const embeddingAnalysis = chunks?.map(chunk => ({
      id: chunk.id,
      document_id: chunk.document_id,
      content_length: chunk.content?.length || 0,
      embedding_type: typeof chunk.embedding,
      embedding_is_array: Array.isArray(chunk.embedding),
      embedding_length: Array.isArray(chunk.embedding) ? chunk.embedding.length : 0,
      embedding_sample: Array.isArray(chunk.embedding) ? chunk.embedding.slice(0, 5) : chunk.embedding,
      metadata: chunk.metadata
    })) || [];

    return NextResponse.json({
      success: true,
      totalChunks: chunks?.length || 0,
      embeddingAnalysis
    });

  } catch (error) {
    console.error('임베딩 디버그 API 오류:', error);
    return NextResponse.json({ error: '서버 오류', details: error }, { status: 500 });
  }
}
