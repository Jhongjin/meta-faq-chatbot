import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 데이터베이스 연결 테스트 시작...');

    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 문서 테이블 확인
    console.log('📊 문서 테이블 확인...');
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, title, status')
      .limit(5);

    if (docError) {
      throw new Error(`문서 테이블 오류: ${docError.message}`);
    }

    console.log(`✅ 문서 수: ${documents?.length || 0}`);

    // 2. 문서 청크 테이블 확인
    console.log('📊 문서 청크 테이블 확인...');
    const { data: chunks, error: chunkError } = await supabase
      .from('document_chunks')
      .select('id, document_id, content, embedding')
      .limit(5);

    if (chunkError) {
      throw new Error(`문서 청크 테이블 오류: ${chunkError.message}`);
    }

    console.log(`✅ 청크 수: ${chunks?.length || 0}`);

    // 3. 임베딩 테스트
    console.log('🧪 임베딩 테스트...');
    const { EmbeddingService } = await import('@/lib/services/EmbeddingService');
    const embeddingService = new EmbeddingService();
    
    const testText = "메타 광고 정책 테스트";
    const embeddingResult = await embeddingService.generateEmbedding(testText);
    
    console.log(`✅ 임베딩 생성: ${embeddingResult.dimension}차원, ${embeddingResult.processingTime}ms`);

    // 4. 벡터 검색 테스트
    console.log('🔍 벡터 검색 테스트...');
    if (chunks && chunks.length > 0) {
      const { data: searchResults, error: searchError } = await supabase
        .rpc('match_documents', {
          query_embedding: embeddingResult.embedding,
          match_threshold: 0.7,
          match_count: 3
        });

      if (searchError) {
        console.warn(`⚠️ 벡터 검색 오류: ${searchError.message}`);
      } else {
        console.log(`✅ 벡터 검색 결과: ${searchResults?.length || 0}개`);
      }
    } else {
      console.log('⚠️ 검색할 청크가 없습니다.');
    }

    return NextResponse.json({
      success: true,
      database: {
        documentsCount: documents?.length || 0,
        chunksCount: chunks?.length || 0,
        embedding: {
          dimension: embeddingResult.dimension,
          processingTime: embeddingResult.processingTime,
          model: embeddingResult.model
        }
      },
      documents: documents?.map(doc => ({
        id: doc.id,
        title: doc.title,
        status: doc.status
      })) || [],
      chunks: chunks?.map(chunk => ({
        id: chunk.id,
        document_id: chunk.document_id,
        content: chunk.content?.substring(0, 100) + '...',
        hasEmbedding: !!chunk.embedding
      })) || []
    });

  } catch (error) {
    console.error('❌ 데이터베이스 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
