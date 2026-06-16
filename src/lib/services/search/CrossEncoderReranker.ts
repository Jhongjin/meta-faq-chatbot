/**
 * Cross-Encoder 재랭킹 서비스
 *
 * crossEncoderRerankAsync: @xenova/transformers 기반 실제 ML 모델 사용
 *   - 모델: Xenova/bge-reranker-base (다국어 지원, ~22MB ONNX)
 *   - 쿼리-문서 쌍을 신경망이 직접 스코어링
 *   - 실패 시 crossEncoderRerank(rule-based)로 자동 fallback
 *
 * crossEncoderRerank: 규칙 기반 fallback (동기, 항상 사용 가능)
 */

import type { ChunkData } from '../RAGProcessor';

export interface CrossEncoderRerankingOptions {
  query: string;
  queryKeywords?: string[];
  weights?: {
    vectorSimilarity?: number;
    keywordMatch?: number;
    sectionTitle?: number;
    documentTitle?: number;
    keywordDensity?: number;
  };
  minRelevanceScore?: number;
}

// 싱글톤 모델 캐시 (첫 번째 호출 시 로드)
let rerankerPipeline: any = null;
let rerankerLoading: Promise<any> | null = null;

/**
 * Cross-Encoder 파이프라인 로드 (싱글톤)
 */
async function getRerankerPipeline(): Promise<any> {
  if (rerankerPipeline) return rerankerPipeline;

  // 동시 다중 호출 방지
  if (rerankerLoading) return rerankerLoading;

  rerankerLoading = (async () => {
    console.log('📦 Cross-Encoder 모델 로딩 중: Xenova/bge-reranker-base');

    const isVercel = process.env.VERCEL === '1';
    if (isVercel) {
      process.env.HF_HOME = '/tmp/.cache';
      process.env.TRANSFORMERS_CACHE = '/tmp/.cache/transformers';
    }

    const { pipeline } = await import('@xenova/transformers');
    rerankerPipeline = await pipeline('text-classification', 'Xenova/bge-reranker-base', {
      cache_dir: isVercel ? '/tmp/.cache/transformers' : undefined,
    });

    console.log('✅ Cross-Encoder 모델 로딩 완료');
    return rerankerPipeline;
  })();

  try {
    const result = await rerankerLoading;
    return result;
  } catch (err) {
    rerankerLoading = null; // 실패 시 재시도 허용
    throw err;
  }
}

/**
 * 실제 ML Cross-Encoder 재랭킹 (비동기)
 * 실패 시 규칙 기반 fallback 자동 적용
 */
export async function crossEncoderRerankAsync(
  chunks: ChunkData[],
  options: CrossEncoderRerankingOptions
): Promise<ChunkData[]> {
  if (chunks.length === 0) return chunks;

  const { query } = options;

  try {
    const reranker = await getRerankerPipeline();

    // 쿼리-문서 쌍 생성 (내용 512자 제한)
    const inputs = chunks.map(chunk => ({
      text: query,
      text_pair: (chunk.content || '').substring(0, 512),
    }));

    const scores = await reranker(inputs, {
      function_to_apply: 'sigmoid',
      batch_size: 8,
    });

    // 점수 부착 후 내림차순 정렬
    const scored = chunks.map((chunk, i) => ({
      ...chunk,
      similarity: Array.isArray(scores) ? (scores[i]?.score ?? 0) : (scores?.score ?? 0),
    }));

    const result = scored.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    console.log(`✅ ML Cross-Encoder 재랭킹 완료: ${result.length}개`);
    return result;

  } catch (error) {
    console.warn('⚠️ ML Cross-Encoder 실패, 규칙 기반 fallback 사용:', (error as Error).message);
    return crossEncoderRerank(chunks, options);
  }
}

// ─── 규칙 기반 Fallback (동기) ───────────────────────────────────────────────

function calculateTFIDFScore(
  queryKeywords: string[],
  content: string,
  documentTitle: string = ''
): number {
  if (queryKeywords.length === 0) return 0;

  const contentLower = content.toLowerCase();
  const titleLower = documentTitle.toLowerCase();
  const combinedText = `${titleLower} ${contentLower}`;
  const totalWords = combinedText.split(/\s+/).length;

  let totalScore = 0;
  for (const keyword of queryKeywords) {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
    const matches = combinedText.match(regex);
    const frequency = matches ? matches.length : 0;

    if (frequency > 0) {
      const tf = frequency / totalWords;
      const titleBoost = titleLower.includes(keywordLower) ? 2.0 : 1.0;
      const idf = keyword.length > 3 ? 1.5 : 1.0;
      totalScore += tf * idf * titleBoost;
    }
  }

  return Math.min(1.0, totalScore / queryKeywords.length);
}

