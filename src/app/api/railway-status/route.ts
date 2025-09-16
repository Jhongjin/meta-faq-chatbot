import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🚂 Railway 상태 확인 시작');
    
    const railwayUrl = process.env.RAILWAY_OLLAMA_URL || 'https://meta-faq-ollama-production.up.railway.app';
    console.log('🔗 Railway URL:', railwayUrl);
    
    // Railway Ollama 서버 상태 확인
    const response = await fetch(`${railwayUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Meta-FAQ-Chatbot/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10초 타임아웃
    });
    
    console.log('📡 Railway 응답 상태:', response.status);
    
    if (!response.ok) {
      throw new Error(`Railway 서버 응답 오류: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Railway 상태 확인 성공:', data);
    
    return NextResponse.json({
      healthy: true,
      url: railwayUrl,
      models: data.models || [],
      message: 'Railway Ollama 서비스가 정상 작동 중입니다'
    });
    
  } catch (error) {
    console.error('❌ Railway 상태 확인 실패:', error);
    
    return NextResponse.json({
      healthy: false,
      url: process.env.RAILWAY_OLLAMA_URL || 'https://meta-faq-ollama-production.up.railway.app',
      models: [],
      message: 'Railway Ollama 서비스에 연결할 수 없습니다',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
