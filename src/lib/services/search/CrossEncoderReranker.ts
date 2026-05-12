/**
 * Cross-Encoder 스타일 재랭킹 서비스
 * 쿼리와 문서 간의 관련성을 더 정교하게 계산하여 검색 결과를 재정렬
 * 
 * Cross-Encoder는 쿼리와 문서를 동시에 입력받아 관련성을 평가하는 모델입니다.
 * 실제 Cross-Encoder 모델을 사용하지 않고도, 다양한 신호를 결합하여 관련성을 평가합니다.
 */

import type { ChunkData } from '../RAGProcessor';

export interface CrossEncoderRerankingOptions {
  query: string;
  queryKeywords?: string[];
  /**
   * 가중치 설정
   */
  weights?: {
    vectorSimilarity?: number; // 벡터 유사도 가중치 (기본: 0.5)
    keywordMatch?: number; // 키워드 매칭 가중치 (기본: 0.2)
    sectionTitle?: number; // 섹션 제목 일치 가중치 (기본: 0.15)
    documentTitle?: number; // 문서 제목 일치 가중치 (기본: 0.1)
    keywordDensity?: number; // 키워드 밀도 가중치 (기본: 0.05)
  };
  /**
   * 최소 관련성 점수 (이 점수 미만은 제외)
   */
  minRelevanceScore?: number;
}

/**
 * TF-IDF 기반 키워드 점수 계산
 */
function calculateTFIDFScore(
  queryKeywords: string[],
  content: string,
  documentTitle: string = ''
): number {
  if (queryKeywords.length === 0) return 0;

  const contentLower = content.toLowerCase();
  const titleLower = documentTitle.toLowerCase();
  const combinedText = `${titleLower} ${contentLower}`;

  let totalScore = 0;
  const wordCounts = new Map<string, number>();
  const totalWords = combinedText.split(/\s+/).length;

  // 각 키워드의 빈도 계산
  for (const keyword of queryKeywords) {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
    const matches = combinedText.match(regex);
    const frequency = matches ? matches.length : 0;
    
    if (frequency > 0) {
      // TF (Term Frequency): 키워드 빈도 / 전체 단어 수
      const tf = frequency / totalWords;
      
      // 제목에 있으면 가중치 증가
      const titleBoost = titleLower.includes(keywordLower) ? 2.0 : 1.0;
      
      // IDF는 간단히 역빈도로 근사 (실제로는 전체 문서 집합 필요)
      // 여기서는 키워드 길이와 중요도를 고려
      const idf = keyword.length > 3 ? 1.5 : 1.0;
      
      const keywordScore = tf * idf * titleBoost;
      wordCounts.set(keyword, keywordScore);
      totalScore += keywordScore;
    }
  }

  // 정규화 (0-1 범위)
  return Math.min(1.0, totalScore / queryKeywords.length);
}

/**
 * 문장 유사도 점수 계산 (간단한 Jaccard 유사도)
 */
function calculateSentenceSimilarity(query: string, content: string): number {
  const queryWords = new Set(
    query.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 1)
  );
  
  const contentWords = new Set(
    content.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 1)
  );

  if (queryWords.size === 0 || contentWords.size === 0) return 0;

  // 교집합
  const intersection = new Set([...queryWords].filter(w => contentWords.has(w)));
  
  // 합집합
  const union = new Set([...queryWords, ...contentWords]);

  // Jaccard 유사도
  return intersection.size / union.size;
}

/**
 * 키워드 밀도 계산 (쿼리 키워드가 콘텐츠에 포함된 비율)
 */
function calculateKeywordDensity(queryKeywords: string[], content: string): number {
  if (queryKeywords.length === 0) return 0;

  const contentLower = content.toLowerCase();
  const matchedKeywords = queryKeywords.filter(keyword =>
    contentLower.includes(keyword.toLowerCase())
  ).length;

  return matchedKeywords / queryKeywords.length;
}

/**
 * Cross-Encoder 스타일 재랭킹
 * 다양한 신호를 결합하여 관련성 점수를 계산하고 재정렬
 */
