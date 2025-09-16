-- ollama_document_chunks 테이블의 외래키 제약조건 제거
-- 데이터 복사를 위해 임시로 제거

-- 1. 외래키 제약조건 제거
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- 외래키 제약조건 이름 찾기
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'ollama_document_chunks'::regclass 
    AND contype = 'f'
    AND confrelid = 'documents'::regclass;
    
    -- 제약조건이 존재하면 제거
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE ollama_document_chunks DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE '외래키 제약조건 % 제거 완료', constraint_name;
    ELSE
        RAISE NOTICE '제거할 외래키 제약조건이 없습니다.';
    END IF;
END $$;

-- 2. 제약조건 제거 확인
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint 
    WHERE conrelid = 'ollama_document_chunks'::regclass 
    AND contype = 'f'
    AND confrelid = 'documents'::regclass;
    
    IF constraint_count = 0 THEN
        RAISE NOTICE '외래키 제약조건이 성공적으로 제거되었습니다.';
    ELSE
        RAISE NOTICE '외래키 제약조건이 여전히 존재합니다: %개', constraint_count;
    END IF;
END $$;


