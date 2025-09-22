# RAG 청킹 및 검색 시스템 개선 방안

## 📊 현재 시스템 분석

### 현재 청킹 로직의 한계점
1. **고정된 청크 크기**: 문서 내용과 관계없이 일정한 크기로 분할
2. **의미 단위 무시**: 문장/문단 경계를 고려하지 않은 기계적 분할
3. **문서 유형별 최적화 부족**: PDF, DOCX, TXT, URL별 특성 미반영
4. **중복 정보 처리**: 겹치는 내용이 여러 청크에 분산
5. **컨텍스트 손실**: 관련 정보가 다른 청크로 분리

### 현재 RAG 로직의 한계점
1. **벡터 검색 오류**: `text <=> vector` 연산자 오류로 키워드 검색에 의존
2. **낮은 검색 정확도**: 유사도 0.5로 고정, 의미적 유사성 부족
3. **출처 정보 부족**: "Unknown Document" 표시, 문서 제목/메타데이터 활용 부족
4. **하이브리드 검색 미구현**: 벡터 + 키워드 + 의미 검색 조합 부족

### 현재 시스템 현황 (2025-09-21 기준)
- **총 문서 수**: 19개 (파일 5개 + URL 14개)
- **총 청크 수**: 827개 (파일 6개 + URL 821개)
- **평균 신뢰도**: 0.392
- **검색 방식**: 키워드 검색 Fallback (벡터 검색 오류)

---

## 🚀 청킹 로직 개선 방안

### 1. 적응적 청킹 (Adaptive Chunking)

```typescript
interface AdaptiveChunkingConfig {
  documentType: 'pdf' | 'docx' | 'txt' | 'url';
  contentLength: number;
  language: 'ko' | 'en';
  contentType: 'technical' | 'marketing' | 'policy' | 'faq';
}

class AdaptiveChunker {
  // 문서 유형별 최적화
  getChunkingStrategy(config: AdaptiveChunkingConfig): ChunkingStrategy {
    switch (config.documentType) {
      case 'pdf':
        return this.getPDFStrategy(config);
      case 'docx':
        return this.getDOCXStrategy(config);
      case 'txt':
        return this.getTXTStrategy(config);
      case 'url':
        return this.getURLStrategy(config);
    }
  }
}
```

### 2. 의미 기반 청킹 (Semantic Chunking)

```typescript
class SemanticChunker {
  // 문장 임베딩을 이용한 의미적 경계 탐지
  async detectSemanticBoundaries(text: string): Promise<number[]> {
    const sentences = this.splitIntoSentences(text);
    const embeddings = await this.generateEmbeddings(sentences);
    
    // 코사인 유사도로 문장 간 연관성 측정
    const similarities = this.calculateSimilarities(embeddings);
    
    // 유사도가 낮은 지점을 청크 경계로 설정
    return this.findBoundaries(similarities);
  }
}
```

### 3. 계층적 청킹 (Hierarchical Chunking)

```typescript
interface HierarchicalChunk {
  level: 'document' | 'section' | 'paragraph' | 'sentence';
  content: string;
  parentId?: string;
  children: string[];
  metadata: {
    heading?: string;
    importance: number;
    keywords: string[];
  };
}

class HierarchicalChunker {
  // 문서 구조를 유지하면서 청킹
  async createHierarchicalChunks(document: Document): Promise<HierarchicalChunk[]> {
    // 1. 문서 구조 분석 (제목, 섹션, 문단)
    const structure = await this.analyzeDocumentStructure(document);
    
    // 2. 계층별 청킹
    const chunks = await this.chunkByHierarchy(structure);
    
    // 3. 메타데이터 추가
    return this.enrichWithMetadata(chunks);
  }
}
```

### 4. 문서 유형별 특화 청킹

```typescript
class DocumentTypeChunker {
  // FAQ 문서: 질문-답변 단위로 청킹
  chunkFAQ(content: string): Chunk[] {
    const qaPairs = this.extractQAPairs(content);
    return qaPairs.map(qa => ({
      content: `${qa.question}\n\n${qa.answer}`,
      type: 'qa',
      metadata: { question: qa.question, answer: qa.answer }
    }));
  }
  
  // 정책 문서: 조항별 청킹
  chunkPolicy(content: string): Chunk[] {
    const articles = this.extractArticles(content);
    return articles.map(article => ({
      content: article.text,
      type: 'article',
      metadata: { 
        articleNumber: article.number,
        title: article.title,
        importance: article.importance 
      }
    }));
  }
  
  // 마케팅 문서: 섹션별 청킹
  chunkMarketing(content: string): Chunk[] {
    const sections = this.extractSections(content);
    return sections.map(section => ({
      content: section.text,
      type: 'section',
      metadata: { 
        sectionTitle: section.title,
        targetAudience: section.audience,
        callToAction: section.cta 
      }
    }));
  }
}
```

