/**
 * 새로운 문서 업로드 API
 * 간단하고 안정적인 RAG 파이프라인 기반
 * 파일 중복 처리 로직 포함
 */

import { NextRequest, NextResponse } from 'next/server';
import { newDocumentProcessor } from '@/lib/services/NewDocumentProcessor';
import { ragProcessor, DocumentData, RAGProcessor } from '@/lib/services/RAGProcessor';
import { createPureClient } from '@/lib/supabase/server';

// Vercel 설정 - 서버 안정성 개선
export const runtime = 'nodejs';
export const maxDuration = 120; // 타임아웃 증가
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 하드코딩된 메모리 저장소 (개발 환경용)
interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  content: string;
  chunk_count: number;
  file_size: number;
  file_type: string;
  created_at: string;
  updated_at: string;
}

// 메모리에 문서 저장
let documents: Document[] = [];

    /**
     * 파일명 중복 검사 (Supabase 기반, 폴백 포함)
     */
    async function checkDuplicateFile(fileName: string): Promise<{ isDuplicate: boolean; existingDocument?: Document }> {
      try {
        console.log('🔍 파일명 중복 검사 시작:', fileName);

        const supabase = await createPureClient();
        
        // Supabase URL이 더미인지 확인
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        console.log('🔍 Supabase 환경변수 체크:', {
          supabaseUrl: supabaseUrl ? '설정됨' : '없음',
          isDummy: supabaseUrl?.includes('dummy') || supabaseUrl === 'https://dummy.supabase.co'
        });
        
        if (!supabase) {
          console.error('❌ Supabase 클라이언트 생성 실패');
          throw new Error('Supabase 클라이언트를 생성할 수 없습니다.');
        }

        // Supabase에서 파일명으로 검색 (파일 업로드 문서만)
        const { data, error } = await supabase
          .from('documents')
          .select('id, title, created_at, file_size, chunk_count, status')
          .eq('title', fileName)
          .in('type', ['pdf', 'docx', 'txt']) // 파일 업로드 문서만 검사
          .limit(1);

        if (error) {
          console.error('❌ Supabase 중복 검사 오류:', error);
          throw new Error(`중복 검사 실패: ${error.message}`);
        }

        const isDuplicate = data && data.length > 0;
        const existingDocument = isDuplicate ? {
          id: data[0].id,
          title: data[0].title,
          created_at: data[0].created_at,
          file_size: data[0].file_size || 0,
          chunk_count: data[0].chunk_count || 0,
          status: data[0].status || 'indexed'
        } : undefined;

        console.log('📋 중복 검사 결과 (Supabase):', {
          fileName,
          isDuplicate,
          existingDocumentId: existingDocument?.id,
          totalDocuments: data?.length || 0
        });

        return { isDuplicate, existingDocument };
      } catch (error) {
        console.error('❌ 중복 검사 중 오류:', error);
        throw error;
      }
    }

/**
 * 기존 문서 삭제 (덮어쓰기용 - Supabase 기반)
 */
async function deleteExistingDocument(documentId: string): Promise<boolean> {
  try {
    console.log('🗑️ 기존 문서 삭제 시작 (Supabase):', documentId);

    const supabase = await createPureClient();
    if (!supabase) {
      console.warn('⚠️ Supabase 연결 없음. 메모리 기반으로 폴백');
      const initialLength = documents.length;
      documents = documents.filter(doc => doc.id !== documentId);
      return documents.length < initialLength;
    }

    // Supabase에서 문서 및 관련 청크 삭제
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    if (chunksError) {
      console.error('❌ 청크 삭제 오류:', chunksError);
    }

    const { error: docError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (docError) {
      console.error('❌ 문서 삭제 오류:', docError);
      return false;
    }

    // 메모리에서도 제거
    const initialLength = documents.length;
    documents = documents.filter(doc => doc.id !== documentId);

    console.log('✅ 기존 문서 삭제 완료 (Supabase):', documentId);
    console.log('📊 남은 문서 수:', documents.length);
    return true;
  } catch (error) {
    console.error('❌ 문서 삭제 중 오류:', error);
    return false;
  }
}

/**
 * 파일 확장자에 따른 타입 결정
 */
function getFileTypeFromExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'doc':
      return 'docx'; // DOC도 DOCX로 처리
    case 'txt':
      return 'txt';
    case 'md':
      return 'txt'; // Markdown도 TXT로 처리
    default:
      return 'file';
  }
}

