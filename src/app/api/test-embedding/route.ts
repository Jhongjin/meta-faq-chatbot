import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 임베딩 서비스 테스트 시작...');

    const { EmbeddingService } = await import('@/lib/services/EmbeddingService');
    const embeddingService = new EmbeddingService();

    // 테스트 텍스트
    const testText = "메타 광고 정책에 대한 질문입니다.";
    
    console.log('📝 테스트 텍스트:', testText);

    // 임베딩 생성 시도
    const result = await embeddingService.generateEmbedding(testText);

    console.log('📊 임베딩 결과:', {
      model: result.model,
      dimension: result.dimension,
      processingTime: result.processingTime,
      isDummy: result.model === 'dummy',
      embeddingLength: result.embedding.length,
      firstFewValues: result.embedding.slice(0, 5)
    });

    return NextResponse.json({
      success: true,
      result: {
        model: result.model,
        dimension: result.dimension,
        processingTime: result.processingTime,
        isDummy: result.model === 'dummy',
        embeddingLength: result.embedding.length,
        firstFewValues: result.embedding.slice(0, 5),
        isAllZeros: result.embedding.every(val => val === 0),
        isRandom: result.embedding.some(val => Math.abs(val) > 0.1)
      }
    });

  } catch (error) {
    console.error('❌ 임베딩 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
