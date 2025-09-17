import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 모든 문서 삭제 요청 시작...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase 환경변수 누락');
      return NextResponse.json(
        { 
          success: false,
          error: 'Supabase 환경변수가 설정되지 않았습니다.',
          deletedCounts: {
            documents: 0,
            chunks: 0,
            metadata: 0,
            logs: 0
          }
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 삭제 전 현재 상태 확인
    console.log('📊 삭제 전 상태 확인...');
    
    const { data: documentsBefore, error: docsError } = await supabase
      .from('documents')
      .select('id, title, type, status');

    if (docsError) {
      console.error('❌ 문서 조회 실패:', docsError);
      return NextResponse.json(
        { 
          success: false,
          error: `문서 조회 실패: ${docsError.message}`,
          deletedCounts: {
            documents: 0,
            chunks: 0,
            metadata: 0,
            logs: 0
          }
        },
        { status: 500 }
      );
    }

    const documentCount = documentsBefore?.length || 0;
    console.log(`📄 삭제할 문서 수: ${documentCount}개`);

    if (documentCount === 0) {
      console.log('ℹ️ 삭제할 문서가 없습니다.');
      return NextResponse.json({
        success: true,
        message: '삭제할 문서가 없습니다.',
        deletedCounts: {
          documents: 0,
          chunks: 0,
          metadata: 0,
          logs: 0
        }
      });
    }

    // 문서 목록 로깅
    console.log('📋 삭제할 문서 목록:');
    documentsBefore?.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.title} (${doc.type}, ${doc.status})`);
    });

    // 1. document_processing_logs 삭제 (documents 테이블과의 외래키 제약으로 인해 먼저 삭제)
    console.log('🗑️ 처리 로그 삭제 중...');
    const { count: logsCount, error: logsError } = await supabase
      .from('document_processing_logs')
      .delete()
      .neq('id', 'dummy'); // 모든 레코드 삭제

    if (logsError) {
      console.warn('⚠️ 처리 로그 삭제 중 오류 (무시됨):', logsError);
    } else {
      console.log(`✅ 처리 로그 삭제 완료: ${logsCount || 0}개`);
    }

    // 2. document_chunks 삭제 (documents 테이블과의 외래키 제약으로 인해 먼저 삭제)
    console.log('🗑️ 문서 청크 삭제 중...');
    const { count: chunksCount, error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .neq('id', 0); // 모든 레코드 삭제

    if (chunksError) {
      console.error('❌ 청크 삭제 실패:', chunksError);
      return NextResponse.json(
        { 
          success: false,
          error: `청크 삭제 실패: ${chunksError.message}`,
          deletedCounts: {
            documents: 0,
            chunks: 0,
            metadata: 0,
            logs: logsCount || 0
          }
        },
        { status: 500 }
      );
    }

    console.log(`✅ 문서 청크 삭제 완료: ${chunksCount || 0}개`);

    // 3. document_metadata 삭제 (documents 테이블과의 외래키 제약으로 인해 먼저 삭제)
    console.log('🗑️ 문서 메타데이터 삭제 중...');
    const { count: metadataCount, error: metadataError } = await supabase
      .from('document_metadata')
      .delete()
      .neq('id', 'dummy'); // 모든 레코드 삭제

    if (metadataError) {
      console.error('❌ 메타데이터 삭제 실패:', metadataError);
      return NextResponse.json(
        { 
          success: false,
          error: `메타데이터 삭제 실패: ${metadataError.message}`,
          deletedCounts: {
            documents: 0,
            chunks: chunksCount || 0,
            metadata: 0,
            logs: logsCount || 0
          }
        },
        { status: 500 }
      );
    }

    console.log(`✅ 문서 메타데이터 삭제 완료: ${metadataCount || 0}개`);

    // 4. documents 테이블 삭제 (마지막에 삭제)
    console.log('🗑️ 문서 삭제 중...');
    const { count: documentsCount, error: documentsError } = await supabase
      .from('documents')
      .delete()
      .neq('id', 'dummy'); // 모든 레코드 삭제

    if (documentsError) {
      console.error('❌ 문서 삭제 실패:', documentsError);
      return NextResponse.json(
        { 
          success: false,
          error: `문서 삭제 실패: ${documentsError.message}`,
          deletedCounts: {
            documents: 0,
            chunks: chunksCount || 0,
            metadata: metadataCount || 0,
            logs: logsCount || 0
          }
        },
        { status: 500 }
      );
    }

    console.log(`✅ 문서 삭제 완료: ${documentsCount || 0}개`);

    // 삭제 후 검증
    console.log('🔍 삭제 후 검증 중...');
    
    const { data: documentsAfter, error: docsAfterError } = await supabase
      .from('documents')
      .select('id')
      .limit(1);

    const { data: chunksAfter, error: chunksAfterError } = await supabase
      .from('document_chunks')
      .select('id')
      .limit(1);

    const { data: metadataAfter, error: metadataAfterError } = await supabase
      .from('document_metadata')
      .select('id')
      .limit(1);

    const { data: logsAfter, error: logsAfterError } = await supabase
      .from('document_processing_logs')
      .select('id')
      .limit(1);

    const remainingDocuments = documentsAfter?.length || 0;
    const remainingChunks = chunksAfter?.length || 0;
    const remainingMetadata = metadataAfter?.length || 0;
    const remainingLogs = logsAfter?.length || 0;

    console.log(`📊 삭제 후 남은 레코드 수:`);
    console.log(`  - 문서: ${remainingDocuments}개`);
    console.log(`  - 청크: ${remainingChunks}개`);
    console.log(`  - 메타데이터: ${remainingMetadata}개`);
    console.log(`  - 로그: ${remainingLogs}개`);

    const totalDeleted = {
      documents: documentsCount || 0,
      chunks: chunksCount || 0,
      metadata: metadataCount || 0,
      logs: logsCount || 0
    };

    const isComplete = remainingDocuments === 0 && remainingChunks === 0 && 
                      remainingMetadata === 0 && remainingLogs === 0;

    if (isComplete) {
      console.log('✅ 모든 문서가 성공적으로 삭제되었습니다.');
    } else {
      console.warn('⚠️ 일부 데이터가 남아있을 수 있습니다.');
    }

    return NextResponse.json({
      success: true,
      message: isComplete ? 
        '모든 문서가 성공적으로 삭제되었습니다.' : 
        '문서 삭제가 완료되었지만 일부 데이터가 남아있을 수 있습니다.',
      deletedCounts: totalDeleted,
      remainingCounts: {
        documents: remainingDocuments,
        chunks: remainingChunks,
        metadata: remainingMetadata,
        logs: remainingLogs
      },
      isComplete
    });

  } catch (error) {
    console.error('❌ 문서 삭제 중 예상치 못한 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `문서 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        deletedCounts: {
          documents: 0,
          chunks: 0,
          metadata: 0,
          logs: 0
        }
      },
      { status: 500 }
    );
  }
}

