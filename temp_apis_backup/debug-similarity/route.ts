import { NextRequest, NextResponse } from 'next/server';

// 코사인 유사도 계산 함수 (디버깅용)
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  console.log(`🔍 벡터 A 길이: ${vecA.length}, 벡터 B 길이: ${vecB.length}`);
  
  if (vecA.length !== vecB.length || vecA.length === 0) {
    console.log('❌ 벡터 길이 불일치 또는 빈 벡터');
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = Number(vecA[i]) || 0;
    const b = Number(vecB[i]) || 0;
    
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  console.log(`📊 내적: ${dotProduct}, 노름A: ${normA}, 노름B: ${normB}`);

  if (normA === 0 || normB === 0) {
    console.log('❌ 노름이 0입니다');
    return 0;
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  console.log(`🎯 최종 유사도: ${similarity}`);
  
  return isFinite(similarity) ? Math.max(0, Math.min(1, similarity)) : 0;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 유사도 디버깅 시작');
    
    // 1. 임베딩 서비스에서 쿼리 임베딩 생성
    const { OllamaEmbeddingService } = await import('@/lib/services/OllamaEmbeddingService');
    const embeddingService = new OllamaEmbeddingService();
    
    const query = '메타 광고 정책';
    const queryEmbedding = await embeddingService.generateEmbedding(query);
    console.log(`📊 쿼리 임베딩: ${queryEmbedding.embedding.length}차원`);
    console.log(`📊 쿼리 임베딩 샘플: [${queryEmbedding.embedding.slice(0, 5).join(', ')}]`);

    // 2. 데이터베이스에서 저장된 임베딩 조회
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: searchResults, error } = await supabase
      .from('document_chunks')
      .select(`
        chunk_id,
        content,
        metadata,
        embedding
      `)
      .limit(3);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

    console.log(`📊 DB에서 조회된 청크 수: ${searchResults?.length || 0}`);

    // 3. 각 청크와의 유사도 계산
    const similarities = [];
    for (const result of searchResults || []) {
      console.log(`\n🔍 청크 분석: ${result.chunk_id}`);
      
      let storedEmbedding: number[];
      try {
        if (typeof result.embedding === 'string') {
          storedEmbedding = JSON.parse(result.embedding);
        } else if (Array.isArray(result.embedding)) {
          storedEmbedding = result.embedding;
        } else {
          console.log('❌ 알 수 없는 임베딩 형식');
          continue;
        }
        
        console.log(`📊 저장된 임베딩 길이: ${storedEmbedding.length}`);
        console.log(`📊 저장된 임베딩 샘플: [${storedEmbedding.slice(0, 5).join(', ')}]`);
        
        const similarity = calculateCosineSimilarity(queryEmbedding.embedding, storedEmbedding);
        
        similarities.push({
          chunk_id: result.chunk_id,
          similarity: similarity,
          content_preview: result.content.substring(0, 100) + '...'
        });
        
        console.log(`✅ ${result.chunk_id}: 유사도 = ${similarity.toFixed(6)}`);
        
      } catch (error) {
        console.log(`❌ ${result.chunk_id}: 임베딩 파싱 실패 - ${error}`);
      }
    }

    // 4. 결과 정렬
    similarities.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      success: true,
      message: '유사도 디버깅 완료',
      results: {
        query: query,
        query_embedding_length: queryEmbedding.embedding.length,
        query_embedding_sample: queryEmbedding.embedding.slice(0, 5),
        total_chunks: searchResults?.length || 0,
        similarities: similarities,
        max_similarity: similarities.length > 0 ? similarities[0].similarity : 0,
        min_similarity: similarities.length > 0 ? similarities[similarities.length - 1].similarity : 0
      }
    });

  } catch (error) {
    console.error('❌ 유사도 디버깅 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
