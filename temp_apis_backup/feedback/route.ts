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

// 피드백 저장/업데이트 API
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: '서비스가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, conversationId, messageId, helpful } = body;

    if (!userId || !conversationId || !messageId || typeof helpful !== 'boolean') {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 기존 피드백 확인
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('message_id', messageId)
      .single();

    let result;
    if (existingFeedback) {
      // 기존 피드백 업데이트
      const { data, error } = await supabase
        .from('feedback')
        .update({
          helpful: helpful,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('message_id', messageId)
        .select()
        .single();

      if (error) {
        console.error('피드백 업데이트 오류:', error);
        return NextResponse.json(
          { error: '피드백을 업데이트하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // 새 피드백 생성
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          message_id: messageId,
          helpful: helpful,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('피드백 저장 오류:', error);
        
        // 테이블이 존재하지 않는 경우 실패로 처리
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('feedback 테이블이 존재하지 않습니다. 피드백 저장을 건너뜁니다.');
          return NextResponse.json({
            success: false,
            feedback: null,
            message: 'feedback 테이블이 아직 생성되지 않아 피드백이 저장되지 않았습니다.'
          }, { status: 200 });
        }
        
        return NextResponse.json(
          { error: '피드백을 저장하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      feedback: result
    });

  } catch (error) {
    console.error('피드백 API 오류:', error);
    return NextResponse.json(
      { error: '피드백 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 피드백 조회 API
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
    const conversationId = searchParams.get('conversationId');
    const messageId = searchParams.get('messageId');

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId);

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    if (messageId) {
      query = query.eq('message_id', messageId);
    }

    const { data: feedback, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('피드백 조회 오류:', error);
      
      // 테이블이 존재하지 않는 경우 빈 배열 반환
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('feedback 테이블이 존재하지 않습니다. 빈 배열을 반환합니다.');
        return NextResponse.json({
          success: true,
          feedback: [],
          message: 'feedback 테이블이 아직 생성되지 않았습니다.'
        });
      }
      
      return NextResponse.json(
        { error: '피드백을 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: feedback || []
    });

  } catch (error) {
    console.error('피드백 조회 API 오류:', error);
    return NextResponse.json(
      { error: '피드백 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 피드백 삭제 API
export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: '서비스가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const messageId = searchParams.get('messageId');

    if (!userId || !messageId) {
      return NextResponse.json(
        { error: '사용자 ID와 메시지 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('user_id', userId)
      .eq('message_id', messageId);

    if (error) {
      console.error('피드백 삭제 오류:', error);
      
      // 테이블이 존재하지 않는 경우 성공으로 처리
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('feedback 테이블이 존재하지 않습니다. 삭제를 건너뜁니다.');
        return NextResponse.json({
          success: true,
          message: 'feedback 테이블이 아직 생성되지 않았습니다.'
        });
      }
      
      return NextResponse.json(
        { error: '피드백을 삭제하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '피드백이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('피드백 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '피드백 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
