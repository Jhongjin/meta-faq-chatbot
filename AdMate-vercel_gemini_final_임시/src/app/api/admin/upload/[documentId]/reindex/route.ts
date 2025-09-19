import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    
    if (!documentId) {
      return NextResponse.json(
        { error: '문서 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🔄 재인덱싱 요청: ${documentId}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase 환경변수 누락');
      return NextResponse.json(
        { error: 'Supabase 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 문서 정보 조회
    console.log(`📋 문서 정보 조회 중: ${documentId}`);
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError) {
      console.error('❌ 문서 조회 실패:', docError);
      return NextResponse.json(
        { error: `문서 조회 실패: ${docError.message}` },
        { status: 404 }
      );
    }

    if (!document) {
      console.error('❌ 문서를 찾을 수 없음');
      return NextResponse.json(
        { error: '문서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`📄 재인덱싱 대상 문서: ${document.title} (${document.url})`);

    // 기존 청크 삭제
    console.log(`🗑️ 기존 청크 삭제 중...`);
    const { error: deleteError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    if (deleteError) {
      console.error('❌ 청크 삭제 실패:', deleteError);
      return NextResponse.json(
        { error: `기존 청크 삭제 실패: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 기존 청크 삭제 완료`);

    // 문서 상태를 'processing'으로 업데이트
    console.log(`🔄 문서 상태를 'processing'으로 업데이트 중...`);
    const { error: statusError } = await supabase
      .from('documents')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (statusError) {
      console.error('❌ 문서 상태 업데이트 실패:', statusError);
      return NextResponse.json(
        { error: `문서 상태 업데이트 실패: ${statusError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 문서 상태 업데이트 완료`);

    // 문서 타입에 따른 재인덱싱 처리
    if (document.type === 'url') {
      console.log(`🌐 URL 재인덱싱 시작: ${document.url}`);
      
      // 간단한 더미 청크 생성 (테스트용)
      console.log(`📦 테스트용 더미 청크 생성 중...`);
      
      const dummyChunks = [
        {
          content: `Meta 광고 정책 문서 - ${document.title}`,
          chunk_index: 0,
          metadata: {
            source: document.url,
            title: document.title,
            chunk_size: 50,
            type: 'dummy'
          }
        },
        {
          content: `이 문서는 ${document.url}에서 가져온 Meta 광고 관련 정책 정보입니다.`,
          chunk_index: 1,
          metadata: {
            source: document.url,
            title: document.title,
            chunk_size: 60,
            type: 'dummy'
          }
        }
      ];

      console.log(`📦 생성된 더미 청크 수: ${dummyChunks.length}개`);

      // 청크를 데이터베이스에 저장
      console.log(`💾 청크를 데이터베이스에 저장 중...`);
      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert(
          dummyChunks.map(chunk => ({
            document_id: documentId,
            content: chunk.content,
            chunk_index: chunk.chunk_index,
            metadata: chunk.metadata,
            embedding: null // 임베딩은 나중에 생성
          }))
        );

      if (insertError) {
        console.error('❌ 청크 저장 실패:', insertError);
        return NextResponse.json(
          { error: `청크 저장 실패: ${insertError.message}` },
          { status: 500 }
        );
      }

      console.log(`✅ ${dummyChunks.length}개 청크 저장 완료`);

      // 문서 상태를 'completed'로 업데이트
      console.log(`🔄 문서 상태를 'completed'로 업데이트 중...`);
      const { error: finalStatusError } = await supabase
        .from('documents')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (finalStatusError) {
        console.error('❌ 최종 상태 업데이트 실패:', finalStatusError);
        return NextResponse.json(
          { error: `최종 상태 업데이트 실패: ${finalStatusError.message}` },
          { status: 500 }
        );
      }

      console.log(`✅ 문서 상태 업데이트 완료`);

    } else if (document.type === 'file') {
      console.log(`📁 파일 재인덱싱 시작: ${document.title}`);
      
      // 파일의 경우 원본 파일이 필요하므로 에러 처리
      return NextResponse.json(
        { error: '파일 재인덱싱은 지원되지 않습니다. 파일을 다시 업로드해주세요.' },
        { status: 400 }
      );
      
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 문서 타입입니다.' },
        { status: 400 }
      );
    }

    console.log(`✅ 재인덱싱 완료: ${document.title}`);

    return NextResponse.json({
      success: true,
      message: '재인덱싱이 완료되었습니다.',
      document: {
        id: document.id,
        title: document.title,
        url: document.url,
        type: document.type
      }
    });

  } catch (error) {
    console.error('재인덱싱 오류:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '재인덱싱에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
