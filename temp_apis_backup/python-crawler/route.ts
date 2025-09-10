import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVER_URL = process.env.PYTHON_CRAWLER_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Python 크롤러 서버로 요청 전송:', body);
    
    const response = await fetch(`${PYTHON_SERVER_URL}/crawl-meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Python 서버 오류: ${response.status}`);
    }

    const result = await response.json();
    console.log('Python 크롤러 결과:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Python 크롤러 연동 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        message: 'Python 크롤러 서버와 연동 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${PYTHON_SERVER_URL}/crawl-status`);
    
    if (!response.ok) {
      throw new Error(`Python 서버 상태 확인 실패: ${response.status}`);
    }

    const status = await response.json();
    return NextResponse.json(status);

  } catch (error) {
    console.error('Python 크롤러 상태 확인 오류:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        message: 'Python 크롤러 서버에 연결할 수 없습니다.'
      },
      { status: 500 }
    );
  }
}

