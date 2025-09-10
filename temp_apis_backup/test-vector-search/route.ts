import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 벡터 검색 함수 테스트 시작...');

    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 테스트용 임베딩 생성 (더미)
    const testEmbedding = new Array(1024).fill(0).map(() => Math.random() - 0.5);
    console.log('📊 테스트 임베딩 생성:', testEmbedding.slice(0, 5));

    // 2. 벡터 검색 함수 테스트
    console.log('🔍 벡터 검색 함수 테스트...');
    const { data: searchResults, error: searchError } = await supabase
      .rpc('match_documents', {
        query_embedding: testEmbedding,
        match_threshold: 0.7,
        match_count: 3
      });

    if (searchError) {
      console.error('❌ 벡터 검색 함수 오류:', searchError);
      return NextResponse.json({
        success: false,
        error: `벡터 검색 함수 오류: ${searchError.message}`,
        details: searchError
      }, { status: 500 });
    }

    console.log('✅ 벡터 검색 성공:', searchResults?.length || 0, '개 결과');

    // 3. 직접 쿼리 테스트
    console.log('🔍 직접 쿼리 테스트...');
    const { data: directResults, error: directError } = await supabase
      .from('document_chunks')
      .select('id, document_id, content, embedding')
      .limit(3);

    if (directError) {
      console.error('❌ 직접 쿼리 오류:', directError);
    } else {
      console.log('✅ 직접 쿼리 성공:', directResults?.length || 0, '개 결과');
    }

    // 4. 임베딩 데이터 확인
    console.log('🔍 임베딩 데이터 확인...');
    const { data: embeddingData, error: embeddingError } = await supabase
      .from('document_chunks')
      .select('id, embedding')
      .limit(1);

    if (embeddingError) {
      console.error('❌ 임베딩 데이터 쿼리 오류:', embeddingError);
    } else if (embeddingData && embeddingData.length > 0) {
      const embedding = embeddingData[0].embedding;
      console.log('📊 임베딩 데이터 타입:', typeof embedding);
      console.log('📊 임베딩 데이터 길이:', Array.isArray(embedding) ? embedding.length : 'N/A');
      console.log('📊 임베딩 데이터 샘플:', Array.isArray(embedding) ? embedding.slice(0, 5) : embedding);
    }

    return NextResponse.json({
      success: true,
      vectorSearch: {
        results: searchResults?.length || 0,
        error: searchError?.message || null
      },
      directQuery: {
        results: directResults?.length || 0,
        error: directError?.message || null
      },
      embeddingData: {
        type: embeddingData?.[0]?.embedding ? typeof embeddingData[0].embedding : 'N/A',
        length: Array.isArray(embeddingData?.[0]?.embedding) ? embeddingData[0].embedding.length : 'N/A',
        sample: Array.isArray(embeddingData?.[0]?.embedding) ? embeddingData[0].embedding.slice(0, 5) : embeddingData?.[0]?.embedding
      }
    });

  } catch (error) {
    console.error('❌ 벡터 검색 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
