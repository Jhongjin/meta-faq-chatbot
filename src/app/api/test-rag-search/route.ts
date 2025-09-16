import { NextRequest, NextResponse } from 'next/server';
import { getRAGSearchService } from '@/lib/services/RAGSearchService';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 RAG 검색 테스트 시작');
    
    const body = await request.json();
    const { query } = body;
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: '검색 쿼리가 필요합니다.'
      }, { status: 400 });
    }
    
    console.log(`🔍 검색 쿼리: "${query}"`);
    
    // RAG 서비스 초기화
    const ragService = getRAGSearchService();
    
    // 1. 유사한 청크 검색
    console.log('📊 유사한 청크 검색 시작');
    const searchResults = await ragService.searchSimilarChunks(query, 5, 0.001);
    console.log(`📊 검색 결과: ${searchResults.length}개`);
    
    // 2. 검색 결과 상세 정보
    const detailedResults = searchResults.map(result => ({
      id: result.id,
      content: result.content,
      similarity: result.similarity,
      documentId: result.documentId,
      documentTitle: result.documentTitle,
      documentUrl: result.documentUrl,
      chunkIndex: result.chunkIndex,
      metadata: result.metadata
    }));
    
    // 3. 전체 RAG 응답 생성
    console.log('🤖 RAG 응답 생성 시작');
    const ragResponse = await ragService.generateChatResponse(query);
    
    const testResult = {
      success: true,
      query,
      searchResults: {
        count: searchResults.length,
        results: detailedResults
      },
      ragResponse: {
        answer: ragResponse.answer,
        confidence: ragResponse.confidence,
        processingTime: ragResponse.processingTime,
        model: ragResponse.model,
        isLLMGenerated: ragResponse.isLLMGenerated
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ RAG 검색 테스트 완료:', {
      searchResultsCount: searchResults.length,
      ragAnswerLength: ragResponse.answer.length,
      confidence: ragResponse.confidence
    });
    
    return NextResponse.json(testResult, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('❌ RAG 검색 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'RAG 검색 테스트 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}


