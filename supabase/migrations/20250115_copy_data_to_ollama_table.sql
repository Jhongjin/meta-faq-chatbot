-- 기존 document_chunks 데이터를 ollama_document_chunks로 복사
-- Vercel+Gemini 서비스에 영향 없이 Vultr+Ollama 전용 데이터 생성

-- 1. 기존 데이터를 Ollama 테이블로 복사 (외래키 제약조건 없이)
INSERT INTO ollama_document_chunks (
    document_id,
    chunk_id,
    content,
    metadata,
    created_at
)
SELECT 
    document_id,
    chunk_id,
    content,
    metadata,
    created_at
FROM document_chunks
WHERE embedding IS NOT NULL
ON CONFLICT (document_id, chunk_id) DO NOTHING; -- 중복 방지

-- 2. 복사된 데이터에 대한 임베딩 재생성 필요
-- (기존 임베딩은 차원이 다를 수 있으므로)

-- 3. 복사 완료 로그
INSERT INTO document_processing_logs (
    document_id,
    step,
    status,
    message,
    metadata
) VALUES (
    'system',
    'data_migration',
    'completed',
    '기존 데이터를 Ollama 테이블로 복사 완료',
    '{"source_table": "document_chunks", "target_table": "ollama_document_chunks", "copied_at": "' || NOW() || '"}'
);

-- 4. 통계 업데이트
ANALYZE ollama_document_chunks;
