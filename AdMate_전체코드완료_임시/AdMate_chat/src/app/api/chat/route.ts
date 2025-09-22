import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';

// 환경 변수에서 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// 빌드 시에는 환경 변수가 없을 수 있으므로 조건부 처리
let supabase: any = null;
let embeddings: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

if (openaiApiKey) {
  embeddings = new OpenAIEmbeddings({
    openAIApiKey: openaiApiKey,
    modelName: 'text-embedding-3-small',
    dimensions: 1536,
  });
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{
    id: string;
    title: string;
    url?: string;
    updatedAt: string;
    excerpt: string;
  }>;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  userId?: string;
}

// 채팅 API 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationHistory = [], userId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    // 환경 변수 체크 - 없으면 데모 응답 제공
    if (!supabase || !embeddings) {
      console.warn('환경 변수가 설정되지 않음. 데모 응답을 제공합니다.');
      
      const demoResponse: ChatMessage = {
        role: 'assistant',
        content: generateDemoResponse(message),
        timestamp: new Date().toISOString(),
        sources: generateDemoSources()
      };

      return NextResponse.json({
        success: true,
        response: demoResponse,
        searchResults: []
      });
    }

    // 검색 쿼리를 임베딩 벡터로 변환
    const queryEmbedding = await embeddings.embedQuery(message);

    // Supabase에서 벡터 유사도 검색 실행
    const { data: searchResults, error: searchError } = await supabase.rpc('search_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5
    });

    if (searchError) {
      console.error('벡터 검색 오류:', searchError);
      return NextResponse.json(
        { 
          error: '검색 중 오류가 발생했습니다.',
          message: '관련 문서를 찾는 중 문제가 발생했습니다. 다시 시도해주세요.'
        },
        { status: 500 }
      );
    }

    // 검색 결과에 문서 메타데이터 추가
    const enrichedResults = await enrichSearchResults(searchResults);

    // AI 응답 생성 (실제 LLM 연동 전까지는 규칙 기반 응답)
    const aiResponse = generateAIResponse(message, enrichedResults, conversationHistory);

    // 대화 로그 저장은 클라이언트에서 "새 대화" 버튼 클릭 시에만 수행
    // 자동 저장을 제거하여 중복 저장 방지

    const response: ChatMessage = {
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date().toISOString(),
      sources: enrichedResults.map(result => ({
        id: result.chunk_id,
        title: result.document?.title || '문서',
        url: result.document?.url,
        updatedAt: result.document?.created_at ? new Date(result.document.created_at).toLocaleDateString('ko-KR') : '날짜 미상',
        excerpt: result.content.substring(0, 200) + '...'
      }))
    };

    return NextResponse.json({
      success: true,
      response,
      searchResults: enrichedResults
    });

  } catch (error) {
    console.error('채팅 API 오류:', error);
    return NextResponse.json(
      { 
        error: '채팅 처리 중 오류가 발생했습니다.',
        message: 'AI 챗봇과의 대화 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      },
      { status: 500 }
    );
  }
}

