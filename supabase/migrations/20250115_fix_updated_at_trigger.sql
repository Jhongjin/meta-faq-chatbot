-- ollama_document_chunks 테이블의 updated_at 트리거 문제 해결

-- 1. 기존 트리거 제거
DROP TRIGGER IF EXISTS update_ollama_document_chunks_updated_at ON ollama_document_chunks;

-- 2. updated_at 컬럼이 존재하는지 확인하고 없으면 추가
DO $$
BEGIN
    -- updated_at 컬럼이 존재하지 않으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ollama_document_chunks' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE ollama_document_chunks 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'updated_at 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'updated_at 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 3. 트리거 함수가 존재하는지 확인하고 없으면 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. 트리거 재생성
CREATE TRIGGER update_ollama_document_chunks_updated_at
    BEFORE UPDATE ON ollama_document_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 기존 데이터의 updated_at 값 설정
UPDATE ollama_document_chunks 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 6. 통계 업데이트
ANALYZE ollama_document_chunks;
