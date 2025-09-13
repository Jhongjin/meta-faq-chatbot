// Railway Ollama 볼륨 초기화 후 모델 설정 스크립트
const https = require('https');

// SSL 인증서 무시 (테스트용)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const RAILWAY_API = 'https://ad-mate-production.up.railway.app';

async function setupModelsAfterVolumeWipe() {
    console.log('🧹 볼륨 초기화 후 모델 설정 시작...\n');
    
    // 1. Ollama 서비스 상태 확인
    console.log('1️⃣ Ollama 서비스 연결 확인...');
    try {
        const debugResponse = await fetch(`${RAILWAY_API}/api/debug/ollama`);
        const debugData = await debugResponse.json();
        console.log('✅ Ollama 연결 상태:', debugData.connection_test?.text || 'Unknown');
        console.log('📋 현재 모델 목록:', debugData.tags_response?.data?.models || []);
    } catch (error) {
        console.log('❌ Ollama 연결 실패:', error.message);
        return;
    }
    
    // 2. 필수 모델 다운로드
    console.log('\n2️⃣ 필수 모델 다운로드 시작...');
    
    const modelsToInstall = [
        'llama3.2:1b',      // 작은 LLM 모델
        'nomic-embed-text'  // 임베딩 모델
    ];
    
    for (const model of modelsToInstall) {
        console.log(`📥 ${model} 다운로드 중...`);
        try {
            const response = await fetch(`${RAILWAY_API}/api/pull-model?model_name=${model}`, {
                method: 'POST'
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                console.log(`✅ ${model} 다운로드 완료`);
            } else {
                console.log(`❌ ${model} 다운로드 실패:`, result.message);
            }
        } catch (error) {
            console.log(`❌ ${model} 다운로드 오류:`, error.message);
        }
        
        // 모델 간 다운로드 간격
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // 3. 모델 설치 확인
    console.log('\n3️⃣ 모델 설치 확인...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
    
    try {
        const modelsResponse = await fetch(`${RAILWAY_API}/api/models`);
        const modelsData = await modelsResponse.json();
        console.log('📋 설치된 모델 목록:', modelsData.models);
        
        if (modelsData.models && modelsData.models.length > 0) {
            console.log('🎉 모델 설치 성공!');
            
            // 4. RAG API 테스트
            console.log('\n4️⃣ RAG API 테스트...');
            const testResponse = await fetch(`${RAILWAY_API}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: "안녕하세요, 테스트입니다."
                })
            });
            
            if (testResponse.ok) {
                const chatResult = await testResponse.json();
                console.log('✅ RAG API 테스트 성공!');
                console.log('💬 응답:', chatResult.answer?.substring(0, 100) + '...');
            } else {
                console.log('❌ RAG API 테스트 실패:', testResponse.status);
            }
        } else {
            console.log('❌ 모델이 여전히 설치되지 않음');
        }
    } catch (error) {
        console.log('❌ 모델 확인 오류:', error.message);
    }
    
    console.log('\n🎯 볼륨 초기화 후 설정 완료!');
}

// 실행
setupModelsAfterVolumeWipe().catch(console.error);
