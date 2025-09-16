import { NextRequest, NextResponse } from 'next/server';
import { generateResponse, getAvailableModels, checkOllamaHealth } from '@/lib/services/ollama';

// 기본 헤더 설정
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS 메서드
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers,
  });
}

// GET 메서드 - Ollama 서버 상태 및 모델 목록 확인
export async function GET() {
  try {
    console.log('🔍 Ollama API GET 요청 - 서버 상태 확인');
    
    // 환경 변수 직접 확인
    const ollamaUrl = process.env.OLLAMA_BASE_URL;
    console.log('🔧 환경 변수 직접 확인:', {
      OLLAMA_BASE_URL: ollamaUrl,
      NODE_ENV: process.env.NODE_ENV,
      hasOllamaUrl: !!ollamaUrl,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('OLLAMA')),
      allEnvKeysCount: Object.keys(process.env).length
    });
    
    // 환경 변수가 없으면 기본값 사용 (Nginx 프록시를 통해 접근)
    const baseUrl = ollamaUrl || 'http://141.164.52.52';
    console.log('🔧 사용할 Ollama URL:', baseUrl);
    
    // 직접 URL로 헬스 체크
    let isHealthy = false;
    let models = [];
    
    try {
      console.log('🔍 Ollama 서버 헬스 체크:', baseUrl);
      
      // 타임아웃 설정 (60초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const healthResponse = await fetch(`${baseUrl}/api/tags`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      isHealthy = healthResponse.ok;
      console.log('🔍 헬스 체크 결과:', { 
        isHealthy, 
        status: healthResponse.status,
        statusText: healthResponse.statusText,
        url: baseUrl
      });
      
      if (isHealthy) {
        try {
          const modelsResponse = await fetch(`${baseUrl}/api/tags`, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json();
            models = modelsData.models || [];
            console.log('📋 사용 가능한 모델:', models);
          } else {
            console.error('❌ 모델 목록 조회 실패:', modelsResponse.status, modelsResponse.statusText);
            models = [];
          }
        } catch (error) {
          console.error('❌ 모델 목록 조회 오류:', error);
          models = [];
        }
      } else {
        console.error('❌ 서버 헬스 체크 실패:', {
          status: healthResponse.status,
          statusText: healthResponse.statusText,
          url: baseUrl
        });
      }
    } catch (error) {
      console.error('❌ Ollama 서버 연결 오류:', {
        error: error.message,
        name: error.name,
        url: baseUrl
      });
      isHealthy = false;
    }
    
    const response = {
      success: true,
      message: 'Ollama API가 정상적으로 작동합니다.',
      timestamp: new Date().toISOString(),
      server: {
        healthy: isHealthy,
        baseUrl: baseUrl,
        actualUrl: baseUrl,
        availableModels: models.map(model => ({
          name: model.name,
          size: `${(model.size / 1024 / 1024 / 1024).toFixed(2)}GB`,
          modifiedAt: model.modified_at
        }))
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      version: 'ollama-v1',
      endpoint: '/api/ollama'
    };

    console.log('📤 최종 API 응답:', {
      success: response.success,
      serverHealthy: response.server.healthy,
      modelsCount: response.server.availableModels.length
    });

    return NextResponse.json(response, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('❌ Ollama API GET 요청 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Ollama 서버 상태 확인 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error),
      server: {
        healthy: false,
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://141.164.52.52'
      }
    }, {
      status: 500,
      headers,
    });
  }
}

// POST 메서드 - Ollama를 통한 응답 생성
export async function POST(request: NextRequest) {
  console.log('🚀 Ollama API POST 요청 시작');
  
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { message, model = 'tinyllama:1.1b' } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: '메시지가 필요합니다.',
        details: '유효한 메시지를 입력해주세요.'
      }, {
        status: 400,
        headers,
      });
    }

    console.log(`💬 Ollama API 메시지 수신: "${message}" (모델: ${model})`);

    // 환경 변수에서 URL 가져오기 (Nginx 프록시를 통해 접근)
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://141.164.52.52';
    console.log('🔧 POST 요청에서 사용할 Ollama URL:', ollamaUrl);

    // Ollama 서버 상태 확인
    let isHealthy = false;
    try {
      const healthResponse = await fetch(`${ollamaUrl}/api/tags`);
      isHealthy = healthResponse.ok;
      console.log('🔍 POST 요청 헬스 체크 결과:', { isHealthy, status: healthResponse.status });
    } catch (error) {
      console.error('❌ POST 요청 헬스 체크 오류:', error);
    }

    if (!isHealthy) {
      return NextResponse.json({
        success: false,
        error: 'Ollama 서버 연결 오류',
        details: 'Ollama 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.'
      }, {
        status: 503,
        headers,
      });
    }

    // Ollama를 통한 응답 생성
    const startTime = Date.now();
    const response = await generateResponse(message.trim(), model);
    const processingTime = Date.now() - startTime;

    console.log('✅ Ollama 응답 완료');

    const apiResponse = {
      success: true,
      response: {
        message: response,
        model: model,
        processingTime: processingTime,
        server: 'Ollama (Vultr)',
        timestamp: new Date().toISOString()
      }
    };

    console.log('📤 Ollama API 응답 전송');
    return NextResponse.json(apiResponse, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('❌ Ollama API POST 요청 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Ollama 응답 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, {
      status: 500,
      headers,
    });
  }
}
