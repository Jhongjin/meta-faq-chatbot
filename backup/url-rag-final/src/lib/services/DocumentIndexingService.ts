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

      // 청크 저장
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const { error: chunkError } = await this.supabase
          .from('document_chunks')
          .insert({
            id: `${documentId}_chunk_${i}`,
            document_id: documentId,
            chunk_id: i,
            content: chunk,
            embedding: new Array(768).fill(0), // 임시 임베딩
            created_at: new Date().toISOString()
          });

        if (chunkError) {
          console.error(`청크 ${i} 저장 실패:`, chunkError);
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
    const maxChunkSize = 1000;
    const overlap = 200;
    const chunks: string[] = [];

    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + maxChunkSize, text.length);
      let chunk = text.slice(start, end);

      // 문장 경계에서 자르기
      if (end < text.length) {
        const lastSentenceEnd = chunk.lastIndexOf('.');
        if (lastSentenceEnd > maxChunkSize * 0.5) {
          chunk = chunk.slice(0, lastSentenceEnd + 1);
        }
      }

      chunks.push(chunk.trim());
      start = end - overlap;
    }

    return chunks.filter(chunk => chunk.length > 50);
  }
}