import { NextRequest, NextResponse } from 'next/server';

// 코사인 유사도 계산 함수
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
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

  if (normA === 0 || normB === 0) {
    return 0;
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return isFinite(similarity) ? Math.max(0, Math.min(1, similarity)) : 0;
}

export async function POST(request: NextRequest) {
  try {
    let query = '';
    
    try {
      const body = await request.json();
      query = body?.query || '';
    } catch (jsonError) {
      console.error('JSON 파싱 오류:', jsonError);
      return NextResponse.json({
        success: false,
        error: '잘못된 JSON 형식입니다.'
      }, { status: 400 });
    }
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: '쿼리가 필요합니다.'
      }, { status: 400 });
    }

    console.log('🚀 간단한 RAG 테스트 시작:', query);
    
    const results: any = {
      timestamp: new Date().toISOString(),
      query: query
    };

    // 1. 임베딩 서비스 테스트
    try {
      const { OllamaEmbeddingService } = await import('@/lib/services/OllamaEmbeddingService');
      const embeddingService = new OllamaEmbeddingService();
      
      const startTime = Date.now();
      const embedding = await embeddingService.generateEmbedding(query);
      const processingTime = Date.now() - startTime;
      
        results.embedding = {
          success: true,
          dimension: embedding.dimension,
          processingTime,
          model: embedding.model,
          sample: embedding.embedding.slice(0, 5),
          full_embedding: embedding.embedding
        };
      
      console.log('✅ 임베딩 성공:', { processingTime: `${processingTime}ms` });
    } catch (error) {
      console.error('❌ 임베딩 실패:', error);
      results.embedding = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // 2. 데이터베이스 조회 (RPC 함수 사용 안함)
    try {
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
        .limit(10);

      if (error) {
        results.vectorSearch = {
          success: false,
          error: error.message
        };
      } else {
        // 클라이언트에서 유사도 계산 (전체 임베딩 사용)
        const queryEmbedding = results.embedding?.success ? results.embedding.full_embedding : [];
        const filteredResults = (searchResults || [])
          .map((result: any) => {
            try {
              let storedEmbedding: number[];
              if (typeof result.embedding === 'string') {
                storedEmbedding = JSON.parse(result.embedding);
              } else if (Array.isArray(result.embedding)) {
                storedEmbedding = result.embedding;
              } else {
                return null;
              }
              
              const similarity = calculateCosineSimilarity(queryEmbedding, storedEmbedding);
              console.log(`🔍 유사도 계산: ${result.chunk_id} = ${similarity.toFixed(4)} (임계값: 0.01)`);
              return { ...result, similarity };
            } catch (error) {
              return null;
            }
          })
          .filter((result: any) => result !== null && result.similarity > 0.01)
          .sort((a: any, b: any) => b.similarity - a.similarity)
          .slice(0, 5);

        results.vectorSearch = {
          success: true,
          results: filteredResults.length,
          data: filteredResults
        };
        
        console.log('✅ 벡터 검색 성공:', { results: filteredResults.length });
      }
    } catch (error) {
      console.error('❌ 벡터 검색 실패:', error);
      results.vectorSearch = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // 3. LLM 서비스 테스트 (간단한 버전)
    try {
      const { llmService } = await import('@/lib/services/LLMService');
      
      const isAvailable = await llmService.checkOllamaStatus();
      if (isAvailable) {
        const startTime = Date.now();
        const response = await llmService.generateFastAnswer(query, {
          model: 'qwen2.5:1.5b',
          temperature: 0.3
        });
        const processingTime = Date.now() - startTime;
        
        results.llm = {
          success: true,
          answer: response.answer,
          confidence: response.confidence,
          processingTime,
          model: response.model
        };
        
        console.log('✅ LLM 성공:', { processingTime: `${processingTime}ms` });
      } else {
        results.llm = {
          success: false,
          error: 'Ollama 서버가 사용 불가능합니다.'
        };
      }
    } catch (error) {
      console.error('❌ LLM 실패:', error);
      results.llm = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // 4. RAG 통합 테스트 (간단한 버전)
    try {
      const { RAGSearchService } = await import('@/lib/services/RAGSearchService');
      const ragService = new RAGSearchService();
      
      const startTime = Date.now();
      const response = await ragService.generateChatResponse(query);
      const processingTime = Date.now() - startTime;
      
      results.rag = {
        success: true,
        answer: response.answer,
        sources: response.sources.length,
        confidence: response.confidence,
        processingTime,
        model: response.model
      };
      
      console.log('✅ RAG 통합 성공:', { 
        sources: response.sources.length,
        processingTime: `${processingTime}ms`
      });
    } catch (error) {
      console.error('❌ RAG 통합 실패:', error);
      results.rag = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    return NextResponse.json({
      success: true,
      message: '간단한 RAG 테스트가 완료되었습니다.',
      results: results
    });

  } catch (error) {
    console.error('❌ 간단한 RAG 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: '간단한 RAG 테스트 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
