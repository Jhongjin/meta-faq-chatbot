import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 테스트용 회원탈퇴 시작...');

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    // 1. 사용자 찾기
    console.log('🔍 사용자 찾는 중...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const user = existingUsers.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: '해당 이메일의 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userId = user.id;
    console.log(`👤 사용자 발견: ${userId}`);

    // 2. 삭제 전 상태 확인
    console.log('📊 삭제 전 상태 확인 중...');
    const { data: profileBefore } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 3. 관련 데이터 삭제 (CASCADE로 자동 삭제되지만 명시적으로 삭제)
    console.log('🗑️ 관련 데이터 삭제 중...');
    try {
      // 대화 기록 삭제
      await supabase
        .from('conversations')
        .delete()
        .eq('user_id', userId);

      // 피드백 기록 삭제
      await supabase
        .from('feedback')
        .delete()
        .eq('user_id', userId);

      // 메시지 기록 삭제
      await supabase
        .from('messages')
        .delete()
        .eq('user_id', userId);

      // 관리자 권한 삭제
      await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', userId);

      console.log('✅ 관련 데이터 삭제 완료');
    } catch (error) {
      console.log('⚠️ 관련 데이터 삭제 중 오류 (무시):', error);
    }

    // 4. Auth 사용자 삭제 (CASCADE로 profiles도 자동 삭제됨)
    console.log('🗑️ Auth 사용자 삭제 중...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('❌ Auth 사용자 삭제 오류:', deleteError);
      return NextResponse.json(
        { success: false, error: `사용자 삭제 실패: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Auth 사용자 삭제 완료');

    // 5. 삭제 후 상태 확인
    console.log('📊 삭제 후 상태 확인 중...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기

    const { data: profileAfter } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: authUserAfter } = await supabase.auth.admin.getUserById(userId);

    console.log('✅ 회원탈퇴 테스트 완료');

    return NextResponse.json({
      success: true,
      message: '회원탈퇴 테스트가 성공적으로 완료되었습니다.',
      data: {
        deleted_user: {
          id: userId,
          email: email,
          name: user.user_metadata?.name || 'Unknown'
        },
        before_deletion: {
          auth_user_exists: true,
          profile_exists: !!profileBefore,
          profile_data: profileBefore
        },
        after_deletion: {
          auth_user_exists: !!authUserAfter.user,
          profile_exists: !!profileAfter,
          profile_data: profileAfter
        },
        cascade_worked: !profileAfter && !authUserAfter.user
      }
    });

  } catch (error) {
    console.error('❌ 테스트용 회원탈퇴 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '회원탈퇴 테스트 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
