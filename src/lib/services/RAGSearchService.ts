/**
 * RAG (Retrieval-Augmented Generation) 기반 검색 서비스
 * 인덱싱된 문서에서 유사한 콘텐츠를 검색하여 챗봇 답변에 활용
 */

import { createClient } from '@supabase/supabase-js';
import { EmbeddingService } from './EmbeddingService';
import { llmService, LLMResponse } from './LLMService';

export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  documentId: string;
  documentTitle: string;
  documentUrl?: string;
  chunkIndex: number;
  metadata?: any;
}

export interface ChatResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
  processingTime: number;
  model?: string;
  isLLMGenerated?: boolean;
}

export class RAGSearchService {
  private supabase;
  private embeddingService: EmbeddingService;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.embeddingService = new EmbeddingService();
  }

  /**
   * 질문에 대한 유사한 문서 청크 검색
   */
  async searchSimilarChunks(
    query: string, 
    limit: number = 5,
    similarityThreshold: number = 0.7
  ): Promise<SearchResult[]> {
    try {
      console.log(`🔍 RAG 검색 시작: "${query}"`);
      
      // 질문을 임베딩으로 변환
      const queryEmbeddingResult = await this.embeddingService.generateEmbedding(query);
      const queryEmbedding = queryEmbeddingResult.embedding;
      console.log(`📊 질문 임베딩 생성 완료: ${queryEmbedding.length}차원`);

      // 직접 벡터 검색 (함수 없이)
      const { data: chunksData, error } = await this.supabase
        .from('document_chunks')
        .select(`
          document_id,
          content,
          metadata,
          embedding
        `)
        .limit(100); // 충분한 수의 청크를 가져와서 클라이언트에서 필터링

      if (error) {
        console.error('벡터 검색 오류:', error);
        throw error;
      }

      // 클라이언트에서 유사도 계산 및 정렬
      console.log(`📊 가져온 청크 수: ${chunksData.length}`);
      
      const filteredResults = chunksData
        .map((item: any) => {
          // 임베딩 형식 처리
          let dbEmbedding = item.embedding;
          if (typeof dbEmbedding === 'string') {
            try {
              dbEmbedding = JSON.parse(dbEmbedding);
            } catch (e) {
              console.error('임베딩 파싱 실패:', e);
              return null;
            }
          }
          
          if (!Array.isArray(dbEmbedding) || dbEmbedding.length === 0) {
            console.error('유효하지 않은 임베딩:', item.document_id);
            return null;
          }

          // 코사인 유사도 계산
          const similarity = this.calculateSimilarity(queryEmbedding, dbEmbedding);
          console.log(`🔍 유사도 계산: ${similarity.toFixed(4)} (임계값: ${similarityThreshold})`);
          return {
            id: item.document_id,
            content: item.content,
            metadata: item.metadata,
            similarity: similarity
          };
        })
        .filter(item => item !== null) // null 값 제거
        .filter((item: any) => {
          const passed = item.similarity > similarityThreshold;
          console.log(`✅ 필터링: ${item.similarity.toFixed(4)} > ${similarityThreshold} = ${passed}`);
          return passed;
        })
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, limit);

      if (!filteredResults || filteredResults.length === 0) {
        console.log('❌ 유사한 문서를 찾을 수 없습니다.');
        return [];
      }

      console.log(`✅ ${filteredResults.length}개 유사 문서 발견`);

      // 결과를 SearchResult 형태로 변환
      const searchResults: SearchResult[] = filteredResults.map((item: any) => ({
        id: item.id,
        content: item.content,
        similarity: item.similarity,
        documentId: item.document_id,
        documentTitle: item.metadata?.title || '제목 없음',
        documentUrl: item.metadata?.url,
        chunkIndex: item.metadata?.chunkIndex || 0,
        metadata: item.metadata
      }));

      return searchResults;

    } catch (error) {
      console.error('RAG 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 검색 결과를 바탕으로 답변 생성 (LLM 사용)
   */
  async generateAnswer(query: string, searchResults: SearchResult[]): Promise<string> {
    if (searchResults.length === 0) {
      return '죄송합니다. 질문과 관련된 정보를 찾을 수 없습니다. 다른 질문을 시도해보시거나 관리자에게 문의해주세요.';
    }

    try {
      // Ollama 서비스 상태 확인
      const isOllamaAvailable = await llmService.checkOllamaStatus();
      
      if (!isOllamaAvailable) {
        console.log('⚠️ Ollama 서비스가 사용 불가능합니다. 기본 답변 생성 모드로 전환합니다.');
        return this.generateFallbackAnswer(query, searchResults);
      }

      // 검색 결과를 컨텍스트로 구성
      const context = this.buildContextFromSearchResults(searchResults);
      
      // LLM을 통한 빠른 답변 생성
      const llmResponse = await llmService.generateFastAnswer(query, context);
      
      // 답변 품질 검증
      const validation = llmService.validateAnswer(llmResponse.answer, query);
      
      if (!validation.isValid) {
        console.log('⚠️ LLM 답변 품질이 낮습니다. 기본 답변으로 대체합니다.');
        return this.generateFallbackAnswer(query, searchResults);
      }

      console.log(`✅ LLM 답변 생성 완료: ${llmResponse.processingTime}ms, 신뢰도: ${llmResponse.confidence}`);
      return llmResponse.answer;

    } catch (error) {
      console.error('LLM 답변 생성 실패:', error);
      return this.generateFallbackAnswer(query, searchResults);
    }
  }

  /**
   * 검색 결과를 컨텍스트로 구성
   */
  private buildContextFromSearchResults(searchResults: SearchResult[]): string {
    return searchResults
      .map((result, index) => {
        const content = this.extractKoreanContent(result.content);
        const translatedContent = this.translateToKorean(content);
        return `[출처 ${index + 1}] ${result.documentTitle}\n${translatedContent}`;
      })
      .join('\n\n');
  }

  /**
   * LLM 사용 불가 시 대체 답변 생성
   */
  private generateFallbackAnswer(query: string, searchResults: SearchResult[]): string {
    // 한글 내용이 포함된 검색 결과 우선 필터링
    const koreanResults = searchResults.filter(result => 
      /[\u3131-\u3163\uac00-\ud7a3]/.test(result.content)
    );

    // 한글 결과가 있으면 한글 우선, 없으면 영문 결과 사용
    const finalResults = koreanResults.length > 0 ? koreanResults : searchResults;

    // 간단한 답변 생성 (한글 우선, 영문도 번역하여 처리)
    return this.generateSimpleAnswer(query, finalResults);
  }

  /**
   * 간단한 답변 생성 (LLM 없이)
   */
  private generateSimpleAnswer(query: string, searchResults: SearchResult[]): string {
    const topResult = searchResults[0];
    const similarity = topResult.similarity;
    
    // 유사도 임계값을 낮춰서 더 많은 질문에 답변 제공
    if (similarity < 0.5) {
      const content = this.extractKoreanContent(topResult.content);
      const translatedContent = this.translateToKorean(content);
      const cleanContent = this.cleanupTranslatedText(translatedContent);
      return `질문과 관련된 정보를 찾았지만, 정확한 답변을 위해 더 구체적인 질문을 해주시면 도움이 될 것 같습니다.\n\n관련 정보:\n${cleanContent.substring(0, 300)}...`;
    }

    // 유사도가 높은 경우 직접적인 답변 제공
    let answer = `다음은 "${query}"에 대한 답변입니다:\n\n`;
    
    // 가장 관련성 높은 결과를 중심으로 답변 구성 (한글 내용 추출 및 번역)
    const koreanContent = this.extractKoreanContent(topResult.content);
    const translatedContent = this.translateToKorean(koreanContent);
    const cleanContent = this.cleanupTranslatedText(translatedContent);
    answer += cleanContent;
    
    // 추가 관련 정보가 있으면 포함
    if (searchResults.length > 1) {
      answer += `\n\n추가 정보:\n`;
      searchResults.slice(1, 3).forEach((result, index) => {
        const additionalContent = this.extractKoreanContent(result.content);
        const translatedAdditional = this.translateToKorean(additionalContent);
        const cleanAdditional = this.cleanupTranslatedText(translatedAdditional);
        answer += `\n${index + 2}. ${cleanAdditional.substring(0, 200)}...`;
      });
    }

    return answer;
  }

  /**
   * 번역된 텍스트 정리 및 자연스러운 문장 구조로 개선
   */
  private cleanupTranslatedText(text: string): string {
    if (!text) return '';
    
    // 기본 정리
    let cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*\.\s*/g, '. ')
      .trim();
    
    // 자연스러운 문장 구조 개선
    cleaned = cleaned
      .replace(/([가-힣])\s+([가-힣])/g, '$1 $2') // 한글 사이 공백 유지
      .replace(/([가-힣])\s+([a-zA-Z])/g, '$1 $2') // 한글-영문 사이 공백 유지
      .replace(/([a-zA-Z])\s+([가-힣])/g, '$1 $2') // 영문-한글 사이 공백 유지
      .replace(/\s+/g, ' ') // 연속 공백 제거
      .trim();
    
    // 문장 끝 정리
    if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
      cleaned += '.';
    }
    
    return cleaned;
  }

  /**
   * 한글 내용 추출 및 정리 (영문도 포함)
   */
  private extractKoreanContent(content: string): string {
    if (!content) return '';
    
    // 한글, 영문, 숫자, 기본 특수문자만 유지
    let cleanedContent = content
      .replace(/[^\u3131-\u3163\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f\w\s.,!?;:()\-\[\]{}"'`~@#$%^&*+=|\\/<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 연속된 공백 제거
    cleanedContent = cleanedContent.replace(/\s{2,}/g, ' ');
    
    // 문장 단위로 정리
    const sentences = cleanedContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // 한글이 포함된 문장 우선 선택
    const koreanSentences = sentences.filter(sentence => 
      /[\u3131-\u3163\uac00-\ud7a3]/.test(sentence)
    );
    
    if (koreanSentences.length > 0) {
      return koreanSentences.slice(0, 3).join('. ').trim() + '.';
    }
    
    // 한글 문장이 없으면 영문 문장도 포함하여 반환
    const allSentences = sentences.slice(0, 3);
    if (allSentences.length > 0) {
      return allSentences.join('. ').trim() + '.';
    }
    
    // 문장이 없으면 원본 내용의 일부 반환
    return cleanedContent.substring(0, 500);
  }

  /**
   * 영문 내용을 한글로 번역하여 답변 생성
   */
  private translateToKorean(content: string): string {
    // 확장된 키워드 기반 번역 사전
    const translations: { [key: string]: string } = {
      // 기본 용어
      'Advertising Standards': '광고 표준',
      'advertising policy': '광고 정책',
      'advertisers': '광고주',
      'ad content': '광고 콘텐츠',
      'business account': '비즈니스 계정',
      'community standards': '커뮤니티 표준',
      'policy': '정책',
      'policies': '정책들',
      'review': '검토',
      'rejected': '거부됨',
      'restricted': '제한됨',
      'compliance': '준수',
      'violation': '위반',
      'transparency': '투명성',
      'requirements': '요구사항',
      'guidelines': '가이드라인',
      'principles': '원칙',
      'prohibited': '금지됨',
      'allowed': '허용됨',
      'unacceptable': '허용되지 않음',
      'fraud': '사기',
      'scams': '사기',
      'deceptive': '기만적인',
      'intellectual property': '지적 재산권',
      'infringement': '침해',
      'social issue': '사회적 이슈',
      'electoral': '선거',
      'political': '정치적',
      'data use': '데이터 사용',
      'restrictions': '제한사항',
      'digital services': '디지털 서비스',
      'act': '법',
      'overview': '개요',
      'introduction': '소개',
      'understanding': '이해',
      'provide': '제공',
      'guidance': '지침',
      'types': '유형',
      'content': '콘텐츠',
      'order': '주문',
      'against': '대상',
      'behavior': '행동',
      'result': '결과',
      'assets': '자산',
      'account': '계정',
      'page': '페이지',
      'user': '사용자',
      'mistakenly': '잘못',
      'request': '요청',
      'decision': '결정',
      'quality': '품질',
      'common': '일반적인',
      'confusion': '혼란',
      'build': '구축',
      'compliant': '준수하는',
      'user-friendly': '사용자 친화적인',
      'experience': '경험',
      'highlighted': '강조된',
      'areas': '영역',
      'learn': '학습',
      'more': '더',
      'about': '에 대해',
      'privacy': '개인정보',
      'violations': '위반',
      'personal': '개인',
      'attributes': '속성',
      'sexually': '성적으로',
      'suggestive': '암시적인',
      'contribute': '기여',
      'community': '커뮤니티',
      'ways': '방법',
      'including': '포함하여',
      'highlighting': '강조',
      'products': '제품',
      'services': '서비스',
      'drawing': '끌어',
      'attention': '주의',
      'events': '이벤트',
      'issues': '이슈',
      'keep': '유지',
      'safe': '안전',
      'create': '생성',
      'welcoming': '환영하는',
      'environment': '환경',
      'everyone': '모든 사람',
      'uses': '사용',
      'put': '두다',
      'place': '장소',
      'guide': '안내',
      'across': '전체',
      'technologies': '기술',
      'running': '실행',
      'ads': '광고',
      'follow': '따르다',
      'company': '회사',
      'core': '핵심',
      'values': '가치',
      'following': '다음',
      'protecting': '보호',
      'people': '사람들',
      'unsafe': '안전하지 않은',
      'discriminatory': '차별적인',
      'practices': '관행',
      'require': '요구',
      'comply': '준수',
      'laws': '법률',
      'jurisdiction': '관할권',
      'engage': '참여',
      'sell': '판매',
      'illegal': '불법적인',
      'substances': '물질',
      
      // 추가 용어
      'Language': '언어',
      'Center': '센터',
      'Enforcement': '집행',
      'Security': '보안',
      'Features': '기능',
      'Governance': '거버넌스',
      'Research': '연구',
      'tools': '도구',
      'Reports': '보고서',
      'Home': '홈',
      'Policies': '정책',
      'to the': '에 대한',
      'Meta': '메타',
      'The ad': '광고',
      'process': '과정',
      'What to do': '해야 할 일',
      'if your': '귀하의',
      'is': '입니다',
      'or': '또는',
      'business': '비즈니스',
      'asset': '자산',
      'you can': '할 수 있습니다',
      'of either': '중 하나의',
      'in Account': '계정에서',
      'Quality': '품질',
      'To help': '도움을 위해',
      'you': '귀하',
      'and': '및',
      'friendly': '친화적인',
      'ads': '광고',
      'experience': '경험',
      'we\'ve': '우리는',
      'some': '일부',
      'Click': '클릭',
      'the links': '링크',
      'below': '아래',
      'to': '에',
      'more': '더',
      'Privacy': '개인정보',
      'Violations': '위반',
      'Personal': '개인',
      'Attributes': '속성',
      'Sexually': '성적으로',
      'suggestive': '암시적인',
      'Advertising': '광고',
      'on': '에',
      'assets': '자산',
      'contribute': '기여',
      'many': '많은',
      'highlighting': '강조',
      'new': '새로운',
      'drawing': '끌어',
      'events': '이벤트',
      'help': '도움',
      'both': '둘 다',
      'businesses': '비즈니스',
      'organizations': '조직',
      'who': '누가',
      'use': '사용',
      'our': '우리의',
      'ad': '광고',
      'tools': '도구',
      'safe': '안전',
      'welcoming': '환영하는',
      'environment': '환경',
      'for': '을 위한',
      'everyone': '모든 사람',
      'uses': '사용',
      'products': '제품',
      'services': '서비스',
      'we': '우리는',
      'have': '가지고 있습니다',
      'put': '두었습니다',
      'in': '에',
      'our': '우리의',
      'Advertising': '광고',
      'Standards': '표준',
      'guide': '안내',
      'what': '무엇이',
      'is': '입니다',
      'allowed': '허용됨',
      'across': '전체',
      'Meta': '메타',
      'technologies': '기술',
      'running': '실행',
      'ads': '광고',
      'across': '전체',
      'Meta': '메타',
      'technologies': '기술',
      'must': '해야 합니다',
      'follow': '따르다',
      'our': '우리의',
      'Community': '커뮤니티',
      'Standards': '표준',
      'and': '및',
      'our': '우리의',
      'Advertising': '광고',
      'Standards': '표준',
      'Our': '우리의',
      'advertising': '광고',
      'policy': '정책',
      'principles': '원칙',
      'Our': '우리의',
      'policies': '정책',
      'are': '입니다',
      'guided': '안내됨',
      'by': '에 의해',
      'our': '우리의',
      'company\'s': '회사의',
      'core': '핵심',
      'values': '가치',
      'and': '및',
      'the': '그',
      'following': '다음',
      'principles': '원칙',
      'PROTECTING': '보호',
      'PEOPLE': '사람들',
      'FROM': '으로부터',
      'UNSAFE': '안전하지 않은',
      'AND': '및',
      'DISCRIMINATORY': '차별적인',
      'PRACTICES': '관행',
      'Our': '우리의',
      'policies': '정책',
      'require': '요구',
      'all': '모든',
      'advertisers': '광고주',
      'to': '에',
      'comply': '준수',
      'with': '와',
      'the': '그',
      'laws': '법률',
      'in': '에',
      'their': '그들의',
      'jurisdiction': '관할권',
      'not': '하지',
      'engage': '참여',
      'in': '에',
      'discriminatory': '차별적인',
      'practices': '관행',
      'and': '및',
      'not': '하지',
      'sell': '판매',
      'illegal': '불법적인',
      'or': '또는',
      'unsafe': '안전하지 않은',
      'substances': '물질'
    };

    let translatedContent = content;
    
    // 긴 구문부터 번역 (우선순위)
    const sortedTranslations = Object.entries(translations)
      .sort(([a], [b]) => b.length - a.length);
    
    sortedTranslations.forEach(([english, korean]) => {
      const regex = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      translatedContent = translatedContent.replace(regex, korean);
    });

    // 문장 구조 개선
    translatedContent = translatedContent
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*\.\s*/g, '. ')
      .trim();

    return translatedContent;
  }

  /**
   * 완전한 RAG 기반 챗봇 응답 생성
   */
  async generateChatResponse(query: string): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 챗봇 응답 생성 시작: "${query}"`);
      
      // 1. 유사한 문서 검색 (유사도 임계값을 낮춤)
      const searchResults = await this.searchSimilarChunks(query, 5, 0.2);
      
      // 2. 답변 생성 (LLM 사용)
      const answer = await this.generateAnswer(query, searchResults);
      
      // 3. Ollama 사용 여부 확인
      const isOllamaAvailable = await llmService.checkOllamaStatus();
      const isLLMGenerated = isOllamaAvailable && !answer.includes('죄송합니다');
      
      // 4. 신뢰도 계산
      const confidence = this.calculateConfidence(searchResults);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ 챗봇 응답 생성 완료: ${processingTime}ms, 신뢰도: ${confidence}, LLM: ${isLLMGenerated ? '사용' : '미사용'}`);
      
      return {
        answer,
        sources: searchResults,
        confidence,
        processingTime,
        model: isLLMGenerated ? 'qwen2.5:7b' : 'fallback',
        isLLMGenerated
      };

    } catch (error) {
      console.error('챗봇 응답 생성 실패:', error);
      const processingTime = Date.now() - startTime;
      
      return {
        answer: '죄송합니다. 답변을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        sources: [],
        confidence: 0,
        processingTime,
        model: 'error',
        isLLMGenerated: false
      };
    }
  }

  /**
   * 벡터 유사도 계산 (코사인 유사도)
   */
  private calculateSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(searchResults: SearchResult[]): number {
    if (searchResults.length === 0) return 0;
    
    // 가장 높은 유사도를 기준으로 신뢰도 계산
    const maxSimilarity = Math.max(...searchResults.map(r => r.similarity));
    
    // 유사도가 0.9 이상이면 높은 신뢰도
    if (maxSimilarity >= 0.9) return 0.9;
    
    // 유사도가 0.8 이상이면 중간 신뢰도
    if (maxSimilarity >= 0.8) return 0.7;
    
    // 유사도가 0.7 이상이면 낮은 신뢰도
    if (maxSimilarity >= 0.7) return 0.5;
    
    // 그 외에는 매우 낮은 신뢰도
    return 0.3;
  }

  /**
   * 검색 통계 조회
   */
  async getSearchStats(): Promise<{
    totalChunks: number;
    totalDocuments: number;
    averageSimilarity: number;
  }> {
    try {
      const { data: chunks, error: chunksError } = await this.supabase
        .from('document_chunks')
        .select('id', { count: 'exact' });

      if (chunksError) throw chunksError;

      const { data: documents, error: docsError } = await this.supabase
        .from('documents')
        .select('id', { count: 'exact' });

      if (docsError) throw docsError;

      return {
        totalChunks: chunks?.length || 0,
        totalDocuments: documents?.length || 0,
        averageSimilarity: 0.75 // 임시값
      };

    } catch (error) {
      console.error('검색 통계 조회 실패:', error);
      return {
        totalChunks: 0,
        totalDocuments: 0,
        averageSimilarity: 0
      };
    }
  }
}

export const ragSearchService = new RAGSearchService();