---

## 🔍 RAG 로직 개선 방안

### 1. 하이브리드 검색 시스템

```typescript
class HybridSearchEngine {
  async search(query: string): Promise<SearchResult[]> {
    // 1. 벡터 검색 (의미적 유사성)
    const vectorResults = await this.vectorSearch(query);
    
    // 2. 키워드 검색 (정확한 매칭)
    const keywordResults = await this.keywordSearch(query);
    
    // 3. 의미 검색 (동의어, 관련어)
    const semanticResults = await this.semanticSearch(query);
    
    // 4. 결과 융합 및 재순위화
    return this.fuseAndRerank([vectorResults, keywordResults, semanticResults]);
  }
}
```

### 2. 다단계 검색 파이프라인

```typescript
class MultiStageSearchPipeline {
  async search(query: string): Promise<SearchResult[]> {
    // Stage 1: 초기 검색 (넓은 범위)
    const initialResults = await this.broadSearch(query);
    
    // Stage 2: 필터링 (관련성 높은 결과만)
    const filteredResults = await this.filterRelevant(initialResults, query);
    
    // Stage 3: 재순위화 (다양한 신호 활용)
    const rerankedResults = await this.rerank(filteredResults, query);
    
    // Stage 4: 결과 확장 (관련 문서 추가)
    const expandedResults = await this.expandResults(rerankedResults);
    
    return expandedResults;
  }
}
```

### 3. 컨텍스트 인식 검색

```typescript
class ContextAwareSearch {
  async search(query: string, context: SearchContext): Promise<SearchResult[]> {
    // 1. 쿼리 확장 (동의어, 관련어 추가)
    const expandedQuery = await this.expandQuery(query, context);
    
    // 2. 컨텍스트 기반 필터링
    const contextFilter = this.buildContextFilter(context);
    
    // 3. 검색 실행
    const results = await this.executeSearch(expandedQuery, contextFilter);
    
    // 4. 컨텍스트 기반 재순위화
    return this.rerankByContext(results, context);
  }
}
```

### 4. 지능형 결과 융합

```typescript
class IntelligentResultFusion {
  fuseResults(results: SearchResult[][]): SearchResult[] {
    // 1. 중복 제거
    const deduplicated = this.removeDuplicates(results.flat());
    
    // 2. 신뢰도 계산
    const withConfidence = this.calculateConfidence(deduplicated);
    
    // 3. 다양성 보장
    const diversified = this.ensureDiversity(withConfidence);
    
    // 4. 최종 순위화
    return this.finalRanking(diversified);
  }
}
```

---

## 🛠 기술적 구현 방안

### 1. 벡터 검색 개선

```sql
-- pgvector 확장 및 인덱스 최적화
CREATE EXTENSION IF NOT EXISTS vector;

-- HNSW 인덱스로 검색 성능 향상
CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 하이브리드 검색을 위한 복합 인덱스
CREATE INDEX ON document_chunks USING gin (to_tsvector('korean', content));
```

### 2. 메타데이터 강화

```typescript
interface EnhancedChunkMetadata {
  // 기본 정보
  documentId: string;
  documentTitle: string;
  documentType: string;
  chunkIndex: number;
  
  // 구조적 정보
  sectionTitle?: string;
  headingLevel?: number;
  paragraphIndex?: number;
  
  // 의미적 정보
  keywords: string[];
  entities: string[];
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  
  // 품질 정보
  confidence: number;
  importance: number;
  readability: number;
  
  // 관계 정보
  relatedChunks: string[];
  parentChunk?: string;
  childChunks: string[];
}
```

### 3. 캐싱 및 성능 최적화

```typescript
class OptimizedRAGSystem {
  private embeddingCache = new Map<string, number[]>();
  private searchCache = new Map<string, SearchResult[]>();
  
  async search(query: string): Promise<SearchResult[]> {
    // 1. 캐시 확인
    const cacheKey = this.generateCacheKey(query);
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }
    
    // 2. 검색 실행
    const results = await this.executeSearch(query);
    
    // 3. 캐시 저장
    this.searchCache.set(cacheKey, results);
    
    return results;
  }
}
```

