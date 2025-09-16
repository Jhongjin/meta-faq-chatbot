import { NextRequest, NextResponse } from 'next/server';

/**
 * Hugging Face API 테스트
 */
export async function GET() {
  try {
    console.log('🧪 Hugging Face API 테스트 시작');
    
    const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!huggingfaceApiKey) {
      return NextResponse.json({
        success: false,
        error: 'HUGGINGFACE_API_KEY가 설정되지 않았습니다',
        envVars: {
          HUGGINGFACE_API_KEY: '미설정',
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '미설정',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '미설정'
        }
      });
    }
    
    console.log('🔑 Hugging Face API 키 확인됨');
    
    // 간단한 테스트 요청
    const testPrompt = '안녕하세요. 간단한 인사말을 해주세요.';
    
    console.log('📤 Hugging Face API 요청 시작:', testPrompt);
    
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingfaceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: testPrompt,
        parameters: {
          max_length: 100,
          temperature: 0.7,
          do_sample: true
        }
      }),
      signal: AbortSignal.timeout(30000)
    });
    
    console.log('📡 Hugging Face API 응답 상태:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hugging Face API 오류:', errorText);
      return NextResponse.json({
        success: false,
        error: `Hugging Face API 오류: ${response.status}`,
        details: errorText,
        testPrompt
      });
    }
    
    const data = await response.json();
    console.log('✅ Hugging Face API 테스트 성공:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Hugging Face API 테스트 성공',
      response: data,
      testPrompt
    });
    
  } catch (error) {
    console.error('❌ Hugging Face API 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Hugging Face API 테스트 실패',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
