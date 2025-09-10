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

    // 1. 테이블 존재 확인 (직접 쿼리)
    let tables = [];
    let tablesError = null;
    
    try {
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('id')
        .limit(1);
      
      if (!docsError) tables.push('documents');
    } catch (error) {
      console.log('documents 테이블 없음');
    }

    try {
      const { data: chunksData, error: chunksError } = await supabase
        .from('document_chunks')
        .select('id')
        .limit(1);
      
      if (!chunksError) tables.push('document_chunks');
    } catch (error) {
      console.log('document_chunks 테이블 없음');
    }

    // 2. search_documents 함수 존재 확인
    let functions = [];
    let functionsError = null;
    
    try {
      const { data: funcData, error: funcError } = await supabase
        .rpc('search_documents', {
          query_embedding: new Array(1536).fill(0),
          match_threshold: 0.7,
          match_count: 1
        });
      
      if (!funcError) functions.push('search_documents');
    } catch (error) {
      console.log('search_documents 함수 없음');
    }

    // 4. 데이터 개수 확인
    const { count: documentCount, error: docError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    const { count: chunkCount, error: chunkError } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      tables: tables,
      columns: [], // 컬럼 정보는 생략
      functions: functions,
      dataCounts: {
        documents: documentCount || 0,
        chunks: chunkCount || 0
      },
      errors: {
        documents: docError?.message,
        chunks: chunkError?.message
      }
    });

  } catch (error) {
    console.error('마이그레이션 확인 오류:', error);
    return NextResponse.json({
      success: false,
      error: `마이그레이션 확인 중 오류: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
