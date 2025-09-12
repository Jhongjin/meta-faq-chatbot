'use client';

export interface GroupedDocument {
  id: string;
  title: string;
  url: string;
  type: string;
  status: string;
  chunk_count: number;
  created_at: string;
  updated_at: string;
  isMainUrl: boolean;
  parentUrl?: string;
  discoveredUrls?: Array<{
    url: string;
    title?: string;
    source: 'sitemap' | 'robots' | 'links' | 'pattern';
    depth: number;
  }>;
}

export interface DocumentGroup {
  domain: string;
  mainUrl: string;
  mainDocument: GroupedDocument;
  subPages: GroupedDocument[];
  totalChunks: number;
  isExpanded: boolean;
  selectedSubPages: string[];
}

export class DocumentGroupingService {
  /**
   * URL에서 도메인 추출
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return '기타';
    }
  }

  /**
   * URL이 메인 URL인지 확인 (가장 짧은 경로를 가진 URL)
   */
  private isMainUrl(url: string, allUrls: string[]): boolean {
    const domain = this.extractDomain(url);
    const sameDomainUrls = allUrls.filter(u => this.extractDomain(u) === domain);
    
    if (sameDomainUrls.length === 1) return true;
    
    // 가장 짧은 경로를 가진 URL이 메인 URL
    const sortedUrls = sameDomainUrls.sort((a, b) => {
      try {
        const pathA = new URL(a).pathname;
        const pathB = new URL(b).pathname;
        return pathA.length - pathB.length;
      } catch {
        return a.length - b.length;
      }
    });
    
    return sortedUrls[0] === url;
  }

  /**
   * URL이 다른 URL의 하위 페이지인지 확인
   */
  private isSubPage(url: string, mainUrl: string): boolean {
    if (url === mainUrl) return false;
    
    try {
      const urlObj = new URL(url);
      const mainUrlObj = new URL(mainUrl);
      
      // 같은 도메인이어야 함
      if (urlObj.hostname !== mainUrlObj.hostname) return false;
      
      // 메인 URL의 경로가 하위 URL의 경로에 포함되어야 함
      return urlObj.pathname.startsWith(mainUrlObj.pathname);
    } catch {
      return false;
    }
  }

  /**
   * 문서들을 도메인별로 그룹화
   */
  groupDocumentsByDomain(documents: GroupedDocument[]): DocumentGroup[] {
    const urlDocuments = documents.filter(doc => doc.type === 'url');
    const groups: { [domain: string]: DocumentGroup } = {};

    // 1. 메인 URL 식별 및 그룹 생성
    urlDocuments.forEach(doc => {
      const domain = this.extractDomain(doc.url);
      const allUrls = urlDocuments.map(d => d.url);
      
      if (this.isMainUrl(doc.url, allUrls)) {
        if (!groups[domain]) {
          groups[domain] = {
            domain,
            mainUrl: doc.url,
            mainDocument: doc,
            subPages: [],
            totalChunks: 0,
            isExpanded: false,
            selectedSubPages: []
          };
        }
      }
    });

    // 2. 하위 페이지들을 해당 그룹에 할당
    urlDocuments.forEach(doc => {
      const domain = this.extractDomain(doc.url);
      const group = groups[domain];
      
      if (group && doc.url !== group.mainUrl) {
        // 하위 페이지인지 확인
        if (this.isSubPage(doc.url, group.mainUrl)) {
          group.subPages.push(doc);
        } else {
          // 하위 페이지가 아닌 경우 별도 그룹으로 처리
          const subDomain = `${domain}_${doc.url}`;
          if (!groups[subDomain]) {
            groups[subDomain] = {
              domain: subDomain,
              mainUrl: doc.url,
              mainDocument: doc,
              subPages: [],
              totalChunks: 0,
              isExpanded: false,
              selectedSubPages: []
            };
          }
        }
      }
    });

    // 3. 총 청크 수 계산
    Object.values(groups).forEach(group => {
      group.totalChunks = group.mainDocument.chunk_count + 
        group.subPages.reduce((sum, sub) => sum + sub.chunk_count, 0);
    });

    return Object.values(groups).sort((a, b) => a.domain.localeCompare(b.domain));
  }

  /**
   * 그룹의 하위 페이지 선택 상태 토글
   */
  toggleSubPageSelection(
    groups: DocumentGroup[], 
    groupIndex: number, 
    subPageUrl: string
  ): DocumentGroup[] {
    return groups.map((group, index) => {
      if (index === groupIndex) {
        const isSelected = group.selectedSubPages.includes(subPageUrl);
        return {
          ...group,
          selectedSubPages: isSelected
            ? group.selectedSubPages.filter(url => url !== subPageUrl)
            : [...group.selectedSubPages, subPageUrl]
        };
      }
      return group;
    });
  }

  /**
   * 그룹의 모든 하위 페이지 선택/해제
   */
  toggleAllSubPages(
    groups: DocumentGroup[], 
    groupIndex: number
  ): DocumentGroup[] {
    return groups.map((group, index) => {
      if (index === groupIndex) {
        const allSelected = group.subPages.every(sub => 
          group.selectedSubPages.includes(sub.url)
        );
        
        return {
          ...group,
          selectedSubPages: allSelected 
            ? [] 
            : group.subPages.map(sub => sub.url)
        };
      }
      return group;
    });
  }

  /**
   * 그룹 확장/축소 토글
   */
  toggleGroupExpansion(
    groups: DocumentGroup[], 
    groupIndex: number
  ): DocumentGroup[] {
    return groups.map((group, index) => {
      if (index === groupIndex) {
        return {
          ...group,
          isExpanded: !group.isExpanded
        };
      }
      return group;
    });
  }

  /**
   * 선택된 하위 페이지들만 필터링
   */
  getSelectedSubPages(groups: DocumentGroup[]): GroupedDocument[] {
    const selected: GroupedDocument[] = [];
    
    groups.forEach(group => {
      selected.push(group.mainDocument);
      group.subPages.forEach(subPage => {
        if (group.selectedSubPages.includes(subPage.url)) {
          selected.push(subPage);
        }
      });
    });
    
    return selected;
  }
}

// 싱글톤 인스턴스
export const documentGroupingService = new DocumentGroupingService();


