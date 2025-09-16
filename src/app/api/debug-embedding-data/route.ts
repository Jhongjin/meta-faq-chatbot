import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔍 임베딩 데이터 디버깅 시작');
    
    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 환경 변수가 설정되지 않았습니다.'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 원시 데이터 조회
    const { data: chunks, error: fetchError } = await supabase
      .from('ollama_document_chunks')
      .select('chunk_id, embedding, metadata')
      .not('embedding', 'is', null)
      .limit(3);
    
    if (fetchError) {
      console.error('❌ 청크 조회 실패:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: '청크 조회 실패',
        details: fetchError.message 
      }, { status: 500 });
    }
    
    console.log(`📊 조회된 청크 수: ${chunks?.length || 0}개`);
    
    const debugResults = (chunks || []).map((chunk, index) => {
      console.log(`\n🔍 청크 ${index + 1}: ${chunk.chunk_id}`);
      console.log(`  - 임베딩 타입: ${typeof chunk.embedding}`);
      console.log(`  - 임베딩이 배열인가: ${Array.isArray(chunk.embedding)}`);
      
      if (Array.isArray(chunk.embedding)) {
        console.log(`  - 배열 길이: ${chunk.embedding.length}`);
        console.log(`  - 첫 5개 값: [${chunk.embedding.slice(0, 5).join(', ')}]`);
      } else if (typeof chunk.embedding === 'string') {
        console.log(`  - 문자열 길이: ${chunk.embedding.length}`);
        console.log(`  - 첫 100자: ${chunk.embedding.substring(0, 100)}...`);
        
        try {
          const parsed = JSON.parse(chunk.embedding);
          console.log(`  - JSON 파싱 후 타입: ${typeof parsed}`);
          console.log(`  - JSON 파싱 후 배열인가: ${Array.isArray(parsed)}`);
          if (Array.isArray(parsed)) {
            console.log(`  - JSON 파싱 후 길이: ${parsed.length}`);
            console.log(`  - JSON 파싱 후 첫 5개 값: [${parsed.slice(0, 5).join(', ')}]`);
          }
        } catch (parseError) {
          console.log(`  - JSON 파싱 실패: ${parseError}`);
        }
      }
      
      console.log(`  - 메타데이터:`, chunk.metadata);
      
      return {
        chunk_id: chunk.chunk_id,
        embedding_type: typeof chunk.embedding,
        is_array: Array.isArray(chunk.embedding),
        array_length: Array.isArray(chunk.embedding) ? chunk.embedding.length : null,
        string_length: typeof chunk.embedding === 'string' ? chunk.embedding.length : null,
        metadata: chunk.metadata,
        embedding_sample: Array.isArray(chunk.embedding) 
          ? chunk.embedding.slice(0, 5) 
          : typeof chunk.embedding === 'string' 
            ? chunk.embedding.substring(0, 100) 
            : null
      };
    });
    
    return NextResponse.json({
      success: true,
      message: '임베딩 데이터 디버깅 완료',
      results: {
        total: debugResults.length,
        chunks: debugResults
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 임베딩 데이터 디버깅 실패:', error);
    
    let errorMessage = '알 수 없는 오류';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }
    
    return NextResponse.json({ 
      success: false, 
      error: '임베딩 데이터 디버깅 실패',
      details: errorMessage 
    }, { status: 500 });
  }
}