/**
 * 파일 업로드 및 처리
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 새로운 문서 업로드 API 시작 (메모리 저장)');

    const contentType = request.headers.get('content-type');
    console.log('📋 Content-Type:', contentType);

    // FormData 처리
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { success: false, error: '파일이 제공되지 않았습니다.' },
          { status: 400 }
        );
      }

      // 파일 크기 검사 (50MB 제한으로 증가)
      const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB
      if (file.size > maxFileSize) {
        console.error('❌ 파일 크기 초과:', {
          fileName: file.name,
          fileSize: file.size,
          maxSize: maxFileSize
        });
        return NextResponse.json(
          { 
            success: false, 
            error: `파일 크기가 ${Math.round(maxFileSize / 1024 / 1024)}MB를 초과합니다. 최대 50MB까지 업로드 가능합니다.`,
            fileSize: file.size,
            maxSize: maxFileSize
          },
          { status: 400 }
        );
      }

      // 파일명 정리 (확장자 중복 제거)
      let cleanFileName = file.name;
      
      // 확장자 중복 제거 (여러 번 반복 가능)
      while (cleanFileName.toLowerCase().match(/\.(pdf|docx|txt)\.\1$/i)) {
        cleanFileName = cleanFileName.replace(/\.(pdf|docx|txt)\.\1$/i, '.$1');
      }
      
      console.log('📁 파일명 정리:', {
        original: file.name,
        cleaned: cleanFileName,
        hasDuplicateExtension: file.name !== cleanFileName
      });

      console.log('📁 파일 업로드 시작:', {
        fileName: cleanFileName,
        fileSize: file.size,
        fileType: file.type
      });

      try {
        // 파일 내용 읽기 및 서버사이드 텍스트 추출
        let fileContent;
        let extractedText = '';
        let originalBinaryData: string | undefined;
        
        console.log('🔍 파일 처리 시작:', file.name);
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // PDF 파일은 바이너리로 저장 (텍스트 추출 비활성화)
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        
        // PDF 파일 무결성 검증
        const pdfSignature = fileBuffer.slice(0, 4).toString();
        const isValidPdf = pdfSignature === '%PDF';
        
        // 대용량 파일 경고 (10MB 이상)
        if (file.size > 10 * 1024 * 1024) {
          console.log('⚠️ 대용량 PDF 파일 감지:', {
            fileName: file.name,
            fileSize: file.size,
            fileSizeMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
          });
        }
        
        if (!isValidPdf) {
          console.error('❌ PDF 파일 무결성 검증 실패:', {
            fileName: file.name,
            fileSize: file.size,
            pdfSignature: pdfSignature,
            expectedSignature: '%PDF'
          });
          return NextResponse.json(
            { 
              success: false, 
              error: `PDF 파일이 손상되었습니다. 파일을 다시 업로드해주세요.`,
              fileName: file.name
            },
            { status: 400 }
          );
        }
        
        originalBinaryData = fileBuffer.toString('base64');
        fileContent = `BINARY_DATA:${originalBinaryData}`;
        extractedText = ''; // 텍스트 추출 비활성화
        
        console.log(`📄 PDF 파일 바이너리 저장:`, {
          fileName: file.name,
          fileSize: file.size,
          binaryDataLength: originalBinaryData.length,
          pdfSignature: pdfSignature,
          isValidPdf: isValidPdf
        });
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.name.toLowerCase().endsWith('.docx')) {
        // DOCX 파일 바이너리 처리 (완전히 새로운 방식)
        console.log('📄 DOCX 파일 바이너리 처리 시작:', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        
        // 1. ArrayBuffer로 읽기
        const arrayBuffer = await file.arrayBuffer();
        console.log('📦 ArrayBuffer 크기:', arrayBuffer.byteLength);
        
        // 2. Uint8Array로 변환 (바이너리 데이터 보존)
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log('📦 Uint8Array 크기:', uint8Array.length);
        
        // 3. Buffer로 변환 (Node.js Buffer 사용)
        const fileBuffer = Buffer.from(uint8Array);
        console.log('📦 Buffer 크기:', fileBuffer.length);
        
        // 4. DOCX 파일 무결성 검증
        const zipSignature = Array.from(fileBuffer.slice(0, 4))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const isValidDocx = zipSignature === '504b0304';
        
        console.log('📦 DOCX 무결성 검증:', {
          zipSignature: zipSignature,
          expectedSignature: '504b0304',
          isValidDocx: isValidDocx
        });
        
        if (!isValidDocx) {
          console.error('❌ DOCX 파일 무결성 검증 실패');
          return NextResponse.json(
            { 
              success: false, 
              error: `DOCX 파일이 손상되었습니다. 파일을 다시 업로드해주세요.`,
              fileName: file.name
            },
            { status: 400 }
          );
        }
        
        // 5. Base64 인코딩 (바이너리 데이터 직접 처리)
        originalBinaryData = fileBuffer.toString('base64');
        fileContent = `BINARY_DATA:${originalBinaryData}`;
        extractedText = ''; // 텍스트 추출 비활성화
        
        // 6. Base64 인코딩 검증
        const testDecode = Buffer.from(originalBinaryData, 'base64');
        const isValidBase64 = testDecode.length === file.size;
        
        console.log('📦 Base64 인코딩 검증:', {
          originalSize: file.size,
          decodedSize: testDecode.length,
          base64Length: originalBinaryData.length,
          isValidBase64: isValidBase64
        });
        
        if (!isValidBase64) {
          console.error('❌ Base64 인코딩 검증 실패');
          return NextResponse.json(
            { 
              success: false, 
              error: `파일 인코딩 중 오류가 발생했습니다.`,
              fileName: file.name
            },
            { status: 400 }
          );
        }
        
        console.log(`✅ DOCX 파일 바이너리 저장 완료:`, {
          fileName: file.name,
          fileSize: file.size,
          binaryDataLength: originalBinaryData.length,
          zipSignature: zipSignature,
          isValidDocx: isValidDocx,
          isValidBase64: isValidBase64
        });
      } else {
        // TXT 파일은 기존 방식 사용하되 인코딩 처리 개선
        const textContent = await file.text();
        
        // 통합된 인코딩 처리 적용
        const { processTextEncoding } = await import('@/lib/utils/textEncoding');
        const encodingResult = processTextEncoding(textContent, { strictMode: true });
        
        extractedText = encodingResult.cleanedText;
        fileContent = extractedText;
        
        console.log(`📄 TXT 텍스트 처리 결과:`, {
          fileName: file.name,
          originalLength: textContent.length,
          cleanedLength: extractedText.length,
          encoding: encodingResult.encoding,
          hasIssues: encodingResult.hasIssues,
          issues: encodingResult.issues
        });
      }
      
      // 추출된 텍스트 사용 (서버사이드 처리 결과)
      let processedContent = fileContent;

      // 문서 생성
      const documentId = `doc_${Date.now()}`;
      const documentData: DocumentData = {
        id: documentId,
        title: cleanFileName, // 정리된 파일명 사용
        content: processedContent,
        type: getFileTypeFromExtension(cleanFileName), // 정리된 파일명으로 타입 결정
        file_size: file.size,
        file_type: file.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // RAG 처리 (청킹 + 임베딩 + 저장)
      console.log('🔄 RAG 처리 시작...', {
        documentId,
        fileName: cleanFileName,
        fileSize: file.size,
        fileType: file.type,
        hasOriginalBinaryData: !!originalBinaryData,
        originalBinaryDataLength: originalBinaryData?.length || 0,
        originalBinaryDataStart: originalBinaryData?.substring(0, 50) || 'N/A'
      });
      
      // 대용량 파일 처리 시 타임아웃 증가
      const isLargeFile = file.size > 10 * 1024 * 1024; // 10MB 이상
      if (isLargeFile) {
        console.log('⚠️ 대용량 파일 RAG 처리 - 타임아웃 증가 적용');
      }
      
      let ragResult;
      try {
        // 중복 검사 활성화 (skipDuplicate: false)
        ragResult = await ragProcessor.processDocument(documentData, false, originalBinaryData);
        console.log('✅ RAG 처리 완료:', {
          success: ragResult.success,
          chunkCount: ragResult.chunkCount,
          error: ragResult.error
        });
        
        if (!ragResult.success) {
          console.error('❌ RAG 처리 실패:', ragResult.error);
          return NextResponse.json(
            { 
              success: false, 
              error: `문서 처리 중 오류가 발생했습니다: ${ragResult.error}`,
              fileName: cleanFileName
            },
            { status: 500 }
          );
        }
      } catch (ragError) {
        console.error('❌ RAG 처리 중 예외 발생:', ragError);
        return NextResponse.json(
          { 
            success: false, 
            error: `문서 처리 중 예외가 발생했습니다: ${ragError.message}`,
            fileName: cleanFileName
          },
          { status: 500 }
        );
      }
      
      // Supabase에 저장되므로 메모리 배열 추가 불필요
      
      console.log('✅ 파일 업로드 및 RAG 처리 완료:', {
        documentId,
        fileName: file.name,
        fileSize: file.size,
        chunkCount: ragResult.chunkCount,
        success: ragResult.success,
        totalDocuments: documents.length
      });

      return NextResponse.json({
        success: true,
        data: {
          documentId: documentId,
          message: ragResult.success 
            ? `파일이 성공적으로 업로드되고 ${ragResult.chunkCount}개 청크로 처리되었습니다.`
            : '파일 업로드는 성공했지만 RAG 처리 중 오류가 발생했습니다.',
          status: ragResult.success ? 'completed' : 'failed',
          chunkCount: ragResult.chunkCount
        }
      });

    } catch (error) {
      console.error('❌ 파일 업로드 중 오류 발생:', {
        fileName: file.name,
        error: error.message,
        stack: error.stack
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: `파일 업로드 중 오류가 발생했습니다: ${error.message}`,
          fileName: file.name
        },
        { status: 500 }
      );
    }
    }

    // JSON 요청 처리 (Base64 파일)
    if (contentType?.includes('application/json')) {
      let body;
      try {
        const text = await request.text();
        if (!text || text.trim() === '') {
          return NextResponse.json(
            { success: false, error: '요청 본문이 비어있습니다.' },
            { status: 400 }
          );
        }
        body = JSON.parse(text);
      } catch (error) {
        console.error('❌ JSON 파싱 오류:', error);
        return NextResponse.json(
          { success: false, error: '잘못된 JSON 형식입니다.' },
          { status: 400 }
        );
      }
      
      const { fileName, fileSize, fileType, fileContent, duplicateAction } = body;

      console.log('📋 업로드 요청 정보:', { fileName, fileSize, fileType, duplicateAction });

      if (!fileContent || !fileName) {
        return NextResponse.json(
          { success: false, error: '파일 내용과 파일명이 필요합니다.' },
          { status: 400 }
        );
      }

      // 파일 크기 검사 (20MB 제한)
      const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB
      if (fileSize > maxFileSize) {
        return NextResponse.json(
          { 
            success: false, 
            error: `파일 크기가 ${Math.round(maxFileSize / 1024 / 1024)}MB를 초과합니다. 최대 50MB까지 업로드 가능합니다.`,
            fileSize: fileSize,
            maxSize: maxFileSize
          },
          { status: 400 }
        );
      }

      // 파일명 중복 검사
      console.log('🔍 중복 검사 시작:', fileName);
      const { isDuplicate, existingDocument } = await checkDuplicateFile(fileName);
      console.log('🔍 중복 검사 완료:', { isDuplicate, existingDocumentId: existingDocument?.id });
      
      if (isDuplicate && !duplicateAction) {
        return NextResponse.json({
          success: false,
          error: 'DUPLICATE_FILE',
          data: {
            fileName,
            existingDocument: {
              id: existingDocument?.id,
              title: existingDocument?.title,
              created_at: existingDocument?.created_at,
              file_size: existingDocument?.file_size,
              chunk_count: existingDocument?.chunk_count,
              status: existingDocument?.status || 'indexed'
            },
            message: `'${fileName}' 파일이 이미 존재합니다. 어떻게 처리하시겠습니까?`
          }
        }, { status: 409 }); // Conflict
      }

      // 중복 처리 로직
      if (isDuplicate && duplicateAction) {
        if (duplicateAction === 'skip') {
          // 건너뛰기 시에는 아무것도 하지 않음 (RAG 처리 완전 건너뛰기)
          console.log('📝 건너뛰기 처리: 파일 업로드 및 RAG 처리 완전 취소', fileName);
          return NextResponse.json({
            success: false,
            error: 'FILE_SKIPPED',
            message: `'${fileName}' 파일을 건너뛰었습니다.`
          }, { status: 200 });
        }
        
        if (duplicateAction === 'overwrite' && existingDocument) {
          console.log('🔄 덮어쓰기 모드: 기존 문서 삭제 중...');
          const deleteSuccess = await deleteExistingDocument(existingDocument.id);
          
          if (!deleteSuccess) {
            return NextResponse.json({
              success: false,
              error: 'DELETE_FAILED',
              message: '기존 문서 삭제에 실패했습니다.'
            }, { status: 500 });
          }
          
          console.log('✅ 기존 문서 삭제 완료, 새 문서 업로드 진행...');
        }
      }

      // Base64 디코딩 및 서버사이드 텍스트 추출
      let decodedContent;
      let extractedText = '';
      let originalBinaryData = null; // 원본 바이너리 데이터 저장용
      
      try {
        // Base64 디코딩
        const base64Data = fileContent;
        const fileBuffer = Buffer.from(base64Data, 'base64');
        
      // 원본 바이너리 데이터 저장 (다운로드용) - 항상 보장
      originalBinaryData = base64Data;
      console.log('💾 원본 바이너리 데이터 설정:', {
        fileName,
        dataSize: base64Data.length,
        hasData: !!originalBinaryData,
        base64DataStart: base64Data.substring(0, 50),
        base64DataEnd: base64Data.substring(base64Data.length - 50)
      });
      
      // 안전장치: originalBinaryData가 없으면 오류
      if (!originalBinaryData) {
        console.error('❌ originalBinaryData 설정 실패:', {
          fileName,
          base64DataLength: base64Data?.length || 0,
          hasBase64Data: !!base64Data
        });
        throw new Error('원본 바이너리 데이터 설정 실패');
      }
        
        // 파일 확장자에 따른 서버사이드 처리
        const fileExtension = fileName.toLowerCase().split('.').pop();
        
        if (fileExtension === 'pdf' || fileExtension === 'docx') {
          // PDF/DOCX 텍스트 추출 비활성화 - 원본 바이너리 데이터만 저장
          console.log(`📄 ${fileExtension.toUpperCase()} 텍스트 추출 비활성화: ${fileName}`);
          console.log(`📄 원본 바이너리 데이터만 저장하여 다운로드 가능`);
          
          // 텍스트 추출 없이 플레이스홀더 텍스트 생성
          extractedText = `${fileExtension.toUpperCase()} 문서: ${fileName}\n\n텍스트 추출이 비활성화되었습니다.\n원본 파일은 정상적으로 저장되었으며, 다운로드 시 원본 파일을 받을 수 있습니다.\n\n파일 크기: ${fileBuffer.length} bytes\n저장 시간: ${new Date().toLocaleString('ko-KR')}`;
          decodedContent = extractedText;
          
          // 원본 바이너리 데이터는 이미 설정됨
          console.log(`📄 ${fileExtension.toUpperCase()} 플레이스홀더 텍스트 생성:`, {
            fileName,
            extractedLength: extractedText.length,
            hasOriginalBinaryData: !!originalBinaryData,
            originalBinaryDataLength: originalBinaryData?.length || 0,
            originalBinaryDataStart: originalBinaryData?.substring(0, 50) || 'N/A'
          });
          
          // 안전장치: originalBinaryData가 없으면 다시 설정
          if (!originalBinaryData) {
            originalBinaryData = base64Data;
            console.log('🔄 originalBinaryData 재설정:', {
              fileName,
              dataSize: base64Data.length
            });
          }
        } else {
          // TXT 파일은 기본 디코딩
          decodedContent = fileBuffer.toString('utf-8');
          
          // 통합된 인코딩 처리 적용
          const { processTextEncoding } = await import('@/lib/utils/textEncoding');
          const encodingResult = processTextEncoding(decodedContent, { strictMode: true });
          
          extractedText = encodingResult.cleanedText;
          decodedContent = extractedText;
          
          // TXT 파일도 원본 바이너리 데이터 저장 (이미 설정됨)
          console.log(`📄 TXT 파일 처리 완료:`, {
            fileName,
            extractedLength: extractedText.length,
            hasOriginalBinaryData: !!originalBinaryData,
            originalBinaryDataLength: originalBinaryData?.length || 0
          });
          
          console.log(`📄 Base64 TXT 텍스트 처리 결과:`, {
            fileName,
            originalLength: fileBuffer.length,
            cleanedLength: extractedText.length,
            encoding: encodingResult.encoding,
            hasIssues: encodingResult.hasIssues,
            issues: encodingResult.issues
          });
        }
      } catch (error) {
        console.error('Base64 디코딩 및 텍스트 추출 오류:', error);
        return NextResponse.json(
          { success: false, error: '파일 처리에 실패했습니다.' },
          { status: 400 }
        );
      }
      
      // 문서 생성
      const documentId = `doc_${Date.now()}`;
      const documentData: DocumentData = {
        id: documentId,
        title: fileName,
        content: decodedContent,
        type: getFileTypeFromExtension(fileName),
        file_size: fileSize,
        file_type: fileType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // RAG 처리 (청킹 + 임베딩 + 저장)
      console.log('🔄 RAG 처리 시작 (Base64)...');
      const ragResult = await ragProcessor.processDocument(documentData, false, originalBinaryData);
      console.log('✅ RAG 처리 완료 (Base64):', ragResult);
      
      // Supabase에 저장되므로 메모리 배열 추가 불필요
      
      console.log('✅ Base64 파일 업로드 및 RAG 처리 완료:', {
        documentId,
        fileName,
        fileSize,
        chunkCount: ragResult.chunkCount,
        success: ragResult.success,
        totalDocuments: documents.length
      });

      return NextResponse.json({
        success: true,
        data: {
          documentId: documentId,
          message: ragResult.success 
            ? `파일이 성공적으로 업로드되고 ${ragResult.chunkCount}개 청크로 처리되었습니다.`
            : '파일 업로드는 성공했지만 RAG 처리 중 오류가 발생했습니다.',
          status: ragResult.success ? 'completed' : 'failed',
          chunkCount: ragResult.chunkCount
        }
      });
    }

    return NextResponse.json(
      { success: false, error: '지원하지 않는 Content-Type입니다.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ 업로드 API 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 문서 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    console.log('📋 문서 목록 조회 (Supabase 기반):', { limit, offset, status, type });

    // Supabase 클라이언트 생성
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' },
        global: {
          fetch: (url, options = {}) => {
            return fetch(url, {
              ...options,
              signal: AbortSignal.timeout(30000) // 30초 타임아웃
            });
          }
        }
      }
    );

    // Supabase에서 문서 목록 조회 (최적화)
    let query = supabase
      .from('documents')
      .select('id, title, type, status, chunk_count, file_size, file_type, created_at, updated_at, document_url, url, size')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 필터 적용
    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: documents, error: documentsError } = await query;

    if (documentsError) {
      console.error('❌ 문서 조회 오류:', documentsError);
      throw new Error(`문서 조회 실패: ${documentsError.message}`);
    }

    console.log('📊 Supabase 쿼리 결과:', {
      documents: documents,
      documentsLength: documents?.length,
      firstDocument: documents?.[0],
      error: documentsError
    });

    // 전체 문서 수 조회 (통계용)
    let countQuery = supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    if (type) {
      countQuery = countQuery.eq('type', type);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('❌ 문서 수 조회 오류:', countError);
    }

    // 통계 계산 (실제 문서 데이터 기반)
    const fileDocuments = documents?.filter(doc => ['pdf', 'docx', 'txt'].includes(doc.type)) || [];
    const urlDocuments = documents?.filter(doc => doc.type === 'url') || [];
    
    const stats = {
      // 전체 통계 (기존 호환성 유지)
      totalDocuments: totalCount || 0,
      completedDocuments: documents?.filter(doc => doc.status === 'indexed' || doc.status === 'completed').length || 0,
      totalChunks: documents?.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0) || 0,
      pendingDocuments: documents?.filter(doc => doc.status === 'processing').length || 0,
      failedDocuments: documents?.filter(doc => doc.status === 'failed').length || 0,
      
      // 파일 문서 통계 (PDF, DOCX, TXT)
      fileStats: {
        totalDocuments: fileDocuments.length,
        completedDocuments: fileDocuments.filter(doc => doc.status === 'indexed' || doc.status === 'completed').length,
        totalChunks: fileDocuments.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0),
        pendingDocuments: fileDocuments.filter(doc => doc.status === 'processing').length,
        failedDocuments: fileDocuments.filter(doc => doc.status === 'failed').length,
      },
      
      // URL 문서 통계
      urlStats: {
        totalDocuments: urlDocuments.length,
        completedDocuments: urlDocuments.filter(doc => doc.status === 'indexed' || doc.status === 'completed').length,
        totalChunks: urlDocuments.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0),
        pendingDocuments: urlDocuments.filter(doc => doc.status === 'processing').length,
        failedDocuments: urlDocuments.filter(doc => doc.status === 'failed').length,
      }
    };

    console.log('📊 문서 목록 조회 완료 (Supabase):', {
      documentsCount: documents?.length || 0,
      totalDocuments: totalCount || 0,
      stats: stats
    });

    // documents 배열이 null이거나 undefined인 경우 빈 배열로 처리
    const safeDocuments = documents || [];
    
    // content 필드를 제거하여 응답 크기를 줄이고 직렬화 문제를 방지
    const documentsForResponse = safeDocuments.map(doc => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      status: doc.status,
      chunk_count: doc.chunk_count,
      file_size: doc.file_size,
      file_type: doc.file_type,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      document_url: doc.document_url,
      url: doc.url,
      size: doc.size
      // content 필드는 제외 (너무 크고 UI에서 사용하지 않음)
    }));
    
    console.log('📤 API 응답 전송:', {
      success: true,
      documentsCount: documentsForResponse.length,
      firstDocument: documentsForResponse[0],
      stats: stats
    });

    return NextResponse.json({
      success: true,
      data: {
        documents: documentsForResponse,
        stats: stats,
        pagination: {
          limit,
          offset,
          total: totalCount || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ 문서 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '문서 목록 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : JSON.stringify(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 파일 덮어쓰기 처리
 */
