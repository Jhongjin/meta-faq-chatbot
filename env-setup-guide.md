# 환경 변수 설정 가이드

## 1. .env.local 파일 생성

프로젝트 루트 디렉토리(`D:\cursor\meta_faq`)에 `.env.local` 파일을 생성하세요.

## 2. 파일 내용

```bash
# Ollama 설정
OLLAMA_BASE_URL=http://141.164.52.52:11434
OLLAMA_DEFAULT_MODEL=tinyllama:1.1b

# Supabase 설정 (기존 값으로 교체)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini 설정 (기존 값으로 교체)
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_MODEL=gemini-2.0-flash-exp

# RAG 설정
EMBEDDING_DIM=768
TOP_K=5
```

## 3. 파일 위치 확인

```
meta_faq/
├── .env.local          ← 여기에 생성
├── .env.example
├── package.json
├── src/
└── ...
```

## 4. 개발 서버 재시작

```bash
# 개발 서버 중지 (Ctrl+C)
# 그 다음 재시작
npm run dev
```

## 5. 확인 방법

1. 브라우저에서 `http://localhost:3000/test-ollama` 접속
2. "서버 상태 확인" 버튼 클릭
3. 콘솔에서 환경 변수 로그 확인

## 6. 문제 해결

만약 여전히 오류가 발생한다면:

1. `.env.local` 파일이 올바른 위치에 있는지 확인
2. 파일 내용에 오타가 없는지 확인
3. 개발 서버를 완전히 중지하고 재시작
4. 브라우저 캐시 클리어 (Ctrl+Shift+R)

