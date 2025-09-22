import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 관리자 권한 확인
    const { data, error } = await supabase
      .from('admin_users')
      .select('is_active')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) {
      // 관리자가 아닌 경우
      return NextResponse.json({
        success: true,
        isAdmin: false
      });
    }

    return NextResponse.json({
      success: true,
      isAdmin: !!data?.is_active
    });

  } catch (error) {
    console.error('❌ 관리자 권한 확인 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '관리자 권한 확인 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
