# AdMate - Meta 광고 정책 AI 챗봇

## 📋 프로젝트 개요

AdMate는 Meta(Facebook·Instagram·Threads) 광고 집행 관련 내부 문서와 지정된 URL만을 근거로, 전사 직원이 한국어로 즉시 질문하고 정확한 답변을 받을 수 있는 RAG 기반 AI 챗봇입니다.

## 🎯 주요 기능

- **AI 챗봇 대화**: 자연어로 질문하면 AI가 관련 문서를 찾아 정확한 답변 제공
- **히스토리 & 즐겨찾기**: 이전 질문과 답변을 언제든지 확인하고 자주 사용하는 답변을 즐겨찾기로 저장
- **보안 & 권한 관리**: 사내 보안 정책에 맞춘 접근 제어와 데이터 보호
- **실시간 동기화**: 최신 정책과 가이드라인이 실시간으로 반영되어 항상 최신 정보 제공
- **관리자 대시보드**: 문서 업로드, 통계 확인, 로그 모니터링

## 🚀 기술 스택

### Frontend
- **Next.js 15**: 서버 사이드 렌더링 및 정적 사이트 생성
- **TypeScript**: 정적 타입 검사를 통한 코드 안정성
- **React**: 컴포넌트 기반 개발 및 재사용성
- **shadcn/ui**: Tailwind CSS 기반의 재사용 가능한 UI 컴포넌트
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **Framer Motion**: 부드러운 애니메이션 및 전환 효과

### Backend & Database
- **Supabase Postgres**: 안정적인 오픈 소스 관계형 데이터베이스
- **pgvector**: Postgres 확장, 임베딩 벡터 저장 및 유사도 검색
- **FastAPI**: 고성능 API 개발 (향후 구현 예정)
- **LangChain**: LLM 통합 및 관리, RAG 파이프라인 구축

### Authentication & State Management
- **Supabase Auth**: 사용자 인증 및 권한 관리
- **@tanstack/react-query**: 서버 상태 관리 및 캐싱
- **Zustand**: 경량 글로벌 상태 관리

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # 관리자 페이지
│   │   ├── docs/          # 문서 관리
│   │   ├── logs/          # 로그 확인
│   │   └── stats/         # 통계 대시보드
│   ├── api/               # API 엔드포인트
│   ├── chat/              # 챗봇 페이지
│   ├── history/           # 히스토리 페이지
│   └── test/              # 테스트 페이지
├── components/             # React 컴포넌트
│   ├── admin/             # 관리자 관련 컴포넌트
│   ├── chat/              # 챗봇 관련 컴포넌트
│   ├── layouts/           # 레이아웃 컴포넌트
│   └── ui/                # shadcn/ui 컴포넌트
├── hooks/                  # 커스텀 React 훅
├── lib/                    # 유틸리티 함수 및 설정
└── supabase/               # Supabase 설정 및 마이그레이션
```

## 🛠️ 설치 및 실행

### 필수 요구사항
- Node.js 18+ 
- npm 또는 yarn
- Supabase 계정 및 프로젝트

### 1. 저장소 클론
```bash
git clone [repository-url]
cd meta_faq
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정 (필수)
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

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 브라우저에서 확인
```
http://localhost:3000
```

## 🔐 관리자 권한

다음 이메일을 가진 사용자만 관리자 페이지에 접근할 수 있습니다:

- `secho@nasmedia.co.kr`
- `woolela@nasmedia.co.kr`
- `dsko@nasmedia.co.kr`
- `hjchoi@nasmedia.co.kr`
- `sunjung@nasmedia.co.kr`
- `sy230@nasmedia.co.kr`
- `jeng351@nasmedia.co.kr`

## 📊 주요 지표

- **응답 속도**: 평균 3초 이내
- **동시 사용자**: 최대 50명 지원
- **데이터 보존**: 90일 후 자동 삭제
- **사용자 만족도**: 80% 이상 목표

## 🔧 개발 가이드

### 코드 스타일
- TypeScript 사용
- ESLint 규칙 준수
- 컴포넌트는 `"use client"` 지시어 사용
- Tailwind CSS로 스타일링

### 컴포넌트 추가
새로운 shadcn/ui 컴포넌트가 필요한 경우:
```bash
npx shadcn@latest add [component-name]
```

### 데이터베이스 마이그레이션
새 테이블이 필요한 경우 `/supabase/migrations/` 디렉토리에 SQL 파일 생성

## 🚀 배포

### Vercel 배포 (권장)
1. Vercel 계정 생성
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포

### 수동 배포
```bash
npm run build
npm start
```

## 📝 라이선스

이 프로젝트는 내부 사용을 위한 프로젝트입니다.

## 👥 팀

- **개발**: AI Assistant
- **기획**: Product Team
- **디자인**: Design Team

## �� 지원

프로젝트 관련 문의사항이 있으시면 개발팀에 연락해주세요.

---

**AdMate** - Meta 광고 정책을 대화로 해결하세요! 🚀

## 📦 최신 배포 정보
- **버전**: 최종코드완료_v2
- **배포일**: 2025-09-08
- **상태**: ✅ 배포 완료 - 강제 재배포 진행
- **재배포 시간**: 2025-09-08 18:30
