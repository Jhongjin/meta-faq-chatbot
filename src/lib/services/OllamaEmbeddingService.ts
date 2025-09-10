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

export class OllamaEmbeddingService {
  private baseUrl: string;
  private model: string;
  private dimension: number;
  private isInitialized: boolean;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
    this.dimension = 768; // nomic-embed-text는 768차원 (테스트 결과 최적)
    this.isInitialized = false;
  }

  async initialize(model: string = 'nomic-embed-text'): Promise<void> {
    try {
      this.model = model;
      this.isInitialized = true;
      console.log('✅ Ollama 임베딩 서비스 초기화 완료');
    } catch (error) {
      console.error('❌ Ollama 임베딩 서비스 초기화 실패:', error);
      throw new Error(`Ollama 임베딩 서비스 초기화 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateEmbedding(text: string, options: EmbeddingOptions = {}): Promise<EmbeddingResult> {
    const startTime = Date.now();

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API 오류: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error('Ollama에서 유효하지 않은 임베딩을 반환했습니다.');
      }

      // 차원 수 검증
      if (data.embedding.length !== this.dimension) {
        console.warn(`⚠️ 임베딩 차원 수 불일치: ${data.embedding.length} (예상: ${this.dimension})`);
        this.dimension = data.embedding.length;
      }

      return {
        embedding: data.embedding,
        model: this.model,
        dimension: this.dimension,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Ollama 임베딩 생성 실패:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[], options: EmbeddingOptions = {}): Promise<EmbeddingResult[]> {
    const startTime = Date.now();
    const results: EmbeddingResult[] = [];

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Ollama는 배치 처리를 지원하지 않으므로 순차적으로 처리
      for (const text of texts) {
        try {
          const result = await this.generateEmbedding(text, options);
          results.push(result);
        } catch (error) {
          console.error(`배치 임베딩 실패 (${text.substring(0, 30)}...):`, error);
          // 실패한 경우 0으로 채워진 임베딩 생성
          results.push({
            embedding: new Array(this.dimension).fill(0),
            model: this.model,
            dimension: this.dimension,
            processingTime: 0
          });
        }
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
    return this.dimension;
  }

  isServiceReady(): boolean {
    return this.isInitialized;
  }
}
