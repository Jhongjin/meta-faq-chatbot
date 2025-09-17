/**
 * Vercel 서버리스 환경에 최적화된 문서 처리 서비스
 * PDF, DOCX, TXT 파일을 처리하여 텍스트를 추출합니다.
 */

import * as pdf from 'pdf-parse';

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
}

export class DocumentProcessingService {
  /**
   * 텍스트 파일 처리
   */
  async processTextFile(buffer: Buffer, filename: string): Promise<ProcessedDocument> {
    const content = buffer.toString('utf-8');
    const cleanedContent = this.cleanText(content);
    
    return {
      content: cleanedContent,
      metadata: {
        title: this.extractTitleFromFilename(filename),
        type: 'txt',
        size: cleanedContent.length,
        extractedAt: new Date().toISOString(),
        source: filename,
      }
    };
  }

  /**
   * PDF 파일 처리
   */
  async processPdfFile(buffer: Buffer, filename: string): Promise<ProcessedDocument> {
    try {
      console.log(`PDF 파일 처리 시작: ${filename} (${buffer.length} bytes)`);
      
      // PDF 파싱 옵션 설정
      const options = {
        max: 0, // 페이지 수 제한 없음
        version: 'v1.10.100' // PDF 파서 버전
      };
      
      const pdfData = await pdf(buffer, options);
      
      console.log(`PDF 파싱 완료: ${pdfData.numpages}페이지, ${pdfData.text.length}자`);
      
      // 텍스트 정리
      const cleanedContent = this.cleanText(pdfData.text);
      
      if (!cleanedContent || cleanedContent.trim().length === 0) {
        throw new Error('PDF에서 텍스트를 추출할 수 없습니다. 이미지 기반 PDF일 수 있습니다.');
      }
      
      return {
        content: cleanedContent,
        metadata: {
          title: this.extractTitleFromFilename(filename),
          type: 'pdf',
          size: buffer.length,
          pages: pdfData.numpages,
          extractedAt: new Date().toISOString(),
          source: filename,
        }
      };
    } catch (error) {
      console.error(`PDF 처리 실패: ${filename}`, error);
      
      // 오류 발생 시 기본 메시지 반환
      const content = `PDF 파일: ${filename}\n\nPDF 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`;
      
      return {
        content,
        metadata: {
          title: this.extractTitleFromFilename(filename),
          type: 'pdf',
          size: buffer.length,
          pages: 1,
          extractedAt: new Date().toISOString(),
          source: filename,
        }
      };
    }
  }

  /**
   * DOCX 파일 처리 (기본적인 텍스트만)
   */
  async processDocxFile(buffer: Buffer, filename: string): Promise<ProcessedDocument> {
    // DOCX 처리는 서버리스 환경에서 제한적이므로 기본 메시지만 반환
    const content = `DOCX 파일: ${filename}\n\n이 DOCX 파일은 서버리스 환경에서 처리할 수 없습니다. 관리자에게 문의하세요.`;
    
    return {
      content,
      metadata: {
        title: this.extractTitleFromFilename(filename),
        type: 'docx',
        size: buffer.length,
        pages: 1,
        extractedAt: new Date().toISOString(),
        source: filename,
      }
    };
  }

  /**
   * URL 처리
   */
  async processUrl(url: string, title?: string): Promise<ProcessedDocument> {
    const content = `URL: ${url}\n\n이 URL은 서버리스 환경에서 크롤링할 수 없습니다. 관리자에게 문의하세요.`;
    
    return {
      content,
      metadata: {
        title: title || this.extractTitleFromUrl(url),
        type: 'url',
        size: url.length,
        extractedAt: new Date().toISOString(),
        source: url,
      }
    };
  }

  /**
   * 텍스트 정리
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 여러 공백을 하나로
      .replace(/\n\s*\n/g, '\n\n') // 여러 줄바꿈을 두 개로
      .trim();
  }

  /**
   * 파일명에서 제목 추출
   */
  private extractTitleFromFilename(filename: string): string {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    return nameWithoutExt || 'Untitled Document';
  }

  /**
   * URL에서 제목 추출
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/').filter(Boolean);
      return segments[segments.length - 1] || 'Untitled Document';
    } catch {
      return 'Untitled Document';
    }
  }
}

export const documentProcessingService = new DocumentProcessingService();