export function crossEncoderRerank(
  chunks: ChunkData[],
  options: CrossEncoderRerankingOptions
): ChunkData[] {
  const {
    query,
    queryKeywords = [],
    weights = {},
    minRelevanceScore = 0.05, // 최소 관련성 점수 (더 많은 후보 확보를 위해 하향 조정)
  } = options;

  // 기본 가중치 최적화
  const {
    vectorSimilarity = 0.35,
    keywordMatch = 0.35,
    sectionTitle = 0.15,
    documentTitle = 0.1,
    keywordDensity = 0.05,
  } = weights;

  // 키워드 추출
  const keywords = queryKeywords.length > 0
    ? queryKeywords
    : query
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 1)
        .filter(word => !['에', '를', '을', '의', '와', '과', '은', '는', '이', '가', '에 대해', '알려주세요', '어떻게', '무엇', '왜', '언제', '어디'].includes(word));

  const queryLower = query.toLowerCase();
  const importantKeywords = ['광고', '정책', '계정', '생성', '등록', '절차', '방법', '설정', '관리', '인증', '차단', '비활성화', '해제'];

  // 각 청크에 관련성 점수 계산
  const scoredChunks = chunks.map(chunk => {
    const content = (chunk.content || '').toLowerCase();
    const docTitle = (chunk.metadata?.document_title || chunk.metadata?.source || '').toLowerCase();
    const sectionTitleText = (chunk.metadata?.section_title || '').toLowerCase();
    
    // 1. 벡터 유사도 점수
    const vectorScore = Math.max(0, Math.min(1, chunk.similarity || 0));

    // 2. TF-IDF 기반 키워드 매칭 점수
    const tfidfScore = calculateTFIDFScore(keywords, content, docTitle);

    // 3. 섹션 제목 일치 점수
    let sectionTitleScore = 0;
    if (sectionTitleText) {
      const matchedKeywords = keywords.filter(keyword =>
        sectionTitleText.includes(keyword.toLowerCase())
      ).length;
      sectionTitleScore = keywords.length > 0 ? matchedKeywords / keywords.length : 0;
    }

    // 4. 문서 제목 일치 점수
    let docTitleScore = 0;
    if (docTitle) {
      const matchedKeywords = keywords.filter(keyword =>
        docTitle.includes(keyword.toLowerCase())
      ).length;
      docTitleScore = keywords.length > 0 ? matchedKeywords / keywords.length : 0;
    }

    // 5. 키워드 밀도 및 문장 유사도
    const densityScore = calculateKeywordDensity(keywords, content);
    const sentenceSimilarity = calculateSentenceSimilarity(query, content);

    // [추가] 수동 부스팅 로직 통합 (RAGProcessor에서 마이그레이션)
    let boost = 0;
    
    // 키워드 기반 부스팅
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      
      // 정확한 단어 매칭 (Word Boundary)
      const exactMatch = new RegExp(`\\b${kw}\\b`, 'i');
      if (exactMatch.test(content)) {
        boost += 0.15; // 정확한 매칭
        
        // 중요 키워드인 경우 추가 부스팅
        if (importantKeywords.some(ik => kw.includes(ik))) {
          boost += 0.1;
        }
      } else if (content.includes(kw)) {
        boost += 0.08; // 부분 매칭
      }

      // 제목 매칭 부스팅
      if (docTitle.includes(kw)) boost += 0.1;
      if (sectionTitleText.includes(kw)) boost += 0.15;
    }

    // 전체 쿼리 포함 부스팅
    if (content.includes(queryLower)) {
      boost += 0.25;
    }

    // 최종 관련성 점수 계산 (가중 평균 + 부스트)
    const baseRelevanceScore =
      vectorScore * vectorSimilarity +
      tfidfScore * keywordMatch +
      sectionTitleScore * sectionTitle +
      docTitleScore * documentTitle +
      densityScore * keywordDensity +
      sentenceSimilarity * 0.1;

    const finalScore = Math.min(1.0, baseRelevanceScore + boost);

    // 최소 관련성 점수 필터링
    if (finalScore < minRelevanceScore) {
      return null;
    }

    return {
      ...chunk,
      similarity: finalScore,
      _crossEncoderScore: finalScore,
    } as ChunkData & { _crossEncoderScore: number };
  }).filter((chunk): chunk is ChunkData & { _crossEncoderScore: number } => chunk !== null);

  // 관련성 점수 기준으로 정렬
  const reranked = scoredChunks.sort((a, b) => {
    return b._crossEncoderScore - a._crossEncoderScore;
  });

  // 내부 점수 제거 및 결과 반환
  return reranked.map(({ _crossEncoderScore, ...chunk }) => chunk);
}

