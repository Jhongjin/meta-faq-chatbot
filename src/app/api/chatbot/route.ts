import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 검색 결과에 문서 메타데이터 추가 (임시 폴더와 동일한 방식)
async function enrichSearchResults(searchResults: any[]) {
  try {
    if (!searchResults || searchResults.length === 0) {
      return [];
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase 환경 변수가 설정되지 않음');
      return searchResults;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 고유한 문서 ID 추출
    const documentIds = [...new Set(searchResults.map(result => {
      const chunkId = result.id || result.chunk_id;
      return chunkId.split('_chunk_')[0]; // file_123_chunk_0 -> file_123
    }))];

    // 문서 메타데이터 조회
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, type, status, created_at, url')
      .in('id', documentIds);

    if (error) {
      console.error('문서 메타데이터 조회 오류:', error);
      return searchResults;
    }

    // 문서 메타데이터를 검색 결과에 매핑
    const documentMap = new Map(documents?.map(doc => [doc.id, doc]) || []);

    return searchResults.map(result => {
      const chunkId = result.id || result.chunk_id;
      const documentId = chunkId.split('_chunk_')[0];
      const document = documentMap.get(documentId);

      return {
        ...result,
        document: document || null,
        chunkIndex: parseInt(chunkId.split('_chunk_')[1]) || 0
      };
    });

  } catch (error) {
    console.error('검색 결과 보강 오류:', error);
    return searchResults;
  }
}

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

// GET 메서드 - API 상태 확인
export async function GET() {
  return NextResponse.json({
    success: true,
    message: '챗봇 API가 정상적으로 작동합니다.',
    timestamp: new Date().toISOString(),
    methods: ['GET', 'POST', 'OPTIONS'],
    version: 'chatbot-v1',
    endpoint: '/api/chatbot'
  }, {
    status: 200,
    headers,
  });
}

// POST 메서드 - 챗봇 응답
export async function POST(request: NextRequest) {
  console.log('🚀 Chatbot API POST 요청 시작');
  
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { message } = body;

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

    console.log(`💬 Chatbot API 메시지 수신: "${message}"`);

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔧 환경 변수 상태:', { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasSupabaseKey: !!supabaseKey
    });

    // Supabase 환경 변수 검증
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json({
        success: false,
        error: '서비스 설정 오류',
        details: '데이터베이스 연결 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.'
      }, {
        status: 500,
        headers,
      });
    }

    // RAG 서비스 동적 import 시도
    let response;
    try {
      const { ragSearchService } = await import('@/lib/services/RAGSearchService');
      console.log('🤖 RAG 서비스 호출');
      response = await ragSearchService.generateChatResponse(message.trim());
      
      // 검색 결과에 문서 메타데이터 추가 (임시 폴더와 동일한 방식)
      const enrichedSources = await enrichSearchResults(response.sources);
      response.sources = enrichedSources;
      
      console.log('✅ RAG 응답 완료');
    } catch (ragError) {
      console.error('❌ RAG 서비스 오류:', ragError);
      
      // Supabase 연결 오류인 경우 특별한 처리
      if (ragError instanceof Error && ragError.message.includes('Supabase')) {
        response = {
          answer: '죄송합니다. 현재 데이터베이스 연결 설정이 완료되지 않았습니다. 관리자에게 문의하시거나 잠시 후 다시 시도해주세요.\n\n임시로 Meta 광고 정책 관련 질문은 Meta 비즈니스 도움말 센터에서 확인하실 수 있습니다.',
          sources: [],
          confidence: 0.1,
          processingTime: 100,
          model: 'error',
          isLLMGenerated: false
        };
      } else {
        // 기타 오류에 대한 Fallback 응답
        response = {
          answer: '죄송합니다. 현재 AI 답변 생성 서비스가 일시적으로 중단되어 있습니다. Meta 광고 정책 관련 질문은 관리자에게 직접 문의하시거나, Meta 비즈니스 도움말 센터에서 확인해주세요.',
          sources: [],
          confidence: 0.3,
          processingTime: 100,
          model: 'fallback',
          isLLMGenerated: false
        };
      }
    }

    // 응답 구성
    console.log('📊 RAG 응답 데이터:', {
      answer: response.answer,
      sourcesCount: response.sources?.length || 0,
      sources: response.sources
    });

    const apiResponse = {
      success: true,
      response: {
        message: response.answer,
        sources: (response.sources || []).map(source => ({
          id: source.documentId || source.id || 'unknown',
          title: source.documentTitle || '제목 없음',
          excerpt: source.content?.substring(0, 200) + '...' || '내용 없음',
          url: source.documentUrl || null,
          updatedAt: new Date().toISOString().split('T')[0],
          similarity: Math.round((source.similarity || 0) * 100)
        })),
        confidence: Math.round((response.confidence || 0) * 100),
        processingTime: response.processingTime || 0,
        model: response.model || 'unknown',
        isLLMGenerated: response.isLLMGenerated || false
      }
    };

    console.log('📤 최종 API 응답:', {
      sourcesCount: apiResponse.response.sources.length,
      sources: apiResponse.response.sources
    });

    console.log('📤 Chatbot API 응답 전송');
    return NextResponse.json(apiResponse, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('❌ Chatbot API POST 요청 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '챗봇 응답 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, {
      status: 500,
      headers,
    });
  }
}
