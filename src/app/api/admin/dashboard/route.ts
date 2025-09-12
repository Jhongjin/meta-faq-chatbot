import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경 변수 확인 및 조건부 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 대시보드 통계 API 시작...');

    // Supabase 클라이언트 확인
    if (!supabase) {
      console.warn('Supabase 클라이언트가 초기화되지 않았습니다. 기본값을 반환합니다.');
      return NextResponse.json({
        success: true,
        data: {
          documents: {
            total: 0,
            byType: {},
            byStatus: {}
          },
          chunks: {
            total: 0
          },
          conversations: {
            total: 0,
            recent: []
          },
          feedback: {
            total: 0,
            positive: 0,
            negative: 0,
            positiveRate: 0
          },
          system: {
            status: 'offline',
            lastUpdate: new Date().toISOString(),
            version: '1.0.0'
          }
        }
      });
    }

    // 1. 문서 통계 조회
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, title, type, status, created_at, updated_at');

    if (documentsError) {
      console.error('❌ 문서 조회 오류:', documentsError);
      throw new Error(`문서 조회 실패: ${documentsError.message}`);
    }

    console.log(`✅ 문서 조회 완료: ${documents?.length || 0}개`);

    // 2. 청크 통계 조회
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('id, document_id');

    if (chunksError) {
      console.error('❌ 청크 조회 오류:', chunksError);
      throw new Error(`청크 조회 실패: ${chunksError.message}`);
    }

    console.log(`✅ 청크 조회 완료: ${chunks?.length || 0}개`);

    // 3. 임베딩 통계 조회 (document_chunks 테이블에서)
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('document_chunks')
      .select('id, embedding')
      .not('embedding', 'is', null);

    if (embeddingsError) {
      console.error('❌ 임베딩 조회 오류:', embeddingsError);
      throw new Error(`임베딩 조회 실패: ${embeddingsError.message}`);
    }

    console.log(`✅ 임베딩 조회 완료: ${embeddings?.length || 0}개`);

    // 4. 통계 계산
    const totalDocuments = documents?.length || 0;
    const completedDocuments = documents?.filter((doc: any) => 
      doc.status === 'completed' || doc.status === 'indexed'
    ).length || 0;
    const pendingDocuments = documents?.filter((doc: any) => 
      doc.status === 'pending' || doc.status === 'waiting'
    ).length || 0;
    const processingDocuments = documents?.filter((doc: any) => 
      doc.status === 'processing' || doc.status === 'indexing' || doc.status === 'crawling'
    ).length || 0;
    const totalChunks = chunks?.length || 0;
    const totalEmbeddings = embeddings?.length || 0;

    // 5. 시스템 상태 계산
    const errorCount = documents?.filter((doc: any) => 
      doc.status === 'error' || doc.status === 'failed'
    ).length || 0;
    
    let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';
    if (errorCount > 0) {
      overallStatus = 'error';
    } else if (processingDocuments > 0) {
      overallStatus = 'warning';
    }

    // 6. 성능 메트릭 계산
    const avgChunksPerDoc = totalDocuments > 0 ? Math.round(totalChunks / totalDocuments) : 0;
    const indexingCompletionRate = totalDocuments > 0 ? 
      Math.round((completedDocuments / totalDocuments) * 100) : 0;

    const performanceMetrics = [
      {
        metric: '총 문서 수',
        value: totalDocuments.toString(),
        status: totalDocuments > 0 ? 'excellent' : 'warning',
        trend: '+0'
      },
      {
        metric: '총 청크 수',
        value: totalChunks.toString(),
        status: totalChunks > 0 ? 'excellent' : 'warning',
        trend: '+0'
      },
      {
        metric: '문서당 평균 청크',
        value: avgChunksPerDoc.toString(),
        status: avgChunksPerDoc > 0 ? 'good' : 'warning',
        trend: '+0'
      },
      {
        metric: '인덱싱 완료율',
        value: `${indexingCompletionRate}%`,
        status: indexingCompletionRate >= 90 ? 'excellent' : 
                indexingCompletionRate >= 70 ? 'good' : 'warning',
        trend: '+0%'
      }
    ];

    // 7. 최근 활동 데이터 (실제로는 별도 테이블에서 가져와야 함)
    const recentActivity = [
      {
        id: '1',
        type: 'document_upload',
        content: '새 문서가 업로드되었습니다',
        time: '2분 전',
        user: '관리자'
      },
      {
        id: '2',
        type: 'system',
        content: '문서 인덱싱이 완료되었습니다',
        time: '5분 전'
      },
      {
        id: '3',
        type: 'document_upload',
        content: 'URL 크롤링이 완료되었습니다',
        time: '10분 전',
        user: '시스템'
      }
    ];

    // 8. 응답 데이터 구성
    const dashboardStats = {
      totalDocuments,
      completedDocuments,
      pendingDocuments,
      processingDocuments,
      totalChunks,
      totalEmbeddings,
      systemStatus: {
        overall: overallStatus,
        database: 'connected' as const,
        llm: 'operational' as const,
        vectorStore: processingDocuments > 0 ? 'indexing' as const : 'indexed' as const,
        lastUpdate: '방금 전'
      },
      recentActivity,
      performanceMetrics,
      weeklyStats: {
        questions: 0, // 실제 질문 데이터가 없음
        users: 0, // 실제 사용자 데이터가 없음
        satisfaction: 0, // 실제 만족도 데이터가 없음
        documents: 0 // 실제 문서 업로드 통계가 없음
      }
    };

    console.log('📊 대시보드 통계 계산 완료:', {
      totalDocuments,
      completedDocuments,
      pendingDocuments,
      processingDocuments,
      totalChunks,
      totalEmbeddings,
      overallStatus
    });

    return NextResponse.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    console.error('❌ 대시보드 통계 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '대시보드 통계 조회 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
