import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { parseStringPromise } from 'xml2js';

// Stealth 플러그인 추가
puppeteer.use(StealthPlugin());

export interface DiscoveredUrl {
  url: string;
  title?: string;
  lastModified?: string;
  priority?: number;
  source: 'sitemap' | 'robots' | 'links' | 'pattern';
  depth: number;
}

export interface DiscoveryOptions {
  maxDepth: number;
  maxUrls: number;
  respectRobotsTxt: boolean;
  includeExternal: boolean;
  allowedDomains?: string[];
}

export class SitemapDiscoveryService {
  private browser: puppeteer.Browser | null = null;
  private defaultOptions: DiscoveryOptions = {
    maxDepth: 3,
    maxUrls: 100,
    respectRobotsTxt: true,
    includeExternal: false,
  };

  async initialize(): Promise<void> {
    if (this.browser) return;

    try {
      console.log('🔧 SitemapDiscoveryService 브라우저 초기화 중...');
      
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

      console.log('✅ SitemapDiscoveryService 브라우저 초기화 완료');
    } catch (error) {
      console.error('❌ SitemapDiscoveryService 브라우저 초기화 실패:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 SitemapDiscoveryService 브라우저 종료');
    }
  }

  /**
   * 메인 URL에서 하위 페이지들을 발견
   */
  async discoverSubPages(
    baseUrl: string, 
    options: Partial<DiscoveryOptions> = {}
  ): Promise<DiscoveredUrl[]> {
    const config = { ...this.defaultOptions, ...options };
    
    if (!this.browser) {
      await this.initialize();
    }

    console.log(`🔍 하위 페이지 발견 시작: ${baseUrl}`);
    console.log(`📋 설정:`, config);

    const discoveredUrls = new Set<string>();
    const discoveredPages: DiscoveredUrl[] = [];
    const baseDomain = this.extractDomain(baseUrl);

    try {
      // 1. Sitemap.xml에서 URL 발견
      const sitemapUrls = await this.discoverFromSitemap(baseUrl, config);
      sitemapUrls.forEach(url => {
        if (!discoveredUrls.has(url.url)) {
          discoveredUrls.add(url.url);
          discoveredPages.push(url);
        }
      });

      console.log(`📄 Sitemap에서 발견: ${sitemapUrls.length}개`);

      // 2. Robots.txt에서 URL 패턴 발견
      const robotsUrls = await this.discoverFromRobots(baseUrl, config);
      robotsUrls.forEach(url => {
        if (!discoveredUrls.has(url.url)) {
          discoveredUrls.add(url.url);
          discoveredPages.push(url);
        }
      });

      console.log(`🤖 Robots.txt에서 발견: ${robotsUrls.length}개`);

      // 3. 페이지 링크에서 URL 발견
      const linkUrls = await this.discoverFromPageLinks(baseUrl, baseDomain, config);
      linkUrls.forEach(url => {
        if (!discoveredUrls.has(url.url)) {
          discoveredUrls.add(url.url);
          discoveredPages.push(url);
        }
      });

      console.log(`🔗 페이지 링크에서 발견: ${linkUrls.length}개`);

      // 4. URL 패턴 기반 발견
      const patternUrls = await this.discoverFromPatterns(baseUrl, baseDomain, config);
      patternUrls.forEach(url => {
        if (!discoveredUrls.has(url.url)) {
          discoveredUrls.add(url.url);
          discoveredPages.push(url);
        }
      });

      console.log(`🎯 패턴 기반 발견: ${patternUrls.length}개`);

      // 5. 결과 필터링 및 정렬
      const filteredUrls = this.filterAndSortUrls(discoveredPages, baseDomain, config);
      
      console.log(`✅ 최종 발견된 하위 페이지: ${filteredUrls.length}개`);
      return filteredUrls.slice(0, config.maxUrls);

    } catch (error) {
      console.error('❌ 하위 페이지 발견 실패:', error);
      return [];
    }
  }

  /**
   * Sitemap.xml에서 URL 발견
   */
  private async discoverFromSitemap(baseUrl: string, config: DiscoveryOptions): Promise<DiscoveredUrl[]> {
    const discoveredUrls: DiscoveredUrl[] = [];
    const baseDomain = this.extractDomain(baseUrl);

    try {
      // Sitemap.xml URL 시도
      const sitemapUrls = [
        `${baseUrl}/sitemap.xml`,
        `${baseUrl}/sitemap_index.xml`,
        `${baseUrl}/sitemaps/sitemap.xml`,
        `${baseUrl}/sitemaps/sitemap_index.xml`
      ];

      for (const sitemapUrl of sitemapUrls) {
        try {
          console.log(`📄 Sitemap 시도: ${sitemapUrl}`);
          const response = await fetch(sitemapUrl, { 
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MetaFAQ-Bot/1.0)' }
          });

          if (response.ok) {
            const xmlContent = await response.text();
            const urls = await this.parseSitemapXml(xmlContent, baseDomain);
            discoveredUrls.push(...urls);
            console.log(`✅ Sitemap 파싱 성공: ${urls.length}개 URL`);
            break; // 첫 번째 성공한 sitemap만 사용
          }
        } catch (error) {
          console.log(`⚠️ Sitemap 실패: ${sitemapUrl}`, error);
        }
      }
    } catch (error) {
      console.error('❌ Sitemap 발견 실패:', error);
    }

