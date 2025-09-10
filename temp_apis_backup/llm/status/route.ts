import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/services/LLMService';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 LLM 서비스 상태 확인 중...');
    
    // Ollama 서비스 상태 확인
    const isAvailable = await llmService.checkOllamaStatus();
    
    // 사용 가능한 모델 목록 조회
    const models = isAvailable ? await llmService.getAvailableModels() : [];
    
    return NextResponse.json({
      success: true,
      status: {
        isAvailable,
        models,
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        defaultModel: process.env.OLLAMA_MODEL || 'qwen2.5:14b'
      }
    });

  } catch (error) {
    console.error('LLM 상태 확인 오류:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'LLM 서비스 상태 확인 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
