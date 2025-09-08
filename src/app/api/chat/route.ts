import { NextRequest, NextResponse } from 'next/server';
import { ragSearchService } from '@/lib/services/RAGSearchService';

export async function POST(request: NextRequest) {
  console.log('🚀 챗봇 API 요청 시작');
  
  try {
    // 요청 본문 파싱
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('📝 요청 본문 파싱 성공:', { hasMessage: !!requestBody.message });
    } catch (parseError) {
      console.error('❌ 요청 본문 파싱 실패:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: '잘못된 요청 형식입니다.',
          details: 'JSON 형식이 올바르지 않습니다.'
        },
        { status: 400 }
      );
    }

    const { message } = requestBody;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.log('❌ 메시지 검증 실패:', { message, type: typeof message });
      return NextResponse.json(
        { 
          success: false,
          error: '메시지가 필요합니다.',
          details: '유효한 메시지를 입력해주세요.'
        },
        { status: 400 }
      );
    }

    console.log(`💬 챗봇 API 요청: "${message}"`);

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('🔧 환경 변수 상태:', { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlLength: supabaseUrl?.length || 0,
      supabaseKeyLength: supabaseKey?.length || 0
    });

    // RAG 기반 답변 생성
    console.log('🤖 RAG 서비스 호출 시작');
    const response = await ragSearchService.generateChatResponse(message.trim());
    console.log(`✅ 챗봇 응답 완료: ${response.processingTime}ms, 신뢰도: ${response.confidence}`);

    const apiResponse = {
      success: true,
      response: {
        message: response.answer,
        sources: response.sources.map(source => ({
          title: source.documentTitle,
          content: source.content.substring(0, 200) + '...',
          similarity: Math.round(source.similarity * 100),
          url: source.documentUrl
        })),
        confidence: Math.round(response.confidence * 100),
        processingTime: response.processingTime,
        model: response.model,
        isLLMGenerated: response.isLLMGenerated
      }
    };

    console.log('📤 API 응답 준비 완료:', { 
      success: apiResponse.success,
      messageLength: apiResponse.response.message.length,
      sourcesCount: apiResponse.response.sources.length
    });

    return NextResponse.json(apiResponse);

  } catch (error) {
    console.error('❌ 챗봇 API 오류:', error);
    console.error('❌ 오류 스택:', error instanceof Error ? error.stack : 'No stack trace');
    
    // 환경 변수 관련 오류인 경우 특별 처리
    if (error instanceof Error && error.message.includes('환경변수')) {
      console.log('🔧 환경 변수 오류 감지');
      return NextResponse.json(
        { 
          success: false,
          error: '서비스 설정 오류',
          details: '데이터베이스 연결 설정이 올바르지 않습니다. 관리자에게 문의해주세요.'
        },
        { status: 500 }
      );
    }
    
    // LLM 연결 오류인 경우 fallback 응답
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('connection'))) {
      console.log('🌐 네트워크 오류 감지');
      return NextResponse.json(
        { 
          success: false,
          error: 'AI 서비스 일시 중단',
          details: 'AI 답변 생성 서비스가 일시적으로 중단되었습니다. 잠시 후 다시 시도해주세요.'
        },
        { status: 503 }
      );
    }
    
    console.log('⚠️ 일반 오류 처리');
    return NextResponse.json(
      { 
        success: false,
        error: '챗봇 응답 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 검색 통계 조회
    const stats = await ragSearchService.getSearchStats();
    
    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('챗봇 통계 조회 오류:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '통계 조회 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}