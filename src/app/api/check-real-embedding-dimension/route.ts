import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔍 실제 임베딩 차원 확인 시작');
    
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
      .not('embedding', 'is', null);
    
    if (fetchError) {
      console.error('❌ 청크 조회 실패:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: '청크 조회 실패',
        details: fetchError.message 
      }, { status: 500 });
    }
    
    console.log(`📊 조회된 청크 수: ${chunks?.length || 0}개`);
    
    const dimensionResults = (chunks || []).map((chunk) => {
      let actualDimension = 0;
      let parseError = null;
      
      try {
        if (typeof chunk.embedding === 'string') {
          const parsed = JSON.parse(chunk.embedding);
          if (Array.isArray(parsed)) {
            actualDimension = parsed.length;
          }
        } else if (Array.isArray(chunk.embedding)) {
          actualDimension = chunk.embedding.length;
        }
      } catch (error) {
        parseError = String(error);
      }
      
      const metadataDimension = chunk.metadata?.embedding_dimension || 'N/A';
      
      console.log(`📊 청크 ${chunk.chunk_id}:`);
      console.log(`  - 실제 차원: ${actualDimension}`);
      console.log(`  - 메타데이터 차원: ${metadataDimension}`);
      console.log(`  - 파싱 오류: ${parseError || '없음'}`);
      
      return {
        chunk_id: chunk.chunk_id,
        actual_dimension: actualDimension,
        metadata_dimension: metadataDimension,
        parse_error: parseError,
        needs_conversion: actualDimension === 768 && metadataDimension === 1024
      };
    });
    
    const needsConversion = dimensionResults.filter(r => r.needs_conversion);
    const uniqueDimensions = [...new Set(dimensionResults.map(r => r.actual_dimension))];
    
    console.log(`📊 실제 차원 요약:`);
    console.log(`  - 고유 차원: ${uniqueDimensions.join(', ')}`);
    console.log(`  - 변환 필요: ${needsConversion.length}개`);
    
    return NextResponse.json({
      success: true,
      message: '실제 임베딩 차원 확인 완료',
      results: {
        total: dimensionResults.length,
        unique_dimensions: uniqueDimensions,
        needs_conversion: needsConversion.length,
        chunks: dimensionResults
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 실제 임베딩 차원 확인 실패:', error);
    
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
      error: '실제 임베딩 차원 확인 실패',
      details: errorMessage 
    }, { status: 500 });
  }
}


