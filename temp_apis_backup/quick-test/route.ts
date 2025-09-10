import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    console.log('🚀 빠른 테스트 시작:', query);
    
    // 1. 임베딩 서비스만 테스트 (5초 타임아웃)
    let embeddingResult = null;
    try {
      const { OllamaEmbeddingService } = await import('@/lib/services/OllamaEmbeddingService');
      const embeddingService = new OllamaEmbeddingService();
      
      const startTime = Date.now();
      const embedding = await embeddingService.generateEmbedding(query);
      const processingTime = Date.now() - startTime;
      
      embeddingResult = {
        success: true,
        dimension: embedding.dimension,
        processingTime,
        model: embedding.model
      };
      
      console.log('✅ 임베딩 성공:', { processingTime: `${processingTime}ms` });
    } catch (error) {
      console.error('❌ 임베딩 실패:', error);
      embeddingResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // 2. 데이터베이스 직접 조회 (RPC 함수 사용 안함)
    let dbResult = null;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('document_chunks')
        .select('chunk_id, content, metadata')
        .limit(3);

      if (error) {
        dbResult = { success: false, error: error.message };
      } else {
        dbResult = { 
          success: true, 
          count: data?.length || 0,
          samples: data?.map(d => d.chunk_id) || []
        };
      }
      
      console.log('✅ DB 조회 성공:', { count: data?.length || 0 });
    } catch (error) {
      console.error('❌ DB 조회 실패:', error);
      dbResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    return NextResponse.json({
      success: true,
      message: '빠른 테스트 완료',
      results: {
        embedding: embeddingResult,
        database: dbResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 빠른 테스트 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