function calculateSentenceSimilarity(query: string, content: string): number {
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 1));
  const contentWords = new Set(content.toLowerCase().split(/\s+/).filter(w => w.length > 1));

  if (queryWords.size === 0 || contentWords.size === 0) return 0;

  const intersection = new Set([...queryWords].filter(w => contentWords.has(w)));
  const union = new Set([...queryWords, ...contentWords]);
  return intersection.size / union.size;
}

function calculateKeywordDensity(queryKeywords: string[], content: string): number {
  if (queryKeywords.length === 0) return 0;
  const contentLower = content.toLowerCase();
  const matched = queryKeywords.filter(kw => contentLower.includes(kw.toLowerCase())).length;
  return matched / queryKeywords.length;
}

/**
 * 규칙 기반 Cross-Encoder 재랭킹 (동기, fallback용)
 */
export function crossEncoderRerank(
  chunks: ChunkData[],
  options: CrossEncoderRerankingOptions
): ChunkData[] {
  const {
    query,
    queryKeywords = [],
    weights = {},
    minRelevanceScore = 0.05,
  } = options;

  const {
    vectorSimilarity = 0.35,
    keywordMatch = 0.35,
    sectionTitle = 0.15,
    documentTitle = 0.1,
    keywordDensity = 0.05,
  } = weights;

  const keywords = queryKeywords.length > 0
    ? queryKeywords
    : query.toLowerCase().split(/\s+/)
        .filter(w => w.length > 1)
        .filter(w => !['에', '를', '을', '의', '와', '과', '은', '는', '이', '가', '어떻게', '무엇', '왜', '언제', '어디'].includes(w));

  const queryLower = query.toLowerCase();
  const importantKeywords = ['광고', '정책', '계정', '생성', '등록', '절차', '방법', '설정', '관리', '인증', '차단', '비활성화', '해제'];

  const scoredChunks = chunks.map(chunk => {
    const content = (chunk.content || '').toLowerCase();
    const docTitle = (chunk.metadata?.document_title || chunk.metadata?.source || '').toLowerCase();
    const sectionTitleText = (chunk.metadata?.section_title || '').toLowerCase();

    const vectorScore = Math.max(0, Math.min(1, chunk.similarity || 0));
    const tfidfScore = calculateTFIDFScore(keywords, content, docTitle);

    const sectionTitleScore = sectionTitleText && keywords.length > 0
      ? keywords.filter(kw => sectionTitleText.includes(kw.toLowerCase())).length / keywords.length
      : 0;

    const docTitleScore = docTitle && keywords.length > 0
      ? keywords.filter(kw => docTitle.includes(kw.toLowerCase())).length / keywords.length
      : 0;

    const densityScore = calculateKeywordDensity(keywords, content);
    const sentenceSimilarity = calculateSentenceSimilarity(query, content);

    let boost = 0;
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      const exactMatch = new RegExp(`\\b${kw}\\b`, 'i');
      if (exactMatch.test(content)) {
        boost += 0.15;
        if (importantKeywords.some(ik => kw.includes(ik))) boost += 0.1;
      } else if (content.includes(kw)) {
        boost += 0.08;
      }
      if (docTitle.includes(kw)) boost += 0.1;
      if (sectionTitleText.includes(kw)) boost += 0.15;
    }
    if (content.includes(queryLower)) boost += 0.25;

    const baseScore =
      vectorScore * vectorSimilarity +
      tfidfScore * keywordMatch +
      sectionTitleScore * sectionTitle +
      docTitleScore * documentTitle +
      densityScore * keywordDensity +
      sentenceSimilarity * 0.1;

    const finalScore = Math.min(1.0, baseScore + boost);
    if (finalScore < minRelevanceScore) return null;

    return { ...chunk, similarity: finalScore, _score: finalScore } as ChunkData & { _score: number };
  }).filter((c): c is ChunkData & { _score: number } => c !== null);

  return scoredChunks
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...chunk }) => chunk as ChunkData);
}