export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      return await handleFileOverwrite(request);
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: '지원하지 않는 Content-Type입니다.' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ 파일 덮어쓰기 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '파일 덮어쓰기 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 파일 덮어쓰기 처리 함수
 */
async function handleFileOverwrite(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const existingDocumentId = formData.get('documentId') as string;

    if (!file || !fileName || !existingDocumentId) {
      return NextResponse.json(
        { 
          success: false,
          error: '파일, 파일명, 문서 ID가 모두 필요합니다.' 
        },
        { status: 400 }
      );
    }

    // 파일 내용 읽기 (텍스트 파일만)
    let fileContent;
    
    // 텍스트 파일만 처리 (PDF/DOCX는 위에서 이미 처리됨)
    fileContent = await file.text();
    console.log('📄 텍스트 파일 처리:', {
      fileName,
      fileType: file.type,
      fileSize: file.size
    });
    
    // 문서 업데이트
    const documentId = existingDocumentId;
    const documentData: DocumentData = {
      id: documentId,
      title: fileName,
      content: fileContent,
      type: 'file',
      file_size: file.size,
      file_type: file.type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // RAG 처리 (청킹 + 임베딩 + 저장)
    console.log('🔄 파일 덮어쓰기 RAG 처리 시작...');
    const ragResult = await ragProcessor.processDocument(documentData);

    // 메모리 저장소 업데이트
    const documentIndex = documents.findIndex(doc => doc.id === documentId);
    if (documentIndex !== -1) {
      documents[documentIndex] = {
        id: documentId,
        title: fileName,
        type: getFileTypeFromExtension(fileName),
        status: ragResult.success ? 'completed' : 'failed',
        content: fileContent.substring(0, 1000),
        chunk_count: ragResult.chunkCount,
        file_size: file.size,
        file_type: file.type,
        created_at: documents[documentIndex].created_at,
        updated_at: new Date().toISOString()
      };
    }
    
    console.log(`✅ 파일 덮어쓰기 완료: ${fileName} -> ${documentId}`);

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 덮어쓰기되었습니다.',
      data: {
        documentId: documentId,
        message: ragResult.success 
          ? `파일이 성공적으로 덮어쓰기되고 ${ragResult.chunkCount}개 청크로 처리되었습니다.`
          : '파일 덮어쓰기는 성공했지만 RAG 처리 중 오류가 발생했습니다.',
        status: ragResult.success ? 'completed' : 'failed',
        chunkCount: ragResult.chunkCount
      }
    });

  } catch (error) {
    console.error('❌ 파일 덮어쓰기 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '파일 덮어쓰기 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 문서 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const url = searchParams.get('url');

    if (!documentId && !url) {
      return NextResponse.json(
        { 
          success: false,
          error: '문서 ID 또는 URL이 제공되지 않았습니다.' 
        },
        { status: 400 }
      );
    }

    console.log('🗑️ 문서 삭제 요청:', { documentId, url });

    // Supabase 클라이언트 생성
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let targetDocumentId = documentId;

    // URL이 제공된 경우, URL로 문서 ID를 찾기
    if (url && !documentId) {
      const { data: documents, error: findError } = await supabase
        .from('documents')
        .select('id, title, url')
        .eq('url', url)
        .limit(1);

      if (findError) {
        throw new Error(`문서 검색 실패: ${findError.message}`);
      }

      if (!documents || documents.length === 0) {
        return NextResponse.json(
          { 
            success: false,
            error: '해당 URL과 일치하는 문서를 찾을 수 없습니다.' 
          },
          { status: 404 }
        );
      }

      targetDocumentId = documents[0].id;
    }

    // 문서와 관련된 모든 청크 삭제
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', targetDocumentId);

    if (chunksError) {
      console.warn('청크 삭제 실패:', chunksError);
    }

    // 문서 삭제
    const { error: documentError } = await supabase
      .from('documents')
      .delete()
      .eq('id', targetDocumentId);

    if (documentError) {
      throw new Error(`문서 삭제 실패: ${documentError.message}`);
    }

    // 메모리에서도 삭제
    documents = documents.filter(doc => doc.id !== targetDocumentId);

    console.log(`✅ 문서 삭제 완료: ${targetDocumentId}`);

    return NextResponse.json({
      success: true,
      message: '문서와 관련된 모든 데이터가 성공적으로 삭제되었습니다.',
      data: {
        deletedChunks: 0, // 실제로는 삭제된 청크 수를 반환해야 함
        deletedEmbeddings: 0
      }
    });

  } catch (error) {
    console.error('❌ 문서 삭제 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '문서 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}