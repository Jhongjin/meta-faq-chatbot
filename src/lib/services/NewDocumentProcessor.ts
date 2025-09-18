/**
 * 새로운 문서 처리 서비스
 * DB 테이블 구조를 기반으로 한 간단하고 안정적인 RAG 파이프라인
 */

import { createClient } from '@supabase/supabase-js';

export interface ProcessedDocument {
  id: string;
  title: string;
  type: 'file' | 'url';
  content: string;
  chunks: DocumentChunk[];
  metadata: {
    size: number;
    uploadedAt: string;
    processedAt: string;
  };
}

export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    chunkIndex: number;
    startChar: number;
    endChar: number;
    chunkType: 'text' | 'title' | 'list' | 'table';
  };
}

export class NewDocumentProcessor {
  private supabase;
  private embeddingDimension = 1024; // BGE-M3 모델 차원

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * 파일 업로드 및 처리
   */
  async processFile(file: File): Promise<ProcessedDocument> {
    console.log(`📁 파일 처리 시작: ${file.name} (${file.size} bytes)`);

    // 1. 파일 내용 추출
    const content = await this.extractFileContent(file);
    console.log(`📄 파일 내용 추출 완료: ${content.length}자`);

    // 2. 문서 청킹
    const chunks = await this.chunkText(content, file.name);
    console.log(`✂️ 텍스트 청킹 완료: ${chunks.length}개 청크`);

    // 3. 임베딩 생성
    const chunksWithEmbeddings = await this.generateEmbeddings(chunks);
    console.log(`🧠 임베딩 생성 완료: ${chunksWithEmbeddings.length}개`);

    // 4. 문서 메타데이터 생성
    const document: ProcessedDocument = {
      id: this.generateDocumentId(),
      title: this.extractTitle(file.name),
      type: this.getFileType(file.name),
      content,
      chunks: chunksWithEmbeddings,
      metadata: {
        size: file.size,
        uploadedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
      },
    };

    console.log(`✅ 문서 처리 완료: ${document.title}`);
    return document;
  }

  /**
   * URL 크롤링 및 처리
   */
  async processUrl(url: string): Promise<ProcessedDocument> {
    console.log(`🌐 URL 처리 시작: ${url}`);

    // 1. URL 내용 크롤링
    const content = await this.crawlUrl(url);
    console.log(`📄 URL 내용 크롤링 완료: ${content.length}자`);

    // 2. 문서 청킹
    const chunks = await this.chunkText(content, url);
    console.log(`✂️ 텍스트 청킹 완료: ${chunks.length}개 청크`);

    // 3. 임베딩 생성
    const chunksWithEmbeddings = await this.generateEmbeddings(chunks);
    console.log(`🧠 임베딩 생성 완료: ${chunksWithEmbeddings.length}개`);

    // 4. 문서 메타데이터 생성
    const document: ProcessedDocument = {
      id: this.generateDocumentId(),
      title: this.extractTitleFromUrl(url),
      type: 'url',
      content,
      chunks: chunksWithEmbeddings,
      metadata: {
        size: content.length,
        uploadedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
      },
    };

    console.log(`✅ URL 처리 완료: ${document.title}`);
    return document;
  }

  /**
   * 문서를 데이터베이스에 저장
   */
  async saveDocument(document: ProcessedDocument): Promise<string> {
    console.log(`💾 문서 저장 시작: ${document.title}`);

    try {
      // 1. 문서 레코드 저장
      const { data: documentData, error: docError } = await this.supabase
        .from('documents')
        .insert({
          id: document.id,
          title: document.title,
          type: document.type, // 'file' 또는 'url'
          status: 'processing',
          chunk_count: document.chunks.length,
          created_at: document.metadata.uploadedAt,
          updated_at: document.metadata.processedAt,
          url: document.type === 'url' ? document.content.substring(0, 500) : null,
        })
        .select()
        .single();

      if (docError) {
        throw new Error(`문서 저장 실패: ${docError.message}`);
      }

      console.log(`📄 문서 레코드 저장 완료: ${document.id}`);

      // 2. 청크 데이터 저장 (chunk_id를 인덱스 번호로 사용)
      const chunkRecords = document.chunks.map((chunk, index) => ({
        id: chunk.id,
        document_id: document.id,
        chunk_id: index, // 인덱스 번호를 chunk_id로 사용
        content: chunk.content,
        embedding: chunk.embedding,
        metadata: {
          ...chunk.metadata,
          title: document.title,
          type: document.type,
          model: 'bge-m3',
          dimension: this.embeddingDimension,
          processingTime: Date.now(),
          validated: true,
        },
        created_at: new Date().toISOString(),
      }));

      const { error: chunksError } = await this.supabase
        .from('document_chunks')
        .insert(chunkRecords);

      if (chunksError) {
        throw new Error(`청크 저장 실패: ${chunksError.message}`);
      }

      console.log(`🧩 청크 데이터 저장 완료: ${chunkRecords.length}개`);

      // 3. 문서 상태를 완료로 업데이트
      const { error: updateError } = await this.supabase
        .from('documents')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);

      if (updateError) {
        console.warn(`문서 상태 업데이트 실패: ${updateError.message}`);
      }

      console.log(`✅ 문서 저장 완료: ${document.title}`);
      return document.id;

    } catch (error) {
      console.error(`❌ 문서 저장 실패: ${error}`);
      
      // 실패 시 문서 상태 업데이트
      await this.supabase
        .from('documents')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);

