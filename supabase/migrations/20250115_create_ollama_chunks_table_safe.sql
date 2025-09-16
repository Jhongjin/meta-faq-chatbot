-- Vultr+Ollama 전용 청크 테이블 생성 (안전한 버전)
-- Vercel+Gemini와 분리하여 독립적 운영
-- 모든 객체 생성 전 중복 확인

-- 1. Vultr+Ollama 전용 document_chunks 테이블 생성
CREATE TABLE IF NOT EXISTS ollama_document_chunks (
    id SERIAL PRIMARY KEY,
    document_id TEXT NOT NULL, -- 외래키 제약조건 제거 (임시)
    chunk_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1024), -- Ollama 전용 1024차원
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 고유 제약 조건
    UNIQUE(document_id, chunk_id)
);

-- 2. 벡터 검색을 위한 인덱스 생성 (중복 확인)
CREATE INDEX IF NOT EXISTS idx_ollama_chunks_embedding 
ON ollama_document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 3. 문서 ID로 청크 검색을 위한 인덱스 (중복 확인)
CREATE INDEX IF NOT EXISTS idx_ollama_chunks_document_id 
ON ollama_document_chunks(document_id);

-- 4. RLS 활성화 (테이블이 존재할 때만)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ollama_document_chunks') THEN
        ALTER TABLE ollama_document_chunks ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. 정책 생성 (중복 확인)
DO $$
BEGIN
    -- 정책이 이미 존재하는지 확인
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ollama_document_chunks' 
        AND policyname = 'Admin can manage all ollama document chunks'
    ) THEN
        -- 테이블이 존재할 때만 정책 생성
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ollama_document_chunks') THEN
            CREATE POLICY "Admin can manage all ollama document chunks" ON ollama_document_chunks
                FOR ALL USING (auth.role() = 'authenticated');
        END IF;
    END IF;
END $$;

-- 6. Ollama 전용 벡터 유사도 검색 함수 생성 (덮어쓰기)
CREATE OR REPLACE FUNCTION search_ollama_documents(
    query_embedding vector(1024),
    match_threshold float DEFAULT 0.1,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    chunk_id TEXT,
    content TEXT,
    metadata JSONB,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.chunk_id,
        dc.content,
        dc.metadata,
        1 - (dc.embedding <=> query_embedding) as similarity
    FROM ollama_document_chunks dc
    WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 7. updated_at 컬럼을 위한 트리거 함수 생성 (중복 확인)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 트리거 생성 (중복 확인)
DO $$
BEGIN
    -- 트리거가 이미 존재하는지 확인
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_ollama_document_chunks_updated_at'
    ) THEN
        -- 테이블이 존재할 때만 트리거 생성
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ollama_document_chunks') THEN
            CREATE TRIGGER update_ollama_document_chunks_updated_at
                BEFORE UPDATE ON ollama_document_chunks
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

-- 9. 인덱스 성능 최적화를 위한 통계 업데이트
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ollama_document_chunks') THEN
        ANALYZE ollama_document_chunks;
    END IF;
END $$;
