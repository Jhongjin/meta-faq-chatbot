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
  // 타임아웃 설정 (30초)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('요청 시간 초과 (30초)')), 30000);
  });

  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: '쿼리가 필요합니다.'
      }, { status: 400 });
    }

    console.log('🔍 RAG 상세 테스트 시작:', query);

    // 타임아웃과 함께 실행
    const testPromise = (async () => {
      // 1. 임베딩 서비스 테스트
      let embeddingResult = null;
      try {
        const { OllamaEmbeddingService } = await import('@/lib/services/OllamaEmbeddingService');
        const embeddingService = new OllamaEmbeddingService();
        
        const startTime = Date.now();
        const embedding = await embeddingService.generateEmbedding(query);
        const processingTime = Date.now() - startTime;
        
        embeddingResult = {
          success: true,
          dimension: embedding.dimension,
          processingTime,
          model: embedding.model,
          sample: embedding.embedding.slice(0, 5)
        };
        
        console.log('✅ 임베딩 생성 성공:', {
          dimension: embedding.dimension,
          processingTime: `${processingTime}ms`,
          model: embedding.model
        });
      } catch (error) {
        console.error('❌ 임베딩 생성 실패:', error);
        embeddingResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }

      // 2. 벡터 검색 테스트 (직접 SQL 쿼리 사용)
      let vectorSearchResult = null;
      if (embeddingResult?.success) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          // 직접 SQL 쿼리 사용 (RPC 함수 문제 우회)
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
            console.error('❌ 데이터베이스 조회 오류:', error);
            vectorSearchResult = {
              success: false,
              error: error.message
            };
          } else {
            // 클라이언트에서 유사도 계산
            const queryEmbedding = embeddingResult.sample;
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
                  
                  // 간단한 유사도 계산 (코사인 유사도)
                  const similarity = calculateCosineSimilarity(queryEmbedding, storedEmbedding);
                  return { ...result, similarity };
                } catch (error) {
                  return null;
                }
              })
              .filter((result: any) => result !== null && result.similarity > 0.1)
              .sort((a: any, b: any) => b.similarity - a.similarity)
              .slice(0, 5);

            console.log('✅ 벡터 검색 성공:', {
              totalResults: searchResults?.length || 0,
              filteredResults: filteredResults.length
            });
            vectorSearchResult = {
              success: true,
              results: filteredResults.length,
              data: filteredResults
            };
          }
        } catch (error) {
          console.error('❌ 벡터 검색 실패:', error);
          vectorSearchResult = {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }

      // 3. LLM 서비스 테스트
      let llmResult = null;
      try {
        const { llmService } = await import('@/lib/services/LLMService');
        
        const isAvailable = await llmService.checkOllamaStatus();
        if (isAvailable) {
          const startTime = Date.now();
          const response = await llmService.generateFastAnswer(query, '상세한 RAG 테스트를 위한 컨텍스트입니다.');
          const processingTime = Date.now() - startTime;
          
          llmResult = {
            success: true,
            answer: response.answer,
            confidence: response.confidence,
            processingTime,
            model: response.model
          };
          
          console.log('✅ LLM 답변 생성 성공:', {
            processingTime: `${processingTime}ms`,
            model: response.model,
            confidence: response.confidence
          });
        } else {
          llmResult = {
            success: false,
            error: 'Ollama 서버가 사용 불가능합니다.'
          };
        }
      } catch (error) {
        console.error('❌ LLM 서비스 실패:', error);
        llmResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }

      // 4. RAG 통합 테스트
      let ragResult = null;
      try {
        const { RAGSearchService } = await import('@/lib/services/RAGSearchService');
        const ragService = new RAGSearchService();
        
        const startTime = Date.now();
        const response = await ragService.generateChatResponse(query);
        const processingTime = Date.now() - startTime;
        
        ragResult = {
          success: true,
          answer: response.answer,
          sources: response.sources.length,
          confidence: response.confidence,
          processingTime,
          model: response.model
        };
        
        console.log('✅ RAG 통합 성공:', {
          sources: response.sources.length,
          confidence: response.confidence,
          processingTime: `${processingTime}ms`
        });
      } catch (error) {
        console.error('❌ RAG 통합 실패:', error);
        ragResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }

      return {
        embedding: embeddingResult,
        vectorSearch: vectorSearchResult,
        llm: llmResult,
        rag: ragResult
      };
    })();

    // 타임아웃과 함께 실행
    const result = await Promise.race([testPromise, timeoutPromise]);

    return NextResponse.json({
      success: true,
      message: 'RAG 상세 테스트가 완료되었습니다.',
      results: result
    });

  } catch (error) {
    console.error('❌ RAG 상세 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'RAG 상세 테스트 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}