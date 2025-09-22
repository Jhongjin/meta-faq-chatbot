// 임시 Mock 문서 처리 서비스 (빌드 오류 방지용)

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
   * PDF 파일을 텍스트로 추출 (Mock)
   */
  async processPDF(file: File): Promise<ProcessedDocument> {
    console.log(`Mock PDF 처리: ${file.name}`);
    
    const content = `Mock PDF 내용: ${file.name}\n\n이것은 테스트용 PDF 내용입니다.`;
    const chunks = this.createChunks(content, 'pdf');

    return {
      content,
      metadata: {
        title: file.name,
        type: 'pdf',
        size: file.size,
        pages: 1,
        extractedAt: new Date().toISOString(),
        source: 'file_upload'
      },
      chunks
    };
  }

  /**
   * DOCX 파일을 텍스트로 추출 (Mock)
   */
  async processDOCX(file: File): Promise<ProcessedDocument> {
    console.log(`Mock DOCX 처리: ${file.name}`);
    
    const content = `Mock DOCX 내용: ${file.name}\n\n이것은 테스트용 DOCX 내용입니다.`;
    const chunks = this.createChunks(content, 'docx');

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
  }

  /**
   * TXT 파일을 텍스트로 추출 (Mock)
   */
  async processTXT(file: File): Promise<ProcessedDocument> {
    console.log(`Mock TXT 처리: ${file.name}`);
    
    const content = `Mock TXT 내용: ${file.name}\n\n이것은 테스트용 TXT 내용입니다.`;
    const chunks = this.createChunks(content, 'txt');

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
  }

  /**
   * URL에서 웹페이지 내용을 크롤링하고 텍스트 추출 (Mock)
   */
  async processURL(url: string): Promise<ProcessedDocument> {
    console.log(`Mock URL 처리: ${url}`);
    
    const content = `Mock URL 내용: ${url}\n\n이것은 테스트용 웹페이지 내용입니다.`;
    const chunks = this.createChunks(content, 'url');

    return {
      content,
      metadata: {
        title: `Mock 페이지 - ${url}`,
        type: 'url',
        size: content.length,
        extractedAt: new Date().toISOString(),
        source: url
      },
      chunks
    };
  }

  /**
   * 텍스트를 청크로 분할
   */
  private createChunks(content: string, type: string): DocumentChunk[] {
    const chunkSize = 1000;
    const overlap = 200;

    const chunks: DocumentChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < content.length) {
      const endIndex = Math.min(startIndex + chunkSize, content.length);
      const chunkContent = content.slice(startIndex, endIndex).trim();
      
      if (chunkContent.length > 0) {
        chunks.push({
          content: chunkContent,
          metadata: {
            chunkIndex,
            startChar: startIndex,
            endChar: endIndex,
            pageNumber: type === 'pdf' ? Math.floor(startIndex / 2000) + 1 : undefined
          }
        });
        chunkIndex++;
      }

      startIndex = endIndex - overlap;
      if (startIndex >= content.length) break;
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

  /**
   * 리소스 정리 (Mock)
   */
  async cleanup(): Promise<void> {
    console.log('Mock 문서 처리 서비스 정리 완료');
  }
}

// 싱글톤 인스턴스
export const documentProcessingService = new DocumentProcessingService();

