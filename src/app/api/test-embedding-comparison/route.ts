import { NextRequest, NextResponse } from 'next/server';
import { OpenAIEmbeddings } from '@langchain/openai';

interface EmbeddingTestResult {
  model: string;
  dimension: number;
  processingTime: number;
  accuracy: number;
  sample: number[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query, models } = await request.json();

    if (!query || !models || !Array.isArray(models)) {
      return NextResponse.json({
        success: false,
        error: '쿼리와 모델 목록이 필요합니다.'
      });
    }

    const results: EmbeddingTestResult[] = [];

    // 각 모델별로 테스트 실행
    for (const modelId of models) {
      try {
        const result = await testEmbeddingModel(modelId, query);
        results.push(result);
      } catch (error) {
        results.push({
          model: modelId,
          dimension: 0,
          processingTime: 0,
          accuracy: 0,
          sample: [],
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('임베딩 비교 테스트 오류:', error);
    return NextResponse.json({
      success: false,
      error: `임베딩 비교 테스트 중 오류: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

async function testEmbeddingModel(modelId: string, query: string): Promise<EmbeddingTestResult> {
  const startTime = Date.now();

  switch (modelId) {
    case 'openai-text-embedding-3-small':
      return await testOpenAIEmbedding('text-embedding-3-small', 1536, query, startTime);
    
    case 'openai-text-embedding-3-large':
      return await testOpenAIEmbedding('text-embedding-3-large', 3072, query, startTime);
    
    case 'ollama-nomic-embed-text':
      return await testOllamaEmbedding('nomic-embed-text', 768, query, startTime);
    
    case 'ollama-mxbai-embed-large':
      return await testOllamaEmbedding('mxbai-embed-large', 1024, query, startTime);
    
    default:
      throw new Error(`지원하지 않는 모델: ${modelId}`);
  }
}

async function testOpenAIEmbedding(
  modelName: string, 
  expectedDimension: number, 
  query: string, 
  startTime: number
): Promise<EmbeddingTestResult> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: openaiApiKey,
      modelName: modelName,
      dimensions: expectedDimension,
    });

    const embedding = await embeddings.embedQuery(query);
    const processingTime = Date.now() - startTime;

    // 간단한 정확도 계산 (벡터의 크기와 분산 기반)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const variance = embedding.reduce((sum, val) => sum + Math.pow(val - embedding.reduce((a, b) => a + b) / embedding.length, 2), 0) / embedding.length;
    const accuracy = Math.min(1, (magnitude / Math.sqrt(expectedDimension)) * (1 / (1 + variance)));

    return {
      model: `OpenAI ${modelName}`,
      dimension: embedding.length,
      processingTime,
      accuracy,
      sample: embedding.slice(0, 5)
    };

  } catch (error) {
    throw new Error(`OpenAI ${modelName} 테스트 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testOllamaEmbedding(
  modelName: string, 
  expectedDimension: number, 
  query: string, 
  startTime: number
): Promise<EmbeddingTestResult> {
  try {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    
    const response = await fetch(`${baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt: query,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Ollama에서 유효하지 않은 임베딩을 반환했습니다.');
    }

    // 간단한 정확도 계산
    const magnitude = Math.sqrt(data.embedding.reduce((sum: number, val: number) => sum + val * val, 0));
    const variance = data.embedding.reduce((sum: number, val: number) => sum + Math.pow(val - data.embedding.reduce((a: number, b: number) => a + b) / data.embedding.length, 2), 0) / data.embedding.length;
    const accuracy = Math.min(1, (magnitude / Math.sqrt(expectedDimension)) * (1 / (1 + variance)));

    return {
      model: `Ollama ${modelName}`,
      dimension: data.embedding.length,
      processingTime,
      accuracy,
      sample: data.embedding.slice(0, 5)
    };

  } catch (error) {
    throw new Error(`Ollama ${modelName} 테스트 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}