// GET 요청으로 삭제 전 상태 확인
export async function GET(request: NextRequest) {
  try {
    console.log('📊 문서 삭제 전 상태 확인...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Supabase 환경변수가 설정되지 않았습니다.',
          counts: {
            documents: 0,
            chunks: 0,
            metadata: 0,
            logs: 0
          }
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 각 테이블의 레코드 수 확인
    const { count: documentsCount, error: docsError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    const { count: chunksCount, error: chunksError } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true });

    const { count: metadataCount, error: metadataError } = await supabase
      .from('document_metadata')
      .select('*', { count: 'exact', head: true });

    const { count: logsCount, error: logsError } = await supabase
      .from('document_processing_logs')
      .select('*', { count: 'exact', head: true });

    const counts = {
      documents: documentsCount || 0,
      chunks: chunksCount || 0,
      metadata: metadataCount || 0,
      logs: logsCount || 0
    };

    console.log('📊 현재 문서 관련 데이터 수:', counts);

    return NextResponse.json({
      success: true,
      message: '문서 삭제 전 상태 확인 완료',
      counts,
      canDelete: counts.documents > 0 || counts.chunks > 0 || counts.metadata > 0 || counts.logs > 0
    });

  } catch (error) {
    console.error('❌ 상태 확인 중 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `상태 확인 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        counts: {
          documents: 0,
          chunks: 0,
          metadata: 0,
          logs: 0
        }
      },
      { status: 500 }
    );
  }
}
