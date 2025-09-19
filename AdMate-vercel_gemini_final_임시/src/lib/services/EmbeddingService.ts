// pipeline은 동적으로 import

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
  private pipeline: any = null;
  private currentModel: string | null = null;
  private isInitialized = false;

  /**
   * 임베딩 모델 초기화
   */
  async initialize(model: string = 'bge-m3'): Promise<void> {
    try {
      if (this.isInitialized && this.currentModel === model) {
        console.log('임베딩 모델이 이미 초기화됨:', model);
        return;
      }

      console.log(`🔄 임베딩 모델 초기화 중: ${model} (처음 로드 시 시간이 걸릴 수 있습니다)`);
      
      // 동적으로 pipeline을 import하여 빌드 시 오류 방지
      const { pipeline } = await import('@xenova/transformers');
      
      // BGE-M3 모델 사용 (한국어 지원 우수)
      this.pipeline = await pipeline('feature-extraction', 'Xenova/bge-m3', {
        // 모델 로딩 최적화
        quantized: true,
        // 캐시 사용
        cache_dir: './.cache/transformers',
        // 추가 옵션
        local_files_only: false,
        revision: 'main'
      });
      this.currentModel = model;
      this.isInitialized = true;
      
      console.log('✅ 임베딩 모델 초기화 완료 - BGE-M3 (1024차원)');
    } catch (error) {
      console.error('❌ 임베딩 모델 초기화 실패:', error);
      console.error('상세 오류:', error);
      
      // 초기화 실패 시 더미 모드로 전환하지 않고 오류를 던짐
      throw new Error(`임베딩 모델 초기화 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 단일 텍스트에 대한 임베딩 생성
   */
  async generateEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        console.log('🔄 임베딩 서비스 초기화 중...');
        await this.initialize(options.model);
      }

      if (!this.pipeline) {
        throw new Error('임베딩 파이프라인이 초기화되지 않았습니다.');
      }

      // 텍스트 전처리
      const processedText = this.preprocessText(text);
      
      // 빈 텍스트 검증
      if (!processedText || processedText.trim().length === 0) {
        throw new Error('빈 텍스트는 임베딩을 생성할 수 없습니다.');
      }
      
      console.log(`🔄 임베딩 생성 중: "${processedText.substring(0, 50)}..."`);
      
      // 임베딩 생성
      const result = await this.pipeline(processedText, {
        pooling: 'mean',
        normalize: options.normalize ?? true
      });

      // 결과 검증
      if (!result || !result.data) {
        throw new Error('임베딩 생성 결과가 유효하지 않습니다.');
      }

      // 결과 처리
      const embedding = Array.from(result.data) as number[];
      
      // 임베딩 유효성 검증
      if (!embedding || embedding.length === 0) {
        throw new Error('생성된 임베딩이 비어있습니다.');
      }

      // 차원 수 검증 (OpenAI text-embedding-3-small는 1536차원)
      const expectedDimension = 1536;
      if (embedding.length !== expectedDimension) {
        console.warn(`⚠️ 임베딩 차원 수 불일치: ${embedding.length} (예상: ${expectedDimension})`);
        // 차원이 다르더라도 계속 진행 (호환성을 위해)
      }

      // 숫자 배열 검증
      if (!embedding.every(item => typeof item === 'number' && !isNaN(item))) {
        throw new Error('임베딩에 유효하지 않은 숫자가 포함되어 있습니다.');
      }

      const dimension = embedding.length;
      const processingTime = Date.now() - startTime;

      console.log(`✅ 임베딩 생성 성공: ${dimension}차원, ${processingTime}ms`);

      return {
        embedding,
        model: this.currentModel || 'bge-m3',
        dimension,
        processingTime
      };
    } catch (error) {
      console.error('❌ 임베딩 생성 실패:', error);
      
      // 초기화 실패인 경우 더미 모드로 전환
      if (error instanceof Error && error.message.includes('초기화 실패')) {
        console.warn('⚠️ 임베딩 모델 초기화 실패로 더미 모드로 전환합니다.');
        
        const dummyEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5);
        
        return {
          embedding: dummyEmbedding,
          model: 'dummy',
          dimension: 1536,
          processingTime: Date.now() - startTime
        };
      }
      
      // 다른 오류는 그대로 던짐
      throw error;
    }
  }

  /**
   * 여러 텍스트에 대한 배치 임베딩 생성
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult[]> {
    const startTime = Date.now();
    const batchSize = options.batchSize || 10;
    const results: EmbeddingResult[] = [];

    try {
      if (!this.isInitialized) {
        await this.initialize(options.model);
      }

      if (!this.pipeline) {
        throw new Error('임베딩 파이프라인이 초기화되지 않았습니다.');
      }

      // 배치 처리
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const processedBatch = batch.map(text => this.preprocessText(text));
        
        console.log(`배치 처리 중: ${i + 1}-${Math.min(i + batchSize, texts.length)}/${texts.length}`);
        
        const batchResults = await Promise.all(
          processedBatch.map(async (text) => {
            const result = await this.pipeline!(text, {
              pooling: 'mean',
              normalize: options.normalize ?? true
            });
            
            return {
              embedding: Array.from(result.data) as number[],
              model: this.currentModel || 'bge-m3',
              dimension: result.data.length,
              processingTime: Date.now() - startTime
            };
          })
        );
        
        results.push(...batchResults);
      }

      console.log(`배치 임베딩 생성 완료: ${texts.length}개 텍스트, ${Date.now() - startTime}ms`);
      return results;
    } catch (error) {
      console.error('배치 임베딩 생성 실패:', error);
      throw new Error(`배치 임베딩 생성 실패: ${error}`);
    }
  }

  /**
   * 텍스트 전처리 (한국어 최적화)
   */
  private preprocessText(text: string): string {
    return text
      .trim()
      // 불필요한 공백 제거
      .replace(/\s+/g, ' ')
      // 특수 문자 정리
      .replace(/[^\w\s가-힣.,!?;:()\[\]{}"'`~@#$%^&*+=|\\/<>]/g, '')
      // 연속된 구두점 정리
      .replace(/[.]{2,}/g, '.')
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?')
      // 최대 길이 제한 (BGE-M3는 8192 토큰 제한)
      .slice(0, 4000);
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
    // BGE-M3는 1024차원
    return 1024;
  }

  /**
   * 모델 정보 반환
   */
  getModelInfo(): { name: string; dimension: number; maxTokens: number } {
    return {
      name: this.currentModel || 'bge-m3',
      dimension: this.getEmbeddingDimension(),
      maxTokens: 8192
    };
  }

  /**
   * 리소스 정리
   */
  async cleanup(): Promise<void> {
    if (this.pipeline) {
      // Transformers.js는 명시적인 cleanup이 필요하지 않음
      this.pipeline = null;
      this.isInitialized = false;
      this.currentModel = null;
    }
  }
}

// 싱글톤 인스턴스
export const embeddingService = new EmbeddingService();
