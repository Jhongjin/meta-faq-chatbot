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

    // 1. Meta 관련 문서 조회 (chunk_count가 0인 것들)
    const { data: metaDocuments, error: docsError } = await supabase
      .from('documents')
      .select('id, title, status, chunk_count')
      .eq('status', 'indexed')
      .or('title.ilike.%facebook%,title.ilike.%instagram%,title.ilike.%meta%,title.ilike.%marketing%,title.ilike.%ads%')
      .limit(10);

    if (docsError) {
      return NextResponse.json({ error: '문서 조회 실패', details: docsError }, { status: 500 });
    }

    // 2. 각 문서의 기존 청크 확인
    const documentAnalysis = await Promise.all(
      (metaDocuments || []).map(async (doc) => {
        const { data: existingChunks, error: chunksError } = await supabase
          .from('document_chunks')
          .select('id, content, metadata')
          .eq('document_id', doc.id);

        return {
          document: doc,
          existingChunks: existingChunks || [],
          chunksError: chunksError
        };
      })
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalMetaDocuments: metaDocuments?.length || 0,
        documentsWithChunks: documentAnalysis.filter(d => d.existingChunks.length > 0).length,
        documentsWithoutChunks: documentAnalysis.filter(d => d.existingChunks.length === 0).length
      },
      documentAnalysis: documentAnalysis.map(analysis => ({
        documentId: analysis.document.id,
        documentTitle: analysis.document.title,
        documentStatus: analysis.document.status,
        chunkCount: analysis.document.chunk_count,
        existingChunksCount: analysis.existingChunks.length,
        chunksError: analysis.chunksError,
        sampleChunk: analysis.existingChunks[0] || null
      }))
    });

  } catch (error) {
    console.error('Meta 청크 디버그 API 오류:', error);
    return NextResponse.json({ error: '서버 오류', details: error }, { status: 500 });
  }
}