// 검색 결과에 문서 메타데이터 추가
async function enrichSearchResults(searchResults: any[]) {
  try {
    if (!searchResults || searchResults.length === 0) {
      return [];
    }

    // 고유한 문서 ID 추출
    const documentIds = [...new Set(searchResults.map(result => {
      const chunkId = result.chunk_id;
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
      const chunkId = result.chunk_id;
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

// AI 응답 생성 (실제 LLM 연동 전까지는 규칙 기반)
function generateAIResponse(message: string, searchResults: any[], conversationHistory: ChatMessage[]): { content: string } {
  const lowerMessage = message.toLowerCase();
  
  // 검색 결과가 있는 경우
  if (searchResults && searchResults.length > 0) {
    const topResult = searchResults[0];
    const documentTitle = topResult.document?.title || '관련 문서';
    
    // 메시지 유형에 따른 응답 생성
    if (lowerMessage.includes('정책') || lowerMessage.includes('policy')) {
      return {
        content: `네, 메타 광고 정책에 대해 답변드리겠습니다.\n\n${topResult.content}\n\n위 내용은 "${documentTitle}"에서 참조한 최신 정책 정보입니다. 추가로 궁금한 점이 있으시면 언제든지 질문해주세요.`
      };
    } else if (lowerMessage.includes('설정') || lowerMessage.includes('방법') || lowerMessage.includes('어떻게')) {
      return {
        content: `설정 방법에 대해 안내드리겠습니다.\n\n${topResult.content}\n\n이 가이드는 "${documentTitle}"에서 제공하는 공식 설정 방법입니다. 단계별로 따라하시면 쉽게 설정하실 수 있습니다.`
      };
    } else if (lowerMessage.includes('오류') || lowerMessage.includes('문제') || lowerMessage.includes('에러')) {
      return {
        content: `문제 해결을 도와드리겠습니다.\n\n${topResult.content}\n\n위 내용은 "${documentTitle}"에서 제공하는 문제 해결 가이드입니다. 이 방법으로도 해결되지 않으면 추가 정보를 알려주세요.`
      };
    } else {
      return {
        content: `관련 정보를 찾아드렸습니다.\n\n${topResult.content}\n\n이 정보는 "${documentTitle}"에서 참조한 내용입니다. 더 자세한 정보가 필요하시면 구체적으로 질문해주세요.`
      };
    }
  }
  
  // 검색 결과가 없는 경우
  return {
    content: `죄송합니다. "${message}"에 대한 관련 정보를 찾을 수 없습니다.\n\n다음과 같이 질문해보시면 더 정확한 답변을 드릴 수 있습니다:\n\n• "메타 광고 정책 변경사항이 있나요?"\n• "인스타그램 광고 설정 방법을 알려주세요"\n• "페이스북 광고 계정 생성 시 필요한 서류는?"\n• "광고 정책 위반 시 대처 방법은?"\n\n구체적인 키워드를 포함해서 다시 질문해주세요.`
  };
}

// 대화 로그 저장
async function saveConversationLog(userId: string, userMessage: string, aiResponse: string, sources: any[]) {
  try {
    const { error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        user_message: userMessage,
        ai_response: aiResponse,
        sources: sources.map(s => ({
          document_id: s.document?.id,
          title: s.document?.title,
          content: s.content.substring(0, 500)
        })),
        created_at: new Date().toISOString()
      });

    if (error) {
      // 테이블이 존재하지 않는 경우 경고만 출력하고 계속 진행
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('conversations 테이블이 존재하지 않습니다. 대화 로그 저장을 건너뜁니다.');
      } else {
        console.error('대화 로그 저장 오류:', error);
      }
    }
  } catch (error) {
    console.error('대화 로그 저장 중 오류:', error);
  }
}

// 데모 응답 생성 (환경 변수가 없을 때)
function generateDemoResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('정책') || lowerMessage.includes('policy')) {
    return `네, 메타 광고 정책에 대해 답변드리겠습니다.

**2024년 메타 광고 정책 주요 변경사항:**

1. **인스타그램 광고 정책**
   - 스토리 광고 크기: 1080x1920 픽셀 (9:16 비율)
   - 피드 광고 크기: 1080x1080 픽셀 (1:1 비율)
   - 릴스 광고: 1080x1920 픽셀 (9:16 비율)

2. **페이스북 광고 정책**
   - 이미지 광고: 1200x628 픽셀 (1.91:1 비율)
   - 동영상 광고: 1280x720 픽셀 (16:9 비율)
   - 카루셀 광고: 1080x1080 픽셀 (1:1 비율)

3. **금지 콘텐츠**
   - 성인 콘텐츠, 폭력, 혐오 발언
   - 허위 정보 및 미신
   - 개인정보 수집 및 오남용

*현재 데모 모드로 실행 중입니다. 실제 환경 변수 설정 후 정확한 정보를 제공받을 수 있습니다.*`;
  } else if (lowerMessage.includes('설정') || lowerMessage.includes('방법') || lowerMessage.includes('어떻게')) {
    return `설정 방법에 대해 안내드리겠습니다.

**메타 광고 계정 설정 단계:**

1. **계정 생성**
   - Facebook Business Manager 접속
   - "계정 만들기" 클릭
   - 사업자 정보 입력

2. **광고 계정 생성**
   - 광고 계정 추가
   - 결제 정보 등록
   - 사업자 등록증 업로드

3. **페이지 연결**
   - Facebook/Instagram 페이지 연결
   - 권한 설정
   - 픽셀 설치

4. **첫 캠페인 생성**
   - 캠페인 목표 선택
   - 타겟팅 설정
   - 예산 및 일정 설정

*현재 데모 모드로 실행 중입니다. 실제 환경 변수 설정 후 상세한 가이드를 제공받을 수 있습니다.*`;
  } else if (lowerMessage.includes('오류') || lowerMessage.includes('문제') || lowerMessage.includes('에러')) {
    return `문제 해결을 도와드리겠습니다.

**일반적인 메타 광고 문제 해결:**

1. **광고 승인 거부**
   - 정책 위반 내용 확인
   - 이미지/텍스트 수정
   - 재심사 요청

2. **결제 문제**
   - 결제 수단 확인
   - 한도 설정 확인
   - 카드사 연락

3. **성과 문제**
   - 타겟팅 재검토
   - 크리에이티브 A/B 테스트
   - 예산 조정

4. **기술적 문제**
   - 픽셀 설치 확인
   - 도메인 인증 확인
   - API 연결 상태 점검

*현재 데모 모드로 실행 중입니다. 실제 환경 변수 설정 후 구체적인 해결책을 제공받을 수 있습니다.*`;
  } else {
    return `안녕하세요! 메타 광고 FAQ AI 챗봇입니다.

"${message}"에 대한 질문을 받았습니다.

**주요 질문 유형:**
• 광고 정책 및 가이드라인
• 계정 설정 및 관리
• 캠페인 최적화
• 문제 해결 및 트러블슈팅

더 구체적인 질문을 해주시면 정확한 답변을 드릴 수 있습니다.

*현재 데모 모드로 실행 중입니다. 실제 환경 변수 설정 후 정확한 정보를 제공받을 수 있습니다.*`;
  }
}

// 데모 소스 생성
function generateDemoSources() {
  return [
    {
      id: "demo-1",
      title: "2024년 메타 광고 정책 가이드라인",
      url: "https://developers.facebook.com/docs/marketing-api/overview",
      updatedAt: "2024-01-15",
      excerpt: "2024년에 적용되는 새로운 메타 광고 정책과 가이드라인을 포함한 공식 문서입니다."
    },
    {
      id: "demo-2", 
      title: "인스타그램 광고 설정 매뉴얼",
      url: "https://business.instagram.com/advertising",
      updatedAt: "2024-01-10",
      excerpt: "인스타그램 광고 계정 설정부터 캠페인 운영까지 상세한 가이드를 제공합니다."
    }
  ];
}
