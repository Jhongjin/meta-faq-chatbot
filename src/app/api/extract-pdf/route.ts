import { NextRequest, NextResponse } from 'next/server';

/**
 * PDF 파일에서 텍스트 추출 API
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'PDF 파일이 아닙니다.' },
        { status: 400 }
      );
    }

    console.log(`📄 PDF 텍스트 추출 시작: ${file.name} (${file.size} bytes)`);

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // PDF에서 텍스트 추출 (동적 import 사용)
    const pdf = (await import('pdf-parse')).default;
    const pdfData = await pdf(buffer);
    
    console.log(`✅ PDF 텍스트 추출 완료: ${pdfData.text.length}자`);

    return NextResponse.json({
      success: true,
      text: pdfData.text,
      pages: pdfData.numpages,
      info: pdfData.info
    });

  } catch (error) {
    console.error('❌ PDF 추출 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'PDF 텍스트 추출 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
