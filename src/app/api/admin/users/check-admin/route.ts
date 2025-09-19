import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경 변수 확인 및 조건부 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log('🔍 관리자 권한 확인 요청:', { email });

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 임시 하드코딩된 관리자 이메일 목록 (개발 환경용)
    const adminEmails = [
      'secho@nasmedia.co.kr',
      'woolela@nasmedia.co.kr',
      'dsko@nasmedia.co.kr',
      'hjchoi@nasmedia.co.kr',
      'sunjung@nasmedia.co.kr',
      'sy230@nasmedia.co.kr',
      'jeng351@nasmedia.co.kr'
    ];

    const isAdmin = adminEmails.includes(email);
    console.log('✅ 관리자 권한 확인 완료 (하드코딩):', { isAdmin, email });

    return NextResponse.json({
      success: true,
      isAdmin,
      debug: {
        email: email,
        method: 'hardcoded',
        adminEmails: adminEmails
      }
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


