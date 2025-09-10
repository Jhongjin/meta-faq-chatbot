import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {},
    services: {} as any,
    database: {},
    errors: [] as string[]
  };

  try {
    console.log('🔍 챗봇 디버깅 시작...');

    // 1. 환경 변수 확인
    debugInfo.environment = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '누락',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '누락',
      googleApiKey: process.env.GOOGLE_API_KEY ? '설정됨' : '누락'
    };

    // 2. Supabase 연결 테스트
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // 간단한 쿼리 테스트
      const { data, error } = await supabase
        .from('documents')
        .select('id, title')
        .limit(1);

      if (error) {
        throw new Error(`데이터베이스 쿼리 실패: ${error.message}`);
      }

      debugInfo.database = {
        connected: true,
        documentsCount: data?.length || 0,
        error: null
      };
    } catch (error) {
      debugInfo.database = {
        connected: false,
        documentsCount: 0,
        error: error instanceof Error ? error.message : String(error)
      };
      debugInfo.errors.push(`데이터베이스 연결 실패: ${error}`);
    }

    // 3. Gemini 서비스 테스트
    try {
      const { geminiService } = await import('@/lib/services/GeminiService');
      
      const isAvailable = await geminiService.checkGeminiStatus();
      
      if (!isAvailable) {
        throw new Error('Gemini API 키가 설정되지 않았거나 서비스에 접근할 수 없습니다.');
      }

      // 간단한 테스트 요청
      const response = await geminiService.generateAnswer("안녕하세요", {
        temperature: 0.1,
        maxTokens: 50
      });

      debugInfo.services.gemini = {
        available: true,
        model: response.model,
        processingTime: response.processingTime,
        confidence: response.confidence,
        error: null
      };
    } catch (error) {
      debugInfo.services.gemini = {
        available: false,
        model: null,
        processingTime: 0,
        confidence: 0,
        error: error instanceof Error ? error.message : String(error)
      };
      debugInfo.errors.push(`Gemini 서비스 실패: ${error}`);
    }

    // 4. 임베딩 서비스 테스트
    try {
      const { EmbeddingService } = await import('@/lib/services/EmbeddingService');
      
      const embeddingService = new EmbeddingService();
      const testText = "테스트 텍스트입니다.";
      
      const result = await embeddingService.generateEmbedding(testText);
      
      debugInfo.services.embedding = {
        available: true,
        model: result.model,
        dimension: result.dimension,
        processingTime: result.processingTime,
        isDummy: result.model === 'dummy',
        error: null
      };
    } catch (error) {
      debugInfo.services.embedding = {
        available: false,
        model: null,
        dimension: 0,
        processingTime: 0,
        isDummy: false,
        error: error instanceof Error ? error.message : String(error)
      };
      debugInfo.errors.push(`임베딩 서비스 실패: ${error}`);
    }

    // 5. RAG 서비스 테스트
    const testQuery = "메타 광고 정책";
    try {
      const { getRAGSearchService } = await import('@/lib/services/RAGSearchService');
      
      const ragService = getRAGSearchService();
      
      const response = await ragService.generateChatResponse(testQuery);
      
      debugInfo.services.rag = {
        available: true,
        query: testQuery,
        answerLength: response.answer.length,
        sourcesCount: response.sources.length,
        confidence: response.confidence,
        model: response.model,
        isLLMGenerated: response.isLLMGenerated,
        processingTime: response.processingTime,
        error: null
      };
    } catch (error) {
      debugInfo.services.rag = {
        available: false,
        query: testQuery,
        answerLength: 0,
        sourcesCount: 0,
        confidence: 0,
        model: null,
        isLLMGenerated: false,
        processingTime: 0,
        error: error instanceof Error ? error.message : String(error)
      };
      debugInfo.errors.push(`RAG 서비스 실패: ${error}`);
    }

    // 6. 전체 상태 결정
    const hasErrors = debugInfo.errors.length > 0;
    const criticalServices = ['database', 'gemini', 'rag'];
    const criticalServicesWorking = criticalServices.every(service => 
      debugInfo.services[service]?.available !== false
    );

    debugInfo.overallStatus = {
      hasErrors,
      criticalServicesWorking,
      totalErrors: debugInfo.errors.length,
      processingTime: Date.now() - startTime
    };

    console.log(`✅ 챗봇 디버깅 완료: ${debugInfo.errors.length}개 오류 발견`);

    return NextResponse.json({
      success: true,
      debug: debugInfo
    });

  } catch (error) {
    console.error('❌ 챗봇 디버깅 실패:', error);
    debugInfo.errors.push(`디버깅 실패: ${error}`);
    debugInfo.overallStatus = {
      hasErrors: true,
      criticalServicesWorking: false,
      totalErrors: debugInfo.errors.length,
      processingTime: Date.now() - startTime
    };

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      debug: debugInfo
    }, { status: 500 });
  }
}
