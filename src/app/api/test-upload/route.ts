import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test Upload API 호출됨');
    
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'multipart/form-data가 필요합니다.' },
        { status: 400 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    
    console.log('FormData 파싱 성공:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      type: type
    });
    
    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test upload successful!',
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        type: type
      }
    });
    
  } catch (error) {
    console.error('Test Upload API 오류:', error);
    return NextResponse.json(
      { 
        error: 'Test upload failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Test upload API is working' });
}