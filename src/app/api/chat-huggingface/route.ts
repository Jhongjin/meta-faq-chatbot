import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RAGSearchService } from '@/lib/services/RAGSearchService';

// Hugging Face + Vercel 전용 시스템
console.log('🔑 Hugging Face 환경변수 확인:');
console.log('- HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? '설정됨' : '설정되지 않음');

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

/**
 * Hugging Face를 통한 답변 생성
 */
async function generateAnswerWithHuggingFace(
  message: string, 
  searchResults: SearchResult[]
): Promise<string> {
  try {
    console.log('🤖 Hugging Face 답변 생성 시작');
    
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY가 설정되지 않았습니다');
    }
    
    // 검색 결과를 컨텍스트로 변환
    const context = searchResults.map(result => 
      `[${result.metadata?.title || '문서'}]: ${result.content.substring(0, 300)}`
    ).join('\n');
    
    // 프롬프트 구성
    const prompt = `다음은 Meta 광고 정책과 관련된 문서들입니다. 사용자의 질문에 대해 이 정보를 바탕으로 정확하고 도움이 되는 답변을 한국어로 제공해주세요.

사용자 질문: ${message}

관련 문서 정보:
${context}

답변:`;

    // Hugging Face API 호출
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 500,
          temperature: 0.7,
          do_sample: true
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hugging Face API 오류:', errorText);
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Hugging Face 답변 생성 완료');
    
    return data[0]?.generated_text?.trim() || '답변을 생성할 수 없습니다.';

  } catch (error) {
    console.error('❌ Hugging Face 답변 생성 실패:', error);
    
    // Fallback 답변 생성
    if (searchResults.length > 0) {
      const topResult = searchResults[0];
      return `**Meta 광고 정책 안내**

${topResult.content.substring(0, 400)}${topResult.content.length > 400 ? '...' : ''}

**검색된 관련 정보:**
${searchResults.map((result, index) => `${index + 1}. ${result.metadata?.title || '문서'}: ${result.content.substring(0, 100)}...`).join('\n')}

**더 자세한 정보:**
- Meta 비즈니스 도움말 센터: https://www.facebook.com/business/help
- 광고 정책 센터: https://www.facebook.com/policies/ads

관리자에게 문의하시면 더 구체적인 답변을 받으실 수 있습니다.`;
    }
    
    return '죄송합니다. 현재 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
}

/**
 * Hugging Face RAG 검색
 */
async function searchWithHuggingFaceRAG(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Hugging Face RAG 검색 시작: "${query}"`);
    
    if (!supabase) {
      console.warn('⚠️ Supabase 클라이언트가 없음. Fallback 데이터 사용');
      return getFallbackSearchResults(query, limit);
    }

    // RAGSearchService 사용
    const ragService = new RAGSearchService();
    const searchResults = await ragService.searchSimilarChunks(query, limit);
    
    console.log(`📊 Hugging Face RAG 검색 결과: ${searchResults.length}개`);
    
    return searchResults.map(result => ({
      chunk_id: result.id,
      content: result.content,
      similarity: result.similarity,
      metadata: result.metadata
    }));
    
  } catch (error) {
    console.error('❌ Hugging Face RAG 검색 실패:', error);
    return getFallbackSearchResults(query, limit);
  }
}

/**
 * Fallback 검색 결과
 */
function getFallbackSearchResults(query: string, limit: number): SearchResult[] {
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
 * Hugging Face + Vercel 전용 Chat API
 * POST /api/chat-huggingface
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const requestBody = await request.json();
    const { message, conversationHistory } = requestBody;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🚀 Hugging Face RAG 챗봇 응답 생성 시작: "${message}"`);

    // 1. Hugging Face RAG 검색
    const searchResults = await searchWithHuggingFaceRAG(message, 3);
    console.log(`📊 Hugging Face 검색 결과: ${searchResults.length}개`);

    // 2. 검색 결과가 없으면 관련 내용 없음 응답
    if (searchResults.length === 0) {
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
        model: 'huggingface-no-data'
      });
    }

    // 3. Hugging Face 답변 생성
    console.log('🚀 Hugging Face 답변 생성 시작');
    
    const confidence = calculateConfidence(searchResults);
    const processingTime = Date.now() - startTime;

    // 출처 정보 생성
    const sources = searchResults.map(result => ({
      id: result.chunk_id,
      title: result.metadata?.title || 'Meta 광고 정책 문서',
      url: result.metadata?.url || '',
      updatedAt: result.metadata?.updatedAt || new Date().toISOString(),
      excerpt: result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''),
      similarity: result.similarity,
      sourceType: result.metadata?.type || 'document',
      documentType: result.metadata?.documentType || 'policy'
    }));

    // Hugging Face 답변 생성
    const answer = await generateAnswerWithHuggingFace(message, searchResults);
    
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
      model: 'huggingface-dialogpt'
    });

  } catch (error) {
    console.error('❌ Hugging Face RAG 응답 생성 실패:', error);
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      response: {
        message: '죄송합니다. 현재 Hugging Face 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        content: '죄송합니다. 현재 Hugging Face 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        sources: [],
        noDataFound: true,
        showContactOption: true
      },
      confidence: 0,
      processingTime,
      model: 'huggingface-error'
    }, { status: 500 });
  }
}
