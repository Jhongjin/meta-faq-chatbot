/**
 * 새로운 문서 업로드 API
 * 간단하고 안정적인 RAG 파이프라인 기반
 */

import { NextRequest, NextResponse } from 'next/server';
import { newDocumentProcessor } from '@/lib/services/NewDocumentProcessor';

// Vercel 설정
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 파일 업로드 및 처리
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 새로운 문서 업로드 API 시작');

    const contentType = request.headers.get('content-type');
    console.log('📋 Content-Type:', contentType);

    if (contentType?.includes('application/json')) {
      return await handleJsonRequest(request);
    } else if (contentType?.includes('multipart/form-data')) {
      return await handleFormDataRequest(request);
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: '지원하지 않는 Content-Type입니다.',
          receivedType: contentType 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ 업로드 API 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '서버 내부 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * JSON 요청 처리 (Base64 파일 또는 URL)
 */
async function handleJsonRequest(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📄 JSON 요청 본문:', { 
      fileName: body.fileName, 
      fileSize: body.fileSize, 
      fileType: body.fileType,
      hasFileContent: !!body.fileContent,
      hasUrl: !!body.url,
      type: body.type
    });

    if (body.fileContent && body.fileName) {
      // Base64 파일 처리
      console.log('📁 Base64 파일 처리 시작');
      return await handleBase64File(body);
    } else if (body.url) {
      // URL 처리
      console.log('🌐 URL 처리 시작');
      return await handleUrlProcessing(body.url);
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: '파일 내용 또는 URL이 제공되지 않았습니다.' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ JSON 요청 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'JSON 요청 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * FormData 요청 처리
 */
async function handleFormDataRequest(request: NextRequest) {
  try {
    console.log('📁 FormData 요청 처리 시작');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { 
          success: false,
          error: '파일이 제공되지 않았습니다.' 
        },
        { status: 400 }
      );
    }

    console.log('📄 FormData 파일 정보:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // 파일 유효성 검사
    const validTypes = ['.pdf', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      return NextResponse.json(
        { 
          success: false,
          error: '지원하지 않는 파일 형식입니다. PDF, DOCX, TXT만 지원됩니다.' 
        },
        { status: 400 }
      );
    }

    // 파일 크기 검사 (10MB 제한)
    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { 
          success: false,
          error: `파일 크기가 ${Math.round(maxFileSize / 1024 / 1024)}MB를 초과합니다.` 
        },
        { status: 400 }
      );
    }

    // 파일 처리
    const processedDocument = await newDocumentProcessor.processFile(file);
    const documentId = await newDocumentProcessor.saveDocument(processedDocument);

    console.log(`✅ 파일 처리 완료: ${file.name} -> ${documentId}`);

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 업로드되고 처리되었습니다.',
      data: {
        documentId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        chunksProcessed: processedDocument.chunks.length,
        status: 'completed',
        processingTime: Date.now()
      }
    });

  } catch (error) {
    console.error('❌ FormData 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '파일 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Base64 파일 처리
 */
async function handleBase64File(body: any) {
  try {
    const { fileName, fileSize, fileType, fileContent } = body;

    if (!fileContent) {
      return NextResponse.json(
        { 
          success: false,
          error: '파일 내용이 제공되지 않았습니다.' 
        },
        { status: 400 }
      );
    }

    // Base64 디코딩
    const decodedContent = atob(fileContent);
    const buffer = Buffer.from(decodedContent, 'binary');
    const file = new File([buffer], fileName, { type: fileType });

    console.log('📄 Base64 파일 디코딩 완료:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // 파일 처리
    const processedDocument = await newDocumentProcessor.processFile(file);
    const documentId = await newDocumentProcessor.saveDocument(processedDocument);

    console.log(`✅ Base64 파일 처리 완료: ${fileName} -> ${documentId}`);

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 업로드되고 처리되었습니다.',
      data: {
        documentId,
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        chunksProcessed: processedDocument.chunks.length,
        status: 'completed',
        processingTime: Date.now()
      }
    });

  } catch (error) {
    console.error('❌ Base64 파일 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Base64 파일 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * URL 처리
 */
async function handleUrlProcessing(url: string) {
  try {
    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { 
          success: false,
          error: '유효하지 않은 URL 형식입니다.' 
        },
        { status: 400 }
      );
    }

    // URL 처리
    const processedDocument = await newDocumentProcessor.processUrl(url);
    const documentId = await newDocumentProcessor.saveDocument(processedDocument);

    console.log(`✅ URL 처리 완료: ${url} -> ${documentId}`);

    return NextResponse.json({
      success: true,
      message: 'URL이 성공적으로 처리되었습니다.',
      data: {
        documentId,
        url: url,
        chunksProcessed: processedDocument.chunks.length,
        status: 'completed',
        processingTime: Date.now()
      }
    });

  } catch (error) {
    console.error('❌ URL 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'URL 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
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

    console.log('📋 문서 목록 조회:', { limit, offset, status, type });

    // Supabase 클라이언트 생성
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 문서 목록 조회
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

    const { data: documents, error: documentsError } = await query;

    if (documentsError) {
      throw new Error(`문서 목록 조회 실패: ${documentsError.message}`);
    }

    // 통계 조회
    const { data: stats, error: statsError } = await supabase
      .from('documents')
      .select('status, type')
      .then(({ data }) => {
        if (!data) return { data: null, error: null };
        
        const totalDocuments = data.length;
        const completedDocuments = data.filter(d => d.status === 'completed').length;
        const totalChunks = data.reduce((sum, d) => sum + (d.chunk_count || 0), 0);
        
        return {
          data: {
            totalDocuments,
            completedDocuments,
            totalChunks,
            pendingDocuments: data.filter(d => d.status === 'pending').length,
            failedDocuments: data.filter(d => d.status === 'failed').length,
          },
          error: null
        };
      });

    if (statsError) {
      console.warn('통계 조회 실패:', statsError);
    }

    console.log(`✅ 문서 목록 조회 완료: ${documents?.length || 0}개`);

    return NextResponse.json({
      success: true,
      data: {
        documents: documents || [],
        stats: stats?.data || {
          totalDocuments: 0,
          completedDocuments: 0,
          totalChunks: 0,
          pendingDocuments: 0,
          failedDocuments: 0,
        },
        pagination: {
          limit,
          offset,
          total: stats?.data?.totalDocuments || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ 문서 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '문서 목록 조회 중 오류가 발생했습니다.',
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

    console.log(`✅ 문서 삭제 완료: ${targetDocumentId}`);

    return NextResponse.json({
      success: true,
      message: '문서와 관련된 모든 데이터가 성공적으로 삭제되었습니다.',
      data: {
        documentId: targetDocumentId
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
