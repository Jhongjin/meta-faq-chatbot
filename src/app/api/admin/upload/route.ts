/**
 * 기존 업로드 API - 새로운 API로 리다이렉트
 * 기존 클라이언트와의 호환성을 위해 유지
 */

import { NextRequest, NextResponse } from 'next/server';

// Vercel에서 API 라우트가 올바르게 인식되도록 런타임 설정
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 새로운 문서 처리 서비스로 리다이렉트
export async function POST(request: NextRequest) {
  console.log('🔄 기존 API에서 새로운 API로 리다이렉트');
  
  // 새로운 API 엔드포인트로 요청 전달
  const newUrl = request.url.replace('/api/admin/upload', '/api/admin/upload-new');
  
  try {
    const response = await fetch(newUrl, {
      method: 'POST',
      headers: request.headers,
      body: request.body,
    });
    
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('❌ 리다이렉트 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'API 리다이렉트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('🔄 기존 API에서 새로운 API로 리다이렉트 (GET)');
  
  const newUrl = request.url.replace('/api/admin/upload', '/api/admin/upload-new');
  
  try {
    const response = await fetch(newUrl, {
      method: 'GET',
      headers: request.headers,
    });
    
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('❌ 리다이렉트 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'API 리다이렉트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log('🔄 기존 API에서 새로운 API로 리다이렉트 (DELETE)');
  
  const newUrl = request.url.replace('/api/admin/upload', '/api/admin/upload-new');
  
  try {
    const response = await fetch(newUrl, {
      method: 'DELETE',
      headers: request.headers,
    });
    
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('❌ 리다이렉트 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'API 리다이렉트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log('🔄 기존 API에서 새로운 API로 리다이렉트 (PUT)');
  
  const newUrl = request.url.replace('/api/admin/upload', '/api/admin/upload-new');
  
  try {
    const response = await fetch(newUrl, {
      method: 'PUT',
      headers: request.headers,
      body: request.body,
    });
    
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('❌ 리다이렉트 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'API 리다이렉트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}