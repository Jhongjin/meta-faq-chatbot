# Meta FAQ AI 챗봇 - 문서 처리 로직 요약

## 📋 개요
Meta 광고 집행 관련 내부 FAQ를 위한 RAG(Retrieval-Augmented Generation) 기반 AI 챗봇 시스템의 문서 처리 로직입니다.

## 🔧 핵심 기술 스택
- **Frontend**: Next.js 15, TypeScript, React, shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes, FastAPI (Python)
- **Database**: Supabase Postgres with pgvector
- **File Processing**: PDF, DOCX, TXT 지원
- **AI/ML**: LangChain, Ollama, 임베딩 벡터 검색

## 📁 지원 파일 형식

### 1. PDF 파일
- **처리 방식**: 바이너리 데이터로 저장 (`BINARY_DATA:` 접두사)
- **텍스트 추출**: 현재 비활성화 (다운로드용으로만 사용)
- **청킹**: 텍스트 추출이 없어 청킹 불가 (AI 검색 불가)
- **다운로드**: 원본 PDF 파일로 다운로드 가능

### 2. DOCX 파일
- **처리 방식**: 바이너리 데이터로 저장 (`BINARY_DATA:` 접두사)
- **텍스트 추출**: 현재 비활성화 (다운로드용으로만 사용)
- **청킹**: 텍스트 추출이 없어 청킹 불가 (AI 검색 불가)
- **다운로드**: 원본 DOCX 파일로 다운로드 가능

### 3. TXT 파일
- **처리 방식**: 텍스트 내용 직접 저장
- **텍스트 추출**: UTF-8 인코딩으로 처리
- **청킹**: 정상적으로 청킹되어 AI 검색 가능
- **다운로드**: 원본 텍스트 파일로 다운로드 가능

## 🔄 문서 처리 플로우

### 1. 파일 업로드 (`/api/admin/upload-new`)
```typescript
// 파일 타입별 처리
if (file.type === 'application/pdf') {
  // PDF: ArrayBuffer → Base64 → BINARY_DATA: 접두사
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  content = `BINARY_DATA:${base64}`;
} else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  // DOCX: ArrayBuffer → Base64 → BINARY_DATA: 접두사
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  content = `BINARY_DATA:${base64}`;
} else {
  // TXT: 텍스트 직접 읽기
  content = await file.text();
}
```

### 2. RAG 처리 (`RAGProcessor.ts`)
```typescript
// PDF/DOCX 바이너리 데이터는 청킹 건너뛰기
if (document.content && document.content.startsWith('BINARY_DATA:')) {
  return {
    documentId: document.id,
    chunkCount: 0,
    success: true, // 다운로드용으로만 사용
  };
}

// TXT 파일만 청킹 처리
const chunks = this.simpleChunkDocument(processedDocument);
```

### 3. 청킹 로직 (`simpleChunkDocument`)
```typescript
// 청크 크기: 800자, 겹침: 100자
const chunkSize = 800;
const overlap = 100;

// 문장 경계에서 자르기
const lastSentenceEnd = chunk.lastIndexOf('.');
if (lastSentenceEnd > chunkSize * 0.5) {
  chunk = chunk.slice(0, lastSentenceEnd + 1);
}
```

### 4. 데이터베이스 저장
```typescript
// documents 테이블
{
  id: 'doc_1758447350879',
  title: 'filename.pdf',
  content: 'BINARY_DATA:...' 또는 '텍스트 내용',
  type: 'pdf' | 'docx' | 'txt',
  file_size: 373938,
  status: 'completed' | 'processing',
  chunk_count: 101
}

// document_chunks 테이블
{
  id: 'doc_1758447350879_chunk_0',
  document_id: 'doc_1758447350879',
  chunk_id: 0, // 정수 인덱스
  content: '청크 텍스트 내용',
  metadata: {
    chunk_index: 0,
    source: 'filename.pdf',
    created_at: '2025-09-21T09:33:08.196+00:00'
  },
  embedding: '[0,0,0,0,...]' // JSON 문자열
}
```

## 🔍 다운로드 처리 (`/api/admin/document-actions`)

