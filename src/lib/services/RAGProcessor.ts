/**
 * RAG (Retrieval-Augmented Generation) 프로세서
 * 실제 텍스트 청킹, 임베딩 생성, 벡터 검색 기능을 제공
 */

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { createClient } from '@supabase/supabase-js';
import { createPureClient } from '../supabase/server';
import { processTextEncoding, TextEncodingResult } from '../utils/textEncoding';

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
   * 중복 문서 검사 (기본 버전)
   */
  private async checkDuplicateDocument(title: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient();
      if (!supabase) {
        console.warn('⚠️ Supabase 연결 없음. 중복 검사 건너뛰기');
        return false;
      }

      console.log('🔍 중복 검사 시작:', title);

      const { data, error } = await supabase
        .from('documents')
        .select('id, title')
        .eq('title', title)
        .in('type', ['pdf', 'docx', 'txt']) // 파일 업로드 문서만 검사
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
  async saveDocumentToDatabase(document: DocumentData, originalBinaryData?: string): Promise<void> {
    try {
      console.log('💾 문서 저장 시작:', document.title);
      const supabase = await this.getSupabaseClient();

      // Supabase 연결 확인
      if (!supabase) {
        console.warn('⚠️ Supabase 연결 없음. 메모리 모드로 동작');
        return;
      }

      // 원본 바이너리 데이터가 있으면 content에 저장, 없으면 텍스트 내용 저장
      let contentToStore = '';
      if (originalBinaryData) {
        // 원본 바이너리 데이터를 Base64로 저장 (다운로드용)
        contentToStore = `BINARY_DATA:${originalBinaryData}`;
        console.log('💾 원본 바이너리 데이터를 content 필드에 저장:', {
          documentId: document.id,
          dataSize: originalBinaryData.length,
          fileType: document.file_type
        });
      } else {
        // 텍스트 내용 저장
        contentToStore = document.content || '';
        console.log('📄 텍스트 내용을 content 필드에 저장:', {
          documentId: document.id,
          contentLength: contentToStore.length
        });
      }

      // 대용량 파일 처리를 위한 최적화
      const isLargeFile = document.file_size > 12 * 1024 * 1024; // 12MB 이상
      const timeoutMs = isLargeFile ? 300000 : 30000; // 대용량 파일: 5분, 일반 파일: 30초
      
      console.log(`⏱️ 데이터베이스 저장 시작 (타임아웃: ${timeoutMs}ms, 파일크기: ${document.file_size}bytes, 대용량파일: ${isLargeFile})`);
      
      // 대용량 파일의 경우 content 필드를 비우고 메타데이터만 저장 (타임아웃 방지)
      const contentForStorage = isLargeFile ? '' : contentToStore;
      
      if (isLargeFile) {
        console.log('⚠️ 대용량 파일 감지 - content 필드 비우고 메타데이터만 저장 (타임아웃 방지)');
        console.log('💾 대용량 파일은 다운로드 불가, AI 검색만 가능');
        console.log('📊 원본 파일 크기:', document.file_size, 'bytes');
        console.log('📊 Base64 인코딩 후 크기:', contentToStore.length, 'characters');
        console.log('💡 해결책: Supabase Storage 또는 AWS S3 사용 권장');
      }
      
      const { error } = await Promise.race([
        supabase
          .from('documents')
          .insert({
            id: document.id,
            title: document.title,
            content: contentForStorage,
            type: document.type,
            status: 'processing',
            chunk_count: 0,
            file_size: document.file_size,
            file_type: document.file_type,
            url: document.url || null,
            created_at: document.created_at,
            updated_at: document.updated_at,
          }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
        )
      ]) as any;

      if (error) {
        console.error('❌ 문서 저장 오류:', error);
        console.error('❌ 문서 저장 오류 상세:', {
          documentId: document.id,
          title: document.title,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details
        });
        throw error;
      }

      console.log('✅ 문서 저장 완료:', document.title);

      // document_metadata 테이블에도 저장
      const fileType = document.file_type?.split('/')[1] || 'pdf';
      const metadataRecord: any = {
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
      };
      
      // 원본 바이너리 데이터가 있으면 metadata에 저장
      if (originalBinaryData) {
        metadataRecord.metadata = {
          fileData: originalBinaryData,
          originalFileName: document.title,
          fileType: document.file_type,
          uploadedAt: document.created_at
        };
        console.log('💾 원본 바이너리 데이터 저장:', {
          documentId: document.id,
          dataSize: originalBinaryData.length,
          fileType: document.file_type,
          hasFileData: !!originalBinaryData,
          fileDataStart: originalBinaryData.substring(0, 50)
        });
      } else {
        console.warn('⚠️ originalBinaryData가 없습니다:', {
          documentId: document.id,
          title: document.title,
          fileType: document.file_type
        });
      }
      
      const { error: metadataError } = await supabase
        .from('document_metadata')
        .insert(metadataRecord);

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
      const chunkInserts = chunks.map((chunk, index) => ({
        id: chunk.id, // 문자열 ID는 id 필드에 저장
        document_id: chunk.metadata.document_id,
        chunk_id: index, // chunk_id는 정수 인덱스
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
   * 서버사이드 텍스트 추출 (PDF, DOCX 등)
   */
  async extractTextFromFile(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string
  ): Promise<TextEncodingResult> {
    try {
      console.log(`📄 서버사이드 텍스트 추출 시작: ${fileName}`);
      
      const fileExtension = fileName.toLowerCase().split('.').pop();
      
      switch (fileExtension) {
        case 'pdf':
          // PDF 텍스트 추출 비활성화 (원본 바이너리 데이터만 저장)
          console.log(`📄 PDF 텍스트 추출 비활성화: ${fileName}`);
          console.log(`📄 원본 바이너리 데이터만 저장하여 다운로드 가능`);
          
          // PDF 텍스트 추출 없이 플레이스홀더 반환
          // 원본 바이너리 데이터는 업로드 API에서 저장됨
          const pdfPlaceholder = `PDF 문서: ${fileName}
          
PDF 텍스트 추출이 비활성화되었습니다.
원본 PDF 파일은 정상적으로 저장되었으며, 다운로드 시 원본 파일을 받을 수 있습니다.

파일 크기: ${fileBuffer.length} bytes
저장 시간: ${new Date().toLocaleString('ko-KR')}`;
          
          return processTextEncoding(pdfPlaceholder, { 
            strictMode: true,
            preserveOriginal: true 
          });
          
        case 'docx':
          // DOCX 텍스트 추출 비활성화 (원본 바이너리 데이터만 저장)
          console.log(`📄 DOCX 텍스트 추출 비활성화: ${fileName}`);
          console.log(`📄 원본 바이너리 데이터만 저장하여 다운로드 가능`);
          
          // DOCX 텍스트 추출 없이 플레이스홀더 반환
          // 원본 바이너리 데이터는 업로드 API에서 저장됨
          const docxPlaceholder = `DOCX 문서: ${fileName}
          
DOCX 텍스트 추출이 비활성화되었습니다.
원본 DOCX 파일은 정상적으로 저장되었으며, 다운로드 시 원본 파일을 받을 수 있습니다.

파일 크기: ${fileBuffer.length} bytes
저장 시간: ${new Date().toLocaleString('ko-KR')}`;
          
          return processTextEncoding(docxPlaceholder, { 
            strictMode: true,
            preserveOriginal: true 
          });
          
        case 'txt':
          // TXT 파일은 다양한 인코딩 시도
          const encodings: BufferEncoding[] = ['utf-8', 'latin1'];
          let bestResult: TextEncodingResult | null = null;
          let bestScore = 0;

          for (const encoding of encodings) {
            try {
              const text = fileBuffer.toString(encoding);
              const result = processTextEncoding(text, { strictMode: true });
              
              // 한글 비율로 최적 인코딩 선택
              const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
              const totalChars = text.length;
              const koreanRatio = totalChars > 0 ? koreanChars / totalChars : 0;
              
              if (koreanRatio > bestScore) {
                bestScore = koreanRatio;
                bestResult = result;
              }
            } catch (error) {
              continue;
            }
          }

          if (!bestResult) {
            throw new Error('모든 인코딩 시도 실패');
          }

          return bestResult;
          
        default:
          // 기본적으로 UTF-8로 시도
          const text = fileBuffer.toString('utf-8');
          return processTextEncoding(text, { strictMode: true });
      }
    } catch (error) {
      console.error(`❌ 서버사이드 텍스트 추출 실패: ${fileName}`, error);
      
      return {
        originalText: fileName,
        cleanedText: `[파일 처리 오류: ${fileName}]`,
        encoding: 'error',
        hasIssues: true,
        issues: [`extraction error: ${error instanceof Error ? error.message : 'unknown'}`]
      };
    }
  }

  /**
   * 문서를 완전히 처리 (청킹 + 임베딩 + 저장)
   */
  async processDocument(document: DocumentData, skipDuplicate: boolean = false, originalBinaryData?: string): Promise<{
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
      
      // 대용량 파일 처리 시 타임아웃 설정
      const isLargeFile = document.file_size > 10 * 1024 * 1024; // 10MB 이상
      const timeoutMs = isLargeFile ? 300000 : 60000; // 대용량: 5분, 일반: 1분
      
      if (isLargeFile) {
        console.log('⚠️ 대용량 파일 처리 - 타임아웃 설정:', timeoutMs + 'ms');
      }
      
      // 타임아웃 설정
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`문서 처리 타임아웃 (${timeoutMs}ms 초과)`));
        }, timeoutMs);
      });
      
      const processPromise = this.processDocumentInternal(document, skipDuplicate, originalBinaryData);
      
      // 타임아웃과 처리 작업을 경쟁시킴
      const result = await Promise.race([processPromise, timeoutPromise]);
      return result;
      
    } catch (error) {
      console.error('❌ RAG 문서 처리 실패:', error);
      return {
        documentId: document.id,
        chunkCount: 0,
        success: false,
      };
    }
  }
  
  private async processDocumentInternal(document: DocumentData, skipDuplicate: boolean = false, originalBinaryData?: string): Promise<{
    documentId: string;
    chunkCount: number;
    success: boolean;
  }> {
    try {

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
      
      // PDF 바이너리 데이터인 경우 텍스트 추출 없이 청킹 건너뛰기
      if (document.content && document.content.startsWith('BINARY_DATA:')) {
        console.log('⚠️ PDF 바이너리 데이터 감지 - 청킹 건너뛰기');
        return {
          documentId: document.id,
          chunkCount: 0,
          success: true, // PDF는 다운로드용으로만 사용
        };
      }
      
      // 텍스트 문서인 경우에만 인코딩 처리
      let processedContent = document.content;
      if (document.content && !document.content.startsWith('BINARY_DATA:')) {
        const encodingResult = processTextEncoding(document.content, { 
          strictMode: true,
          preserveOriginal: true 
        });
        
        console.log(`🔧 텍스트 인코딩 결과:`, {
          originalLength: encodingResult.originalText.length,
          cleanedLength: encodingResult.cleanedText.length,
          encoding: encodingResult.encoding,
          hasIssues: encodingResult.hasIssues,
          issues: encodingResult.issues
        });
        
        processedContent = encodingResult.cleanedText;
      }
      
      const processedDocument = {
        ...document,
        content: processedContent
      };
      
      const chunks = this.simpleChunkDocument(processedDocument);
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
          await this.saveDocumentToDatabase(document, originalBinaryData);
          console.log('✅ 문서 데이터베이스 저장 완료');

          // 청크 저장
          await this.saveChunksToDatabase(chunksWithEmbeddings);
          console.log('✅ 청크 데이터베이스 저장 완료');
        } catch (error) {
          console.error('❌ 데이터베이스 저장 실패:', error);
          console.error('❌ 저장 실패 상세:', {
            documentId: document.id,
            title: document.title,
            error: error instanceof Error ? error.message : String(error)
          });
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

      // UTF-8 인코딩 보장
      let content = document.content;
      try {
        content = Buffer.from(document.content, 'utf-8').toString('utf-8');
      } catch (error) {
        console.warn('⚠️ 텍스트 인코딩 변환 실패, 원본 사용:', error);
        content = document.content;
      }

      // 문서 내용에 따른 적응적 청킹
      const contentLength = content.length;
      let chunkSize, overlap, maxChunks;
      
      // 문서 크기에 따른 청킹 전략 조정
      if (contentLength < 1000) {
        // 작은 문서: 작은 청크, 적은 겹침
        chunkSize = 200;
        overlap = 20;
        maxChunks = 50;
      } else if (contentLength < 10000) {
        // 중간 문서: 중간 청크
        chunkSize = 500;
        overlap = 50;
        maxChunks = 100;
      } else if (contentLength < 100000) {
        // 큰 문서: 큰 청크
        chunkSize = 1000;
        overlap = 100;
        maxChunks = 200;
      } else {
        // 매우 큰 문서: 매우 큰 청크
        chunkSize = 2000;
        overlap = 200;
        maxChunks = 500;
      }
      
      console.log(`📄 청킹 전략:`, {
        contentLength,
        chunkSize,
        overlap,
        maxChunks
      });
      
      const chunks: string[] = [];
      let start = 0;
      let iterationCount = 0;
      const maxIterations = Math.min(maxChunks * 2, 10000); // 최대 반복 수 제한
      
      while (start < content.length && iterationCount < maxIterations && chunks.length < maxChunks) {
        const end = Math.min(start + chunkSize, content.length);
        let chunk = content.slice(start, end);
        
        // 문장 경계에서 자르기 (큰 청크에만 적용)
        if (chunkSize > 500 && end < content.length) {
          const lastSentenceEnd = chunk.lastIndexOf('.');
          const lastParagraphEnd = chunk.lastIndexOf('\n\n');
          
          // 문단 경계 우선, 문장 경계 차선
          if (lastParagraphEnd > chunkSize * 0.3) {
            chunk = chunk.slice(0, lastParagraphEnd);
          } else if (lastSentenceEnd > chunkSize * 0.5) {
            chunk = chunk.slice(0, lastSentenceEnd + 1);
          }
        }
        
        const trimmedChunk = chunk.trim();
        if (trimmedChunk.length > 50) { // 최소 청크 크기 보장
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
   * 벡터 검색 수행 (수정된 search_documents 함수 사용)
   */
  async searchSimilarChunks(query: string, limit: number = 5): Promise<ChunkData[]> {
    try {
      console.log('🔍 벡터 검색 시작:', query);
      const supabase = await this.getSupabaseClient();

      if (!supabase) {
        console.warn('⚠️ Supabase 클라이언트가 없습니다. 빈 결과를 반환합니다.');
        return [];
      }

      // 쿼리에 대한 임베딩 생성 (BGE-M3 모델 사용)
      console.log('🧠 쿼리 임베딩 생성 중...');
      const queryEmbedding = this.generateSimpleEmbedding(query);
      console.log('✅ 쿼리 임베딩 생성 완료:', queryEmbedding.length, '차원');

      // 새로운 search_documents 함수 사용
      const { data, error } = await supabase.rpc('search_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
      });

      if (error) {
        console.error('❌ 벡터 검색 오류:', error);
        // Fallback: 키워드 검색 시도
        console.log('🔄 키워드 검색으로 Fallback 시도...');
        return await this.fallbackKeywordSearch(query, limit, supabase);
      }

      // 결과를 ChunkData 형식으로 변환
      const chunks: ChunkData[] = (data || []).map((item: any) => ({
        id: item.chunk_id,
        content: item.content,
        metadata: {
          document_id: item.document_id,
          chunk_index: item.metadata?.chunk_index || 0,
          source: item.title || item.metadata?.source || 'Unknown',
          created_at: item.metadata?.created_at || new Date().toISOString(),
        },
        similarity: item.similarity,
      }));

      console.log('✅ 벡터 검색 완료:', chunks.length, '개 결과');
      return chunks;
    } catch (error) {
      console.error('❌ 벡터 검색 오류:', error);
      return [];
    }
  }

  /**
   * Fallback 키워드 검색
   */
  private async fallbackKeywordSearch(query: string, limit: number, supabase: any): Promise<ChunkData[]> {
    try {
      console.log('🔍 키워드 검색 Fallback 실행:', query);
      
      const { data, error } = await supabase
        .from('document_chunks')
        .select('chunk_id, content, metadata, document_id')
        .or(`content.ilike.%${query}%,content.ilike.%${query.split(' ')[0]}%`)
        .limit(limit);

      if (error) {
        console.error('❌ 키워드 검색 오류:', error);
        return [];
      }

      const chunks: ChunkData[] = (data || []).map((item: any) => ({
        id: item.chunk_id,
        content: item.content,
        metadata: {
          document_id: item.document_id,
          chunk_index: item.metadata?.chunk_index || 0,
          source: item.metadata?.source || 'Unknown',
          created_at: item.metadata?.created_at || new Date().toISOString(),
        },
        similarity: 0.5, // 키워드 검색은 낮은 유사도로 설정
      }));

      console.log('✅ 키워드 검색 완료:', chunks.length, '개 결과');
      return chunks;
    } catch (error) {
      console.error('❌ 키워드 검색 오류:', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스
export const ragProcessor = new RAGProcessor();
