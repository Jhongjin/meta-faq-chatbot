import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Ollama 서버 디버깅 시작...');
    
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    console.log(`📡 Ollama URL: ${ollamaUrl}`);
    
    // 1. 기본 연결 테스트
    let connectionTest = {
      success: false,
      status: 0,
      error: null as string | null
    };
    
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });
      
      connectionTest = {
        success: response.ok,
        status: response.status,
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
      };
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Ollama 서버 연결 성공:', data);
      }
    } catch (error) {
      connectionTest.error = error instanceof Error ? error.message : String(error);
      console.error('❌ Ollama 서버 연결 실패:', error);
    }
    
    // 2. 모델 생성 테스트
    let generationTest = {
      success: false,
      error: null as string | null,
      response: null as string | null
    };
    
    if (connectionTest.success) {
      try {
        const response = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.OLLAMA_MODEL || 'qwen2.5:1.5b',
            prompt: '안녕하세요',
            stream: false,
            options: {
              temperature: 0.3,
              num_predict: 50,
            }
          }),
          signal: AbortSignal.timeout(30000)
        });
        
        if (response.ok) {
          const data = await response.json();
          generationTest = {
            success: true,
            error: null,
            response: data.response
          };
          console.log('✅ 모델 생성 테스트 성공:', data.response);
        } else {
          const errorText = await response.text();
          generationTest.error = `HTTP ${response.status}: ${errorText}`;
          console.error('❌ 모델 생성 테스트 실패:', errorText);
        }
      } catch (error) {
        generationTest.error = error instanceof Error ? error.message : String(error);
        console.error('❌ 모델 생성 테스트 오류:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        ollamaUrl,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL,
          OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
          OLLAMA_MODEL: process.env.OLLAMA_MODEL
        },
        connectionTest,
        generationTest,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('디버깅 API 오류:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '디버깅 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
