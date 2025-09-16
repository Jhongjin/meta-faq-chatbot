-- ollama_document_chunks 테이블에 외래키 제약조건 추가
-- 데이터 복사 완료 후 실행

-- 1. 존재하지 않는 document_id를 가진 청크 확인
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM ollama_document_chunks o
    LEFT JOIN documents d ON o.document_id = d.id
    WHERE d.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE '고아 청크 %개 발견. 외래키 제약조건 추가를 건너뜁니다.', orphaned_count;
        RETURN;
    END IF;
    
    -- 2. 외래키 제약조건 추가
    ALTER TABLE ollama_document_chunks 
    ADD CONSTRAINT ollama_document_chunks_document_id_fkey 
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
    
    RAISE NOTICE '외래키 제약조건이 성공적으로 추가되었습니다.';
END $$;

-- 3. updated_at 컬럼을 위한 트리거 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. 트리거 적용
DROP TRIGGER IF EXISTS update_ollama_document_chunks_updated_at ON ollama_document_chunks;
CREATE TRIGGER update_ollama_document_chunks_updated_at
    BEFORE UPDATE ON ollama_document_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 통계 업데이트
ANALYZE ollama_document_chunks;


