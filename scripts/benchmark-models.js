/**
 * 모델 성능 벤치마크 스크립트
 * Render 무료 티어에서 사용 가능한 모델들의 성능을 비교합니다.
 */

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const testModels = [
  'qwen2.5:1.5b',
  'qwen2.5:3b',
  'llama3.2:1b',
  'gemma2:2b'
];

const testPrompts = [
  '메타 광고 정책에 대해 설명해주세요.',
  'Facebook 광고에서 금지된 콘텐츠는 무엇인가요?',
  'Instagram 광고 승인 과정을 단계별로 설명해주세요.',
  '광고 집행 시 주의해야 할 사항들을 정리해주세요.'
];

async function benchmarkModel(modelName) {
  console.log(`\n🧪 ${modelName} 모델 테스트 시작...`);
  
  const results = {
    model: modelName,
    tests: [],
    averageTime: 0,
    successRate: 0,
    memoryUsage: 0
  };

  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    const startTime = Date.now();
    
    try {
      console.log(`  📝 테스트 ${i + 1}/${testPrompts.length}: "${prompt.substring(0, 30)}..."`);
      
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            max_tokens: 500
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      results.tests.push({
        prompt: prompt,
        response: data.response,
        responseTime: responseTime,
        success: true,
        tokenCount: data.response.length
      });

      console.log(`    ✅ 성공 (${responseTime}ms, ${data.response.length}자)`);

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      results.tests.push({
        prompt: prompt,
        response: null,
        responseTime: responseTime,
        success: false,
        error: error.message
      });

      console.log(`    ❌ 실패 (${responseTime}ms): ${error.message}`);
    }

    // 모델 간 전환 시 대기
    if (i < testPrompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 결과 계산
  const successfulTests = results.tests.filter(test => test.success);
  results.successRate = (successfulTests.length / results.tests.length) * 100;
  results.averageTime = successfulTests.reduce((sum, test) => sum + test.responseTime, 0) / successfulTests.length;

  console.log(`\n📊 ${modelName} 결과:`);
  console.log(`  성공률: ${results.successRate.toFixed(1)}%`);
  console.log(`  평균 응답시간: ${results.averageTime.toFixed(0)}ms`);
  console.log(`  성공한 테스트: ${successfulTests.length}/${results.tests.length}`);

  return results;
}

async function runBenchmark() {
  console.log('🚀 모델 성능 벤치마크 시작...');
  console.log(`📍 Ollama 서버: ${OLLAMA_URL}`);
  console.log(`🧪 테스트 모델: ${testModels.join(', ')}`);
  console.log(`📝 테스트 프롬프트: ${testPrompts.length}개`);

  const allResults = [];

  for (const model of testModels) {
    try {
      const result = await benchmarkModel(model);
      allResults.push(result);
    } catch (error) {
      console.error(`❌ ${model} 모델 테스트 실패:`, error.message);
      allResults.push({
        model: model,
        tests: [],
        averageTime: 0,
        successRate: 0,
        error: error.message
      });
    }

    // 모델 간 전환 시 대기
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // 최종 결과 요약
  console.log('\n🏆 벤치마크 결과 요약:');
  console.log('='.repeat(80));
  
  allResults
    .filter(result => result.successRate > 0)
    .sort((a, b) => b.successRate - a.successRate)
    .forEach((result, index) => {
      console.log(`${index + 1}. ${result.model}`);
      console.log(`   성공률: ${result.successRate.toFixed(1)}%`);
      console.log(`   평균 응답시간: ${result.averageTime.toFixed(0)}ms`);
      console.log(`   Render 적합성: ${result.averageTime < 10000 ? '✅ 좋음' : '⚠️ 느림'}`);
      console.log('');
    });

  // 추천 모델
  const bestModel = allResults
    .filter(result => result.successRate > 0)
    .sort((a, b) => {
      // 성공률 우선, 그 다음 응답시간
      if (Math.abs(a.successRate - b.successRate) < 5) {
        return a.averageTime - b.averageTime;
      }
      return b.successRate - a.successRate;
    })[0];

  if (bestModel) {
    console.log('🎯 Render 무료 티어 최적 모델 추천:');
    console.log(`   모델: ${bestModel.model}`);
    console.log(`   성공률: ${bestModel.successRate.toFixed(1)}%`);
    console.log(`   평균 응답시간: ${bestModel.averageTime.toFixed(0)}ms`);
  }

  console.log('\n✅ 벤치마크 완료!');
}

// 벤치마크 실행
runBenchmark().catch(console.error);
