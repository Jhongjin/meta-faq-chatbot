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

    // 1. document_chunks 테이블에서 직접 데이터 조회
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('chunk_id, embedding')
      .limit(3);

    if (chunksError) {
      return NextResponse.json({
        success: false,
        error: `청크 조회 실패: ${chunksError.message}`
      });
    }

    // 2. 각 청크의 임베딩 분석
    const analysis = chunks?.map(chunk => {
      const embedding = chunk.embedding;
      let result = {
        chunkId: chunk.chunk_id,
        rawType: typeof embedding,
        isArray: Array.isArray(embedding),
        length: null,
        sample: null,
        parseError: null,
        vectorTest: null
      };

      try {
        if (typeof embedding === 'string') {
          // JSON 문자열인 경우
          const parsed = JSON.parse(embedding);
          result.length = Array.isArray(parsed) ? parsed.length : null;
          result.sample = Array.isArray(parsed) ? parsed.slice(0, 5) : null;
          
          // 벡터 변환 테스트
          try {
            const vectorString = `[${parsed.join(',')}]`;
            result.vectorTest = {
              success: true,
              dimension: parsed.length,
              sample: parsed.slice(0, 5)
            };
          } catch (vectorError) {
            result.vectorTest = {
              success: false,
              error: vectorError instanceof Error ? vectorError.message : String(vectorError)
            };
          }
        } else if (Array.isArray(embedding)) {
          result.length = embedding.length;
          result.sample = embedding.slice(0, 5);
          result.vectorTest = {
            success: true,
            dimension: embedding.length,
            sample: embedding.slice(0, 5)
          };
        }
      } catch (error) {
        result.parseError = error instanceof Error ? error.message : String(error);
        result.vectorTest = {
          success: false,
          error: result.parseError
        };
      }

      return result;
    });

    // 3. search_documents 함수 직접 테스트
    let searchTest = null;
    try {
      // 간단한 테스트 벡터 (768차원)
      const testVector = new Array(768).fill(0.1);
      
      const { data: searchResult, error: searchError } = await supabase
        .rpc('search_documents', {
          query_embedding: testVector,
          match_threshold: 0.1,
          match_count: 5
        });
      
      searchTest = {
        success: !searchError,
        error: searchError?.message,
        result: searchResult
      };
    } catch (error) {
      searchTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    return NextResponse.json({
      success: true,
      analysis: {
        chunks: analysis,
        searchTest: searchTest,
        summary: {
          totalChunks: chunks?.length || 0,
          embeddingTypes: [...new Set(analysis?.map(a => a.rawType) || [])],
          dimensions: [...new Set(analysis?.map(a => a.length).filter(d => d !== null) || [])],
          parseErrors: analysis?.filter(a => a.parseError).length || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ 직접 벡터 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
