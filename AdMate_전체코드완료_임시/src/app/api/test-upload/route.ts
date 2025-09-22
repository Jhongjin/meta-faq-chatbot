import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: '테스트 업로드 API는 POST 요청만 지원합니다.',
    usage: 'POST /api/test-upload with multipart/form-data'
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== 테스트 업로드 API 시작 ===');
    
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      console.log('FormData keys:', Array.from(formData.keys()));
      
      const file = formData.get('file') as File;
      const type = formData.get('type') as string;
      
      console.log('File:', file ? {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      } : 'null');
      
      console.log('Type:', type);
      
      if (!file) {
        return NextResponse.json({
          success: false,
          error: '파일이 제공되지 않았습니다.',
          debug: {
            formDataKeys: Array.from(formData.keys()),
            contentType
          }
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: '테스트 업로드 성공',
        data: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          type: type
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'multipart/form-data가 아닙니다.',
        debug: { contentType }
      }, { status: 400 });
    }
  } catch (error) {
    console.error('테스트 업로드 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
