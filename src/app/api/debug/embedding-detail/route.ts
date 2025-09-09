import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
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

    // 임베딩 데이터 상세 확인
    const { data: embeddings, error } = await supabase
      .from('document_chunks')
      .select('document_id, embedding')
      .not('embedding', 'is', null)
      .limit(3);

    if (error) {
      console.error('임베딩 조회 오류:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    const detailedEmbeddings = embeddings?.map(e => ({
      document_id: e.document_id,
      embedding_type: typeof e.embedding,
      embedding_is_array: Array.isArray(e.embedding),
      embedding_length: Array.isArray(e.embedding) ? e.embedding.length : 'N/A',
      embedding_sample: Array.isArray(e.embedding) ? e.embedding.slice(0, 3) : e.embedding,
      embedding_raw: e.embedding
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        count: detailedEmbeddings.length,
        embeddings: detailedEmbeddings
      }
    });

  } catch (error) {
    console.error('임베딩 상세 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
