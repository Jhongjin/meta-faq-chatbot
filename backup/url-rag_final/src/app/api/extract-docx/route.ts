import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

/**
 * DOCX 파일에서 텍스트 추출 API
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

    if (!file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json(
        { error: 'DOCX 파일이 아닙니다.' },
        { status: 400 }
      );
    }

    console.log(`📄 DOCX 텍스트 추출 시작: ${file.name} (${file.size} bytes)`);

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // DOCX에서 텍스트 추출
    const result = await mammoth.extractRawText({ buffer });
    
    console.log(`✅ DOCX 텍스트 추출 완료: ${result.value.length}자`);

    return NextResponse.json({
      success: true,
      text: result.value,
      messages: result.messages
    });

  } catch (error) {
    console.error('❌ DOCX 추출 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'DOCX 텍스트 추출 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
