/**
 * 새로운 문서 업로드 API
 * 간단하고 안정적인 RAG 파이프라인 기반
 */

import { NextRequest, NextResponse } from 'next/server';
import { newDocumentProcessor } from '@/lib/services/NewDocumentProcessor';
import { ragProcessor, DocumentData } from '@/lib/services/RAGProcessor';
import { createPureClient } from '@/lib/supabase/server';

// Vercel 설정 - 서버 안정성 개선
export const runtime = 'nodejs';
export const maxDuration = 120; // 타임아웃 증가
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 하드코딩된 메모리 저장소 (개발 환경용)
interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  content: string;
  chunk_count: number;
  file_size: number;
  file_type: string;
  created_at: string;
  updated_at: string;
}

// 메모리에 문서 저장
let documents: Document[] = [];

/**
 * 파일 확장자에 따른 타입 결정
 */
function getFileTypeFromExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'PDF';
    case 'docx':
      return 'DOCX';
    case 'doc':
      return 'DOC';
    case 'txt':
      return 'TXT';
    case 'md':
      return 'Markdown';
    default:
      return 'FILE';
  }
}

/**
 * 파일 업로드 및 처리
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 새로운 문서 업로드 API 시작 (메모리 저장)');

    const contentType = request.headers.get('content-type');
    console.log('📋 Content-Type:', contentType);

    // FormData 처리
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { success: false, error: '파일이 제공되지 않았습니다.' },
          { status: 400 }
        );
      }

      // 파일 내용 읽기
      const fileContent = await file.text();
      
      // 문서 생성
      const documentId = `doc_${Date.now()}`;
      const documentData: DocumentData = {
        id: documentId,
        title: file.name,
        content: fileContent,
        type: 'file',
        file_size: file.size,
        file_type: file.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // RAG 처리 (청킹 + 임베딩 + 저장)
      console.log('🔄 RAG 처리 시작...');
      const ragResult = await ragProcessor.processDocument(documentData);

      // 실제 데이터베이스에 저장 (Supabase 모드 강제)
      console.log('💾 실제 데이터베이스에 문서 저장 중...');
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 문서 저장
        const { error: docError } = await supabase
          .from('documents')
          .insert({
            id: documentId,
            title: file.name,
            type: 'file',
            status: ragResult.success ? 'completed' : 'failed',
            content: fileContent.substring(0, 1000),
            chunk_count: ragResult.chunkCount,
            file_size: file.size,
            file_type: file.type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (docError) {
          console.error('❌ 문서 저장 실패:', docError);
        } else {
          console.log('✅ 문서 데이터베이스 저장 완료');
        }
      } catch (error) {
        console.warn('⚠️ 데이터베이스 저장 실패, 메모리 모드로 fallback:', error);
        
        // 메모리 저장소에도 저장 (fallback)
        const newDocument: Document = {
          id: documentId,
          title: file.name,
          type: getFileTypeFromExtension(file.name),
          status: ragResult.success ? 'completed' : 'failed',
          content: fileContent.substring(0, 1000),
          chunk_count: ragResult.chunkCount,
          file_size: file.size,
          file_type: file.type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        documents.push(newDocument);
      }
      
      console.log('✅ 파일 업로드 및 RAG 처리 완료:', {
        documentId,
        fileName: file.name,
        fileSize: file.size,
        chunkCount: ragResult.chunkCount,
        success: ragResult.success,
        totalDocuments: documents.length
      });

      return NextResponse.json({
        success: true,
        data: {
          documentId: documentId,
          message: ragResult.success 
            ? `파일이 성공적으로 업로드되고 ${ragResult.chunkCount}개 청크로 처리되었습니다.`
            : '파일 업로드는 성공했지만 RAG 처리 중 오류가 발생했습니다.',
          status: ragResult.success ? 'completed' : 'failed',
          chunkCount: ragResult.chunkCount
        }
      });
    }

    // JSON 요청 처리 (Base64 파일)
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      const { fileName, fileSize, fileType, fileContent } = body;

      if (!fileContent || !fileName) {
        return NextResponse.json(
          { success: false, error: '파일 내용과 파일명이 필요합니다.' },
          { status: 400 }
        );
      }

      // Base64 디코딩
      const decodedContent = atob(fileContent);
      
      // 문서 생성
      const documentId = `doc_${Date.now()}`;
      const documentData: DocumentData = {
        id: documentId,
        title: fileName,
        content: decodedContent,
        type: 'file',
        file_size: fileSize,
        file_type: fileType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // RAG 처리 (청킹 + 임베딩 + 저장)
      console.log('🔄 RAG 처리 시작 (Base64)...');
      const ragResult = await ragProcessor.processDocument(documentData);

      // 실제 데이터베이스에 저장 (Supabase 모드 강제)
      console.log('💾 실제 데이터베이스에 문서 저장 중 (Base64)...');
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 문서 저장
        const { error: docError } = await supabase
          .from('documents')
          .insert({
            id: documentId,
            title: fileName,
            type: 'file',
            status: ragResult.success ? 'completed' : 'failed',
            content: decodedContent.substring(0, 1000),
            chunk_count: ragResult.chunkCount,
            file_size: fileSize,
            file_type: fileType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (docError) {
          console.error('❌ 문서 저장 실패:', docError);
        } else {
          console.log('✅ 문서 데이터베이스 저장 완료 (Base64)');
        }
      } catch (error) {
        console.warn('⚠️ 데이터베이스 저장 실패, 메모리 모드로 fallback:', error);
        
        // 메모리 저장소에도 저장 (fallback)
        const newDocument: Document = {
          id: documentId,
          title: fileName,
          type: getFileTypeFromExtension(fileName),
          status: ragResult.success ? 'completed' : 'failed',
          content: decodedContent.substring(0, 1000),
          chunk_count: ragResult.chunkCount,
          file_size: fileSize,
          file_type: fileType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        documents.push(newDocument);
      }
      
      console.log('✅ Base64 파일 업로드 및 RAG 처리 완료:', {
        documentId,
        fileName,
        fileSize,
        chunkCount: ragResult.chunkCount,
        success: ragResult.success,
        totalDocuments: documents.length
      });

      return NextResponse.json({
        success: true,
        data: {
          documentId: documentId,
          message: ragResult.success 
            ? `파일이 성공적으로 업로드되고 ${ragResult.chunkCount}개 청크로 처리되었습니다.`
            : '파일 업로드는 성공했지만 RAG 처리 중 오류가 발생했습니다.',
          status: ragResult.success ? 'completed' : 'failed',
          chunkCount: ragResult.chunkCount
        }
      });
    }

    return NextResponse.json(
      { success: false, error: '지원하지 않는 Content-Type입니다.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ 업로드 API 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 문서 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Supabase 환경 변수 체크 (프로덕션에서는 항상 Supabase 모드 사용)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction && (!supabaseUrl || !supabaseKey || supabaseUrl.includes('dummy'))) {
      console.log('📋 문서 목록 조회 (메모리 모드):', { limit, offset, status, type });

      // 메모리에서 문서 필터링
      let filteredDocuments = [...documents];

      if (status) {
        filteredDocuments = filteredDocuments.filter(doc => doc.status === status);
      }

      if (type) {
        filteredDocuments = filteredDocuments.filter(doc => doc.type === type);
      }

      // 정렬 (최신순)
      filteredDocuments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // 페이지네이션
      const paginatedDocuments = filteredDocuments.slice(offset, offset + limit);

      // 통계 계산
      const stats = {
        totalDocuments: documents.length,
        completedDocuments: documents.filter(doc => doc.status === 'completed').length,
        totalChunks: documents.reduce((sum, doc) => sum + doc.chunk_count, 0),
        pendingDocuments: documents.filter(doc => doc.status === 'pending').length,
        failedDocuments: documents.filter(doc => doc.status === 'failed').length,
      };

      console.log('📊 문서 목록 조회 완료 (메모리):', {
        documentsCount: paginatedDocuments.length,
        totalDocuments: documents.length,
        stats: stats
      });

      return NextResponse.json({
        success: true,
        data: {
          documents: paginatedDocuments,
          stats: stats,
          pagination: {
            limit,
            offset,
            total: filteredDocuments.length
          }
        }
      });
    }

    // Supabase에서 데이터 조회
    console.log('📋 문서 목록 조회 (Supabase):', { limit, offset, status, type });

    const supabase = await createPureClient();

    // documents 테이블에서 데이터 조회
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: documentsData, error: documentsError } = await query;

    if (documentsError) {
      console.error('❌ 문서 조회 오류:', documentsError);
      throw new Error(`문서 조회 실패: ${documentsError.message}`);
    }

    // 통계 조회
    const { data: statsData, error: statsError } = await supabase
      .from('documents')
      .select('status, chunk_count');

    if (statsError) {
      console.error('❌ 통계 조회 오류:', statsError);
    }

    // 통계 계산
    const stats = {
      totalDocuments: statsData?.length || 0,
      completedDocuments: statsData?.filter(doc => doc.status === 'completed').length || 0,
      totalChunks: statsData?.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0) || 0,
      pendingDocuments: statsData?.filter(doc => doc.status === 'pending').length || 0,
      failedDocuments: statsData?.filter(doc => doc.status === 'failed').length || 0,
    };

    console.log('📊 문서 목록 조회 완료 (Supabase):', {
      documentsCount: documentsData?.length || 0,
      totalDocuments: stats.totalDocuments,
      stats: stats
    });

    return NextResponse.json({
      success: true,
      data: {
        documents: documentsData || [],
        stats: stats,
        pagination: {
          limit,
          offset,
          total: stats.totalDocuments
        }
      }
    });

  } catch (error) {
    console.error('❌ 문서 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '문서 목록 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : JSON.stringify(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 파일 덮어쓰기 처리
 */
