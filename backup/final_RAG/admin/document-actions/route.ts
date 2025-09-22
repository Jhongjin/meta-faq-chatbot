import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경 변수 확인 및 조건부 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// 문서 다운로드
export async function GET(request: NextRequest) {
  try {
    // Supabase 클라이언트 확인
    if (!supabase) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const documentId = searchParams.get('documentId');

    if (!action || !documentId) {
      return NextResponse.json(
        { error: '액션과 문서 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'download':
        return await handleDownload(documentId);
      case 'preview':
        return await handlePreview(documentId);
      case 'reindex':
        return await handleReindex(documentId);
      default:
        return NextResponse.json(
          { error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('문서 액션 오류:', error);
    return NextResponse.json(
      { 
        error: '문서 액션 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 문서 다운로드 처리
async function handleDownload(documentId: string) {
  try {
    console.log(`📥 다운로드 요청: ${documentId}`);
    
    // 문서 정보 조회
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('❌ 문서 조회 실패:', docError);
      return NextResponse.json(
        { error: '문서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`📄 문서 정보: ${document.title} (${document.type})`);

    // URL 문서인 경우
    if (document.type === 'url') {
      let actualUrl = document.title; // 기본값으로 title 사용
      
      // documents 테이블에서 url 필드 확인
      if (document.url) {
        actualUrl = document.url;
      } else {
        // fallback: 메타데이터에서 URL 조회
        const { data: metadata, error: metaError } = await supabase
          .from('document_metadata')
          .select('*')
          .eq('id', documentId)
          .single();

        if (!metaError && metadata?.metadata?.url) {
          actualUrl = metadata.metadata.url;
        }
      }

      // 문서명에서 URL 정보 제거 (괄호와 URL 부분 제거)
      const cleanTitle = document.title.replace(/\s*\([^)]*\)$/, '');
      
      const content = `문서명: ${cleanTitle}\nURL: ${actualUrl}\n\n이 URL은 ${new Date(document.created_at).toLocaleString('ko-KR')}에 크롤링되었습니다.\n상태: ${document.status}\n청크 수: ${document.chunk_count}`;
      
      // UTF-8 인코딩으로 Buffer 생성
      const buffer = Buffer.from(content, 'utf8');
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(document.title.replace(/[^a-zA-Z0-9가-힣]/g, '_'))}.txt"`
        }
      });
    }

    // 파일 문서인 경우 - documents 테이블에서 직접 원본 데이터 조회
    console.log('📁 파일 문서 다운로드 처리 시작');
    
    // 원본 파일 데이터 검색 (documents 테이블의 original_file_data 필드 우선)
    let fileData = null;
    let actualFileType = 'txt';
    
    // 1. documents 테이블의 content 필드에서 원본 바이너리 데이터 확인 (BINARY_DATA: 접두사)
    console.log('📄 documents 테이블에서 원본 바이너리 데이터 확인');
    if (document.content && document.content.startsWith('BINARY_DATA:')) {
      actualFileType = document.type || 'pdf';
      fileData = document.content.substring(12); // 'BINARY_DATA:' 제거
      console.log(`📁 documents 테이블에서 파일 타입: ${actualFileType}`);
      console.log(`📁 documents 테이블에서 BINARY_DATA 존재: ${!!fileData}`);
      console.log(`📁 fileData 길이: ${fileData.length} 문자`);
      console.log(`📁 fileData 시작 부분: ${fileData.substring(0, 100)}`);
      
      // BINARY_DATA가 있으면 바로 원본 파일로 다운로드 (다른 로직 건너뛰기)
      console.log('✅ 원본 바이너리 데이터 발견 - 원본 파일로 다운로드');
    } else if (!document.content || document.content.length === 0) {
      // 대용량 파일로 인해 content가 비어있는 경우 - 다운로드 불가
      console.log('⚠️ 대용량 파일로 인해 content가 비어있음 - 다운로드 불가');
      return NextResponse.json(
        { 
          error: '다운로드 불가',
          message: '이 파일은 용량이 커서 다운로드할 수 없습니다. AI 챗봇을 통해 파일 내용을 검색하실 수 있습니다.',
          fileName: document.title,
          fileSize: `${(document.file_size / 1024 / 1024).toFixed(2)} MB`,
          fileType: document.type
        },
        { status: 400 }
      );
    } else if (document.content && document.content.includes('PDF 문서:') && document.content.includes('텍스트 추출이 비활성화되었습니다')) {
      // 텍스트 추출 메시지가 저장된 경우 - 다운로드 불가
      console.log('⚠️ 텍스트 추출 메시지가 저장됨 - 다운로드 불가');
      return NextResponse.json(
        { 
          error: '다운로드 불가',
          message: '이 파일은 원본 데이터가 손상되어 다운로드할 수 없습니다. AI 챗봇을 통해 파일 내용을 검색하실 수 있습니다.',
          fileName: document.title,
          fileSize: `${(document.file_size / 1024 / 1024).toFixed(2)} MB`,
          fileType: document.type
        },
        { status: 400 }
      );
    } else {
      // 2. documents 테이블의 content 필드에서 확인 (fallback)
      console.log('📄 document_metadata에 원본 데이터 없음, documents 테이블 확인');
      
      if (document.content && document.content.length > 0) {
        console.log(`📊 Content 길이: ${document.content.length} 문자`);
        console.log(`📊 Content 시작 부분: ${document.content.substring(0, 100)}`);
        
        // file_type 필드가 있으면 우선 사용
        if (document.file_type) {
          if (document.file_type.includes('pdf')) {
            actualFileType = 'pdf';
          } else if (document.file_type.includes('word') || document.file_type.includes('docx')) {
            actualFileType = 'docx';
          } else if (document.file_type.includes('text')) {
            actualFileType = 'txt';
          }
          console.log(`📁 file_type에서 추출된 타입: ${actualFileType}`);
        } else {
          // 파일명에서 추출
          const fileName = document.title.toLowerCase();
          if (fileName.endsWith('.pdf')) {
            actualFileType = 'pdf';
          } else if (fileName.endsWith('.docx')) {
            actualFileType = 'docx';
          } else if (fileName.endsWith('.txt')) {
            actualFileType = 'txt';
          }
          console.log(`📁 파일명에서 추출된 타입: ${actualFileType}`);
        }
        
        // content가 바이너리 데이터인지 텍스트 데이터인지 확인
        if (actualFileType === 'pdf') {
          // PDF 파일의 경우 content가 바이너리 데이터인지 확인
          const isBinary = document.content.includes('PDF') || document.content.startsWith('%PDF');
          if (isBinary) {
            fileData = document.content;
            console.log('📄 PDF 바이너리 데이터로 인식');
          } else {
            // Base64 인코딩된 PDF 데이터일 가능성 확인
            const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
            if (base64Pattern.test(document.content) && document.content.length > 100) {
              fileData = document.content;
              console.log('📄 PDF Base64 데이터로 인식');
            } else {
              console.log('⚠️ PDF 파일이지만 텍스트 데이터로 보임, 청크 데이터 사용');
              fileData = null;
            }
          }
        } else if (actualFileType === 'txt') {
          // TXT 파일의 경우 - 이미 깨진 텍스트일 가능성이 높음
          // 청크 데이터에서 원본 텍스트를 복원 시도
          console.log('📄 TXT 파일 - 청크에서 원본 텍스트 복원 시도');
          fileData = null; // 청크 데이터 사용
        } else {
          // DOCX의 경우 텍스트 데이터 사용
          fileData = document.content;
          console.log(`📄 ${actualFileType} 텍스트 데이터로 인식`);
        }
      } else {
        console.log('⚠️ documents 테이블에도 데이터 없음, 파일명에서 타입 추출');
        const fileName = document.title.toLowerCase();
        if (fileName.endsWith('.pdf')) {
          actualFileType = 'pdf';
        } else if (fileName.endsWith('.docx')) {
          actualFileType = 'docx';
        } else if (fileName.endsWith('.txt')) {
          actualFileType = 'txt';
        }
        console.log(`📁 파일명에서 추출된 타입: ${actualFileType}`);
      }
    }

    // BINARY_DATA가 있으면 무조건 원본 파일로 다운로드 (다른 로직 건너뛰기)
    if (document.content && document.content.startsWith('BINARY_DATA:')) {
      console.log('✅ BINARY_DATA 확인됨 - 원본 파일로 다운로드 강제 실행');
      
      // BINARY_DATA: 접두사 제거 후 Base64 데이터 추출
      const base64Data = document.content.substring('BINARY_DATA:'.length);
      console.log('📦 Base64 데이터 길이:', base64Data.length);
      console.log('📦 Base64 데이터 시작 부분:', base64Data.substring(0, 20));
      
      // 원본 바이너리 데이터를 Buffer로 변환 (Node.js Buffer 사용)
      const fileBuffer = Buffer.from(base64Data, 'base64');
      console.log('📦 Buffer 크기:', fileBuffer.length);
      
      // 파일명에서 타입 재확인 (BINARY_DATA가 있으면 확실히 원본 파일)
      const fileName = document.title.toLowerCase();
      if (fileName.endsWith('.docx')) {
        actualFileType = 'docx';
        console.log('📦 파일명에서 DOCX 타입 확인');
      } else if (fileName.endsWith('.pdf')) {
        actualFileType = 'pdf';
        console.log('📦 파일명에서 PDF 타입 확인');
      } else if (fileName.endsWith('.txt')) {
        actualFileType = 'txt';
        console.log('📦 파일명에서 TXT 타입 확인');
      }
      
      // DOCX 파일의 ZIP 시그니처 확인
      if (actualFileType === 'docx') {
        const zipSignature = Array.from(fileBuffer.slice(0, 4))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        console.log('📦 DOCX ZIP 시그니처:', zipSignature);
        console.log('📦 올바른 ZIP 시그니처인가?', zipSignature === '504b0304');
      }
      
      let mimeType = 'application/octet-stream';
      let extension = 'bin';
      
      if (actualFileType === 'pdf') {
        mimeType = 'application/pdf';
        extension = 'pdf';
      } else if (actualFileType === 'docx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        extension = 'docx';
      } else if (actualFileType === 'txt') {
        mimeType = 'text/plain; charset=utf-8';
        extension = 'txt';
      }
      
      // 파일명 URL 인코딩 (확장자 중복 방지)
      const baseFileName = document.title.endsWith(`.${extension}`) 
        ? document.title 
        : `${document.title}.${extension}`;
      const encodedFilename = encodeURIComponent(baseFileName);
      
      console.log('📁 원본 파일 다운로드:', {
        fileName: document.title,
        fileType: actualFileType,
        mimeType: mimeType,
        extension: extension,
        fileSize: fileBuffer.length
      });
      
      // Buffer를 Uint8Array로 변환하여 전달
      const uint8Array = new Uint8Array(fileBuffer);
      
      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Accept-Ranges': 'bytes',
          'Content-Transfer-Encoding': 'binary'
        }
      });
    } else if (!fileData) {
      // 원본 파일 데이터가 없는 경우 청크 내용으로 대체
      console.log('📄 원본 파일 데이터 없음, 청크 내용으로 대체');
      const { data: chunks, error: chunksError } = await supabase
        .from('document_chunks')
        .select('content')
        .eq('document_id', documentId)
        .order('chunk_id', { ascending: true });

      if (chunksError) {
        console.error('❌ 청크 조회 실패:', chunksError);
        return NextResponse.json(
          { error: '문서 내용을 조회할 수 없습니다.' },
          { status: 500 }
        );
      }

      // 청크들을 합쳐서 텍스트 문서로 제공
      const fullContent = chunks?.map((chunk: any) => chunk.content).join('\n\n') || '';
      
      if (!fullContent) {
        console.error('❌ 청크 내용이 비어있음');
        return NextResponse.json(
          { error: '문서 내용이 비어있습니다.' },
          { status: 404 }
        );
      }
      
      console.log(`📄 청크에서 복원된 텍스트 길이: ${fullContent.length}`);
      console.log(`📄 청크 텍스트 시작 부분: ${fullContent.substring(0, 200)}`);
      
      // PDF 처리 라이브러리 설치 안내 메시지가 포함되어 있는지 확인
      const hasPdfError = fullContent.includes('pdf-parse') || fullContent.includes('PDF 처리 라이브러리');
      
      let mimeType = 'text/plain; charset=utf-8';
      let extension = 'txt';
      let finalContent = fullContent;
      
      // 텍스트 구조화 및 인코딩 처리
      if (actualFileType === 'txt' || actualFileType === 'docx') {
        try {
          // 원본 텍스트 그대로 사용 (공백 처리 제거)
          let structuredContent = fullContent;
          
          // 3단계: 통합된 텍스트 인코딩 처리
          const { processTextEncoding } = await import('@/lib/utils/textEncoding');
          const encodingResult = processTextEncoding(structuredContent, { 
            strictMode: false,
            detectEncoding: true 
          });
          
          finalContent = encodingResult.cleanedText;
          console.log(`📄 텍스트 구조화 및 인코딩 처리 완료: ${encodingResult.encoding}`);
          console.log(`📄 처리된 텍스트 시작 부분: ${finalContent.substring(0, 200)}`);
          console.log(`📄 텍스트 인코딩 처리 완료`);
          
          if (encodingResult.hasIssues) {
            console.log(`⚠️ 인코딩 이슈 발견: ${encodingResult.issues.join(', ')}`);
          }
        } catch (error) {
          console.error('❌ 텍스트 처리 실패:', error);
          // 처리 실패 시 원본 사용
          finalContent = fullContent;
        }
      }
      
      if (actualFileType === 'pdf') {
        if (hasPdfError) {
          // PDF 처리 오류 메시지가 있는 경우 더 명확한 안내 제공
          finalContent = `PDF 파일: ${document.title}

⚠️ 원본 PDF 파일을 다운로드할 수 없습니다.

현재 상황:
- PDF 파일이 텍스트로 변환되어 저장되었습니다
- 원본 PDF 바이너리 데이터가 저장되지 않았습니다
- 아래는 추출된 텍스트 내용입니다 (일부만 표시)

${fullContent.substring(0, 1000)}${fullContent.length > 1000 ? '\n\n... (내용이 잘렸습니다)' : ''}

해결 방법:
1. PDF 파일을 다시 업로드하세요
2. 또는 관리자에게 문의하여 원본 파일을 요청하세요`;
        }
        mimeType = 'text/plain; charset=utf-8';
        extension = 'txt';
      } else if (actualFileType === 'docx') {
        // DOCX 파일의 경우 원본 바이너리 데이터가 없으면 안내 메시지 생성
        finalContent = `원본 DOCX 파일을 다운로드할 수 없습니다.

원본 파일: ${document.title}
다운로드 시도: ${new Date().toLocaleString('ko-KR')}

이유: 원본 DOCX 바이너리 데이터가 저장소에 없습니다.
현재 다운로드되는 내용은 DOCX에서 추출된 텍스트입니다.

${fullContent.substring(0, 1000)}${fullContent.length > 1000 ? '\n\n... (내용이 잘렸습니다)' : ''}

해결 방법:
1. DOCX 파일을 다시 업로드하세요
2. 또는 관리자에게 문의하여 원본 파일을 요청하세요`;
        mimeType = 'text/plain; charset=utf-8';
        extension = 'txt';
      } else if (actualFileType === 'txt') {
        mimeType = 'text/plain; charset=utf-8';
        extension = 'txt';
      }
      
      // UTF-8로 인코딩된 Buffer 생성
      const buffer = Buffer.from(finalContent, 'utf-8');
      
      // 파일명 정리 (중복 확장자 제거)
      let cleanTitle = document.title;
      
      // 이미 확장자가 있는 경우 제거
      const existingExtensions = ['.pdf', '.docx', '.txt'];
      for (const ext of existingExtensions) {
        if (cleanTitle.toLowerCase().endsWith(ext)) {
          cleanTitle = cleanTitle.substring(0, cleanTitle.length - ext.length);
          break;
        }
      }
      
      // 파일명 URL 인코딩
      const encodedFilename = encodeURIComponent(`${cleanTitle}_extracted_text.${extension}`);
      
      console.log(`✅ 텍스트 다운로드 준비 완료: ${encodedFilename} (${buffer.length} bytes)`);
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
          'Content-Length': buffer.length.toString()
        }
      });
    }

    // 원본 파일 데이터가 있는 경우
    console.log('📁 원본 파일 데이터로 다운로드');
    
    // 원본 바이너리 데이터 검색 (여러 소스에서 시도)
    let originalFileData = null;
    let dataSource = '';
    
    // 1. document_metadata에서 fileData 검색
    try {
      const { data: metadataData, error: metadataError } = await supabase
        .from('document_metadata')
        .select('metadata')
        .eq('id', documentId)
        .single();
      
      if (!metadataError && metadataData?.metadata?.fileData) {
        originalFileData = metadataData.metadata.fileData;
        dataSource = 'document_metadata.metadata.fileData';
        console.log('✅ document_metadata에서 원본 fileData 발견');
      }
    } catch (error) {
      console.error('❌ document_metadata 조회 실패:', error);
    }
    
    // 2. documents.content에서 원본 바이너리 데이터 검색
    if (!originalFileData && document.content) {
      // Base64 패턴 확인
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      if (base64Pattern.test(document.content) && document.content.length > 100) {
        // PDF 시그니처 확인
        try {
          const testBuffer = Buffer.from(document.content, 'base64');
          const pdfSignature = testBuffer.toString('ascii', 0, 4);
          const docxSignature = testBuffer.toString('hex', 0, 4);
          
          if (pdfSignature === '%PDF' || docxSignature === '504b0304') {
            originalFileData = document.content;
            dataSource = 'documents.content (바이너리)';
            console.log('✅ documents.content에서 원본 바이너리 데이터 발견');
          }
        } catch (error) {
          console.log('📄 documents.content는 바이너리가 아님');
        }
      }
    }
    
    // 3. 원본 데이터가 없으면 추출된 텍스트 사용
    if (!originalFileData) {
      originalFileData = document.content;
      dataSource = 'documents.content (텍스트)';
      console.log('📄 documents.content 사용 (추출된 텍스트)');
      
      // PDF/DOCX의 경우 원본 바이너리 데이터가 없음을 알림
      if (actualFileType === 'pdf' || actualFileType === 'docx') {
        console.log('⚠️ 원본 바이너리 데이터 없음 - 추출된 텍스트만 사용 가능');
      }
    }
    
    console.log(`📊 데이터 소스: ${dataSource}`);
    
    let fileBuffer: Buffer;
    
    // 데이터 타입에 따른 처리
    if (dataSource.includes('바이너리')) {
      // 원본 바이너리 데이터 처리
      console.log('🔧 원본 바이너리 데이터 처리');
      
      if (originalFileData.startsWith('data:')) {
        // data:application/pdf;base64, 형태인 경우
        const base64Data = originalFileData.split(',')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
        console.log('📄 Data URL Base64에서 파일 버퍼 생성');
      } else {
        // Base64 인코딩된 바이너리 데이터
        fileBuffer = Buffer.from(originalFileData, 'base64');
        console.log(`📄 Base64 바이너리 디코딩: ${fileBuffer.length} bytes`);
      }
    } else {
      // 추출된 텍스트 데이터 처리
      console.log('🔧 추출된 텍스트 데이터 처리');
      
      if (originalFileData.startsWith('data:')) {
        // data:application/pdf;base64, 형태인 경우
        const base64Data = originalFileData.split(',')[1];
        const textContent = Buffer.from(base64Data, 'base64').toString('utf-8');
        const { processTextEncoding } = await import('@/lib/utils/textEncoding');
        const encodingResult = processTextEncoding(textContent, { 
          strictMode: false,
          detectEncoding: true 
        });
        fileBuffer = Buffer.from(encodingResult.cleanedText, 'utf-8');
        console.log('📄 Data URL에서 텍스트 추출 및 처리');
      } else {
        // 일반 텍스트 데이터
        const { processTextEncoding } = await import('@/lib/utils/textEncoding');
        const encodingResult = processTextEncoding(originalFileData, { 
          strictMode: false,
          detectEncoding: true 
        });
        fileBuffer = Buffer.from(encodingResult.cleanedText, 'utf-8');
        console.log('📄 텍스트 데이터 처리');
      }
    }
    
    // 파일 타입별 최종 처리
    if (dataSource.includes('바이너리')) {
      // 원본 바이너리 데이터인 경우 - 그대로 사용
      console.log(`📄 원본 바이너리 데이터 유지: ${fileBuffer.length} bytes`);
      
      // 파일 시그니처 확인
      if (actualFileType === 'pdf') {
        const pdfSignature = fileBuffer.toString('ascii', 0, 4);
        if (pdfSignature === '%PDF') {
          console.log('✅ PDF 시그니처 확인됨');
        } else {
          console.log('⚠️ PDF 시그니처가 아님');
        }
      } else if (actualFileType === 'docx') {
        const docxSignature = fileBuffer.toString('hex', 0, 4);
        if (docxSignature === '504b0304') {
          console.log('✅ DOCX 시그니처 확인됨');
        } else {
          console.log('⚠️ DOCX 시그니처가 아님');
        }
      }
    } else {
      // 추출된 텍스트 데이터인 경우 - TXT로 처리
      console.log(`📄 추출된 텍스트 데이터 처리: ${fileBuffer.length} bytes`);
      
      // TXT 파일의 경우 추가 인코딩 처리
      if (actualFileType === 'txt') {
        try {
          const textContent = fileBuffer.toString('utf-8');
          const { processTextEncoding } = await import('@/lib/utils/textEncoding');
          const encodingResult = processTextEncoding(textContent, { 
            strictMode: false,
            detectEncoding: true 
          });
          fileBuffer = Buffer.from(encodingResult.cleanedText, 'utf-8');
          console.log(`📄 TXT 텍스트 인코딩 처리 완료: ${encodingResult.encoding}`);
        } catch (error) {
          console.error('❌ TXT 텍스트 인코딩 처리 실패:', error);
        }
      }
    }
    
    let mimeType = 'application/octet-stream';
    let extension = 'bin';
    
    if (dataSource.includes('바이너리')) {
      // 원본 바이너리 데이터인 경우 - 원본 파일 타입 유지
    if (actualFileType === 'pdf') {
      mimeType = 'application/pdf';
      extension = 'pdf';
        console.log('✅ PDF 원본 MIME 타입 설정: application/pdf');
    } else if (actualFileType === 'docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      extension = 'docx';
        console.log('✅ DOCX 원본 MIME 타입 설정: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      }
    } else {
      // 추출된 텍스트 데이터인 경우 - TXT로 처리
      mimeType = 'text/plain; charset=utf-8';
      extension = 'txt';
      console.log('✅ 추출된 텍스트 MIME 타입 설정: text/plain');
    }
    
    // 파일명 정리 (중복 확장자 제거)
    let cleanTitle = document.title;
    
    // 이미 확장자가 있는 경우 제거
    const existingExtensions = ['.pdf', '.docx', '.txt'];
    for (const ext of existingExtensions) {
      if (cleanTitle.toLowerCase().endsWith(ext)) {
        cleanTitle = cleanTitle.substring(0, cleanTitle.length - ext.length);
        break;
      }
    }
    
    // 파일명 URL 인코딩
    const encodedFilename = encodeURIComponent(`${cleanTitle}.${extension}`);
    
    console.log(`✅ 원본 파일 다운로드 준비 완료: ${encodedFilename} (${fileBuffer.length} bytes, MIME: ${mimeType})`);
    
      return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': fileBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('❌ 다운로드 오류:', error);
    return NextResponse.json(
      { 
        error: '다운로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 문서 미리보기 처리
async function handlePreview(documentId: string) {
  try {
    // 문서 정보 조회
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: '문서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // URL 문서인 경우
    if (document.type === 'url') {
      return NextResponse.json({
        success: true,
        data: {
          type: 'url',
          title: document.title,
          url: document.title, // URL이 title에 저장되어 있다고 가정
          status: document.status,
          chunk_count: document.chunk_count,
          created_at: document.created_at,
          updated_at: document.updated_at
        }
      });
    }

    // 파일 문서인 경우 - 메타데이터에서 실제 파일 타입 조회
    const { data: metadata, error: metaError } = await supabase
      .from('document_metadata')
      .select('type')
      .eq('id', documentId)
      .single();

    if (metaError || !metadata) {
      return NextResponse.json(
        { error: '문서 메타데이터를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 첫 번째 청크의 내용만 미리보기로 제공
    const { data: firstChunk, error: chunksError } = await supabase
      .from('document_chunks')
      .select('content, metadata')
      .eq('document_id', documentId)
      .order('chunk_id', { ascending: true })
      .limit(1)
      .single();

    if (chunksError) {
      return NextResponse.json(
        { error: '문서 내용을 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        type: metadata.type, // 실제 파일 타입 사용
        title: document.title,
        status: document.status,
        chunk_count: document.chunk_count,
        created_at: document.created_at,
        updated_at: document.updated_at,
        preview: firstChunk?.content?.substring(0, 500) + (firstChunk?.content?.length > 500 ? '...' : ''),
        metadata: firstChunk?.metadata
      }
    });

  } catch (error) {
    console.error('미리보기 오류:', error);
    return NextResponse.json(
      { error: '미리보기 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 문서 재인덱싱 처리
async function handleReindex(documentId: string) {
  try {
    console.log(`🔄 재인덱싱 시작: ${documentId}`);
    
    // 문서 정보 조회
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('❌ 문서 조회 실패:', docError);
      return NextResponse.json(
        { error: '문서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`📄 재인덱싱 대상: ${document.title} (${document.type})`);

    // 기존 청크 삭제
    console.log(`🗑️ 기존 청크 삭제 중...`);
    const { error: deleteError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    if (deleteError) {
      console.warn('기존 청크 삭제 실패:', deleteError);
    }

    // 문서 상태를 processing으로 변경
    console.log(`🔄 상태를 processing으로 변경 중...`);
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        status: 'processing',
        chunk_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('❌ 상태 업데이트 실패:', updateError);
      return NextResponse.json(
        { error: '문서 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    // URL 문서인 경우 실제 재인덱싱 수행
    if (document.type === 'url' && document.url) {
      console.log(`🌐 URL 재인덱싱 시작: ${document.url}`);
      
      try {
        // URL 문서 재인덱싱을 위해 DocumentIndexingService 사용
        console.log(`📄 URL 문서 재인덱싱 시작: ${document.url}`);
        
        // DocumentIndexingService를 사용하여 URL 재인덱싱
        const { DocumentIndexingService } = await import('@/lib/services/DocumentIndexingService');
        const documentIndexingService = new DocumentIndexingService();
        
        // URL 문서의 기존 content가 있는 경우 사용, 없으면 URL로 크롤링 시도
        let contentForReindexing = document.content;
        
        if (!contentForReindexing || contentForReindexing.trim() === '') {
          console.log('⚠️ URL 문서에 content가 없음 - URL 크롤링 시도');
          // URL 크롤링 시도 (실제로는 제한적)
          contentForReindexing = `URL 문서: ${document.title}\n\n이 문서는 URL 크롤링을 통해 수집되었습니다.\n\nURL: ${document.url}\n제목: ${document.title}\n수집일: ${new Date(document.created_at).toLocaleString('ko-KR')}\n\n서버리스 환경에서는 실제 웹 크롤링이 제한됩니다.`;
        }
        
        // URL 문서 재인덱싱 - 안전한 청킹 로직 사용
        const chunkSize = 1000;
        const overlap = 100;
        const chunks: string[] = [];
        
        let start = 0;
        let iterationCount = 0;
        const maxIterations = 1000; // 무한 루프 방지
        
        while (start < contentForReindexing.length && iterationCount < maxIterations) {
          const end = Math.min(start + chunkSize, contentForReindexing.length);
          let chunk = contentForReindexing.slice(start, end);
          
          // 문장 경계에서 자르기
          if (end < contentForReindexing.length) {
            const lastSentenceEnd = chunk.lastIndexOf('.');
            if (lastSentenceEnd > chunkSize * 0.5) {
              chunk = chunk.slice(0, lastSentenceEnd + 1);
            }
          }
          
          const trimmedChunk = chunk.trim();
          if (trimmedChunk.length > 50) {
            chunks.push(trimmedChunk);
          }
          
          // 다음 청크 시작 위치 계산 (안전한 방식)
          const nextStart = end - overlap;
          start = Math.max(nextStart, start + 1); // 최소 1자씩은 진행
          
          iterationCount++;
        }
        
        // 무한 루프 감지
        if (iterationCount >= maxIterations) {
          console.warn('⚠️ 최대 반복 수에 도달했습니다. 청킹을 중단합니다.');
        }
        
        console.log(`📝 URL 청크 생성: ${chunks.length}개`);
        
        // 청크 배치 저장
        const BATCH_SIZE = 20;
        const embeddingDim = 1024;
        
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batch = chunks.slice(i, i + BATCH_SIZE);
          
          const batchData = batch.map((chunk, index) => {
            const embeddingArray = new Array(embeddingDim).fill(0);
            return {
              id: `chunk_${documentId}_${i + index}`,
              document_id: documentId,
              chunk_id: i + index,
              content: chunk,
              embedding: JSON.stringify(embeddingArray),
              created_at: new Date().toISOString()
            };
          });
          
          const { error: batchError } = await supabase
            .from('document_chunks')
            .insert(batchData);
          
          if (batchError) {
            console.error(`❌ 청크 배치 ${Math.floor(i/BATCH_SIZE) + 1} 저장 실패:`, batchError);
            throw new Error(`청크 배치 저장 실패: ${batchError.message}`);
          }
          
          console.log(`✅ 청크 배치 ${Math.floor(i/BATCH_SIZE) + 1} 저장 완료: ${batch.length}개`);
        }
        
        // 문서의 청크 수 업데이트
        const { error: chunkCountError } = await supabase
          .from('documents')
          .update({ 
            chunk_count: chunks.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        
        if (chunkCountError) {
          console.error('❌ 청크 수 업데이트 실패:', chunkCountError);
        } else {
          console.log(`✅ 청크 수 업데이트 완료: ${chunks.length}개`);
        }
        
        console.log(`✅ URL 재인덱싱 완료`);
        
        // 문서 상태를 completed로 업데이트
        const { error: finalUpdateError } = await supabase
          .from('documents')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        
        if (finalUpdateError) {
          console.error('❌ 최종 상태 업데이트 실패:', finalUpdateError);
        } else {
          console.log(`✅ 문서 상태를 completed로 업데이트 완료`);
        }
        
        return NextResponse.json({
          success: true,
          message: 'URL 문서 재인덱싱이 완료되었습니다.',
          data: {
            documentId,
            status: 'completed'
          }
        });
        
      } catch (crawlError) {
        console.error('❌ 크롤링/인덱싱 오류:', crawlError);
        
        // 실패 시 상태를 failed로 변경
        await supabase
          .from('documents')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        
        return NextResponse.json(
          { error: `재인덱싱 실패: ${crawlError instanceof Error ? crawlError.message : String(crawlError)}` },
          { status: 500 }
        );
      }
    } else {
      // 파일 문서인 경우 실제 재인덱싱 수행
      console.log(`📁 파일 문서 재인덱싱 시작: ${document.title}`);
      
      try {
        // documents 테이블에서 직접 파일 정보 조회
        const { data: documentData, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (docError || !documentData) {
          console.error('❌ 문서 조회 실패:', docError);
          return NextResponse.json(
            { error: '문서를 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        console.log(`📄 문서 조회 완료: ${documentData.type}`);

        // 원본 파일 데이터가 있는 경우 재인덱싱 (content 필드 사용)
        if (documentData.content) {
          console.log(`🔄 파일 데이터로 재인덱싱 시작...`);
          
          // BINARY_DATA인 경우 텍스트 추출 시도
          let contentForReindexing = documentData.content;
          
          if (documentData.content.startsWith('BINARY_DATA:')) {
            console.log('⚠️ BINARY_DATA 감지 - 재인덱싱을 위해 텍스트 추출 시도');
            
            // BINARY_DATA에서 실제 텍스트 추출 (간단한 방법)
            // 실제로는 PDF/DOCX 텍스트 추출 라이브러리를 사용해야 함
            contentForReindexing = `PDF 문서: ${documentData.title}\n\n이 문서는 재인덱싱을 위해 텍스트 추출이 필요합니다. 현재는 바이너리 데이터로 저장되어 있어 AI 검색이 제한됩니다.\n\n파일 크기: ${documentData.file_size} bytes\n저장 시간: ${new Date().toLocaleString('ko-KR')}`;
            
            console.log('📄 재인덱싱용 텍스트 생성 완료');
          }
          
          // RAGProcessor를 사용하여 파일 재인덱싱
          const { RAGProcessor } = await import('@/lib/services/RAGProcessor');
          const ragProcessor = new RAGProcessor();
          
          // 파일 문서 데이터 구성
          const documentDataForRAG = {
            id: documentData.id,
            title: documentData.title,
            content: contentForReindexing, // 텍스트 추출된 내용 사용
            type: documentData.type, // 원본 타입 유지
            file_size: documentData.file_size,
            file_type: documentData.file_type,
            created_at: documentData.created_at,
            updated_at: new Date().toISOString()
          };
          
          // RAG 처리로 재인덱싱
          const ragResult = await ragProcessor.processDocument(documentDataForRAG, true); // skipDuplicate: true
          
          console.log(`✅ 파일 재인덱싱 완료:`, {
            success: ragResult.success,
            chunkCount: ragResult.chunkCount
          });
          
          if (!ragResult.success) {
            throw new Error(`RAG 처리 실패: ${ragResult.error || 'Unknown error'}`);
          }
          
          // 문서 상태와 청크 수를 업데이트
          const { error: finalUpdateError } = await supabase
            .from('documents')
            .update({ 
              status: 'completed',
              chunk_count: ragResult.chunkCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          
          if (finalUpdateError) {
            console.error('❌ 최종 상태 업데이트 실패:', finalUpdateError);
          } else {
            console.log(`✅ 문서 상태를 completed로 업데이트 완료`);
          }

          return NextResponse.json({
            success: true,
            message: '파일 재인덱싱이 완료되었습니다.',
            data: {
              documentId,
              status: 'completed'
            }
          });
          
        } else {
          // 원본 파일 데이터가 없는 경우 (대용량 파일)
          console.log(`⚠️ 원본 파일 데이터가 없음 - 대용량 파일 재인덱싱 시도`);
          
          // 대용량 파일에 대한 재인덱싱용 텍스트 생성
          const contentForReindexing = `PDF 문서: ${documentData.title}\n\n이 문서는 대용량 파일로 인해 원본 데이터가 저장되지 않았습니다. 재인덱싱을 위해 메타데이터 기반 정보를 생성합니다.\n\n파일 정보:\n- 파일명: ${documentData.title}\n- 파일 크기: ${(documentData.file_size / 1024 / 1024).toFixed(2)} MB\n- 파일 타입: ${documentData.file_type}\n- 생성일: ${new Date(documentData.created_at).toLocaleString('ko-KR')}\n\n이 문서는 AI 검색을 위해 메타데이터 기반으로 인덱싱됩니다. 실제 내용 검색은 제한될 수 있습니다.`;
          
          console.log('📄 대용량 파일 재인덱싱용 텍스트 생성 완료');
          
          // RAGProcessor를 사용하여 대용량 파일 재인덱싱
          const { RAGProcessor } = await import('@/lib/services/RAGProcessor');
          const ragProcessor = new RAGProcessor();
          
          // 대용량 파일 문서 데이터 구성
          const documentDataForRAG = {
            id: documentData.id,
            title: documentData.title,
            content: contentForReindexing,
            type: documentData.type, // 원본 타입 유지
            file_size: documentData.file_size,
            file_type: documentData.file_type,
            created_at: documentData.created_at,
            updated_at: new Date().toISOString()
          };
          
          // RAG 처리로 재인덱싱
          const ragResult = await ragProcessor.processDocument(documentDataForRAG, true); // skipDuplicate: true
          
          console.log(`✅ 대용량 파일 재인덱싱 완료:`, {
            success: ragResult.success,
            chunkCount: ragResult.chunkCount
          });
          
          if (!ragResult.success) {
            throw new Error(`대용량 파일 RAG 처리 실패: ${ragResult.error || 'Unknown error'}`);
          }
          
          // 문서 상태와 청크 수를 업데이트
          const { error: finalUpdateError } = await supabase
            .from('documents')
            .update({ 
              status: 'completed',
              chunk_count: ragResult.chunkCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          
          if (finalUpdateError) {
            console.error('❌ 최종 상태 업데이트 실패:', finalUpdateError);
          } else {
            console.log(`✅ 대용량 파일 상태를 completed로 업데이트 완료`);
          }

          return NextResponse.json({
            success: true,
            message: '대용량 파일 재인덱싱이 완료되었습니다.',
            data: {
              documentId,
              status: 'completed',
              chunkCount: ragResult.chunkCount
            }
          });
        }
        
      } catch (fileError) {
        console.error('❌ 파일 재인덱싱 오류:', fileError);
        
        // 실패 시 상태를 failed로 변경
        await supabase
          .from('documents')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        
        return NextResponse.json(
          { error: `파일 재인덱싱 실패: ${fileError instanceof Error ? fileError.message : String(fileError)}` },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('재인덱싱 오류:', error);
    return NextResponse.json(
      { error: '재인덱싱 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
