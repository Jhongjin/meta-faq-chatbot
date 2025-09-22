import { NextRequest, NextResponse } from 'next/server';

/**
 * 청크 데이터 확인 API (디버깅용)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 청크 데이터 확인 시작...');

    // Supabase 클라이언트 생성
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. 문서 목록 조회
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, title, content, status, chunk_count')
      .order('created_at', { ascending: false });

    if (docsError) {
      throw new Error(`문서 조회 오류: ${docsError.message}`);
    }

    // 2. 각 문서의 청크 데이터 조회
    const documentChunks = [];
    for (const doc of documents || []) {
      const { data: chunks, error: chunksError } = await supabase
        .from('document_chunks')
        .select('id, chunk_id, content, embedding, metadata')
        .eq('document_id', doc.id)
        .order('chunk_id', { ascending: true });

      if (chunksError) {
        console.warn(`문서 ${doc.id} 청크 조회 오류:`, chunksError);
        continue;
      }

      documentChunks.push({
        document: doc,
        chunks: chunks || [],
        actualChunkCount: chunks?.length || 0
      });
    }

    // 3. 임베딩 데이터 확인
    const { data: allChunks, error: allChunksError } = await supabase
      .from('document_chunks')
      .select('id, document_id, chunk_id, content, embedding')
      .limit(5);

    if (allChunksError) {
      console.warn('전체 청크 조회 오류:', allChunksError);
    }

    // 4. 임베딩 벡터 분석
    const embeddingAnalysis = (allChunks || []).map(chunk => ({
      id: chunk.id,
      document_id: chunk.document_id,
      chunk_id: chunk.chunk_id,
      content_length: chunk.content?.length || 0,
      content_preview: chunk.content?.substring(0, 100) + '...',
      has_embedding: !!chunk.embedding,
      embedding_length: chunk.embedding?.length || 0,
      embedding_type: Array.isArray(chunk.embedding) ? 'array' : typeof chunk.embedding
    }));

    console.log('✅ 청크 데이터 확인 완료');

    return NextResponse.json({
      success: true,
      data: {
        documents: documentChunks,
        embeddingAnalysis,
        summary: {
          totalDocuments: documents?.length || 0,
          totalChunks: documentChunks.reduce((sum, doc) => sum + doc.actualChunkCount, 0),
          documentsWithEmbeddings: documentChunks.filter(doc => 
            doc.chunks.some(chunk => chunk.embedding && chunk.embedding.length > 0)
          ).length
        }
      }
    });

  } catch (error) {
    console.error('❌ 청크 데이터 확인 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '청크 데이터 확인 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
