# 메타광고FAQ챗봇 (Meta Ads FAQ AI Chatbot)

사내 메타 광고 정책과 가이드라인을 통합해 직원들이 한국어로 신속하고 정확하게 질문하고 답변받을 수 있는 RAG 기반 AI 챗봇입니다.

## 🚀 주요 기능

- **문서 업로드 및 인덱싱**: PDF, DOCX, TXT 파일 및 URL 지원
- **벡터 검색**: pgvector를 활용한 의미 기반 검색
- **AI 챗봇**: RAG 기반의 정확한 답변 제공
- **관리자 대시보드**: 문서 관리 및 사용 통계
- **실시간 진행 상황 추적**: 업로드 및 인덱싱 과정 모니터링

## 🛠 기술 스택

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase
- **AI/ML**: OpenAI Embeddings, LangChain
- **Database**: Supabase PostgreSQL with pgvector
- **File Processing**: pdf-parse, mammoth, cheerio

## 📋 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API 설정
OPENAI_API_KEY=your_openai_api_key

# 문서 처리 설정
MAX_FILE_SIZE=10485760  # 10MB in bytes
SUPPORTED_FILE_TYPES=pdf,docx,txt
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# 벡터 검색 설정
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
SIMILARITY_THRESHOLD=0.7
MAX_SEARCH_RESULTS=10
```

### 3. Supabase 설정

#### 3.1 pgvector 확장 활성화

Supabase 프로젝트에서 다음 SQL을 실행하세요:

```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 3.2 데이터베이스 스키마 생성

`supabase/migrations/20250102000000_create_document_tables.sql` 파일의 내용을 Supabase SQL 편집기에서 실행하세요.

#### 3.3 Storage 버킷 생성

Supabase Dashboard에서 `documents` Storage 버킷을 생성하고 적절한 권한을 설정하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── admin/upload/     # 문서 업로드 API
│   │   └── search/           # 벡터 검색 API
│   ├── admin/                # 관리자 페이지
│   ├── chat/                 # 챗봇 인터페이스
│   └── history/              # 사용자 히스토리
├── components/
│   ├── admin/                # 관리자 컴포넌트
│   ├── chat/                 # 챗봇 컴포넌트
│   └── ui/                   # 공통 UI 컴포넌트
├── lib/
│   ├── services/
│   │   └── FileProcessingService.ts  # 파일 처리 서비스
│   └── supabase/             # Supabase 클라이언트
└── hooks/                    # 커스텀 훅
```

## 🔧 문서 처리 파이프라인

### 1. 파일 업로드
- 파일 형식 검증 (PDF, DOCX, TXT)
- 파일 크기 검증 (기본 10MB)
- Supabase Storage에 파일 저장

### 2. 텍스트 추출
- **PDF**: pdf-parse 라이브러리 사용
- **DOCX**: mammoth 라이브러리 사용
- **TXT**: 직접 텍스트 읽기
- **URL**: cheerio를 사용한 HTML 파싱

### 3. 텍스트 청킹
- 최대 청크 크기: 1000자
- 청크 간 중복: 200자
- 문장 경계에서 자연스럽게 분할

### 4. 임베딩 생성
- OpenAI text-embedding-3-small 모델 사용
- 벡터 차원: 1536
- 배치 처리로 성능 최적화

### 5. 벡터 저장소 인덱싱
- Supabase PostgreSQL + pgvector 사용
- 코사인 유사도 기반 검색
- IVFFlat 인덱스로 검색 성능 향상

## 🔍 벡터 검색 API

### 검색 요청

```bash
POST /api/search
{
  "query": "광고 정책 변경사항",
  "threshold": 0.7,
  "limit": 10
}
```

### 검색 응답

```json
{
  "success": true,
  "query": "광고 정책 변경사항",
  "results": [
    {
      "chunk_id": "file_123_chunk_0",
      "content": "2024년 메타 광고 정책 주요 변경사항...",
      "metadata": {...},
      "similarity": 0.85,
      "document": {
        "id": "file_123",
        "title": "2024년 메타 광고 정책 가이드라인.pdf",
        "type": "file"
      }
    }
  ],
  "total": 1
}
```

## 🚀 배포

### Vercel 배포

1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포 활성화

### 환경 변수 확인

배포 전 다음 환경 변수들이 설정되었는지 확인하세요:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## 📊 성능 최적화

### 벡터 검색 최적화

- IVFFlat 인덱스 사용
- 적절한 `lists` 파라미터 설정
- 정기적인 `ANALYZE` 실행

### 파일 처리 최적화

- 배치 임베딩 생성
- 청크 크기 및 중복 최적화
- 비동기 처리 및 진행 상황 추적

## 🔒 보안 고려사항

- RLS (Row Level Security) 활성화
- 서비스 롤 키 사용으로 관리자 권한 제한
- 파일 업로드 크기 및 형식 제한
- URL 크롤링 시 적절한 User-Agent 설정

## 🐛 문제 해결

### 일반적인 문제들

1. **pgvector 확장 오류**
   - Supabase 프로젝트에서 pgvector 확장이 활성화되었는지 확인

2. **임베딩 생성 실패**
   - OpenAI API 키가 유효한지 확인
   - API 할당량 확인

3. **파일 업로드 실패**
   - Storage 버킷 권한 설정 확인
   - 파일 크기 제한 확인

### 로그 확인

- 브라우저 개발자 도구 콘솔
- Supabase 로그
- Vercel 함수 로그

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해 주세요.
