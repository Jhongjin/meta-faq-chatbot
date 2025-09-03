import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';

// 환경 변수에서 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// 빌드 시에는 환경 변수가 없을 수 있으므로 조건부 처리
let supabase: any = null;
let embeddings: any = null;

if (supabaseUrl && supabaseServiceKey) {
  // Supabase 클라이언트 생성
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

if (openaiApiKey) {
  // OpenAI 임베딩 모델 초기화
  embeddings = new OpenAIEmbeddings({
    openAIApiKey: openaiApiKey,
    modelName: 'text-embedding-3-small',
    dimensions: 1536,
  });
}

// 벡터 유사도 검색 API 엔드포인트
export async function POST(request: NextRequest) {
  try {
    // 환경 변수 체크
    if (!supabase || !embeddings) {
      return NextResponse.json(
        { error: '서비스가 설정되지 않았습니다. 환경 변수를 확인해주세요.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { query, threshold = 0.7, limit = 10 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '검색 쿼리가 필요합니다.' },
        { status: 400 }
      );
    }

    // 검색 쿼리를 임베딩 벡터로 변환
    const queryEmbedding = await embeddings.embedQuery(query);

    // Supabase에서 벡터 유사도 검색 실행
    const { data: searchResults, error } = await supabase.rpc('search_documents', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit
    });

    if (error) {
      console.error('벡터 검색 오류:', error);
      return NextResponse.json(
        { error: '검색 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 검색 결과에 문서 메타데이터 추가
    const enrichedResults = await enrichSearchResults(searchResults);

    return NextResponse.json({
      success: true,
      query,
      results: enrichedResults,
      total: enrichedResults.length
    });

  } catch (error) {
    console.error('검색 API 오류:', error);
    return NextResponse.json(
      { error: '검색 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 검색 결과에 문서 메타데이터 추가
async function enrichSearchResults(searchResults: any[]) {
  try {
    if (!searchResults || searchResults.length === 0) {
      return [];
    }

    // 고유한 문서 ID 추출
    const documentIds = [...new Set(searchResults.map(result => {
      const chunkId = result.chunk_id;
      return chunkId.split('_chunk_')[0]; // file_123_chunk_0 -> file_123
    }))];

    // 문서 메타데이터 조회
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, type, status, created_at')
      .in('id', documentIds);

    if (error) {
      console.error('문서 메타데이터 조회 오류:', error);
      return searchResults;
    }

    // 문서 메타데이터를 검색 결과에 매핑
    const documentMap = new Map(documents?.map(doc => [doc.id, doc]) || []);

    return searchResults.map(result => {
      const chunkId = result.chunk_id;
      const documentId = chunkId.split('_chunk_')[0];
      const document = documentMap.get(documentId);

      return {
        ...result,
        document: document || null,
        chunkIndex: parseInt(chunkId.split('_chunk_')[1]) || 0
      };
    });

  } catch (error) {
    console.error('검색 결과 보강 오류:', error);
    return searchResults;
  }
}

// GET 요청으로도 검색 가능하도록 지원
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const threshold = parseFloat(searchParams.get('threshold') || '0.7');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: '검색 쿼리(q)가 필요합니다.' },
        { status: 400 }
      );
    }

    // POST 요청과 동일한 로직 사용
    const body = { query, threshold, limit };
    const modifiedRequest = new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await POST(modifiedRequest);

  } catch (error) {
    console.error('GET 검색 API 오류:', error);
    return NextResponse.json(
      { error: '검색 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
