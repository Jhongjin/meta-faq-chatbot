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

    // 문서 데이터 확인
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, title, status, created_at')
      .limit(10);

    if (docError) {
      console.error('문서 조회 오류:', docError);
    }

    // 청크 데이터 확인
    const { data: chunks, error: chunkError } = await supabase
      .from('document_chunks')
      .select('document_id, content, metadata')
      .limit(10);

    if (chunkError) {
      console.error('청크 조회 오류:', chunkError);
    }

    // 임베딩 데이터 확인
    const { data: embeddings, error: embeddingError } = await supabase
      .from('document_chunks')
      .select('document_id, embedding')
      .not('embedding', 'is', null)
      .limit(5);

    if (embeddingError) {
      console.error('임베딩 조회 오류:', embeddingError);
    }

    return NextResponse.json({
      success: true,
      data: {
        documents: {
          count: documents?.length || 0,
          data: documents || []
        },
        chunks: {
          count: chunks?.length || 0,
          data: chunks?.slice(0, 3) || [] // 처음 3개만 표시
        },
        embeddings: {
          count: embeddings?.length || 0,
          sample: embeddings?.map(e => ({
            document_id: e.document_id,
            embedding_length: Array.isArray(e.embedding) ? e.embedding.length : 'invalid'
          })) || []
        }
      }
    });

  } catch (error) {
    console.error('벡터 데이터 디버깅 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