    return discoveredUrls;
  }

  /**
   * Sitemap XML 파싱
   */
  private async parseSitemapXml(xmlContent: string, baseDomain: string): Promise<DiscoveredUrl[]> {
    try {
      const result = await parseStringPromise(xmlContent);
      const discoveredUrls: DiscoveredUrl[] = [];

      // Sitemap index 처리
      if (result.sitemapindex) {
        const sitemaps = result.sitemapindex.sitemap || [];
        for (const sitemap of sitemaps) {
          if (sitemap.loc && sitemap.loc[0]) {
            try {
              const subSitemapUrl = sitemap.loc[0];
              const response = await fetch(subSitemapUrl);
              if (response.ok) {
                const subXmlContent = await response.text();
                const subUrls = await this.parseSitemapXml(subXmlContent, baseDomain);
                discoveredUrls.push(...subUrls);
              }
            } catch (error) {
              console.log(`⚠️ 하위 Sitemap 실패: ${sitemap.loc[0]}`);
            }
          }
        }
      }

      // 일반 Sitemap 처리
      if (result.urlset) {
        const urls = result.urlset.url || [];
        for (const url of urls) {
          if (url.loc && url.loc[0]) {
            const urlStr = url.loc[0];
            if (this.isValidSubPage(urlStr, baseDomain)) {
              discoveredUrls.push({
                url: urlStr,
                title: url['image:title']?.[0] || url['title']?.[0],
                lastModified: url.lastmod?.[0],
                priority: parseFloat(url.priority?.[0] || '0.5'),
                source: 'sitemap',
                depth: 1
              });
            }
          }
        }
      }

      return discoveredUrls;
    } catch (error) {
      console.error('❌ Sitemap XML 파싱 실패:', error);
      return [];
    }
  }

  /**
   * Robots.txt에서 URL 패턴 발견
   */
  private async discoverFromRobots(baseUrl: string, config: DiscoveryOptions): Promise<DiscoveredUrl[]> {
    const discoveredUrls: DiscoveredUrl[] = [];
    
    if (!config.respectRobotsTxt) {
      return discoveredUrls;
    }

    try {
      const robotsUrl = `${baseUrl}/robots.txt`;
      console.log(`🤖 Robots.txt 확인: ${robotsUrl}`);
      
      const response = await fetch(robotsUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MetaFAQ-Bot/1.0)' }
      });

      if (response.ok) {
        const robotsContent = await response.text();
        const urls = this.parseRobotsTxt(robotsContent, baseUrl);
        discoveredUrls.push(...urls);
        console.log(`✅ Robots.txt 파싱 성공: ${urls.length}개 URL`);
      }
    } catch (error) {
      console.log(`⚠️ Robots.txt 확인 실패:`, error);
    }

    return discoveredUrls;
  }

  /**
   * Robots.txt 파싱
   */
  private parseRobotsTxt(content: string, baseUrl: string): DiscoveredUrl[] {
    const discoveredUrls: DiscoveredUrl[] = [];
    const lines = content.split('\n');
    const baseDomain = this.extractDomain(baseUrl);

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Sitemap 지시어 찾기
      if (trimmedLine.toLowerCase().startsWith('sitemap:')) {
        const sitemapUrl = trimmedLine.substring(8).trim();
        if (sitemapUrl) {
          discoveredUrls.push({
            url: sitemapUrl,
            source: 'robots',
            depth: 1
          });
        }
      }
      
      // Allow 지시어에서 URL 패턴 찾기
      if (trimmedLine.toLowerCase().startsWith('allow:')) {
        const pattern = trimmedLine.substring(6).trim();
        if (pattern && !pattern.includes('*')) {
          const fullUrl = pattern.startsWith('http') ? pattern : `${baseUrl}${pattern}`;
          if (this.isValidSubPage(fullUrl, baseDomain)) {
            discoveredUrls.push({
              url: fullUrl,
              source: 'robots',
              depth: 1
            });
          }
        }
      }
    }

    return discoveredUrls;
  }

  /**
   * 페이지 링크에서 URL 발견
   */
  private async discoverFromPageLinks(
    baseUrl: string, 
    baseDomain: string, 
    config: DiscoveryOptions
  ): Promise<DiscoveredUrl[]> {
    const discoveredUrls: DiscoveredUrl[] = [];

    if (!this.browser) {
      return discoveredUrls;
    }

    try {
      const page = await this.browser!.newPage();
      
      // 실제 브라우저처럼 보이게 설정
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      console.log(`🔗 페이지 링크 분석: ${baseUrl}`);
      
      const response = await page.goto(baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      if (response && response.ok()) {
        // 페이지에서 링크 추출
        const links = await page.evaluate((baseDomain) => {
          const linkElements = document.querySelectorAll('a[href]');
          const discoveredLinks: Array<{url: string, title: string}> = [];
          
          for (const link of linkElements) {
            const href = link.getAttribute('href');
            if (href) {
              let fullUrl: string;
              
              if (href.startsWith('http')) {
                fullUrl = href;
              } else if (href.startsWith('/')) {
                fullUrl = `${window.location.origin}${href}`;
              } else {
                fullUrl = `${window.location.origin}/${href}`;
              }
              
              // 같은 도메인인지 확인
              try {
                const urlObj = new URL(fullUrl);
                if (urlObj.hostname === baseDomain || urlObj.hostname.endsWith(`.${baseDomain}`)) {
                  const title = link.textContent?.trim() || link.getAttribute('title') || '';
                  discoveredLinks.push({ url: fullUrl, title });
                }
              } catch (e) {
                // 잘못된 URL 무시
              }
            }
          }
          
          return discoveredLinks;
        }, baseDomain);

        // 발견된 링크를 DiscoveredUrl 형태로 변환
        for (const link of links) {
          if (this.isValidSubPage(link.url, baseDomain)) {
            discoveredUrls.push({
              url: link.url,
              title: link.title,
              source: 'links',
              depth: 1
            });
          }
        }

        console.log(`✅ 페이지 링크 분석 완료: ${discoveredUrls.length}개 URL`);
      }

      await page.close();
    } catch (error) {
      console.error('❌ 페이지 링크 분석 실패:', error);
    }

    return discoveredUrls;
  }

  /**
   * URL 패턴 기반 발견
   */
  private async discoverFromPatterns(
    baseUrl: string, 
    baseDomain: string, 
    config: DiscoveryOptions
  ): Promise<DiscoveredUrl[]> {
    const discoveredUrls: DiscoveredUrl[] = [];

    try {
      // 일반적인 URL 패턴들
      const commonPatterns = [
        '/help',
        '/support',
        '/docs',
        '/documentation',
        '/guide',
        '/tutorial',
        '/faq',
        '/policy',
        '/terms',
        '/privacy',
        '/about',
        '/contact',
        '/api',
        '/developers',
        '/business',
        '/ads',
        '/marketing'
      ];

      for (const pattern of commonPatterns) {
        const testUrl = `${baseUrl}${pattern}`;
        
        // URL이 존재하는지 간단히 확인
        try {
          const response = await fetch(testUrl, { 
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MetaFAQ-Bot/1.0)' }
          });
          
          if (response.ok && this.isValidSubPage(testUrl, baseDomain)) {
            discoveredUrls.push({
              url: testUrl,
              source: 'pattern',
              depth: 1
            });
          }
        } catch (error) {
          // URL이 존재하지 않으면 무시
        }
      }

      console.log(`🎯 패턴 기반 발견: ${discoveredUrls.length}개 URL`);
    } catch (error) {
      console.error('❌ 패턴 기반 발견 실패:', error);
    }

    return discoveredUrls;
  }

  /**
   * URL 유효성 검사
   */
  private isValidSubPage(url: string, baseDomain: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // 같은 도메인인지 확인
      if (urlObj.hostname !== baseDomain && !urlObj.hostname.endsWith(`.${baseDomain}`)) {
        return false;
      }
      
      // 파일 확장자 필터링 (HTML 페이지만)
      const pathname = urlObj.pathname.toLowerCase();
      const excludedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.css', '.js', '.xml', '.txt'];
      
      for (const ext of excludedExtensions) {
        if (pathname.endsWith(ext)) {
          return false;
        }
      }
      
      // 특정 경로 제외
      const excludedPaths = ['/login', '/register', '/logout', '/admin', '/api/', '/static/', '/assets/'];
      for (const path of excludedPaths) {
        if (pathname.startsWith(path)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 도메인 추출
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
   * URL 필터링 및 정렬
   */
  private filterAndSortUrls(
    urls: DiscoveredUrl[], 
    baseDomain: string, 
    config: DiscoveryOptions
  ): DiscoveredUrl[] {
    // 중복 제거
    const uniqueUrls = new Map<string, DiscoveredUrl>();
    
    for (const url of urls) {
      if (!uniqueUrls.has(url.url)) {
        uniqueUrls.set(url.url, url);
      }
    }
    
    const filteredUrls = Array.from(uniqueUrls.values())
      .filter(url => this.isValidSubPage(url.url, baseDomain))
      .sort((a, b) => {
        // 우선순위: sitemap > robots > links > pattern
        const priorityOrder = { sitemap: 0, robots: 1, links: 2, pattern: 3 };
        const aPriority = priorityOrder[a.source] || 4;
        const bPriority = priorityOrder[b.source] || 4;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // 같은 우선순위면 priority 값으로 정렬
        return (b.priority || 0.5) - (a.priority || 0.5);
      });
    
    return filteredUrls;
  }
}

export const sitemapDiscoveryService = new SitemapDiscoveryService();
