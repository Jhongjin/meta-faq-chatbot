import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 최신 업데이트 정보 반환
    const latestUpdate = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      features: [
        'RAG 기반 AI 챗봇',
        '문서 업로드 및 인덱싱',
        'URL 크롤링',
        '실시간 답변 생성'
      ]
    };

    return NextResponse.json(latestUpdate);
  } catch (error) {
    console.error('최신 업데이트 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '최신 업데이트 정보를 가져올 수 없습니다.' },
      { status: 500 }
    );
  }
}
