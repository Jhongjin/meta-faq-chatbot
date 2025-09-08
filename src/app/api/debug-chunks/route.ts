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

    // document_chunks 테이블에서 데이터 확인
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('id, document_id, content, metadata, embedding')
      .limit(5);

    if (chunksError) {
      return NextResponse.json({ error: '청크 조회 실패', details: chunksError }, { status: 500 });
    }

    // documents 테이블에서 데이터 확인
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, title, status, chunk_count')
      .limit(5);

    if (docsError) {
      return NextResponse.json({ error: '문서 조회 실패', details: docsError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      chunks: {
        count: chunks?.length || 0,
        sample: chunks?.map(chunk => ({
          id: chunk.id,
          document_id: chunk.document_id,
          content_length: chunk.content?.length || 0,
          has_embedding: !!chunk.embedding,
          metadata: chunk.metadata
        })) || []
      },
      documents: {
        count: documents?.length || 0,
        sample: documents?.map(doc => ({
          id: doc.id,
          title: doc.title,
          status: doc.status,
          chunk_count: doc.chunk_count
        })) || []
      }
    });

  } catch (error) {
    console.error('디버그 API 오류:', error);
    return NextResponse.json({ error: '서버 오류', details: error }, { status: 500 });
  }
}

