import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 간단한 URL 저장 테스트 시작 ===');
    
    const body = await request.json();
    const { url } = body;
    
    console.log('URL received:', url);
    
    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL이 제공되지 않았습니다.'
      }, { status: 400 });
    }
    
    // 데이터베이스에 URL 저장
    try {
      const { vectorStorageService } = await import('@/lib/services/VectorStorageService');
      
      const documentId = `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // URL을 문서로 저장
      await vectorStorageService.saveDocument({
        id: documentId,
        title: url,
        type: 'url',
        size: 0,
        uploadedAt: new Date().toISOString()
      });
      
      // 문서 상태를 indexed로 업데이트 (임시)
      await vectorStorageService.updateDocumentStatus(documentId, 'completed', 1, 1);
      
      console.log('URL 데이터베이스 저장 완료:', documentId);
      
      return NextResponse.json({
        success: true,
        message: 'URL 저장 성공',
        data: {
          documentId: documentId,
          url: url
        }
      });
      
    } catch (dbError) {
      console.error('데이터베이스 저장 오류:', dbError);
      return NextResponse.json({
        success: false,
        error: '데이터베이스 저장 실패',
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('간단한 URL 저장 테스트 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
