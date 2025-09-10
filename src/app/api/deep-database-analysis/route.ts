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
    let tableExists = false;
    let tableInfo = null;
    
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('document_chunks')
        .select('*')
        .limit(1);
      
      tableExists = !tableError;
      if (tableData && tableData.length > 0) {
        tableInfo = {
          columns: Object.keys(tableData[0]),
          sampleRow: tableData[0]
        };
      }
    } catch (error) {
      console.log('테이블 직접 조회 실패:', error);
    }

    // 2. 실제 임베딩 데이터 분석
    const { data: embeddingData, error: embeddingError } = await supabase
      .from('document_chunks')
      .select('chunk_id, embedding')
      .limit(3);

    if (embeddingError) {
      return NextResponse.json({
        success: false,
        error: `임베딩 데이터 조회 실패: ${embeddingError.message}`
      });
    }

    // 3. 벡터 타입 직접 테스트
    let vectorTestResult = null;
    try {
      const { data: vectorTest, error: vectorError } = await supabase
        .rpc('test_vector_parsing', {
          test_embedding: embeddingData?.[0]?.embedding
        });
      
      vectorTestResult = {
        success: !vectorError,
        error: vectorError?.message,
        result: vectorTest
      };
    } catch (error) {
      vectorTestResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // 4. search_documents 함수 직접 테스트
    let searchTestResult = null;
    try {
      // 간단한 테스트 벡터 생성 (768차원)
      const testVector = new Array(768).fill(0.1);
      
      const { data: searchTest, error: searchError } = await supabase
        .rpc('search_documents', {
          query_embedding: testVector,
          match_threshold: 0.1,
          match_count: 5
        });
      
      searchTestResult = {
        success: !searchError,
        error: searchError?.message,
        result: searchTest
      };
    } catch (error) {
      searchTestResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // 5. 임베딩 데이터 상세 분석
    const embeddingAnalysis = embeddingData?.map(chunk => {
      const embedding = chunk.embedding;
      let analysis = {
        chunkId: chunk.chunk_id,
        type: typeof embedding,
        isArray: Array.isArray(embedding),
        length: null,
        sample: null,
        rawType: null
      };

      try {
        if (typeof embedding === 'string') {
          const parsed = JSON.parse(embedding);
          analysis.length = Array.isArray(parsed) ? parsed.length : null;
          analysis.sample = Array.isArray(parsed) ? parsed.slice(0, 5) : null;
          analysis.rawType = 'JSON string';
        } else if (Array.isArray(embedding)) {
          analysis.length = embedding.length;
          analysis.sample = embedding.slice(0, 5);
          analysis.rawType = 'Array';
        } else {
          analysis.rawType = 'Other';
        }
      } catch (error) {
        analysis.rawType = `Parse Error: ${error instanceof Error ? error.message : String(error)}`;
      }

      return analysis;
    });

    return NextResponse.json({
      success: true,
      analysis: {
        tableExists: tableExists,
        tableInfo: tableInfo,
        embeddingData: embeddingAnalysis,
        vectorTest: vectorTestResult,
        searchTest: searchTestResult,
        summary: {
          totalChunks: embeddingData?.length || 0,
          embeddingTypes: [...new Set(embeddingAnalysis?.map(e => e.rawType) || [])],
          dimensions: [...new Set(embeddingAnalysis?.map(e => e.length).filter(d => d !== null) || [])]
        }
      }
    });

  } catch (error) {
    console.error('❌ 심층 데이터베이스 분석 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
