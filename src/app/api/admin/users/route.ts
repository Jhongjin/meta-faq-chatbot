import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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

    // 실제 Supabase에서 사용자 데이터 조회
    console.log('📊 실제 사용자 데이터 조회 중...');
    
    // 1. 프로필 정보 조회
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name, avatar_url, created_at, updated_at');

    if (profilesError) {
      console.error('❌ 프로필 조회 오류:', profilesError);
      throw new Error(`프로필 조회 실패: ${profilesError.message}`);
    }

    // 2. 관리자 권한 정보 조회
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id, is_active');

    if (adminError) {
      console.error('❌ 관리자 정보 조회 오류:', adminError);
      // 관리자 정보 조회 실패해도 계속 진행
    }

    // 3. 대화 수 조회
    const { data: conversationCounts, error: convError } = await supabase
      .from('conversations')
      .select('user_id')
      .not('user_id', 'is', null);

    if (convError) {
      console.error('❌ 대화 수 조회 오류:', convError);
      // 대화 수 조회 실패해도 계속 진행
    }

    // 4. 사용자 데이터 조합
    const users: User[] = (profiles || []).map(profile => {
      const isAdmin = adminUsers?.some(admin => 
        admin.user_id === profile.id && admin.is_active
      ) || false;
      
      const conversationCount = conversationCounts?.filter(conv => 
        conv.user_id === profile.id
      ).length || 0;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || '이름 없음',
        avatar_url: profile.avatar_url,
        is_admin: isAdmin,
        is_active: true, // 기본적으로 활성 상태로 설정
        last_sign_in: new Date().toISOString(), // 실제 last_sign_in은 auth.users에서 가져와야 함
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        conversation_count: conversationCount
      };
    });

    console.log(`📊 실제 사용자 데이터 조회 완료: ${users.length}명`);

    // 검색 필터 적용
    let filteredUsers = users;
    if (search) {
      filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 필터 적용
    if (filter === 'admin') {
      filteredUsers = filteredUsers.filter(user => user.is_admin);
    } else if (filter === 'active') {
      filteredUsers = filteredUsers.filter(user => user.is_active);
    } else if (filter === 'inactive') {
      filteredUsers = filteredUsers.filter(user => !user.is_active);
    }

    // 정렬 적용
    filteredUsers.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'last_sign_in':
          aValue = new Date(a.last_sign_in || 0).getTime();
          bValue = new Date(b.last_sign_in || 0).getTime();
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // 페이지네이션 적용
    const totalCount = filteredUsers.length;
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginatedUsers = filteredUsers.slice(from, to);

    console.log('📊 사용자 목록 처리 완료 (하드코딩):', {
      totalUsers: totalCount,
      currentPage: page,
      pageSize: limit,
      filteredUsers: paginatedUsers.length
    });

    return NextResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
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
