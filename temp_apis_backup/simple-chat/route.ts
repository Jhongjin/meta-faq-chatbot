import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    return NextResponse.json({
      success: true,
      response: {
        message: `안녕하세요! "${message}"라는 메시지를 받았습니다. 현재 AI 서비스가 일시적으로 중단되어 있어서 간단한 응답을 드립니다.`,
        sources: [],
        confidence: 50,
        processingTime: 50,
        model: 'simple-test',
        isLLMGenerated: false
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '요청 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Simple Chat API가 정상적으로 작동합니다.',
    timestamp: new Date().toISOString()
  });
}
