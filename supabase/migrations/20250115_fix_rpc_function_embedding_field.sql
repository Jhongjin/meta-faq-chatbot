-- RPC 함수에서 embedding 필드가 제대로 반환되지 않는 문제 수정
-- 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS search_ollama_documents(vector, double precision, integer);

CREATE OR REPLACE FUNCTION search_ollama_documents(
    query_embedding vector(1024),
    match_threshold float DEFAULT 0.001,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    chunk_id TEXT,
    content TEXT,
    metadata JSONB,
    similarity float,
    embedding vector(1024)  -- embedding 필드 추가
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.chunk_id,
        dc.content,
        dc.metadata,
        1 - (dc.embedding::vector <=> query_embedding) as similarity,
        dc.embedding::vector as embedding  -- embedding 필드 반환
    FROM ollama_document_chunks dc
    WHERE dc.embedding IS NOT NULL
      AND 1 - (dc.embedding::vector <=> query_embedding) > match_threshold
    ORDER BY dc.embedding::vector <=> query_embedding
    LIMIT match_count;
END;
$$;
