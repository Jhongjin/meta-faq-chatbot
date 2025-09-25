import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 woolela 계정 완전 삭제 및 재생성 시작...');

    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    const woolelaUserId = 'f93acd33-61c4-4f22-8766-6adabd5f9f18';
    const woolelaEmail = 'woolela@nasmedia.co.kr';

    // 1. 관련 데이터 삭제
    console.log('🗑️ 관련 데이터 삭제 중...');
    try {
      // 대화 기록 삭제
      await supabase
        .from('conversations')
        .delete()
        .eq('user_id', woolelaUserId);

      // 피드백 기록 삭제
      await supabase
        .from('feedback')
        .delete()
        .eq('user_id', woolelaUserId);

      // 메시지 기록 삭제
      await supabase
        .from('messages')
        .delete()
        .eq('user_id', woolelaUserId);

      // 관리자 권한 삭제
      await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', woolelaUserId);

      // 프로필 삭제
      await supabase
        .from('profiles')
        .delete()
        .eq('id', woolelaUserId);

      console.log('✅ 관련 데이터 삭제 완료');
    } catch (error) {
      console.log('⚠️ 관련 데이터 삭제 중 오류 (무시):', error);
    }

    // 2. Auth 사용자 삭제
    console.log('🗑️ Auth 사용자 삭제 중...');
    try {
      await supabase.auth.admin.deleteUser(woolelaUserId);
      console.log('✅ Auth 사용자 삭제 완료');
    } catch (error) {
      console.log('⚠️ Auth 사용자 삭제 중 오류 (무시):', error);
    }

    // 3. 새 Auth 사용자 생성
    console.log('👤 새 woolela Auth 사용자 생성 중...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: woolelaEmail,
      password: 'woolela123!', // 임시 비밀번호
      email_confirm: true,
      user_metadata: {
        name: '우렐라'
      }
    });

    if (authError) {
      console.error('❌ Auth 사용자 생성 오류:', authError);
      throw new Error(`Auth 사용자 생성 실패: ${authError.message}`);
    }

    const newUserId = authData.user.id;
    console.log(`✅ 새 Auth 사용자 생성 완료: ${newUserId}`);

    // 4. 프로필 생성
    console.log('📝 프로필 생성 중...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUserId,
        email: woolelaEmail,
        name: '우렐라',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ 프로필 생성 오류:', profileError);
      // 롤백: Auth 사용자 삭제
      try {
        await supabase.auth.admin.deleteUser(newUserId);
        console.log('✅ 롤백 완료: Auth 사용자 삭제됨');
      } catch (rollbackError) {
        console.error('❌ 롤백 실패:', rollbackError);
      }
      throw new Error(`프로필 생성 실패: ${profileError.message}`);
    }

    console.log('✅ 프로필 생성 완료');

    // 5. 관리자 권한 부여
    console.log('👑 관리자 권한 부여 중...');
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: newUserId,
        email: woolelaEmail,
        is_active: true,
        granted_at: new Date().toISOString()
      });

    if (adminError) {
      console.error('❌ 관리자 권한 부여 오류:', adminError);
      console.warn('⚠️ 관리자 권한 부여 실패했지만 사용자는 생성됨');
    } else {
      console.log('✅ 관리자 권한 부여 완료');
    }

    console.log('✅ woolela 계정 완전 재생성 완료');

    return NextResponse.json({
      success: true,
      message: 'woolela 계정이 성공적으로 재생성되었습니다.',
      data: {
        user: {
          id: newUserId,
          email: woolelaEmail,
          name: '우렐라',
          is_admin: true,
          is_active: true,
          temporary_password: 'woolela123!'
        }
      }
    });

  } catch (error) {
    console.error('❌ woolela 계정 완전 재생성 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'woolela 계정 완전 재생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
