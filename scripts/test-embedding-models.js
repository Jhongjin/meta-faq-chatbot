const { OpenAIEmbeddings } = require('@langchain/openai');

// OpenAI 임베딩 테스트
async function testOpenAIEmbedding() {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
      dimensions: 1536,
    });

    const startTime = Date.now();
    const result = await embeddings.embedQuery('메타 광고 정책에 대해 설명해주세요');
    const endTime = Date.now();

    console.log('🔵 OpenAI 임베딩 결과:');
    console.log(`- 차원: ${result.length}`);
    console.log(`- 처리 시간: ${endTime - startTime}ms`);
    console.log(`- 샘플: [${result.slice(0, 5).map(x => x.toFixed(4)).join(', ')}...]`);
    
    return {
      model: 'OpenAI text-embedding-3-small',
      dimension: result.length,
      processingTime: endTime - startTime,
      sample: result.slice(0, 5)
    };
  } catch (error) {
    console.error('❌ OpenAI 임베딩 실패:', error.message);
    return null;
  }
}

// Ollama 임베딩 테스트
async function testOllamaEmbedding() {
  try {
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: '메타 광고 정책에 대해 설명해주세요',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API 오류: ${response.status}`);
    }

    const startTime = Date.now();
    const data = await response.json();
    const endTime = Date.now();

    console.log('🟢 Ollama 임베딩 결과:');
    console.log(`- 차원: ${data.embedding.length}`);
    console.log(`- 처리 시간: ${endTime - startTime}ms`);
    console.log(`- 샘플: [${data.embedding.slice(0, 5).map(x => x.toFixed(4)).join(', ')}...]`);
    
    return {
      model: 'Ollama nomic-embed-text',
      dimension: data.embedding.length,
      processingTime: endTime - startTime,
      sample: data.embedding.slice(0, 5)
    };
  } catch (error) {
    console.error('❌ Ollama 임베딩 실패:', error.message);
    return null;
  }
}

// 메인 테스트 함수
async function main() {
  console.log('🚀 임베딩 모델 성능 테스트 시작...\n');

  const openaiResult = await testOpenAIEmbedding();
  console.log('');
  
  const ollamaResult = await testOllamaEmbedding();
  console.log('');

  // 결과 비교
  if (openaiResult && ollamaResult) {
    console.log('📊 성능 비교:');
    console.log('┌─────────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ 모델            │ 차원        │ 처리시간    │ 비용        │');
    console.log('├─────────────────┼─────────────┼─────────────┼─────────────┤');
    console.log(`│ OpenAI          │ ${openaiResult.dimension.toString().padEnd(11)} │ ${openaiResult.processingTime.toString().padEnd(11)}ms │ 유료         │`);
    console.log(`│ Ollama          │ ${ollamaResult.dimension.toString().padEnd(11)} │ ${ollamaResult.processingTime.toString().padEnd(11)}ms │ 무료         │`);
    console.log('└─────────────────┴─────────────┴─────────────┴─────────────┘');
    
    console.log('\n🎯 추천:');
    if (ollamaResult.processingTime < openaiResult.processingTime * 2) {
      console.log('✅ Ollama 추천 - 속도와 비용 면에서 우수');
    } else {
      console.log('✅ OpenAI 추천 - 정확도와 속도 면에서 우수');
    }
  }
}

main().catch(console.error);
