# URL RAG 시스템 기술 요소 요약 (최종 완성 버전)

이 문서는 URL 기반 RAG(Retrieval-Augmented Generation) 시스템의 주요 기술 요소와 구현 방식을 요약합니다.

## 🎯 시스템 개요
- **목적**: Meta 광고 관련 내부 FAQ에 대한 즉각적인 한국어 답변 제공
- **기술 스택**: Next.js 15, TypeScript, Supabase Postgres, pgvector, Google Gemini, LangChain
- **성능**: 평균 3초 이내 응답, 50명 동시 사용자 지원, 90일 로그 보존

## 1. URL 크롤링 (Web Crawling) ✅ 완성
- **목적**: 웹 페이지의 텍스트 콘텐츠를 추출하여 RAG 시스템의 지식 기반으로 활용
- **기술 스택**:
    - **Puppeteer**: Headless Chrome을 제어하여 동적 콘텐츠(JavaScript 렌더링)를 포함한 웹 페이지를 크롤링
    - **`puppeteer-extra` + `StealthPlugin`**: 봇 감지 우회
    - **`fetch` API**: 정적 콘텐츠를 빠르게 가져오는 데 사용
    - **`DOMParser`**: HTML 문자열에서 텍스트 콘텐츠 추출
    - **`robots-parser`**: `robots.txt` 파일을 파싱하여 크롤링 정책 준수
    - **`xml2js`**: 사이트맵(sitemap.xml)을 파싱하여 크롤링할 URL을 효율적으로 발견
- **크롤링 모드**:
    - **미리 정의된 URL** (기본 선택): 관리자가 사전에 등록한 신뢰할 수 있는 URL 템플릿
    - **사용자 정의 URL**: 사용자가 직접 URL을 입력하여 크롤링
    - **하이브리드**: 위 두 가지 방식을 조합
- **서브페이지 크롤링**: 초기 URL에서 링크를 따라가며 관련 서브페이지를 자동으로 발견하고 크롤링
- **URL 그룹화**: `DocumentGroupingService`를 통해 크롤링된 URL 문서를 도메인별로 그룹화하여 관리 및 시각화

## 2. 문서 처리 (Document Processing) ✅ 완성
- **청킹 (Chunking)**:
    - **목적**: 긴 문서를 작은 의미 단위(청크)로 분할하여 임베딩 및 검색 효율성 향상
    - **구현**: `RecursiveCharacterTextSplitter` 사용
        - `chunkSize: 800`, `chunkOverlap: 100`
        - 문장 경계를 고려한 분할
        - 무한 루프 방지를 위한 `maxIterations = 10000` 로직
    - **파일 타입**: URL 콘텐츠는 `text/html`로 간주하여 텍스트 추출 후 청킹
- **임베딩 (Embedding)**:
    - **목적**: 텍스트 청크를 고차원 벡터 공간의 숫자 표현으로 변환하여 의미적 유사도 계산
    - **모델**: `Xenova/bge-m3` 임베딩 모델 사용
    - **차원**: `EMBEDDING_DIM` 환경 변수를 통해 임베딩 차원 설정 (기본값 1024)
    - **생성**: `RAGProcessor`의 `generateSimpleEmbedding` 메서드를 통해 임베딩 생성

## 3. 데이터 저장 및 관리 (Data Storage & Management) ✅ 완성
- **Supabase**: PostgreSQL 데이터베이스를 백엔드로 사용하며, `pgvector` 확장을 통해 벡터 임베딩 저장 및 유사도 검색 수행
- **테이블 스키마**:
    - `documents`: 원본 문서(URL 포함)의 메타데이터(ID, 제목, URL, 타입, 상태, 청크 수, 생성/수정 시간 등) 저장
    - `document_chunks`: 각 문서의 청크 내용, 임베딩 벡터, 메타데이터(원본 문서 ID, 청크 인덱스 등) 저장
- **중복 처리**:
    - **URL 중복**: 기존에 크롤링된 URL이 다시 입력되면 새로운 문서를 생성하는 대신 기존 문서를 재인덱싱(기존 청크 삭제 후 재처리)
    - **파일 중복**: 파일 업로드 시 파일명과 크기를 기준으로 중복을 검사하고, 사용자에게 덮어쓰기/건너뛰기 옵션 제공
