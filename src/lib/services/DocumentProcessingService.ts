// Playwright 대신 간단한 HTTP 요청 사용
import Tesseract from 'tesseract.js';
import pdf from 'pdf-parse';
import * as mammoth from 'mammoth';

// Next.js 환경에서 Buffer 사용을 위한 polyfill
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = require('buffer').Buffer;
}

export interface ProcessedDocument {
  content: string;
  metadata: {
    title: string;
    type: 'pdf' | 'docx' | 'txt' | 'url';
    size: number;
    pages?: number;
    extractedAt: string;
    source: string;
  };
  chunks: DocumentChunk[];
}

export interface DocumentChunk {
  content: string;
  metadata: {
    chunkIndex: number;
    startChar: number;
    endChar: number;
    pageNumber?: number;
  };
}

export class DocumentProcessingService {
  /**
   * PDF 파일을 텍스트로 추출
   */
  async processPDF(file: File): Promise<ProcessedDocument> {
    try {
      console.log(`PDF 처리 시작: ${file.name} (${file.size} bytes)`);
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Buffer 생성 시 안전한 방법 사용
      let buffer: Buffer;
      try {
        buffer = Buffer.from(arrayBuffer);
      } catch (bufferError) {
        console.error('Buffer 생성 실패:', bufferError);
        // Uint8Array를 사용한 대안 방법
        const uint8Array = new Uint8Array(arrayBuffer);
        buffer = Buffer.from(uint8Array);
      }
      
      console.log(`Buffer 생성 완료: ${buffer.length} bytes`);
      
      // PDF 파싱
      const data = await pdf(buffer);
      const content = data.text.trim();
      
      if (!content || content.length === 0) {
        throw new Error('PDF 파일에서 텍스트를 추출할 수 없습니다.');
      }

      const chunks = this.createChunks(content, 'pdf');

      console.log(`PDF 처리 완료: ${file.name} - ${content.length}자`);

      return {
        content,
        metadata: {
          title: file.name,
          type: 'pdf',
          size: file.size,
          pages: data.numpages,
          extractedAt: new Date().toISOString(),
          source: 'file_upload'
        },
        chunks
      };
    } catch (error) {
      console.error(`PDF 처리 실패: ${file.name}`, error);
      console.error('PDF 처리 상세 에러:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      throw new Error(`PDF 처리 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * DOCX 파일을 텍스트로 추출
   */
  async processDOCX(file: File): Promise<ProcessedDocument> {
    try {
      console.log(`DOCX 처리 시작: ${file.name} (${file.size} bytes)`);
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Buffer 생성 시 안전한 방법 사용
      let buffer: Buffer;
      try {
        buffer = Buffer.from(arrayBuffer);
      } catch (bufferError) {
        console.error('Buffer 생성 실패:', bufferError);
        // Uint8Array를 사용한 대안 방법
        const uint8Array = new Uint8Array(arrayBuffer);
        buffer = Buffer.from(uint8Array);
      }
      
      console.log(`Buffer 생성 완료: ${buffer.length} bytes`);
      
      // DOCX 파싱
      const result = await mammoth.extractRawText({ 
        buffer,
        // 추가 옵션들
        includeEmbeddedStyleMap: true,
        includeDefaultStyleMap: true
      });

      const content = result.value.trim();
      
      if (!content || content.length === 0) {
        throw new Error('DOCX 파일에서 텍스트를 추출할 수 없습니다.');
      }

      const chunks = this.createChunks(content, 'docx');

      console.log(`DOCX 처리 완료: ${file.name} - ${content.length}자`);

      return {
        content,
        metadata: {
          title: file.name,
          type: 'docx',
          size: file.size,
          extractedAt: new Date().toISOString(),
          source: 'file_upload'
        },
        chunks
      };
    } catch (error) {
      console.error(`DOCX 처리 실패: ${file.name}`, error);
      console.error('DOCX 처리 상세 에러:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      throw new Error(`DOCX 처리 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * TXT 파일을 텍스트로 추출
   */
  async processTXT(file: File): Promise<ProcessedDocument> {
    try {
      console.log(`TXT 처리 시작: ${file.name} (${file.size} bytes)`);
      
      const content = await file.text();
      
      if (!content || content.trim().length === 0) {
        throw new Error('TXT 파일이 비어있습니다.');
      }

      const chunks = this.createChunks(content, 'txt');

      console.log(`TXT 처리 완료: ${file.name} - ${content.length}자`);

      return {
        content,
        metadata: {
          title: file.name,
          type: 'txt',
          size: file.size,
          extractedAt: new Date().toISOString(),
          source: 'file_upload'
        },
        chunks
      };
    } catch (error) {
      console.error(`TXT 처리 실패: ${file.name}`, error);
      throw new Error(`TXT 처리 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * URL에서 텍스트 추출 (간단한 HTTP 요청 사용)
   */
  async processURL(url: string): Promise<ProcessedDocument> {
    try {
      console.log(`URL 처리 시작: ${url}`);
      
      // 다양한 User-Agent 시도
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
      ];

      let response: Response | null = null;
      let lastError: Error | null = null;

      // 여러 User-Agent로 시도
      for (const userAgent of userAgents) {
        try {
          response = await fetch(url, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
              'Accept-Encoding': 'gzip, deflate, br',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            },
            // timeout: 10000 // 10초 타임아웃 - fetch API에서는 timeout 옵션이 없음
          });

          if (response.ok) {
            break;
          }
        } catch (error) {
          lastError = error as Error;
          console.warn(`User-Agent ${userAgent}로 시도 실패:`, error);
          continue;
        }
      }

      if (!response || !response.ok) {
        const errorMsg = lastError ? lastError.message : `HTTP ${response?.status}: ${response?.statusText}`;
        throw new Error(`URL 접근 실패: ${errorMsg}`);
      }

      const html = await response.text();
      
      // 간단한 HTML 파싱으로 텍스트 추출
      const content = this.extractTextFromHTML(html);

      if (!content || content.trim().length === 0) {
        throw new Error('URL에서 텍스트를 추출할 수 없습니다.');
      }

      const chunks = this.createChunks(content, 'url');

      console.log(`URL 처리 완료: ${url} - ${content.length}자`);

      return {
        content,
        metadata: {
          title: this.extractTitleFromHTML(html) || url,
          type: 'url',
          size: content.length,
          extractedAt: new Date().toISOString(),
          source: 'url_crawl'
        },
        chunks
      };

    } catch (error) {
      console.error(`URL 처리 실패: ${url}`, error);
      throw new Error(`URL 처리 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * HTML에서 텍스트 추출
   */
  private extractTextFromHTML(html: string): string {
    // 간단한 HTML 태그 제거
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }

  /**
   * HTML에서 제목 추출
   */
  private extractTitleFromHTML(html: string): string | null {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * 텍스트를 청크로 분할
   */
  private createChunks(content: string, type: string): DocumentChunk[] {
    // 빈 내용 처리
    if (!content || content.trim().length === 0) {
      return [];
    }

    const chunks: DocumentChunk[] = [];
    const chunkSize = 1000;
    const overlap = 200;
    
    let startIndex = 0;
    let chunkIndex = 0;
    let maxIterations = Math.ceil(content.length / (chunkSize - overlap)) + 10; // 안전장치
    let iterations = 0;

    while (startIndex < content.length && iterations < maxIterations) {
      iterations++;
      
      const endIndex = Math.min(startIndex + chunkSize, content.length);
      let chunkContent = content.slice(startIndex, endIndex);

      // 문장 경계에서 자르기 (한국어 고려)
      if (endIndex < content.length) {
        const lastSentenceEnd = Math.max(
          chunkContent.lastIndexOf('.'),
          chunkContent.lastIndexOf('!'),
          chunkContent.lastIndexOf('?'),
          chunkContent.lastIndexOf('。'),
          chunkContent.lastIndexOf('！'),
          chunkContent.lastIndexOf('？')
        );
        
        if (lastSentenceEnd > chunkSize * 0.7) {
          chunkContent = chunkContent.slice(0, lastSentenceEnd + 1);
        }
      }

      // 빈 청크 방지
      if (chunkContent.trim().length > 0) {
        chunks.push({
          content: chunkContent.trim(),
          metadata: {
            chunkIndex,
            startChar: startIndex,
            endChar: startIndex + chunkContent.length,
            pageNumber: type === 'pdf' ? Math.floor(startIndex / chunkSize) + 1 : undefined
          }
        });
      }

      // 다음 청크 시작 위치 계산 (무한 루프 방지)
      const nextStartIndex = startIndex + Math.max(chunkContent.length - overlap, 1);
      
      if (nextStartIndex <= startIndex) {
        // 진행이 없으면 강제로 다음 위치로 이동
        startIndex += Math.max(chunkSize - overlap, 1);
      } else {
        startIndex = nextStartIndex;
      }
      
      chunkIndex++;

      if (startIndex >= content.length) break;
    }

    // 최소 1개 청크는 보장
    if (chunks.length === 0 && content.trim().length > 0) {
      chunks.push({
        content: content.trim(),
        metadata: {
          chunkIndex: 0,
          startChar: 0,
          endChar: content.length,
          pageNumber: type === 'pdf' ? 1 : undefined
        }
      });
    }

    return chunks;
  }

  /**
   * 파일 타입에 따라 적절한 처리 메서드 호출
   */
  async processFile(file: File): Promise<ProcessedDocument> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.processPDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return this.processDOCX(file);
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return this.processTXT(file);
    } else {
      throw new Error(`지원하지 않는 파일 형식: ${fileType}`);
    }
  }
}

// 싱글톤 인스턴스
export const documentProcessingService = new DocumentProcessingService();