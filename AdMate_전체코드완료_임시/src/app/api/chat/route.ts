import { NextRequest, NextResponse } from 'next/server';
import { ragSearchService } from '@/lib/services/RAGSearchService';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`💬 챗봇 API 요청: "${message}"`);

    // RAG 기반 답변 생성
    const response = await ragSearchService.generateChatResponse(message.trim());

    console.log(`✅ 챗봇 응답 완료: ${response.processingTime}ms, 신뢰도: ${response.confidence}`);

    return NextResponse.json({
      success: true,
      response: {
        message: response.answer,
        sources: response.sources.map(source => ({
          title: source.documentTitle,
          content: source.content.substring(0, 200) + '...',
          similarity: Math.round(source.similarity * 100),
          url: source.documentUrl
        })),
        confidence: Math.round(response.confidence * 100),
        processingTime: response.processingTime,
        model: response.model,
        isLLMGenerated: response.isLLMGenerated
      }
    });

  } catch (error) {
    console.error('챗봇 API 오류:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '챗봇 응답 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 검색 통계 조회
    const stats = await ragSearchService.getSearchStats();
    
    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('챗봇 통계 조회 오류:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '통계 조회 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}