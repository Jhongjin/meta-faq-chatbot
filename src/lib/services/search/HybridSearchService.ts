/**
 * 하이브리드 검색 서비스
 * 벡터 검색(Dense)과 키워드 검색(Sparse)을 RRF로 결합하여 검색 품질 향상
 *
 * 전략:
 * - Dense: 벡터 유사도 기반 (의미적 유사성)
 * - Sparse: BM25 기반 키워드 매칭 (정확한 텍스트 매칭)
 * - RRF (Reciprocal Rank Fusion)로 두 결과 통합
 */

import type { ChunkData } from '../RAGProcessor';

export interface HybridSearchResult extends ChunkData {
  hybridScore?: number;
  vectorScore?: number;
  keywordScore?: number;
}

export interface HybridSearchOptions {
  vectorWeight?: number;
  keywordWeight?: number;
  maxResults?: number;
  deduplicate?: boolean;
  /** RRF k 상수 (기본값: 60, 높을수록 상위 랭크 가중치 감소) */
  rrfK?: number;
}

/**
 * BM25 파라미터
 */
const BM25_K1 = 1.5; // term saturation
const BM25_B = 0.75; // length normalization

/**
 * BM25 점수 계산
 */
function calculateBM25Score(
  queryKeywords: string[],
  content: string,
  avgDocLength: number
): number {
  if (queryKeywords.length === 0) return 0;

  const terms = content.toLowerCase().split(/\s+/);
  const docLength = terms.length || 1;
  const termFreqMap = new Map<string, number>();

  for (const term of terms) {
    termFreqMap.set(term, (termFreqMap.get(term) || 0) + 1);
  }

  let score = 0;
  for (const keyword of queryKeywords) {
    const kw = keyword.toLowerCase();
    // 정확 매칭 + 부분 매칭 (한국어 지원)
    let tf = termFreqMap.get(kw) || 0;
    if (tf === 0) {
      // 부분 문자열 매칭 (한국어 형태소 대응)
      for (const [term, freq] of termFreqMap) {
        if (term.includes(kw) || kw.includes(term)) {
          tf += freq * 0.5; // 부분 매칭은 절반 가중
        }
      }
    }

    if (tf === 0) continue;

    // BM25 TF normalization
    const tfNorm = (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLength / avgDocLength)));

    // IDF 근사 (전체 컬렉션 없이): 키워드 길이와 중요도로 추정
    const idf = keyword.length > 2 ? 1.5 : 1.0;

    score += tfNorm * idf;
  }

  // 0~1 정규화
  return Math.min(1.0, score / queryKeywords.length);
}

/**
 * RRF (Reciprocal Rank Fusion)로 두 랭킹 결합
 * score(d) = Σ 1/(k + rank_i(d))
 */
function reciprocalRankFusion(
  vectorResults: ChunkData[],
  keywordResults: ChunkData[],
  k: number = 60
): Map<string, { score: number; result: ChunkData }> {
  const scores = new Map<string, { score: number; result: ChunkData }>();

  // 벡터 검색 랭킹 반영
  vectorResults.forEach((result, rank) => {
    const id = result.chunkId || result.id || '';
    if (!id) return;
    const existing = scores.get(id);
    const rrfScore = 1 / (k + rank + 1);
    if (existing) {
      existing.score += rrfScore;
    } else {
      scores.set(id, { score: rrfScore, result });
    }
  });

  // 키워드 검색 랭킹 반영
  keywordResults.forEach((result, rank) => {
    const id = result.chunkId || result.id || '';
    if (!id) return;
    const existing = scores.get(id);
    const rrfScore = 1 / (k + rank + 1);
    if (existing) {
      existing.score += rrfScore;
    } else {
      scores.set(id, { score: rrfScore, result });
    }
  });

  return scores;
}

/**
 * 하이브리드 검색 결과 결합 (RRF 방식)
 */
export function combineHybridSearchResults(
  vectorResults: ChunkData[],
  keywordResults: ChunkData[],
  options: HybridSearchOptions = {}
): ChunkData[] {
  const {
    maxResults = 10,
    deduplicate = true,
    rrfK = 60,
  } = options;

  // RRF로 결합
  const rrfScores = reciprocalRankFusion(vectorResults, keywordResults, rrfK);

  // 점수 기준 정렬
  const hybridResults = Array.from(rrfScores.values())
    .sort((a, b) => b.score - a.score)
    .map(({ score, result }) => ({
      ...result,
      similarity: score, // RRF 점수를 similarity로 사용 (재랭킹에 활용)
    }));

  // 중복 제거 (같은 문서의 여러 청크 중 최고 점수만 유지)
  let finalResults: ChunkData[] = hybridResults;
  if (deduplicate) {
    const documentMap = new Map<string, ChunkData>();
    for (const result of hybridResults) {
      const docId = result.documentId || result.metadata?.document_id || '';
      if (!docId) {
        finalResults.push(result);
        continue;
      }
      const existing = documentMap.get(docId);
      if (!existing || (result.similarity || 0) > (existing.similarity || 0)) {
        documentMap.set(docId, result);
      }
    }
    finalResults = Array.from(documentMap.values())
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  }

  return finalResults.slice(0, maxResults);
}

/**
 * BM25 기반 키워드 점수 부여
 */
export function scoreKeywordResults(
  results: ChunkData[],
  queryKeywords: string[]
): ChunkData[] {
  if (results.length === 0 || queryKeywords.length === 0) return results;

  // 평균 문서 길이 계산 (BM25 length normalization에 필요)
  const avgDocLength = results.reduce((sum, r) => {
    return sum + (r.content || '').split(/\s+/).length;
  }, 0) / results.length;

  return results.map(result => ({
    ...result,
    similarity: calculateBM25Score(queryKeywords, result.content || '', avgDocLength),
  }));
}