---

## 📈 성능 지표 및 모니터링

### 1. 청킹 품질 지표

```typescript
interface ChunkingQualityMetrics {
  // 구조적 품질
  averageChunkSize: number;
  chunkSizeVariance: number;
  semanticCoherence: number;
  
  // 내용 품질
  informationDensity: number;
  redundancyRate: number;
  completenessScore: number;
  
  // 검색 품질
  retrievalAccuracy: number;
  responseRelevance: number;
  userSatisfaction: number;
}
```

### 2. RAG 성능 지표

```typescript
interface RAGPerformanceMetrics {
  // 검색 성능
  searchLatency: number;
  searchAccuracy: number;
  recallRate: number;
  precisionRate: number;
  
  // 답변 품질
  answerRelevance: number;
  answerCompleteness: number;
  answerAccuracy: number;
  
  // 사용자 경험
  responseTime: number;
  userSatisfaction: number;
  taskCompletionRate: number;
}
```

---

## 🗓 단계별 구현 로드맵

### Phase 1: 기반 인프라 (1-2주)
- [ ] 벡터 검색 오류 수정 (`text <=> vector` 연산자 문제)
- [ ] 메타데이터 스키마 확장
- [ ] 기본 성능 모니터링 구축
- [ ] HNSW 인덱스 최적화

### Phase 2: 청킹 개선 (2-3주)
- [ ] 적응적 청킹 로직 구현
- [ ] 문서 유형별 특화 청킹
- [ ] 계층적 청킹 시스템
- [ ] 의미 기반 청킹 도입

### Phase 3: RAG 고도화 (3-4주)
- [ ] 하이브리드 검색 시스템
- [ ] 다단계 검색 파이프라인
- [ ] 지능형 결과 융합
- [ ] 컨텍스트 인식 검색

### Phase 4: 최적화 및 모니터링 (2-3주)
- [ ] 성능 최적화
- [ ] 고급 캐싱 시스템
- [ ] 실시간 모니터링 대시보드
- [ ] A/B 테스트 프레임워크

---

## 💡 핵심 개선 포인트

### 1. 의미 기반 청킹
- **현재**: 단순 길이 기반 분할
- **개선**: 의미적 경계 기반 분할
- **효과**: 컨텍스트 보존, 검색 정확도 향상

### 2. 하이브리드 검색
- **현재**: 키워드 검색만 사용
- **개선**: 벡터 + 키워드 + 의미 검색 조합
- **효과**: 검색 정확도 및 재현율 향상

### 3. 컨텍스트 보존
- **현재**: 관련 정보 분산
- **개선**: 관련 정보를 함께 유지하는 청킹
- **효과**: 답변 품질 향상

### 4. 지능형 융합
- **현재**: 단순 결과 반환
- **개선**: 다양한 검색 결과를 지능적으로 결합
- **효과**: 답변 완성도 및 신뢰도 향상

### 5. 실시간 최적화
- **현재**: 정적 시스템
- **개선**: 사용자 피드백을 통한 지속적 개선
- **효과**: 지속적인 성능 향상

---

## 🎯 예상 성과

### 현재 상태 (2025-09-21)
- **평균 신뢰도**: 0.392
- **검색 방식**: 키워드 Fallback
- **출처 정보**: "Unknown Document" 다수
- **응답 품질**: 보통

### 개선 후 목표
- **평균 신뢰도**: 0.8+ (2배 향상)
- **검색 방식**: 하이브리드 검색
- **출처 정보**: 정확한 문서 제목 및 메타데이터
- **응답 품질**: 높음

### 비즈니스 임팩트
- **사용자 만족도**: 60% → 85%+
- **질문 해결률**: 70% → 90%+
- **평균 응답 시간**: 4초 → 2초 이하
- **헬프데스크 문의 감소**: 50%+

---

## 📝 구현 우선순위

### 🔥 High Priority (즉시 구현)
1. 벡터 검색 오류 수정
2. 메타데이터 스키마 확장
3. 기본 성능 모니터링

### 🔶 Medium Priority (1-2개월 내)
1. 적응적 청킹 로직
2. 하이브리드 검색 시스템
3. 문서 유형별 특화 청킹

### 🔵 Low Priority (3-6개월 내)
1. 계층적 청킹 시스템
2. 고급 캐싱 시스템
3. A/B 테스트 프레임워크

---

*문서 생성일: 2025-09-21*  
*현재 시스템 상태: 19개 문서, 827개 청크, 평균 신뢰도 0.392*


