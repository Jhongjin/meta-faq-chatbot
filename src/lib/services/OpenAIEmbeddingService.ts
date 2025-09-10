import { OpenAIEmbeddings } from '@langchain/openai';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimension: number;
  processingTime: number;
}

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

export class OpenAIEmbeddingService {
  private embeddings: OpenAIEmbeddings | null = null;
  private isInitialized = false;
  private model: string;
  private dimensions: number;

  constructor() {
    this.model = 'text-embedding-3-small';
    this.dimensions = 1536;
  }

  async initialize(model: string = 'text-embedding-3-small'): Promise<void> {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
      }

      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: openaiApiKey,
        modelName: model,
        dimensions: this.dimensions,
      });

      this.model = model;
      this.isInitialized = true;
      console.log('✅ OpenAI 임베딩 서비스 초기화 완료');
    } catch (error) {
      console.error('❌ OpenAI 임베딩 서비스 초기화 실패:', error);
      throw new Error(`OpenAI 임베딩 서비스 초기화 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateEmbedding(text: string, options: EmbeddingOptions = {}): Promise<EmbeddingResult> {
    const startTime = Date.now();

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.embeddings) {
      throw new Error('임베딩 서비스가 초기화되지 않았습니다.');
    }

    try {
      const embedding = await this.embeddings.embedQuery(text);
      
      // 임베딩 유효성 검증
      if (!embedding || embedding.length === 0) {
        throw new Error('생성된 임베딩이 비어있습니다.');
      }

      // 차원 수 검증 (OpenAI text-embedding-3-small는 1536차원)
      const expectedDimension = 1536;
      if (embedding.length !== expectedDimension) {
        console.warn(`⚠️ 임베딩 차원 수 불일치: ${embedding.length} (예상: ${expectedDimension})`);
      }

      // 숫자 배열 검증
      if (!embedding.every(item => typeof item === 'number' && !isNaN(item))) {
        throw new Error('임베딩에 유효하지 않은 숫자가 포함되어 있습니다.');
      }

      return {
        embedding,
        model: this.model,
        dimension: embedding.length,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ 임베딩 생성 실패:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[], options: EmbeddingOptions = {}): Promise<EmbeddingResult[]> {
    const startTime = Date.now();
    const results: EmbeddingResult[] = [];

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.embeddings) {
      throw new Error('임베딩 서비스가 초기화되지 않았습니다.');
    }

    try {
      const embeddings = await this.embeddings.embedDocuments(texts);
      
      for (let i = 0; i < texts.length; i++) {
        const embedding = embeddings[i];
        
        if (!embedding || embedding.length === 0) {
          console.warn(`⚠️ 텍스트 ${i}의 임베딩이 비어있습니다.`);
          results.push({
            embedding: new Array(1536).fill(0),
            model: this.model,
            dimension: 1536,
            processingTime: 0
          });
          continue;
        }

        results.push({
          embedding,
          model: this.model,
          dimension: embedding.length,
          processingTime: Date.now() - startTime
        });
      }

      return results;

    } catch (error) {
      console.error('❌ 배치 임베딩 생성 실패:', error);
      throw error;
    }
  }

  getModel(): string {
    return this.model;
  }

  getDimension(): number {
    return this.dimensions;
  }

  isServiceReady(): boolean {
    return this.isInitialized && this.embeddings !== null;
  }
}
