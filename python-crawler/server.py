#!/usr/bin/env python3
"""
Meta 크롤링 Python 서버
Next.js와 연동하여 Meta 문서 크롤링 제공
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
from meta_crawler import MetaCrawler

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Next.js와의 CORS 허용

@app.route('/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return jsonify({
        'status': 'healthy',
        'message': 'Meta Crawler Server is running'
    })

@app.route('/crawl-meta', methods=['POST'])
def crawl_meta_documents():
    """Meta 문서 크롤링 API"""
    try:
        data = request.get_json() or {}
        action = data.get('action', 'crawl-all')
        
        logger.info(f"Meta 크롤링 요청: {action}")
        
        crawler = MetaCrawler()
        
        try:
            if action == 'crawl-all':
                documents = crawler.crawl_all_meta_documents()
            elif action == 'crawl-single':
                url = data.get('url')
                if not url:
                    return jsonify({'error': 'URL이 필요합니다'}), 400
                
                document = crawler.crawl_meta_page(url)
                documents = [document] if document else []
            else:
                return jsonify({'error': '지원하지 않는 액션입니다'}), 400
            
            # 결과 변환
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
            
            logger.info(f"크롤링 완료: {len(results)}개 문서")
            
            return jsonify({
                'success': True,
                'message': f'{len(results)}개 문서 크롤링 완료',
                'documents': results,
                'total_count': len(results)
            })
            
        finally:
            crawler.close()
            
    except Exception as e:
        logger.error(f"크롤링 서버 오류: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/crawl-status', methods=['GET'])
def get_crawl_status():
    """크롤링 상태 확인"""
    return jsonify({
        'status': 'ready',
        'supported_actions': ['crawl-all', 'crawl-single'],
        'meta_urls_count': 10
    })

if __name__ == '__main__':
    logger.info("Meta Crawler Server 시작...")
    app.run(host='0.0.0.0', port=5000, debug=True)

