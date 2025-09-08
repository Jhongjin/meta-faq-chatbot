import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingValidationService } from '@/lib/services/EmbeddingValidationService';

export async function POST(request: NextRequest) {
  try {
    const validationService = new EmbeddingValidationService();
    
    // 임베딩 형식 수정
    const fixResult = await validationService.fixEmbeddingFormats();
    
    return NextResponse.json({
      success: fixResult.success,
      result: fixResult,
      message: `임베딩 형식 수정 완료: ${fixResult.fixedCount}개 성공, ${fixResult.errorCount}개 실패`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('임베딩 형식 수정 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '임베딩 형식 수정 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
