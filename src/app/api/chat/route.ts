import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Gemini AI 초기화 (환경변수 확인)
console.log('🔑 환경변수 확인:');
console.log('- GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '설정됨' : '설정되지 않음');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '설정되지 않음');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '설정되지 않음');

// 환경변수 값 직접 출력 (디버깅용)
console.log('- GOOGLE_API_KEY 값:', process.env.GOOGLE_API_KEY?.substring(0, 10) + '...');
console.log('- NEXT_PUBLIC_SUPABASE_URL 값:', process.env.NEXT_PUBLIC_SUPABASE_URL);

const genAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

// Supabase 클라이언트 초기화 (환경변수 확인)
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  documentId: string;
  documentTitle: string;
  documentUrl?: string;
  chunkIndex: number;
  metadata?: any;
}

interface ChatResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
  processingTime: number;
  model: string;
}

/**
 * RAG 기반 문서 검색
 */
async function searchSimilarChunks(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 RAG 검색 시작: "${query}"`);
    
    // Supabase 클라이언트가 없으면 fallback 데이터 사용
    if (!supabase) {
      console.log('⚠️ Supabase 클라이언트가 설정되지 않음. Fallback 데이터 사용');
      return getFallbackSearchResults(query, limit);
    }

    // 실제 Supabase RAG 검색 실행
    console.log('📊 Supabase에서 통합 벡터 검색 실행 중...');
    
    // 1. 키워드 기반 검색 (벡터 검색 대신)
    console.log('🔍 키워드 기반 검색 실행 중...');
    
    const { data: chunksData, error: chunksError } = await supabase
      .from('document_chunks')
      .select('chunk_id, content, metadata, document_id, created_at')
      .or(`content.ilike.%${query}%,content.ilike.%${query.split(' ')[0]}%,content.ilike.%${query.split(' ')[1] || ''}%`)
      .limit(limit * 2)
      .order('created_at', { ascending: false });

    if (chunksError) {
      console.error('❌ 키워드 검색 오류:', chunksError);
      console.log('⚠️ Fallback 데이터로 전환');
      return getFallbackSearchResults(query, limit);
    }

    if (!chunksData || chunksData.length === 0) {
      console.log('⚠️ document_chunks 데이터가 없음. Fallback 데이터 사용');
      return getFallbackSearchResults(query, limit);
    }

    console.log(`📊 Supabase에서 ${chunksData.length}개 청크 조회됨`);
    console.log(`📋 청크 데이터:`, chunksData.map(c => ({ chunk_id: c.chunk_id, document_id: c.document_id })));

    // 2. documents 테이블에서 메타데이터 조회
    const documentIds = [...new Set(chunksData.map((chunk: any) => chunk.document_id))];
    console.log(`📋 조회할 문서 ID들: [${documentIds.join(', ')}]`);
    
    const { data: documentsData, error: documentsError } = await supabase
      .from('documents')
      .select('id, title, type, status, created_at, updated_at')
      .in('id', documentIds)
      .eq('status', 'completed');

    if (documentsError) {
      console.error('❌ documents 조회 오류:', documentsError);
      console.log('⚠️ Fallback 데이터로 전환');
      return getFallbackSearchResults(query, limit);
    }

    // 3. 데이터 조합
    const documentsMap = new Map();
    if (documentsData) {
      documentsData.forEach((doc: any) => {
        documentsMap.set(doc.id, doc);
        console.log(`📄 문서 정보: ID=${doc.id}, 제목="${doc.title}", 타입=${doc.type}`);
      });
    }

    const data = chunksData.map((chunk: any) => {
      const document = documentsMap.get(chunk.document_id);
      
      // 문서 타입 자동 감지 (URL이 있으면 url, 없으면 file)
      let documentType = 'file'; // 기본값
      if (document) {
        if (document.type === 'url') {
          documentType = 'url';
        } else if (document.type === 'file' || document.type === 'pdf' || document.type === 'docx' || document.type === 'txt') {
          documentType = 'file';
        }
      }
      
      return {
        ...chunk,
        documents: document ? {
          ...document,
          type: documentType
        } : { 
          id: chunk.document_id, 
          title: `문서 ${chunk.document_id}`, 
          type: documentType, 
          status: 'unknown',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          document_url: null
        }
      };
    });

    if (!data || data.length === 0) {
      console.log('⚠️ 검색 결과가 없음. Fallback 데이터 사용');
      return getFallbackSearchResults(query, limit);
    }

    console.log(`📊 실제 Supabase 데이터 사용: ${data.length}개 결과`);

    console.log(`📊 전체 검색 결과: ${data.length}개 (파일+URL 통합)`);
    
    // 2. 질문과 관련성 있는 결과 필터링 (개선된 로직)
    const queryKeywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
    console.log(`🔍 검색 키워드: [${queryKeywords.join(', ')}]`);
    
    // 키워드 매칭 점수로 정렬 (필터링 대신 점수 기반 정렬)
    const scoredData = data.map((item: any) => {
      const content = item.content?.toLowerCase() || '';
      const title = item.documents?.title?.toLowerCase() || '';
      const combinedText = `${content} ${title}`;

      // 키워드 매칭 점수 계산 (제목에 더 높은 가중치)
      const contentScore = queryKeywords.reduce((score, keyword) => {
        return score + (content.includes(keyword) ? 1 : 0);
      }, 0);
      
      const titleScore = queryKeywords.reduce((score, keyword) => {
        return score + (title.includes(keyword) ? 2 : 0);
      }, 0);
      
      const totalScore = contentScore + titleScore;
      
      console.log(`📝 문서 점수: ${item.chunk_id}, 내용: ${contentScore}, 제목: ${titleScore}, 총점: ${totalScore}`);
      
      return { ...item, score: totalScore };
    });
    
    // 점수 순으로 정렬하고 상위 결과만 선택
    const filteredData = scoredData
      .filter(item => item.score > 0) // 최소 1점 이상인 것만
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 3. 이미 점수로 정렬된 데이터 사용
    const sortedData = filteredData;

    console.log(`✅ 점수 기반 검색 결과: ${sortedData.length}개 (파일+URL 통합)`);
    
    if (sortedData.length === 0) {
      console.log('⚠️ 관련 문서를 찾을 수 없음. 연락처 옵션 표시');
    } else {
      console.log(`📊 상위 ${sortedData.length}개 문서 선택됨`);
    }

    // 필터링 결과가 없으면 빈 배열 반환 (연락처 옵션 표시)
    const finalData = sortedData;

    // 4. Supabase 결과를 SearchResult 형식으로 변환
    const searchResults: SearchResult[] = finalData.map((item: any, index: number) => {
      const document = item.documents;
      const isUrl = document?.type === 'url';
      
      console.log(`📝 SearchResult 변환: chunk_id=${item.chunk_id}, document_title="${document?.title}", document_type=${document?.type}`);
      
      // URL 생성 로직 개선
      let documentUrl = '';
      if (isUrl) {
        // URL 타입인 경우 document.id가 실제 URL
        documentUrl = document?.id || '';
      } else {
        // 파일 타입인 경우 metadata에서 document_url 찾기
        documentUrl = item.metadata?.document_url || item.metadata?.url || '';
        
        // URL이 없으면 실제 파일 다운로드 URL 생성
        if (!documentUrl) {
          // 실제 파일 다운로드를 위한 URL 생성 (document_id 사용)
          documentUrl = `/api/download/${document?.id || item.document_id}`;
        }
      }

      console.log(`🔗 URL 생성: isUrl=${isUrl}, documentUrl="${documentUrl}"`);
      console.log(`📄 문서 상세: type=${document?.type}, document_url=${document?.document_url}`);

      return {
        id: item.chunk_id || `supabase-${index}`,
        content: item.content || '',
        similarity: item.score ? item.score / 10 : 0.8, // 점수를 유사도로 변환
        documentId: document?.id || 'unknown',
        documentTitle: document?.title || 'Unknown Document',
        documentUrl: documentUrl,
        chunkIndex: item.metadata?.chunk_index || 0,
        metadata: {
          ...item.metadata,
          sourceType: isUrl ? 'url' : 'file',
          documentType: document?.type,
          createdAt: document?.created_at,
          updatedAt: document?.updated_at
        }
      };
    });

    return searchResults;

  } catch (error) {
    console.error('❌ RAG 검색 실패:', error);
    // 오류 발생 시 fallback 데이터 반환
    return getFallbackSearchResults(query, limit);
  }
}

/**
 * Fallback 검색 결과
 */
function getFallbackSearchResults(query: string, limit: number): SearchResult[] {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('광고') || lowerQuery.includes('정책')) {
    return [
      {
        id: 'fallback-1',
        content: 'Meta 광고 정책은 광고 콘텐츠의 품질과 안전성을 보장하기 위해 설계되었습니다. 모든 광고는 정확하고 진실된 정보를 포함해야 하며, 사용자에게 유익한 콘텐츠여야 합니다.',
        similarity: 0.8,
        documentId: 'meta-policy-2024',
        documentTitle: 'Meta 광고 정책 2024',
        documentUrl: 'https://www.facebook.com/policies/ads',
        chunkIndex: 0,
        metadata: { 
          type: 'policy',
          sourceType: 'url',
          documentType: 'url'
        }
      },
      {
        id: 'fallback-2',
        content: '금지된 콘텐츠에는 폭력, 성인 콘텐츠, 허위 정보, 차별적 내용 등이 포함됩니다. 이러한 콘텐츠는 광고에 사용할 수 없으며, 정책 위반 시 광고가 거부될 수 있습니다.',
        similarity: 0.7,
        documentId: 'meta-policy-2024',
        documentTitle: 'Meta 광고 정책 2024',
        documentUrl: 'https://www.facebook.com/policies/ads',
        chunkIndex: 1,
        metadata: { 
          type: 'policy',
          sourceType: 'url',
          documentType: 'url'
        }
      }
    ].slice(0, limit);
  }
  
  return [
    {
      id: 'fallback-default',
      content: 'Meta 광고에 대한 질문이군요. 현재 서비스가 일시적으로 제한되어 있어 기본 정보를 제공합니다. 더 자세한 정보는 Meta 비즈니스 도움말 센터를 참조하세요.',
      similarity: 0.5,
      documentId: 'general-info',
      documentTitle: 'Meta 광고 일반 정보',
      documentUrl: 'https://www.facebook.com/business/help',
      chunkIndex: 0,
      metadata: { type: 'general' }
    }
  ].slice(0, limit);
}

/**
 * Gemini를 사용한 스트림 답변 생성
 */
async function generateStreamAnswerWithGemini(
  query: string,
  searchResults: SearchResult[],
  controller: ReadableStreamDefaultController
): Promise<void> {
  try {
    console.log('🤖 Gemini 스트림 답변 생성 시작');
    console.log('- 질문:', query);
    console.log('- 검색 결과 수:', searchResults.length);
    
    // Gemini API가 설정되지 않은 경우 fallback 답변 생성
    if (!genAI) {
      console.log('⚠️ Gemini API가 설정되지 않음. Fallback 답변 생성');
      const fallbackAnswer = generateFallbackAnswer(query, searchResults);
      
      // Fallback 답변을 청크 단위로 전송
      const words = fallbackAnswer.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
        const streamResponse = {
          type: 'chunk',
          data: {
            content: chunk
          }
        };
        
        try {
          const chunkData = `data: ${JSON.stringify(streamResponse)}\n\n`;
          controller.enqueue(new TextEncoder().encode(chunkData));
        } catch (jsonError) {
          console.error('❌ Fallback JSON 직렬화 오류:', jsonError);
        }
        
        // 자연스러운 타이핑 효과를 위한 지연
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return;
    }
    
    console.log('✅ Gemini API 초기화 완료');

    // Gemini 2.5 Flash-Lite 모델 사용 (가성비 최적)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // 컨텍스트 구성
    const context = searchResults
      .map((result, index) => `[출처 ${index + 1}] ${result.content}`)
      .join('\n\n');

    const prompt = `당신은 Meta 광고 전문가입니다. 다음 문서를 참고하여 사용자의 질문에 정확하고 도움이 되는 답변을 한국어로 제공하세요.

문서 내용:
${context}

질문: ${query}

**중요한 답변 규칙:**
1. **절대 할루시네이션 금지**: 제공된 문서에 없는 정보는 절대 생성하지 마세요
2. **문서 기반 답변만**: 반드시 제공된 문서 내용만을 바탕으로 답변하세요
3. **모른다고 솔직히 말하기**: 문서에 답변이 없으면 "제공된 문서에서 해당 정보를 찾을 수 없습니다"라고 말하세요
4. **추측 금지**: 확실하지 않은 정보는 추측하지 마세요
5. **문서 인용**: 답변할 때 관련 문서를 명시하세요
6. **한국어 답변**: 명확하고 이해하기 쉽게 한국어로 답변하세요

답변:`;

    console.log('📝 Gemini API 호출 시작');
    const result = await model.generateContentStream(prompt);
    console.log('✅ Gemini API 응답 완료');

    let fullAnswer = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullAnswer += chunkText;
        
        // 스트림 데이터 전송 (안전한 JSON 직렬화)
        const streamResponse = {
          type: 'chunk',
          data: {
            content: chunkText
          }
        };
        
        try {
          const chunkData = `data: ${JSON.stringify(streamResponse)}\n\n`;
          controller.enqueue(new TextEncoder().encode(chunkData));
        } catch (jsonError) {
          console.error('❌ JSON 직렬화 오류:', jsonError);
          // JSON 직렬화 실패 시 텍스트만 전송
          const fallbackData = `data: ${JSON.stringify({ type: 'chunk', data: { content: chunkText } })}\n\n`;
          controller.enqueue(new TextEncoder().encode(fallbackData));
        }
      }
    }

    console.log(`✅ 스트림 답변 생성 완료: ${fullAnswer.length}자`);
  } catch (error) {
    console.error('❌ Gemini 스트림 답변 생성 실패:', error);
    throw error;
  }
}

/**
 * Gemini를 사용한 답변 생성
 */
async function generateAnswerWithGemini(
  query: string,
  searchResults: SearchResult[]
): Promise<string> {
  try {
    console.log('🤖 Gemini 답변 생성 시작');
    console.log('- 질문:', query);
    console.log('- 검색 결과 수:', searchResults.length);
    
    // Gemini API가 설정되지 않은 경우 fallback 답변 생성
    if (!genAI) {
      console.log('⚠️ Gemini API가 설정되지 않음. Fallback 답변 생성');
      return generateFallbackAnswer(query, searchResults);
    }
    
    console.log('✅ Gemini API 초기화 완료');

    // Gemini 2.5 Flash-Lite 모델 사용 (가성비 최적)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // 컨텍스트 구성
    const context = searchResults
      .map((result, index) => `[출처 ${index + 1}] ${result.content}`)
      .join('\n\n');

    const prompt = `당신은 Meta 광고 전문가입니다. 다음 문서를 참고하여 사용자의 질문에 정확하고 도움이 되는 답변을 한국어로 제공하세요.

문서 내용:
${context}

질문: ${query}

**중요한 답변 규칙:**
1. **절대 할루시네이션 금지**: 제공된 문서에 없는 정보는 절대 생성하지 마세요
2. **문서 기반 답변만**: 반드시 제공된 문서 내용만을 바탕으로 답변하세요
3. **모른다고 솔직히 말하기**: 문서에 답변이 없으면 "제공된 문서에서 해당 정보를 찾을 수 없습니다"라고 말하세요
4. **추측 금지**: 확실하지 않은 정보는 추측하지 마세요
5. **문서 인용**: 답변할 때 관련 문서를 명시하세요
6. **한국어 답변**: 명확하고 이해하기 쉽게 한국어로 답변하세요

답변:`;

    console.log('📝 Gemini API 호출 시작');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const answer = response.text();
    console.log('✅ Gemini API 응답 완료');
    console.log('- 답변 길이:', answer.length);
    console.log('- 답변 미리보기:', answer.substring(0, 100) + '...');
    
    return answer;
    
  } catch (error) {
    console.error('Gemini API 오류:', error);
    
    // 할당량 초과 오류인 경우 특별 처리
    if (error instanceof Error && error.message && error.message.includes('429')) {
      console.log('⚠️ Gemini API 할당량 초과 (429 오류). Fallback 답변 생성');
      return generateFallbackAnswer(query, searchResults);
    }
    
    // 404 모델 오류인 경우
    if (error instanceof Error && error.message && error.message.includes('404')) {
      console.log('⚠️ Gemini API 모델을 찾을 수 없음 (404 오류). Fallback 답변 생성');
      return generateFallbackAnswer(query, searchResults);
    }
    
    // 기타 Gemini API 오류 시 fallback 답변 생성
    return generateFallbackAnswer(query, searchResults);
  }
}

/**
 * Fallback 답변 생성
 */
function generateFallbackAnswer(query: string, searchResults: SearchResult[]): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('광고') && lowerQuery.includes('정책')) {
    return `**Meta 광고 정책 안내**

Meta 광고 정책에 대한 질문이군요. 현재 AI 답변 생성 서비스가 일시적으로 중단되어 있어, 기본 정보를 제공해드립니다.

**주요 광고 정책:**
- 광고는 정확하고 진실된 정보를 포함해야 합니다
- 금지된 콘텐츠(폭력, 성인 콘텐츠, 허위 정보 등)는 광고에 사용할 수 없습니다
- 개인정보 보호 및 데이터 사용에 대한 정책을 준수해야 합니다

**검색된 관련 정보:**
${searchResults.map((result, index) => `${index + 1}. ${result.content.substring(0, 200)}...`).join('\n')}

**더 자세한 정보:**
- Meta 비즈니스 도움말 센터: https://www.facebook.com/business/help
- 광고 정책 센터: https://www.facebook.com/policies/ads

*참고: 현재 Gemini API가 설정되지 않아 기본 답변을 제공하고 있습니다. GOOGLE_API_KEY를 설정해주세요.*`;
  }
  
  if (lowerQuery.includes('facebook') || lowerQuery.includes('instagram')) {
    return `**Facebook/Instagram 광고 안내**

Facebook이나 Instagram 관련 질문이군요. 현재 AI 답변 생성 서비스가 일시적으로 중단되어 있어, 기본 정보를 제공해드립니다.

**주요 플랫폼 특징:**
- Facebook: 광범위한 타겟팅 옵션과 다양한 광고 형식
- Instagram: 시각적 콘텐츠 중심의 광고와 스토리 광고
- 두 플랫폼 모두 Meta 광고 관리자에서 통합 관리 가능

**검색된 관련 정보:**
${searchResults.map((result, index) => `${index + 1}. ${result.content.substring(0, 200)}...`).join('\n')}

**더 자세한 정보:**
- Meta 비즈니스 도움말 센터에서 최신 정보를 확인하시거나, 관리자에게 문의해주세요.

*참고: 현재 Gemini API가 설정되지 않아 기본 답변을 제공하고 있습니다. GOOGLE_API_KEY를 설정해주세요.*`;
  }
  
  return `**Meta 광고 FAQ 안내**

검색된 정보에 따르면:

${searchResults[0]?.content.substring(0, 500) || 'Meta 광고에 대한 질문이군요. 현재 서비스가 일시적으로 제한되어 있어 기본 정보를 제공합니다.'}

**추가 정보:**
- Meta 비즈니스 도움말: https://www.facebook.com/business/help
- 광고 정책: https://www.facebook.com/policies/ads
- 광고 관리자: https://business.facebook.com

이 정보가 도움이 되었나요? 더 자세한 내용이 필요하시면 다른 질문을 해주세요.

*참고: 현재 Gemini API가 설정되지 않아 기본 답변을 제공하고 있습니다. GOOGLE_API_KEY를 설정해주세요.*`;
}

/**
 * 신뢰도 계산
 */
function calculateConfidence(searchResults: SearchResult[]): number {
  if (searchResults.length === 0) return 0;
  
  const topSimilarity = searchResults[0].similarity;
  
  if (topSimilarity >= 0.9) return 0.95;
  if (topSimilarity >= 0.8) return 0.85;
  if (topSimilarity >= 0.7) return 0.75;
  if (topSimilarity >= 0.6) return 0.65;
  
  return 0.3;
}

/**
 * POST /api/chat
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // API 핸들러 내에서 환경변수 재확인
  console.log('🔍 API 핸들러 내 환경변수 확인:');
  console.log('- GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '설정됨' : '설정되지 않음');
  console.log('- GOOGLE_API_KEY 값:', process.env.GOOGLE_API_KEY?.substring(0, 10) + '...');
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
    console.log('🔧 환경변수 상태:');
    console.log('- GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ 설정됨' : '❌ 미설정');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 미설정');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 미설정');

    console.log(`🚀 RAG 챗봇 응답 생성 시작: "${message}"`);

    // 1. RAG 검색 (출처 수 제한)
    const searchResults = await searchSimilarChunks(message, 3);
    console.log(`📊 검색 결과: ${searchResults.length}개`);

    // 2. 검색 결과가 없으면 관련 내용 없음 응답
    if (searchResults.length === 0) {
      console.log('⚠️ RAG 검색 결과가 없음. 관련 내용 없음 응답');
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
        model: 'no-data'
      });
    }

    // 3. 일반 JSON 응답 생성
    console.log('🚀 일반 JSON 답변 생성 시작');
    
    // 신뢰도 계산
    const confidence = calculateConfidence(searchResults);
    
    // 처리 시간 계산
    const processingTime = Date.now() - startTime;

    // 출처 정보 생성
    const sources = searchResults.map(result => {
      console.log(`📚 출처 정보: 제목="${result.documentTitle}", URL="${result.documentUrl}", 유사도=${result.similarity}`);
      return {
        id: result.id,
        title: result.documentTitle,
        url: result.documentUrl,
        updatedAt: result.metadata?.updatedAt || new Date().toISOString(),
        excerpt: result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''),
        similarity: result.similarity,
        sourceType: result.metadata?.sourceType,
        documentType: result.metadata?.documentType
      };
    });

    // Gemini 답변 생성
    const answer = await generateAnswerWithGemini(message, searchResults);
    
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
      model: 'gemini-2.5-flash-lite'
    });

  } catch (error) {
    console.error('❌ RAG 응답 생성 실패:', error);
    console.error('❌ 에러 상세:', JSON.stringify(error, null, 2));
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      response: {
        message: '죄송합니다. 현재 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        content: '죄송합니다. 현재 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        sources: []
      },
      confidence: 0,
      processingTime,
      model: 'error'
    }, { status: 500 });
  }
}
