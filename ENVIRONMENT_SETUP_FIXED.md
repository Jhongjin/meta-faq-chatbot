# 환경 변수 설정 가이드 (수정됨)

## 🔧 **필요한 환경 변수**

`.env.local` 파일에 다음 환경 변수들을 설정해주세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API 키 (임베딩용)
OPENAI_API_KEY=your_openai_api_key

# Ollama 설정 (로컬 개발용)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:1.5b
```

## 📋 **설정 순서**

### 1. Supabase 마이그레이션 실행
```sql
-- 1단계: 벡터 검색 함수 수정
-- supabase/migrations/20250110000000_fix_vector_search.sql 실행

-- 2단계: 임베딩 차원 수정 (기존 데이터 백업 후 재생성)
-- supabase/migrations/20250110000001_fix_embedding_dimension.sql 실행
```

### 2. 환경 변수 설정
1. `.env.local` 파일 생성
2. 위의 환경 변수들을 실제 값으로 설정
3. OpenAI API 키 발급 (https://platform.openai.com/api-keys)

### 3. 테스트
1. `npm run dev` 실행
2. `http://localhost:3000/debug` 접속
3. 각 테스트 실행하여 정상 작동 확인

## ⚠️ **주의사항**

- **기존 데이터**: 마이그레이션으로 인해 기존 임베딩 데이터가 삭제됩니다
- **OpenAI API 키**: 임베딩 생성에 필요합니다
- **차원 수**: 1024 → 1536으로 변경됩니다

## 🚀 **예상 결과**

- 벡터 검색이 정상 작동
- RAG 검색에서 소스 검색 성공
- 챗봇이 정상적인 답변 생성
