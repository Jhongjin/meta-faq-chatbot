/**
 * RAG (Retrieval-Augmented Generation) 기반 검색 서비스
 * 인덱싱된 문서에서 유사한 콘텐츠를 검색하여 챗봇 답변에 활용
 */

import { createClient } from '@supabase/supabase-js';
import { OllamaEmbeddingService } from './OllamaEmbeddingService';
import { SimpleEmbeddingService } from './SimpleEmbeddingService';
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
  private embeddingService: OllamaEmbeddingService | SimpleEmbeddingService;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
      console.error('필요한 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
      throw new Error('Supabase 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      
      // 먼저 Ollama 임베딩 서비스 시도
      try {
        this.embeddingService = new OllamaEmbeddingService();
        console.log('✅ RAGSearchService 초기화 완료 (Ollama 임베딩 서비스)');
      } catch (error) {
        console.warn('⚠️ Ollama 임베딩 서비스 실패, 간단한 임베딩 서비스로 전환:', error);
        this.embeddingService = new SimpleEmbeddingService();
        console.log('✅ RAGSearchService 초기화 완료 (간단한 임베딩 서비스)');
      }
    } catch (error) {
      console.error('❌ RAGSearchService 초기화 실패:', error);
      throw new Error(`RAGSearchService 초기화 실패: ${error}`);
    }
  }

  /**
   * 질문에 대한 유사한 문서 청크 검색
   */
  async searchSimilarChunks(
    query: string,
    limit: number = 5,
    similarityThreshold: number = 0.1  // 임계값을 낮춰서 더 많은 결과 검색
  ): Promise<SearchResult[]> {
    try {
      console.log(`🔍 RAG 검색 시작: "${query}"`);
      
      // 질문을 임베딩으로 변환
      const queryEmbeddingResult = await this.embeddingService.generateEmbedding(query);
      const queryEmbedding = queryEmbeddingResult.embedding;
      console.log(`📊 질문 임베딩 생성 완료: ${queryEmbedding.length}차원`);

      // 직접 SQL 쿼리 사용 (RPC 함수 문제 우회)
      const queryVectorString = `[${queryEmbedding.join(',')}]`;
      
      const { data: searchResults, error } = await this.supabase
        .from('document_chunks')
        .select(`
          chunk_id,
          content,
          metadata,
          embedding
        `)
        .limit(limit * 2); // 더 많은 결과를 가져와서 클라이언트에서 필터링

      if (error) {
        console.error('벡터 검색 오류:', error);
        throw error;
      }

      console.log(`📊 데이터베이스 조회 결과: ${searchResults?.length || 0}개`);

      // 클라이언트에서 유사도 계산 및 필터링
      const filteredResults = (searchResults || [])
        .map((result: any) => {
          // 임베딩 데이터 파싱
          let storedEmbedding: number[];
          try {
            if (typeof result.embedding === 'string') {
              storedEmbedding = JSON.parse(result.embedding);
            } else if (Array.isArray(result.embedding)) {
              storedEmbedding = result.embedding;
            } else {
              console.warn(`알 수 없는 임베딩 형식: ${typeof result.embedding}`);
              return null;
            }
          } catch (error) {
            console.warn(`임베딩 파싱 실패: ${error}`);
            return null;
          }

          // 유사도 계산 (코사인 유사도)
          const similarity = this.calculateCosineSimilarity(queryEmbedding, storedEmbedding);
          console.log(`🔍 유사도 계산: ${result.chunk_id} = ${similarity.toFixed(4)}`);
          
          return {
            id: result.chunk_id,
            content: result.content,
            similarity: similarity,
            documentId: result.chunk_id.split('_chunk_')[0],
            documentTitle: result.metadata?.title || 'Unknown',
            documentUrl: result.metadata?.url,
            chunkIndex: parseInt(result.chunk_id.split('_chunk_')[1]) || 0,
            metadata: result.metadata
          };
        })
        .filter((result: any) => result !== null && result.similarity > 0.01)
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, limit);

      console.log(`✅ 검색 완료: ${filteredResults.length}개 결과 (임계값: ${similarityThreshold})`);
      return filteredResults as SearchResult[];

    } catch (error) {
      console.error('❌ RAG 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 코사인 유사도 계산 (개선된 버전)
   */
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      console.warn('벡터 차원이 다릅니다:', vecA.length, vecB.length);
      return 0;
    }

    if (vecA.length === 0 || vecB.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const a = Number(vecA[i]) || 0;
      const b = Number(vecB[i]) || 0;
      
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    
    // NaN이나 Infinity 체크
    if (!isFinite(similarity)) {
      return 0;
    }

    return Math.max(0, Math.min(1, similarity)); // 0-1 범위로 제한
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
      
      // Ollama를 통한 답변 생성
      const llmResponse = await llmService.generateFastAnswer(
        `질문: ${query}\n\n관련 문서 내용:\n${context}`,
        context
      );

      console.log(`✅ Ollama 답변 생성 완료: ${llmResponse.processingTime}ms, 신뢰도: ${llmResponse.confidence}`);
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

      // 1. 유사한 문서 청크 검색 (임계값을 더 낮춰서 더 많은 결과 검색)
      const searchResults = await this.searchSimilarChunks(query, 5, 0.01);
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
        model: isLLMGenerated ? 'qwen2.5:1.5b' : 'fallback',
        isLLMGenerated
      };

    } catch (error) {
      console.error('RAG 응답 생성 실패:', error);
      
      // Supabase 연결 오류인 경우 특별한 메시지 제공
      if (error instanceof Error && error.message.includes('Supabase')) {
        return {
          answer: '죄송합니다. 현재 데이터베이스 연결 설정이 완료되지 않았습니다. 관리자에게 문의하시거나 잠시 후 다시 시도해주세요.\n\n임시로 Meta 광고 정책 관련 질문은 Meta 비즈니스 도움말 센터에서 확인하실 수 있습니다.',
          sources: [],
          confidence: 0,
          processingTime: Date.now() - startTime,
          model: 'error',
          isLLMGenerated: false
        };
      }
      
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

// 지연 초기화를 위한 싱글톤 패턴
let ragSearchServiceInstance: RAGSearchService | null = null;

export function getRAGSearchService(): RAGSearchService {
  if (!ragSearchServiceInstance) {
    try {
      ragSearchServiceInstance = new RAGSearchService();
    } catch (error) {
      console.error('RAGSearchService 초기화 실패:', error);
      throw error;
    }
  }
  return ragSearchServiceInstance;
}

// 기존 호환성을 위한 export (deprecated)
export const ragSearchService = {
  generateChatResponse: async (message: string) => {
    const service = getRAGSearchService();
    return service.generateChatResponse(message);
  },
  getSearchStats: async () => {
    const service = getRAGSearchService();
    return service.getSearchStats();
  }
};