import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 간단한 업로드 테스트 시작 ===');
    
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json({
        success: false,
        error: 'multipart/form-data가 필요합니다.',
        receivedContentType: contentType
      }, { status: 400 });
    }
    
    const formData = await request.formData();
    console.log('FormData keys:', Array.from(formData.keys()));
    
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    
    console.log('File received:', file ? {
      name: file.name,
      size: file.size,
      type: file.type
    } : 'null');
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: '파일이 제공되지 않았습니다.',
        formDataKeys: Array.from(formData.keys())
      }, { status: 400 });
    }
    
    // 파일 내용 읽기 테스트
    const fileContent = await file.text();
    console.log('파일 내용 길이:', fileContent.length);
    console.log('파일 내용 미리보기:', fileContent.substring(0, 100));
    
    // 데이터베이스에 문서 저장
    try {
      const { vectorStorageService } = await import('@/lib/services/VectorStorageService');
      
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 파일 확장자에 따라 정확한 타입 결정
      const getFileType = (fileName: string): 'pdf' | 'docx' | 'txt' | 'url' => {
        const ext = fileName.toLowerCase().split('.').pop();
        switch (ext) {
          case 'pdf': return 'pdf';
          case 'docx': return 'docx';
          case 'txt': return 'txt';
          default: return 'pdf'; // 기본값
        }
      };
      
      const fileType = getFileType(file.name);
      
      // 문서 메타데이터 저장 (documents 테이블은 'file' 또는 'url'만 허용)
      await vectorStorageService.saveDocument({
        id: documentId,
        title: file.name,
        type: 'file', // documents 테이블은 'file' 또는 'url'만 허용
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
      
      // 문서 상태를 indexed로 업데이트 (임시)
      await vectorStorageService.updateDocumentStatus(documentId, 'completed', 1, 1);
      
      console.log('문서 데이터베이스 저장 완료:', documentId);
      
      return NextResponse.json({
        success: true,
        message: '파일 업로드 및 데이터베이스 저장 성공',
        data: {
          documentId: documentId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          contentLength: fileContent.length,
          type: type
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
    console.error('간단한 업로드 테스트 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
