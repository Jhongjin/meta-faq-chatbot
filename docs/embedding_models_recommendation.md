# 문서 임베딩 및 크롤링 모델 추천 가이드

## 🏆 최종 추천 조합

### 🥇 프리미엄 조합 (최고 품질)
```
크롤링: Playwright + Tesseract OCR
청킹: LangChain Text Splitter
임베딩: OpenAI text-embedding-3-large
저장: Supabase Postgres + pgvector

예상 비용: 월 $50-200 (문서량에 따라)
장점: 최고 품질, 안정성, 한국어 특화
단점: 비용 발생
```

### 🥈 균형 조합 (품질 vs 비용)
```
크롤링: Playwright + Tesseract OCR
청킹: LangChain Text Splitter
임베딩: BGE-M3
저장: Supabase Postgres + pgvector

예상 비용: 월 $10-50 (인프라 비용만)
장점: 무료 모델, 양호한 품질
단점: 설정 복잡도
```

### 🥉 경제적 조합 (최소 비용)
```
크롤링: Puppeteer + pdf-parse
청킹: LangChain Text Splitter
임베딩: sentence-transformers/all-MiniLM-L6-v2
저장: Supabase Postgres + pgvector

예상 비용: 월 $5-20 (인프라 비용만)
장점: 완전 무료, 간단한 설정
단점: 품질 제한적
```

## 📋 구현 우선순위

1. **1단계:** Playwright + Tesseract OCR로 크롤링 구현
2. **2단계:** LangChain Text Splitter로 청킹 구현
3. **3단계:** BGE-M3로 임베딩 구현 (무료 시작)
4. **4단계:** Supabase pgvector로 저장 구현
5. **5단계:** 필요시 OpenAI로 업그레이드

## 🔧 필요한 설정 및 API 키

### Supabase (필수)
- **가입:** https://supabase.com
- **필요 정보:**
  - Project URL
  - API Key (anon/public)
  - Service Role Key (secret)
- **설정:** pgvector 확장 활성화

### OpenAI (5단계 업그레이드용)
- **가입:** https://platform.openai.com
- **필요 정보:**
  - API Key
- **비용:** text-embedding-3-large 기준 $0.00013/1K tokens

### Cohere (대안)
- **가입:** https://cohere.com
- **필요 정보:**
  - API Key
- **비용:** embed-multilingual-v3 기준 $0.001/1K tokens

## 📦 설치할 패키지들

### 1단계: 크롤링
```bash
npm install playwright tesseract.js
npx playwright install
```

### 2단계: 청킹
```bash
npm install langchain @langchain/text-splitter
```

### 3단계: 임베딩
```bash
npm install @xenova/transformers
# 또는
npm install openai
```

### 4단계: 데이터베이스
```bash
npm install @supabase/supabase-js
```

### 5단계: 기타 유틸리티
```bash
npm install pdf-parse mammoth
```

## 🚀 시작하기

1. Supabase 프로젝트 생성 및 pgvector 확장 활성화
2. 환경변수 설정 (.env.local)
3. 1단계부터 순차적으로 구현
4. 각 단계별 테스트 진행
5. 필요시 5단계로 업그레이드

## 📝 환경변수 예시

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (5단계용)
OPENAI_API_KEY=your_openai_api_key

# Cohere (대안)
COHERE_API_KEY=your_cohere_api_key
```

