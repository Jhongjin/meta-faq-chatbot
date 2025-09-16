-- 문자열로 저장된 임베딩을 처리하는 RPC 함수 수정
CREATE OR REPLACE FUNCTION search_ollama_documents(
    query_embedding vector(1024),
    match_threshold float DEFAULT 0.001,
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
        1 - (dc.embedding::vector <=> query_embedding) as similarity
    FROM ollama_document_chunks dc
    WHERE dc.embedding IS NOT NULL
      AND 1 - (dc.embedding::vector <=> query_embedding) > match_threshold
    ORDER BY dc.embedding::vector <=> query_embedding
    LIMIT match_count;
END;
$$;
