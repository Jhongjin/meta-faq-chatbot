import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { documentIndexingService } from './DocumentIndexingService';

// Stealth 플러그인 추가 (봇 탐지 우회)
puppeteer.use(StealthPlugin());

export interface CrawledDocument {
  title: string;
  content: string;
  url: string;
  type: 'policy' | 'help' | 'guide' | 'general';
  lastUpdated: string;
  contentLength: number;
  discoveredUrls?: Array<{
    url: string;
    title?: string;
    source: 'sitemap' | 'robots' | 'links' | 'pattern';
    depth: number;
  }>;
}

export class PuppeteerCrawlingService {
  private browser: Browser | null = null;

  constructor() {
    // documentIndexingService는 싱글톤 인스턴스를 사용
  }

  async initialize(): Promise<void> {
    if (this.browser) return;

    try {
      console.log('Puppeteer 브라우저 초기화 중...');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--disable-features=VizDisplayCompositor'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
      });

      console.log('Puppeteer 브라우저 초기화 완료');
    } catch (error) {
      console.error('Puppeteer 브라우저 초기화 실패:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('Puppeteer 브라우저 종료');
    }
  }

  getMetaUrls(): string[] {
    return [
      // Meta/Facebook/Instagram 공식 문서만 포함
      'https://www.facebook.com/policies/ads/',
      'https://developers.facebook.com/docs/marketing-api/',
      'https://business.instagram.com/help/',
      'https://www.facebook.com/business/help/',
      'https://www.facebook.com/business/help/164749007013531',
      
      // 추가 Meta 공식 문서들
      'https://www.facebook.com/policies/ads/prohibited_content/',
      'https://www.facebook.com/policies/ads/restricted_content/',
      'https://developers.facebook.com/docs/marketing-api/overview/',
      'https://business.instagram.com/help/instagram-business/',
      
      // Facebook Help 추가
      'https://www.facebook.com/help/',
    ];
  }

  async crawlMetaPage(url: string, discoverSubPages: boolean = false): Promise<CrawledDocument | null> {
    // URL 필터링 적용
    if (!this.isAllowedUrl(url)) {
      console.log(`🚫 크롤링 차단: ${url}`);
      return null;
    }

    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    
    try {
      console.log(`🔍 Meta 페이지 크롤링 시작: ${url}`);

      // 실제 브라우저처럼 보이게 설정
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // 뷰포트 설정
      await page.setViewport({ width: 1920, height: 1080 });

      // 페이지 로드 시도
      console.log(`📡 페이지 로드 시도: ${url}`);
      const response = await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      if (!response) {
        console.error(`❌ 페이지 응답 없음: ${url}`);
        return null;
      }

      console.log(`📄 페이지 응답 상태: ${response.status()} - ${response.statusText()}`);

      if (!response.ok()) {
        console.error(`❌ 페이지 로드 실패: ${url} - HTTP ${response.status()}`);
        return null;
      }

      // 랜덤 대기 (봇 탐지 우회)
      const waitTime = Math.random() * 3000 + 2000;
      console.log(`⏳ 봇 탐지 우회 대기: ${Math.round(waitTime)}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // 제목 추출
      console.log(`📝 제목 추출 중...`);
      const title = await page.evaluate(() => {
        const titleSelectors = [
          'h1',
          'title',
          '[data-testid="page-title"]',
          '.page-title',
          '.article-title'
        ];
        
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent?.trim()) {
            return element.textContent.trim();
          }
        }
        return null;
      });

      console.log(`📝 추출된 제목: ${title || '없음'}`);

      // 콘텐츠 추출
      console.log(`📄 콘텐츠 추출 중...`);
      const content = await page.evaluate(() => {
        // 불필요한 요소 제거
        const elementsToRemove = document.querySelectorAll('script, style, nav, footer, header, aside');
        elementsToRemove.forEach(el => el.remove());

        // 콘텐츠 영역 찾기
        const contentSelectors = [
          'main',
          'article',
          '.content',
          '.main-content',
          '[role="main"]',
          '.page-content'
        ];
        
        let contentElement = null;
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            contentElement = element;
            break;
          }
        }
        
        if (!contentElement) {
          contentElement = document.body;
        }
        
        if (contentElement) {
          // 위키백과 관련 링크 제거
          const wikiLinks = contentElement.querySelectorAll('a[href*="wikipedia"], a[href*="wiki"]');
          wikiLinks.forEach(link => link.remove());
          
          const text = contentElement.innerText || contentElement.textContent || '';
          return text.replace(/\s+/g, ' ').trim();
        }
        
        return '';
      });

      console.log(`📄 추출된 콘텐츠 길이: ${content.length}자`);

      if (!content || content.length < 100) {
        console.warn(`⚠️ 콘텐츠 부족: ${url} - ${content.length}자`);
        return null;
      }

      // 하위 페이지 발견 (옵션이 활성화된 경우)
      let discoveredUrls: Array<{
        url: string;
        title?: string;
        source: 'sitemap' | 'robots' | 'links' | 'pattern';
        depth: number;
      }> = [];
      if (discoverSubPages) {
        try {
          console.log(`🔍 하위 페이지 발견 시작: ${url}`);
          const { sitemapDiscoveryService } = await import('./SitemapDiscoveryService');
          const discovered = await sitemapDiscoveryService.discoverSubPages(url, {
            maxDepth: 2,
            maxUrls: 20,
            respectRobotsTxt: true,
            includeExternal: false,
            allowedDomains: [this.extractDomain(url)]
          });
          discoveredUrls = discovered.map(d => ({
            url: d.url,
            title: d.title,
            source: d.source,
            depth: d.depth
          }));
          console.log(`✅ 발견된 하위 페이지: ${discoveredUrls.length}개`);
        } catch (error) {
          console.error('❌ 하위 페이지 발견 실패:', error);
        }
      }

      const document: CrawledDocument = {
        title: title || url,
        content,
        url,
        type: this.determineDocumentType(url),
        lastUpdated: new Date().toISOString(),
        contentLength: content.length,
        discoveredUrls: discoveredUrls.length > 0 ? discoveredUrls : undefined
      };

      console.log(`✅ Meta 페이지 크롤링 성공: ${url} - ${content.length}자`);
      
      // 크롤링 성공 시 즉시 인덱싱 시도
      try {
        console.log(`📚 인덱싱 시작: ${document.title}`);
        console.log(`🔧 DocumentIndexingService 인스턴스 확인:`, !!documentIndexingService);
        
        // 메타데이터 생성
        const metadata = {
          source: document.url,
          title: document.title,
          type: document.type,
          lastUpdated: document.lastUpdated,
          contentLength: document.contentLength,
          crawledAt: new Date().toISOString()
        };
        
        console.log(`🔄 인덱싱 시작: ${document.title}`);
        console.log(`📝 URL: ${document.url}`);
        console.log(`📄 콘텐츠 길이: ${document.content.length}자`);
        console.log(`📋 메타데이터:`, metadata);
        
        console.log(`🚀 indexCrawledContent 호출 시작...`);
        await documentIndexingService.indexCrawledContent(
          document.url, 
          document.content, 
          document.title, 
          metadata
        );
        console.log(`✅ 인덱싱 완료: ${document.title}`);
      } catch (indexError) {
        console.error(`❌ 인덱싱 실패: ${document.title}`, indexError);
        console.error(`❌ 에러 상세:`, indexError);
      }
      
      return document;

    } catch (error) {
      console.error(`❌ Meta 페이지 크롤링 실패: ${url}`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  private determineDocumentType(url: string): 'policy' | 'help' | 'guide' | 'general' {
    if (url.includes('/policies/')) return 'policy';
    if (url.includes('/help/')) return 'help';
    if (url.includes('/docs/')) return 'guide';
    return 'general';
  }

  /**
   * 도메인 추출 유틸리티
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return '';
    }
  }

  /**
   * 위키백과 및 비공식 사이트 URL 필터링
   */
  private isAllowedUrl(url: string): boolean {
    // 위키백과 URL 차단
    if (url.includes('wikipedia.org') || url.includes('wiki')) {
      console.log(`🚫 위키백과 URL 차단: ${url}`);
      return false;
    }
    
    // Meta/Facebook/Instagram 공식 도메인만 허용
    const allowedDomains = [
      'facebook.com',
      'meta.com',
      'instagram.com',
      'business.instagram.com',
      'developers.facebook.com'
    ];
    
    const isAllowed = allowedDomains.some(domain => url.includes(domain));
    if (!isAllowed) {
      console.log(`🚫 허용되지 않은 도메인: ${url}`);
      return false;
    }
    
    return true;
  }

  async crawlAllMetaDocuments(): Promise<CrawledDocument[]> {
    const urls = this.getMetaUrls();
    const documents: CrawledDocument[] = [];

    console.log(`Meta 문서 크롤링 시작: ${urls.length}개 URL`);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      // URL 필터링 적용
      if (!this.isAllowedUrl(url)) {
        console.log(`⏭️ 건너뛰기 (${i + 1}/${urls.length}): ${url}`);
        continue;
      }
      
      try {
        const document = await this.crawlMetaPage(url);
        if (document) {
          documents.push(document);
          console.log(`✅ 성공 (${i + 1}/${urls.length}): ${document.title}`);
          
          // 크롤링 성공 시 즉시 인덱싱 시도
          try {
            console.log(`📚 인덱싱 시작: ${document.title}`);
            console.log(`🔧 DocumentIndexingService 인스턴스 확인:`, !!documentIndexingService);
            
            // 메타데이터 생성
            const metadata = {
              source: document.url,
              title: document.title,
              type: document.type,
              lastUpdated: document.lastUpdated,
              contentLength: document.contentLength,
              crawledAt: new Date().toISOString()
            };
            
            console.log(`🔄 인덱싱 시작: ${document.title}`);
            console.log(`📝 URL: ${document.url}`);
            console.log(`📄 콘텐츠 길이: ${document.content.length}자`);
            console.log(`📋 메타데이터:`, metadata);
            
            console.log(`🚀 indexCrawledContent 호출 시작...`);
            await documentIndexingService.indexCrawledContent(
              document.url, 
              document.content, 
              document.title, 
              metadata
            );
            console.log(`✅ 인덱싱 완료: ${document.title}`);
          } catch (indexError) {
            console.error(`❌ 인덱싱 실패: ${document.title}`, indexError);
            console.error(`❌ 에러 상세:`, indexError);
          }
        } else {
          console.log(`❌ 실패 (${i + 1}/${urls.length}): ${url}`);
        }

        // 요청 간격 조절 (Rate Limiting 방지)
        if (i < urls.length - 1) {
          const waitTime = Math.random() * 5000 + 3000; // 3-8초 대기
          console.log(`다음 요청까지 ${Math.round(waitTime / 1000)}초 대기...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

      } catch (error) {
        console.error(`URL 처리 중 오류 (${i + 1}/${urls.length}): ${url}`, error);
        continue;
      }
    }

    console.log(`Meta 문서 크롤링 완료: ${documents.length}/${urls.length}개 성공`);
    return documents;
  }
}

export const puppeteerCrawlingService = new PuppeteerCrawlingService();
