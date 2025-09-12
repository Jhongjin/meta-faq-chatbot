# AdMate - Meta 광고 정책 AI 챗봇

RAG(Retrieval-Augmented Generation) 기반의 AI 챗봇으로 Meta 광고 집행 관련 내부 FAQ에 대한 즉각적인 한국어 답변을 제공합니다.

## 🚀 주요 기능

- **AI 챗봇 대화**: 자연어로 질문하면 AI가 관련 문서를 찾아 정확한 답변을 제공
- **히스토리 관리**: 이전 질문과 답변을 언제든지 확인 가능
- **보안 & 권한 관리**: 사내 보안 정책에 맞춘 접근 제어와 데이터 보호
- **실시간 동기화**: 최신 정책과 가이드라인이 실시간으로 반영

## 🛠️ 기술 스택

### Frontend
- **Next.js 15**: React 기반 풀스택 프레임워크
- **TypeScript**: 정적 타입 검사
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **shadcn/ui**: 재사용 가능한 UI 컴포넌트
- **Framer Motion**: 애니메이션 라이브러리

### Backend & Database
- **Supabase**: 백엔드 서비스 (PostgreSQL + pgvector)
- **Vercel**: 프론트엔드 호스팅 및 서버리스 함수
- **Google Gemini**: LLM (Large Language Model)

### RAG 시스템
- **pgvector**: 벡터 임베딩 저장 및 유사도 검색
- **문서 처리**: PDF, DOCX, TXT 파일 지원
- **URL 크롤링**: 웹 페이지 내용 자동 수집

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/meta-faq.git
cd meta-faq
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_MODEL=gemini-2.0-flash-exp

# 기타 설정
EMBEDDING_DIM=768
TOP_K=5
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 확인하세요.

## 🚀 배포

### Vercel 배포
1. Vercel 계정에 로그인
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포 완료

### Railway 배포 (Ollama 버전)
Railway+Ollama 기반 서비스는 별도 브랜치에서 관리됩니다.

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── chat/              # 채팅 페이지
│   ├── admin/             # 관리자 페이지
│   └── page.tsx           # 메인 페이지
├── components/            # React 컴포넌트
│   ├── chat/              # 채팅 관련 컴포넌트
│   ├── admin/             # 관리자 컴포넌트
│   ├── layouts/           # 레이아웃 컴포넌트
│   └── ui/                # shadcn/ui 컴포넌트
├── hooks/                 # 커스텀 훅
├── lib/                   # 유틸리티 함수
│   ├── services/          # 서비스 레이어
│   └── supabase/          # Supabase 클라이언트
└── types/                 # TypeScript 타입 정의
```

## 🔧 주요 API 엔드포인트

- `POST /api/chat`: 채팅 메시지 처리
- `POST /api/upload`: 문서 업로드
- `GET /api/documents`: 문서 목록 조회
- `POST /api/feedback`: 피드백 저장
- `GET /api/feedback/stats`: 피드백 통계

## 📊 데이터베이스 스키마

### 주요 테이블
- `documents`: 업로드된 문서 정보
- `document_chunks`: 문서 청크 및 임베딩
- `conversations`: 대화 기록
- `feedback`: 사용자 피드백

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**태그**: `vercel_gemini_최종완료`
