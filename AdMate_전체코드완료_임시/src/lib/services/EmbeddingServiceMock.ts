// 임시 Mock 임베딩 서비스 (빌드 오류 방지용)

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

export class EmbeddingService {
  private isInitialized = false;
  private currentModel: string | null = null;

  /**
   * 임베딩 모델 초기화 (Mock)
   */
  async initialize(model: string = 'bge-m3'): Promise<void> {
    console.log(`Mock 임베딩 모델 초기화: ${model}`);
    this.currentModel = model;
    this.isInitialized = true;
  }

  /**
   * 단일 텍스트에 대한 임베딩 생성 (Mock)
   */
  async generateEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const startTime = Date.now();
    
    if (!this.isInitialized) {
      await this.initialize(options.model);
    }

    // Mock 임베딩 생성 (1024차원 랜덤 벡터)
    const embedding = Array.from({ length: 1024 }, () => Math.random() - 0.5);
    const processingTime = Date.now() - startTime;

    return {
      embedding,
      model: this.currentModel || 'bge-m3',
      dimension: 1024,
      processingTime
    };
  }

  /**
   * 여러 텍스트에 대한 배치 임베딩 생성 (Mock)
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult[]> {
    const startTime = Date.now();
    
    if (!this.isInitialized) {
      await this.initialize(options.model);
    }

    const results: EmbeddingResult[] = [];

    for (const text of texts) {
      const embedding = Array.from({ length: 1024 }, () => Math.random() - 0.5);
      results.push({
        embedding,
        model: this.currentModel || 'bge-m3',
        dimension: 1024,
        processingTime: Date.now() - startTime
      });
    }

    console.log(`Mock 배치 임베딩 생성 완료: ${texts.length}개 텍스트`);
    return results;
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
      name: this.currentModel || 'bge-m3-mock',
      dimension: 1024,
      maxTokens: 8192
    };
  }

  /**
   * 리소스 정리
   */
  async cleanup(): Promise<void> {
    this.isInitialized = false;
    this.currentModel = null;
    console.log('Mock 임베딩 서비스 정리 완료');
  }
}

// 싱글톤 인스턴스
export const embeddingService = new EmbeddingService();

