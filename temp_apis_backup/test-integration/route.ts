import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const testResults = {
    timestamp: new Date().toISOString(),
    overallStatus: 'unknown',
    tests: [] as any[],
    totalTime: 0
  };

  try {
    console.log('🧪 통합 테스트 시작...');

    // 1. 환경 변수 테스트
    const envTest = await testEnvironmentVariables();
    testResults.tests.push(envTest);

    // 2. Supabase 연결 테스트
    const dbTest = await testDatabaseConnection();
    testResults.tests.push(dbTest);

    // 3. 임베딩 서비스 테스트
    const embeddingTest = await testEmbeddingService();
    testResults.tests.push(embeddingTest);

    // 4. Gemini 서비스 테스트
    const geminiTest = await testGeminiService();
    testResults.tests.push(geminiTest);

    // 5. RAG 통합 테스트
    const ragTest = await testRAGIntegration();
    testResults.tests.push(ragTest);

    // 전체 상태 결정
    const failedTests = testResults.tests.filter(test => test.status === 'failed');
    testResults.overallStatus = failedTests.length === 0 ? 'success' : 'failed';
    testResults.totalTime = Date.now() - startTime;

    console.log(`✅ 통합 테스트 완료: ${testResults.overallStatus} (${testResults.totalTime}ms)`);

    return NextResponse.json({
      success: true,
      results: testResults
    });

  } catch (error) {
    console.error('❌ 통합 테스트 실패:', error);
    testResults.overallStatus = 'error';
    testResults.totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      results: testResults
    }, { status: 500 });
  }
}

async function testEnvironmentVariables() {
  const startTime = Date.now();
  
  try {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GOOGLE_API_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    return {
      name: 'Environment Variables',
      status: missingVars.length === 0 ? 'success' : 'failed',
      duration: Date.now() - startTime,
      details: {
        required: requiredVars,
        missing: missingVars,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasGoogleApiKey: !!process.env.GOOGLE_API_KEY
      }
    };
  } catch (error) {
    return {
      name: 'Environment Variables',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testDatabaseConnection() {
  const startTime = Date.now();
  
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
      .select('id')
      .limit(1);

    if (error) {
      throw new Error(`데이터베이스 쿼리 실패: ${error.message}`);
    }

    return {
      name: 'Database Connection',
      status: 'success',
      duration: Date.now() - startTime,
      details: {
        connected: true,
        documentsCount: data?.length || 0
      }
    };
  } catch (error) {
    return {
      name: 'Database Connection',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testEmbeddingService() {
  const startTime = Date.now();
  
  try {
    const { EmbeddingService } = await import('@/lib/services/EmbeddingService');
    
    const embeddingService = new EmbeddingService();
    const testText = "테스트 텍스트입니다.";
    
    const result = await embeddingService.generateEmbedding(testText);
    
    return {
      name: 'Embedding Service',
      status: 'success',
      duration: Date.now() - startTime,
      details: {
        model: result.model,
        dimension: result.dimension,
        processingTime: result.processingTime,
        isDummy: result.model === 'dummy'
      }
    };
  } catch (error) {
    return {
      name: 'Embedding Service',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testGeminiService() {
  const startTime = Date.now();
  
  try {
    const { geminiService } = await import('@/lib/services/GeminiService');
    
    const isAvailable = await geminiService.checkGeminiStatus();
    
    if (!isAvailable) {
      return {
        name: 'Gemini Service',
        status: 'warning',
        duration: Date.now() - startTime,
        details: {
          available: false,
          reason: 'API 키가 설정되지 않았거나 서비스에 접근할 수 없습니다.'
        }
      };
    }

    // 간단한 테스트 요청
    const response = await geminiService.generateAnswer("안녕하세요", {
      temperature: 0.1,
      maxTokens: 50
    });

    return {
      name: 'Gemini Service',
      status: 'success',
      duration: Date.now() - startTime,
      details: {
        available: true,
        model: response.model,
        processingTime: response.processingTime,
        confidence: response.confidence
      }
    };
  } catch (error) {
    return {
      name: 'Gemini Service',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testRAGIntegration() {
  const startTime = Date.now();
  
  try {
    const { getRAGSearchService } = await import('@/lib/services/RAGSearchService');
    
    const ragService = getRAGSearchService();
    const testQuery = "메타 광고 정책";
    
    const response = await ragService.generateChatResponse(testQuery);
    
    return {
      name: 'RAG Integration',
      status: 'success',
      duration: Date.now() - startTime,
      details: {
        query: testQuery,
        answerLength: response.answer.length,
        sourcesCount: response.sources.length,
        confidence: response.confidence,
        model: response.model,
        isLLMGenerated: response.isLLMGenerated,
        processingTime: response.processingTime
      }
    };
  } catch (error) {
    return {
      name: 'RAG Integration',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
