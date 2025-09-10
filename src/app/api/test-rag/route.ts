import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 RAG 서비스 직접 테스트 시작...');

    const { getRAGSearchService } = await import('@/lib/services/RAGSearchService');
    const ragService = getRAGSearchService();

    const testQuery = "메타 광고 정책에 대해 설명해주세요";
    console.log(`📝 테스트 쿼리: ${testQuery}`);

    // RAG 응답 생성
    const response = await ragService.generateChatResponse(testQuery);

    console.log('📊 RAG 응답 결과:', {
      answerLength: response.answer.length,
      sourcesCount: response.sources.length,
      confidence: response.confidence,
      model: response.model,
      isLLMGenerated: response.isLLMGenerated,
      processingTime: response.processingTime
    });

    // 소스 상세 정보
    if (response.sources.length > 0) {
      console.log('📚 검색된 소스들:');
      response.sources.forEach((source, index) => {
        console.log(`  ${index + 1}. ${source.documentTitle || 'Unknown'}`);
        console.log(`     유사도: ${source.similarity?.toFixed(3) || 'N/A'}`);
        console.log(`     내용: ${source.content?.substring(0, 100)}...`);
      });
    } else {
      console.log('⚠️ 검색된 소스가 없습니다.');
    }

    return NextResponse.json({
      success: true,
      query: testQuery,
      response: {
        answer: response.answer,
        sourcesCount: response.sources.length,
        confidence: response.confidence,
        model: response.model,
        isLLMGenerated: response.isLLMGenerated,
        processingTime: response.processingTime
      },
      sources: response.sources.map(source => ({
        id: source.documentId || source.id,
        title: source.documentTitle || 'Unknown',
        content: source.content?.substring(0, 200) + '...',
        similarity: source.similarity
      }))
    });

  } catch (error) {
    console.error('❌ RAG 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
