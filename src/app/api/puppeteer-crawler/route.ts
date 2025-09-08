import { NextRequest, NextResponse } from 'next/server';
import { puppeteerCrawlingService } from '@/lib/services/PuppeteerCrawlingService';
import { documentIndexingService } from '@/lib/services/DocumentIndexingService';

// 도메인 추출 유틸리티 함수
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'crawl-all';
    
    console.log(`🚀 Puppeteer 크롤링 요청: ${action}`);
    
    // Puppeteer 서비스 초기화
    console.log(`🔧 Puppeteer 서비스 초기화 중...`);
    await puppeteerCrawlingService.initialize();
    console.log(`✅ Puppeteer 서비스 초기화 완료`);
    
    try {
      let documents = [];
      
      if (action === 'crawl-all') {
        console.log(`📋 전체 Meta 문서 크롤링 시작...`);
        documents = await puppeteerCrawlingService.crawlAllMetaDocuments();
        console.log(`📋 전체 Meta 문서 크롤링 완료: ${documents.length}개`);
        
        // 크롤링된 문서들을 인덱싱 (PuppeteerCrawlingService에서 이미 처리됨)
        console.log(`📚 인덱싱은 크롤링 과정에서 이미 완료되었습니다.`);
      } else if (action === 'crawl-single') {
        const url = body.url;
        if (!url) {
          return NextResponse.json({ error: 'URL이 필요합니다' }, { status: 400 });
        }
        
        const document = await puppeteerCrawlingService.crawlMetaPage(url);
        documents = document ? [document] : [];
      } else if (action === 'crawl-custom') {
        const urls = body.urls;
        const extractSubPages = body.extractSubPages || false;
        
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
          return NextResponse.json({ error: 'URL 배열이 필요합니다' }, { status: 400 });
        }
        
        console.log(`📋 사용자 정의 URL 크롤링 시작: ${urls.length}개`);
        
        // 하위 페이지 추출이 활성화된 경우
        let allUrlsToCrawl = [...urls];
        if (extractSubPages) {
          console.log(`🔍 하위 페이지 추출 활성화`);
          
          // SitemapDiscoveryService 동적 import
          const { sitemapDiscoveryService } = await import('@/lib/services/SitemapDiscoveryService');
          await sitemapDiscoveryService.initialize();
          
          try {
            // 각 URL에 대해 하위 페이지 발견
            for (const url of urls) {
              console.log(`🔍 하위 페이지 발견 중: ${url}`);
              
              const discoveredUrls = await sitemapDiscoveryService.discoverSubPages(url, {
                maxDepth: 2,
                maxUrls: 50,
                respectRobotsTxt: true,
                includeExternal: false,
                allowedDomains: [extractDomain(url)]
              });
              
              console.log(`✅ 발견된 하위 페이지: ${discoveredUrls.length}개`);
              
              // 발견된 URL들을 크롤링 목록에 추가
              const newUrls = discoveredUrls
                .map(discovered => discovered.url)
                .filter(discoveredUrl => !urls.includes(discoveredUrl));
              
              allUrlsToCrawl.push(...newUrls);
              console.log(`📋 추가된 URL: ${newUrls.length}개`);
            }
            
            console.log(`📋 총 크롤링 대상 URL: ${allUrlsToCrawl.length}개 (원본: ${urls.length}개, 발견: ${allUrlsToCrawl.length - urls.length}개)`);
          } catch (discoveryError) {
            console.error('❌ 하위 페이지 발견 실패:', discoveryError);
            // 발견 실패해도 원본 URL들은 크롤링 진행
          } finally {
            // SitemapDiscoveryService 정리
            await sitemapDiscoveryService.close();
          }
        }
        
        // 각 URL 크롤링 및 인덱싱
        const duplicateUrls = [];
        const processedUrls = [];
        
        for (const url of allUrlsToCrawl) {
          try {
            // 중복 체크를 위해 VectorStorageService import
            const { vectorStorageService } = await import('@/lib/services/VectorStorageService');
            const duplicateCheck = await vectorStorageService.checkUrlExists(url);
            
            if (duplicateCheck.exists) {
              duplicateUrls.push({
                url: url,
                documentId: duplicateCheck.documentId,
                status: duplicateCheck.document?.status,
                title: duplicateCheck.document?.title
              });
              console.log(`⚠️ 중복 URL 건너뜀: ${url}`);
              continue;
            }
            
            const document = await puppeteerCrawlingService.crawlMetaPage(url);
            if (document) {
              documents.push(document);
              processedUrls.push({ url, title: document.title, status: 'success' });
              console.log(`✅ 성공: ${document.title}`);
            } else {
              processedUrls.push({ url, status: 'failed' });
              console.log(`❌ 실패: ${url}`);
            }
          } catch (error) {
            processedUrls.push({ url, status: 'error', error: error instanceof Error ? error.message : String(error) });
            console.error(`URL 크롤링 오류: ${url}`, error);
          }
        }
        
        console.log(`📋 사용자 정의 URL 크롤링 완료: ${documents.length}개`);
      } else {
        return NextResponse.json({ error: '지원하지 않는 액션입니다' }, { status: 400 });
      }
      
      console.log(`Puppeteer 크롤링 완료: ${documents.length}개 문서`);
      
      // 인덱싱은 PuppeteerCrawlingService에서 이미 처리됨
      const indexedDocuments = documents; // 크롤링 성공 = 인덱싱 성공
      const failedDocuments = [];
      const duplicateUrls: string[] = []; // 중복 URL 목록 (현재는 빈 배열)
      const processedUrls = documents.map(doc => doc.url); // 처리된 URL 목록
      
      return NextResponse.json({
        success: true,
        message: `${documents.length}개 문서 크롤링, ${indexedDocuments.length}개 인덱싱 완료`,
        documents: documents,
        indexedDocuments: indexedDocuments,
        failedDocuments: failedDocuments,
        duplicateUrls: duplicateUrls,
        processedUrls: processedUrls,
        totalCount: documents.length,
        successCount: indexedDocuments.length,
        failCount: failedDocuments.length
      });
      
    } finally {
      // Puppeteer 브라우저 종료
      await puppeteerCrawlingService.close();
    }
    
  } catch (error) {
    console.error('Puppeteer 크롤링 서버 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      message: 'Puppeteer 크롤링 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'ready',
      supportedActions: ['crawl-all', 'crawl-single'],
      metaUrlsCount: 10,
      message: 'Puppeteer 크롤러 서버가 준비되었습니다.'
    });
  } catch (error) {
    console.error('Puppeteer 크롤러 상태 확인 오류:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      message: 'Puppeteer 크롤러 서버 상태를 확인할 수 없습니다.'
    }, { status: 500 });
  }
}
