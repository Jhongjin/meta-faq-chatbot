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

    // 테이블 스키마 확인
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, udt_name')
      .eq('table_name', 'document_chunks')
      .eq('table_schema', 'public');

    if (tableError) {
      return NextResponse.json({
        success: false,
        error: `테이블 스키마 조회 실패: ${tableError.message}`
      });
    }

    // 임베딩 데이터 샘플 확인
    const { data: sampleData, error: sampleError } = await supabase
      .from('document_chunks')
      .select('chunk_id, embedding')
      .limit(1);

    if (sampleError) {
      return NextResponse.json({
        success: false,
        error: `샘플 데이터 조회 실패: ${sampleError.message}`
      });
    }

    // search_documents 함수 존재 확인
    const { data: functionInfo, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_name', 'search_documents')
      .eq('routine_schema', 'public');

    return NextResponse.json({
      success: true,
      tableSchema: tableInfo,
      sampleData: sampleData?.[0] ? {
        chunkId: sampleData[0].chunk_id,
        embeddingType: typeof sampleData[0].embedding,
        embeddingSample: sampleData[0].embedding?.toString().substring(0, 100) + '...'
      } : null,
      functionExists: functionInfo && functionInfo.length > 0,
      functionInfo: functionInfo?.[0]
    });

  } catch (error) {
    console.error('❌ 데이터베이스 스키마 확인 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
