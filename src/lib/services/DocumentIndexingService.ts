/**
 * 문서 인덱싱 서비스
 * 크롤링된 콘텐츠를 벡터 데이터베이스에 인덱싱
 */

import { createClient } from '@supabase/supabase-js';

export interface DocumentMetadata {
  source: string;
  title: string;
  type: string;
  lastUpdated: string;
  contentLength: number;
  crawledAt: string;
}

export class DocumentIndexingService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );
  }

  async indexCrawledContent(
    url: string, 
    content: string, 
    title: string, 
    metadata: DocumentMetadata
  ): Promise<void> {
    try {
      console.log(`📚 문서 인덱싱 시작: ${title}`);

      // 문서 ID 생성
      const documentId = `crawled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 문서 저장
      const { error: docError } = await this.supabase
        .from('documents')
        .insert({
          id: documentId,
          title: title,
          content: content,
          type: 'url',
          status: 'processing',
          chunk_count: 0,
          file_size: content.length,
          file_type: 'text/plain',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          url: url
        });

      if (docError) {
        throw new Error(`문서 저장 실패: ${docError.message}`);
      }

      // 텍스트 청킹
      const chunks = this.chunkText(content, url);
      console.log(`📝 청크 생성: ${chunks.length}개`);

      // 청크 배치 저장 (메모리 효율성 개선)
      const BATCH_SIZE = 20; // 배치 크기 제한 (메모리 보호)
      const embeddingDim = 1024; // 임베딩 차원
      
      console.log(`📦 청크 배치 저장 시작: ${chunks.length}개 청크, 배치 크기: ${BATCH_SIZE}`);
      
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        
        // 메모리 효율적인 임베딩 생성
        const batchData = batch.map((chunk, index) => {
          // 임베딩을 JSON 문자열로 저장 (데이터베이스 호환성)
          const embeddingArray = new Array(1024).fill(0);
          // documentId에서 crawled_ 접두사 제거
          const cleanDocumentId = documentId.replace(/^crawled_/, '');
          return {
            id: `chunk_${cleanDocumentId}_${i + index}`, // crawled_ 접두사 완전 제거
            document_id: documentId,
            chunk_id: i + index, // 정수로 유지
            content: chunk,
            embedding: JSON.stringify(embeddingArray), // JSON 문자열로 저장
            created_at: new Date().toISOString()
          };
        });

        try {
          const { error: batchError } = await this.supabase
            .from('document_chunks')
            .insert(batchData);

          if (batchError) {
            console.error(`❌ 청크 배치 ${Math.floor(i/BATCH_SIZE) + 1} 저장 실패:`, batchError);
            throw new Error(`청크 배치 저장 실패: ${batchError.message}`);
          }

          console.log(`✅ 청크 배치 ${Math.floor(i/BATCH_SIZE) + 1} 저장 완료: ${batch.length}개`);
        } catch (error) {
          console.error(`❌ 청크 배치 저장 중 오류:`, error);
          throw error;
        }
      }

      // 문서 상태 업데이트
      const { error: updateError } = await this.supabase
        .from('documents')
        .update({
          status: 'indexed',
          chunk_count: chunks.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        console.error(`문서 상태 업데이트 실패:`, updateError);
      }

      console.log(`✅ 문서 인덱싱 완료: ${title} (${chunks.length}개 청크)`);

    } catch (error) {
      console.error(`❌ 문서 인덱싱 실패: ${title}`, error);
      throw error;
    }
  }

  private chunkText(text: string, source: string): string[] {
    // 입력 검증
    if (!text || typeof text !== 'string') {
      console.warn('⚠️ 잘못된 텍스트 입력:', { text: typeof text, source });
      return [];
    }

    // 텍스트 길이 제한 (메모리 보호)
    const MAX_TEXT_LENGTH = 1000000; // 1MB 제한
    if (text.length > MAX_TEXT_LENGTH) {
      console.warn('⚠️ 텍스트가 너무 큼, 잘라서 처리:', { 
        originalLength: text.length, 
        maxLength: MAX_TEXT_LENGTH,
        source 
      });
      text = text.substring(0, MAX_TEXT_LENGTH);
    }

      const maxChunkSize = 1000;
      const overlap = 200;
      const chunks: string[] = [];

      try {
        let start = 0;
        let chunkCount = 0;
        const MAX_CHUNKS = 10000; // 최대 청크 수 제한 (원복)

      while (start < text.length && chunkCount < MAX_CHUNKS) {
        const end = Math.min(start + maxChunkSize, text.length);
        let chunk = text.slice(start, end);

        // 문장 경계에서 자르기
        if (end < text.length) {
          const lastSentenceEnd = chunk.lastIndexOf('.');
          if (lastSentenceEnd > maxChunkSize * 0.5) {
            chunk = chunk.slice(0, lastSentenceEnd + 1);
          }
        }

        const trimmedChunk = chunk.trim();
        if (trimmedChunk.length > 0) {
          chunks.push(trimmedChunk);
          chunkCount++;
        }

        start = end - overlap;
        
        // 무한 루프 방지
        if (start <= 0) {
          start = end;
        }
      }

      console.log(`📝 청킹 완료: ${chunks.length}개 청크 생성`, { 
        source, 
        originalLength: text.length,
        chunkCount: chunks.length 
      });

      return chunks.filter(chunk => chunk.length > 50);
    } catch (error) {
      console.error('❌ 청킹 중 오류:', error);
      return [];
    }
  }
}