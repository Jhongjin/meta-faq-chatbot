import { NextRequest, NextResponse } from 'next/server';
import { metaCrawlingService } from '@/lib/services/MetaCrawlingService';
import { documentIndexingService } from '@/lib/services/DocumentIndexingService';

export async function POST(request: NextRequest) {
  try {
    const { action, url } = await request.json();

    if (action === 'crawl-all') {
      // 모든 Meta 문서 크롤링
      console.log('Meta 문서 일괄 크롤링 시작');
      
      const documents = await metaCrawlingService.crawlAllMetaDocuments();
      
      // 성공적으로 크롤링된 문서들을 인덱싱
      const indexingResults = [];
      for (const doc of documents) {
        try {
          const result = await documentIndexingService.indexURL(doc.url);
          indexingResults.push({
            url: doc.url,
            title: doc.title,
            success: true,
            result
          });
        } catch (error) {
          indexingResults.push({
            url: doc.url,
            title: doc.title,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Meta 문서 크롤링 완료: ${documents.length}개 문서 처리`,
        documents: documents,
        indexingResults: indexingResults
      });

    } else if (action === 'crawl-single' && url) {
      // 단일 URL 크롤링
      console.log(`단일 Meta 문서 크롤링: ${url}`);
      
      const document = await metaCrawlingService.crawlMetaDocument(url);
      
      if (!document) {
        return NextResponse.json(
          { error: '문서 크롤링에 실패했습니다.' },
          { status: 400 }
        );
      }

      // 인덱싱
      const result = await documentIndexingService.indexURL(url);

      return NextResponse.json({
        success: true,
        message: 'Meta 문서 크롤링 및 인덱싱 완료',
        document: document,
        indexingResult: result
      });

    } else {
      return NextResponse.json(
        { error: '잘못된 요청입니다. action과 url을 확인해주세요.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Meta 크롤링 API 오류:', error);
    return NextResponse.json(
      { 
        error: 'Meta 문서 크롤링 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Meta 문서 URL 목록 반환
    const urls = [
      'https://www.facebook.com/business/help/164749007013531',
      'https://www.facebook.com/policies/ads/',
      'https://business.instagram.com/help/',
      'https://developers.facebook.com/docs/marketing-api/',
      'https://ko.wikipedia.org/wiki/Facebook_Advertising',
      'https://ko.wikipedia.org/wiki/Instagram',
      'https://ko.wikipedia.org/wiki/Meta_Platforms'
    ];

    return NextResponse.json({
      success: true,
      message: 'Meta 문서 URL 목록',
      urls: urls
    });

  } catch (error) {
    console.error('Meta URL 목록 조회 오류:', error);
    return NextResponse.json(
      { error: 'URL 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

