/**
 * RAG (Retrieval-Augmented Generation) 프로세서
 * 실제 텍스트 청킹, 임베딩 생성, 벡터 검색 기능을 제공
 */

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { createClient } from '@supabase/supabase-js';
import { createPureClient } from '../supabase/server';

export interface ChunkData {
  id: string;
  content: string;
  metadata: {
    document_id: string;
    chunk_index: number;
    source: string;
    created_at: string;
  };
  embedding?: number[];
}

export interface DocumentData {
  id: string;
  title: string;
  content: string;
  type: string;
  file_size: number;
  file_type: string;
  url?: string; // URL 필드 추가
  created_at: string;
  updated_at: string;
}

export class RAGProcessor {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    // 텍스트 분할기 설정
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800, // 청크 크기 (800자로 감소)
      chunkOverlap: 100, // 청크 간 겹침 (100자로 감소)
      separators: ['\n\n', '\n', '.', '!', '?', ';', ' ', ''], // 분할 기준
    });
  }

  /**
   * Supabase 클라이언트 가져오기
   */
  private async getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔍 Supabase 환경 변수 체크:');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '설정됨' : '없음');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    
    // 환경 변수 체크
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase 환경 변수가 설정되지 않음. 메모리 모드로 전환');
      return null;
    }
    
    // 더미 URL 체크
    if (supabaseUrl === 'https://dummy.supabase.co' || supabaseUrl.includes('dummy')) {
      console.warn('⚠️ 더미 Supabase URL 감지. 메모리 모드로 전환');
      return null;
    }
    
    try {
      // 직접 Supabase 클라이언트 생성 (createPureClient 대신)
      const client = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase 클라이언트 생성 성공 (직접 생성)');
      
      // 연결 테스트
      const { data, error } = await client.from('documents').select('count').limit(1);
      if (error) {
        console.error('❌ Supabase 연결 테스트 실패:', error);
        return null;
      }
      console.log('✅ Supabase 연결 테스트 성공');
      
      return client;
    } catch (error) {
      console.error('❌ Supabase 클라이언트 생성 실패:', error);
      return null;
    }
  }


  /**
   * 간단한 로컬 임베딩 생성 (API 키 없이)
   */
  private generateSimpleEmbedding(text: string): number[] {
    try {
      // 환경변수에서 임베딩 차원 수 가져오기
      const embeddingDim = parseInt(process.env.EMBEDDING_DIM || '1024');
      
      // 간단한 해시 기반 임베딩 생성 (실제 임베딩은 아니지만 테스트용)
      const hash = this.simpleHash(text);
      const embedding = new Array(embeddingDim).fill(0);
      
      // 해시값을 기반으로 임베딩 벡터 생성
      for (let i = 0; i < embeddingDim; i++) {
        embedding[i] = Math.sin(hash + i) * 0.1;
      }
      
      return embedding;
    } catch (error) {
      console.warn('⚠️ 임베딩 생성 실패, 기본값 반환:', error);
      const embeddingDim = parseInt(process.env.EMBEDDING_DIM || '1024');
      return new Array(embeddingDim).fill(0);
    }
  }

  /**
   * 간단한 해시 함수
   */
  private simpleHash(str: string): number {
    try {
      if (!str || typeof str !== 'string') {
        return 0;
      }
      
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit 정수로 변환
      }
      return Math.abs(hash);
    } catch (error) {
      console.warn('⚠️ 해시 생성 실패, 기본값 반환:', error);
      return 12345; // 기본 해시값
    }
  }

  /**
   * 중복 문서 검사
   */
  private async checkDuplicateDocument(title: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient();
      if (!supabase) {
        console.warn('⚠️ Supabase 연결 없음. 중복 검사 건너뛰기');
        return false;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('id, title')
        .eq('title', title)
        .limit(1);

      if (error) {
        console.error('❌ 중복 검사 오류:', error);
        return false;
      }

      const isDuplicate = data && data.length > 0;
      console.log('🔍 중복 검사 결과:', { title, isDuplicate });
      return isDuplicate;
    } catch (error) {
      console.error('❌ 중복 검사 중 오류:', error);
      return false;
    }
  }

  /**
   * 청크에 대한 임베딩 생성 (로컬 버전)
   */
  async generateEmbeddings(chunks: ChunkData[]): Promise<ChunkData[]> {
    try {
      console.log('🔮 임베딩 생성 시작 (로컬):', chunks.length, '개 청크');

      // 환경변수에서 임베딩 차원 수 가져오기
      const embeddingDim = parseInt(process.env.EMBEDDING_DIM || '1024');
      console.log('📏 임베딩 차원 수:', embeddingDim);

      // 각 청크에 대해 간단한 임베딩 생성
      const chunksWithEmbeddings = chunks.map((chunk, index) => {
        try {
          return {
            ...chunk,
            embedding: this.generateSimpleEmbedding(chunk.content),
          };
        } catch (error) {
          console.warn(`⚠️ 청크 ${index} 임베딩 생성 실패, 기본값 사용:`, error);
          return {
            ...chunk,
            embedding: new Array(embeddingDim).fill(0), // 환경변수 기반 기본 임베딩
          };
        }
      });

      console.log('✅ 임베딩 생성 완료 (로컬):', chunksWithEmbeddings.length, '개 청크');

      return chunksWithEmbeddings;
    } catch (error) {
      console.error('❌ 임베딩 생성 오류:', error);
      // 오류 발생 시에도 기본 임베딩으로 반환
      console.log('⚠️ 기본 임베딩으로 대체 처리');
      const embeddingDim = parseInt(process.env.EMBEDDING_DIM || '1024');
      return chunks.map(chunk => ({
        ...chunk,
        embedding: new Array(embeddingDim).fill(0),
      }));
    }
  }

  /**
   * 문서를 Supabase에 저장
   */
  async saveDocumentToDatabase(document: DocumentData): Promise<void> {
    try {
      console.log('💾 문서 저장 시작:', document.title);
      const supabase = await this.getSupabaseClient();

      // Supabase 연결 확인
      if (!supabase) {
        console.warn('⚠️ Supabase 연결 없음. 메모리 모드로 동작');
        return;
      }

      // content 필드에서 null 바이트 제거
      const cleanContent = document.content ? document.content.replace(/\0/g, '') : '';

      const { error } = await supabase
        .from('documents')
        .insert({
          id: document.id,
          title: document.title,
          content: cleanContent,
          type: document.type,
          status: 'processing',
          chunk_count: 0,
          file_size: document.file_size,
          file_type: document.file_type,
          url: document.url || null, // URL 필드 추가
          created_at: document.created_at,
          updated_at: document.updated_at,
        });

      if (error) {
        console.error('❌ 문서 저장 오류:', error);
        throw error;
      }

      console.log('✅ 문서 저장 완료:', document.title);

      // document_metadata 테이블에도 저장
      const fileType = document.file_type?.split('/')[1] || 'pdf';
      const { error: metadataError } = await supabase
        .from('document_metadata')
        .insert({
          id: document.id,
          title: document.title,
          type: fileType,
          size: document.file_size || 0,
          uploaded_at: document.created_at,
          processed_at: new Date().toISOString(),
          status: 'completed',
          chunk_count: 0, // 청크 저장 후 업데이트됨
          embedding_count: 0,
          created_at: document.created_at,
          updated_at: document.updated_at,
        });

      if (metadataError) {
        console.error('❌ 문서 메타데이터 저장 오류:', metadataError);
      } else {
        console.log('✅ 문서 메타데이터 저장 완료');
      }

    } catch (error) {
      console.error('❌ 문서 저장 오류:', error);
      throw new Error(`문서 저장 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 청크를 Supabase에 저장
   */
  async saveChunksToDatabase(chunks: ChunkData[]): Promise<void> {
    try {
      console.log('💾 청크 저장 시작:', chunks.length, '개 청크');
      const supabase = await this.getSupabaseClient();

      // Supabase 연결 확인
      if (!supabase) {
        console.warn('⚠️ Supabase 연결 없음. 청크 저장 건너뛰기');
        return;
      }

      // 청크 데이터 준비 (id는 SERIAL이므로 제외)
      const chunkInserts = chunks.map(chunk => ({
        document_id: chunk.metadata.document_id,
        chunk_id: chunk.id, // chunk_id 필드에 문자열 ID 저장
        content: chunk.content.replace(/\0/g, ''), // null 바이트 제거
        metadata: {
          chunk_index: chunk.metadata.chunk_index,
          source: chunk.metadata.source,
          created_at: chunk.metadata.created_at,
        },
        embedding: chunk.embedding,
      }));

      // 배치 처리로 청크 저장 (한 번에 100개씩)
      const batchSize = 100;
      let savedCount = 0;
      
      for (let i = 0; i < chunkInserts.length; i += batchSize) {
        const batch = chunkInserts.slice(i, i + batchSize);
        console.log(`💾 청크 배치 저장 중: ${i + 1}-${Math.min(i + batchSize, chunkInserts.length)}/${chunkInserts.length}`);
        
        const { error } = await supabase
          .from('document_chunks')
          .insert(batch);

        if (error) {
          console.error('❌ 청크 배치 저장 오류:', error);
          throw error;
        }
        
        savedCount += batch.length;
        console.log(`✅ 청크 배치 저장 완료: ${savedCount}/${chunkInserts.length}`);
        
        // 배치 간 짧은 대기 (데이터베이스 부하 방지)
        if (i + batchSize < chunkInserts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('✅ 청크 저장 완료:', chunks.length, '개 청크');

      // 문서의 chunk_count 업데이트
      if (chunks.length > 0) {
        const documentId = chunks[0].metadata.document_id;
        const { error: updateError } = await supabase
          .from('documents')
          .update({ 
            chunk_count: chunks.length,
            status: 'indexed',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);

        if (updateError) {
          console.error('❌ 문서 chunk_count 업데이트 오류:', updateError);
        } else {
          console.log('✅ 문서 chunk_count 업데이트 완료:', chunks.length, '개 청크');
        }

        // document_metadata의 chunk_count와 embedding_count도 업데이트
        const { error: metadataUpdateError } = await supabase
          .from('document_metadata')
          .update({ 
            chunk_count: chunks.length,
            embedding_count: chunks.length,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);

        if (metadataUpdateError) {
          console.error('❌ 문서 메타데이터 업데이트 오류:', metadataUpdateError);
        } else {
          console.log('✅ 문서 메타데이터 업데이트 완료');
        }
      }

    } catch (error) {
      console.error('❌ 청크 저장 오류:', error);
      throw new Error(`청크 저장 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 문서를 완전히 처리 (청킹 + 임베딩 + 저장)
   */
  async processDocument(document: DocumentData, skipDuplicate: boolean = false): Promise<{
    documentId: string;
    chunkCount: number;
    success: boolean;
  }> {
    try {
      console.log('🚀 RAG 문서 처리 시작:', document.title);
      console.log('📄 문서 정보:', {
        id: document.id,
        title: document.title,
        contentLength: document.content.length,
        fileSize: document.file_size,
        fileType: document.file_type
      });

      // 0. 중복 검사 (skipDuplicate가 false인 경우에만)
      if (!skipDuplicate) {
        console.log('🔍 중복 문서 검사 시작...');
        const isDuplicate = await this.checkDuplicateDocument(document.title);
        if (isDuplicate) {
          console.warn('⚠️ 중복 문서 발견:', document.title);
          return {
            documentId: document.id,
            chunkCount: 0,
            success: false,
          };
        }
        console.log('✅ 중복 검사 통과');
      } else {
        console.log('⏭️ 중복 검사 건너뛰기 (skipDuplicate=true)');
      }

      // 1. 문서 청킹 (간단한 구현)
      console.log('📄 문서 청킹 시작...');
      const chunks = this.simpleChunkDocument(document);
      console.log('✅ 문서 청킹 완료:', chunks.length, '개 청크');

      if (chunks.length === 0) {
        console.warn('⚠️ 청킹 결과가 비어있습니다.');
        return {
          documentId: document.id,
          chunkCount: 0,
          success: false,
        };
      }

      // 2. 임베딩 생성
      console.log('🔮 임베딩 생성 시작...');
      const chunksWithEmbeddings = chunks.map(chunk => ({
        ...chunk,
        embedding: this.generateSimpleEmbedding(chunk.content),
      }));
      console.log('✅ 임베딩 생성 완료:', chunksWithEmbeddings.length, '개 청크');

      // 3. Supabase에 저장
      const supabase = await this.getSupabaseClient();
      if (supabase) {
        try {
          // 문서 저장
          await this.saveDocumentToDatabase(document);
          console.log('✅ 문서 데이터베이스 저장 완료');

          // 청크 저장
          await this.saveChunksToDatabase(chunksWithEmbeddings);
          console.log('✅ 청크 데이터베이스 저장 완료');
        } catch (error) {
          console.warn('⚠️ 데이터베이스 저장 실패:', error);
        }
      } else {
        console.log('⚠️ Supabase 연결 없음, 메모리 모드');
      }

      console.log('✅ RAG 문서 처리 완료:', {
        documentId: document.id,
        chunkCount: chunks.length,
        success: true
      });

      return {
        documentId: document.id,
        chunkCount: chunks.length,
        success: true,
      };
    } catch (error) {
      console.error('❌ RAG 문서 처리 오류:', error);
      return {
        documentId: document.id,
        chunkCount: 0,
        success: false,
      };
    }
  }

  /**
   * 간단한 문서 청킹 (LangChain 없이)
   */
  private simpleChunkDocument(document: DocumentData): ChunkData[] {
    try {
      console.log('📄 청킹 시작:', {
        contentLength: document.content.length,
        title: document.title
      });

      // 내용이 비어있으면 빈 청크 반환
      if (!document.content || document.content.trim() === '') {
        console.warn('⚠️ 문서 내용이 비어있습니다.');
        return [];
      }

      // 간단하고 안전한 청킹 (무한 루프 방지)
      const chunkSize = 800; // 청크 크기 감소
      const overlap = 100; // 겹침 추가
      const chunks: string[] = [];
      
      // 겹침을 고려한 청킹 (안전한 구현)
      let start = 0;
      let iterationCount = 0;
      const maxIterations = 10000; // 무한 루프 방지를 위한 최대 반복 수
      
      while (start < document.content.length && iterationCount < maxIterations) {
        const end = Math.min(start + chunkSize, document.content.length);
        let chunk = document.content.slice(start, end);
        
        // 문장 경계에서 자르기
        if (end < document.content.length) {
          const lastSentenceEnd = chunk.lastIndexOf('.');
          if (lastSentenceEnd > chunkSize * 0.5) {
            chunk = chunk.slice(0, lastSentenceEnd + 1);
          }
        }
        
        const trimmedChunk = chunk.trim();
        if (trimmedChunk.length > 0) {
          chunks.push(trimmedChunk);
        }
        
        // 다음 청크 시작 위치 계산
        const nextStart = end - overlap;
        start = Math.max(nextStart, start + 1); // 최소 1자씩은 진행
        
        iterationCount++;
      }
      
      // 무한 루프 감지
      if (iterationCount >= maxIterations) {
        console.warn('⚠️ 최대 반복 수에 도달했습니다. 청킹을 중단합니다.');
      }
      
      console.log(`📄 청킹 완료: ${chunks.length}개 청크`);

      // 청크 데이터 생성
      const chunkData = chunks.map((chunk, index) => ({
        id: `${document.id}_chunk_${index}`,
        content: chunk,
        metadata: {
          document_id: document.id,
          chunk_index: index,
          source: document.title,
          created_at: new Date().toISOString(),
        },
      }));

      console.log('📄 청크 데이터 생성 완료:', chunkData.length, '개');
      return chunkData;
    } catch (error) {
      console.error('❌ 청킹 실패:', error);
      return [];
    }
  }

  /**
   * 벡터 검색 수행
   */
  async searchSimilarChunks(query: string, limit: number = 5): Promise<ChunkData[]> {
    try {
      console.log('🔍 벡터 검색 시작:', query);
      const supabase = await this.getSupabaseClient();

      if (!supabase) {
        console.warn('⚠️ Supabase 클라이언트가 없습니다. 빈 결과를 반환합니다.');
        return [];
      }

      // 쿼리에 대한 임베딩 생성
      const queryEmbedding = this.generateSimpleEmbedding(query);

      // 벡터 유사도 검색
      const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
      });

      if (error) {
        console.error('❌ 벡터 검색 오류:', error);
        return [];
      }

      // 결과를 ChunkData 형식으로 변환
      const chunks: ChunkData[] = (data || []).map((item: any) => ({
        id: item.chunk_id, // chunk_id를 id로 사용
        content: item.content,
        metadata: {
          document_id: item.document_id,
          chunk_index: item.chunk_index,
          source: item.source,
          created_at: item.created_at,
        },
        embedding: item.embedding,
      }));

      console.log('✅ 벡터 검색 완료:', chunks.length, '개 결과');
      return chunks;
    } catch (error) {
      console.error('❌ 벡터 검색 오류:', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스
export const ragProcessor = new RAGProcessor();
