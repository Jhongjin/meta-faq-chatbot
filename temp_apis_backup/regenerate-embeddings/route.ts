import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingValidationService } from '@/lib/services/EmbeddingValidationService';

export async function POST(request: NextRequest) {
  try {
    const validationService = new EmbeddingValidationService();
    
    // 문제가 있는 임베딩 재생성
    const regenerateResult = await validationService.regenerateProblematicEmbeddings();
    
    return NextResponse.json({
      success: regenerateResult.success,
      result: regenerateResult,
      message: `임베딩 재생성 완료: ${regenerateResult.fixedCount}개 성공, ${regenerateResult.errorCount}개 실패`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('임베딩 재생성 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '임베딩 재생성 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
