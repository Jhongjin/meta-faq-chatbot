-- 임베딩 차원 불일치 해결 마이그레이션
-- 768차원 임베딩을 1024차원으로 변환

-- 1. 기존 768차원 임베딩을 1024차원으로 확장
-- 768차원 뒤에 256개의 0을 추가하여 1024차원으로 만듦
UPDATE ollama_document_chunks 
SET embedding = array_to_vector(
    array_cat(
        vector_to_array(embedding)::float4[],
        array_fill(0.0, ARRAY[256])::float4[]
    )
)
WHERE embedding IS NOT NULL 
  AND array_length(vector_to_array(embedding), 1) = 768;

-- 2. 업데이트된 임베딩 차원 확인
DO $$
DECLARE
    dimension_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dimension_count
    FROM ollama_document_chunks 
    WHERE embedding IS NOT NULL 
      AND array_length(vector_to_array(embedding), 1) = 1024;
    
    RAISE NOTICE '1024차원 임베딩 개수: %', dimension_count;
END $$;

-- 3. 인덱스 재구성 (차원 변경 후 필요)
REINDEX INDEX IF EXISTS idx_ollama_chunks_embedding;

-- 4. 통계 업데이트
ANALYZE ollama_document_chunks;