- **벌크 작업**: 선택된 URL 문서들을 일괄 삭제하는 기능 제공
- **성능 최적화**:
    - `maintenance_work_mem: 64MB` 설정
    - 벡터 인덱스 `lists: 50` 파라미터로 메모리 사용량 최적화

## 4. RAG 검색 및 답변 생성 (RAG Search & Answer Generation) ✅ 완성
- **검색 흐름**:
    1. 사용자 쿼리 입력
    2. `RAGProcessor`의 `searchSimilarChunks` 메서드를 호출하여 쿼리 임베딩 생성
    3. Supabase의 `search_documents` RPC 함수를 사용하여 벡터 유사도 검색 수행
    4. (선택적) 벡터 검색 실패 시 키워드 기반 검색으로 폴백
    5. 검색된 관련 청크들을 LLM(Gemini)에 전달
    6. LLM이 관련 청크를 기반으로 사용자 질문에 답변 생성
- **LLM**: Google Gemini 모델 사용 (gemini-2.5-flash-lite, gemini-2.0-flash-exp)
- **소스 제공**: 답변과 함께 참조된 문서(URL)의 제목과 URL을 제공하여 답변의 신뢰성 향상
- **성능**: 벡터 유사도 0.999+ 달성, 평균 3-9초 내 답변 생성

## 5. 관리자 대시보드 (Admin Dashboard) ✅ 완성
- **문서 목록**: 업로드된 파일 및 크롤링된 URL 문서 목록을 표시
- **통계**: 전체 문서 수, 완료된 문서 수, 총 청크 수 등의 통계 제공
- **URL 크롤링 페이지**:
    - 크롤링 모드 선택 UI (기본값: "미리 정의된 URL")
    - 미리 정의된 URL 템플릿 관리 (추가, 수정, 삭제)
    - 사용자 정의 URL 입력 및 크롤링 시작
    - 크롤링 진행 상황 및 결과 표시
    - 크롤링된 URL 문서 목록 표시 및 관리 (선택, 삭제, 재인덱싱)
- **UI/UX**:
    - 파일 및 URL 문서의 타입(PDF, DOCX, TXT, URL)을 명확히 표시
    - 벌크 선택 및 삭제 기능
    - 다운로드 및 미리보기 기능 제거 (사용자 요청에 따라)

## 6. 환경 설정 ✅ 완성
- `.env.local`: Supabase URL, Service Role Key, Gemini API Key, 임베딩 차원(`EMBEDDING_DIM`) 등 민감한 정보를 환경 변수로 관리
- **필수 환경 변수**:
    - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
    - `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키
    - `GOOGLE_API_KEY`: Google Gemini API 키
    - `EMBEDDING_DIM`: 임베딩 차원 (기본값: 1024)

## 7. 성능 및 최적화 ✅ 완성
- **벡터 검색 성능**: 유사도 0.999+ 달성
- **응답 시간**: 평균 3-9초 내 답변 생성
- **메모리 최적화**: Supabase `maintenance_work_mem` 설정 및 벡터 인덱스 최적화
- **함수 오버로딩 해결**: Supabase `search_documents` 함수 시그니처 통일
- **한국어 지원**: 키워드 매칭 로직 개선으로 한국어 질문 처리 최적화

## 8. 문제 해결 및 디버깅 ✅ 완성
- **CSS 로딩 오류**: `.next` 캐시 삭제 및 서버 재시작으로 해결
- **벡터 검색 오류**: 함수 오버로딩 문제 해결
- **메모리 부족**: Supabase 설정 최적화
- **키워드 매칭**: 한국어 지원 개선

## 9. 최종 성과 ✅ 완성
- **총 문서 수**: 12개 URL 문서
- **총 청크 수**: 1,266개 청크
- **완료된 문서**: 12개 (100% 완료)
- **실패한 문서**: 0개
- **RAG 시스템**: 완전 정상 작동
- **사용자 경험**: 직관적인 UI, 빠른 응답, 정확한 답변

## 10. 향후 개선 사항
- 다국어 지원 (영어)
- 팀/부서별 접근 권한 세분화
- 모바일 앱 개발
- 서드파티 슬랙 연동
- 실시간 협업 기능

---

**최종 업데이트**: 2025-09-20
**버전**: 2.0.0 (완성)
**상태**: 프로덕션 준비 완료 ✅