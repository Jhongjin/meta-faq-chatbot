# Chat 페이지 기술 문서

## 📋 개요
Meta 광고 FAQ AI 챗봇의 메인 채팅 페이지로, RAG(Retrieval-Augmented Generation) 기반의 AI 답변 시스템을 제공합니다.

## 🛠️ 기술 스택

### Frontend
- **Next.js 15** - React 기반 풀스택 프레임워크
- **TypeScript** - 정적 타입 검사
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **shadcn/ui** - 재사용 가능한 UI 컴포넌트
- **Framer Motion** - 애니메이션 라이브러리
- **React Markdown** - 마크다운 렌더링
- **Lucide React** - 아이콘 라이브러리

### Backend & Database
- **Supabase** - PostgreSQL 기반 백엔드 서비스
- **pgvector** - 벡터 검색 및 임베딩 저장
- **FastAPI** - Python 백엔드 API (별도 서비스)

### AI & ML
- **Google Gemini API** - LLM 응답 생성
- **LangChain** - RAG 파이프라인 구축
- **Ollama** - 로컬 LLM 실행 (선택사항)

### 상태 관리 & 데이터 페칭
- **@tanstack/react-query** - 서버 상태 관리 및 캐싱
- **Zustand** - 클라이언트 상태 관리
- **React Hook Form** - 폼 상태 관리

## 🏗️ 아키텍처

### 컴포넌트 구조
```
src/app/chat/
├── page.tsx                 # 메인 채팅 페이지
├── components/
│   ├── ChatBubble.tsx       # 채팅 메시지 버블
│   ├── RelatedResources.tsx # 관련 자료 표시
│   ├── AnswerSummary.tsx    # 답변 요약
│   ├── QuickQuestions.tsx   # 빠른 질문
│   ├── LearningResources.tsx # 추가 학습 자료
│   └── RelatedQuestions.tsx # 관련 질문 예측
├── hooks/
│   └── useAnswerSummary.ts  # 답변 요약 훅
└── layouts/
    └── MainLayout.tsx       # 메인 레이아웃
```

### 데이터 플로우
1. **사용자 질문 입력** → Textarea 컴포넌트
2. **RAG 검색** → Supabase 벡터 검색
3. **AI 응답 생성** → Gemini API 호출
4. **답변 표시** → ChatBubble 컴포넌트
5. **관련 자료 표시** → RelatedResources 컴포넌트
6. **답변 요약** → AnswerSummary 컴포넌트

## 🎨 주요 기능

### 1. 채팅 인터페이스
- **실시간 스트리밍 답변** - AI 응답을 실시간으로 표시
- **마크다운 렌더링** - 구조화된 텍스트 표시
- **출처 표시** - 답변 근거 문서 표시
- **피드백 시스템** - 답변 만족도 평가

### 2. RAG 시스템
- **벡터 검색** - pgvector를 이용한 유사도 검색
- **문서 청킹** - PDF, DOCX, TXT 파일 처리
- **임베딩 생성** - 텍스트를 벡터로 변환
- **유사도 점수** - 검색 결과의 관련성 표시

### 3. UI/UX 개선사항
- **반응형 디자인** - 모바일/데스크톱 대응
- **패널 시스템** - 좌우 패널 접기/펼치기
- **애니메이션** - 부드러운 전환 효과
- **다크 테마** - 시각적 편의성

## 🔧 주요 작업 내용

### 1. 출처 표시 개선
- **제목 생성 로직** - URL/파일 타입별 직관적 제목
- **중복 제거** - 동일 출처 중복 표시 방지
- **아이콘 통일** - 파일/URL 타입별 아이콘 구분
- **유사도 표시** - 검색 결과 관련성 점수 표시

### 2. UI 최적화
- **텍스트 크기 조정** - 가독성 향상을 위한 크기 조정
- **버튼 간소화** - 불필요한 버튼 제거
- **날짜 형식** - "마지막 업데이트" 접두사 추가
- **푸터 축소** - 입력 영역 높이 60% 축소

### 3. 답변 품질 향상
- **구조화된 텍스트** - 마크다운을 이용한 가독성 개선
- **답변 요약** - AI 답변 완료 후 핵심 포인트 추출
- **관련 질문** - 추가 질문 제안 기능
- **학습 자료** - 관련 문서 링크 제공

### 4. 성능 최적화
- **캐싱 전략** - React Query를 이용한 데이터 캐싱
- **지연 로딩** - 필요시에만 컴포넌트 로드
- **메모이제이션** - 불필요한 리렌더링 방지
- **코드 분할** - 번들 크기 최적화

## 📊 데이터 모델

### 메시지 구조
```typescript
interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: Array<{
    id: string;
    title: string;
    url?: string;
    updatedAt: string;
    excerpt: string;
    similarity: number;
  }>;
  feedback?: {
    helpful: boolean | null;
    count: number;
  };
}
```

### 문서 구조
```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  type: 'pdf' | 'docx' | 'txt' | 'url';
  status: 'pending' | 'indexed' | 'completed' | 'failed';
  chunk_count: number;
  created_at: string;
  updated_at: string;
  url?: string;
}
```

## 🚀 배포 및 환경 설정

### 환경 변수
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_API_KEY=your_gemini_api_key
```

### 빌드 및 실행
```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

## 🔍 주요 API 엔드포인트

### 채팅 관련
- `POST /api/chat` - 메인 채팅 API
- `POST /api/chat/summarize` - 답변 요약 API
- `GET /api/conversations` - 대화 목록 조회
- `POST /api/conversations` - 새 대화 생성

### 문서 관련
- `GET /api/download/[documentId]` - 문서 다운로드
- `POST /api/admin/upload-new` - 새 문서 업로드
- `GET /api/admin/upload-new` - 문서 목록 조회

### 관련 질문
- `POST /api/related-questions` - 관련 질문 추천

## 📈 성능 지표

### 목표 성능
- **응답 시간**: 평균 3초 이내
- **동시 사용자**: 최대 50명
- **데이터 보존**: 90일
- **사용자 만족도**: 80% 이상

### 최적화 결과
- **번들 크기**: 최적화된 코드 분할
- **로딩 시간**: 지연 로딩으로 초기 로딩 시간 단축
- **메모리 사용량**: 효율적인 상태 관리
- **네트워크 요청**: React Query 캐싱으로 중복 요청 방지

## 🐛 알려진 이슈 및 해결책

### 1. DOCX 파일 처리
- **문제**: `buffer is not defined` 오류
- **해결**: `mammoth.extractText` 동기 함수 사용

### 2. 중복 콘텐츠
- **문제**: 다운로드 파일에 중복 내용
- **해결**: Levenshtein 거리 기반 중복 제거 로직

### 3. 캐싱 문제
- **문제**: 변경사항이 반영되지 않음
- **해결**: 개발 서버 재시작 및 하드 리프레시

## 🔮 향후 개선 계획

### 단기 계획
- [ ] 모바일 UI 최적화
- [ ] 음성 입력 기능 추가
- [ ] 다국어 지원 확장

### 장기 계획
- [ ] 실시간 협업 기능
- [ ] 고급 분석 대시보드
- [ ] API 성능 모니터링
- [ ] 자동화된 테스트 구축

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [shadcn/ui 컴포넌트](https://ui.shadcn.com/)
- [React Query 공식 문서](https://tanstack.com/query/latest)

---

*최종 업데이트: 2025년 1월 20일*
*문서 버전: 1.0.0*


