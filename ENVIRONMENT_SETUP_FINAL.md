# 최종 환경 변수 설정 가이드

## 🔧 **필요한 환경 변수**

`.env.local` 파일에 다음 환경 변수들을 설정해주세요:

```bash
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Ollama 설정 (필수)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:1.5b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# OpenAI 설정 (선택사항 - 임베딩 모델 비교용)
OPENAI_API_KEY=your_openai_api_key
```

## 📋 **설정 순서**

### 1. Supabase 마이그레이션 실행
```sql
-- 1단계: 벡터 검색 함수 수정
-- supabase/migrations/20250110000000_fix_vector_search.sql 실행

-- 2단계: 임베딩 차원 수정 (기존 데이터 백업 후 재생성)
-- supabase/migrations/20250110000001_fix_embedding_dimension.sql 실행

-- 3단계: Ollama 임베딩 모델용 마이그레이션 (768차원)
-- supabase/migrations/20250110000002_fix_ollama_embedding.sql 실행
```

### 2. Ollama 모델 설치
```bash
# LLM 모델
ollama pull qwen2.5:1.5b

# 임베딩 모델
ollama pull nomic-embed-text
ollama pull mxbai-embed-large  # 선택사항 (비교용)
```

### 3. 환경 변수 설정
1. `.env.local` 파일 생성
2. 위의 환경 변수들을 실제 값으로 설정
3. Supabase URL과 키 설정
4. Ollama URL 설정 (기본값: http://localhost:11434)

### 4. 테스트
1. `npm run dev` 실행
2. `http://localhost:3001/debug` 접속
3. 각 테스트 실행하여 정상 작동 확인

## ⚠️ **주의사항**

- **기존 데이터**: 마이그레이션으로 인해 기존 임베딩 데이터가 삭제됩니다
- **Ollama 서버**: 반드시 실행 중이어야 합니다
- **차원 수**: 768차원으로 변경됩니다 (nomic-embed-text)
- **비용**: Ollama 사용 시 완전 무료

## 🚀 **예상 결과**

- **간단한 챗봇 테스트**: Ollama로 정상 응답
- **임베딩 서비스 테스트**: nomic-embed-text로 정상 작동
- **RAG 서비스 테스트**: 소스 검색 성공
- **챗봇**: "메타 광고 정책에 대해 설명해주세요" 질문에 정상 응답

## 🔍 **문제 해결**

### Ollama 서비스 오류
- Ollama 서버 실행 확인: `ollama serve`
- 모델 설치 확인: `ollama list`
- 포트 11434 접근 확인

### Supabase 연결 오류
- URL과 키 확인
- 마이그레이션 실행 확인
- 테이블 존재 확인

### 임베딩 서비스 오류
- nomic-embed-text 모델 설치 확인
- Ollama 서버 실행 확인
- 환경 변수 설정 확인