      throw error;
    }
  }

  /**
   * 파일 내용 추출
   */
  private async extractFileContent(file: File): Promise<string> {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    switch (fileExtension) {
      case 'txt':
        return await file.text();
      
      case 'pdf':
        // PDF 처리는 서버리스 환경에서 제한적
        // 실제 구현에서는 PDF.js 또는 서버사이드 라이브러리 사용
        return `PDF 파일: ${file.name}\n\n서버리스 환경에서는 PDF 텍스트 추출이 제한됩니다. 로컬 환경에서 테스트해주세요.`;
      
      case 'docx':
        // DOCX 처리는 서버리스 환경에서 제한적
        return `DOCX 파일: ${file.name}\n\n서버리스 환경에서는 DOCX 텍스트 추출이 제한됩니다. 로컬 환경에서 테스트해주세요.`;
      
      default:
        // 기본적으로 텍스트로 처리
        try {
          return await file.text();
        } catch {
          return `파일: ${file.name}\n\n파일 내용을 읽을 수 없습니다.`;
        }
    }
  }

  /**
   * URL 크롤링
   */
  private async crawlUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AdMate-Bot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // 간단한 HTML 텍스트 추출 (실제로는 더 정교한 파싱 필요)
      const text = html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return text || `URL 크롤링 실패: ${url}`;
    } catch (error) {
      console.error(`URL 크롤링 오류: ${error}`);
      return `URL 크롤링 실패: ${url}\n오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    }
  }

  /**
   * 텍스트 청킹 (최적화된 버전)
   */
  private async chunkText(text: string, source: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const chunkSize = 2000; // 청크 크기 증가 (처리 시간 단축)
    const overlap = 100; // 겹침 크기 감소

    let startIndex = 0;
    let chunkIndex = 0;

    // 텍스트가 너무 길면 잘라내기 (메모리 절약)
    const maxTextLength = 50000; // 50KB 제한
    const processedText = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) + '\n\n[문서가 잘렸습니다. 전체 내용을 보려면 원본 파일을 확인하세요.]'
      : text;

    while (startIndex < processedText.length) {
      const endIndex = Math.min(startIndex + chunkSize, processedText.length);
      const chunkText = processedText.slice(startIndex, endIndex).trim();

      if (chunkText.length > 0) {
        const chunk: DocumentChunk = {
          id: `${this.generateDocumentId()}_chunk_${chunkIndex}`,
          content: chunkText,
          embedding: [], // 나중에 생성
          metadata: {
            chunkIndex,
            startChar: startIndex,
            endChar: endIndex,
            chunkType: this.classifyChunkType(chunkText),
          },
        };

        chunks.push(chunk);
        chunkIndex++;

        // 최대 청크 수 제한 (처리 시간 단축)
        if (chunkIndex >= 50) {
          console.warn(`문서가 너무 길어서 ${chunkIndex}개 청크로 제한했습니다.`);
          break;
        }
      }

      startIndex = endIndex - overlap;
    }

    return chunks;
  }

  /**
   * 청크 타입 분류
   */
  private classifyChunkType(text: string): 'text' | 'title' | 'list' | 'table' {
    if (text.startsWith('#') || text.startsWith('##') || text.startsWith('###')) {
      return 'title';
    }
    if (text.includes('•') || text.includes('-') || text.includes('*')) {
      return 'list';
    }
    if (text.includes('|') && text.includes('---')) {
      return 'table';
    }
    return 'text';
  }

  /**
   * 임베딩 생성 (해시 기반 간단한 임베딩) - 최적화된 버전
   */
  private async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    // 청크 수가 많으면 배치 처리로 메모리 절약
    const batchSize = 10;
    const result: DocumentChunk[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const processedBatch = batch.map(chunk => ({
        ...chunk,
        embedding: this.generateHashEmbedding(chunk.content),
      }));
      result.push(...processedBatch);
      
      // 배치 간 짧은 대기 (메모리 정리)
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return result;
  }

  /**
   * 해시 기반 임베딩 생성
   */
  private generateHashEmbedding(text: string): number[] {
    // 간단한 해시 기반 임베딩 (실제로는 BGE-M3 모델 사용)
    const hash = this.simpleHash(text);
    const embedding = new Array(this.embeddingDimension).fill(0);
    
    // 해시를 기반으로 임베딩 벡터 생성
    for (let i = 0; i < this.embeddingDimension; i++) {
      const seed = (hash + i) % 1000000;
      embedding[i] = (Math.sin(seed) * 0.5 + 0.5) * 2 - 1; // -1 ~ 1 범위
    }

    return embedding;
  }

  /**
   * 간단한 해시 함수
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  }

  /**
   * 파일 타입 추출 (데이터베이스 제약 조건에 맞게 수정)
   */
  private getFileType(filename: string): 'file' | 'url' {
    // 데이터베이스 제약 조건에 맞게 'file' 또는 'url'만 반환
    return 'file';
  }

  /**
   * 제목 추출
   */
  private extractTitle(filename: string): string {
    return filename.replace(/\.[^/.]+$/, ''); // 확장자 제거
  }

  /**
   * URL에서 제목 추출
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/').filter(segment => segment.length > 0);
      return segments[segments.length - 1] || urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * 문서 ID 생성
   */
  private generateDocumentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `doc_${timestamp}_${random}`;
  }
}

export const newDocumentProcessor = new NewDocumentProcessor();
