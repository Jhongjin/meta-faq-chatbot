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

    // 임시 하드코딩된 사용자 데이터 (개발 환경용)
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'secho@nasmedia.co.kr',
        name: '조성은',
        avatar_url: undefined,
        is_admin: true,
        is_active: true,
        last_sign_in: new Date().toISOString(),
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 전
        updated_at: new Date().toISOString(),
        conversation_count: 15
      },
      {
        id: '2',
        email: 'woolela@nasmedia.co.kr',
        name: '전홍진',
        avatar_url: undefined,
        is_admin: true,
        is_active: true,
        last_sign_in: new Date().toISOString(),
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25일 전
        updated_at: new Date().toISOString(),
        conversation_count: 8
      },
      {
        id: '3',
        email: 'dsko@nasmedia.co.kr',
        name: '고대승',
        avatar_url: undefined,
        is_admin: true,
        is_active: true,
        last_sign_in: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20일 전
        updated_at: new Date().toISOString(),
        conversation_count: 12
      },
      {
        id: '4',
        email: 'hjchoi@nasmedia.co.kr',
        name: '최호준',
        avatar_url: undefined,
        is_admin: true,
        is_active: true,
        last_sign_in: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 전
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15일 전
        updated_at: new Date().toISOString(),
        conversation_count: 6
      },
      {
        id: '5',
        email: 'sunjung@nasmedia.co.kr',
        name: '임선정',
        avatar_url: undefined,
        is_admin: true,
        is_active: true,
        last_sign_in: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10일 전
        updated_at: new Date().toISOString(),
        conversation_count: 20
      }
    ];

    // 검색 필터 적용
    let filteredUsers = mockUsers;
    if (search) {
      filteredUsers = mockUsers.filter(user => 
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