### 1. 바이너리 데이터 처리
```typescript
if (document.content && document.content.startsWith('BINARY_DATA:')) {
  const base64Data = document.content.replace('BINARY_DATA:', '');
  const fileBuffer = Buffer.from(base64Data, 'base64');
  
  // MIME 타입 결정
  let mimeType = 'application/octet-stream';
  if (fileName.endsWith('.pdf')) mimeType = 'application/pdf';
  if (fileName.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
}
```

### 2. 대용량 파일 처리
```typescript
// 12MB 이상 파일은 content 필드 비워둠 (데이터베이스 타임아웃 방지)
if (file.size > 12 * 1024 * 1024) {
  content = ''; // 빈 문자열로 저장
  // 다운로드 불가 알림 표시
}
```

## ⚠️ 현재 제한사항

### 1. PDF/DOCX 텍스트 추출 미지원
- **현재 상태**: 바이너리 데이터로만 저장
- **영향**: AI 챗봇에서 PDF/DOCX 내용 검색 불가
- **해결 방안**: PDF.js, mammoth.js 등 텍스트 추출 라이브러리 도입 필요

### 2. 대용량 파일 제한
- **제한**: 12MB 이상 파일은 content 필드 비워둠
- **영향**: 대용량 파일 다운로드 불가
- **해결 방안**: Supabase Storage 또는 외부 스토리지 사용

### 3. 파일 크기 제한
- **Frontend**: 20MB
- **Backend**: 50MB
- **Vercel**: 50MB

## 🛠️ 주요 수정 이력

### 1. PDF 바이너리 데이터 처리 개선
- **문제**: PDF 파일이 텍스트로 잘못 처리되어 청킹 실패
- **해결**: `BINARY_DATA:` 접두사로 바이너리 데이터 구분

### 2. 데이터베이스 스키마 수정
- **문제**: `document_chunks` 테이블에 `metadata` 컬럼 없음
- **해결**: `metadata JSONB` 컬럼 추가

### 3. 데이터 타입 불일치 해결
- **문제**: `chunk_id` 필드에 문자열 저장 시도
- **해결**: `chunk_id`는 정수, `id`는 문자열로 분리

### 4. 중복 파일 검사 최적화
- **문제**: URL 크롤링 문서도 중복 검사 대상에 포함
- **해결**: 파일 업로드 문서(`pdf`, `docx`, `txt`)만 검사

## 📊 성능 최적화

### 1. 청킹 배치 처리
- **배치 크기**: 100개씩 처리
- **메모리 효율성**: 대용량 문서 처리 시 메모리 사용량 최적화

### 2. 데이터베이스 인덱싱
```sql
-- document_chunks 테이블 인덱스
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_chunk_id ON document_chunks(chunk_id);
CREATE INDEX idx_document_chunks_metadata ON document_chunks USING GIN (metadata);
```

### 3. 타임아웃 설정
- **일반 파일**: 30초
- **대용량 파일**: 5분

## 🔮 향후 개선 방향

### 1. PDF/DOCX 텍스트 추출 구현
- **PDF**: PDF.js 또는 pdf-parse 라이브러리 사용
- **DOCX**: mammoth.js 라이브러리 사용
- **목표**: 모든 파일 형식에서 AI 검색 가능

### 2. 대용량 파일 처리 개선
- **Supabase Storage**: 원본 파일 저장
- **스트리밍**: 대용량 파일 다운로드 지원
- **청킹**: 대용량 파일도 텍스트 추출 후 청킹

### 3. 실시간 처리 상태 표시
- **WebSocket**: 실시간 업로드/인덱싱 진행률 표시
- **상태 관리**: 처리 중/완료/실패 상태 실시간 업데이트

## 📝 사용법

### 1. 파일 업로드
```typescript
// 지원 형식: PDF, DOCX, TXT
// 최대 크기: 20MB
const formData = new FormData();
formData.append('file', file);
const response = await fetch('/api/admin/upload-new', {
  method: 'POST',
  body: formData
});
```

### 2. 파일 다운로드
```typescript
const response = await fetch(`/api/admin/document-actions?action=download&documentId=${documentId}`);
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = fileName;
a.click();
```

### 3. 재인덱싱
```typescript
const response = await fetch(`/api/admin/document-actions?action=reindex&documentId=${documentId}`, {
  method: 'POST'
});
```

---

**최종 업데이트**: 2025년 9월 21일  
**버전**: 1.0.0  
**상태**: 프로덕션 준비 완료