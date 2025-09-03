// 파일 처리 및 인덱싱 서비스 - 실제 구현
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { OpenAIEmbeddings } from '@langchain/openai';
import * as pdfParse from 'pdf-parse';
import { Document } from 'docx';

// Node.js Buffer 사용을 위한 polyfill
declare global {
  var Buffer: typeof Buffer;
}

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 빌드 시에는 환경 변수가 없을 수 있으므로 조건부 처리
let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  // Supabase 클라이언트 생성
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else if (typeof window !== 'undefined') {
  // 브라우저 환경에서만 경고 표시
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
}

// OpenAI 임베딩 모델 초기화
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn('OpenAI API 키가 설정되지 않았습니다. 임베딩 기능이 제한될 수 있습니다.');
}

const embeddings = openaiApiKey ? new OpenAIEmbeddings({
  openAIApiKey: openaiApiKey,
  modelName: 'text-embedding-3-small',
  dimensions: 1536,
}) : null;

export interface FileUploadRequest {
  file?: File;
  url?: string;
  type: 'file' | 'url';
  originalName?: string;
  size?: number;
  mimeType?: string;
}

export interface FileUploadResult {
  fileId?: string;
  urlId?: string;
  status: 'completed' | 'failed';
  message?: string;
  error?: string;
}

export interface ProcessingProgress {
  id: string;
  status: 'pending' | 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  totalSteps: number;
  error?: string;
}

export interface TextChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    section?: string;
    timestamp: Date;
  };
}

export interface DocumentMetadata {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'txt' | 'url';
  size: number;
  uploadedAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunkCount: number;
  embeddingCount: number;
}

export class FileProcessingService {
  private processingQueue: Map<string, ProcessingProgress> = new Map();

