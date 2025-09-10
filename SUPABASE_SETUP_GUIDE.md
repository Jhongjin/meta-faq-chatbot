# Supabase 환경 변수 설정 가이드

## 🚨 현재 문제점
챗봇이 작동하지 않는 주요 원인은 **Supabase 환경 변수가 설정되지 않았기 때문**입니다.

## ✅ 해결 방법

### 1. Supabase 프로젝트 생성 (아직 없다면)

1. **Supabase 대시보드** 접속: https://supabase.com/dashboard
2. **New Project** 클릭
3. 프로젝트 정보 입력:
   - **Name**: `meta-faq-chatbot`
   - **Database Password**: 강력한 비밀번호 설정
   - **Region**: `Northeast Asia (Seoul)` 선택
4. **Create new project** 클릭

### 2. 환경 변수 값 확인

프로젝트 생성 후 **Settings** → **API**에서 다음 값들을 복사:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. .env.local 파일 수정

프로젝트 루트의 `.env.local` 파일에 위 환경 변수들을 추가:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API 설정 (이미 설정됨)
GOOGLE_API_KEY=AIzaSyBip1YBKUFXdaD6u7UbsbYVoBjimlbG1eQ
GOOGLE_MODEL=gemini-1.5-flash

# 기타 설정
MAX_FILE_SIZE=10485760
NODE_ENV=development
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### 4. 데이터베이스 스키마 설정

Supabase SQL Editor에서 다음 마이그레이션을 실행:

```sql
-- 1. documents 테이블 생성
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'url')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  url TEXT,
  size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. document_chunks 테이블 생성
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1024), -- BGE-M3 모델용 1024차원
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON document_chunks USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- 5. RLS (Row Level Security) 설정
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- 6. 정책 설정 (모든 사용자가 읽기 가능)
CREATE POLICY "Allow all users to read documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow all users to read document_chunks" ON document_chunks FOR SELECT USING (true);
```

### 5. 개발 서버 재시작

```bash
# 개발 서버 중지 (Ctrl+C)
# 다시 시작
npm run dev
```

### 6. 연결 테스트

브라우저에서 다음 URL로 테스트:
- `http://localhost:3000/api/check-database` - 데이터베이스 연결 확인
- `http://localhost:3000/chat` - 챗봇 페이지 테스트

## 🔍 문제 해결

### 환경 변수가 제대로 설정되었는지 확인

브라우저 개발자 도구 콘솔에서 다음 로그를 확인:
- `✅ RAGSearchService 초기화 완료`
- `🔧 환경 변수 상태: { hasSupabaseUrl: true, hasSupabaseKey: true }`

### 일반적인 오류와 해결책

1. **"Supabase 환경변수가 설정되지 않았습니다"**
   - `.env.local` 파일이 프로젝트 루트에 있는지 확인
   - 환경 변수 이름이 정확한지 확인 (대소문자 구분)

2. **"Database query failed"**
   - Supabase 프로젝트가 활성화되었는지 확인
   - 데이터베이스 스키마가 올바르게 설정되었는지 확인

3. **"Failed to execute 'json' on 'Response'"**
   - API 응답이 올바른 JSON 형식인지 확인
   - 네트워크 탭에서 실제 응답 내용 확인

## 📞 추가 도움

문제가 지속되면:
1. 브라우저 개발자 도구의 Network 탭에서 API 요청/응답 확인
2. 터미널에서 서버 로그 확인
3. Supabase 대시보드에서 프로젝트 상태 확인
