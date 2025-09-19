import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 빌드 시에는 환경 변수가 없을 수 있으므로 조건부 처리
let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// 대화 히스토리 조회 API
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: '서비스가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 대화 히스토리 조회
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('대화 히스토리 조회 오류:', error);
      
      // 테이블이 존재하지 않는 경우 빈 배열 반환
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('conversations 테이블이 존재하지 않습니다. 빈 배열을 반환합니다.');
        return NextResponse.json({
          success: true,
          conversations: [],
          total: 0,
          message: 'conversations 테이블이 아직 생성되지 않았습니다.'
        });
      }
      
      return NextResponse.json(
        { error: '대화 히스토리를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversations: conversations || [],
      total: conversations?.length || 0
    });

  } catch (error) {
    console.error('대화 히스토리 API 오류:', error);
    return NextResponse.json(
      { error: '대화 히스토리 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 대화 히스토리 저장 API
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: '서비스가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, userMessage, aiResponse, sources, conversationId } = body;

    if (!userId || !userMessage || !aiResponse) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 중복 체크: 같은 conversation_id가 이미 존재하는지 확인
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (existingConversation) {
      console.log('이미 존재하는 대화입니다. 중복 저장을 건너뜁니다.');
      return NextResponse.json({
        success: false,
        conversation: existingConversation,
        message: '이미 존재하는 대화입니다.'
      });
    }

    // 대화 히스토리 저장
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        conversation_id: conversationId || `conv_${Date.now()}`,
        user_message: userMessage,
        ai_response: aiResponse,
        sources: sources || [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('대화 히스토리 저장 오류:', error);
      
      // 테이블이 존재하지 않는 경우 실패로 처리
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('conversations 테이블이 존재하지 않습니다. 히스토리 저장을 건너뜁니다.');
        return NextResponse.json({
          success: false,
          conversation: null,
          message: 'conversations 테이블이 아직 생성되지 않아 히스토리가 저장되지 않았습니다.'
        }, { status: 200 }); // 200으로 응답하지만 success: false로 표시
      }
      
      return NextResponse.json(
        { error: '대화 히스토리를 저장하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: data
    });

  } catch (error) {
    console.error('대화 히스토리 저장 API 오류:', error);
    return NextResponse.json(
      { error: '대화 히스토리 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 대화 히스토리 삭제 API
export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: '서비스가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: '대화 ID와 사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 대화 히스토리 삭제
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('대화 히스토리 삭제 오류:', error);
      
      // 테이블이 존재하지 않는 경우 성공으로 처리
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('conversations 테이블이 존재하지 않습니다. 삭제를 건너뜁니다.');
        return NextResponse.json({
          success: true,
          message: 'conversations 테이블이 아직 생성되지 않았습니다.'
        });
      }
      
      return NextResponse.json(
        { error: '대화 히스토리를 삭제하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '대화 히스토리가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('대화 히스토리 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '대화 히스토리 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
