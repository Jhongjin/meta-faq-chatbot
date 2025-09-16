import { NextRequest, NextResponse } from 'next/server';

/**
 * 프록시 API 테스트
 */
export async function GET() {
  try {
    console.log('🧪 프록시 API 테스트 시작');
    
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const proxyUrl = `${baseUrl}/api/proxy-ollama`;
    
    console.log('🔗 프록시 URL:', proxyUrl);
    
    // 간단한 테스트 요청
    const testRequest = {
      model: 'llama3.2:3b',
      prompt: '안녕하세요. 간단한 인사말을 해주세요.',
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9
      }
    };
    
    console.log('📤 테스트 요청:', testRequest);
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
      signal: AbortSignal.timeout(30000)
    });
    
    console.log('📡 프록시 응답 상태:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 프록시 API 오류:', errorText);
      return NextResponse.json({
        success: false,
        error: `프록시 API 오류: ${response.status}`,
        details: errorText,
        proxyUrl,
        testRequest
      });
    }
    
    const data = await response.json();
    console.log('✅ 프록시 API 테스트 성공');
    
    return NextResponse.json({
      success: true,
      message: '프록시 API 테스트 성공',
      response: data,
      proxyUrl,
      testRequest
    });
    
  } catch (error) {
    console.error('❌ 프록시 API 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: '프록시 API 테스트 실패',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
