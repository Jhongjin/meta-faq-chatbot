import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SimpleEmbeddingService } from '@/lib/services/SimpleEmbeddingService';

export async function POST() {
  try {
    console.log('🔄 임베딩 재생성 시작');
    
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
    const embeddingService = new SimpleEmbeddingService();
    
    // 1. 임베딩이 없는 청크 조회
    console.log('📊 임베딩이 없는 청크 조회');
    const { data: chunksWithoutEmbedding, error: chunksError } = await supabase
      .from('ollama_document_chunks')
      .select('id, chunk_id, content, metadata')
      .is('embedding', null)
      .limit(100); // 배치 처리
    
    if (chunksError) {
      console.error('❌ 청크 조회 오류:', chunksError);
      return NextResponse.json({
        success: false,
        error: '청크 조회 실패',
        details: chunksError
      }, { status: 500 });
    }
    
    if (!chunksWithoutEmbedding || chunksWithoutEmbedding.length === 0) {
      return NextResponse.json({
        success: true,
        message: '임베딩이 필요한 청크가 없습니다.',
        processed: 0
      });
    }
    
    console.log(`📝 ${chunksWithoutEmbedding.length}개 청크의 임베딩 생성 시작`);
    
    // 2. 배치로 임베딩 생성 및 업데이트
    let processed = 0;
    let errors = 0;
    
    for (const chunk of chunksWithoutEmbedding) {
      try {
        // 임베딩 생성
        const embeddingResult = await embeddingService.generateEmbedding(
          chunk.content,
          { model: 'bge-m3' }
        );
        
        // 임베딩 업데이트 (updated_at 제외)
        const { error: updateError } = await supabase
          .from('ollama_document_chunks')
          .update({
            embedding: embeddingResult.embedding,
            metadata: {
              ...chunk.metadata,
              embedding_model: 'simple-hash',
              embedding_dimension: 1024,
              regenerated_at: new Date().toISOString()
            }
          })
          .eq('id', chunk.id);
        
        if (updateError) {
          console.error(`❌ 청크 ${chunk.chunk_id} 업데이트 실패:`, updateError);
          errors++;
        } else {
          processed++;
          console.log(`✅ 청크 ${chunk.chunk_id} 임베딩 생성 완료`);
        }
        
        // API 타임아웃 방지를 위한 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ 청크 ${chunk.chunk_id} 처리 실패:`, error);
        errors++;
      }
    }
    
    // 3. 통계 업데이트
    await supabase.rpc('analyze_table', { table_name: 'ollama_document_chunks' });
    
    const result = {
      success: true,
      message: '임베딩 재생성 완료',
      processed,
      errors,
      total: chunksWithoutEmbedding.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ 임베딩 재생성 완료:', result);
    
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('❌ 임베딩 재생성 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: '임베딩 재생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
