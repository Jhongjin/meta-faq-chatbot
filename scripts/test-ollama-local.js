/**
 * 로컬 Ollama 서버 테스트 스크립트
 */

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

async function testOllamaConnection() {
  try {
    console.log('🧪 Ollama 서버 연결 테스트 시작...');
    console.log(`📍 서버 URL: ${OLLAMA_URL}`);

    // 1. 서버 상태 확인
    console.log('\n1️⃣ 서버 상태 확인...');
    const statusResponse = await fetch(`${OLLAMA_URL}/api/tags`);
    
    if (!statusResponse.ok) {
      throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();
    console.log(`✅ 서버 연결 성공`);
    console.log(`📊 설치된 모델 수: ${statusData.models?.length || 0}`);

    // 2. 모델 목록 확인
    if (statusData.models && statusData.models.length > 0) {
      console.log('\n2️⃣ 설치된 모델 목록:');
      statusData.models.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.name} (${model.size} bytes)`);
      });
    } else {
      console.log('\n⚠️ 설치된 모델이 없습니다.');
      console.log('다음 명령어로 모델을 설치하세요:');
      console.log('ollama pull qwen2.5:7b');
    }

    // 3. 간단한 생성 테스트
    console.log('\n3️⃣ 텍스트 생성 테스트...');
    const generateResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen2.5:1.5b',
        prompt: '안녕하세요. 간단한 테스트입니다.',
        stream: false
      })
    });

    if (!generateResponse.ok) {
      throw new Error(`생성 요청 실패: HTTP ${generateResponse.status}`);
    }

    const generateData = await generateResponse.json();
    console.log(`✅ 텍스트 생성 성공`);
    console.log(`📝 생성된 텍스트: ${generateData.response}`);

    console.log('\n🎉 모든 테스트 통과! Ollama 서버가 정상적으로 작동합니다.');

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.log('\n🔧 문제 해결 방법:');
    console.log('1. Ollama 서버가 실행 중인지 확인하세요: ollama serve');
    console.log('2. 모델이 설치되어 있는지 확인하세요: ollama list');
    console.log('3. 포트가 올바른지 확인하세요: 11434');
    process.exit(1);
  }
}

// 테스트 실행
testOllamaConnection();
