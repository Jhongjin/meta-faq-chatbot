import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 초간단 테스트 시작');
    
    // 기본 응답
    const response = {
      success: true,
      message: '초간단 테스트 성공',
      timestamp: new Date().toISOString(),
      results: {
        test: 'OK',
        server: 'Running',
        time: Date.now()
      }
    };

    console.log('✅ 초간단 테스트 완료');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 초간단 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: '초간단 테스트 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
