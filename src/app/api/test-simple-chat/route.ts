import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: '메시지가 필요합니다.'
      }, { status: 400 });
    }

    console.log('🧪 간단한 챗봇 테스트:', message);

    // 1. 환경 변수 확인
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasOllamaUrl = !!process.env.OLLAMA_BASE_URL;

    console.log('🔧 환경 변수 상태:', {
      hasSupabaseUrl,
      hasSupabaseKey,
      hasOllamaUrl
    });

    // 2. Supabase 연결 테스트
    let dbStatus = 'unknown';
    let documentsCount = 0;
    
    if (hasSupabaseUrl && hasSupabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
          .from('documents')
          .select('id')
          .limit(1);

        if (error) {
          dbStatus = 'error';
          console.error('❌ 데이터베이스 오류:', error);
        } else {
          dbStatus = 'connected';
          documentsCount = data?.length || 0;
          console.log('✅ 데이터베이스 연결 성공');
        }
      } catch (error) {
        dbStatus = 'error';
        console.error('❌ 데이터베이스 연결 실패:', error);
      }
    } else {
      dbStatus = 'no_env_vars';
    }

    // 3. Ollama 서비스 테스트
    let ollamaStatus = 'unknown';
    let ollamaResponse = '';
    
    try {
      const { llmService } = await import('@/lib/services/LLMService');
      
      const isAvailable = await llmService.checkOllamaStatus();
      
      if (isAvailable) {
        const response = await llmService.generateFastAnswer(
          `사용자 질문: "${message}"\n\n이 질문에 대해 간단히 답변해주세요.`,
          { temperature: 0.3, maxTokens: 200 }
        );
        
        ollamaStatus = 'working';
        ollamaResponse = response.answer;
        console.log('✅ Ollama 서비스 작동 중');
      } else {
        ollamaStatus = 'not_available';
        console.log('⚠️ Ollama 서비스 사용 불가');
      }
    } catch (error) {
      ollamaStatus = 'error';
      console.error('❌ Ollama 서비스 오류:', error);
    }

    // 4. 응답 생성
    let finalResponse = '';
    
    if (ollamaStatus === 'working' && ollamaResponse) {
      finalResponse = ollamaResponse;
    } else if (dbStatus === 'connected' && documentsCount > 0) {
      finalResponse = `데이터베이스에는 ${documentsCount}개의 문서가 있습니다. 하지만 Ollama 서비스가 작동하지 않아 AI 답변을 생성할 수 없습니다.`;
    } else if (dbStatus === 'no_env_vars') {
      finalResponse = 'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.';
    } else if (ollamaStatus === 'not_available') {
      finalResponse = 'Ollama 서비스가 사용 불가능합니다. Ollama 서버가 실행 중인지 확인해주세요.';
    } else {
      finalResponse = '서비스 설정에 문제가 있습니다. 관리자에게 문의해주세요.';
    }

    return NextResponse.json({
      success: true,
      response: {
        message: finalResponse,
        debug: {
          environment: {
            hasSupabaseUrl,
            hasSupabaseKey,
            hasOllamaUrl
          },
          database: {
            status: dbStatus,
            documentsCount
          },
          ollama: {
            status: ollamaStatus
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ 간단한 챗봇 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