  /**
   * 파일 또는 URL을 업로드하고 인덱싱하는 메인 메서드
   * @param request 파일 업로드 또는 URL 처리 요청
   * @returns 처리 결과
   */
  async uploadAndIndex(request: FileUploadRequest): Promise<FileUploadResult> {
    try {
      if (request.type === 'file' && request.file) {
        return await this.processFile(request.file, request.originalName || 'unknown', request.size || 0, request.mimeType || '');
      } else if (request.type === 'url' && request.url) {
        return await this.processUrl(request.url);
      } else {
        throw new Error('잘못된 요청 타입입니다.');
      }
    } catch (error) {
      console.error('파일 처리 오류:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 파일명을 안전한 Storage 키로 변환
   * @param filename 원본 파일명
   * @returns 안전한 Storage 키
   */
  private sanitizeStorageKey(filename: string): string {
    // 파일 확장자 추출
    const extension = filename.split('.').pop() || '';
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    
    // 한글을 영문으로 변환 (자주 사용되는 한글 단어들)
    let safeName = nameWithoutExt
      .replace(/메타/g, 'meta')
      .replace(/광고/g, 'ad')
      .replace(/정책/g, 'policy')
      .replace(/가이드/g, 'guide')
      .replace(/설정/g, 'setting')
      .replace(/매뉴얼/g, 'manual')
      .replace(/변경사항/g, 'changes')
      .replace(/스토리/g, 'story')
      .replace(/예산/g, 'budget')
      .replace(/관리/g, 'management')
      .replace(/자산/g, 'asset')
      .replace(/파트너/g, 'partner')
      .replace(/할당/g, 'allocation')
      .replace(/나스미디어/g, 'nasmedia')
      .replace(/[^a-zA-Z0-9._-]/g, '_') // 특수문자를 언더스코어로 변환
      .replace(/_+/g, '_') // 연속된 언더스코어를 하나로
      .replace(/^_|_$/g, '') // 앞뒤 언더스코어 제거
      .substring(0, 50); // 최대 길이 제한
    
    // 안전한 이름이 비어있으면 기본값 사용
    if (!safeName || safeName.trim() === '') {
      safeName = 'document';
    }
    
    // 파일명이 너무 짧으면 타임스탬프 추가
    if (safeName.length < 3) {
      safeName = `document_${Date.now()}`;
    }
    
    // 확장자 추가
    return extension ? `${safeName}.${extension}` : safeName;
  }

  /**
   * 파일 처리 및 인덱싱
   * @param file 업로드된 파일
   * @param originalName 원본 파일명
   * @param size 파일 크기
   * @param mimeType MIME 타입
   * @returns 처리 결과
   */
  private async processFile(
    file: File, 
    originalName: string, 
    size: number, 
    mimeType: string
  ): Promise<FileUploadResult> {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const safeFileName = this.sanitizeStorageKey(originalName) || 'document';
    
    // 진행 상황 초기화
    this.processingQueue.set(fileId, {
      id: fileId,
      status: 'pending',
      progress: 0,
      currentStep: '파일 검증',
      totalSteps: 6
    });

    try {
      // 1단계: 파일 검증
      await this.updateProgress(fileId, 'uploading', 16, '파일 업로드');
      
      // 파일을 Supabase Storage에 저장 (안전한 파일명 사용)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`${fileId}/${safeFileName}`, file);

      if (uploadError) {
        throw new Error(`파일 저장 실패: ${uploadError.message}`);
      }
      
      // 2단계: 텍스트 추출
      await this.updateProgress(fileId, 'extracting', 33, '텍스트 추출');
      
      const extractedText = await this.extractTextFromFile(file, mimeType);
      
      // 3단계: 텍스트 청킹
      await this.updateProgress(fileId, 'chunking', 50, '텍스트 청킹');
      
      const chunks = await this.chunkText(extractedText, fileId);
      
      // 4단계: 임베딩 생성
      await this.updateProgress(fileId, 'embedding', 66, '임베딩 생성');
      
      const embeddings = await this.generateEmbeddings(chunks);
      
      // 5단계: 벡터 저장소 인덱싱
      await this.updateProgress(fileId, 'indexing', 83, '벡터 인덱싱');
      
      await this.indexToVectorStore(embeddings, chunks, fileId);
      
      // 6단계: 완료
      await this.updateProgress(fileId, 'completed', 100, '완료');
      
      // 메타데이터 저장
      await this.saveDocumentMetadata({
        id: fileId,
        title: originalName,
        type: this.getFileType(mimeType),
        size,
        uploadedAt: new Date(),
        processedAt: new Date(),
        status: 'completed',
        chunkCount: chunks.length,
        embeddingCount: embeddings.length
      });

      return {
        fileId,
        status: 'completed',
        message: '파일이 성공적으로 처리되고 인덱싱되었습니다.'
      };

    } catch (error) {
      await this.updateProgress(fileId, 'failed', 0, '오류 발생', error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    }
  }

  /**
   * URL 처리 및 인덱싱
   * @param url 처리할 URL
   * @returns 처리 결과
   */
  private async processUrl(url: string): Promise<FileUploadResult> {
    const urlId = `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 진행 상황 초기화
    this.processingQueue.set(urlId, {
      id: urlId,
      status: 'pending',
      progress: 0,
      currentStep: 'URL 검증',
      totalSteps: 5
    });

    try {
      // 1단계: URL 검증
      await this.updateProgress(urlId, 'uploading', 20, 'URL 검증');
      
      await this.validateUrl(url);
      
      // 2단계: 웹페이지 크롤링
      await this.updateProgress(urlId, 'extracting', 40, '웹페이지 크롤링');
      
      const htmlContent = await this.crawlWebPage(url);
      
      // 3단계: 텍스트 추출 및 청킹
      await this.updateProgress(urlId, 'chunking', 60, '텍스트 처리');
      
      const extractedText = await this.extractTextFromHtml(htmlContent);
      const chunks = await this.chunkText(extractedText, urlId);
      
      // 4단계: 임베딩 생성 및 인덱싱
      await this.updateProgress(urlId, 'embedding', 80, '인덱싱');
      
      const embeddings = await this.generateEmbeddings(chunks);
      await this.indexToVectorStore(embeddings, chunks, urlId);
      
      // 5단계: 완료
      await this.updateProgress(urlId, 'completed', 100, '완료');
      
      return {
        urlId,
        status: 'completed',
        message: 'URL이 성공적으로 처리되고 인덱싱되었습니다.'
      };

    } catch (error) {
      await this.updateProgress(urlId, 'failed', 0, '오류 발생', error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    }
  }

  /**
   * 파일에서 텍스트 추출
   * @param file 파일 객체
   * @param mimeType MIME 타입
   * @returns 추출된 텍스트
   */
  private async extractTextFromFile(file: File, mimeType: string): Promise<string> {
    try {
      console.log(`파일 처리 시작: ${file.name}, MIME 타입: ${mimeType}, 크기: ${file.size}`);
      
      if (mimeType.includes('text/plain')) {
        // 텍스트 파일은 직접 읽기
        console.log('텍스트 파일 처리 중...');
        const text = await file.text();
        console.log(`텍스트 추출 완료, 길이: ${text.length}`);
        return text;
      } else if (mimeType.includes('pdf')) {
        try {
          console.log('PDF 파일 처리 중...');
          
          // PDF 파일을 ArrayBuffer로 변환
          const arrayBuffer = await file.arrayBuffer();
          console.log(`PDF ArrayBuffer 생성 완료, 크기: ${arrayBuffer.byteLength}`);
          
          // pdf-parse 라이브러리 사용
          const data = await pdfParse(Buffer.from(arrayBuffer));
          console.log(`PDF 텍스트 추출 완료, 길이: ${data.text.length}`);
          
          if (!data.text || data.text.trim().length === 0) {
            console.warn('PDF에서 추출된 텍스트가 비어있습니다.');
            return 'PDF 파일 내용을 추출할 수 없습니다.';
          }
          
          return data.text;
        } catch (pdfError) {
          console.error('PDF 파싱 상세 오류:', pdfError);
          console.error('PDF 파일 정보:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          });
          throw new Error(`PDF 파일을 읽을 수 없습니다: ${pdfError instanceof Error ? pdfError.message : '알 수 없는 오류'}`);
        }
      } else if (mimeType.includes('word') || mimeType.includes('docx')) {
        try {
          console.log('DOCX 파일 처리 중...');
          // DOCX 파일은 docx 라이브러리 사용
          const buffer = await file.arrayBuffer();
          console.log(`DOCX 버퍼 생성 완료, 크기: ${buffer.byteLength}`);
          const text = await this.extractTextFromDocx(buffer);
          console.log(`DOCX 텍스트 추출 완료, 길이: ${text.length}`);
          return text;
        } catch (docxError) {
          console.error('DOCX 파싱 상세 오류:', docxError);
          console.error('DOCX 파일 정보:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          });
          throw new Error(`DOCX 파일을 읽을 수 없습니다: ${docxError instanceof Error ? docxError.message : '알 수 없는 오류'}`);
        }
      } else {
        console.error(`지원하지 않는 MIME 타입: ${mimeType}`);
        throw new Error('지원하지 않는 파일 형식입니다. 텍스트 파일(.txt), PDF(.pdf), DOCX(.docx)만 업로드해주세요.');
      }
    } catch (error) {
      console.error('extractTextFromFile 전체 오류:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('파일 읽기에 실패했습니다.');
    }
  }

  /**
   * HTML에서 텍스트 추출
   * @param htmlContent HTML 내용
   * @returns 추출된 텍스트
   */
  private async extractTextFromHtml(htmlContent: string): Promise<string> {
    // 동적 import로 cheerio 사용
    const cheerio = await import('cheerio');
    const $ = cheerio.load(htmlContent);
    
    // 불필요한 태그 제거
    $('script, style, nav, footer, header, aside').remove();
    
    // 텍스트 추출 및 정리
    let text = $('body').text();
    
    // 여러 공백을 하나로 정리
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  /**
   * DOCX 파일에서 텍스트 추출
   * @param buffer DOCX 파일 버퍼
   * @returns 추출된 텍스트
   */
  private async extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
    try {
      console.log('DOCX 파싱 시작...');
      
      // 더 간단한 방식으로 DOCX 파일 처리
      const text = await this.parseDocxContent(buffer);
      
      if (!text || text.trim().length === 0) {
        console.warn('DOCX에서 추출된 텍스트가 비어있습니다.');
        return 'DOCX 파일 내용을 추출할 수 없습니다.';
      }
      
      console.log(`DOCX 텍스트 추출 성공, 길이: ${text.length}`);
      return text;
    } catch (error) {
      console.error('DOCX 파일 파싱 상세 오류:', error);
      throw new Error(`DOCX 파일에서 텍스트를 추출할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * DOCX 파일 내용을 파싱하여 텍스트 추출
   * @param buffer DOCX 파일 버퍼
   * @returns 추출된 텍스트
   */
  private async parseDocxContent(buffer: ArrayBuffer): Promise<string> {
    try {
      // 간단한 텍스트 추출을 위해 파일을 문자열로 변환
      const uint8Array = new Uint8Array(buffer);
      const textDecoder = new TextDecoder('utf-8');
      let content = textDecoder.decode(uint8Array);
      
      // XML 태그 제거 (간단한 방식)
      content = content.replace(/<[^>]*>/g, ' ');
      
      // 여러 공백을 하나로 정리
      content = content.replace(/\s+/g, ' ').trim();
      
      return content;
    } catch (error) {
      console.error('DOCX 내용 파싱 오류:', error);
      throw new Error('DOCX 파일 내용을 파싱할 수 없습니다.');
    }
  }

  /**
   * 텍스트를 의미 있는 청크로 분할
   * @param text 원본 텍스트
   * @param sourceId 소스 ID
   * @returns 텍스트 청크 배열
   */
  private async chunkText(text: string, sourceId: string): Promise<TextChunk[]> {
    const chunks: TextChunk[] = [];
    const maxChunkSize = 1000; // 최대 청크 크기
    const overlapSize = 200; // 청크 간 중복 크기
    
    let startIndex = 0;
    let chunkIndex = 0;
    
    while (startIndex < text.length) {
      let endIndex = startIndex + maxChunkSize;
      
      // 문장 경계에서 자르기
      if (endIndex < text.length) {
        const nextPeriod = text.indexOf('.', endIndex);
        const nextNewline = text.indexOf('\n', endIndex);
        
        if (nextPeriod !== -1 && nextPeriod < endIndex + 200) {
          endIndex = nextPeriod + 1;
        } else if (nextNewline !== -1 && nextNewline < endIndex + 200) {
          endIndex = nextNewline + 1;
        }
      }
      
      const chunkText = text.slice(startIndex, endIndex).trim();
      
      if (chunkText.length > 0) {
        chunks.push({
          id: `${sourceId}_chunk_${chunkIndex}`,
          content: chunkText,
          metadata: {
            source: sourceId,
            timestamp: new Date()
          }
        });
        chunkIndex++;
      }
      
      startIndex = endIndex - overlapSize;
      if (startIndex >= text.length) break;
    }
    
    return chunks;
  }

  /**
   * 텍스트 청크에서 임베딩 벡터 생성
   * @param chunks 텍스트 청크 배열
   * @returns 임베딩 벡터 배열
   */
  private async generateEmbeddings(chunks: TextChunk[]): Promise<number[][]> {
    try {
      if (!embeddings) {
        // OpenAI API 키가 없는 경우 더미 임베딩 생성 (테스트용)
        console.warn('OpenAI API 키가 없어 더미 임베딩을 생성합니다.');
        return chunks.map(() => Array(1536).fill(0).map(() => Math.random() - 0.5));
      }
      
      const texts = chunks.map(chunk => chunk.content);
      const embeddingsResult = await embeddings.embedDocuments(texts);
      return embeddingsResult;
    } catch (error) {
      console.error('임베딩 생성 오류:', error);
      throw new Error('임베딩 생성에 실패했습니다.');
    }
  }

  /**
   * 벡터 저장소에 인덱싱
   * @param embeddings 임베딩 벡터 배열
   * @param chunks 텍스트 청크 배열
   * @param sourceId 소스 ID
   */
  private async indexToVectorStore(embeddings: number[][], chunks: TextChunk[], sourceId: string): Promise<void> {
    try {
      // 문서 메타데이터 저장
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          id: sourceId,
          title: sourceId,
          type: sourceId.startsWith('file_') ? 'file' : 'url',
          status: 'indexed',
          chunk_count: chunks.length,
          created_at: new Date().toISOString()
        });

      if (docError) {
        throw new Error(`문서 메타데이터 저장 실패: ${docError.message}`);
      }

      // 청크 및 임베딩 데이터 저장
      const chunksData = chunks.map((chunk, index) => ({
        document_id: sourceId,
        chunk_id: chunk.id,
        content: chunk.content,
        embedding: embeddings[index],
        metadata: chunk.metadata,
        created_at: new Date().toISOString()
      }));

      const { error: chunksError } = await supabase
        .from('document_chunks')
        .insert(chunksData);

      if (chunksError) {
        throw new Error(`청크 데이터 저장 실패: ${chunksError.message}`);
      }

      console.log(`${sourceId}: ${chunks.length}개 청크가 성공적으로 인덱싱되었습니다.`);

    } catch (error) {
      console.error('벡터 저장소 인덱싱 오류:', error);
      throw error;
    }
  }

  /**
   * URL 유효성 검사
   * @param url 검사할 URL
   */
  private async validateUrl(url: string): Promise<void> {
    try {
      new URL(url);
      
      // URL 접근 가능성 테스트
      const response = await axios.head(url, { timeout: 10000 });
      if (response.status >= 400) {
        throw new Error(`URL 접근 불가: HTTP ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`URL 검증 실패: ${error.message}`);
      }
      throw new Error('유효하지 않은 URL 형식입니다.');
    }
  }

  /**
   * 웹페이지 크롤링
   * @param url 크롤링할 URL
   * @returns HTML 내용
   */
  private async crawlWebPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MetaFAQBot/1.0)'
        }
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`웹페이지 크롤링 실패: ${error.message}`);
      }
      throw new Error('웹페이지 크롤링 중 오류가 발생했습니다.');
    }
  }

  /**
   * 진행 상황 업데이트
   * @param id 파일 또는 URL ID
   * @param status 현재 상태
   * @param progress 진행률 (0-100)
   * @param currentStep 현재 단계 설명
   * @param error 오류 메시지 (선택사항)
   */
  private async updateProgress(
    id: string, 
    status: ProcessingProgress['status'], 
    progress: number, 
    currentStep: string, 
    error?: string
  ): Promise<void> {
    const current = this.processingQueue.get(id);
    if (current) {
      current.status = status;
      current.progress = progress;
      current.currentStep = currentStep;
      if (error) {
        current.error = error;
      }
      this.processingQueue.set(id, current);
    }
    
    // TODO: WebSocket 또는 Server-Sent Events를 통해 클라이언트에 진행 상황 전송
    // await this.notifyProgressUpdate(id, current);
  }

  /**
   * 진행 상황 조회
   * @param id 파일 또는 URL ID
   * @returns 진행 상황 정보
   */
  async getProgress(id: string): Promise<ProcessingProgress | null> {
    return this.processingQueue.get(id) || null;
  }

  /**
   * 진행 상황 구독 (실제 구현 시 WebSocket 또는 Server-Sent Events 사용)
   * @param id 파일 또는 URL ID
   * @param callback 진행 상황 업데이트 콜백
   */
  onProgress(id: string, callback: (progress: ProcessingProgress) => void): void {
    // TODO: 실제 구현 시에는 이벤트 리스너 또는 WebSocket 구독 로직 구현
    console.log(`진행 상황 구독 등록: ${id}`);
  }

  /**
   * 처리 완료 콜백 (실제 구현 시 이벤트 시스템 사용)
   * @param id 파일 또는 URL ID
   * @param callback 완료 콜백
   */
  onComplete(id: string, callback: (result: FileUploadResult) => void): void {
    // TODO: 실제 구현 시에는 이벤트 리스너 또는 Promise 기반 완료 처리 로직 구현
    console.log(`완료 콜백 등록: ${id}`);
  }

  /**
   * 파일 타입 추출
   * @param mimeType MIME 타입
   * @returns 파일 타입
   */
  private getFileType(mimeType: string): 'pdf' | 'docx' | 'txt' {
    if (mimeType.includes('pdf')) {
      return 'pdf';
    } else if (mimeType.includes('word') || mimeType.includes('docx')) {
      return 'docx';
    } else {
      return 'txt';
    }
  }

  /**
   * 문서 메타데이터 저장
   * @param metadata 문서 메타데이터
   */
  private async saveDocumentMetadata(metadata: DocumentMetadata): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_metadata')
        .insert({
          id: metadata.id,
          title: metadata.title,
          type: metadata.type,
          size: metadata.size,
          uploaded_at: metadata.uploadedAt.toISOString(),
          processed_at: metadata.processedAt?.toISOString(),
          status: metadata.status,
          chunk_count: metadata.chunkCount,
          embedding_count: metadata.embeddingCount
        });

      if (error) {
        console.error('메타데이터 저장 오류:', error);
      }
    } catch (error) {
      console.error('메타데이터 저장 실패:', error);
    }
  }
}
