import { NextRequest, NextResponse } from 'next/server';

// 파일 업로드 및 인덱싱 API 엔드포인트
export async function POST(request: NextRequest) {
  try {
    console.log('=== Upload API 호출됨 ===');
    
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType?.includes('multipart/form-data')) {
      console.log('FormData 처리 시작');
      return await handleFileUpload(request);
    } else if (contentType?.includes('application/json')) {
      console.log('JSON 처리 시작');
      return await handleUrlProcessing(request);
    } else {
      console.log('지원하지 않는 Content-Type:', contentType);
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
      console.log('파일이 제공되지 않음');
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 파일 유효성 검사
    const validTypes = ['.pdf', '.docx', '.txt'];
    const decodedFileName = decodeURIComponent(file.name);
    const fileExtension = '.' + decodedFileName.split('.').pop()?.toLowerCase();
    
    console.log('파일명 검사:', {
      originalName: file.name,
      decodedName: decodedFileName,
      extension: fileExtension,
      isValid: validTypes.includes(fileExtension)
    });
    
    if (!validTypes.includes(fileExtension)) {
      return NextResponse.json(
        { error: `지원하지 않는 파일 형식입니다. (${fileExtension})` },
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

    console.log('파일 유효성 검사 통과');

    // 간단한 파일 처리 시뮬레이션 (실제 인덱싱 로직은 나중에 추가)
    const mockResult = {
      documentId: `doc_${Date.now()}`,
      fileName: file.name,
      chunksProcessed: Math.ceil(file.size / 1000),
      embeddingsGenerated: Math.ceil(file.size / 1000),
      processingTime: Date.now(),
      status: 'completed'
    };

    console.log('파일 처리 완료:', mockResult);

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 업로드되고 인덱싱되었습니다.',
      data: mockResult
    });

  } catch (error) {
    console.error('파일 업로드 처리 오류:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : '파일 업로드 처리 중 알 수 없는 오류가 발생했습니다.';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// URL 처리 함수
async function handleUrlProcessing(request: NextRequest) {
  try {
    console.log('URL 처리 요청 시작');
    
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

    console.log('URL 처리 완료:', url);

    return NextResponse.json({
      success: true,
      message: 'URL이 성공적으로 처리되고 인덱싱되었습니다.',
      data: {
        documentId: `url_${Date.now()}`,
        url: url,
        chunksProcessed: 1,
        embeddingsGenerated: 1,
        processingTime: Date.now(),
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('URL 처리 오류:', error);
    
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

    console.log('문서 삭제 요청:', { documentId, url });

    return NextResponse.json({
      success: true,
      message: '문서가 성공적으로 삭제되었습니다.',
      data: {
        documentId,
        deletedChunks: 0,
        deletedEmbeddings: 0
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

    console.log('문서 목록 조회:', { limit, offset, status, type });

    // 모의 데이터 반환
    const mockDocuments = [
      {
        id: 'doc_1',
        title: 'Test Document 1',
        type: 'file',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const mockStats = {
      totalDocuments: 1,
      totalChunks: 10,
      totalEmbeddings: 10
    };

    return NextResponse.json({
      success: true,
      data: {
        documents: mockDocuments,
        stats: mockStats,
        pagination: {
          limit,
          offset,
          total: mockStats.totalDocuments
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