import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 woolela@nasmedia.co.kr 강제 정리 시작...');

    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    const woolelaEmail = 'woolela@nasmedia.co.kr';
    const woolelaUserId = '6e9906b2-6e93-42ed-ad66-d47d626f8fc2';

    const results = {
      deletedAdmin: false,
      deletedProfile: false,
      deletedConversations: false,
      deletedFeedback: false,
      errors: [] as string[]
    };

    // 1. Admin 권한 강제 삭제
    console.log('🗑️ Admin 권한 강제 삭제 중...');
    try {
      const { error: adminError } = await supabase
        .from('admin_users')
        .delete()
        .or(`user_id.eq.${woolelaUserId},email.eq.${woolelaEmail}`);

      if (adminError) {
        console.error('❌ Admin 권한 삭제 실패:', adminError);
        results.errors.push(`Admin 권한 삭제 실패: ${adminError.message}`);
      } else {
        console.log('✅ Admin 권한 삭제 완료');
        results.deletedAdmin = true;
      }
    } catch (error) {
      console.error('❌ Admin 권한 삭제 중 오류:', error);
      results.errors.push(`Admin 권한 삭제 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    // 2. Profile 강제 삭제
    console.log('🗑️ Profile 강제 삭제 중...');
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .or(`id.eq.${woolelaUserId},email.eq.${woolelaEmail}`);

      if (profileError) {
        console.error('❌ Profile 삭제 실패:', profileError);
        results.errors.push(`Profile 삭제 실패: ${profileError.message}`);
      } else {
        console.log('✅ Profile 삭제 완료');
        results.deletedProfile = true;
      }
    } catch (error) {
      console.error('❌ Profile 삭제 중 오류:', error);
      results.errors.push(`Profile 삭제 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    // 3. Conversations 강제 삭제
    console.log('🗑️ Conversations 강제 삭제 중...');
    try {
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', woolelaUserId);

      if (convError) {
        console.error('❌ Conversations 삭제 실패:', convError);
        results.errors.push(`Conversations 삭제 실패: ${convError.message}`);
      } else {
        console.log('✅ Conversations 삭제 완료');
        results.deletedConversations = true;
      }
    } catch (error) {
      console.error('❌ Conversations 삭제 중 오류:', error);
      results.errors.push(`Conversations 삭제 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    // 4. Feedback 강제 삭제
    console.log('🗑️ Feedback 강제 삭제 중...');
    try {
      const { error: feedbackError } = await supabase
        .from('feedback')
        .delete()
        .eq('user_id', woolelaUserId);

      if (feedbackError) {
        console.error('❌ Feedback 삭제 실패:', feedbackError);
        results.errors.push(`Feedback 삭제 실패: ${feedbackError.message}`);
      } else {
        console.log('✅ Feedback 삭제 완료');
        results.deletedFeedback = true;
      }
    } catch (error) {
      console.error('❌ Feedback 삭제 중 오류:', error);
      results.errors.push(`Feedback 삭제 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    // 5. 정리 후 상태 확인
    console.log('🔍 정리 후 상태 확인 중...');
    const { data: remainingProfile } = await supabase
      .from('profiles')
      .select('*')
      .or(`id.eq.${woolelaUserId},email.eq.${woolelaEmail}`);

    const { data: remainingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .or(`user_id.eq.${woolelaUserId},email.eq.${woolelaEmail}`);

    const { data: remainingConversations } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', woolelaUserId);

    const { data: remainingFeedback } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', woolelaUserId);

    console.log('✅ woolela@nasmedia.co.kr 강제 정리 완료');

    return NextResponse.json({
      success: true,
      message: 'woolela@nasmedia.co.kr 강제 정리가 완료되었습니다.',
      data: {
        cleanup_results: results,
        remaining_data: {
          profile_count: remainingProfile?.length || 0,
          admin_count: remainingAdmin?.length || 0,
          conversations_count: remainingConversations?.length || 0,
          feedback_count: remainingFeedback?.length || 0
        },
        summary: {
          total_errors: results.errors.length,
          cleanup_success: results.errors.length === 0,
          all_data_removed: (remainingProfile?.length || 0) === 0 && 
                          (remainingAdmin?.length || 0) === 0 && 
                          (remainingConversations?.length || 0) === 0 && 
                          (remainingFeedback?.length || 0) === 0
        }
      }
    });

  } catch (error) {
    console.error('❌ woolela@nasmedia.co.kr 강제 정리 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'woolela@nasmedia.co.kr 강제 정리 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
