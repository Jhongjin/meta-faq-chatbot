import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingValidationService } from '@/lib/services/EmbeddingValidationService';

export async function GET(request: NextRequest) {
  try {
    const validationService = new EmbeddingValidationService();
    
    // 임베딩 유효성 검사
    const validationResult = await validationService.validateEmbeddings();
    
    // 임베딩 통계 조회
    const stats = await validationService.getEmbeddingStats();
    
    return NextResponse.json({
      success: true,
      validation: validationResult,
      stats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('임베딩 유효성 검사 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '임베딩 유효성 검사 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
