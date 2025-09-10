import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 환경 변수가 설정되지 않았습니다.'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 간단한 테스트 벡터로 search_documents 함수 테스트
    const testVector = new Array(768).fill(0.1);
    
    try {
      const { data: searchResult, error: searchError } = await supabase
        .rpc('search_documents', {
          query_embedding: testVector,
          match_threshold: 0.1,
          match_count: 5
        });
      
      return NextResponse.json({
        success: true,
        functionExists: true,
        testResult: {
          success: !searchError,
          error: searchError?.message,
          result: searchResult
        }
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        functionExists: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

  } catch (error) {
    console.error('❌ search_documents 함수 확인 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
