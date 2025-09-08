// 테스트용 간단한 임베딩 서비스
// 실제 임베딩 모델 대신 랜덤 벡터를 생성하여 테스트

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimension: number;
  processingTime: number;
}

export interface EmbeddingOptions {
  model?: 'bge-m3' | 'all-MiniLM-L6-v2' | 'openai';
  batchSize?: number;
  normalize?: boolean;
}

export class EmbeddingServiceTest {
  private isInitialized = false;
  private currentModel: string | null = null;

  /**
   * 임베딩 모델 초기화 (테스트용)
   */
  async initialize(model: string = 'bge-m3'): Promise<void> {
    console.log(`테스트용 임베딩 모델 초기화: ${model}`);
    this.currentModel = model;
    this.isInitialized = true;
  }

  /**
   * 단일 텍스트에 대한 임베딩 생성 (테스트용)
   */
  async generateEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const startTime = Date.now();
    
    if (!this.isInitialized) {
      await this.initialize(options.model);
    }

    // 텍스트 기반 시드로 일관된 랜덤 벡터 생성
    const seed = this.textToSeed(text);
    const embedding = this.generateConsistentVector(seed, 1024);
    const processingTime = Date.now() - startTime;

    return {
      embedding,
      model: this.currentModel || 'bge-m3',
      dimension: 1024,
      processingTime
    };
  }

  /**
   * 여러 텍스트에 대한 배치 임베딩 생성 (테스트용)
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult[]> {
    const startTime = Date.now();
    const results: EmbeddingResult[] = [];

    if (!this.isInitialized) {
      await this.initialize(options.model);
    }

    for (const text of texts) {
      const result = await this.generateEmbedding(text, options);
      results.push(result);
    }

    console.log(`테스트용 배치 임베딩 생성 완료: ${texts.length}개 텍스트, ${Date.now() - startTime}ms`);
    return results;
  }

  /**
   * 텍스트를 시드로 변환
   */
  private textToSeed(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  }

  /**
   * 시드 기반 일관된 랜덤 벡터 생성
   */
  private generateConsistentVector(seed: number, dimension: number): number[] {
    const vector: number[] = [];
    let currentSeed = seed;
    
    for (let i = 0; i < dimension; i++) {
      // 간단한 선형 합동 생성기
      currentSeed = (currentSeed * 1664525 + 1013904223) % 2147483647;
      const normalized = (currentSeed / 2147483647) * 2 - 1; // -1 ~ 1 범위
      vector.push(normalized);
    }
    
    return vector;
  }

  /**
   * 임베딩 유사도 계산 (코사인 유사도)
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('임베딩 차원이 일치하지 않습니다.');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * 벡터 정규화
   */
  normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude === 0 ? vector : vector.map(val => val / magnitude);
  }

  /**
   * 임베딩 차원 확인
   */
  getEmbeddingDimension(): number {
    return 1024;
  }

  /**
   * 모델 정보 반환
   */
  getModelInfo(): { name: string; dimension: number; maxTokens: number } {
    return {
      name: this.currentModel || 'bge-m3-test',
      dimension: this.getEmbeddingDimension(),
      maxTokens: 8192
    };
  }

  /**
   * 리소스 정리
   */
  async cleanup(): Promise<void> {
    this.isInitialized = false;
    this.currentModel = null;
  }
}

// 싱글톤 인스턴스
export const embeddingService = new EmbeddingServiceTest();

