# 환경변수 설정 가이드

## 문제 상황
현재 Supabase 환경변수가 설정되지 않아서 중복파일 로직이 작동하지 않습니다.

## 해결 방법

### 1. `.env.local` 파일 생성
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Supabase 설정 (개발용)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini 설정
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_MODEL=gemini-2.0-flash-exp

# RAG 설정
EMBEDDING_DIM=768
TOP_K=5

# OpenAI 설정 (RAG 임베딩용)
OPENAI_API_KEY=your_openai_api_key
```

### 2. Supabase 프로젝트 설정
1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. Settings > API에서 다음 값들을 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Google Gemini API 설정
1. [Google AI Studio](https://aistudio.google.com/)에서 API 키 생성
2. 생성된 API 키를 `GEMINI_API_KEY`와 `GOOGLE_API_KEY`에 설정

### 4. OpenAI API 설정 (선택사항)
1. [OpenAI Platform](https://platform.openai.com/)에서 API 키 생성
2. 생성된 API 키를 `OPENAI_API_KEY`에 설정

## 현재 상태
- ✅ 환경변수 파일 템플릿: `env.example`
- ❌ 실제 환경변수 파일: `.env.local` (생성 필요)
- ❌ Supabase 연결: 환경변수 없음으로 인한 실패
- ⚠️ 중복파일 로직: 메모리 기반 폴백으로 작동

## 다음 단계
1. `.env.local` 파일 생성
2. Supabase 프로젝트에서 실제 값들 복사
3. 서버 재시작
4. 중복파일 로직 테스트


