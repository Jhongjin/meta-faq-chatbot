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
  model: string;
  isLLMGenerated?: boolean;
}

export class RAGSearchService {
  private supabase;
  private embeddingService: EmbeddingService;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // 빌드 시에는 더미 클라이언트를 사용하여 오류 방지
      if (process.env.NODE_ENV === 'production') {
        console.warn('프로덕션 환경에서 Supabase 환경변수가 누락되었습니다. 더미 클라이언트를 사용합니다.');
        this.supabase = createClient('https://dummy.supabase.co', 'dummy-key');
        this.embeddingService = new EmbeddingService();
        return;
      }
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
        .map((chunk: any) => {
          try {
            // 임베딩이 문자열인 경우 배열로 변환
            let embedding: number[];
            if (typeof chunk.embedding === 'string') {
              embedding = JSON.parse(chunk.embedding);
            } else {
              embedding = chunk.embedding;
            }

            // 유사도 계산 (코사인 유사도)
            const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding);
            
            return {
              id: chunk.document_id,
              content: chunk.content,
              similarity,
              documentId: chunk.document_id,
              documentTitle: chunk.metadata?.title || 'Unknown',
              documentUrl: chunk.metadata?.url,
              chunkIndex: chunk.metadata?.chunkIndex || 0,
              metadata: chunk.metadata
            };
          } catch (error) {
            console.error('청크 처리 오류:', error);
            return null;
          }
        })
        .filter(item => item !== null) // null 값 제거
        .filter(item => item!.similarity >= similarityThreshold) // 임계값 필터링
        .sort((a, b) => b!.similarity - a!.similarity) // 유사도 순 정렬
        .slice(0, limit); // 상위 N개만 선택

      console.log(`✅ 검색 완료: ${filteredResults.length}개 결과`);
      return filteredResults as SearchResult[];

    }

  /**
   * 코사인 유사도 계산
   */
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      console.warn('벡터 차원이 다릅니다:', vecA.length, vecB.length);
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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
      .map((result, index) => `[출처 ${index + 1}] ${result.content}`)
      .join('\n\n');
  }

  /**
   * LLM 없이 기본 답변 생성
   */
  private generateFallbackAnswer(query: string, searchResults: SearchResult[]): string {
    const topResult = searchResults[0];
    const content = this.extractRelevantContent(topResult.content, query);
    
    return `검색된 정보에 따르면:\n\n${content}\n\n이 정보가 도움이 되었나요? 더 자세한 내용이 필요하시면 다른 질문을 해주세요.`;
  }

  /**
   * 관련 내용 추출 및 정리
   */
  private extractRelevantContent(content: string, query: string): string {
    // 기본적인 텍스트 정리
    let cleanedContent = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
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
   * 영문 내용을 한글로 번역하여 답변 생성 (간소화됨)
   */
  private translateToKorean(content: string): string {
    // 번역 기능을 임시로 비활성화하여 빌드 오류 방지
    return content;
  }

  /**
   * 완전한 RAG 기반 챗봇 응답 생성
   */
  async generateChatResponse(query: string): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      console.log(`🚀 RAG 챗봇 응답 생성 시작: "${query}"`);

      // 1. 유사한 문서 청크 검색
      const searchResults = await this.searchSimilarChunks(query, 5, 0.7);
      console.log(`📊 검색 결과: ${searchResults.length}개`);

      // 2. 답변 생성
      const answer = await this.generateAnswer(query, searchResults);
      
      // 3. 신뢰도 계산
      const confidence = this.calculateConfidence(searchResults);
      
      // 4. 처리 시간 계산
      const processingTime = Date.now() - startTime;
      
      // 5. LLM 사용 여부 확인
      const isLLMGenerated = await llmService.checkOllamaStatus();

      console.log(`✅ RAG 응답 생성 완료: ${processingTime}ms, 신뢰도: ${confidence}`);

      return {
        answer,
        sources: searchResults,
        confidence,
        processingTime,
        model: isLLMGenerated ? 'qwen2.5:7b' : 'fallback',
        isLLMGenerated
      };

    } catch (error) {
      console.error('RAG 응답 생성 실패:', error);
      
      return {
        answer: '죄송합니다. 현재 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        sources: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
        model: 'error',
        isLLMGenerated: false
      };
    }
  }

  /**
   * 검색 결과 기반 신뢰도 계산
   */
  private calculateConfidence(searchResults: SearchResult[]): number {
    if (searchResults.length === 0) return 0;
    
    // 상위 결과의 유사도 기반 신뢰도 계산
    const topSimilarity = searchResults[0].similarity;
    
    if (topSimilarity >= 0.9) return 0.95;
    if (topSimilarity >= 0.8) return 0.85;
    if (topSimilarity >= 0.7) return 0.75;
    if (topSimilarity >= 0.6) return 0.65;
    
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
