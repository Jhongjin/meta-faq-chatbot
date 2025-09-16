import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RAGSearchService } from '@/lib/services/RAGSearchService';
import { generateResponse } from '@/lib/services/ollama';

// Vultr+Ollama 전용 시스템 초기화
console.log('🔑 Vultr+Ollama 환경변수 확인:');
console.log('- OLLAMA_BASE_URL:', process.env.OLLAMA_BASE_URL ? '설정됨' : '설정되지 않음');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '설정되지 않음');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '설정되지 않음');

// 환경변수 값 직접 출력 (디버깅용)
console.log('- OLLAMA_BASE_URL 값:', process.env.OLLAMA_BASE_URL);
console.log('- NEXT_PUBLIC_SUPABASE_URL 값:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Supabase 클라이언트 초기화
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

interface SearchResult {
  chunk_id: string;
  content: string;
  similarity: number;
  metadata: any;
}

interface ChatResponse {
  answer: string;
  sources: any[];
  confidence: number;
  processingTime: number;
  model: string;
}

/**
 * Vultr+Ollama 전용 RAG 검색
 */
async function searchWithOllamaRAG(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Vultr+Ollama RAG 검색 시작: "${query}"`);
    
    if (!supabase) {
      console.warn('⚠️ Supabase 클라이언트가 없음. Fallback 데이터 사용');
      return getFallbackSearchResults(query, limit);
    }

    // RAGSearchService 사용 (Ollama 전용)
    const ragService = new RAGSearchService();
    const searchResults = await ragService.searchSimilarChunks(query, limit);
    
    console.log(`📊 Vultr+Ollama RAG 검색 결과: ${searchResults.length}개`);
    
    return searchResults.map(result => ({
      chunk_id: result.id,
      content: result.content,
      similarity: result.similarity,
      metadata: result.metadata
    }));
    
  } catch (error) {
    console.error('❌ Vultr+Ollama RAG 검색 실패:', error);
    return getFallbackSearchResults(query, limit);
  }
}

/**
 * Fallback 검색 결과 (RAG 실패 시)
 */
function getFallbackSearchResults(query: string, limit: number): SearchResult[] {
  console.log('⚠️ Vultr+Ollama RAG 실패. Fallback 데이터 사용');
  
  return [
    {
      chunk_id: 'fallback-1',
      content: 'Meta 광고 정책에 대한 기본 정보입니다. 더 자세한 내용은 관리자에게 문의해주세요.',
      similarity: 0.5,
      metadata: {
        title: 'Meta 광고 정책 기본 정보',
        type: 'fallback'
      }
    }
  ];
}

/**
 * 신뢰도 계산
 */
function calculateConfidence(searchResults: SearchResult[]): number {
  if (searchResults.length === 0) return 0;
  
  const avgSimilarity = searchResults.reduce((sum, result) => sum + result.similarity, 0) / searchResults.length;
  return Math.min(avgSimilarity * 100, 100);
}


/**
 * Vultr+Ollama 전용 Chat API
 * POST /api/chat-ollama
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // API 핸들러 내에서 환경변수 재확인
  console.log('🔍 Vultr+Ollama API 핸들러 내 환경변수 확인:');
  console.log('- OLLAMA_BASE_URL:', process.env.OLLAMA_BASE_URL ? '설정됨' : '설정되지 않음');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '설정되지 않음');
  
  try {
    // JSON 파싱 오류 방지
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('❌ JSON 파싱 오류:', parseError);
      return NextResponse.json(
        { error: '잘못된 JSON 형식입니다.' },
        { status: 400 }
      );
    }
    
    const { message, conversationHistory } = requestBody;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    // 환경변수 상태 확인
    console.log('🔧 Vultr+Ollama 환경변수 상태:');
    console.log('- OLLAMA_BASE_URL:', process.env.OLLAMA_BASE_URL ? '✅ 설정됨' : '❌ 미설정');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 미설정');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 미설정');

    console.log(`🚀 Vultr+Ollama RAG 챗봇 응답 생성 시작: "${message}"`);

    // 1. Vultr+Ollama RAG 검색
    const searchResults = await searchWithOllamaRAG(message, 3);
    console.log(`📊 Vultr+Ollama 검색 결과: ${searchResults.length}개`);

    // 2. 검색 결과가 없으면 관련 내용 없음 응답
    if (searchResults.length === 0) {
      console.log('⚠️ Vultr+Ollama RAG 검색 결과가 없음. 관련 내용 없음 응답');
      return NextResponse.json({
        response: {
          message: "죄송합니다. 현재 제공된 문서에서 관련 정보를 찾을 수 없습니다. 더 구체적인 질문을 해주시거나 다른 키워드로 시도해보세요.",
          content: "죄송합니다. 현재 제공된 문서에서 관련 정보를 찾을 수 없습니다. 더 구체적인 질문을 해주시거나 다른 키워드로 시도해보세요.",
          sources: [],
          noDataFound: true,
          showContactOption: true
        },
        confidence: 0,
        processingTime: Date.now() - startTime,
        model: 'vultr-ollama-no-data'
      });
    }

    // 3. RAGSearchService를 사용한 답변 생성
    console.log('🚀 RAGSearchService를 사용한 답변 생성 시작');
    
    const ragService = new RAGSearchService();
    const answer = await ragService.generateAnswer(message, searchResults);
    
    // 신뢰도 계산
    const confidence = calculateConfidence(searchResults);
    
    // 처리 시간 계산
    const processingTime = Date.now() - startTime;

    // 출처 정보 생성
    const sources = searchResults.map(result => {
      console.log(`📚 Vultr+Ollama 출처 정보: 제목="${result.metadata?.title || '문서'}", 유사도=${result.similarity}`);
      return {
        id: result.chunk_id,
        title: result.metadata?.title || 'Meta 광고 정책 문서',
        url: result.metadata?.url || '',
        updatedAt: result.metadata?.updatedAt || new Date().toISOString(),
        excerpt: result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''),
        similarity: result.similarity,
        sourceType: result.metadata?.type || 'document',
        documentType: result.metadata?.documentType || 'policy'
      };
    });
    
    return NextResponse.json({
      response: {
        message: answer,
        content: answer,
        sources,
        noDataFound: false,
        showContactOption: false
      },
      confidence,
      processingTime,
      model: 'vultr-ollama-tinyllama'
    });

  } catch (error) {
    console.error('❌ Vultr+Ollama RAG 응답 생성 실패:', error);
    
    // 에러 상세 정보 로깅
    if (error instanceof Error) {
      console.error('❌ 에러 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error('❌ 에러 상세:', JSON.stringify(error, null, 2));
    }
    
    const processingTime = Date.now() - startTime;
    
    // 에러 타입별 응답
    let errorMessage = '죄송합니다. 현재 Vultr+Ollama 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
    
    if (error instanceof Error) {
      if (error.message.includes('타임아웃')) {
        errorMessage = '죄송합니다. 서버 응답이 너무 느려서 타임아웃이 발생했습니다. 더 간단한 질문으로 다시 시도해주세요.';
      } else if (error.message.includes('연결할 수 없습니다')) {
        errorMessage = '죄송합니다. Ollama 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.';
      }
    }
    
    return NextResponse.json({
      response: {
        message: errorMessage,
        content: errorMessage,
        sources: [],
        noDataFound: true,
        showContactOption: true
      },
      confidence: 0,
      processingTime,
      model: 'vultr-ollama-error'
    }, { status: 500 });
  }
}
