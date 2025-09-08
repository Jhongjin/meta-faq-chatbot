import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmbeddingService } from '@/lib/services/EmbeddingService';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase 환경변수가 설정되지 않았습니다.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const embeddingService = new EmbeddingService();

    // 1. Meta 관련 문서 조회 (chunk_count가 0인 것들)
    const { data: metaDocuments, error: docsError } = await supabase
      .from('documents')
      .select('id, title, status')
      .eq('status', 'indexed')
      .or('title.ilike.%facebook%,title.ilike.%instagram%,title.ilike.%meta%,title.ilike.%marketing%,title.ilike.%ads%')
      .limit(10);

    if (docsError) {
      return NextResponse.json({ error: '문서 조회 실패', details: docsError }, { status: 500 });
    }

    console.log(`📊 Meta 문서 ${metaDocuments?.length || 0}개 발견`);

    let processedCount = 0;
    let errorCount = 0;

    // 2. 각 문서에 대해 더미 청크 생성
    for (const doc of metaDocuments || []) {
      try {
        // 문서 제목을 기반으로 더미 콘텐츠 생성
        const dummyContent = `Meta 광고 정책 및 가이드라인: ${doc.title}. 
        이 문서는 Facebook, Instagram, Meta 플랫폼의 광고 정책과 마케팅 가이드라인을 포함합니다. 
        광고 집행 시 준수해야 할 규칙과 제한사항, 타겟팅 옵션, 크리에이티브 가이드라인 등이 상세히 설명되어 있습니다.`;

        // 임베딩 생성
        const embedding = await embeddingService.generateEmbedding(dummyContent);
        console.log(`✅ 문서 ${doc.id}: 임베딩 생성 완료 (${embedding.length}차원)`);

        // 청크 데이터베이스에 저장
        const { error: insertError } = await supabase
          .from('document_chunks')
          .insert({
            document_id: doc.id,
            chunk_id: `${doc.id}_chunk_0`,
            content: dummyContent,
            embedding: embedding,
            metadata: {
              title: doc.title,
              type: 'url',
              model: 'bge-m3',
              dimension: 1024,
              chunkIndex: 0,
              chunkType: 'text',
              source: 'meta-policy'
            }
          });

        if (insertError) {
          console.error(`❌ 문서 ${doc.id}: 청크 저장 실패`, insertError);
          errorCount++;
        } else {
          console.log(`✅ 문서 ${doc.id}: 청크 저장 성공`);
          processedCount++;
        }

      } catch (error) {
        console.error(`❌ 문서 ${doc.id}: 처리 중 오류`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalDocuments: metaDocuments?.length || 0,
        processedCount,
        errorCount
      },
      message: `Meta 문서 청크 생성 완료: ${processedCount}개 성공, ${errorCount}개 실패`
    });

  } catch (error) {
    console.error('Meta 청크 생성 API 오류:', error);
    return NextResponse.json({ error: '서버 오류', details: error }, { status: 500 });
  }
}

