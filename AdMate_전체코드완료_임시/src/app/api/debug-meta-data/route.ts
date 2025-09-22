import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase 환경변수가 설정되지 않았습니다.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 모든 문서 조회 (상세 정보 포함)
    const { data: allDocuments, error: docsError } = await supabase
      .from('documents')
      .select('id, title, status, chunk_count, url, type, created_at')
      .order('created_at', { ascending: false });

    if (docsError) {
      return NextResponse.json({ error: '문서 조회 실패', details: docsError }, { status: 500 });
    }

    // 2. Meta 관련 문서 필터링
    const metaKeywords = ['facebook', 'instagram', 'meta', 'marketing', 'ads', 'policy', 'business'];
    const metaDocuments = allDocuments?.filter(doc => 
      metaKeywords.some(keyword => 
        doc.title?.toLowerCase().includes(keyword) || 
        doc.url?.toLowerCase().includes(keyword)
      )
    ) || [];

    // 3. 위키피디아 문서 필터링
    const wikipediaDocuments = allDocuments?.filter(doc => 
      doc.title?.toLowerCase().includes('wikipedia') || 
      doc.url?.toLowerCase().includes('wikipedia')
    ) || [];

    // 4. 각 문서의 청크 정보 조회
    const documentAnalysis = await Promise.all(
      (allDocuments || []).slice(0, 10).map(async (doc) => {
        const { data: chunks, error: chunksError } = await supabase
          .from('document_chunks')
          .select('id, content, metadata, embedding')
          .eq('document_id', doc.id)
          .limit(1);

        return {
          document: doc,
          chunks: chunks || [],
          hasEmbedding: chunks?.[0]?.embedding ? true : false,
          embeddingLength: chunks?.[0]?.embedding?.length || 0,
          contentPreview: chunks?.[0]?.content?.substring(0, 100) || 'No content'
        };
      })
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalDocuments: allDocuments?.length || 0,
        metaDocuments: metaDocuments.length,
        wikipediaDocuments: wikipediaDocuments.length,
        otherDocuments: (allDocuments?.length || 0) - metaDocuments.length - wikipediaDocuments.length
      },
      metaDocuments: metaDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        url: doc.url,
        status: doc.status,
        chunk_count: doc.chunk_count,
        type: doc.type,
        created_at: doc.created_at
      })),
      wikipediaDocuments: wikipediaDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        url: doc.url,
        status: doc.status,
        chunk_count: doc.chunk_count,
        type: doc.type,
        created_at: doc.created_at
      })),
      documentAnalysis: documentAnalysis.map(analysis => ({
        documentId: analysis.document.id,
        documentTitle: analysis.document.title,
        hasEmbedding: analysis.hasEmbedding,
        embeddingLength: analysis.embeddingLength,
        contentPreview: analysis.contentPreview,
        chunkCount: analysis.chunks.length
      }))
    });

  } catch (error) {
    console.error('Meta 데이터 디버그 API 오류:', error);
    return NextResponse.json({ error: '서버 오류', details: error }, { status: 500 });
  }
}
