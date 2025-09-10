import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 상세 임베딩 테스트 시작...');

    const { EmbeddingService } = await import('@/lib/services/EmbeddingService');
    const embeddingService = new EmbeddingService();

    // 1. 초기화 테스트
    console.log('1️⃣ 임베딩 서비스 초기화 테스트...');
    try {
      await embeddingService.initialize('bge-m3');
      console.log('✅ 초기화 성공');
    } catch (error) {
      console.error('❌ 초기화 실패:', error);
      return NextResponse.json({
        success: false,
        error: `초기화 실패: ${error}`,
        step: 'initialization'
      }, { status: 500 });
    }

    // 2. 임베딩 생성 테스트
    console.log('2️⃣ 임베딩 생성 테스트...');
    const testText = "메타 광고 정책 테스트";
    const result = await embeddingService.generateEmbedding(testText);

    console.log('📊 임베딩 결과:', {
      model: result.model,
      dimension: result.dimension,
      processingTime: result.processingTime,
      isDummy: result.model === 'dummy',
      embeddingLength: result.embedding.length,
      firstFewValues: result.embedding.slice(0, 5),
      isAllZeros: result.embedding.every(val => val === 0),
      isRandom: result.embedding.some(val => Math.abs(val) > 0.1)
    });

    // 3. 패키지 정보 확인
    console.log('3️⃣ 패키지 정보 확인...');
    let packageInfo = {};
    try {
      const { pipeline } = await import('@xenova/transformers');
      packageInfo = {
        available: true,
        version: '2.17.2'
      };
    } catch (error) {
      packageInfo = {
        available: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

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
      },
      packageInfo,
      testText
    });

  } catch (error) {
    console.error('❌ 상세 임베딩 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
