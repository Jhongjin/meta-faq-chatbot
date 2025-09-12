import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경 변수 확인 및 조건부 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// 관리자 권한 확인 함수
async function isAdminUser(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('is_active')
    .eq('email', email)
    .eq('is_active', true)
    .single();
  
  if (error) {
    return false;
  }
  
  return !!data;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  is_admin: boolean;
  is_active: boolean;
  last_sign_in?: string;
  created_at: string;
  updated_at: string;
  conversation_count: number;
}

export async function GET(request: NextRequest) {
    // Supabase 클라이언트 확인
    if (!supabase) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
  try {
    console.log('🚀 사용자 목록 API 시작...');

    // URL 파라미터에서 검색어와 필터 가져오기
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 1. 사용자 프로필 조회
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        name,
        avatar_url,
        created_at,
        updated_at
      `);

    // 검색 조건 추가
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 필터 조건 추가 (관리자 필터는 나중에 처리)
    if (filter === 'active') {
      // 활성 사용자 필터는 auth.users 정보가 필요하므로 나중에 처리
    } else if (filter === 'inactive') {
      // 비활성 사용자 필터는 auth.users 정보가 필요하므로 나중에 처리
    }

    // 정렬 추가
    if (sortBy === 'name') {
      query = query.order('name', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'email') {
      query = query.order('email', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'last_sign_in') {
      query = query.order('auth.users.last_sign_in_at', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error('❌ 사용자 프로필 조회 오류:', profilesError);
      throw new Error(`사용자 프로필 조회 실패: ${profilesError.message}`);
    }

    console.log(`✅ 사용자 프로필 조회 완료: ${profiles?.length || 0}개`);

    // 2. 각 사용자의 대화 수 조회
    const profileUserIds = profiles?.map((p: any) => p.id) || [];
    let conversationCounts: { [key: string]: number } = {};

    if (profileUserIds.length > 0) {
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('user_id')
        .in('user_id', profileUserIds);

      if (conversationsError) {
        console.error('❌ 대화 수 조회 오류:', conversationsError);
        // 대화 수 조회 실패해도 계속 진행
      } else {
        // 사용자별 대화 수 계산
        conversations?.forEach((conv: any) => {
          conversationCounts[conv.user_id] = (conversationCounts[conv.user_id] || 0) + 1;
        });
      }
    }

    // 3. 전체 사용자 수 조회 (페이지네이션을 위해)
    const { count: totalCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ 전체 사용자 수 조회 오류:', countError);
    }

    // 4. auth.users에서 추가 정보 조회
    let authUsers: { [key: string]: any } = {};

    if (profileUserIds.length > 0) {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ 인증 사용자 조회 오류:', authError);
        // 인증 사용자 조회 실패해도 계속 진행
      } else {
        // 사용자별 인증 정보 매핑
        authData?.users?.forEach(user => {
          authUsers[user.id] = user;
        });
      }
    }

    // 5. 관리자 권한 정보 조회
    const adminEmails = profiles?.map(p => p.email) || [];
    let adminUsers: { [key: string]: boolean } = {};

    if (adminEmails.length > 0) {
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('email, is_active')
        .in('email', adminEmails)
        .eq('is_active', true);

      if (adminError) {
        console.error('❌ 관리자 권한 조회 오류:', adminError);
        // 관리자 권한 조회 실패해도 계속 진행
      } else {
        // 이메일별 관리자 권한 매핑
        adminData?.forEach(admin => {
          adminUsers[admin.email] = admin.is_active;
        });
      }
    }

    // 6. 데이터 변환
    let users: User[] = profiles?.map(profile => {
      const authUser = authUsers[profile.id];
      const isAdmin = adminUsers[profile.email] || false;
      const isActive = !!authUser?.email_confirmed_at;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || '이름 없음',
        avatar_url: profile.avatar_url,
        is_admin: isAdmin,
        is_active: isActive,
        last_sign_in: authUser?.last_sign_in_at || null,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        conversation_count: conversationCounts[profile.id] || 0
      };
    }) || [];

    // 7. 필터 적용 (관리자, 활성/비활성)
    if (filter === 'admin') {
      users = users.filter(user => user.is_admin);
    } else if (filter === 'active') {
      users = users.filter(user => user.is_active);
    } else if (filter === 'inactive') {
      users = users.filter(user => !user.is_active);
    }

    console.log('📊 사용자 목록 처리 완료:', {
      totalUsers: totalCount || 0,
      currentPage: page,
      pageSize: limit,
      filteredUsers: users.length
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ 사용자 목록 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '사용자 목록 조회 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('🚀 사용자 정보 업데이트 API 시작...');

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. 프로필 정보 업데이트
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      console.error('❌ 프로필 업데이트 오류:', profileError);
      throw new Error(`프로필 업데이트 실패: ${profileError.message}`);
    }

    console.log(`✅ 사용자 프로필 업데이트 완료: ${userId}`);

    return NextResponse.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('❌ 사용자 정보 업데이트 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '사용자 정보 업데이트 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
