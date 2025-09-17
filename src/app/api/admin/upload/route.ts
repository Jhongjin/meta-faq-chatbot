import { NextRequest, NextResponse } from 'next/server';

// 파일 업로드 및 인덱싱 API 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // 파일 업로드 처리
      return await handleFileUpload(request);
    } else if (contentType?.includes('application/json')) {
      // URL 처리
      return await handleUrlProcessing(request);
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 Content-Type입니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Upload API 오류:', error);
    return NextResponse.json(
      { 
        error: '서버 내부 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// 중복 파일 덮어쓰기 처리
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'overwrite-file') {
      return await handleFileOverwrite(request);
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 액션입니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('파일 덮어쓰기 오류:', error);
    return NextResponse.json(
      { 
        error: '파일 덮어쓰기 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 파일 업로드 처리 함수
async function handleFileUpload(request: NextRequest) {
  try {
    console.log('파일 업로드 요청 시작');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    
    console.log('FormData 내용:', {
      file: file ? { name: file.name, size: file.size, type: file.type } : 'null',
      type: type
    });

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 파일 유효성 검사
    const validTypes = ['.pdf', '.docx', '.txt', '.md'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    console.log('파일 검증:', {
      fileName: file.name,
      fileType: file.type,
      fileExtension,
      isValid: validTypes.includes(fileExtension)
    });
    
    if (!validTypes.includes(fileExtension)) {
      return NextResponse.json(
        { error: `지원하지 않는 파일 형식입니다. 지원 형식: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // 파일 크기 검사 (10MB 제한)
    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `파일 크기가 ${Math.round(maxFileSize / 1024 / 1024)}MB를 초과합니다.` },
        { status: 400 }
      );
    }

    // 파일 중복 체크
    const { vectorStorageService } = await import('@/lib/services/VectorStorageService');
    const duplicateCheck = await vectorStorageService.checkFileExists(file.name, file.size);
    
    if (duplicateCheck.exists) {
      console.log(`⚠️ 중복 파일 발견: ${file.name} (기존 문서 ID: ${duplicateCheck.documentId})`);
      
      // 중복 파일 알럿 응답
      return NextResponse.json({
        success: false,
        isDuplicate: true,
        message: `동일한 파일명과 크기의 파일이 이미 존재합니다: ${file.name}`,
        data: {
          existingDocumentId: duplicateCheck.documentId,
          existingDocument: duplicateCheck.document,
          fileName: file.name,
          fileSize: file.size,
          status: duplicateCheck.document?.status
        }
      }, { status: 409 }); // 409 Conflict
    }

    // DocumentIndexingService를 통한 파일 처리 및 인덱싱
    const { documentIndexingService } = await import('@/lib/services/DocumentIndexingService');
    
    console.log(`파일 인덱싱 시작: ${file.name} (${file.size} bytes)`);
    
    const result = await documentIndexingService.indexFile(file);

    if (result.status === 'failed') {
      console.error(`파일 인덱싱 실패: ${file.name}`, result.error);
      return NextResponse.json(
        { 
          error: result.error || '파일 처리에 실패했습니다.',
          details: `파일명: ${file.name}, 크기: ${file.size} bytes, 타입: ${file.type}`
        },
        { status: 500 }
      );
    }
    
    console.log(`파일 인덱싱 완료: ${file.name} - ${result.chunksProcessed}개 청크, ${result.embeddingsGenerated}개 임베딩`);

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 업로드되고 인덱싱되었습니다.',
      data: {
        documentId: result.documentId,
        fileName: file.name,
        chunksProcessed: result.chunksProcessed,
        embeddingsGenerated: result.embeddingsGenerated,
        processingTime: result.processingTime,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('파일 업로드 처리 오류:', error);
    
    // 구체적인 에러 메시지 제공
    const errorMessage = error instanceof Error 
      ? error.message 
      : '파일 업로드 처리 중 알 수 없는 오류가 발생했습니다.';
    
    // JSON 파싱 오류인 경우 특별 처리
    if (errorMessage.includes('JSON') || errorMessage.includes('Unexpected end')) {
      return NextResponse.json(
        { 
          success: false,
          error: '서버 응답 처리 중 오류가 발생했습니다. 파일 형식을 확인해주세요.',
          details: 'JSON parsing error'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// 파일 덮어쓰기 처리 함수
async function handleFileOverwrite(request: NextRequest) {
  try {
    console.log('파일 덮어쓰기 요청 시작');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const existingDocumentId = formData.get('existingDocumentId') as string;
    
    if (!file || !existingDocumentId) {
      return NextResponse.json(
        { error: '파일과 기존 문서 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 기존 문서 삭제
    const { vectorStorageService } = await import('@/lib/services/VectorStorageService');
    await vectorStorageService.deleteDocument(existingDocumentId);
    console.log(`기존 문서 삭제 완료: ${existingDocumentId}`);

    // 새 파일 인덱싱
    const { documentIndexingService } = await import('@/lib/services/DocumentIndexingService');
    const result = await documentIndexingService.indexFile(file);

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error || '파일 처리에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 덮어쓰기되었습니다.',
      data: {
        documentId: result.documentId,
        fileName: file.name,
        chunksProcessed: result.chunksProcessed,
        embeddingsGenerated: result.embeddingsGenerated,
        processingTime: result.processingTime,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('파일 덮어쓰기 처리 오류:', error);
    return NextResponse.json(
      { 
        error: '파일 덮어쓰기 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// URL 처리 함수
async function handleUrlProcessing(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 URL 형식입니다.' },
        { status: 400 }
      );
    }

    // DocumentIndexingService를 통한 URL 처리 및 인덱싱
    const { documentIndexingService } = await import('@/lib/services/DocumentIndexingService');
    
    const result = await documentIndexingService.indexURL(url);

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error || 'URL 처리에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'URL이 성공적으로 처리되고 인덱싱되었습니다.',
      data: {
        documentId: result.documentId,
        url: url,
        chunksProcessed: result.chunksProcessed,
        embeddingsGenerated: result.embeddingsGenerated,
        processingTime: result.processingTime,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('URL 처리 오류:', error);
    
    // 구체적인 에러 메시지 제공
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'URL 처리 중 알 수 없는 오류가 발생했습니다.';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// 문서 삭제 API 엔드포인트
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const url = searchParams.get('url');

    if (!documentId && !url) {
      return NextResponse.json(
        { error: '문서 ID 또는 URL이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    const { vectorStorageService } = await import('@/lib/services/VectorStorageService');
    
    let targetDocumentId = documentId;
    
    // URL이 제공된 경우, URL로 문서 ID를 찾기
    if (url && !documentId) {
      console.log(`🔍 URL로 문서 찾기: ${url}`);
      
      // URL을 기반으로 문서 ID를 찾는 로직
      const { data: documents, error: findError } = await vectorStorageService.supabase
        .from('documents')
        .select('id, title, url')
        .eq('url', url) // url 필드와 비교
        .limit(1);
      
      console.log('문서 검색 결과:', { documents, findError });
      
      if (findError) {
        console.error('문서 검색 오류:', findError);
        return NextResponse.json(
          { error: `문서 검색 중 오류가 발생했습니다: ${findError.message}` },
          { status: 500 }
        );
      }
      
      if (!documents || documents.length === 0) {
        console.log('해당 URL과 일치하는 문서를 찾을 수 없음');
        return NextResponse.json(
          { error: '해당 URL과 일치하는 문서를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      targetDocumentId = documents[0].id;
      console.log(`✅ 문서 ID 찾음: ${targetDocumentId}`);
    }
    
    // 문서와 관련된 모든 임베딩 데이터 삭제
    if (!targetDocumentId) {
      return NextResponse.json(
        { error: '문서 ID를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }
    
    const result = await vectorStorageService.deleteDocument(targetDocumentId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '문서 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '문서와 관련된 모든 데이터가 성공적으로 삭제되었습니다.',
      data: {
        documentId,
        deletedChunks: result.deletedChunks,
        deletedEmbeddings: result.deletedEmbeddings
      }
    });

  } catch (error) {
    console.error('문서 삭제 오류:', error);
    return NextResponse.json(
      { 
        error: '문서 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 문서 목록 조회 API 엔드포인트
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const { vectorStorageService } = await import('@/lib/services/VectorStorageService');
    
    const documents = await vectorStorageService.getDocuments({
      limit,
      offset,
      status: status || undefined,
      type: type || undefined
    });

    const stats = await vectorStorageService.getDocumentStats();

    return NextResponse.json({
      success: true,
      data: {
        documents,
        stats,
        pagination: {
          limit,
          offset,
          total: stats.totalDocuments
        }
      }
    });

  } catch (error) {
    console.error('문서 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '문서 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
