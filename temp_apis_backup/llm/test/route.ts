import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/services/LLMService';

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: '질문이 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🧪 LLM 테스트 요청: "${query}"`);

    // LLM 서비스 상태 확인
    const isAvailable = await llmService.checkOllamaStatus();
    
    if (!isAvailable) {
      return NextResponse.json({
        success: false,
        error: 'Ollama 서비스가 사용 불가능합니다.',
        suggestion: 'Ollama 서버가 실행 중인지 확인해주세요.'
      });
    }

    // LLM 테스트 실행
    const testContext = context || 'Meta 광고 정책에 대한 일반적인 정보입니다.';
    const response = await llmService.generateProfessionalAnswer(query, testContext);
    
    // 답변 품질 검증
    const validation = llmService.validateAnswer(response.answer, query);

    console.log(`✅ LLM 테스트 완료: ${response.processingTime}ms, 신뢰도: ${response.confidence}`);

    return NextResponse.json({
      success: true,
      response: {
        answer: response.answer,
        confidence: response.confidence,
        processingTime: response.processingTime,
        model: response.model,
        validation: {
          isValid: validation.isValid,
          issues: validation.issues,
          suggestions: validation.suggestions
        }
      }
    });

  } catch (error) {
    console.error('LLM 테스트 오류:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'LLM 테스트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
