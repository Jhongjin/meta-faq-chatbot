import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 상태 확인 API 시작...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase 환경변수 누락');
      return NextResponse.json(
        { 
          success: false,
          error: 'Supabase 환경변수가 설정되지 않았습니다.',
          stats: {
            total: 0,
            completed: 0,
            pending: 0,
            processing: 0,
            totalChunks: 0
          },
          documents: []
        },
        { status: 500 }
      );
    }

    console.log('✅ Supabase 환경변수 확인 완료');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 문서 조회 (간단한 방식으로 수정)
    console.log('📋 문서 조회 시작...');
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, title, url, type, status, created_at, updated_at, chunk_count')
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('❌ 문서 조회 실패:', docsError);
      return NextResponse.json(
        { 
          success: false,
          error: `문서 조회 실패: ${docsError.message}`,
          stats: {
            total: 0,
            completed: 0,
            pending: 0,
            processing: 0,
            totalChunks: 0
          },
          documents: []
        },
        { status: 500 }
      );
    }

    console.log(`✅ 문서 조회 완료: ${documents?.length || 0}개`);

    // 청크 수 조회 (간단한 방식)
    console.log('📦 청크 수 조회 시작...');
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('document_id');

    if (chunksError) {
      console.error('❌ 청크 조회 실패:', chunksError);
      // 청크 조회 실패해도 문서 정보는 반환
    }

    console.log(`✅ 청크 조회 완료: ${chunks?.length || 0}개`);

    // 청크 수 계산
    const chunkCounts: { [key: string]: number } = {};
    if (chunks) {
      chunks.forEach((chunk: any) => {
        chunkCounts[chunk.document_id] = (chunkCounts[chunk.document_id] || 0) + 1;
      });
    }

    // 문서에 청크 수 추가
    const documentsWithChunks = documents?.map(doc => ({
      ...doc,
      chunk_count: doc.chunk_count || (chunkCounts[doc.id] || 0),
      actual_chunk_count: chunkCounts[doc.id] || 0
    })) || [];

    // 통계 계산
    const stats = {
      total: documentsWithChunks.length,
      completed: documentsWithChunks.filter(doc => 
        doc.status === 'completed' || doc.status === 'indexed'
      ).length,
      pending: documentsWithChunks.filter(doc => doc.status === 'pending').length,
      processing: documentsWithChunks.filter(doc => doc.status === 'processing').length,
      totalChunks: Object.values(chunkCounts).reduce((sum: number, count: any) => sum + count, 0)
    };

    console.log('📊 통계 계산 완료:', stats);

    return NextResponse.json({
      success: true,
      documents: documentsWithChunks,
      stats
    });

  } catch (error) {
    console.error('❌ 상태 확인 API 오류:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '상태 확인 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        stats: {
          total: 0,
          completed: 0,
          pending: 0,
          processing: 0,
          totalChunks: 0
        },
        documents: []
      },
      { status: 500 }
    );
  }
}