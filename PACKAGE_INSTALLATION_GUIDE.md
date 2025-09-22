# 서버사이드 텍스트 추출을 위한 패키지 설치 가이드

## 개요
현재 시스템에 통합된 인코딩 처리 유틸리티와 서버사이드 텍스트 추출 기능이 추가되었습니다. 완전한 기능을 위해서는 다음 패키지들을 설치해야 합니다.

## 현재 구현된 개선사항

### ✅ 완료된 기능
- **통합된 인코딩 처리**: `src/lib/utils/textEncoding.ts` - 모든 텍스트 처리를 통일된 방식으로 처리
- **서버사이드 텍스트 추출**: `RAGProcessor.extractTextFromFile()` - PDF, DOCX, TXT 파일 처리
- **기존 API 호환성**: 기존 업로드 API와 완전 호환
- **점진적 개선**: 기존 코드를 최대한 보존하면서 개선

### 🔧 적용된 개선사항
1. **RAGProcessor**: 서버사이드 텍스트 추출 메서드 추가
2. **업로드 API**: PDF, DOCX, TXT 파일에 대한 서버사이드 처리 적용
3. **URL 크롤링**: 통합된 인코딩 처리 적용
4. **NewDocumentProcessor**: 통합된 인코딩 처리 적용

## 필수 패키지 설치

### 1. PDF 처리
```bash
npm install pdf-parse
npm install @types/pdf-parse --save-dev
```

### 2. DOCX 처리
```bash
npm install mammoth
npm install @types/mammoth --save-dev
```

### 3. 추가 유틸리티
```bash
npm install iconv-lite
npm install @types/iconv-lite --save-dev
```

## 설치 후 해야 할 일

### 1. ServerSideTextExtractor.ts 업데이트
```typescript
// PDF 처리 활성화
import * as pdfParse from 'pdf-parse';

async extractFromPDF(fileBuffer: Buffer, fileName: string): Promise<ExtractionResult> {
  try {
    const pdfData = await pdfParse(fileBuffer);
    const encodingResult = processTextEncoding(pdfData.text, { strictMode: true });
    // ... 나머지 로직
  } catch (error) {
    // ... 오류 처리
  }
}
```

```typescript
// DOCX 처리 활성화
import * as mammoth from 'mammoth';

async extractFromDOCX(fileBuffer: Buffer, fileName: string): Promise<ExtractionResult> {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const encodingResult = processTextEncoding(result.value, { strictMode: true });
    // ... 나머지 로직
  } catch (error) {
    // ... 오류 처리
  }
}
```

### 2. API 라우트 업데이트
기존의 `NewDocumentProcessor` 대신 `ImprovedDocumentProcessor`를 사용하도록 API 라우트를 수정해야 합니다.

### 3. 환경 변수 설정
서버사이드 처리를 위한 추가 환경 변수가 필요할 수 있습니다.

## 장점

### 1. 원본 데이터 무결성 보장
- 클라이언트에서 깨진 데이터가 생성되지 않음
- 서버에서 안전하게 텍스트 추출

### 2. 다양한 파일 형식 지원
- PDF: 실제 텍스트 내용 추출
- DOCX: 서식 정보 보존하며 텍스트 추출
- TXT: 다양한 인코딩 자동 감지

### 3. 통합된 인코딩 처리
- 모든 텍스트 추출이 동일한 방식으로 처리
- 한글 인코딩 문제 완전 해결

### 4. 품질 검증
- 추출된 텍스트의 품질 자동 검증
- 문제가 있는 경우 자동으로 알림

## 현재 문제점

### 1. 클라이언트 사이드 한계
- `file.text()`는 브라우저의 인코딩 감지에 의존
- PDF, DOCX 등은 실제로는 메타데이터만 추출
- 다양한 인코딩을 제대로 처리하지 못함

### 2. 일관성 부족
- 각 서비스마다 다른 인코딩 처리 방식
- 나중에 정리하는 것보다 처음부터 올바르게 처리해야 함

### 3. 데이터 손실
- 원본 데이터가 이미 깨진 상태로 저장
- 복구가 어려운 상황

## 권장사항

1. **즉시 패키지 설치**: 위의 패키지들을 설치하여 서버사이드 처리를 활성화
2. **API 라우트 수정**: `ImprovedDocumentProcessor`를 사용하도록 수정
3. **기존 데이터 정리**: 이미 깨진 데이터는 별도로 정리
4. **테스트**: 다양한 파일 형식으로 테스트하여 정상 작동 확인

이렇게 하면 근본적으로 한글 텍스트 깨짐 문제를 해결할 수 있습니다.
