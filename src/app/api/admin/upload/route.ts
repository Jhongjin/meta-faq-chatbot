import { NextRequest, NextResponse } from 'next/server';
import { FileProcessingService } from '@/lib/services/FileProcessingService';

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
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 파일 업로드 처리 함수
async function handleFileUpload(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 파일 유효성 검사
    const validTypes = ['.pdf', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다.' },
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

    // FileProcessingService를 통한 파일 처리 및 인덱싱
    const fileProcessingService = new FileProcessingService();
    
    const result = await fileProcessingService.uploadAndIndex({
      file,
      type: 'file',
      originalName: file.name,
      size: file.size,
      mimeType: file.type
    });

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error || '파일 처리에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 업로드되고 인덱싱되었습니다.',
      data: {
        fileId: result.fileId,
        fileName: file.name,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('파일 업로드 처리 오류:', error);
    return NextResponse.json(
      { error: '파일 업로드 처리 중 오류가 발생했습니다.' },
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

    // FileProcessingService를 통한 URL 처리 및 인덱싱
    const fileProcessingService = new FileProcessingService();
    
    const result = await fileProcessingService.uploadAndIndex({
      url,
      type: 'url'
    });

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
        urlId: result.urlId,
        url: url,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('URL 처리 오류:', error);
    return NextResponse.json(
      { error: 'URL 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 진행 상황 조회 API 엔드포인트
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const urlId = searchParams.get('urlId');

    if (!fileId && !urlId) {
      return NextResponse.json(
        { error: 'fileId 또는 urlId가 필요합니다.' },
        { status: 400 }
      );
    }

    const fileProcessingService = new FileProcessingService();
    
    if (fileId) {
      const progress = await fileProcessingService.getProgress(fileId);
      return NextResponse.json({ progress });
    } else if (urlId) {
      const progress = await fileProcessingService.getProgress(urlId);
      return NextResponse.json({ progress });
    }

  } catch (error) {
    console.error('진행 상황 조회 오류:', error);
    return NextResponse.json(
      { error: '진행 상황 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
