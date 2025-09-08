#!/usr/bin/env python3
"""
Meta 공식 사이트 크롤링 전용 Python 서버
BeautifulSoup + Selenium + Stealth 기법 활용
"""

import asyncio
import aiohttp
import json
import time
import random
from typing import List, Dict, Optional
from dataclasses import dataclass
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MetaDocument:
    title: str
    content: str
    url: str
    type: str
    last_updated: str

class MetaCrawler:
    def __init__(self):
        self.driver = None
        self.setup_driver()
        
    def setup_driver(self):
        """Chrome 드라이버 설정 (봇 탐지 우회)"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--allow-running-insecure-content")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # 실제 브라우저처럼 보이게 설정
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
        ]
        
        chrome_options.add_argument(f"--user-agent={random.choice(user_agents)}")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            logger.info("Chrome 드라이버 초기화 완료")
        except Exception as e:
            logger.error(f"Chrome 드라이버 초기화 실패: {e}")
            raise
    
    def get_meta_urls(self) -> List[str]:
        """Meta 공식 문서 URL 목록"""
        return [
            # Facebook Business Help Center
            "https://www.facebook.com/business/help/164749007013531",
            "https://www.facebook.com/business/help/164749007013531?id=176276239642189",
            
            # Facebook Ads Policy
            "https://www.facebook.com/policies/ads/",
            "https://www.facebook.com/policies/ads/restricted_content/",
            "https://www.facebook.com/policies/ads/prohibited_content/",
            
            # Instagram Business Help
            "https://business.instagram.com/help/",
            "https://business.instagram.com/help/instagram-business/",
            
            # Facebook Developers
            "https://developers.facebook.com/docs/marketing-api/",
            "https://developers.facebook.com/docs/marketing-api/overview/",
        ]
    
    def crawl_meta_page(self, url: str) -> Optional[MetaDocument]:
        """Meta 페이지 크롤링"""
        try:
            logger.info(f"크롤링 시작: {url}")
            
            # 페이지 로드
            self.driver.get(url)
            
            # 랜덤 대기 (봇 탐지 우회)
            wait_time = random.uniform(3, 7)
            time.sleep(wait_time)
            
            # 페이지 로딩 대기
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # JavaScript 실행 대기
            time.sleep(random.uniform(2, 4))
            
            # 페이지 소스 가져오기
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # 콘텐츠 추출
            title = self.extract_title(soup)
            content = self.extract_content(soup)
            
            if not content or len(content.strip()) < 100:
                logger.warning(f"콘텐츠 부족: {url}")
                return None
            
            document = MetaDocument(
                title=title or url,
                content=content,
                url=url,
                type=self.determine_document_type(url),
                last_updated=time.strftime("%Y-%m-%d %H:%M:%S")
            )
            
            logger.info(f"크롤링 성공: {url} - {len(content)}자")
            return document
            
        except Exception as e:
            logger.error(f"크롤링 실패: {url} - {e}")
            return None
    
    def extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """제목 추출"""
        # 다양한 제목 태그 시도
        title_selectors = [
            'h1',
            'title',
            '[data-testid="page-title"]',
            '.page-title',
            '.article-title'
        ]
        
        for selector in title_selectors:
            element = soup.select_one(selector)
            if element and element.get_text().strip():
                return element.get_text().strip()
        
        return None
    
    def extract_content(self, soup: BeautifulSoup) -> str:
        """콘텐츠 추출"""
        # 불필요한 요소 제거
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            element.decompose()
        
        # 콘텐츠 영역 찾기
        content_selectors = [
            'main',
            'article',
            '.content',
            '.main-content',
            '[role="main"]',
            '.page-content'
        ]
        
        content_element = None
        for selector in content_selectors:
            element = soup.select_one(selector)
            if element:
                content_element = element
                break
        
        if not content_element:
            content_element = soup.find('body')
        
        if content_element:
            text = content_element.get_text(separator=' ', strip=True)
            # 공백 정리
            text = ' '.join(text.split())
            return text
        
        return ""
    
    def determine_document_type(self, url: str) -> str:
        """URL 기반 문서 타입 결정"""
        if '/policies/' in url:
            return 'policy'
        elif '/help/' in url:
            return 'help'
        elif '/docs/' in url:
            return 'guide'
        else:
            return 'general'
    
    def crawl_all_meta_documents(self) -> List[MetaDocument]:
        """모든 Meta 문서 크롤링"""
        urls = self.get_meta_urls()
        documents = []
        
        logger.info(f"Meta 문서 크롤링 시작: {len(urls)}개 URL")
        
        for i, url in enumerate(urls, 1):
            try:
                document = self.crawl_meta_page(url)
                if document:
                    documents.append(document)
                    logger.info(f"✅ 성공 ({i}/{len(urls)}): {document.title}")
                else:
                    logger.warning(f"❌ 실패 ({i}/{len(urls)}): {url}")
                
                # 요청 간격 조절 (Rate Limiting 방지)
                if i < len(urls):
                    wait_time = random.uniform(5, 10)
                    logger.info(f"다음 요청까지 {wait_time:.1f}초 대기...")
                    time.sleep(wait_time)
                    
            except Exception as e:
                logger.error(f"URL 처리 중 오류 ({i}/{len(urls)}): {url} - {e}")
                continue
        
        logger.info(f"Meta 문서 크롤링 완료: {len(documents)}/{len(urls)}개 성공")
        return documents
    
    def close(self):
        """드라이버 종료"""
        if self.driver:
            self.driver.quit()
            logger.info("Chrome 드라이버 종료")

def main():
    """메인 실행 함수"""
    crawler = MetaCrawler()
    
    try:
        documents = crawler.crawl_all_meta_documents()
        
        # 결과 저장
        results = []
        for doc in documents:
            results.append({
                'title': doc.title,
                'content': doc.content,
                'url': doc.url,
                'type': doc.type,
                'last_updated': doc.last_updated,
                'content_length': len(doc.content)
            })
        
        # JSON 파일로 저장
        with open('meta_documents.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        logger.info(f"크롤링 결과 저장 완료: {len(results)}개 문서")
        
        # 요약 출력
        print("\n" + "="*50)
        print("Meta 문서 크롤링 결과 요약")
        print("="*50)
        for i, doc in enumerate(results, 1):
            print(f"{i}. {doc['title']}")
            print(f"   URL: {doc['url']}")
            print(f"   타입: {doc['type']}")
            print(f"   길이: {doc['content_length']:,}자")
            print()
        
    finally:
        crawler.close()

if __name__ == "__main__":
    main()

