import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 woolela@nasmedia.co.kr 완전 정리 시작...');

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
      deletedProfile: false,
      deletedAdmin: false,
      deletedConversations: false,
      deletedFeedback: false,
      errors: [] as string[]
    };

    // 1. Auth 사용자 상태 확인
    console.log('🔍 Auth 사용자 상태 확인 중...');
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === woolelaEmail);
    
    if (authUser) {
      console.log('⚠️ Auth 사용자가 아직 존재합니다. 먼저 Auth 사용자를 삭제해야 합니다.');
      results.errors.push('Auth 사용자가 아직 존재합니다. 먼저 Auth 사용자를 삭제해주세요.');
    } else {
      console.log('✅ Auth 사용자는 이미 삭제되었습니다.');
    }

    // 2. Profile 삭제
    console.log('🗑️ Profile 삭제 중...');
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', woolelaUserId);

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

    // 3. Admin 권한 삭제
    console.log('🗑️ Admin 권한 삭제 중...');
    try {
      const { error: adminError } = await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', woolelaUserId);

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

    // 4. Conversations 삭제
    console.log('🗑️ Conversations 삭제 중...');
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

    // 5. Feedback 삭제
    console.log('🗑️ Feedback 삭제 중...');
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

    // 6. Messages 테이블이 존재하는지 확인 후 삭제
    console.log('🗑️ Messages 삭제 중...');
    try {
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('user_id', woolelaUserId);

      if (messagesError) {
        if (messagesError.message.includes('Could not find the table')) {
          console.log('ℹ️ Messages 테이블이 존재하지 않습니다. (정상)');
        } else {
          console.error('❌ Messages 삭제 실패:', messagesError);
          results.errors.push(`Messages 삭제 실패: ${messagesError.message}`);
        }
      } else {
        console.log('✅ Messages 삭제 완료');
      }
    } catch (error) {
      console.error('❌ Messages 삭제 중 오류:', error);
      results.errors.push(`Messages 삭제 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    // 7. 정리 후 상태 확인
    console.log('🔍 정리 후 상태 확인 중...');
    const { data: remainingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', woolelaUserId)
      .single();

    const { data: remainingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', woolelaUserId)
      .single();

    const { data: remainingConversations } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', woolelaUserId);

    const { data: remainingFeedback } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', woolelaUserId);

    console.log('✅ woolela@nasmedia.co.kr 완전 정리 완료');

    return NextResponse.json({
      success: true,
      message: 'woolela@nasmedia.co.kr 완전 정리가 완료되었습니다.',
      data: {
        cleanup_results: results,
        remaining_data: {
          profile_exists: !!remainingProfile,
          admin_exists: !!remainingAdmin,
          conversations_count: remainingConversations?.length || 0,
          feedback_count: remainingFeedback?.length || 0
        },
        summary: {
          total_errors: results.errors.length,
          cleanup_success: results.errors.length === 0,
          all_data_removed: !remainingProfile && !remainingAdmin && 
                          (remainingConversations?.length || 0) === 0 && 
                          (remainingFeedback?.length || 0) === 0
        }
      }
    });

  } catch (error) {
    console.error('❌ woolela@nasmedia.co.kr 완전 정리 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'woolela@nasmedia.co.kr 완전 정리 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