export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      return await handleFileOverwrite(request);
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: '지원하지 않는 Content-Type입니다.' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ 파일 덮어쓰기 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '파일 덮어쓰기 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 파일 덮어쓰기 처리 함수
 */
async function handleFileOverwrite(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const existingDocumentId = formData.get('documentId') as string;

    if (!file || !fileName || !existingDocumentId) {
      return NextResponse.json(
        { 
          success: false,
          error: '파일, 파일명, 문서 ID가 모두 필요합니다.' 
        },
        { status: 400 }
      );
    }

    // 파일 내용 읽기
    const fileContent = await file.text();
    
    // 문서 업데이트
    const documentId = existingDocumentId;
    const documentData: DocumentData = {
      id: documentId,
      title: fileName,
      content: fileContent,
      type: 'file',
      file_size: file.size,
      file_type: file.type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // RAG 처리 (청킹 + 임베딩 + 저장)
    console.log('🔄 파일 덮어쓰기 RAG 처리 시작...');
    const ragResult = await ragProcessor.processDocument(documentData);

    // 메모리 저장소 업데이트
    const documentIndex = documents.findIndex(doc => doc.id === documentId);
    if (documentIndex !== -1) {
      documents[documentIndex] = {
        id: documentId,
        title: fileName,
        type: getFileTypeFromExtension(fileName),
        status: ragResult.success ? 'completed' : 'failed',
        content: fileContent.substring(0, 1000),
        chunk_count: ragResult.chunkCount,
        file_size: file.size,
        file_type: file.type,
        created_at: documents[documentIndex].created_at,
        updated_at: new Date().toISOString()
      };
    }
    
    console.log(`✅ 파일 덮어쓰기 완료: ${fileName} -> ${documentId}`);

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 덮어쓰기되었습니다.',
      data: {
        documentId: documentId,
        message: ragResult.success 
          ? `파일이 성공적으로 덮어쓰기되고 ${ragResult.chunkCount}개 청크로 처리되었습니다.`
          : '파일 덮어쓰기는 성공했지만 RAG 처리 중 오류가 발생했습니다.',
        status: ragResult.success ? 'completed' : 'failed',
        chunkCount: ragResult.chunkCount
      }
    });

  } catch (error) {
    console.error('❌ 파일 덮어쓰기 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '파일 덮어쓰기 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 문서 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const url = searchParams.get('url');

    if (!documentId && !url) {
      return NextResponse.json(
        { 
          success: false,
          error: '문서 ID 또는 URL이 제공되지 않았습니다.' 
        },
        { status: 400 }
      );
    }

    console.log('🗑️ 문서 삭제 요청:', { documentId, url });

    // Supabase 클라이언트 생성
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let targetDocumentId = documentId;

    // URL이 제공된 경우, URL로 문서 ID를 찾기
    if (url && !documentId) {
      const { data: documents, error: findError } = await supabase
        .from('documents')
        .select('id, title, url')
        .eq('url', url)
        .limit(1);

      if (findError) {
        throw new Error(`문서 검색 실패: ${findError.message}`);
      }

      if (!documents || documents.length === 0) {
        return NextResponse.json(
          { 
            success: false,
            error: '해당 URL과 일치하는 문서를 찾을 수 없습니다.' 
          },
          { status: 404 }
        );
      }

      targetDocumentId = documents[0].id;
    }

    // 문서와 관련된 모든 청크 삭제
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', targetDocumentId);

    if (chunksError) {
      console.warn('청크 삭제 실패:', chunksError);
    }

    // 문서 삭제
    const { error: documentError } = await supabase
      .from('documents')
      .delete()
      .eq('id', targetDocumentId);

    if (documentError) {
      throw new Error(`문서 삭제 실패: ${documentError.message}`);
    }

    // 메모리에서도 삭제
    documents = documents.filter(doc => doc.id !== targetDocumentId);

    console.log(`✅ 문서 삭제 완료: ${targetDocumentId}`);

    return NextResponse.json({
      success: true,
      message: '문서와 관련된 모든 데이터가 성공적으로 삭제되었습니다.',
      data: {
        deletedChunks: 0, // 실제로는 삭제된 청크 수를 반환해야 함
        deletedEmbeddings: 0
      }
    });

  } catch (error) {
    console.error('❌ 문서 삭제 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '문서 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}