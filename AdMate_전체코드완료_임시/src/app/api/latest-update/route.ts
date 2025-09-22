import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 최신 업데이트 정보 조회 시작...');

    // 1. 최근 업데이트된 문서 조회
    const { data: recentDocuments, error: documentsError } = await supabase
      .from('documents')
      .select('id, title, updated_at, type, status')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (documentsError) {
      console.error('❌ 최근 문서 조회 오류:', documentsError);
      throw new Error(`문서 조회 실패: ${documentsError.message}`);
    }

    // 2. 최근 업로드된 문서 조회
    const { data: newDocuments, error: newDocsError } = await supabase
      .from('documents')
      .select('id, title, created_at, type, status')
      .order('created_at', { ascending: false })
      .limit(3);

    if (newDocsError) {
      console.error('❌ 신규 문서 조회 오류:', newDocsError);
      throw new Error(`신규 문서 조회 실패: ${newDocsError.message}`);
    }

    // 3. 최근 업데이트 정보 구성
    const latestUpdate = {
      lastUpdateDate: recentDocuments?.[0]?.updated_at || new Date().toISOString(),
      recentUpdates: recentDocuments?.slice(0, 3) || [],
      newDocuments: newDocuments || [],
      hasNewFeatures: newDocuments && newDocuments.length > 0,
      updateCount: recentDocuments?.length || 0,
      newDocumentCount: newDocuments?.length || 0
    };

    // 4. 업데이트 메시지 생성
    const generateUpdateMessage = () => {
      const now = new Date();
      const lastUpdate = new Date(latestUpdate.lastUpdateDate);
      const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        return "오늘 메타 광고 정책이 업데이트되었습니다. 새로운 정책에 대한 질문을 AI 챗봇에게 물어보세요.";
      } else if (daysDiff === 1) {
        return "어제 메타 광고 정책이 업데이트되었습니다. 새로운 정책에 대한 질문을 AI 챗봇에게 물어보세요.";
      } else if (daysDiff <= 7) {
        return `${daysDiff}일 전 메타 광고 정책이 업데이트되었습니다. 새로운 정책에 대한 질문을 AI 챗봇에게 물어보세요.`;
      } else {
        return "메타 광고 정책이 최근 업데이트되었습니다. 새로운 정책에 대한 질문을 AI 챗봇에게 물어보세요.";
      }
    };

    const updateMessage = generateUpdateMessage();

    // 5. 응답 데이터 구성
    const responseData = {
      ...latestUpdate,
      message: updateMessage,
      displayDate: lastUpdate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      isRecent: daysDiff <= 7,
      hasUpdates: latestUpdate.updateCount > 0 || latestUpdate.newDocumentCount > 0
    };

    console.log('📊 최신 업데이트 정보 조회 완료:', {
      lastUpdateDate: latestUpdate.lastUpdateDate,
      updateCount: latestUpdate.updateCount,
      newDocumentCount: latestUpdate.newDocumentCount
    });

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ 최신 업데이트 정보 조회 오류:', error);
    
    // 에러 발생 시 기본값 반환
    const fallbackData = {
      lastUpdateDate: new Date().toISOString(),
      recentUpdates: [],
      newDocuments: [],
      hasNewFeatures: false,
      updateCount: 0,
      newDocumentCount: 0,
      message: "메타 광고 정책이 최신 상태로 유지되고 있습니다. 궁금한 사항이 있으시면 AI 챗봇에게 물어보세요.",
      displayDate: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      isRecent: false,
      hasUpdates: false
    };

    return NextResponse.json({
      success: true,
      data: fallbackData
    });
  }
}
