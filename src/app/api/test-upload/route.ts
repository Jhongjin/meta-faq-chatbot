import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('테스트 업로드 요청 수신');
    
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType?.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        console.log('FormData 파싱 성공:', {
          fileName: file?.name,
          fileSize: file?.size,
          fileType: file?.type
        });
        
        return NextResponse.json({
          success: true,
          message: 'FormData 파싱 성공',
          file: {
            name: file?.name,
            size: file?.size,
            type: file?.type
          }
        });
      } catch (error) {
        console.error('FormData 파싱 실패:', error);
        return NextResponse.json(
          { 
            success: false,
            error: 'FormData 파싱 실패',
            details: error instanceof Error ? error.message : String(error)
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'multipart/form-data가 필요합니다.',
          contentType: contentType
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('테스트 업로드 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '서버 내부 오류',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
